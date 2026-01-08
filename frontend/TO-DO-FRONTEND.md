# JunkieFun Frontend - TODO

> **Last Updated:** January 8, 2026  
> **Status:** Phase 1 - Foundation  
> **Design:** "High-Energy Brutalism" - Trading Terminal × Street Market

---

## 🎯 Design System Summary

| Element | Value |
|---------|-------|
| Background | True Black `#000000` |
| Borders | 1px solid `#262626` (no shadows, no rounded corners) |
| YES/Bullish | Electric Lime `#39FF14` |
| NO/Bearish | Neon Crimson `#FF3131` |
| Action/Links | Cyber Blue `#00E0FF` |
| Font (Numbers) | JetBrains Mono |
| Font (Headlines) | Inter / Archivo Black |

---

## 📋 Phase 1: Foundation (Week 1)

### 1.1 Project Setup ⬜
- [ ] Install dependencies (wagmi, viem, rainbowkit, react-query, axios, zod, react-router, react-hook-form)
- [ ] Configure Tailwind with "Brutalist" theme (colors, fonts, no rounded corners)
- [ ] Setup folder structure (features/, shared/, providers/, router/)
- [ ] Configure path aliases (@/)
- [ ] Add Google Fonts (JetBrains Mono, Inter)
- [ ] Copy logo assets to public/ folder

### 1.2 Shared Config ⬜
- [ ] `env.ts` - Environment variables
- [ ] `wagmi.ts` - Wagmi + RainbowKit config (BNB Testnet)
- [ ] `contracts.ts` - Contract addresses + ABI
- [ ] `graphql.ts` - Apollo Client for The Graph

### 1.3 Shared Utils ⬜
- [ ] `cn.ts` - Class name utility
- [ ] `format.ts` - formatBNB, formatAddress, formatPercent, formatTimeRemaining
- [ ] `jazzicon.ts` - Generate wallet avatars

### 1.4 Shared UI Components (Brutalist Style) ⬜
- [ ] `Button.tsx` - Variants: yes, no, action, ghost (chunky, no rounded)
- [ ] `Card.tsx` - Harsh borders, no shadows
- [ ] `Input.tsx` - Terminal-style input
- [ ] `Modal.tsx` - Dark overlay, harsh borders
- [ ] `Badge.tsx` - [YES HOLDER], [NO HOLDER], [WHALE], [ADMIN]
- [ ] `Spinner.tsx` - Matrix-style loading
- [ ] `HeatBar.tsx` - Liquidity gauge (horizontal gradient bar)
- [ ] `ChanceDisplay.tsx` - Big glowing percentage

### 1.5 Providers ⬜
- [ ] `QueryProvider.tsx` - React Query
- [ ] `Web3Provider.tsx` - Wagmi + RainbowKit (brutalist theme)
- [ ] `GraphQLProvider.tsx` - Apollo Client

### 1.6 Chain Validation (CRITICAL) ⬜
> **Issue from ExampleProject:** Wallets like Phantom don't support BNB Chain and users get stuck unable to disconnect!

- [ ] `WrongNetworkModal.tsx` - Shows when connected to wrong chain
- [ ] Force chain validation after wallet connect
- [ ] **Always show disconnect button** even when on wrong network
- [ ] `useChainValidation.ts` - Hook to check if on correct chain
- [ ] Block all trading actions if wrong network
- [ ] Auto-prompt chain switch to BNB Testnet/Mainnet

---

## 📋 Phase 2: Core Features (Week 2)

### 2.1 Schemas & Types (Zod) ⬜
- [ ] `market.schemas.ts` - Market entity from subgraph
- [ ] `trade.schemas.ts` - Trade entity
- [ ] `position.schemas.ts` - User position
- [ ] `user.schemas.ts` - User entity
- [ ] `comment.schemas.ts` - Supabase comments (future)

### 2.2 GraphQL Queries ⬜
- [ ] `markets.queries.ts` - GET_MARKETS, GET_MARKET, GET_ACTIVE_MARKETS
- [ ] `trades.queries.ts` - GET_RECENT_TRADES, GET_MARKET_TRADES
- [ ] `positions.queries.ts` - GET_USER_POSITIONS
- [ ] `stats.queries.ts` - GET_GLOBAL_STATS

### 2.3 Feature: Markets ⬜
- [ ] `useMarkets.ts` - Fetch all markets
- [ ] `useMarket.ts` - Fetch single market
- [ ] `useRecentTrades.ts` - Live ticker data
- [ ] `MarketCard.tsx` - Grid card with chance %, heat bar, grayscale hover
- [ ] `MarketsGrid.tsx` - The "Jungle" grid layout
- [ ] `LiveTicker.tsx` - Scrolling trade tape
- [ ] `MarketsPage.tsx` - Homepage

### 2.4 Feature: Market Detail ⬜
- [ ] `useMarketTrades.ts` - Trades for specific market
- [ ] `usePrices.ts` - Real-time YES/NO prices from contract
- [ ] `ChanceHeader.tsx` - Huge flickering chance display
- [ ] `PriceChart.tsx` - TradingView-style line chart (placeholder with scanner line)
- [ ] `TradePanel.tsx` - YES/NO buttons, amount input, slippage
- [ ] `MarketTimeline.tsx` - Lifecycle status ([● ACTIVE], [⚠ DISPUTED])
- [ ] `TradeHistory.tsx` - Recent trades list
- [ ] `MarketDetailPage.tsx` - The "War Room"

