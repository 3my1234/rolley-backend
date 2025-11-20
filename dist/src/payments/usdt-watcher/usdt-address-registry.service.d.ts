import { PrismaService } from '../../prisma/prisma.service';
export declare class UsdtAddressRegistryService {
    private readonly prisma;
    private readonly logger;
    private addressSet;
    private refreshTimer;
    private lastRefreshedAt;
    private addressesCount;
    constructor(prisma: PrismaService);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    private startAutoRefresh;
    refreshAddresses(): Promise<void>;
    hasAddress(address: string): boolean;
    getSummary(): {
        addresses: number;
        lastRefreshedAt: Date;
    };
}
