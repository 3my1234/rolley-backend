import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { USDT_WATCHER_SYSTEM_CONFIG_KEY } from './usdt-watcher.constants';

@Injectable()
export class UsdtWatcherStateService {
  constructor(private readonly prisma: PrismaService) {}

  async getLastProcessedBlock(): Promise<number | null> {
    const record = await this.prisma.systemConfig.findUnique({
      where: { key: USDT_WATCHER_SYSTEM_CONFIG_KEY },
    });
    if (!record) {
      return null;
    }
    const parsed = Number(record.value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  async setLastProcessedBlock(blockNumber: number) {
    const value = blockNumber.toString();
    await this.prisma.systemConfig.upsert({
      where: { key: USDT_WATCHER_SYSTEM_CONFIG_KEY },
      create: {
        key: USDT_WATCHER_SYSTEM_CONFIG_KEY,
        value,
        description: 'Tracks the last processed Polygon block for USDT deposits',
      },
      update: {
        value,
      },
    });
  }
}

