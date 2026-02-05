# 📋 JNGLZ.FUN - Frontend Project Context

> Quick reference for AI assistants and developers.  
> **Last Updated:** February 5, 2026  
> **Version:** 0.8.21
> **Status:** Phase 2+ Complete (Contract Integration + UX Polish + Predator Polling v2.1 + Optimistic Updates + Pull Pattern + Error Formatting + Realized P/L + Portfolio Refactor + Badge Consistency + PENDING Sub-Filters + Resolution Economics + Fee Transparency + P/L Closed Positions Only + Legal Pages Overhaul + EEA/MiCA Compliance + Creator Liability + ScrollToTop + Price Impact Documentation + Portfolio Heat Badges + Leaderboard Fixes + UI Cleanup v3 + Mobile Optimization + SEO + Security + Vercel Deployment + One-Sided Market Fixes + Portfolio Sorting/Filtering + MarketDetailPage Layout Fix + Maintenance Mode + Branding Update + CI/CD Pipeline + v3.6.1 Contract Integration + Reconnect Stability + Portfolio Earnings Display + Explore Before Connect UX + ABI Mismatch Fix + TradePanel UX Improvements + Documentation Overhaul + Cross-Direction Sell Fix + Creator Priority Window UI + Proposer/Disputer Display + Trading & Resolution P/L Split + Payout Color Fix + Position Refresh Fix + Negative NetCostBasis Fix + Trading P/L After Resolution + Loser Resolution P/L Display Fix + Mobile Holders Table Fix + Live Question Counter + Portfolio Market ID + Image Compression + P/L Documentation + Refund Disclaimer + Market Not Found Anti-Drain + Supabase Chat & Moderation + SEO Optimization + Consistent Tab Limits + Network Switch + Tie Scenario UI Fix + Portfolio UX Improvements + Buy Preview Fee Fix + Chat & Holder Badge Fixes + **Mainnet Deployment**)

---

## 🎯 Platform Overview

**JNGLZ.FUN** is a decentralized prediction market launchpad with a **"High-Energy Brutalism"** aesthetic (trading terminal × street market) where users can:
- Create prediction markets (free, image required)
- Trade YES/NO shares with native BNB
- View real-time prices via bonding curve
- Resolve markets via Street Consensus (bettors vote)
- Claim winnings after resolution
- Withdraw pending bonds/fees (Pull Pattern)
- Track Total P/L (Trading + Resolution) per wallet
- Emergency refund for unresolved markets (24h+)

---

## 🚀 Mainnet Configuration (PRODUCTION)

### Contract (BNB Mainnet - Chain ID: 56)
| Item | Value |
|------|-------|
| PredictionMarket (v3.8.3) | `0xA482Ac7acbf846F2DAEE8b8dF3D7e77F85CC7528` |
| Treasury | `0xaCaD82a7F17f4f4a2f229EF11D5128f07d71D4f2` |
| BscScan | https://bscscan.com/address/0xA482Ac7acbf846F2DAEE8b8dF3D7e77F85CC7528 |

### MultiSig Signers (Mainnet)
- Signer 1: `0x89b1163c90c22775ea45F69607d933618ccFCE3C`
- Signer 2: `0x841528d507D91eabB924b48A45E32edC8A723f4b`
- Signer 3: `0x792C04Eea5D788D2B5C22F76F5C33a982f786116`

### Subgraph (Mainnet)
| Item | Value |
|------|-------|
| Studio URL | Coming soon (`jnglz-mainnet`) |
| Network | BNB Chain (bsc) |

---

## 🧪 Testnet Configuration

### Contract (BNB Testnet - Chain ID: 97)
| Item | Value |
|------|-------|
| PredictionMarket (v3.8.3) | `0xC97FB434B79e6c643e0320fa802B515CedBA95Bf` |
| Treasury | `0xc21Ca5BA47cF1C485DE33b26D9Da3d10ACcDa413` |
| BscScan | https://testnet.bscscan.com/address/0xC97FB434B79e6c643e0320fa802B515CedBA95Bf |

### Subgraph (The Graph)
| Item | Value |
|------|-------|
| Studio URL (v5.2.0) | `https://api.studio.thegraph.com/query/1722665/jnglz-testnet-fresh/v5.2.0` |
| Gateway URL | `https://gateway.thegraph.com/api/subgraphs/id/3XxbwnAdLjsRWR3DeKJFbjjnahwMuDiG5H5qMuriDGcC` |
| Version | v5.2.0 (jnglz-testnet-fresh - Contract v3.8.3) |
| Rate Limit | Higher limits via Gateway (published) |

