import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Currency, TransactionType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { ConvertTokenDto } from './dto/convert-token.dto';
import { TradeRolDto } from './dto/trade-rol.dto';
import { ROL_USD_VALUE, ROL_SELL_VALUE } from '../utils/rewards.utils';

@Injectable()
export class TokensService {
  constructor(
    private prisma: PrismaService,
    private blockchainService: BlockchainService,
  ) {}

  private resolveCurrency(value: string): Currency {
    if (value === 'USD') {
      return Currency.USD;
    }
    if (value === 'USDT') {
      return Currency.USDT;
    }
    if (value === 'ROL') {
      return Currency.ROL;
    }
    throw new BadRequestException('Invalid currency');
  }

  async getTokenBalance(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        rolBalance: true,
        totalRolEarned: true,
        totalRolSpent: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Calculate pending rewards from active stakes
    const activeStakes = await this.prisma.stake.findMany({
      where: {
        userId,
        status: 'ACTIVE',
      },
      select: {
        pendingRolReward: true,
      },
    });

    const pendingRewards = activeStakes.reduce(
      (sum, stake) => sum + stake.pendingRolReward,
      0
    );

    return {
      rolBalance: user.rolBalance,
      pendingRewards,
      totalRolEarned: user.totalRolEarned,
      totalRolSpent: user.totalRolSpent,
      valueUsd: user.rolBalance * ROL_USD_VALUE,
    };
  }

  async getTokenHistory(userId: string, type?: string) {
    const where: any = { userId };

    if (type && type !== 'all') {
      where.type = type;
    }

    const transactions = await this.prisma.transaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const airdrops = await this.prisma.airdrop.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const tokenRewards = await this.prisma.tokenReward.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return {
      transactions,
      airdrops,
      tokenRewards,
    };
  }

