# JNGLZ.FUN - Interview Study Guide

> Decentralized Prediction Market Launchpad on BNB Chain

---

## 🎯 What is JNGLZ.FUN?

A fully on-chain prediction market platform where users can:
- **Create** markets on any yes/no question (free to create)
- **Trade** YES/NO shares using native BNB
- **Resolve** markets via community voting ("Street Consensus")
- **Earn** by proposing outcomes, disputing, or voting as jury

**Key differentiator**: No oracles, no centralized resolvers - pure community-driven resolution.

---

## 📜 Smart Contract (Solidity)

### Bonding Curve AMM
Uses a **linear bonding curve** for pricing:

```
Price = basePrice + (supply × slope)
```

- **Base price**: 0.0001 BNB
- **Slope**: 0.0000001 BNB per share
- **Result**: Price increases as more shares are bought, decreases as sold

### How Buy/Sell Works
```solidity
// Buy: Integrate price over quantity
cost = basePrice × shares + (slope × shares²) / 2

// Sell: Same formula, but you receive BNB back
```

**Why bonding curve?**
- No liquidity providers needed
- Always liquid - contract IS the market maker
- Price discovery through supply/demand

### Virtual Liquidity (VLQ)
Prevents extreme price swings in low-liquidity markets:
```solidity
effectiveSupply = actualSupply + virtualLiquidity
```
- Adds "phantom" shares to smooth the curve
- Makes early trades less volatile

### Resolution Flow (Street Consensus)
```
1. Market Expires
2. Proposer stakes bond → proposes YES or NO
3. 30-min dispute window
4. If disputed → 1hr voting (shareholders vote)
5. Winner gets bond back + 50% of loser's bond
6. Jury (winning voters) splits other 50%
```

### Key Contract Features
- **Pull Pattern**: Winnings/bonds held until claimed (no push transfers)
- **Emergency Refund**: 24h after expiry if unresolved
- **Pausable**: Admin can pause trading in emergencies
- **Fee Structure**: 1.5% trade fee, 0.3% resolution fee

---

## 📊 Subgraph (The Graph)

### What It Does
Indexes all on-chain events into a queryable GraphQL API. **Replaces traditional backend** - no Express/MongoDB needed.

### Key Entities
```graphql
Market    → question, prices, supplies, resolution state
Trade     → trader, shares, BNB amount, timestamp
Position  → user's YES/NO shares per market
User      → total trades, volume, markets created
Vote      → voter, weight, which side they supported
```

### How It Works
1. Contract emits events (MarketCreated, TradeExecuted, etc.)
2. Subgraph mapping.ts listens and updates entities
3. Frontend queries via GraphQL

### Example Query
```graphql
query {
  markets(orderBy: totalVolume, orderDirection: desc) {
    question
    yesSupply
    noSupply
    resolved
  }
}
```

---

## ⚛️ Frontend (React + TypeScript)

### Tech Stack
- **Vite** + React 19 + TypeScript
- **Wagmi** + RainbowKit (Web3)
- **Apollo Client** (GraphQL)
- **TanStack Query** (caching)
- **Tailwind CSS** ("High-Energy Brutalism" theme)

### Key Patterns

**Optimistic Updates**
```typescript
// Update UI immediately, rollback on error
const optimisticTrade = () => {
  updateCache(newPosition);
  try { await contractCall(); }
  catch { rollbackCache(); }
}
```

**Smart Polling (Predator v2)**
- 15s when market is "hot" (recent trades)
- 5min when market is "cold"
- Pauses when tab is hidden

**Contract Hooks**
```typescript
useContractReads  → prices, positions, balances
useContractWrites → trade, propose, vote, claim
```

### Feature Structure
```
src/features/
├── markets/     → MarketCard, TradePanel, ResolutionPanel
├── create/      → CreateMarketPage
└── portfolio/   → PositionCard, P/L tracking
```

---

## 🗄️ Supabase (Backend Services)

### What It Handles
- **Real-time chat** per market
- **Content moderation** (hide inappropriate markets)
- **Admin functions** via Edge Functions

### Auth: SIWE (Sign-In With Ethereum)
```typescript
// User signs message with wallet
const message = "Sign in to JNGLZ.FUN...";
const signature = await wallet.signMessage(message);
// Server verifies signature matches address
```

### Edge Functions
```
send-message    → Chat with rate limiting
delete-message  → Admin moderation
moderate-market → Hide/unhide content
```

### Why Supabase?
- Real-time subscriptions (chat updates instantly)
- Row-level security (users can only edit own messages)
- No server to manage

---

## 💡 Technical Challenges Solved

### 1. Vote Tracking Bug
**Problem**: Subgraph tracked votes by YES/NO instead of Proposer/Disputer
**Solution**: Compare `outcome === proposedOutcome` to determine winner

### 2. Bonding Curve Math
**Problem**: Integer overflow with large numbers
**Solution**: Use `uint256` and careful ordering of operations

### 3. Front-running Protection
**Problem**: MEV bots could sandwich trades
**Solution**: Slippage tolerance + minimum received amount

### 4. Empty Winner Side
**Problem**: What if winning side has 0 shareholders?
**Solution**: Block resolution, enable emergency refunds

---

## 🔢 Quick Numbers to Remember

| Metric | Value |
|--------|-------|
| Trade Fee | 1.5% |
| Resolution Fee | 0.3% |
| Proposer Reward | 0.5% of pool |
| Dispute Window | 30 minutes |
| Voting Window | 1 hour |
| Emergency Refund | 24h after expiry |
| Bond Winner Share | 50% |
| Jury Share | 50% of loser's bond |

---

## 🎤 Interview Talking Points

1. **"How does pricing work?"** → Bonding curve, price = base + supply × slope

2. **"How do you handle resolution without oracles?"** → Street Consensus: propose → dispute → vote

3. **"What's the incentive to resolve correctly?"** → Bond at risk, jury fees for voters

4. **"How do you query blockchain data?"** → The Graph subgraph indexes events into GraphQL

5. **"What if no one resolves?"** → Emergency refund after 24h

6. **"How do you prevent manipulation?"** → Voting power = total shares (both sides), not just winning side
