# JNGLZ.FUN - Master TODO

> **Last Updated:** January 23, 2026  
> **Status:** Smart Contracts ✅ v3.6.1 DEPLOYED | Subgraph ✅ v3.8.4 | Frontend ✅ v0.7.35  
> **Stack:** React 19 + Vite + Wagmi v3 + Foundry + The Graph

---

## 🔴 CRITICAL: AMM & Pool Balance Bugs (Discovered Jan 23, 2026)

**Branch:** `fix/pool-balance-tracking`  
**Status:** INVESTIGATION COMPLETE - Bug #1 FIXED, #2/#3 reclassified as expected behavior

### Investigation Summary

| # | Issue | Location | Severity | Status |
|---|-------|----------|----------|--------|
| 1 | `createMarketAndBuy()` doesn't charge creator fee | Contract | 🔴 High | ✅ FIXED |
| 2 | AMM sell formula is non-linear | Contract | ℹ️ Expected | Expected Behavior |
| 3 | Partial sell may exhaust pool | Contract | ℹ️ Expected | Expected Behavior |
| 4 | Trade event emits gross for buy, net for sell (inconsistent) | Contract | 🟡 Medium | Pending |
| 5 | Subgraph assumes 1.5% fee for all buys (wrong for createMarketAndBuy) | Subgraph | 🟡 Medium | Pending |

### ✅ Bug #1: `createMarketAndBuy()` Missing Creator Fee - FIXED

**Problem:** The `createMarketAndBuy()` function only deducted platform fee (1%), not creator fee (0.5%).

**Fix Applied:** Added creator fee calculation and Pull Pattern credit in `createMarketAndBuy()`.
- Now charges 1.5% total (1% platform + 0.5% creator) - same as `buyYes()`/`buyNo()`
- Pool receives 98.5% of BNB (was incorrectly 99%)
- Users get correct shares (197 for 1 BNB, not 198)

**Commit:** `bd130a5` on branch `fix/pool-balance-tracking`

### ℹ️ Bug #2 & #3: AMM Sell Formula - EXPECTED BEHAVIOR (Not a Bug)

**Original Concern:** The sell formula uses POST-SELL state, causing:
- Selling HALF gives ~59% of total value (not 50%)
- Selling in parts yields MORE than selling all at once
- After selling half, remaining half may fail with `InsufficientPoolBalance`

**Why This is Expected (Not a Bug):**
After thorough investigation, this behavior is **intentional and correct** for a virtual liquidity bonding curve AMM:

1. **Pool Solvency Protection:** The pool can only pay out BNB that was actually deposited. With virtual liquidity creating prices, the formula must prevent paying out more than the pool has.

2. **Bonding Curve Mechanics:** Early sellers get better prices (more BNB per share), later sellers get worse prices. This is fundamental to how bonding curves work.

3. **No Free Money:** If selling in parts gave the same as selling all at once, it would violate conservation of value. The POST-SELL formula correctly accounts for price impact.

4. **One-Sided Market Edge Case:** The `InsufficientPoolBalance` error only occurs in one-sided markets (only YES or only NO holders). In healthy two-sided markets, partial sells work fine.

**Conclusion:** No fix needed. The formula correctly protects pool solvency. Frontend should use `getMaxSellableShares()` to show users what they can actually sell.

### ✅ Bug #4: Trade Event Inconsistency - FIXED

**Problem:** Trade event emitted different values for buy vs sell:
- BUY: Emitted `msg.value` (gross - what user paid)
- SELL: Emitted `bnbOut` (net - what user received after fees)

**Fix Applied:** Changed BUY events to emit `amountAfterFee` (net BNB that goes to pool)
- Now all Trade events consistently emit NET BNB (after fees)
- Frontend/subgraph can accurately display trade history

**Commit:** Pending on branch `fix/pool-balance-tracking`

### ✅ Bug #5: Subgraph Fee Assumption - FIXED

**Problem:** Subgraph v3.8.4 was calculating `amountAfterFee` from BUY event's `bnbAmount`, assuming it was gross.

**Root Cause:** With Bug #4 fix, BUY events now emit NET BNB (after fees). The subgraph was double-deducting fees!

**Fix Applied:** Simplified subgraph - BUY events now use `bnbAmount` directly since it's already net.

**Subgraph Version:** v3.8.5 (requires contract v3.8.2+)

---

## ✅ FIXED: Dispute Window Edge Case (v3.6.1)

**Discovered:** January 18, 2026  
**Fixed:** January 18, 2026  
**Severity:** MEDIUM (in v3.6.0) → **RESOLVED** (in v3.6.1)

### Vulnerability Summary (FIXED)

| # | Problem | Status | Fix Applied |
|---|---------|--------|-------------|
| 1 | **Dispute Blocked by Cutoff** | ✅ FIXED | Removed cutoff check from `dispute()` |

**The Bug:** If someone proposed at T=21:59 (1 minute before the 2-hour cutoff), the cutoff would kick in at T=22:00, blocking ALL disputes with `DisputeWindowClosed` error. This allowed a malicious proposer to propose a WRONG outcome knowing nobody could dispute it.

**The Fix:** Removed the cutoff check from `dispute()` function. Disputes are now ONLY blocked by the natural 30-minute dispute window expiry (`DisputeWindowExpired`), not by the 2-hour cutoff.

### Implementation Details

```solidity
// v3.6.1: REMOVED cutoff check from dispute()
function dispute(uint256 marketId) external {
    // REMOVED: 
    // if (block.timestamp >= emergencyRefundTime - RESOLUTION_CUTOFF_BUFFER) {
    //     revert DisputeWindowClosed();
    // }
    
    // KEPT: Natural 30-min window check only
    if (block.timestamp > market.proposalTime + DISPUTE_WINDOW) {
        revert DisputeWindowExpired();
    }
}
```

### Why This is Safe
```
Worst case: Proposal at T=21:59:59
Dispute at T=22:29:58 (last second of 30-min window)  
Voting ends T=23:29:58
Finalize at T=23:29:59
Emergency refund at T=24:00:00
GAP: 30 minutes - SAFE!
```

### Test Coverage ✅
- Modified `test_Dispute_RevertWhenDisputeWindowExpired` - Tests natural 30-min window
- Added `test_Dispute_AllowedAfterCutoff_IfWithinDisputeWindow` - Verifies the fix
- 180 total tests passing

---

## ✅ FIXED: Emergency Refund Vulnerability (v3.6.0)

**Discovered:** January 18, 2026  
**Fixed:** January 18, 2026  
**Severity:** CRITICAL (in v3.5.0) → **RESOLVED** (in v3.6.0)

### Vulnerability Summary (FIXED)

| # | Problem | Status | Fix Applied |
|---|---------|--------|-------------|
| 1 | **Double-Spend** | ✅ FIXED | `claim()` checks `emergencyRefunded` flag |
| 2 | **Pool Insolvency** | ✅ FIXED | `emergencyRefund()` reduces `poolBalance` and zeroes shares |
| 3 | **Race Condition** | ✅ FIXED | 2-hour resolution cutoff before emergency refund |

### Implementation Details

#### Fix 1: Block claim after emergency refund ✅
```solidity
function claim(uint256 marketId) external {
    if (position.emergencyRefunded) revert AlreadyEmergencyRefunded(); // ADDED
    // ...
}
```

#### Fix 2: Reduce pool balance on emergency refund ✅
```solidity
function emergencyRefund(uint256 marketId) external {
    // ...
    market.poolBalance -= refund;           // ADDED
    market.yesSupply -= position.yesShares; // ADDED  
    market.noSupply -= position.noShares;   // ADDED
    position.yesShares = 0;                 // ADDED
    position.noShares = 0;                  // ADDED
    // ...
}
```

#### Fix 3: 2-hour resolution cutoff ✅
```solidity
uint256 public constant RESOLUTION_CUTOFF_BUFFER = 2 hours; // ADDED

function proposeOutcome(uint256 marketId, bool outcome) external {
    if (block.timestamp >= emergencyRefundTime - RESOLUTION_CUTOFF_BUFFER) {
        revert ProposalWindowClosed(); // ADDED
    }
    // ...
}
```

