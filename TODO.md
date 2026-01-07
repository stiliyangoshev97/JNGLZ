# Junkie.Fun - Master TODO

> **Last Updated:** January 8, 2025  
> **Status:** Smart Contracts Complete ✅ | Frontend Pending  
> **Stack:** React 19 + Vite + Wagmi v2 + Foundry + The Graph

---

## 📋 Project Overview

A decentralized prediction market platform on BNB Chain where anyone can:
- Create prediction markets (free)
- Trade YES/NO shares via bonding curve (native BNB)
- Resolve markets using **Street Consensus** (bettors vote on outcomes)
- Claim winnings after resolution

**Key Features:**
- Pump.fun-style economics where early buyers profit when later buyers enter
- **Street Consensus** resolution: Fast (30-90 min), no external oracles
- Creator priority window for fair resolution
- Jury fee incentives for voters

---

## 🔧 PHASE 0: Project Setup ✅ COMPLETE

### Environment Setup
- [x] Initialize root project structure
- [x] Create `contracts/` folder with Foundry
- [ ] Create `frontend/` folder with Vite + React
- [ ] Create `subgraph/` folder for The Graph
- [x] Create `.env.example` files for all folders
- [x] Create `requirements.txt` documenting all dependencies

### Contracts Setup (Foundry) ✅
- [x] `forge init contracts`
- [x] Install OpenZeppelin: `forge install OpenZeppelin/openzeppelin-contracts`
- [x] Configure `foundry.toml` (solc 0.8.24, BNB Chain, optimizer enabled)
- [x] Create `remappings.txt`

### Frontend Setup (Vite + React)
- [ ] `npm create vite@latest frontend -- --template react-ts`
- [ ] Install dependencies:
  - [ ] `wagmi`, `viem`, `@rainbow-me/rainbowkit`
  - [ ] `@tanstack/react-query`
  - [ ] `zustand`
  - [ ] `react-hook-form`, `@hookform/resolvers`, `zod`
  - [ ] `tailwindcss`, `postcss`, `autoprefixer`
  - [ ] `axios`
  - [ ] `react-router-dom`
- [ ] Configure Tailwind with retrowave/90s hacker theme
- [ ] Setup folder structure (features/, shared/, providers/, router/)

---

## 🔐 PHASE 1: Smart Contracts ✅ COMPLETE (116 tests)

### Core Contract: `PredictionMarket.sol` ✅

#### State Variables ✅
- [x] Market struct (question, evidenceLink, resolutionRules, expiry, creator, etc.)
- [x] Market ID counter
- [x] Mapping: marketId → Market
- [x] Mapping: marketId → user → Position (yesShares, noShares, claimed, hasVoted, etc.)
- [x] Platform treasury address
- [x] Configurable parameters via MultiSig

#### Configurable Parameters (via MultiSig) ✅
- [x] `platformFeeBps` = 100 (1%) - range 0-5%
- [x] `creatorFeeBps` = 50 (0.5%) - range 0-2%
- [x] `resolutionFeeBps` = 30 (0.3%) - range 0-1%
- [x] `minBondFloor` = 0.02 BNB - range 0.01-0.1 BNB
- [x] `dynamicBondBps` = 100 (1%) - range 0.5-5%
- [x] `bondWinnerShareBps` = 5000 (50%) - range 20-80%
- [x] `minBet` = 0.005 BNB

#### Timing Constants ✅
- [x] `CREATOR_PRIORITY_WINDOW` = 10 minutes
- [x] `DISPUTE_WINDOW` = 30 minutes
- [x] `VOTING_WINDOW` = 1 hour
- [x] `EMERGENCY_REFUND_DELAY` = 24 hours

#### Bonding Curve Math ✅
- [x] Virtual liquidity: 100 YES + 100 NO at start (scaled to 1e18)
- [x] Price calculation: P(yes) = virtualYes / (virtualYes + virtualNo) * UNIT_PRICE
- [x] Constraint: P(yes) + P(no) = UNIT_PRICE (0.01 BNB)
- [x] Buy: Calculate shares for BNB amount (instantaneous price)
- [x] Sell: Calculate BNB return using AVERAGE price (ensures pool solvency)
- [x] Rounding: Down for payouts, up for costs
- [x] **VERIFIED:** Pump & dump economics working (early +36.6%, late -27%)

#### Core Functions ✅
- [x] `createMarket(question, evidenceLink, resolutionRules, expiryTimestamp)`
  - Free (0 BNB + gas)
  - Validates expiry is in future
  - EvidenceLink optional (degen-friendly)
  - Emits `MarketCreated` event
