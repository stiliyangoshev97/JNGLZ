# Frontend Changelog

All notable changes to the JunkieFun frontend will be documented in this file.

## [0.5.2] - 2026-01-09

### Fixed
- **Max Sell Calculation**: Fixed `getMaxSellableShares` ABI - was missing `userShares` parameter
  - ABI now correctly includes `(marketId, userShares, isYes)` signature
  - `useMaxSellableShares` hook updated with correct parameters
  - Sell preset buttons (25%, 50%, 75%, MAX) now respect pool liquidity limits

### Added
- **Pool Liquidity Warning**: Shows warning when pool can't cover full sell
  - Displays max sellable shares and estimated BNB return
  - Explains remaining shares will still pay out if user's side wins

- **Improved Sell Messages**:
  - "Selling All Shares" warning: Clear explanation that user exits position
  - "Partial Sell" info: Explains remaining shares stay for potential payout

### Changed
- **Market Redirect Timing**: Increased to 5s for subgraph indexing
- **Market Detail Page**: Added retry mechanism (10 retries, 3s apart) for newly created markets
- **Loading States**: Added "SYNCING FROM BLOCKCHAIN" message during retries

---

## [0.5.1] - 2026-01-09

### Added

#### Heat Level Selector (Create Market Page)
- **New Heat Level UI** with rich descriptions:
  - ☢️ **DEGEN FLASH** - "The Moon-Bagger" (0.005 – 0.1 BNB) - "Total Chaos"
  - 🔥 **STREET FIGHT** - "The Trader" (0.1 – 1.0 BNB) - "The Standard"
  - 🧊 **WHALE POND** - "The Shark" (1.0 – 5.0+ BNB) - "Serious Stakes"
- Each option shows target user, trade range, and expandable "vibe" description
- Color-coded borders (red/yellow/cyan)

#### Contract Integration
- Added `heatLevel` parameter to `useCreateMarket` and `useCreateMarketAndBuy` hooks
- Updated ABI with `heatLevel: uint8` for both createMarket functions

### Changed
- **Terminology**: Replaced "bet" with "trade" throughout UI
  - "Min Bet" → "Min Trade"
  - "First Bet" → "First Trade"
  - Form fields renamed (wantFirstTrade, firstTradeSide, firstTradeAmount)
- **Header Branding**: Fixed `JUNKIE.FUN` → `JUNKIEFUN`, now visible on mobile
- **Connect Wallet Buttons**: Portfolio and Create pages now use styled cyber button instead of RainbowKit default

### Fixed
- **Portfolio Page**: Centered Connect Wallet button (was left-aligned)
- **Create Page**: Centered Connect Wallet button
- **Trade Panel**: Already had correct centering

---

## [0.5.0] - 2026-01-09

### Added

#### Legal & Compliance
- **Entry Modal** - First-time visitor modal with:
  - 3-step "How It Works" guide (Create, Trade, Street Consensus)
  - Age verification checkbox (18+/21+)
  - Terms & Privacy acceptance requirement
  - Fee structure breakdown (Platform 1%, Creator 0.5%, Resolution 0.3%)
  - Risk disclaimer
  - Gated entry (must confirm to proceed)

- **Terms of Service Page** (`/terms`)
  - Full legal terms covering eligibility, fees, prohibited jurisdictions
  - Information protocol / gambling disclaimer
  - Risk acknowledgment section
  - Contact information

- **Privacy Policy Page** (`/privacy`)
  - Blockchain data transparency notice
  - Cookie policy (essential cookies only)
  - Third-party services disclosure
  - GDPR/CCPA compliance notes

- **Cookie Banner** - Non-intrusive bottom-right notification
  - Essential cookies only messaging
  - Link to privacy policy
  - Dismissible with localStorage persistence

#### UX Improvements
- **Smart Claim Hook** (`useSmartClaim`) - Automatically finalizes market before claiming if needed
  - Seamless UX: User clicks "Claim" once, backend handles finalize+claim
  - Step tracking: idle → finalizing → claiming → success

- **Sell Warning Tooltip** - Warning shown when selling all shares:
  - "You will not receive any payout when the market resolves"
  - Helps prevent accidental full exits

