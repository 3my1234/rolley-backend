export declare class UsdtWebhookDto {
    txHash: string;
    toAddress: string;
    fromAddress: string;
    amount: number;
    network: string;
    confirmations?: number;
    metadata?: Record<string, any>;
}