### 2.5 Feature: Trading (Contract Writes) ⬜
- [ ] `useBuyYes.ts` - Buy YES shares
- [ ] `useBuyNo.ts` - Buy NO shares
- [ ] `useSellYes.ts` - Sell YES shares
- [ ] `useSellNo.ts` - Sell NO shares
- [ ] `usePreviewTrade.ts` - Preview buy/sell amounts
- [ ] Trade confirmation modal
- [ ] "Hype Flash" animation on trade success

---

## 📋 Phase 3: User Features (Week 3)

### 3.1 Feature: Portfolio ⬜
- [ ] `useUserPositions.ts` - Fetch user's positions
- [ ] `PositionCard.tsx` - Show shares, P/L, claim button
- [ ] `PortfolioPage.tsx` - User's positions grid

### 3.2 Feature: Create Market ⬜
- [ ] `useCreateMarket.ts` - Contract write
- [ ] `CreateMarketForm.tsx` - Question, evidence link, rules, expiry, image
- [ ] Image upload handling (IPFS or direct URL)
- [ ] `CreateMarketPage.tsx`

### 3.3 Feature: Resolution (Street Consensus) ⬜
- [ ] `useProposeOutcome.ts` - Propose resolution
- [ ] `useDispute.ts` - Dispute outcome
- [ ] `useVote.ts` - Cast vote
- [ ] `useClaim.ts` - Claim winnings
- [ ] `ResolutionPanel.tsx` - Show current state, vote buttons
- [ ] `VotingProgress.tsx` - Show vote weights

---

## 📋 Phase 4: Social & Admin (Week 4)

### 4.1 Supabase Setup ⬜
- [ ] Create Supabase project
- [ ] Setup tables: `profiles`, `comments`, `moderation_list`
- [ ] Configure SIWE auth (`signInWithWeb3`)
- [ ] Setup RLS policies (user delete own, admin delete any)
- [ ] Setup Realtime subscriptions

### 4.2 Feature: Comments ⬜
- [ ] `useComments.ts` - Fetch comments for market
- [ ] `usePostComment.ts` - Post new comment
- [ ] `useDeleteComment.ts` - Delete comment (user or admin)
- [ ] `CommentThread.tsx` - Scrolling comments with Jazzicon avatars
- [ ] `CommentBadge.tsx` - [YES HOLDER], [NO HOLDER], [WHALE] based on subgraph position
- [ ] Evidence link attachment
- [ ] Real-time updates via Supabase Realtime

### 4.3 Feature: Admin Moderation ⬜
- [ ] `useIsAdmin.ts` - Check if wallet is MultiSig signer
- [ ] `useHideMarket.ts` - Add to moderation_list
- [ ] `useUnhideMarket.ts` - Remove from moderation_list
- [ ] `useHideComment.ts` - Shadow-ban comment
- [ ] `HideMarketButton.tsx` - Only visible to admins
- [ ] `DeleteCommentButton.tsx` - Only visible to admins
- [ ] Blur content display for hidden markets
- [ ] "Content hidden by moderators" placeholder

---

## 📋 Phase 5: Polish & Animations (Week 5)

### 5.1 Animations ⬜
- [ ] "Hype Flash" - Border flash on new trades (200ms)
- [ ] "Chance Flicker" - Neon sign effect on price change
- [ ] "Scanner Line" - Moving line on chart
- [ ] Grayscale → Color hover on market images
- [ ] Smooth transitions on all interactions

### 5.2 Responsive Design ⬜
- [ ] Mobile market cards
- [ ] Mobile trade panel
- [ ] Mobile navigation (hamburger menu)
- [ ] Touch-friendly buttons

### 5.3 Video Background ⬜
- [ ] Implement monkey swinging loop video
- [ ] Use as hero background or loading screen
- [ ] Ensure performance (lazy load, pause when not visible)

---

## 📋 Phase 6: Testing & Launch

### 6.1 Testing ⬜
- [ ] Test all contract interactions on testnet
- [ ] Test subgraph queries
- [ ] Test Supabase auth flow
- [ ] Test admin moderation
- [ ] Cross-browser testing
- [ ] Mobile testing

### 6.2 Deployment ⬜
- [ ] Setup Vercel project
- [ ] Configure environment variables
- [ ] Deploy to testnet domain
- [ ] Setup custom domain (optional)

---

## 🎨 Assets Checklist

| Asset | Location | Usage |
|-------|----------|-------|
| Logo (no bg) | `assets/Logo no-bg.png` | Header, favicon |
| Logo (with bg) | `assets/Logo with bg.jpg` | Social sharing, OG image |
| Monkey video | `assets/video-loop.mov` | Hero background / loading |

---

## 🔗 External Dependencies

| Service | Purpose | Status |
|---------|---------|--------|
| The Graph | Subgraph queries | ✅ Deployed |
| Supabase | Auth, Comments, Moderation | ⬜ Not setup |
| WalletConnect | Wallet connections | ⬜ Need project ID |
| Vercel | Hosting | ⬜ Not setup |

---

## 📊 Progress Tracker

| Phase | Status | Progress |
|-------|--------|----------|
| Phase 1: Foundation | 🔄 In Progress | 0% |
| Phase 2: Core Features | ⬜ Not Started | 0% |
| Phase 3: User Features | ⬜ Not Started | 0% |
| Phase 4: Social & Admin | ⬜ Not Started | 0% |
| Phase 5: Polish | ⬜ Not Started | 0% |
| Phase 6: Launch | ⬜ Not Started | 0% |

**Overall Progress: 0%**
