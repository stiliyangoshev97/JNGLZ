# 🎰 Junkie.Fun - Prediction Market Smart Contracts

> Decentralized prediction markets on BNB Chain with **Street Consensus** resolution.  
> **Fast. No oracles. Bettors decide.**

[![Tests](https://img.shields.io/badge/tests-113%20passing-brightgreen)]()
[![Solidity](https://img.shields.io/badge/solidity-0.8.24-blue)]()
[![License](https://img.shields.io/badge/license-MIT-green)]()
[![Testnet](https://img.shields.io/badge/BNB%20Testnet-pending-yellow)]()
[![Version](https://img.shields.io/badge/version-v3.2.0-blue)]()

---

## ⚠️ CRITICAL: v3.2.0 Required

**v3.1.0 has a critical bonding curve bug** that allows instant arbitrage profit. See [CHANGELOG.md](CHANGELOG.md) for details.

| Version | Status | Issue |
|---------|--------|-------|
| v3.1.0 | ⚠️ DEPRECATED | Arbitrage vulnerability in `_calculateSellBnb()` |
| v3.2.0 | ✅ FIXED | Bonding curve corrected, 113 tests passing |

---

## 🚀 Deployed Contracts (BNB Testnet)

| Contract | Address | Version | Status |
|----------|---------|---------|--------|
| **PredictionMarket** | [`0x4C1508BA973856125a4F42c343560DB918c9EB2b`](https://testnet.bscscan.com/address/0x4C1508BA973856125a4F42c343560DB918c9EB2b) | v3.1.0 | ⚠️ DEPRECATED |
| **PredictionMarket** | TBD | v3.2.0 | ⏳ Pending deployment |

> **v3.2.0 Features:** Fixed bonding curve, Heat Levels (CRACK/HIGH/PRO), SweepFunds

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

## 📜 RULES OF THE GAME

> **Everything you need to understand JunkieFun in one place.**

### 1️⃣ TRADING FEES (When You Buy/Sell Shares)

| Fee | Amount | Goes To | When |
|-----|--------|---------|------|
| **Platform Fee** | 1.0% | Treasury | Every trade |
| **Creator Fee** | 0.5% | Market Creator | Every trade |
| **Net to Pool** | 98.5% | Betting Pool | Every trade |

**Example:** You buy with 1 BNB
- 0.01 BNB → Treasury (1%)
- 0.005 BNB → Market Creator (0.5%)
- 0.985 BNB → Pool (buys your shares)

---

### 2️⃣ CLAIMING FEES (When You Claim Winnings)

| Fee | Amount | Goes To | When |
|-----|--------|---------|------|
| **Resolution Fee** | 0.3% | Treasury | Claiming winnings |

**Example:** You claim 10 BNB winnings
- 0.03 BNB → Treasury (0.3%)
- 9.97 BNB → You

---

### 3️⃣ MARKET CREATION

| Fee | Amount | Notes |
|-----|--------|-------|
| **Creation Fee** | FREE (0 BNB) | Configurable by MultiSig, default is free |

---

### 4️⃣ BONDING CURVE PRICING

```
Price Formula: P(YES) + P(NO) = 0.01 BNB always

Buy more YES → YES price goes UP, NO price goes DOWN
Buy more NO  → NO price goes UP, YES price goes DOWN

Initial: YES = 0.005 BNB (50%), NO = 0.005 BNB (50%)
```

**Sell Rule:** When you sell, you receive LESS than you would expect due to price impact. Buy→Sell always results in ~3% loss (to fees). No arbitrage possible.

---

### 5️⃣ HEAT LEVELS (Market Volatility)

| Level | Virtual Liquidity | Best For | Price Impact |
|-------|-------------------|----------|--------------|
| ☢️ **CRACK** | 5 | Meme/degen markets | ~25% per 0.1 BNB |
| 🔥 **HIGH** (default) | 20 | General markets | ~7% per 0.1 BNB |
| 🧊 **PRO** | 50 | Whale/serious markets | ~3% per 0.1 BNB |

---

### 6️⃣ RESOLUTION TIMELINE

```
Market Expires
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│  CREATOR PRIORITY WINDOW (10 minutes)                       │
│  Only the market creator can propose outcome                │
└─────────────────────────────────────────────────────────────┘
     │
     ▼ (after 10 min, anyone can propose)
┌─────────────────────────────────────────────────────────────┐
│  PROPOSAL: Someone proposes YES or NO + posts bond          │
│  Bond = max(0.005 BNB, 1% of pool)                          │
└─────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│  DISPUTE WINDOW (30 minutes)                                │
│  Anyone can dispute by posting 2× the proposer's bond       │
└─────────────────────────────────────────────────────────────┘
     │
     ├──► NO DISPUTE: Market finalizes after 30 min
     │
     └──► DISPUTED:
              │
              ▼
         ┌─────────────────────────────────────────────────────┐
         │  VOTING WINDOW (1 hour)                             │
         │  Shareholders vote YES or NO                        │
         │  Vote weight = total shares held (YES + NO)         │
         └─────────────────────────────────────────────────────┘
              │
              ▼
         Market finalizes with majority vote outcome
```

---

### 7️⃣ BOND AMOUNTS

| Pool Size | Proposer Bond | Disputer Bond (2×) |
|-----------|---------------|-------------------|
| < 0.5 BNB | 0.005 BNB (floor) | 0.01 BNB |
| 1 BNB | 0.01 BNB | 0.02 BNB |
| 10 BNB | 0.1 BNB | 0.2 BNB |
| 100 BNB | 1.0 BNB | 2.0 BNB |

**Formula:** `Bond = max(0.005 BNB, Pool × 1%)`

---

### 8️⃣ PROPOSER REWARDS ⭐ (NEW in v3.3.0)

| Scenario | Proposer Gets |
|----------|---------------|
| **No Dispute** | Bond back + **0.5% of pool** |
| **Disputed + Wins** | Bond back + 50% of disputer's bond + **0.5% of pool** |
| **Disputed + Loses** | **Loses entire bond** |

**Why 0.5% reward?** Incentivizes people to resolve markets quickly. Without it, proposing has zero financial upside.

**Economics Example (10 BNB pool):**
```
Bond required:     0.1 BNB (1% of pool)
Reward if no dispute: 0.05 BNB (0.5% of pool)
Net profit:        0.05 BNB (+50% ROI on bond!)

If disputed and you WIN:
Bond back:         0.1 BNB
Disputer's bond:   0.2 BNB → You get 50% = 0.1 BNB
Pool reward:       0.05 BNB
Total:             0.25 BNB (+150% ROI!)

If disputed and you LOSE:
You lose:          0.1 BNB (your entire bond)
```

---

### 9️⃣ DISPUTER REWARDS

| Scenario | Disputer Gets |
|----------|---------------|
| **Wins Vote** | Bond back + 50% of proposer's bond |
| **Loses Vote** | **Loses entire bond** |

**Example (Disputer wins):**
```
Proposer bond:     0.1 BNB
Disputer bond:     0.2 BNB (2×)
Disputer wins vote...
Disputer gets:     0.2 BNB (back) + 0.05 BNB (50% of proposer's)
Net profit:        0.05 BNB (+25% ROI)
```

---

### 🔟 VOTER REWARDS (Jury Fees)

When a market is **disputed**, the 50% of the loser's bond NOT given to the winner goes to voters on the winning side, proportional to their voting weight.

**Example:**
```
Loser's bond:      0.2 BNB
To winner:         0.1 BNB (50%)
To voters:         0.1 BNB (50%)

Alice voted correctly, has 6000 shares
Bob voted correctly, has 4000 shares
Total winning votes: 10000 shares

Alice gets: 0.1 × (6000/10000) = 0.06 BNB
Bob gets:   0.1 × (4000/10000) = 0.04 BNB
```

---

### 1️⃣1️⃣ WINNER PAYOUTS (After Resolution)

Winners share the pool **proportionally** based on their shares:

```
Payout = (Your Winning Shares / Total Winning Shares) × Pool Balance

Example: YES wins, Pool = 10 BNB
- Alice has 600 YES shares (60% of all YES)
- Bob has 400 YES shares (40% of all YES)
- Charlie has 500 NO shares (LOSES)

Alice gets: 10 × 0.60 = 6.0 BNB
Bob gets:   10 × 0.40 = 4.0 BNB
Charlie:    0 BNB (lost the bet)
```

---

### 1️⃣2️⃣ EMERGENCY REFUND

If **24 hours** pass after expiry with NO proposal, anyone can trigger emergency refund:

```
Everyone gets back proportional to their total shares:
Refund = (Your Total Shares / All Shares) × Pool Balance

(Minus 0.3% resolution fee)
```

---

### 1️⃣3️⃣ COMPLETE FEE SUMMARY

| Action | Fee | Recipient |
|--------|-----|-----------|
| Buy shares | 1.0% | Treasury |
| Buy shares | 0.5% | Creator |
| Sell shares | 1.0% | Treasury |
| Sell shares | 0.5% | Creator |
| Claim winnings | 0.3% | Treasury |
| Emergency refund | 0.3% | Treasury |
| Create market | FREE | - |

**Maximum total fees:** 1.5% per trade + 0.3% on claim = **1.8%**

---

### 1️⃣4️⃣ GOVERNANCE (3-of-3 MultiSig)

All protocol parameters can be adjusted by MultiSig:
- Platform fee (0-5%)
- Creator fee (0-2%)
- Resolution fee (0-1%)
- Min bet (0.001-0.1 BNB)
- Bond floor (0.005-0.1 BNB)
- Heat level defaults
- Treasury address
- Pause/unpause

---

## 📋 Table of Contents

- [Quick Start](#-quick-start)
- [How It Works](#-how-it-works)
- [Heat Levels](#-heat-levels)
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

## 🔥 Heat Levels

Heat Levels control market volatility through per-market virtual liquidity. Choose the right level for your market type:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          HEAT LEVELS                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ☢️ CRACK (Degen Flash)              │  Virtual Liquidity: 5            │
│  ─────────────────────               │  Target Bet: 0.005-0.1 BNB       │
│  • Maximum volatility                │  Price Impact: ~15% per 0.05 BNB │
│  • Small bets move prices BIG        │  Best for: Meme markets, degen   │
│  • Wild swings, pure chaos           │                                   │
│                                                                          │
│  🔥 HIGH (Street Fight) - DEFAULT    │  Virtual Liquidity: 20           │
│  ─────────────────────────────────   │  Target Bet: 0.1-1.0 BNB         │
│  • Balanced volatility               │  Price Impact: ~15% per 0.5 BNB  │
│  • Good price discovery              │  Best for: General markets       │
│  • Default for most markets          │                                   │
│                                                                          │
│  🧊 PRO (Whale Pond)                 │  Virtual Liquidity: 50           │
│  ───────────────────                 │  Target Bet: 1.0-5.0+ BNB        │
│  • Low slippage                      │  Price Impact: ~15% per 2.0 BNB  │
│  • Stable prices                     │  Best for: Serious/whale markets │
│  • Whales can trade without moving   │                                   │
│    price too much                    │                                   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### How Virtual Liquidity Works

```
Price Impact = f(bet_size / virtual_liquidity)

Lower vLiq = More price movement per BNB
Higher vLiq = Less price movement per BNB

Example: 0.1 BNB bet
├── CRACK (5 vLiq):  ~25% price swing
├── HIGH (20 vLiq):  ~7% price swing  
└── PRO (50 vLiq):   ~3% price swing
```

### Choosing the Right Heat Level

| Market Type | Recommended Heat | Why |
|-------------|------------------|-----|
| Meme/joke markets | ☢️ CRACK | Max entertainment |
| Sports predictions | 🔥 HIGH | Balanced trading |
| Crypto price bets | 🔥 HIGH | Good price discovery |
| Political events | 🧊 PRO | Stable, serious |
| Whale-heavy markets | 🧊 PRO | Low slippage |

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
│   0.3 BNB        0.005 BNB (floor)   0.01 BNB (2x)         │
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

### 💡 Why No "Resolution Sniper" Rewards?

**Q: Proposers get nothing on undisputed markets. Why would anyone resolve?**

The incentive comes from **people with skin in the game**:

```
┌────────────────────────────────────────────────────────────┐
│         WHO RESOLVES MARKETS & WHY                          │
├────────────────────────────────────────────────────────────┤
│                                                             │
│   👤 THE CREATOR                                            │
│   • Wants their 0.5% creator fee reputation                │
│   • Wants markets to resolve cleanly for future users      │
│   • Has 10-min priority window to propose                  │
│                                                             │
│   🏆 THE WINNERS                                            │
│   • Want their BNB winnings NOW                            │
│   • Won't wait 24h for emergency refund                    │
│   • Can get 2x profit in 30 min by proposing truth         │
│                                                             │
│   ⚔️ THE "STREET JUSTICE" HUNTERS                           │
│   • Watch for WRONG proposals                              │
│   • Dispute liars to STEAL their bond                      │
│   • Reward: 50% of proposer's bond (not a fixed fee)       │
│                                                             │
│   Example "Street Justice" profit:                         │
│   ─────────────────────────────────                        │
│   • Liar proposes wrong outcome, posts 0.05 BNB bond       │
│   • Hunter disputes with 0.10 BNB bond                     │
│   • Voting happens, hunter wins                            │
│   • Hunter gets: 0.10 + 0.025 = 0.125 BNB                  │
│   • NET PROFIT: 0.025 BNB (25% ROI on dispute bond!)       │
│                                                             │
└────────────────────────────────────────────────────────────┘

BOTTOM LINE: Shareholders resolve markets because they want
their money. No external "sniper rewards" needed!
```

### Proposer Scenarios (All Outcomes)

```
┌────────────────────────────────────────────────────────────┐
│         PROPOSER ECONOMICS (3 Scenarios)                    │
├────────────────────────────────────────────────────────────┤
│                                                             │
│   SCENARIO A: No Dispute (Most Common - ~90% of markets)   │
│   ──────────────────────────────────────────────────────   │
│   • Proposer posts bond: 0.005 BNB                         │
│   • 30 min passes, no challenge                            │
│   • Proposer gets bond BACK: 0.005 BNB                     │
│   • NET: 0 BNB (just gas costs)                            │
│   • BUT: Proposer likely HAS A POSITION and gets winnings! │
│                                                             │
│   SCENARIO B: Disputed & Proposer WINS                     │
│   ──────────────────────────────────────                   │
│   • Proposer posts: 0.005 BNB                              │
│   • Disputer posts: 0.01 BNB (2×)                          │
│   • Voting happens, proposer wins                          │
│   • Proposer gets: 0.005 + 50% of 0.01 = 0.01 BNB         │
│   • NET PROFIT: +0.005 BNB (100% ROI on bond!)             │
│                                                             │
│   SCENARIO C: Disputed & Proposer LOSES                    │
│   ──────────────────────────────────────                   │
│   • Proposer posts: 0.005 BNB                              │
│   • Disputer posts: 0.01 BNB                               │
│   • Voting happens, disputer wins                          │
│   • Proposer loses entire bond                             │
│   • NET LOSS: -0.005 BNB                                   │
│                                                             │
│   KEY INSIGHT: Proposers are usually BETTORS who want      │
│   their winnings. The bond is just temporary collateral.   │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

### Voter Rewards (Jury Fee Example)

```
┌────────────────────────────────────────────────────────────┐
│         VOTER JURY FEE CALCULATION                          │
├────────────────────────────────────────────────────────────┤
│                                                             │
│   When a market is DISPUTED, voters on the winning side    │
│   split 50% of the loser's bond (jury fee).               │
│                                                             │
│   Example Setup:                                            │
│   ─────────────                                             │
│   • Disputer loses with 0.10 BNB bond                      │
│   • 50% to winner (proposer): 0.05 BNB                     │
│   • 50% to voters: 0.05 BNB                                │
│                                                             │
│   Voter Distribution:                                       │
│   ───────────────────                                       │
│   • Alice: 5000 shares, voted for proposer ✓               │
│   • Bob: 3000 shares, voted for proposer ✓                 │
│   • Charlie: 2000 shares, voted for disputer ✗             │
│                                                             │
│   Winning voters total: 5000 + 3000 = 8000 shares          │
│                                                             │
│   Alice's jury fee: 0.05 × (5000/8000) = 0.03125 BNB       │
│   Bob's jury fee: 0.05 × (3000/8000) = 0.01875 BNB         │
│   Charlie: 0 BNB (voted wrong side)                        │
│                                                             │
│   ✅ Incentive: Vote honestly to earn jury fees!            │
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

### 🛡️ Single Shareholder Protection (Game Theory)

**Question:** What happens if you're the ONLY buyer in a market and someone proposes the wrong outcome?

```
┌────────────────────────────────────────────────────────────┐
│         SINGLE SHAREHOLDER SCENARIO                         │
├────────────────────────────────────────────────────────────┤
│                                                             │
│   Timeline:                                                 │
│   ─────────                                                 │
│   1. You buy YES shares (only buyer)                       │
│   2. Market expires                                        │
│   3. Someone proposes "NO" (wrong outcome!)                │
│   4. You have 30 min to dispute                            │
│   5. If disputed → voting phase (1 hour)                   │
│   6. You're the ONLY voter → YOU WIN 100%                  │
│                                                             │
│   ⚠️  THE CATCH:                                            │
│   If you DON'T dispute within 30 minutes:                  │
│   • Wrong proposal gets accepted automatically             │
│   • You lose EVERYTHING                                    │
│                                                             │
│   ✅ PROTECTION (if you act in time):                       │
│   • Dispute with 2× bond                                   │
│   • Vote for yourself (only voter!)                        │
│   • Win your shares + 50% of proposer's bond               │
│                                                             │
└────────────────────────────────────────────────────────────┘

SUMMARY: Single shareholders ARE protected IF they:
• Watch the market after expiry
• Dispute wrong proposals within 30 min
• Vote during the 1-hour voting window

The contract does NOT auto-protect passive users!
```

### 🔍 Who Can Propose vs Who Can Vote

```
┌────────────────────────────────────────────────────────────┐
│         PROPOSE vs VOTE PERMISSIONS                         │
├────────────────────────────────────────────────────────────┤
│                                                             │
│   WHO CAN PROPOSE AN OUTCOME?                              │
│   ──────────────────────────────                           │
│   • First 10 min: ONLY market creator                      │
│   • After 10 min: ANYONE (even non-shareholders)           │
│   • Must post bond (0.02 BNB min or 1% of pool)           │
│                                                             │
│   WHY ALLOW NON-SHAREHOLDERS TO PROPOSE?                   │
│   • Bond requirement = skin in the game                    │
│   • Ensures markets get resolved if creator disappears     │
│   • Incentive: Get bond back + 50% of disputer's bond     │
│                                                             │
│   WHO CAN VOTE? (Only shareholders!)                       │
│   ─────────────────────────────────                        │
│   • ONLY users with yesShares > 0 OR noShares > 0         │
│   • Vote weight = total shares (YES + NO combined)        │
│   • Non-shareholders CANNOT vote                           │
│   • Contract reverts if non-shareholder tries to vote     │
│                                                             │
│   WHY THIS MATTERS:                                        │
│   • Bettors have skin in the game                         │
│   • Prevents vote manipulation by outsiders               │
│   • Larger positions = more voting power                  │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

### 🛡️ Weighted Voting Security (Anti-Sybil)

Votes are **weighted by share ownership**, NOT 1-person-1-vote. This prevents Sybil attacks.

```
┌────────────────────────────────────────────────────────────┐
│         WEIGHTED VOTING: WHY SYBIL ATTACKS DON'T WORK      │
├────────────────────────────────────────────────────────────┤
│                                                             │
│   HOW VOTE WEIGHT IS CALCULATED:                           │
│   ─────────────────────────────                            │
│   voteWeight = position.yesShares + position.noShares      │
│                                                             │
│   EXAMPLE: Alice vs Bots                                   │
│   ──────────────────────                                   │
│   Alice: 100 YES shares → Vote weight: 100                 │
│   Bot1:  2 YES shares   → Vote weight: 2                   │
│   Bot2:  2 YES shares   → Vote weight: 2                   │
│                                                             │
│   If Alice votes YES and bots vote NO:                     │
│   • YES votes: 100                                         │
│   • NO votes: 4                                            │
│   • RESULT: YES wins (Alice's vote = 25× each bot!)        │
│                                                             │
├────────────────────────────────────────────────────────────┤
│   WHY MULTIPLE WALLETS DON'T HELP ATTACKERS:               │
│   ─────────────────────────────────────────                │
│   • Splitting shares across wallets = same total weight    │
│   • 100 shares in 1 wallet = 100 shares in 50 wallets     │
│   • Attackers PAY MORE GAS for no benefit                  │
│                                                             │
│   Attack Analysis:                                         │
│   ────────────────                                         │
│   Honest: 1 BNB → 1 wallet → ~197 shares → weight: 197    │
│   Attack: 1 BNB → 10 wallets → ~197 shares → weight: 197  │
│                              + 10× gas fees!               │
│                                                             │
├────────────────────────────────────────────────────────────┤
│   ADDITIONAL PROTECTIONS:                                  │
│   ───────────────────────                                  │
│   ✅ Trading disabled after expiry (can't buy votes)      │
│   ✅ Double-vote prevention (hasVoted flag)               │
│   ✅ Non-shareholders can't vote (reverts with error)     │
│   ✅ Vote weight locked at time of voting                 │
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

// Get max sellable shares (for "Sell Max Available" button)
function getMaxSellableShares(uint256 marketId, uint256 userShares, bool isYes) view returns (uint256 maxShares, uint256 bnbOut)
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