### Test Coverage ✅
- 15 new security tests in `EmergencyRefundSecurity.t.sol`
- 180 total tests passing (179 + 1 new v3.6.1 test)
- Full attack scenario simulation verified

### Timeline (v3.6.0, updated v3.6.1)
```
Expiry ─────────────────────────────────────────────────> Emergency Refund
  │                                                              │
  │  0-22h: Proposal window                                     │ 24h+
  │  22-24h: CUTOFF - No new PROPOSALS (disputes still allowed) │
  │         (ensures resolution completes before refund)         │
```

### Defense in Depth Matrix

| Attack Vector | Fix 1 | Fix 2 | Fix 3 | Result |
|---------------|-------|-------|-------|--------|
| User claims after refund | ✅ BLOCKED | - | - | Safe |
| Pool insolvency from refunds | - | ✅ BLOCKED | - | Safe |
| Late proposal race condition | - | ⚠️ Mitigated | ✅ BLOCKED | Safe |
| Direct contract bypass | ✅ | ✅ | ✅ | Safe |

### Frontend Mitigation (v0.7.27) ✅
- [x] Block proposals in UI when <2 hours remain before emergency refund
- [x] Disputes remain enabled (within their 30-min window) per v3.6.1 fix
- [x] Show "PROPOSAL WINDOW CLOSED" with emergency refund countdown
- [x] Added "2-Hour Safety Cutoff" section in HowToPlayPage

### Deployment Checklist for v3.6.0

#### ✅ Code Implementation Complete
- [x] Implement Fix 1: Add `emergencyRefunded` check in `claim()`
- [x] Implement Fix 2: Reduce `poolBalance` and supplies in `emergencyRefund()`
- [x] Implement Fix 3: Add 2-hour cutoff in `proposeOutcome()` and `dispute()`
- [x] Implement Fix 4: Add clean pool accounting in `claim()` (reduces poolBalance and supply)
- [x] Implement Fix 5: Add `nonReentrant` to `createMarket()` for defense-in-depth
- [x] Add new constant: `RESOLUTION_CUTOFF_BUFFER = 2 hours`
- [x] Add new error types: `ProposalWindowClosed`, `DisputeWindowClosed`
- [x] Write tests for all attack vectors (15 new tests in `EmergencyRefundSecurity.t.sol`)
- [x] Update existing tests (`BondingCurveEconomics.t.sol` - renamed from PumpDump.t.sol)
- [x] Run full test suite: **179 tests pass, 0 fail, 1 skip**
- [x] Update AUDIT.md, README.md, CHANGELOG.md, SECURITY_ANALYSIS_v3.6.0.md
- [x] Commit and push to `feature/contract-v3.6.0-emergency-refund-fix` branch

#### ⏳ Testnet Deployment
- [ ] **1. Deploy contract to BSC Testnet**
  - Run: `forge script script/Deploy.s.sol --rpc-url $BSC_TESTNET_RPC --broadcast --verify`
  - Save new contract address: `__________________________`
  - Verify on BscScan Testnet
- [ ] **2. Export new ABI**
  - Run: `forge build && cp out/PredictionMarket.sol/PredictionMarket.json ../subgraph/abis/`
  - Copy ABI to frontend: `cp out/PredictionMarket.sol/PredictionMarket.json ../frontend/src/abi/`
- [ ] **3. Update Subgraph for Testnet**
  - Edit `subgraph/subgraph.yaml`: Update `address` and `startBlock` for new contract
  - Edit `subgraph/networks.json`: Update testnet contract address
  - Run: `graph codegen && graph build`
  - Deploy to The Graph Studio (testnet subgraph)
- [ ] **4. Update Frontend for Testnet**
  - Edit `frontend/.env.testnet`: Update `VITE_CONTRACT_ADDRESS`
  - Edit `frontend/.env.testnet`: Update `VITE_SUBGRAPH_URL` if subgraph URL changed
  - Test all flows: create market, buy/sell, propose, dispute, claim, emergency refund

#### ⏳ Mainnet Deployment (After Testnet Verification)
- [ ] **5. Deploy contract to BSC Mainnet**
  - Run: `forge script script/Deploy.s.sol --rpc-url $BSC_MAINNET_RPC --broadcast --verify`
  - Save new contract address: `__________________________`
  - Verify on BscScan
- [ ] **6. Update Subgraph for Mainnet**
  - Edit `subgraph/subgraph.yaml`: Update `address` and `startBlock`
  - Edit `subgraph/networks.json`: Update mainnet contract address
  - Run: `graph deploy --studio jnglz-mainnet`
- [ ] **7. Update Frontend for Mainnet**
  - Edit `frontend/.env.production`: Update `VITE_CONTRACT_ADDRESS`
  - Edit `frontend/.env.production`: Update `VITE_SUBGRAPH_URL` if endpoint changed
- [ ] **8. Enable Maintenance Mode** (optional, recommended for smooth transition)
  - Set `VITE_MAINTENANCE_MODE=true` with message about upgrade
- [ ] **9. Deploy Frontend to Production**
  - Merge PR to main branch
  - Vercel auto-deploys
- [ ] **10. Disable Maintenance Mode**
  - Set `VITE_MAINTENANCE_MODE=false`
  - Monitor for any issues

#### ⚠️ Important Notes
- **Existing markets** on old contract will continue to work until resolved
- **New markets** will be created on v3.6.0 contract
- Consider running **both contracts in parallel** during transition period
- The subgraph can index multiple contract addresses if needed

---

## ✅ v0.7.26 FRONTEND RELEASE (Jan 18, 2026)

### Maintenance Mode
- [x] Added `MaintenancePage` component (full-page block)
- [x] Environment controlled: `VITE_MAINTENANCE_MODE=true`
- [x] Optional custom message and end time

### Price Chart Timeframe Selector
- [x] Added timeframe filter: 1H, 6H, 24H, 7D, ALL
- [x] Default timeframe is 24H

### Branding Updates
- [x] Updated tagline to "PREDICTION MARKET LAUNCHPAD PROTOCOL"
- [x] Removed logo from footer and EntryModal header
- [x] Updated favicon/logo assets

### Predator Polling v2.1
- [x] PortfolioPage: Only poll active tab
- [x] Removed duplicate recovery intervals

### CI/CD Pipeline
- [x] Added subgraph build job
- [x] CI requires both frontend AND subgraph to pass

### Bug Fixes
- [x] Fixed "No one proposed yet" showing when proposal exists (ResolutionPanel)
- [x] Fixed empty bordered div appearing for proposer in dispute window
- [x] Removed jungle image from "MARKET CREATED" success state

---

## ✅ v0.7.25 FRONTEND RELEASE (Jan 17, 2026)

### MarketDetailPage Layout Fix
- [x] Simplified two-column desktop layout (chart+tabs left, panels right)
- [x] Fixed trades/holders/P/L container with consistent `max-h-[400px]`
- [x] Centered empty state messages ("NO TRADES YET", "NO REALIZED P/L YET", "NO HOLDERS")
- [x] Replaced skull emoji (💀) with warning emoji (⚠️) in ErrorBoundary

---

## ✅ v0.7.24 FRONTEND RELEASE (Jan 17, 2026)

### One-Sided Market Handling
- [x] ResolutionPanel: Hide proposal option for one-sided markets
- [x] ResolutionPanel: Show refund timer countdown for one-sided markets
- [x] MarketCard: Badge shows "ONE-SIDED", footer shows refund countdown
- [x] PositionCard: Fixed showing "FINALIZE" when should show "CLAIM REFUND"
- [x] PortfolioPage: One-sided markets categorized as "awaiting resolution"

### Empty Market Timer
- [x] ResolutionPanel: Timer showing "Status changes to UNRESOLVED in: Xh Xm"
- [x] Shows for markets with no participants before 24h mark

