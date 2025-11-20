import { PrismaService } from '../../prisma/prisma.service';
export declare class UsdtWatcherStateService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getLastProcessedBlock(): Promise<number | null>;
    setLastProcessedBlock(blockNumber: number): Promise<void>;
}
