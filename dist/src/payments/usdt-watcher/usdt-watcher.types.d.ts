export interface UsdtDepositJob {
    txHash: string;
    fromAddress: string;
    toAddress: string;
    amount: number;
    blockNumber: number;
    logIndex: number;
    network: 'POLYGON';
}
export interface UsdtWatcherEventPayload {
    txHash: string;
    fromAddress: string;
    toAddress: string;
    amount: number;
    blockNumber: number;
    logIndex: number;
}
