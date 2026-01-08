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

## [0.2.0] - 2026-01-08

### Added - Contract Integration (Phase 2 Complete)

#### Contract Read Hooks (`src/shared/hooks/useContractReads.ts`)
- `useMarketCreationFee()` - Get creation fee from contract (usually 0)
- `useYesPrice()` / `useNoPrice()` - Get current market prices
- `useMarketPrices()` - Get both prices combined
- `usePreviewBuy()` - Estimate shares received for BNB amount
- `usePreviewSell()` - Estimate BNB received for selling shares
- `usePosition()` - Get user's position (yesShares, noShares, claimed, etc.)
- `useRequiredBond()` - Get bond required for proposals
- `useMaxSellableShares()` - Get max shares sellable given pool liquidity

#### Contract Write Hooks (`src/shared/hooks/useContractWrites.ts`)
- `useCreateMarket()` - Create market (FREE, just gas)
- `useCreateMarketAndBuy()` - Create + first bet atomically (anti-frontrun)
- `useBuyYes()` / `useBuyNo()` - Buy YES/NO shares
- `useSellYes()` / `useSellNo()` - Sell YES/NO shares
- `useProposeOutcome()` - Propose market resolution with bond
- `useDispute()` - Dispute a proposal with 2× bond
- `useVote()` - Vote on disputed outcome (share-weighted)
- `useFinalizeMarket()` - Settle market after voting ends
- `useClaim()` - Claim winnings after resolution
- `useEmergencyRefund()` - Get refund if market stuck 24h+

#### Feature: Create Market (Fully Wired)
- **Removed "initial liquidity"** - Contract uses virtual shares (100 YES + 100 NO)
- Working duration presets: 1H, 6H, 1D, 3D, 7D, 30D
- Optional "First Bet" toggle with side selection (YES/NO)
- BNB amount presets: 0.01, 0.05, 0.1, 0.5, 1
- Shows FREE creation when marketCreationFee is 0
- Uses `createMarketAndBuy()` for atomic first bet
- Transaction success/error handling with BscScan links

#### Feature: Trade Panel (Fully Wired)
- Connected to `useBuyYes/No`, `useSellYes/No` hooks
- Live preview of estimated shares/BNB
- User position display with shares breakdown
- Buy presets: 0.01, 0.05, 0.1, 0.5 BNB
- Sell presets: 25%, 50%, 75%, MAX
- Loading states during wallet confirmation
- Success feedback with form reset

#### Feature: Resolution Panel (NEW - `ResolutionPanel.tsx`)
- Full Street Consensus resolution UI
- **Propose**: Outcome selection, proof URL, bond display
- **Dispute**: Counter-proof input, 2× bond requirement, time remaining
- **Vote**: Agree/Disagree buttons, vote weight display, voting progress
- **Finalize**: One-click settlement after voting ends
- **Claim**: Winning detection, claim button, success state
- **Emergency Refund**: Available after 24h timeout
- Time window displays for all phases
- Creator priority window detection (10 min head start)

### Changed
- `CreateMarketPage.tsx` - Completely rewritten to match contract mechanics
- `TradePanel.tsx` - Wired to actual contract calls with wagmi
- `TradeHistory.tsx` - Fixed field mappings (`isBuy`/`isYes` instead of `tradeType`)
- `PositionCard.tsx` - Fixed type interface, use `market.id` instead of `marketId`
- `PortfolioPage.tsx` - Fixed position type interface

### Fixed
- Schema export error (`ProposedOutcomeSchema` removed - didn't exist)
- NaN balance display in Header (added null check)
- Trade history trader address display
- Position card market ID linking

### Technical Notes
- All contract hooks use `useWriteContract` + `useWaitForTransactionReceipt`
- Read hooks use `useReadContract` with proper query enabling
- Position hook returns parsed tuple (6 values from contract)
- Preview hooks only query when amount > 0
- Form validation with Zod, proper error display

---

## Pending Features (Phase 3+)

### Supabase Integration (Not Started)
- Comments system
- User profiles
- Moderation (hide markets/comments)
- SIWE authentication

### Admin Features (Not Started)
- MultiSig wallet detection
- Hide/unhide markets
- Hide/unhide comments
