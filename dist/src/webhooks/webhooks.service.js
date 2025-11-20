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
var WebhooksService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhooksService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const flutterwave_1 = require("../lib/payments/flutterwave");
const tokens_service_1 = require("../tokens/tokens.service");
const blockchain_service_1 = require("../blockchain/blockchain.service");
let WebhooksService = WebhooksService_1 = class WebhooksService {
    constructor(prisma, tokensService, blockchainService) {
        this.prisma = prisma;
        this.tokensService = tokensService;
        this.blockchainService = blockchainService;
        this.logger = new common_1.Logger(WebhooksService_1.name);
    }
    async handleN8nWebhook(webhookData) {
        const normalized = this.normalizeN8nPayload(webhookData);
        if (!normalized.matches?.length) {
            throw new common_1.BadRequestException('No matches provided');
        }
        const matches = normalized.matches.map((match) => ({
            homeTeam: match.homeTeam,
            awayTeam: match.awayTeam,
            tournament: match.tournament ?? match.league ?? null,
            prediction: match.prediction ?? null,
            predictionMarket: match.predictionMarket ?? null,
            odds: typeof match.odds === 'number'
                ? Number(match.odds)
                : match.predictedOdds
                    ? Number(match.predictedOdds)
                    : null,
            predictedOdds: typeof match.predictedOdds === 'number'
                ? Number(match.predictedOdds)
                : typeof match.odds === 'number'
                    ? Number(match.odds)
                    : null,
            reasoning: match.reasoning ?? null,
            confidence: match.confidence ? Number(match.confidence) : null,
            homeForm: match.homeForm ?? null,
            awayForm: match.awayForm ?? null,
            injuries: match.injuries ?? null,
            h2h: match.h2h ?? null,
            modelWarnings: match.modelWarnings ?? [],
            dataQuality: match.dataQuality ?? null,
            autoSelected: Boolean(match.autoSelected),
            metadata: match.metadata ?? null,
        }));
        const aiPredictions = (normalized.aiPredictions ?? normalized.matches ?? []).map((match) => ({
            homeTeam: match.homeTeam,
            awayTeam: match.awayTeam,
            tournament: match.tournament ?? match.league ?? null,
            prediction: match.prediction ?? null,
            predictionMarket: match.predictionMarket ?? null,
            odds: typeof match.odds === 'number'
                ? Number(match.odds)
                : match.predictedOdds
                    ? Number(match.predictedOdds)
                    : null,
            predictedOdds: typeof match.predictedOdds === 'number'
                ? Number(match.predictedOdds)
                : typeof match.odds === 'number'
                    ? Number(match.odds)
                    : null,
            reasoning: match.reasoning ?? null,
            confidence: match.confidence ? Number(match.confidence) : null,
            homeForm: match.homeForm ?? null,
            awayForm: match.awayForm ?? null,
            injuries: match.injuries ?? null,
            h2h: match.h2h ?? null,
            modelWarnings: match.modelWarnings ?? [],
            dataQuality: match.dataQuality ?? null,
            autoSelected: Boolean(match.autoSelected),
            metadata: match.metadata ?? null,
        }));
        const computeAutoTotalOdds = () => {
            const autoMatches = matches.filter((match) => match.autoSelected && typeof match.predictedOdds === 'number');
            if (!autoMatches.length) {
                return null;
            }
            const product = autoMatches.reduce((acc, match) => acc * Number(match.predictedOdds || 1), 1);
            return Number(product.toFixed(4));
        };
        const totalOdds = typeof normalized.totalOdds === 'number'
            ? Number(normalized.totalOdds)
            : computeAutoTotalOdds() ?? 1.05;
        try {
            const dailyEvent = await this.prisma.dailyEvent.create({
                data: {
                    date: normalized.date ? new Date(normalized.date) : new Date(),
                    sport: normalized.sport ?? 'FOOTBALL',
                    matches,
                    totalOdds,
                    status: 'PENDING',
                    aiPredictions: aiPredictions.length ? aiPredictions : matches,
                    adminReviewed: false,
                    adminPredictions: null,
                    adminComments: null,
                },
            });
            return dailyEvent;
        }
        catch (error) {
            this.logger.error('Failed to create daily event from n8n payload', error);
            throw new common_1.BadRequestException('Failed to save daily event');
        }
    }
    normalizeN8nPayload(payload) {
        if (!payload) {
            throw new common_1.BadRequestException('Empty webhook payload');
        }
        let data = payload;
        if (typeof payload === 'string') {
            try {
                data = JSON.parse(payload);
            }
            catch (error) {
                throw new common_1.BadRequestException('Invalid JSON payload');
            }
        }
        if (data.body && typeof data.body === 'string') {
            try {
                data = JSON.parse(data.body);
            }
            catch (error) {
                throw new common_1.BadRequestException('Invalid JSON body');
            }
        }
        if (data.data && typeof data.data === 'string') {
            try {
                data.data = JSON.parse(data.data);
            }
            catch (error) {
                throw new common_1.BadRequestException('Invalid nested data payload');
            }
        }
        if (data.data && typeof data.data === 'object') {
            return {
                ...data.data,
                action: data.action,
            };
        }
        return data;
    }
    async handleFlutterwaveWebhook(webhookData) {
        console.log('Flutterwave webhook received:', webhookData);
        const { event, data } = webhookData;
        if (event === 'charge.completed' && data.status === 'successful') {
            const transaction = await this.prisma.transaction.findFirst({
                where: {
                    externalId: data.tx_ref,
                    status: 'PENDING',
                },
                include: {
                    user: true,
                },
            });
            if (transaction) {
                await this.prisma.transaction.update({
                    where: { id: transaction.id },
                    data: {
                        status: 'COMPLETED',
                        externalId: data.flw_ref,
                    },
                });
                const rolAmount = transaction.amount / 100;
                await this.prisma.user.update({
                    where: { id: transaction.userId },
                    data: {
                        rolBalance: {
                            increment: rolAmount,
                        },
                    },
                });
                if (transaction.user.walletAddress) {
                    try {
                        const mintResult = await this.blockchainService.mintRolTokens(transaction.user.walletAddress, rolAmount, `Flutterwave payment: $${transaction.amount} USD`);
                        if (mintResult.success) {
                            console.log(`✅ Minted ${rolAmount} ROL on-chain to ${transaction.user.walletAddress}. Tx: ${mintResult.txHash}`);
                        }
                        else {
                            console.warn(`⚠️  On-chain mint failed (using database only): ${mintResult.error}`);
                        }
                    }
                    catch (error) {
                        console.error('Error minting tokens on-chain:', error);
                    }
                }
                else {
                    console.log(`ℹ️  User ${transaction.userId} has no wallet address - tokens credited to database only`);
                }
                console.log(`✅ Payment completed: ${transaction.amount} USD → ${rolAmount} ROL tokens for user ${transaction.userId}`);
            }
        }
        return { status: 'success' };
    }
    async verifyFlutterwavePayment(transactionId, txRef, status) {
        console.log('Verifying Flutterwave payment:', { transactionId, txRef, status });
        if (!transactionId || !txRef) {
            throw new common_1.BadRequestException('Missing required parameters');
        }
        try {
            const verification = await (0, flutterwave_1.verifyPayment)(transactionId);
            const transaction = await this.prisma.transaction.findFirst({
                where: {
                    externalId: txRef,
                    status: 'PENDING',
                },
                include: {
                    user: true,
                },
            });
            if (!transaction) {
                throw new common_1.NotFoundException('Transaction not found');
            }
            if (verification.data.status === 'successful') {
                await this.prisma.transaction.update({
                    where: { id: transaction.id },
                    data: {
                        status: 'COMPLETED',
                        externalId: transactionId,
                    },
                });
                const rolAmount = transaction.amount / 100;
                await this.prisma.user.update({
                    where: { id: transaction.userId },
                    data: {
                        rolBalance: {
                            increment: rolAmount,
                        },
                    },
                });
                let mintTxHash;
                if (transaction.user.walletAddress) {
                    try {
                        const mintResult = await this.blockchainService.mintRolTokens(transaction.user.walletAddress, rolAmount, `Flutterwave payment: $${transaction.amount} USD`);
                        if (mintResult.success) {
                            mintTxHash = mintResult.txHash;
                            console.log(`✅ Minted ${rolAmount} ROL on-chain to ${transaction.user.walletAddress}. Tx: ${mintTxHash}`);
                        }
                        else {
                            console.warn(`⚠️  On-chain mint failed (using database only): ${mintResult.error}`);
                        }
                    }
                    catch (error) {
                        console.error('Error minting tokens on-chain:', error);
                    }
                }
                else {
                    console.log(`ℹ️  User ${transaction.userId} has no wallet address - tokens credited to database only`);
                }
                return {
                    success: true,
                    message: `Payment verified! You received ${rolAmount} ROL tokens`,
                    transactionId,
                    amount: transaction.amount,
                    rolAmount: rolAmount,
                    mintTxHash,
                };
            }
            else {
                await this.prisma.transaction.update({
                    where: { id: transaction.id },
                    data: {
                        status: 'FAILED',
                    },
                });
                return {
                    success: false,
                    message: 'Payment was not successful',
                    transactionId,
                    status: verification.data.status,
                };
            }
        }
        catch (error) {
            console.error('Payment verification error:', error);
            throw new common_1.BadRequestException('Failed to verify payment');
        }
    }
};
exports.WebhooksService = WebhooksService;
exports.WebhooksService = WebhooksService = WebhooksService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        tokens_service_1.TokensService,
        blockchain_service_1.BlockchainService])
], WebhooksService);
//# sourceMappingURL=webhooks.service.js.map