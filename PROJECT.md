# JunkieFun - Master Blueprint

> **The "Pump.fun for Predictions"** - A decentralized prediction market where early buyers profit when others buy after them. Built on BNB Chain.

---

## 🌐 DECENTRALIZED PROTOCOL

**JunkieFun is a fully decentralized, non-custodial prediction market protocol.**

### What This Means:

1. **Anyone Can Use It** - No KYC, no accounts, no permissions needed. Just connect a wallet.
2. **Anyone Can Create Markets** - Market creation is FREE. Ask any yes/no question.
3. **No Central Authority** - Markets are resolved via **Street Consensus** (shareholder voting), not by us.
4. **Non-Custodial** - You interact directly with smart contracts. We never hold your funds.
5. **Transparent** - All code is open source. All transactions are on-chain.
6. **Censorship Resistant** - Once deployed, the protocol runs autonomously.

### Street Consensus Resolution:

Markets aren't resolved by a central oracle. Instead, **the people who have skin in the game decide**:

1. **Propose** - Anyone can propose an outcome by posting a bond
2. **Dispute** - If someone disagrees, they can dispute with 2× bond
3. **Vote** - Shareholders vote weighted by their position size
4. **Finalize** - Majority wins. Losing bonder forfeits bond to winners.

This creates a self-regulating system where:
- Honest resolution is incentivized (keep your bond + earn dispute fees)
- Manipulation is expensive (need to buy majority stake)
- Speed is prioritized (30-90 minute resolution windows)

---

## 🚨 CRITICAL: How Fees Work (READ THIS FIRST)

### Fee Structure - Total 1.8% Maximum

| Fee Type | Percentage | Recipient | When Charged |
|----------|------------|-----------|--------------|
| **Platform Fee** | 1.0% (100 bps) | Treasury (You) | Every buy AND sell |
| **Creator Fee** | 0.5% (50 bps) | Market Creator | Every buy AND sell |
| **Resolution Fee** | 0.3% (30 bps) | Treasury | On propose/dispute/vote |
| **TOTAL TRADING** | **1.5%** | - | On trades |
| **TOTAL MAX** | **1.8%** | - | With resolution |

### Example: $100 Trade
- Platform gets: $1.00
- Creator gets: $0.50  
- Goes to pool: $98.50

### Key Points:
1. **Platform fee (1%)** - Goes to YOUR treasury wallet. This is your revenue.
2. **Creator fee (0.5%)** - Goes to whoever created the market. Incentivizes market creation.
3. **Resolution fee (0.3%)** - Charged on propose/dispute/vote actions. Prevents spam.
4. **Both fees apply on BUY and SELL** - Double dipping for maximum revenue!
5. **Creator fee is configurable** - Via 3-of-3 MultiSig (0-2% range)
6. **Platform fee is adjustable** - Via 3-of-3 MultiSig (0-5% range)

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
5. **Resolve:** After expiry, **Street Consensus** handles resolution - bettors vote on outcomes (30-90 min).
6. **Payout:** Winners claim the BNB vault proportionally.

---

## Part 2: The Bonding Curve (The Math)

### The Core Rule

```
P(YES) + P(NO) = 0.01 BNB (always!)
```

This is a **Constant Sum Linear Curve**. The two prices always add up to 0.01 BNB.

### Virtual Liquidity & Heat Levels (v3.1.0)

Markets start with **virtual YES and virtual NO shares** (scaled to 1e18). The amount depends on the **Heat Level**:

| Heat Level | Virtual Liquidity | Price Impact | Description |
|------------|------------------|--------------|-------------|
| **CRACK** 🔥🔥🔥 | 5 | ~16% per 0.01 BNB | Maximum volatility, meme markets |
| **HIGH** 🔥🔥 | 20 | ~4.7% per 0.01 BNB | High action, trending topics |
| **PRO** 🔥 | 50 (default) | ~1.9% per 0.01 BNB | Stable, serious predictions |

This:
- Sets initial price at exactly **0.005 BNB** for both sides (50/50)
- Provides instant liquidity without real capital
- Prevents division by zero
- **Is immutable per market** - Once created, a market keeps its heat level forever
- **Lower liquidity = higher price impact** - CRACK markets are for degens who want big swings

### Price Dynamics

| When This Happens | YES Price | NO Price | Interpretation |
|-------------------|-----------|----------|----------------|
| More YES bought | ↑ Goes up | ↓ Goes down | Market thinks YES more likely |
| More NO bought | ↓ Goes down | ↑ Goes up | Market thinks NO more likely |
| Equal buying | Stays same | Stays same | 50/50 odds |

