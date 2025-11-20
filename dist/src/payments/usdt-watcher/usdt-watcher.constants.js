"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_REGISTRY_REFRESH_INTERVAL = exports.DEFAULT_POLL_INTERVAL = exports.DEFAULT_CONFIRMATIONS = exports.DEFAULT_REDIS_URL = exports.USDT_WATCHER_SYSTEM_CONFIG_KEY = exports.USDT_TRANSFER_ABI = exports.USDT_POLYGON_CONTRACT = void 0;
exports.USDT_POLYGON_CONTRACT = process.env.USDT_POLYGON_CONTRACT ??
    '0xc2132D05D31c914a87C6611C10748AEb04B58e8F';
exports.USDT_TRANSFER_ABI = [
    'event Transfer(address indexed from, address indexed to, uint256 value)',
];
exports.USDT_WATCHER_SYSTEM_CONFIG_KEY = 'usdt_watcher:last_block';
exports.DEFAULT_REDIS_URL = 'redis://127.0.0.1:6379';
exports.DEFAULT_CONFIRMATIONS = Number(process.env.USDT_CONFIRMATIONS ?? 3);
exports.DEFAULT_POLL_INTERVAL = Number(process.env.USDT_WATCHER_POLL_INTERVAL_MS ?? 15000);
exports.DEFAULT_REGISTRY_REFRESH_INTERVAL = Number(process.env.USDT_REGISTRY_REFRESH_INTERVAL_MS ?? 10 * 60 * 1000);
//# sourceMappingURL=usdt-watcher.constants.js.map