import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { WalletModule } from './wallet/wallet.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { UsdtListenerModule } from './wallet/usdt-listener.module';
import { TokensModule } from './tokens/tokens.module';
import { BlockchainModule } from './blockchain/blockchain.module';
import { StakesModule } from './stakes/stakes.module';
import { DailyEventsModule } from './daily-events/daily-events.module';
import { TransactionsModule } from './transactions/transactions.module';
import { AdminModule } from './admin/admin.module';
import { UsdtWatcherModule } from './payments/usdt-watcher/usdt-watcher.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    WalletModule,
    WebhooksModule,
    UsdtListenerModule,
    TokensModule,
    BlockchainModule,
    StakesModule,
    DailyEventsModule,
    TransactionsModule,
    AdminModule,
    UsdtWatcherModule,
    HealthModule,
  ],
})
export class AppModule {}