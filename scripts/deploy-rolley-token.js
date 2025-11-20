/**
 * Deployment script for Rolley Token ($ROL) on Polygon
 * 
 * Tokenomics: 1 ROL = $100 USD (fixed by platform)
 * 
 * Usage (from backend directory):
 * - Testnet: npx hardhat run scripts/deploy-rolley-token.js --network amoy
 * - Mainnet: npx hardhat run scripts/deploy-rolley-token.js --network polygon
 * 
 * Prerequisites:
 * 1. Set DEPLOYER_PRIVATE_KEY in backend/.env
 * 2. Set POLYGON_RPC_URL or AMOY_RPC_URL in backend/.env
 * 3. Have MATIC for gas fees (testnet or mainnet)
 */

const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Deploying Rolley Token ($ROL) on Polygon...\n");

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  const balanceFormatted = hre.ethers.formatEther(balance);
  const networkName = hre.network.name;
  const chainId = (await hre.ethers.provider.getNetwork()).chainId;
  
  console.log(`💰 Account balance: ${balanceFormatted} ${networkName === 'polygon' ? 'MATIC' : 'test MATIC'}`);
  
  if (parseFloat(balanceFormatted) < 0.01) {
    console.warn("⚠️  WARNING: Low balance! You may not have enough for gas fees.\n");
    console.warn("   For testnet, get free test MATIC from: https://faucet.polygon.technology/\n");
  }

  // Deploy RolleyToken
  console.log("⚙️  Deploying RolleyToken contract...");
  const RolleyToken = await hre.ethers.getContractFactory("RolleyToken");
  const rolToken = await RolleyToken.deploy(deployer.address);

  await rolToken.waitForDeployment();
  const tokenAddress = await rolToken.getAddress();

  console.log("\n✅ RolleyToken deployed successfully!");
  console.log("📍 Contract Address:", tokenAddress);
  console.log("\n📊 Token Information:");
  
  const [name, symbol, decimals, totalSupply, maxSupply] = await rolToken.getTokenInfo();
  
  console.log("  Name:", name);
  console.log("  Symbol:", symbol);
  console.log("  Decimals:", decimals.toString());
  console.log("  Initial Supply:", hre.ethers.formatEther(totalSupply), "ROL");
  console.log("  Max Supply:", hre.ethers.formatEther(maxSupply), "ROL (1 billion)");
  console.log("  Owner:", await rolToken.owner());
  console.log("  Network:", networkName);
  console.log("  Chain ID:", chainId.toString());

  // Save deployment info
  const deploymentInfo = {
    network: networkName,
    chainId: chainId.toString(),
    contractAddress: tokenAddress,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    tokenInfo: {
      name,
      symbol,
      decimals: decimals.toString(),
      totalSupply: hre.ethers.formatEther(totalSupply),
      maxSupply: hre.ethers.formatEther(maxSupply),
      valueUsd: "100", // 1 ROL = $100 USD
    },
  };

  // Save to file in backend directory
  const deploymentFile = path.join(__dirname, `../deployment-${networkName}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log(`\n💾 Deployment info saved to: ${deploymentFile}`);

  // Update .env instructions
  console.log("\n⚠️  IMPORTANT: Update backend/.env with:");
  console.log(`CONTRACT_ADDRESS="${tokenAddress}"`);
  console.log(`\n📋 Full deployment info:`);
  console.log(JSON.stringify(deploymentInfo, null, 2));

  // Wait for block confirmations on real networks
  if (networkName !== "localhost" && networkName !== "hardhat") {
    console.log("\n⏳ Waiting for 5 block confirmations...");
    const deploymentTx = rolToken.deploymentTransaction();
    if (deploymentTx) {
      await deploymentTx.wait(5);
      console.log("✅ Transaction confirmed!");
    }
    
    const explorerUrl = networkName === 'polygon' 
      ? `https://polygonscan.com/address/${tokenAddress}`
      : `https://amoy.polygonscan.com/address/${tokenAddress}`;
    
    console.log(`\n🔍 View on explorer: ${explorerUrl}`);
    
    console.log("\n📝 Verify contract with:");
    console.log(`npx hardhat verify --network ${networkName} ${tokenAddress} "${deployer.address}"`);
  }

  console.log("\n🎉 Deployment complete!");
  console.log("\n📌 Next steps:");
  console.log("1. Update CONTRACT_ADDRESS in backend/.env");
  console.log("2. Authorize backend wallet as minter (call authorizeMinter)");
  console.log("3. Update BlockchainService.mint() to use the contract");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });

