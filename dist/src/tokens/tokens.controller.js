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
exports.TokensController = exports.Public = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const tokens_service_1 = require("./tokens.service");
const privy_auth_guard_1 = require("../auth/guards/privy-auth.guard");
const convert_token_dto_1 = require("./dto/convert-token.dto");
const prisma_service_1 = require("../prisma/prisma.service");
const Public = () => (0, common_1.SetMetadata)(privy_auth_guard_1.IS_PUBLIC_KEY, true);
exports.Public = Public;
let TokensController = class TokensController {
    constructor(tokensService, prisma) {
        this.tokensService = tokensService;
        this.prisma = prisma;
    }
    async getUserIdFromRequest(req) {
        const privyUserId = req.user?.userId || req.user?.user?.id || req.user?.sub;
        if (!privyUserId) {
            throw new common_1.UnauthorizedException('User ID not found in token');
        }
        const user = await this.prisma.user.findUnique({
            where: { privyId: privyUserId },
        });
        if (!user) {
            throw new common_1.UnauthorizedException('User not found in database');
        }
        return user.id;
    }
    async getTokenBalance(req) {
        const userId = await this.getUserIdFromRequest(req);
        return this.tokensService.getTokenBalance(userId);
    }
    async getTokenHistory(req, type) {
        const userId = await this.getUserIdFromRequest(req);
        return this.tokensService.getTokenHistory(userId, type);
    }
    async convertRolToUsdt(req, convertTokenDto) {
        const userId = await this.getUserIdFromRequest(req);
        return this.tokensService.convertRolToUsdt(userId, convertTokenDto);
    }
    async tradeRol(req, tradeDto) {
        console.log('🔍 Full request object:', {
            body: req.body,
            rawBody: req.rawBody,
            headers: req.headers,
            method: req.method,
        });
        console.log('🔍 @Body() decorator value:', tradeDto);
        console.log('🔍 Body type:', typeof tradeDto);
        console.log('🔍 Body keys:', Object.keys(tradeDto || {}));
        console.log('🔍 Body JSON:', JSON.stringify(tradeDto));
        const bodyData = (tradeDto && Object.keys(tradeDto).length > 0) ? tradeDto : req.body;
        console.log('🔍 Using bodyData:', bodyData);
        if (!bodyData || !bodyData.type || !bodyData.currency || !bodyData.amount) {
            throw new common_1.BadRequestException('Missing required fields: type, currency, amount');
        }
        if (bodyData.type !== 'BUY' && bodyData.type !== 'SELL') {
            throw new common_1.BadRequestException('Invalid trade type. Must be BUY or SELL');
        }
        if (bodyData.currency !== 'USD' && bodyData.currency !== 'USDT') {
            throw new common_1.BadRequestException('Invalid currency. Must be USD or USDT');
        }
        const userId = await this.getUserIdFromRequest(req);
        return this.tokensService.tradeRol(userId, bodyData);
    }
    async getRates() {
        return {
            buyRate: 100,
            sellRate: 95,
            buyRateDescription: '$100 USD = 1 ROL',
            sellRateDescription: '1 ROL = $95 USD (5% discount)',
        };
    }
};
exports.TokensController = TokensController;
__decorate([
    (0, common_1.Get)('balance'),
    (0, swagger_1.ApiOperation)({ summary: 'Get user token balance' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Token balance retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TokensController.prototype, "getTokenBalance", null);
__decorate([
    (0, common_1.Get)('history'),
    (0, swagger_1.ApiOperation)({ summary: 'Get user token history' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Token history retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('type')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], TokensController.prototype, "getTokenHistory", null);
__decorate([
    (0, common_1.Post)('convert'),
    (0, swagger_1.ApiOperation)({ summary: 'Convert ROL to USDT' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Token conversion successful' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad request' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, convert_token_dto_1.ConvertTokenDto]),
    __metadata("design:returntype", Promise)
], TokensController.prototype, "convertRolToUsdt", null);
__decorate([
    (0, common_1.Post)('trade'),
    (0, swagger_1.ApiOperation)({ summary: 'Buy or sell ROL tokens' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Trade successful' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad request' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], TokensController.prototype, "tradeRol", null);
__decorate([
    (0, common_1.Get)('rates'),
    (0, exports.Public)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get ROL trading rates' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Rates retrieved successfully' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TokensController.prototype, "getRates", null);
exports.TokensController = TokensController = __decorate([
    (0, swagger_1.ApiTags)('Tokens'),
    (0, common_1.Controller)('tokens'),
    (0, common_1.UseGuards)(privy_auth_guard_1.PrivyAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [tokens_service_1.TokensService,
        prisma_service_1.PrismaService])
], TokensController);
//# sourceMappingURL=tokens.controller.js.map