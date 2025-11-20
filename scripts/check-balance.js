/**
 * Quick script to check wallet balance on Polygon Amoy testnet
 * Usage: npx hardhat run scripts/check-balance.js --network amoy
 */

const hre = require("hardhat");

async function main() {
  const [signer] = await hre.ethers.getSigners();
  const address = signer.address;
  const balance = await hre.ethers.provider.getBalance(address);
  const balanceFormatted = hre.ethers.formatEther(balance);
  
  console.log("\n📊 Wallet Balance Check");
  console.log("═══════════════════════════");
  console.log("Address:", address);
  console.log("Balance:", balanceFormatted, "test MATIC");
  
  if (parseFloat(balanceFormatted) < 0.01) {
    console.log("\n⚠️  Low balance - Need at least 0.01 test MATIC for deployment");
    console.log("Get test MATIC: https://faucet.polygon.technology/");
  } else {
    console.log("\n✅ Sufficient balance! Ready to deploy.");
    console.log("Run: npm run deploy:testnet");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

