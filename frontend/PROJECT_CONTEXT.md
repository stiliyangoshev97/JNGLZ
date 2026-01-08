# 📋 Junkie.Fun - Frontend Project Context

> Quick reference for AI assistants and developers.  
> **Last Updated:** January 8, 2026  
> **Status:** Phase 2 Complete (Contract Integration)

---

## 🎯 Platform Overview

**Junkie.Fun** is a decentralized prediction market platform with a **"High-Energy Brutalism"** aesthetic (trading terminal × street market) where users can:
- Create prediction markets (free)
- Trade YES/NO shares with native BNB
- View real-time prices via bonding curve
- Resolve markets via Street Consensus (bettors vote)
- Claim winnings after resolution

---

## 🚀 Testnet Configuration

### Contract (BNB Testnet - Chain ID: 97)
| Item | Value |
|------|-------|
| PredictionMarket (v2.5.0) | `0x3988808940d027a70FE2D0938Cf06580bbad19F9` |
| Treasury | `0xc21Ca5BA47cF1C485DE33b26D9Da3d10ACcDa413` |
| BscScan | https://testnet.bscscan.com/address/0x3988808940d027a70FE2D0938Cf06580bbad19F9 |

### Subgraph (The Graph)
| Item | Value |
|------|-------|
| GraphQL Endpoint | `https://api.studio.thegraph.com/query/1722665/junkiefun-bnb-testnet/0.0.2` |
| Studio Dashboard | https://thegraph.com/studio/subgraph/junkiefun-bnb-testnet |

### Environment Variables (.env)
```env
# BNB Testnet
VITE_CONTRACT_ADDRESS=0x3988808940d027a70FE2D0938Cf06580bbad19F9
VITE_SUBGRAPH_URL=https://api.studio.thegraph.com/query/1722665/junkiefun-bnb-testnet/0.0.2
VITE_CHAIN_ID=97
VITE_WALLETCONNECT_PROJECT_ID=<your-project-id>
VITE_ADMIN_ADDRESSES=0x4Cca77ba15B0D85d7B733E0838a429E7bEF42DD2,0xC119B9152afcC5f40C019aABd78A312d37C63926,0x6499fe8016cE2C2d3a21d08c3016345Edf3467F1
```

---

## 📊 Current Status

| Component | Progress | Notes |
|-----------|----------|-------|
| Project Setup | ✅ 100% | Vite + React 19 + TypeScript |
| Tailwind Theme | ✅ 100% | "High-Energy Brutalism" - black bg, harsh borders |
| Base UI Components | ✅ 100% | Button, Card, Modal, Input, Badge, HeatBar, ChanceDisplay |
| Web3 Integration | ✅ 100% | Wagmi + RainbowKit (brutalist theme) |
| Providers Setup | ✅ 100% | Query, Web3, GraphQL |
| Router Setup | ✅ 100% | React Router with lazy loading |
| Chain Validation | ✅ 100% | WrongNetworkModal, prevents Phantom stuck issue |
| Schemas (Zod) | ✅ 100% | Market, Trade, Position, User |
| GraphQL Queries | ✅ 100% | All queries match subgraph schema |
| Markets Page | ✅ 100% | Grid, filters, live ticker |
| Market Detail Page | ✅ 100% | Chart, trade panel, resolution panel |
| Create Market Page | ✅ 100% | Fully wired to contract |
| Portfolio Page | ✅ 100% | Positions grid with claim UI |
| Contract Read Hooks | ✅ 100% | Prices, positions, previews, bonds |
| Contract Write Hooks | ✅ 100% | Create, trade, resolve, claim |
| Trade Panel | ✅ 100% | Buy/sell wired to contract |
| Resolution Panel | ✅ 100% | Propose, dispute, vote, claim |
| Supabase (Comments) | ⬜ 0% | Future phase |

**Overall Progress: ~90% (Contract integration complete, comments pending)**

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
│   │   ├── useContractReads.ts   # Price, position, preview hooks
│   │   └── useContractWrites.ts  # Trade, create, resolve hooks
│   ├── schemas/           # Zod schemas
│   └── utils/             # cn(), formatters
├── providers/
│   ├── Web3Provider.tsx   # Wagmi + RainbowKit (brutalist theme)
│   ├── QueryProvider.tsx  # React Query
│   ├── GraphQLProvider.tsx # Apollo Client
│   └── index.ts
├── router/
│   ├── Header.tsx         # Navigation
│   ├── RootLayout.tsx     # Layout wrapper
│   ├── routes.tsx         # Route definitions
│   └── index.ts
├── App.tsx
├── main.tsx
└── index.css              # Global styles, fonts, animations
```
├── App.tsx
├── main.tsx
└── index.css
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
| `/create` | CreateMarketPage | ✅ UI Complete |
| `/portfolio` | PortfolioPage | ✅ Complete |

---

## ⚙️ Environment Variables

```env
# WalletConnect (REQUIRED)
VITE_WALLETCONNECT_PROJECT_ID=your-project-id

# The Graph
VITE_SUBGRAPH_URL=https://api.studio.thegraph.com/query/1722665/junkiefun-bnb-testnet/0.0.2

# Contract
VITE_CONTRACT_ADDRESS=0x3988808940d027a70FE2D0938Cf06580bbad19F9

# Chain (97 = testnet, 56 = mainnet)
VITE_CHAIN_ID=97
VITE_ENABLE_TESTNET=true

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

---

## 📚 Resources

- [Wagmi Documentation](https://wagmi.sh/)
- [RainbowKit Documentation](https://www.rainbowkit.com/docs)
- [Apollo Client](https://www.apollographql.com/docs/react/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [The Graph](https://thegraph.com/docs/)
