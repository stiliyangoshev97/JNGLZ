# Junkie.Fun - Master Blueprint

> **The "Pump.fun for Predictions"** - A decentralized prediction market where early buyers profit when others buy after them. Built on BNB Chain.

---

## 🚨 CRITICAL: How Fees Work (READ THIS FIRST)

### Fee Structure - Total 1.5% on ALL Trades

| Fee Type | Percentage | Recipient | When Charged |
|----------|------------|-----------|--------------|
| **Platform Fee** | 1.0% (100 bps) | Treasury (You) | Every buy AND sell |
| **Creator Fee** | 0.5% (50 bps) | Market Creator | Every buy AND sell |
| **TOTAL** | **1.5%** | - | - |

### Example: $100 Trade
- Platform gets: $1.00
- Creator gets: $0.50  
- Goes to pool: $98.50

### Key Points:
1. **Platform fee (1%)** - Goes to YOUR treasury wallet. This is your revenue.
2. **Creator fee (0.5%)** - Goes to whoever created the market. Incentivizes market creation.
3. **Both fees apply on BUY and SELL** - Double dipping for maximum revenue!
4. **Creator fee is hardcoded** - Cannot be changed (prevents abuse)
5. **Platform fee is adjustable** - Via 3-of-3 MultiSig (0-5% range)

---

## 💰 PUMP & DUMP ECONOMICS - How Early Buyers Profit

This is the **CORE MECHANIC** that makes the platform viral. Like Pump.fun, early buyers profit when others buy after them.

### The Math: Real Example with $1000 and $100 Buyers

**Scenario:** 
- Alice creates a market and buys YES with **$1000 worth of BNB** (≈1.67 BNB at $600/BNB)
- Bob sees the market and buys YES with **$100 worth of BNB** (≈0.167 BNB)
- Alice immediately sells all her shares

#### Step-by-Step Calculation:

**Initial State:**
```
Virtual YES: 100 shares
Virtual NO: 100 shares
Total: 200 shares
YES Price: 0.005 BNB (50%)
NO Price: 0.005 BNB (50%)
```

**Step 1: Alice Buys $1000 (1.67 BNB) of YES**
```
Amount after 1.5% fee: 1.67 × 0.985 = 1.645 BNB goes to pool
Shares received: 1.645 × 200 / (0.01 × 100) × 1e18 = 329e18 shares

New State:
- Virtual YES: 100 + 329 = 429 shares
- Virtual NO: 100 shares  
- Total: 529 shares
- Pool Balance: 1.645 BNB
- YES Price: 0.01 × 429/529 = 0.00811 BNB (81.1%)
- NO Price: 0.01 × 100/529 = 0.00189 BNB (18.9%)

Alice's position: 329 YES shares (cost: 1.67 BNB / $1000)
```

**Step 2: Bob Buys $100 (0.167 BNB) of YES**
```
Amount after 1.5% fee: 0.167 × 0.985 = 0.1645 BNB goes to pool
Current YES price: 0.00811 BNB
Shares received: 0.1645 × 529 / (0.01 × 429) × 1e18 ≈ 20.3e18 shares

New State:
- Virtual YES: 429 + 20.3 = 449.3 shares
- Virtual NO: 100 shares
- Total: 549.3 shares  
- Pool Balance: 1.645 + 0.1645 = 1.8095 BNB
- YES Price: 0.01 × 449.3/549.3 = 0.00818 BNB (81.8%)

Bob's position: 20.3 YES shares (cost: 0.167 BNB / $100)
```

**Step 3: Alice Sells ALL 329 Shares**
```
Using AVERAGE price formula:
- Price before sell: 0.00818 BNB
- Price after sell (simulated): 0.01 × 120/220 = 0.00545 BNB
- Average price: (0.00818 + 0.00545) / 2 = 0.00682 BNB

Gross BNB out: 329 × 0.00682 = 2.244 BNB
BUT pool only has 1.8095 BNB!

So Alice gets: ~1.78 BNB (limited by pool balance minus safety margin)
After 1.5% fee: 1.78 × 0.985 = 1.75 BNB

Alice's P&L:
- Spent: 1.67 BNB ($1000)
- Received: 1.75 BNB ($1050)
- PROFIT: +0.08 BNB (+$48 or +4.8%)
```

