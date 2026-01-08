# 📋 Junkie.Fun - Frontend Project Context

> Quick reference for AI assistants and developers.  
> **Last Updated:** January 8, 2026  
> **Status:** Not Started

---

## 🎯 Platform Overview

**Junkie.Fun** is a decentralized prediction market platform with a **retrowave/90s hacker** aesthetic where users can:
- Create prediction markets (free)
- Trade YES/NO shares with native BNB
- View real-time prices via bonding curve
- Resolve markets via Street Consensus (bettors vote)
- Claim winnings after resolution

---

## 🚀 Contract Addresses (BNB Testnet)

| Contract | Address | Notes |
|----------|---------|-------|
| PredictionMarket (v2.4.0) | `0xD69400C9B9ac5Bdd86FB41bA9F8A800f5327aCe9` | Latest with imageUrl |
| Treasury | `0xc21Ca5BA47cF1C485DE33b26D9Da3d10ACcDa413` | Platform fees |

**BscScan:** https://testnet.bscscan.com/address/0xD69400C9B9ac5Bdd86FB41bA9F8A800f5327aCe9

---

## 📊 Current Status

| Component | Progress | Notes |
|-----------|----------|-------|
| Project Setup | ⬜ 0% | Vite not initialized yet |
| Tailwind Theme | ⬜ 0% | Retrowave/90s hacker colors |
| Base UI Components | ⬜ 0% | Button, Card, Modal, Input |
| Web3 Integration | ⬜ 0% | Wagmi + RainbowKit |
| Providers Setup | ⬜ 0% | Query, Web3 |
| Router Setup | ⬜ 0% | React Router |
| Home Page | ⬜ 0% | Hero, featured markets |
| Markets Page | ⬜ 0% | List with filters |
| Market Detail Page | ⬜ 0% | Trade panel, chart |
| Create Market Page | ⬜ 0% | Form with validation |
| Portfolio Page | ⬜ 0% | User's positions |
| GraphQL Integration | ⬜ 0% | Queries from The Graph |

**Overall Progress: 0%**

---

## 🏗️ Architecture

### Feature-Based Structure
```
src/
├── features/
│   ├── markets/
│   │   ├── api/           # GraphQL queries, contract writes
│   │   ├── components/    # MarketCard, TradePanel, etc.
│   │   ├── hooks/         # useMarkets, useMarket, useTrade
│   │   ├── pages/         # MarketsPage, MarketDetailPage
│   │   └── types/
│   ├── home/
│   │   ├── components/    # HeroSection, FeaturedMarkets
│   │   └── pages/         # HomePage
│   ├── create/
│   │   ├── components/    # CreateMarketForm
│   │   └── pages/         # CreateMarketPage
│   └── portfolio/
│       ├── components/    # PositionCard
│       └── pages/         # PortfolioPage
├── shared/
│   ├── api/               # GraphQL client
│   ├── components/ui/     # Button, Card, Modal, Input, etc.
│   ├── config/            # wagmi, env, contracts
│   ├── hooks/             # Shared hooks
│   ├── schemas/           # Zod schemas
│   ├── types/             # Shared TypeScript types
│   └── utils/             # cn(), formatters, etc.
├── providers/
│   ├── Web3Provider.tsx
│   ├── QueryProvider.tsx
│   └── index.ts
├── router/
│   └── index.tsx
├── App.tsx
├── main.tsx
└── index.css
```

---

## 🎨 Design System (Retrowave/90s Hacker Theme)

### Color Palette
```javascript
colors: {
  // Neon accents
  neon: {
    pink: '#FF00FF',      // Magenta
    cyan: '#00FFFF',      // Cyan
    purple: '#9D00FF',    // Purple
    green: '#00FF00',     // Matrix green
  },
  // Backgrounds
  dark: {
    900: '#0A0A0F',       // Darkest (main bg)
    800: '#12121A',       // Cards
    700: '#1A1A25',       // Elevated
    600: '#252532',       // Borders
  },
  // Text
  text: {
    primary: '#FFFFFF',
    secondary: '#A0A0B0',
    muted: '#606070',
  },
  // Status
  success: '#00FF00',
  error: '#FF0055',
  warning: '#FFAA00',
}
```

