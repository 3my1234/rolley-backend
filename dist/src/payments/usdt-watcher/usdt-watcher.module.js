"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsdtWatcherModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_module_1 = require("../../prisma/prisma.module");
const wallet_module_1 = require("../../wallet/wallet.module");
const usdt_address_registry_service_1 = require("./usdt-address-registry.service");
const usdt_watcher_state_service_1 = require("./usdt-watcher-state.service");
const usdt_watcher_service_1 = require("./usdt-watcher.service");
const usdt_deposit_queue_service_1 = require("./usdt-deposit-queue.service");
let UsdtWatcherModule = class UsdtWatcherModule {
};
exports.UsdtWatcherModule = UsdtWatcherModule;
exports.UsdtWatcherModule = UsdtWatcherModule = __decorate([
    (0, common_1.Module)({
        imports: [config_1.ConfigModule, prisma_module_1.PrismaModule, wallet_module_1.WalletModule],
        providers: [
            usdt_address_registry_service_1.UsdtAddressRegistryService,
            usdt_watcher_state_service_1.UsdtWatcherStateService,
            usdt_watcher_service_1.UsdtWatcherService,
            usdt_deposit_queue_service_1.UsdtDepositQueueService,
        ],
        exports: [usdt_watcher_service_1.UsdtWatcherService],
    })
], UsdtWatcherModule);
//# sourceMappingURL=usdt-watcher.module.js.map