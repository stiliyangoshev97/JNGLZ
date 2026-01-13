# JNGLZ.FUN Frontend - TODO

> **Last Updated:** January 14, 2026  
> **Status:** Phase 2+ Complete (v0.7.12)
> **Design:** "High-Energy Brutalism" - Trading Terminal × Street Market

---

## ✅ COMPLETED FEATURES (v0.7.12)

### Core Infrastructure
- [x] Vite + React 19 + TypeScript setup
- [x] Tailwind "Brutalist" theme (black bg, harsh borders, no rounded corners)
- [x] Wagmi + RainbowKit (brutalist theme)
- [x] Apollo Client for The Graph
- [x] Chain validation with WrongNetworkModal
- [x] Zod schemas for all entities

### UI Components
- [x] Button, Card, Modal, Input, Badge, HeatBar, ChanceDisplay
- [x] Spinner, Skeleton loaders
- [x] Jazzicon wallet avatars

### Pages
- [x] Markets Page (homepage) - Category tabs, infinite scroll, sort options
- [x] Market Detail Page - Price chart, trade panel, resolution panel
- [x] Create Market Page - With Heat Levels, logo on success screen
- [x] Portfolio Page - MY POSITIONS + MY MARKETS tabs
- [x] Terms & Privacy Pages

### Contract Integration
- [x] All read hooks (prices, positions, previews, bonds, pending withdrawals)
- [x] All write hooks (trade, create, resolve, claim, withdraw)
- [x] Optimistic updates with rollback
- [x] Pull Pattern for withdrawals (bonds + creator fees)
- [x] Error formatting with friendly messages

### Smart Polling (Predator v2)
- [x] Temperature-based polling (HOT 15s → COLD 5min → RESOLVED 0)
- [x] Tab visibility detection (stop polling when hidden)
- [x] Focus refetch (instant refresh on tab focus)
- [x] Trade-triggered hot mode (2 min burst after trades)

### UX Features
- [x] Total P/L tracking (Trading + Resolution) - closed positions only
- [x] Badge consistency across pages
- [x] Infinite scroll pagination (20 items per page)
- [x] Category tabs: ALL | ACTIVE | PENDING | RESOLVED | UNRESOLVED
- [x] **PENDING sub-filters**: AWAITING | PROPOSED | DISPUTED | FINALIZING
- [x] **Price chart fix**: Uses market's actual virtualLiquidity (v0.7.10)
- [x] **P/L display**: Only shows for closed positions (v0.7.12)
- [x] **Pending withdrawals**: Banner disappears after claim (v0.7.12)

---

## 🔄 IN PROGRESS

*Nothing actively in progress*

---

## ⬜ PENDING FEATURES

### Social Features (Phase 4 - Not Started)
- [ ] Supabase setup for comments
- [ ] Comment threads with holder badges
- [ ] Real-time comment updates
- [ ] Admin moderation tools

### Polish
- [ ] Mobile-optimized layout refinements
- [ ] Monkey video background (hero/loading)
- [ ] Enhanced animations

---

## 📊 Progress Tracker

| Phase | Status | Progress |
|-------|--------|----------|
| Phase 1: Foundation | ✅ Complete | 100% |
| Phase 2: Core Features | ✅ Complete | 100% |
| Phase 3: User Features | ✅ Complete | 100% |
| Phase 4: Social & Admin | ⬜ Not Started | 0% |
| Phase 5: Polish | 🔄 Partial | 80% |
| Phase 6: Launch | ⬜ Not Started | 0% |

**Overall Progress: ~85%**
