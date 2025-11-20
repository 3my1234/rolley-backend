/**
 * Test script to verify ROL token minting works
 * Usage: npx hardhat run scripts/test-mint.js --network amoy
 */

const hre = require("hardhat");

async function main() {
  const contractAddress = process.env.CONTRACT_ADDRESS;
  const deployerPrivateKey = process.env.DEPLOYER_PRIVATE_KEY;
  
  if (!contractAddress) {
    console.error("❌ CONTRACT_ADDRESS not found in .env");
    process.exit(1);
  }

  if (!deployerPrivateKey) {
    console.error("❌ DEPLOYER_PRIVATE_KEY not found in .env");
    process.exit(1);
  }

  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Testing mint with account:", deployer.address);
  
  // Get contract instance
  const RolleyToken = await hre.ethers.getContractFactory("RolleyToken");
  const token = RolleyToken.attach(contractAddress);
  
  // Test minting 0.1 ROL (worth $10 USD) to the deployer address
  const testAmount = 0.1; // 0.1 ROL = $10 USD
  const recipientAddress = deployer.address;
  const reason = "Test mint: $10 USD purchase";
  
  console.log("\n🧪 Test Mint Details:");
  console.log("  Recipient:", recipientAddress);
  console.log("  Amount:", testAmount, "ROL");
  console.log("  USD Value: $", testAmount * 100);
  console.log("  Reason:", reason);
  
  // Check balance before
  const balanceBefore = await token.balanceOf(recipientAddress);
  const totalSupplyBefore = await token.totalSupply();
  console.log("\n📊 Before Mint:");
  console.log("  Recipient Balance:", hre.ethers.formatEther(balanceBefore), "ROL");
  console.log("  Total Supply:", hre.ethers.formatEther(totalSupplyBefore), "ROL");
  
  // Mint tokens
  console.log("\n🔨 Minting tokens...");
  const amountWei = hre.ethers.parseEther(testAmount.toString());
  const tx = await token.mint(recipientAddress, amountWei, reason);
  console.log("⏳ Transaction hash:", tx.hash);
  
  await tx.wait();
  console.log("✅ Mint successful!");
  
  // Check balance after
  const balanceAfter = await token.balanceOf(recipientAddress);
  const totalSupplyAfter = await token.totalSupply();
  console.log("\n📊 After Mint:");
  console.log("  Recipient Balance:", hre.ethers.formatEther(balanceAfter), "ROL");
  console.log("  Total Supply:", hre.ethers.formatEther(totalSupplyAfter), "ROL");
  console.log("  Balance Increase:", hre.ethers.formatEther(balanceAfter - balanceBefore), "ROL");
  
  const networkName = hre.network.name;
  if (networkName !== "localhost" && networkName !== "hardhat") {
    const explorerUrl = networkName === 'polygon' 
      ? `https://polygonscan.com/tx/${tx.hash}`
      : `https://amoy.polygonscan.com/tx/${tx.hash}`;
    console.log(`\n🔍 View transaction: ${explorerUrl}`);
  }
  
  console.log("\n✅ Test complete! Minting is working correctly.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Test failed:", error);
    process.exit(1);
  });

