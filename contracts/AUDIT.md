# Security Audit Report: PredictionMarket.sol

**Contract:** PredictionMarket.sol  
**Version:** v3.8.1  
**Audit Date:** January 22, 2026  
**Auditor:** Internal Review + Slither Static Analysis  
**Solidity Version:** 0.8.24  
**Status:** ✅ DEPLOYED

### Current Deployment (v3.8.1)
- **Address:** `0x3ad26B78DB90a3Fbb5aBc6CF1dB9673DA537cBD5`
- **Network:** BNB Testnet (Chain ID: 97)
- **Block:** 85941857
- **BscScan:** https://testnet.bscscan.com/address/0x3ad26b78db90a3fbb5abc6cf1db9673da537cbd5
- **Verified:** ✅ Yes
- **Contract Size:** 23,316 bytes (1,260 bytes margin under 24KB limit)

### Parameters Configured
- `platformFeeBps`: 100 (1%)
- `creatorFeeBps`: 50 (0.5%)
- `resolutionFeeBps`: 30 (0.3%)
- `proposerRewardBps`: 50 (0.5%)
- `minBet`: 0.005 ether
- `minBondFloor`: 0.005 ether
- `dynamicBondBps`: 100 (1%)
- `bondWinnerShareBps`: 5000 (50%)
- `marketCreationFee`: 0 (free)
- `heatLevelCrack`: 50 * 1e18 (10x increase in v3.5.0)
- `heatLevelHigh`: 200 * 1e18 (10x increase in v3.5.0)
- `heatLevelPro`: 500 * 1e18 (10x increase in v3.5.0)
- `heatLevelApex`: 2000 * 1e18 (NEW in v3.5.0)
- `heatLevelCore`: 10000 * 1e18 (NEW in v3.5.0)

---

## Executive Summary

The PredictionMarket contract implements a decentralized binary prediction market on BNB Chain with:
- **Bonding Curve Pricing:** Linear constant sum model where P(YES) + P(NO) = 0.01 BNB
- **Heat Levels:** 5 configurable tiers (CRACK, HIGH, PRO, APEX, CORE) - **v3.5.0 NEW**
- **10x Virtual Liquidity:** All tiers increased 10x for better price stability - **v3.5.0 NEW**
- **Street Consensus Resolution:** Shareholder voting system for outcome determination
- **Proposer Rewards:** 0.5% of pool paid to successful proposers
- **Pull Pattern for Jury Fees:** Individual `claimJuryFees()` replaces O(n) loop - **v3.7.0 FIX**
- **Pull Pattern:** Griefing-resistant withdrawals for bonds and creator fees (v3.4.0)
- **NO SweepFunds:** Trust minimization - admins cannot extract any funds - **v3.7.0 REMOVED**
- **Individual Propose Functions:** Type-safe governance UX - **v3.8.0 NEW**
- **ReplaceSigner:** 2-of-3 emergency signer replacement (v3.4.1)
- **3-of-3 MultiSig Governance:** All parameter changes require unanimous approval (except ReplaceSigner)
- **Emergency Refund System:** 24-hour failsafe for unresolved markets

### Key Statistics

| Metric | Value |
|--------|-------|
| Total Lines of Code | ~2,319 |
| Total Tests | **191** |
| Test Suites | **12** |
| Slither Findings | 43 (see breakdown below) |
| Critical Issues | 0 |
| High Issues | 0 (false positives - treasury controlled) |
| Medium Issues | 2 (by design) |
| Low Issues | 6 |
| Informational | 10+ |

---

## Version 3.8.1 Changes (CONTRACT SIZE OPTIMIZATION)

### Consolidated Governance Functions

**Type:** Optimization  
**Released:** January 22, 2026

#### Problem Solved

