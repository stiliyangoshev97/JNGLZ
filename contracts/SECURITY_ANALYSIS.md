# Security Analysis: v3.6.0 → v3.6.2 Emergency Refund & Resolution Fixes

**Date:** January 19, 2026  
**Version:** v3.6.2 (includes v3.6.0 and v3.6.1 fixes)  
**Analyst:** GitHub Copilot  
**Status:** ✅ ALL VULNERABILITIES FIXED

---

## Executive Summary

Version 3.6.2 addresses all identified security vulnerabilities in the PredictionMarket contract:

| Version | Vulnerabilities Fixed | Tests |
|---------|----------------------|-------|
| v3.6.0 | Double-spend, Pool insolvency, Race condition, Stale pool data | 180 |
| v3.6.1 | Dispute window edge case | 180 |
| v3.6.2 | One-sided markets, Emergency refund bypass, Stale proposer state | 189 |

**All 189 tests passing. Contract is ready for deployment.**

---

## Part 1: Critical Vulnerabilities Found & Fixed

### 🚨 CRITICAL: Emergency Refund Double-Spend Vulnerability (FIXED in v3.6.0)

**Discovered:** January 18, 2026  
**Severity:** CRITICAL  
**Status:** ✅ FIXED in v3.6.0

#### Vulnerability Details

| # | Bug Name | Description | Impact | Severity |
|---|----------|-------------|--------|----------|
| 1 | **Double-Spend** | User could call `emergencyRefund()` then `claim()` after market resolution | User gets ~2x payout (refund + winning claim) | 🔴 CRITICAL |
| 2 | **Pool Insolvency** | `emergencyRefund()` didn't reduce `poolBalance` | Contract shows funds it doesn't have, can't pay all winners | 🔴 CRITICAL |
| 3 | **Race Condition** | Proposals/disputes could happen at 22-24h after expiry, conflicting with emergency refund window | Resolution and emergency refund paths could overlap | 🟠 HIGH |
| 4 | **Stale Pool Data** | `claim()` didn't reduce `poolBalance` after payouts | Pool shows BNB that's already been paid out (accounting issue) | 🟡 MEDIUM |

#### Attack Scenario (Pre-v3.6.0)

```
1. Alice buys 1 BNB of YES shares in a market
2. Market expires, no one proposes for 24 hours
3. Alice calls emergencyRefund() → gets ~1 BNB back
4. Someone proposes YES outcome at hour 23
5. Market resolves with YES winning
6. Alice calls claim() → gets winning payout (~1 BNB again)
7. Alice receives ~2x her original investment
8. Contract is now insolvent - can't pay other winners
```

#### v3.6.0 Fixes Applied

**Fix 1: Double-Spend Prevention**
```solidity
function claim(uint256 marketId) external {
    Position storage position = positions[marketId][msg.sender];
    if (position.emergencyRefunded) revert AlreadyEmergencyRefunded(); // ✅ ADDED
    // ...
}
```

**Fix 2: Pool Insolvency Prevention**
```solidity
function emergencyRefund(uint256 marketId) external {
    // ... calculate refund ...
    market.poolBalance -= refund;           // ✅ ADDED
    market.yesSupply -= position.yesShares; // ✅ ADDED
    market.noSupply -= position.noShares;   // ✅ ADDED
    position.yesShares = 0;                 // ✅ ADDED
    position.noShares = 0;                  // ✅ ADDED
    position.emergencyRefunded = true;
    // ... transfer refund ...
}
```

**Fix 3: Race Condition Prevention (2-hour cutoff for PROPOSALS ONLY)**
```solidity
uint256 public constant RESOLUTION_CUTOFF_BUFFER = 2 hours; // ✅ ADDED

function proposeOutcome(uint256 marketId, bool outcome) external {
    uint256 emergencyRefundTime = market.expiryTimestamp + EMERGENCY_REFUND_DELAY;
    if (block.timestamp >= emergencyRefundTime - RESOLUTION_CUTOFF_BUFFER) {
        revert ProposalWindowClosed(); // ✅ ADDED
    }
    // ...
}
```

