# 📋 Junkie.Fun - Contracts Project Context

> Quick reference for AI assistants and developers.  
> **Last Updated:** January 9, 2026  
> **Status:** ✅ Smart Contracts Complete (v3.2.0, 113 tests)

---

## 🚀 Deployment (BNB Testnet)

| Contract | Address | Status |
|----------|---------|--------|
| PredictionMarket (v2.5.0) | `0x3988808940d027a70FE2D0938Cf06580bbad19F9` | ⚠️ DEPRECATED (arbitrage bug) |
| PredictionMarket (v3.2.0) | Not yet deployed | ⏳ Pending |

**BscScan:** https://testnet.bscscan.com/address/0x3988808940d027a70FE2D0938Cf06580bbad19F9
**Deployed Block:** 83243447

---

## 🎯 Contract Overview

**PredictionMarket.sol** is a single monolithic smart contract that handles:
- Market creation with optional fee (defaults to 0 = free) with **imageUrl** support
- **Heat Levels** - configurable per-market virtual liquidity (CRACK/HIGH/PRO)
- Trading YES/NO shares via bonding curve
- **Street Consensus** resolution (bettors vote on outcomes)
- Winner payouts after resolution
- Emergency refunds (24h timeout)
- Voter jury fee incentives (50% of loser's bond)
- Dynamic bond pricing
- 3-of-3 MultiSig governance
- **SweepFunds** - recover surplus/dust BNB from contract

---

## 📊 Current Status

| Component | Progress | Notes |
|-----------|----------|-------|
| Project Setup | ✅ 100% | Foundry initialized |
| Core Contract | ✅ 100% | PredictionMarket.sol complete |
| Heat Levels | ✅ 100% | CRACK/HIGH/PRO per-market volatility |
| Bonding Curve Math | ✅ 100% | P(yes) + P(no) = 0.01 BNB |
| Fee System | ✅ 100% | 1% platform + 0.5% creator + 0.3% resolution |
| Market Creation Fee | ✅ 100% | Optional fee (defaults to 0), MultiSig configurable |
| Street Consensus | ✅ 100% | Propose → Dispute → Vote → Finalize |
| Emergency Refund | ✅ 100% | 24h timeout, proportional |
| Voter Jury Fee | ✅ 100% | 50% of loser's bond to voters |
| Dynamic Bond | ✅ 100% | max(0.005, pool * 1%) |
| Image URL | ✅ 100% | Market thumbnail support |
| SweepFunds | ✅ 100% | Governance can recover surplus BNB |
| Unit Tests | ✅ 100% | 82 tests passing |
| Fuzz Tests | ✅ 100% | 32 tests passing |
| Feature Tests | ✅ 100% | 31 tests passing |
| Vulnerability Tests | ✅ 100% | 4 tests passing |
| Instant Sell Analysis | ✅ 100% | 8 tests passing |
| Integration Tests | ✅ 100% | 16 tests passing |
| Testnet Deployment | ⏳ 90% | v2.5.0 deployed, v3.1.0 pending |

**Overall Progress: 100%** ✅
**Total Tests: 173 ✅**

---

## 🔥 Heat Levels (v3.1.0)

Configurable per-market virtual liquidity for different trading styles:

| Level | Name | Virtual Liquidity | Target Bet | Price Impact |
|-------|------|-------------------|------------|--------------|
| ☢️ CRACK | Degen Flash | 5 × 1e18 | 0.005-0.1 BNB | ~15% per 0.05 BNB |
| 🔥 HIGH | Street Fight (DEFAULT) | 20 × 1e18 | 0.1-1.0 BNB | ~15% per 0.5 BNB |
| 🧊 PRO | Whale Pond | 50 × 1e18 | 1.0-5.0+ BNB | ~15% per 2.0 BNB |

**State Variables:**
```solidity
uint256 public heatLevelCrack = 5 * 1e18;   // Configurable by MultiSig
uint256 public heatLevelHigh = 20 * 1e18;   // Configurable by MultiSig
uint256 public heatLevelPro = 50 * 1e18;    // Configurable by MultiSig
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
└── Governance (3-of-3 MultiSig)
    ├── proposeAction()
    ├── confirmAction()
    ├── executeAction()
    └── ActionTypes: SetHeatLevelCrack, SetHeatLevelHigh, SetHeatLevelPro, SweepFunds, ...
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
| PredictionMarket.t.sol | 82 | ✅ Passing |
| PredictionMarket.fuzz.t.sol | 32 | ✅ Passing |
| VulnerabilityCheck.t.sol | 4 | ✅ Passing |
| PumpDump.t.sol | 31 | ✅ Passing |
| InstantSellAnalysis.t.sol | 8 | ✅ Passing |
| Integration.t.sol | 16 | ✅ Passing |

**Total Tests: 173 ✅**

### Test Categories
- **Unit tests:** Market creation, trading, fees, resolution, claims, heat levels, sweep
- **Fuzz tests:** Bonding curve math, configurable parameters, edge cases
- **Vulnerability tests:** Reentrancy, overflow, access control
- **Pump & Dump tests:** Economics verification
- **Street Consensus tests:** Propose/dispute/vote flow
- **Integration tests:** Full lifecycle scenarios

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

---

## 🎮 Quick Reference: Contract Interface (v3.1.0)

```solidity
// ===== Market Creation =====
function createMarket(
    string question,
    string evidenceLink, 
    string resolutionRules,
    string imageUrl,
    uint256 expiryTimestamp,
    HeatLevel heatLevel  // NEW: CRACK, HIGH, or PRO
) payable returns (uint256 marketId)

function createMarketAndBuy(
    string question,
    string evidenceLink,
    string resolutionRules,
    string imageUrl,
    uint256 expiryTimestamp,
    HeatLevel heatLevel,  // NEW
    bool buyYesSide,
    uint256 minSharesOut
) payable returns (uint256 marketId, uint256 sharesOut)

// ===== Street Consensus Resolution =====
function proposeOutcome(uint256 marketId, bool outcome) payable  // No proofLink

// ===== Views (New) =====
function getSweepableAmount() view returns (surplus, totalLocked, contractBalance)
```

---

## 📁 File Structure

```
contracts/
├── src/
│   └── PredictionMarket.sol    # Main contract (v3.1.0, 1701 lines)
├── test/
│   ├── PredictionMarket.t.sol       # Unit tests (82)
│   ├── PredictionMarket.fuzz.t.sol  # Fuzz tests (32)
│   ├── PumpDump.t.sol               # Economics + feature tests (31)
│   ├── VulnerabilityCheck.t.sol     # Security tests (4)
│   ├── InstantSellAnalysis.t.sol    # Instant sell + liquidity tests (8)
│   ├── Integration.t.sol            # Integration tests (16)
│   └── helpers/
│       └── TestHelper.sol           # Test utilities
├── script/
│   └── Deploy.s.sol                 # Deployment script
├── AUDIT.md                         # Security audit (v3.1.0)
├── CHANGELOG.md                     # Version history
├── PROJECT_CONTEXT.md               # This file
└── README.md                        # Main documentation
```

---

## 📚 Resources

- [Foundry Book](https://book.getfoundry.sh/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts)
- [BNB Chain Docs](https://docs.bnbchain.org/)
