# 🎰 Junkie.Fun - Prediction Market Smart Contracts

> Decentralized prediction markets on BNB Chain with UMA Oracle resolution.

[![Tests](https://img.shields.io/badge/tests-97%20passing-brightgreen)]()
[![Solidity](https://img.shields.io/badge/solidity-0.8.24-blue)]()
[![License](https://img.shields.io/badge/license-MIT-green)]()

---

## 📋 Table of Contents

- [Quick Start](#-quick-start)
- [How It Works](#-how-it-works)
- [Economics at a Glance](#-economics-at-a-glance)
- [UMA Oracle Explained](#-uma-oracle-explained)
- [Contract Functions](#-contract-functions)
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
│  Anyone creates    Users buy/sell     After expiry,      Winners get    │
│  market (FREE)     YES/NO shares      someone asserts    proportional   │
│                    via bonding        the outcome        share of pool  │
│                    curve                                                 │
│                                                                          │
│  ┌──────────┐     ┌──────────┐       ┌──────────┐       ┌──────────┐   │
│  │ Question │ ──► │ Trading  │ ──►   │   UMA    │ ──►   │  Payout  │   │
│  │ + Expiry │     │  Active  │       │  Oracle  │       │          │   │
│  └──────────┘     └──────────┘       └──────────┘       └──────────┘   │
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

## 💰 Economics at a Glance

### Fee Structure (1.5% Total)

```
┌────────────────────────────────────────────────────────────┐
│                    USER BETS 100 BNB                        │
├────────────────────────────────────────────────────────────┤
│                                                             │
│   Platform Fee ────► 1.0 BNB ────► Treasury (YOU)          │
│   Creator Fee  ────► 0.5 BNB ────► Market Creator          │
│   To Pool      ────► 98.5 BNB ───► Betting Pool            │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

### Asserter Economics (Who Resolves Markets)

```
┌────────────────────────────────────────────────────────────┐
│              ASSERTER RISK vs REWARD                        │
├────────────────────────────────────────────────────────────┤
│                                                             │
│   Pool Size      Bond Required       Reward (2%)    ROI    │
│   ──────────     ─────────────       ──────────     ───    │
│   1 BNB          0.02 BNB (floor)    0.02 BNB      100%    │
│   5 BNB          0.05 BNB (1%)       0.10 BNB      100%    │
│   50 BNB         0.50 BNB (1%)       1.00 BNB      100%    │
│   500 BNB        5.00 BNB (1%)       10.00 BNB     100%    │
│                                                             │
│   Formula: Bond = max(0.02 BNB, Pool × 1%)                 │
│            Reward = Pool × 2%                               │
│            ROI = Always ~100% (risk 1%, earn 2%)           │
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
│   Asserter Reward (2%): -2 BNB  ──► Asserter               │
│   Remaining Pool:       98 BNB                             │
│                                                             │
│   Alice (60% of YES):   58.8 BNB                           │
│   Bob (40% of YES):     39.2 BNB                           │
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
│   Condition: No assertion for 24 hours after expiry        │
│                                                             │
│   Pool: 100 BNB                                            │
│   Alice (owns 60% of all shares): Gets 60 BNB back         │
│   Bob (owns 40% of all shares):   Gets 40 BNB back         │
│                                                             │
│   Formula: refund = (userShares / totalShares) × pool      │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

---

## 🔮 UMA Oracle Explained

### What is UMA?

UMA (Universal Market Access) is a **decentralized oracle** that resolves real-world outcomes. Instead of trusting a single source, UMA uses **economic incentives** to ensure truthful reporting.

### The Resolution Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        UMA RESOLUTION FLOW                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   MARKET EXPIRES                                                         │
│        │                                                                 │
│        ▼                                                                 │
│   ┌─────────────────────────────────────────────┐                       │
│   │  STEP 1: Someone Asserts Outcome            │                       │
│   │  • Posts bond (max of 0.02 BNB or pool×1%)  │                       │
│   │  • Claims "YES won" or "NO won"             │                       │
│   └─────────────────────────────────────────────┘                       │
│        │                                                                 │
│        ▼                                                                 │
│   ┌─────────────────────────────────────────────┐                       │
│   │  STEP 2: 2-Hour Challenge Window            │                       │
│   │  • Anyone can dispute by posting counter-   │                       │
│   │    bond                                     │                       │
│   │  • UMA's global network monitors all        │                       │
│   │    assertions                               │                       │
│   └─────────────────────────────────────────────┘                       │
│        │                                                                 │
│        ├──────────────────────┬─────────────────────────┐               │
│        ▼                      ▼                         ▼               │
│   ┌─────────────┐      ┌──────────────┐         ┌──────────────┐       │
│   │ NO DISPUTE  │      │   DISPUTED   │         │ NO ASSERTION │       │
│   │             │      │              │         │ FOR 24 HOURS │       │
│   │ Assertion   │      │ Goes to UMA  │         │              │       │
│   │ accepted!   │      │ DVM (human   │         │ Emergency    │       │
│   │             │      │ voting)      │         │ refund       │       │
│   │ Market      │      │ 48-72 hours  │         │ available    │       │
│   │ resolved    │      │              │         │              │       │
│   └─────────────┘      └──────────────┘         └──────────────┘       │
│                              │                                          │
│                              ├──────────────────────┐                   │
│                              ▼                      ▼                   │
│                        ┌───────────┐         ┌───────────┐             │
│                        │ ASSERTER  │         │ ASSERTER  │             │
│                        │ WAS RIGHT │         │ WAS WRONG │             │
│                        │           │         │ (LIAR)    │             │
│                        │ Market    │         │           │             │
│                        │ resolved  │         │ Loses     │             │
│                        │ Keeps     │         │ bond!     │             │
│                        │ bond +    │         │           │             │
│                        │ reward    │         │ Market    │             │
│                        └───────────┘         │ RESETS    │             │
│                                              │ New       │             │
│                                              │ assertion │             │
│                                              │ possible  │             │
│                                              └───────────┘             │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Who Are the Disputers?

**Not from our app** - from UMA's global ecosystem:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     UMA DISPUTER NETWORK                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   Our App                           UMA Network                          │
│   ────────                          ───────────                          │
│                                                                          │
│   User asserts ──────────────────►  Public assertion queue               │
│   "YES wins"                              │                              │
│                                           ▼                              │
│                                     UMA Disputers (global)               │
│                                     • Run monitoring bots                │
│                                     • Watch all protocols                │
│                                     • Profit from catching liars         │
│                                           │                              │
│                                           ├── Looks correct? Ignore      │
│                                           │   (passes in 2h)             │
│                                           │                              │
│                                           └── Looks wrong? Dispute!      │
│                                               (win liar's bond)          │
│                                                                          │
│   INCENTIVE: Disputers EARN the liar's bond if they catch a lie         │
│   This creates a "security market" where lies are actively hunted        │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Bond Economics Table

| Scenario | Asserter | Disputer | Result |
|----------|----------|----------|--------|
| ✅ Honest assertion, no dispute | Gets bond back + 2% reward | N/A | **Profit** |
| ✅ Honest assertion, disputed but wins | Gets bond + disputer's bond + 2% | Loses bond | **Big profit** |
| ❌ Liar asserts, gets caught | **Loses bond to disputer** | Wins liar's bond | **Loss** |
| 😈 Liar asserts, no dispute | Keeps bond + 2% reward | N/A | Evil wins (rare) |

### Why Lying is Unprofitable

```
Liar's Calculation:
───────────────────
Bond at risk:    0.50 BNB (for 50 BNB pool)
Potential gain:  1.00 BNB (2% reward) + steal pool

BUT:
• UMA disputers actively monitor for profit
• Getting caught = lose 0.50 BNB
• DVM (human voters) will vote against obvious lies
• Reputation damage in crypto community

Expected Value of Lying ≈ NEGATIVE (not worth it)
```

---

## 📚 Contract Functions

### Market Creation

```solidity
// Create a market (FREE)
function createMarket(
    string question,        // "Will BTC hit $100k by Dec 2025?"
    string evidenceLink,    // "https://coingecko.com/bitcoin"
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
```

### Resolution

```solidity
// Assert outcome (requires WBNB bond)
function assertOutcome(uint256 marketId, bool outcome) returns (bytes32 assertionId)

// Claim winnings (after resolution)
function claim(uint256 marketId) returns (uint256 payout)

// Emergency refund (24h after expiry with no assertion)
function emergencyRefund(uint256 marketId) returns (uint256 refund)

// Check emergency refund eligibility
function canEmergencyRefund(uint256 marketId) view returns (bool eligible, uint256 timeUntil)

// Get required bond for assertion
function getRequiredBond(uint256 marketId) view returns (uint256 bond)
```

### View Functions

```solidity
function getYesPrice(uint256 marketId) view returns (uint256)  // Current YES price
function getNoPrice(uint256 marketId) view returns (uint256)   // Current NO price
function getPosition(uint256 marketId, address user) view returns (
    uint256 yesShares,
    uint256 noShares,
    bool claimed,
    bool emergencyRefunded
)
function getMarketStatus(uint256 marketId) view returns (MarketStatus)
// MarketStatus: Active, Expired, Asserted, Resolved
```

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
| `PredictionMarket.t.sol` | 37 | Core unit tests |
| `PredictionMarket.fuzz.t.sol` | 25 | Fuzz testing |
| `PumpDump.t.sol` | 31 | Economics + features |
| `VulnerabilityCheck.t.sol` | 4 | Security tests |
| **Total** | **97** | ✅ All passing |

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

- [UMA Documentation](https://docs.uma.xyz/)
- [BNB Chain](https://www.bnbchain.org/)
- [Foundry Book](https://book.getfoundry.sh/)