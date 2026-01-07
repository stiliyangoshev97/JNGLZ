# 📋 Junkie.Fun - Contracts Project Context

> Quick reference for AI assistants and developers.  
> **Last Updated:** January 7, 2025  
> **Status:** ✅ Smart Contracts Complete (74 tests passing)

---

## 🎯 Contract Overview

**PredictionMarket.sol** is a single monolithic smart contract that handles:
- Market creation (free, 0 BNB)
- Trading YES/NO shares via bonding curve
- UMA OOv3 integration for trustless resolution
- Winner payouts after resolution
- 3-of-3 MultiSig governance

---

## 📊 Current Status

| Component | Progress | Notes |
|-----------|----------|-------|
| Project Setup | ✅ 100% | Foundry initialized |
| Core Contract | ✅ 100% | PredictionMarket.sol complete |
| Bonding Curve Math | ✅ 100% | P(yes) + P(no) = 0.01 BNB |
| Fee System | ✅ 100% | 1% platform + 0.5% creator |
| UMA Integration | ✅ 100% | OOv3 assertTruthWithDefaults |
| Unit Tests | ✅ 100% | 37 tests passing |
| Fuzz Tests | ✅ 100% | 25 tests passing |
| Vulnerability Tests | ✅ 100% | 4 tests passing |
| Pump & Dump Tests | ✅ 100% | 8 tests passing |
| Deployment Scripts | ⬜ 0% | BSC Testnet & Mainnet |

**Overall Progress: 95%** (pending deployment)
**Total Tests: 74 ✅**

---

## 🏗️ Architecture

### Single Contract Design
```
PredictionMarket.sol
├── Constants
│   ├── UNIT_PRICE = 0.01 ether
│   ├── VIRTUAL_LIQUIDITY = 100e18
│   ├── CREATOR_FEE_BPS = 50 (0.5%)
│   ├── MAX_FEE_BPS = 500 (5%)
│   └── ACTION_EXPIRY = 1 hour
│
├── State Variables
│   ├── signers[3] - MultiSig signers
│   ├── markets mapping
│   ├── positions mapping (user shares)
│   ├── assertionToMarket mapping
│   ├── platformFeeBps = 100 (1% default)
│   ├── minBet = 0.005 ether
│   ├── umaBond = 0.1 ether
│   ├── treasury, wbnb, umaOOv3 addresses
│   └── paused flag
│
├── Market Lifecycle
│   ├── createMarket() - free creation
│   ├── createMarketAndBuy() - atomic create + buy
│   ├── buyYes() / buyNo()
│   ├── sellYes() / sellNo()
│   ├── assertOutcome() - UMA assertion
│   ├── assertionResolvedCallback() - UMA callback
│   └── claim() - winner payouts
│
├── View Functions
│   ├── getMarket()
│   ├── getYesPrice() / getNoPrice()
│   ├── getPosition()
│   ├── getMarketStatus()
│   ├── previewBuy() / previewSell()
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
| `platformFeeBps` | 100 | 1% platform fee (default) |
| `CREATOR_FEE_BPS` | 50 | 0.5% creator fee (hardcoded) |
| `MAX_FEE_BPS` | 500 | 5% max platform fee |
| `minBet` | 0.005 ether | Minimum bet (~$3) |
| `umaBond` | 0.1 ether | UMA assertion bond |
| `ACTION_EXPIRY` | 1 hour | MultiSig action expiry |

---

## 💰 Fee Structure

### Total Fee: 1.5% on ALL Trades

| Fee Type | BPS | Percentage | Recipient | Configurable |
|----------|-----|------------|-----------|--------------|
| Platform Fee | 100 | 1.0% | Treasury | Yes (0-5%) |
| Creator Fee | 50 | 0.5% | Market Creator | No (hardcoded) |
| **Total** | 150 | **1.5%** | - | - |

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

---

## 🔗 External Dependencies

### UMA OOv3 (Optimistic Oracle V3)
- **Purpose:** Trustless resolution of market outcomes
- **Bond:** 0.1 WBNB (configurable)
- **Liveness:** 2 hours (UMA default)
- **Interface:** `assertTruthWithDefaults()`, `assertionResolvedCallback()`

### WBNB Addresses
- **Mainnet:** `0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c`
- **Testnet:** `0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd`

### UMA OOv3 Addresses
- **Mainnet:** TBD
- **Testnet:** TBD

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
| PredictionMarket.t.sol | 37 | ✅ Passing |
| PredictionMarket.fuzz.t.sol | 25 | ✅ Passing |
| VulnerabilityCheck.t.sol | 4 | ✅ Passing |
| PumpDump.t.sol | 8 | ✅ Passing |

**Total Tests: 74 ✅**

### Test Categories
- **Unit tests:** Market creation, trading, fees, resolution, claims
- **Fuzz tests:** Bonding curve math, edge cases, invariants
- **Vulnerability tests:** Reentrancy, overflow, access control
- **Pump & Dump tests:** Economics verification
  - Early buyer profits +36.6%
  - Late buyer loses ~27%
  - Pool solvency (never negative)
  - InsufficientPoolBalance protection
  - Creator first-mover advantage

---

## 📝 Events

```solidity
event MarketCreated(uint256 indexed marketId, address indexed creator, string question, uint256 expiryTimestamp);
event Trade(uint256 indexed marketId, address indexed trader, bool isYes, bool isBuy, uint256 shares, uint256 bnbAmount);
event OutcomeAsserted(uint256 indexed marketId, address indexed asserter, bool outcome, bytes32 assertionId);
event MarketResolved(uint256 indexed marketId, bool outcome);
event Claimed(uint256 indexed marketId, address indexed user, uint256 amount);
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
- [x] Access control: `onlySigner`, `onlyUmaOOv3`
- [x] `InsufficientPoolBalance` check
- [x] Slippage protection parameters
- [x] Action expiry (1 hour)
- [x] Pause mechanism via MultiSig

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