- [x] `createMarketAndBuy()` - Atomic create + first buy (anti-frontrun)
- [x] `buyYes(marketId, minSharesOut) payable`
  - Takes 1% platform fee → treasury
  - Takes 0.5% creator fee → market.creator
  - Slippage protection via minSharesOut
- [x] `buyNo(marketId, minSharesOut) payable`
- [x] `sellYes(marketId, shares, minBnbOut)`
- [x] `sellNo(marketId, shares, minBnbOut)`

#### Street Consensus Resolution ✅
- [x] `proposeOutcome(marketId, outcome, proofLink) payable`
  - Creator has 10 min priority window
  - Posts bond: max(minBondFloor, pool * dynamicBondBps)
  - Proof link optional
  - Emits `OutcomeProposed` event
- [x] `dispute(marketId, proofLink) payable`
  - Requires 2× proposer's bond
  - Only 1 dispute per market
  - Can include counter-proof
  - Emits `MarketDisputed` event
- [x] `vote(marketId, supportProposer)`
  - Only shareholders can vote
  - Weight = total shares (yes + no)
  - Can't vote twice
  - Emits `VoteCast` event
- [x] `finalizeMarket(marketId)`
  - Called after voting ends
  - Simple majority wins
  - Distributes bonds (winner 50%, voters 50% of loser)
  - Tie (0 vs 0) returns both bonds
  - Emits `MarketFinalized`, `MarketResolved`

#### Claim Functions ✅
- [x] `claim(marketId)`
  - Pro-rata share of pool based on winning side
  - Double-claim protection
- [x] `emergencyRefund(marketId)`
  - Available 24h after expiry with no proposal
  - Proportional to total shares
  - Order-independent fairness

#### View Functions ✅
- [x] `getMarket(marketId)` → Full market data (10 values)
- [x] `getYesPrice(marketId)` → uint256
- [x] `getNoPrice(marketId)` → uint256
- [x] `getPosition(marketId, user)` → (yesShares, noShares, claimed, emergencyRefunded, hasVoted, votedForProposer)
- [x] `getMarketStatus(marketId)` → MarketStatus enum (Active/Expired/Proposed/Disputed/Resolved)
- [x] `previewBuy(marketId, bnbAmount, isYes)` → shares
- [x] `previewSell(marketId, shares, isYes)` → bnbAmount
- [x] `getMaxSellableShares(marketId, userShares, isYes)` → (maxShares, bnbOut) **NEW**
- [x] `getRequiredBond(marketId)` → bond amount
- [x] `canEmergencyRefund(marketId)` → (eligible, timeUntil)

#### Events ✅
- [x] `MarketCreated`
- [x] `Trade`
- [x] `OutcomeProposed`
- [x] `MarketDisputed`
- [x] `VoteCast`
- [x] `MarketFinalized`
- [x] `MarketResolved`
- [x] `Claimed`
- [x] `JuryFeePaid`
- [x] `EmergencyRefunded`
- [x] `ActionProposed` / `ActionConfirmed` / `ActionExecuted`
- [x] `Paused` / `Unpaused`

#### Security ✅
- [x] ReentrancyGuard on all payable functions
- [x] CEI pattern (Checks-Effects-Interactions)
- [x] Overflow protection (Solidity 0.8.24)
- [x] Access control: `onlySigner`
- [x] InsufficientPoolBalance check
- [x] Slippage protection parameters
- [x] Double-vote prevention
- [x] Bond validation

#### Governance (3-of-3 MultiSig) ✅
- [x] `proposeAction()` / `confirmAction()` / `executeAction()`
- [x] All parameters configurable
- [x] Pause/unpause functionality
- [x] 1-hour action expiry

### Tests ✅ (124 passing)
- [x] Unit tests (52 tests)
  - Market creation, trading, fees
  - Street Consensus: propose, dispute, vote, finalize
  - Claims, emergency refunds
- [x] Fuzz tests (29 tests)
  - Bonding curve math
  - All 5 configurable parameters
  - Edge cases
- [x] Vulnerability tests (4 tests)
  - Reentrancy
  - Overflow
  - Access control
- [x] Economics tests (31 tests)
  - Pump & dump verification
  - Pool solvency
  - Creator first-mover advantage
- [x] **Instant Sell Analysis (8 tests)** - NEW
  - Tests what happens when user tries to sell immediately
  - Tests for `getMaxSellableShares()` contract function
  - See critical findings below

### ⚠️ Critical Finding: Instant Sell Liquidity Constraint

