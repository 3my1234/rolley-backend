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
var UsdtWatcherService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsdtWatcherService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const ethers_1 = require("ethers");
const usdt_watcher_constants_1 = require("./usdt-watcher.constants");
const usdt_address_registry_service_1 = require("./usdt-address-registry.service");
const usdt_deposit_queue_service_1 = require("./usdt-deposit-queue.service");
const usdt_watcher_state_service_1 = require("./usdt-watcher-state.service");
let UsdtWatcherService = UsdtWatcherService_1 = class UsdtWatcherService {
    constructor(configService, registry, queue, stateService) {
        this.configService = configService;
        this.registry = registry;
        this.queue = queue;
        this.stateService = stateService;
        this.logger = new common_1.Logger(UsdtWatcherService_1.name);
        this.websocketProvider = null;
        this.usdtInterface = new ethers_1.ethers.Interface(usdt_watcher_constants_1.USDT_TRANSFER_ABI);
        this.pollTimer = null;
        this.reconnectTimer = null;
        const rpcUrl = process.env.POLYGON_RPC_URL || 'https://polygon.llamarpc.com';
        this.httpProvider = new ethers_1.ethers.JsonRpcProvider(rpcUrl);
        this.maxRequestSpan = Math.max(1, Number(this.configService.get('USDT_WATCHER_MAX_REQUEST_SPAN') ?? 64));
        this.pollBatchSize = Number(this.configService.get('USDT_WATCHER_BATCH_SIZE') ??
            this.configService.get('USDT_WATCHER_MAX_BLOCK_SPAN') ??
            this.maxRequestSpan);
        this.maxCatchUpBlocks = Math.max(this.pollBatchSize, Number(this.configService.get('USDT_WATCHER_MAX_CATCHUP_BLOCKS') ?? 512));
    }
    async onModuleInit() {
        await this.registry.refreshAddresses();
        await this.startPollingLoop();
        await this.startWebsocketListener();
    }
    async onModuleDestroy() {
        if (this.pollTimer) {
            clearInterval(this.pollTimer);
        }
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
        }
        if (this.websocketProvider) {
            await this.websocketProvider.destroy();
        }
    }
    async startPollingLoop() {
        const interval = usdt_watcher_constants_1.DEFAULT_POLL_INTERVAL;
        await this.pollOnce();
        this.pollTimer = setInterval(() => {
            this.pollOnce().catch((err) => this.logger.error('USDT watcher poll failed', err));
        }, interval);
    }
    async pollOnce() {
        const currentBlock = await this.httpProvider.getBlockNumber();
        const lastProcessed = (await this.stateService.getLastProcessedBlock()) ??
            currentBlock - usdt_watcher_constants_1.DEFAULT_CONFIRMATIONS;
        const fromBlock = Math.max(lastProcessed + 1, currentBlock - this.maxCatchUpBlocks);
        const toBlock = currentBlock - 1;
        if (toBlock < fromBlock) {
            return;
        }
        const batchSize = this.pollBatchSize;
        let start = fromBlock;
        while (start <= toBlock) {
            let end = Math.min(start + batchSize - 1, toBlock);
            try {
                await this.processBlockRange(start, end);
                await this.stateService.setLastProcessedBlock(end);
                start = end + 1;
            }
            catch (error) {
                if (this.isTimeoutError(error) || this.isBlockRangeError(error)) {
                    this.logger.warn(`USDT watcher throttling range ${start}-${end}: ${error.message}`);
                    const reducedSpan = Math.max(1, Math.floor((end - start + 1) / 2));
                    if (reducedSpan === end - start + 1) {
                        await this.stateService.setLastProcessedBlock(start);
                        start += 1;
                    }
                    else {
                        end = start + reducedSpan - 1;
                    }
                    continue;
                }
                throw error;
            }
        }
    }
    async processBlockRange(fromBlock, toBlock) {
        let start = fromBlock;
        while (start <= toBlock) {
            const end = Math.min(start + this.maxRequestSpan - 1, toBlock);
            await this.fetchAndHandleLogs(start, end);
            start = end + 1;
        }
    }
    async fetchAndHandleLogs(fromBlock, toBlock) {
        const transferTopic = ethers_1.ethers.id('Transfer(address,address,uint256)');
        let start = fromBlock;
        let end = toBlock;
        while (start <= end) {
            try {
                const logs = await this.httpProvider.getLogs({
                    address: usdt_watcher_constants_1.USDT_POLYGON_CONTRACT,
                    fromBlock: start,
                    toBlock: end,
                    topics: [transferTopic],
                });
                for (const log of logs) {
                    await this.handleLog(log);
                }
                return;
            }
            catch (error) {
                if (start < end &&
                    (this.isBlockRangeError(error) || this.isTimeoutError(error))) {
                    const span = end - start + 1;
                    const reducedSpan = Math.max(1, Math.floor(span / 2));
                    end = start + reducedSpan - 1;
                    this.logger.warn(`Polygon RPC issue (${this.describeError(error)}) for span ${span}. Retrying with ${reducedSpan} blocks.`);
                    continue;
                }
                throw error;
            }
        }
    }
    isBlockRangeError(error) {
        if (!error || typeof error !== 'object') {
            return false;
        }
        const rpcError = error;
        const code = rpcError.code ?? rpcError.error?.code ?? rpcError.error?.code;
        return code === -32005 || code === -32062;
    }
    isTimeoutError(error) {
        if (!error || typeof error !== 'object') {
            return false;
        }
        const message = error.message ?? '';
        const code = error.code ??
            error?.error?.code ??
            '';
        return ((typeof code === 'string' && code.toUpperCase().includes('TIMEOUT')) ||
            (typeof message === 'string' &&
                message.toLowerCase().includes('timeout')));
    }
    describeError(error) {
        if (!error || typeof error !== 'object') {
            return String(error);
        }
        const code = error.code ??
            error?.error?.code ??
            '';
        const message = error.message ?? '';
        return `${code || 'ERR'}: ${message || 'unknown error'}`;
    }
    async startWebsocketListener() {
        const wssUrl = this.configService.get('POLYGON_WSS_URL');
        if (!wssUrl) {
            this.logger.warn('POLYGON_WSS_URL not configured. USDT watcher will rely on polling only.');
            return;
        }
        try {
            this.websocketProvider = new ethers_1.ethers.WebSocketProvider(wssUrl);
            const filter = {
                address: usdt_watcher_constants_1.USDT_POLYGON_CONTRACT,
                topics: [ethers_1.ethers.id('Transfer(address,address,uint256)')],
            };
            this.websocketProvider.on(filter, async (log) => {
                await this.handleLog(log);
                await this.stateService.setLastProcessedBlock(log.blockNumber);
            });
            this.websocketProvider.on('error', (error) => {
                this.logger.error('Polygon websocket error', error);
                this.scheduleReconnect();
            });
            this.websocketProvider.on('close', () => {
                this.logger.warn('Polygon websocket closed. Attempting reconnect.');
                this.scheduleReconnect();
            });
            this.logger.log('USDT websocket listener started');
        }
        catch (error) {
            this.logger.error('Failed to establish Polygon websocket connection', error);
            this.scheduleReconnect();
        }
    }
    scheduleReconnect() {
        if (this.reconnectTimer) {
            return;
        }
        this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            this.startWebsocketListener().catch((error) => this.logger.error('USDT websocket reconnect failed', error));
        }, 5000);
    }
    async handleLog(log) {
        if (!log.topics?.length) {
            return;
        }
        let parsed = null;
        try {
            const event = this.usdtInterface.parseLog({
                topics: log.topics,
                data: log.data,
            });
            const toAddress = ethers_1.ethers.getAddress(event.args.to);
            const fromAddress = ethers_1.ethers.getAddress(event.args.from);
            const amount = Number(ethers_1.ethers.formatUnits(event.args.value, 6));
            parsed = {
                txHash: log.transactionHash,
                blockNumber: Number(log.blockNumber),
                logIndex: Number(log.index ?? log.logIndex ?? 0),
                fromAddress,
                toAddress,
                amount,
            };
        }
        catch (error) {
            this.logger.debug(`Failed to parse USDT log: ${error}`);
            return;
        }
        if (!parsed || !this.registry.hasAddress(parsed.toAddress)) {
            return;
        }
        await this.queue.enqueueDeposit({
            txHash: parsed.txHash,
            fromAddress: parsed.fromAddress,
            toAddress: parsed.toAddress,
            amount: parsed.amount,
            blockNumber: parsed.blockNumber,
            logIndex: parsed.logIndex,
            network: 'POLYGON',
        });
    }
};
exports.UsdtWatcherService = UsdtWatcherService;
exports.UsdtWatcherService = UsdtWatcherService = UsdtWatcherService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        usdt_address_registry_service_1.UsdtAddressRegistryService,
        usdt_deposit_queue_service_1.UsdtDepositQueueService,
        usdt_watcher_state_service_1.UsdtWatcherStateService])
], UsdtWatcherService);
//# sourceMappingURL=usdt-watcher.service.js.map