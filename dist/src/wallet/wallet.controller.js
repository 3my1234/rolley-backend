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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const wallet_service_1 = require("./wallet.service");
const privy_auth_guard_1 = require("../auth/guards/privy-auth.guard");
const usdt_webhook_dto_1 = require("./dto/usdt-webhook.dto");
let WalletController = class WalletController {
    constructor(walletService) {
        this.walletService = walletService;
    }
    async depositFunds(req, depositData) {
        console.log('🔍 WalletController: Deposit request received');
        console.log('🔍 Raw request body:', req.body);
        console.log('🔍 Parsed depositData:', depositData);
        console.log('🔍 Request headers:', req.headers);
        console.log('🔍 Content-Type:', req.headers['content-type']);
        return this.walletService.depositFunds(req.user.userId, depositData);
    }
    async withdrawFunds(req, withdrawData) {
        return this.walletService.withdrawFunds(req.user.userId, withdrawData);
    }
    async verifyCryptoDeposit(req, verifyData) {
        return this.walletService.verifyCryptoDeposit(req.user.userId, verifyData);
    }
    async handleUsdtWebhook(secret, payload) {
        await this.walletService.handleUsdtWebhook(secret, payload);
        return { status: 'ok' };
    }
};
exports.WalletController = WalletController;
__decorate([
    (0, common_1.Post)('deposit'),
    (0, common_1.UseGuards)(privy_auth_guard_1.PrivyAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Deposit funds' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Deposit initiated successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad request' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "depositFunds", null);
__decorate([
    (0, common_1.Post)('withdraw'),
    (0, common_1.UseGuards)(privy_auth_guard_1.PrivyAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Withdraw funds' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Withdrawal initiated successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad request' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "withdrawFunds", null);
__decorate([
    (0, common_1.Post)('verify-deposit'),
    (0, common_1.UseGuards)(privy_auth_guard_1.PrivyAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Verify crypto deposit' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Deposit verified successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad request' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "verifyCryptoDeposit", null);
__decorate([
    (0, common_1.Post)('usdt/webhook'),
    (0, swagger_1.ApiOperation)({
        summary: 'USDT deposit webhook (Polygon)',
        description: 'Endpoint for blockchain/webhook providers to confirm USDT deposits',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Webhook processed successfully' }),
    __param(0, (0, common_1.Headers)('x-webhook-secret')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, usdt_webhook_dto_1.UsdtWebhookDto]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "handleUsdtWebhook", null);
exports.WalletController = WalletController = __decorate([
    (0, swagger_1.ApiTags)('Wallet'),
    (0, common_1.Controller)('wallet'),
    __metadata("design:paramtypes", [wallet_service_1.WalletService])
], WalletController);
//# sourceMappingURL=wallet.controller.js.map