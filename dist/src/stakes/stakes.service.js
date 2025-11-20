"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StakesService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const tokens_service_1 = require("../tokens/tokens.service");
const stake_utils_1 = require("../utils/stake.utils");
const rewards_utils_1 = require("../utils/rewards.utils");
let StakesService = class StakesService {
    constructor(prisma, tokensService) {
        this.prisma = prisma;
        this.tokensService = tokensService;
    }
    async create(userId, createStakeDto) {
        const { amount, currency, period } = createStakeDto;
        const validAmounts = [0.25, 10, 100, 1000, 10000];
        if (!validAmounts.includes(Number(amount))) {
            throw new common_1.BadRequestException('Invalid amount. Must be one of: 0.25 (test), 10, 100, 1000, 10000');
        }
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        if (currency !== 'ROL') {
            throw new common_1.BadRequestException('Only ROL token staking is supported. Please use ROL tokens to create stakes.');
        }
        const balance = user.rolBalance;
        if (balance < amount) {
            throw new common_1.BadRequestException(`Insufficient ROL balance. You have ${balance} ROL, but need ${amount} ROL to create this stake.`);
        }
        const totalDays = (0, stake_utils_1.getDaysInPeriod)(period);
        const startDate = new Date();
        const endDate = (0, stake_utils_1.calculateStakeEndDate)(startDate, totalDays);
        const stakePeriod = period;
        const stake = await this.prisma.stake.create({
            data: {
                userId,
                currency: client_1.Currency.ROL,
                initialAmount: amount,
                currentAmount: amount,
                period: stakePeriod,
                status: client_1.StakeStatus.ACTIVE,
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
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                rolBalance: {
                    decrement: amount,
                },
            },
        });
        await this.prisma.transaction.create({
            data: {
                userId,
                type: 'STAKE_PROFIT',
                currency: client_1.Currency.ROL,
                amount: amount,
                fee: 0,
                netAmount: amount,
                status: 'COMPLETED',
                description: `Started ${period.replace('_', ' ').toLowerCase()} ROL stake`,
                metadata: { stakeId: stake.id },
            },
        });
        const userStakes = await this.prisma.stake.count({
            where: { userId },
        });
        let firstStakeBonus = null;
        if (userStakes === 1 && !user.firstStakeClaimed) {
            const bonusResult = await this.tokensService.awardSimpleRolReward(userId, 'FIRST_STAKE', {
                stakeId: stake.id,
                stakeAmount: Number(amount),
                timestamp: new Date().toISOString(),
            });
            if (bonusResult.success) {
                await this.prisma.user.update({
                    where: { id: userId },
                    data: { firstStakeClaimed: true },
                });
                firstStakeBonus = {
                    rolAmount: bonusResult.rolAmount,
                    message: `🎁 Welcome bonus: ${bonusResult.rolAmount} ROL credited to your wallet!`,
                };
            }
            if (user.referredBy) {
                const referralBonus = await this.tokensService.awardSimpleRolReward(user.referredBy, 'REFERRAL', {
                    referredUserId: userId,
                    referredUserStakeId: stake.id,
                    stakeAmount: Number(amount),
                    timestamp: new Date().toISOString(),
                });
                if (referralBonus.success) {
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
        const milestoneCardPreview = (0, rewards_utils_1.calculateMilestoneCardBonus)(Number(amount), period);
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
    async findAll(userId) {
        return this.prisma.stake.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findActive(userId) {
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
    async participate(userId, participateStakeDto) {
        const { stakeId, dailyEventId, participate } = participateStakeDto;
        const stake = await this.prisma.stake.findFirst({
            where: {
                id: stakeId,
                userId,
                status: 'ACTIVE',
            },
        });
        if (!stake) {
            throw new common_1.NotFoundException('Stake not found or not active');
        }
        const dailyEvent = await this.prisma.dailyEvent.findUnique({
            where: { id: dailyEventId },
        });
        if (!dailyEvent) {
            throw new common_1.NotFoundException('Daily event not found');
        }
        const existingParticipation = await this.prisma.dailyParticipation.findUnique({
            where: {
                stakeId_dailyEventId: {
                    stakeId,
                    dailyEventId,
                },
            },
        });
        if (existingParticipation) {
            throw new common_1.BadRequestException('Already responded to this event');
        }
        const amountBefore = stake.currentAmount;
        let amountAfter = amountBefore;
        if (participate) {
            amountAfter = amountBefore * dailyEvent.totalOdds;
        }
        const participation = await this.prisma.dailyParticipation.create({
            data: {
                stakeId,
                dailyEventId,
                participated: participate,
                amountBefore,
                amountAfter,
            },
        });
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
        const isCompleted = updatedStake.daysCompleted >= stake.totalDays;
        let milestoneCardResult = null;
        if (isCompleted && !stake.rolRewardClaimed) {
            await this.prisma.stake.update({
                where: { id: stakeId },
                data: { status: 'COMPLETED' },
            });
            const cardResult = await this.tokensService.awardMilestoneCardBonus(userId, stakeId, stake.initialAmount, stake.currency, stake.period, updatedStake.daysCompleted);
            if (cardResult.success) {
                milestoneCardResult = {
                    cardTier: cardResult.cardTier,
                    cardBonusUSD: cardResult.cardBonusUSD,
                    message: `🎴 Congratulations! You've earned a ${cardResult.cardTier} Card worth $${cardResult.cardBonusUSD?.toLocaleString()}!`,
                };
            }
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
};
exports.StakesService = StakesService;
exports.StakesService = StakesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        tokens_service_1.TokensService])
], StakesService);
//# sourceMappingURL=stakes.service.js.map