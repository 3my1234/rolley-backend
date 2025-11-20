import { PrismaService } from '../prisma/prisma.service';
import { TokensService } from '../tokens/tokens.service';
import { BlockchainService } from '../blockchain/blockchain.service';
export declare class WebhooksService {
    private prisma;
    private tokensService;
    private blockchainService;
    constructor(prisma: PrismaService, tokensService: TokensService, blockchainService: BlockchainService);
    private readonly logger;
    handleN8nWebhook(webhookData: any): Promise<{
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
    }>;
    private normalizeN8nPayload;
    handleFlutterwaveWebhook(webhookData: any): Promise<{
        status: string;
    }>;
    verifyFlutterwavePayment(transactionId: string, txRef: string, status: string): Promise<{
        success: boolean;
        message: string;
        transactionId: string;
        amount: number;
        rolAmount: number;
        mintTxHash: string;
        status?: undefined;
    } | {
        success: boolean;
        message: string;
        transactionId: string;
        status: any;
        amount?: undefined;
        rolAmount?: undefined;
        mintTxHash?: undefined;
    }>;
}
