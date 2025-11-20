import { registerAs } from '@nestjs/config';

export default registerAs('blockchain', () => ({
  // RPC URLs
  polygonRpcUrl: process.env.POLYGON_RPC_URL,
  amoyRpcUrl: process.env.AMOY_RPC_URL,
  mumbaiRpcUrl: process.env.MUMBAI_RPC_URL,
  
  // Wallet
  deployerPrivateKey: process.env.DEPLOYER_PRIVATE_KEY,
  
  // Contract
  contractAddress: process.env.CONTRACT_ADDRESS,
  
  // API Keys
  polygonscanApiKey: process.env.POLYGONSCAN_API_KEY,
  
  // Token Configuration
  tokenName: process.env.TOKEN_NAME || 'Rolley',
  tokenSymbol: process.env.TOKEN_SYMBOL || 'ROL',
  tokenDecimals: parseInt(process.env.TOKEN_DECIMALS || '18'),
  tokenMaxSupply: process.env.TOKEN_MAX_SUPPLY,
  tokenInitialSupply: process.env.TOKEN_INITIAL_SUPPLY,
  tokenValueUsd: parseFloat(process.env.TOKEN_VALUE_USD || '0.001'),
  
  // Network Configuration
  network: process.env.NODE_ENV === 'production' ? 'mainnet' : 'testnet',
  chainId: process.env.NODE_ENV === 'production' ? 137 : 80002, // Polygon Mainnet : Amoy Testnet
}));
