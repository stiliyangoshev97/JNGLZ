# Subgraph Deployment Rules

> ⚠️ **CRITICAL**: The subgraph is the source of truth for all on-chain data. Understanding redeployment behavior is essential.

---

## 🚨 Golden Rules

### 1. Redeployment ALWAYS Re-indexes From Scratch

When you deploy (or redeploy) to a subgraph in The Graph Studio:
- ✅ **All historical data is wiped**
- ✅ **Indexing starts fresh from `startBlock`**
- ✅ **New schema AND mapping logic apply to everything**

This means you can safely redeploy schema changes to the **same subgraph** - it will re-index everything with the new schema.

### 2. When to Create a NEW Subgraph Name

Create a new subgraph (`jnglz-testnet-v2`, etc.) when:
- You want to **keep the old version running** as a fallback
- You're deploying to **production** and need zero downtime
- You want to **compare** old vs new indexing results

For development/testing, redeploying to the same subgraph is fine.

### 3. Common Gotcha: "0 Triggers Found"

If your subgraph syncs but finds 0 triggers (events), check:
- **Required array fields** must be initialized as `[]` in handlers, not left as null
- **Entity creation order** - parent entities must exist before adding relationships
- **Field types** - `[String!]!` means non-null array of non-null strings

**Example of the bug we hit:**
```typescript
// ❌ BAD - positionIds never initialized, causes silent failures
market.positionIds  // undefined/null

// ✅ GOOD - initialize in handleMarketCreated
market.positionIds = []
```

---

## 📋 Deployment Checklist

### Before Deployment
- [ ] Run `graph codegen` - no errors
- [ ] Run `graph build` - no errors  
- [ ] All required fields have default values in handlers
- [ ] Array fields initialized as `[]` not null

### After Deployment
- [ ] Check Studio logs - should see "Found X triggers" (not 0)
- [ ] Verify indexing is progressing (block number increasing)
- [ ] Test a sample query returns expected data
- [ ] If stuck, check for schema initialization issues

---

## 🔴 Lessons Learned

### 1. v2.0.0 Stuck, v3.0.0 Worked Instantly

**Problem:** v2.0.0 showed "Found 0 triggers" while v3.0.0 found 42-52 triggers per block.

**Cause:** `positionIds: [String!]!` field on Market wasn't being initialized in `handleMarketCreated()`. The handler silently failed.

**Fix:** Added `market.positionIds = []` in `handleMarketCreated()`.

**Lesson:** AssemblyScript/Graph node can fail silently when required fields aren't properly initialized. Always initialize arrays as `[]`.

### 2. P/L Calculation Fix Required Schema Changes

**Problem:** Trading P/L only updated when `position.fullyExited = true`, missing partial sell profits.

**Solution:** Added 8 tracking fields to Position entity for average cost basis calculation on every sell.

**Lesson:** Some fixes require schema changes. With The Graph Studio, you can redeploy schema changes and it re-indexes everything.

### 3. Loser Resolution P/L Was 0

**Problem:** Losers showed P/L of 0 instead of their actual loss.

**Solution:** Added `positionIds` array to Market, iterate through all positions in `handleMarketResolved()`, set loser P/L = `-netCostBasis`.

**Lesson:** Need to track relationships (Market → Positions) to do batch operations at resolution time.

---

## 📁 Entity ID Patterns

| Entity | ID Format | Example |
|--------|-----------|---------|
| Market | `marketId.toString()` | `"42"` |
| Position | `marketId-userAddress` | `"42-0xabc..."` |
| Trade | `txHash-logIndex` | `"0xdef...-0"` |
| User | `userAddress.toHexString()` | `"0xabc..."` |

---

## 🏷️ Versioning

| Schema Version | Deployment Version | Notes |
|----------------|-------------------|-------|
| v5.1.0 | v3.0.0 | Current - P/L fix with positionIds |
| v5.0.0 | v2.0.0 | Failed - missing positionIds init |
| v4.x.x | v1.0.0 | Old - P/L only on full exit |

---

## 📞 Debugging Tips

### Indexer Stuck / 0 Triggers
1. Check Studio logs for trigger count
2. Look for uninitialized required fields
3. Verify all `[Type!]!` arrays are set to `[]`
4. Check handler logic isn't silently failing

### Verify Sync Status
```graphql
{
  _meta {
    block { number }
    hasIndexingErrors
  }
}
```

### Quick Data Check
```graphql
{
  markets(first: 5) { id, positionIds }
  positions(first: 5) { id, realizedPnL }
}
```

---

## 📚 Resources

- [The Graph Studio](https://thegraph.com/studio/)
- [AssemblyScript Docs](https://www.assemblyscript.org/)
- [Subgraph Manifest Spec](https://thegraph.com/docs/en/developing/creating-a-subgraph/)
