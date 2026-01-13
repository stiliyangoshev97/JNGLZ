# Frontend Changelog

All notable changes to the JNGLZ.FUN frontend will be documented in this file.

## [0.7.13] - 2026-01-14

### Changed

#### Legal Pages Complete Overhaul
- **HowToPlayPage**: Removed all emojis for cleaner, professional look
- **HowToPlayPage**: Rewrote Resolution Roles section - removed "truth/lies" moralizing, now purely mechanical explanations
- **HowToPlayPage**: Rewrote Street Consensus Voting section - clear mechanics without advice on how to vote
- **HowToPlayPage**: Updated fee structure to show where each fee goes (Treasury vs Market Creator)
- **HowToPlayPage**: Fixed slippage reference values for v3.5.0 heat levels (50, 200, 500, 2000, 10000)

#### Terms of Service Major Update
- **TermsPage**: Removed all emojis
- **TermsPage**: Added Section 5 - European Union & MiCA Regulation (EEA users prohibited)
- **TermsPage**: Updated Prohibited Jurisdictions to include EEA (all 27 EU states + Iceland, Liechtenstein, Norway)
- **TermsPage**: Added Hong Kong, Macau, Crimea, Donetsk, Luhansk to prohibited list
- **TermsPage**: Added Section 12 - Protocol Fees (explicit breakdown)
- **TermsPage**: Added Section 14 - Governing Law & Disputes (BVI jurisdiction)
- **TermsPage**: Enhanced protocol description emphasizing decentralized, non-custodial, permissionless nature
- **TermsPage**: Now 15 sections (up from 12)

#### EntryModal v2.0 (Forces Re-acceptance)
- **EntryModal**: Version bumped to 2.0 - all existing users will see modal again
- **EntryModal**: Removed all emojis throughout
- **EntryModal**: Added prominent Prohibited Jurisdictions section at top (red warning box)
- **EntryModal**: Added EEA to prohibited jurisdictions list
- **EntryModal**: Added third checkbox - jurisdiction confirmation (not from prohibited areas, not using VPN)
- **EntryModal**: Updated fee structure to show destinations (Treasury vs Market Creator)
- **EntryModal**: Added "Voters on losing side: Get ZERO jury fees" to dispute scenarios
- **EntryModal**: Added VPN warning text under checkboxes
- **EntryModal**: Changed button text from "LET'S GO 🚀" to "ENTER THE JUNGLE"

### Technical
- Updated `ENTRY_ACCEPTED_VERSION` from `1.2` to `2.0`
- Added `jurisdictionConfirmed` state to EntryModal
- All three checkboxes now required to proceed
- Step icons changed from emojis to styled numbered badges

---

## [0.7.12] - 2026-01-14

### Fixed

#### Portfolio P/L Display - Only Show When Position Closed
- **Problem**: P/L was showing for open positions, misleading users with incomplete/unrealized values
- **Fix**: P/L now only displays for CLOSED positions (fully exited OR market resolved)

#### PositionCard Changes
- Open positions (has shares, market not resolved): Shows `"— (position open)"` placeholder
- Shows `"Trading: — | Resolution: —"` breakdown placeholder
- Closed positions: Normal P/L display with green/red colors and actual breakdown

#### Portfolio Summary (Header Stats) Changes  
- Total P/L now only sums from closed positions + resolved markets
- Open positions are excluded from the portfolio-wide P/L calculation
- Trading P/L only counts trades from markets where user has fully exited
- Resolution P/L only counts claims from resolved markets

#### Pending Withdrawals Banner Not Disappearing After Claim
- **Problem**: "PENDING WITHDRAWALS" banner stayed visible after claiming fees/bonds until page refresh
- **Fix**: Added `reset()` calls to mutation hooks after successful withdrawal + refetch
- Banner now disappears automatically after successful claim

#### P/L Container Height Mismatch
- **Problem**: Open position P/L container was taller than closed position container
- **Fix**: Removed extra sub-text line ("P/L available after exit...") so containers match

### Changed

#### Market Created Success Screen
- Replaced party emoji (🎉) with the JNGLZ logo (`/logo.png`)
- Logo displays at 96x96px centered above "MARKET CREATED!" text

### Technical
- Added `positionClosed` useMemo calculation in PositionCard
- Rewrote `tradingPnl` calculation in PortfolioPage to filter by closed markets
- Updated `resolutionStats` to check position closure status
- Added `reset` function usage from `useWithdrawBond` and `useWithdrawCreatorFees` hooks

