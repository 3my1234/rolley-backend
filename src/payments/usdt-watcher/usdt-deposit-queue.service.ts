import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue, Worker, JobsOptions } from 'bullmq';
import Redis from 'ioredis';
import { ethers } from 'ethers';
import {
  DEFAULT_CONFIRMATIONS,
  DEFAULT_REDIS_URL,
} from './usdt-watcher.constants';
import { UsdtDepositJob } from './usdt-watcher.types';
import { WalletService } from '../../wallet/wallet.service';

const QUEUE_NAME = 'usdt-deposit-confirmations';

@Injectable()
export class UsdtDepositQueueService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(UsdtDepositQueueService.name);
  private connection: Redis | null = null;
  private queue: Queue<UsdtDepositJob> | null = null;
  private worker: Worker<UsdtDepositJob> | null = null;
  private provider: ethers.JsonRpcProvider;
  private cachedBlockNumber: number | null = null;
  private cachedBlockFetchedAt = 0;
  private readonly blockNumberCacheMs: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly walletService: WalletService,
  ) {
    const rpc =
      process.env.POLYGON_RPC_URL || 'https://polygon.llamarpc.com';
    this.provider = new ethers.JsonRpcProvider(rpc);
    this.blockNumberCacheMs = Math.max(
      1000,
      Number(this.configService.get('USDT_QUEUE_BLOCK_CACHE_MS') ?? 5000),
    );
  }

  async onModuleInit() {
    try {
      const redisUrl =
        this.configService.get<string>('REDIS_URL') ?? DEFAULT_REDIS_URL;
      
      // Test Redis connection
      this.connection = new Redis(redisUrl, {
        maxRetriesPerRequest: null,
        retryStrategy: () => null, // Disable automatic reconnection
        lazyConnect: true,
      });

      // Try to connect, but don't crash if Redis is unavailable
      await this.connection.connect();
      
      this.queue = new Queue<UsdtDepositJob>(QUEUE_NAME, {
        connection: this.connection,
      });
      this.worker = new Worker<UsdtDepositJob>(
        QUEUE_NAME,
        async (job) => this.processJob(job.data),
        {
          connection: this.connection,
          concurrency: Number(
            this.configService.get('USDT_QUEUE_CONCURRENCY') ?? 5,
          ),
        },
      );

      this.worker.on('completed', (job) => {
        this.logger.debug(`USDT deposit job ${job.id} completed`);
      });

      this.worker.on('failed', (job, err) => {
        this.logger.error(
          `USDT deposit job ${job?.id ?? 'unknown'} failed: ${err?.message}`,
          err?.stack,
        );
      });

      this.logger.log('USDT deposit queue initialized');
    } catch (error) {
      this.logger.warn(
        `Redis not available (${error?.message ?? 'unknown error'}). USDT deposit queue will use in-memory fallback.`,
      );
      // Continue without Redis - the app should still work with polling only
      this.connection = null;
      this.queue = null;
      this.worker = null;
    }
  }

  async onModuleDestroy() {
    try {
      await Promise.all([
        this.worker?.close(),
        this.queue?.close(),
        this.connection?.quit(),
      ]);
    } catch (error) {
      this.logger.warn(`Error closing Redis connections: ${error?.message}`);
    }
  }

  async enqueueDeposit(payload: UsdtDepositJob) {
    if (!this.queue) {
      // If Redis is not available, process immediately without queuing
      this.logger.debug(
        `Redis unavailable - processing USDT deposit immediately: ${payload.txHash}`,
      );
      try {
        await this.processJob(payload);
      } catch (error) {
        this.logger.error(
          `Failed to process USDT deposit directly: ${error?.message}`,
          error?.stack,
        );
      }
      return;
    }

    const jobId = `${payload.txHash}-${payload.logIndex}`;
    const options: JobsOptions = {
      jobId,
      attempts: Number(
        this.configService.get('USDT_QUEUE_MAX_ATTEMPTS') ?? 10,
      ),
      backoff: {
        type: 'exponential',
        delay: Number(
          this.configService.get('USDT_QUEUE_RETRY_DELAY_MS') ?? 15000,
        ),
      },
      removeOnComplete: 1000,
      removeOnFail: 5000,
    };

    await this.queue.add('confirm-usdt', payload, options);
  }

  private async processJob(payload: UsdtDepositJob) {
    const confirmationsNeeded = DEFAULT_CONFIRMATIONS;
    const currentBlock = await this.getCurrentBlockNumber();
    const confirmations = currentBlock - payload.blockNumber;

    if (confirmations < confirmationsNeeded) {
      throw new Error(
        `Not enough confirmations (${confirmations}/${confirmationsNeeded})`,
      );
    }

    try {
      await this.walletService.confirmUsdtDeposit({
        walletAddress: payload.toAddress,
        amount: payload.amount,
        txHash: payload.txHash,
        source: 'watcher',
        metadata: {
          fromAddress: payload.fromAddress,
          blockNumber: payload.blockNumber,
          logIndex: payload.logIndex,
          network: payload.network,
        },
      });
    } catch (error) {
      if (this.shouldDropJob(error)) {
        this.logger.warn(
          `Dropping USDT job ${payload.txHash}-${payload.logIndex}: ${error.message}`,
        );
        return;
      }
      throw error;
    }
  }

  private async getCurrentBlockNumber(): Promise<number> {
    const now = Date.now();
    if (
      this.cachedBlockNumber !== null &&
      now - this.cachedBlockFetchedAt < this.blockNumberCacheMs
    ) {
      return this.cachedBlockNumber;
    }
    const blockNumber = await this.provider.getBlockNumber();
    this.cachedBlockNumber = blockNumber;
    this.cachedBlockFetchedAt = now;
    return blockNumber;
  }

  private shouldDropJob(error: unknown): boolean {
    if (!error || typeof error !== 'object') {
      return false;
    }
    if (error instanceof BadRequestException) {
      const message = (error.message ?? '').toLowerCase();
      return (
        message.includes('no user is associated') ||
        message.includes('invalid wallet address')
      );
    }
    const message = (error as { message?: string }).message ?? '';
    return message
      .toLowerCase()
      .includes('no user is associated with the provided wallet address');
  }
}

