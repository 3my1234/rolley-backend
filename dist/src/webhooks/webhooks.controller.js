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
exports.WebhooksController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const webhooks_service_1 = require("./webhooks.service");
let WebhooksController = class WebhooksController {
    constructor(webhooksService) {
        this.webhooksService = webhooksService;
    }
    async handleN8nWebhook(body, authHeader) {
        const expectedSecret = process.env.N8N_WEBHOOK_SECRET;
        if (authHeader !== `Bearer ${expectedSecret}`) {
            throw new Error('Unauthorized');
        }
        return this.webhooksService.handleN8nWebhook(body);
    }
    async handleFlutterwaveWebhook(body) {
        return this.webhooksService.handleFlutterwaveWebhook(body);
    }
    async verifyFlutterwavePayment(transactionId, txRef, status) {
        return this.webhooksService.verifyFlutterwavePayment(transactionId, txRef, status);
    }
};
exports.WebhooksController = WebhooksController;
__decorate([
    (0, common_1.Post)('n8n'),
    (0, swagger_1.ApiOperation)({ summary: 'Handle n8n webhook' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Webhook processed successfully' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], WebhooksController.prototype, "handleN8nWebhook", null);
__decorate([
    (0, common_1.Post)('flutterwave'),
    (0, swagger_1.ApiOperation)({ summary: 'Handle Flutterwave webhook' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Webhook processed successfully' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WebhooksController.prototype, "handleFlutterwaveWebhook", null);
__decorate([
    (0, common_1.Get)('flutterwave/verify'),
    (0, swagger_1.ApiOperation)({ summary: 'Verify Flutterwave payment' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Payment verification completed' }),
    __param(0, (0, common_1.Query)('transaction_id')),
    __param(1, (0, common_1.Query)('tx_ref')),
    __param(2, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], WebhooksController.prototype, "verifyFlutterwavePayment", null);
exports.WebhooksController = WebhooksController = __decorate([
    (0, swagger_1.ApiTags)('Webhooks'),
    (0, common_1.Controller)('webhooks'),
    __metadata("design:paramtypes", [webhooks_service_1.WebhooksService])
], WebhooksController);
//# sourceMappingURL=webhooks.controller.js.map