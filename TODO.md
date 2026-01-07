# Junkie.Fun - Master TODO

> **Last Updated:** January 7, 2026  
> **Status:** Smart Contracts Complete ✅ | Frontend Pending  
> **Stack:** React 19 + Vite + Wagmi v2 + Foundry + The Graph

---

## 📋 Project Overview

A decentralized prediction market platform on BNB Chain where anyone can:
- Create prediction markets (free)
- Trade YES/NO shares via bonding curve (native BNB)
- Resolve markets using UMA Optimistic Oracle
- Claim winnings after resolution

**Key Feature:** Pump.fun-style economics where early buyers profit when later buyers enter.

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
- [x] Configure `foundry.toml` (solc 0.8.24, BNB Chain)
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

## 🔐 PHASE 1: Smart Contracts ✅ COMPLETE (74 tests)

### Core Contract: `PredictionMarket.sol` ✅

#### State Variables ✅
- [x] Market struct (question, evidenceLink, resolutionRules, expiry, creator, etc.)
- [x] Market ID counter
- [x] Mapping: marketId → Market
- [x] Mapping: marketId → user → Position (yesShares, noShares, claimed)
- [x] Mapping: assertionId → marketId (for UMA callback)
- [x] Platform treasury address
- [x] Constants: UNIT_PRICE (0.01 BNB), MIN_BET (0.005 BNB), FEE_BPS (100), BOND (0.1 WBNB)
- [x] **ADDED:** CREATOR_FEE_BPS (50) - 0.5% to market creator

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
  - Validates evidenceLink is not empty
  - Emits `MarketCreated` event
- [x] `createMarketAndBuy()` - **NEW:** Atomic create + first buy (anti-frontrun)
- [x] `buyYes(marketId, minSharesOut) payable`
  - Requires market Active
  - Requires msg.value >= MIN_BET
  - Takes 1% platform fee → treasury
  - Takes 0.5% creator fee → market.creator
  - Calculates shares from bonding curve
  - Slippage protection via minSharesOut
  - Emits `Trade` event
- [x] `buyNo(marketId, minSharesOut) payable` (same as buyYes but for NO side)
- [x] `sellYes(marketId, shares, minBnbOut)`
  - Requires market Active
  - Requires user has enough shares
  - Calculates BNB using AVERAGE price formula
  - Takes 1.5% total fee
  - InsufficientPoolBalance check
  - Emits `Trade` event
- [x] `sellNo(marketId, shares, minBnbOut)` (same as sellYes but for NO side)

#### UMA Integration ✅
- [x] Interface for UMA OOv3 (assertTruthWithDefaults)
- [x] `assertOutcome(uint256 marketId, bool outcome)`
  - Requires market Expired
  - Requires no pending assertion
  - Caller must have approved WBNB bond to contract
  - Transfers WBNB bond from caller
  - Calls UMA `assertTruthWithDefaults()`
  - Stores assertionId → marketId mapping
  - Emits `OutcomeAsserted` event
- [x] `assertionResolvedCallback(bytes32 assertionId, bool assertedTruthfully)`
  - Only callable by UMA OOv3
  - If truthful: set market outcome as resolved
  - If disputed & lost: reset assertion (allow new assertion)
  - Emits `MarketResolved` event

#### Claim Functions ✅
- [x] `claim(uint256 marketId)`
  - Requires market resolved
  - Calculates pro-rata share of pool based on winning side
  - Transfers BNB to user
  - Sets claimed flag to prevent double-claim
  - Emits `Claimed` event

#### View Functions ✅
- [x] `getMarket(uint256 marketId)` → Full market data
- [x] `getYesPrice(uint256 marketId)` → uint256
- [x] `getNoPrice(uint256 marketId)` → uint256
- [x] `getPosition(uint256 marketId, address user)` → (yesShares, noShares, claimed)
- [x] `getMarketStatus(uint256 marketId)` → MarketStatus enum
- [x] `previewBuy(marketId, bnbAmount, isYes)` → shares (for UI)
- [x] `previewSell(marketId, shares, isYes)` → bnbAmount (for UI)

#### Events ✅
- [x] `MarketCreated(uint256 indexed marketId, address indexed creator, string question, uint256 expiry)`
- [x] `Trade(uint256 indexed marketId, address indexed trader, bool isYes, bool isBuy, uint256 shares, uint256 bnbAmount)`
- [x] `OutcomeAsserted(uint256 indexed marketId, address indexed asserter, bool outcome, bytes32 assertionId)`
- [x] `MarketResolved(uint256 indexed marketId, bool outcome)`
- [x] `Claimed(uint256 indexed marketId, address indexed user, uint256 amount)`
- [x] `ActionProposed` / `ActionConfirmed` / `ActionExecuted` - Governance
- [x] `Paused` / `Unpaused` - Emergency controls