**What happens to Bob?**
```
After Alice sells:
- Pool Balance: ~0.03 BNB (almost empty!)
- Bob's 20.3 shares are now worth much less
- If Bob tries to sell, he gets very little back

Bob's P&L (if he sells now):
- Spent: 0.167 BNB ($100)
- Would receive: ~0.025 BNB ($15)
- LOSS: -0.142 BNB (-$85 or -85%)
```

### 📊 Summary Table: Who Wins, Who Loses

| Player | Invested | Sold For | Profit/Loss | % Change |
|--------|----------|----------|-------------|----------|
| **Alice (Early)** | $1,000 | $1,048 | **+$48** | **+4.8%** |
| **Bob (Late)** | $100 | $15 | **-$85** | **-85%** |
| **Platform** | - | $16.50 | **+$16.50** | - |
| **Creator (Alice)** | - | $8.25 | **+$8.25** | - |

### 🔑 Key Insights:

1. **Early buyers profit** when later buyers push the price up
2. **Late buyers lose** when early buyers dump on them
3. **The platform ALWAYS wins** - 1% of all volume
4. **Creators ALWAYS win** - 0.5% of all volume (even if they dump!)
5. **This is BY DESIGN** - It's what makes it viral like Pump.fun

### Why This Works (Game Theory):

1. **FOMO drives buys** - People see price going up, want to get in early
2. **Creators are incentivized** - They earn 0.5% AND can be first buyer
3. **Platform earns on volume** - Doesn't matter who wins/loses
4. **Volatility = Engagement** - Big swings create excitement

---

## Part 1: Project Overview

### 1. Project Purpose

**Prediction Pump** is a decentralized, permissionless "Fact Launchpad" built on the BNB Smart Chain. It is the evolution of the "Pump.fun" model, applied to real-world outcomes instead of memecoins. It allows anyone to launch a prediction market on any topic (social trends, sports, personal dares, or global news) with zero friction and instant liquidity.

### 2. Core Goals

- **Zero Barrier to Entry:** 0 BNB to create a market. Anyone can be a "market creator."
- **Frictionless Betting:** By using **Native BNB**, users bypass the "Approve/Permit" transactions required by USDT/USDC. It is a 1-click "sign and bet" experience.
- **Liquid-from-Launch:** Using **Bonding Curves** ensures that there is always a price for YES/NO from the first second, without needing external Liquidity Providers (LPs).
- **Sustainable Revenue:** **1.5% total fee** (1% platform + 0.5% creator) on all trading volume.
- **Pump.fun Mechanics:** Early buyers profit when later buyers enter. Creates viral FOMO loops.

### 3. User Journey

1. **Launch:** A creator enters a question, an expiry date, and an "Evidence Link" (e.g., a Twitter profile or news site).
2. **First Buy (Optional):** Creator can atomically buy shares in the same transaction - GUARANTEED first buyer, impossible to front-run.
3. **Trade:** Degens buy YES or NO shares using BNB. The bonding curve adjusts prices automatically.
4. **Pump & Dump:** Early buyers can sell at profit when price rises. Late buyers take the loss.
5. **Resolve:** After expiry, the market moves to an "Optimistic" settlement phase via UMA.
6. **Payout:** Winners claim the BNB vault proportionally.

---

## Part 2: The Bonding Curve (The Math)

### The Core Rule

```
P(YES) + P(NO) = 0.01 BNB (always!)
```

This is a **Constant Sum Linear Curve**. The two prices always add up to 0.01 BNB.

### Virtual Liquidity

Markets start with **100 virtual YES and 100 virtual NO shares** (scaled to 1e18). This:
- Sets initial price at exactly **0.005 BNB** for both sides (50/50)
- Provides instant liquidity without real capital
- Prevents division by zero

