import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsdtDepositJob } from './usdt-watcher.types';
import { WalletService } from '../../wallet/wallet.service';
export declare class UsdtDepositQueueService implements OnModuleInit, OnModuleDestroy {
    private readonly configService;
    private readonly walletService;
    private readonly logger;
    private connection;
    private queue;
    private worker;
    private provider;
    private cachedBlockNumber;
    private cachedBlockFetchedAt;
    private readonly blockNumberCacheMs;
    constructor(configService: ConfigService, walletService: WalletService);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    enqueueDeposit(payload: UsdtDepositJob): Promise<void>;
    private processJob;
    private getCurrentBlockNumber;
    private shouldDropJob;
}
