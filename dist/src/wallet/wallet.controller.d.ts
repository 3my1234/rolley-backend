import { WalletService } from './wallet.service';
import { UsdtWebhookDto } from './dto/usdt-webhook.dto';
export declare class WalletController {
    private walletService;
    constructor(walletService: WalletService);
    depositFunds(req: any, depositData: any): Promise<{
        depositAddress: string;
        transactionId: string;
        amount: number;
        currency: string;
        message: string;
        instructions: string[];
    }>;
    withdrawFunds(req: any, withdrawData: any): Promise<{
        transactionId: string;
        message: string;
    }>;
    verifyCryptoDeposit(req: any, verifyData: any): Promise<{
        message: string;
        newBalance: number;
    }>;
    handleUsdtWebhook(secret: string, payload: UsdtWebhookDto): Promise<{
        status: string;
    }>;
}
