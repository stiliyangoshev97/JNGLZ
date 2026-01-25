# Subgraph Deployment Rules

> ⚠️ **CRITICAL**: The subgraph is the source of truth for all on-chain data. Incorrect deployments can corrupt historical data that CANNOT be recovered.

---

## 🚨 Golden Rules

### 1. Schema Changes = New Subgraph
If you need to:
- Add new fields to existing entities
- Remove fields from existing entities
- Change field types
- Add new entities with relationships to existing data

**You MUST create a brand new subgraph** (new name, new deployment). Redeploying does NOT reset internal state.

### 2. Redeployment Limitations
When you redeploy to the same subgraph:
- ✅ Mapping logic changes take effect going forward
- ✅ New events will use new logic
- ❌ Historical data is NOT re-indexed
- ❌ Existing entity values are NOT recalculated
- ❌ Internal state persists from previous deployment

### 3. Testing Protocol
Before ANY deployment:
1. **Test on local Graph node** with Docker first
2. **Deploy to testnet subgraph** (separate from production)
3. **Verify all queries** return expected data
4. **Run for 24+ hours** to catch edge cases
5. **Only then** consider mainnet deployment

---

## 📋 Deployment Checklist

### Before Deployment
- [ ] All schema changes reviewed by another developer
- [ ] Mapping logic tested with unit tests
- [ ] Local Graph node deployment successful
- [ ] Testnet deployment running without errors
- [ ] Frontend queries verified against new schema
- [ ] Rollback plan documented

### After Deployment
- [ ] Verify indexing is progressing (not stuck)
- [ ] Check for indexing errors in Studio
- [ ] Verify sample queries return expected data
- [ ] Monitor for 1 hour minimum
- [ ] Update frontend `VITE_SUBGRAPH_URL` if needed

---

## 🔴 Known Gotchas

### 1. P/L Calculations (Current State)
The `tradingPnL` field in the `User` entity **only updates when `position.fullyExited = true`**.

```typescript
// mapping.ts line ~410-417
if (position.fullyExited) {
  user.tradingPnL = user.tradingPnL.plus(position.tradingPnLRealized);
  user.totalPnL = user.tradingPnL.plus(user.resolutionPnL);
}
```

**Implication**: Users who haven't fully exited positions won't have accurate `tradingPnL` on the leaderboard.

**Fix requires**: Schema migration (new subgraph) to track `unrealizedPnL` separately.

### 2. Decimal Precision
- All BNB values stored as `BigDecimal` with 18 decimals
- Use `toDecimal(value, 18)` helper consistently
- Never mix `BigInt` and `BigDecimal` in calculations

### 3. Entity ID Patterns
| Entity | ID Format | Example |
|--------|-----------|---------|
| Market | `marketId.toString()` | `"42"` |
| Position | `marketId-userAddress` | `"42-0xabc..."` |
| Trade | `txHash-logIndex` | `"0xdef...-0"` |
| User | `userAddress.toHexString()` | `"0xabc..."` |

### 4. Block Handlers
- Expensive operations - use sparingly
- Consider using call handlers or event handlers instead
- Can slow indexing significantly at scale

---

## 🔄 Migration Strategy

When schema changes are unavoidable:

1. **Create new subgraph** with new name (e.g., `junkiefun-bnb-testnet-v5`)
2. **Deploy new subgraph** to The Graph Studio
3. **Index from genesis block** (or startBlock if specified)
4. **Wait for full sync** before switching frontend
5. **Update frontend env** with new subgraph URL
6. **Keep old subgraph running** for 48 hours as fallback
7. **Deprecate old subgraph** after confirming stability

---

## 📁 File Structure

```
subgraph/
├── schema.graphql          # Entity definitions (CAREFUL!)
├── subgraph.yaml           # Manifest (data sources, startBlock)
├── src/
│   └── mapping.ts          # Event handlers (can update)
├── abis/
│   └── PredictionMarket.json  # Contract ABI
└── SUBGRAPH_DEPLOYMENT_RULES.md  # This file
```

---

## 🏷️ Versioning Convention

| Version | Meaning |
|---------|---------|
| v4.0.0 | Current stable (Contract v3.8.2) |
| v4.0.x | Bug fixes in mapping logic only |
| v4.x.0 | New features (additive schema changes only) |
| v5.0.0 | Breaking schema changes (new subgraph required) |

---

## 📞 Emergency Procedures

### Indexer Stuck
1. Check The Graph Studio for error logs
2. If block-level issue, may need to redeploy
3. Contact The Graph Discord for help

### Corrupted Data
1. **Do NOT redeploy** - it won't fix historical data
2. Create new subgraph with corrected logic
3. Re-index from scratch
4. Migrate frontend to new subgraph

### Frontend Shows Stale Data
1. Check `_meta { block { number } }` query
2. Verify indexer is syncing
3. May be rate limiting - check API key usage

---

## 📚 Resources

- [The Graph Documentation](https://thegraph.com/docs/)
- [AssemblyScript Reference](https://www.assemblyscript.org/introduction.html)
- [Graph Protocol Discord](https://discord.gg/graphprotocol)
- [Subgraph Best Practices](https://thegraph.com/docs/en/developing/creating-a-subgraph/#best-practices)