#### Security ✅
- [x] ReentrancyGuard on all payable functions
- [x] CEI pattern (Checks-Effects-Interactions)
- [x] Overflow protection (Solidity 0.8.24)
- [x] Access control: `onlySigner`, `onlyUmaOOv3`
- [x] InsufficientPoolBalance check prevents over-withdrawal
- [x] Slippage protection parameters

#### Governance (3-of-3 MultiSig) ✅
- [x] `proposeAction()` / `confirmAction()` / `executeAction()`
- [x] Configurable: platformFeeBps, minBet, umaBond, treasury, wbnb, umaOOv3
- [x] Pause/unpause functionality
- [x] 1-hour action expiry

### Tests ✅ (74 passing)
- [x] Unit tests for all functions (37 tests)
- [x] Fuzz tests for bonding curve (25 tests)
- [x] Vulnerability tests (4 tests)
- [x] Pump & dump economics tests (8 tests)
  - [x] Early buyer profits verification (+36.6%)
  - [x] Late buyer loss verification (-27%)
  - [x] Pool solvency verification (never negative)
  - [x] InsufficientPoolBalance protection
  - [x] Creator first-mover advantage

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
    outcome: Boolean
    resolved: Boolean!
    assertionId: Bytes
    trades: [Trade!]! @derivedFrom(field: "market")
  }
  ```
- [ ] `Trade` entity
  ```graphql
  type Trade @entity {
    id: ID!
    market: Market!
    trader: Bytes!
    isYes: Boolean!
    isBuy: Boolean!
    shares: BigInt!
    bnbAmount: BigDecimal!
    timestamp: BigInt!
    txHash: Bytes!
  }
  ```
- [ ] `User` entity
  ```graphql
  type User @entity {
    id: ID!
    address: Bytes!
    totalTrades: BigInt!
    totalVolume: BigDecimal!
    positions: [Position!]! @derivedFrom(field: "user")
  }
  ```
- [ ] `Position` entity
  ```graphql
  type Position @entity {
    id: ID!
    user: User!
    market: Market!
    yesShares: BigInt!
    noShares: BigInt!
  }
  ```

### Subgraph Config (`subgraph.yaml`)
- [ ] Configure dataSources for PredictionMarket contract
- [ ] Map event handlers:
  - `MarketCreated` → `handleMarketCreated`
  - `Trade` → `handleTrade`
  - `MarketResolved` → `handleMarketResolved`
  - `Claimed` → `handleClaimed`

### Mappings (`src/mapping.ts`)
- [ ] `handleMarketCreated` - Create Market entity
- [ ] `handleTrade` - Create Trade entity, update Market volumes, update User stats
- [ ] `handleMarketResolved` - Update Market outcome
- [ ] `handleClaimed` - Update Position

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
│   ├── home/
│   │   └── pages/         # HomePage (hero, featured markets)
│   └── create/
│       ├── components/    # CreateMarketForm
│       └── pages/         # CreateMarketPage
├── shared/
│   ├── api/               # GraphQL client (no axios needed for reads)
│   ├── components/ui/     # Button, Card, Modal, Input, etc.
│   ├── config/            # wagmi, env, contracts
│   ├── hooks/             # useContract hooks
│   ├── schemas/           # Zod schemas
│   ├── types/
│   └── utils/             # cn(), formatters, etc.
├── providers/
│   ├── Web3Provider.tsx
│   ├── QueryProvider.tsx
│   └── index.ts
├── router/
│   └── index.tsx
├── App.tsx
├── main.tsx
└── index.css
```

### Shared Components (Variant-Based Tailwind)
- [ ] `Button` - primary, secondary, danger, ghost, outline variants
- [ ] `Card` - default, hover, outlined variants
- [ ] `Input` - with label, error state
- [ ] `Modal` - reusable modal with Portal
- [ ] `Spinner` - loading indicator
- [ ] `Badge` - for market status
- [ ] `cn()` utility function

### Providers
- [ ] `Web3Provider` - Wagmi + RainbowKit (BNB Chain)
- [ ] `QueryProvider` - TanStack Query

### Config
- [ ] `wagmi.ts` - Chain config, transports
- [ ] `env.ts` - Environment variables with Zod validation
- [ ] `contracts.ts` - ABI + addresses

### Features: Markets