v3.8.0 had 18 individual propose functions which exceeded the EVM bytecode limit:
- v3.8.0: 26,340 bytes (OVER LIMIT - couldn't deploy!)
- **v3.8.1: 23,316 bytes ✅** (1,260 bytes margin)

#### Solution (v3.8.1)

Consolidated 9 functions into 2 using enums:

**Fee Functions (4 → 1):**
```solidity
// OLD (v3.8.0)
proposeSetFee(newValue)
proposeSetCreatorFee(newValue)
proposeSetResolutionFee(newValue)
proposeSetMarketCreationFee(newValue)

// NEW (v3.8.1) - Combined with FeeType enum
proposeSetFee(FeeType feeType, uint256 newValue)
```

**Heat Level Functions (5 → 1):**
```solidity
// OLD (v3.8.0)
proposeSetHeatLevelCrack(newValue)
proposeSetHeatLevelHigh(newValue)
proposeSetHeatLevelPro(newValue)
proposeSetHeatLevelApex(newValue)
proposeSetHeatLevelCore(newValue)

// NEW (v3.8.1) - Combined with HeatLevel enum
proposeSetHeatLevel(HeatLevel level, uint256 newValue)
```

#### New Enums Added

```solidity
enum FeeType {
    Platform,      // 0 - Platform fee (max 5%)
    Creator,       // 1 - Creator fee (max 2%)
    Resolution,    // 2 - Resolution fee (max 1%)
    MarketCreation // 3 - Market creation fee (max 0.1 BNB)
}
```

#### Updated ActionType Enum

```solidity
enum ActionType {
    SetFee,           // Combined fee setting
    SetMinBet,
    SetTreasury,
    Pause,
    Unpause,
    SetMinBondFloor,
    SetDynamicBondBps,
    SetBondWinnerShare,
    SetHeatLevel,     // Combined heat level setting
    SetProposerReward,
    ReplaceSigner
}
```

#### Security Analysis

| Check | Status | Notes |
|-------|--------|-------|
| Double validation | ✅ Safe | Both propose and execute validate inputs |
| Invalid enum values | ✅ Safe | Solidity 0.8.24 reverts on invalid enum |
| Access control | ✅ Safe | `onlySigner` modifier on all propose functions |
| Missing case handlers | ✅ Safe | All enum values have handlers |
| Reentrancy | ✅ Safe | No external calls before state changes |

---

## Version 3.8.0 Changes (GOVERNANCE UX OVERHAUL)

### Individual Propose Functions

**Type:** Improvement  
**Released:** January 19, 2026  
**Status:** ❌ NOT DEPLOYED (exceeded bytecode limit)

---

## Version 3.7.0 Changes (TRUST MINIMIZATION + GAS GRIEFING FIX)

### SweepFunds Removed Entirely

**Type:** Security Hardening  
**Released:** January 19, 2026

#### Rationale
1. Found 2 critical bugs in `_calculateTotalLockedFunds()`
2. Risk of catastrophic user fund loss far outweighs recovering dust
3. Industry best practice (Uniswap, Aave don't have sweep functions)
4. Maximum trust minimization achieved

#### What Was Removed
```solidity
// REMOVED from ActionType enum:
SweepFunds

// REMOVED functions:
function _calculateTotalLockedFunds() internal view
function getSweepableAmount() external view
```

#### Trust Guarantees
- ✅ Governance CANNOT extract any BNB from contract
- ✅ All user funds 100% protected from admin actions
- ✅ Even "dust" remains locked forever (deflationary)

### Jury Fees Gas Griefing Fix

**Severity:** CRITICAL (in v3.6.2) → RESOLVED  
**Type:** Security Fix

#### The Bug (v3.6.2)
O(n) loop in `_distributeJuryFees()` - >4,600 voters exceeded 30M gas limit, bricking finalization.

#### The Fix (v3.7.0)
```solidity
// O(1) storage instead of O(n) loop
market.juryFeesPool = voterPool;

// Individual claim function
function claimJuryFees(uint256 marketId) external nonReentrant
```

---

## Version 3.6.1 Changes (DISPUTE WINDOW EDGE CASE FIX)

### Dispute Window Edge Case Vulnerability Fix

**Severity:** MEDIUM  
**Discovered:** January 18, 2026  
**Fixed:** January 18, 2026  
**Tests Added:** 1 new test, 1 test modified in `EmergencyRefundSecurity.t.sol`

#### The Bug (v3.6.0)

If someone proposed at T=21:59 (1 minute before the 2-hour cutoff), the cutoff would kick in at T=22:00, blocking ALL disputes with `DisputeWindowClosed` error. This allowed a malicious proposer to propose a WRONG outcome knowing nobody could dispute it.

#### The Fix

Removed the cutoff check from `dispute()` function. Disputes are now ONLY blocked by the natural 30-minute dispute window expiry (`DisputeWindowExpired`), not by the 2-hour cutoff.

**Code Removed from `dispute()`:**
```solidity
// REMOVED in v3.6.1:
// uint256 emergencyRefundTime = market.expiryTimestamp + EMERGENCY_REFUND_DELAY;
// if (block.timestamp >= emergencyRefundTime - RESOLUTION_CUTOFF_BUFFER) {
//     revert DisputeWindowClosed();
// }
```

**Code Kept (natural 30-min window):**
```solidity
if (block.timestamp > market.proposalTime + DISPUTE_WINDOW) {
    revert DisputeWindowExpired();
}
```

#### Why This is Safe

The proposal cutoff at 22h already guarantees resolution completes before the 24h emergency refund:

```
Worst case timeline:
- Proposal at T=21:59:59 (just before cutoff)
- Dispute at T=22:29:58 (last second of 30-min window)  
- Voting ends T=23:29:58
- Finalize at T=23:29:59
- Emergency refund at T=24:00:00
- GAP: 30 minutes - SAFE!
```

#### Test Changes
- Renamed `test_Dispute_RevertInCutoffWindow` → `test_Dispute_RevertWhenDisputeWindowExpired`
- Added `test_Dispute_AllowedAfterCutoff_IfWithinDisputeWindow` to verify the fix
- **180 tests now passing**

---

## Version 3.6.0 Changes (CRITICAL SECURITY FIX)

### Emergency Refund Double-Spend Vulnerability Fix

**Severity:** CRITICAL  
**Discovered:** January 18, 2026  
**Fixed:** January 18, 2026  
**Tests Added:** 13 new security tests in `EmergencyRefundSecurity.t.sol`

#### Three-Part Vulnerability (ALL FIXED)

| # | Problem | Fix Applied |
|---|---------|-------------|
| 1 | **Double-Spend** - User could get emergency refund + claim payout (~2x) | Added `if (position.emergencyRefunded) revert` in `claim()` |
| 2 | **Pool Insolvency** - `emergencyRefund()` didn't reduce `poolBalance` | Added `poolBalance -= refund` and zero shares |
| 3 | **Race Condition** - Proposals 22-24h after expiry conflicted with emergency refund | Added 2-hour proposal cutoff buffer (disputes still allowed - v3.6.1) |

#### Code Changes

**Fix 1: Prevent claim after emergency refund**
```solidity
function claim(uint256 marketId) external nonReentrant returns (uint256 payout) {
    // ... existing checks ...
    if (position.emergencyRefunded) revert AlreadyEmergencyRefunded(); // NEW
    // ...
}
```

**Fix 2: Reduce pool balance on emergency refund**
```solidity
function emergencyRefund(uint256 marketId) external nonReentrant returns (uint256 refund) {
    // ... calculate refund ...
    position.emergencyRefunded = true;
    
    // v3.6.0 FIX: Reduce pool balance and supplies
    market.poolBalance -= refund;           // NEW
    market.yesSupply -= position.yesShares; // NEW
    market.noSupply -= position.noShares;   // NEW
    position.yesShares = 0;                 // NEW
    position.noShares = 0;                  // NEW
    
    // ... transfer ...
}
```

**Fix 3: 2-hour resolution cutoff**
```solidity
uint256 public constant RESOLUTION_CUTOFF_BUFFER = 2 hours; // NEW

function proposeOutcome(uint256 marketId, bool outcome) external {
    uint256 emergencyRefundTime = market.expiryTimestamp + EMERGENCY_REFUND_DELAY;
    if (block.timestamp >= emergencyRefundTime - RESOLUTION_CUTOFF_BUFFER) {
        revert ProposalWindowClosed(); // NEW
    }
    // ...
}

function dispute(uint256 marketId) external {
    uint256 emergencyRefundTime = market.expiryTimestamp + EMERGENCY_REFUND_DELAY;
    if (block.timestamp >= emergencyRefundTime - RESOLUTION_CUTOFF_BUFFER) {
        revert DisputeWindowClosed(); // NEW
    }
    // ...
}
```

#### New Constants & Errors
```solidity
uint256 public constant RESOLUTION_CUTOFF_BUFFER = 2 hours;
error ProposalWindowClosed();
error DisputeWindowClosed();
```

#### Timeline Diagram (v3.6.1)
```
Expiry ─────────────────────────────────────────────────> Emergency Refund
  │                                                              │
  │  0-22h: Resolution window                                   │ 24h+
  │  ├─ Propose (10min creator priority, then anyone)           │
  │  ├─ Dispute window (30min after proposal) - NO CUTOFF!      │
  │  └─ Voting window (1h after dispute)                        │
  │                                                              │
  │  22-24h: CUTOFF - No new proposals only                     │
  │         (disputes still allowed within their 30-min window)  │
```

**Maximum resolution time:** 22h + 30min + 1h = 23.5 hours  
**Emergency refund available:** 24 hours  
**Gap:** 30 minutes (ensures resolution always completes before refund)

#### Security Test Coverage (v3.6.0: 13 tests, v3.6.1: +1 test = 14 tests)
- `test_EmergencyRefund_SetsFlag` - Flag set correctly
- `test_Claim_RevertAfterEmergencyRefund` - Double-spend blocked
- `test_DoubleSpend_Prevention` - Full attack scenario blocked
- `test_PoolInsolvency_Prevention` - Pool balance properly reduced
- `test_EmergencyRefund_ZerosUserShares` - Shares zeroed after refund
- `test_ProposeOutcome_RevertInCutoffWindow` - Proposals blocked in cutoff
- `test_ProposeOutcome_WorksBeforeCutoff` - Normal proposals still work
- `test_Dispute_RevertWhenDisputeWindowExpired` - Natural 30-min window check (renamed in v3.6.1)
- `test_Dispute_AllowedAfterCutoff_IfWithinDisputeWindow` - **NEW v3.6.1** - Disputes allowed after cutoff
- `test_Dispute_WorksBeforeCutoff` - Normal disputes still work
- `test_ResolutionCutoff_BoundaryConditions` - Edge cases at 22h
- `test_FullAttackScenario_AllFixesWork` - Complete attack simulation
- `test_NormalResolutionFlow_StillWorks` - Happy path unaffected
- `test_EmergencyRefund_OrderIndependence` - Multiple users refund correctly

---

## Version 3.5.0 Changes Since Last Audit

### Major Feature: Heat Level Rebalance (10x Increase)

**Problem Solved:**
Markets were too volatile - a 0.7 BNB trade in PRO tier moved price from 50% to 75% (25 percentage points), making markets unplayable.

**Solution:**
Increased all virtual liquidity values by 10x and added 2 new tiers for institutional-grade markets.

### New Heat Level System (5 Tiers)

| Tier | Name | OLD Value | NEW Value | Target Trade | Expected Impact |
|------|------|-----------|-----------|--------------|-----------------|
| CRACK | ☢️ DEGEN FLASH | 5 BNB | **50 BNB** | 0.005-0.1 BNB | ~5-10% |
| HIGH | 🔥 STREET FIGHT | 20 BNB | **200 BNB** | 0.1-1.0 BNB | ~3-5% |
| PRO | 🧊 WHALE POND | 50 BNB | **500 BNB** | 1.0-5.0 BNB | ~2-3% |
| APEX | 🏛️ INSTITUTION | N/A | **2,000 BNB** | 5.0-20.0 BNB | ~2% |
| CORE | 🌌 DEEP SPACE | N/A | **10,000 BNB** | 20.0-100+ BNB | ~1% |

### Contract Changes

1. **HeatLevel Enum Extended:**
   ```solidity
   enum HeatLevel { CRACK, HIGH, PRO, APEX, CORE }  // Was 3, now 5
   ```

2. **New State Variables:**
   ```solidity
   uint256 public heatLevelApex = 2000 * 1e18;   // NEW
   uint256 public heatLevelCore = 10000 * 1e18;  // NEW
   ```

3. **Existing Values Updated:**
   ```solidity
   uint256 public heatLevelCrack = 50 * 1e18;    // Was 5
   uint256 public heatLevelHigh = 200 * 1e18;    // Was 20
   uint256 public heatLevelPro = 500 * 1e18;     // Was 50
   ```

4. **MAX_HEAT_LEVEL Constant:**
   ```solidity
   uint256 public constant MAX_HEAT_LEVEL = 15000 * 1e18;  // Was 200
   ```

5. **New ActionTypes for MultiSig:**
   - `SetHeatLevelApex` - Governance can adjust APEX liquidity
   - `SetHeatLevelCore` - Governance can adjust CORE liquidity

6. **_createMarket() Updated:**
   - Now handles all 5 heat levels in switch statement

### Security Impact Assessment

| Change | Risk Level | Notes |
|--------|------------|-------|
| New enum values (APEX, CORE) | NONE | Additive change, no breaking |
| 10x liquidity increase | NONE | Economic parameter, no security impact |
| New state variables | NONE | Standard storage, no external calls |
| New ActionTypes | NONE | Same MultiSig pattern, 3-of-3 required |
| MAX_HEAT_LEVEL increase | NONE | Validation still enforced |

**Conclusion:** v3.5.0 changes are purely additive economic parameters. No new attack vectors introduced.

---

## Version 3.4.1 Changes (Previous Release)

### New Features
1. **ReplaceSigner (2-of-3)** - Emergency escape hatch for compromised/lost signer keys
   - Only requires 2 confirmations (not 3) for emergency recovery
   - Validates new signer is not address(0)
   - Prevents old == new replacement
   - **Prevents duplicate signers** (critical for governance integrity)
   - Emits `SignerReplaced(oldSigner, newSigner, actionId)` event

2. **Constructor Duplicate Signer Check** - Prevents deployment with duplicate signers
   - Nested loop validation at deployment time
   - Combined with runtime check provides complete duplicate prevention

3. **Sweep Protection Enhanced** - `_calculateTotalLockedFunds()` now includes:
   - `totalPendingWithdrawals` - All unclaimed bonds/jury fees
   - `totalPendingCreatorFees` - All unclaimed creator fees
   - Prevents sweep from touching Pull Pattern funds

### v3.4.0 Features (Previous Release)
- **Pull Pattern** for bonds, jury fees, and creator fees
- **Empty Market Proposal Block** (`NoTradesToResolve` error)
- **Empty Winning Side Safety Check** (prevents funds locking)

---

## Slither Static Analysis Results (v3.6.1)

**Tool:** Slither v0.11.x  
**Detectors Run:** 100  
**Results:** 45 findings (no change from v3.6.0)

### Finding Categories

| Severity | Count | Status |
|----------|-------|--------|
| High | 2 | ⚠️ False Positives (arbitrary-send-eth to treasury - we control it) |
| Medium | 2 | ✅ Mitigated by Design |
| Low | 14 | ℹ️ Informational / By Design |
| Optimization | 9 | 📝 Assembly in OpenZeppelin (expected) |
| Complexity | 2 | 📝 High cyclomatic complexity in `finalizeMarket` and `_executeAction` |
| Informational | 16+ | 📝 Low-level calls, pragma versions, timestamps |

### Timestamp Comparisons (Expected)

The following functions use timestamp comparisons (all expected by design):
- `proposeOutcome()` - Checks resolution cutoff and creator priority window
- `dispute()` - Checks dispute window (v3.6.1: only natural 30-min window, no cutoff check)
- `vote()` - Checks voting window
- `finalizeMarket()` - Checks dispute/voting window expiry
- `emergencyRefund()` - Checks 24h delay
- `canEmergencyRefund()` - View function for UI
- `confirmAction()` / `executeAction()` - Action expiry check
- `_getMarketStatus()` - Market state determination
- `_createMarket()` - Expiry validation

**Risk Assessment:** LOW - All windows are measured in hours (30 min to 24 hours). Miner manipulation of ~15 seconds cannot meaningfully exploit any of these checks.

---

## Detailed Findings

### HIGH-01/02: Arbitrary ETH Sends (FALSE POSITIVE)

**Slither Detection:** `arbitrary-send-eth`

**Affected Functions:**
- `_distributeJuryFees()` - sends to treasury when no winning voters
- `_executeAction()` - SweepFunds sends to treasury

**Analysis:**
```solidity
(success,) = treasury.call{value: voterPool}();  // _distributeJuryFees
(success,) = treasury.call{value: surplus}();    // SweepFunds
```

**Risk Assessment:** FALSE POSITIVE
- `treasury` is set in constructor and only changeable via 3-of-3 MultiSig
- Treasury is a controlled address (team wallet)
- Cannot be exploited to send funds to arbitrary addresses

**Mitigation Status:** ✅ By Design - Treasury is MultiSig controlled

---

### MEDIUM-01: Reentrancy in Trading Functions

**Slither Detection:** `reentrancy-vulnerabilities-2`

**Affected Functions:**
- `buyYes()`, `buyNo()`, `sellYes()`, `sellNo()`

**Description:**
State variables (`pendingCreatorFees`, `totalPendingCreatorFees`) written after external call to treasury.

**Analysis:**
```solidity
// Platform fee sent first (external call)
(success,) = treasury.call{value: platformFee}("");

// Then creator fee credited (state write)
pendingCreatorFees[market.creator] += creatorFee;
totalPendingCreatorFees += creatorFee;
```

**Risk Assessment:** LOW
- All trading functions have `nonReentrant` modifier
- Treasury is a trusted address (cannot re-enter maliciously)
- State writes after call are for Pull Pattern credits (not withdrawals)
- No funds at risk even if re-entered

**Mitigation Status:** ✅ Mitigated by `nonReentrant` modifier

---

### MEDIUM-02: Divide Before Multiply

**Slither Detection:** `divide-before-multiply`

**Affected Function:** `claim()`

**Description:**
```solidity
grossPayout = (winningShares * market.poolBalance) / totalWinningShares;
fee = (grossPayout * resolutionFeeBps) / BPS_DENOMINATOR;
```

**Risk Assessment:** LOW
- Precision loss is minimal (wei-level)
- Using 1e18 scaling for shares provides sufficient precision
- Maximum loss per transaction: ~1-2 wei

**Mitigation Status:** ✅ Acceptable - Precision is sufficient for practical use

---

### LOW-01: Timestamp Dependencies

**Slither Detection:** `timestamp`

**Affected Functions:** 10+ functions use `block.timestamp`

**Risk Assessment:** LOW
- BNB Chain block time is ~3 seconds
- Time windows are intentionally long (10min, 30min, 1hr, 24hr)
- Miner manipulation of ~15 seconds cannot meaningfully exploit these windows

**Mitigation Status:** ✅ By Design

---

### LOW-02: Different Solidity Versions

**Description:**
- Main contract: `pragma solidity 0.8.24;`
- OpenZeppelin imports: `pragma solidity ^0.8.20;`

**Risk Assessment:** NONE - 0.8.24 is within ^0.8.20 range

---

### LOW-03: Low-Level Calls

**Description:** Contract uses `.call{value:}()` for all ETH transfers.

**Risk Assessment:** NONE - This is the RECOMMENDED pattern
- `.transfer()` has fixed 2300 gas limit, breaks with contract recipients
- All calls check return value

---

### LOW-04: High Cyclomatic Complexity

**Affected Functions:**
- `finalizeMarket()` - Complexity: 12
- `_executeAction()` - Complexity: 39

**Risk Assessment:** NONE
- Switch pattern appropriate for action dispatching
- Each case is independent and straightforward

---

### LOW-05: Calls Inside a Loop

**Affected Function:** `_distributeJuryFees()`

**Description:** Loop iterates over voters to credit jury fees.

**Risk Assessment:** LOW (IMPROVED in v3.4.0)
- Now uses Pull Pattern - only credits `pendingWithdrawals`, no external calls in loop
- Original concern about failed transfers blocking resolution is eliminated
- Loop only writes to storage mappings

**Mitigation Status:** ✅ Fixed in v3.4.0 with Pull Pattern

---

### LOW-06: Solidity Version Issues (OpenZeppelin)

**Description:** OpenZeppelin ^0.8.20 has known compiler issues.

**Risk Assessment:** NONE - We use 0.8.24 which has fixes

---

## Test Coverage Analysis

### Test Suite Breakdown (179 Total)

| Test File | Tests | Focus |
|-----------|-------|-------|
| PredictionMarket.t.sol | 21 | Core unit tests |
| PredictionMarket.fuzz.t.sol | 32 | Property-based fuzz testing |
| BondingCurveEconomics.t.sol | 32 | Economics + proposer rewards (renamed from PumpDump.t.sol) |
| Integration.t.sol | 16 | Full lifecycle scenarios |
| ArbitrageProof.t.sol | 16 (1 skipped) | Arbitrage prevention certification |
| InstantSellAnalysis.t.sol | 8 | Sell mechanics verification |
| VulnerabilityCheck.t.sol | 4 | Known vulnerability patterns |
| WalletBScenario.t.sol | 1 | Edge case scenarios |
| EmptyWinningSide.t.sol | 6 | Empty side safety checks |
| PullPattern.t.sol | 28 | Pull Pattern + ReplaceSigner tests |
| **EmergencyRefundSecurity.t.sol** | **15** | **v3.6.0 security tests (NEW)** |

### Key Test Scenarios Covered

✅ **Emergency Refund Security (15 tests in EmergencyRefundSecurity.t.sol - NEW)**
- Double-spend prevention (claim after refund blocked)
- Pool insolvency prevention (balance reduced on refund)
- Resolution cutoff enforcement (proposal/dispute blocked at 22h)
- Boundary condition tests at cutoff
- Full attack scenario simulation
- Order-independent multiple refunds
- Clean pool accounting on claim (pool/supply reduction)

✅ **Pull Pattern (28 tests in PullPattern.t.sol)**
- Creator fees credited on buy/sell trades
- `withdrawCreatorFees()` functionality
- `withdrawBond()` functionality  
- Bond returns on tie scenarios
- Jury fees distribution via Pull Pattern
- Sweep protection includes pending funds

✅ **ReplaceSigner (NEW - 6 tests)**
- `test_ReplaceSigner_Success` - 2-of-3 confirmation works
- `test_ReplaceSigner_RequiresOnly2of3` - Doesn't need 3rd confirmation
- `test_ReplaceSigner_OnlySignerCanPropose` - Access control
- `test_ReplaceSigner_CannotReplaceWithZeroAddress` - Validates new signer
- `test_ReplaceSigner_CannotReplaceSameAddress` - old != new
- `test_ReplaceSigner_PreventDuplicateSigner` - No duplicate signers allowed

✅ **Empty Winning Side Safety (6 tests)**
- Resolution blocked when winning side has 0 holders
- Bonds returned via Pull Pattern
- Emergency refund available after failed resolution

✅ **Arbitrage Prevention (16 tests)**
- Buy→sell = guaranteed loss
- Pump/dump attacks unprofitable
- All heat levels tested

✅ **Proposer Rewards (6 tests)**
- 0.5% reward on undisputed finalization
- Reward included in dispute win payout
- Governance can adjust 0-2%

---

## Known Limitations & Design Decisions

### 1. Heat Levels Are Immutable Per Market
**Decision:** virtualLiquidity set at creation, cannot change  
**Mitigation:** Five options available at creation time

### 2. No Oracle Dependency
**Decision:** "Street Consensus" resolution by shareholders  
**Mitigation:** Bond system, voting weighted by stake

### 3. No Upgradability
**Decision:** Immutable contract  
**Mitigation:** Extensive testing (179 tests), MultiSig pause, emergency refund

### 4. ReplaceSigner Uses 2-of-3 (NEW)
**Decision:** Emergency escape hatch if one signer is compromised/lost  
**Risk:** Two colluding signers could replace the third  
**Mitigation:** 
- All other actions still require 3-of-3
- Event emitted for monitoring
- Intended for emergencies only

### 5. SweepFunds Iterates All Markets
**Decision:** Full calculation each sweep  
**Risk:** Gas cost scales with market count  
**Mitigation:** MultiSig controlled, execute only when needed

### 6. Pull Pattern Requires User Action
**Decision:** Users must call `withdrawBond()`/`withdrawCreatorFees()`  
**Risk:** Users may forget to withdraw  
**Mitigation:** 
- Frontend shows pending balances prominently
- No time limit on withdrawals
- Funds are safe indefinitely

### 7. Resolution Window Limited to 22 Hours (v3.6.0, updated v3.6.1)
**Decision:** Only PROPOSALS blocked 2 hours before emergency refund (v3.6.1: disputes allowed within their window)  
**Reason:** Prevents race condition while ensuring legitimate disputes aren't blocked  
**Impact:** Proposals must be made within 22h of expiry; disputes allowed anytime within 30-min window  
**Mitigation:** 22 hours is more than sufficient for resolution (typical: <2 hours)

---

## Pre-Deployment Checklist

### Smart Contract
- [x] All 180 tests passing (179 pass + 1 expected skip)
- [x] Slither analysis completed (45 findings - no critical/high issues)
- [x] ReentrancyGuard applied to all state-changing external functions
- [x] Constructor validates no duplicate signers
- [x] ReplaceSigner validates no duplicate signers at runtime
- [x] Pull Pattern implemented for bonds, jury fees, creator fees
- [x] Sweep protection includes `totalPendingWithdrawals` and `totalPendingCreatorFees`
- [x] **Emergency refund double-spend FIXED (v3.6.0)**
- [x] **Pool insolvency prevention FIXED (v3.6.0)**
- [x] **Resolution cutoff implemented (v3.6.0)**
- [x] **Dispute window edge case FIXED (v3.6.1)** - disputes allowed within 30-min window regardless of cutoff
- [ ] MultiSig addresses configured correctly (3 unique addresses)
- [ ] Treasury address set

### Parameters Configured
- `platformFeeBps`: 100 (1%)
- `creatorFeeBps`: 50 (0.5%)
- `resolutionFeeBps`: 30 (0.3%)
- `proposerRewardBps`: 50 (0.5%)
- `minBet`: 0.005 ether
- `minBondFloor`: 0.005 ether
- `dynamicBondBps`: 100 (1%)
- `bondWinnerShareBps`: 5000 (50%)
- `marketCreationFee`: 0 (free)
- `heatLevelCrack`: 50 * 1e18
- `heatLevelHigh`: 200 * 1e18
- `heatLevelPro`: 500 * 1e18
- `heatLevelApex`: 2000 * 1e18
- `heatLevelCore`: 10000 * 1e18

### Operational
- [ ] MultiSig signers verified (3 separate entities/devices)
- [ ] Treasury wallet tested and secured
- [ ] Monitoring setup for events (especially `SignerReplaced`, `FundsSwept`)
- [ ] Emergency response plan documented
- [ ] Frontend integration tested on testnet

---

## Risk Summary

| Risk Category | Level | Notes |
|--------------|-------|-------|
| Reentrancy | LOW | Mitigated by ReentrancyGuard + Pull Pattern |
| Access Control | LOW | 3-of-3 MultiSig (2-of-3 for ReplaceSigner only) |
| Arithmetic | LOW | Solidity 0.8.24 built-in overflow checks |
| DoS | LOW | Pull Pattern eliminates griefing, sweep is MultiSig controlled |
| Arbitrage | **NONE** | Fixed in v3.2.0, verified by 16 tests |
| Griefing | **NONE** | Pull Pattern prevents blocking via malicious wallets |
| Oracle Manipulation | N/A | No oracles used |
| Front-Running | LOW | Bonding curve + slippage protection |
| Timestamp Manipulation | LOW | Long time windows (2h+ cutoff) |
| Centralization | LOW | MultiSig governance, no upgradability |
| Duplicate Signers | **NONE** | Validated at constructor AND runtime |
| **Double-Spend** | **NONE** | **Fixed in v3.6.0** |
| **Pool Insolvency** | **NONE** | **Fixed in v3.6.0** |

---

## Conclusion

The PredictionMarket contract v3.6.0 demonstrates solid security practices:

1. **Defense in Depth:** Multiple layers (ReentrancyGuard, MultiSig, time delays, Pull Pattern)
2. **Economic Security:** Bond system + Proposer rewards align incentives
3. **Comprehensive Testing:** 179 tests including security, Pull Pattern, arbitrage-proof, fuzz
4. **Conservative Design:** Immutable, no external dependencies, fail-safe emergency refund
5. **Griefing Resistant:** Pull Pattern prevents malicious wallets from blocking operations
6. **Recovery Mechanism:** 2-of-3 ReplaceSigner for emergency signer recovery
7. **Emergency Refund Security:** Double-spend and insolvency vulnerabilities fixed

**v3.6.0 Security Additions:**
- Emergency refund double-spend fix (claim blocked after refund)
- Pool insolvency prevention (balance reduced on refund)
- 2-hour resolution cutoff buffer
- 13 new security tests in `EmergencyRefundSecurity.t.sol`

**Recommended Actions Before Mainnet:**
1. Deploy v3.6.0 to testnet and verify all fixes
2. Run testnet for 1-2 weeks with real traffic
3. Set up event monitoring (SignerReplaced, FundsSwept, WithdrawalCredited, EmergencyRefunded)
4. Document emergency response procedures
5. Consider professional third-party audit for additional assurance

---

*This audit is provided for informational purposes. It does not constitute financial advice or guarantee of contract security. Users should conduct their own due diligence.*
