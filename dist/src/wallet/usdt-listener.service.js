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
var UsdtListenerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsdtListenerService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const ethers_1 = require("ethers");
const wallet_service_1 = require("./wallet.service");
const USDT_CONTRACT_ADDRESS = '0xc2132D05D31c914a87C6611C10748AEb04B58e8F';
const USDT_ABI = [
    'event Transfer(address indexed from, address indexed to, uint256 value)',
];
let UsdtListenerService = UsdtListenerService_1 = class UsdtListenerService {
    constructor(prisma, walletService) {
        this.prisma = prisma;
        this.walletService = walletService;
        this.logger = new common_1.Logger(UsdtListenerService_1.name);
        this.isRunning = false;
        this.lastCheckedBlock = null;
        this.MAX_BLOCK_BATCH = 200;
        this.INITIAL_LOOKBACK = 500;
        const rpcUrl = process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com';
        this.provider = new ethers_1.ethers.JsonRpcProvider(rpcUrl, undefined, {
            staticNetwork: null,
            batchMaxCount: 1,
        });
        this.provider._getConnection = this.provider._getConnection || function () { };
        this.usdtContract = new ethers_1.ethers.Contract(USDT_CONTRACT_ADDRESS, USDT_ABI, this.provider);
    }
    async startListening() {
        if (this.isRunning) {
            this.logger.warn('USDT listener is already running');
            return;
        }
        this.isRunning = true;
        this.logger.log('🚀 USDT deposit listener started on Polygon network');
        setInterval(async () => {
            await this.checkPendingDeposits();
        }, 30000);
        await this.checkPendingDeposits();
    }
    async checkPendingDeposits() {
        try {
            const currentBlock = await this.provider.getBlockNumber();
            const pendingTransactions = await this.prisma.transaction.findMany({
                where: {
                    type: 'DEPOSIT',
                    currency: 'USDT',
                    status: 'PENDING',
                    paymentMethod: 'privy',
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            walletAddress: true,
                        },
                    },
                },
            });
            if (pendingTransactions.length === 0) {
                return;
            }
            this.logger.log(`Checking ${pendingTransactions.length} pending USDT deposits`);
            const walletAddresses = Array.from(new Set(pendingTransactions
                .map((tx) => {
                const addr = tx.user.walletAddress;
                if (!addr)
                    return null;
                try {
                    return ethers_1.ethers.getAddress(addr);
                }
                catch {
                    return addr.toLowerCase();
                }
            })
                .filter((addr) => !!addr)));
            if (walletAddresses.length === 0) {
                return;
            }
            let encounteredError = false;
            for (const walletAddress of walletAddresses) {
                const success = await this.checkWalletDeposits(walletAddress, pendingTransactions, currentBlock);
                if (!success) {
                    encounteredError = true;
                }
            }
            if (!encounteredError) {
                this.lastCheckedBlock = currentBlock;
            }
        }
        catch (error) {
            this.logger.error('Error checking pending deposits:', error);
        }
    }
    async checkWalletDeposits(walletAddress, pendingTransactions, currentBlock) {
        try {
            const normalizedWalletAddress = ethers_1.ethers.getAddress(walletAddress);
            const walletTxs = pendingTransactions.filter((tx) => {
                if (!tx.user.walletAddress)
                    return false;
                const txAddr = ethers_1.ethers.getAddress(tx.user.walletAddress);
                return txAddr === normalizedWalletAddress;
            });
            const fromBlock = (() => {
                if (this.lastCheckedBlock !== null) {
                    const nextBlock = this.lastCheckedBlock + 1;
                    return Math.max(0, Math.min(nextBlock, currentBlock), currentBlock - this.INITIAL_LOOKBACK);
                }
                return Math.max(0, currentBlock - this.INITIAL_LOOKBACK);
            })();
            const toBlock = currentBlock;
            const events = await this.fetchTransferEvents(normalizedWalletAddress, fromBlock, toBlock);
            this.logger.debug(`Found ${events.length} USDT transfers to ${walletAddress}`);
            for (const event of events) {
                let parsedEvent;
                try {
                    parsedEvent = this.usdtContract.interface.parseLog({
                        topics: event.topics,
                        data: event.data,
                    });
                }
                catch (error) {
                    this.logger.debug(`Failed to parse event: ${error}`);
                    continue;
                }
                if (!parsedEvent || !parsedEvent.args)
                    continue;
                const recipient = ethers_1.ethers.getAddress(parsedEvent.args.to);
                const amount = Number(ethers_1.ethers.formatUnits(parsedEvent.args.value, 6));
                const txHash = event.transactionHash;
                const blockNumber = event.blockNumber;
                if (recipient.toLowerCase() !== normalizedWalletAddress.toLowerCase()) {
                    continue;
                }
                for (const pendingTx of walletTxs) {
                    if (pendingTx.status !== 'PENDING')
                        continue;
                    const expectedAmount = Number(pendingTx.amount);
                    if (Math.abs(amount - expectedAmount) > 0.1) {
                        continue;
                    }
                    const existingTx = await this.prisma.transaction.findUnique({
                        where: { externalId: txHash },
                    });
                    if (existingTx) {
                        continue;
                    }
                    const currentBlock = await this.provider.getBlockNumber();
                    const confirmations = currentBlock - Number(blockNumber);
                    if (confirmations < 3) {
                        this.logger.debug(`Transaction ${txHash} needs more confirmations (${confirmations}/3)`);
                        continue;
                    }
                    await this.walletService.confirmUsdtDeposit({
                        walletAddress,
                        amount,
                        txHash,
                        source: 'listener',
                        metadata: {
                            blockNumber,
                            detectedBy: 'listener',
                        },
                    });
                }
            }
            return true;
        }
        catch (error) {
            this.logger.error(`Error checking deposits for wallet ${walletAddress}:`, error);
            return false;
        }
    }
    async fetchTransferEvents(normalizedWalletAddress, fromBlock, toBlock) {
        const events = [];
        let start = fromBlock;
        let batchSize = this.MAX_BLOCK_BATCH;
        const transferTopic = ethers_1.ethers.id('Transfer(address,address,uint256)');
        const toTopic = ethers_1.ethers.zeroPadValue(normalizedWalletAddress, 32);
        while (start <= toBlock) {
            const end = Math.min(start + batchSize, toBlock);
            try {
                const batch = await this.provider.getLogs({
                    address: USDT_CONTRACT_ADDRESS,
                    topics: [transferTopic, null, toTopic],
                    fromBlock: start,
                    toBlock: end,
                });
                events.push(...batch);
                start = end + 1;
                batchSize = this.MAX_BLOCK_BATCH;
            }
            catch (error) {
                const message = error?.message?.toLowerCase() ?? '';
                const isRangeError = message.includes('block range') ||
                    message.includes('range') ||
                    error?.code === -32062;
                if (isRangeError && batchSize > 10) {
                    batchSize = Math.max(10, Math.floor(batchSize / 2));
                    this.logger.debug(`Reducing block batch size to ${batchSize} to satisfy RPC limits`);
                    continue;
                }
                if (message.includes('timeout') || error?.code === 'TIMEOUT') {
                    this.logger.warn(`Timeout while fetching logs [${start}, ${end}]`);
                    return events;
                }
                throw error;
            }
        }
        return events;
    }
};
exports.UsdtListenerService = UsdtListenerService;
exports.UsdtListenerService = UsdtListenerService = UsdtListenerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        wallet_service_1.WalletService])
], UsdtListenerService);
//# sourceMappingURL=usdt-listener.service.js.map