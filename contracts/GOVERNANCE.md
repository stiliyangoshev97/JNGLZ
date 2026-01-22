# 🏛️ PredictionMarket Governance Guide

## Overview

All governance actions require **3-of-3 multisig approval** (except `ReplaceSigner` which needs 2-of-3).

**Contract Address (BNB Testnet):** `0x3ad26B78DB90a3Fbb5aBc6CF1dB9673DA537cBD5`

**Signers:**
| Signer | Address |
|--------|---------|
| Signer 1 | `0x4Cca77ba15B0D85d7B733E0838a429E7bEF42DD2` |
| Signer 2 | `0xC119B9152afcC5f40C019aABd78A312d37C63926` |
| Signer 3 | `0x6499fe8016cE2C2d3a21d08c3016345Edf3467F1` |

**BscScan Contract Page:** https://testnet.bscscan.com/address/0x3ad26B78DB90a3Fbb5aBc6CF1dB9673DA537cBD5#writeContract

---

## ⚡ Quick Reference

| Function | Parameters | Example |
|----------|------------|---------|
| `proposeSetFee` | `feeType (0-3)`, `newValue` | `0, 150` = Platform 1.5% |
| `proposeSetMinBet` | `newMinBet (wei)` | `5000000000000000` = 0.005 BNB |
| `proposeSetTreasury` | `newTreasury (address)` | `0x...` |
| `proposePause` | (none) | - |
| `proposeUnpause` | (none) | - |
| `proposeSetMinBondFloor` | `newMinBondFloor (wei)` | `5000000000000000` = 0.005 BNB |
| `proposeSetDynamicBondBps` | `newDynamicBondBps` | `100` = 1% |
| `proposeSetBondWinnerShare` | `newBondWinnerShare` | `5000` = 50% |
| `proposeSetHeatLevel` | `level (0-4)`, `newValue (wei)` | `0, 50000000000000000000` = CRACK 50 |
| `proposeSetProposerReward` | `newProposerReward` | `50` = 0.5% |
| `proposeReplaceSigner` | `oldSigner`, `newSigner` | addresses |
| `confirmAction` | `actionId` | `0` |

---

## 🔄 Workflow

### Step 1: Propose (Signer 1)
1. Go to **Write Contract** on BscScan
2. Connect wallet as **Signer 1**
3. Call the appropriate `propose*` function
4. Note the **actionId** from the transaction logs

### Step 2: Confirm (Signer 2)
1. Connect wallet as **Signer 2**
2. Call `confirmAction(actionId)`

### Step 3: Execute (Signer 3)
1. Connect wallet as **Signer 3**
2. Call `confirmAction(actionId)`
3. Action auto-executes on 3rd confirmation ✅

> ⏰ **Important:** Actions expire in **1 hour** if not fully confirmed!

---

## 📋 Detailed Function Guide

---

### 1️⃣ `proposeSetFee` - Set Fee Parameters

**Combined function for all fee types (v3.8.1)**

```
Function: proposeSetFee(uint8 feeType, uint256 newValue)
```

#### Fee Types:

| feeType | Name | Unit | Max | Current Default |
|---------|------|------|-----|-----------------|
| `0` | Platform Fee | BPS | 500 (5%) | 100 (1%) |
| `1` | Creator Fee | BPS | 200 (2%) | 50 (0.5%) |
| `2` | Resolution Fee | BPS | 100 (1%) | 30 (0.3%) |
| `3` | Market Creation Fee | Wei | 0.1 BNB | 0 |

#### Examples:

**Set Platform Fee to 2%:**
```
feeType: 0
newValue: 200
```

**Set Creator Fee to 1%:**
```
feeType: 1
newValue: 100
```

**Set Resolution Fee to 0.5%:**
```
feeType: 2
newValue: 50
```

**Set Market Creation Fee to 0.01 BNB:**
```
feeType: 3
newValue: 10000000000000000
```
> 💡 Use https://eth-converter.com to convert BNB to wei

---

### 2️⃣ `proposeSetMinBet` - Minimum Bet Amount

```
Function: proposeSetMinBet(uint256 newMinBet)
```

| Parameter | Range | Current Default |
|-----------|-------|-----------------|
| `newMinBet` | 0.001 - 0.1 BNB | 0.005 BNB |

#### Examples:

**Set to 0.01 BNB:**
```
newMinBet: 10000000000000000
```

**Set to 0.005 BNB:**
```
newMinBet: 5000000000000000
```

---

### 3️⃣ `proposeSetTreasury` - Change Treasury Address

```
Function: proposeSetTreasury(address newTreasury)
```

