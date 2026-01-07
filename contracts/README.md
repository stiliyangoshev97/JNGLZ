# 🎰 Junkie.Fun - Prediction Market Smart Contracts

> Decentralized prediction markets on BNB Chain with **Street Consensus** resolution.  
> **Fast. No oracles. Bettors decide.**

[![Tests](https://img.shields.io/badge/tests-116%20passing-brightgreen)]()
[![Solidity](https://img.shields.io/badge/solidity-0.8.24-blue)]()
[![License](https://img.shields.io/badge/license-MIT-green)]()

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
│  2. Creator proposes (10 min head    • Voters on winning side: split 50% │
│     start) with bond                   of loser's bond                   │
│  3. Anyone can dispute (2x bond)     • Liars: lose their bond            │
│  4. If disputed → bettors VOTE                                           │
│  5. Simple majority wins             ⏱️ SPEED                            │
│                                      ──────                              │
│  NO ORACLE. NO WAITING 48 HOURS.     • Undisputed: 30 min                │
│  BETTORS DECIDE THEIR OWN FATE.      • Disputed: +1 hour voting          │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 📋 Table of Contents

- [Quick Start](#-quick-start)
- [How It Works](#-how-it-works)
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
│   1 BNB          0.02 BNB (floor)    0.04 BNB (2x)         │
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
| `PredictionMarket.t.sol` | 52 | Core unit tests |
| `PredictionMarket.fuzz.t.sol` | 29 | Fuzz testing |
| `PumpDump.t.sol` | 31 | Economics + features |
| `VulnerabilityCheck.t.sol` | 4 | Security tests |
| **Total** | **116** | ✅ All passing |

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