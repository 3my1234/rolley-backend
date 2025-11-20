import { Module } from '@nestjs/common';
import { UsdtListenerService } from './usdt-listener.service';
import { PrismaModule } from '../prisma/prisma.module';
import { WalletModule } from './wallet.module';

@Module({
  imports: [PrismaModule, WalletModule],
  providers: [UsdtListenerService],
  exports: [UsdtListenerService],
})
export class UsdtListenerModule {}
