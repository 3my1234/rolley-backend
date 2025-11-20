import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { verifyPayment } from '../lib/payments/flutterwave';
import { TokensService } from '../tokens/tokens.service';
import { BlockchainService } from '../blockchain/blockchain.service';

@Injectable()
export class WebhooksService {
  constructor(
    private prisma: PrismaService,
    private tokensService: TokensService,
    private blockchainService: BlockchainService,
  ) {}
  private readonly logger = new Logger(WebhooksService.name);

  async handleN8nWebhook(webhookData: any) {
    const normalized = this.normalizeN8nPayload(webhookData);

    if (!normalized.matches?.length) {
      throw new BadRequestException('No matches provided');
    }

    const matches = normalized.matches.map((match: any) => ({
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      tournament: match.tournament ?? match.league ?? null,
      prediction: match.prediction ?? null,
      predictionMarket: match.predictionMarket ?? null,
      odds:
        typeof match.odds === 'number'
          ? Number(match.odds)
          : match.predictedOdds
            ? Number(match.predictedOdds)
            : null,
      predictedOdds:
        typeof match.predictedOdds === 'number'
          ? Number(match.predictedOdds)
          : typeof match.odds === 'number'
            ? Number(match.odds)
            : null,
      reasoning: match.reasoning ?? null,
      confidence: match.confidence ? Number(match.confidence) : null,
      homeForm: match.homeForm ?? null,
      awayForm: match.awayForm ?? null,
      injuries: match.injuries ?? null,
      h2h: match.h2h ?? null,
      modelWarnings: match.modelWarnings ?? [],
      dataQuality: match.dataQuality ?? null,
      autoSelected: Boolean(match.autoSelected),
      metadata: match.metadata ?? null,
    }));

    const aiPredictions = (normalized.aiPredictions ?? normalized.matches ?? []).map(
      (match: any) => ({
        homeTeam: match.homeTeam,
        awayTeam: match.awayTeam,
        tournament: match.tournament ?? match.league ?? null,
        prediction: match.prediction ?? null,
        predictionMarket: match.predictionMarket ?? null,
        odds:
          typeof match.odds === 'number'
            ? Number(match.odds)
            : match.predictedOdds
              ? Number(match.predictedOdds)
              : null,
        predictedOdds:
          typeof match.predictedOdds === 'number'
            ? Number(match.predictedOdds)
            : typeof match.odds === 'number'
              ? Number(match.odds)
              : null,
        reasoning: match.reasoning ?? null,
        confidence: match.confidence ? Number(match.confidence) : null,
        homeForm: match.homeForm ?? null,
        awayForm: match.awayForm ?? null,
        injuries: match.injuries ?? null,
        h2h: match.h2h ?? null,
        modelWarnings: match.modelWarnings ?? [],
        dataQuality: match.dataQuality ?? null,
        autoSelected: Boolean(match.autoSelected),
        metadata: match.metadata ?? null,
      }),
    );

    const computeAutoTotalOdds = () => {
      const autoMatches = matches.filter(
        (match) => match.autoSelected && typeof match.predictedOdds === 'number',
      );
      if (!autoMatches.length) {
        return null;
      }
      const product = autoMatches.reduce(
        (acc, match) => acc * Number(match.predictedOdds || 1),
        1,
      );
      return Number(product.toFixed(4));
    };

    const totalOdds =
      typeof normalized.totalOdds === 'number'
        ? Number(normalized.totalOdds)
        : computeAutoTotalOdds() ?? 1.05;

    try {
      const dailyEvent = await this.prisma.dailyEvent.create({
        data: {
          date: normalized.date ? new Date(normalized.date) : new Date(),
          sport: normalized.sport ?? 'FOOTBALL',
          matches,
          totalOdds,
          status: 'PENDING',
          aiPredictions: aiPredictions.length ? aiPredictions : matches,
          adminReviewed: false,
          adminPredictions: null,
          adminComments: null,
        },
      });

      return dailyEvent;
    } catch (error) {
      this.logger.error('Failed to create daily event from n8n payload', error);
      throw new BadRequestException('Failed to save daily event');
    }
  }

  private normalizeN8nPayload(payload: any) {
    if (!payload) {
      throw new BadRequestException('Empty webhook payload');
    }

    let data = payload;

    if (typeof payload === 'string') {
      try {
        data = JSON.parse(payload);
      } catch (error) {
        throw new BadRequestException('Invalid JSON payload');
      }
    }

    if (data.body && typeof data.body === 'string') {
      try {
        data = JSON.parse(data.body);
      } catch (error) {
        throw new BadRequestException('Invalid JSON body');
      }
    }

    if (data.data && typeof data.data === 'string') {
      try {
        data.data = JSON.parse(data.data);
      } catch (error) {
        throw new BadRequestException('Invalid nested data payload');
      }
    }

    if (data.data && typeof data.data === 'object') {
      return {
        ...data.data,
        action: data.action,
      };
    }

    return data;
  }

