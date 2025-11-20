# 📊 Understanding Your PolygonScan Wallet Page

## What You're Seeing

### Overview Section:
- **POL Balance**: `0.154332064936064891 POL`
  - This is your test MATIC (testnet currency for gas fees)
  - You received this from the faucet earlier

### Token Holdings:
- Currently shows "More Info" - this means you need to check the "Token" tab to see ROL tokens
- ROL tokens are ERC-20 tokens, so they appear in a separate section

### Transactions List (Latest 5):

#### 1. **Mint Transaction** (12 mins ago)
```
Transaction: 0x3e50afe267672860b1e7c9a2a5a370277fc8af2774b1c32cf05f7064160e92f8
Method: Mint
From: Your wallet → To: ROL Contract
Amount: 0 ROL (shown as 0 because it's a mint, not a transfer)
```
**What this means**: This is when we tested minting 0.1 ROL tokens!

#### 2. **Authorize Minter** (22 mins ago)
```
Transaction: 0xe79e7b4a747179fd2629c7e84c688ab34c53fb6f07800634ad76690b823a02c3
Method: Authorize Minter
From: Your wallet → To: ROL Contract
```
**What this means**: This is when we gave your wallet permission to mint tokens!

#### 3. **Contract Creation** (24 mins ago)
```
Transaction: 0xd8c064755269e7181b1767c8393fc52481e307e6c83c982917d1e9ee44257f67
Method: 0x60806040 (Contract Creation)
From: Your wallet → Contract Creation
```
**What this means**: This is when we deployed your ROL token contract!

#### 4. & 5. **POL Transfers** (35 mins ago & 3 days ago)
```
Amount: 0.1 POL each
From: Faucet → To: Your wallet
```
**What this means**: These are the test MATIC you received from the faucet!

## How to See Your ROL Token Balance

### Option 1: On PolygonScan

1. On the wallet page, click the **"Token"** tab (next to "Overview")
2. You should see:
   - **ROL (Rolley)**
   - Balance: **0.1 ROL**
   - Contract: `0xD5fc0F40278A2C1c5451Cbe229196290735B234B`

### Option 2: Direct Token Link

Visit:
```
https://amoy.polygonscan.com/token/0xD5fc0F40278A2C1c5451Cbe229196290735B234B?a=0xb1e29ee3AaE315453f4f98f822Fd72e647D7debf
```

This shows your specific balance for the ROL token.

---

# 🦊 Adding ROL Token to MetaMask

## Step-by-Step Guide

### Step 1: Add Polygon Amoy Testnet to MetaMask

1. **Open MetaMask** extension
2. Click the **network dropdown** (top center, usually says "Ethereum Mainnet")
3. Click **"Add Network"** or **"Add a network manually"**

4. **Enter these details**:
   ```
   Network Name: Polygon Amoy Testnet
   RPC URL: https://polygon-amoy.g.alchemy.com/v2/demo
   Chain ID: 80002
   Currency Symbol: POL
   Block Explorer URL: https://amoy.polygonscan.com
   ```

5. Click **"Save"**

### Step 2: Import Your Wallet (If Not Already Done)

1. In MetaMask, click the **account icon** (top right)
2. Click **"Import Account"**
3. Select **"Private Key"**
4. Enter your private key from `backend/.env`:
   - Look for `DEPLOYER_PRIVATE_KEY=0x...`
   - **⚠️ WARNING**: Never share this private key with anyone!
5. Click **"Import"**

### Step 3: Add ROL Token to MetaMask

1. Make sure you're on **"Polygon Amoy Testnet"** network
2. Scroll down in MetaMask to **"Assets"** section
3. Click **"Import tokens"**
4. Click **"Custom Token"** tab
5. Enter these details:
   ```
   Token Contract Address: 0xD5fc0F40278A2C1c5451Cbe229196290735B234B
   Token Symbol: ROL
   Token Decimal: 18
   ```
6. Click **"Add Custom Token"**
7. Click **"Import Tokens"** to confirm

### Step 4: View Your ROL Balance

After importing, you should see:
- **ROL** token in your assets
- Balance: **0.1 ROL**
- Value: Shows in POL or USD equivalent

## Quick Copy-Paste Values

**Network Details:**
```
Network Name: Polygon Amoy Testnet
RPC URL: https://polygon-amoy.g.alchemy.com/v2/demo
Chain ID: 80002
Currency Symbol: POL
Block Explorer: https://amoy.polygonscan.com
```

**Token Details:**
```
Contract Address: 0xD5fc0F40278A2C1c5451Cbe229196290735B234B
Symbol: ROL
Decimals: 18
```

## Troubleshooting

### "Token not found" error?
- Make sure you're on **Polygon Amoy Testnet** (not mainnet)
- Double-check the contract address is correct
- Try refreshing MetaMask

### "Insufficient funds" when trying to interact?
- You need POL (test MATIC) for gas fees
- Get more from: https://faucet.polygon.technology/

### Can't see the token balance?
- Make sure you're on the correct network (Polygon Amoy)
- Try clicking "Import tokens" again
- Check the contract address on PolygonScan first

## What You'll See

After adding the token, your MetaMask will show:

```
Assets:
├── POL (0.154 POL)          ← Test MATIC for gas
└── ROL (0.1 ROL)             ← Your ROL tokens! 🎉
```

---

## Summary

✅ **PolygonScan shows**: All your transactions and token balances
✅ **MetaMask shows**: Your tokens in your wallet (for easy viewing)
✅ **Both are connected**: They show the same blockchain data

The ROL tokens are **on the blockchain** - PolygonScan and MetaMask are just different ways to view them!

