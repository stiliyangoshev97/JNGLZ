# JNGLZ.FUN Subgraph

Indexes the PredictionMarket contract on BNB Chain and provides a GraphQL API for the frontend.

## 📊 Quick Stats

| Metric | Value |
|--------|-------|
| Status | ✅ Deployed (v3.8.2) |
| Network | BNB Testnet (Chapel) |
| Contract | `0x3ad26B78DB90a3Fbb5aBc6CF1dB9673DA537cBD5` |
| Start Block | 85941857 |
| Entities | 11 (Market, Trade, User, Position, Vote, Claim, EmergencyRefund, GlobalStats, JuryFeesPool, JuryFeesClaim, MarketResolutionFailure) |

## 🔗 GraphQL Endpoint

**Production:**
```
https://api.studio.thegraph.com/query/1722665/junkiefun-bnb-testnet/v3.8.2
```

**Studio:**
```
https://api.studio.thegraph.com/query/1722665/junkiefun-bnb-testnet/v3.8.2
```

**Studio Dashboard:** https://thegraph.com/studio/subgraph/junkiefun-bnb-testnet

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
4. Name it: `junkiefun-bnb-testnet`
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
| BNB Testnet | `https://api.studio.thegraph.com/query/1722665/junkiefun-bnb-testnet/v3.8.2` |
| BNB Mainnet | TBD |

## 📚 Resources

- [The Graph Documentation](https://thegraph.com/docs/)
- [Subgraph Studio](https://thegraph.com/studio/)
- [AssemblyScript API](https://thegraph.com/docs/en/developing/assemblyscript-api/)