---

## [0.7.11] - 2026-01-13

### Fixed

#### Realized P/L Tab (Market Detail Page) - Only Show Fully Closed Positions
- **Problem**: REALIZED P/L tab was showing traders who re-entered the market (still hold shares)
- **Fix**: Only show traders who have FULLY EXITED the market (0 YES and 0 NO shares)
- Re-entering a market removes your entry from the REALIZED P/L leaderboard until you fully exit again
- **Note**: Portfolio page P/L display unchanged - shows cumulative P/L as before

### Changed

#### Price Chart Cleanup
- Reduced line thickness from `strokeWidth="2"` to `strokeWidth="1.5"` for cleaner look
- Reduced trade dot size from `r="2"` to `r="1.5"`
- Removed glow filter, NO line (was redundant), animated circles, and scanner line
- Chart now shows only: clean green step line + subtle area fill + small dots at trade points

---

## [0.7.10] - 2026-01-13

### Fixed

#### Price Chart & Probability Calculations - CRITICAL FIX
- **ROOT CAUSE**: `calculateYesPercent()` was using hardcoded `VIRTUAL_LIQUIDITY = 100e18` instead of market's actual virtual liquidity
- Markets have different heat levels: CRACK=5e18, HIGH=20e18, PRO=50e18
- Using wrong virtual liquidity caused completely wrong percentage calculations (e.g., 83% instead of 54%)
- **Fix**: Updated `calculateYesPercent()` and `calculateNoPercent()` to accept optional `virtualLiquidity` parameter
- Updated all callers to pass market's actual `virtualLiquidity`:
  - `MarketDetailPage.tsx`
  - `MarketCard.tsx`
  - `PositionCard.tsx`
  - `PriceChart.tsx`
- Added `virtualLiquidity` to `POSITION_FRAGMENT` in GraphQL queries

### Changed

#### TradePanel Cleanup
- Removed P/L display from TradePanel (was showing incorrect values)
- P/L is already shown in Portfolio page where it's calculated correctly from realized trades
- Removed unused `userPositionData` variable

---

## [0.7.8] - 2026-01-13

### Changed

#### Fee Documentation & Transparency
- **HowToPlayPage**: Added clarification that 0.3% resolution fee is deducted from winning claims only
- Added sub-text to fee boxes: "on trades" for trading fees, "on winning claims" for resolution fee
- Added detailed explanation section clarifying when each fee is applied

#### Claim Payout Estimations
- **ResolutionPanel**: Claim section now shows NET payout (after 0.3% resolution fee deduction)
- **PositionCard**: Claim estimation now shows NET payout with "(after 0.3% fee)" note
- Users now see the exact amount they'll receive, not the gross amount

---

## [0.7.7] - 2026-01-13

### Changed

#### Real-time Form Validation
- **CreateMarketPage**: Added `mode: 'onChange'` to react-hook-form
- Image URL validation errors now appear immediately while typing
- No more waiting until form submission to see "no SVG" error

#### Resolution Economics (Detailed Breakdown)
- **Proposer Section** now shows 3 scenarios with exact BNB amounts:
  - ✓ If no one disputes (30 min): Bond back + 0.5% pool reward = Net profit
  - ⚔️ If disputed & you win vote: Bond back + 50% disputer bond + reward = Net profit
  - ✗ If disputed & you lose vote: Lose entire bond = Net loss
- **Disputer Section** now shows 2 scenarios:
  - ✓ If you win the vote (1hr voting): Bond back + 50% proposer bond = Net profit
  - ✗ If you lose the vote: Lose entire bond = Net loss
- Clear explanation of which outcome disputer is voting for (opposite of proposed)
- Exact amounts calculated from actual pool and bond values

#### Social Links Update
- **TermsPage**: Updated contact section - Twitter→X, removed GitHub, added Telegram
- **PrivacyPage**: Updated contact section - Twitter→X, removed GitHub, added Telegram
- **ErrorBoundary**: Updated "report it to us" link to use env.X_URL
- All social links now use environment variables for easy configuration

---

## [0.7.6] - 2026-01-13

### Security

#### Image URL Validation (XSS Prevention)
- **Blocked SVG image URLs** - SVG files can contain embedded JavaScript, posing XSS risk
- **Allowed formats only**: JPG, JPEG, PNG, GIF, WEBP (all safe raster formats)
- Validation applied in:
  - `CreateMarketPage.tsx` - Form validation with Zod
  - `market.schemas.ts` - Schema-level validation (defense in depth)
