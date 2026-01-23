# 📋 JNGLZ.FUN - Contracts Project Context

> Quick reference for AI assistants and developers.  
> **Last Updated:** January 23, 2026  
> **Status:** ✅ Smart Contracts v3.8.2 DEPLOYED - Bug Fixes (Creator Fee, Trade Events)

---

## ✅ Resolved Issues (January 23, 2026)

> **Branch:** `fix/pool-balance-tracking`  
> **Test File:** `test/AMMBugInvestigation.t.sol` (7 tests document behaviors)

| # | Issue | Location | Severity | Status |
|---|-------|----------|----------|--------|
| 1 | `createMarketAndBuy()` missing creator fee | Contract | 🔴 High | ✅ **FIXED in v3.8.2** |
| 2 | AMM sell formula non-linear | Contract (`_calculateSellBnb`) | ℹ️ Info | Expected Behavior |
| 3 | Partial sell may exhaust pool | Contract (`sellYes`/`sellNo`) | ℹ️ Info | Expected Behavior |
| 4 | Trade event emits gross for buy, net for sell | Contract (`emit Trade`) | 🟡 Medium | ✅ **FIXED in v3.8.2** |
| 5 | Subgraph assumes 1.5% fee for all buys | Subgraph (`mapping.ts`) | 🟡 Medium | ✅ **FIXED in v4.0.0** |

### ✅ Bug #1 - Missing Creator Fee (FIXED in v3.8.2)
- `createMarketAndBuy()` now charges 1.5% total (1% platform + 0.5% creator)
- Previously only charged 1% platform fee

### ℹ️ Bug #2 & #3 - AMM Sell Behavior (EXPECTED - Not a Bug)
After investigation, the sell formula behavior is **intentional and correct** for a virtual liquidity AMM:

1. **Pool Solvency:** The pool can only pay out BNB that was deposited. The formula prevents insolvency.
2. **Bonding Curve Design:** Early sellers get better prices, later sellers get worse - this is by design.
3. **One-Sided Edge Case:** `InsufficientPoolBalance` only occurs in unhealthy one-sided markets.
4. **No Arbitrage:** The POST-SELL formula correctly accounts for price impact.

**Frontend Recommendation:** Use `getMaxSellableShares()` to show users what they can actually sell.

### ✅ Bug #4 - Inconsistent Trade Events (FIXED in v3.8.2)
- BUY events now emit `amountAfterFee` (net BNB, what goes to pool)
- SELL events emit `bnbOut` (net BNB, what user receives)
- **Result:** All Trade events consistently emit NET BNB after fees

### ✅ Bug #5 - Subgraph Fee Assumption (FIXED in v4.0.0)
- Subgraph updated to use `bnbAmount` directly for BUY (now net)
- Pool balance tracking is now accurate

---

## 🚀 Contract Status

| Version | Status | Features |
|---------|--------|----------|
| **v3.8.2** | ✅ **DEPLOYED** | Bug Fixes: Creator Fee in createMarketAndBuy, Trade Event Consistency |
| v3.8.1 | ⚠️ DEPRECATED | Contract Size Optimization - Consolidated Governance Functions |
| v3.8.0 | ❌ NOT DEPLOYED | Contract exceeded EVM size limit (26,340 > 24,576 bytes) |
| v3.7.0 | ⚠️ DEPRECATED | Jury Fees Pull Pattern + SweepFunds REMOVED |
| v3.6.2 | ⚠️ DEPRECATED | One-Sided Market & Emergency Bypass Fixes - **HAS GAS GRIEFING BUG** |

### Current Deployment (v3.8.2)
- **Address:** `0x0A5E9e7dC7e78aE1dD0bB93891Ce9E8345779A30`
- **Network:** BNB Testnet (Chain ID: 97)
- **Block:** 86129412
- **TX:** `0x866350d8b5a1762c4f2552d1f48a566982e069dff6065e6cf79083b275b274aa`
- **BscScan:** https://testnet.bscscan.com/address/0x0A5E9e7dC7e78aE1dD0bB93891Ce9E8345779A30
- **Verified:** ✅ Yes
- **Contract Size:** 23,316 bytes (1,260 bytes margin under 24KB limit)

