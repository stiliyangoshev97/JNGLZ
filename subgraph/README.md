# JNGLZ.FUN Subgraph

Indexes the PredictionMarket contract on BNB Chain and provides a GraphQL API for the frontend.

## 📊 Quick Stats

| Metric | Value |
|--------|-------|
| Status | ✅ Deployed (jnglz-testnet-fresh v3.0.0) |
| Network | BNB Testnet (Chapel) |
| Contract | `0x0A5E9e7dC7e78aE1dD0bB93891Ce9E8345779A30` |
| Start Block | 86129412 |
| Entities | 11 (Market, Trade, User, Position, Vote, Claim, EmergencyRefund, GlobalStats, JuryFeesPool, JuryFeesClaim, MarketResolutionFailure) |

## 🔗 GraphQL Endpoint

**Gateway (Production):**
```
https://gateway.thegraph.com/api/subgraphs/id/3XxbwnAdLjsRWR3DeKJFbjjnahwMuDiG5H5qMuriDGcC
```

**Studio:**
```
https://api.studio.thegraph.com/query/1722665/jnglz-testnet-fresh/v3.0.0
```

**Studio Dashboard:** https://thegraph.com/studio/subgraph/jnglz-testnet-fresh

## 🚀 Setup

### Prerequisites
- Node.js 18+
- npm or yarn
- Graph CLI: `npm install -g @graphprotocol/graph-cli`

### Installation

```bash
cd subgraph
npm install
```

### Generate Types

```bash
npm run codegen
```

### Build

```bash
npm run build
```

## 📡 Deployment

### 1. Create Subgraph on The Graph Studio

1. Go to https://thegraph.com/studio/
2. Connect your wallet
3. Click "Create a Subgraph"
4. Name it: `jnglz-testnet-fresh`
5. Select network: `BNB Smart Chain Testnet (Chapel)`

### 2. Authenticate

```bash
graph auth --studio <YOUR_DEPLOY_KEY>
```

### 3. Deploy

```bash
npm run deploy
```

## 🔍 Example Queries

### Get Active Markets

```graphql
query GetActiveMarkets {
  markets(
    first: 20
    where: { resolved: false }
    orderBy: totalVolume
    orderDirection: desc
  ) {
    id
    marketId
    question
    expiryTimestamp
    totalVolume
    totalTrades
    yesShares
    noShares
    status
  }
}
```

### Get Market Details

```graphql
query GetMarket($id: ID!) {
  market(id: $id) {
    id
    question
    evidenceLink
    creator {
      id
      address
    }
    expiryTimestamp
    totalVolume
    status
    resolved
    outcome
    proposer
    proposedOutcome
    proposerVoteWeight
    disputerVoteWeight
    trades(first: 50, orderBy: timestamp, orderDirection: desc) {
      id
      traderAddress
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
query GetUserPositions($user: String!) {
  positions(where: { user: $user }) {
    id
    market {
      id
      question
      status
      resolved
      outcome
    }
    yesShares
    noShares
    totalInvested
    claimed
    claimedAmount
  }
}
```

### Get Leaderboard

```graphql
query GetLeaderboard {
  users(first: 100, orderBy: totalVolume, orderDirection: desc) {
    id
    address
    totalTrades
    totalVolume
    totalClaimed
    marketsCreated
  }
}
```

### Get Global Stats

```graphql
query GetGlobalStats {
  globalStats(id: "global") {
    totalMarkets
    activeMarkets
    resolvedMarkets
    totalVolume
    totalTrades
    totalUsers
    totalClaimed
    disputedMarkets
  }
}
```

## 📁 Project Structure

```
subgraph/
├── schema.graphql      # Entity definitions
├── subgraph.yaml       # Subgraph configuration
├── package.json        # Dependencies
├── tsconfig.json       # TypeScript config
├── src/
│   └── mapping.ts      # Event handlers
├── abis/
│   └── PredictionMarket.json  # Contract ABI
├── generated/          # Auto-generated (after codegen)
└── build/              # Build output
```

## 🔧 Entities

| Entity | Description |
|--------|-------------|
| **Market** | Prediction market data, resolution status, voting results |
| **Trade** | Individual buy/sell transactions |
| **User** | Trader profiles with stats |
| **Position** | User's holdings per market (includes `juryFeesClaimed` status) |
| **Vote** | Voting records for disputed markets |
| **Claim** | Payout claim records |
| **EmergencyRefund** | Emergency refund records |
| **GlobalStats** | Platform-wide statistics (singleton) |
| **JuryFeesPool** | Jury fees pool per market |
| **JuryFeesClaim** | Individual jury fee claim records |
| **MarketResolutionFailure** | Resolution failure events (tie, empty winning side) |

## 📝 Events Indexed

- `MarketCreated` - New market creation
- `Trade` - Buy/sell transactions
- `OutcomeProposed` - Resolution proposals
- `ProposalDisputed` - Disputes filed
- `VoteCast` - Voting on disputes
- `MarketResolved` - Final resolution
- `Claimed` - Payout claims
- `EmergencyRefunded` - Emergency refunds
- `BondDistributed` - Bond distribution details
- `JuryFeesPoolCreated` - Jury fees pool creation (v3.8.1+)
- `JuryFeesClaimed` - Individual jury fee claims (v3.8.1+)
- `MarketResolutionFailed` - Resolution failures (v3.8.1+)

## 🌐 Subgraph URLs

