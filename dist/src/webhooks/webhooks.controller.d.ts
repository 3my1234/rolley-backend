import { WebhooksService } from './webhooks.service';
export declare class WebhooksController {
    private webhooksService;
    constructor(webhooksService: WebhooksService);
    handleN8nWebhook(body: any, authHeader: string): Promise<{
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
    handleFlutterwaveWebhook(body: any): Promise<{
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