#### Example:

```
newTreasury: 0xYourNewTreasuryAddress
```

> ⚠️ **Warning:** Double-check the address! This is where platform fees go.

---

### 4️⃣ `proposePause` - Emergency Pause

```
Function: proposePause()
```

No parameters needed. Pauses all trading (buy/sell).

**What gets paused:**
- ❌ `buyYes` / `buyNo`
- ❌ `sellYes` / `sellNo`
- ❌ `createMarket` / `createMarketAndBuy`

**What still works:**
- ✅ `claim` (winners can still claim)
- ✅ `emergencyRefund` (users can still refund)
- ✅ All governance functions

---

### 5️⃣ `proposeUnpause` - Resume Operations

```
Function: proposeUnpause()
```

No parameters needed. Resumes all trading.

---

### 6️⃣ `proposeSetMinBondFloor` - Minimum Bond for Proposals

```
Function: proposeSetMinBondFloor(uint256 newMinBondFloor)
```

| Parameter | Range | Current Default |
|-----------|-------|-----------------|
| `newMinBondFloor` | 0.005 - 0.1 BNB | 0.005 BNB |

#### Example:

**Set to 0.01 BNB:**
```
newMinBondFloor: 10000000000000000
```

---

### 7️⃣ `proposeSetDynamicBondBps` - Dynamic Bond Percentage

```
Function: proposeSetDynamicBondBps(uint256 newDynamicBondBps)
```

| Parameter | Range | Current Default |
|-----------|-------|-----------------|
| `newDynamicBondBps` | 50-500 (0.5%-5%) | 100 (1%) |

Bond = max(minBondFloor, pool * dynamicBondBps / 10000)

#### Example:

**Set to 2%:**
```
newDynamicBondBps: 200
```

---

### 8️⃣ `proposeSetBondWinnerShare` - Bond Distribution to Winners

```
Function: proposeSetBondWinnerShare(uint256 newBondWinnerShare)
```

| Parameter | Range | Current Default |
|-----------|-------|-----------------|
| `newBondWinnerShare` | 2000-8000 (20%-80%) | 5000 (50%) |

When a disputer wins, they get `bondWinnerShare%` of the loser's bond.

#### Example:

**Set to 60% winner share:**
```
newBondWinnerShare: 6000
```

---

### 9️⃣ `proposeSetHeatLevel` - Virtual Liquidity per Heat Level

**Combined function for all heat levels (v3.8.1)**

```
Function: proposeSetHeatLevel(uint8 level, uint256 newValue)
```

#### Heat Levels:

| level | Name | Emoji | Current Default | Use Case |
|-------|------|-------|-----------------|----------|
| `0` | CRACK | ☢️ | 50e18 | High volatility degen |
| `1` | HIGH | 🔥 | 200e18 | Balanced (default) |
| `2` | PRO | 🧊 | 500e18 | Low slippage |
| `3` | APEX | 🏛️ | 2000e18 | Institution-grade |
| `4` | CORE | 🌌 | 10000e18 | Maximum depth |

| Parameter | Range |
|-----------|-------|
| `newValue` | 1e18 - 15000e18 |

#### Examples:

**Set CRACK to 100 virtual liquidity:**
```
level: 0
newValue: 100000000000000000000
```
> That's `100 * 1e18` = `100000000000000000000`

**Set HIGH to 300 virtual liquidity:**
```
level: 1
newValue: 300000000000000000000
```

**Set CORE to 15000 virtual liquidity:**
```
level: 4
newValue: 15000000000000000000000
```

> 💡 **Quick conversion:** Multiply your desired value by `1000000000000000000` (18 zeros)

---

### 🔟 `proposeSetProposerReward` - Proposer Reward

```
Function: proposeSetProposerReward(uint256 newProposerReward)
```

| Parameter | Range | Current Default |
|-----------|-------|-----------------|
| `newProposerReward` | 0-200 (0%-2%) | 50 (0.5%) |

Reward given to whoever successfully proposes the correct outcome.

#### Example:

**Set to 1%:**
```
newProposerReward: 100
```

---

### 🔑 `proposeReplaceSigner` - Emergency Signer Replacement

**⚠️ Only requires 2-of-3 confirmations!**

```
Function: proposeReplaceSigner(address oldSigner, address newSigner)
```

#### Example:

**Replace Signer 1 with new address:**
```
oldSigner: 0x4Cca77ba15B0D85d7B733E0838a429E7bEF42DD2
newSigner: 0xNewSignerAddress
```

