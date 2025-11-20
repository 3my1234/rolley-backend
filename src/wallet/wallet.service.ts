import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { Currency, TransactionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { initializePayment } from '../lib/payments/flutterwave';
import { ethers } from 'ethers';
import { UsdtWebhookDto } from './dto/usdt-webhook.dto';

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);

  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
  ) {}

  async depositFunds(privyId: string, data: any) {
    const { amount, currency, paymentMethod } = data;
    const numAmount = Number(amount);

    console.log('🔍 WalletService: Deposit request received - Amount:', numAmount, 'Currency:', currency);

    // Validate amount (0.15 for testing, then standard amounts)
    const validAmounts = [0.15, 1, 10, 100, 1000, 10000];
    const isValidAmount = validAmounts.some(validAmount => Math.abs(numAmount - validAmount) < 0.001);
    
    if (!isValidAmount) {
      console.log('❌ Amount validation failed:', numAmount);
      console.log('❌ Valid amounts:', validAmounts);
      throw new BadRequestException('Invalid amount. Must be one of: 0.15 (test), 1, 10, 100, 1000, 10000');
    }

    // Validate currency
    if (!['USD', 'USDT'].includes(currency)) {
      throw new BadRequestException('Invalid currency');
    }

    const user = await this.usersService.findByPrivyId(privyId);

    if (paymentMethod === 'flutterwave' && currency === 'USD') {
      // USD deposits via Flutterwave are temporarily unavailable
      throw new BadRequestException(
        'USD deposits via Flutterwave are temporarily unavailable. ' +
        'Please use USDT deposits on Polygon to fund your account. ' +
        'USDT deposits are processed automatically and are the only payment method currently available.'
      );
    } else if (paymentMethod === 'privy' && currency === 'USDT') {
      // For USDT deposits, users send to their own Privy embedded wallet
      if (!user.walletAddress) {
        throw new BadRequestException('Wallet not connected. Please connect your wallet first.');
      }

      // Create pending transaction
      const transaction = await this.prisma.transaction.create({
        data: {
          userId: user.id,
          type: 'DEPOSIT',
          currency: Currency.USDT,
          amount: numAmount,
          fee: 0,
          netAmount: numAmount,
          status: 'PENDING',
          paymentMethod: 'privy',
          description: 'USDT deposit via crypto wallet',
          metadata: {
            walletAddress: user.walletAddress,
            expectedAmount: numAmount,
          currency: Currency.USDT,
            network: 'POLYGON',
          },
        },
      });

      return {
        depositAddress: user.walletAddress,
        transactionId: transaction.id,
        amount: numAmount,
        currency: 'USDT',
        message: 'Send USDT (Polygon) to your wallet address. Balance will update automatically when detected on-chain.',
        instructions: [
          `Send exactly ${numAmount} USDT (Polygon) to the address above`,
          'Use the Polygon PoS network (do not use Ethereum / Tron / BSC)',
          'Keep at least 0.05 MATIC in the sending wallet to cover Polygon gas fees',
          'Your balance will update automatically within 1-2 minutes after 3 block confirmations',
          'No manual verification needed - our system monitors the Polygon blockchain',
          'Contact support if your deposit isn\'t detected after 10 minutes'
        ],
      };
    }

    throw new BadRequestException('Invalid payment method');
  }

  async withdrawFunds(privyId: string, data: any) {
    const { amount, currency, withdrawalDetails } = data;
    const numAmount = Number(amount);

    if (!['USD', 'USDT'].includes(currency)) {
      throw new BadRequestException('Invalid currency');
    }

    const user = await this.usersService.findByPrivyId(privyId);

    // Check if user has sufficient balance
    const balanceField = currency === 'USD' ? 'usdBalance' : 'usdtBalance';
    if (user[balanceField] < numAmount) {
      throw new BadRequestException(`Insufficient ${currency} balance`);
    }

    // Create withdrawal transaction
    const transaction = await this.prisma.transaction.create({
      data: {
        userId: user.id,
        type: 'WITHDRAWAL',
        currency: currency === 'USD' ? Currency.USD : Currency.USDT,
        amount: numAmount,
        fee: 0,
        netAmount: numAmount,
        status: 'PENDING',
        paymentMethod: withdrawalDetails.method,
        description: `${currency} withdrawal request`,
        metadata: withdrawalDetails,
      },
    });

    return {
      transactionId: transaction.id,
      message: 'Withdrawal request submitted successfully',
    };
  }

  async verifyCryptoDeposit(privyId: string, data: any) {
    const { transactionHash, amount, network } = data;

    const user = await this.usersService.findByPrivyId(privyId);

    // Update user balance
    await this.usersService.updateBalance(user.id, 'USDT', Number(amount));

    // Update transaction status
    await this.prisma.transaction.updateMany({
      where: {
        userId: user.id,
        type: 'DEPOSIT',
        currency: Currency.USDT,
        status: 'PENDING',
        amount: Number(amount),
      },
      data: {
        status: 'COMPLETED',
        externalId: transactionHash,
      },
    });

    const updatedUser = await this.usersService.findById(user.id);

    return {
      message: 'Deposit verified successfully',
      newBalance: updatedUser.usdtBalance,
    };
  }

  async handleUsdtWebhook(secret: string | undefined, payload: UsdtWebhookDto) {
    const configuredSecret = process.env.USDT_WEBHOOK_SECRET;
    if (!configuredSecret) {
      this.logger.warn(
        'USDT webhook secret is not configured. Rejecting webhook for safety.',
      );
      throw new BadRequestException('Webhook not enabled');
    }

    if (!secret || secret !== configuredSecret) {
      throw new BadRequestException('Invalid webhook credentials');
    }

    if (!payload.toAddress) {
      throw new BadRequestException('Missing recipient address');
    }

    if ((payload.network || '').toUpperCase() !== 'POLYGON') {
      throw new BadRequestException('Unsupported network');
    }

    await this.confirmUsdtDeposit({
      walletAddress: payload.toAddress,
      amount: payload.amount,
      txHash: payload.txHash,
      source: 'webhook',
      metadata: {
        confirmations: payload.confirmations,
        fromAddress: payload.fromAddress,
        raw: payload.metadata,
      },
    });
  }

  async confirmUsdtDeposit(params: {
    walletAddress: string;
    amount: number;
    txHash: string;
    source: 'webhook' | 'listener' | 'watcher';
    metadata?: Record<string, any>;
  }) {
    const { walletAddress, amount, txHash, source, metadata } = params;
    const normalizedAddress = this.normalizeAddress(walletAddress);

    const user = await this.prisma.user.findFirst({
      where: {
        walletAddress: {
          equals: normalizedAddress,
          mode: 'insensitive',
        },
      },
    });

    if (!user) {
      throw new BadRequestException(
        'No user is associated with the provided wallet address',
      );
    }

    if (!txHash) {
      throw new BadRequestException('Transaction hash is required');
    }

    const existingTx = await this.prisma.transaction.findUnique({
      where: { externalId: txHash },
    });

    if (existingTx) {
      if (existingTx.status !== TransactionStatus.COMPLETED) {
        await this.prisma.transaction.update({
          where: { id: existingTx.id },
          data: { status: TransactionStatus.COMPLETED },
        });
        await this.usersService.updateBalance(user.id, 'USDT', amount);
      }
      return existingTx;
    }

    const tolerance =
      Number(process.env.USDT_AMOUNT_TOLERANCE ?? '0.5') || 0.5;

    const pendingTransaction = await this.prisma.transaction.findFirst({
      where: {
        userId: user.id,
        type: 'DEPOSIT',
        currency: Currency.USDT,
        status: TransactionStatus.PENDING,
        paymentMethod: 'privy',
        amount: {
          gte: amount - tolerance,
          lte: amount + tolerance,
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    if (pendingTransaction) {
      await this.prisma.transaction.update({
        where: { id: pendingTransaction.id },
        data: {
          status: TransactionStatus.COMPLETED,
          externalId: txHash,
          metadata: {
            ...(pendingTransaction.metadata as Record<string, any>),
            source,
            depositHash: txHash,
            webhookMetadata: metadata,
          },
        },
      });
    } else {
      await this.prisma.transaction.create({
        data: {
          userId: user.id,
          type: 'DEPOSIT',
          currency: Currency.USDT,
          amount,
          fee: 0,
          netAmount: amount,
          status: TransactionStatus.COMPLETED,
          paymentMethod: 'privy',
          description: 'USDT deposit detected automatically',
          externalId: txHash,
          metadata: {
            source,
            detectedAt: new Date().toISOString(),
            webhookMetadata: metadata,
            walletAddress: normalizedAddress,
          },
        },
      });
    }

    await this.usersService.updateBalance(user.id, 'USDT', amount);
    this.logger.log(
      `USDT deposit confirmed for user ${user.id} via ${source} (${amount} USDT)`,
    );
  }

  private normalizeAddress(address: string) {
    try {
      return ethers.getAddress(address);
    } catch (error) {
      throw new BadRequestException('Invalid wallet address received');
    }
  }
}