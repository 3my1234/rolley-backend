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
exports.DailyEventsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const daily_events_service_1 = require("./daily-events.service");
const privy_auth_guard_1 = require("../auth/guards/privy-auth.guard");
const prisma_service_1 = require("../prisma/prisma.service");
const users_service_1 = require("../users/users.service");
let DailyEventsController = class DailyEventsController {
    constructor(dailyEventsService, prisma, usersService) {
        this.dailyEventsService = dailyEventsService;
        this.prisma = prisma;
        this.usersService = usersService;
    }
    async getCurrentEvent(req) {
        const user = await this.usersService.findByPrivyId(req.user.userId);
        const dailyEvent = await this.dailyEventsService.getCurrentEvent();
        const activeStakes = await this.prisma.stake.findMany({
            where: {
                userId: user.id,
                status: 'ACTIVE',
            },
            include: {
                dailyParticipations: {
                    where: {
                        dailyEventId: dailyEvent?.id,
                    },
                },
            },
        });
        return {
            dailyEvent,
            activeStakes,
        };
    }
};
exports.DailyEventsController = DailyEventsController;
__decorate([
    (0, common_1.Get)('current'),
    (0, swagger_1.ApiOperation)({ summary: 'Get current daily event' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Current event retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DailyEventsController.prototype, "getCurrentEvent", null);
exports.DailyEventsController = DailyEventsController = __decorate([
    (0, swagger_1.ApiTags)('Daily Events'),
    (0, common_1.Controller)('daily-events'),
    (0, common_1.UseGuards)(privy_auth_guard_1.PrivyAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [daily_events_service_1.DailyEventsService,
        prisma_service_1.PrismaService,
        users_service_1.UsersService])
], DailyEventsController);
//# sourceMappingURL=daily-events.controller.js.map