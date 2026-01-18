# 📋 JNGLZ.FUN - Contracts Project Context

> Quick reference for AI assistants and developers.  
> **Last Updated:** January 18, 2026  
> **Status:** ✅ Smart Contracts v3.6.1 READY (180 tests)

---

## 🚀 Contract Status

| Version | Status | Features |
|---------|--------|----------|
| **v3.6.1** | ✅ **READY** | Dispute Window Edge Case Fix |
| v3.6.0 | ⚠️ DEPRECATED | Emergency Refund Security Fix - **HAS EDGE CASE BUG** |
| v3.5.0 | ⚠️ DEPRECATED | 5 Heat Levels (10x liquidity) - **HAS CRITICAL BUG** |
| v3.4.1 | ⚠️ DEPRECATED | ReplaceSigner (2-of-3), Sweep Protection, Pull Pattern |

### Current Deployment (v3.5.0 - DEPRECATED)
- **Address:** `0x8e6c4437CAE7b9B78C593778cCfBD7C595Ce74a8`
- **Network:** BNB Testnet (Chain ID: 97)
- **⚠️ WARNING:** Contains Emergency Refund vulnerability - DO NOT USE
- **Action Required:** Deploy v3.6.1

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
- Voter jury fee incentives (50% of loser's bond)
- Dynamic bond pricing
- **Pull Pattern** - griefing-proof bond/fee distribution (v3.4.0)
- **ReplaceSigner** - 2-of-3 emergency signer replacement (v3.4.1)
- **Sweep Protection** - includes pending withdrawals (v3.4.1)
- 3-of-3 MultiSig governance (2-of-3 for ReplaceSigner)
- **SweepFunds** - recover surplus/dust BNB from contract

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
| **Pull Pattern** | ✅ 100% | Griefing-proof distribution (v3.4.0) |
| **ReplaceSigner** | ✅ 100% | 2-of-3 emergency replacement (v3.4.1) |
| **Sweep Protection** | ✅ 100% | Includes pending funds (v3.4.1) |
| **Emergency Refund Security** | ✅ 100% | Double-spend fix, pool insolvency fix (v3.6.0) |
| **Resolution Cutoff** | ✅ 100% | 2-hour buffer before emergency refund (v3.6.0) |
| **Dispute Window Edge Case** | ✅ 100% | Removed cutoff check from dispute() (v3.6.1) |
| Emergency Refund | ✅ 100% | 24h timeout, proportional |
| Voter Jury Fee | ✅ 100% | 50% of loser's bond to voters |
| Dynamic Bond | ✅ 100% | max(0.005, pool * 1%) |
| Image URL | ✅ 100% | Market thumbnail support |
| SweepFunds | ✅ 100% | Governance can recover surplus BNB |
| Unit Tests | ✅ 100% | 21 tests passing |
| Fuzz Tests | ✅ 100% | 32 tests passing |
| BondingCurveEconomics Tests | ✅ 100% | 32 tests passing (renamed from PumpDump) |
| Integration Tests | ✅ 100% | 16 tests passing |
| ArbitrageProof Tests | ✅ 100% | 17 tests (1 skipped) |
| InstantSell Tests | ✅ 100% | 8 tests passing |
| Vulnerability Tests | ✅ 100% | 4 tests passing |
| WalletB Scenario | ✅ 100% | 1 test passing |
| EmptyWinningSide Tests | ✅ 100% | 6 tests passing |
| PullPattern Tests | ✅ 100% | 28 tests passing |
| **EmergencyRefundSecurity Tests** | ✅ 100% | **16 tests passing (v3.6.0 + v3.6.1)** |
| Slither Analysis | ✅ 100% | 45 findings (no critical/high issues) |
| Testnet Deployment | ⏳ 90% | Ready for v3.6.1 deployment |

**Overall Progress: 100%** ✅
**Total Tests: 180 ✅** (1 skipped)

**Overall Progress: 100%** ✅
**Total Tests: 180 ✅** (1 skipped)

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

## 🔐 Pull Pattern (v3.4.0)

**Why Pull Pattern?**
Prevents griefing attacks where malicious wallets can block market resolution.

| What | Old (Push) | New (Pull) |
|------|------------|------------|
| Proposer bond | Direct transfer | `pendingWithdrawals[proposer]` |
| Disputer bond | Direct transfer | `pendingWithdrawals[disputer]` |
| Jury fees | Direct transfer | `pendingWithdrawals[voter]` |
| Creator fees | Direct transfer | `pendingCreatorFees[creator]` |

**Users withdraw via:**
- `withdrawBond()` - for bonds and jury fees
- `withdrawCreatorFees()` - for creator fees

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
