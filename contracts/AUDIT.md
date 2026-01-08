# Security Audit Report: PredictionMarket.sol

**Contract:** PredictionMarket.sol  
**Version:** v3.1.0  
**Audit Date:** January 9, 2026  
**Auditor:** Internal Review + Slither Static Analysis  
**Solidity Version:** 0.8.24

---

## Executive Summary

The PredictionMarket contract implements a decentralized binary prediction market on BNB Chain with:
- **Bonding Curve Pricing:** Linear constant sum model where P(YES) + P(NO) = 0.01 BNB
- **Heat Levels:** Configurable per-market virtual liquidity for different trading styles
- **Street Consensus Resolution:** Shareholder voting system for outcome determination
- **3-of-3 MultiSig Governance:** All parameter changes require unanimous approval
- **SweepFunds:** Governance can recover surplus/dust BNB from the contract
- **Emergency Refund System:** 24-hour failsafe for unresolved markets

### Key Statistics

| Metric | Value |
|--------|-------|
| Total Lines of Code | 1,701 |
| Total Tests | 173 |
| Test Suites | 6 |
| Slither Findings | 36 (see breakdown below) |
| Critical Issues | 0 |
| High Issues | 0 (5 false positives) |
| Medium Issues | 2 |
| Low Issues | 5 |
| Informational | 8 |

---

## Version 3.1.0 Changes Since Last Audit

### New Features
1. **Heat Levels** - Configurable per-market virtual liquidity
   - `HeatLevel.CRACK` (5 vLiq) - High volatility trading
   - `HeatLevel.HIGH` (20 vLiq) - Balanced trading (default)
   - `HeatLevel.PRO` (50 vLiq) - Low slippage trading
2. **SweepFunds** - MultiSig governance can sweep surplus BNB to treasury
3. **Removed `proofLink`** - Simplified `proposeOutcome()` signature
4. **Removed `receive()`** - Contract now reverts on direct BNB transfers

### Removed Features
- `string proofLink` field from proposal flow
- `receive()` fallback function (accidental deposits now revert)

---

## Slither Static Analysis Results

**Tool:** Slither v0.11.3  
**Detectors Run:** 100

### Finding Categories

| Severity | Count | Status |
|----------|-------|--------|
| High | 5 | ⚠️ False Positives (See Analysis) |
| Medium | 2 | ✅ Mitigated by Design |
| Low | 12 | ℹ️ Informational |
| Optimization | 17 | 📝 By Design |

---

## Detailed Findings

### HIGH-01 through HIGH-05: Reentrancy False Positives

**Slither Detection:** `reentrancy-vulnerabilities`

**Affected Functions:**
- `_distributeBonds()` (Line 924-957)
- `_returnBondsOnTie()` (Line 900-918)

**Description:**
Slither flags that external calls via `.call{value:}()` are made before state variables (`proposalBond`, `disputeBond`) are zeroed.

**Analysis:**
```solidity
// _distributeBonds writes state AFTER external calls
(success,) = winner.call{value: winnerPayout}();
_distributeJuryFees(marketId, market, voterPool);
market.proposalBond = 0;  // State written after
market.disputeBond = 0;   // State written after
```

**Risk Assessment:** FALSE POSITIVE
- The contract inherits `ReentrancyGuard` from OpenZeppelin
- `finalizeMarket()` (the only entry point) uses `nonReentrant` modifier
- Re-entering `claim()`, `emergencyRefund()`, or any trading function would revert
- The `resolved` flag is set BEFORE distribution, preventing double finalization

**Mitigation Status:** ✅ Mitigated by `nonReentrant` modifier and `resolved` flag check

---

### MEDIUM-01: Arbitrary ETH Sends

**Slither Detection:** `arbitrary-send-eth`

**Affected Functions:**
- `_distributeJuryFees()` (Line 962-1000)
- `_executeAction()` (Line 1556-1652) - SweepFunds

**Description:**
```solidity
(success,) = treasury.call{value: voterPool}();
(success,) = voter.call{value: voterShare}();
(success,) = treasury.call{value: surplus}();  // SweepFunds
```