### Formulas

**Formulas:**
```
virtualYes = yesSupply + virtualLiquidity (5, 20, or 50 based on HeatLevel)
virtualNo = noSupply + virtualLiquidity
totalVirtual = virtualYes + virtualNo

P(YES) = 0.01 BNB × virtualYes / totalVirtual
P(NO) = 0.01 BNB × virtualNo / totalVirtual
```

**Buying Shares:**
```
shares = (bnbAmount × totalVirtual × 1e18) / (0.01 BNB × virtualSide)
```

**Selling Shares (POST-SELL STATE - v3.2.0 Fix):**
```
virtualSideAfter = virtualSide - shares
totalVirtualAfter = totalVirtual - shares
bnbOut = (shares × 0.01 BNB × virtualSideAfter) / (totalVirtualAfter × 1e18)
```

> ⚠️ **v3.1.0 Bug:** The old formula used average price `(P1 + P2) / 2` which 
> allowed arbitrage. Users could buy and immediately sell for MORE BNB.
> v3.2.0 fixes this by using post-sell state, ensuring buy→sell always loses ~3% to fees.

### Why Post-Sell State for Selling?

This is **CRITICAL** for preventing arbitrage:
- Buying increases price, selling decreases price
- Using average price created a mismatch allowing instant profit
- Post-sell state ensures: `bnbOut < bnbIn` (always loses to fees)
- Contract has `InsufficientPoolBalance` safety check as final backstop

---

## Part 3: Smart Contract Architecture

### Single Monolithic Contract

`PredictionMarket.sol` - One contract manages everything:
- Market creation & storage
- Trading (buy/sell YES/NO)
- **Street Consensus resolution** (propose → dispute → vote → finalize)
- Claims (winner payouts)
- Emergency refunds (24h timeout)
- Governance (3-of-3 MultiSig)

### Key Functions

| Function | Purpose | Payable? |
|----------|---------|----------|
| `createMarket()` | Create new market (FREE) | No |
| `createMarketAndBuy()` | Create + first buy atomically | Yes |
| `buyYes()` / `buyNo()` | Buy shares | Yes |
| `sellYes()` / `sellNo()` | Sell shares | No |
| `proposeOutcome()` | Propose result with bond | Yes |
| `dispute()` | Challenge proposal with 2× bond | Yes |
| `vote()` | Vote on disputed market | No |
| `finalizeMarket()` | Settle after voting ends | No |
| `claim()` | Withdraw winnings | No |
| `emergencyRefund()` | Refund if no proposal for 24h | No |

### Safety Mechanisms

1. **ReentrancyGuard** - Prevents reentrancy attacks
2. **CEI Pattern** - Checks-Effects-Interactions ordering
3. **InsufficientPoolBalance** - Prevents over-withdrawal
4. **Slippage Protection** - `minSharesOut` / `minBnbOut` parameters
5. **Pause Mechanism** - Emergency stop via MultiSig
6. **Double-vote Prevention** - Can't vote twice on same market
7. **Bond Validation** - Ensures correct bond amounts

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

## Part 5: Resolution (Street Consensus)

### What is Street Consensus?

Street Consensus is a **decentralized resolution mechanism** where the bettors themselves decide the outcome. No external oracles. No waiting 48+ hours. Just the people with skin in the game voting on what happened.

### Why Street Consensus over UMA?

| Feature | UMA Oracle (Old) | Street Consensus (New) |
|---------|------------------|------------------------|
| Resolution Time | 48-72 hours | **30-90 minutes** |
| External Dependency | UMA Protocol | **None** |
| Who Decides | UMA token holders | **Actual bettors** |
| Bond Token | WBNB (wrapped) | **Native BNB** |
| Complexity | High | **Simple** |
| Proof Required | Yes | **Optional** |

### How It Works