### Markets Page Improvements
- [x] FINALIZING sub-filter always visible (disabled when count=0)
- [x] All PENDING sub-filters: AWAITING, PROPOSED, DISPUTED, FINALIZING always shown
- [x] Removed ⚠️ from "DISPUTED - VOTING" text in ResolutionPanel

### MarketCard Improvements
- [x] Renamed "EXPECTED" field to "OUTCOME" for resolved markets
- [x] Renamed "EXPECTED" field to "PROPOSED" for markets with pending proposal
- [x] Contextual field display based on market state

### Portfolio Page Improvements
- [x] Added sorting: HOT (volume), NEW (created), ENDING (expiry), LIQUID (pool size)
- [x] Default sort is "NEW"
- [x] Added heat level filter dropdown matching MarketsPage
- [x] Fixed UNRESOLVED tab: text red only when selected
- [x] Fixed heat dropdown not showing (overflow clipping issue)

### PositionCard Improvements
- [x] Added OUTCOME/PROPOSED/EXPIRY field (context-aware like MarketCard)
- [x] EXPIRED shows in orange (text-orange-400)
- [x] Added POOL SIZE display
- [x] Added VOLUME display
- [x] Added `totalVolume` to market interface

### GraphQL Updates
- [x] positions.queries.ts: Added `totalVolume`, `createdAt` to POSITION_FRAGMENT

---

## ✅ v3.5.0 DEPLOYMENT COMPLETE (Jan 14, 2026)

### Contract v3.5.0 - Heat Level Rebalance ✅
- **Contract Address:** `0x8e6c4437CAE7b9B78C593778cCfBD7C595Ce74a8`
- **BscScan:** https://testnet.bscscan.com/address/0x8e6c4437CAE7b9B78C593778cCfBD7C595Ce74a8
- **Block:** 84281825
- **Verified:** ✅ Yes

### Subgraph v3.4.2 - P/L Tracking ✅
- **Endpoint:** `https://api.studio.thegraph.com/query/1722665/junkiefun-bnb-testnet/3.4.2`
- New P/L fields: `totalPnL`, `tradingPnL`, `resolutionPnL`, `winRate`, etc.
- User entity now tracks all earnings for leaderboard

### Frontend v0.7.16 ✅
- Price Impact documentation with tested values
- Heat badges on Portfolio page (positions + created markets)
- Leaderboard query/types fixes + Predator v2 compliance
- Updated HowToPlayPage, CreateMarketPage, HeatLevelBadge with price impact info

---

## ✅ COMPLETED: Contract v3.5.0 - Heat Level Rebalance

### Problem (SOLVED)
- Current virtual liquidity values were **WAY TOO SMALL**
- 0.7 BNB buy in PRO/WHALE POND moved price 50% → 75% (25pp move!)
- Markets became "dead" after one big trade

### Solution: 5 Tiers with 10x Virtual Liquidity

| Tier | Name | Virtual Liquidity | Status |
|------|------|-------------------|--------|
| 0 | CRACK | 50 BNB | ✅ DEPLOYED |
| 1 | HIGH | 200 BNB | ✅ DEPLOYED |
| 2 | PRO | 500 BNB | ✅ DEPLOYED |
| 3 | APEX | 2,000 BNB | ✅ DEPLOYED |
| 4 | CORE | 10,000 BNB | ✅ DEPLOYED |

### All Tasks Completed
- [x] Update `PredictionMarket.sol` with 5 tiers
- [x] Run full test suite - 164 tests passing
- [x] Deploy new contract v3.5.0
- [x] Update subgraph with new contract address
- [x] Add P/L tracking to subgraph schema
- [x] Deploy subgraph v3.4.2
- [x] Update frontend `.env` with new addresses
- [x] Update frontend legal pages (creator liability)
- [x] Add ScrollToTop component

---

## ✅ COMPLETED: Frontend HeatSelector Update (Jan 2026)

### All 5 Heat Tiers Implemented ✅
- [x] Update `HeatSelector` component for 5 tiers
- [x] Update `CreateMarketPage.tsx` to wire 5 tiers (0-4)
- [x] Update `heatLevel.ts` with all 5 tier configs (DEGEN, STREET, WHALE, INSTITUTION, DEEP SPACE)
- [x] Add APEX/INSTITUTION and CORE/DEEP SPACE styling

---

## ✅ COMPLETED: Public Leaderboard Page (Jan 2026)

- [x] Create `/leaderboard` page
- [x] Query users sorted by `totalPnL`
- [x] Display P/L stats with color coding
- [x] Top 10 display with rank badges (1st, 2nd, 3rd)
- [x] Predator v2: Fetch once on load, refetch on tab focus

### 2. Social Features (Comments) ⬜
- [ ] Setup Supabase project
- [ ] SIWE authentication
- [ ] Comment threads with holder badges
- [ ] Real-time updates
- [ ] Admin moderation

### 3. Production Deployment ⬜
- [ ] Vercel setup for frontend
- [ ] Production subgraph deployment
- [ ] Domain configuration
- [ ] Performance testing

---

## 📊 Current Status by Component

| Component | Version | Status |
|-----------|---------|--------|
| Smart Contracts | v3.6.1 | ✅ READY (180 tests, Slither: 45 findings - no critical) |
| Subgraph | v3.4.2 | ✅ Deployed with P/L tracking |
| Frontend | v0.7.27 | ✅ Updated for v3.6.1 dispute window fix |

---

## ✅ v3.4.1 Integration COMPLETE (Jan 13, 2026)

### Contract (DEPLOYED ✅)
- **Contract Address:** `0x4e20Df1772D972f10E9604e7e9C775B1ae897464`
- **BscScan:** https://testnet.bscscan.com/address/0x4e20Df1772D972f10E9604e7e9C775B1ae897464
- **Verified:** ✅ Yes
- **Tests:** 164 passing

### All Integration Complete ✅
- [x] Subgraph v3.4.1 deployed with Pull Pattern events
- [x] Frontend v0.7.5 with full Pull Pattern UI
- [x] Pending Withdrawals banner on Portfolio page
- [x] Category tabs (ALL | ACTIVE | PENDING | RESOLVED | UNRESOLVED)
- [x] PENDING sub-filters (AWAITING | PROPOSED | DISPUTED | FINALIZING)
- [x] Infinite scroll pagination (20 items per page)
- [x] Predator Polling v2 (80-95% query reduction)

---

## 🚨 NEXT PRIORITIES

### 1. Social Features (Comments) ⬜
- [ ] Setup Supabase project
- [ ] SIWE authentication
- [ ] Comment threads with holder badges
- [ ] Real-time updates
- [ ] Admin moderation

### 2. Production Deployment ⬜
- [ ] Vercel setup for frontend
- [ ] Production subgraph deployment
- [ ] Domain configuration
- [ ] Performance testing

---

## 📊 Current Status by Component

| Component | Version | Status |
|-----------|---------|--------|
| Smart Contracts | v3.6.1 | ✅ READY (180 tests, Slither: 45 findings - no critical) |
| Subgraph | v3.4.2 | ✅ Deployed with P/L tracking |
| Frontend | v0.7.27 | ✅ Updated for v3.6.1 dispute window fix |

---

## 📋 OLD: v3.4.1 Integration Checklist (COMPLETED)

#### 1. Update Subgraph ✅ DONE
- [x] Update `subgraph/subgraph.yaml` with new contract address: `0x4e20Df1772D972f10E9604e7e9C775B1ae897464`
- [x] Update `subgraph/subgraph.yaml` startBlock to `83514593`
- [x] Update `subgraph/abis/PredictionMarket.json` with new ABI
- [x] Add Pull Pattern event handlers
- [x] Add Pull Pattern entities to `schema.graphql`
- [x] Deploy: `graph deploy --studio junkiefun-bnb-testnet --version-label v3.4.1`

#### 2. Update Frontend ✅ DONE
- [x] Update `frontend/.env` with new contract address
- [x] Add Pull Pattern functions to ABI
- [x] Add "WITHDRAW BOND" button to Portfolio page
- [x] Add "WITHDRAW CREATOR FEES" button for creators
- [x] Pending Withdrawals banner
- [x] Category tabs with sub-filters
- [x] Infinite scroll pagination

