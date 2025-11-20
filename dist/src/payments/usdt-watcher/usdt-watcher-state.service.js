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
exports.UsdtWatcherStateService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const usdt_watcher_constants_1 = require("./usdt-watcher.constants");
let UsdtWatcherStateService = class UsdtWatcherStateService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getLastProcessedBlock() {
        const record = await this.prisma.systemConfig.findUnique({
            where: { key: usdt_watcher_constants_1.USDT_WATCHER_SYSTEM_CONFIG_KEY },
        });
        if (!record) {
            return null;
        }
        const parsed = Number(record.value);
        return Number.isFinite(parsed) ? parsed : null;
    }
    async setLastProcessedBlock(blockNumber) {
        const value = blockNumber.toString();
        await this.prisma.systemConfig.upsert({
            where: { key: usdt_watcher_constants_1.USDT_WATCHER_SYSTEM_CONFIG_KEY },
            create: {
                key: usdt_watcher_constants_1.USDT_WATCHER_SYSTEM_CONFIG_KEY,
                value,
                description: 'Tracks the last processed Polygon block for USDT deposits',
            },
            update: {
                value,
            },
        });
    }
};
exports.UsdtWatcherStateService = UsdtWatcherStateService;
exports.UsdtWatcherStateService = UsdtWatcherStateService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsdtWatcherStateService);
//# sourceMappingURL=usdt-watcher-state.service.js.map