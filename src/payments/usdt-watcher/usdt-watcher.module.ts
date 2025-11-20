import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../prisma/prisma.module';
import { WalletModule } from '../../wallet/wallet.module';
import { UsdtAddressRegistryService } from './usdt-address-registry.service';
import { UsdtWatcherStateService } from './usdt-watcher-state.service';
import { UsdtWatcherService } from './usdt-watcher.service';
import { UsdtDepositQueueService } from './usdt-deposit-queue.service';

@Module({
  imports: [ConfigModule, PrismaModule, WalletModule],
  providers: [
    UsdtAddressRegistryService,
    UsdtWatcherStateService,
    UsdtWatcherService,
    UsdtDepositQueueService,
  ],
  exports: [UsdtWatcherService],
})
export class UsdtWatcherModule {}