### Price Dynamics

| When This Happens | YES Price | NO Price | Interpretation |
|-------------------|-----------|----------|----------------|
| More YES bought | ↑ Goes up | ↓ Goes down | Market thinks YES more likely |
| More NO bought | ↓ Goes down | ↑ Goes up | Market thinks NO more likely |
| Equal buying | Stays same | Stays same | 50/50 odds |

### Formulas

**Price Calculation:**
```
virtualYes = yesSupply + 100e18
virtualNo = noSupply + 100e18
totalVirtual = virtualYes + virtualNo

P(YES) = 0.01 BNB × virtualYes / totalVirtual
P(NO) = 0.01 BNB × virtualNo / totalVirtual
```

**Buying Shares:**
```
shares = (bnbAmount × totalVirtual × 1e18) / (0.01 BNB × virtualSide)
```

**Selling Shares (AVERAGE PRICE - Critical!):**
```
P1 = price before sell
P2 = price after sell (simulated)
avgPrice = (P1 + P2) / 2
bnbOut = shares × avgPrice / 1e18
```

### Why Average Price for Selling?

This is **CRITICAL** for pool solvency:
- Buying uses instantaneous price → more shares when price is low
- If selling also used instantaneous (now HIGH) price → pool goes bankrupt
- Average price ensures: `bnbOut ≤ bnbIn` (approximately)
- Contract has `InsufficientPoolBalance` safety check as final backstop

---

## Part 3: Smart Contract Architecture

### Single Monolithic Contract

`PredictionMarket.sol` - One contract manages everything:
- Market creation & storage
- Trading (buy/sell YES/NO)
- Resolution (UMA integration)
- Claims (winner payouts)
- Governance (3-of-3 MultiSig)

### Key Functions

| Function | Purpose | Payable? |
|----------|---------|----------|
| `createMarket()` | Create new market (FREE) | No |
| `createMarketAndBuy()` | Create + first buy atomically | Yes |
| `buyYes()` / `buyNo()` | Buy shares | Yes |
| `sellYes()` / `sellNo()` | Sell shares | No |
| `assertOutcome()` | Claim result via UMA | No (needs WBNB approval) |
| `claim()` | Withdraw winnings | No |

### Safety Mechanisms

1. **ReentrancyGuard** - Prevents reentrancy attacks
2. **CEI Pattern** - Checks-Effects-Interactions ordering
3. **InsufficientPoolBalance** - Prevents over-withdrawal
4. **Slippage Protection** - `minSharesOut` / `minBnbOut` parameters
5. **Pause Mechanism** - Emergency stop via MultiSig

---

## Part 4: Fee Distribution

### On Every Trade (Buy or Sell)

```
Total Fee = 1.5% of trade amount

Platform Fee = 1.0% → Treasury wallet (YOUR revenue)
Creator Fee = 0.5% → Market creator's wallet

Net to Pool = 98.5% of trade amount
```

### Revenue Projections

| Daily Volume | Platform Revenue (1%) | Creator Payouts (0.5%) |
|--------------|----------------------|------------------------|
| $10,000 | $100/day | $50/day |
| $100,000 | $1,000/day | $500/day |
| $1,000,000 | $10,000/day | $5,000/day |

### Why Creator Fee?

1. **Incentivizes market creation** - Creators earn passive income
2. **Quality markets** - Creators want volume, so they create interesting topics
3. **Viral loops** - Creators promote their own markets
4. **First-mover advantage** - Creators can be first buyer + earn fees

---

## Part 5: Resolution (UMA OOv3)

### How It Works

1. **Market expires** - Trading stops
2. **Anyone asserts** - "The answer is YES" + stakes WBNB bond (0.1 WBNB)
3. **Challenge period** - 2 hours for disputes
4. **If no dispute** - Assertion accepted, market resolves
5. **If disputed** - UMA token holders vote on truth
6. **Winners claim** - Proportional share of pool

### Bond Economics

