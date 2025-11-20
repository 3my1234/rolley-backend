import { PrismaService } from '../prisma/prisma.service';
import { TokensService } from '../tokens/tokens.service';
import { CreateStakeDto } from './dto/create-stake.dto';
import { ParticipateStakeDto } from './dto/participate-stake.dto';
export declare class StakesService {
    private prisma;
    private tokensService;
    constructor(prisma: PrismaService, tokensService: TokensService);
    create(userId: string, createStakeDto: CreateStakeDto): Promise<{
        stake: {
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
        };
        firstStakeBonus: any;
        milestoneCardPreview: {
            cardTier: string;
            cardEmoji: string;
            cardBonusUSD: number;
            message: string;
        };
        message: string;
    }>;
    findAll(userId: string): Promise<{
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
    }[]>;
    findActive(userId: string): Promise<({
        dailyParticipations: ({
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
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            stakeId: string;
            dailyEventId: string;
            participated: boolean;
            amountBefore: number;
            amountAfter: number | null;
        })[];
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
    })[]>;
    participate(userId: string, participateStakeDto: ParticipateStakeDto): Promise<{
        participation: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            stakeId: string;
            dailyEventId: string;
            participated: boolean;
            amountBefore: number;
            amountAfter: number | null;
        };
        stake: {
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
        };
        isCompleted: boolean;
        milestoneCard: any;
        message: any;
    }>;
}