### Environment Variables (.env)
```env
# BNB Testnet (v3.8.3)
VITE_CONTRACT_ADDRESS=0xC97FB434B79e6c643e0320fa802B515CedBA95Bf
VITE_SUBGRAPH_URL=https://gateway.thegraph.com/api/subgraphs/id/21Mbjuj7SdV8YmHYaZ56Z17hVSgJBBgcDkKFceNjeDpn
VITE_GRAPH_API_KEY=<your-graph-api-key>
VITE_CHAIN_ID=97
VITE_WALLETCONNECT_PROJECT_ID=<your-project-id>
VITE_ADMIN_ADDRESSES=0x4Cca77ba15B0D85d7B733E0838a429E7bEF42DD2,0xC119B9152afcC5f40C019aABd78A312d37C63926,0x6499fe8016cE2C2d3a21d08c3016345Edf3467F1

# Supabase (Chat & Moderation)
VITE_SUPABASE_URL=https://rbizamxghqaqskvdjfrg.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>

# Maintenance Mode (blocks entire site)
VITE_MAINTENANCE_MODE=false
VITE_MAINTENANCE_MESSAGE=We're upgrading our systems!
VITE_MAINTENANCE_END_TIME=January 20, 2026 at 10:00 UTC
```

### Supabase (Chat & Moderation)
| Item | Value |
|------|-------|
| Project Name | `jnglz-fun` |
| Project Ref | `rbizamxghqaqskvdjfrg` |
| URL | `https://rbizamxghqaqskvdjfrg.supabase.co` |
| Documentation | See `/supabase/PROJECT_CONTEXT_SUPABASE.md` |

**Edge Functions:**
- `send-message` - Chat with SIWE auth + rate limiting
- `delete-message` - Admin message deletion
- `moderate-market` - Admin content moderation

---

## 📊 Current Status

| Component | Progress | Notes |
|-----------|----------|-------|
| Project Setup | ✅ 100% | Vite + React 19 + TypeScript |
| Tailwind Theme | ✅ 100% | "High-Energy Brutalism" - black bg, harsh borders |
| Base UI Components | ✅ 100% | Button, Card, Modal, Input, Badge, HeatBar, ChanceDisplay |
| Web3 Integration | ✅ 100% | Wagmi + RainbowKit (brutalist theme) |
| Providers Setup | ✅ 100% | Query, Web3, GraphQL |
| Router Setup | ✅ 100% | React Router with lazy loading + ScrollToTop |
| Chain Validation | ✅ 100% | WrongNetworkModal, prevents Phantom stuck issue |
| Schemas (Zod) | ✅ 100% | Market, Trade, Position, User |
| GraphQL Queries | ✅ 100% | All queries match subgraph schema |
| Markets Page | ✅ 100% | Grid, filters, smart polling (30s) |
| Market Detail Page | ✅ 100% | Chart, trade panel, Predator Polling v2 (dynamic 15s-5min) |
| Create Market Page | ✅ 100% | Fully wired to contract + Heat Levels |
| Portfolio Page | ✅ 100% | Positions + Pending Withdrawals banner |
| Contract Read Hooks | ✅ 100% | Prices, positions, previews, bonds, pending withdrawals |
| Contract Write Hooks | ✅ 100% | Create, trade, resolve, claim, withdraw |
| Trade Panel | ✅ 100% | Buy/sell with optimistic updates |
| Resolution Panel | ✅ 100% | Propose, dispute, vote, claim |
| Smart Polling | ✅ 100% | **Predator v2**: Temperature-based, tab visibility, focus refetch |
| Optimistic Updates | ✅ 100% | Instant UI with rollback on failure |
| Pull Pattern | ✅ 100% | Withdraw bonds/creator fees UI |
| Supabase Chat | ✅ 100% | Real-time chat per market with SIWE auth |
| Content Moderation | ✅ 100% | Admin hide/unhide market content |
| SEO | ✅ 100% | Dynamic titles, OG/Twitter meta, JSON-LD, useSEO hook |

**Overall Progress: ~100%**

---

## 🏗️ Architecture