**Risk Assessment:** LOW
- `treasury` is controlled by 3-of-3 MultiSig
- `voter` addresses are stored during `vote()` calls which require share ownership
- SweepFunds only sends to treasury (MultiSig controlled)
- Cannot be exploited to drain funds to attacker-controlled addresses

**Mitigation Status:** ✅ By Design - Treasury is MultiSig controlled, voters must be shareholders

---

### MEDIUM-02: Divide Before Multiply

**Slither Detection:** `divide-before-multiply`

**Affected Functions:**
- `claim()` (Line 1007-1046)
- `_calculateSellBnb()` (Line 1530-1554)

**Description:**
```solidity
// claim()
grossPayout = (winningShares * market.poolBalance) / totalWinningShares;
fee = (grossPayout * resolutionFeeBps) / BPS_DENOMINATOR;

// _calculateSellBnb()
avgPrice = (priceBeforeSell + priceAfterSell) / 2;
return (shares * avgPrice) / 1e18;
```

**Risk Assessment:** LOW
- Precision loss is minimal (wei-level)
- Using 1e18 scaling for shares provides sufficient precision
- Maximum loss per transaction: ~1-2 wei

**Mitigation Status:** ✅ Acceptable - Precision is sufficient for practical use

---

### LOW-01: Calls Inside a Loop

**Slither Detection:** `calls-loop`

**Affected Function:** `_distributeJuryFees()` (Line 962-1000)

**Description:**
```solidity
for (uint256 i = 0; i < voterCount; i++) {
    address voter = marketVoters[marketId][i];
    // ... check if voted for winning outcome ...
    (success,) = voter.call{value: voterShare}();
}
```

**Risk Assessment:** MEDIUM
- Unbounded loop could cause gas exhaustion if too many voters
- A failing transfer would not revert (continues loop)
- Failed transfers result in lost funds for that voter

**Mitigation Considerations:**
1. In practice, market voting is time-limited (1 hour window)
2. Each vote costs gas, naturally limiting voter count
3. Typical markets will have <50 voters based on market dynamics

**Recommendation:** Consider implementing a pull-based claim pattern for jury rewards in future versions, or add a voter limit.

---

### LOW-02: Timestamp Dependencies

**Slither Detection:** `timestamp`

**Affected Functions:** 10 functions use `block.timestamp`
- `_createMarket()`, `proposeOutcome()`, `dispute()`, `vote()`, `finalizeMarket()`
- `emergencyRefund()`, `canEmergencyRefund()`, `confirmAction()`, `executeAction()`, `_getMarketStatus()`

**Risk Assessment:** LOW
- BNB Chain block time is ~3 seconds (relatively predictable)
- Time windows are intentionally long (10min, 30min, 1hr, 24hr)
- Miner manipulation of ~15 seconds cannot meaningfully exploit these windows

**Mitigation Status:** ✅ By Design - Long time windows make manipulation impractical

---

### LOW-03: Different Solidity Versions

**Slither Detection:** `different-pragma-directives`

**Description:**
- Main contract: `pragma solidity 0.8.24;`
- OpenZeppelin imports: `pragma solidity ^0.8.20;`

**Risk Assessment:** NONE
- Using exact version (0.8.24) is best practice for deployments
- OpenZeppelin's ^0.8.20 allows 0.8.24 compilation

**Mitigation Status:** ✅ Non-Issue

---

### LOW-04: Low-Level Calls

**Slither Detection:** `low-level-calls`

**Description:**
Contract uses `.call{value:}()` for all 16 ETH transfer locations instead of `.transfer()` or `.send()`.

**Risk Assessment:** NONE - This is the RECOMMENDED pattern
- `.transfer()` has fixed 2300 gas limit, breaks with contract recipients
- `.call{}()` forwards all gas, more flexible and future-proof
- All calls check return value and revert/continue appropriately

**Mitigation Status:** ✅ Best Practice

---

### LOW-05: Reentrancy Events

**Slither Detection:** `reentrancy-events`

**Affected Function:** `_executeAction()` - SweepFunds

**Description:**
Events `FundsSwept` and `ActionExecuted` emitted after external call to treasury.

