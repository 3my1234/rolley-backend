import { AdminService } from './admin.service';
export declare class AdminController {
    private adminService;
    constructor(adminService: AdminService);
    getAllUsers(req: any): Promise<{
        users: ({
            stakes: {
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
            }[];
            transactions: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                type: import(".prisma/client").$Enums.TransactionType;
                description: string | null;
                userId: string;
                amount: number;
                metadata: import("@prisma/client/runtime/library").JsonValue | null;
                currency: import(".prisma/client").$Enums.Currency;
                paymentMethod: string | null;
                fee: number;
                netAmount: number;
                status: import(".prisma/client").$Enums.TransactionStatus;
                externalId: string | null;
            }[];
        } & {
            id: string;
            email: string | null;
            privyId: string | null;
            walletAddress: string | null;
            referralCode: string | null;
            password: string | null;
            role: import(".prisma/client").$Enums.UserRole;
            firstName: string | null;
            lastName: string | null;
            phoneNumber: string | null;
            usdBalance: number;
            usdtBalance: number;
            rolBalance: number;
            totalRolEarned: number;
            totalRolSpent: number;
            signupAirdropClaimed: boolean;
            firstDepositAirdropClaimed: boolean;
            firstStakeClaimed: boolean;
            referredBy: string | null;
            totalReferrals: number;
            totalReferralEarnings: number;
            withdrawalMethod: string | null;
            withdrawalDetails: import("@prisma/client/runtime/library").JsonValue | null;
            createdAt: Date;
            updatedAt: Date;
        })[];
    }>;
    getAllStakes(req: any): Promise<{
        stakes: ({
            user: {
                id: string;
                email: string | null;
                privyId: string | null;
                walletAddress: string | null;
                referralCode: string | null;
                password: string | null;
                role: import(".prisma/client").$Enums.UserRole;
                firstName: string | null;
                lastName: string | null;
                phoneNumber: string | null;
                usdBalance: number;
                usdtBalance: number;
                rolBalance: number;
                totalRolEarned: number;
                totalRolSpent: number;
                signupAirdropClaimed: boolean;
                firstDepositAirdropClaimed: boolean;
                firstStakeClaimed: boolean;
                referredBy: string | null;
                totalReferrals: number;
                totalReferralEarnings: number;
                withdrawalMethod: string | null;
                withdrawalDetails: import("@prisma/client/runtime/library").JsonValue | null;
                createdAt: Date;
                updatedAt: Date;
            };
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
    getAllDailyEvents(req: any): Promise<{
        dailyEvents: {
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
        }[];
    }>;
    getPendingReviewEvents(req: any): Promise<{
        pending: {
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
        }[];
        published: {
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
        }[];
    }>;
    reviewDailyEvent(req: any, body: any): Promise<{
        event: {
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
    }>;
    getTopStakers(req: any, limit?: string): Promise<{
        topStakers: {
            rank: number;
            user: {
                id: string;
                email: string;
                referralCode: string;
                role: import(".prisma/client").$Enums.UserRole;
                firstName: string;
                lastName: string;
                totalReferrals: number;
                createdAt: Date;
            };
            stakesCount: number;
            totalStakedRol: number;
        }[];
    }>;
    getDashboardStats(req: any): Promise<{
        stats: {
            totalUsers: number;
            activeStakes: number;
            totalDeposits: number;
            totalWithdrawals: number;
        };
        recentTransactions: ({
            user: {
                email: string;
                firstName: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            type: import(".prisma/client").$Enums.TransactionType;
            description: string | null;
            userId: string;
            amount: number;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            currency: import(".prisma/client").$Enums.Currency;
            paymentMethod: string | null;
            fee: number;
            netAmount: number;
            status: import(".prisma/client").$Enums.TransactionStatus;
            externalId: string | null;
        })[];
        recentStakes: ({
            user: {
                email: string;
                firstName: string;
            };
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