---

## 🎯 Contract Overview

**PredictionMarket.sol** is a single monolithic smart contract that handles:
- Market creation with optional fee (defaults to 0 = free) with **imageUrl** support
- **Heat Levels** - 5 configurable per-market virtual liquidity tiers (v3.5.0)
- Trading YES/NO shares via bonding curve
- **Street Consensus** resolution (bettors vote on outcomes)
- **Proposer Reward** - 0.5% of pool to incentivize quick resolution
- Winner payouts after resolution
- Emergency refunds (24h timeout) - **SECURED in v3.6.0**
- Voter jury fee incentives (50% of loser's bond) - **PULL PATTERN in v3.7.0**
- Dynamic bond pricing
- **Pull Pattern** - griefing-proof distribution for ALL payouts (v3.4.0→v3.7.0)
- **ReplaceSigner** - 2-of-3 emergency signer replacement (v3.4.1)
- **NO SweepFunds** - admins CANNOT extract any funds (v3.7.0 - trust minimization)
- **Individual Propose Functions** - type-safe governance (v3.8.0)
- 3-of-3 MultiSig governance (2-of-3 for ReplaceSigner)

---

## 📊 Current Status

| Component | Progress | Notes |
|-----------|----------|-------|
| Project Setup | ✅ 100% | Foundry initialized |
| Core Contract | ✅ 100% | PredictionMarket.sol complete |
| Heat Levels | ✅ 100% | CRACK/HIGH/PRO/APEX/CORE per-market volatility |
| Bonding Curve Math | ✅ 100% | P(yes) + P(no) = 0.01 BNB |
| Fee System | ✅ 100% | 1% platform + 0.5% creator + 0.3% resolution |
| Market Creation Fee | ✅ 100% | Optional fee (defaults to 0), MultiSig configurable |
| Street Consensus | ✅ 100% | Propose → Dispute → Vote → Finalize |
| Proposer Reward | ✅ 100% | 0.5% of pool to incentivize resolution |
| **Pull Pattern** | ✅ 100% | Griefing-proof distribution (v3.4.0→v3.7.0) |
| **Jury Fees Pull Pattern** | ✅ 100% | Individual `claimJuryFees()` (v3.7.0) |
| **ReplaceSigner** | ✅ 100% | 2-of-3 emergency replacement (v3.4.1) |
| **SweepFunds REMOVED** | ✅ 100% | Trust minimization - admins cannot extract funds (v3.7.0) |
| **Individual Propose Functions** | ✅ 100% | Type-safe governance UX (v3.8.0) |
| **Emergency Refund Security** | ✅ 100% | Double-spend fix, pool insolvency fix (v3.6.0) |
| **Resolution Cutoff** | ✅ 100% | 2-hour buffer before emergency refund (v3.6.0) |
| **Dispute Window Edge Case** | ✅ 100% | Removed cutoff check from dispute() (v3.6.1) |
| **One-Sided Market Blocking** | ✅ 100% | Block proposals on markets with empty side (v3.6.2) |
| **Jury Fees Gas Griefing** | ✅ 100% | Pull Pattern for jury fees (v3.7.0) |
| Emergency Refund | ✅ 100% | 24h timeout, proportional |
| Voter Jury Fee | ✅ 100% | 50% of loser's bond to voters (Pull Pattern) |
| Dynamic Bond | ✅ 100% | max(0.005, pool * 1%) |
| Image URL | ✅ 100% | Market thumbnail support |
| Unit Tests | ✅ 100% | 21 tests passing |
| Fuzz Tests | ✅ 100% | 32 tests passing |
| BondingCurveEconomics Tests | ✅ 100% | 32 tests passing |
| Integration Tests | ✅ 100% | 16 tests passing |
| ArbitrageProof Tests | ✅ 100% | 17 tests (1 skipped) |
| InstantSell Tests | ✅ 100% | 8 tests passing |
| Vulnerability Tests | ✅ 100% | 4 tests passing |
| WalletB Scenario | ✅ 100% | 1 test passing |
| EmptyWinningSide Tests | ✅ 100% | 6 tests passing |
| PullPattern Tests | ✅ 100% | **32 tests passing (sweep tests removed in v3.7.0)** |
| **EmergencyRefundSecurity Tests** | ✅ 100% | **16 tests passing** |
| **OneSidedMarket Tests** | ✅ 100% | **7 tests passing** |
| **PausedEmergencyRefund Tests** | ✅ 100% | **14 tests passing (escape hatch verification)** |
| FinalizeSecurityCheck Tests | ✅ 100% | **9 tests passing** |
| Slither Analysis | ✅ 100% | 43 findings (no critical/high issues) |
| Testnet Deployment | ⏳ 90% | Ready for v3.8.0 deployment |

**Overall Progress: 100%** ✅
**Total Tests: 214 ✅** (1 skipped)

---

## 🎮 Governance System (v3.8.1)

### Consolidated Propose Functions

v3.8.1 consolidates governance functions to fit within the EVM bytecode limit (24KB).

| Function | Parameters | Description |
|----------|------------|-------------|
| `proposeSetFee(FeeType, uint256)` | Type (0-3) + value | Combined fee setting |
| `proposeSetMinBet(uint256)` | Wei | Minimum bet |
| `proposeSetTreasury(address)` | Address | Treasury |
| `proposePause()` | None | Emergency pause |
| `proposeUnpause()` | None | Resume |
| `proposeSetMinBondFloor(uint256)` | Wei | Min bond |
| `proposeSetDynamicBondBps(uint256)` | BPS | Dynamic bond |
| `proposeSetBondWinnerShare(uint256)` | BPS | Winner share |
| `proposeSetHeatLevel(HeatLevel, uint256)` | Level (0-4) + value | Combined heat level |
| `proposeSetProposerReward(uint256)` | BPS (max 200) | Proposer reward |
| `proposeReplaceSigner(address, address)` | Old, new | Replace signer (2-of-3) |

### FeeType Enum
```solidity
enum FeeType {
    Platform,      // 0 - Platform fee (max 5%)
    Creator,       // 1 - Creator fee (max 2%)
    Resolution,    // 2 - Resolution fee (max 1%)
    MarketCreation // 3 - Market creation fee (max 0.1 BNB)
}
```

### HeatLevel Enum
```solidity
enum HeatLevel {
    CRACK,  // 0 - ☢️ Degen Flash
    HIGH,   // 1 - 🔥 Street Fight (DEFAULT)
    PRO,    // 2 - 🧊 Whale Pond
    APEX,   // 3 - 🏛️ Institution
    CORE    // 4 - 🌌 Deep Space
}
```

### Workflow
```
1. Signer1: proposePause()           → auto-approves (1/3)
2. Signer2: confirmAction(actionId)  → (2/3)
3. Signer3: confirmAction(actionId)  → auto-executes ✅
```

📋 See `GOVERNANCE.md` for detailed BscScan usage guide.

---

## Heat Levels (v3.5.0)

5 configurable per-market virtual liquidity tiers for different trading styles.
**v3.5.0: 10x liquidity increase + 2 new tiers (APEX, CORE)**

| Level | Name | Virtual Liquidity | Target Bet | Price Impact |
|-------|------|-------------------|------------|--------------|
| CRACK | ☢️ Degen Flash | 50 × 1e18 | 0.005-0.1 BNB | ~5-10% per 0.1 BNB |
| HIGH | 🔥 Street Fight (DEFAULT) | 200 × 1e18 | 0.1-1.0 BNB | ~3-5% per 1 BNB |
| PRO | 🧊 Whale Pond | 500 × 1e18 | 1.0-5.0 BNB | ~2-3% per 5 BNB |
| APEX | 🏛️ Institution | 2,000 × 1e18 | 5.0-20.0 BNB | ~2% per 20 BNB |
| CORE | 🌌 Deep Space | 10,000 × 1e18 | 20.0-100+ BNB | ~1% per 100 BNB |

**State Variables:**
```solidity
uint256 public heatLevelCrack = 50 * 1e18;    // ☢️ CRACK (was 5)
uint256 public heatLevelHigh = 200 * 1e18;    // 🔥 HIGH (was 20)
uint256 public heatLevelPro = 500 * 1e18;     // 🧊 PRO (was 50)
uint256 public heatLevelApex = 2000 * 1e18;   // 🏛️ APEX (NEW)
uint256 public heatLevelCore = 10000 * 1e18;  // 🌌 CORE (NEW)
```

**Market Struct Fields:**
- `uint256 virtualLiquidity` - Per-market virtual liquidity (immutable after creation)
- `HeatLevel heatLevel` - Heat level enum for display

---

## 🏗️ Architecture

### Single Contract Design
```
PredictionMarket.sol
├── Constants
│   ├── UNIT_PRICE = 0.01 ether
│   ├── MIN_HEAT_LEVEL = 1e18
│   ├── MAX_HEAT_LEVEL = 200e18
│   ├── MAX_FEE_BPS = 500 (5%)
│   ├── MAX_CREATOR_FEE_BPS = 200 (2%)
│   ├── MAX_RESOLUTION_FEE_BPS = 100 (1%)
│   ├── MAX_MARKET_CREATION_FEE = 0.1 ether
│   ├── ACTION_EXPIRY = 1 hour
│   ├── CREATOR_PRIORITY_WINDOW = 10 minutes
│   ├── DISPUTE_WINDOW = 30 minutes
│   ├── VOTING_WINDOW = 1 hour
│   └── EMERGENCY_REFUND_DELAY = 24 hours
│
├── State Variables (Configurable via MultiSig)
│   ├── platformFeeBps = 100 (1% default)
│   ├── creatorFeeBps = 50 (0.5% default)
│   ├── resolutionFeeBps = 30 (0.3% default)
│   ├── marketCreationFee = 0 (free default)
│   ├── heatLevelCrack = 5e18
│   ├── heatLevelHigh = 20e18
│   ├── heatLevelPro = 50e18
│   ├── minBondFloor = 0.005 ether
│   ├── dynamicBondBps = 100 (1%)
│   ├── bondWinnerShareBps = 5000 (50%)
│   ├── minBet = 0.005 ether
│   └── treasury address
│
├── Pull Pattern State (v3.4.0)
│   ├── pendingWithdrawals (user → amount)
│   ├── pendingCreatorFees (creator → amount)
│   ├── totalPendingWithdrawals (for sweep protection)
│   └── totalPendingCreatorFees (for sweep protection)
│
├── Mappings
│   ├── markets (marketId → Market)
│   ├── positions (marketId → user → Position)
│   └── signers (MultiSig)
│
├── Market Lifecycle
│   ├── createMarket(heatLevel) - with optional fee (payable)
│   ├── createMarketAndBuy(heatLevel) - atomic create + buy
│   ├── buyYes() / buyNo()
│   ├── sellYes() / sellNo()
│   ├── proposeOutcome() - propose with bond (no proofLink)
│   ├── dispute() - challenge with 2× bond
│   ├── vote() - weighted by shares
│   ├── finalizeMarket() - settle after voting
│   ├── claim() - winner payouts
│   └── emergencyRefund() - 24h timeout refund
│
├── Pull Pattern Functions (v3.4.0)
│   ├── withdrawBond() - withdraw pending bonds/jury fees
│   ├── withdrawCreatorFees() - withdraw pending creator fees
│   ├── getPendingWithdrawal(address) - check pending balance
│   └── getPendingCreatorFees(address) - check pending balance
│
├── View Functions
│   ├── getMarket()
│   ├── getYesPrice() / getNoPrice()
│   ├── getPosition() - returns 6 values
│   ├── getMarketStatus() - Active/Expired/Proposed/Disputed/Resolved
│   ├── previewBuy() / previewSell()
│   ├── getRequiredBond() - dynamic bond calculation
│   ├── canEmergencyRefund() - eligibility check
│   ├── getMaxSellableShares() - max sellable given pool liquidity
│   ├── getSweepableAmount() - surplus BNB calculation
│   └── isSigner()
│
└── Governance (MultiSig)
    ├── proposeAction()
    ├── confirmAction()
    ├── executeAction()
    ├── 3-of-3 Actions: SetFee, SetTreasury, Pause, SweepFunds, etc.
    └── 2-of-3 Action: ReplaceSigner (emergency escape hatch)
```

---

## 🔐 Pull Pattern (v3.4.0→v3.7.0)

**Why Pull Pattern?**
Prevents griefing attacks where malicious wallets can block market resolution.

| What | Old (Push) | New (Pull) | Version |
|------|------------|------------|---------|
| Proposer bond | Direct transfer | `pendingWithdrawals[proposer]` | v3.4.0 |
| Disputer bond | Direct transfer | `pendingWithdrawals[disputer]` | v3.4.0 |
| Jury fees | O(n) loop | `market.juryFeesPool` + `claimJuryFees()` | **v3.7.0** |
| Creator fees | Direct transfer | `pendingCreatorFees[creator]` | v3.4.0 |

**Users withdraw via:**
- `withdrawBond()` - for bonds
- `withdrawCreatorFees()` - for creator fees
- `claimJuryFees(marketId)` - for jury fees (**v3.7.0**)

**v3.7.0 Jury Fees Fix:**
- Old: O(n) loop through all voters in `_distributeJuryFees()` → gas griefing at >4,600 voters
- New: Store `market.juryFeesPool`, users call `claimJuryFees()` individually → O(1)

---

## 🔑 ReplaceSigner (v3.4.1)

Emergency signer replacement with only 2-of-3 confirmations.

```solidity
// Usage
uint256 actionId = proposeAction(ActionType.ReplaceSigner, abi.encode(oldSigner, newSigner));
// Second signer confirms → auto-executes
confirmAction(actionId);
```

**Safety Checks:**
- `newSigner != address(0)`
- `newSigner != oldSigner`
- `!_isSigner(newSigner)` - prevents duplicates
- Constructor also validates unique signers
```

---

## 🔢 Key Constants

| Constant | Value | Description |
|----------|-------|-------------|
| `UNIT_PRICE` | 0.01 ether | P(YES) + P(NO) always equals this |
| `MIN_HEAT_LEVEL` | 1e18 | Minimum virtual liquidity setting |
| `MAX_HEAT_LEVEL` | 200e18 | Maximum virtual liquidity setting |
| `platformFeeBps` | 100 | 1% platform fee (configurable 0-5%) |
| `creatorFeeBps` | 50 | 0.5% creator fee (configurable 0-2%) |
| `resolutionFeeBps` | 30 | 0.3% resolution fee (configurable 0-1%) |
| `marketCreationFee` | 0 | Optional fee (defaults to 0) |
| `heatLevelCrack` | 5e18 | CRACK level virtual liquidity |
| `heatLevelHigh` | 20e18 | HIGH level virtual liquidity |
| `heatLevelPro` | 50e18 | PRO level virtual liquidity |
| `minBet` | 0.005 ether | Minimum bet (~$3) |
| `minBondFloor` | 0.005 ether | Minimum proposal bond |
| `dynamicBondBps` | 100 | 1% of pool for bond |
| `bondWinnerShareBps` | 5000 | 50% of loser's bond to winner |
| `CREATOR_PRIORITY_WINDOW` | 10 minutes | Creator's head start |
| `DISPUTE_WINDOW` | 30 minutes | Time to challenge |
| `VOTING_WINDOW` | 1 hour | Voting period |
| `EMERGENCY_REFUND_DELAY` | 24 hours | Refund eligibility |
| `ACTION_EXPIRY` | 1 hour | MultiSig action expiry |

---

## 💰 Fee Structure

### Trading Fees: 1.5% on ALL Trades

| Fee Type | BPS | Percentage | Recipient | Configurable |
|----------|-----|------------|-----------|--------------|
| Platform Fee | 100 | 1.0% | Treasury | Yes (0-5%) |
| Creator Fee | 50 | 0.5% | Market Creator | Yes (0-2%) |
| **Total** | 150 | **1.5%** | - | - |

---

## 🧪 Test Coverage

| Test File | Tests | Status |
|-----------|-------|--------|
| PredictionMarket.t.sol | 21 | ✅ Passing |
| PredictionMarket.fuzz.t.sol | 32 | ✅ Passing |
| PumpDump.t.sol | 32 | ✅ Passing |
| Integration.t.sol | 16 | ✅ Passing |
| ArbitrageProof.t.sol | 16 | ✅ Passing (1 skip) |
| InstantSellAnalysis.t.sol | 8 | ✅ Passing |
| VulnerabilityCheck.t.sol | 4 | ✅ Passing |
| WalletBScenario.t.sol | 1 | ✅ Passing |
| EmptyWinningSide.t.sol | 6 | ✅ Passing |
| **PullPattern.t.sol** | **28** | ✅ Passing |

**Total Tests: 164 ✅** (1 expected skip)

### Test Categories
- **Unit tests:** Market creation, trading, fees, resolution, claims, heat levels, sweep
- **Fuzz tests:** Bonding curve math, configurable parameters, edge cases
- **Vulnerability tests:** Reentrancy, overflow, access control
- **Pump & Dump tests:** Economics verification, proposer rewards
- **Street Consensus tests:** Propose/dispute/vote flow
- **Integration tests:** Full lifecycle scenarios
- **ArbitrageProof tests:** Buy→sell arbitrage prevention certification
- **PullPattern tests:** Bond withdrawals, creator fees, jury fees, ReplaceSigner, sweep protection
- **EmptyWinningSide tests:** Safety checks for empty winning side

---

## 📝 Key Events

```solidity
// Market Lifecycle
event MarketCreated(marketId, creator, question, expiryTimestamp, heatLevel, virtualLiquidity);
event Trade(marketId, trader, isYes, isBuy, shares, bnbAmount);

// Street Consensus  
event OutcomeProposed(marketId, proposer, outcome, bond);  // No proofLink in v3.1.0
event ProposalDisputed(marketId, disputer, bond);
event VoteCast(marketId, voter, outcome, weight);
event MarketResolved(marketId, outcome, wasDisputed);

// Payouts
event Claimed(marketId, user, amount);
event JuryFeeDistributed(marketId, voter, amount);
event EmergencyRefunded(marketId, user, amount);

// Governance
event FundsSwept(amount, totalLocked, contractBalance);  // New in v3.1.0
event ActionProposed(actionId, actionType, proposer);
event ActionExecuted(actionId, actionType);
```

---

## 🔒 Security Features

- [x] ReentrancyGuard on all payable functions
- [x] CEI pattern (Checks-Effects-Interactions)
- [x] Overflow protection (Solidity 0.8.24)
- [x] Access control: `onlySigner`
- [x] `InsufficientPoolBalance` check
- [x] Slippage protection parameters
- [x] Action expiry (1 hour)
- [x] Pause mechanism via MultiSig
- [x] Double-vote prevention
- [x] Bond validation (2× for disputer)
- [x] Heat level bounds validation
- [x] SweepFunds only sweeps surplus (user funds safe)
- [x] No receive() - direct BNB transfers revert
- [x] **Pull Pattern** - griefing-proof distribution (v3.4.0)
- [x] **Empty winning side check** - prevents funds locking (v3.4.0)
- [x] **Constructor duplicate check** - no duplicate signers at deploy (v3.4.1)
- [x] **Runtime duplicate check** - ReplaceSigner prevents duplicates (v3.4.1)
- [x] **Sweep protection** - includes totalPendingWithdrawals/Fees (v3.4.1)
- [x] **Paused escape hatch** - emergency refund works even with active proposal when paused (v3.6.2)

---

## 🛑 Pause State Behavior (v3.8.0)

When contract is **paused** via MultiSig:

| Action | When NOT Paused | When Paused |
|--------|-----------------|-------------|
| `buyYes` / `buyNo` | ✅ Works (if market active) | ❌ BLOCKED |
| `sellYes` / `sellNo` | ✅ Works (if market active) | ❌ BLOCKED |
| `createMarket` | ✅ Works | ❌ BLOCKED |
| `proposeOutcome` | ✅ Works | ❌ BLOCKED |
| `dispute` | ✅ Works | ❌ BLOCKED |
| `vote` | ✅ Works | ❌ BLOCKED |
| `claim` | ✅ Works | ✅ **WORKS** (winners can always claim) |
| `emergencyRefund` (no proposal) | ✅ Works (after 24h) | ✅ **WORKS** |
| `emergencyRefund` (proposal exists) | ❌ BLOCKED | ✅ **WORKS (escape hatch!)** |
| `withdrawBond` | ✅ Works | ✅ **WORKS** |
| `withdrawCreatorFees` | ✅ Works | ✅ **WORKS** |
| `claimJuryFees` | ✅ Works | ✅ **WORKS** |

**Key Escape Hatch:** When paused + proposal exists, emergency refund is ALLOWED to let users recover funds if something goes wrong.

---

## 🎮 Quick Reference: Contract Interface (v3.4.1)

```solidity
// ===== Market Creation =====
function createMarket(
    string question,
    string evidenceLink, 
    string resolutionRules,
    string imageUrl,
    uint256 expiryTimestamp,
    HeatLevel heatLevel  // CRACK, HIGH, or PRO
) payable returns (uint256 marketId)

function createMarketAndBuy(
    string question,
    string evidenceLink,
    string resolutionRules,
    string imageUrl,
    uint256 expiryTimestamp,
    HeatLevel heatLevel,
    bool buyYesSide,
    uint256 minSharesOut
) payable returns (uint256 marketId, uint256 sharesOut)

// ===== Street Consensus Resolution =====
function proposeOutcome(uint256 marketId, bool outcome) payable
function dispute(uint256 marketId) payable
function vote(uint256 marketId, bool outcome)
function finalizeMarket(uint256 marketId)
function claim(uint256 marketId) returns (uint256 payout)
function emergencyRefund(uint256 marketId) returns (uint256 refund)

// ===== Pull Pattern Withdrawals (v3.4.0) =====
function withdrawBond() returns (uint256 amount)        // Bonds, jury fees
function withdrawCreatorFees() returns (uint256 amount) // Creator 0.5% fees
function getPendingWithdrawal(address) view returns (uint256)
function getPendingCreatorFees(address) view returns (uint256)

// ===== Governance (3-of-3, except ReplaceSigner 2-of-3) =====
function proposeAction(ActionType, bytes data) returns (uint256 actionId)
function confirmAction(uint256 actionId)
function executeAction(uint256 actionId)
// ActionType.ReplaceSigner: encode(oldSigner, newSigner) - only needs 2-of-3

// ===== Views =====
function getSweepableAmount() view returns (surplus, totalLocked, contractBalance)
```

---

## 📁 File Structure

```
contracts/
├── src/
│   └── PredictionMarket.sol    # Main contract (v3.4.1, ~2000 lines)
├── test/
│   ├── PredictionMarket.t.sol       # Unit tests (21)
│   ├── PredictionMarket.fuzz.t.sol  # Fuzz tests (32)
│   ├── PumpDump.t.sol               # Economics + proposer rewards (32)
│   ├── Integration.t.sol            # Integration tests (16)
│   ├── ArbitrageProof.t.sol         # Arbitrage prevention (16 + 1 skip)
│   ├── InstantSellAnalysis.t.sol    # Sell mechanics (8)
│   ├── VulnerabilityCheck.t.sol     # Security tests (4)
│   ├── WalletBScenario.t.sol        # Edge case scenario (1)
│   ├── EmptyWinningSide.t.sol       # Empty side safety (6)
│   ├── PullPattern.t.sol            # Pull Pattern + ReplaceSigner (28)
│   └── helpers/
│       └── TestHelper.sol           # Test utilities
├── script/
│   └── Deploy.s.sol                 # Deployment script
├── AUDIT.md                         # Security audit (v3.4.1)
├── CHANGELOG.md                     # Version history
├── PROJECT_CONTEXT.md               # This file
└── README.md                        # Main documentation
```

---

## 📚 Resources

- [Foundry Book](https://book.getfoundry.sh/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts)
- [BNB Chain Docs](https://docs.bnbchain.org/)
