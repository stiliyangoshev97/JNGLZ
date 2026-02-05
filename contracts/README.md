# 🎰 JNGLZ.FUN - Prediction Market Smart Contracts

> Decentralized prediction markets on BNB Chain with **Street Consensus** resolution.  
> **Fast. No oracles. Bettors decide.**

[![Tests](https://img.shields.io/badge/tests-214%20passing-brightgreen)]()
[![Solidity](https://img.shields.io/badge/solidity-0.8.24-blue)]()
[![License](https://img.shields.io/badge/license-MIT-green)]()
[![Testnet](https://img.shields.io/badge/BNB%20Testnet-deployed-green)]()
[![Version](https://img.shields.io/badge/version-v3.8.3-blue)]()

---

## 🚀 Current Deployment

| Network | Address | Status |
|---------|---------|--------|
| **BNB Testnet** | [`0xC97FB434B79e6c643e0320fa802B515CedBA95Bf`](https://testnet.bscscan.com/address/0xC97FB434B79e6c643e0320fa802B515CedBA95Bf) | ✅ Verified |

---

## ⚠️ CRITICAL: v3.8.3 Required

**Previous versions have critical bugs.** See [CHANGELOG.md](CHANGELOG.md) for details.

| Version | Status | Issue |
|---------|--------|-------|
| v3.1.0 | ⚠️ DEPRECATED | Arbitrage vulnerability in `_calculateSellBnb()` |
| v3.2.0 | ⚠️ DEPRECATED | Bonding curve corrected |
| v3.3.0 | ⚠️ DEPRECATED | Added proposer rewards |
| v3.4.0 | ⚠️ DEPRECATED | Pull Pattern, griefing protection |
| v3.4.1 | ⚠️ DEPRECATED | ReplaceSigner (2-of-3), sweep protection |
| v3.5.0 | ⚠️ DEPRECATED | **Emergency Refund Double-Spend Bug** |
| v3.6.0 | ⚠️ DEPRECATED | **Dispute Window Edge Case Bug** |
| v3.6.1 | ⚠️ DEPRECATED | **One-Sided Market & Emergency Refund Bypass Bugs** |
| v3.6.2 | ⚠️ DEPRECATED | **Jury Fees Gas Griefing Bug (>4,600 voters bricks market)** |
| v3.7.0 | ⚠️ DEPRECATED | **SweepFunds removed, jury fees Pull Pattern** |
| v3.8.0 | ❌ NOT DEPLOYED | **Contract size exceeded EVM limit (26,340 > 24,576 bytes)** |
| v3.8.1 | ⚠️ DEPRECATED | **Missing creator fee in createMarketAndBuy(), inconsistent Trade events** |
| v3.8.2 | ⚠️ DEPRECATED | **No event when tie clears proposer/disputer (subgraph desync)** |
| **v3.8.3** | ✅ **DEPLOYED** | **TieFinalized event for subgraph sync** |

---

## 🆕 v3.8.3: TieFinalized Event

**Released:** February 4, 2026

### What's New

**TieFinalized Event** - When voting ends in a tie (equal votes or 0:0), the contract now emits a `TieFinalized(marketId)` event after clearing `proposer` and `disputer` to `address(0)`.

This enables the subgraph to detect the state change and update accordingly, fixing the UI bug where "FINALIZE TIE" button kept showing instead of "CLAIM REFUND".

### Changes

```solidity
// New event
event TieFinalized(uint256 indexed marketId);

// Updated function signature
function _returnBondsOnTie(uint256 marketId, Market storage market) internal {
    // ... existing bond return logic ...
    emit TieFinalized(marketId);
}
```

---

## 🆕 v3.8.2: Bug Fixes Deployment

**Released:** January 23, 2026

### Bugs Fixed

1. **Bug #1: Missing Creator Fee** - `createMarketAndBuy()` now charges 1.5% total (was only 1%)
2. **Bug #4: Trade Event Consistency** - All Trade events now emit NET BNB (after fees)

### Consolidated Functions

**Fees:** 4 functions → 1
```solidity
// OLD (v3.8.0)
proposeSetFee(newValue)
proposeSetCreatorFee(newValue)
proposeSetResolutionFee(newValue)
proposeSetMarketCreationFee(newValue)

// NEW (v3.8.1) - Combined with FeeType enum
proposeSetFee(FeeType.Platform, newValue)      // feeType = 0
proposeSetFee(FeeType.Creator, newValue)       // feeType = 1
proposeSetFee(FeeType.Resolution, newValue)    // feeType = 2
proposeSetFee(FeeType.MarketCreation, newValue) // feeType = 3
```

**Heat Levels:** 5 functions → 1
```solidity
// OLD (v3.8.0)
proposeSetHeatLevelCrack(newValue)
proposeSetHeatLevelHigh(newValue)
proposeSetHeatLevelPro(newValue)
proposeSetHeatLevelApex(newValue)
proposeSetHeatLevelCore(newValue)

// NEW (v3.8.1) - Combined with HeatLevel enum
proposeSetHeatLevel(HeatLevel.CRACK, newValue)  // level = 0
proposeSetHeatLevel(HeatLevel.HIGH, newValue)   // level = 1
proposeSetHeatLevel(HeatLevel.PRO, newValue)    // level = 2
proposeSetHeatLevel(HeatLevel.APEX, newValue)   // level = 3
proposeSetHeatLevel(HeatLevel.CORE, newValue)   // level = 4
```

### All 11 Propose Functions (v3.8.1)

| Function | Parameters | Description |
|----------|------------|-------------|
| `proposeSetFee(FeeType, uint256)` | Type (0-3) + value | Combined fee setting |
| `proposeSetMinBet(uint256)` | Wei amount | Minimum bet (0.001-0.1 BNB) |
| `proposeSetTreasury(address)` | Address | Treasury recipient |
| `proposePause()` | None | Emergency pause |
| `proposeUnpause()` | None | Resume operations |
| `proposeSetMinBondFloor(uint256)` | Wei amount | Min bond (0.005-0.1 BNB) |
| `proposeSetDynamicBondBps(uint256)` | BPS (50-500) | Dynamic bond % |
| `proposeSetBondWinnerShare(uint256)` | BPS (2000-8000) | Winner's share |
| `proposeSetHeatLevel(HeatLevel, uint256)` | Level (0-4) + value | Combined heat level |
| `proposeSetProposerReward(uint256)` | BPS (max 200) | Proposer reward |
| `proposeReplaceSigner(address, address)` | Old, new | Replace signer (2-of-3) |

### Workflow

```
1. Signer1: proposePause()           → returns actionId, auto-approves (1/3)
2. Signer2: confirmAction(actionId)  → (2/3 confirmations)  
3. Signer3: confirmAction(actionId)  → auto-executes! ✅
```

📋 **See [GOVERNANCE.md](GOVERNANCE.md) for detailed BscScan usage guide.**

### Key Benefits
- ✅ **Type-safe** - Solidity validates at compile time
- ✅ **Fail-fast** - Invalid values rejected at propose time, not execution
- ✅ **Human-readable** - No memorizing ActionType enum numbers
- ✅ **Works in any wallet** - MetaMask, Gnosis Safe, etc.
- ✅ **Emergency-ready** - Pause contract in seconds at 3AM

---

## ✅ v3.7.0: Trust Minimization (Sweep Removal)

**Released:** January 19, 2026

### SweepFunds Removed Entirely

After discovering 2 critical bugs in sweep protection logic, we made the decision to **remove sweep functionality entirely**.

**Rationale:**
1. **Risk/Reward**: Risk of catastrophic user fund loss far outweighs recovering ~1-2 BNB dust
2. **Critical Bugs Found**: `_calculateTotalLockedFunds()` was missing jury fees pool and unclaimed winner funds
3. **Industry Practice**: Uniswap, Aave, Compound don't have sweep functions
4. **Trust Minimization**: "Code is law" - admins CANNOT extract any funds

**Trust Guarantees:**
- ✅ Governance CANNOT extract any BNB from contract
- ✅ All user funds 100% protected from admin actions  
- ✅ Even "dust" remains locked forever (deflationary)
- ✅ Maximum trust minimization achieved

---

## ✅ FIXED: Jury Fees Gas Griefing (v3.7.0)

**Discovered:** January 19, 2026  
**Fixed:** January 19, 2026  
**Severity:** CRITICAL (in v3.6.2) → RESOLVED (in v3.7.0)

### Vulnerability Summary (v3.6.2 and earlier)

| # | Problem | Impact | v3.7.0 Fix |
|---|---------|--------|------------|
| 1 | **Gas Griefing** | O(n) loop through voters in `_distributeJuryFees()` | Pull Pattern with `juryFeesPool` |
| 2 | **Market Bricking** | >4,600 voters exceeds 30M gas limit | `claimJuryFees()` individual claims |
| 3 | **Permanent Lock** | `finalizeMarket()` reverts, funds stuck forever | O(1) finalization |

### v3.7.0 Fixes Applied

```solidity
// FIX: Pull Pattern for jury fees - O(1) storage
function _distributeJuryFees(...) internal {
    // ... treasury fallback if no winners ...
    market.juryFeesPool = voterPool;  // Single storage write
    emit JuryFeesPoolCreated(marketId, voterPool);
}

// FIX: Individual claim function
function claimJuryFees(uint256 marketId) external nonReentrant returns (uint256 amount) {
    Market storage market = markets[marketId];
    Position storage position = positions[marketId][msg.sender];
    
    // Checks
    if (!market.resolved) revert MarketNotResolved();
    if (market.juryFeesPool == 0) revert NoJuryFeesPool();
    if (!position.hasVoted) revert DidNotVote();
    if (position.votedYes != market.outcome) revert VotedForLosingOutcome();
    if (position.juryFeesClaimed) revert JuryFeesAlreadyClaimed();
    
    // Calculate proportional share
    uint256 voterShares = market.outcome ? position.yesShares : position.noShares;
    uint256 winningVoteWeight = market.outcome ? market.yesVoteWeight : market.noVoteWeight;
    amount = (market.juryFeesPool * voterShares) / winningVoteWeight;
    
    // Effects
    position.juryFeesClaimed = true;
    
    // Interactions
    (bool success,) = msg.sender.call{value: amount}("");
    if (!success) revert TransferFailed();
    
    emit JuryFeesClaimed(marketId, msg.sender, amount);
}
```

---

## ✅ FIXED: Emergency Refund Vulnerability (v3.6.0)

**Discovered:** January 18, 2026  
**Fixed:** January 18, 2026  
**Severity:** CRITICAL (in v3.5.0) → RESOLVED (in v3.6.0)

### Vulnerability Summary (v3.5.0 and earlier)

| # | Problem | Impact | v3.6.0 Fix |
|---|---------|--------|------------|
| 1 | **Double-Spend** | User gets ~2x payout | `claim()` checks `emergencyRefunded` flag |
| 2 | **Pool Insolvency** | Contract can't pay all winners | `emergencyRefund()` reduces `poolBalance` |
| 3 | **Race Condition** | Resolution/refund conflict | 2-hour cutoff before emergency refund |
| 4 | **Stale Pool Data** | Pool shows BNB already paid out | `claim()` reduces `poolBalance` and supply |

### v3.6.0 Fixes Applied

```solidity
// FIX 1: Block claim after emergency refund
function claim(uint256 marketId) external {
    if (position.emergencyRefunded) revert AlreadyEmergencyRefunded(); // ✅ ADDED
    // ...
}

// FIX 2: Reduce pool balance on emergency refund
function emergencyRefund(uint256 marketId) external {
    // ...
    market.poolBalance -= refund;           // ✅ ADDED
    market.yesSupply -= position.yesShares; // ✅ ADDED
    market.noSupply -= position.noShares;   // ✅ ADDED
    position.yesShares = 0;                 // ✅ ADDED
    position.noShares = 0;                  // ✅ ADDED
    // ...
}

// FIX 3: 2-hour resolution cutoff
uint256 public constant RESOLUTION_CUTOFF_BUFFER = 2 hours; // ✅ ADDED

function proposeOutcome(uint256 marketId, bool outcome) external {
    if (block.timestamp >= emergencyRefundTime - RESOLUTION_CUTOFF_BUFFER) {
        revert ProposalWindowClosed(); // ✅ ADDED
    }
    // ...
}

// FIX 4: Clean pool accounting on claim
function claim(uint256 marketId) external {
    // ... calculate payout ...
    market.poolBalance -= grossPayout;      // ✅ ADDED
    if (market.outcome) {
        market.yesSupply -= winningShares;  // ✅ ADDED
    } else {
        market.noSupply -= winningShares;   // ✅ ADDED
    }
    // ... transfer payout ...
}
```

### Timeline (v3.6.0, updated v3.6.1)

```
Expiry ─────────────────────────────────────────────────> Emergency Refund
  │                                                              │
  │  0-22h: Proposal window                                     │ 24h+
  │  ├─ Propose (10min creator priority, then anyone)           │
  │  ├─ Dispute window (30min after proposal) - allowed anytime │
  │  └─ Voting window (1h after dispute)                        │
  │                                                              │
  │  22-24h: CUTOFF - No new PROPOSALS (disputes still allowed) │
  │         (ensures resolution completes before refund)         │
```

**Resolution and Emergency Refund are now mutually exclusive by design.**

---

## ✅ FIXED: Dispute Window Edge Case (v3.6.1)

**Discovered:** January 18, 2026  
**Fixed:** January 18, 2026  
**Severity:** MEDIUM (in v3.6.0) → RESOLVED (in v3.6.1)

### v3.6.0 Bug Found

If someone proposes at T=21:59 (1 minute before the 2-hour cutoff), the cutoff would kick in at T=22:00, blocking ALL disputes with `DisputeWindowClosed` error. This allowed a malicious proposer to propose a WRONG outcome knowing nobody could dispute it.

### v3.6.1 Fix Applied

Removed the cutoff check from `dispute()` function. Disputes are now ONLY blocked by the natural 30-minute dispute window expiry (`DisputeWindowExpired`), not by the 2-hour cutoff.

```solidity
// v3.6.1: REMOVED cutoff check from dispute()
function dispute(uint256 marketId) external {
    // REMOVED: 
    // if (block.timestamp >= emergencyRefundTime - RESOLUTION_CUTOFF_BUFFER) {
    //     revert DisputeWindowClosed();
    // }
    
    // KEPT: Natural 30-min window check only
    if (block.timestamp > market.proposalTime + DISPUTE_WINDOW) {
        revert DisputeWindowExpired();
    }
    // ...
}
```

### Why This is Safe

The proposal cutoff at 22h already guarantees resolution completes before the 24h emergency refund:

```
Worst case: Proposal at T=21:59:59
Dispute at T=22:29:58 (last second of 30-min window)  
Voting ends T=23:29:58
Finalize at T=23:29:59
Emergency refund at T=24:00:00
GAP: 30 minutes - SAFE!
```

### Test Coverage
- Modified `test_Dispute_RevertWhenDisputeWindowExpired` - Tests natural 30-min window
- Added `test_Dispute_AllowedAfterCutoff_IfWithinDisputeWindow` - Verifies the fix
- **196 total tests passing**

---

## ✅ FIXED: One-Sided Market & Emergency Refund Bugs (v3.6.2)

**Discovered:** January 19, 2026  
**Fixed:** January 19, 2026  
**Severity:** HIGH → RESOLVED (in v3.6.2)

### Bug Summary (FIXED)

| # | Bug Name | Severity | Description | Status |
|---|----------|----------|-------------|--------|
| 1 | **One-Sided Market Proposals** | 🟠 HIGH | Could propose on markets where one side has 0 holders | ✅ FIXED |
| 2 | **Emergency Refund Bypass** | 🟠 HIGH | Losers could avoid resolution by not finalizing, then taking emergency refund | ✅ FIXED |
| 3 | **Stale Proposer State** | 🟡 MEDIUM | Failed finalization didn't clear `proposer`/`disputer`, blocking emergency refund | ✅ FIXED |

---

### Bug 1: One-Sided Market Proposals (FIXED)

**Problem:** `proposeOutcome()` only checked if BOTH sides were empty, not if ONE side was empty.

```solidity
// OLD check (v3.6.1 - VULNERABLE):
if (market.yesSupply == 0 && market.noSupply == 0) {
    revert NoTradesToResolve();  // Only blocked if BOTH are zero
}

// NEW check (v3.6.2 - FIXED):
if (market.yesSupply == 0 || market.noSupply == 0) {
    revert OneSidedMarket();  // Now blocks if EITHER side is empty
}
```

**Why This Fix?** One-sided markets should use emergency refund, not resolution. There's no "losing side" to take money from, so resolution is pointless.

---

### Bug 2: Emergency Refund Bypass (FIXED)

**Problem:** `emergencyRefund()` only checked `!market.resolved`, not whether a valid proposal existed.

```solidity
// OLD check (v3.6.1 - VULNERABLE):
function emergencyRefund(uint256 marketId) external {
    if (market.resolved) revert MarketAlreadyResolved();
    // ❌ Did NOT check if proposal exists!
}

// NEW check (v3.6.2 - FIXED):
function emergencyRefund(uint256 marketId) external {
    if (market.resolved) revert MarketAlreadyResolved();
    // ✅ Block if resolution in progress (unless contract paused for emergencies)
    if (!paused && market.proposer != address(0)) {
        revert ResolutionInProgress();
    }
    // ...
}
```

**Why This Fix?** Prevents losers from avoiding resolution by simply not calling `finalizeMarket()` and waiting for emergency refund.

---

### Bug 3: Stale Proposer State After Failed Finalization (FIXED)

**Problem:** When `finalizeMarket()` failed legitimately (winning side has 0 holders, or vote tie), it returned bonds but didn't clear `proposer`/`disputer`.

```solidity
// OLD behavior (v3.6.1 - VULNERABLE):
if (winningSupply == 0) {
    pendingWithdrawals[market.proposer] += bondAmount;  // Return bond ✓
    emit MarketResolutionFailed(...);
    return;  // ❌ proposer NOT cleared!
}

// NEW behavior (v3.6.2 - FIXED):
if (winningSupply == 0) {
    pendingWithdrawals[market.proposer] += bondAmount;
    market.proposer = address(0);  // ✅ Clear for emergency refund
    emit MarketResolutionFailed(...);
    return;
}

// Also in _returnBondsOnTie():
function _returnBondsOnTie(Market storage market) internal {
    // ... return bonds ...
    market.proposer = address(0);  // ✅ Clear
    market.disputer = address(0);  // ✅ Clear
}
```

**Why This Fix?** Without clearing proposer, users would be stuck forever if Bug 2 fix was applied (emergency refund blocked because `proposer != address(0)`).

---

### v3.6.2 Behavior Summary

| Market Type | Proposal Allowed? | Resolution Path |
|-------------|-------------------|-----------------|
| Normal (YES > 0, NO > 0) | ✅ Yes | Propose → Finalize → Claim |
| One-sided (YES > 0, NO = 0) | ❌ No | Emergency refund at 24h |
| One-sided (YES = 0, NO > 0) | ❌ No | Emergency refund at 24h |
| Empty (YES = 0, NO = 0) | ❌ No | Nothing to refund |

| Scenario | Finalize Needed? | Emergency Refund? |
|----------|------------------|-------------------|
| **One-sided market** (YES=0 or NO=0) | ❌ No | ✅ Directly after 24h |
| **Empty market** (YES=0 AND NO=0) | ❌ No | N/A (no positions) |
| **Normal market, no proposal** | ❌ No | ✅ Directly after 24h |
| **Normal market, with proposal** | ✅ Yes | After finalize clears proposer |
| **Proposal exists, not finalized** | ✅ Yes | ❌ No → Must finalize first |
| **Finalization failed** (0 winners) | ✅ Yes (clears proposer) | ✅ Yes (proposer cleared) |
| **Vote tie** | ✅ Yes (clears proposer) | ✅ Yes (proposer cleared) |
| **Contract paused** | ❌ No | ✅ Yes (emergency escape hatch) |

> **Key Insight:** For one-sided markets or markets where nobody proposes, `finalizeMarket()` is NOT needed - users can call `emergencyRefund()` directly after 24h passes. The protection ensures losers cannot game the system by refusing to finalize.

### New Error Codes (v3.6.2)
- `OneSidedMarket()` - Reverts when trying to propose on a market where one side has 0 supply
- `ResolutionInProgress()` - Reverts when trying to emergency refund while a valid proposal exists

### Test Coverage (v3.6.2)
- Added `OneSidedMarket.t.sol` - 7 new tests for one-sided market blocking
- Updated `EmptyWinningSide.t.sol` - Complete rewrite for v3.6.2 behavior (6 tests)
- Updated 20+ tests across all test files to work with new one-sided market rules
- **196 total tests passing**

---

## 🚀 Contract Status

| Version | Features | Status |
|---------|----------|--------|
| **v3.7.0** | Jury Fees Gas Griefing Fix (Pull Pattern), 196 tests | ✅ **CURRENT - READY FOR DEPLOYMENT** |
| v3.6.2 | One-Sided Market Fix, Emergency Refund Security | ⚠️ DEPRECATED (gas griefing bug) |
| v3.6.1 | Dispute Window Edge Case Fix | ⚠️ DEPRECATED (one-sided market bugs) |
| v3.6.0 | Emergency Refund Security Fix | ⚠️ DEPRECATED (edge case bug) |
| v3.5.0 | 5 Heat Levels (10x liquidity), APEX & CORE tiers | ⚠️ DEPRECATED (bug) |

### Current Deployment (v3.5.0 - BNB Testnet - DEPRECATED)
- **Address:** [`0x8e6c4437CAE7b9B78C593778cCfBD7C595Ce74a8`](https://testnet.bscscan.com/address/0x8e6c4437CAE7b9B78C593778cCfBD7C595Ce74a8)
- **Network:** BNB Testnet (Chain ID: 97)
- **⚠️ WARNING:** Contains Emergency Refund vulnerability - DO NOT USE

> **v3.7.0 Features:** All v3.6.2 features + Jury fees Pull Pattern (gas griefing fix), Sweep protection for jury pool, 196 total tests passing

---

## ⚡ 20-Second Economics

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    STREET CONSENSUS IN 20 SECONDS                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  📈 TRADING                          💰 FEES                             │
│  ─────────                           ──────                              │
│  • Buy/sell YES or NO shares         • 1.0% platform fee                 │
│  • Bonding curve pricing             • 0.5% to market creator            │
│  • P(YES) + P(NO) = 0.01 BNB        • 0.3% on resolution actions         │
│                                                                          │
│  ⚖️ RESOLUTION (30-90 min)           🏆 REWARDS                          │
│  ────────────────────────            ─────────                           │
│  1. Market expires                   • Correct proposer: gets bond back  │
│  2. Creator proposes (10 min head      + 0.5% of pool reward             │
│     start) with bond                 • Voters on winning side: split 50% │
│  3. Anyone can dispute (2x bond)       of loser's bond                   │
│  4. If disputed → bettors VOTE       • Liars: lose their bond            │
│  5. Simple majority wins                                                 │
│                                      💼 CLAIMING (Pull Pattern)          │
│  NO ORACLE. NO WAITING 48 HOURS.     ────────────────────────            │
│  BETTORS DECIDE THEIR OWN FATE.      • Creators: withdrawCreatorFees()   │
│                                      • Bonds/Jury: withdrawBond()        │
│                                      • Winners: claim()                  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🔬 TECHNOLOGY: AMM-Based Prediction Markets

> **What makes JNGLZ.FUN different from traditional prediction markets?**

### The Innovation: Constant Sum AMM + Pump/Dump Trading

Traditional prediction markets (Polymarket, Augur) use order books or simple token minting. **JNGLZ.FUN uses an Automated Market Maker (AMM)** with a **Constant Sum Bonding Curve**, enabling:

1. **Pump & Dump Trading** - Profit from price movements, not just being "right"
2. **Instant Liquidity** - No waiting for counterparty, trade anytime
3. **Guaranteed Solvency** - Pool can ALWAYS pay all winners
4. **Dynamic Pricing** - Prices reflect real-time market sentiment

---

### 📐 The Math: Constant Sum Bonding Curve

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    CONSTANT SUM AMM FORMULA                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   PRICE FORMULA (always sums to 0.01 BNB):                              │
│   ─────────────────────────────────────────                             │
│                                                                          │
│   P(YES) = UNIT_PRICE × virtualYes / (virtualYes + virtualNo)           │
│   P(NO)  = UNIT_PRICE × virtualNo  / (virtualYes + virtualNo)           │
│                                                                          │
│   Where:                                                                 │
│   • UNIT_PRICE = 0.01 BNB (constant)                                    │
│   • virtualYes = yesSupply + virtualLiquidity                           │
│   • virtualNo  = noSupply + virtualLiquidity                            │
│                                                                          │
│   INVARIANT: P(YES) + P(NO) = 0.01 BNB (always!)                        │
│                                                                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   BUY FORMULA (how many shares you get):                                │
│   ──────────────────────────────────────                                │
│                                                                          │
│   shares = (bnbAmount × totalVirtual × 1e18) / (UNIT_PRICE × virtualSide)│
│                                                                          │
│   • Buying pushes YOUR side's price UP                                  │
│   • You get fewer shares as price increases                             │
│   • Early buyers get better prices                                      │
│                                                                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   SELL FORMULA (how much BNB you get back):                             │
│   ─────────────────────────────────────────                             │
│                                                                          │
│   bnbOut = (shares × UNIT_PRICE × virtualSideAfter) /                   │
│            (totalVirtualAfter × 1e18)                                   │
│                                                                          │
│   • Uses POST-SELL state (virtualSideAfter = virtualSide - shares)      │
│   • Selling pushes YOUR side's price DOWN                               │
│   • You get less BNB as you sell (price impact)                         │
│   • This prevents arbitrage (buy→sell = guaranteed loss)                │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### 🎰 Why Pump & Dump Works (Unlike Traditional Markets)

```
┌─────────────────────────────────────────────────────────────────────────┐
│         TRADITIONAL PREDICTION MARKET vs JNGLZ.FUN                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   TRADITIONAL (Polymarket, Augur):                                      │
│   ─────────────────────────────────                                     │
│   • Buy shares at fixed price OR via order book                         │
│   • Shares worth $1 if you're RIGHT, $0 if WRONG                       │
│   • ONLY way to profit: Be correct about the outcome                    │
│   • Must wait until market resolves to know if you won                  │
│                                                                          │
│   JNGLZ.FUN (AMM Bonding Curve):                                        │
│   ─────────────────────────────────                                     │
│   • Buy shares → Price goes UP                                          │
│   • Sell shares → You get BNB back (at new price)                      │
│   • Profit from PRICE MOVEMENT, not just being right                    │
│   • Can exit anytime before resolution!                                 │
│                                                                          │
│   PUMP & DUMP EXAMPLE:                                                  │
│   ────────────────────                                                  │
│   1. You buy YES early at 0.003 BNB/share                              │
│   2. Others buy YES, price pumps to 0.007 BNB/share                    │
│   3. You SELL your shares at higher price                              │
│   4. PROFIT! Even if YES ultimately loses!                             │
│                                                                          │
│   This is IMPOSSIBLE in traditional prediction markets.                 │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### 💰 Guaranteed Pool Solvency

> **The pool can ALWAYS pay all winners. Here's why:**

```
┌─────────────────────────────────────────────────────────────────────────┐
│              WHY THE POOL NEVER GOES BROKE                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   KEY INSIGHT: BNB goes IN when buying, comes OUT when selling.         │
│   The bonding curve ensures sellers ALWAYS get less than buyers paid.   │
│                                                                          │
│   MATHEMATICAL GUARANTEE:                                               │
│   ───────────────────────                                               │
│   • When you BUY: BNB enters pool, shares are minted                    │
│   • When you SELL: Shares are burned, BNB leaves pool                   │
│   • Sell formula uses POST-SELL price (lower than buy price)            │
│   • Plus 1.5% fees are extracted                                        │
│                                                                          │
│   RESULT: Pool always has enough to pay remaining shareholders.         │
│                                                                          │
│   EXAMPLE:                                                              │
│   ────────                                                              │
│   Alice buys 100 YES shares for 1 BNB → Pool: 0.985 BNB (after fees)   │
│   Bob buys 100 YES shares for 1.2 BNB → Pool: 2.153 BNB               │
│   Alice sells 100 shares → Gets ~0.95 BNB → Pool: 1.203 BNB           │
│   Bob sells 100 shares → Gets ~1.1 BNB → Pool: 0.103 BNB              │
│                                                                          │
│   Pool NEVER goes negative. Math guarantees it.                         │
│                                                                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   SAFETY CHECK (InsufficientPoolBalance):                               │
│   ───────────────────────────────────────                               │
│   Contract reverts if: grossBnbOut > market.poolBalance                 │
│   This should NEVER happen with correct math, but we check anyway.      │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### 🌊 Virtual Liquidity (The Secret Sauce)

```
┌─────────────────────────────────────────────────────────────────────────┐
│              VIRTUAL LIQUIDITY EXPLAINED                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   PROBLEM: New markets have 0 shares. How do you price 0/0?             │
│                                                                          │
│   SOLUTION: Add "virtual" shares that don't actually exist.             │
│                                                                          │
│   virtualYes = realYesShares + virtualLiquidity                         │
│   virtualNo  = realNoShares  + virtualLiquidity                         │
│                                                                          │
│   EXAMPLE (virtualLiquidity = 20):                                      │
│   ─────────────────────────────────                                     │
│   Market created: yesSupply = 0, noSupply = 0                           │
│   Virtual state:  virtualYes = 20, virtualNo = 20                       │
│   Initial price:  P(YES) = 0.01 × 20/40 = 0.005 BNB (50%)              │
│                                                                          │
│   After buying 10 YES shares:                                           │
│   Real state:     yesSupply = 10, noSupply = 0                          │
│   Virtual state:  virtualYes = 30, virtualNo = 20                       │
│   New price:      P(YES) = 0.01 × 30/50 = 0.006 BNB (60%)              │
│                                                                          │
│   HEAT LEVELS control virtualLiquidity (v3.5.0 - 5 tiers):             │
│   • CRACK (50):    Degen Flash - high volatility                       │
│   • HIGH (200):    Street Fight - balanced (DEFAULT)                   │
│   • PRO (500):     Whale Pond - stable for large bets                  │
│   • APEX (2000):   Institution - professional trading                  │
│   • CORE (10000):  Deep Space - maximum depth                          │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### 📊 Price Impact by Heat Level (Tested Results)

> **How much does 1 BNB move the price on a fresh market?**

Virtual liquidity determines how much a trade affects the price. Higher liquidity = less price movement = more stable markets.

```
┌─────────────────────────────────────────────────────────────────────────┐
│              PRICE IMPACT: 1 BNB FIRST BUY ON FRESH MARKET              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   Heat Level      │ Virtual Liq. │ Price Move  │ Volatility │ Use Case  │
│   ────────────────┼──────────────┼─────────────┼────────────┼───────────│
│   🔥 DEGEN FLASH  │    50 BNB    │ 50¢ → 83¢   │  EXTREME   │ Degens    │
│   ⚡ STREET FIGHT │   200 BNB    │ 50¢ → 66¢   │   HIGH     │ Default   │
│   🌊 WHALE POND   │   500 BNB    │ 50¢ → 58¢   │  MEDIUM    │ Whales    │
│   🏛️ INSTITUTION │  2,000 BNB   │ 50¢ → 52¢   │    LOW     │ Pro/Inst  │
│   🚀 DEEP SPACE   │ 10,000 BNB   │ 50¢ → ~50¢  │  MINIMAL   │ Max depth │
│                                                                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   WHY THIS MATTERS:                                                      │
│   ─────────────────                                                      │
│   • DEGEN FLASH: 1 BNB moves price 33¢ - huge swings, quick profits    │
│   • STREET FIGHT: 1 BNB moves price 16¢ - balanced for most markets    │
│   • WHALE POND: 1 BNB moves price 8¢ - whales can trade without chaos  │
│   • INSTITUTION: 1 BNB moves price 2¢ - professional stability          │
│   • DEEP SPACE: 1 BNB barely moves - maximum market depth              │
│                                                                          │
│   THE MATH:                                                              │
│   ──────────                                                             │
│   Price impact ≈ tradeSize / (2 × virtualLiquidity)                     │
│                                                                          │
│   • DEGEN: 1 BNB / (2 × 50) = 1% of liquidity → ~33¢ move              │
│   • DEEP SPACE: 1 BNB / (2 × 10000) = 0.005% → negligible move         │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### ⚙️ Configurable Parameters (3-of-3 MultiSig)

> **All economic parameters can be adjusted for NEW markets via governance:**

| Parameter | Default | Range | What It Does |
|-----------|---------|-------|--------------|
| `platformFeeBps` | 100 (1%) | 0-500 (0-5%) | Fee to treasury per trade |
| `creatorFeeBps` | 50 (0.5%) | 0-200 (0-2%) | Fee to market creator per trade |
| `resolutionFeeBps` | 30 (0.3%) | 0-100 (0-1%) | Fee on claims/refunds |
| `proposerRewardBps` | 50 (0.5%) | 0-200 (0-2%) | Reward to proposer from pool |
| `minBet` | 0.005 BNB | 0.001-0.1 | Minimum trade size |
| `minBondFloor` | 0.005 BNB | 0.005-0.1 | Minimum proposer bond |
| `dynamicBondBps` | 100 (1%) | 50-500 (0.5-5%) | Bond as % of pool |
| `bondWinnerShareBps` | 5000 (50%) | 2000-8000 | Winner's share of loser's bond |
| `heatLevelCrack` | 50 × 1e18 | 1-15000 | Virtual liquidity for CRACK |
| `heatLevelHigh` | 200 × 1e18 | 1-15000 | Virtual liquidity for HIGH |
| `heatLevelPro` | 500 × 1e18 | 1-15000 | Virtual liquidity for PRO |
| `heatLevelApex` | 2000 × 1e18 | 1-15000 | Virtual liquidity for APEX |
| `heatLevelCore` | 10000 × 1e18 | 1-15000 | Virtual liquidity for CORE |
| `marketCreationFee` | 0 | 0-0.1 BNB | Fee to create market |

**Note:** Changes only affect NEW markets. Existing markets keep their original parameters.

---

### 🆚 JNGLZ.FUN vs Competitors

| Feature | JNGLZ.FUN | Polymarket | Augur | PredictIt |
|---------|-----------|------------|-------|-----------|
| **Pricing Model** | AMM Bonding Curve | Order Book | AMM (Uniswap-style) | Order Book |
| **Pump & Dump** | ✅ YES | ❌ No | ⚠️ Limited | ❌ No |
| **Instant Liquidity** | ✅ Always | ⚠️ Depends on orders | ✅ Yes | ⚠️ Depends |
| **Resolution** | Street Consensus (30-90 min) | UMA Oracle (48h+) | REP Token Voting | Manual Review |
| **Chain** | BNB Chain | Polygon | Ethereum | Centralized |
| **Fees** | 1.5% trade + 0.3% claim | 2% on winnings | ~1% | 10% on profits |
| **Create Markets** | FREE, anyone | Approval needed | Anyone (fees) | No |

---

## 📜 RULES OF THE GAME

> **Everything you need to understand JNGLZ.FUN in one place.**

### 1️⃣ TRADING FEES (When You Buy/Sell Shares)

| Fee | Amount | Goes To | When |
|-----|--------|---------|------|
| **Platform Fee** | 1.0% | Treasury | Every trade |
| **Creator Fee** | 0.5% | Market Creator | Every trade |
| **Net to Pool** | 98.5% | Betting Pool | Every trade |

**Example:** You buy with 1 BNB
- 0.01 BNB → Treasury (1%)
- 0.005 BNB → Market Creator (0.5%)
- 0.985 BNB → Pool (buys your shares)

---

### 2️⃣ RESOLUTION FEE (0.3%)

The 0.3% resolution fee is applied when you **deposit bonds** or **claim pool winnings**.

| Action | 0.3% Fee? | Applied When |
|--------|-----------|--------------|
| **Proposer posts bond** | ✅ YES | On deposit |
| **Disputer posts bond** | ✅ YES | On deposit |
| **Winner claims pool payout** | ✅ YES | On claim |

**Example - Proposer Bond:**
```
Required bond:     0.005 BNB
You must send:     0.005015 BNB (bond + 0.3% fee)
Fee to Treasury:   0.000015 BNB (0.3%)
Stored as bond:    0.005 BNB
```

**Example - Claiming Winnings:**
```
Pool payout:       10 BNB
Fee to Treasury:   0.03 BNB (0.3%)
You receive:       9.97 BNB
```

---

### 2️⃣.1 NO 0.3% FEE ON:

These actions have **NO** resolution fee because the fee was already paid on deposit, or it's a different fee type:

| Action | Fee? | Reason |
|--------|------|--------|
| **Bond Withdrawals** | ❌ NO | Fee was pre-paid on deposit |
| **Jury Fee Claims** | ❌ NO | Comes from loser's bond, not pool |
| **Creator Fee Withdrawals** | ❌ NO | Comes from trading fees, not pool |

---

### 3️⃣ MARKET CREATION

| Fee | Amount | Notes |
|-----|--------|-------|
| **Creation Fee** | FREE (0 BNB) | Configurable by MultiSig, default is free |

---

### 4️⃣ BONDING CURVE PRICING

```
Price Formula: P(YES) + P(NO) = 0.01 BNB always

Buy more YES → YES price goes UP, NO price goes DOWN
Buy more NO  → NO price goes UP, YES price goes DOWN

Initial: YES = 0.005 BNB (50%), NO = 0.005 BNB (50%)
```

**The Sell Rule (Why You Can't Arbitrage):**
```
When you BUY: You push the price UP, paying progressively more
When you SELL: You push the price DOWN, receiving progressively less

Example: Buy 100 YES shares for 1 BNB
- Trading fees: 1.5% = 0.015 BNB
- You pushed YES price up by buying

Immediately sell those 100 shares:
- You push YES price DOWN as you sell
- Sell value ≈ 0.985 BNB (price impact + fees)
- Net result: ~3% LOSS

Bottom line: Buy→Sell = guaranteed loss. No free money!
```

---

### 5️⃣ HEAT LEVELS (Market Volatility) - v3.5.0

| Level | Virtual Liquidity | Best For | Price Impact |
|-------|-------------------|----------|--------------|
| **CRACK** ☢️ | 50 BNB | Meme/degen markets | ~5-10% per 0.1 BNB |
| **HIGH** 🔥 (default) | 200 BNB | General markets | ~3-5% per 1 BNB |
| **PRO** 🧊 | 500 BNB | Whale/serious markets | ~2-3% per 5 BNB |
| **APEX** 🏛️ | 2,000 BNB | Institutional markets | ~2% per 20 BNB |
| **CORE** 🌌 | 10,000 BNB | Maximum depth markets | ~1% per 100 BNB |

---

### 6️⃣ RESOLUTION TIMELINE

```
Market Expires
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│  CREATOR PRIORITY WINDOW (10 minutes)                       │
│  Only the market creator can propose outcome                │
└─────────────────────────────────────────────────────────────┘
     │
     ▼ (after 10 min, anyone can propose)
┌─────────────────────────────────────────────────────────────┐
│  PROPOSAL: Someone proposes YES or NO + posts bond          │
│  Bond = max(0.005 BNB, 1% of pool)                          │
└─────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│  DISPUTE WINDOW (30 minutes)                                │
│  Anyone can dispute by posting 2× the proposer's bond       │
└─────────────────────────────────────────────────────────────┘
     │
     ├──► NO DISPUTE: Market finalizes after 30 min
     │
     └──► DISPUTED:
              │
              ▼
         ┌─────────────────────────────────────────────────────┐
         │  VOTING WINDOW (1 hour)                             │
         │  Shareholders vote YES or NO                        │
         │  Vote weight = total shares held (YES + NO)         │
         └─────────────────────────────────────────────────────┘
              │
              ▼
         Market finalizes with majority vote outcome
```

**⚖️ What happens on an EXACT 50/50 tie?**
```
If yesVotes == noVotes exactly:
  1. Proposer gets their bond back (no penalty)
  2. Disputer gets their bond back (no penalty)
  3. Market is NOT resolved (stays in limbo)
  4. Emergency refund available at: expiry + 24 hours
  5. All traders can claim proportional refund

Timing example:
  T+0:     Market expires
  T+10m:   Proposal submitted
  T+40m:   Disputed
  T+1h40m: Voting ends → 50/50 TIE
  T+24h:   Emergency refund opens (from original expiry!)
  
  Wait time after tie: ~22 hours (not a fresh 24h)

Fair outcome: If the community can't decide, nobody gets punished.
```

**🚫 What happens if a market has NO TRADES AT ALL?** ⭐ (v3.6.2)
```
If a market expires with 0 YES shares AND 0 NO shares:
  1. proposeOutcome() is BLOCKED with error "OneSidedMarket"
  2. Nobody can propose, dispute, or resolve the market
  3. No emergency refund needed (pool is empty anyway)

Why block proposals on empty markets?
  - Nothing to resolve - pool has 0 BNB
  - Prevents wasted gas on pointless resolution
  - No funds at risk, no action needed
```

**🚫 What happens if a market is ONE-SIDED?** ⭐ (NEW in v3.6.2)
```
If a market has trades on only ONE side (e.g., 100 YES shares, 0 NO shares):
  1. proposeOutcome() is BLOCKED with error "OneSidedMarket"
  2. Nobody can propose - market cannot be resolved normally
  3. Emergency refund available at: expiry + 24 hours
  4. All shareholders get proportional refund

Why block proposals on one-sided markets?
  - No "losing side" to pay winners from
  - Resolution is pointless (everyone "wins" but just gets their own money back minus fees)
  - Emergency refund is the correct path for one-sided markets
```

**🛡️ What happens if winning side has NO holders?** ⭐ (v3.4.0 + v3.6.2)
```
This scenario is now PREVENTED at the proposal stage (v3.6.2).
The v3.4.0 safety check in finalizeMarket() is kept as a backup but should never trigger.

Edge case (shares sold after proposal):
  - Market has YES and NO holders at proposal time
  - Someone proposes YES wins
  - All YES holders sell their shares before finalization
  - finalizeMarket() called → safety check triggers
  - Bond returned, market.proposer cleared (v3.6.2)
  - Emergency refund available

Note: v3.6.2 now CLEARS market.proposer when finalization fails,
enabling emergency refund afterwards.
```

**📊 Edge Case Summary Table (v3.6.2):**
| Scenario | YES Supply | NO Supply | Can Propose? | Resolution Path |
|----------|------------|-----------|--------------|-----------------|
| Normal market | > 0 | > 0 | ✅ Yes | Propose → Finalize → Claim |
| One-sided (YES only) | > 0 | 0 | ❌ No | Emergency refund at 24h |
| One-sided (NO only) | 0 | > 0 | ❌ No | Emergency refund at 24h |
| Empty market | 0 | 0 | ❌ No | Nothing to refund |

---

### 7️⃣ BOND AMOUNTS

| Pool Size | Proposer Bond | Disputer Bond (2×) |
|-----------|---------------|-------------------|
| < 0.5 BNB | 0.005 BNB (floor) | 0.01 BNB |
| 1 BNB | 0.01 BNB | 0.02 BNB |
| 10 BNB | 0.1 BNB | 0.2 BNB |
| 100 BNB | 1.0 BNB | 2.0 BNB |

**Formula:** `Bond = max(0.005 BNB, Pool × 1%)`

---

### 8️⃣ PROPOSER REWARDS ⭐ (NEW in v3.3.0)

| Scenario | Proposer Gets |
|----------|---------------|
| **No Dispute** | Bond back + **0.5% of pool** |
| **Disputed + Wins** | Bond back + 50% of disputer's bond + **0.5% of pool** |
| **Disputed + Loses** | **Loses entire bond** |

**Why 0.5% reward?** Incentivizes people to resolve markets quickly. Without it, proposing has zero financial upside.

**Economics Example (10 BNB pool):**
```
Bond required:     0.1 BNB (1% of pool)
Reward if no dispute: 0.05 BNB (0.5% of pool)
Net profit:        0.05 BNB (+50% ROI on bond!)

If disputed and you WIN:
Bond back:         0.1 BNB
Disputer's bond:   0.2 BNB → You get 50% = 0.1 BNB
Pool reward:       0.05 BNB
Total:             0.25 BNB (+150% ROI!)

If disputed and you LOSE:
You lose:          0.1 BNB (your entire bond)
```

---

### 9️⃣ DISPUTER REWARDS (The Market Hero)

> **🦸 The disputer is the HERO of the system!** They risk 2× the bond to protect the market from wrong resolutions. Without disputers, proposers could lie and steal everyone's money.

| Scenario | Disputer Gets |
|----------|---------------|
| **Wins Vote** | Bond back + 50% of proposer's bond |
| **Loses Vote** | **Loses entire bond** (2× risk!) |

**Why "Hero"?**
- Proposer risks 1× bond, can gain +50-150% ROI
- Disputer risks **2× bond**, can only gain +25% ROI
- Disputer takes MORE risk for LESS reward
- But they SAVE the market from fraud!

**Example (Disputer wins):**
```
Proposer bond:     0.1 BNB
Disputer bond:     0.2 BNB (2× - double the risk!)
Disputer wins vote...
Disputer gets:     0.2 BNB (back) + 0.05 BNB (50% of proposer's)
Net profit:        0.05 BNB (+25% ROI - lower than proposer!)
```

**The disputer's real reward?** Protecting their own winning shares from a fraudulent resolution. They're incentivized to dispute when they KNOW the truth.

---

### 🔟 VOTER REWARDS (Jury Fees)

When a market is **disputed**, the 50% of the loser's bond NOT given to the winner goes to voters on the winning side, proportional to their voting weight.

**Example:**
```
Loser's bond:      0.2 BNB
To winner:         0.1 BNB (50%)
To voters:         0.1 BNB (50%)

Alice voted correctly, has 6000 shares
Bob voted correctly, has 4000 shares
Total winning votes: 10000 shares

Alice gets: 0.1 × (6000/10000) = 0.06 BNB
Bob gets:   0.1 × (4000/10000) = 0.04 BNB
```

---

### ❌ WHAT HAPPENS IF YOU LOSE (Resolution Roles)

> **Every role has risk.** Here's exactly what you lose if things go wrong.

| Role | Your Risk | What You Lose | Who Gets Your Bond? |
|------|-----------|---------------|---------------------|
| **Proposer** | 1% of pool bond | Entire bond (100%) | 50% to disputer, 50% to winning voters |
| **Disputer** | 2× proposer bond | Entire bond (100%) | 50% to proposer, 50% to winning voters |
| **Voter** | No bond required | Nothing directly* | N/A |

*Voters don't lose a bond, but voting with the losing side means: (1) No share of the bond distribution, (2) If the resolution goes against your shares, those shares become worthless.

**Proposer Loss Example (10 BNB pool):**
```
Your bond:         0.1 BNB (1% of pool)
You propose YES, but YES is wrong...
Someone disputes and voters agree with NO.

You lose:          0.1 BNB (entire bond)
Where it goes:     0.05 BNB (50%) → Disputer
                   0.05 BNB (50%) → Voters who voted NO
You get:           NOTHING
```

**Disputer Loss Example (10 BNB pool):**
```
Proposer bond:     0.1 BNB
Your bond:         0.2 BNB (2× - double the risk!)
You dispute, but voters side with proposer...

You lose:          0.2 BNB (entire bond)
Where it goes:     0.1 BNB (50%) → Proposer
                   0.1 BNB (50%) → Voters who voted with proposer
You get:           NOTHING
```

**Voter Loss Example:**
```
You vote with the losing side of a dispute...

You lose:          $0 bond (voters don't stake)
You miss out on:   Share of losing bonder's bond
Additional risk:   If resolution goes against your shares,
                   those shares are now worth $0
```

**⚠️ KEY TAKEAWAYS:**
- **Proposers:** Only propose if you KNOW the truth. Lying = lose your bond.
- **Disputers:** Only dispute if you're CERTAIN. You risk 2× and can only gain 25% ROI.
- **Voters:** Vote for what actually happened, not what you want. Truth = rewards.

---

### 🔟➕ COMPLETE DISPUTE RESOLUTION SUMMARY ⭐

> **This section ties everything together.** Read this if you want to understand exactly who gets what in every scenario.

#### ✅ SCENARIO 1: NO DISPUTE (Proposal Accepted After 30 min)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  PROPOSER proposed YES (or NO), nobody disputed for 30 minutes          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  💰 PROPOSER gets:                                                       │
│     ✓ Bond back (100%)                                                   │
│     ✓ 0.5% of pool as reward                                             │
│                                                                          │
│  📊 WINNING SHAREHOLDERS (YES or NO holders based on outcome):          │
│     ✓ Split the ENTIRE POOL proportionally                               │
│                                                                          │
│  ❌ LOSING SHAREHOLDERS:                                                 │
│     ✗ Get nothing (lost the prediction)                                  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

#### ⚔️ SCENARIO 2: DISPUTED → ORIGINAL PROPOSER WINS THE VOTE

```
┌─────────────────────────────────────────────────────────────────────────┐
│  PROPOSER proposed YES, DISPUTER challenged, VOTERS agreed with YES     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  💰 ORIGINAL PROPOSER gets:                                              │
│     ✓ Bond back (100%)                                                   │
│     ✓ 50% of disputer's bond                                             │
│     ✓ 0.5% of pool as reward  ← ONLY PROPOSER CAN GET THIS              │
│                                                                          │
│  ❌ DISPUTER gets:                                                       │
│     ✗ LOSES entire bond (2× the proposer's bond!)                        │
│     ✗ No pool reward (disputers never get pool reward)                   │
│                                                                          │
│  🗳️ VOTERS who voted with PROPOSER (correct side):                      │
│     ✓ Share the OTHER 50% of disputer's bond (proportional to votes)    │
│                                                                          │
│  📊 WINNING SHAREHOLDERS (YES holders in this example):                 │
│     ✓ Split the ENTIRE POOL proportionally                               │
│                                                                          │
│  ❌ LOSING SHAREHOLDERS (NO holders):                                    │
│     ✗ Get nothing (lost the prediction)                                  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

#### ⚔️ SCENARIO 3: DISPUTED → DISPUTER WINS THE VOTE

```
┌─────────────────────────────────────────────────────────────────────────┐
│  PROPOSER proposed YES, DISPUTER challenged, VOTERS agreed with NO      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  💰 DISPUTER gets:                                                       │
│     ✓ Bond back (100%)                                                   │
│     ✓ 50% of proposer's bond                                             │
│     ✗ NO pool reward (only original proposer can get this)              │
│                                                                          │
│  ❌ ORIGINAL PROPOSER gets:                                              │
│     ✗ LOSES entire bond                                                  │
│     ✗ No pool reward (they were wrong!)                                  │
│                                                                          │
│  🗳️ VOTERS who voted with DISPUTER (correct side):                      │
│     ✓ Share the OTHER 50% of proposer's bond (proportional to votes)    │
│                                                                          │
│  📊 WINNING SHAREHOLDERS (NO holders in this example):                  │
│     ✓ Split the ENTIRE POOL proportionally                               │
│                                                                          │
│  ❌ LOSING SHAREHOLDERS (YES holders):                                   │
│     ✗ Get nothing (lost the prediction)                                  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

#### 🔑 KEY CLARIFICATIONS

| Question | Answer |
|----------|--------|
| **Who gets the 0.5% pool reward?** | ONLY the original proposer, and ONLY if they win (no dispute OR dispute + win vote) |
| **Does the disputer get pool reward?** | ❌ NEVER. Disputers only get bond back + 50% of proposer's bond |
| **Who are "winning voters"?** | Shareholders who voted on the side that WON the vote (not the shareholders of winning outcome) |
| **Do losing voters get jury fees?** | ❌ NEVER. Only voters on the WINNING side split the 50% jury fee portion of the loser's bond |
| **What do winning shareholders get?** | The ENTIRE POOL (minus proposer reward) split proportionally. This is SEPARATE from bond rewards. |
| **Do losing shareholders get anything?** | ❌ NO. They lost the prediction. |
| **Can someone be both a voter AND a shareholder?** | YES! You can earn jury fees (as voter) AND claim pool winnings (as shareholder) |

---

#### ⚠️ LOSS SCENARIOS — WHAT YOU RISK

| Role | What Happens If You Lose | Risk Level |
|------|-------------------------|------------|
| **Proposer** | Lose ENTIRE bond (1% of pool) if disputed and vote goes against you | ⚠️ High |
| **Disputer** | Lose ENTIRE bond (2× proposer bond) if vote goes against you | 🔴 Very High |
| **Voter (losing side)** | Get ZERO jury fees — only winning side voters split the 50% | ⚠️ Medium |
| **Shareholder (losing side)** | Get ZERO from pool — winning side takes all | 🔴 Total Loss |

---

### 1️⃣1️⃣ WINNER PAYOUTS (After Resolution)

Winners share the pool **proportionally** based on their shares:

```
Payout = (Your Winning Shares / Total Winning Shares) × Pool Balance

Example: YES wins, Pool = 10 BNB
- Alice has 600 YES shares (60% of all YES)
- Bob has 400 YES shares (40% of all YES)
- Charlie has 500 NO shares (LOSES)

Alice gets: 10 × 0.60 = 6.0 BNB
Bob gets:   10 × 0.40 = 4.0 BNB
Charlie:    0 BNB (lost the trade)
```

---

### 1️⃣2️⃣ EMERGENCY REFUND (When Normal Resolution Fails)

Emergency refund kicks in when the market **cannot be resolved normally**. There are two scenarios:

**Scenario A: No Proposal for 24 Hours**
```
Timeline:
  T+0:   Market expires
  T+24h: Still no proposal submitted
  
Result: Emergency refund opens immediately
```

**Scenario B: Vote Ends in Exact 50/50 Tie**
```
Timeline:
  T+0:     Market expires
  T+10m:   Proposal submitted
  T+40m:   Disputed
  T+1h40m: Voting ends → EXACT TIE (yesVotes == noVotes)
  
What happens:
  1. Proposer gets bond back (no penalty)
  2. Disputer gets bond back (no penalty)
  3. Market stays UNRESOLVED
  4. Emergency refund opens at: T+24h (original expiry + 24h)
  
Wait time after tie: ~22 hours (clock started at expiry)
```

**How Emergency Refund Works:**
```
Everyone gets back proportional to their TOTAL shares:

Refund = (Your YES + NO Shares / All Shares) × Pool Balance

Example: Pool = 10 BNB
- Alice has 600 shares total (60%)  → Gets 6.0 BNB
- Bob has 400 shares total (40%)    → Gets 4.0 BNB

Note: 0.3% resolution fee is deducted from each refund.
```

**Why 24h from expiry (not from tie)?**
- Prevents gaming: Can't force a tie to delay resolution
- Simple rule: One deadline to remember
- Fair: By tie time (~2h), most of 24h has passed anyway

---

### 1️⃣2️⃣.5️⃣ EMPTY WINNING SIDE (Safety Mechanism v3.4.0) ⭐

**The Problem:**
What if a market resolves to YES, but nobody holds YES shares?
- Example: Everyone bought NO, someone proposes YES wins
- Nobody disputes (why would NO holders defend YES winning?)
- Without protection: Division by zero, funds locked FOREVER

**The Solution:**
When `finalizeMarket()` is called, we check if the winning side has 0 supply:
```solidity
if (winningOutcome && market.yesSupply == 0) {
    // Cannot resolve to YES - no YES holders!
    → Return bonds, emit MarketResolutionFailed
}
if (!winningOutcome && market.noSupply == 0) {
    // Cannot resolve to NO - no NO holders!
    → Return bonds, emit MarketResolutionFailed
}
```

**What Happens When Resolution is Blocked:**
```
1. Market stays UNRESOLVED (resolved = false)
2. Proposer gets bond back (no penalty) → credited to pendingWithdrawals
3. Disputer gets bond back (no penalty) → credited to pendingWithdrawals
4. Pool balance remains UNCHANGED
5. Emergency refund available after 24h from expiry
6. All shareholders can claim proportional refund
```

**Example Scenario:**
```
Market: "Will BTC hit $100k?"
- Alice buys 100 YES shares for 1 BNB
- Bob buys 100 YES shares for 1 BNB
- Nobody buys NO shares (NO supply = 0)
- Pool balance: 2 BNB

Attacker (Charlie):
- Market expires
- Proposes NO wins (with 0.02 BNB bond)
- Nobody disputes (Alice/Bob don't want NO to win!)
- 30 min passes → finalize() called

WITHOUT safety check:
❌ Market resolves to NO
❌ 0 NO holders to distribute pool to
❌ 2 BNB locked forever!

WITH v3.6.2 (one-sided market blocking):
✅ Proposal BLOCKED immediately with OneSidedMarket()
✅ No bond locked, no wasted gas
✅ Pool still has 2 BNB
✅ After 24h: Alice & Bob claim emergency refund

WITH v3.4.0+ safety check (backup, should never trigger):
✅ If somehow proposal passed, resolution blocked at finalization
✅ Charlie gets bond back (0.02 BNB)
✅ market.proposer cleared (v3.6.2)
✅ After 24h: Emergency refund available
```

**Key Points:**
- v3.6.2 blocks one-sided markets at proposal time (primary defense)
- v3.4.0 safety check in finalization is backup (should never trigger)
- Bonds are returned, NOT slashed (no one is penalized)
- Shareholders keep their funds safe
- Emergency refund ensures no funds are ever locked
- This is a SAFETY mechanism, not a bug

---

### 1️⃣2️⃣.6️⃣ EMERGENCY REFUND SECURITY (v3.6.2) ⭐

**The v3.6.2 Protection:**
Emergency refund is now blocked if a valid proposal exists:

```solidity
function emergencyRefund(uint256 marketId) external {
    // ... other checks ...
    
    // v3.6.2: Block if resolution in progress
    if (!paused && market.proposer != address(0)) {
        revert ResolutionInProgress();
    }
}
```

**Why This Matters:**
Without this check, losers could avoid resolution by:
1. Waiting for a correct proposal
2. NOT calling finalizeMarket()
3. Waiting for 24h emergency refund window
4. Taking proportional refund instead of losing

**The Escape Hatch:**
If contract is paused, emergency refund is ALWAYS allowed. This ensures users can recover funds if something goes catastrophically wrong.

**When Emergency Refund Works (v3.6.2):**
| Condition | Emergency Refund? |
|-----------|-------------------|
| No proposal, 24h passed | ✅ Yes |
| Proposal exists, not finalized | ❌ No → Finalize first |
| Finalization failed (cleared proposer) | ✅ Yes |
| Vote tie (cleared proposer) | ✅ Yes |
| Contract paused | ✅ Yes (always) |

---

### 1️⃣2️⃣.7️⃣ 2-HOUR PROPOSAL CUTOFF (v3.6.0+) ⭐

**The Problem:**
Resolution and emergency refund could overlap, creating race conditions and double-spend opportunities.

**The Solution:**
New proposals are blocked 2 hours before emergency refund becomes available:

```
Timeline (v3.6.2):
─────────────────────────────────────────────────────────────────────────
Expiry                                                     Emergency Refund
  │                                                              │
  │  0-22h: Proposals ALLOWED (normal markets only)             │ 24h+
  │         Disputes ALLOWED (within 30min of any proposal)     │
  │                                                              │
  │  22-24h: PROPOSAL CUTOFF                                    │
  │          ├─ NO new proposals allowed                         │
  │          └─ Disputes STILL ALLOWED within 30min window       │
  │                                                              │
─────────────────────────────────────────────────────────────────────────
```

**Why Disputes Are Still Allowed (v3.6.1 Fix):**
```
In v3.6.0, both proposals AND disputes were blocked at the 22h cutoff.
This created an exploit:

v3.6.0 Attack:
1. Attacker waits until T=21:59:30
2. Proposes WRONG outcome (e.g., YES when NO is true)
3. Cutoff kicks in at T=22:00:00
4. Honest users try to dispute → BLOCKED by DisputeWindowClosed!
5. 30 min passes → Market finalizes with WRONG outcome
6. Attacker steals everyone's money

v3.6.1 Fix:
- Proposals still blocked at 22h ✅
- Disputes ONLY blocked by natural 30-min window expiry ✅
- Attacker at T=21:59 can be disputed until T=22:29 ✅
- Resolution completes by T=23:30 at worst ✅
- 30-minute safety gap before T=24:00 emergency refund ✅
```

**Worst-Case Timeline (v3.6.2):**
```
T=21:59:59  Last possible proposal (cutoff at T=22:00:00)
T=22:29:58  Last possible dispute (30min window)
T=23:29:58  Voting ends (1h window)
T=23:29:59  finalize() called
T=24:00:00  Emergency refund available

GAP: 30 minutes between resolution and emergency refund - ALWAYS SAFE!
```

---

### 1️⃣3️⃣ COMPLETE FEE SUMMARY

| Action | Fee | Recipient |
|--------|-----|-----------|
| Buy shares | 1.0% | Treasury |
| Buy shares | 0.5% | Creator |
| Sell shares | 1.0% | Treasury |
| Sell shares | 0.5% | Creator |
| Claim winnings | 0.3% | Treasury |
| Emergency refund | 0.3% | Treasury |
| Create market | FREE | - |
| **Proposer reward** | **0.5% of pool** | **Proposer** ⭐ |

**Maximum total fees:** 1.5% per trade + 0.3% on claim = **1.8%**

---

### 1️⃣4️⃣ ACTION BUTTONS EXPLAINED (What Each Button Does)

> **Complete guide to every action button in the UI and what happens when you click them.**

#### 🟢 BUY YES / BUY NO
**When:** Market is ACTIVE (before expiry)
**Cost:** Your BNB amount + 1.5% fees
**What happens:**
```
1. You send BNB to the contract
2. 1.0% goes to Treasury (platform fee)
3. 0.5% goes to Market Creator
4. 98.5% buys shares via bonding curve
5. You receive shares (amount depends on current price)
6. Price moves UP for the side you bought
```
**Risk:** If your side loses, shares become worthless.

---

#### 🔴 SELL YES / SELL NO
**When:** Market is ACTIVE (before expiry)
**Requirement:** Must own shares of that type
**What happens:**
```
1. You specify how many shares to sell
2. Contract calculates BNB value (bonding curve)
3. 1.0% fee to Treasury
4. 0.5% fee to Creator
5. You receive remaining BNB
6. Price moves DOWN for the side you sold
```
**⚠️ WARNING:** Selling ALWAYS returns less than you paid due to:
- Price impact (you push price down as you sell)
- 1.5% trading fees
- This is BY DESIGN to prevent arbitrage!

---

#### 📝 PROPOSE OUTCOME
**When:** Market is EXPIRED
**Who can click:**
- First 10 minutes: ONLY market creator
- After 10 minutes: Anyone
**Cost:** Bond amount + 0.3% fee
**What happens:**
```
1. You select YES or NO as the outcome
2. You pay bond (max of 0.02 BNB or 1% of pool)
3. 0.3% resolution fee goes to Treasury
4. 30-minute dispute window starts
5. If no dispute → you get bond back + 0.5% reward
```
**Risk:** If someone disputes and wins, you lose your bond.

---

#### ⚔️ DISPUTE
**When:** Market has a PROPOSAL within 30 minutes
**Who can click:** Anyone (even non-shareholders)
**Cost:** 2× proposer's bond + 0.3% fee
**What happens:**
```
1. You click to challenge the proposal
2. You pay 2× the proposer's bond
3. 0.3% resolution fee to Treasury
4. Voting phase starts (1 hour)
5. Shareholders vote on the correct outcome
```
**Risk:** If you lose the vote, you lose your ENTIRE 2× bond.
**Reward:** If you win, you get bond back + 50% of proposer's bond.

---

#### 🗳️ VOTE (Yes/No)
**When:** Market is DISPUTED (voting phase active)
**Who can click:** ONLY shareholders (must own YES or NO shares)
**Cost:** FREE (no BNB required)
**What happens:**
```
1. You vote for either the proposer or disputer's outcome
2. Your vote weight = total shares you own (YES + NO)
3. You can only vote ONCE
4. After voting ends, majority wins
```
**Reward:** If you voted for winning side, you share 50% of loser's bond.

---

#### ✅ FINALIZE
**When:** 
- Dispute window ended (no dispute), OR
- Voting window ended (after dispute)
**Who can click:** Anyone
**Cost:** FREE (just gas)
**What happens:**
```
1. Contract determines final outcome
2. Bonds are CREDITED to pendingWithdrawals (Pull Pattern)
3. Proposer reward (0.5%) CREDITED if they won
4. Voter jury fees CREDITED to winning voters
5. Market status → RESOLVED
6. Claims become available
```
**Note:** Bond/jury recipients must call `withdrawBond()` to receive BNB.

---

#### 💰 CLAIM
**When:** Market is RESOLVED and you have winning shares
**Who can click:** Winners only
**Cost:** 0.3% resolution fee
**What happens:**
```
1. Contract calculates your share of the pool
2. Payout = (Your Shares / Total Winning Shares) × Pool
3. 0.3% fee deducted → Treasury
4. You receive BNB payout IMMEDIATELY
5. Position marked as "claimed" (can't claim twice)
```

---

#### 💸 WITHDRAW BOND (NEW in v3.4.0)
**When:** You have pending withdrawals (bonds, jury fees, proposer rewards)
**Who can click:** Anyone with `pendingWithdrawals[address] > 0`
**Cost:** FREE (just gas)
**What happens:**
```
1. Check your pending balance: getPendingWithdrawal(yourAddress)
2. Call withdrawBond()
3. Contract sends ALL your pending balance
4. Balance reset to 0

Who uses this:
- Proposers: Get bond back + 0.5% reward after finalization
- Disputers: Get bond back + winnings (if they won)
- Voters: Get jury fee share (if voted for winning side)
- Tie scenario: Both proposer and disputer get bonds back
```
**Example:**
```
Alice proposed, market finalized (no dispute)
Her pending balance: 0.15 BNB (0.1 bond + 0.05 reward)
She calls withdrawBond() → receives 0.15 BNB
```

---

#### 🎨 WITHDRAW CREATOR FEES (NEW in v3.4.0)
**When:** You created a market and trades happened
**Who can click:** Market creators with `pendingCreatorFees[address] > 0`
**Cost:** FREE (just gas)
**What happens:**
```
1. Check your pending balance: getPendingCreatorFees(yourAddress)
2. Call withdrawCreatorFees()
3. Contract sends ALL your pending creator fees
4. Balance reset to 0

How creator fees accumulate:
- Every BUY trade: 0.5% credited to you
- Every SELL trade: 0.5% credited to you
- Accumulates across ALL your markets
```
**Example:**
```
Bob created a market, 100 BNB traded through it
Total creator fees: 100 × 0.5% = 0.5 BNB
Bob calls withdrawCreatorFees() → receives 0.5 BNB
```

---

#### 🆘 EMERGENCY REFUND
**When:** 24+ hours after expiry with NO resolution
**Who can click:** Anyone with shares
**Cost:** 0.3% resolution fee
**What happens:**
```
1. Contract checks: expired + 24h passed + not resolved
2. Refund = (Your Total Shares / All Shares) × Pool
3. 0.3% fee deducted
4. You receive proportional BNB refund
5. Position marked as "refunded"
```
**Note:** This is a safety net, not normal operation.

---

#### 📊 BUTTON STATE SUMMARY

| Market Status | Available Buttons |
|---------------|-------------------|
| **Active** | Buy YES, Buy NO, Sell YES, Sell NO |
| **Expired** | Propose Outcome |
| **Proposed** | Dispute (within 30 min) |
| **Disputed** | Vote (shareholders only) |
| **Voting Ended** | Finalize |
| **Resolved** | Claim (winners), View Results |
| **Stuck 24h+** | Emergency Refund |

| Global Actions | When Available |
|----------------|----------------|
| **Withdraw Bond** | `pendingWithdrawals > 0` (after finalization) |
| **Withdraw Creator Fees** | `pendingCreatorFees > 0` (anytime) |

---

### 1️⃣5️⃣ GOVERNANCE (3-of-3 MultiSig)

All protocol parameters can be adjusted by MultiSig (requires **3-of-3** confirmations):
- Platform fee (0-5%)
- Creator fee (0-2%)
- Resolution fee (0-1%)
- Min bet (0.001-0.1 BNB)
- Bond floor (0.005-0.1 BNB)
- Heat level defaults
- Treasury address
- Pause/unpause
- Sweep surplus funds

**Exception - ReplaceSigner (2-of-3):** ⭐ NEW in v3.4.1
```
Emergency signer replacement only needs 2-of-3 confirmations.
This is an "escape hatch" if one signer is compromised/unavailable.

Usage:
1. Signer1 proposes: proposeAction(ReplaceSigner, encode(oldSigner, newSigner))
2. Signer2 confirms: confirmAction(actionId)
3. Done! newSigner replaces oldSigner immediately

Safety checks:
- newSigner cannot be address(0)
- newSigner cannot already be a signer (prevents duplicates)
- oldSigner must exist in the signers array
```

---

### 1️⃣6️⃣ PULL PATTERN EXPLAINED ⭐ (NEW in v3.4.0)

> **Why credits instead of direct transfers?**

**The Problem (Push Pattern):**
```
Old way: finalizeMarket() → sends BNB directly to winner

Attack: Attacker deploys contract that reverts on receive()
        Attacker proposes/disputes from that contract
        When finalizeMarket() tries to pay them → REVERT
        Market stuck forever, nobody can claim!
```

**The Solution (Pull Pattern):**
```
New way: finalizeMarket() → credits pendingWithdrawals[winner]
         Winner calls withdrawBond() to receive BNB

Even if winner's wallet reverts, market still resolves.
Only the attacker is affected, not other users.
```

**What uses Pull Pattern:**
| Fund Type | Credited To | Withdraw Function |
|-----------|-------------|-------------------|
| Proposer bond + reward | `pendingWithdrawals[proposer]` | `withdrawBond()` |
| Disputer bond | `pendingWithdrawals[disputer]` | `withdrawBond()` |
| Jury fees | `pendingWithdrawals[voter]` | `withdrawBond()` |
| Creator fees (0.5%) | `pendingCreatorFees[creator]` | `withdrawCreatorFees()` |

**What still uses Push Pattern:**
| Fund Type | Recipient | Why Push is OK |
|-----------|-----------|----------------|
| Platform fees | Treasury | We control treasury address |
| Claim payouts | Winner | User-initiated, their problem if wallet breaks |
| Emergency refunds | User | User-initiated |

---

## 📋 Table of Contents

- [Quick Start](#-quick-start)
- [How It Works](#-how-it-works)
- [Heat Levels](#-heat-levels)
- [Economics at a Glance](#-economics-at-a-glance)
- [Street Consensus Explained](#-street-consensus-explained)
- [Contract Functions](#-contract-functions)
- [Configuration](#-configuration)
- [Testing](#-testing)
- [Deployment](#-deployment)

---

## 🚀 Quick Start

```bash
# Install dependencies
forge install

# Run tests
forge test

# Run with verbosity
forge test -vvv

# Deploy (testnet)
forge script script/Deploy.s.sol --rpc-url $BSC_TESTNET_RPC --broadcast
```

---

## 🔄 How It Works

### Market Lifecycle

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           MARKET LIFECYCLE                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  1. CREATE          2. TRADE            3. RESOLVE         4. CLAIM     │
│  ────────          ───────            ──────────         ───────        │
│                                                                          │
│  Anyone creates    Users buy/sell     Street Consensus:  Winners get    │
│  market (FREE)     YES/NO shares      propose → dispute  proportional   │
│                    via bonding        → vote (if needed) share of pool  │
│                    curve                                                 │
│                                                                          │
│  ┌──────────┐     ┌──────────┐       ┌──────────┐       ┌──────────┐   │
│  │ Question │ ──► │ Trading  │ ──►   │  Street  │ ──►   │  Payout  │   │
│  │ + Expiry │     │  Active  │       │ Consensus│       │          │   │
│  └──────────┘     └──────────┘       └──────────┘       └──────────┘   │
│                                                                          │
│                        STATUS FLOW                                       │
│        Active → Expired → Proposed → Disputed? → Resolved               │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Bonding Curve Pricing

Prices follow a **Constant Sum** formula: `P(YES) + P(NO) = 0.01 BNB`

```
Initial State:           After YES Buying:        After NO Buying:
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│ YES: 50% (0.005)│      │ YES: 70% (0.007)│      │ YES: 30% (0.003)│
│ NO:  50% (0.005)│      │ NO:  30% (0.003)│      │ NO:  70% (0.007)│
└─────────────────┘      └─────────────────┘      └─────────────────┘
     Balanced              More YES demand         More NO demand
```

---

## Heat Levels

Heat Levels control market volatility through per-market virtual liquidity. Choose the right level for your market type:

**v3.5.0: 5 tiers with 10x liquidity increase for better price stability**

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          HEAT LEVELS (v3.5.0)                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ☢️ CRACK (Degen Flash)              │  Virtual Liquidity: 50 BNB       │
│  ─────────────────────               │  Target Bet: 0.005-0.1 BNB       │
│  • High volatility                   │  Price Impact: ~5-10% per 0.1 BNB│
│  • Small bets move prices            │  Best for: Meme markets, degen   │
│  • Exciting swings                   │                                   │
│                                                                          │
│  🔥 HIGH (Street Fight) - DEFAULT    │  Virtual Liquidity: 200 BNB      │
│  ─────────────────────────────────   │  Target Bet: 0.1-1.0 BNB         │
│  • Balanced volatility               │  Price Impact: ~3-5% per 1 BNB   │
│  • Good price discovery              │  Best for: General markets       │
│  • Default for most markets          │                                   │
│                                                                          │
│  🧊 PRO (Whale Pond)                 │  Virtual Liquidity: 500 BNB      │
│  ───────────────────                 │  Target Bet: 1.0-5.0 BNB         │
│  • Low slippage                      │  Price Impact: ~2-3% per 5 BNB   │
│  • Stable prices                     │  Best for: Serious/whale markets │
│  • Good for larger bets              │                                   │
│                                                                          │
│  🏛️ APEX (Institution)              │  Virtual Liquidity: 2,000 BNB    │
│  ─────────────────────               │  Target Bet: 5.0-20.0 BNB        │
│  • Professional grade                │  Price Impact: ~2% per 20 BNB    │
│  • Very stable pricing               │  Best for: Institutional markets │
│  • Ideal for large positions         │                                   │
│                                                                          │
│  🌌 CORE (Deep Space)                │  Virtual Liquidity: 10,000 BNB   │
│  ───────────────────                 │  Target Bet: 20.0-100+ BNB       │
│  • Maximum depth                     │  Price Impact: ~1% per 100 BNB   │
│  • Near-zero slippage                │  Best for: Maximum liquidity     │
│  • For massive positions             │                                   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### How Virtual Liquidity Works

```
Price Impact = f(bet_size / virtual_liquidity)

Lower vLiq = More price movement per BNB
Higher vLiq = Less price movement per BNB

Example: 1 BNB bet
├── CRACK (50 vLiq):    ~20% price swing
├── HIGH (200 vLiq):    ~5% price swing  
├── PRO (500 vLiq):     ~2% price swing
├── APEX (2000 vLiq):   ~0.5% price swing
└── CORE (10000 vLiq):  ~0.1% price swing
```

### Choosing the Right Heat Level

| Market Type | Recommended Heat | Why |
|-------------|------------------|-----|
| Meme/joke markets | ☢️ CRACK | Max entertainment |
| Sports predictions | 🔥 HIGH | Balanced trading |
| Crypto price bets | 🔥 HIGH | Good price discovery |
| Political events | 🧊 PRO | Stable, serious |
| Whale-heavy markets | 🧊 PRO | Low slippage |
| Professional trading | 🏛️ APEX | Institutional grade |
| Maximum liquidity | 🌌 CORE | Near-zero slippage |

---

## 💰 Economics at a Glance

### Fee Structure (1.8% Total Max)

```
┌────────────────────────────────────────────────────────────┐
│                    TRADING FEES (1.5%)                      │
├────────────────────────────────────────────────────────────┤
│                                                             │
│   Platform Fee ────► 1.0% ────► Treasury                   │
│   Creator Fee  ────► 0.5% ────► Market Creator             │
│   To Pool      ────► 98.5% ──► Betting Pool                │
│                                                             │
├────────────────────────────────────────────────────────────┤
│                    RESOLUTION FEE (0.3%)                    │
├────────────────────────────────────────────────────────────┤
│                                                             │
│   • Charged on propose/dispute/vote actions                │
│   • Prevents spam, generates revenue                       │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

### Proposer/Disputer Economics

```
┌────────────────────────────────────────────────────────────┐
│              BOND ECONOMICS                                 │
├────────────────────────────────────────────────────────────┤
│                                                             │
│   Pool Size      Bond Required       Disputer Bond         │
│   ──────────     ─────────────       ──────────────        │
│   0.3 BNB        0.005 BNB (floor)   0.01 BNB (2x)         │
│   5 BNB          0.05 BNB (1%)       0.10 BNB (2x)         │
│   50 BNB         0.50 BNB (1%)       1.00 BNB (2x)         │
│                                                             │
│   Formula: Bond = max(0.02 BNB, Pool × 1%)                 │
│            Disputer must post 2× proposer's bond           │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

### Bond Distribution After Dispute

```
┌────────────────────────────────────────────────────────────┐
│              IF DISPUTE OCCURS (Voting)                     │
├────────────────────────────────────────────────────────────┤
│                                                             │
│   WINNER (proposer or disputer):                           │
│   • Gets their full bond back                              │
│   • Gets 50% of loser's bond (bonus)                       │
│                                                             │
│   VOTERS ON WINNING SIDE:                                  │
│   • Split 50% of loser's bond (jury fee)                   │
│   • Proportional to their voting weight                    │
│                                                             │
│   LOSER:                                                   │
│   • Loses entire bond                                      │
│                                                             │
│   Example: Proposer wins after dispute                     │
│   ─────────────────────────────────────                    │
│   Proposer bond: 0.5 BNB (gets back + 0.5 BNB bonus)       │
│   Disputer bond: 1.0 BNB (loses all)                       │
│   • 0.5 BNB → Proposer (50% winner share)                  │
│   • 0.5 BNB → Voters who voted with proposer               │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

### 💡 Why No "Resolution Sniper" Rewards?

**Q: Proposers get nothing on undisputed markets. Why would anyone resolve?**

The incentive comes from **people with skin in the game**:

```
┌────────────────────────────────────────────────────────────┐
│         WHO RESOLVES MARKETS & WHY                          │
├────────────────────────────────────────────────────────────┤
│                                                             │
│   👤 THE CREATOR                                            │
│   • Wants their 0.5% creator fee reputation                │
│   • Wants markets to resolve cleanly for future users      │
│   • Has 10-min priority window to propose                  │
│                                                             │
│   🏆 THE WINNERS                                            │
│   • Want their BNB winnings NOW                            │
│   • Won't wait 24h for emergency refund                    │
│   • Can get 2x profit in 30 min by proposing truth         │
│                                                             │
│   ⚔️ THE "STREET JUSTICE" HUNTERS                           │
│   • Watch for WRONG proposals                              │
│   • Dispute liars to STEAL their bond                      │
│   • Reward: 50% of proposer's bond (not a fixed fee)       │
│                                                             │
│   Example "Street Justice" profit:                         │
│   ─────────────────────────────────                        │
│   • Liar proposes wrong outcome, posts 0.05 BNB bond       │
│   • Hunter disputes with 0.10 BNB bond                     │
│   • Voting happens, hunter wins                            │
│   • Hunter gets: 0.10 + 0.025 = 0.125 BNB                  │
│   • NET PROFIT: 0.025 BNB (25% ROI on dispute bond!)       │
│                                                             │
└────────────────────────────────────────────────────────────┘

BOTTOM LINE: Shareholders resolve markets because they want
their money. No external "sniper rewards" needed!
```

### Proposer Scenarios (All Outcomes)

```
┌────────────────────────────────────────────────────────────┐
│         PROPOSER ECONOMICS (3 Scenarios)                    │
├────────────────────────────────────────────────────────────┤
│                                                             │
│   SCENARIO A: No Dispute (Most Common - ~90% of markets)   │
│   ──────────────────────────────────────────────────────   │
│   • Proposer posts bond: 0.005 BNB                         │
│   • 30 min passes, no challenge                            │
│   • Proposer gets bond BACK: 0.005 BNB                     │
│   • NET: 0 BNB (just gas costs)                            │
│   • BUT: Proposer likely HAS A POSITION and gets winnings! │
│                                                             │
│   SCENARIO B: Disputed & Proposer WINS                     │
│   ──────────────────────────────────────                   │
│   • Proposer posts: 0.005 BNB                              │
│   • Disputer posts: 0.01 BNB (2×)                          │
│   • Voting happens, proposer wins                          │
│   • Proposer gets: 0.005 + 50% of 0.01 = 0.01 BNB         │
│   • NET PROFIT: +0.005 BNB (100% ROI on bond!)             │
│                                                             │
│   SCENARIO C: Disputed & Proposer LOSES                    │
│   ──────────────────────────────────────                   │
│   • Proposer posts: 0.005 BNB                              │
│   • Disputer posts: 0.01 BNB                               │
│   • Voting happens, disputer wins                          │
│   • Proposer loses entire bond                             │
│   • NET LOSS: -0.005 BNB                                   │
│                                                             │
│   KEY INSIGHT: Proposers are usually BETTORS who want      │
│   their winnings. The bond is just temporary collateral.   │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

### Voter Rewards (Jury Fee Example)

```
┌────────────────────────────────────────────────────────────┐
│         VOTER JURY FEE CALCULATION                          │
├────────────────────────────────────────────────────────────┤
│                                                             │
│   When a market is DISPUTED, voters on the winning side    │
│   split 50% of the loser's bond (jury fee).               │
│                                                             │
│   Example Setup:                                            │
│   ─────────────                                             │
│   • Disputer loses with 0.10 BNB bond                      │
│   • 50% to winner (proposer): 0.05 BNB                     │
│   • 50% to voters: 0.05 BNB                                │
│                                                             │
│   Voter Distribution:                                       │
│   ───────────────────                                       │
│   • Alice: 5000 shares, voted for proposer ✓               │
│   • Bob: 3000 shares, voted for proposer ✓                 │
│   • Charlie: 2000 shares, voted for disputer ✗             │
│                                                             │
│   Winning voters total: 5000 + 3000 = 8000 shares          │
│                                                             │
│   Alice's jury fee: 0.05 × (5000/8000) = 0.03125 BNB       │
│   Bob's jury fee: 0.05 × (3000/8000) = 0.01875 BNB         │
│   Charlie: 0 BNB (voted wrong side)                        │
│                                                             │
│   ✅ Incentive: Vote honestly to earn jury fees!            │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

### Winner Payout Calculation

```
┌────────────────────────────────────────────────────────────┐
│              EXAMPLE: YES WINS                              │
├────────────────────────────────────────────────────────────┤
│                                                             │
│   Total Pool:           100 BNB                            │
│   Remaining Pool:       100 BNB                            │
│                                                             │
│   Alice (60% of YES):   60 BNB                             │
│   Bob (40% of YES):     40 BNB                             │
│   Charlie (NO holder):  0 BNB   ──► Lost bet               │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

### Emergency Refund (If No Resolution)

```
┌────────────────────────────────────────────────────────────┐
│         EMERGENCY REFUND (24h after expiry)                 │
├────────────────────────────────────────────────────────────┤
│                                                             │
│   Condition: No proposal for 24 hours after expiry         │
│                                                             │
│   Pool: 100 BNB                                            │
│   Alice (owns 60% of all shares): Gets 60 BNB back         │
│   Bob (owns 40% of all shares):   Gets 40 BNB back         │
│                                                             │
│   Formula: refund = (userShares / totalShares) × pool      │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

### 🛡️ Single Shareholder Protection (Game Theory)

**Question:** What happens if you're the ONLY buyer in a market and someone proposes the wrong outcome?

```
┌────────────────────────────────────────────────────────────┐
│         SINGLE SHAREHOLDER SCENARIO                         │
├────────────────────────────────────────────────────────────┤
│                                                             │
│   Timeline:                                                 │
│   ─────────                                                 │
│   1. You buy YES shares (only buyer)                       │
│   2. Market expires                                        │
│   3. Someone proposes "NO" (wrong outcome!)                │
│   4. You have 30 min to dispute                            │
│   5. If disputed → voting phase (1 hour)                   │
│   6. You're the ONLY voter → YOU WIN 100%                  │
│                                                             │
│   ⚠️  THE CATCH:                                            │
│   If you DON'T dispute within 30 minutes:                  │
│   • Wrong proposal gets accepted automatically             │
│   • You lose EVERYTHING                                    │
│                                                             │
│   ✅ PROTECTION (if you act in time):                       │
│   • Dispute with 2× bond                                   │
│   • Vote for yourself (only voter!)                        │
│   • Win your shares + 50% of proposer's bond               │
│                                                             │
└────────────────────────────────────────────────────────────┘

SUMMARY: Single shareholders ARE protected IF they:
• Watch the market after expiry
• Dispute wrong proposals within 30 min
• Vote during the 1-hour voting window

The contract does NOT auto-protect passive users!
```

### 🔍 Who Can Propose vs Who Can Vote

```
┌────────────────────────────────────────────────────────────┐
│         PROPOSE vs VOTE PERMISSIONS                         │
├────────────────────────────────────────────────────────────┤
│                                                             │
│   WHO CAN PROPOSE AN OUTCOME?                              │
│   ──────────────────────────────                           │
│   • First 10 min: ONLY market creator                      │
│   • After 10 min: ANYONE (even non-shareholders)           │
│   • Must post bond (0.02 BNB min or 1% of pool)           │
│                                                             │
│   WHY ALLOW NON-SHAREHOLDERS TO PROPOSE?                   │
│   • Bond requirement = skin in the game                    │
│   • Ensures markets get resolved if creator disappears     │
│   • Incentive: Get bond back + 50% of disputer's bond     │
│                                                             │
│   WHO CAN VOTE? (Only shareholders!)                       │
│   ─────────────────────────────────                        │
│   • ONLY users with yesShares > 0 OR noShares > 0         │
│   • Vote weight = total shares (YES + NO combined)        │
│   • Non-shareholders CANNOT vote                           │
│   • Contract reverts if non-shareholder tries to vote     │
│                                                             │
│   WHY THIS MATTERS:                                        │
│   • Bettors have skin in the game                         │
│   • Prevents vote manipulation by outsiders               │
│   • Larger positions = more voting power                  │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

### 🛡️ Weighted Voting Security (Anti-Sybil)

Votes are **weighted by share ownership**, NOT 1-person-1-vote. This prevents Sybil attacks.

```
┌────────────────────────────────────────────────────────────┐
│         WEIGHTED VOTING: WHY SYBIL ATTACKS DON'T WORK      │
├────────────────────────────────────────────────────────────┤
│                                                             │
│   HOW VOTE WEIGHT IS CALCULATED:                           │
│   ─────────────────────────────                            │
│   voteWeight = position.yesShares + position.noShares      │
│                                                             │
│   EXAMPLE: Alice vs Bots                                   │
│   ──────────────────────                                   │
│   Alice: 100 YES shares → Vote weight: 100                 │
│   Bot1:  2 YES shares   → Vote weight: 2                   │
│   Bot2:  2 YES shares   → Vote weight: 2                   │
│                                                             │
│   If Alice votes YES and bots vote NO:                     │
│   • YES votes: 100                                         │
│   • NO votes: 4                                            │
│   • RESULT: YES wins (Alice's vote = 25× each bot!)        │
│                                                             │
├────────────────────────────────────────────────────────────┤
│   WHY MULTIPLE WALLETS DON'T HELP ATTACKERS:               │
│   ─────────────────────────────────────────                │
│   • Splitting shares across wallets = same total weight    │
│   • 100 shares in 1 wallet = 100 shares in 50 wallets     │
│   • Attackers PAY MORE GAS for no benefit                  │
│                                                             │
│   Attack Analysis:                                         │
│   ────────────────                                         │
│   Honest: 1 BNB → 1 wallet → ~197 shares → weight: 197    │
│   Attack: 1 BNB → 10 wallets → ~197 shares → weight: 197  │
│                              + 10× gas fees!               │
│                                                             │
├────────────────────────────────────────────────────────────┤
│   ADDITIONAL PROTECTIONS:                                  │
│   ───────────────────────                                  │
│   ✅ Trading disabled after expiry (can't buy votes)      │
│   ✅ Double-vote prevention (hasVoted flag)               │
│   ✅ Non-shareholders can't vote (reverts with error)     │
│   ✅ Vote weight locked at time of voting                 │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

---

## ⚖️ Street Consensus Explained

### What is Street Consensus?

Street Consensus is a **decentralized resolution mechanism** where the bettors themselves decide the outcome. No external oracles. No waiting 48+ hours. Just the people with skin in the game voting on what happened.

### The Resolution Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     STREET CONSENSUS FLOW                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   MARKET EXPIRES                                                         │
│        │                                                                 │
│        ▼                                                                 │
│   ┌─────────────────────────────────────────────┐                       │
│   │  STEP 1: Creator Priority (10 min)          │                       │
│   │  • Market creator can propose first         │                       │
│   │  • Posts bond (max of 0.02 BNB or pool×1%)  │                       │
│   │  • Claims "YES won" or "NO won"             │                       │
│   │  • Optional: Include proof link             │                       │
│   └─────────────────────────────────────────────┘                       │
│        │                                                                 │
│        │  After 10 min, anyone can propose                              │
│        ▼                                                                 │
│   ┌─────────────────────────────────────────────┐                       │
│   │  STEP 2: Dispute Window (30 min)            │                       │
│   │  • Anyone can dispute with 2× bond          │                       │
│   │  • Only 1 dispute allowed per market        │                       │
│   │  • Can propose opposite outcome + proof     │                       │
│   └─────────────────────────────────────────────┘                       │
│        │                                                                 │
│        ├──────────────────────┬─────────────────────────┐               │
│        ▼                      ▼                         ▼               │
│   ┌─────────────┐      ┌──────────────┐         ┌──────────────┐       │
│   │ NO DISPUTE  │      │   DISPUTED   │         │ NO PROPOSAL  │       │
│   │             │      │              │         │ FOR 24 HOURS │       │
│   │ Proposal    │      │ Goes to      │         │              │       │
│   │ accepted!   │      │ VOTING       │         │ Emergency    │       │
│   │             │      │ (1 hour)     │         │ refund       │       │
│   │ Market      │      │              │         │ available    │       │
│   │ resolved    │      │              │         │              │       │
│   └─────────────┘      └──────────────┘         └──────────────┘       │
│                              │                                          │
│                              ▼                                          │
│                        ┌───────────────────────────────┐               │
│                        │  STEP 3: Voting (1 hour)      │               │
│                        │                               │               │
│                        │  • Only share holders vote    │               │
│                        │  • Vote weight = share count  │               │
│                        │  • Can't vote twice           │               │
│                        │  • Simple majority wins       │               │
│                        └───────────────────────────────┘               │
│                              │                                          │
│                              ▼                                          │
│                        ┌───────────────────────────────┐               │
│                        │  STEP 4: Finalize             │               │
│                        │                               │               │
│                        │  Proposer wins:               │               │
│                        │  • Gets bond + 50% of         │               │
│                        │    disputer's bond            │               │
│                        │  • Voters split 50%           │               │
│                        │                               │               │
│                        │  Disputer wins:               │               │
│                        │  • Gets bond + 50% of         │               │
│                        │    proposer's bond            │               │
│                        │  • Voters split 50%           │               │
│                        │                               │               │
│                        │  Tie (0 vs 0 votes):          │               │
│                        │  • Both get bonds back        │               │
│                        │  • No resolution, retry       │               │
│                        └───────────────────────────────┘               │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Why Street Consensus?

| Feature | UMA Oracle (Old) | Street Consensus (New) |
|---------|------------------|------------------------|
| Resolution Time | 48-72 hours | **30-90 minutes** |
| External Dependency | UMA Protocol | **None** |
| Who Decides | UMA token holders | **Actual bettors** |
| Bond Token | WBNB (wrapped) | **Native BNB** |
| Complexity | High | **Simple** |
| Proof Required | Yes | **Optional** |

### Timing Constants

| Phase | Duration | Description |
|-------|----------|-------------|
| Creator Priority | 10 min | Head start for market creator |
| Dispute Window | 30 min | Time to challenge proposal |
| Voting Window | 1 hour | Time for bettors to vote |
| Emergency Refund | 24 hours | After expiry with no proposal |

### Bond Economics Table

| Scenario | Proposer | Disputer | Voters | Result |
|----------|----------|----------|--------|--------|
| ✅ No dispute | Gets bond back | N/A | N/A | **Simple resolution** |
| ✅ Disputed, proposer wins | Bond + 50% of disputer | Loses bond | 50% of disputer bond | **Proposer rewarded** |
| ❌ Disputed, disputer wins | Loses bond | Bond + 50% of proposer | 50% of proposer bond | **Disputer rewarded** |
| ⚖️ Tie (0 vs 0 votes) | Gets bond back | Gets bond back | N/A | **Market resets** |

### When Can `finalizeMarket()` Be Called?

The `finalizeMarket()` function can only be called after the appropriate waiting periods have passed. This table shows exactly when finalization is allowed:

| Market Status | Can Finalize? | Error if Called | Explanation |
|---------------|---------------|-----------------|-------------|
| `Active` | ❌ No | `MarketNotResolved()` | Market still trading, not expired |
| `Expired` | ❌ No | `MarketNotResolved()` | No proposal submitted yet |
| `Proposed` (during 30-min dispute window) | ❌ No | `DisputeWindowExpired()` | Must wait for dispute window to end |
| `Proposed` (after 30-min dispute window) | ✅ **Yes** | — | Dispute window ended, no dispute filed |
| `Disputed` (during 1-hour voting window) | ❌ No | `VotingNotEnded()` | Must wait for voting to complete |
| `Disputed` (after 1-hour voting window) | ✅ **Yes** | — | Voting complete, can tally results |
| `Resolved` | ❌ No | `MarketNotResolved()` | Already finalized |

**Key insight:** You cannot finalize during the proposal's dispute window (30 min) OR during the voting window (1 hour). Both waiting periods must complete before finalization is allowed.

### TIE Behavior: Community Gets Multiple Chances

When a disputed market's vote ends in a **TIE** (equal votes on both sides, including 0:0 if nobody votes), the contract implements an elegant retry mechanism:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        TIE RESOLUTION FLOW                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   VOTING ENDS IN TIE (yesVotes == noVotes)                              │
│        │                                                                 │
│        ▼                                                                 │
│   ┌─────────────────────────────────────────────┐                       │
│   │  FINALIZE TIE                               │                       │
│   │  • Proposer bond returned (Pull Pattern)    │                       │
│   │  • Disputer bond returned (Pull Pattern)    │                       │
│   │  • market.proposer = address(0)             │                       │
│   │  • market.disputer = address(0)             │                       │
│   │  • market.resolved stays FALSE              │                       │
│   │  • TieFinalized event emitted               │                       │
│   └─────────────────────────────────────────────┘                       │
│        │                                                                 │
│        ▼                                                                 │
│   Market goes back to "Expired" status!                                 │
│        │                                                                 │
│        ├─────────────────────┬──────────────────────────┐               │
│        ▼                     ▼                          ▼               │
│   ┌─────────────┐     ┌──────────────┐         ┌───────────────┐       │
│   │ BEFORE 22h  │     │ AFTER 22h    │         │ AFTER 24h     │       │
│   │ CUTOFF      │     │ CUTOFF       │         │               │       │
│   │             │     │              │         │               │       │
│   │ Anyone can  │     │ No new       │         │ Emergency     │       │
│   │ propose     │     │ proposals    │         │ refund        │       │
│   │ again!      │     │ allowed      │         │ available     │       │
│   │             │     │              │         │               │       │
│   │ Cycle       │     │ Wait for     │         │ All traders   │       │
│   │ repeats     │     │ 24h refund   │         │ get funds     │       │
│   └─────────────┘     └──────────────┘         └───────────────┘       │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

**What this means:**

| Scenario | Outcome |
|----------|---------|
| TIE at T=5h | New proposal allowed → Resolution can retry |
| TIE at T=15h | New proposal allowed → Resolution can retry |
| TIE at T=21h | New proposal allowed → Resolution can retry (tight window) |
| TIE at T=23h | No new proposals (past 22h cutoff) → Emergency refund at 24h |
| Multiple TIEs | Community keeps retrying until consensus or 22h cutoff |

**Why this is great:**

1. **No Wasted Markets** - A single TIE doesn't kill the market; community gets another shot
2. **Built-in Escalation** - Multiple TIEs mean strong disagreement → eventually goes to refund
3. **Guaranteed Resolution** - 22h cutoff ensures every market reaches a final state
4. **Bond Safety** - TIE = no penalty for either side (both bonds returned)

**Pull Pattern for Bond Returns:**

When a TIE occurs, bonds are credited to `pendingWithdrawals[address]` instead of being sent directly. Users must call `withdrawBond()` to claim their returned bonds:

```solidity
// After TIE finalize, both proposer and disputer can call:
function withdrawBond() external returns (uint256 amount);
```

**Timeline Protection:**

```
0h ────────── 22h ────────── 24h
[Proposals OK]  [Cutoff]     [Emergency Refund]
     ↓
   TIE? → Reset → Try again (if before 22h)
                 └─────────→ Refund path (if after 22h)
```

---

## 📚 Contract Functions

### Market Creation

```solidity
// Create a market (FREE)
function createMarket(
    string question,        // "Will BTC hit $100k by Dec 2025?"
    string evidenceLink,    // "https://coingecko.com/bitcoin" (optional)
    string resolutionRules, // "Based on CoinGecko price at midnight UTC"
    uint256 expiryTimestamp // Unix timestamp when market expires
) returns (uint256 marketId)

// Create market + buy in one transaction (anti-frontrun)
function createMarketAndBuy(...) payable returns (uint256 marketId, uint256 shares)
```

### Trading

```solidity
// Buy shares
function buyYes(uint256 marketId, uint256 minSharesOut) payable returns (uint256 shares)
function buyNo(uint256 marketId, uint256 minSharesOut) payable returns (uint256 shares)

// Sell shares
function sellYes(uint256 marketId, uint256 shares, uint256 minBnbOut) returns (uint256 bnbOut)
function sellNo(uint256 marketId, uint256 shares, uint256 minBnbOut) returns (uint256 bnbOut)

// Preview trades (for UI)
function previewBuy(uint256 marketId, uint256 bnbAmount, bool isYes) view returns (uint256 shares)
function previewSell(uint256 marketId, uint256 shares, bool isYes) view returns (uint256 bnbOut)

// Get max sellable shares (for "Sell Max Available" button)
function getMaxSellableShares(uint256 marketId, uint256 userShares, bool isYes) view returns (uint256 maxShares, uint256 bnbOut)
```

### Resolution (Street Consensus)

```solidity
// Propose outcome (creator has 10 min priority)
function proposeOutcome(uint256 marketId, bool outcome, string proofLink) payable

// Dispute proposal (requires 2× bond)
function dispute(uint256 marketId, string proofLink) payable

// Vote on disputed market (bettors only)
function vote(uint256 marketId, bool supportProposer)

// Finalize market after voting ends
function finalizeMarket(uint256 marketId)

// Claim winnings (after resolution)
function claim(uint256 marketId) returns (uint256 payout)

// Emergency refund (24h after expiry with no proposal)
function emergencyRefund(uint256 marketId) returns (uint256 refund)
```

### View Functions

```solidity
function getYesPrice(uint256 marketId) view returns (uint256)  // Current YES price
function getNoPrice(uint256 marketId) view returns (uint256)   // Current NO price
function getPosition(uint256 marketId, address user) view returns (
    uint256 yesShares,
    uint256 noShares,
    bool claimed,
    bool emergencyRefunded,
    bool hasVoted,
    bool votedForProposer
)
function getMarketStatus(uint256 marketId) view returns (MarketStatus)
// MarketStatus: Active, Expired, Proposed, Disputed, Resolved

function getRequiredBond(uint256 marketId) view returns (uint256)
function canEmergencyRefund(uint256 marketId) view returns (bool eligible, uint256 timeUntil)
```

---

## ⚙️ Configuration

### MultiSig-Configurable Parameters

All parameters are adjustable via 3-of-3 MultiSig:

| Parameter | Default | Range | Description |
|-----------|---------|-------|-------------|
| `creatorFeeBps` | 50 (0.5%) | 0-200 (2%) | Fee to market creator |
| `resolutionFeeBps` | 30 (0.3%) | 0-100 (1%) | Fee on resolution actions |
| `minBondFloor` | 0.02 BNB | 0.01-0.1 BNB | Minimum bond amount |
| `dynamicBondBps` | 100 (1%) | 50-500 (5%) | Bond as % of pool |
| `bondWinnerShareBps` | 5000 (50%) | 2000-8000 | Winner's share of loser bond |
| `platformFeeBps` | 100 (1%) | 0-500 (5%) | Platform trading fee |
| `minBet` | 0.005 BNB | Adjustable | Minimum bet amount |

### Timing Constants (Hardcoded)

| Constant | Value | Description |
|----------|-------|-------------|
| `CREATOR_PRIORITY_WINDOW` | 10 min | Creator's head start |
| `DISPUTE_WINDOW` | 30 min | Time to challenge |
| `VOTING_WINDOW` | 1 hour | Voting period |
| `EMERGENCY_REFUND_DELAY` | 24 hours | Refund eligibility |

---

## 🧪 Testing

```bash
# Run all tests
forge test

# Run with gas reporting
forge test --gas-report

# Run specific test file
forge test --match-contract PumpDumpTest

# Run with verbosity
forge test -vvv

# Run fuzz tests with more runs
forge test --match-contract PredictionMarketFuzzTest --fuzz-runs 1000
```

### Test Coverage

| Test File | Tests | Description |
|-----------|-------|-------------|
| `PredictionMarket.t.sol` | 21 | Core unit tests |
| `PredictionMarket.fuzz.t.sol` | 32 | Fuzz testing |
| `PumpDump.t.sol` | 32 | Economics + proposer rewards |
| `Integration.t.sol` | 16 | Full flow tests |
| `ArbitrageProof.t.sol` | 17 | Arbitrage prevention certification |
| `InstantSellAnalysis.t.sol` | 8 | Sell mechanics |
| `VulnerabilityCheck.t.sol` | 4 | Security tests |
| `WalletBScenario.t.sol` | 1 | Edge case scenarios |
| **Total** | **131** | ✅ All passing (1 skipped) |

---

## 🚀 Deployment

### Prerequisites

1. Set environment variables:
```bash
export PRIVATE_KEY=your_deployer_private_key
export BSC_TESTNET_RPC=https://data-seed-prebsc-1-s1.binance.org:8545
export BSC_MAINNET_RPC=https://bsc-dataseed.binance.org
export BSCSCAN_API_KEY=your_api_key
```

2. Fund deployer wallet with BNB for gas

### Deploy to Testnet

```bash
forge script script/Deploy.s.sol \
    --rpc-url $BSC_TESTNET_RPC \
    --broadcast \
    --verify
```

### Deploy to Mainnet

```bash
forge script script/Deploy.s.sol \
    --rpc-url $BSC_MAINNET_RPC \
    --broadcast \
    --verify
```

---

## 📄 License

MIT License - see [LICENSE](LICENSE)

---

## 🔗 Links

- [BNB Chain](https://www.bnbchain.org/)
- [Foundry Book](https://book.getfoundry.sh/)