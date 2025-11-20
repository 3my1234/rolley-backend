import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { Currency, StakeStatus, StakePeriod as PrismaStakePeriod } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TokensService } from '../tokens/tokens.service';
import { CreateStakeDto } from './dto/create-stake.dto';
import { ParticipateStakeDto } from './dto/participate-stake.dto';
import { calculateStakeEndDate, getDaysInPeriod } from '../utils/stake.utils';
import { calculateMilestoneCardBonus } from '../utils/rewards.utils';

@Injectable()
export class StakesService {
  constructor(
    private prisma: PrismaService,
    private tokensService: TokensService,
  ) {}

  async create(userId: string, createStakeDto: CreateStakeDto) {
    const { amount, currency, period } = createStakeDto;

    // Validate amount
    const validAmounts = [0.25, 10, 100, 1000, 10000];
    if (!validAmounts.includes(Number(amount))) {
      throw new BadRequestException(
        'Invalid amount. Must be one of: 0.25 (test), 10, 100, 1000, 10000'
      );
    }

    // Get user and check balance
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Only allow ROL staking now (no USD/USDT staking)
    if (currency !== 'ROL') {
      throw new BadRequestException(
        'Only ROL token staking is supported. Please use ROL tokens to create stakes.'
      );
    }

    const balance = user.rolBalance;
    if (balance < amount) {
      throw new BadRequestException(
        `Insufficient ROL balance. You have ${balance} ROL, but need ${amount} ROL to create this stake.`
      );
    }

    // Calculate stake details
    const totalDays = getDaysInPeriod(period);
    const startDate = new Date();
    const endDate = calculateStakeEndDate(startDate, totalDays);

    // Create stake (force ROL currency)
    const stakePeriod = period as PrismaStakePeriod;
    const stake = await this.prisma.stake.create({
      data: {
        userId,
        currency: Currency.ROL, // Only ROL staking supported
        initialAmount: amount,
        currentAmount: amount,
        period: stakePeriod,
        status: StakeStatus.ACTIVE,
        startDate,
        endDate,
        totalDays,
        daysCompleted: 0,
        daysParticipated: 0,
        daysSkipped: 0,
        totalProfit: 0,
        pendingRolReward: 0,
      },
    });

    // Deduct from user ROL balance
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        rolBalance: {
          decrement: amount,
        },
      },
    });

    // Create transaction record (ROL staking)
    await this.prisma.transaction.create({
      data: {
        userId,
        type: 'STAKE_PROFIT',
        currency: Currency.ROL, // Only ROL staking
        amount: amount,
        fee: 0,
        netAmount: amount,
        status: 'COMPLETED',
        description: `Started ${period.replace('_', ' ').toLowerCase()} ROL stake`,
        metadata: { stakeId: stake.id },
      },
    });

    // Check if this is first stake and award 50 ROL bonus
    const userStakes = await this.prisma.stake.count({
      where: { userId },
    });

    let firstStakeBonus = null;

    if (userStakes === 1 && !user.firstStakeClaimed) {
      // Award first stake bonus
      const bonusResult = await this.tokensService.awardSimpleRolReward(
        userId,
        'FIRST_STAKE',
        {
          stakeId: stake.id,
          stakeAmount: Number(amount),
          timestamp: new Date().toISOString(),
        }
      );

      if (bonusResult.success) {
        // Mark as claimed
        await this.prisma.user.update({
          where: { id: userId },
          data: { firstStakeClaimed: true },
        });

        firstStakeBonus = {
          rolAmount: bonusResult.rolAmount,
          message: `🎁 Welcome bonus: ${bonusResult.rolAmount} ROL credited to your wallet!`,
        };
      }

      // If user was referred, award referral bonus to referrer
      if (user.referredBy) {
        const referralBonus = await this.tokensService.awardSimpleRolReward(
          user.referredBy,
          'REFERRAL',
          {
            referredUserId: userId,
            referredUserStakeId: stake.id,
            stakeAmount: Number(amount),
            timestamp: new Date().toISOString(),
          }
        );

        if (referralBonus.success) {
          // Update referrer stats
          await this.prisma.user.update({
            where: { id: user.referredBy },
            data: {
              totalReferrals: { increment: 1 },
              totalReferralEarnings: { increment: referralBonus.rolAmount || 0 },
            },
          });
        }
      }
    }

    // Calculate milestone card preview (if 365 days)
    const milestoneCardPreview = calculateMilestoneCardBonus(
      Number(amount),
      period
    );

    return {
      stake,
      firstStakeBonus,
      milestoneCardPreview: milestoneCardPreview.eligible
        ? {
            cardTier: milestoneCardPreview.cardTier,
            cardEmoji: milestoneCardPreview.cardEmoji,
            cardBonusUSD: milestoneCardPreview.cardBonusUSD,
            message: `🎴 Complete this 365-day stake to earn a ${milestoneCardPreview.cardEmoji} ${milestoneCardPreview.cardTier} Card worth $${milestoneCardPreview.cardBonusUSD?.toLocaleString()}!`,
          }
        : null,
      message: 'Stake created successfully',
    };
  }

  async findAll(userId: string) {
    return this.prisma.stake.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findActive(userId: string) {
    return this.prisma.stake.findMany({
      where: {
        userId,
        status: 'ACTIVE',
      },
      include: {
        dailyParticipations: {
          include: {
            dailyEvent: true,
          },
        },
      },
    });
  }

  async participate(userId: string, participateStakeDto: ParticipateStakeDto) {
    const { stakeId, dailyEventId, participate } = participateStakeDto;

    // Verify stake belongs to user
    const stake = await this.prisma.stake.findFirst({
      where: {
        id: stakeId,
        userId,
        status: 'ACTIVE',
      },
    });

    if (!stake) {
      throw new NotFoundException('Stake not found or not active');
    }

    // Verify daily event exists
    const dailyEvent = await this.prisma.dailyEvent.findUnique({
      where: { id: dailyEventId },
    });

    if (!dailyEvent) {
      throw new NotFoundException('Daily event not found');
    }

    // Check if already participated
    const existingParticipation = await this.prisma.dailyParticipation.findUnique({
      where: {
        stakeId_dailyEventId: {
          stakeId,
          dailyEventId,
        },
      },
    });

    if (existingParticipation) {
      throw new BadRequestException('Already responded to this event');
    }

    const amountBefore = stake.currentAmount;
    let amountAfter = amountBefore;

    if (participate) {
      // Calculate new amount with rollover
      amountAfter = amountBefore * dailyEvent.totalOdds;
    }

    // Create participation record
    const participation = await this.prisma.dailyParticipation.create({
      data: {
        stakeId,
        dailyEventId,
        participated: participate,
        amountBefore,
        amountAfter,
      },
    });

    // Update stake
    const updatedStake = await this.prisma.stake.update({
      where: { id: stakeId },
      data: {
        currentAmount: amountAfter,
        daysCompleted: { increment: 1 },
        daysParticipated: participate ? { increment: 1 } : undefined,
        daysSkipped: !participate ? { increment: 1 } : undefined,
        totalProfit: amountAfter - stake.initialAmount,
      },
    });

    // Create transaction record for rollover
    if (participate) {
      await this.prisma.transaction.create({
        data: {
          userId,
          type: 'DAILY_ROLLOVER',
          currency: stake.currency,
          amount: amountAfter - amountBefore,
          fee: 0,
          netAmount: amountAfter - amountBefore,
          status: 'COMPLETED',
          description: `Daily rollover for stake ${stakeId}`,
          metadata: { stakeId, dailyEventId, participated: participate },
        },
      });
    }

    // Check if stake is completed
    const isCompleted = updatedStake.daysCompleted >= stake.totalDays;
    let milestoneCardResult = null;

    if (isCompleted && !stake.rolRewardClaimed) {
      // Mark stake as completed
      await this.prisma.stake.update({
        where: { id: stakeId },
        data: { status: 'COMPLETED' },
      });

      // Award Milestone Card Bonus
      const cardResult = await this.tokensService.awardMilestoneCardBonus(
        userId,
        stakeId,
        stake.initialAmount,
        stake.currency,
        stake.period,
        updatedStake.daysCompleted
      );

      if (cardResult.success) {
        milestoneCardResult = {
          cardTier: cardResult.cardTier,
          cardBonusUSD: cardResult.cardBonusUSD,
          message: `🎴 Congratulations! You've earned a ${cardResult.cardTier} Card worth $${cardResult.cardBonusUSD?.toLocaleString()}!`,
        };
      }

      // Return final amount to user's ROL balance (all stakes are now in ROL)
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          rolBalance: {
            increment: amountAfter,
          },
        },
      });
    }

    return {
      participation,
      stake: updatedStake,
      isCompleted,
      milestoneCard: milestoneCardResult,
      message: isCompleted
        ? milestoneCardResult
          ? milestoneCardResult.message
          : '🎉 Stake completed successfully! Funds have been credited to your account.'
        : participate
        ? 'Participated in daily event'
        : 'Skipped daily event',
    };
  }
}
