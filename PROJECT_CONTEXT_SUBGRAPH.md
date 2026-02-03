# 📋 JNGLZ.FUN - Subgraph Project Context

> Quick reference for AI assistants and developers.  
> **Last Updated:** February 4, 2026  
> **Status:** ✅ Deployed (jnglz-testnet-fresh v5.2.0 - TieFinalized Event Handler)

---

## 🎯 Subgraph Overview

The subgraph indexes all on-chain events from the **PredictionMarket** contract and provides a GraphQL API for the frontend. This **replaces a traditional backend** - no Express/MongoDB needed.

### GraphQL Endpoint (Production Gateway)
```
https://gateway.thegraph.com/api/subgraphs/id/3XxbwnAdLjsRWR3DeKJFbjjnahwMuDiG5H5qMuriDGcC
```

### GraphQL Endpoint (Studio - Development)
```
https://api.studio.thegraph.com/query/1722665/jnglz-testnet-fresh/v5.2.0
```

### API Key
- **Key:** `bd58484c1566274066b1453e52043443`
- **Whitelisted Domains:** `localhost`, `jnglz.fun`
- **Rate Limit:** 100,000 queries/month

### Contract Details (Testnet)
- **Address:** `0xC97FB434B79e6c643e0320fa802B515CedBA95Bf`
- **Version:** v3.8.3 (TieFinalized event for subgraph sync)
- **Network:** BNB Testnet (Chapel, Chain ID: 97)
- **Start Block:** 86465841
- **BscScan:** https://testnet.bscscan.com/address/0xC97FB434B79e6c643e0320fa802B515CedBA95Bf

### Mainnet (Pending)
- **Address:** TBD (deploy after testnet validation)
- **Network:** BNB Mainnet (Chain ID: 56)
- **Start Block:** TBD

---

## 📊 Current Status

| Component | Progress | Notes |
|-----------|----------|-------|
| Schema Definition | ✅ 100% | v5.1.0 - Includes positionIds for loser P/L tracking |
| Subgraph Config | ✅ 100% | v5.2.0 - TieFinalized handler added |
| Mappings | ✅ 100% | All event handlers including TieFinalized |
| Codegen | ✅ 100% | Types generated |
| Build | ✅ 100% | Compiles successfully |
| Testnet Deployment | ✅ 100% | v5.2.0 - Contract v3.8.3 |
| Gateway Published | ✅ 100% | Live on decentralized network |
| Mainnet Subgraph | ⬜ 0% | After testnet validation |
| Mainnet Deployment | ⬜ 0% | After mainnet contract deploy |

**Overall Progress: 100%** ✅

---

## ⚠️ Important: Subgraph Sync Issues (Resolved)

### The Problem (Jan 25, 2026)
Multiple deployments to `jnglz-bnb-testnet` showed persistent 300-800 block sync lag.

### Root Cause
**NOT code-related.** Stale state on Graph Studio from many failed deployments.

### Solution
Created a **completely new subgraph** `jnglz-testnet-fresh` - synced instantly.

### Lesson Learned
When experiencing persistent sync issues on Graph Studio:
1. Don't keep redeploying to the same subgraph
2. Create a fresh subgraph with a new name
3. Delete/unpublish the old problematic subgraph

> 📚 **See:** [`SUBGRAPH_DEPLOYMENT_RULES.md`](./SUBGRAPH_DEPLOYMENT_RULES.md) for comprehensive deployment guidelines to avoid these issues on mainnet.

---

## 📐 Schema Design

### Market Entity
```graphql
type Market @entity {
  id: ID!                          # marketId as string
  marketId: BigInt!                # On-chain market ID
  question: String!                # The prediction question
  evidenceLink: String!            # Source of truth URL
  resolutionRules: String!         # How to resolve
  imageUrl: String!                # Market thumbnail image URL
  creator: Bytes!                  # Creator address
  expiryTimestamp: BigInt!         # When trading stops
  createdAt: BigInt!               # Block timestamp
  createdAtBlock: BigInt!          # Block number
  
  # Bonding curve state
  yesSupply: BigInt!               # Total YES shares
  noSupply: BigInt!                # Total NO shares
  
  # Volume tracking
  totalVolume: BigDecimal!         # Total BNB traded
  totalTrades: BigInt!             # Number of trades
  
  # Resolution state
  resolved: Boolean!               # Is market resolved?
  outcome: Boolean                 # null if not resolved, true=YES, false=NO
  assertionId: Bytes               # UMA assertion ID (if asserted)
  asserter: Bytes                  # Who asserted the outcome
  
  # Relations
  trades: [Trade!]! @derivedFrom(field: "market")
  positions: [Position!]! @derivedFrom(field: "market")
}
```

### Trade Entity
```graphql
type Trade @entity {
  id: ID!                          # txHash-logIndex
  market: Market!                  # Related market
  trader: Bytes!                   # Trader address
  isYes: Boolean!                  # YES or NO side
  isBuy: Boolean!                  # Buy or Sell
  shares: BigInt!                  # Shares traded
  bnbAmount: BigDecimal!           # BNB amount
  timestamp: BigInt!               # Block timestamp
  txHash: Bytes!                   # Transaction hash
  blockNumber: BigInt!             # Block number
}
```

### User Entity
```graphql
type User @entity {
  id: ID!                          # User address as string
  address: Bytes!                  # User address
  totalTrades: BigInt!             # Total number of trades
  totalVolume: BigDecimal!         # Total BNB volume
  marketsCreated: BigInt!          # Markets created by user
  positions: [Position!]! @derivedFrom(field: "user")
}
```

