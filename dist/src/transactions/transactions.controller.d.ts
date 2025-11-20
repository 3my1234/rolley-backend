import { TransactionsService } from './transactions.service';
import { UsersService } from '../users/users.service';
export declare class TransactionsController {
    private transactionsService;
    private usersService;
    constructor(transactionsService: TransactionsService, usersService: UsersService);
    getUserTransactions(req: any): Promise<{
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
    }>;
}
