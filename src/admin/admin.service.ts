import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

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
        status: 'PENDING', // Only return active (pending) published events
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

  async getDailyEventById(id: string) {
    const dailyEvent = await this.prisma.dailyEvent.findUnique({
      where: { id },
    });

    if (!dailyEvent) {
      throw new NotFoundException('Daily event not found');
    }

    return dailyEvent;
  }

  private computeTotalOdds(predictions: any[] | null | undefined): number | null {
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
      .filter((value) => typeof value === 'number' && value > 0) as number[];

    if (!odds.length) {
      return null;
    }

    const product = odds.reduce((acc, value) => acc * value, 1);
    return Number(product.toFixed(4));
  }

  async reviewDailyEvent(payload: {
    eventId: string;
    adminPredictions?: any[];
    adminComments?: string;
    approved?: boolean;
  }) {
    const { eventId, adminPredictions, adminComments, approved } = payload;

    if (!eventId) {
      throw new BadRequestException('eventId is required');
    }

    const dailyEvent = await this.getDailyEventById(eventId);

    const hasAdminPredictions = Array.isArray(adminPredictions) && adminPredictions.length > 0;

    const updateData: any = {};

    if (adminComments !== undefined) {
      updateData.adminComments = adminComments;
    }

    const normalizedPredictions = Array.isArray(adminPredictions)
      ? adminPredictions.filter((match) => match && match.homeTeam && match.awayTeam)
      : [];

    updateData.adminPredictions = normalizedPredictions;
    const existingMatches = (dailyEvent.matches ?? []) as any[];

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
        throw new BadRequestException('Unable to publish event without predictions');
      }

      const totalOdds = this.computeTotalOdds(predictionsForPublication);

      updateData.matches = predictionsForPublication;
      updateData.adminReviewed = true;
      updateData.totalOdds =
        totalOdds ??
        updateData.totalOdds ??
        dailyEvent.totalOdds ??
        1;
    } else {
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
    const [totalUsers, activeStakes, depositAgg, withdrawalAgg, recentTransactions, recentStakes] =
      await Promise.all([
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

  async updateEventResult(eventId: string, status: string, result?: string) {
    const validStatuses = ['WON', 'LOST', 'VOID', 'PENDING'];
    
    if (!validStatuses.includes(status)) {
      throw new BadRequestException(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    const event = await this.getDailyEventById(eventId);

    const updateData: any = {
      status: status as any,
    };

    if (result !== undefined) {
      updateData.result = result;
    }

    const updated = await this.prisma.dailyEvent.update({
      where: { id: eventId },
      data: updateData,
    });

    return updated;
  }

  async getEventHistory(limit = 50) {
    return this.prisma.dailyEvent.findMany({
      where: {
        status: {
          in: ['WON', 'LOST', 'VOID'],
        },
      },
      orderBy: { date: 'desc' },
      take: limit,
    });
  }
}
