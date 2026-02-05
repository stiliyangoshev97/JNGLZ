# 🏗️ JNGLZ.FUN - Building from Scratch Guide

> **Complete guide to understanding and rebuilding the project file by file**  
> **Last Updated:** February 5, 2026  
> **Status:** 🚀 Mainnet Live

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Complete Project Structure](#complete-project-structure)
3. [Technology Stack](#technology-stack)
4. [Prerequisites](#prerequisites)
5. [Phase 1: Smart Contracts (Foundation)](#phase-1-smart-contracts-foundation)
6. [Phase 2: The Graph Subgraph](#phase-2-the-graph-subgraph)
7. [Phase 3: Frontend Application](#phase-3-frontend-application)
8. [Phase 4: Supabase Backend](#phase-4-supabase-backend)
9. [Dependency Diagrams](#dependency-diagrams)
10. [Quick Start for Reviewers](#quick-start-for-reviewers)

---

## Project Overview

**JNGLZ.FUN** is a decentralized prediction market launchpad on BNB Chain where:
- Anyone can create prediction markets (FREE)
- Users trade YES/NO shares with native BNB
- Markets resolve via Street Consensus (bettors vote)
- Winners claim proportional share of the pool

**Architecture:**
```
┌─────────────────────────────────────────────────────────────────┐
│                        JNGLZ.FUN                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐       │
│   │   Frontend  │    │  Subgraph   │    │  Supabase   │       │
│   │  (React)    │◄──►│ (The Graph) │    │ (Chat/Mod)  │       │
│   └──────┬──────┘    └──────┬──────┘    └──────┬──────┘       │
│          │                  │                  │               │
│          │                  │                  │               │
│          └─────────────┬────┴──────────────────┘               │
│                        │                                        │
│                        ▼                                        │
│           ┌─────────────────────────┐                          │
│           │    Smart Contract       │                          │
│           │  (PredictionMarket.sol) │                          │
│           │       BNB Chain         │                          │
│           └─────────────────────────┘                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Complete Project Structure

```
JNGLZ/
├── PROJECT.md                          # Project summary
├── TODO.md                             # Master task tracker
├── BUILD-FROM-SCRATCH.md               # This file
├── DeployedContracts.txt               # Contract addresses
├── PROJECT_CONTEXT_SUBGRAPH.md         # Subgraph documentation
│
├── contracts/                          # Solidity Smart Contracts (Foundry)
│   ├── foundry.toml                    # Foundry configuration
│   ├── remappings.txt                  # Import remappings
│   ├── PROJECT_CONTEXT.md              # Contract documentation
│   ├── CHANGELOG.md                    # Version history
│   ├── README.md                       # How contracts work
│   ├── GOVERNANCE.md                   # MultiSig guide
│   ├── RUNBOOK.md                      # Operations guide
│   ├── SECURITY_ANALYSIS.md            # Security review
│   ├── src/
│   │   └── PredictionMarket.sol        # Main contract (monolithic)
│   ├── script/
│   │   └── Deploy.s.sol                # Deployment script
│   ├── test/
│   │   ├── PredictionMarket.t.sol      # Core tests
│   │   ├── PredictionMarket.fuzz.t.sol # Fuzz tests
│   │   ├── BondingCurveEconomics.t.sol # Math tests
│   │   ├── Integration.t.sol           # E2E tests
│   │   └── ...                         # More test files
│   └── lib/
│       ├── forge-std/                  # Foundry standard lib
│       └── openzeppelin-contracts/     # OpenZeppelin
│
├── subgraph/                           # The Graph Indexer
│   ├── package.json                    # Dependencies
│   ├── schema.graphql                  # Entity definitions
│   ├── subgraph.yaml                   # Data source config
│   ├── networks.json                   # Multi-network addresses
│   ├── tsconfig.json                   # TypeScript config
│   ├── CHANGELOG.md                    # Version history
│   ├── README.md                       # Setup guide
│   ├── RUNBOOK.md                      # Operations guide
│   ├── abis/
│   │   └── PredictionMarket.json       # Contract ABI
│   ├── src/
│   │   └── mapping.ts                  # Event handlers
│   └── generated/                      # Auto-generated types
│
├── frontend/                           # React Application
│   ├── package.json                    # Dependencies
│   ├── vite.config.ts                  # Vite configuration
│   ├── tailwind.config.js              # Tailwind CSS
│   ├── tsconfig.json                   # TypeScript config
│   ├── vercel.json                     # Deployment config
│   ├── index.html                      # HTML entry
│   ├── PROJECT_CONTEXT.md              # Frontend documentation
│   ├── CHANGELOG.md                    # Version history
│   ├── public/
│   │   ├── favicon.ico
│   │   └── ...
│   ├── src/
│   │   ├── main.tsx                    # Entry point
│   │   ├── App.tsx                     # Root component
│   │   ├── index.css                   # Global styles
│   │   ├── router/
│   │   │   ├── routes.tsx              # Route definitions
│   │   │   ├── RootLayout.tsx          # Layout wrapper
│   │   │   └── Header.tsx              # Navigation
│   │   ├── providers/                  # React providers
│   │   ├── lib/
│   │   │   ├── supabase.ts             # Supabase client
│   │   │   └── database.types.ts       # DB types
│   │   ├── shared/
│   │   │   ├── config/                 # env, wagmi, contracts, graphql
│   │   │   ├── hooks/                  # Contract hooks, polling, SIWE
│   │   │   ├── components/             # UI components
│   │   │   ├── schemas/                # Zod schemas
│   │   │   ├── utils/                  # Helpers
│   │   │   └── api/                    # GraphQL queries
│   │   └── features/
│   │       ├── markets/                # Markets & trading
│   │       ├── portfolio/              # User positions
│   │       ├── create/                 # Market creation
│   │       ├── chat/                   # Supabase chat
│   │       ├── leaderboard/            # Rankings
│   │       └── legal/                  # Terms, Privacy
│   └── supabase/                       # Supabase Backend
│       ├── config.toml                 # Supabase config
│       ├── PROJECT_CONTEXT_SUPABASE.md # Documentation
│       ├── CHANGELOG.md                # Version history
│       ├── migrations/
│       │   └── 001_add_spam_detection.sql
│       └── functions/
│           ├── _shared/                # Shared utilities
│           │   ├── cors.ts
│           │   ├── siwe.ts
│           │   ├── supabase.ts
│           │   └── validation.ts
│           ├── send-message/
│           │   └── index.ts
│           ├── delete-message/
│           │   └── index.ts
│           └── moderate-market/
│               └── index.ts
│
└── assets/                             # Brand assets
    ├── logo.svg
    ├── favicon.ico
    └── ...
```

---

## Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Smart Contracts** | Solidity 0.8.24, Foundry | On-chain logic |
| **Indexer** | The Graph, AssemblyScript | Event indexing, GraphQL API |
| **Frontend** | React 19, Vite, TypeScript | User interface |
| **Web3** | Wagmi 2.x, Viem, RainbowKit | Wallet connection |
| **State** | React Query, Apollo Client | Server state |
| **Styling** | Tailwind CSS 3.x | UI styling |
| **Backend** | Supabase (Edge Functions) | Chat, moderation |
| **Auth** | SIWE (Sign-In With Ethereum) | Wallet authentication |

---

## Prerequisites

Before starting, ensure you have:

```bash
# Node.js 20+
node --version  # v20.x.x

# pnpm or npm
npm --version   # 10.x.x

# Foundry (for contracts)
curl -L https://foundry.paradigm.xyz | bash
foundryup
forge --version # forge 0.2.x

# The Graph CLI
npm install -g @graphprotocol/graph-cli
graph --version # 0.71.x

# Supabase CLI
brew install supabase/tap/supabase
supabase --version # 1.x.x
```

---

## Phase 1: Smart Contracts (Foundation)

> **Note:** Smart contracts are the foundation. The subgraph and frontend depend on the contract's ABI and events.

### 1.1 Contract Files (Creation Order)

| Order | File | Purpose | Dependencies |
|-------|------|---------|--------------|
| 1 | `foundry.toml` | Foundry config | None |
| 2 | `remappings.txt` | Import paths | None |
| 3 | `lib/` | Install dependencies | `forge install` |
| 4 | `src/PredictionMarket.sol` | Main contract | OpenZeppelin |
| 5 | `script/Deploy.s.sol` | Deployment script | Contract |
| 6 | `test/*.t.sol` | Test files | Contract |

### 1.2 Key Contract Events (Used by Subgraph)

```solidity
// These events are indexed by the subgraph
event MarketCreated(uint256 indexed marketId, address indexed creator, string question, uint256 expiryTimestamp, uint8 heatLevel, uint256 virtualLiquidity);
event Trade(uint256 indexed marketId, address indexed trader, bool isYes, bool isBuy, uint256 shares, uint256 bnbAmount);
event OutcomeProposed(uint256 indexed marketId, address indexed proposer, bool outcome, uint256 bond);
event ProposalDisputed(uint256 indexed marketId, address indexed disputer, uint256 bond);
event VoteCast(uint256 indexed marketId, address indexed voter, bool outcome, uint256 weight);
event MarketResolved(uint256 indexed marketId, bool outcome, bool disputed);
event Claimed(uint256 indexed marketId, address indexed user, uint256 amount);
event EmergencyRefunded(uint256 indexed marketId, address indexed user, uint256 amount);
event TieFinalized(uint256 indexed marketId);
// ... more events in contract
```

### 1.3 After Deployment

1. Export ABI: `forge build && cp out/PredictionMarket.sol/PredictionMarket.json ../subgraph/abis/`
2. Record contract address in `DeployedContracts.txt`
3. Verify on BscScan

---

## Phase 2: The Graph Subgraph

> **The subgraph indexes blockchain events and provides a GraphQL API. It replaces a traditional backend.**

### 2.1 File Creation Order

| Order | File | Purpose | Dependencies |
|-------|------|---------|--------------|
| 1 | `package.json` | Project config & dependencies | None |
| 2 | `tsconfig.json` | TypeScript config | None |
| 3 | `networks.json` | Contract addresses per network | Contract deployed |
| 4 | `abis/PredictionMarket.json` | Contract ABI | Contract built |
| 5 | `schema.graphql` | Entity definitions | None |
| 6 | `subgraph.yaml` | Data source & handlers | schema, ABI |
| 7 | `src/mapping.ts` | Event handler logic | schema, ABI (run codegen first) |

---

### 2.2 Detailed File Guide

#### **Step 1: `package.json`**

```json
{
  "name": "jnglz-subgraph",
  "version": "5.2.0",
  "scripts": {
    "codegen": "graph codegen",
    "build": "graph build",
    "deploy:testnet": "graph deploy --studio jnglz-testnet-fresh --network chapel",
    "deploy:mainnet": "graph deploy --studio jnglz-mainnet --network bsc"
  },
  "dependencies": {
    "@graphprotocol/graph-cli": "0.71.0",
    "@graphprotocol/graph-ts": "0.32.0"
  }
}
```

#### **Step 2: `networks.json`**

```json
{
  "chapel": {
    "PredictionMarket": {
      "address": "0xC97FB434B79e6c643e0320fa802B515CedBA95Bf",
      "startBlock": 86465841
    }
  },
  "bsc": {
    "PredictionMarket": {
      "address": "0xA482Ac7acbf846F2DAEE8b8dF3D7e77F85CC7528",
      "startBlock": 79457714
    }
  }
}
```

#### **Step 3: `abis/PredictionMarket.json`**

Copy from `contracts/out/PredictionMarket.sol/PredictionMarket.json` after running `forge build`.

#### **Step 4: `schema.graphql`**

Define entities in this order (based on dependencies):

| Order | Entity | Purpose | References |
|-------|--------|---------|------------|
| 1 | `User` | Trader profiles, P/L tracking | None |
| 2 | `Market` | Prediction markets | `User` (creator) |
| 3 | `Trade` | Buy/sell transactions | `Market`, `User` |
| 4 | `Position` | User position per market | `Market`, `User` |
| 5 | `Vote` | Voting records | `Market`, `User` |
| 6 | `Claim` | Payout claims | `Market`, `User` |
| 7 | `EmergencyRefund` | Refund records | `Market`, `User` |
| 8 | `GlobalStats` | Platform statistics | None |
| 9 | `ProposerReward` | Proposer rewards | `Market`, `User` |
| 10 | `JuryFeesPool` | Jury fee pools | `Market` |
| 11 | `JuryFeesClaim` | Jury fee claims | `Market`, `User` |
| 12 | `WithdrawalCredit` | Pull Pattern credits | `User` |
| 13 | `WithdrawalClaim` | Pull Pattern claims | `User` |
| 14 | `CreatorFeeCredit` | Creator fee credits | `User`, `Market` |
| 15 | `CreatorFeeClaim` | Creator fee claims | `User` |
| 16 | `MarketResolutionFailure` | Failed resolutions | `Market` |

**Key Entity: User (with P/L tracking)**

```graphql
type User @entity(immutable: false) {
  id: ID!                          # address as string
  address: Bytes!
  
  # Stats
  totalTrades: BigInt!
  totalVolume: BigDecimal!
  marketsCreated: BigInt!
  
  # P/L Tracking
  totalBought: BigDecimal!
  totalSold: BigDecimal!
  tradingPnL: BigDecimal!
  totalInvestedInResolved: BigDecimal!
  totalClaimedFromResolved: BigDecimal!
  resolutionPnL: BigDecimal!
  totalPnL: BigDecimal!
  
  # Win/Loss Stats
  winCount: BigInt!
  lossCount: BigInt!
  winRate: BigDecimal!
  
  # Earnings
  totalCreatorFeesEarned: BigDecimal!
  totalProposerRewardsEarned: BigDecimal!
  totalBondEarnings: BigDecimal!
  totalJuryFeesEarned: BigDecimal!
  
  # Pending Withdrawals
  pendingWithdrawals: BigDecimal!
  pendingCreatorFees: BigDecimal!
  totalWithdrawn: BigDecimal!
  
  # Relations
  positions: [Position!]! @derivedFrom(field: "user")
  trades: [Trade!]! @derivedFrom(field: "trader")
}
```

#### **Step 5: `subgraph.yaml`**

```yaml
specVersion: 1.0.0
schema:
  file: ./schema.graphql
dataSources:
  - kind: ethereum
    name: PredictionMarket
    network: bsc  # or chapel for testnet
    source:
      abi: PredictionMarket
      address: "0xA482Ac7acbf846F2DAEE8b8dF3D7e77F85CC7528"
      startBlock: 79457714
    mapping:
      kind: ethereum/events
      apiVersion: 0.0.7
      language: wasm/assemblyscript
      entities:
        - Market
        - Trade
        - User
        - Position
        # ... all entities
      abis:
        - name: PredictionMarket
          file: ./abis/PredictionMarket.json
      eventHandlers:
        - event: MarketCreated(indexed uint256,indexed address,string,uint256,uint8,uint256)
          handler: handleMarketCreated
        - event: Trade(indexed uint256,indexed address,bool,bool,uint256,uint256)
          handler: handleTrade
        # ... all event handlers
      file: ./src/mapping.ts
```

#### **Step 6: Run Codegen**

```bash
npm run codegen
# This generates ./generated/ folder with TypeScript types
```

#### **Step 7: `src/mapping.ts`**

Write event handlers in this order:

| Order | Handler | Purpose | Creates/Updates |
|-------|---------|---------|-----------------|
| 1 | Helper: `getOrCreateUser()` | User entity factory | User |
| 2 | Helper: `getOrCreatePosition()` | Position entity factory | Position |
| 3 | Helper: `getOrCreateGlobalStats()` | Stats singleton | GlobalStats |
| 4 | `handleMarketCreated` | New market | Market, User |
| 5 | `handleTrade` | Buy/sell | Trade, Market, Position, User |
| 6 | `handleOutcomeProposed` | Proposal | Market |
| 7 | `handleProposalDisputed` | Dispute | Market |
| 8 | `handleVoteCast` | Voting | Vote, Market, Position |
| 9 | `handleMarketResolved` | Resolution | Market, Position (losers) |
| 10 | `handleClaimed` | Payouts | Claim, Position, User |
| 11 | `handleEmergencyRefunded` | Refunds | EmergencyRefund, Position |
| 12 | `handleTieFinalized` | Tie cleanup | Market |
| 13 | `handleBondDistributed` | Bond earnings | User |
| 14 | `handleProposerRewardPaid` | Proposer rewards | ProposerReward, User |
| 15 | `handleJuryFeesPoolCreated` | Jury pools | JuryFeesPool |
| 16 | `handleJuryFeesClaimed` | Jury claims | JuryFeesClaim, Position, User |
| 17 | `handleWithdrawalCredited` | Pull credits | WithdrawalCredit, User |
| 18 | `handleWithdrawalClaimed` | Pull claims | WithdrawalClaim, User |
| 19 | `handleCreatorFeesCredited` | Creator credits | CreatorFeeCredit, User |
| 20 | `handleCreatorFeesClaimed` | Creator claims | CreatorFeeClaim, User |
| 21 | `handleMarketResolutionFailed` | Failed resolution | MarketResolutionFailure |

### 2.3 Deployment

```bash
# Authenticate
graph auth --studio <DEPLOY_KEY>

# Deploy to testnet
npm run deploy:testnet

# Deploy to mainnet
npm run deploy:mainnet
```

---

## Phase 3: Frontend Application

> **The frontend is a React SPA that connects to wallets, queries the subgraph, and interacts with the smart contract.**

### 3.1 File Creation Order - Configuration Layer

| Order | File | Purpose | Dependencies |
|-------|------|---------|--------------|
| 1 | `package.json` | Dependencies | None |
| 2 | `vite.config.ts` | Build config | None |
| 3 | `tsconfig.json` | TypeScript | None |
| 4 | `tailwind.config.js` | Styling | None |
| 5 | `postcss.config.cjs` | PostCSS | tailwind |
| 6 | `vercel.json` | Deployment | None |
| 7 | `index.html` | HTML entry | None |
| 8 | `.env.example` | Environment vars | None |

### 3.2 File Creation Order - Core Setup

| Order | File | Purpose | Dependencies |
|-------|------|---------|--------------|
| 9 | `src/index.css` | Global styles + Tailwind | tailwind.config |
| 10 | `src/shared/config/env.ts` | Environment config | None |
| 11 | `src/shared/config/contracts.ts` | Contract address & ABI | env.ts |
| 12 | `src/shared/config/wagmi.ts` | Web3 config | env.ts |
| 13 | `src/shared/config/graphql.ts` | Apollo client | env.ts |
| 14 | `src/shared/config/sentry.ts` | Error tracking | env.ts |
| 15 | `src/lib/supabase.ts` | Supabase client | env.ts |

### 3.3 File Creation Order - Utilities & Types

| Order | File | Purpose | Dependencies |
|-------|------|---------|--------------|
| 16 | `src/shared/utils/cn.ts` | Classname helper | None |
| 17 | `src/shared/utils/format.ts` | BNB/shares formatters | None |
| 18 | `src/shared/types/index.ts` | TypeScript types | None |
| 19 | `src/shared/schemas/market.ts` | Zod market schema | None |
| 20 | `src/shared/schemas/index.ts` | Schema exports | schemas |
| 21 | `src/lib/database.types.ts` | Supabase types | None |

### 3.4 File Creation Order - UI Components (Shared)

Create these in order (simpler → complex):

| Order | File | Purpose | Dependencies |
|-------|------|---------|--------------|
| 22 | `src/shared/components/ui/Button.tsx` | Button component | cn.ts |
| 23 | `src/shared/components/ui/Input.tsx` | Input component | cn.ts |
| 24 | `src/shared/components/ui/Card.tsx` | Card container | cn.ts |
| 25 | `src/shared/components/ui/Badge.tsx` | Status badges | cn.ts |
| 26 | `src/shared/components/ui/Modal.tsx` | Modal dialog | cn.ts |
| 27 | `src/shared/components/ui/Spinner.tsx` | Loading states | cn.ts |
| 28 | `src/shared/components/ui/Toast.tsx` | Notifications | cn.ts |
| 29 | `src/shared/components/ui/ChanceDisplay.tsx` | Percentage display | cn.ts |
| 30 | `src/shared/components/ui/HeatBar.tsx` | Market heat level | cn.ts |
| 31 | `src/shared/components/ui/HeatLevelBadge.tsx` | Heat badge | cn.ts |
| 32 | `src/shared/components/ui/Jazzicon.tsx` | Address avatars | cn.ts |
| 33 | `src/shared/components/ui/index.ts` | Barrel exports | All UI components |
| 34 | `src/shared/components/SlippageSettings.tsx` | Slippage UI | ui components |
| 35 | `src/shared/components/WrongNetworkModal.tsx` | Network warning | Modal |
| 36 | `src/shared/components/ErrorBoundary.tsx` | Error handling | None |
| 37 | `src/shared/components/index.ts` | Exports | All components |

### 3.5 File Creation Order - Hooks (Contract Interaction)

| Order | File | Purpose | Dependencies |
|-------|------|---------|--------------|
| 38 | `src/shared/hooks/useChainValidation.ts` | Network check | wagmi |
| 39 | `src/shared/hooks/useContractReads.ts` | Read hooks | wagmi, contracts.ts |
| 40 | `src/shared/hooks/useContractWrites.ts` | Write hooks | wagmi, contracts.ts |
| 41 | `src/shared/hooks/useSmartPolling.ts` | Polling logic | None |
| 42 | `src/shared/hooks/useOptimisticTrade.ts` | Optimistic UI | react-query |
| 43 | `src/shared/hooks/useTradeWithOptimism.ts` | Trade + optimistic | useContractWrites, useOptimisticTrade |
| 44 | `src/shared/hooks/useSmartClaim.ts` | Claim logic | useContractWrites |
| 45 | `src/shared/hooks/useSIWE.ts` | Sign-In Ethereum | wagmi |
| 46 | `src/shared/hooks/useSEO.ts` | Meta tags | None |
| 47 | `src/shared/hooks/useSentryUser.ts` | Error context | wagmi, sentry |
| 48 | `src/shared/hooks/index.ts` | Exports | All hooks |

### 3.6 File Creation Order - GraphQL API

| Order | File | Purpose | Dependencies |
|-------|------|---------|--------------|
| 49 | `src/shared/api/queries/markets.ts` | Market queries | graphql.ts |
| 50 | `src/shared/api/queries/trades.ts` | Trade queries | graphql.ts |
| 51 | `src/shared/api/queries/users.ts` | User queries | graphql.ts |
| 52 | `src/shared/api/queries/positions.ts` | Position queries | graphql.ts |
| 53 | `src/shared/api/queries/stats.ts` | Global stats | graphql.ts |
| 54 | `src/shared/api/index.ts` | Query exports | All queries |

### 3.7 File Creation Order - Feature Modules

Each feature follows this internal order:
1. **api/** - API/query functions
2. **hooks/** - Feature-specific hooks
3. **components/** - UI components
4. **pages/** - Page components
5. **types/** - Feature types
6. **index.ts** - Barrel exports

#### **Feature: Markets (Core)**

| Order | File | Purpose | Dependencies |
|-------|------|---------|--------------|
| 55 | `features/markets/api/markets.api.ts` | Market API helpers | shared/api |
| 56 | `features/markets/hooks/useMarkets.ts` | Market list hook | api, useSmartPolling |
| 57 | `features/markets/hooks/useMarket.ts` | Single market hook | api |
| 58 | `features/markets/components/MarketCard.tsx` | Market card | ui components, format |
| 59 | `features/markets/components/PriceChart.tsx` | Price chart | None |
| 60 | `features/markets/components/TradeHistory.tsx` | Trade list | format |
| 61 | `features/markets/components/LiveTicker.tsx` | Live updates | format |
| 62 | `features/markets/components/TradePanel.tsx` | Buy/sell UI | useContractWrites, hooks |
| 63 | `features/markets/components/ResolutionPanel.tsx` | Resolution UI | useContractWrites, hooks |
| 64 | `features/markets/components/index.ts` | Exports | All components |
| 65 | `features/markets/pages/MarketsPage.tsx` | Markets list | components, hooks |
| 66 | `features/markets/pages/MarketDetailPage.tsx` | Market detail | all components |
| 67 | `features/markets/pages/index.ts` | Page exports | Pages |

#### **Feature: Create Market**

| Order | File | Purpose | Dependencies |
|-------|------|---------|--------------|
| 68 | `features/create/components/CreateMarketForm.tsx` | Form UI | useContractWrites |
| 69 | `features/create/pages/CreateMarketPage.tsx` | Create page | form component |
| 70 | `features/create/index.ts` | Exports | All |

#### **Feature: Portfolio**

| Order | File | Purpose | Dependencies |
|-------|------|---------|--------------|
| 71 | `features/portfolio/api/portfolio.api.ts` | Position queries | shared/api |
| 72 | `features/portfolio/hooks/usePortfolio.ts` | Portfolio hook | api |
| 73 | `features/portfolio/components/PositionCard.tsx` | Position UI | format, useContractWrites |
| 74 | `features/portfolio/pages/PortfolioPage.tsx` | Portfolio page | components, hooks |
| 75 | `features/portfolio/index.ts` | Exports | All |

#### **Feature: Chat (Supabase)**

| Order | File | Purpose | Dependencies |
|-------|------|---------|--------------|
| 76 | `features/chat/api/chat.api.ts` | Supabase chat API | supabase.ts |
| 77 | `features/chat/api/moderation.api.ts` | Moderation API | supabase.ts |
| 78 | `features/chat/hooks/useChat.ts` | Chat hook | api, useSIWE |
| 79 | `features/chat/components/ChatMessage.tsx` | Message UI | format |
| 80 | `features/chat/components/ChatInput.tsx` | Input + auth | useSIWE |
| 81 | `features/chat/components/ChatTab.tsx` | Chat container | useChat |
| 82 | `features/chat/components/ModerationModal.tsx` | Admin UI | api |
| 83 | `features/chat/index.ts` | Exports | All |

#### **Feature: Leaderboard**

| Order | File | Purpose | Dependencies |
|-------|------|---------|--------------|
| 84 | `features/leaderboard/api/leaderboard.api.ts` | User rankings | shared/api |
| 85 | `features/leaderboard/pages/LeaderboardPage.tsx` | Rankings page | api |
| 86 | `features/leaderboard/index.ts` | Exports | All |

#### **Feature: Legal**

| Order | File | Purpose | Dependencies |
|-------|------|---------|--------------|
| 87 | `features/legal/pages/TermsPage.tsx` | Terms of service | None |
| 88 | `features/legal/pages/PrivacyPage.tsx` | Privacy policy | None |
| 89 | `features/legal/pages/HowToPlayPage.tsx` | User guide | None |
| 90 | `features/legal/index.ts` | Exports | All |

#### **Feature: Maintenance**

| Order | File | Purpose | Dependencies |
|-------|------|---------|--------------|
| 91 | `features/maintenance/MaintenancePage.tsx` | Maintenance mode | env.ts |

### 3.8 File Creation Order - App Assembly

| Order | File | Purpose | Dependencies |
|-------|------|---------|--------------|
| 92 | `src/providers/Web3Provider.tsx` | Web3 context | wagmi, rainbowkit |
| 93 | `src/providers/QueryProvider.tsx` | React Query | react-query |
| 94 | `src/providers/GraphQLProvider.tsx` | Apollo Client | graphql.ts |
| 95 | `src/providers/index.ts` | Provider exports | All providers |
| 96 | `src/router/Header.tsx` | Navigation bar | wagmi, rainbowkit |
| 97 | `src/router/RootLayout.tsx` | Layout wrapper | Header, providers |
| 98 | `src/router/routes.tsx` | Route config | All page components |
| 99 | `src/router/index.ts` | Router export | routes.tsx |
| 100 | `src/App.tsx` | Root component | providers, router |
| 101 | `src/main.tsx` | Entry point | sentry, App |

---

## Phase 4: Supabase Backend

> **Supabase provides real-time chat and admin moderation via Edge Functions.**

### 4.1 Database Setup (Supabase Dashboard)

Create tables in this order:

| Order | Table | Purpose | Dependencies |
|-------|-------|---------|--------------|
| 1 | `chat_messages` | Store messages | None |
| 2 | `chat_rate_limits` | Rate limiting | None |
| 3 | `moderated_markets` | Hidden content | None |

**SQL for `chat_messages`:**

```sql
CREATE TABLE chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  market_id TEXT NOT NULL,
  contract_address TEXT NOT NULL,
  network TEXT NOT NULL,
  sender_address TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_chat_messages_market ON chat_messages(market_id, contract_address, network);
CREATE INDEX idx_chat_messages_created ON chat_messages(created_at);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
```

**SQL for `chat_rate_limits`:**

```sql
CREATE TABLE chat_rate_limits (
  wallet_address TEXT PRIMARY KEY,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_content TEXT
);
```

**SQL for `moderated_markets`:**

```sql
CREATE TABLE moderated_markets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  market_id TEXT NOT NULL,
  contract_address TEXT NOT NULL,
  network TEXT NOT NULL,
  hidden_fields TEXT[] NOT NULL,
  reason TEXT,
  moderated_by TEXT NOT NULL,
  moderated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(contract_address, network, market_id)
);
```

### 4.2 Edge Functions - File Creation Order

| Order | File | Purpose | Dependencies |
|-------|------|---------|--------------|
| 1 | `functions/_shared/cors.ts` | CORS headers | None |
| 2 | `functions/_shared/supabase.ts` | Supabase clients | None |
| 3 | `functions/_shared/siwe.ts` | SIWE verification | viem |
| 4 | `functions/_shared/validation.ts` | Message validation | None |
| 5 | `functions/send-message/index.ts` | Send chat message | _shared/* |
| 6 | `functions/delete-message/index.ts` | Delete message (admin) | _shared/* |
| 7 | `functions/moderate-market/index.ts` | Content moderation | _shared/* |

### 4.3 Shared Module Details

**`_shared/cors.ts`:**
- Dynamic CORS based on request origin
- Allowed: jnglz.fun, localhost

**`_shared/siwe.ts`:**
- `parseSIWEMessage()` - Parse SIWE string
- `verifySIWE()` - Verify signature with viem
- `createSIWEMessage()` - Generate message for signing

**`_shared/validation.ts`:**
- `sanitizeMessage()` - XSS protection
- `containsUrl()` - Link detection
- `containsProfanity()` - Profanity filter
- `hasEnoughShares()` - Holder verification
- `processMessage()` - Combined validation

### 4.4 Deployment

```bash
cd frontend

# Link to Supabase project
supabase link --project-ref <PROJECT_REF>

# Set secrets
supabase secrets set ADMIN_ADDRESSES="0x...,0x...,0x..."
supabase secrets set VITE_TESTNET_SUBGRAPH_URL="..."
supabase secrets set VITE_MAINNET_SUBGRAPH_URL="..."

# Deploy functions
supabase functions deploy send-message --no-verify-jwt
supabase functions deploy delete-message --no-verify-jwt
supabase functions deploy moderate-market --no-verify-jwt
```

---

## Dependency Diagrams

### Overall Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           BUILD ORDER                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  1. SMART CONTRACT                                                      │
│     └── PredictionMarket.sol                                           │
│              │                                                          │
│              ├── Exports ABI ──────────────────┐                       │
│              │                                 │                        │
│              ▼                                 ▼                        │
│  2. SUBGRAPH                          3. FRONTEND                       │
│     ├── schema.graphql                   ├── shared/config/             │
│     ├── subgraph.yaml                    │   ├── env.ts                 │
│     └── mapping.ts                       │   ├── contracts.ts ◄── ABI  │
│              │                           │   ├── wagmi.ts               │
│              │                           │   └── graphql.ts             │
│              │                           │                              │
│              └── Provides GraphQL API ───┤                              │
│                                          │                              │
│                                          ├── shared/hooks/              │
│                                          │   ├── useContractReads.ts    │
│                                          │   └── useContractWrites.ts   │
│                                          │                              │
│                                          └── features/                  │
│                                              ├── markets/               │
│                                              ├── portfolio/             │
│                                              ├── create/                │
│                                              └── chat/ ◄─────┐         │
│                                                              │          │
│  4. SUPABASE                                                 │          │
│     ├── Database tables                                      │          │
│     └── Edge Functions ──────────────────────────────────────┘          │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Frontend Internal Dependencies

```
src/
│
├── shared/config/
│   ├── env.ts ◄────────────────── FOUNDATION (read first)
│   ├── contracts.ts ◄───── depends on env.ts
│   ├── wagmi.ts ◄─────────── depends on env.ts
│   ├── graphql.ts ◄────── depends on env.ts
│   └── sentry.ts ◄────── depends on env.ts
│
├── shared/utils/
│   ├── cn.ts ◄─────────────── NO dependencies
│   └── format.ts ◄───────── NO dependencies
│
├── shared/hooks/
│   ├── useChainValidation.ts ◄── depends on wagmi
│   ├── useContractReads.ts ◄──── depends on contracts.ts, wagmi
│   ├── useContractWrites.ts ◄─── depends on contracts.ts, wagmi
│   └── useSIWE.ts ◄───────────── depends on wagmi
│
├── shared/components/
│   └── ui/ ◄────────────────── depends on cn.ts
│
├── features/
│   ├── markets/ ◄─────────── depends on shared/hooks, shared/components
│   ├── portfolio/ ◄────────── depends on shared/hooks, shared/components
│   ├── create/ ◄──────────── depends on shared/hooks
│   └── chat/ ◄────────────── depends on supabase.ts, useSIWE
│
├── providers/ ◄─────────────── depends on config/*
│
├── router/ ◄────────────────── depends on features/*, providers/*
│
└── App.tsx ◄─────────────────── depends on router, providers
```

### Subgraph Internal Dependencies

```
subgraph/
│
├── package.json ◄────────────── FOUNDATION
│
├── networks.json ◄────────────── Contract addresses (from deployment)
│
├── abis/
│   └── PredictionMarket.json ◄── From `forge build` (contracts/)
│
├── schema.graphql ◄───────────── Entity definitions (no dependencies)
│
├── subgraph.yaml ◄────────────── depends on schema.graphql, abis/*
│                                 (defines event handlers)
│
└── src/
    └── mapping.ts ◄───────────── depends on schema.graphql (codegen)
                                  (implements event handlers)

Build order:
1. npm install
2. Copy ABI from contracts/
3. Write schema.graphql
4. Write subgraph.yaml
5. npm run codegen (generates types)
6. Write mapping.ts
7. npm run build
8. graph deploy
```

---

## Quick Start for Reviewers

### Understanding the Codebase

**If reviewing for the first time:**

1. **Start with PROJECT.md** → Understand what the app does
2. **Read contracts/README.md** → Understand the business logic
3. **Read subgraph/schema.graphql** → Understand the data model
4. **Read frontend/src/shared/config/env.ts** → Understand configuration
5. **Read frontend/src/shared/hooks/useContractWrites.ts** → Understand contract interaction
6. **Read frontend/src/features/markets/components/TradePanel.tsx** → Understand trading UI

**If studying the data flow:**

```
User clicks BUY
        │
        ▼
TradePanel.tsx
        │ calls
        ▼
useContractWrites.ts → useBuyYes()
        │ calls
        ▼
Wagmi → writeContract()
        │ sends tx to
        ▼
PredictionMarket.sol → buyYes()
        │ emits
        ▼
Trade event
        │ indexed by
        ▼
mapping.ts → handleTrade()
        │ updates
        ▼
GraphQL entities (Market, Trade, Position, User)
        │ queried by
        ▼
Apollo Client → GET_MARKET query
        │ returns to
        ▼
MarketDetailPage.tsx → displays updated data
```

### File Reading Order for Deep Understanding

| Priority | Area | Files to Read |
|----------|------|---------------|
| 1 | Contract | `contracts/src/PredictionMarket.sol` |
| 2 | Indexing | `subgraph/schema.graphql`, `subgraph/src/mapping.ts` |
| 3 | Config | `frontend/src/shared/config/env.ts`, `contracts.ts`, `wagmi.ts` |
| 4 | Hooks | `frontend/src/shared/hooks/useContractReads.ts`, `useContractWrites.ts` |
| 5 | Trading | `frontend/src/features/markets/components/TradePanel.tsx` |
| 6 | Resolution | `frontend/src/features/markets/components/ResolutionPanel.tsx` |
| 7 | Chat | `frontend/supabase/functions/send-message/index.ts` |

---

## Key Concepts Reference

| Concept | Location | Description |
|---------|----------|-------------|
| Bonding Curve | `PredictionMarket.sol` | Price = f(supply) |
| Heat Levels | Contract, Create page | Volatility tiers (CRACK/HIGH/PRO/APEX/CORE) |
| Street Consensus | Contract, ResolutionPanel | Bettors vote on outcomes |
| Pull Pattern | Contract, Portfolio | Claim bonds/fees individually |
| P/L Tracking | `mapping.ts`, `User` entity | Trading + Resolution P/L |
| SIWE Auth | `useSIWE.ts`, Edge Functions | Wallet-based authentication |
| Smart Polling | `useSmartPolling.ts` | Temperature-based intervals |
| Optimistic UI | `useOptimisticTrade.ts` | Instant feedback |

---

## Deployment Checklist

### Smart Contract
- [ ] Deploy to testnet first
- [ ] Run all tests
- [ ] Verify on BscScan
- [ ] Export ABI to subgraph + frontend

### Subgraph
- [ ] Update `networks.json` with contract address
- [ ] Run `npm run codegen`
- [ ] Run `npm run build`
- [ ] Deploy to The Graph Studio
- [ ] Verify indexing works

### Frontend
- [ ] Update `.env` with contract address + subgraph URL
- [ ] Run `npm run build` locally
- [ ] Deploy to Vercel
- [ ] Test all flows

### Supabase
- [ ] Create database tables
- [ ] Set secrets (ADMIN_ADDRESSES, subgraph URLs)
- [ ] Deploy Edge Functions
- [ ] Test chat functionality

---

## Resources

- **Smart Contracts:** `/contracts/README.md`, `/contracts/GOVERNANCE.md`
- **Subgraph:** `/subgraph/README.md`, `/subgraph/RUNBOOK.md`
- **Frontend:** `/frontend/PROJECT_CONTEXT.md`, `/frontend/CHANGELOG.md`
- **Supabase:** `/frontend/supabase/PROJECT_CONTEXT_SUPABASE.md`
- **Deployment:** `/TODO.md` (Mainnet deployment checklist)

---

*Last Updated: February 5, 2026*