```
MARKET EXPIRES
      │
      ▼
┌─────────────────────────────────────────────┐
│  STEP 1: Creator Priority (10 min)          │
│  • Market creator can propose first         │
│  • Posts bond (max of 0.02 BNB or pool×1%)  │
│  • Claims "YES won" or "NO won"             │
│  • Optional: Include proof link             │
└─────────────────────────────────────────────┘
      │
      │  After 10 min, anyone can propose
      ▼
┌─────────────────────────────────────────────┐
│  STEP 2: Dispute Window (30 min)            │
│  • Anyone can dispute with 2× bond          │
│  • Only 1 dispute allowed per market        │
│  • Can include counter-proof link           │
└─────────────────────────────────────────────┘
      │
      ├────────────────┬─────────────────────┐
      ▼                ▼                     ▼
┌─────────────┐  ┌──────────────┐    ┌──────────────┐
│ NO DISPUTE  │  │   DISPUTED   │    │ NO PROPOSAL  │
│             │  │              │    │ FOR 24 HOURS │
│ Proposal    │  │ Goes to      │    │              │
│ accepted!   │  │ VOTING       │    │ Emergency    │
│             │  │ (1 hour)     │    │ refund       │
│ Market      │  │              │    │ available    │
│ resolved    │  │              │    │              │
└─────────────┘  └──────────────┘    └──────────────┘
                       │
                       ▼
                 ┌───────────────────────────────┐
                 │  STEP 3: Voting (1 hour)      │
                 │                               │
                 │  • Only share holders vote    │
                 │  • Vote weight = share count  │
                 │  • Can't vote twice           │
                 │  • Simple majority wins       │
                 └───────────────────────────────┘
                       │
                       ▼
                 ┌───────────────────────────────┐
                 │  STEP 4: Finalize             │
                 │                               │
                 │  Proposer wins:               │
                 │  • Gets bond + 50% of         │
                 │    disputer's bond            │
                 │  • Voters split 50%           │
                 │                               │
                 │  Disputer wins:               │
                 │  • Gets bond + 50% of         │
                 │    proposer's bond            │
                 │  • Voters split 50%           │
                 │                               │
                 │  Tie (0 vs 0 votes):          │
                 │  • Both get bonds back        │
                 │  • Market needs new proposal  │
                 └───────────────────────────────┘
```

### Bond Economics

| Pool Size | Proposer Bond | Disputer Bond (2×) |
|-----------|---------------|-------------------|
| 1 BNB | 0.02 BNB (floor) | 0.04 BNB |
| 5 BNB | 0.05 BNB (1%) | 0.10 BNB |
| 50 BNB | 0.50 BNB (1%) | 1.00 BNB |

**Formula:** `bond = max(0.02 BNB, poolBalance × 1%)`

### Bond Distribution After Dispute

| Scenario | Proposer | Disputer | Voters |
|----------|----------|----------|--------|
| ✅ No dispute | Gets bond back | N/A | N/A |
| ✅ Proposer wins | Bond + 50% of disputer | Loses bond | 50% of disputer bond |
| ❌ Disputer wins | Loses bond | Bond + 50% of proposer | 50% of proposer bond |
| ⚖️ Tie (0 vs 0) | Gets bond back | Gets bond back | N/A |

### Timing Constants

| Phase | Duration | Description |
|-------|----------|-------------|
| Creator Priority | 10 min | Head start for market creator |
| Dispute Window | 30 min | Time to challenge proposal |
| Voting Window | 1 hour | Time for bettors to vote |
| Emergency Refund | 24 hours | After expiry with no proposal |

---

## Part 6: Contract Constants (v3.1.0)

| Parameter | Value | Configurable? |
|-----------|-------|---------------|
| UNIT_PRICE | 0.01 BNB | No |
| Virtual Liquidity (CRACK) | 5e18 | No (per market) |
| Virtual Liquidity (HIGH) | 20e18 | No (per market) |
| Virtual Liquidity (PRO) | 50e18 | No (per market) |
| Default Heat Level | PRO (50) | Yes (via MultiSig) |
| Platform Fee | 1% (100 bps) | Yes (0-5% via MultiSig) |
| Creator Fee | 0.5% (50 bps) | Yes (0-2% via MultiSig) |
| Resolution Fee | 0.3% (30 bps) | Yes (0-1% via MultiSig) |
| Min Bet | 0.005 BNB | Yes (0.001-0.1 BNB) |
| Min Bond Floor | 0.02 BNB | Yes (0.01-0.1 BNB) |
| Dynamic Bond | 1% of pool | Yes (0.5-5% via MultiSig) |
| Bond Winner Share | 50% | Yes (20-80% via MultiSig) |
| Creator Priority | 10 min | No |
| Dispute Window | 30 min | No |
| Voting Window | 1 hour | No |
| Emergency Refund | 24 hours | No |
| MultiSig | 3-of-3 | No |
| Action Expiry | 1 hour | No |

**MultiSig Governance Actions:**
- `SetFee` - Adjust platform/creator/resolution fees
- `Pause` - Emergency pause all market operations
- `Unpause` - Resume operations
- `SetDefaultHeatLevel` - Change default for new markets
- `SweepFunds` - Recover surplus BNB above locked funds

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