- Error message: "Only JPG, JPEG, PNG, GIF, and WEBP images are allowed (no SVG)"
- Updated helper text to show allowed formats

### Changed

#### UI Cleanup - Removed Emojis
- **CreateMarketPage**: Removed ⚠️ from wrong network state (replaced with 🔗)
- **CreateMarketPage**: Removed ⚠️ from resolution rules note
- **CreateMarketPage**: Removed 💡 from image upload tip
- **TermsPage**: Removed 📖 from "How to Play Guide" link

#### Footer Navigation
- Replaced "GITHUB" link with "HOW TO PLAY" in footer
- Links to `/how-to-play` page for better user guidance

---

## [0.7.5] - 2026-01-13

### Added

#### PENDING Tab Sub-Filters (Markets Page)
- **Resolution stage sub-filters** for the PENDING tab
- Sub-filters: ALL | ⏳ AWAITING | 📋 PROPOSED | ⚔️ DISPUTED | ✅ FINALIZING
- **AWAITING**: Just expired, no proposal yet
- **PROPOSED**: Has proposal, in 30min dispute window
- **DISPUTED**: Under dispute, 1hr voting period (same as VOTING)
- **FINALIZING**: Window ended, ready to finalize
- Sub-filter counts update in real-time
- Only shows sub-filters that have items

#### PENDING Tab Sub-Filters (Portfolio Page - MY POSITIONS)
- Same resolution stage sub-filters for consistency
- Sub-filters: ALL | ⏳ AWAITING | 📋 PROPOSED | ⚔️ DISPUTED | ✅ FINALIZING
- Helps users find their positions at specific resolution stages
- Color-coded: yellow (awaiting), cyan (proposed), orange (disputed), green (finalizing)

### Changed

- Pagination resets when changing pending sub-filter
- Sub-filter state resets when switching away from PENDING tab

---

## [0.7.4] - 2026-01-13

### Added

#### Markets Page Category Tabs
- **New tabs**: ALL | ACTIVE | PENDING | RESOLVED | UNRESOLVED
- Default tab: **ACTIVE** (what traders care about most)
- UNRESOLVED tab only appears if there are markets 24h+ expired without resolution
- Tab colors: ACTIVE (green), RESOLVED (green), PENDING (cyan), UNRESOLVED (red)
- Accurate counts for all categories

#### Markets Page Infinite Scroll
- Loads 20 items initially, more on scroll
- `IntersectionObserver` for smooth infinite loading
- Shows "Showing X of Y" counter while loading more
- "END OF LIST" indicator when all items loaded
- Pagination resets when changing tab or sort

#### MY MARKETS Hover Effect
- Added `group` class to MyMarketCard for grayscale → color image transition
- Now matches the hover behavior on Markets page and MY POSITIONS

### Changed

#### Markets Page Fetch Limit
- Increased from `first: 100` to `first: 500` for accurate tab counts
- Pagination is client-side (visual/UX) from pre-fetched data

#### Sort Options Cleanup
- Removed emojis from sort buttons: HOT, NEW, ENDING, LIQUID
- Sort button highlight: cyan when active (was white)

#### Tab Button Styling
- `FilterTab` component with color variants (yes/no/cyber)
- Inactive tabs with items show faded color hint
- Consistent styling with Portfolio page tabs

### Fixed

#### MY MARKETS Card Hover
- Added missing `group` class for image color transition on hover
- Changed from custom `hover:border-cyber` to `Card variant="hover"` for consistency

---

## [0.7.3] - 2026-01-13

### Added

#### New "How to Play" Page
- Created comprehensive `/how-to-play` guide with game mechanics and strategies
- Added Heat Levels table showing vLiq settings and target users (CRACK, HIGH, PRO, APEX, CORE)
- Documented trading strategies: The Hunter, The Squeeze, The Defender
- Explained resolution roles: Proposer, Disputer, Jury
- Added bonding curve basics, fee structure, and resolution timeline
- Linked from Terms of Service and Entry Modal

#### Total P/L Calculation with Breakdown
- **Trading P/L**: Profit/loss from selling shares (average cost basis calculation)
- **Resolution P/L**: Profit/loss from market resolutions (claims - invested)
- **Total P/L**: Combined Trading + Resolution P/L
- Shows breakdown on Portfolio page header: "Trading: +X | Resolution: +Y"
- Refunds tracked separately as "Capital Recovery" (not P/L)