#### API Layer
- [ ] GraphQL queries for markets list
- [ ] GraphQL queries for single market
- [ ] GraphQL queries for user positions
- [ ] Contract write functions (buyYes, buyNo, sellYes, sellNo, claim)

#### Hooks (TanStack Query)
- [ ] `useMarkets(filters)` - Fetch markets list
- [ ] `useMarket(marketId)` - Fetch single market
- [ ] `useUserPositions(address)` - Fetch user's positions
- [ ] `useTrade()` - Mutation for buy/sell
- [ ] `useClaim()` - Mutation for claiming winnings

#### Components
- [ ] `MarketCard` - Preview card for market list
- [ ] `MarketDetail` - Full market view
- [ ] `TradePanel` - Buy/Sell YES/NO interface
- [ ] `PriceChart` - Visual price display (YES vs NO)
- [ ] `TradeHistory` - Recent trades feed
- [ ] `PositionCard` - User's position in a market
- [ ] `ClaimButton` - Claim winnings after resolution
- [ ] `FilterPanel` - Filter markets (status, volume, etc.)

#### Pages
- [ ] `MarketsPage` - List all markets with filters
- [ ] `MarketDetailPage` - Single market view

### Features: Create Market

#### Components
- [ ] `CreateMarketForm` - React Hook Form + Zod validation
  - Question input
  - Evidence link input (required)
  - Resolution rules textarea
  - Expiry date picker
  - Preview section

#### Pages
- [ ] `CreateMarketPage` - Form to create new market

### Features: Resolution (UMA)

#### Components
- [ ] `AssertOutcomeButton` - Assert YES or NO
- [ ] `DisputeButton` - Big red DISPUTE button during liveness
- [ ] `LivenessTimer` - 2-hour countdown
- [ ] `AssertionStatus` - Show current assertion state

### Features: Home

#### Components
- [ ] `HeroSection` - Retrowave themed hero
- [ ] `FeaturedMarkets` - Hot/trending markets
- [ ] `ActivityFeed` - Real-time trades (useWatchContractEvent)
- [ ] `HowItWorks` - Quick explainer

#### Pages
- [ ] `HomePage`

### Styling (Retrowave/90s Hacker Theme)
- [ ] Custom Tailwind color palette
  - Neon pink, cyan, purple gradients
  - Dark backgrounds with glow effects
  - Scanline/CRT effects (optional)
- [ ] Custom fonts (Press Start 2P, VT323, or similar)
- [ ] Glow/neon effects on buttons and cards
- [ ] Grid/matrix background patterns

### Routing
- [ ] `/` - HomePage
- [ ] `/markets` - MarketsPage
- [ ] `/markets/:id` - MarketDetailPage
- [ ] `/create` - CreateMarketPage
- [ ] `/portfolio` - User's positions

---

## 🧪 PHASE 4: Testing & Deployment

### Contract Testing
- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] Fuzz tests passing
- [ ] Gas optimization review

### Frontend Testing
- [ ] Component renders correctly
- [ ] Wallet connection works
- [ ] Trade flow works on testnet
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
| FEE_BPS | 100 (1%) | Platform fee on trades |
| BOND | 0.1 WBNB | UMA assertion bond (~$60) |
| LIVENESS | 2 hours | UMA challenge window |
| VIRTUAL_LIQUIDITY | 100 shares | Starting YES and NO supply |

### External Dependencies
- UMA OOv3 on BNB Chain: `0x...` (get address from UMA docs)
- WBNB on BNB Chain: `0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c`

### Resources
- [UMA OOv3 Docs](https://docs.uma.xyz/developers/optimistic-oracle-v3)
- [The Graph Docs](https://thegraph.com/docs/)
- [Wagmi Docs](https://wagmi.sh/)
- [RainbowKit Docs](https://www.rainbowkit.com/docs)

---

## ✅ Completed Phases

### Phase 0: Project Setup ✅
- Foundry initialized with OpenZeppelin & forge-std
- Project documentation complete

### Phase 1: Smart Contracts ✅ (74 tests passing)
- `PredictionMarket.sol` - Complete (1090 lines)
- Bonding curve with pump & dump economics verified
- UMA OOv3 integration complete
- 3-of-3 MultiSig governance complete
- All tests passing:
  - 37 unit tests
  - 25 fuzz tests
  - 8 pump & dump economics tests
  - 4 vulnerability tests

**Key files:**
- `/contracts/src/PredictionMarket.sol` - Main contract
- `/contracts/PROFIT.txt` - Economics math proof
- `/contracts/test/PumpDump.t.sol` - Economics verification tests
