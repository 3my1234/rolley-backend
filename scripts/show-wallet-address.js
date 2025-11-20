/**
 * Show the wallet address that will be used for deployment
 * This address needs test MATIC on Polygon Amoy testnet
 */

require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const { ethers } = require("ethers");

async function main() {
  const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
  
  if (!privateKey) {
    console.error("❌ DEPLOYER_PRIVATE_KEY not found in backend/.env");
    console.log("\nPlease add your private key to backend/.env:");
    console.log("DEPLOYER_PRIVATE_KEY=your_private_key_here");
    process.exit(1);
  }

  const wallet = new ethers.Wallet(privateKey);
  const address = wallet.address;

  console.log("\n📋 Deployment Wallet Information");
  console.log("═══════════════════════════════════");
  console.log("Address:", address);
  console.log("\n🌐 Network: Polygon Amoy Testnet");
  console.log("Chain ID: 80002");
  console.log("\n💧 Get Test MATIC from:");
  console.log("   https://faucet.polygon.technology/");
  console.log("\n📝 Steps:");
  console.log("   1. Go to https://faucet.polygon.technology/");
  console.log("   2. Select 'Polygon Amoy' network");
  console.log("   3. Select 'POL' token (test MATIC)");
  console.log("   4. Paste your address:", address);
  console.log("   5. Verify via GitHub or X (Twitter)");
  console.log("   6. Claim test MATIC");
  console.log("\n⏳ Wait 2-3 minutes for test MATIC to arrive");
  console.log("   Then run: npm run deploy:check-balance");
  console.log("\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