> ⚠️ **Critical:** 
> - `newSigner` cannot be an existing signer
> - `newSigner` cannot be address(0)
> - This is for emergencies (lost keys, compromised signer)

---

## 🔍 Confirming Actions

After proposing, the other signers need to confirm:

```
Function: confirmAction(uint256 actionId)
```

#### Example:
```
actionId: 0
```

> 💡 The `actionId` is emitted in the `ActionProposed` event when you call a propose function. Check the transaction logs on BscScan.

---

## 📊 Checking Current Values

Go to **Read Contract** on BscScan to check current values:

| Function | What it returns |
|----------|-----------------|
| `platformFeeBps()` | Current platform fee (BPS) |
| `creatorFeeBps()` | Current creator fee (BPS) |
| `resolutionFeeBps()` | Current resolution fee (BPS) |
| `marketCreationFee()` | Current market creation fee (wei) |
| `minBet()` | Current minimum bet (wei) |
| `treasury()` | Current treasury address |
| `paused()` | Is contract paused? |
| `minBondFloor()` | Current min bond floor (wei) |
| `dynamicBondBps()` | Current dynamic bond % |
| `bondWinnerShareBps()` | Current bond winner share % |
| `heatLevelCrack()` | Current CRACK virtual liquidity |
| `heatLevelHigh()` | Current HIGH virtual liquidity |
| `heatLevelPro()` | Current PRO virtual liquidity |
| `heatLevelApex()` | Current APEX virtual liquidity |
| `heatLevelCore()` | Current CORE virtual liquidity |
| `proposerRewardBps()` | Current proposer reward % |
| `signers(0)` | Signer 1 address |
| `signers(1)` | Signer 2 address |
| `signers(2)` | Signer 3 address |

---

## 🔢 Wei Conversion Cheat Sheet

| BNB | Wei |
|-----|-----|
| 0.001 | `1000000000000000` |
| 0.005 | `5000000000000000` |
| 0.01 | `10000000000000000` |
| 0.05 | `50000000000000000` |
| 0.1 | `100000000000000000` |
| 1.0 | `1000000000000000000` |

**For Heat Levels (multiply by 1e18):**

| Value | Wei (1e18) |
|-------|------------|
| 50 | `50000000000000000000` |
| 100 | `100000000000000000000` |
| 200 | `200000000000000000000` |
| 500 | `500000000000000000000` |
| 1000 | `1000000000000000000000` |
| 2000 | `2000000000000000000000` |
| 5000 | `5000000000000000000000` |
| 10000 | `10000000000000000000000` |
| 15000 | `15000000000000000000000` |

---

## ⚠️ Common Mistakes to Avoid

1. **Forgetting to confirm within 1 hour** - Actions expire!
2. **Using wrong fee type number** - Double-check 0/1/2/3
3. **Using wrong heat level number** - Double-check 0/1/2/3/4
4. **Wei vs BPS confusion** - Fees use BPS (basis points), amounts use wei
5. **Wrong address format** - Always copy-paste addresses, never type manually
6. **Replacing with existing signer** - `proposeReplaceSigner` will revert

---

## 📝 Example Complete Flow

**Goal: Change platform fee from 1% to 1.5%**

### Signer 1:
1. Go to Write Contract
2. Connect wallet `0x4Cca77ba15B0D85d7B733E0838a429E7bEF42DD2`
3. Call `proposeSetFee`:
   - `feeType`: `0`
   - `newValue`: `150`
4. Submit transaction
5. Check logs → `actionId = 0`
6. Tell Signer 2 & 3: "Please confirm action ID 0"

### Signer 2:
1. Connect wallet `0xC119B9152afcC5f40C019aABd78A312d37C63926`
2. Call `confirmAction`:
   - `actionId`: `0`
3. Submit transaction

### Signer 3:
1. Connect wallet `0x6499fe8016cC2C2d3a21d08c3016345Edf3467F1`
2. Call `confirmAction`:
   - `actionId`: `0`
3. Submit transaction
4. ✅ **Done!** Platform fee is now 1.5%

---

## 🚨 Emergency Procedures

### Contract Compromised
1. **Signer 1** calls `proposePause()`
2. **Signer 2** calls `confirmAction(actionId)`
3. **Signer 3** calls `confirmAction(actionId)`
4. Contract is paused - no new trades possible
5. Users can still claim winnings and request refunds

### Signer Key Lost/Compromised
1. **Remaining Signer A** calls `proposeReplaceSigner(oldSigner, newSigner)`
2. **Remaining Signer B** calls `confirmAction(actionId)`
3. ✅ Signer replaced (only needs 2-of-3!)

---

*Last updated: v3.8.1*
