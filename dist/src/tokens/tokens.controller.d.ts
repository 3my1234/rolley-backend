import { TokensService } from './tokens.service';
import { ConvertTokenDto } from './dto/convert-token.dto';
import { PrismaService } from '../prisma/prisma.service';
export declare const Public: () => import("@nestjs/common").CustomDecorator<string>;
export declare class TokensController {
    private tokensService;
    private prisma;
    constructor(tokensService: TokensService, prisma: PrismaService);
    private getUserIdFromRequest;
    getTokenBalance(req: any): Promise<{
        rolBalance: number;
        pendingRewards: number;
        totalRolEarned: number;
        totalRolSpent: number;
        valueUsd: number;
    }>;
    getTokenHistory(req: any, type?: string): Promise<{
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
        airdrops: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            txHash: string | null;
            amount: number;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            status: string;
            valueUsd: number;
            reason: string;
        }[];
        tokenRewards: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            txHash: string | null;
            amount: number;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            status: string;
            valueUsd: number;
            reason: string;
            stakeId: string | null;
        }[];
    }>;
    convertRolToUsdt(req: any, convertTokenDto: ConvertTokenDto): Promise<{
        success: boolean;
        rolAmount: number;
        usdtAmount: number;
        conversionRate: number;
    }>;
    tradeRol(req: any, tradeDto: any): Promise<{
        success: boolean;
        message: string;
        rolAmount: number;
        paidAmount: number;
        currency: string;
        buyRate: number;
        mintTxHash: string;
    } | {
        success: boolean;
        message: string;
        rolAmount: number;
        receivedAmount: number;
        currency: string;
        sellRate: number;
    }>;
    getRates(): Promise<{
        buyRate: number;
        sellRate: number;
        buyRateDescription: string;
        sellRateDescription: string;
    }>;
}
