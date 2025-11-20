export const USDT_POLYGON_CONTRACT =
  process.env.USDT_POLYGON_CONTRACT ??
  '0xc2132D05D31c914a87C6611C10748AEb04B58e8F';

export const USDT_TRANSFER_ABI = [
  'event Transfer(address indexed from, address indexed to, uint256 value)',
];

export const USDT_WATCHER_SYSTEM_CONFIG_KEY = 'usdt_watcher:last_block';

export const DEFAULT_REDIS_URL = 'redis://127.0.0.1:6379';

export const DEFAULT_CONFIRMATIONS = Number(process.env.USDT_CONFIRMATIONS ?? 3);

export const DEFAULT_POLL_INTERVAL =
  Number(process.env.USDT_WATCHER_POLL_INTERVAL_MS ?? 15000);

export const DEFAULT_REGISTRY_REFRESH_INTERVAL =
  Number(process.env.USDT_REGISTRY_REFRESH_INTERVAL_MS ?? 10 * 60 * 1000);

