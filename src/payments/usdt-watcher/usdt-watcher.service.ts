import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import {
  DEFAULT_POLL_INTERVAL,
  DEFAULT_CONFIRMATIONS,
  USDT_POLYGON_CONTRACT,
  USDT_TRANSFER_ABI,
} from './usdt-watcher.constants';
import { UsdtAddressRegistryService } from './usdt-address-registry.service';
import { UsdtDepositQueueService } from './usdt-deposit-queue.service';
import { UsdtWatcherStateService } from './usdt-watcher-state.service';
import { UsdtWatcherEventPayload } from './usdt-watcher.types';

@Injectable()
export class UsdtWatcherService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(UsdtWatcherService.name);
  private readonly httpProvider: ethers.JsonRpcProvider;
  private readonly pollBatchSize: number;
  private readonly maxRequestSpan: number;
  private readonly maxCatchUpBlocks: number;
  private websocketProvider: ethers.WebSocketProvider | null = null;
  private readonly usdtInterface = new ethers.Interface(USDT_TRANSFER_ABI);
  private pollTimer: NodeJS.Timeout | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly registry: UsdtAddressRegistryService,
    private readonly queue: UsdtDepositQueueService,
    private readonly stateService: UsdtWatcherStateService,
  ) {
    const rpcUrl =
      process.env.POLYGON_RPC_URL || 'https://polygon.llamarpc.com';
    this.httpProvider = new ethers.JsonRpcProvider(rpcUrl);
    this.maxRequestSpan = Math.max(
      1,
      Number(this.configService.get('USDT_WATCHER_MAX_REQUEST_SPAN') ?? 64),
    );
    this.pollBatchSize = Number(
      this.configService.get('USDT_WATCHER_BATCH_SIZE') ??
        this.configService.get('USDT_WATCHER_MAX_BLOCK_SPAN') ??
        this.maxRequestSpan,
    );
    this.maxCatchUpBlocks = Math.max(
      this.pollBatchSize,
      Number(this.configService.get('USDT_WATCHER_MAX_CATCHUP_BLOCKS') ?? 512),
    );
  }

  async onModuleInit() {
    await this.registry.refreshAddresses();
    await this.startPollingLoop();
    await this.startWebsocketListener();
  }

  async onModuleDestroy() {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    if (this.websocketProvider) {
      await this.websocketProvider.destroy();
    }
  }

  private async startPollingLoop() {
    const interval = DEFAULT_POLL_INTERVAL;
    await this.pollOnce();
    this.pollTimer = setInterval(() => {
      this.pollOnce().catch((err) =>
        this.logger.error('USDT watcher poll failed', err),
      );
    }, interval);
  }

  private async pollOnce() {
    const currentBlock = await this.httpProvider.getBlockNumber();
    const lastProcessed =
      (await this.stateService.getLastProcessedBlock()) ??
      currentBlock - DEFAULT_CONFIRMATIONS;
    const fromBlock = Math.max(
      lastProcessed + 1,
      currentBlock - this.maxCatchUpBlocks,
    );
    const toBlock = currentBlock - 1;

    if (toBlock < fromBlock) {
      return;
    }

    const batchSize = this.pollBatchSize;
    let start = fromBlock;
    while (start <= toBlock) {
      let end = Math.min(start + batchSize - 1, toBlock);
      try {
        await this.processBlockRange(start, end);
        await this.stateService.setLastProcessedBlock(end);
        start = end + 1;
      } catch (error) {
        if (this.isTimeoutError(error) || this.isBlockRangeError(error)) {
          this.logger.warn(
            `USDT watcher throttling range ${start}-${end}: ${error.message}`,
          );
          const reducedSpan = Math.max(1, Math.floor((end - start + 1) / 2));
          if (reducedSpan === end - start + 1) {
            // span is already 1, skip troublesome block
            await this.stateService.setLastProcessedBlock(start);
            start += 1;
          } else {
            end = start + reducedSpan - 1;
          }
          continue;
        }
        throw error;
      }
    }
  }

  private async processBlockRange(fromBlock: number, toBlock: number) {
    let start = fromBlock;
    while (start <= toBlock) {
      const end = Math.min(start + this.maxRequestSpan - 1, toBlock);
      await this.fetchAndHandleLogs(start, end);
      start = end + 1;
    }
  }

  private async fetchAndHandleLogs(
    fromBlock: number,
    toBlock: number,
  ): Promise<void> {
    const transferTopic = ethers.id('Transfer(address,address,uint256)');
    let start = fromBlock;
    let end = toBlock;

    while (start <= end) {
      try {
        const logs = await this.httpProvider.getLogs({
          address: USDT_POLYGON_CONTRACT,
          fromBlock: start,
          toBlock: end,
          topics: [transferTopic],
        });

        for (const log of logs) {
          await this.handleLog(log);
        }

        return;
      } catch (error) {
        if (
          start < end &&
          (this.isBlockRangeError(error) || this.isTimeoutError(error))
        ) {
          const span = end - start + 1;
          const reducedSpan = Math.max(1, Math.floor(span / 2));
          end = start + reducedSpan - 1;
          this.logger.warn(
            `Polygon RPC issue (${this.describeError(
              error,
            )}) for span ${span}. Retrying with ${reducedSpan} blocks.`,
          );
          continue;
        }

        throw error;
      }
    }
  }

  private isBlockRangeError(error: unknown): boolean {
    if (!error || typeof error !== 'object') {
      return false;
    }
    const rpcError = error as { code?: unknown; error?: { code?: unknown } };
    const code =
      rpcError.code ?? rpcError.error?.code ?? (rpcError as any).error?.code;
    return code === -32005 || code === -32062;
  }

  private isTimeoutError(error: unknown): boolean {
    if (!error || typeof error !== 'object') {
      return false;
    }
    const message = (error as { message?: string }).message ?? '';
    const code =
      (error as { code?: string | number }).code ??
      (error as any)?.error?.code ??
      '';
    return (
      (typeof code === 'string' && code.toUpperCase().includes('TIMEOUT')) ||
      (typeof message === 'string' &&
        message.toLowerCase().includes('timeout'))
    );
  }

  private describeError(error: unknown): string {
    if (!error || typeof error !== 'object') {
      return String(error);
    }
    const code =
      (error as { code?: string | number }).code ??
      (error as any)?.error?.code ??
      '';
    const message = (error as { message?: string }).message ?? '';
    return `${code || 'ERR'}: ${message || 'unknown error'}`;
  }

  private async startWebsocketListener() {
    const wssUrl = this.configService.get<string>('POLYGON_WSS_URL');
    if (!wssUrl) {
      this.logger.warn(
        'POLYGON_WSS_URL not configured. USDT watcher will rely on polling only.',
      );
      return;
    }

    try {
      // Create WebSocket provider and immediately attach error handlers
      // to prevent unhandled errors from crashing the backend
      this.websocketProvider = new ethers.WebSocketProvider(wssUrl);
      
      // Attach error handler BEFORE any operations to catch connection errors
      this.websocketProvider.on('error', (error) => {
        this.logger.error('Polygon websocket error (handled)', error);
        // Don't crash - just log and schedule reconnect
        this.scheduleReconnect();
      });

      // Wrap WebSocket operations in try-catch to handle any synchronous errors
      const filter = {
        address: USDT_POLYGON_CONTRACT,
        topics: [ethers.id('Transfer(address,address,uint256)')],
      };

      this.websocketProvider.on(filter, async (log) => {
        try {
          await this.handleLog(log);
          await this.stateService.setLastProcessedBlock(log.blockNumber);
        } catch (error) {
          this.logger.error('Error handling WebSocket log', error);
        }
      });

      // Note: ethers.js v6 doesn't support 'close' as a ProviderEvent
      // Reconnection is handled via error events and polling fallback
      // The polling loop will continue to work even if websocket disconnects

      this.logger.log('USDT websocket listener started');
    } catch (error) {
      this.logger.error(
        'Failed to establish Polygon websocket connection (non-fatal)',
        error,
      );
      // Don't crash - just log and continue with polling only
      this.websocketProvider = null;
      // Optionally schedule reconnect, but don't crash if it fails
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) {
      return;
    }
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.startWebsocketListener().catch((error) =>
        this.logger.error('USDT websocket reconnect failed', error),
      );
    }, 5000);
  }

  private async handleLog(log: ethers.Log) {
    if (!log.topics?.length) {
      return;
    }

    let parsed: UsdtWatcherEventPayload | null = null;

    try {
      const event = this.usdtInterface.parseLog({
        topics: log.topics as string[],
        data: log.data,
      });
      const toAddress = ethers.getAddress(event.args.to as string);
      const fromAddress = ethers.getAddress(event.args.from as string);
      const amount = Number(
        ethers.formatUnits(event.args.value as bigint, 6),
      );

      parsed = {
        txHash: log.transactionHash,
        blockNumber: Number(log.blockNumber),
        logIndex: Number((log as any).index ?? (log as any).logIndex ?? 0),
        fromAddress,
        toAddress,
        amount,
      };
    } catch (error) {
      this.logger.debug(`Failed to parse USDT log: ${error}`);
      return;
    }

    if (!parsed || !this.registry.hasAddress(parsed.toAddress)) {
      return;
    }

    await this.queue.enqueueDeposit({
      txHash: parsed.txHash,
      fromAddress: parsed.fromAddress,
      toAddress: parsed.toAddress,
      amount: parsed.amount,
      blockNumber: parsed.blockNumber,
      logIndex: parsed.logIndex,
      network: 'POLYGON',
    });
  }
}

