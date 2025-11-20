import { DailyEventsService } from './daily-events.service';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
export declare class DailyEventsController {
    private dailyEventsService;
    private prisma;
    private usersService;
    constructor(dailyEventsService: DailyEventsService, prisma: PrismaService, usersService: UsersService);
    getCurrentEvent(req: any): Promise<{
        dailyEvent: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            result: string | null;
            status: import(".prisma/client").$Enums.DailyEventStatus;
            date: Date;
            sport: string;
            matches: import("@prisma/client/runtime/library").JsonValue;
            totalOdds: number;
            aiPredictions: import("@prisma/client/runtime/library").JsonValue | null;
            adminPredictions: import("@prisma/client/runtime/library").JsonValue | null;
            adminComments: string | null;
            adminReviewed: boolean;
        };
        activeStakes: ({
            dailyParticipations: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                stakeId: string;
                dailyEventId: string;
                participated: boolean;
                amountBefore: number;
                amountAfter: number | null;
            }[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            currency: import(".prisma/client").$Enums.Currency;
            status: import(".prisma/client").$Enums.StakeStatus;
            initialAmount: number;
            currentAmount: number;
            period: import(".prisma/client").$Enums.StakePeriod;
            startDate: Date;
            endDate: Date;
            daysCompleted: number;
            totalDays: number;
            daysParticipated: number;
            daysSkipped: number;
            totalProfit: number;
            pendingRolReward: number;
            rolRewardClaimed: boolean;
            rolRewardAmount: number | null;
        })[];
    }>;
}
