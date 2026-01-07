# JunkieFun Subgraph - Runbook

Quick reference for common subgraph operations.

## 🚀 First-Time Setup

```bash
# 1. Install dependencies
cd subgraph
npm install

# 2. Install Graph CLI globally (if not done)
npm install -g @graphprotocol/graph-cli

# 3. Generate types from schema
npm run codegen

# 4. Build subgraph
npm run build
```

## 📡 Deployment Commands

### Authenticate with The Graph Studio

```bash
# Get your deploy key from https://thegraph.com/studio/
graph auth --studio <YOUR_DEPLOY_KEY>
```

### Deploy to Testnet

```bash
npm run deploy:testnet
# or
graph deploy --studio junkiefun-bnb-testnet
```

### Deploy to Mainnet (when ready)

```bash
npm run deploy:mainnet
# or
graph deploy --studio junkiefun-bnb-mainnet
```

## 🔄 Development Workflow

### After Schema Changes

```bash
# Regenerate types
npm run codegen

# Rebuild
npm run build

# Deploy new version
npm run deploy
```

### After Mapping Changes

```bash
# Just rebuild and deploy
npm run build
npm run deploy
```

## 🔍 Testing Queries

### Using Graph Studio Playground

1. Go to your subgraph on https://thegraph.com/studio/
2. Click "Playground" tab
3. Run queries directly

### Using curl

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"query": "{ markets(first: 5) { id question totalVolume } }"}' \
  https://api.studio.thegraph.com/query/<ID>/junkiefun-bnb-testnet/v0.0.1
```

## 📊 Useful Queries for Testing

### Check if indexing

```graphql
{
  _meta {
    block {
      number
    }
    hasIndexingErrors
  }
}
```

### Get all markets

```graphql
{
  markets(first: 100) {
    id
    question
    status
    totalVolume
    totalTrades
  }
}
```

### Get global stats

```graphql
{
  globalStats(id: "global") {
    totalMarkets
    totalVolume
    totalTrades
    totalUsers
  }
}
```

## 🐛 Troubleshooting

### "No data returned"

1. Check that the contract has events emitted
2. Verify startBlock in subgraph.yaml is before first event
3. Check indexing status in Studio dashboard

### Build Errors

```bash
# Clean and rebuild
rm -rf generated/ build/
npm run codegen
npm run build
```

### Indexing Errors

1. Check Studio dashboard for error logs
2. Verify ABI matches deployed contract
3. Check event signatures in subgraph.yaml

## 📁 File Reference

| File | Purpose |
|------|---------|
| `schema.graphql` | Entity definitions |
| `subgraph.yaml` | Contract address, events, network config |
| `src/mapping.ts` | Event handler logic |
| `abis/PredictionMarket.json` | Contract ABI |

## 🔗 Important Links

- **Subgraph Studio**: https://thegraph.com/studio/
- **BscScan Testnet**: https://testnet.bscscan.com/
- **Contract**: https://testnet.bscscan.com/address/0x568FEafFa8c7eED1D81d120a58f4e8DF7bc4E336