---

## ✅ COMPLETED: v3.2.0 Bonding Curve Fix

### The Bug (v3.1.0)
The `_calculateSellBnb()` function used average price `(P1 + P2) / 2` which created an **arbitrage vulnerability**:

```
OLD FORMULA (BROKEN):
avgPrice = (priceBeforeSell + priceAfterSell) / 2
bnbOut = shares × avgPrice / 1e18

EXPLOIT:
1. Wallet A buys 0.01 BNB → gets 1.98 shares
2. Wallet B buys 0.1 BNB → gets 16.9 shares  
3. Wallet B sells ALL 16.9 shares → gets 0.1067 BNB
4. RESULT: Wallet B profits 6.7% instantly + keeps 2.2 free shares!
```

### The Fix (v3.2.0)
Changed to use post-sell state for price calculation:

```
NEW FORMULA (FIXED):
virtualSideAfter = virtualSide - shares
totalVirtualAfter = totalVirtual - shares
bnbOut = (shares × UNIT_PRICE × virtualSideAfter) / (totalVirtualAfter × 1e18)

RESULT: Buy→sell always loses ~3% to fees (no arbitrage possible)
```

### Deployment Checklist

#### 1. Deploy New Contract v3.2.0 ⏳
- [ ] Run `forge script script/Deploy.s.sol --rpc-url $BSC_TESTNET_RPC --broadcast`
- [ ] Verify on BscScan
- [ ] Update `deployment-addresses.txt` with new address
- [ ] Test basic functions on testnet (create market, buy, sell)

#### 2. Update Subgraph ⏳
- [ ] Update `subgraph/subgraph.yaml` with new contract address
- [ ] Update `subgraph/abis/PredictionMarket.json` if ABI changed (check `getMaxSellableShares`)
- [ ] Run `npm run codegen && npm run build`
- [ ] Deploy new subgraph version: `graph deploy --studio junkiefun-bnb-testnet`
- [ ] Wait for subgraph to sync (~5-10 min)

#### 3. Update Frontend ⏳
- [ ] Update `frontend/src/shared/config/contracts.ts` with new address
- [ ] Verify ABI is correct (especially `getMaxSellableShares` signature)
- [ ] Test create market flow
- [ ] Test buy/sell flow
- [ ] Test that sell always results in loss (not profit!)
- [ ] Deploy frontend update

#### 4. Cleanup Old Data ⏳
- [ ] Close/resolve any test markets on old contract
- [ ] Document migration in CHANGELOG

---

## 🔥 PRIORITY: Heat Levels Feature (Contract v3.0.0)

### Problem
With 100 virtual liquidity, small bets (0.01-0.1 BNB) barely move the price. Trading feels boring and unprofitable.

### Solution: Configurable Virtual Liquidity per Market

| Level | Name | Virtual Liquidity | Target Bet | ~15% Price Impact |
|-------|------|-------------------|------------|-------------------|
| CRACK | Degen Flash | 5 × 1e18 | 0.005-0.1 BNB | 0.05 BNB |
| HIGH | Street Fight (DEFAULT) | 20 × 1e18 | 0.1-1.0 BNB | 0.5 BNB |
| PRO | Whale Pond | 50 × 1e18 | 1.0-5.0+ BNB | 2.0 BNB |

### Implementation Checklist

#### 1. Smart Contract (v3.1.0) ✅ COMPLETE
- [x] Add `HeatLevel` enum: `CRACK`, `HIGH`, `PRO`
- [x] Add `virtualLiquidity` field to Market struct
- [x] Add configurable defaults: `heatLevelCrack`, `heatLevelHigh`, `heatLevelPro`
- [x] Add `defaultHeatLevel = 20 * 1e18` as fallback
- [x] Update `createMarket()` signature to accept `HeatLevel`
- [x] Update `createMarketAndBuy()` signature to accept `HeatLevel`
- [x] Update `_getYesPrice()` to use `markets[marketId].virtualLiquidity`
- [x] Update `_getNoPrice()` to use `markets[marketId].virtualLiquidity`
- [x] Update `_calculateBuyShares()` to use per-market liquidity
- [x] Update `_calculateSellBnb()` to use per-market liquidity
- [x] Add MultiSig governance for updating heat level defaults (NEW markets only)
- [x] Add `MarketCreated` event with `virtualLiquidity` field
- [x] Add getter `getHeatLevelDefaults()` for frontend
- [x] Add `SweepFunds` ActionType for surplus recovery

#### 2. Tests ✅ COMPLETE (173 tests passing)
- [x] Update all existing tests to pass `HeatLevel.HIGH` as default
- [x] Add tests for `HeatLevel.CRACK` (high volatility)
- [x] Add tests for `HeatLevel.PRO` (low slippage)
- [x] Add tests for invalid heat level (should default to HIGH)
- [x] Add tests for MultiSig updating heat level defaults
- [x] Verify existing markets unaffected by default changes
- [x] Add price impact verification tests
- [x] Add 15 heat level specific tests

#### 3. Subgraph (v0.0.3) ✅ COMPLETE
- [x] Add `virtualLiquidity: BigInt!` to Market entity
- [x] Add `heatLevel: Int!` to Market entity (0=CRACK, 1=HIGH, 2=PRO)
- [x] Update `handleMarketCreated` to read virtualLiquidity
- [x] Add `FundsSweep` entity for SweepFunds tracking
- [x] Add `handleFundsSwept` event handler
- [x] Remove `proposalProofLink` from schema
- [x] Fresh deployment to The Graph Studio

#### 4. Frontend - PARTIAL (Core Complete, UI Pending)
- [x] Update `createMarket` ABI with heatLevel parameter
- [x] Add `heatLevel` and `virtualLiquidity` to GraphQL queries
- [x] Add `heatLevel` and `virtualLiquidity` to Zod schemas
- [x] Remove `proposalProofLink` from queries and schemas
- [x] Update `ResolutionPanel` to remove proof link display
- [ ] Add `HeatLevel` enum type
- [ ] Create `HeatLevelSelector` component (3 cards side-by-side)
- [ ] Update `CreateMarketPage` with heat level selection
- [ ] Show heat level badge on `MarketCard`
- [ ] Show heat level in `MarketDetailPage` info section
- [ ] Update `calculateYesPercent`/`calculateNoPercent` to accept virtualLiquidity

#### 5. Deploy & Test ✅ COMPLETE
- [x] Deploy contract v3.1.0 to BNB Testnet
- [x] Verify on BscScan
- [x] Deploy subgraph v0.0.3
- [x] Update frontend `.env` with new addresses
- [ ] End-to-end testing all heat levels (manual testing pending)

---

## 🎨 UI/UX Improvements (v0.5.0) ✅ COMPLETE

### Legal Compliance ✅
- [x] **Entry Modal** - 3-step onboarding (How it Works, Age Verification, Terms/Privacy acceptance)
- [x] **Cookie Banner** - Essential cookies disclosure with slide-up animation
- [x] **Terms of Service Page** (`/terms`) - Full legal terms with risk disclosure
- [x] **Privacy Policy Page** (`/privacy`) - Blockchain data transparency, wallet tracking notice
- [x] **Footer Links** - Added Terms and Privacy links

### Trading UX ✅
- [x] **Smart Claim Hook** (`useSmartClaim`) - Auto-finalizes market before claiming if needed
- [x] **Sell Warning Tooltip** - Warning when selling 100% of shares about potential claim impact
- [x] **Fee Display Fix** - Changed "Trading Fee: 1.5%" → "Platform Fee: 1% • Creator Fee: 0.5%"

### Branding ✅
- [x] Updated all "Junkie.fun" → "JunkieFun" 
- [x] Updated all "JUNKIE.FUN" → "JUNKIEFUN"

