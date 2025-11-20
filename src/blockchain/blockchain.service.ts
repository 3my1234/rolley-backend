import { Injectable } from '@nestjs/common';
import { ethers } from 'ethers';

@Injectable()
export class BlockchainService {
  private provider: ethers.JsonRpcProvider;
  private signer: ethers.Wallet;
  private contract: ethers.Contract;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(
      process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com'
    );
    
    this.signer = new ethers.Wallet(
      process.env.DEPLOYER_PRIVATE_KEY || '',
      this.provider
    );
    
    // ROL Token ABI (includes mint function for on-demand minting)
    const ROL_TOKEN_ABI = [
      'function transfer(address to, uint256 amount) external returns (bool)',
      'function balanceOf(address account) external view returns (uint256)',
      'function mint(address to, uint256 amount, string memory reason) external',
      'function authorizeMinter(address minter) external',
      'function totalSupply() external view returns (uint256)',
    ];
    
    this.contract = new ethers.Contract(
      process.env.CONTRACT_ADDRESS || '',
      ROL_TOKEN_ABI,
      this.signer
    );
  }

  async sendRolTokens(
    recipientAddress: string,
    rolAmount: number,
    reason: string
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      const amountWei = ethers.parseEther(rolAmount.toString());
      
      // Send tokens using transfer
      const tx = await this.contract.transfer(recipientAddress, amountWei);
      const receipt = await tx.wait();
      
      return {
        success: true,
        txHash: receipt.hash,
      };
    } catch (error: unknown) {
      console.error('Error sending ROL tokens:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getTokenBalance(address: string): Promise<number> {
    try {
      const balance = await this.contract.balanceOf(address);
      return parseFloat(ethers.formatEther(balance));
    } catch (error) {
      console.error('Error getting token balance:', error);
      return 0;
    }
  }

  /**
   * Mint new ROL tokens on-demand (when users buy ROL with USD/USDT)
   * @param recipientAddress Address to receive tokens
   * @param rolAmount Amount of ROL tokens to mint
   * @param reason Reason for minting (e.g., "Flutterwave payment: $100 USD")
   */
  async mintRolTokens(
    recipientAddress: string,
    rolAmount: number,
    reason: string
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      // Validate contract address is set
      if (!process.env.CONTRACT_ADDRESS || process.env.CONTRACT_ADDRESS === '') {
        console.warn('⚠️  CONTRACT_ADDRESS not set - skipping blockchain mint (using database only)');
        return {
          success: false,
          error: 'Contract address not configured',
        };
      }

      const amountWei = ethers.parseEther(rolAmount.toString());
      
      // Call mint function on contract
      const tx = await this.contract.mint(recipientAddress, amountWei, reason);
      const receipt = await tx.wait();
      
      console.log(`✅ Minted ${rolAmount} ROL to ${recipientAddress}. Tx: ${receipt.hash}`);
      
      return {
        success: true,
        txHash: receipt.hash,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error minting ROL tokens:', errorMessage);
      
      // If contract not deployed yet, allow database-only mode
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

  /**
   * Authorize a minter address (typically called once after deployment)
   * @param minterAddress Address to authorize for minting
   */
  async authorizeMinter(minterAddress: string): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      const tx = await this.contract.authorizeMinter(minterAddress);
      const receipt = await tx.wait();
      
      console.log(`✅ Authorized minter: ${minterAddress}. Tx: ${receipt.hash}`);
      
      return {
        success: true,
        txHash: receipt.hash,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error authorizing minter:', errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }
}