**Fix 4: Clean Pool Accounting**
```solidity
function claim(uint256 marketId) external {
    // ... calculate payout ...
    market.poolBalance -= grossPayout;      // ✅ ADDED
    if (market.outcome) {
        market.yesSupply -= winningShares;  // ✅ ADDED
    } else {
        market.noSupply -= winningShares;   // ✅ ADDED
    }
    // ... transfer payout ...
}
```

---

### 🟡 MEDIUM: Dispute Window Edge Case (FIXED in v3.6.1)

**Discovered:** January 18, 2026  
**Severity:** MEDIUM  
**Status:** ✅ FIXED in v3.6.1

#### v3.6.0 Bug Found

The v3.6.0 fix applied the 2-hour cutoff to BOTH `proposeOutcome()` AND `dispute()`. This created a critical edge case:

**The Problem:** If someone proposes at T=21:59 (1 minute before the 2-hour cutoff), the cutoff would kick in at T=22:00, blocking ALL disputes with `DisputeWindowClosed` error. This allowed a malicious proposer to propose a WRONG outcome knowing nobody could dispute it.

#### Attack Scenario (v3.6.0)

```
1. Market expires at T=0
2. Malicious actor waits until T=21:59:30
3. Proposes WRONG outcome (e.g., YES when NO is true)
4. Cutoff kicks in at T=22:00
5. Honest users try to dispute at T=22:00:01 → BLOCKED by DisputeWindowClosed
6. 30-minute dispute window expires at T=22:29:30
7. Market finalizes with WRONG outcome
8. Honest users lose their money to the attacker
```

#### v3.6.1 Fix Applied

Removed the cutoff check from `dispute()` function. Disputes are now ONLY blocked by the natural 30-minute dispute window expiry, not by the 2-hour cutoff.

```solidity
// v3.6.1: REMOVED cutoff check from dispute()
function dispute(uint256 marketId) external {
    // REMOVED in v3.6.1: 
    // if (block.timestamp >= emergencyRefundTime - RESOLUTION_CUTOFF_BUFFER) {
    //     revert DisputeWindowClosed();
    // }
    
    // KEPT: Natural 30-min window check only
    if (block.timestamp > market.proposalTime + DISPUTE_WINDOW) {
        revert DisputeWindowExpired();
    }
    // ...
}
```

#### Why This is Safe

The proposal cutoff at 22h already guarantees resolution completes before the 24h emergency refund:

```
Timeline Analysis:
─────────────────────────────────────────────────────────────────────────────
Worst case: Proposal at T=21:59:59 (last second before cutoff)

T=21:59:59  Proposal submitted
T=22:29:58  Dispute at last second of 30-min window  
T=23:29:58  Voting ends (1h after dispute)
T=23:29:59  Finalize called
T=24:00:00  Emergency refund becomes available

GAP: 30 minutes between finalization and emergency refund - SAFE!
─────────────────────────────────────────────────────────────────────────────

The key insight: By blocking NEW PROPOSALS at 22h, we guarantee that even 
the worst-case resolution timeline (proposal + dispute + voting) completes 
at most at 23:30, leaving a 30-minute safety buffer before emergency refund.
```

#### Test Coverage Added
- `test_Dispute_RevertWhenDisputeWindowExpired` - Tests natural 30-min window
- `test_Dispute_AllowedAfterCutoff_IfWithinDisputeWindow` - Verifies the fix works
- **180 total tests passing**

---

## Part 2: Bond/Fee Claiming Security Analysis

### Executive Summary

After analyzing the codebase with the v3.6.0/v3.6.1 timeline constraints, **NO vulnerabilities were found** in the bond/fee claiming mechanisms related to emergency refunds.