### Files Created
- `/frontend/src/shared/components/legal/EntryModal.tsx`
- `/frontend/src/shared/components/legal/CookieBanner.tsx`
- `/frontend/src/shared/components/legal/index.ts`
- `/frontend/src/features/legal/pages/TermsPage.tsx`
- `/frontend/src/features/legal/pages/PrivacyPage.tsx`
- `/frontend/src/features/legal/index.ts`
- `/frontend/src/shared/hooks/useSmartClaim.ts`

---

## 🔧 DevOps & Monitoring

### Error Tracking - Sentry Setup ⬜ PENDING
- [ ] Create Sentry account and project for JunkieFun
- [ ] Install `@sentry/react` package
- [ ] Initialize Sentry in `main.tsx` with DSN
- [ ] Configure source maps upload for production builds
- [ ] Add Sentry to ErrorBoundary for automatic error capture
- [ ] Set up performance monitoring (optional)
- [ ] Configure environment-based DSN (dev/staging/prod)
- [ ] Add Sentry user context on wallet connection
- [ ] Test error capture in staging environment

---

## 🎯 Current Progress Summary

| Phase | Status | Progress |
|-------|--------|----------|
| Phase 0: Project Setup | ✅ Complete | 100% |
| Phase 1: Smart Contracts | ✅ Complete | 100% (131 tests, v3.3.0) |
| Phase 1.5: Testnet Deploy | ✅ Complete | 100% (v3.3.0 with Proposer Rewards) |
| Phase 2: Subgraph | ⚠️ Needs Update | 90% (needs v3.3.0 address + ABI) |
| Phase 3: Frontend | ⚠️ Needs Update | 95% (needs v3.3.0 address + ABI) |
| Phase 4: Mainnet | ⬜ Not Started | 0% |

### 🚀 BNB Testnet Deployment (January 9, 2026)
- **Contract (v3.3.0):** `0x986BF4058265a4c6A5d78ee4DF555198C8C3B7F7` ✅ LIVE
- **BscScan:** https://testnet.bscscan.com/address/0x986BF4058265a4c6A5d78ee4DF555198C8C3B7F7
- **Verified:** ✅ Yes
- **Tests:** 131 passing (130 + 1 skipped)
- **Features:** Proposer Rewards (0.5% of pool), Heat Levels, Fixed Bonding Curve

### ⚠️ DEPRECATED Contracts
- **v3.1.0:** `0x4C1508BA973856125a4F42c343560DB918c9EB2b` - Arbitrage vulnerability in bonding curve
- **v2.5.0 and earlier:** See DeployedContracts.txt

### 📊 Subgraph v0.0.3 (January 9, 2026) - ⚠️ NEEDS UPDATE
- **Status:** ⚠️ Still pointing to v3.1.0 contract - needs redeployment
- **TODO:** Update to v3.3.0 address `0x986BF4058265a4c6A5d78ee4DF555198C8C3B7F7`
- **TODO:** Add `ProposerRewardPaid` event handler
- **GraphQL Endpoint:** `https://api.studio.thegraph.com/query/1722665/junkiefun-bnb-testnet/v0.0.3`
- **Studio URL:** https://thegraph.com/studio/subgraph/junkiefun-bnb-testnet

### 🎨 Frontend v0.5.0 (January 10, 2026) - ⚠️ NEEDS UPDATE
- **Status:** ⚠️ Still pointing to old contract address
- **TODO:** Update contract address to `0x986BF4058265a4c6A5d78ee4DF555198C8C3B7F7`
- **TODO:** Update ABI with v3.3.0 changes
- **Completed:** Slippage protection UI (SlippageSettings.tsx)

---

## 🔐 PHASE 1: Smart Contracts ✅ COMPLETE (163 tests)

### Security Audit ✅ COMPLETE
- [x] **Integration Tests:** 16 tests covering full lifecycle scenarios
- [x] **Slither Static Analysis:** 42 findings (0 Critical, 0 High)
- [x] **AUDIT.md:** Comprehensive security report created
- [x] **Reentrancy:** Mitigated by OpenZeppelin ReentrancyGuard
- [x] **Access Control:** 3-of-3 MultiSig verified
- [x] **Pre-deployment Checklist:** Documented
- [x] **Weighted Voting Tests:** 8 tests verifying anti-Sybil protection

---

## 📋 Project Overview

A decentralized prediction market platform on BNB Chain where anyone can:
- Create prediction markets (free)
- Trade YES/NO shares via bonding curve (native BNB)
- Resolve markets using **Street Consensus** (bettors vote on outcomes)
- Claim winnings after resolution

**Key Features:**
- Pump.fun-style economics where early buyers profit when later buyers enter
- **Street Consensus** resolution: Fast (30-90 min), no external oracles
- Creator priority window for fair resolution
- Jury fee incentives for voters

---

## 🔧 PHASE 0: Project Setup ✅ COMPLETE

### Environment Setup
- [x] Initialize root project structure
- [x] Create `contracts/` folder with Foundry
- [ ] Create `frontend/` folder with Vite + React
- [ ] Create `subgraph/` folder for The Graph
- [x] Create `.env.example` files for all folders
- [x] Create `requirements.txt` documenting all dependencies

### Contracts Setup (Foundry) ✅
- [x] `forge init contracts`
- [x] Install OpenZeppelin: `forge install OpenZeppelin/openzeppelin-contracts`
- [x] Configure `foundry.toml` (solc 0.8.24, BNB Chain, optimizer enabled)
- [x] Create `remappings.txt`

### Frontend Setup (Vite + React)
- [ ] `npm create vite@latest frontend -- --template react-ts`
- [ ] Install dependencies:
  - [ ] `wagmi`, `viem`, `@rainbow-me/rainbowkit`
  - [ ] `@tanstack/react-query`
  - [ ] `zustand`
  - [ ] `react-hook-form`, `@hookform/resolvers`, `zod`
  - [ ] `tailwindcss`, `postcss`, `autoprefixer`
  - [ ] `axios`
  - [ ] `react-router-dom`
- [ ] Configure Tailwind with retrowave/90s hacker theme
- [ ] Setup folder structure (features/, shared/, providers/, router/)

---

## 🔐 PHASE 1: Smart Contracts ✅ COMPLETE (124 tests)

### Core Contract: `PredictionMarket.sol` ✅

#### State Variables ✅
- [x] Market struct (question, evidenceLink, resolutionRules, expiry, creator, etc.)
- [x] Market ID counter
- [x] Mapping: marketId → Market
- [x] Mapping: marketId → user → Position (yesShares, noShares, claimed, hasVoted, etc.)
- [x] Platform treasury address
- [x] Configurable parameters via MultiSig

#### Configurable Parameters (via MultiSig) ✅
- [x] `platformFeeBps` = 100 (1%) - range 0-5%
- [x] `creatorFeeBps` = 50 (0.5%) - range 0-2%
- [x] `resolutionFeeBps` = 30 (0.3%) - range 0-1%
- [x] `minBondFloor` = 0.005 BNB - range 0.005-0.1 BNB
- [x] `dynamicBondBps` = 100 (1%) - range 0.5-5%
- [x] `bondWinnerShareBps` = 5000 (50%) - range 20-80%
- [x] `minBet` = 0.005 BNB

#### Timing Constants ✅
- [x] `CREATOR_PRIORITY_WINDOW` = 10 minutes
- [x] `DISPUTE_WINDOW` = 30 minutes
- [x] `VOTING_WINDOW` = 1 hour
- [x] `EMERGENCY_REFUND_DELAY` = 24 hours

#### Bonding Curve Math ✅
- [x] Virtual liquidity: 100 YES + 100 NO at start (scaled to 1e18)
- [x] Price calculation: P(yes) = virtualYes / (virtualYes + virtualNo) * UNIT_PRICE
- [x] Constraint: P(yes) + P(no) = UNIT_PRICE (0.01 BNB)
- [x] Buy: Calculate shares for BNB amount (instantaneous price)
- [x] Sell: Calculate BNB return using AVERAGE price (ensures pool solvency)
- [x] Rounding: Down for payouts, up for costs
- [x] **VERIFIED:** Pump & dump economics working (early +36.6%, late -27%)