**Issue Discovered:** When a user is the ONLY buyer in a market (no opposing side liquidity), they CANNOT immediately sell 100% of their position.

| Buy Amount | Max Instant Sellable | Position Stuck |
|------------|---------------------|----------------|
| 0.01 BNB (~$5) | 99% | 1% |
| 0.1 BNB (~$50) | 95% | 5% |
| 0.5 BNB (~$250) | 83% | 17% |
| **1 BNB (~$500)** | **74%** | **26%** |
| 2 BNB (~$1000) | 65% | 35% |

**Root Cause:** The `_calculateSellBnb()` function uses average price between before and after sell. When you're the only buyer, the pool doesn't have enough BNB to cover the average price return for your full position.

**Good News:** When there IS opposing liquidity (buyers on both YES and NO):
- ✅ Full instant selling WORKS perfectly
- ✅ The user can even PROFIT if they buy the cheap side and sell immediately

**Mitigation (already working):**
- Contract reverts with `InsufficientPoolBalance` if sell would drain pool
- Users can always sell partial positions
- Healthy markets with both-side activity don't have this issue
- **NEW:** `getMaxSellableShares()` view function calculates max sellable in one call

**Frontend Implementation (using `getMaxSellableShares()`):**
```typescript
// Get user's position
const { yesShares } = await contract.getPosition(marketId, userAddress);

// Get max sellable (single RPC call!)
const { maxShares, bnbOut } = await contract.getMaxSellableShares(
  marketId,
  yesShares,
  true // isYes
);

// Display to user
const percentage = (maxShares * 100n) / yesShares;
if (percentage < 100n) {
  // Show warning: "Low liquidity - can only sell {percentage}% now"
  // Show "Sell Max Available" button
}
```

**Frontend UI Requirements:**
- [ ] Call `getMaxSellableShares()` when user opens sell panel
- [ ] Display "Max Sellable Now: X shares (Y%)" 
- [ ] Show "⚠️ Low Liquidity" warning when < 100%
- [ ] Add "Sell Max Available" button (uses `maxShares` from contract)
- [ ] Show "Liquidity Health" indicator (green ≥90%, yellow 50-90%, red <50%)
- [ ] Update values in real-time as market state changes

**Status:** This is **by design** - the bonding curve protects the pool. The frontend must communicate this clearly to users.

### Documentation ✅
- [x] README.md - Economics in 20 seconds
- [x] CHANGELOG.md - v2.0.0 Street Consensus
- [x] PROJECT_CONTEXT.md - Architecture reference
- [x] RUNBOOK.md - Commands guide

### Deployment
- [ ] Deployment script for BSC Testnet
- [ ] Deployment script for BSC Mainnet
- [ ] Verify contract on BscScan
- [ ] Document deployed addresses

---

## 📊 PHASE 2: The Graph (Subgraph)