The v3.6.0 fix (2-hour proposal cutoff) creates a clear separation:
- **Resolved markets** → users claim via `claim()` (bonds/fees distributed normally)
- **Unresolved markets after 24h** → users get emergency refund (no resolution, no bonds to distribute)

These two paths are **mutually exclusive** by design.

---

### Timeline Analysis (Critical Context) - Updated for v3.6.1

```
Expiry ──────────────────────────────────────────────────────> Emergency Refund
  │                                                                   │
  │  0-22h: Proposal window open                                     │ 24h+
  │  ├─ Propose (10min creator priority, then anyone)                │
  │  ├─ Dispute window (30min after proposal) - ALWAYS ALLOWED       │
  │  └─ Voting window (1h after dispute)                             │
  │                                                                   │
  │  22-24h: PROPOSAL CUTOFF (v3.6.0)                                │
  │          ├─ NO new proposals allowed                              │
  │          └─ Disputes STILL ALLOWED within 30-min window (v3.6.1) │
  │                                                                   │
```

**Maximum resolution timeline (v3.6.1):**
- Last proposal at 21:59:59 (cutoff is at 22:00:00)
- Last dispute at 22:29:59 (30min dispute window)
- Voting ends at 23:29:59 (1h voting window)
- **Gap of 30 minutes** ensures resolution always completes before emergency refund

**Key insight:** The proposal cutoff at 22h is the key constraint. By preventing new proposals, we guarantee the maximum resolution time is ~1.5 hours (30min dispute + 1h vote), which always completes before the 24h emergency refund window.

---

### Components Analyzed

#### 1. Proposer Bonds ✅ **SAFE**
**Why:** Proposer bonds exist only in markets going through resolution. If market resolves → bond returned/distributed. If market doesn't resolve (no proposal) → no bond exists → emergency refund path.

These paths are mutually exclusive.

---

#### 2. Disputer Bonds ✅ **SAFE**  
**Why:** Same logic. Disputer bonds only exist if dispute occurred → market will resolve before 24h → no emergency refund possible.

---

#### 3. Voter Jury Fees ✅ **SAFE**
**Initial concern:** User votes, then takes emergency refund, loses jury fees.

**Why this is IMPOSSIBLE:**
1. Voting only happens during `Disputed` status
2. Dispute can only happen within 30min of a proposal
3. Proposals can only happen before 22h cutoff
4. Voting window is 1h after dispute
5. Maximum: proposal at 21:59 + dispute at 22:29 + 1h voting = resolves at 23:29
6. Emergency refund requires 24h AND unresolved market
7. **If user voted → market will resolve → no emergency refund available**

---

#### 4. Creator Fees ✅ **SAFE**
**Why:** Creator fees are collected at trade time (before funds enter pool). They're stored in `pendingCreatorFees[creator]` separately. Emergency refunds only affect `poolBalance`. Creator can always withdraw their fees.

---

#### 5. Platform Fees ✅ **SAFE**
**Why:** Sent immediately to treasury at trade time. Never stored in contract.

---

#### 6. Resolution Fees ✅ **SAFE**
**Why:** Resolution fee (0.3%) only taken during `claim()`. v3.6.0 fix prevents claim after emergency refund. No edge case.

---

#### 7. Pull Pattern Withdrawals ✅ **SAFE**
**Why:** `pendingWithdrawals` and `pendingCreatorFees` are per-user global balances, not per-market. Completely separate from market pools and emergency refunds.

---

### Summary Table

| Component | Vulnerable? | Notes |
|-----------|-------------|-------|
| Proposer Bonds | ✅ No | Resolution path only |
| Disputer Bonds | ✅ No | Resolution path only |
| Voter Jury Fees | ✅ No | Voting → resolution → no emergency refund |
| Creator Fees | ✅ No | Collected at trade time |
| Platform Fees | ✅ No | Sent immediately |
| Resolution Fees | ✅ No | Fixed in v3.6.0 |
| Pull Pattern | ✅ No | Separate accounting |

---

## Part 3: Virtual Liquidity / Heat Levels Analysis

