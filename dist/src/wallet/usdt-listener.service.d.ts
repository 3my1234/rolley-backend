import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from './wallet.service';
export declare class UsdtListenerService {
    private prisma;
    private walletService;
    private readonly logger;
    private provider;
    private usdtContract;
    private isRunning;
    private lastCheckedBlock;
    private readonly MAX_BLOCK_BATCH;
    private readonly INITIAL_LOOKBACK;
    constructor(prisma: PrismaService, walletService: WalletService);
    startListening(): Promise<void>;
    private checkPendingDeposits;
    private checkWalletDeposits;
    private fetchTransferEvents;
}
