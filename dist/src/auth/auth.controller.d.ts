import { AuthService } from './auth.service';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    syncUser(req: any, body: {
        referralCode?: string;
    }): Promise<{
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
        synced: boolean;
    }>;
    getCurrentUser(req: any): Promise<{
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
    }>;
}