### ✅ NOT AFFECTED by v3.6.0 Changes

The v3.6.0 fixes **do not touch** any bonding curve or virtual liquidity code:

| v3.6.0 Change | Functions Modified | Bonding Curve Impact |
|---------------|-------------------|---------------------|
| Double-spend check | `claim()` | ❌ None |
| Pool reduction | `emergencyRefund()`, `claim()` | ❌ None |
| Resolution cutoff | `proposeOutcome()`, `dispute()` | ❌ None |

**Virtual liquidity parameters unchanged:**
- `heatLevelCrack` = 50 × 10¹⁸ (☢️ CRACK)
- `heatLevelHigh` = 200 × 10¹⁸ (🔥 HIGH)
- `heatLevelPro` = 500 × 10¹⁸ (🧊 PRO)
- `heatLevelApex` = 2000 × 10¹⁸ (🏛️ APEX)
- `heatLevelCore` = 5000 × 10¹⁸ (⚡ CORE)

**Bonding curve functions unchanged:**
- `_calculateBuyShares()` - not modified
- `_calculateSellReturn()` - not modified
- `_getPrice()` - not modified

---

## Part 4: v3.6.2 Security Fixes

### 🟠 HIGH: One-Sided Market Proposals (FIXED in v3.6.2)

**Discovered:** January 19, 2026  
**Severity:** HIGH  
**Status:** ✅ FIXED in v3.6.2

#### Vulnerability Details

`proposeOutcome()` only checked if BOTH sides were empty, not if ONE side was empty. This allowed:

1. **Griefing Attack:** Proposing resolution on empty side → finalization fails → users wait 24h for refund
2. **Pointless Resolution:** Proposing resolution on one-sided market → everyone "wins" but pays fees

#### v3.6.2 Fix Applied

```solidity
// OLD (v3.6.1 - VULNERABLE):
if (market.yesSupply == 0 && market.noSupply == 0) {
    revert NoTradesToResolve();  // Only blocked if BOTH are zero
}

// NEW (v3.6.2 - FIXED):
if (market.yesSupply == 0 || market.noSupply == 0) {
    revert OneSidedMarket();  // Now blocks if EITHER side is empty
}
```

#### Why This Fix Works

One-sided markets should use emergency refund, not resolution:
- No "losing side" exists to pay winners from
- Resolution is pointless (winners just get their own money back minus fees)
- Emergency refund is the correct path

---

### 🟠 HIGH: Emergency Refund Bypass (FIXED in v3.6.2)

**Discovered:** January 19, 2026  
**Severity:** HIGH  
**Status:** ✅ FIXED in v3.6.2

#### Vulnerability Details

`emergencyRefund()` only checked `!market.resolved`, not whether a valid proposal existed. This allowed losers to avoid resolution by not calling `finalizeMarket()` and waiting for emergency refund.

#### Attack Scenario (Pre-v3.6.2)

```
T=0h      Market expires (YES has 60 BNB, NO has 40 BNB)
T=10h     Alice proposes YES wins (correct outcome)
T=10.5h   Dispute window ends, no dispute
          Market is READY to finalize...

T=24h     Emergency refund becomes available
          - market.resolved = false ✓
          - 24 hours passed ✓

T=24h+    Bob (NO holder, would lose 40 BNB) calls emergencyRefund()
          - Gets proportional refund (~40 BNB back!)
          - Should have lost everything

RESULT: Losers avoid losing by simply not finalizing.
```

#### v3.6.2 Fix Applied

```solidity
// OLD (v3.6.1 - VULNERABLE):
function emergencyRefund(uint256 marketId) external {
    if (market.resolved) revert MarketAlreadyResolved();
    // ❌ Did NOT check if proposal exists!
}

// NEW (v3.6.2 - FIXED):
function emergencyRefund(uint256 marketId) external {
    if (market.resolved) revert MarketAlreadyResolved();
    // ✅ Block if resolution in progress (unless contract paused)
    if (!paused && market.proposer != address(0)) {
        revert ResolutionInProgress();
    }
    // ...
}
```

