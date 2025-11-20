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
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let AdminService = class AdminService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getAllUsers() {
        return this.prisma.user.findMany({
            include: {
                stakes: true,
                transactions: true,
            },
        });
    }
    async getAllStakes() {
        return this.prisma.stake.findMany({
            include: {
                user: true,
            },
        });
    }
    async getAllDailyEvents() {
        return this.prisma.dailyEvent.findMany({
            orderBy: { createdAt: 'desc' },
        });
    }
    async getPendingDailyEvents() {
        return this.prisma.dailyEvent.findMany({
            where: {
                adminReviewed: false,
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async getPublishedDailyEvents(limit = 10) {
        return this.prisma.dailyEvent.findMany({
            where: {
                adminReviewed: true,
            },
            orderBy: { updatedAt: 'desc' },
            take: limit,
        });
    }
    async getReviewEventLists() {
        const [pending, published] = await Promise.all([
            this.getPendingDailyEvents(),
            this.getPublishedDailyEvents(10),
        ]);
        return {
            pending,
            published,
        };
    }
    async getDailyEventById(id) {
        const dailyEvent = await this.prisma.dailyEvent.findUnique({
            where: { id },
        });
        if (!dailyEvent) {
            throw new common_1.NotFoundException('Daily event not found');
        }
        return dailyEvent;
    }
    computeTotalOdds(predictions) {
        if (!Array.isArray(predictions) || !predictions.length) {
            return null;
        }
        const odds = predictions
            .map((match) => {
            if (typeof match?.odds === 'number') {
                return match.odds;
            }
            if (typeof match?.predictedOdds === 'number') {
                return match.predictedOdds;
            }
            return null;
        })
            .filter((value) => typeof value === 'number' && value > 0);
        if (!odds.length) {
            return null;
        }
        const product = odds.reduce((acc, value) => acc * value, 1);
        return Number(product.toFixed(4));
    }
    async reviewDailyEvent(payload) {
        const { eventId, adminPredictions, adminComments, approved } = payload;
        if (!eventId) {
            throw new common_1.BadRequestException('eventId is required');
        }
        const dailyEvent = await this.getDailyEventById(eventId);
        const hasAdminPredictions = Array.isArray(adminPredictions) && adminPredictions.length > 0;
        const updateData = {};
        if (adminComments !== undefined) {
            updateData.adminComments = adminComments;
        }
        const normalizedPredictions = Array.isArray(adminPredictions)
            ? adminPredictions.filter((match) => match && match.homeTeam && match.awayTeam)
            : [];
        updateData.adminPredictions = normalizedPredictions;
        const existingMatches = (dailyEvent.matches ?? []);
        updateData.totalOdds =
            (normalizedPredictions.length ? this.computeTotalOdds(normalizedPredictions) : null) ??
                this.computeTotalOdds(existingMatches) ??
                dailyEvent.totalOdds ??
                1;
        if (approved) {
            const predictionsForPublication = hasAdminPredictions
                ? adminPredictions
                : dailyEvent.adminPredictions;
            if (!Array.isArray(predictionsForPublication) || !predictionsForPublication.length) {
                throw new common_1.BadRequestException('Unable to publish event without predictions');
            }
            const totalOdds = this.computeTotalOdds(predictionsForPublication);
            updateData.matches = predictionsForPublication;
            updateData.adminReviewed = true;
            updateData.totalOdds =
                totalOdds ??
                    updateData.totalOdds ??
                    dailyEvent.totalOdds ??
                    1;
        }
        else {
            updateData.adminReviewed = false;
        }
        updateData.aiPredictions = normalizedPredictions;
        const updated = await this.prisma.dailyEvent.update({
            where: { id: eventId },
            data: updateData,
        });
        return updated;
    }
    async getTopStakers(limit = 10) {
        const groupedStakers = await this.prisma.stake.groupBy({
            by: ['userId'],
            _count: {
                id: true,
            },
            _sum: {
                initialAmount: true,
            },
            orderBy: [
                {
                    _count: {
                        id: 'desc',
                    },
                },
                {
                    _sum: {
                        initialAmount: 'desc',
                    },
                },
            ],
            take: limit,
        });
        if (groupedStakers.length === 0) {
            return [];
        }
        const users = await this.prisma.user.findMany({
            where: {
                id: {
                    in: groupedStakers.map((staker) => staker.userId),
                },
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                referralCode: true,
                totalReferrals: true,
                createdAt: true,
            },
        });
        const userMap = new Map(users.map((user) => [user.id, user]));
        return groupedStakers.map((staker, index) => ({
            rank: index + 1,
            user: userMap.get(staker.userId) || null,
            stakesCount: staker._count.id ?? 0,
            totalStakedRol: staker._sum.initialAmount
                ? Number(staker._sum.initialAmount)
                : 0,
        }));
    }
    async getDashboardStats() {
        const [totalUsers, activeStakes, depositAgg, withdrawalAgg, recentTransactions, recentStakes] = await Promise.all([
            this.prisma.user.count(),
            this.prisma.stake.count({
                where: { status: 'ACTIVE' },
            }),
            this.prisma.transaction.aggregate({
                _sum: { netAmount: true },
                where: {
                    type: 'DEPOSIT',
                    status: 'COMPLETED',
                },
            }),
            this.prisma.transaction.aggregate({
                _sum: { netAmount: true },
                where: {
                    type: 'WITHDRAWAL',
                    status: 'COMPLETED',
                },
            }),
            this.prisma.transaction.findMany({
                orderBy: { createdAt: 'desc' },
                take: 8,
                include: {
                    user: {
                        select: {
                            email: true,
                            firstName: true,
                        },
                    },
                },
            }),
            this.prisma.stake.findMany({
                orderBy: { createdAt: 'desc' },
                take: 8,
                include: {
                    user: {
                        select: {
                            email: true,
                            firstName: true,
                        },
                    },
                },
            }),
        ]);
        return {
            stats: {
                totalUsers,
                activeStakes,
                totalDeposits: depositAgg._sum.netAmount
                    ? Number(depositAgg._sum.netAmount)
                    : 0,
                totalWithdrawals: withdrawalAgg._sum.netAmount
                    ? Number(withdrawalAgg._sum.netAmount)
                    : 0,
            },
            recentTransactions,
            recentStakes,
        };
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminService);
//# sourceMappingURL=admin.service.js.map