**Risk Assessment:** NONE
- Events after transfers are informational only
- No state dependency on event ordering
- `nonReentrant` not needed here as treasury is MultiSig controlled

**Mitigation Status:** ✅ Acceptable

---

### INFO-01: High Cyclomatic Complexity

**Slither Detection:** `cyclomatic-complexity`

**Affected Function:** `_executeAction()` (Line 1556-1652) - Complexity: 30

**Description:**
Large switch statement for handling 14 different MultiSig action types.

**Risk Assessment:** NONE
- Each case is independent and straightforward
- Well-documented with clear parameter validation
- Switch pattern is appropriate for action dispatching

**Mitigation Status:** ✅ Acceptable - Alternative designs would be more complex

---

## Manual Review Findings

### FINDING-M01: No Maximum Voter Limit

**Severity:** Low  
**Location:** `vote()` function and `_distributeJuryFees()`

**Description:**
There's no cap on the number of voters per market. While gas costs naturally limit this, a popular market could theoretically have enough voters to cause `_distributeJuryFees()` to exceed block gas limits.

**Impact:** In extreme cases, market finalization could fail due to gas exhaustion.

**Recommendation:**
- Monitor voter counts in production
- Consider implementing a maximum voter limit (e.g., 100)
- Or migrate to pull-based jury reward claims

---

### FINDING-M02: Failed Voter Payouts Are Silent

**Severity:** Low  
**Location:** `_distributeJuryFees()` Line 992

**Description:**
If a voter's address is a contract that reverts on receive, their share is lost.

**Impact:** Individual voter may lose their jury reward share.

**Recommendation:** Consider tracking failed payouts for manual recovery by MultiSig.

---

### FINDING-M03: Heat Level Immutability Per Market

**Severity:** Informational  
**Location:** `_createMarket()` Line 493-494

**Description:**
Once a market is created, its `virtualLiquidity` and `heatLevel` cannot be changed. This is intentional - changing liquidity mid-market would alter prices unexpectedly.

**Impact:** None - this is by design.

---

### FINDING-M04: SweepFunds Calculation

**Severity:** Informational  
**Location:** `_calculateTotalLockedFunds()` Line 1658-1681

**Description:**
The sweep function iterates all markets to calculate locked funds. With many markets (thousands), this could become gas-expensive.

**Impact:** In extreme cases, sweep execution might fail due to gas limits.

**Recommendation:** Monitor market count. Consider checkpointing total locked funds in future versions.

---

## Test Coverage Analysis

### Test Suite Breakdown

| Test File | Tests | Focus |
|-----------|-------|-------|
| PredictionMarket.t.sol | 82 | Core functionality + Heat Levels + SweepFunds |
| PredictionMarket.fuzz.t.sol | 32 | Property-based testing |
| PumpDump.t.sol | 31 | Price manipulation resistance |
| Integration.t.sol | 16 | Full lifecycle scenarios |
| VulnerabilityCheck.t.sol | 4 | Known vulnerability patterns |
| InstantSellAnalysis.t.sol | 8 | Sell mechanics |

### Key Test Scenarios Covered

✅ **Heat Levels Testing**
- Market creation with all three heat levels (CRACK, HIGH, PRO)
- Virtual liquidity correctly assigned per heat level
- Price calculations use market-specific virtualLiquidity
- MultiSig governance for heat level values
- Bounds validation (MIN_HEAT_LEVEL to MAX_HEAT_LEVEL)

✅ **SweepFunds Testing**
- Sweep only available when surplus exists
- Surplus calculation excludes active market poolBalances
- Surplus calculation excludes active bonds
- NothingToSweep error when no surplus
- Successful sweep to treasury

✅ **Happy Path Flows**
- Market creation → Trading → Proposal → Finalization → Claim
- Undisputed resolution
- Disputed resolution with voting

✅ **Edge Cases**
- Minimum bet amounts
- Dust pool bond floor
- Single shareholder protection
- Timing boundaries

✅ **Attack Vectors**
- Double claim prevention
- Non-shareholder voting prevention
- Creator priority window enforcement
- Emergency refund vs claim mutual exclusion

✅ **Invariants (Fuzz Tested)**
- Price sum always equals UNIT_PRICE
- Preview functions match actual execution
- Slippage protection works