#### Why This Fix Works

- Resolution path and emergency refund are now mutually exclusive
- If proposal exists → must finalize first
- Escape hatch: `paused` state allows emergency refund even with proposal (for true emergencies)

---

### 🟡 MEDIUM: Stale Proposer State After Failed Finalization (FIXED in v3.6.2)

**Discovered:** January 19, 2026  
**Severity:** MEDIUM  
**Status:** ✅ FIXED in v3.6.2

#### Vulnerability Details

When `finalizeMarket()` failed legitimately (winning side has 0 holders, or vote tie), it returned bonds but didn't clear `proposer`/`disputer`. Combined with Bug 2 fix, this would STUCK users forever.

#### Problem Scenario (Without Fix 3)

```
1. Market has 100 YES, 50 NO holders
2. Someone proposes YES
3. All YES holders sell their shares (yesSupply becomes 0)
4. finalizeMarket() called → fails (winning side empty)
5. Bond returned ✓
6. market.proposer still set (not cleared) ✗

With Bug 2 fix (emergency refund check):
7. Emergency refund blocked (proposer != address(0))
8. Users STUCK forever!
```

#### v3.6.2 Fix Applied

```solidity
// In finalizeMarket() when winningSupply == 0:
if (winningSupply == 0) {
    pendingWithdrawals[market.proposer] += bondAmount;
    market.proposer = address(0);  // ✅ ADDED: Clear for emergency refund
    emit MarketResolutionFailed(marketId, "No holders on winning side");
    return;
}

// In _returnBondsOnTie():
function _returnBondsOnTie(Market storage market) internal {
    // ... return bonds ...
    market.proposer = address(0);  // ✅ ADDED
    market.disputer = address(0);  // ✅ ADDED
}
```

#### Why This Fix Works

- Failed finalization now properly "resets" the market state
- Emergency refund becomes available after legitimate finalization failure
- No users can ever be stuck

---

## Conclusion

### Vulnerabilities Fixed ✅
| Bug | Version | Status |
|-----|---------|--------|
| Double-Spend | v3.6.0 | ✅ FIXED |
| Pool Insolvency | v3.6.0 | ✅ FIXED |
| Race Condition (Proposals) | v3.6.0 | ✅ FIXED |
| Stale Pool Data | v3.6.0 | ✅ FIXED |
| Dispute Window Edge Case | v3.6.1 | ✅ FIXED |
| One-Sided Market Proposals | v3.6.2 | ✅ FIXED |
| Emergency Refund Bypass | v3.6.2 | ✅ FIXED |
| Stale Proposer State | v3.6.2 | ✅ FIXED |

### Security Verified ✅
| Component | Status |
|-----------|--------|
| Bond/Fee claiming | ✅ SAFE |
| Virtual liquidity | ✅ NOT AFFECTED |
| Heat levels | ✅ NOT AFFECTED |
| Resolution paths | ✅ MUTUALLY EXCLUSIVE |
| Emergency refund | ✅ PROPERLY GATED |

### Resolution Timeline (v3.6.2)
```
0-22h:  Proposals allowed (normal two-sided markets only)
        Disputes allowed within 30min of proposal
22-24h: NO new proposals, disputes STILL allowed within 30min window
24h+:   Emergency refund available (only if no valid proposal exists)
```

**Resolution and Emergency Refund are now truly mutually exclusive by design.**

### New Error Codes (v3.6.2)
- `OneSidedMarket()` - Reverts when proposing on market with one side empty
- `ResolutionInProgress()` - Reverts when emergency refund attempted with active proposal

### Test Coverage
- **189 total tests passing**
- 7 new tests in `OneSidedMarket.t.sol`
- 6 rewritten tests in `EmptyWinningSide.t.sol`
- 20+ tests updated across all test files for v3.6.2 behavior