### Setup
- [ ] Create account on Subgraph Studio (https://thegraph.com/studio)
- [ ] Create new subgraph for BNB Chain
- [ ] Install Graph CLI: `npm install -g @graphprotocol/graph-cli`
- [ ] Initialize subgraph: `graph init`

### Schema (`schema.graphql`)
- [ ] `Market` entity
  ```graphql
  type Market @entity {
    id: ID!
    marketId: BigInt!
    question: String!
    evidenceLink: String!
    resolutionRules: String!
    creator: Bytes!
    expiryTimestamp: BigInt!
    createdAt: BigInt!
    yesSupply: BigInt!
    noSupply: BigInt!
    totalVolume: BigDecimal!
    status: String!  # Active, Expired, Proposed, Disputed, Resolved
    outcome: Boolean
    proposer: Bytes
    disputer: Bytes
    proposerVotes: BigInt
    disputerVotes: BigInt
    trades: [Trade!]! @derivedFrom(field: "market")
    votes: [Vote!]! @derivedFrom(field: "market")
  }
  ```
- [ ] `Trade` entity
- [ ] `Vote` entity (NEW)
- [ ] `User` entity
- [ ] `Position` entity

### Mappings
- [ ] `handleMarketCreated`
- [ ] `handleTrade`
- [ ] `handleOutcomeProposed` (NEW)
- [ ] `handleMarketDisputed` (NEW)
- [ ] `handleVoteCast` (NEW)
- [ ] `handleMarketFinalized` (NEW)
- [ ] `handleMarketResolved`
- [ ] `handleClaimed`
- [ ] `handleEmergencyRefunded`

### Deployment
- [ ] Deploy to Subgraph Studio (BSC Testnet)
- [ ] Test queries in Playground
- [ ] Deploy to Subgraph Studio (BSC Mainnet)
- [ ] Document subgraph URL

---

## 💻 PHASE 3: Frontend

### Project Structure
```
frontend/src/
├── features/
│   ├── markets/
│   │   ├── api/           # GraphQL queries, contract writes
│   │   ├── components/    # MarketCard, TradePanel, etc.
│   │   ├── hooks/         # useMarkets, useMarket, useTrade
│   │   ├── pages/         # MarketsPage, MarketDetailPage
│   │   └── types/
│   ├── resolution/        # NEW: Street Consensus UI
│   │   ├── components/    # ProposePanel, DisputePanel, VotePanel
│   │   └── hooks/         # usePropose, useDispute, useVote
│   ├── home/
│   │   └── pages/         # HomePage (hero, featured markets)
│   └── create/
│       ├── components/    # CreateMarketForm
│       └── pages/         # CreateMarketPage
├── shared/
│   ├── components/ui/     # Button, Card, Modal, Input, etc.
│   ├── config/            # wagmi, env, contracts
│   └── utils/
├── providers/
└── router/
```

### Resolution UI Components (Street Consensus)
- [ ] `ProposeOutcomePanel` - Propose YES/NO with bond
- [ ] `DisputePanel` - Challenge with 2× bond
- [ ] `VotingPanel` - Vote for proposer/disputer
- [ ] `ResolutionTimeline` - Show current phase & countdown
- [ ] `BondCalculator` - Show required bond
- [ ] `VoteWeightDisplay` - Show user's voting power
- [ ] `JuryFeeEstimate` - Estimated earnings for voting

### 🗳️ Vote Button Visibility (IMPORTANT!)
**Requirement:** The Vote button should ONLY be visible/enabled for users who have a position in the market.

**Logic:**
```typescript
// Check if user has any shares in this market
const { yesShares, noShares } = await contract.getPosition(marketId, userAddress);
const hasPosition = yesShares > 0n || noShares > 0n;

// Only show Vote button if:
// 1. Market status is DISPUTED (voting phase)
// 2. User has position (yesShares > 0 OR noShares > 0)
// 3. User hasn't voted yet (hasVoted === false)
const canVote = marketStatus === 'Disputed' && hasPosition && !hasVoted;
```

**UI Requirements:**
- [ ] Hide Vote button entirely if user has no position (yesShares = 0 AND noShares = 0)
- [ ] Show "You must hold shares to vote" message if user clicks on disabled voting area
- [ ] Display user's voting weight prominently: "Your vote weight: {yesShares + noShares} shares"
- [ ] Grey out Vote button if user has already voted, show "You voted for {Proposer/Disputer}"
- [ ] Voting weight = total shares (YES + NO combined)

**Why this matters:**
- Only bettors can vote (they have skin in the game)
- Prevents vote spam from non-participants
- Vote weight is proportional to position size
- Contract will revert `vote()` if user has no shares anyway

### Pages
- [ ] `MarketsPage` - List all markets
- [ ] `MarketDetailPage` - Single market + resolution UI
- [ ] `CreateMarketPage` - Create new market
- [ ] `PortfolioPage` - User's positions & pending jury fees

### ⏰ Market Expiry Picker (CreateMarketPage)
**Contract accepts:** Unix timestamp (any future time - no min/max restrictions)

**Recommended UI:** Preset duration buttons + optional custom picker

```
┌─────────────────────────────────────┐
│  When does this resolve?            │
├─────────────────────────────────────┤
│  [1 Hour] [4 Hours] [24 Hours]      │
│  [3 Days] [1 Week]  [Custom...]     │
└─────────────────────────────────────┘
```

**Implementation:**
```typescript
const durations = {
  '1h': 60 * 60,
  '4h': 4 * 60 * 60,
  '24h': 24 * 60 * 60,
  '3d': 3 * 24 * 60 * 60,
  '1w': 7 * 24 * 60 * 60,
};

// Calculate expiry timestamp
const expiryTimestamp = Math.floor(Date.now() / 1000) + durations['24h'];

// Or from custom date picker
const selectedDate = new Date('2026-01-15T15:00:00');
const expiryTimestamp = Math.floor(selectedDate.getTime() / 1000);
```

**UI Requirements:**
- [ ] Preset buttons for common durations (1h, 4h, 24h, 3d, 1w)
- [ ] "Custom" button opens date/time picker
- [ ] Show countdown preview: "Expires in 23h 59m"
- [ ] Validate expiry is in future before submit
- [ ] Default selection: 24 hours (most common for degen markets)

### 💡 UX/UI: Simplified Trading Display (IMPORTANT!)
**Goal:** Make the complex bonding curve math invisible. Show 3 simple numbers:

1. **"Buy Price"** - How much it costs to join the fight (per share or for X BNB)
2. **"Exit Now"** - The dump value (what you'd get if you sold immediately)
3. **"Potential Payout"** - What you get if you're right and hold until the end

**Implementation Notes:**
- Use `previewBuy()` for Buy Price calculation
- Use `previewSell()` for Exit Now calculation  
- Use share count × UNIT_PRICE for Potential Payout (if you win 100%)
- Show these 3 numbers prominently on every trade panel
- Update in real-time as user changes bet amount
- Color code: Green for profit scenarios, Red for loss scenarios

**Example Display:**
```
┌─────────────────────────────────────┐
│  You're betting: 0.1 BNB on YES     │
├─────────────────────────────────────┤
│  📊 Buy Price:      0.0052 BNB/share│
│  🚪 Exit Now:       0.095 BNB       │
│  🏆 Potential Win:  0.19 BNB        │
│                     (+90% if YES)   │
└─────────────────────────────────────┘
```

**Rationale:** Users don't need to understand bonding curves, virtual liquidity, 
or average price formulas. They just need to know: cost, exit, potential win.

---

## 🧪 PHASE 4: Testing & Deployment

### Contract Testing ✅
- [x] All unit tests passing (52)
- [x] All fuzz tests passing (29)
- [x] All feature tests passing (31)
- [x] All vulnerability tests passing (4)
- [x] Gas optimization (optimizer enabled)

### Frontend Testing
- [ ] Component renders correctly
- [ ] Wallet connection works
- [ ] Trade flow works on testnet
- [ ] Resolution flow works (propose/dispute/vote/finalize)
- [ ] Claim flow works on testnet

### Testnet Deployment
- [ ] Deploy contract to BSC Testnet
- [ ] Deploy subgraph to Subgraph Studio (testnet)
- [ ] Deploy frontend to Vercel (preview)
- [ ] Full E2E testing

### Mainnet Deployment
- [ ] Security audit (optional but recommended)
- [ ] Deploy contract to BSC Mainnet
- [ ] Verify on BscScan
- [ ] Deploy subgraph to Subgraph Studio (mainnet)
- [ ] Deploy frontend to Vercel (production)
- [ ] Set up monitoring

---

## 📝 Notes

### Key Constants
| Constant | Value | Description |
|----------|-------|-------------|
| UNIT_PRICE | 0.01 BNB | P(YES) + P(NO) always equals this |
| MIN_BET | 0.005 BNB | Minimum bet amount (~$3) |
| platformFeeBps | 100 (1%) | Platform fee on trades |
| creatorFeeBps | 50 (0.5%) | Creator fee on trades |
| resolutionFeeBps | 30 (0.3%) | Fee on resolution actions |
| minBondFloor | 0.02 BNB | Minimum proposal bond |
| bondWinnerShareBps | 5000 (50%) | Winner's share of loser bond |
| CREATOR_PRIORITY | 10 min | Creator's head start |
| DISPUTE_WINDOW | 30 min | Time to challenge |
| VOTING_WINDOW | 1 hour | Voting period |
| EMERGENCY_REFUND | 24 hours | Refund eligibility |

### External Dependencies
- **None!** Street Consensus has no external oracle dependencies
- WBNB no longer needed for bonds (uses native BNB)

### Resources
- [The Graph Docs](https://thegraph.com/docs/)
- [Wagmi Docs](https://wagmi.sh/)
- [RainbowKit Docs](https://www.rainbowkit.com/docs)

---

## ✅ Completed Phases

### Phase 0: Project Setup ✅
- Foundry initialized with OpenZeppelin & forge-std
- Project documentation complete

### Phase 1: Smart Contracts ✅ (116 tests passing)
- `PredictionMarket.sol` - Complete
- Street Consensus resolution system
- 5 configurable parameters via MultiSig
- Bonding curve with pump & dump economics verified
- All tests passing:
  - 52 unit tests
  - 29 fuzz tests
  - 31 economics + feature tests
  - 4 vulnerability tests

**Key files:**
- `/contracts/src/PredictionMarket.sol` - Main contract
- `/contracts/test/PredictionMarket.t.sol` - Unit tests
- `/contracts/test/PredictionMarket.fuzz.t.sol` - Fuzz tests
- `/contracts/test/PumpDump.t.sol` - Economics tests
- `/contracts/PROFIT.txt` - Economics math proof