### Feature-Based Structure
```
src/
├── features/
│   ├── markets/
│   │   ├── components/    # MarketCard, TradePanel, LiveTicker, etc.
│   │   ├── pages/         # MarketsPage, MarketDetailPage
│   │   └── index.ts
│   ├── create/
│   │   ├── pages/         # CreateMarketPage
│   │   └── index.ts
│   └── portfolio/
│       ├── components/    # PositionCard
│       ├── pages/         # PortfolioPage
│       └── index.ts
├── shared/
│   ├── api/               # GraphQL queries + types
│   ├── components/
│   │   ├── ui/            # Button, Card, Modal, Input, etc.
│   │   └── WrongNetworkModal.tsx
│   ├── config/            # wagmi, env, contracts, graphql
│   ├── hooks/             # Contract hooks + chain validation
│   │   ├── useChainValidation.ts
│   │   ├── useContractReads.ts     # Price, position, preview, pending withdrawal hooks
│   │   ├── useContractWrites.ts    # Trade, create, resolve, withdraw hooks
│   │   ├── useSmartPolling.ts      # Predator v2: Temperature polling, tab visibility, focus refetch
│   │   ├── useOptimisticTrade.ts   # Cache manipulation with rollback
│   │   └── useTradeWithOptimism.ts # Trade hooks with instant UI feedback
```

---

## 🎨 Design System ("High-Energy Brutalism")

### Color Palette
```javascript
colors: {
  // Primary actions
  yes: '#39FF14',         // Electric Lime (YES/Bullish)
  no: '#FF3131',          // Neon Crimson (NO/Bearish)
  cyber: '#00E0FF',       // Cyber Blue (Actions/Links)
  
  // Backgrounds (TRUE BLACK)
  dark: {
    900: '#000000',       // Main background
    800: '#0a0a0a',       // Cards
    700: '#141414',       // Elevated
    600: '#262626',       // Borders
  },
  
  // Text
  text: {
    primary: '#FFFFFF',
    secondary: '#A0A0A0',
    muted: '#666666',
  },
}
```

### Typography
- **Numbers/Data**: JetBrains Mono (monospace)
- **Headlines**: Inter (bold sans-serif)

### Design Rules
- ❌ NO rounded corners (0px radius everywhere)
- ❌ NO shadows
- ✅ 1px harsh borders
- ✅ Neon glow effects on important elements
- ✅ Grayscale → color transitions on hover

---

## 🔗 Data Sources

### The Graph (GraphQL via Apollo Client)
Primary data source for:
- Market listings (GET_MARKETS, GET_ACTIVE_MARKETS)
- Trade history (GET_RECENT_TRADES, GET_MARKET_TRADES)
- User positions (GET_USER_POSITIONS)
- Global stats (GET_GLOBAL_STATS)

**Important Schema Mappings:**
| Frontend | Subgraph Field |
|----------|----------------|
| expirationTimestamp | `expiryTimestamp` |
| liquidity | `poolBalance` |
| evidenceUrl | `evidenceLink` |
| trader (string) | `traderAddress` |
| creator (object) | `{ id, address }` |

### Smart Contract (Direct Reads - Pending)
For real-time data:
- Current prices (getYesPrice, getNoPrice)
- Preview calculations (previewBuy, previewSell)
- Required bond (getRequiredBond)

### Smart Contract (Writes - Pending)
- buyYes() / buyNo()
- sellYes() / sellNo()
- createMarket() / createMarketAndBuy()
- proposeOutcome() / dispute() / vote()
- finalizeMarket() / claim() / emergencyRefund()

---

## 🛣️ Routes

| Path | Page | Status |
|------|------|--------|
| `/` | MarketsPage | ✅ Complete |
| `/market/:marketId` | MarketDetailPage | ✅ Complete |
| `/create` | CreateMarketPage | ✅ Complete (with Heat Levels) |
| `/portfolio` | PortfolioPage | ✅ Complete |
| `/terms` | TermsPage | ✅ Complete |
| `/privacy` | PrivacyPage | ✅ Complete |

---

## Heat Levels (Market Volatility)

Markets can be created with different volatility levels:

| Level | Name | Target User | Trade Range | Vibe |
|-------|------|-------------|-------------|------|
| 0 | DEGEN FLASH | "The Moon-Bagger" (small wallets) | 0.005 – 0.1 BNB | "Total Chaos" - A few bucks moves price 10% |
| 1 | STREET FIGHT | "The Trader" (active battlers) | 0.1 – 1.0 BNB | "The Standard" - Tug-of-war battles |
| 2 | WHALE POND | "The Shark" (serious money) | 1.0 – 5.0+ BNB | "Serious Stakes" - Low slippage for accuracy |

Contract parameter: `heatLevel: uint8` (0, 1, or 2)

---

## ⚙️ Environment Variables