- **Bond amount:** 0.1 WBNB (≈$60)
- **If truthful:** Bond returned + assertion succeeds
- **If lying:** Bond lost to disputer
- **Why anyone asserts:** Winners want their money! They'll pay bond to unlock the pool.

---

## Part 6: Contract Constants

| Parameter | Value | Configurable? |
|-----------|-------|---------------|
| UNIT_PRICE | 0.01 BNB | No |
| VIRTUAL_LIQUIDITY | 100e18 | No |
| Platform Fee | 1% (100 bps) | Yes (0-5% via MultiSig) |
| Creator Fee | 0.5% (50 bps) | No (hardcoded) |
| Min Bet | 0.005 BNB | Yes (0.001-0.1 BNB) |
| UMA Bond | 0.1 WBNB | Yes (0.01-1 WBNB) |
| MultiSig | 3-of-3 | No |
| Action Expiry | 1 hour | No |

---

## Part 7: Frontend Stack

- **Framework:** React 19 + Vite (NO Next.js)
- **Styling:** Tailwind CSS (Retrowave/90s hacker theme)
- **Web3:** Wagmi v2 + RainbowKit
- **State:** TanStack Query (via Wagmi)
- **Indexing:** The Graph (Subgraph)

---

## Part 8: Development Status

### ✅ Completed

1. **Smart Contracts**
   - PredictionMarket.sol (fully implemented)
   - 66 tests passing (unit + fuzz + vulnerability)
   - All features working:
     - Market creation (free)
     - createMarketAndBuy (atomic first buy)
     - Buy/Sell YES/NO with bonding curve
     - Platform fee (1%) + Creator fee (0.5%)
     - UMA OOv3 resolution integration
     - Winner claims
     - 3-of-3 MultiSig governance
     - Pause/unpause

### 🔄 In Progress

2. **Frontend** - Not started
3. **Subgraph** - Not started
4. **Deployment** - Not started

---

## Part 9: File Structure

```
JunkieFun/
├── PROJECT.md              # This file
├── TODO.md                 # Task tracking
├── contracts/
│   ├── src/
│   │   └── PredictionMarket.sol
│   ├── test/
│   │   ├── PredictionMarket.t.sol      # Unit tests
│   │   ├── PredictionMarket.fuzz.t.sol # Fuzz tests
│   │   ├── VulnerabilityCheck.t.sol    # Security tests
│   │   └── helpers/TestHelper.sol
│   ├── script/
│   │   └── Deploy.s.sol
│   ├── CHANGELOG.md
│   └── PROJECT_CONTEXT.md
├── frontend/               # (To be created)
└── subgraph/               # (To be created)
```

---

## Quick Reference: Contract Interface

```solidity
// Create market (free)
function createMarket(
    string question,
    string evidenceLink, 
    string resolutionRules,
    uint256 expiryTimestamp
) returns (uint256 marketId)

// Create market + buy atomically (anti-frontrun)
function createMarketAndBuy(
    string question,
    string evidenceLink,
    string resolutionRules, 
    uint256 expiryTimestamp,
    bool buyYesSide,        // true=YES, false=NO
    uint256 minSharesOut    // slippage protection
) payable returns (uint256 marketId, uint256 sharesOut)

// Trading
function buyYes(uint256 marketId, uint256 minSharesOut) payable
function buyNo(uint256 marketId, uint256 minSharesOut) payable
function sellYes(uint256 marketId, uint256 shares, uint256 minBnbOut)
function sellNo(uint256 marketId, uint256 shares, uint256 minBnbOut)

// Resolution
function assertOutcome(uint256 marketId, bool outcome) // needs WBNB approval
function claim(uint256 marketId)

// View
function getYesPrice(uint256 marketId) view returns (uint256)
function getNoPrice(uint256 marketId) view returns (uint256)
function previewBuy(uint256 marketId, uint256 bnbAmount, bool isYes) view
function previewSell(uint256 marketId, uint256 shares, bool isYes) view
function getPosition(uint256 marketId, address user) view
function getMarket(uint256 marketId) view
```

