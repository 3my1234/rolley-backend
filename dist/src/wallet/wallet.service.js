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
var WalletService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const users_service_1 = require("../users/users.service");
const ethers_1 = require("ethers");
let WalletService = WalletService_1 = class WalletService {
    constructor(prisma, usersService) {
        this.prisma = prisma;
        this.usersService = usersService;
        this.logger = new common_1.Logger(WalletService_1.name);
    }
    async depositFunds(privyId, data) {
        const { amount, currency, paymentMethod } = data;
        const numAmount = Number(amount);
        console.log('🔍 WalletService: Deposit request received - Amount:', numAmount, 'Currency:', currency);
        const validAmounts = [0.15, 1, 10, 100, 1000, 10000];
        const isValidAmount = validAmounts.some(validAmount => Math.abs(numAmount - validAmount) < 0.001);
        if (!isValidAmount) {
            console.log('❌ Amount validation failed:', numAmount);
            console.log('❌ Valid amounts:', validAmounts);
            throw new common_1.BadRequestException('Invalid amount. Must be one of: 0.15 (test), 1, 10, 100, 1000, 10000');
        }
        if (!['USD', 'USDT'].includes(currency)) {
            throw new common_1.BadRequestException('Invalid currency');
        }
        const user = await this.usersService.findByPrivyId(privyId);
        if (paymentMethod === 'flutterwave' && currency === 'USD') {
            throw new common_1.BadRequestException('USD deposits via Flutterwave are temporarily unavailable. ' +
                'Please use USDT deposits on Polygon to fund your account. ' +
                'USDT deposits are processed automatically and are the only payment method currently available.');
        }
        else if (paymentMethod === 'privy' && currency === 'USDT') {
            if (!user.walletAddress) {
                throw new common_1.BadRequestException('Wallet not connected. Please connect your wallet first.');
            }
            const transaction = await this.prisma.transaction.create({
                data: {
                    userId: user.id,
                    type: 'DEPOSIT',
                    currency: client_1.Currency.USDT,
                    amount: numAmount,
                    fee: 0,
                    netAmount: numAmount,
                    status: 'PENDING',
                    paymentMethod: 'privy',
                    description: 'USDT deposit via crypto wallet',
                    metadata: {
                        walletAddress: user.walletAddress,
                        expectedAmount: numAmount,
                        currency: client_1.Currency.USDT,
                        network: 'POLYGON',
                    },
                },
            });
            return {
                depositAddress: user.walletAddress,
                transactionId: transaction.id,
                amount: numAmount,
                currency: 'USDT',
                message: 'Send USDT (Polygon) to your wallet address. Balance will update automatically when detected on-chain.',
                instructions: [
                    `Send exactly ${numAmount} USDT (Polygon) to the address above`,
                    'Use the Polygon PoS network (do not use Ethereum / Tron / BSC)',
                    'Keep at least 0.05 MATIC in the sending wallet to cover Polygon gas fees',
                    'Your balance will update automatically within 1-2 minutes after 3 block confirmations',
                    'No manual verification needed - our system monitors the Polygon blockchain',
                    'Contact support if your deposit isn\'t detected after 10 minutes'
                ],
            };
        }
        throw new common_1.BadRequestException('Invalid payment method');
    }
    async withdrawFunds(privyId, data) {
        const { amount, currency, withdrawalDetails } = data;
        const numAmount = Number(amount);
        if (!['USD', 'USDT'].includes(currency)) {
            throw new common_1.BadRequestException('Invalid currency');
        }
        const user = await this.usersService.findByPrivyId(privyId);
        const balanceField = currency === 'USD' ? 'usdBalance' : 'usdtBalance';
        if (user[balanceField] < numAmount) {
            throw new common_1.BadRequestException(`Insufficient ${currency} balance`);
        }
        const transaction = await this.prisma.transaction.create({
            data: {
                userId: user.id,
                type: 'WITHDRAWAL',
                currency: currency === 'USD' ? client_1.Currency.USD : client_1.Currency.USDT,
                amount: numAmount,
                fee: 0,
                netAmount: numAmount,
                status: 'PENDING',
                paymentMethod: withdrawalDetails.method,
                description: `${currency} withdrawal request`,
                metadata: withdrawalDetails,
            },
        });
        return {
            transactionId: transaction.id,
            message: 'Withdrawal request submitted successfully',
        };
    }
    async verifyCryptoDeposit(privyId, data) {
        const { transactionHash, amount, network } = data;
        const user = await this.usersService.findByPrivyId(privyId);
        await this.usersService.updateBalance(user.id, 'USDT', Number(amount));
        await this.prisma.transaction.updateMany({
            where: {
                userId: user.id,
                type: 'DEPOSIT',
                currency: client_1.Currency.USDT,
                status: 'PENDING',
                amount: Number(amount),
            },
            data: {
                status: 'COMPLETED',
                externalId: transactionHash,
            },
        });
        const updatedUser = await this.usersService.findById(user.id);
        return {
            message: 'Deposit verified successfully',
            newBalance: updatedUser.usdtBalance,
        };
    }
    async handleUsdtWebhook(secret, payload) {
        const configuredSecret = process.env.USDT_WEBHOOK_SECRET;
        if (!configuredSecret) {
            this.logger.warn('USDT webhook secret is not configured. Rejecting webhook for safety.');
            throw new common_1.BadRequestException('Webhook not enabled');
        }
        if (!secret || secret !== configuredSecret) {
            throw new common_1.BadRequestException('Invalid webhook credentials');
        }
        if (!payload.toAddress) {
            throw new common_1.BadRequestException('Missing recipient address');
        }
        if ((payload.network || '').toUpperCase() !== 'POLYGON') {
            throw new common_1.BadRequestException('Unsupported network');
        }
        await this.confirmUsdtDeposit({
            walletAddress: payload.toAddress,
            amount: payload.amount,
            txHash: payload.txHash,
            source: 'webhook',
            metadata: {
                confirmations: payload.confirmations,
                fromAddress: payload.fromAddress,
                raw: payload.metadata,
            },
        });
    }
    async confirmUsdtDeposit(params) {
        const { walletAddress, amount, txHash, source, metadata } = params;
        const normalizedAddress = this.normalizeAddress(walletAddress);
        const user = await this.prisma.user.findFirst({
            where: {
                walletAddress: {
                    equals: normalizedAddress,
                    mode: 'insensitive',
                },
            },
        });
        if (!user) {
            throw new common_1.BadRequestException('No user is associated with the provided wallet address');
        }
        if (!txHash) {
            throw new common_1.BadRequestException('Transaction hash is required');
        }
        const existingTx = await this.prisma.transaction.findUnique({
            where: { externalId: txHash },
        });
        if (existingTx) {
            if (existingTx.status !== client_1.TransactionStatus.COMPLETED) {
                await this.prisma.transaction.update({
                    where: { id: existingTx.id },
                    data: { status: client_1.TransactionStatus.COMPLETED },
                });
                await this.usersService.updateBalance(user.id, 'USDT', amount);
            }
            return existingTx;
        }
        const tolerance = Number(process.env.USDT_AMOUNT_TOLERANCE ?? '0.5') || 0.5;
        const pendingTransaction = await this.prisma.transaction.findFirst({
            where: {
                userId: user.id,
                type: 'DEPOSIT',
                currency: client_1.Currency.USDT,
                status: client_1.TransactionStatus.PENDING,
                paymentMethod: 'privy',
                amount: {
                    gte: amount - tolerance,
                    lte: amount + tolerance,
                },
            },
            orderBy: { createdAt: 'asc' },
        });
        if (pendingTransaction) {
            await this.prisma.transaction.update({
                where: { id: pendingTransaction.id },
                data: {
                    status: client_1.TransactionStatus.COMPLETED,
                    externalId: txHash,
                    metadata: {
                        ...pendingTransaction.metadata,
                        source,
                        depositHash: txHash,
                        webhookMetadata: metadata,
                    },
                },
            });
        }
        else {
            await this.prisma.transaction.create({
                data: {
                    userId: user.id,
                    type: 'DEPOSIT',
                    currency: client_1.Currency.USDT,
                    amount,
                    fee: 0,
                    netAmount: amount,
                    status: client_1.TransactionStatus.COMPLETED,
                    paymentMethod: 'privy',
                    description: 'USDT deposit detected automatically',
                    externalId: txHash,
                    metadata: {
                        source,
                        detectedAt: new Date().toISOString(),
                        webhookMetadata: metadata,
                        walletAddress: normalizedAddress,
                    },
                },
            });
        }
        await this.usersService.updateBalance(user.id, 'USDT', amount);
        this.logger.log(`USDT deposit confirmed for user ${user.id} via ${source} (${amount} USDT)`);
    }
    normalizeAddress(address) {
        try {
            return ethers_1.ethers.getAddress(address);
        }
        catch (error) {
            throw new common_1.BadRequestException('Invalid wallet address received');
        }
    }
};
exports.WalletService = WalletService;
exports.WalletService = WalletService = WalletService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        users_service_1.UsersService])
], WalletService);
//# sourceMappingURL=wallet.service.js.map