import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ethers } from 'ethers';
import { WalletService } from './wallet.service';

// USDT contract address on Polygon network
// USDT on Polygon is bridged from Ethereum - same contract logic
const USDT_CONTRACT_ADDRESS = '0xc2132D05D31c914a87C6611C10748AEb04B58e8F'; // USDT on Polygon
const USDT_ABI = [
  'event Transfer(address indexed from, address indexed to, uint256 value)',
];

interface PendingDeposit {
  id: string;
  userId: string;
  walletAddress: string;
  expectedAmount: number;
  createdAt: Date;
}

@Injectable()
export class UsdtListenerService {
  private readonly logger = new Logger(UsdtListenerService.name);
  private provider: ethers.JsonRpcProvider;
  private usdtContract: ethers.Contract;
  private isRunning = false;
  private lastCheckedBlock: number | null = null;
  private readonly MAX_BLOCK_BATCH = 200;
  private readonly INITIAL_LOOKBACK = 500;

  constructor(
    private prisma: PrismaService,
    private walletService: WalletService,
  ) {
    // Initialize Polygon provider with timeout
    const rpcUrl = process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com';
    this.provider = new ethers.JsonRpcProvider(rpcUrl, undefined, {
      staticNetwork: null,
      batchMaxCount: 1, // Disable batching to avoid timeout issues
    });
    // Set request timeout to 15 seconds
    (this.provider as any)._getConnection = (this.provider as any)._getConnection || function() {};
    this.usdtContract = new ethers.Contract(
      USDT_CONTRACT_ADDRESS,
      USDT_ABI,
      this.provider,
    );
  }

  async startListening() {
    if (this.isRunning) {
      this.logger.warn('USDT listener is already running');
      return;
    }

    this.isRunning = true;
    this.logger.log('🚀 USDT deposit listener started on Polygon network');

    // Poll for new deposits every 30 seconds
    setInterval(async () => {
      await this.checkPendingDeposits();
    }, 30000);

    // Initial check
    await this.checkPendingDeposits();
  }

  private async checkPendingDeposits() {
    try {
      const currentBlock = await this.provider.getBlockNumber();

      // Get all pending USDT deposits
      const pendingTransactions = await this.prisma.transaction.findMany({
        where: {
          type: 'DEPOSIT',
          currency: 'USDT',
          status: 'PENDING',
          paymentMethod: 'privy',
        },
        include: {
          user: {
            select: {
              id: true,
              walletAddress: true,
            },
          },
        },
      });

      if (pendingTransactions.length === 0) {
        return;
      }

      this.logger.log(`Checking ${pendingTransactions.length} pending USDT deposits`);

      // Get all unique wallet addresses we're monitoring (normalize to checksum)
      const walletAddresses = Array.from(
        new Set(
          pendingTransactions
            .map((tx) => {
              const addr = tx.user.walletAddress;
              if (!addr) return null;
              try {
                return ethers.getAddress(addr); // Normalize to checksum format
              } catch {
                return addr.toLowerCase();
              }
            })
            .filter((addr): addr is string => !!addr),
        ),
      );

      if (walletAddresses.length === 0) {
        return;
      }

      let encounteredError = false;

      // Check each wallet for USDT transfers
      for (const walletAddress of walletAddresses) {
        const success = await this.checkWalletDeposits(
          walletAddress,
          pendingTransactions,
          currentBlock,
        );
        if (!success) {
          encounteredError = true;
        }
      }

      if (!encounteredError) {
        this.lastCheckedBlock = currentBlock;
      }
    } catch (error) {
      this.logger.error('Error checking pending deposits:', error);
    }
  }

