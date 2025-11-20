import { PrismaService } from '../prisma/prisma.service';
export declare class TransactionsService {
    private prisma;
    constructor(prisma: PrismaService);
    getUserTransactions(userId: string): Promise<{
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
    }[]>;
}
