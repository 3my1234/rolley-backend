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
exports.StakesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const stakes_service_1 = require("./stakes.service");
const privy_auth_guard_1 = require("../auth/guards/privy-auth.guard");
const create_stake_dto_1 = require("./dto/create-stake.dto");
const participate_stake_dto_1 = require("./dto/participate-stake.dto");
const users_service_1 = require("../users/users.service");
let StakesController = class StakesController {
    constructor(stakesService, usersService) {
        this.stakesService = stakesService;
        this.usersService = usersService;
    }
    async create(req, createStakeDto) {
        const user = await this.usersService.findByPrivyId(req.user.userId);
        return this.stakesService.create(user.id, createStakeDto);
    }
    async findAll(req) {
        const user = await this.usersService.findByPrivyId(req.user.userId);
        const stakes = await this.stakesService.findAll(user.id);
        return { stakes };
    }
    async findActive(req) {
        const user = await this.usersService.findByPrivyId(req.user.userId);
        const stakes = await this.stakesService.findActive(user.id);
        return { stakes };
    }
    async participate(req, participateStakeDto) {
        const user = await this.usersService.findByPrivyId(req.user.userId);
        return this.stakesService.participate(user.id, participateStakeDto);
    }
};
exports.StakesController = StakesController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new stake' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Stake created successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad request' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_stake_dto_1.CreateStakeDto]),
    __metadata("design:returntype", Promise)
], StakesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get user stakes' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Stakes retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], StakesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('active'),
    (0, swagger_1.ApiOperation)({ summary: 'Get user active stakes' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Active stakes retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], StakesController.prototype, "findActive", null);
__decorate([
    (0, common_1.Post)('participate'),
    (0, swagger_1.ApiOperation)({ summary: 'Participate in daily event' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Participation recorded successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad request' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, participate_stake_dto_1.ParticipateStakeDto]),
    __metadata("design:returntype", Promise)
], StakesController.prototype, "participate", null);
exports.StakesController = StakesController = __decorate([
    (0, swagger_1.ApiTags)('Stakes'),
    (0, common_1.Controller)('stakes'),
    (0, common_1.UseGuards)(privy_auth_guard_1.PrivyAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [stakes_service_1.StakesService,
        users_service_1.UsersService])
], StakesController);
//# sourceMappingURL=stakes.controller.js.map