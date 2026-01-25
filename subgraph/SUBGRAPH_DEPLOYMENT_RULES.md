# 🚨 SUBGRAPH DEPLOYMENT RULES - READ BEFORE ANY CHANGES

> **Critical document for JNGLZ.FUN subgraph maintenance.**
> **Last Updated:** January 25, 2026
> **Created After:** Painful sync issues on testnet (Jan 2026)

---

## 🔥 THE GOLDEN RULES

### Rule #1: Never Change Existing Entities After Launch
```
❌ WRONG: Rename or delete fields
✅ RIGHT: Add new fields with defaults, keep old ones
```

### Rule #2: Never Change Entity ID Format
```
❌ WRONG: Change "marketId" to "market-{id}"
✅ RIGHT: Keep ID format forever once deployed
```

### Rule #3: Add, Never Rewrite
```
❌ WRONG: Modify existing handler logic drastically
✅ RIGHT: Append new handlers, new fields, new entities
```

---

## 🎯 WHAT WE DID WRONG (Learn From Our Mistakes)

### Mistake #1: Too Many Rapid Deployments to Same Subgraph
**What happened:** We deployed v4.0.1, v4.0.2, v4.0.3... v4.0.9+ to `jnglz-bnb-testnet` trying to fix sync issues.

**Result:** Graph Studio accumulated stale state, indexer got confused, sync permanently lagged 300-800 blocks.

**Lesson:** 
- Don't spam deployments to fix sync issues
- If 2-3 deployments don't fix it, CREATE A NEW SUBGRAPH

### Mistake #2: Changing startBlock Multiple Times
**What happened:** We kept adjusting `startBlock` thinking it would fix sync.

**Result:** Indexer state became inconsistent.

**Lesson:**
- Pin `startBlock` ONCE to contract deployment block
- Never change it after first successful sync
- For fresh start: create NEW subgraph, not new startBlock

### Mistake #3: Adding Complex Logic Mid-Flight
**What happened:** Added `fullyExited` P/L tracking (v4.0.2) which added:
- New schema fields
- Complex conditional logic with extra `user.save()` calls
- Re-entry detection logic

**Result:** Suspected (wrongly) that this caused sync issues.

**Lesson:**
- Test complex logic changes on LOCAL first
- Deploy to fresh testnet subgraph to validate
- Don't blame code without evidence - our code was fine!

### Mistake #4: Not Creating Fresh Subgraph Sooner
**What happened:** Spent hours debugging code when the issue was Graph Studio state.

**Result:** Wasted time, frustration, unnecessary code changes.

**Lesson:**
- When sync issues persist after 2-3 clean deployments
- IMMEDIATELY create a fresh subgraph
- It takes 2 minutes and often fixes everything

---

## ✅ THE SAFE DEPLOYMENT CHECKLIST

### Before ANY Deployment

- [ ] Run `npm run codegen` - types must generate
- [ ] Run `npm run build` - must compile without errors
- [ ] Check schema for breaking changes (see below)
- [ ] Verify `startBlock` matches contract deployment
- [ ] Test query locally if possible

### Schema Change Safety Check

| Change Type | Safe? | Notes |
|-------------|-------|-------|
| Add new entity | ✅ Yes | Always safe |
| Add new field (nullable) | ✅ Yes | Use `field: Type` (nullable) |
| Add new field (required) | ⚠️ Careful | Must have default, test thoroughly |
| Rename field | ❌ NO | Breaks existing queries |
| Delete field | ❌ NO | Breaks existing queries |
| Change field type | ❌ NO | Breaks indexing |
| Change entity ID format | ❌ NO | Corrupts all data |

### Deployment Flow

```
1. LOCAL TEST
   └── npm run codegen && npm run build

2. TESTNET DEPLOY
   └── graph deploy to testnet subgraph
   └── Wait for 100% sync
   └── Test queries

3. MAINNET DEPLOY (only if testnet passes)
   └── graph deploy to mainnet subgraph
   └── Monitor sync progress
   └── Verify data integrity
```

---

## 🚀 MAINNET PREPARATION CHECKLIST

Before flipping to mainnet, ALL must be true:

### Schema Stability
- [ ] No schema changes planned for 30+ days
- [ ] All entity IDs are stable
- [ ] No field renames or deletions pending
- [ ] Optional fields used for future expansion

### Code Quality
- [ ] No unbounded loops in handlers
- [ ] No dynamic array writes that could grow infinitely
- [ ] All handlers have null checks
- [ ] No `log` statements (or minimal)
- [ ] Deterministic logic (no random, no external calls)

### Configuration
- [ ] `startBlock` pinned to contract deployment block
- [ ] ABI matches deployed contract exactly
- [ ] Network set correctly (mainnet vs testnet)
- [ ] Contract address verified

