# JNGLZ.FUN Subgraph - Runbook

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

---

## 🌐 Multi-Network Architecture

We use **ONE codebase** to deploy to **TWO networks** (testnet and mainnet).

### Network Configuration

All network-specific values (contract address, start block) are stored in `networks.json`:

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
      "address": "<MAINNET_CONTRACT_ADDRESS>",
      "startBlock": "<MAINNET_DEPLOY_BLOCK>"
    }
  }
}
```

### Network Names
| Network | Graph CLI Name | Chain ID | Description |
|---------|---------------|----------|-------------|
| BNB Testnet | `chapel` | 97 | Development/Testing |
| BNB Mainnet | `bsc` | 56 | Production |

### Subgraph Names
| Network | Studio Name | Gateway URL |
|---------|-------------|-------------|
| Testnet | `jnglz-testnet-fresh` | See Studio |
| Mainnet | `jnglz-mainnet` | See Studio |

---

## 📡 Deployment Commands

### Authenticate with The Graph Studio

```bash
# Get your deploy key from https://thegraph.com/studio/
graph auth --studio <YOUR_DEPLOY_KEY>
```

### Deploy to Testnet

```bash
# Using npm script (recommended)
npm run deploy:testnet

# Or manually with network flag
graph deploy --studio jnglz-testnet-fresh --network chapel
```

### Deploy to Mainnet

```bash
# Using npm script (recommended)
npm run deploy:mainnet

# Or manually with network flag
graph deploy --studio jnglz-mainnet --network bsc
```

### Deploy BOTH Networks (after code changes)

```bash
# Deploy to testnet first, verify it works, then mainnet
npm run deploy:testnet
# Test queries in Studio...
npm run deploy:mainnet
```

---

## 🔄 Development Workflow

### After Schema Changes

```bash
# Regenerate types
npm run codegen

# Rebuild
npm run build

# Deploy to testnet first
npm run deploy:testnet

# After verifying, deploy to mainnet
npm run deploy:mainnet
```

### After Mapping Changes

```bash
# Just rebuild and deploy
npm run build
npm run deploy:testnet
# Then deploy:mainnet if needed
```

### After Contract Redeployment

If the contract is redeployed to a new address:

1. **Update `networks.json`** with new address and startBlock:
   ```json
   {
     "chapel": {
       "PredictionMarket": {
         "address": "0xNEW_ADDRESS_HERE",
         "startBlock": NEW_BLOCK_NUMBER
       }
     }
   }
   ```

2. **Deploy the subgraph:**
   ```bash
   npm run deploy:testnet
   ```

**Note:** You do NOT need to edit `subgraph.yaml` - the `--network` flag reads from `networks.json` automatically!

---

## 🔧 Setting Up Multi-Network (One-Time)

If `networks.json` doesn't exist yet, create it:

```bash
# Create networks.json in subgraph directory
cat > networks.json << 'EOF'
{
  "chapel": {
    "PredictionMarket": {
      "address": "0xC97FB434B79e6c643e0320fa802B515CedBA95Bf",
      "startBlock": 86465841
    }
  },
  "bsc": {
    "PredictionMarket": {
      "address": "YOUR_MAINNET_ADDRESS",
      "startBlock": YOUR_MAINNET_START_BLOCK
    }
  }
}
EOF
```

Update `package.json` scripts:
```json
{
  "scripts": {
    "deploy:testnet": "graph deploy --studio jnglz-testnet-fresh --network chapel",
    "deploy:mainnet": "graph deploy --studio jnglz-mainnet --network bsc"
  }
}
```

---

## 🔍 Testing Queries

### Using Graph Studio Playground

1. Go to your subgraph on https://thegraph.com/studio/
2. Click "Playground" tab
3. Run queries directly

### Using curl (Testnet)

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"query": "{ markets(first: 5) { id question totalVolume } }"}' \
  https://api.studio.thegraph.com/query/1722665/jnglz-testnet-fresh/version/latest
```

### Using curl (Mainnet - after deployment)

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"query": "{ markets(first: 5) { id question totalVolume } }"}' \
  https://gateway.thegraph.com/api/subgraphs/id/<MAINNET_SUBGRAPH_ID>
```

---

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

---

## 🐛 Troubleshooting

### "No data returned"

1. Check that the contract has events emitted
2. Verify startBlock in `networks.json` is before first event
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

### Network Flag Not Working

Make sure `networks.json` exists and has the correct structure:
```bash
cat networks.json
# Should show both "chapel" and "bsc" entries
```

---

## 📁 File Reference

| File | Purpose |
|------|---------|
| `schema.graphql` | Entity definitions |
| `subgraph.yaml` | Base config (events, handlers) |
| `networks.json` | **Network-specific addresses & start blocks** |
| `src/mapping.ts` | Event handler logic |
| `abis/PredictionMarket.json` | Contract ABI |

---

## 🔗 Important Links

### Testnet
- **Subgraph Studio**: https://thegraph.com/studio/subgraph/jnglz-testnet-fresh
- **BscScan**: https://testnet.bscscan.com/
- **Contract**: https://testnet.bscscan.com/address/0xC97FB434B79e6c643e0320fa802B515CedBA95Bf

### Mainnet (after deployment)
- **Subgraph Studio**: https://thegraph.com/studio/subgraph/jnglz-mainnet
- **BscScan**: https://bscscan.com/
- **Contract**: https://bscscan.com/address/<MAINNET_ADDRESS>

---

## 📝 Version History

When deploying, increment version in `package.json` and note changes:

| Version | Date | Changes |
|---------|------|---------|
| v5.2.0 | Feb 2026 | Multi-network support, TieFinalized event |
| v5.1.0 | Feb 2026 | Contract v3.8.3 support |
| v3.0.0 | Jan 2026 | Initial testnet deployment |
