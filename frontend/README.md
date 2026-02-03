# 🌴 JNGLZ.FUN - Frontend

> React 19 + TypeScript frontend for the JNGLZ.FUN prediction market platform.  
> **"High-Energy Brutalism"** - Trading terminal meets street market aesthetic.

[![React](https://img.shields.io/badge/react-19.0-blue)]()
[![TypeScript](https://img.shields.io/badge/typescript-5.x-blue)]()
[![Vite](https://img.shields.io/badge/vite-6.x-purple)]()
[![Tailwind](https://img.shields.io/badge/tailwind-3.4-cyan)]()

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 🔌 Environment Variables

Create a `.env` file in the root:

```env
# Network Switch (true = testnet, false = mainnet)
VITE_IS_TESTNET=true

# BNB Testnet (v3.8.3)
VITE_TESTNET_CONTRACT_ADDRESS=0xC97FB434B79e6c643e0320fa802B515CedBA95Bf
VITE_TESTNET_SUBGRAPH_URL=https://gateway.thegraph.com/api/subgraphs/id/3XxbwnAdLjsRWR3DeKJFbjjnahwMuDiG5H5qMuriDGcC

# BNB Mainnet (not deployed yet)
VITE_MAINNET_CONTRACT_ADDRESS=
VITE_MAINNET_SUBGRAPH_URL=

# Shared Config
VITE_GRAPH_API_KEY=<your-graph-api-key>
VITE_WALLETCONNECT_PROJECT_ID=<your-project-id>
VITE_ADMIN_ADDRESSES=0x4Cca77ba15B0D85d7B733E0838a429E7bEF42DD2,0xC119B9152afcC5f40C019aABd78A312d37C63926,0x6499fe8016cE2C2d3a21d08c3016345Edf3467F1

# Supabase (Chat & Moderation)
VITE_SUPABASE_URL=https://rbizamxghqaqskvdjfrg.supabase.co
VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>

# Maintenance Mode
VITE_MAINTENANCE_MODE=false
```

---

## 📊 PREDATOR POLLING ENGINE v2

> **Intelligent polling system that reduces API calls by 80-95%.**  
> The Graph has limits of 100,000 queries/month (production), 3,000/day (development).

### 🦁 Core Philosophy

Predator v2 polls like a jungle predator: **patient when idle, lightning-fast when prey is spotted**.

| Scenario | Old System | Predator v2 | Savings |
|----------|------------|-------------|---------|
| Resolved market (1hr) | 240 queries | 0 queries | **100%** |
| Cold market (1hr) | 240 queries | 12 queries | **95%** |
| Markets list (1hr) | 120 queries | 40 queries | **67%** |
| PriceChart (1hr) | 60 queries | 0 queries | **100%** |
| Tab hidden (1hr) | ~300 queries | 0 queries | **100%** |

---

### 🎛️ Polling Interval Constants

Located in: `src/shared/hooks/useSmartPolling.ts`

```typescript
export const POLL_INTERVALS = {
  // Market-state aware intervals
  HOT: 15000,        // 15s - Active market (trade in last 5 min)
  WARM: 60000,       // 60s - Market with trades in last hour
  COLD: 300000,      // 5min - No trades in 1+ hour
  WATCHING: 30000,   // 30s - Expired, awaiting resolution
  RESOLVED: 0,       // NEVER poll - market is done
  
  // Page-specific intervals
  MARKET_LIST: 90000,   // 90s - Homepage grid (was 30s)
  PORTFOLIO: 120000,    // 2min - User positions (was 60s)
  TICKER: 0,            // NEVER poll - fetches ONCE on load
  
  // Legacy/System
  DISABLED: 0,          // For hidden tabs
};
```

---

### 🔥 Temperature-Based Polling (Market Detail)

The market detail page uses **temperature-based** polling that adapts to market activity:

| Temperature | Condition | Poll Interval |
|-------------|-----------|---------------|
| 🔥 **HOT** | Trade within 5 minutes | 15 seconds |
| 🌡️ **WARM** | Trade within 1 hour | 60 seconds |
| ❄️ **COLD** | No trades in 1+ hour | 5 minutes |
| 👁️ **WATCHING** | Expired, awaiting resolution | 30 seconds |
| 💀 **RESOLVED** | Market is done | **NEVER** |

#### Trade-Triggered Mode Switch

When a user makes a trade, the market instantly switches to **HOT** mode for 2 minutes:

```typescript
// After successful trade:
triggerHotMode();      // Switch to 15s polling for 2 minutes
triggerTradeRefetch(); // Wait 3s for subgraph, then refetch
```

---

### 📄 Polling by Page/Component

#### 1️⃣ Markets Page (`/` - Homepage)

| Query | Interval | Purpose |
|-------|----------|---------|
| `GET_MARKETS` | **90 seconds** | Fetch all markets for grid |
| `GET_RECENT_TRADES` | **ONCE** (no polling) | Live ticker at top |

**File:** `src/features/markets/pages/MarketsPage.tsx`

```typescript
// Focus refetch: re-fetches when tab regains focus
const { isVisible } = useFocusRefetch(refetch);
const pollInterval = isVisible ? POLL_INTERVALS.MARKET_LIST : 0;  // 90s or disabled

// Ticker: fetches ONCE on load, no polling
const { data: tickerData } = useQuery(GET_RECENT_TRADES);  // No pollInterval!
```

---

#### 2️⃣ Market Detail Page (`/market/:marketId`)

| Query | Interval | Purpose |
|-------|----------|---------|
| `GET_MARKET` | **Dynamic (15s-5min)** | Single market data |

**File:** `src/features/markets/pages/MarketDetailPage.tsx`

```typescript
// Temperature-based polling
const { pollInterval, triggerHotMode } = useMarketPollInterval(
  market,
  lastTradeTimestamp,
  refetch
);

// Manual interval management
useEffect(() => {
  if (pollInterval > 0) {
    const intervalId = setInterval(refetch, pollInterval);
    return () => clearInterval(intervalId);
  }
}, [pollInterval, refetch]);

// After trade success:
const refreshMarket = () => {
  triggerTradeRefetch();  // 3s delay for subgraph
  triggerHotMode();       // Switch to HOT for 2 minutes
};
```

---

#### 3️⃣ Price Chart Component (NO OWN POLLING)

| Query | Interval | Purpose |
|-------|----------|---------|
| `GET_MARKET_TRADES` | **NONE** | Receives data from parent |

**File:** `src/features/markets/components/PriceChart.tsx`

```typescript
// Predator v2: NO own polling - receives trades from parent
interface PriceChartProps {
  marketId: string;
  trades?: Trade[];  // From parent (MarketDetailPage)
}

// Parent passes trades, no duplicate queries:
<PriceChart marketId={market.id} trades={trades} />
```

---

#### 4️⃣ Portfolio Page (`/portfolio`)

| Query | Interval | Purpose |
|-------|----------|---------|
| `GET_USER_POSITIONS` | **2 minutes** (active tab only) | User's positions |
| `GET_MARKETS_BY_CREATOR` | **2 minutes** (active tab only) | Markets created by user |
| `GET_USER_TRADES` | **ONCE** (no polling) | Historical trades for P/L |

**File:** `src/features/portfolio/pages/PortfolioPage.tsx`

```typescript
// Predator v2.1: Only poll the ACTIVE tab (positions OR my-markets, not both)
const basePollInterval = useSmartPollInterval(POLL_INTERVALS.PORTFOLIO);
const positionsPollInterval = viewMode === 'positions' ? basePollInterval : 0;
const myMarketsPollInterval = viewMode === 'my-markets' ? basePollInterval : 0;

// Trades: fetch ONCE - historical data doesn't need polling
const { data: tradesData } = useQuery(GET_USER_TRADES);  // No pollInterval!

const { data } = useQuery(GET_USER_POSITIONS, { pollInterval });
```

---

### 🧠 Smart Polling Features

#### 1️⃣ Tab Visibility Detection

Polling **stops completely** when the browser tab is hidden:

```typescript
export function usePageVisibility(): boolean {
  const [isVisible, setIsVisible] = useState(!document.hidden);
  
  useEffect(() => {
    const handleVisibilityChange = () => setIsVisible(!document.hidden);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);
  
  return isVisible;
}
```

#### 2️⃣ Focus Refetch

**One-time refetch** when tab regains focus (instead of waiting for next poll):

```typescript
export function useFocusRefetch(refetchFn?: () => void) {
  // Triggers refetch immediately when tab becomes visible
  // Returns { isVisible, justBecameVisible }
}
```

#### 3️⃣ Trade Refetch (3-Second Delay)

Subgraph needs ~2-3s to index new trades. After a trade:

```typescript
const { triggerTradeRefetch } = useTradeRefetch(refetch);

// After trade success:
triggerTradeRefetch();  // Waits 3s, then refetches
```

---

### 📈 Rate Limit Calculations

#### Estimated Daily Usage (Predator v2.1)

| Scenario | Queries/Hour | With 50% Tab Active | Daily (8hr) |
|----------|--------------|---------------------|-------------|
| Markets page | 40 | 20 | **160** |
| Detail page (HOT) | 240 | 120 | **960** |
| Detail page (WARM) | 60 | 30 | **240** |
| Detail page (COLD) | 12 | 6 | **48** |
| Detail page (RESOLVED) | 0 | 0 | **0** |
| Portfolio (single tab) | 30 | 15 | **120** |
| Leaderboard | 1-5 | 1-5 | **5** |

**v2.1 Optimizations:**
- Portfolio: Only polls active tab (was 3 parallel polls = 90/hr → now 30/hr)
- Trades history: Fetches ONCE (was polling = 30/hr → now 0/hr)
- MarketDetail: Removed recovery polling overlap (saves ~6/hr)

**Realistic Usage:** 200-400 queries/day per user (down from 1600+)

---

### ⚠️ Important Notes (Predator v2.1)

1. **notifyOnNetworkStatusChange: false** - Prevents UI re-renders during background polls.

2. **Parent-Child Data Sharing** - PriceChart receives trades from MarketDetailPage, no duplicate queries.

3. **3-Second Trade Delay** - After trades, wait 3s for subgraph indexing before refetch.

4. **Resolved Markets NEVER Poll** - Zero queries for settled markets.

5. **Temperature Override** - `triggerHotMode()` forces 15s polling for 2 minutes after trades.

6. **Ticker Fetches ONCE** - Live ticker loads on page mount, no continuous polling.

7. **Portfolio Active Tab Only** - Only the visible tab (positions/my-markets) polls, not both.

8. **Trades History Static** - Historical trades fetch once, no polling needed.

---

### 🔧 Adjusting Intervals

To change intervals, modify `src/shared/hooks/useSmartPolling.ts`:

```typescript
export const POLL_INTERVALS = {
  HOT: 15000,           // HOT markets (recent trade)
  WARM: 60000,          // WARM markets (trade in hour)
  COLD: 300000,         // COLD markets (no activity)
  WATCHING: 30000,      // Expired, awaiting resolution
  RESOLVED: 0,          // Never poll
  MARKET_LIST: 90000,   // Homepage grid
  PORTFOLIO: 120000,    // User positions
  TICKER: 0,            // Fetch once, no polling
};
```

**Recommended Ranges:**
| Interval | Min | Default | Max |
|----------|-----|---------|-----|
| HOT | 10s | 15s | 30s |
| WARM | 30s | 60s | 120s |
| COLD | 2min | 5min | 10min |
| MARKET_LIST | 60s | 90s | 2min |
| PORTFOLIO | 60s | 2min | 5min |

---

## 🏗️ Architecture Overview

```
src/
├── features/
│   ├── markets/
│   │   ├── components/    # MarketCard, TradePanel, LiveTicker, PriceChart
│   │   ├── pages/         # MarketsPage, MarketDetailPage
│   │   └── index.ts
│   ├── create/
│   │   ├── pages/         # CreateMarketPage
│   │   └── index.ts
│   ├── portfolio/
│   │   ├── components/    # PositionCard
│   │   ├── pages/         # PortfolioPage
│   │   └── index.ts
│   └── legal/
│       ├── pages/         # TermsPage
│       └── index.ts
├── shared/
│   ├── api/               # GraphQL queries + types
│   ├── components/
│   │   ├── ui/            # Button, Card, Modal, Input, Badge, etc.
│   │   └── layout/        # Header, Footer
│   ├── hooks/             # useContract*, useSmartPolling, etc.
│   ├── schemas/           # Zod schemas for validation
│   └── utils/             # Formatters, helpers
└── main.tsx               # Entry point with providers
```

---

## 🎨 Design System

**Theme:** High-Energy Brutalism (trading terminal × street market)

| Element | Style |
|---------|-------|
| Background | Pure black (`#000`) |
| Cards | Dark with harsh borders |
| Accent | Cyber cyan (`#00FFD1`) |
| YES | Green (`#00FF00`) |
| NO | Red (`#FF0044`) |
| Borders | 2px solid, sharp corners |
| Font | Mono for data, bold uppercase headings |

---

## 📦 Key Dependencies

| Package | Purpose |
|---------|---------|
| `react` | UI framework (v19) |
| `wagmi` | Ethereum hooks |
| `viem` | Ethereum utilities |
| `@rainbow-me/rainbowkit` | Wallet connection |
| `@apollo/client` | GraphQL client |
| `react-router-dom` | Routing |
| `tailwindcss` | Styling |
| `zod` | Schema validation |

---

## 📚 Related Documentation

- [Smart Contract README](../contracts/README.md) - Full contract documentation
- [Subgraph README](../subgraph/README.md) - GraphQL schema
- [Project Context](./PROJECT_CONTEXT.md) - Detailed frontend architecture
- [Changelog](./CHANGELOG.md) - Version history

---

## 🔗 Deployed URLs

| Environment | URL |
|-------------|-----|
| Production | TBD |
| Testnet | http://localhost:5173 (local dev) |

---

## 📈 Version

**Current:** 0.7.31 (Contract v3.8.1 Integration + Jury Fees Claiming)
