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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokensService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const blockchain_service_1 = require("../blockchain/blockchain.service");
const rewards_utils_1 = require("../utils/rewards.utils");
let TokensService = class TokensService {
    constructor(prisma, blockchainService) {
        this.prisma = prisma;
        this.blockchainService = blockchainService;
    }
    resolveCurrency(value) {
        if (value === 'USD') {
            return client_1.Currency.USD;
        }
        if (value === 'USDT') {
            return client_1.Currency.USDT;
        }
        if (value === 'ROL') {
            return client_1.Currency.ROL;
        }
        throw new common_1.BadRequestException('Invalid currency');
    }
    async getTokenBalance(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                rolBalance: true,
                totalRolEarned: true,
                totalRolSpent: true,
            },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const activeStakes = await this.prisma.stake.findMany({
            where: {
                userId,
                status: 'ACTIVE',
            },
            select: {
                pendingRolReward: true,
            },
        });
        const pendingRewards = activeStakes.reduce((sum, stake) => sum + stake.pendingRolReward, 0);
        return {
            rolBalance: user.rolBalance,
            pendingRewards,
            totalRolEarned: user.totalRolEarned,
            totalRolSpent: user.totalRolSpent,
            valueUsd: user.rolBalance * rewards_utils_1.ROL_USD_VALUE,
        };
    }
    async getTokenHistory(userId, type) {
        const where = { userId };
        if (type && type !== 'all') {
            where.type = type;
        }
        const transactions = await this.prisma.transaction.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
        const airdrops = await this.prisma.airdrop.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
        const tokenRewards = await this.prisma.tokenReward.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
        return {
            transactions,
            airdrops,
            tokenRewards,
        };
    }
    async convertRolToUsdt(userId, convertTokenDto) {
        const { rolAmount } = convertTokenDto;
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        if (user.rolBalance < rolAmount) {
            throw new common_1.BadRequestException('Insufficient ROL balance');
        }
        const usdtAmount = rolAmount * rewards_utils_1.ROL_USD_VALUE;
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                rolBalance: { decrement: rolAmount },
                totalRolSpent: { increment: rolAmount },
                usdtBalance: { increment: usdtAmount },
            },
        });
        await this.prisma.tokenConversion.create({
            data: {
                userId,
                rolAmount,
                usdtAmount,
                conversionRate: rewards_utils_1.ROL_USD_VALUE,
                status: 'completed',
            },
        });
        return {
            success: true,
            rolAmount,
            usdtAmount,
            conversionRate: rewards_utils_1.ROL_USD_VALUE,
        };
    }
    async awardSimpleRolReward(userId, action, metadata) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user || !user.walletAddress) {
            return { success: false, error: 'User not found or no wallet address' };
        }
        const rolAmount = action === 'FIRST_STAKE' ? 50 : 100;
        const usdValue = rolAmount * rewards_utils_1.ROL_USD_VALUE;
        const result = await this.blockchainService.sendRolTokens(user.walletAddress, rolAmount, `${action} bonus`);
        if (!result.success) {
            return { success: false, error: result.error };
        }
        await this.prisma.airdrop.create({
            data: {
                userId,
                amount: rolAmount,
                valueUsd: usdValue,
                reason: action,
                metadata: (metadata || {}),
                txHash: result.txHash,
                status: 'completed',
            },
        });
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                rolBalance: { increment: rolAmount },
                totalRolEarned: { increment: rolAmount },
            },
        });
        return {
            success: true,
            rolAmount,
            txHash: result.txHash,
        };
    }
    async awardMilestoneCardBonus(userId, stakeId, stakeAmount, stakeCurrency, period, daysCompleted) {
        return {
            success: true,
            cardTier: 'Test',
            cardBonusUSD: 0.02,
        };
    }
    async buyRol(userId, tradeDto) {
        const { currency, amount } = tradeDto;
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const rolAmount = amount / rewards_utils_1.ROL_USD_VALUE;
        if (currency === 'USD') {
            if (user.usdBalance < amount) {
                throw new common_1.BadRequestException(`Insufficient USD balance. You have $${user.usdBalance}, but need $${amount}`);
            }
        }
        else if (currency === 'USDT') {
            if (user.usdtBalance < amount) {
                throw new common_1.BadRequestException(`Insufficient USDT balance. You have ${user.usdtBalance} USDT, but need ${amount} USDT`);
            }
        }
        const updateData = {
            rolBalance: { increment: rolAmount },
            totalRolEarned: { increment: rolAmount },
        };
        if (currency === 'USD') {
            updateData.usdBalance = { decrement: amount };
        }
        else {
            updateData.usdtBalance = { decrement: amount };
        }
        await this.prisma.user.update({
            where: { id: userId },
            data: updateData,
        });
        let mintTxHash;
        if (user.walletAddress) {
            try {
                const mintResult = await this.blockchainService.mintRolTokens(user.walletAddress, rolAmount, `Buy ROL: ${amount} ${currency}`);
                if (mintResult.success) {
                    mintTxHash = mintResult.txHash;
                }
            }
            catch (error) {
                console.error('Error minting tokens on-chain:', error);
            }
        }
        await this.prisma.transaction.create({
            data: {
                userId,
                type: client_1.TransactionType.ROL_PURCHASE,
                amount: amount,
                currency: this.resolveCurrency(currency),
                netAmount: amount,
                status: 'COMPLETED',
                metadata: {
                    rolAmount,
                    buyRate: rewards_utils_1.ROL_USD_VALUE,
                    mintTxHash,
                },
            },
        });
        return {
            success: true,
            message: `Successfully bought ${rolAmount.toFixed(4)} ROL for ${amount} ${currency}`,
            rolAmount,
            paidAmount: amount,
            currency,
            buyRate: rewards_utils_1.ROL_USD_VALUE,
            mintTxHash,
        };
    }
    async sellRol(userId, tradeDto) {
        const { currency, amount } = tradeDto;
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const rolAmount = amount;
        if (user.rolBalance < rolAmount) {
            throw new common_1.BadRequestException(`Insufficient ROL balance. You have ${user.rolBalance} ROL, but need ${rolAmount} ROL`);
        }
        const paymentAmount = rolAmount * rewards_utils_1.ROL_SELL_VALUE;
        const updateData = {
            rolBalance: { decrement: rolAmount },
            totalRolSpent: { increment: rolAmount },
        };
        if (currency === 'USD') {
            updateData.usdBalance = { increment: paymentAmount };
        }
        else {
            updateData.usdtBalance = { increment: paymentAmount };
        }
        await this.prisma.user.update({
            where: { id: userId },
            data: updateData,
        });
        await this.prisma.transaction.create({
            data: {
                userId,
                type: client_1.TransactionType.ROL_SALE,
                amount: paymentAmount,
                currency: this.resolveCurrency(currency),
                netAmount: paymentAmount,
                status: 'COMPLETED',
                metadata: {
                    rolAmount,
                    sellRate: rewards_utils_1.ROL_SELL_VALUE,
                },
            },
        });
        return {
            success: true,
            message: `Successfully sold ${rolAmount.toFixed(4)} ROL for ${paymentAmount.toFixed(2)} ${currency}`,
            rolAmount,
            receivedAmount: paymentAmount,
            currency,
            sellRate: rewards_utils_1.ROL_SELL_VALUE,
        };
    }
    async tradeRol(userId, tradeDto) {
        if (tradeDto.type === 'BUY') {
            return this.buyRol(userId, tradeDto);
        }
        else if (tradeDto.type === 'SELL') {
            return this.sellRol(userId, tradeDto);
        }
        else {
            throw new common_1.BadRequestException('Invalid trade type. Must be BUY or SELL');
        }
    }
};
exports.TokensService = TokensService;
exports.TokensService = TokensService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        blockchain_service_1.BlockchainService])
], TokensService);
//# sourceMappingURL=tokens.service.js.map