#### Core Functions ✅
- [x] `createMarket(question, evidenceLink, resolutionRules, expiryTimestamp)`
  - Free (0 BNB + gas)
  - Validates expiry is in future
  - EvidenceLink optional (degen-friendly)
  - Emits `MarketCreated` event
- [x] `createMarketAndBuy()` - Atomic create + first buy (anti-frontrun)
- [x] `buyYes(marketId, minSharesOut) payable`
  - Takes 1% platform fee → treasury
  - Takes 0.5% creator fee → market.creator
  - Slippage protection via minSharesOut
- [x] `buyNo(marketId, minSharesOut) payable`
- [x] `sellYes(marketId, shares, minBnbOut)`
- [x] `sellNo(marketId, shares, minBnbOut)`

#### Street Consensus Resolution ✅
- [x] `proposeOutcome(marketId, outcome, proofLink) payable`
  - Creator has 10 min priority window
  - Posts bond: max(minBondFloor, pool * dynamicBondBps)
  - Proof link optional
  - Emits `OutcomeProposed` event
- [x] `dispute(marketId, proofLink) payable`
  - Requires 2× proposer's bond
  - Only 1 dispute per market
  - Can include counter-proof
  - Emits `MarketDisputed` event
- [x] `vote(marketId, supportProposer)`
  - Only shareholders can vote
  - Weight = total shares (yes + no)
  - Can't vote twice
  - Emits `VoteCast` event
- [x] `finalizeMarket(marketId)`
  - Called after voting ends
  - Simple majority wins
  - Distributes bonds (winner 50%, voters 50% of loser)
  - Tie (0 vs 0) returns both bonds
  - Emits `MarketFinalized`, `MarketResolved`

#### Claim Functions ✅
- [x] `claim(marketId)`
  - Pro-rata share of pool based on winning side
  - Double-claim protection
- [x] `emergencyRefund(marketId)`
  - Available 24h after expiry with no proposal
  - Proportional to total shares
  - Order-independent fairness

#### View Functions ✅
- [x] `getMarket(marketId)` → Full market data (10 values)
- [x] `getYesPrice(marketId)` → uint256
- [x] `getNoPrice(marketId)` → uint256
- [x] `getPosition(marketId, user)` → (yesShares, noShares, claimed, emergencyRefunded, hasVoted, votedForProposer)
- [x] `getMarketStatus(marketId)` → MarketStatus enum (Active/Expired/Proposed/Disputed/Resolved)
- [x] `previewBuy(marketId, bnbAmount, isYes)` → shares
- [x] `previewSell(marketId, shares, isYes)` → bnbAmount
- [x] `getMaxSellableShares(marketId, userShares, isYes)` → (maxShares, bnbOut) **NEW**
- [x] `getRequiredBond(marketId)` → bond amount
- [x] `canEmergencyRefund(marketId)` → (eligible, timeUntil)

#### Events ✅
- [x] `MarketCreated`
- [x] `Trade`
- [x] `OutcomeProposed`
- [x] `MarketDisputed`
- [x] `VoteCast`
- [x] `MarketFinalized`
- [x] `MarketResolved`
- [x] `Claimed`
- [x] `JuryFeePaid`
- [x] `EmergencyRefunded`
- [x] `ActionProposed` / `ActionConfirmed` / `ActionExecuted`
- [x] `Paused` / `Unpaused`

#### Security ✅
- [x] ReentrancyGuard on all payable functions
- [x] CEI pattern (Checks-Effects-Interactions)
- [x] Overflow protection (Solidity 0.8.24)
- [x] Access control: `onlySigner`
- [x] InsufficientPoolBalance check
- [x] Slippage protection parameters
- [x] Double-vote prevention
- [x] Bond validation

#### Governance (3-of-3 MultiSig) ✅
- [x] `proposeAction()` / `confirmAction()` / `executeAction()`
- [x] All parameters configurable
- [x] Pause/unpause functionality
- [x] 1-hour action expiry

### Tests ✅ (148 passing)
- [x] Unit tests (60 tests)
  - Market creation, trading, fees
  - Street Consensus: propose, dispute, vote, finalize
  - Claims, emergency refunds
  - **Weighted voting security (8 tests - NEW)**
- [x] Fuzz tests (29 tests)
  - Bonding curve math
  - All 5 configurable parameters
  - Edge cases
- [x] Vulnerability tests (4 tests)
  - Reentrancy
  - Overflow
  - Access control
- [x] Economics tests (31 tests)
  - Pump & dump verification
  - Pool solvency
  - Creator first-mover advantage
- [x] **Instant Sell Analysis (8 tests)**
  - Tests what happens when user tries to sell immediately
  - Tests for `getMaxSellableShares()` contract function
- [x] **Integration tests (16 tests)**
  - Full lifecycle testing
  - Happy path, disputed path, emergency path
- [x] Economics tests (31 tests)
  - Pump & dump verification
  - Pool solvency
  - Creator first-mover advantage
- [x] **Instant Sell Analysis (8 tests)** - NEW
  - Tests what happens when user tries to sell immediately
  - Tests for `getMaxSellableShares()` contract function
  - See critical findings below

### ⚠️ Critical Finding: Instant Sell Liquidity Constraint

**Issue Discovered:** When a user is the ONLY buyer in a market (no opposing side liquidity), they CANNOT immediately sell 100% of their position.

| Buy Amount | Max Instant Sellable | Position Stuck |
|------------|---------------------|----------------|
| 0.01 BNB (~$5) | 99% | 1% |
| 0.1 BNB (~$50) | 95% | 5% |
| 0.5 BNB (~$250) | 83% | 17% |
| **1 BNB (~$500)** | **74%** | **26%** |
| 2 BNB (~$1000) | 65% | 35% |

**Root Cause:** The `_calculateSellBnb()` function uses average price between before and after sell. When you're the only buyer, the pool doesn't have enough BNB to cover the average price return for your full position.

**Good News:** When there IS opposing liquidity (buyers on both YES and NO):
- ✅ Full instant selling WORKS perfectly
- ✅ The user can even PROFIT if they buy the cheap side and sell immediately

**Mitigation (already working):**
- Contract reverts with `InsufficientPoolBalance` if sell would drain pool
- Users can always sell partial positions
- Healthy markets with both-side activity don't have this issue
- **NEW:** `getMaxSellableShares()` view function calculates max sellable in one call

**Frontend Implementation (using `getMaxSellableShares()`):**
```typescript
// Get user's position
const { yesShares } = await contract.getPosition(marketId, userAddress);

// Get max sellable (single RPC call!)
const { maxShares, bnbOut } = await contract.getMaxSellableShares(
  marketId,
  yesShares,
  true // isYes
);

// Display to user
const percentage = (maxShares * 100n) / yesShares;
if (percentage < 100n) {
  // Show warning: "Low liquidity - can only sell {percentage}% now"
  // Show "Sell Max Available" button
}
```

**Frontend UI Requirements:**
- [ ] Call `getMaxSellableShares()` when user opens sell panel
- [ ] Display "Max Sellable Now: X shares (Y%)" 
- [ ] Show "⚠️ Low Liquidity" warning when < 100%
- [ ] Add "Sell Max Available" button (uses `maxShares` from contract)
- [ ] Show "Liquidity Health" indicator (green ≥90%, yellow 50-90%, red <50%)
- [ ] Update values in real-time as market state changes

**Status:** This is **by design** - the bonding curve protects the pool. The frontend must communicate this clearly to users.

### Documentation ✅
- [x] README.md - Economics in 20 seconds
- [x] CHANGELOG.md - v2.0.0 Street Consensus, v2.3.0 Weighted Voting Tests
- [x] PROJECT_CONTEXT.md - Architecture reference
- [x] RUNBOOK.md - Commands guide
- [x] DeployedContracts.txt - Testnet deployment info

### Deployment ✅
- [x] Deployment script for BSC Testnet
- [x] Deploy to BNB Testnet (0x568FEafFa8c7eED1D81d120a58f4e8DF7bc4E336)
- [x] Verify contract on BscScan
- [x] Document deployed addresses
- [ ] Deployment script for BSC Mainnet (after testing)

