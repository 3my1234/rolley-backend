import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ethers } from 'ethers';
import { DEFAULT_REGISTRY_REFRESH_INTERVAL } from './usdt-watcher.constants';

@Injectable()
export class UsdtAddressRegistryService {
  private readonly logger = new Logger(UsdtAddressRegistryService.name);
  private addressSet: Set<string> = new Set();
  private refreshTimer: NodeJS.Timeout | null = null;
  private lastRefreshedAt: Date | null = null;
  private addressesCount = 0;

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.refreshAddresses();
    this.startAutoRefresh();
  }

  async onModuleDestroy() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
  }

  private startAutoRefresh() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
    this.refreshTimer = setInterval(() => {
      this.refreshAddresses().catch((error) => {
        this.logger.error('Failed to refresh USDT address registry', error);
      });
    }, DEFAULT_REGISTRY_REFRESH_INTERVAL);
  }

  async refreshAddresses() {
    const users = await this.prisma.user.findMany({
      where: { walletAddress: { not: null } },
      select: { walletAddress: true },
    });

    const normalized = users
      .map((user) => user.walletAddress)
      .filter((addr): addr is string => Boolean(addr))
      .map((addr) => {
        try {
          return ethers.getAddress(addr).toLowerCase();
        } catch {
          return addr.toLowerCase();
        }
      });

    this.addressSet = new Set(normalized);
    this.addressesCount = this.addressSet.size;
    this.lastRefreshedAt = new Date();

    if (!this.addressesCount) {
      this.logger.warn('No wallet addresses found for USDT registry');
    } else {
      this.logger.log(
        `Loaded ${this.addressesCount} wallet addresses into USDT registry`,
      );
    }
  }

  hasAddress(address: string) {
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
}

