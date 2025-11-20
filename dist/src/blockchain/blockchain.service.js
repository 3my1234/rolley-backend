"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlockchainService = void 0;
const common_1 = require("@nestjs/common");
const ethers_1 = require("ethers");
let BlockchainService = class BlockchainService {
    constructor() {
        this.provider = new ethers_1.ethers.JsonRpcProvider(process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com');
        this.signer = new ethers_1.ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY || '', this.provider);
        const ROL_TOKEN_ABI = [
            'function transfer(address to, uint256 amount) external returns (bool)',
            'function balanceOf(address account) external view returns (uint256)',
            'function mint(address to, uint256 amount, string memory reason) external',
            'function authorizeMinter(address minter) external',
            'function totalSupply() external view returns (uint256)',
        ];
        this.contract = new ethers_1.ethers.Contract(process.env.CONTRACT_ADDRESS || '', ROL_TOKEN_ABI, this.signer);
    }
    async sendRolTokens(recipientAddress, rolAmount, reason) {
        try {
            const amountWei = ethers_1.ethers.parseEther(rolAmount.toString());
            const tx = await this.contract.transfer(recipientAddress, amountWei);
            const receipt = await tx.wait();
            return {
                success: true,
                txHash: receipt.hash,
            };
        }
        catch (error) {
            console.error('Error sending ROL tokens:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    async getTokenBalance(address) {
        try {
            const balance = await this.contract.balanceOf(address);
            return parseFloat(ethers_1.ethers.formatEther(balance));
        }
        catch (error) {
            console.error('Error getting token balance:', error);
            return 0;
        }
    }
    async mintRolTokens(recipientAddress, rolAmount, reason) {
        try {
            if (!process.env.CONTRACT_ADDRESS || process.env.CONTRACT_ADDRESS === '') {
                console.warn('⚠️  CONTRACT_ADDRESS not set - skipping blockchain mint (using database only)');
                return {
                    success: false,
                    error: 'Contract address not configured',
                };
            }
            const amountWei = ethers_1.ethers.parseEther(rolAmount.toString());
            const tx = await this.contract.mint(recipientAddress, amountWei, reason);
            const receipt = await tx.wait();
            console.log(`✅ Minted ${rolAmount} ROL to ${recipientAddress}. Tx: ${receipt.hash}`);
            return {
                success: true,
                txHash: receipt.hash,
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error('Error minting ROL tokens:', errorMessage);
            if (errorMessage.includes('not deployed') || errorMessage.includes('invalid address')) {
                console.warn('⚠️  Contract not deployed - continuing with database-only mode');
                return {
                    success: false,
                    error: 'Contract not deployed - using database only',
                };
            }
            return {
                success: false,
                error: errorMessage,
            };
        }
    }
    async authorizeMinter(minterAddress) {
        try {
            const tx = await this.contract.authorizeMinter(minterAddress);
            const receipt = await tx.wait();
            console.log(`✅ Authorized minter: ${minterAddress}. Tx: ${receipt.hash}`);
            return {
                success: true,
                txHash: receipt.hash,
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error('Error authorizing minter:', errorMessage);
            return {
                success: false,
                error: errorMessage,
            };
        }
    }
};
exports.BlockchainService = BlockchainService;
exports.BlockchainService = BlockchainService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], BlockchainService);
//# sourceMappingURL=blockchain.service.js.map