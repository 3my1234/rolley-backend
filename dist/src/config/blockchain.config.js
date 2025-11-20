"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("@nestjs/config");
exports.default = (0, config_1.registerAs)('blockchain', () => ({
    polygonRpcUrl: process.env.POLYGON_RPC_URL,
    amoyRpcUrl: process.env.AMOY_RPC_URL,
    mumbaiRpcUrl: process.env.MUMBAI_RPC_URL,
    deployerPrivateKey: process.env.DEPLOYER_PRIVATE_KEY,
    contractAddress: process.env.CONTRACT_ADDRESS,
    polygonscanApiKey: process.env.POLYGONSCAN_API_KEY,
    tokenName: process.env.TOKEN_NAME || 'Rolley',
    tokenSymbol: process.env.TOKEN_SYMBOL || 'ROL',
    tokenDecimals: parseInt(process.env.TOKEN_DECIMALS || '18'),
    tokenMaxSupply: process.env.TOKEN_MAX_SUPPLY,
    tokenInitialSupply: process.env.TOKEN_INITIAL_SUPPLY,
    tokenValueUsd: parseFloat(process.env.TOKEN_VALUE_USD || '0.001'),
    network: process.env.NODE_ENV === 'production' ? 'mainnet' : 'testnet',
    chainId: process.env.NODE_ENV === 'production' ? 137 : 80002,
}));
//# sourceMappingURL=blockchain.config.js.map