### Position Entity
```graphql
type Position @entity {
  id: ID!                          # `${marketId}-${userAddress}`
  user: User!                      # Related user
  market: Market!                  # Related market
  yesShares: BigInt!               # YES shares held
  noShares: BigInt!                # NO shares held
  totalInvested: BigDecimal!       # Total BNB invested
  claimed: Boolean!                # Has user claimed?
  claimedAmount: BigDecimal        # Amount claimed (if claimed)
}
```

### Global Stats Entity (Optional)
```graphql
type GlobalStats @entity {
  id: ID!                          # "global"
  totalMarkets: BigInt!
  totalVolume: BigDecimal!
  totalTrades: BigInt!
  totalUsers: BigInt!
}
```

---

## 📁 File Structure

```
subgraph/
├── schema.graphql          # Entity definitions
├── subgraph.yaml           # Data source config
├── package.json            # Dependencies
├── tsconfig.json           # TypeScript config
├── src/
│   ├── mapping.ts          # Event handlers
│   └── utils.ts            # Helper functions
├── abis/
│   └── PredictionMarket.json  # Contract ABI
├── generated/              # Auto-generated (graph codegen)
│   ├── schema.ts
│   └── PredictionMarket/
├── build/                  # Build output (graph build)
├── README.md
├── PROJECT_CONTEXT.md
├── CHANGELOG.md
├── TO-DO-SUBGRAPH.md
└── RUNBOOK.md
```

---

## 🔧 Event Handlers

### handleMarketCreated
```typescript
export function handleMarketCreated(event: MarketCreated): void {
  // 1. Create new Market entity
  // 2. Create/update User entity (creator)
  // 3. Update GlobalStats
}
```

### handleTrade
```typescript
export function handleTrade(event: Trade): void {
  // 1. Create new Trade entity
  // 2. Update Market (supplies, volume, trades count)
  // 3. Create/update User entity
  // 4. Create/update Position entity
  // 5. Update GlobalStats
}
```

### handleOutcomeAsserted
```typescript
export function handleOutcomeAsserted(event: OutcomeAsserted): void {
  // 1. Update Market (assertionId, asserter, pending outcome)
}
```

### handleMarketResolved
```typescript
export function handleMarketResolved(event: MarketResolved): void {
  // 1. Update Market (resolved=true, outcome)
}
```

### handleClaimed
```typescript
export function handleClaimed(event: Claimed): void {
  // 1. Update Position (claimed=true, claimedAmount)
}
```

---

## 📊 Example Queries

### Get All Active Markets
```graphql
query GetActiveMarkets($first: Int!, $skip: Int!) {
  markets(
    first: $first
    skip: $skip
    where: { resolved: false, expiryTimestamp_gt: $now }
    orderBy: totalVolume
    orderDirection: desc
  ) {
    id
    marketId
    question
    expiryTimestamp
    yesSupply
    noSupply
    totalVolume
    totalTrades
  }
}
```

### Get Single Market with Trades
```graphql
query GetMarket($id: ID!) {
  market(id: $id) {
    id
    marketId
    question
    evidenceLink
    resolutionRules
    creator
    expiryTimestamp
    yesSupply
    noSupply
    totalVolume
    resolved
    outcome
    trades(first: 20, orderBy: timestamp, orderDirection: desc) {
      id
      trader
      isYes
      isBuy
      shares
      bnbAmount
      timestamp
    }
  }
}
```

### Get User Positions
```graphql
query GetUserPositions($user: Bytes!) {
  positions(where: { user: $user }) {
    id
    market {
      id
      marketId
      question
      resolved
      outcome
    }
    yesShares
    noShares
    claimed
    claimedAmount
  }
}
```

### Get Leaderboard (Top Traders)
```graphql
query GetLeaderboard($first: Int!) {
  users(first: $first, orderBy: totalVolume, orderDirection: desc) {
    id
    address
    totalTrades
    totalVolume
  }
}
```

---

## 🌐 Deployment

### Subgraph Studio URLs
- Dashboard: https://thegraph.com/studio
- BSC Testnet: TBD after deployment
- BSC Mainnet: TBD after deployment

### Deployment Steps
1. Create subgraph on Subgraph Studio
2. Get deploy key
3. Run deployment commands (see RUNBOOK.md)

---

## 📝 Configuration (subgraph.yaml)

```yaml
specVersion: 0.0.5
schema:
  file: ./schema.graphql
dataSources:
  - kind: ethereum
    name: PredictionMarket
    network: bsc  # or bsc-testnet
    source:
      address: "0x..."  # Contract address
      abi: PredictionMarket
      startBlock: 12345678  # Deploy block
    mapping:
      kind: ethereum/events
      apiVersion: 0.0.7
      language: wasm/assemblyscript
      entities:
        - Market
        - Trade
        - User
        - Position
      abis:
        - name: PredictionMarket
          file: ./abis/PredictionMarket.json
      eventHandlers:
        - event: MarketCreated(indexed uint256,indexed address,string,uint256)
          handler: handleMarketCreated
        - event: Trade(indexed uint256,indexed address,bool,bool,uint256,uint256)
          handler: handleTrade
        - event: OutcomeAsserted(indexed uint256,indexed address,bool,bytes32)
          handler: handleOutcomeAsserted
        - event: MarketResolved(indexed uint256,bool)
          handler: handleMarketResolved
        - event: Claimed(indexed uint256,indexed address,uint256)
          handler: handleClaimed
      file: ./src/mapping.ts
```

---

## 📚 Resources

- [The Graph Documentation](https://thegraph.com/docs/)
- [Subgraph Studio](https://thegraph.com/studio/)
- [AssemblyScript API](https://thegraph.com/docs/en/developing/assemblyscript-api/)
- [BNB Chain on The Graph](https://thegraph.com/docs/en/developing/supported-networks/)
