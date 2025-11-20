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
var UsdtAddressRegistryService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsdtAddressRegistryService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const ethers_1 = require("ethers");
const usdt_watcher_constants_1 = require("./usdt-watcher.constants");
let UsdtAddressRegistryService = UsdtAddressRegistryService_1 = class UsdtAddressRegistryService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(UsdtAddressRegistryService_1.name);
        this.addressSet = new Set();
        this.refreshTimer = null;
        this.lastRefreshedAt = null;
        this.addressesCount = 0;
    }
    async onModuleInit() {
        await this.refreshAddresses();
        this.startAutoRefresh();
    }
    async onModuleDestroy() {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
        }
    }
    startAutoRefresh() {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
        }
        this.refreshTimer = setInterval(() => {
            this.refreshAddresses().catch((error) => {
                this.logger.error('Failed to refresh USDT address registry', error);
            });
        }, usdt_watcher_constants_1.DEFAULT_REGISTRY_REFRESH_INTERVAL);
    }
    async refreshAddresses() {
        const users = await this.prisma.user.findMany({
            where: { walletAddress: { not: null } },
            select: { walletAddress: true },
        });
        const normalized = users
            .map((user) => user.walletAddress)
            .filter((addr) => Boolean(addr))
            .map((addr) => {
            try {
                return ethers_1.ethers.getAddress(addr).toLowerCase();
            }
            catch {
                return addr.toLowerCase();
            }
        });
        this.addressSet = new Set(normalized);
        this.addressesCount = this.addressSet.size;
        this.lastRefreshedAt = new Date();
        if (!this.addressesCount) {
            this.logger.warn('No wallet addresses found for USDT registry');
        }
        else {
            this.logger.log(`Loaded ${this.addressesCount} wallet addresses into USDT registry`);
        }
    }
    hasAddress(address) {
        if (!address) {
            return false;
        }
        const normalized = address.toLowerCase();
        return this.addressSet.has(normalized);
    }
    getSummary() {
        return {
            addresses: this.addressesCount,
            lastRefreshedAt: this.lastRefreshedAt,
        };
    }
};
exports.UsdtAddressRegistryService = UsdtAddressRegistryService;
exports.UsdtAddressRegistryService = UsdtAddressRegistryService = UsdtAddressRegistryService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsdtAddressRegistryService);
//# sourceMappingURL=usdt-address-registry.service.js.map