1. **Smart Contracts (v3.1.0)**
   - PredictionMarket.sol (fully implemented, ~1500 lines)
   - 173 tests passing (52 unit + 29 fuzz + 77 features + 15 heat level)
   - All features working:
     - Market creation (free) with Heat Level selection
     - createMarketAndBuy (atomic first buy)
     - Buy/Sell YES/NO with bonding curve
     - Platform fee (1%) + Creator fee (0.5%) + Resolution fee (0.3%)
     - **Street Consensus resolution** (propose/dispute/vote/finalize)
     - **Heat Levels** (CRACK/HIGH/PRO for different volatility)
     - Emergency refund (24h timeout)
     - Winner claims
     - 3-of-3 MultiSig governance
     - **SweepFunds** - Recover surplus BNB via MultiSig
     - Pause/unpause

2. **Subgraph** - DEPLOYED (The Graph Studio)

3. **Frontend** - ~95% COMPLETE
   - All UI components (brutalist theme)
   - All pages (Markets, MarketDetail, Create, Portfolio)
   - GraphQL queries working
   - Contract integration hooks
   - Chain validation

### 🔄 In Progress

4. **Deployment** - Mainnet deployment pending

---

## Part 9: File Structure

```
JunkieFun/
├── PROJECT.md              # This file
├── TODO.md                 # Task tracking
├── AI-PROMPTS.txt          # AI assistant onboarding prompts
├── contracts/
│   ├── README.md           # Street Consensus documentation
│   ├── src/
│   │   └── PredictionMarket.sol
│   ├── test/
│   │   ├── PredictionMarket.t.sol      # Unit tests (52)
│   │   ├── PredictionMarket.fuzz.t.sol # Fuzz tests (29)
│   │   ├── PumpDump.t.sol              # Economics tests (31)
│   │   ├── VulnerabilityCheck.t.sol    # Security tests (4)
│   │   └── helpers/TestHelper.sol
│   ├── script/
│   │   └── Deploy.s.sol
│   ├── CHANGELOG.md        # v2.0.0 = Street Consensus
│   ├── PROJECT_CONTEXT.md
│   └── PROFIT.txt          # Pump & dump economics proof
├── frontend/               # (To be created)
└── subgraph/               # (To be created)
```

---

## Quick Reference: Contract Interface (v3.1.0)

```solidity
// Heat levels for market volatility
enum HeatLevel { CRACK, HIGH, PRO }  // 5, 20, 50 virtual liquidity

// Create market (free) - defaults to contract's defaultHeatLevel
function createMarket(
    string question,
    string evidenceLink, 
    string resolutionRules,
    uint256 expiryTimestamp,
    HeatLevel heatLevel      // NEW in v3.1.0
) returns (uint256 marketId)

// Create market + buy atomically (anti-frontrun)
function createMarketAndBuy(
    string question,
    string evidenceLink,
    string resolutionRules, 
    uint256 expiryTimestamp,
    bool buyYesSide,        // true=YES, false=NO
    uint256 minSharesOut,   // slippage protection
    HeatLevel heatLevel     // NEW in v3.1.0
) payable returns (uint256 marketId, uint256 sharesOut)

// Trading
function buyYes(uint256 marketId, uint256 minSharesOut) payable
function buyNo(uint256 marketId, uint256 minSharesOut) payable
function sellYes(uint256 marketId, uint256 shares, uint256 minBnbOut)
function sellNo(uint256 marketId, uint256 shares, uint256 minBnbOut)

// Street Consensus Resolution
function proposeOutcome(uint256 marketId, bool outcome) payable  // proofLink removed in v3.1.0
function dispute(uint256 marketId, string proofLink) payable
function vote(uint256 marketId, bool supportProposer)
function finalizeMarket(uint256 marketId)

// Claims
function claim(uint256 marketId)
function emergencyRefund(uint256 marketId)

// View
function getYesPrice(uint256 marketId) view returns (uint256)
function getNoPrice(uint256 marketId) view returns (uint256)
function previewBuy(uint256 marketId, uint256 bnbAmount, bool isYes) view
function previewSell(uint256 marketId, uint256 shares, bool isYes) view
function getPosition(uint256 marketId, address user) view returns (
    uint256 yesShares,
    uint256 noShares,
    bool claimed,
    bool emergencyRefunded,
    bool hasVoted,
    bool votedForProposer
)
function getMarket(uint256 marketId) view  // Returns 22 fields including virtualLiquidity
function getMarketStatus(uint256 marketId) view returns (MarketStatus)
// MarketStatus: Active, Expired, Proposed, Disputed, Resolved
function getRequiredBond(uint256 marketId) view returns (uint256)
function canEmergencyRefund(uint256 marketId) view returns (bool, uint256)
```