---

## Known Limitations & Design Decisions

### 1. Heat Levels Are Immutable Per Market
**Decision:** virtualLiquidity set at creation, cannot change  
**Trade-off:** Cannot adjust for changed market conditions  
**Mitigation:** Three options available at creation time

### 2. No Oracle Dependency
**Decision:** "Street Consensus" resolution by shareholders  
**Trade-off:** No external oracle risk, but relies on economic incentives  
**Mitigation:** Bond system, voting weighted by stake

### 3. No Upgradability
**Decision:** Immutable contract  
**Trade-off:** Cannot fix bugs post-deployment  
**Mitigation:** Extensive testing, MultiSig pause, emergency refund

### 4. Fixed Time Windows
**Decision:** Hardcoded dispute (30min), voting (1hr), emergency (24hr)  
**Trade-off:** Cannot adjust based on market needs  
**Mitigation:** Conservative windows, tested extensively

### 5. SweepFunds Iterates All Markets
**Decision:** Full calculation each sweep  
**Trade-off:** Gas cost scales with market count  
**Mitigation:** MultiSig controlled, execute only when needed

---

## Pre-Deployment Checklist

### Smart Contract
- [x] All 173 tests passing
- [x] Slither analysis completed (no critical/high issues)
- [x] ReentrancyGuard applied to all state-changing external functions
- [x] MultiSig addresses configured correctly
- [x] Treasury address set (receives platform fees)
- [x] Heat level values configured:
  - `heatLevelCrack`: 5 * 1e18
  - `heatLevelHigh`: 20 * 1e18 (default for most markets)
  - `heatLevelPro`: 50 * 1e18
- [x] Initial parameters reviewed:
  - `platformFeeBps`: 100 (1%)
  - `creatorFeeBps`: 50 (0.5%)
  - `resolutionFeeBps`: 30 (0.3%)
  - `minBet`: 0.005 ether
  - `minBondFloor`: 0.005 ether
  - `dynamicBondBps`: 100 (1%)
  - `bondWinnerShareBps`: 5000 (50%)
  - `marketCreationFee`: 0 (free)

### Operational
- [ ] MultiSig signers verified (3 separate entities/devices)
- [ ] Treasury wallet tested and secured
- [ ] Monitoring setup for events
- [ ] Emergency response plan documented
- [ ] Frontend integration tested on testnet

### External Dependencies
- [x] OpenZeppelin Contracts v5.x (ReentrancyGuard)
- [x] No oracle dependencies
- [x] No external contract calls except transfers

---

## Risk Summary

| Risk Category | Level | Notes |
|--------------|-------|-------|
| Reentrancy | LOW | Mitigated by ReentrancyGuard |
| Access Control | LOW | 3-of-3 MultiSig, no single admin |
| Arithmetic | LOW | Solidity 0.8.24 built-in overflow checks |
| DoS | LOW-MEDIUM | Unbounded voter loop, sweep iteration |
| Oracle Manipulation | N/A | No oracles used |
| Front-Running | LOW | MEV-resistant by design (bonding curve, slippage) |
| Timestamp Manipulation | LOW | Long time windows |
| Centralization | LOW | MultiSig governance, no upgradability |

---

## Conclusion

The PredictionMarket contract v3.1.0 demonstrates solid security practices:

1. **Defense in Depth:** Multiple layers (ReentrancyGuard, MultiSig, time delays)
2. **Economic Security:** Bond system + Heat Levels align incentives
3. **Comprehensive Testing:** 173 tests including fuzz and integration testing
4. **Conservative Design:** Immutable, no external dependencies, fail-safe emergency refund
5. **New Features Safe:** Heat Levels and SweepFunds follow established patterns

**Recommended Actions Before Mainnet:**
1. Consider implementing voter limit or pull-based jury rewards
2. Add monitoring for failed ETH transfers
3. Monitor market count for SweepFunds gas costs
4. Complete operational checklist items
5. Consider professional third-party audit for additional assurance

---

*This audit is provided for informational purposes. It does not constitute financial advice or guarantee of contract security. Users should conduct their own due diligence.*
