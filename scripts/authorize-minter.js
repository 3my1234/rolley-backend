/**
 * Authorize backend wallet as minter for ROL token
 * Usage: npx hardhat run scripts/authorize-minter.js --network amoy
 */

const hre = require("hardhat");

async function main() {
  const contractAddress = process.env.CONTRACT_ADDRESS;
  
  if (!contractAddress) {
    console.error("❌ CONTRACT_ADDRESS not found in .env");
    console.log("Please set CONTRACT_ADDRESS in backend/.env");
    process.exit(1);
  }

  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Authorizing minter with account:", deployer.address);
  
  // Get contract instance
  const RolleyToken = await hre.ethers.getContractFactory("RolleyToken");
  const token = RolleyToken.attach(contractAddress);
  
  // Authorize deployer as minter (backend wallet)
  console.log("\n🔐 Authorizing backend wallet as minter...");
  const tx = await token.authorizeMinter(deployer.address);
  console.log("⏳ Transaction hash:", tx.hash);
  
  await tx.wait();
  console.log("✅ Backend wallet authorized as minter!");
  
  // Verify authorization
  const isMinter = await token.authorizedMinters(deployer.address);
  console.log("\n✅ Verification:");
  console.log("  Address:", deployer.address);
  console.log("  Is Authorized Minter:", isMinter);
  
  const networkName = hre.network.name;
  if (networkName !== "localhost" && networkName !== "hardhat") {
    const explorerUrl = networkName === 'polygon' 
      ? `https://polygonscan.com/tx/${tx.hash}`
      : `https://amoy.polygonscan.com/tx/${tx.hash}`;
    console.log(`\n🔍 View transaction: ${explorerUrl}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

