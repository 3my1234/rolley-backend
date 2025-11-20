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
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const admin_service_1 = require("./admin.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let AdminController = class AdminController {
    constructor(adminService) {
        this.adminService = adminService;
    }
    async getAllUsers(req) {
        if (req.user.role !== 'ADMIN') {
            throw new common_1.ForbiddenException('Admin access required');
        }
        const users = await this.adminService.getAllUsers();
        return { users };
    }
    async getAllStakes(req) {
        if (req.user.role !== 'ADMIN') {
            throw new common_1.ForbiddenException('Admin access required');
        }
        const stakes = await this.adminService.getAllStakes();
        return { stakes };
    }
    async getAllDailyEvents(req) {
        if (req.user.role !== 'ADMIN') {
            throw new common_1.ForbiddenException('Admin access required');
        }
        const dailyEvents = await this.adminService.getAllDailyEvents();
        return { dailyEvents };
    }
    async getPendingReviewEvents(req) {
        if (req.user.role !== 'ADMIN') {
            throw new common_1.ForbiddenException('Admin access required');
        }
        return this.adminService.getReviewEventLists();
    }
    async reviewDailyEvent(req, body) {
        if (req.user.role !== 'ADMIN') {
            throw new common_1.ForbiddenException('Admin access required');
        }
        const event = await this.adminService.reviewDailyEvent(body || {});
        return { event };
    }
    async getTopStakers(req, limit) {
        if (req.user.role !== 'ADMIN') {
            throw new common_1.ForbiddenException('Admin access required');
        }
        const parsedLimit = Number(limit);
        const take = !Number.isNaN(parsedLimit) && parsedLimit > 0 ? parsedLimit : 10;
        const topStakers = await this.adminService.getTopStakers(take);
        return { topStakers };
    }
    async getDashboardStats(req) {
        if (req.user.role !== 'ADMIN') {
            throw new common_1.ForbiddenException('Admin access required');
        }
        return this.adminService.getDashboardStats();
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Get)('users'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all users (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Users retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getAllUsers", null);
__decorate([
    (0, common_1.Get)('stakes'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all stakes (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Stakes retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getAllStakes", null);
__decorate([
    (0, common_1.Get)('daily-events'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all daily events (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Daily events retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getAllDailyEvents", null);
__decorate([
    (0, common_1.Get)('review-event'),
    (0, swagger_1.ApiOperation)({ summary: 'Get daily events pending admin review' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Review events retrieved successfully' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getPendingReviewEvents", null);
__decorate([
    (0, common_1.Post)('review-event'),
    (0, swagger_1.ApiOperation)({ summary: 'Review or approve a daily event (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Daily event review saved successfully' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "reviewDailyEvent", null);
__decorate([
    (0, common_1.Get)('top-stakers'),
    (0, swagger_1.ApiOperation)({ summary: 'Get top stakers ranked by stake count (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Top stakers retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getTopStakers", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, swagger_1.ApiOperation)({ summary: 'Get dashboard statistics (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Stats retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getDashboardStats", null);
exports.AdminController = AdminController = __decorate([
    (0, swagger_1.ApiTags)('Admin'),
    (0, common_1.Controller)('admin'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [admin_service_1.AdminService])
], AdminController);
//# sourceMappingURL=admin.controller.js.map