  private async checkWalletDeposits(
    walletAddress: string,
    pendingTransactions: any[],
    currentBlock: number,
  ): Promise<boolean> {
    try {
      // Normalize wallet address for comparison
      const normalizedWalletAddress = ethers.getAddress(walletAddress);

      // Get transactions for this wallet
      const walletTxs = pendingTransactions.filter((tx) => {
        if (!tx.user.walletAddress) return false;
        const txAddr = ethers.getAddress(tx.user.walletAddress);
        return txAddr === normalizedWalletAddress;
      });

      // Query USDT Transfer events to this wallet
      // Look back 24 hours to cover pending deposits
      const fromBlock = (() => {
        if (this.lastCheckedBlock !== null) {
          const nextBlock = this.lastCheckedBlock + 1;
          return Math.max(
            0,
            Math.min(nextBlock, currentBlock),
            currentBlock - this.INITIAL_LOOKBACK,
          );
        }
        return Math.max(0, currentBlock - this.INITIAL_LOOKBACK);
      })();

      const toBlock = currentBlock;

      const events = await this.fetchTransferEvents(
        normalizedWalletAddress,
        fromBlock,
        toBlock,
      );

      this.logger.debug(
        `Found ${events.length} USDT transfers to ${walletAddress}`,
      );

      for (const event of events) {
        // Parse the event to get args (ethers v6)
        let parsedEvent;
        try {
          parsedEvent = this.usdtContract.interface.parseLog({
            topics: event.topics as string[],
            data: event.data,
          });
        } catch (error) {
          this.logger.debug(`Failed to parse event: ${error}`);
          continue;
        }

        if (!parsedEvent || !parsedEvent.args) continue;

        const recipient = ethers.getAddress(parsedEvent.args.to as string); // Normalize address
        const amount = Number(ethers.formatUnits(parsedEvent.args.value as bigint, 6)); // USDT has 6 decimals
        const txHash = event.transactionHash;
        const blockNumber = event.blockNumber;

        // Verify recipient matches our wallet (safety check)
        if (recipient.toLowerCase() !== normalizedWalletAddress.toLowerCase()) {
          continue;
        }

        // Check if this transfer matches any pending deposit
        for (const pendingTx of walletTxs) {
          // Skip if already processed
          if (pendingTx.status !== 'PENDING') continue;

          // Check if amount matches (within 0.1 USDT tolerance for rounding)
          const expectedAmount = Number(pendingTx.amount);
          if (Math.abs(amount - expectedAmount) > 0.1) {
            continue;
          }

          // Check if this transaction hasn't been processed yet
          const existingTx = await this.prisma.transaction.findUnique({
            where: { externalId: txHash },
          });

          if (existingTx) {
            continue;
          }

          // Verify transaction is confirmed (at least 3 blocks)
          const currentBlock = await this.provider.getBlockNumber();
          const confirmations = currentBlock - Number(blockNumber);

          if (confirmations < 3) {
            this.logger.debug(
              `Transaction ${txHash} needs more confirmations (${confirmations}/3)`,
            );
            continue;
          }

          // Match found! Update transaction and balance
          await this.walletService.confirmUsdtDeposit({
            walletAddress,
            amount,
            txHash,
            source: 'listener',
            metadata: {
              blockNumber,
              detectedBy: 'listener',
            },
          });
        }
      }

      return true;
    } catch (error) {
      this.logger.error(
        `Error checking deposits for wallet ${walletAddress}:`,
        error,
      );
      return false;
    }
  }

  private async fetchTransferEvents(
    normalizedWalletAddress: string,
    fromBlock: number,
    toBlock: number,
  ): Promise<ethers.Log[]> {
    const events: ethers.Log[] = [];
    let start = fromBlock;
    let batchSize = this.MAX_BLOCK_BATCH;
    const transferTopic = ethers.id('Transfer(address,address,uint256)');
    const toTopic = ethers.zeroPadValue(normalizedWalletAddress, 32);

    while (start <= toBlock) {
      const end = Math.min(start + batchSize, toBlock);

      try {
        const batch = await this.provider.getLogs({
          address: USDT_CONTRACT_ADDRESS,
          topics: [transferTopic, null, toTopic],
          fromBlock: start,
          toBlock: end,
        });
        events.push(...batch);
        start = end + 1;
        batchSize = this.MAX_BLOCK_BATCH;
      } catch (error: any) {
        const message = error?.message?.toLowerCase() ?? '';
        const isRangeError =
          message.includes('block range') ||
          message.includes('range') ||
          error?.code === -32062;

        if (isRangeError && batchSize > 10) {
          batchSize = Math.max(10, Math.floor(batchSize / 2));
          this.logger.debug(
            `Reducing block batch size to ${batchSize} to satisfy RPC limits`,
          );
          continue;
        }

        if (message.includes('timeout') || error?.code === 'TIMEOUT') {
          this.logger.warn(`Timeout while fetching logs [${start}, ${end}]`);
          return events;
        }

        throw error;
      }
    }

    return events;
  }

}