```env
# WalletConnect (REQUIRED)
VITE_WALLETCONNECT_PROJECT_ID=your-project-id

# The Graph (jnglz-testnet-fresh v3.0.0)
VITE_SUBGRAPH_URL=https://gateway.thegraph.com/api/subgraphs/id/3XxbwnAdLjsRWR3DeKJFbjjnahwMuDiG5H5qMuriDGcC

# Network Switch (ONE variable to switch networks!)
# true = BNB Testnet (Chain ID: 97)
# false = BNB Mainnet (Chain ID: 56)
VITE_IS_TESTNET=true

# Testnet Config
VITE_TESTNET_CONTRACT_ADDRESS=0xC97FB434B79e6c643e0320fa802B515CedBA95Bf
VITE_TESTNET_SUBGRAPH_URL=https://gateway.thegraph.com/api/subgraphs/id/...

# Mainnet Config (fill when deploying to mainnet)
VITE_MAINNET_CONTRACT_ADDRESS=
VITE_MAINNET_SUBGRAPH_URL=

# Admin addresses (comma-separated MultiSig signers)
VITE_ADMIN_ADDRESSES=0x4Cca77ba15B0D85d7B733E0838a429E7bEF42DD2,...
```

---

## 📦 Key Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| react | ^19.x | UI library |
| wagmi | ^3.x | Web3 React hooks |
| viem | ^2.x | Ethereum client |
| @rainbow-me/rainbowkit | ^2.x | Wallet modal |
| @tanstack/react-query | ^5.x | Server state |
| @apollo/client | ^4.x | GraphQL client |
| react-hook-form | ^7.x | Forms |
| zod | ^4.x | Validation |
| tailwindcss | ^3.x | Styling |
| react-router-dom | ^7.x | Routing |

---

## 🚨 Known Issues & Solutions

### 1. Apollo Client v4 Import
```typescript
// ❌ Wrong
import { ApolloProvider } from '@apollo/client';

// ✅ Correct
import { ApolloProvider } from '@apollo/client/react';
```

### 2. Phantom Wallet Stuck on Wrong Network
- **Problem**: Phantom doesn't support BNB Chain, users get stuck
- **Solution**: `useChainValidation` hook + `WrongNetworkModal` always shows disconnect button

### 3. BigDecimal vs BigInt
- **Problem**: Subgraph returns `BigDecimal` as strings, not wei
- **Solution**: `formatBNB()` handles both `bigint` and `string` inputs

### 4. Bond Fee Buffer (FIXED in v0.4.0)
- **Problem**: Contract takes 0.3% fee from bond deposit, causing InsufficientBond errors
- **Solution**: Add 0.5% buffer: `bondAmount = baseBond * 1005n / 1000n`

### 5. Dispute ABI Mismatch (FIXED in v0.4.0)
- **Problem**: Frontend ABI had `dispute(marketId, proofLink)` but contract only takes `marketId`
- **Solution**: Fixed ABI in `contracts.ts`, removed proofLink from `useDispute` hook

---

## 🆕 Recent Changes (v0.7.32 - v0.7.34)

### v0.7.34 - Cross-Direction Sell Fix
- **Fixed** transaction failures when switching between YES/NO after partial sells
- Now refetches `useMaxSellableShares` for both directions after any trade
- Pool liquidity changes affect both sides - data must stay in sync

### v0.7.33 - TradePanel UX & Documentation Overhaul
- **Sell Messages**: Fixed misleading partial sell warnings
  - "EXITING FULL POSITION" - selling entire position
  - "SELLING MAXIMUM POSSIBLE" - pool-limited sales
- **Direction Switch**: Clears amount, shows "no shares to sell" message when applicable
- **Slippage Input**: Fixed multi-digit value truncation (50→5 bug)
- **Decimal Precision**: Increased sell estimates to 6 decimals for accuracy
- **Fee Display**: Added "Fee (1.5% included)" line for sell transactions
- **How To Play**: Added 4 new sections (One-Sided Markets, Emergency Refund, Finalization, Pool Liquidity)

### v0.7.32 - ABI Mismatch Fix
- **Fixed** users unable to see their shares in TradePanel
- **Fixed** SELL button not accessible due to position data being undefined
- **Root cause**: Frontend ABI expected 7 return values from `getPosition`, but deployed contract returns 6

### v0.7.31 - Contract v3.8.1 Integration
- **New hook**: `useContractPaused` - Reads contract pause state for emergency refunds
- **Jury Fees**: Per-market claiming UI in Portfolio
- **Tie Finalization**: New button for ties requiring manual finalization

---

## 📚 Resources