  async convertRolToUsdt(userId: string, convertTokenDto: ConvertTokenDto) {
    const { rolAmount } = convertTokenDto;

    // Get user
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user has enough ROL
    if (user.rolBalance < rolAmount) {
      throw new BadRequestException('Insufficient ROL balance');
    }

    // Calculate USDT amount
    const usdtAmount = rolAmount * ROL_USD_VALUE;

    // Update user balances
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        rolBalance: { decrement: rolAmount },
        totalRolSpent: { increment: rolAmount },
        usdtBalance: { increment: usdtAmount },
      },
    });

    // Record conversion
    await this.prisma.tokenConversion.create({
      data: {
        userId,
        rolAmount,
        usdtAmount,
        conversionRate: ROL_USD_VALUE,
        status: 'completed',
      },
    });

    return {
      success: true,
      rolAmount,
      usdtAmount,
      conversionRate: ROL_USD_VALUE,
    };
  }

  async awardSimpleRolReward(
    userId: string,
    action: 'FIRST_STAKE' | 'REFERRAL',
    metadata?: Record<string, unknown>
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.walletAddress) {
      return { success: false, error: 'User not found or no wallet address' };
    }

    // Calculate ROL amount
    const rolAmount = action === 'FIRST_STAKE' ? 50 : 100;
    const usdValue = rolAmount * ROL_USD_VALUE;

    // Send tokens via blockchain
    const result = await this.blockchainService.sendRolTokens(
      user.walletAddress,
      rolAmount,
      `${action} bonus`
    );

    if (!result.success) {
      return { success: false, error: result.error };
    }

    // Record in database
    await this.prisma.airdrop.create({
      data: {
        userId,
        amount: rolAmount,
        valueUsd: usdValue,
        reason: action,
        metadata: (metadata || {}) as any,
        txHash: result.txHash,
        status: 'completed',
      },
    });

    // Update user balance
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        rolBalance: { increment: rolAmount },
        totalRolEarned: { increment: rolAmount },
      },
    });

    return {
      success: true,
      rolAmount,
      txHash: result.txHash,
    };
  }

  async awardMilestoneCardBonus(
    userId: string,
    stakeId: string,
    stakeAmount: number,
    stakeCurrency: Currency,
    period: string,
    daysCompleted: number
  ) {
    // This would implement the milestone card bonus logic
    // For now, return a placeholder
    return {
      success: true,
      cardTier: 'Test',
      cardBonusUSD: 0.02,
    };
  }

  /**
   * Buy ROL tokens with USD or USDT
   * Rate: $100 USD = 1 ROL
   */
  async buyRol(userId: string, tradeDto: TradeRolDto) {
    const { currency, amount } = tradeDto;

    // Get user
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Calculate ROL amount: $100 USD = 1 ROL
    const rolAmount = amount / ROL_USD_VALUE;

    // Check user has enough balance
    if (currency === 'USD') {
      if (user.usdBalance < amount) {
        throw new BadRequestException(
          `Insufficient USD balance. You have $${user.usdBalance}, but need $${amount}`
        );
      }
    } else if (currency === 'USDT') {
      if (user.usdtBalance < amount) {
        throw new BadRequestException(
          `Insufficient USDT balance. You have ${user.usdtBalance} USDT, but need ${amount} USDT`
        );
      }
    }

    // Deduct payment currency
    const updateData: any = {
      rolBalance: { increment: rolAmount },
      totalRolEarned: { increment: rolAmount },
    };

    if (currency === 'USD') {
      updateData.usdBalance = { decrement: amount };
    } else {
      updateData.usdtBalance = { decrement: amount };
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    // Mint ROL tokens on-chain if user has wallet address
    let mintTxHash: string | undefined;
    if (user.walletAddress) {
      try {
        const mintResult = await this.blockchainService.mintRolTokens(
          user.walletAddress,
          rolAmount,
          `Buy ROL: ${amount} ${currency}`
        );
        
        if (mintResult.success) {
          mintTxHash = mintResult.txHash;
        }
      } catch (error) {
        console.error('Error minting tokens on-chain:', error);
        // Continue with database-only mode
      }
    }

    // Record transaction
    await this.prisma.transaction.create({
      data: {
        userId,
        type: TransactionType.ROL_PURCHASE,
        amount: amount,
        currency: this.resolveCurrency(currency),
        netAmount: amount,
        status: 'COMPLETED',
        metadata: {
          rolAmount,
          buyRate: ROL_USD_VALUE,
          mintTxHash,
        } as any,
      },
    });

    return {
      success: true,
      message: `Successfully bought ${rolAmount.toFixed(4)} ROL for ${amount} ${currency}`,
      rolAmount,
      paidAmount: amount,
      currency,
      buyRate: ROL_USD_VALUE,
      mintTxHash,
    };
  }

  /**
   * Sell ROL tokens for USD or USDT
   * Rate: 1 ROL = $95 USD (5% discount)
   */
  async sellRol(userId: string, tradeDto: TradeRolDto) {
    const { currency, amount } = tradeDto;

    // Get user
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // amount is ROL amount to sell
    const rolAmount = amount;

    // Check user has enough ROL
    if (user.rolBalance < rolAmount) {
      throw new BadRequestException(
        `Insufficient ROL balance. You have ${user.rolBalance} ROL, but need ${rolAmount} ROL`
      );
    }

    // Calculate payment amount: 1 ROL = $95 USD (sell rate)
    const paymentAmount = rolAmount * ROL_SELL_VALUE;

    // Update balances
    const updateData: any = {
      rolBalance: { decrement: rolAmount },
      totalRolSpent: { increment: rolAmount },
    };

    if (currency === 'USD') {
      updateData.usdBalance = { increment: paymentAmount };
    } else {
      updateData.usdtBalance = { increment: paymentAmount };
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    // Record transaction
    await this.prisma.transaction.create({
      data: {
        userId,
        type: TransactionType.ROL_SALE,
        amount: paymentAmount,
        currency: this.resolveCurrency(currency),
        netAmount: paymentAmount,
        status: 'COMPLETED',
        metadata: {
          rolAmount,
          sellRate: ROL_SELL_VALUE,
        } as any,
      },
    });

    return {
      success: true,
      message: `Successfully sold ${rolAmount.toFixed(4)} ROL for ${paymentAmount.toFixed(2)} ${currency}`,
      rolAmount,
      receivedAmount: paymentAmount,
      currency,
      sellRate: ROL_SELL_VALUE,
    };
  }

  /**
   * Trade ROL (buy or sell)
   */
  async tradeRol(userId: string, tradeDto: TradeRolDto) {
    if (tradeDto.type === 'BUY') {
      return this.buyRol(userId, tradeDto);
    } else if (tradeDto.type === 'SELL') {
      return this.sellRol(userId, tradeDto);
    } else {
      throw new BadRequestException('Invalid trade type. Must be BUY or SELL');
    }
  }
}