#### Position Card P/L Display
- Always shows P/L section for consistent card height
- Cases: Has activity, Has refund, No activity yet, Position closed
- Market-specific P/L from trades using `calculateMarketRealizedPnl()`

#### Portfolio Page Infinite Scroll
- Loads 20 items initially, more on scroll
- `IntersectionObserver` for smooth infinite loading
- Shows "Showing X of Y" counter while loading more
- "END OF LIST" indicator when all items loaded
- **Added**: MY MARKETS tab now has infinite scroll pagination (was missing)

### Changed

#### Portfolio Page Tab Refactoring
- **Renamed**: "AWAITING" → "PENDING" (clearer naming)
- **New tabs**: ALL | NEEDS ACTION | ACTIVE | PENDING | RESOLVED | UNRESOLVED
- **RESOLVED tab**: Now green (was grey) - matches positive completion state
- **NEEDS ACTION tab**: Cyan when empty, yellow when has items (was always yellow)
- Sub-filters for NEEDS ACTION: CLAIM, VOTE, FINALIZE, REFUND

#### Badge Consistency Across MY POSITIONS and MY MARKETS
- **RESOLVED badges**: Always green (`variant="yes"`) regardless of YES/NO outcome
- **UNRESOLVED badges**: Always red (`variant="no"`)
- Badge text format: `RESOLVED (YES WINS)` / `RESOLVED (NO WINS)`
- Added badge system to `MyMarketCard` matching `PositionCard`

| State | Badge Text | Color |
|-------|------------|-------|
| RESOLVED | `RESOLVED (YES WINS)` / `RESOLVED (NO WINS)` | 🟢 Green |
| UNRESOLVED | `UNRESOLVED` | 🔴 Red |
| DISPUTED | `DISPUTED` | 🟡 Yellow |
| PROPOSED | `PROPOSED` | 🔵 Cyan |
| READY TO FINALIZE | `READY TO FINALIZE` | 🔵 Cyan |
| EXPIRED | `EXPIRED` | 🟠 Orange |
| ACTIVE | `ACTIVE` | 🟢 Green |

#### Holder Badge Text Cleanup
- Removed brackets from pre-defined badges:
  - `[YES HOLDER]` → `YES HOLDER`
  - `[NO HOLDER]` → `NO HOLDER`
  - `[WHALE]` → `WHALE`
  - `[ADMIN]` → `ADMIN`

#### Error State UI
- Changed skull emoji `💀` → warning emoji `⚠️`
- Changed "FAILED TO LOAD POSITIONS" → "SOMETHING BROKE"

#### Terms of Service Refactoring
- Moved game rules to separate How to Play page
- Removed fee structure, market rules, and technical details
- Streamlined to core legal/protective content only
- Added link to How to Play guide

#### Resolution Panel Improvements
- Live countdown timers (updates every second)
- Voting UI shows potential jury fee earnings
- Current vote tally display during disputes
- Payout estimates before claiming
- Better "Resolution Blocked" and "Waiting for Refund" states

### Fixed

#### Position Card Emergency Refund
- Shows UNRESOLVED badge even after refund (was disappearing)
- Proper refund value display with estimated BNB
- Separated refund tracking from P/L (capital recovery vs profit)

#### Market Detail Page Resilience
- Added `hasLoadedOnce` tracking for reconnection handling
- Auto-recovery polling every 10s if data lost
- "RECONNECTING" state when previously loaded data disappears
- Better error state with "TRY AGAIN" button

---

## [0.7.2] - 2026-01-12

### Added

#### Trade History Improvements
- **New REALIZED P/L tab** in market detail page showing per-wallet realized profit/loss
- Only wallets that have sold shares appear in Realized P/L
- Uses average cost basis calculation for accurate P/L
- Shows profit/loss in BNB and percentage
- Sorted by absolute P/L (biggest winners/losers first)

