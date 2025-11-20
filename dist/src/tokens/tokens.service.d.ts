import { Currency } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { ConvertTokenDto } from './dto/convert-token.dto';
import { TradeRolDto } from './dto/trade-rol.dto';
export declare class TokensService {
    private prisma;
    private blockchainService;
    constructor(prisma: PrismaService, blockchainService: BlockchainService);
    private resolveCurrency;
    getTokenBalance(userId: string): Promise<{
        rolBalance: number;
        pendingRewards: number;
        totalRolEarned: number;
        totalRolSpent: number;
        valueUsd: number;
    }>;
    getTokenHistory(userId: string, type?: string): Promise<{
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
    convertRolToUsdt(userId: string, convertTokenDto: ConvertTokenDto): Promise<{
        success: boolean;
        rolAmount: number;
        usdtAmount: number;
        conversionRate: number;
    }>;
    awardSimpleRolReward(userId: string, action: 'FIRST_STAKE' | 'REFERRAL', metadata?: Record<string, unknown>): Promise<{
        success: boolean;
        error: string;
        rolAmount?: undefined;
        txHash?: undefined;
    } | {
        success: boolean;
        rolAmount: number;
        txHash: string;
        error?: undefined;
    }>;
    awardMilestoneCardBonus(userId: string, stakeId: string, stakeAmount: number, stakeCurrency: Currency, period: string, daysCompleted: number): Promise<{
        success: boolean;
        cardTier: string;
        cardBonusUSD: number;
    }>;
    buyRol(userId: string, tradeDto: TradeRolDto): Promise<{
        success: boolean;
        message: string;
        rolAmount: number;
        paidAmount: number;
        currency: string;
        buyRate: number;
        mintTxHash: string;
    }>;
    sellRol(userId: string, tradeDto: TradeRolDto): Promise<{
        success: boolean;
        message: string;
        rolAmount: number;
        receivedAmount: number;
        currency: string;
        sellRate: number;
    }>;
    tradeRol(userId: string, tradeDto: TradeRolDto): Promise<{
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
}
