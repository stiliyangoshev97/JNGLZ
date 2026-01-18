# Security Analysis: Bond/Fee Claiming vs Emergency Refunds (v3.6.0)

**Date:** January 18, 2026  
**Version:** v3.6.0-analysis  
**Analyst:** GitHub Copilot

## Executive Summary

After analyzing the codebase with the v3.6.0 timeline constraints, **NO vulnerabilities were found** in the bond/fee claiming mechanisms related to emergency refunds.

The v3.6.0 fix (2-hour resolution cutoff) creates a clear separation:
- **Resolved markets** → users claim via `claim()` (bonds/fees distributed normally)
- **Unresolved markets after 24h** → users get emergency refund (no resolution, no bonds to distribute)

These two paths are **mutually exclusive** by design.

---

## Timeline Analysis (Critical Context)

```
Expiry ─────────────────────────────────────────────────────> Emergency Refund
  │                                                                  │
  │  0-22h: Resolution window                                       │ 24h+
  │  ├─ Propose (10min creator priority, then anyone)               │
  │  ├─ Dispute window (30min after proposal)                       │
  │  └─ Voting window (1h after dispute)                            │
  │                                                                  │
  │  22-24h: CUTOFF - No new proposals/disputes (v3.6.0 fix)        │
  │                                                                  │
```

**Maximum resolution timeline:**
- Last proposal at 22h + 30min dispute + 1h voting = **23.5 hours**
- Emergency refund available at **24 hours**
- **Gap of 30 minutes** ensures resolution always completes before emergency refund

**Key insight:** If a dispute/vote occurs, the market WILL resolve before emergency refund becomes available. Emergency refund is only for markets where NO resolution activity happened.

---

## Components Analyzed

### 1. Proposer Bonds ✅ **SAFE**
**Why:** Proposer bonds exist only in markets going through resolution. If market resolves → bond returned/distributed. If market doesn't resolve (no proposal) → no bond exists → emergency refund path.

These paths are mutually exclusive.

---

### 2. Disputer Bonds ✅ **SAFE**  
**Why:** Same logic. Disputer bonds only exist if dispute occurred → market will resolve before 24h → no emergency refund possible.

---

### 3. Voter Jury Fees ✅ **SAFE**
**Initial concern:** User votes, then takes emergency refund, loses jury fees.

**Why this is IMPOSSIBLE:**
1. Voting only happens during `Disputed` status
2. Dispute can only be filed before 22h cutoff
3. Voting window is 1h after dispute
4. Maximum: dispute at 22h + 1h voting = resolves at 23h
5. Emergency refund requires 24h AND unresolved market
6. **If user voted → market will resolve → no emergency refund available**

---

### 4. Creator Fees ✅ **SAFE**
**Why:** Creator fees are collected at trade time (before funds enter pool). They're stored in `pendingCreatorFees[creator]` separately. Emergency refunds only affect `poolBalance`. Creator can always withdraw their fees.

---

### 5. Platform Fees ✅ **SAFE**
**Why:** Sent immediately to treasury at trade time. Never stored in contract.

---

### 6. Resolution Fees ✅ **SAFE**
**Why:** Resolution fee (0.3%) only taken during `claim()`. v3.6.0 fix prevents claim after emergency refund. No edge case.

---

### 7. Pull Pattern Withdrawals ✅ **SAFE**
**Why:** `pendingWithdrawals` and `pendingCreatorFees` are per-user global balances, not per-market. Completely separate from market pools and emergency refunds.

---

## Summary Table

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

## Conclusion

**No vulnerabilities found.** The v3.6.0 fix creates a clean separation between:
1. **Resolution path:** Proposal → (optional: Dispute → Voting) → Finalize → Claim
2. **Emergency refund path:** No activity for 24h → Emergency Refund

These paths are mutually exclusive by design. The 2-hour cutoff buffer ensures any resolution activity completes before emergency refund becomes available.

**All bond/fee mechanisms are safe.**
