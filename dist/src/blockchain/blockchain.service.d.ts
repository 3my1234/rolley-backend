export declare class BlockchainService {
    private provider;
    private signer;
    private contract;
    constructor();
    sendRolTokens(recipientAddress: string, rolAmount: number, reason: string): Promise<{
        success: boolean;
        txHash?: string;
        error?: string;
    }>;
    getTokenBalance(address: string): Promise<number>;
    mintRolTokens(recipientAddress: string, rolAmount: number, reason: string): Promise<{
        success: boolean;
        txHash?: string;
        error?: string;
    }>;
    authorizeMinter(minterAddress: string): Promise<{
        success: boolean;
        txHash?: string;
        error?: string;
    }>;
}