---

## 📊 PHASE 2: The Graph (Subgraph) ✅ CODE COMPLETE

### Setup ✅
- [ ] Create account on Subgraph Studio (https://thegraph.com/studio) **← USER ACTION NEEDED**
- [ ] Create new subgraph: `junkiefun-bnb-testnet`
- [x] Install Graph CLI & dependencies
- [x] Initialize subgraph project structure
- [x] Generate types (`npm run codegen`)
- [x] Build subgraph (`npm run build`) - ✅ Compiles successfully

### Schema (`schema.graphql`) ✅
- [x] `Market` entity - Full market data with resolution status, voting
- [x] `Trade` entity - All buy/sell trades with price tracking
- [x] `User` entity - Trader profiles with volume stats
- [x] `Position` entity - User positions per market with avg price
- [x] `Vote` entity - Voting records with weighted votes
- [x] `Claim` entity - Payout claim records
- [x] `EmergencyRefund` entity - Emergency refund records  
- [x] `GlobalStats` entity - Platform-wide statistics (singleton)

### Mappings (`src/mapping.ts`) ✅
- [x] `handleMarketCreated` - Index new markets, create users
- [x] `handleTrade` - Index trades, update supplies/volume/positions
- [x] `handleOutcomeProposed` - Track proposals with bonds
- [x] `handleProposalDisputed` - Track disputes with bonds
- [x] `handleVoteCast` - Track weighted votes for Street Consensus
- [x] `handleMarketResolved` - Final outcome
- [x] `handleClaimed` - Track claims, update positions
- [x] `handleEmergencyRefunded` - Track refunds, update positions
- [x] `handleBondDistributed` - Bond distribution analytics
- [x] `handleJuryFeeDistributed` - Voter reward analytics

### Deployment (Testnet)
- [ ] Authenticate: `graph auth --studio <DEPLOY_KEY>`
- [ ] Deploy: `npm run deploy`
- [ ] Test queries in Playground
- [ ] Document subgraph URL

### Mainnet (After Testnet Validation)
- [ ] Deploy contract to BNB Mainnet
- [ ] Create `subgraph.mainnet.yaml` config
- [ ] Create mainnet subgraph on Studio: `junkiefun-bnb-mainnet`
- [ ] Deploy mainnet subgraph

---

## 💻 PHASE 3: Frontend

### 🔒 SECURITY: URL Sanitization (CRITICAL!)

**Problem:** Anyone can call the smart contract directly and store malicious URLs in `imageUrl` or `evidenceLink` fields. SVG files can contain JavaScript that executes when rendered.

**Solution:** Frontend must sanitize ALL user-provided URLs before display.

#### Image URL Protection (`imageUrl` field)
- [ ] Create `shared/utils/sanitize.ts` with URL validation functions
- [ ] **Whitelist allowed domains:** IPFS gateways, Imgur, known hosts only
- [ ] **Check file extensions:** Only allow `.jpg`, `.jpeg`, `.png` (NO `.svg`)
- [ ] **Always use `<img>` tag:** Never use `<object>`, `<embed>`, or `dangerouslySetInnerHTML`
- [ ] **Fallback to placeholder:** Show default image if URL fails validation
- [ ] **Add `onError` handler:** Fallback if image fails to load

```typescript
// Example: SafeImage component
const ALLOWED_HOSTS = [
  'ipfs.io',
  'gateway.pinata.cloud', 
  'i.imgur.com',
  'cloudflare-ipfs.com'
];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png'];

function isAllowedImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const hostAllowed = ALLOWED_HOSTS.some(h => parsed.hostname.endsWith(h));
    const extAllowed = ALLOWED_EXTENSIONS.some(e => parsed.pathname.toLowerCase().endsWith(e));
    return hostAllowed && extAllowed;
  } catch {
    return false;
  }
}
```

#### Evidence Link Protection (`evidenceLink` field)
- [ ] **Never render as image:** Always display as clickable text link
- [ ] **Validate URL format:** Must be valid `http://` or `https://` URL
- [ ] **Use `rel="noopener noreferrer"`:** Prevent window.opener attacks
- [ ] **Open in new tab:** Use `target="_blank"`
- [ ] **Show domain only in UI:** Display "coingecko.com" not full URL (cleaner + safer)

```typescript
// Example: SafeLink component
function SafeLink({ url }: { url: string }) {
  const isValid = /^https?:\/\/.+/.test(url);
  if (!isValid) return <span className="text-gray-500">{url}</span>;
  
  return (
    <a href={url} target="_blank" rel="noopener noreferrer">
      {new URL(url).hostname}
    </a>
  );
}
```

#### Content Security Policy (CSP) Headers
- [ ] Configure CSP headers in Vercel/deployment config
- [ ] Restrict `img-src` to allowed domains
- [ ] Set `object-src 'none'` to block SVG script execution
- [ ] Set `script-src 'self'` to prevent inline script injection

```
Content-Security-Policy: 
  default-src 'self';
  img-src 'self' https://ipfs.io https://gateway.pinata.cloud https://i.imgur.com data:;
  script-src 'self';
  object-src 'none';
```

#### Text Field Protection (question, resolutionRules)
- [ ] **Never use `dangerouslySetInnerHTML`:** React auto-escapes by default
- [ ] **Sanitize if rendering HTML:** Use DOMPurify if absolutely needed
- [ ] **Validate max lengths:** Prevent UI overflow attacks

**Why this matters:** Smart contracts are public APIs. Anyone can bypass the frontend and store malicious data directly. The frontend is the ONLY security layer for display.

---

### Project Structure
```
frontend/src/
├── features/
│   ├── markets/
│   │   ├── api/           # GraphQL queries, contract writes
│   │   ├── components/    # MarketCard, TradePanel, etc.
│   │   ├── hooks/         # useMarkets, useMarket, useTrade
│   │   ├── pages/         # MarketsPage, MarketDetailPage
│   │   └── types/
│   ├── resolution/        # NEW: Street Consensus UI
│   │   ├── components/    # ProposePanel, DisputePanel, VotePanel
│   │   └── hooks/         # usePropose, useDispute, useVote
│   ├── home/
│   │   └── pages/         # HomePage (hero, featured markets)
│   └── create/
│       ├── components/    # CreateMarketForm
│       └── pages/         # CreateMarketPage
├── shared/
│   ├── components/ui/     # Button, Card, Modal, Input, etc.
│   ├── config/            # wagmi, env, contracts
│   └── utils/
├── providers/
└── router/
```

### Resolution UI Components (Street Consensus)
- [ ] `ProposeOutcomePanel` - Propose YES/NO with bond
- [ ] `DisputePanel` - Challenge with 2× bond
- [ ] `VotingPanel` - Vote for proposer/disputer
- [ ] `ResolutionTimeline` - Show current phase & countdown
- [ ] `BondCalculator` - Show required bond
- [ ] `VoteWeightDisplay` - Show user's voting power
- [ ] `JuryFeeEstimate` - Estimated earnings for voting

### 🗳️ Vote Button Visibility (IMPORTANT!)
**Requirement:** The Vote button should ONLY be visible/enabled for users who have a position in the market.

**Logic:**
```typescript
// Check if user has any shares in this market
const { yesShares, noShares } = await contract.getPosition(marketId, userAddress);
const hasPosition = yesShares > 0n || noShares > 0n;

// Only show Vote button if:
// 1. Market status is DISPUTED (voting phase)
2. User has position (yesShares > 0 OR noShares > 0)
3. User hasn't voted yet (hasVoted === false)
const canVote = marketStatus === 'Disputed' && hasPosition && !hasVoted;
```

**UI Requirements:**
- [ ] Hide Vote button entirely if user has no position (yesShares = 0 AND noShares = 0)
- [ ] Show "You must hold shares to vote" message if user clicks on disabled voting area
- [ ] Display user's voting weight prominently: "Your vote weight: {yesShares + noShares} shares"
- [ ] Grey out Vote button if user has already voted, show "You voted for {Proposer/Disputer}"
- [ ] Voting weight = total shares (YES + NO combined)

**Why this matters:**
- Only bettors can vote (they have skin in the game)
- Prevents vote spam from non-participants
- Vote weight is proportional to position size
- Contract will revert `vote()` if user has no shares anyway

### Pages
- [ ] `MarketsPage` - List all markets
- [ ] `MarketDetailPage` - Single market + resolution UI
- [ ] `CreateMarketPage` - Create new market
- [ ] `PortfolioPage` - User's positions & pending jury fees
- [x] `TermsPage` - Terms of Service (`/terms`)
- [x] `PrivacyPage` - Privacy Policy (`/privacy`)

### 🔄 Expired Market Resolution Strategy (PortfolioPage/MarketDetailPage)
**Scenario:** User has position in an expired market with no proposal yet.

**Show two clear options:**
```
┌─────────────────────────────────────────────────────────┐
│  ⏰ Market Expired - Your Position: 0.5 BNB in YES      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [⚡ Settle Now]              [🕐 Wait for Refund]      │
│  Bond: 0.005 BNB              FREE                      │
│  Get BNB in ~30 min           Available in 23h 42m      │
│  (bond returned after)                                  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Implementation:**
```typescript
// Check if user can settle vs wait
const { eligible, timeUntil } = await contract.canEmergencyRefund(marketId);
const requiredBond = await contract.getRequiredBond(marketId);

// Option A: Settle Now (propose outcome)
// - Costs: requiredBond (returned if no dispute)
// - Time: ~30 min (dispute window)
// - Best for: Impatient users, small bond markets

// Option B: Wait for Refund
// - Costs: FREE
// - Time: timeUntil (countdown to 24h after expiry)
// - Best for: Patient users, or if bond is too high
```

**UI Requirements:**
- [ ] Show both options side-by-side for expired markets
- [ ] Display bond amount clearly for "Settle Now"
- [ ] Show countdown timer for "Wait for Refund"
- [ ] Explain that bond is returned if no dispute
- [ ] Default highlight "Wait for Refund" (free option)

### ⏰ Market Expiry Picker (CreateMarketPage)
**Contract accepts:** Unix timestamp (any future time - no min/max restrictions)

**Recommended UI:** Preset duration buttons + optional custom picker

```
┌─────────────────────────────────────┐
│  When does this resolve?            │
├─────────────────────────────────────┤
│  [1 Hour] [4 Hours] [24 Hours]      │
│  [3 Days] [1 Week]  [Custom...]     │
└─────────────────────────────────────┘
```

**Implementation:**
```typescript
const durations = {
  '1h': 60 * 60,
  '4h': 4 * 60 * 60,
  '24h': 24 * 60 * 60,
  '3d': 3 * 24 * 60 * 60,
  '1w': 7 * 24 * 60 * 60,
};

// Calculate expiry timestamp
const expiryTimestamp = Math.floor(Date.now() / 1000) + durations['24h'];

// Or from custom date picker
const selectedDate = new Date('2026-01-15T15:00:00');
const expiryTimestamp = Math.floor(selectedDate.getTime() / 1000);
```

**UI Requirements:**
- [ ] Preset buttons for common durations (1h, 4h, 24h, 3d, 1w)
- [ ] "Custom" button opens date/time picker
- [ ] Show countdown preview: "Expires in 23h 59m"
- [ ] Validate expiry is in future before submit
- [ ] Default selection: 24 hours (most common for degen markets)

### 💡 UX/UI: Simplified Trading Display (IMPORTANT!)
**Goal:** Make the complex bonding curve math invisible. Show 3 simple numbers:

1. **"Buy Price"** - How much it costs to join the fight (per share or for X BNB)
2. **"Exit Now"** - The dump value (what you'd get if you sold immediately)
3. **"Potential Payout"** - What you get if you're right and hold until the end

**Implementation Notes:**
- Use `previewBuy()` for Buy Price calculation
- Use `previewSell()` for Exit Now calculation  
- Use share count × UNIT_PRICE for Potential Payout (if you win 100%)
- Show these 3 numbers prominently on every trade panel
- Update in real-time as user changes bet amount
- Color code: Green for profit scenarios, Red for loss scenarios

**Example Display:**
```
┌─────────────────────────────────────┐
│  You're betting: 0.1 BNB on YES     │
├─────────────────────────────────────┤
│  📊 Buy Price:      0.0052 BNB/share│
│  🚪 Exit Now:       0.095 BNB       │
│  🏆 Potential Win:  0.19 BNB        │
│                     (+90% if YES)   │
└─────────────────────────────────────┘
```

**Rationale:** Users don't need to understand bonding curves, virtual liquidity, 
or average price formulas. They just need to know: cost, exit, potential win.

---

## 🧪 PHASE 4: Testing & Deployment

### Contract Testing ✅
- [x] All unit tests passing (52)
- [x] All fuzz tests passing (29)
- [x] All feature tests passing (31)
- [x] All vulnerability tests passing (4)
- [x] Gas optimization (optimizer enabled)

### Frontend Testing
- [ ] Component renders correctly
- [ ] Wallet connection works
- [ ] Trade flow works on testnet
- [ ] Resolution flow works (propose/dispute/vote/finalize)
- [ ] Claim flow works on testnet

### Testnet Deployment
- [ ] Deploy contract to BSC Testnet
- [ ] Deploy subgraph to Subgraph Studio (testnet)
- [ ] Deploy frontend to Vercel (preview)
- [ ] Full E2E testing

### Mainnet Deployment
- [ ] Security audit (optional but recommended)
- [ ] Deploy contract to BSC Mainnet
- [ ] Verify on BscScan
- [ ] Deploy subgraph to Subgraph Studio (mainnet)
- [ ] Deploy frontend to Vercel (production)
- [ ] Set up monitoring

---

## 📝 Notes

### Key Constants
| Constant | Value | Description |
|----------|-------|-------------|
| UNIT_PRICE | 0.01 BNB | P(YES) + P(NO) always equals this |
| MIN_BET | 0.005 BNB | Minimum bet amount (~$3) |
| platformFeeBps | 100 (1%) | Platform fee on trades |
| creatorFeeBps | 50 (0.5%) | Creator fee on trades |
| resolutionFeeBps | 30 (0.3%) | Fee on resolution actions |
| minBondFloor | 0.02 BNB | Minimum proposal bond |
| bondWinnerShareBps | 5000 (50%) | Winner's share of loser bond |
| CREATOR_PRIORITY | 10 min | Creator's head start |
| DISPUTE_WINDOW | 30 min | Time to challenge |
| VOTING_WINDOW | 1 hour | Voting period |
| EMERGENCY_REFUND | 24 hours | Refund eligibility |

### External Dependencies
- **None!** Street Consensus has no external oracle dependencies
- WBNB no longer needed for bonds (uses native BNB)

### Resources
- [The Graph Docs](https://thegraph.com/docs/)
- [Wagmi Docs](https://wagmi.sh/)
- [RainbowKit Docs](https://www.rainbowkit.com/docs)

---

## ✅ Completed Phases

### Phase 0: Project Setup ✅
- Foundry initialized with OpenZeppelin & forge-std
- Project documentation complete

### Phase 1: Smart Contracts ✅ (124 tests passing)
- `PredictionMarket.sol` - Complete
- Street Consensus resolution system
- 5 configurable parameters via MultiSig
- Bonding curve with pump & dump economics verified
- All tests passing:
  - 52 unit tests
  - 29 fuzz tests
  - 31 economics + feature tests
  - 4 vulnerability tests

**Key files:**
- `/contracts/src/PredictionMarket.sol` - Main contract
- `/contracts/test/PredictionMarket.t.sol` - Unit tests
- `/contracts/test/PredictionMarket.fuzz.t.sol` - Fuzz tests
- `/contracts/test/PumpDump.t.sol` - Economics tests
- `/contracts/PROFIT.txt` - Economics math proof