- **Portfolio Claim Button** - PositionCard now uses smart claim with loading states

### Changed
- **Branding**: Updated all instances of "Junkie.fun" to "JunkieFun" (no dot)
- **Footer Links**: Added Terms and Privacy links
- **Fee Display**: Separated into "Platform fee: 1%" and "Creator fee: 0.5%" instead of combined "Trading fee: 1.5%"

### Technical
- New legal components: `EntryModal`, `CookieBanner` in `shared/components/legal/`
- New feature: `features/legal/` with TermsPage and PrivacyPage
- Updated routes.tsx with `/terms` and `/privacy` routes
- RootLayout now includes EntryModal and CookieBanner
- Added `useSmartClaim` hook for seamless claim UX
- CSS animation `slide-up` for cookie banner

---

## [0.4.0] - 2026-01-08

### Fixed

#### Issue #6: Proposal failing with InsufficientBond
- **Root Cause**: Contract takes 0.3% fee from bond deposit, so net bond was below minimum
- **Solution**: Added 0.5% buffer to bond calculation: `bondAmount = baseBond * 1005n / 1000n`
- **File**: `ResolutionPanel.tsx`

#### Issue #7: Dispute failing with InsufficientBond
- **Root Cause 1**: Frontend ABI had wrong signature `dispute(marketId, proofLink)` but contract is `dispute(marketId)` 
- **Root Cause 2**: Dispute bond calculation wasn't using actual proposerBond from market
- **Solution**: 
  - Fixed ABI in `contracts.ts` - removed proofLink parameter
  - Updated `useDispute` hook to only pass marketId
  - Removed proofLink input field from dispute section
  - Use `market.proposerBond * 2n` plus fee buffer for dispute bond
- **Files**: `contracts.ts`, `useContractWrites.ts`, `ResolutionPanel.tsx`

#### Issue #8: Voting UI unclear
- Users didn't understand what they were voting for
- **Improvements**:
  - Show Proposer outcome (YES/NO) and Disputer outcome (opposite) with color coding
  - Added prominent "🗳️ YOUR VOTE MATTERS!" banner with vote weight
  - Added "💰 No bond required! Only pay gas (~$0.01). Correct voters share jury fees." message
  - Changed button labels from "AGREE/DISAGREE" to "VOTE YES/VOTE NO"
- **File**: `ResolutionPanel.tsx`

### Changed

#### Issue #9: Markets page filters restructured
- **Before**: Only "Active" and "All" tabs
- **After**: "Active", "Expired", and "Resolved" tabs with counts
- Changed from `GET_ACTIVE_MARKETS` to `GET_MARKETS` to fetch all markets
- Client-side filtering with `useMemo` for better UX
- Each tab shows count badge (e.g., "ACTIVE (5)")
- **File**: `MarketsPage.tsx`

#### Issue #10: Portfolio page filters restructured  
- **Before**: Static non-functional filter buttons
- **After**: Dynamic filter categories with proper state management
- **Categories**:
  - `All` - All positions
  - `Active` - Positions in non-expired, non-resolved markets
  - `Needs Action` (⚡ animated) - Positions where user can vote on disputed markets
  - `Claimable` (💰) - Resolved markets where user has winning shares
- Filter tabs only appear when relevant (Needs Action hidden if count = 0)
- Proper empty states for each filter with helpful messages
- Fixed claimable value calculation: `0.01 BNB × winning shares`
- **File**: `PortfolioPage.tsx`

### Technical Notes
- Bond fee buffer: Contract takes 0.3%, we send 0.5% extra to be safe
- Dispute bond formula: `(proposerBond * 2n * 1005n) / 1000n`
- Position categorization considers: expiry, resolution status, dispute status, hasVoted flag
- Client-side filtering maintains server data freshness while providing instant filter switching

---

## [0.2.0] - 2026-01-08

### Fixed
- **Pool Balance showing wrong value (e.g., "90000000000000000.00 BNB")**
  - Root cause: `poolBalance` from subgraph is `BigInt` in wei, but code treated it as already-converted BNB
  - Solution: Changed `parseFloat(market.poolBalance)` to `Number(BigInt(market.poolBalance)) / 1e18`
  - Fixed in: `MarketCard.tsx`, `MarketDetailPage.tsx`

