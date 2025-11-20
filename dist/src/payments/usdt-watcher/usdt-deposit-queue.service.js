"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var UsdtDepositQueueService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsdtDepositQueueService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const bullmq_1 = require("bullmq");
const ioredis_1 = require("ioredis");
const ethers_1 = require("ethers");
const usdt_watcher_constants_1 = require("./usdt-watcher.constants");
const wallet_service_1 = require("../../wallet/wallet.service");
const QUEUE_NAME = 'usdt-deposit-confirmations';
let UsdtDepositQueueService = UsdtDepositQueueService_1 = class UsdtDepositQueueService {
    constructor(configService, walletService) {
        this.configService = configService;
        this.walletService = walletService;
        this.logger = new common_1.Logger(UsdtDepositQueueService_1.name);
        this.connection = null;
        this.queue = null;
        this.worker = null;
        this.cachedBlockNumber = null;
        this.cachedBlockFetchedAt = 0;
        const rpc = process.env.POLYGON_RPC_URL || 'https://polygon.llamarpc.com';
        this.provider = new ethers_1.ethers.JsonRpcProvider(rpc);
        this.blockNumberCacheMs = Math.max(1000, Number(this.configService.get('USDT_QUEUE_BLOCK_CACHE_MS') ?? 5000));
    }
    async onModuleInit() {
        const redisUrl = this.configService.get('REDIS_URL') ?? usdt_watcher_constants_1.DEFAULT_REDIS_URL;
        this.connection = new ioredis_1.default(redisUrl, {
            maxRetriesPerRequest: null,
        });
        this.queue = new bullmq_1.Queue(QUEUE_NAME, {
            connection: this.connection,
        });
        this.worker = new bullmq_1.Worker(QUEUE_NAME, async (job) => this.processJob(job.data), {
            connection: this.connection,
            concurrency: Number(this.configService.get('USDT_QUEUE_CONCURRENCY') ?? 5),
        });
        this.worker.on('completed', (job) => {
            this.logger.debug(`USDT deposit job ${job.id} completed`);
        });
        this.worker.on('failed', (job, err) => {
            this.logger.error(`USDT deposit job ${job?.id ?? 'unknown'} failed: ${err?.message}`, err?.stack);
        });
        this.logger.log('USDT deposit queue initialized');
    }
    async onModuleDestroy() {
        await Promise.all([
            this.worker?.close(),
            this.queue?.close(),
            this.connection?.quit(),
        ]);
    }
    async enqueueDeposit(payload) {
        if (!this.queue) {
            throw new Error('USDT queue not initialized');
        }
        const jobId = `${payload.txHash}-${payload.logIndex}`;
        const options = {
            jobId,
            attempts: Number(this.configService.get('USDT_QUEUE_MAX_ATTEMPTS') ?? 10),
            backoff: {
                type: 'exponential',
                delay: Number(this.configService.get('USDT_QUEUE_RETRY_DELAY_MS') ?? 15000),
            },
            removeOnComplete: 1000,
            removeOnFail: 5000,
        };
        await this.queue.add('confirm-usdt', payload, options);
    }
    async processJob(payload) {
        const confirmationsNeeded = usdt_watcher_constants_1.DEFAULT_CONFIRMATIONS;
        const currentBlock = await this.getCurrentBlockNumber();
        const confirmations = currentBlock - payload.blockNumber;
        if (confirmations < confirmationsNeeded) {
            throw new Error(`Not enough confirmations (${confirmations}/${confirmationsNeeded})`);
        }
        try {
            await this.walletService.confirmUsdtDeposit({
                walletAddress: payload.toAddress,
                amount: payload.amount,
                txHash: payload.txHash,
                source: 'watcher',
                metadata: {
                    fromAddress: payload.fromAddress,
                    blockNumber: payload.blockNumber,
                    logIndex: payload.logIndex,
                    network: payload.network,
                },
            });
        }
        catch (error) {
            if (this.shouldDropJob(error)) {
                this.logger.warn(`Dropping USDT job ${payload.txHash}-${payload.logIndex}: ${error.message}`);
                return;
            }
            throw error;
        }
    }
    async getCurrentBlockNumber() {
        const now = Date.now();
        if (this.cachedBlockNumber !== null &&
            now - this.cachedBlockFetchedAt < this.blockNumberCacheMs) {
            return this.cachedBlockNumber;
        }
        const blockNumber = await this.provider.getBlockNumber();
        this.cachedBlockNumber = blockNumber;
        this.cachedBlockFetchedAt = now;
        return blockNumber;
    }
    shouldDropJob(error) {
        if (!error || typeof error !== 'object') {
            return false;
        }
        if (error instanceof common_1.BadRequestException) {
            const message = (error.message ?? '').toLowerCase();
            return (message.includes('no user is associated') ||
                message.includes('invalid wallet address'));
        }
        const message = error.message ?? '';
        return message
            .toLowerCase()
            .includes('no user is associated with the provided wallet address');
    }
};
exports.UsdtDepositQueueService = UsdtDepositQueueService;
exports.UsdtDepositQueueService = UsdtDepositQueueService = UsdtDepositQueueService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        wallet_service_1.WalletService])
], UsdtDepositQueueService);
//# sourceMappingURL=usdt-deposit-queue.service.js.map