"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_module_1 = require("./prisma/prisma.module");
const auth_module_1 = require("./auth/auth.module");
const users_module_1 = require("./users/users.module");
const wallet_module_1 = require("./wallet/wallet.module");
const webhooks_module_1 = require("./webhooks/webhooks.module");
const usdt_listener_module_1 = require("./wallet/usdt-listener.module");
const tokens_module_1 = require("./tokens/tokens.module");
const blockchain_module_1 = require("./blockchain/blockchain.module");
const stakes_module_1 = require("./stakes/stakes.module");
const daily_events_module_1 = require("./daily-events/daily-events.module");
const transactions_module_1 = require("./transactions/transactions.module");
const admin_module_1 = require("./admin/admin.module");
const usdt_watcher_module_1 = require("./payments/usdt-watcher/usdt-watcher.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
            }),
            prisma_module_1.PrismaModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            wallet_module_1.WalletModule,
            webhooks_module_1.WebhooksModule,
            usdt_listener_module_1.UsdtListenerModule,
            tokens_module_1.TokensModule,
            blockchain_module_1.BlockchainModule,
            stakes_module_1.StakesModule,
            daily_events_module_1.DailyEventsModule,
            transactions_module_1.TransactionsModule,
            admin_module_1.AdminModule,
            usdt_watcher_module_1.UsdtWatcherModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map