#### Market Creation Enhancements
- Image URL is now **required** when creating markets
- Added helper link to [postimages.org](https://postimages.org/) for easy image uploads

### Changed

#### Simplified Trade History
- Removed PNL badges and tooltips from TRADES tab
- Clean trade list showing: side, amount, shares, trader, time
- No hover effects or expandable details - keeps it simple

#### Improved Finalize/Claim Flow
- **Separated finalize and claim into two distinct actions**
- First click: "FINALIZE" button (one transaction)
- After finalize: "CLAIM" button appears (separate transaction)
- After claim: Shows "✓ CLAIMED" (disabled)
- Local state updates immediately - no page refresh needed

#### Portfolio Position Cards
- Removed "If Sold Now" row (unreliable due to bonding curve)
- Button states now properly show: FINALIZE → CLAIM → CLAIMED
- Position cards update after successful finalize without refresh

#### UI Cleanup
- Removed Jazzicon (colored circle) from wallet address displays
- Addresses now shown as plain text only
- Changed "NO HOLDERS YET" to "NO HOLDERS" (someone could have sold)
- Removed "*required" label from Image field (validation handles it)

### Fixed

#### Finalize/Claim Double Transaction Bug
- Previously clicking "FINALIZE TO CLAIM" triggered both transactions at once
- Now properly separates into two distinct user actions
- Users can finalize first, then claim separately
- If someone else finalizes, you immediately see "CLAIM" button

---

## [0.7.1] - 2026-01-11

### Added

#### User-Friendly Error Messages
- Added `formatError()` utility function to parse blockchain/wallet errors
- Converts raw error messages like "User denied transaction signature" to "Transaction cancelled"
- Handles common errors: rejected transactions, insufficient funds, slippage, contract reverts
- Used in CreateMarketPage error display

### Fixed

#### WalletConnect & RainbowKit Not Working
- Installed missing `@walletconnect/ethereum-provider@2.23.1` dependency
- Installed missing `rxjs@7.8.2` (peer dependency of @apollo/client v4)
- WalletConnect and Rainbow wallet connections now work properly
- Mobile wallet connections (MetaMask app, etc.) now functional

#### Wrong Win/Loss Status in Resolution Panel
- Fixed users with 0 winning shares incorrectly seeing "YOU WON!" message
- `canClaim` now checks for **winning shares** instead of **total shares**
- Added explicit `winningShares` and `losingShares` variables for clarity
- Users with shares on the losing side now correctly see "YOU LOST" message

#### Balance Not Updating After Trades
- Added `queryClient.invalidateQueries({ queryKey: ['balance'] })` after successful trades
- Balance in Header (RainbowKit) now updates immediately after trades
- Fixed in: TradePanel, CreateMarketPage, PortfolioPage withdrawals

#### Slippage Settings Not Syncing
- Added custom event `slippage-updated` to sync slippage across components
- `useSlippage()` hook now listens for storage changes and custom events
- Changing slippage in dropdown now immediately updates trade calculations
- No longer need to refresh page to see new slippage value

### Changed

#### Updated Logo Assets
- **New site logo**: `jnglz-logo.png` (JNGLZFUN brand logo) for favicon, EntryModal header, and footer
- **Monkey logo**: `logo.png` remains for trader avatars (Jazzicon component) only
- Cleaner brand identity throughout the site

#### Dependency Updates
- Downgraded `wagmi` from 3.2.0 to 2.19.5 (RainbowKit compatibility)
- Added `rxjs@7.8.2` for Apollo Client v4 compatibility
- Fixed all peer dependency warnings

---

## [0.7.0] - 2026-01-11

### Added

#### Predator Polling Engine v2
Intelligent polling system that reduces API calls by **80-95%**:

- **Temperature-Based Polling** for market detail pages:
  - 🔥 HOT (trade in 5 min): 15s polling
  - 🌡️ WARM (trade in 1 hour): 60s polling  
  - ❄️ COLD (no trades 1h+): 5 min polling
  - 👁️ WATCHING (expired): 30s polling
  - 💀 RESOLVED: **NEVER poll** (0 queries)

- **Tab Visibility Detection** - All polling stops when tab is hidden
- **Focus Refetch** - One-time refetch when tab regains focus
- **Trade-Triggered Mode** - `triggerHotMode()` switches to 15s polling for 2 minutes after trades
- **Parent-Child Data Sharing** - PriceChart receives trades from MarketDetailPage (no duplicate queries)

#### New Hooks
- `usePageVisibility()` - Detects tab visibility
- `useFocusRefetch()` - Triggers refetch on tab focus
- `useMarketPollInterval()` - Temperature-based polling with HOT mode trigger
- `useTradeRefetch()` - 3-second delayed refetch for subgraph indexing
- `getMarketTemperature()` - Calculates HOT/WARM/COLD/WATCHING/RESOLVED

### Changed

#### Polling Intervals (Massive Savings)
| Component | Old Interval | New Interval | Savings |
|-----------|--------------|--------------|---------|
| Markets List | 30s | 90s | **67%** |
| Market Detail | 15s (always) | 15s-5min (dynamic) | **up to 95%** |
| PriceChart | 60s (own query) | 0 (uses parent data) | **100%** |
| Portfolio | 60s | 120s | **50%** |
| Ticker | 120s | ONCE (no polling) | **100%** |
| Resolved Markets | 15s | 0 (never poll) | **100%** |
| Hidden Tab | normal polling | 0 | **100%** |

### Fixed

#### React Hooks Order Error in PortfolioPage
- Fixed "Rendered more hooks than during the previous render" error
- Moved all `useMemo` hooks BEFORE the `if (!isConnected)` early return
- React hooks must be called unconditionally in the same order every render

### Removed
- Removed 🔐 lock emoji from Portfolio and Create pages "Connect Wallet" screens

---

## [0.6.4] - 2026-01-11

### Changed

#### Improved Market Rules Documentation (EntryModal + TermsPage)
- Completely rewrote bond requirements section for clarity
- Added **Bond Formula** with visual example: `max(0.005 BNB, 1% of pool)`
- Split rewards into clear sections: "If NOT Disputed" vs "If Disputed"
- Added concrete example: "Pool has 2 BNB → Proposer needs 0.02 BNB"
- Made voter rewards explicit: "Correct Voters share 50% of loser's bond"
- Users now see these rules before they can use the platform

---

## [0.6.3] - 2026-01-11

### Changed

#### Removed Heat Level Emojis
- Removed ☢️, 🔥, 🧊 emojis from heat level names throughout the UI
- Heat levels now display as clean text: **DEGEN FLASH**, **STREET FIGHT**, **WHALE POND**
- Updated `HeatLevelBadge` component to not show emojis
- Updated `CreateMarketPage` heat level selector
- Updated `TermsPage` documentation
- Cleaner, more professional appearance

### Added

#### Empty Winning Side Documentation
- Added "Empty Winning Side" section to TermsPage Market Rules
- Added explanation to EntryModal so users see this before using the app
- Explains what happens when market resolves to an outcome with 0 shareholders:
  - Resolution is blocked (market stays unresolved)
  - Proposer and disputer get bonds back (no penalty)
  - Shareholders can claim emergency refund after 24h
  - Protects funds from being locked forever

---

## [0.6.2] - 2026-01-11

### Fixed

#### Resolution Panel Edge Cases
- **Empty Market Detection** - Now detects markets with 0 participants
  - Shows "NO ACTIVITY" badge instead of "AWAITING"
  - Displays "This market had no participants. Nothing to resolve."
  - Hides "Propose" button (contract would revert with `NoTradesToResolve`)

- **Resolution Failed Detection** - Detects "empty winning side" scenario
  - When proposal outcome has 0 shareholders, finalize is blocked by contract
  - Shows "RESOLUTION BLOCKED" warning with explanation
  - Shows countdown to emergency refund availability

- **Improved Emergency Refund UX**
  - Shows clear countdown when waiting for 24h period
  - Better messaging explaining why emergency refund is available
  - Properly hides propose button for empty markets

### Changed
- `canPropose` now checks `!isEmptyMarket` before allowing proposal
- Added `marketYesSupply`, `marketNoSupply`, `marketTotalSupply` from subgraph
- Added `resolutionMayHaveFailed` detection for stuck markets

---

## [0.6.1] - 2026-01-11

### Fixed

#### Emergency Refund UI Bug
- **Fixed `canEmergencyRefund` condition** - Was incorrectly requiring `!hasProposal`
  - Contract allows emergency refund even WITH a proposal (as long as not resolved)
  - Frontend was hiding the button when someone had proposed an outcome
  - Now correctly shows emergency refund for any unresolved market 24h after expiry

- **Added `emergencyRefunded` state tracking**
  - Now checks `position.emergencyRefunded` to hide button after refund claimed
  - Added "✓ REFUNDED" confirmation UI for users who already claimed

- **Added "Waiting for Emergency Refund" countdown**
  - Shows time remaining until emergency refund becomes available
  - Helpful for users with stuck markets who need to wait 24h

- **Improved `formatTimeLeft()` helper**
  - Now shows hours for longer durations (e.g., "23h 45m" instead of "1425m 30s")

- **Updated message text**
  - Changed from "No one proposed an outcome" to more accurate description
  - Emergency refund is for ANY unresolved market 24h after expiry

---

## [0.6.0] - 2026-01-10

### Added

#### Smart Polling (Rate Limit Protection)
- **`useSmartPolling.ts`** - New hook module for intelligent polling
  - `usePageVisibility()` - Detects when browser tab is active/hidden
  - `useSmartPollInterval()` - Returns 0 (pauses polling) when tab is hidden
  - `POLL_INTERVALS` constants for different page contexts
  - `calculateDailyQueries()` - Utility to estimate daily API usage

- **Adaptive Poll Intervals by Context**
  - Market Detail Page: 15s (was 5s)
  - Markets List Page: 30s (was 10s)
  - Portfolio Page: 60s (background)
  - Price Chart: 60s (background)
  - Ticker: 120s (was 5s)

- **Automatic Polling Pause**
  - Polling stops completely when user switches to another tab
  - Resumes automatically when tab becomes visible again
  - Reduces unnecessary API calls by ~40-60%

#### Optimistic Trade Updates (Instant UI)
- **`useOptimisticTrade.ts`** - Cache manipulation with rollback
  - `applyOptimisticUpdate()` - Instantly updates market data in cache
  - `rollback()` - Reverts to snapshot if transaction fails
  - `confirmUpdate()` - Cleans up snapshot after success
  - `refetchMarket()` - Force fresh data from network

- **`useTradeWithOptimism.ts`** - Trade hooks with instant feedback
  - `useBuyYesOptimistic()` - Buy YES with instant UI update
  - `useBuyNoOptimistic()` - Buy NO with instant UI update
  - `useSellYesOptimistic()` - Sell YES with instant UI update
  - `useSellNoOptimistic()` - Sell NO with instant UI update
  - Automatic rollback on transaction failure

- **Trade Status States**
  - `idle` → `optimistic` → `pending` → `confirming` → `success`/`error`

#### Pull Pattern Withdrawals (v3.4.0 Contract Support)
- **New Read Hooks**
  - `usePendingWithdrawal(address)` - Check pending bond/jury fees
  - `usePendingCreatorFees(address)` - Check pending creator fees
  - `usePendingWithdrawals(address)` - Combined pending amounts

- **New Write Hooks**
  - `useWithdrawBond()` - Withdraw pending bonds and jury fees
  - `useWithdrawCreatorFees()` - Withdraw accumulated creator fees

- **Portfolio Page Enhancement**
  - Shows "Pending Withdrawals" banner when user has unclaimed funds
  - One-click withdraw buttons for bonds and creator fees
  - Real-time balance display

#### Data Minimization (Lower API Costs)
- **`MARKET_CARD_FRAGMENT`** - Lightweight GraphQL fragment for list pages
  - Only fetches: id, question, imageUrl, heatLevel, status, prices, volume
  - ~60% smaller payload than full `MARKET_FRAGMENT`
- **`GET_MARKETS_LIGHT`** - New query using card fragment
  - Use for Market List/Discovery pages
  - Reserve full `GET_MARKETS` for detail pages

### Changed

#### Contract & Subgraph Updates
- **Contract Address**: `0x4e20Df1772D972f10E9604e7e9C775B1ae897464` (v3.4.1)
- **Subgraph**: Production gateway URL with 100k queries/month
- **ABI**: Added Pull Pattern functions (`withdrawBond`, `withdrawCreatorFees`, `getPendingWithdrawal`, `getPendingCreatorFees`)

#### Performance Improvements
- Reduced polling frequency across all pages
- Added tab visibility detection to pause background polling
- Implemented cache-and-network fetch policy as default

### Technical Details

#### Daily Query Estimation (The Graph)
```
Market Detail (15s): 5,760 queries/day per active user
Markets List (30s): 2,880 queries/day per active user
With Tab Detection: ~40% reduction when users switch tabs
Total Estimate: ~3,000-5,000 queries/day for typical user
```

#### Optimistic Update Flow
```
1. User clicks "Buy" → Cache updated instantly (optimistic)
2. Transaction sent → Status: "pending"
3a. Success → Snapshot cleared, next poll confirms
3b. Failure → Rollback to snapshot, error toast
```

---

## [0.5.5] - 2026-01-10

### Changed

#### Mobile UX - Trade Panel Priority
- **Trade panel now shows FIRST on mobile** - No more scrolling past chart and history to trade
- Desktop layout unchanged (chart left, trade panel right)
- Used CSS grid ordering (`lg:order-1`, `lg:order-2`) for responsive reordering
- Heat Level Info moved to bottom on mobile (less critical, shouldn't block trading)

#### Heat Level Descriptions Updated
- **DEGEN FLASH**: Changed from "Perfect for viral trends that last 30 minutes" to "Maximum volatility — a few bucks swings the price 10%. For traders who thrive on chaos."
- **STREET FIGHT**: Changed from "One person pumps, the next person dumps" to "Classic tug-of-war battles. Momentum shifts fast, conviction gets rewarded. High ROI potential."
- **WHALE POND**: Unchanged (already good)

#### Resolution UI - Clearer Proposer Economics
- Replaced "💰 EARN 0.5% REWARD" box with detailed **"💰 RESOLUTION ECONOMICS"** panel
- Now shows:
  - Your bond amount
  - Potential reward (+X BNB)
  - Clear success case: "If undisputed or you win vote: Bond back + reward"
  - Clear risk case: "If disputed & you lose vote: Bond goes to disputer"
- Added risk text below YES/NO buttons: "✗ If disputed & you lose: Bond goes to winner"

---

## [0.5.4] - 2026-01-10

### Added

#### Proposer Reward Display (Resolution UI)
- **"💰 EARN 0.5% REWARD" Info Box** in ResolutionPanel
  - Shows when user is about to propose an outcome
  - Displays estimated reward based on current pool balance
  - Dynamically calculates: `poolBalance × 0.5%`

- **Reward Confirmation Text**
  - Shows "✓ Bond returned + X BNB reward if correct" after proposing
  - Encourages users to propose correct outcomes

- **Finalize Section Enhancement**
  - Displays proposer reward info in Finalize section
  - Shows who proposed and estimated reward they'll receive

- **New Hook: `useProposerRewardBps()`**
  - Reads `proposerRewardBps` from contract (currently 50 = 0.5%)
  - Used to calculate estimated rewards in UI

#### Contract & Subgraph Updates
- **Contract Address Updated**: `0x986BF4058265a4c6A5d78ee4DF555198C8C3B7F7` (v3.3.0)
- **Subgraph URL Updated**: v3.3.1 with `ProposerReward` entity
- **ABI Updated**: Added `proposerRewardBps` view function and `ProposerRewardPaid` event

### Changed
- Updated `frontend/.env` with new contract address and subgraph URL
- Updated `src/shared/config/env.ts` defaults
- Updated `src/shared/config/contracts.ts` with v3.3.0 ABI additions

---

## [0.5.3] - 2026-01-09

### Added

#### Slippage Protection
- **Slippage Settings Component** (`SlippageSettings.tsx`)
  - Gear icon button in Trade Panel header
  - Preset buttons: 0.5%, 1%, 2%, 5%
  - Custom input field for any value (0-50%)
  - Warning message for slippage > 5%
  - Settings saved to localStorage and persist across sessions

- **Slippage Applied to All Trades**
  - Buy trades: `minSharesOut` calculated from preview with slippage applied
  - Sell trades: `minBnbOut` calculated from preview with slippage applied
  - **Default: 1%** - protects against price movements during tx confirmation

- **Trade Preview Shows Minimum Output**
  - Displays "Min. after slippage (X%)" with the protected minimum value
  - Users can see exactly what they're guaranteed to receive

#### New Exports
- `SlippageSettings` component
- `useSlippage` hook for accessing slippage settings
- `applySlippage(amount, bps)` utility function
- `getSavedSlippage()` for reading saved preference
- `DEFAULT_SLIPPAGE_BPS = 100` (1%)

### Why This Matters
Previously, the frontend was passing `minSharesOut = 0n` (no protection). This meant:
- If 10 users bought at the same time, later users could get significantly fewer shares
- Front-running bots could exploit this

Now with 1% default slippage:
- Transactions revert if price moves more than 1% unfavorably
- Users are protected from unexpected price impact
- Can adjust to higher values for volatile markets or lower for stable ones

---

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
  - **DEGEN FLASH** - "The Moon-Bagger" (0.005 – 0.1 BNB) - "Total Chaos"
  - **STREET FIGHT** - "The Trader" (0.1 – 1.0 BNB) - "The Standard"
  - **WHALE POND** - "The Shark" (1.0 – 5.0+ BNB) - "Serious Stakes"
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