- **Evidence Source and Resolution Rules not showing**
  - Root cause: Subgraph wasn't fetching these fields (fixed in subgraph v0.0.2)
  - Also updated UI to always show these sections (displays "Not provided" if empty)

- **Market images not visible**
  - Root cause: Same as above - subgraph now fetches `imageUrl` from contract
  - Images now display with grayscale filter effect on MarketCard, MarketDetailPage, and PositionCard

### Added
- **Grayscale image effect** on MarketDetailPage (matches MarketCard style)
- **Market images in Portfolio** - PositionCard now displays market images with same grayscale hover effect
- Added `imageUrl`, `yesShares`, `noShares` to position GraphQL query fragment

### Changed
- Updated subgraph URL to version `0.0.2` in `env.ts`
- Updated `POSITION_FRAGMENT` in `positions.queries.ts` to include market image and share data

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

## [0.3.0] - 2026-01-08

### Added - Error Handling & Bug Fixes

#### Error Boundary (`src/shared/components/ErrorBoundary.tsx`)
- Catches and displays runtime errors with brutalist UI
- **Chunk Load Errors** (after deployments): Shows "Update Available" with refresh button
- **General Errors**: Shows error message + stack trace (expandable) with retry/home options
- Integrated with React Router as `errorElement`
- Prevents blank screen crashes, provides actionable recovery

#### Price Calculation Fix (`src/shared/utils/format.ts`)
- **NEW**: `calculateYesPercent()` - Correct bonding curve formula with virtual liquidity
- **NEW**: `calculateNoPercent()` - Complement function
- Formula: `P(YES) = (yesShares + 100e18) / (yesShares + noShares + 200e18)`
- Matches contract's `_getYesPrice()` exactly with `VIRTUAL_LIQUIDITY = 100 * 1e18`

### Fixed

#### Critical Bug: Price Calculation Inverted (#2, #5)
- **Before**: `yesPercent = noShares / total` (WRONG - showed 0% after buying YES)
- **After**: `yesPercent = virtualYes / (virtualYes + virtualNo)` (matches contract)
- Fixed in: `MarketDetailPage.tsx`, `MarketCard.tsx`

#### Critical Bug: BigDecimal vs BigInt (#6, browser crash)
- Subgraph returns `totalVolume`, `poolBalance` as `BigDecimal` (e.g., "0.02")
- Subgraph returns `yesShares`, `noShares` as `BigInt` (e.g., "100000000000000000000")
- **Before**: Code tried `BigInt("0.02")` → crash
- **After**: Use `parseFloat()` for BigDecimal fields, `BigInt()` for BigInt fields
- Fixed in: `MarketsPage.tsx`, `MarketCard.tsx`, `MarketDetailPage.tsx`

#### Bug: Time Display Issues (#3, #4)
- Fixed `formatTimeRemaining()` being called with wrong parameter format
- Now correctly passes Unix timestamp (seconds), not duration (milliseconds)
- Fixed "ENDS EXPIRED" showing for non-expired markets

#### Bug: Image Not Displayed (#7)
- Added image rendering to `MarketDetailPage.tsx` in MarketInfo section
- MarketCard already had image support (was working if imageUrl provided)

#### Bug: Evidence Link Not Displayed (#8)
- Verified evidenceLink IS displayed in MarketInfo component
- Issue was likely empty `evidenceLink` from subgraph data

### Changed
- Reduced poll interval from 10s to 30s for trades ticker (prevents excessive refetching)
- Market detail page poll interval remains 15s for responsiveness
- Router now includes `errorElement={<ErrorBoundary />}` for global error catching

### Technical Notes
- Subgraph field types: `BigInt` = "123456..." (wei), `BigDecimal` = "0.02" (BNB)
- Always use `parseFloat()` for `totalVolume`, `bnbAmount`, `poolBalance`
- Always use `BigInt()` for `yesShares`, `noShares`, `shares`, timestamps
- Virtual liquidity constant must match contract: `100n * 10n ** 18n`

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