### Testing
- [ ] Full testnet sync completed (100%, 0 blocks behind)
- [ ] All queries return expected data
- [ ] Reorg handling tested (if applicable)
- [ ] High-volume scenario tested

### Operations
- [ ] API key created and whitelisted for domains
- [ ] Rate limits understood (100k queries/month free tier)
- [ ] Monitoring/alerts set up
- [ ] Rollback plan documented

---

## 🛠️ HOW TO EVOLVE THE SUBGRAPH SAFELY

### Adding New Features

**Example: Adding a new leaderboard field**

```graphql
# WRONG - Modifying existing field
type User {
  tradingPnL: BigDecimal!  # Changed calculation - BREAKS HISTORY
}

# RIGHT - Add new field, keep old
type User {
  tradingPnL: BigDecimal!         # Keep original
  tradingPnLV2: BigDecimal        # New calculation (nullable for old records)
}
```

### Adding New Entities

```graphql
# Always safe - just add it
type NewFeature @entity {
  id: ID!
  data: String!
  createdAt: BigInt!
}
```

### Handling Contract Upgrades

If the contract logic changes significantly:

1. **Option A:** New handler for new events (preferred)
   ```yaml
   eventHandlers:
     - event: TradeV2(indexed uint256,indexed address,...)
       handler: handleTradeV2
   ```

2. **Option B:** New subgraph for new contract
   - Deploy `MarketV2` contract
   - Create `jnglz-v2` subgraph
   - Frontend queries both

---

## 🚨 EMERGENCY PROCEDURES

### Sync Stuck at 99%

1. Wait 30 minutes (indexer might be catching up)
2. Check Graph Studio for errors
3. If no errors: CREATE NEW SUBGRAPH
4. Don't keep redeploying to same subgraph

### Data Looks Wrong

1. Check handler logic for bugs
2. Verify ABI matches contract
3. Check startBlock includes all events
4. Query raw events to compare

### Need to "Reset" Everything

1. Create new subgraph: `jnglz-{network}-v{N}`
2. Set startBlock to contract deployment
3. Deploy fresh
4. Update frontend to new endpoint
5. Delete/unpublish old subgraph

---

## 📁 CURRENT DEPLOYMENT INFO

### Testnet (Active)
- **Subgraph:** `jnglz-testnet-fresh`
- **Version:** v1.0.0
- **Subgraph ID:** `3XxbwnAdLjsRWR3DeKJFbjjnahwMuDiG5H5qMuriDGcC`
- **Contract:** `0x0A5E9e7dC7e78aE1dD0bB93891Ce9E8345779A30`
- **startBlock:** `86465841`
- **Status:** ✅ 100% synced

### Mainnet (Pending)
- **Subgraph:** TBD (`jnglz-mainnet` or `jnglz-bnb`)
- **Version:** TBD
- **Contract:** TBD
- **startBlock:** TBD (contract deployment block)
- **Status:** ⏳ Awaiting contract deployment

---

## 📚 REFERENCE

### Useful Commands

```bash
# Generate types from schema
npm run codegen

# Build subgraph
npm run build

# Deploy to studio
graph deploy {subgraph-name} --node https://api.studio.thegraph.com/deploy/ --version-label v{X.Y.Z}

# Authenticate
graph auth {deploy-key}
```

### Graph Studio URLs
- **Dashboard:** https://thegraph.com/studio/
- **Testnet Subgraph:** https://thegraph.com/studio/subgraph/jnglz-testnet-fresh
- **Gateway Docs:** https://thegraph.com/docs/

### Files That Matter
- `schema.graphql` - Entity definitions (CRITICAL)
- `subgraph.yaml` - Configuration (startBlock, events)
- `src/mapping.ts` - Event handlers
- `abis/PredictionMarket.json` - Contract ABI

---

## ⚡ QUICK DECISION TREE

```
Is sync stuck or lagging?
├── Yes
│   ├── Did you just deploy? → Wait 30 min
│   ├── Been stuck for 1+ hour? → Create NEW subgraph
│   └── Error in Graph Studio? → Fix the error, redeploy
└── No
    └── Continue as normal

Need to add a feature?
├── New entity? → Safe, just add it
├── New field on existing entity? 
│   ├── Nullable? → Safe
│   └── Required? → Test on testnet first
├── Rename/delete field? → ❌ DON'T DO IT
└── Change ID format? → ❌ ABSOLUTELY NOT

Mainnet deploy?
├── All checklist items green? → Deploy
├── Any red? → Fix first, NO EXCEPTIONS
└── "It's probably fine"? → It's NOT, fix it
```

---

**Remember:** Mainnet isn't about perfection. It's about not breaking the past while building the future.

*Document created after learning the hard way on Jan 25, 2026.*
