import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { UsdtWebhookDto } from './dto/usdt-webhook.dto';
export declare class WalletService {
    private prisma;
    private usersService;
    private readonly logger;
    constructor(prisma: PrismaService, usersService: UsersService);
    depositFunds(privyId: string, data: any): Promise<{
        depositAddress: string;
        transactionId: string;
        amount: number;
        currency: string;
        message: string;
        instructions: string[];
    }>;
    withdrawFunds(privyId: string, data: any): Promise<{
        transactionId: string;
        message: string;
    }>;
    verifyCryptoDeposit(privyId: string, data: any): Promise<{
        message: string;
        newBalance: number;
    }>;
    handleUsdtWebhook(secret: string | undefined, payload: UsdtWebhookDto): Promise<void>;
    confirmUsdtDeposit(params: {
        walletAddress: string;
        amount: number;
        txHash: string;
        source: 'webhook' | 'listener' | 'watcher';
        metadata?: Record<string, any>;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.TransactionType;
        currency: import(".prisma/client").$Enums.Currency;
        amount: number;
        fee: number;
        netAmount: number;
        status: import(".prisma/client").$Enums.TransactionStatus;
        externalId: string | null;
        paymentMethod: string | null;
        description: string | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        userId: string;
    }>;
    private normalizeAddress;
}