  async handleFlutterwaveWebhook(webhookData: any) {
    console.log('Flutterwave webhook received:', webhookData);
    
    const { event, data } = webhookData;
    
    if (event === 'charge.completed' && data.status === 'successful') {
      // Find the transaction by external ID (tx_ref)
      const transaction = await this.prisma.transaction.findFirst({
        where: {
          externalId: data.tx_ref,
          status: 'PENDING',
        },
        include: {
          user: true,
        },
      });

      if (transaction) {
        // Update transaction status
        await this.prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            status: 'COMPLETED',
            externalId: data.flw_ref, // Update with Flutterwave reference
          },
        });

        // Calculate ROL tokens: $100 USD = 1 ROL
        const rolAmount = transaction.amount / 100;
        
        // Update database balance first
        await this.prisma.user.update({
          where: { id: transaction.userId },
          data: {
            rolBalance: {
              increment: rolAmount,
            },
          },
        });

        // Mint ROL tokens on-chain if user has a wallet address
        if (transaction.user.walletAddress) {
          try {
            const mintResult = await this.blockchainService.mintRolTokens(
              transaction.user.walletAddress,
              rolAmount,
              `Flutterwave payment: $${transaction.amount} USD`
            );
            
            if (mintResult.success) {
              console.log(`✅ Minted ${rolAmount} ROL on-chain to ${transaction.user.walletAddress}. Tx: ${mintResult.txHash}`);
            } else {
              console.warn(`⚠️  On-chain mint failed (using database only): ${mintResult.error}`);
            }
          } catch (error) {
            console.error('Error minting tokens on-chain:', error);
            // Continue with database-only mode if blockchain fails
          }
        } else {
          console.log(`ℹ️  User ${transaction.userId} has no wallet address - tokens credited to database only`);
        }

        console.log(`✅ Payment completed: ${transaction.amount} USD → ${rolAmount} ROL tokens for user ${transaction.userId}`);
      }
    }

    return { status: 'success' };
  }

  async verifyFlutterwavePayment(transactionId: string, txRef: string, status: string) {
    console.log('Verifying Flutterwave payment:', { transactionId, txRef, status });

    if (!transactionId || !txRef) {
      throw new BadRequestException('Missing required parameters');
    }

    try {
      // Verify payment with Flutterwave
      const verification = await verifyPayment(transactionId);
      
      // Find the transaction
      const transaction = await this.prisma.transaction.findFirst({
        where: {
          externalId: txRef,
          status: 'PENDING',
        },
        include: {
          user: true,
        },
      });

      if (!transaction) {
        throw new NotFoundException('Transaction not found');
      }

      if (verification.data.status === 'successful') {
        // Update transaction status
        await this.prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            status: 'COMPLETED',
            externalId: transactionId, // Update with Flutterwave transaction ID
          },
        });

        // Calculate ROL tokens: $100 USD = 1 ROL
        const rolAmount = transaction.amount / 100;
        
        // Update database balance first
        await this.prisma.user.update({
          where: { id: transaction.userId },
          data: {
            rolBalance: {
              increment: rolAmount,
            },
          },
        });

        // Mint ROL tokens on-chain if user has a wallet address
        let mintTxHash: string | undefined;
        if (transaction.user.walletAddress) {
          try {
            const mintResult = await this.blockchainService.mintRolTokens(
              transaction.user.walletAddress,
              rolAmount,
              `Flutterwave payment: $${transaction.amount} USD`
            );
            
            if (mintResult.success) {
              mintTxHash = mintResult.txHash;
              console.log(`✅ Minted ${rolAmount} ROL on-chain to ${transaction.user.walletAddress}. Tx: ${mintTxHash}`);
            } else {
              console.warn(`⚠️  On-chain mint failed (using database only): ${mintResult.error}`);
            }
          } catch (error) {
            console.error('Error minting tokens on-chain:', error);
            // Continue with database-only mode if blockchain fails
          }
        } else {
          console.log(`ℹ️  User ${transaction.userId} has no wallet address - tokens credited to database only`);
        }

        return {
          success: true,
          message: `Payment verified! You received ${rolAmount} ROL tokens`,
          transactionId,
          amount: transaction.amount,
          rolAmount: rolAmount,
          mintTxHash,
        };
      } else {
        // Payment failed or was cancelled
        await this.prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            status: 'FAILED',
          },
        });

        return {
          success: false,
          message: 'Payment was not successful',
          transactionId,
          status: verification.data.status,
        };
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      throw new BadRequestException('Failed to verify payment');
    }
  }
}
