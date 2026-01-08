# 📋 Junkie.Fun - Contracts Project Context

> Quick reference for AI assistants and developers.  
> **Last Updated:** January 8, 2026  
> **Status:** ✅ Smart Contracts Complete & Deployed (v2.5.0, 163 tests)

---

## 🚀 Deployment (BNB Testnet)

| Contract | Address | Status |
|----------|---------|--------|
| PredictionMarket (v2.5.0) | `0x3988808940d027a70FE2D0938Cf06580bbad19F9` | ✅ Verified |

**BscScan:** https://testnet.bscscan.com/address/0x3988808940d027a70FE2D0938Cf06580bbad19F9
**Deployed Block:** 83243447

---

## 🎯 Contract Overview

**PredictionMarket.sol** is a single monolithic smart contract that handles:
- Market creation with optional fee (defaults to 0 = free) with **imageUrl** support
- Trading YES/NO shares via bonding curve
- **Street Consensus** resolution (bettors vote on outcomes)
- Winner payouts after resolution
- Emergency refunds (24h timeout)
- Voter jury fee incentives (50% of loser's bond)
- Dynamic bond pricing
- 3-of-3 MultiSig governance

---

## 📊 Current Status

| Component | Progress | Notes |
|-----------|----------|-------|
| Project Setup | ✅ 100% | Foundry initialized |
| Core Contract | ✅ 100% | PredictionMarket.sol complete |
| Bonding Curve Math | ✅ 100% | P(yes) + P(no) = 0.01 BNB |
| Fee System | ✅ 100% | 1% platform + 0.5% creator + 0.3% resolution |
| Market Creation Fee | ✅ 100% | Optional fee (defaults to 0), MultiSig configurable |
| Street Consensus | ✅ 100% | Propose → Dispute → Vote → Finalize |
| Emergency Refund | ✅ 100% | 24h timeout, proportional |
| Voter Jury Fee | ✅ 100% | 50% of loser's bond to voters |
| Dynamic Bond | ✅ 100% | max(0.005, pool * 1%) |
| Image URL | ✅ 100% | Market thumbnail support (v2.4.0) |
| Unit Tests | ✅ 100% | 72 tests passing |
| Fuzz Tests | ✅ 100% | 32 tests passing |
| Feature Tests | ✅ 100% | 31 tests passing |
| Vulnerability Tests | ✅ 100% | 4 tests passing |
| Instant Sell Analysis | ✅ 100% | 8 tests passing |
| Integration Tests | ✅ 100% | 16 tests passing |
| Testnet Deployment | ✅ 100% | v2.4.0 deployed & verified |

**Overall Progress: 100%** ✅
**Total Tests: 163 ✅**

---

## 🏗️ Architecture

### Single Contract Design
```
PredictionMarket.sol
├── Constants
│   ├── UNIT_PRICE = 0.01 ether
│   ├── VIRTUAL_LIQUIDITY = 100e18
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
│   ├── createMarket() - with optional fee (payable)
│   ├── createMarketAndBuy() - atomic create + buy
│   ├── buyYes() / buyNo()
│   ├── sellYes() / sellNo()
│   ├── proposeOutcome() - propose with bond
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
│   ├── getMaxSellableShares() - max sellable given pool liquidity (NEW)
│   └── isSigner()
│
└── Governance (3-of-3 MultiSig)
    ├── proposeAction()
    ├── confirmAction()
    └── executeAction()
```

---

## 🔢 Key Constants

| Constant | Value | Description |
|----------|-------|-------------|
| `UNIT_PRICE` | 0.01 ether | P(YES) + P(NO) always equals this |
| `VIRTUAL_LIQUIDITY` | 100e18 | Virtual shares per side |
| `platformFeeBps` | 100 | 1% platform fee (configurable 0-5%) |
| `creatorFeeBps` | 50 | 0.5% creator fee (configurable 0-2%) |
| `resolutionFeeBps` | 30 | 0.3% resolution fee (configurable 0-1%) |
| `marketCreationFee` | 0 | Optional fee (defaults to 0) |
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

### Resolution Fee: 0.3% on Actions

| Action | Fee | Description |
|--------|-----|-------------|
| `proposeOutcome()` | 0.3% of bond | Charged on proposal |
| `dispute()` | 0.3% of bond | Charged on dispute |
| `vote()` | 0.3% of voting weight | Spam prevention |

### Fee Flow (Buy Example)
```
User sends 1 BNB
├── Platform Fee: 0.01 BNB → Treasury
├── Creator Fee: 0.005 BNB → Market Creator
└── To Pool: 0.985 BNB → market.poolBalance
```

---

## 📐 Bonding Curve Math

### Price Formula
```solidity
virtualYes = yesSupply + VIRTUAL_LIQUIDITY  // 100e18
virtualNo = noSupply + VIRTUAL_LIQUIDITY    // 100e18
totalVirtual = virtualYes + virtualNo

P(YES) = UNIT_PRICE × virtualYes / totalVirtual
P(NO) = UNIT_PRICE × virtualNo / totalVirtual

// Constraint: P(YES) + P(NO) = UNIT_PRICE (0.01 BNB)
```

### Initial State
- Virtual YES: 100e18
- Virtual NO: 100e18
- Total: 200e18
- YES price: 0.005 BNB (50%)
- NO price: 0.005 BNB (50%)

### Buy Formula
```solidity
shares = (bnbAmount × totalVirtual × 1e18) / (UNIT_PRICE × virtualSide)
```

### Sell Formula (Average Price - Critical!)
```solidity
P1 = price before sell
P2 = price after sell (simulated)
avgPrice = (P1 + P2) / 2
bnbOut = shares × avgPrice / 1e18
```

### Why Average Price for Selling?
Prevents pool insolvency. If instant price was used:
- Buy at low price → get many shares
- Sell at high price → drain pool

Average price ensures: `bnbOut ≤ bnbIn` (approximately)

### ⚠️ Instant Sell Liquidity Constraint

**Important:** When a user is the ONLY buyer in a market (no opposing side liquidity), they CANNOT immediately sell 100% of their position.

| Buy Amount | Max Instant Sellable | Position Stuck |
|------------|---------------------|----------------|
| 0.1 BNB | 95% | 5% |
| 0.5 BNB | 83% | 17% |
| 1 BNB | 74% | 26% |
| 2 BNB | 65% | 35% |

**Root Cause:** The average price formula doesn't have enough pool liquidity to cover full position returns when you're the only buyer.

**Good News:** When opposing liquidity exists (buyers on both YES and NO), full instant selling works perfectly.

**Frontend Solution:** Use `getMaxSellableShares(marketId, userShares, isYes)` to:
1. Show users their max sellable amount
2. Display "Sell Max Available" button
3. Show liquidity health indicator

---

## ⚖️ Street Consensus Resolution

### Resolution Flow
```
Market Expires
     │
     ▼
Creator can propose (10 min priority)
     │
     ▼
Anyone can propose after priority
     │
     ▼
30-minute dispute window
     │
     ├─ No dispute → Proposal accepted, market resolved
     │
     └─ Disputed → Goes to VOTING (1 hour)
                        │
                        ▼
                   Bettors vote (weighted by shares)
                        │
                        ├─ Proposer wins → Gets bond + 50% of disputer bond
                        │                  Voters split 50% of disputer bond
                        │
                        ├─ Disputer wins → Gets bond + 50% of proposer bond
                        │                  Voters split 50% of proposer bond
                        │
                        └─ Tie (0 vs 0) → Both get bonds back, market resets
```

### If Nobody Proposes (24h after expiry)
```
No proposal for 24 hours
     │
     ▼
emergencyRefund() becomes available
     │
     ▼
Users self-claim proportional refund
Formula: refund = (userShares / totalShares) * poolBalance
```

### Bond Economics

| Pool Size | Proposer Bond | Disputer Bond (2×) |
|-----------|---------------|-------------------|
| 1 BNB | 0.02 BNB (floor) | 0.04 BNB |
| 5 BNB | 0.05 BNB (1%) | 0.10 BNB |
| 50 BNB | 0.50 BNB (1%) | 1.00 BNB |
| 500 BNB | 5.00 BNB (1%) | 10.00 BNB |

### Bond Distribution After Dispute

| Scenario | Winner Gets | Voters Get | Loser |
|----------|-------------|------------|-------|
| Proposer wins | Bond + 50% disputer | 50% disputer | Loses all |
| Disputer wins | Bond + 50% proposer | 50% proposer | Loses all |
| Tie (0 vs 0) | Bond back | Nothing | Bond back |

---

## 🌐 Deployment Status

### BSC Testnet (Chain ID: 97)
| Contract | Address | Verified |
|----------|---------|----------|
| PredictionMarket | Not deployed | ❌ |

### BSC Mainnet (Chain ID: 56)
| Contract | Address | Verified |
|----------|---------|----------|
| PredictionMarket | Not deployed | ❌ |

---

## 🧪 Test Coverage

| Test File | Tests | Status |
|-----------|-------|--------|
| PredictionMarket.t.sol | 72 | ✅ Passing |
| PredictionMarket.fuzz.t.sol | 32 | ✅ Passing |
| VulnerabilityCheck.t.sol | 4 | ✅ Passing |
| PumpDump.t.sol | 31 | ✅ Passing |
| InstantSellAnalysis.t.sol | 8 | ✅ Passing |

**Total Tests: 163 ✅**

### Test Categories
- **Unit tests:** Market creation, trading, fees, resolution, claims
- **Fuzz tests:** Bonding curve math, configurable parameters, edge cases
- **Vulnerability tests:** Reentrancy, overflow, access control
- **Pump & Dump tests:** Economics verification
  - Early buyer profits +36.6%
  - Late buyer loses ~27%
  - Pool solvency (never negative)
  - InsufficientPoolBalance protection
  - Creator first-mover advantage
- **Street Consensus tests:**
  - Propose/dispute/vote flow
  - Creator priority window
  - Bond distribution
  - Jury fee distribution
  - Tie handling
- **Emergency Refund tests:** 
  - 24h timeout
  - Proportional distribution
  - Order-independent fairness

---

## 📝 Events

```solidity
// Market Lifecycle
event MarketCreated(uint256 indexed marketId, address indexed creator, string question, uint256 expiryTimestamp);
event Trade(uint256 indexed marketId, address indexed trader, bool isYes, bool isBuy, uint256 shares, uint256 bnbAmount);

// Street Consensus
event OutcomeProposed(uint256 indexed marketId, address indexed proposer, bool outcome, uint256 bond, string proofLink);
event MarketDisputed(uint256 indexed marketId, address indexed disputer, uint256 bond, string proofLink);
event VoteCast(uint256 indexed marketId, address indexed voter, bool supportProposer, uint256 weight);
event MarketFinalized(uint256 indexed marketId, bool outcome, address winner, uint256 winnerBonus, uint256 voterPool);
event MarketResolved(uint256 indexed marketId, bool outcome);

// Payouts
event Claimed(uint256 indexed marketId, address indexed user, uint256 amount);
event JuryFeePaid(uint256 indexed marketId, address indexed voter, uint256 amount);
event EmergencyRefunded(uint256 indexed marketId, address indexed user, uint256 amount);

// Governance
event ActionProposed(uint256 indexed actionId, ActionType actionType, address indexed proposer);
event ActionConfirmed(uint256 indexed actionId, address indexed confirmer);
event ActionExecuted(uint256 indexed actionId, ActionType actionType);
event Paused(address indexed by);
event Unpaused(address indexed by);
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

---

## 🎮 Quick Reference: Contract Interface

```solidity
// ===== Market Creation =====
function createMarket(
    string question,
    string evidenceLink, 
    string resolutionRules,
    uint256 expiryTimestamp
) returns (uint256 marketId)

function createMarketAndBuy(
    string question,
    string evidenceLink,
    string resolutionRules, 
    uint256 expiryTimestamp,
    bool buyYesSide,
    uint256 minSharesOut
) payable returns (uint256 marketId, uint256 sharesOut)

// ===== Trading =====
function buyYes(uint256 marketId, uint256 minSharesOut) payable returns (uint256 sharesOut)
function buyNo(uint256 marketId, uint256 minSharesOut) payable returns (uint256 sharesOut)
function sellYes(uint256 marketId, uint256 shares, uint256 minBnbOut) returns (uint256 bnbOut)
function sellNo(uint256 marketId, uint256 shares, uint256 minBnbOut) returns (uint256 bnbOut)

// ===== Street Consensus Resolution =====
function proposeOutcome(uint256 marketId, bool outcome, string proofLink) payable
function dispute(uint256 marketId, string proofLink) payable
function vote(uint256 marketId, bool supportProposer)
function finalizeMarket(uint256 marketId)

// ===== Claims =====
function claim(uint256 marketId) returns (uint256 payout)
function emergencyRefund(uint256 marketId) returns (uint256 refund)

// ===== Views =====
function getYesPrice(uint256 marketId) view returns (uint256)
function getNoPrice(uint256 marketId) view returns (uint256)
function previewBuy(uint256 marketId, uint256 bnbAmount, bool isYes) view returns (uint256)
function previewSell(uint256 marketId, uint256 shares, bool isYes) view returns (uint256)
function getMaxSellableShares(uint256 marketId, uint256 userShares, bool isYes) view returns (uint256 maxShares, uint256 bnbOut)
function getPosition(uint256 marketId, address user) view returns (uint256, uint256, bool, bool, bool, bool)
function getMarket(uint256 marketId) view returns (...)
function getMarketStatus(uint256 marketId) view returns (MarketStatus)
function getRequiredBond(uint256 marketId) view returns (uint256)
function canEmergencyRefund(uint256 marketId) view returns (bool, uint256)

// ===== Governance =====
function proposeAction(ActionType actionType, bytes data) returns (uint256 actionId)
function confirmAction(uint256 actionId)
function executeAction(uint256 actionId)
```

---

## 📁 File Structure

```
contracts/
├── src/
│   └── PredictionMarket.sol    # Main contract
├── test/
│   ├── PredictionMarket.t.sol       # Unit tests (72)
│   ├── PredictionMarket.fuzz.t.sol  # Fuzz tests (32)
│   ├── PumpDump.t.sol               # Economics + feature tests (31)
│   ├── VulnerabilityCheck.t.sol     # Security tests (4)
│   ├── InstantSellAnalysis.t.sol    # Instant sell + liquidity tests (8)
│   └── helpers/
│       └── TestHelper.sol           # Test utilities
├── script/
│   └── Deploy.s.sol                 # Deployment script
├── lib/                             # Dependencies
├── CHANGELOG.md                     # Version history
├── PROJECT_CONTEXT.md               # This file
├── README.md                        # Main documentation
├── RUNBOOK.md                       # Commands reference
├── PROFIT.txt                       # Pump & dump math analysis
├── foundry.toml                     # Foundry config
└── remappings.txt                   # Import remappings
```

---

## 📚 Resources

- [Foundry Book](https://book.getfoundry.sh/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts)
- [BNB Chain Docs](https://docs.bnbchain.org/)