| Network | URL |
|---------|-----|
| BNB Testnet (Gateway) | `https://gateway.thegraph.com/api/subgraphs/id/3XxbwnAdLjsRWR3DeKJFbjjnahwMuDiG5H5qMuriDGcC` |
| BNB Testnet (Studio) | `https://api.studio.thegraph.com/query/1722665/jnglz-testnet-fresh/v3.0.0` |
| BNB Mainnet | TBD |

## 📚 Resources

- [The Graph Documentation](https://thegraph.com/docs/)
- [Subgraph Studio](https://thegraph.com/studio/)
- [AssemblyScript API](https://thegraph.com/docs/en/developing/assemblyscript-api/)

## 🔄 Handling Multiple Contract Versions

When deploying a new contract version, you can support both old and new contracts in a single subgraph using **multiple data sources**.

### Why This Approach?

| Approach | Pros | Cons |
|----------|------|------|
| **Single Subgraph (Recommended)** | One API endpoint, unified data, 1x cost | More complex mapping code |
| Two Separate Subgraphs | Simpler per-subgraph | 2x API costs, frontend must merge data |
| Factory/Proxy Pattern | Automatic discovery | Requires contract redesign |

### Implementation Steps

#### 1. Update `subgraph.yaml`

Add a new data source for each contract version:

```yaml
specVersion: 0.0.5
schema:
  file: ./schema.graphql
dataSources:
  # V1 Contract (original deployment)
  - kind: ethereum
    name: PredictionMarketV1
    network: chapel
    source:
      address: "0xOLD_CONTRACT_ADDRESS"
      abi: PredictionMarket
      startBlock: 86129412
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
        - event: MarketCreated(indexed uint256,string,uint256)
          handler: handleMarketCreatedV1
        - event: Trade(indexed uint256,indexed address,bool,bool,uint256,uint256)
          handler: handleTradeV1
      file: ./src/mapping.ts

  # V2 Contract (new deployment)
  - kind: ethereum
    name: PredictionMarketV2
    network: chapel
    source:
      address: "0xNEW_CONTRACT_ADDRESS"
      abi: PredictionMarketV2
      startBlock: 87000000  # New contract deploy block
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
        - name: PredictionMarketV2
          file: ./abis/PredictionMarketV2.json
      eventHandlers:
        - event: MarketCreated(indexed uint256,string,uint256)
          handler: handleMarketCreatedV2
        - event: Trade(indexed uint256,indexed address,bool,bool,uint256,uint256)
          handler: handleTradeV2
      file: ./src/mapping.ts
```

#### 2. Update `schema.graphql`

Add fields to track contract version:

```graphql
type Market @entity {
  id: ID!
  marketId: BigInt!
  # ... existing fields ...
  
  # Multi-contract support
  contractAddress: Bytes!      # Which contract this market belongs to
  contractVersion: String!     # "v1" or "v2"
}

type Trade @entity {
  id: ID!
  # ... existing fields ...
  
  contractAddress: Bytes!
  contractVersion: String!
}
```

#### 3. Update `mapping.ts`

Create separate handlers or use shared logic:

```typescript
import { MarketCreated as MarketCreatedV1 } from "../generated/PredictionMarketV1/PredictionMarket"
import { MarketCreated as MarketCreatedV2 } from "../generated/PredictionMarketV2/PredictionMarketV2"

// Shared handler logic
function createMarket(
  marketId: BigInt,
  question: string,
  expiry: BigInt,
  contractAddress: Bytes,
  version: string
): void {
  let id = contractAddress.toHexString() + "-" + marketId.toString()
  let market = new Market(id)
  market.marketId = marketId
  market.question = question
  market.contractAddress = contractAddress
  market.contractVersion = version
  // ... rest of fields
  market.save()
}

// V1 Handler
export function handleMarketCreatedV1(event: MarketCreatedV1): void {
  createMarket(
    event.params.marketId,
    event.params.question,
    event.params.expiryTimestamp,
    event.address,
    "v1"
  )
}

// V2 Handler
export function handleMarketCreatedV2(event: MarketCreatedV2): void {
  createMarket(
    event.params.marketId,
    event.params.question,
    event.params.expiryTimestamp,
    event.address,
    "v2"
  )
}
```

#### 4. Update Frontend Queries

Filter or sort by contract version if needed:

```graphql
query GetAllMarkets {
  markets(orderBy: createdAt, orderDirection: desc) {
    id
    marketId
    question
    contractVersion
    contractAddress
  }
}

# Or filter by version
query GetV2Markets {
  markets(where: { contractVersion: "v2" }) {
    id
    marketId
    question
  }
}
```

### Entity ID Strategy

**Important:** When supporting multiple contracts, entity IDs must be unique across contracts:

```typescript
// ❌ Bad: marketId alone can collide
let id = marketId.toString()  // Market #1 exists in both v1 and v2!

// ✅ Good: Include contract address
let id = contractAddress.toHexString() + "-" + marketId.toString()
// Result: "0xOLD...-1" and "0xNEW...-1" are unique
```

### Migration Checklist

- [ ] Add new ABI to `/abis/` folder
- [ ] Add new data source in `subgraph.yaml`
- [ ] Add `contractAddress` and `contractVersion` to schema
- [ ] Update entity ID generation to include contract address
- [ ] Create version-specific handlers (or update shared handlers)
- [ ] Run `npm run codegen` to generate new types
- [ ] Test locally with `graph build`
- [ ] Deploy: `npm run deploy`
