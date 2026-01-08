# Frontend Changelog

All notable changes to the JunkieFun frontend will be documented in this file.

## [0.1.0] - 2026-01-08

### Added - Initial Foundation (Phase 1 Complete)

#### Project Setup
- Initialized Vite + React 19 + TypeScript project
- Configured Tailwind CSS with "High-Energy Brutalism" theme
- Setup path aliases (`@/` → `./src`)
- Added Google Fonts: JetBrains Mono (numbers), Inter (headlines)
- Environment variables configuration (`.env`, `.env.example`)

#### Design System
- **Colors**: True black `#000000`, YES green `#39FF14`, NO red `#FF3131`, Cyber blue `#00E0FF`
- **Borders**: 1px harsh borders, NO shadows, NO rounded corners
- **Typography**: Monospace for numbers, bold sans-serif for headlines
- Custom RainbowKit brutalist theme override

#### Dependencies Installed
- `wagmi` + `viem` - Web3 interactions
- `@rainbow-me/rainbowkit` - Wallet connection UI
- `@tanstack/react-query` - Server state management
- `@apollo/client` + `graphql` - GraphQL for The Graph
- `react-router-dom` - Client-side routing
- `react-hook-form` + `@hookform/resolvers` + `zod` - Forms & validation
- `axios` - HTTP client

#### Shared Config (`src/shared/config/`)
- `env.ts` - Environment variables (CONTRACT_ADDRESS, SUBGRAPH_URL, CHAIN_ID, ADMIN_ADDRESSES)
- `wagmi.ts` - Wagmi + RainbowKit config with `isChainSupported()` helper
- `contracts.ts` - PredictionMarket ABI + address
- `graphql.ts` - Apollo Client for The Graph subgraph

#### Shared Utils (`src/shared/utils/`)
- `cn.ts` - Class name utility (clsx + tailwind-merge)
- `format.ts` - formatAddress, formatBNB, formatShares, formatPercent, formatTimeRemaining, formatVolume
- `jazzicon.ts` - Generate deterministic wallet avatars (CSS gradients)

#### UI Components (`src/shared/components/ui/`)
- `Button.tsx` - Variants: yes, no, cyber, ghost; Sizes: sm, md, lg
- `Card.tsx` - Variants: default, hover, hype-yes, hype-no
- `Input.tsx` - Terminal-style with label/error/helperText
- `Badge.tsx` - Variants: yes, no, whale, admin, neutral, active, expired, disputed
- `Modal.tsx` - Dark overlay, harsh borders, portal-based
- `Spinner.tsx` - Matrix-style loading, LoadingDots, LoadingOverlay, Skeleton
- `HeatBar.tsx` - Liquidity gauge, SplitHeatBar, VolumeHeat
- `ChanceDisplay.tsx` - Big glowing percentage, CompactChance, PriceDisplay, LiveChance
- `Jazzicon.tsx` - CSS gradient-based wallet avatars

#### Chain Validation (Critical Feature)
- `useChainValidation.ts` - Hook for chain validation
- `WrongNetworkModal.tsx` - Modal + Banner for wrong network
- Always shows disconnect button even on wrong network
- Prevents Phantom wallet stuck-disconnect issue

#### Schemas (`src/shared/schemas/`)
- `market.schemas.ts` - Market entity, status, filters, create input
- `trade.schemas.ts` - Trade entity, types, preview
- `position.schemas.ts` - Position entity, portfolio summary
- `user.schemas.ts` - User entity, badges, admin check

#### GraphQL Queries (`src/shared/api/`)
- `markets.queries.ts` - GET_MARKETS, GET_MARKET, GET_ACTIVE_MARKETS, GET_TRENDING_MARKETS, etc.
- `trades.queries.ts` - GET_RECENT_TRADES, GET_MARKET_TRADES, GET_USER_TRADES, GET_TICKER_TRADES
- `positions.queries.ts` - GET_USER_POSITIONS, GET_CLAIMABLE_POSITIONS, GET_MARKET_POSITIONS
- `stats.queries.ts` - GET_GLOBAL_STATS, GET_USER_STATS, GET_LEADERBOARD
- `types.ts` - TypeScript interfaces for all GraphQL responses

#### Providers (`src/providers/`)
- `QueryProvider.tsx` - React Query with default options
- `Web3Provider.tsx` - Wagmi + RainbowKit with custom brutalist theme
- `GraphQLProvider.tsx` - Apollo Provider for The Graph

#### Router (`src/router/`)
- `Header.tsx` - Navigation with logo, nav links, wallet connect, mobile nav
- `RootLayout.tsx` - Layout wrapper with WrongNetworkModal/Banner, footer
- `routes.tsx` - React Router config with lazy-loaded pages

#### Feature: Markets
- `MarketsPage.tsx` - Homepage with market grid, filters, live ticker, stats
- `MarketDetailPage.tsx` - "War Room" with chart, trade panel, history
- `MarketCard.tsx` - Grid card with chance %, heat bar, grayscale→color hover
- `LiveTicker.tsx` - Scrolling trade tape
- `TradePanel.tsx` - YES/NO trading interface (UI only, no contract calls yet)
- `TradeHistory.tsx` - Recent trades list
- `PriceChart.tsx` - Placeholder chart with scanner line animation

#### Feature: Portfolio
- `PortfolioPage.tsx` - User positions grid with stats
- `PositionCard.tsx` - Position display with P/L

#### Feature: Create
- `CreateMarketPage.tsx` - Market creation form (UI only, no contract calls yet)

### Technical Notes
- All GraphQL queries updated to match actual subgraph schema
- Field mappings: `expiryTimestamp` (not `expirationTimestamp`), `poolBalance` (not `liquidity`), `evidenceLink` (not `evidenceUrl`)
- `formatBNB()` handles both BigInt (wei) and string (BigDecimal from subgraph)
- Apollo Client v4 requires imports from `@apollo/client/react`

---

## Pending Features (Phase 2+)

### Contract Interaction Hooks (Not Started)
- useBuyYes, useBuyNo, useSellYes, useSellNo
- usePreviewTrade
- useCreateMarket
- useProposeOutcome, useDispute, useVote
- useClaim, useEmergencyRefund

### Supabase Integration (Not Started)
- Comments system
- User profiles
- Moderation (hide markets/comments)
- SIWE authentication

### Admin Features (Not Started)
- MultiSig wallet detection
- Hide/unhide markets
- Hide/unhide comments