// ===== Resolution =====
function assertOutcome(uint256 marketId, bool outcome) returns (bytes32 assertionId)
function claim(uint256 marketId) returns (uint256 payout)

// ===== Views =====
function getYesPrice(uint256 marketId) view returns (uint256)
function getNoPrice(uint256 marketId) view returns (uint256)
function previewBuy(uint256 marketId, uint256 bnbAmount, bool isYes) view returns (uint256)
function previewSell(uint256 marketId, uint256 shares, bool isYes) view returns (uint256)
function getPosition(uint256 marketId, address user) view returns (uint256, uint256, bool)
function getMarket(uint256 marketId) view returns (...)
function getMarketStatus(uint256 marketId) view returns (MarketStatus)

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
│   └── PredictionMarket.sol    # Main contract (1090 lines)
├── test/
│   ├── PredictionMarket.t.sol       # Unit tests (37)
│   ├── PredictionMarket.fuzz.t.sol  # Fuzz tests (25)
│   ├── PumpDump.t.sol               # Economics tests (8)
│   ├── VulnerabilityCheck.t.sol     # Security tests (4)
│   └── helpers/
│       └── TestHelper.sol           # Test utilities
├── script/
│   └── Deploy.s.sol                 # Deployment script
├── lib/                             # Dependencies
├── CHANGELOG.md                     # Version history
├── PROJECT_CONTEXT.md               # This file
├── PROFIT.txt                       # Pump & dump math analysis
├── foundry.toml                     # Foundry config
└── remappings.txt                   # Import remappings
```

---

## 📚 Resources

- [UMA OOv3 Documentation](https://docs.uma.xyz/developers/optimistic-oracle-v3)
- [Foundry Book](https://book.getfoundry.sh/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts)
- [BNB Chain Docs](https://docs.bnbchain.org/)