### Typography
- Headers: "Press Start 2P" or "VT323" (pixel/retro fonts)
- Body: "Space Mono" or "JetBrains Mono"

### Effects
- Neon glow on hover (box-shadow with neon colors)
- Subtle scanlines overlay (optional)
- Grid/matrix background patterns
- Gradient borders

---

## 🔗 Data Sources

### The Graph (GraphQL)
Primary data source for:
- Market listings
- Trade history
- User positions
- Volume statistics

### Smart Contract (Direct Reads)
For real-time data:
- Current prices (getYesPrice, getNoPrice)
- User balances
- Market state

### Smart Contract (Writes via Wagmi)
- createMarket()
- buyYes() / buyNo()
- sellYes() / sellNo()
- assertOutcome()
- claim()

---

## 🪝 Custom Hooks Pattern

### Query Key Factory
```typescript
export const marketKeys = {
  all: ['markets'] as const,
  lists: () => [...marketKeys.all, 'list'] as const,
  list: (filters: MarketFilters) => [...marketKeys.lists(), filters] as const,
  details: () => [...marketKeys.all, 'detail'] as const,
  detail: (id: string) => [...marketKeys.details(), id] as const,
};
```

### Hook Example
```typescript
export function useMarkets(filters: MarketFilters = {}) {
  return useQuery({
    queryKey: marketKeys.list(filters),
    queryFn: () => fetchMarkets(filters),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}
```

---

## 🧩 UI Components (Variant-Based)

### Button Variants
```typescript
const variants = {
  primary: 'bg-neon-pink text-white hover:shadow-neon-pink',
  secondary: 'bg-dark-700 text-white hover:bg-dark-600',
  danger: 'bg-error text-white hover:brightness-110',
  ghost: 'bg-transparent text-neon-cyan hover:bg-dark-800',
  outline: 'border border-neon-cyan text-neon-cyan hover:bg-neon-cyan/10',
};
```

### Card Variants
```typescript
const variants = {
  default: 'bg-dark-800 border border-dark-600',
  hover: 'bg-dark-800 border border-dark-600 hover:border-neon-pink transition-all',
  glow: 'bg-dark-800 border border-neon-pink shadow-neon',
};
```

---

## 🛣️ Routes

| Path | Page | Description |
|------|------|-------------|
| `/` | HomePage | Hero, featured markets, how it works |
| `/markets` | MarketsPage | All markets with filters |
| `/markets/:id` | MarketDetailPage | Single market, trade panel |
| `/create` | CreateMarketPage | Create new market form |
| `/portfolio` | PortfolioPage | User's positions |

---

## ⚙️ Environment Variables

```env
# Wallet Connect
VITE_WALLETCONNECT_PROJECT_ID=

# The Graph
VITE_SUBGRAPH_URL=

# Contract Addresses
VITE_PREDICTION_MARKET_ADDRESS=

# Chain (97 for testnet, 56 for mainnet)
VITE_CHAIN_ID=97

# Enable testnet in production
VITE_ENABLE_TESTNET=true
```

---

## 📦 Key Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| react | ^19.x | UI library |
| wagmi | ^2.x | Web3 React hooks |
| viem | ^2.x | Ethereum client |
| @rainbow-me/rainbowkit | ^2.x | Wallet modal |
| @tanstack/react-query | ^5.x | Data fetching |
| zustand | ^5.x | Client state |
| react-hook-form | ^7.x | Forms |
| zod | ^3.x | Validation |
| tailwindcss | ^3.x | Styling |
| react-router-dom | ^7.x | Routing |

---

## 📚 Resources

- [Wagmi Documentation](https://wagmi.sh/)
- [RainbowKit Documentation](https://www.rainbowkit.com/docs)
- [TanStack Query](https://tanstack.com/query/latest)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Zustand](https://zustand-demo.pmnd.rs/)
