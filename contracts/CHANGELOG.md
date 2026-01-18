# Changelog

All notable changes to the PredictionMarket smart contracts will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.6.0] - 2026-01-18

### NOT YET DEPLOYED ⏳
- Ready for deployment to BNB Testnet
- **CRITICAL SECURITY FIX** - Must replace v3.5.0

### Fixed

#### 🚨 CRITICAL: Emergency Refund Double-Spend Vulnerability
Fixed a three-part vulnerability that could drain funds from the contract.

**Vulnerability Details (v3.5.0 and earlier):**

| # | Problem | Impact | Fix Applied |
|---|---------|--------|-------------|
| 1 | **Double-Spend** | User gets emergency refund + claim (~2x payout) | Added `emergencyRefunded` check in `claim()` |
| 2 | **Pool Insolvency** | `emergencyRefund()` didn't reduce `poolBalance` | Now reduces pool balance and zeroes shares |
| 3 | **Race Condition** | Proposals at T=22h, refund at T=24h conflicts | Added 2-hour resolution cutoff buffer |
| 4 | **Stale Pool Data** | `claim()` didn't reduce `poolBalance` after payout | `claim()` now reduces pool and winning supply |

**Fix 1: Block claim after emergency refund**
```solidity
function claim(uint256 marketId) external nonReentrant returns (uint256 payout) {
    // ...existing checks...
    if (position.emergencyRefunded) revert AlreadyEmergencyRefunded(); // NEW
    // ...
}
```

**Fix 2: Reduce pool balance on emergency refund**
```solidity
function emergencyRefund(uint256 marketId) external nonReentrant returns (uint256 refund) {
    // ...calculate refund...
    position.emergencyRefunded = true;
    
    // v3.6.0 FIX: Reduce pool balance and supplies
    market.poolBalance -= refund;           // NEW
    market.yesSupply -= position.yesShares; // NEW
    market.noSupply -= position.noShares;   // NEW
    position.yesShares = 0;                 // NEW
    position.noShares = 0;                  // NEW
    
    // ...transfer...
}
```

**Fix 3: 2-hour resolution cutoff**
```solidity
uint256 public constant RESOLUTION_CUTOFF_BUFFER = 2 hours; // NEW

function proposeOutcome(uint256 marketId, bool outcome) external {
    uint256 emergencyRefundTime = market.expiryTimestamp + EMERGENCY_REFUND_DELAY;
    if (block.timestamp >= emergencyRefundTime - RESOLUTION_CUTOFF_BUFFER) {
        revert ProposalWindowClosed(); // NEW
    }
    // ...
}

function dispute(uint256 marketId) external {
    uint256 emergencyRefundTime = market.expiryTimestamp + EMERGENCY_REFUND_DELAY;
    if (block.timestamp >= emergencyRefundTime - RESOLUTION_CUTOFF_BUFFER) {
        revert DisputeWindowClosed(); // NEW
    }
    // ...
}
```

**Fix 4: Clean pool accounting on claim**
```solidity
function claim(uint256 marketId) external nonReentrant returns (uint256 payout) {
    // ...calculate payout...
    
    // v3.6.0 FIX: Reduce pool balance and winning supply
    market.poolBalance -= grossPayout;      // NEW
    if (market.outcome) {
        market.yesSupply -= winningShares;  // NEW
    } else {
        market.noSupply -= winningShares;   // NEW
    }
    
    // ...transfer...
}
```

### Added

#### New Constants
```solidity
uint256 public constant RESOLUTION_CUTOFF_BUFFER = 2 hours;
```

#### New Errors
```solidity
error ProposalWindowClosed();
error DisputeWindowClosed();
```

#### New Test Suite
- `EmergencyRefundSecurity.t.sol` - 15 comprehensive security tests
- Tests cover: double-spend prevention, pool insolvency, cutoff enforcement, boundary conditions, full attack simulation

### Changed

#### Resolution Timeline
```
Before (v3.5.0):
- Resolution window: 0-24h after expiry
- Emergency refund: 24h+ after expiry
- Problem: Resolution at 23h could conflict with refund at 24h

After (v3.6.0):
- Resolution window: 0-22h after expiry (CUTOFF at 22h)
- Emergency refund: 24h+ after expiry
- Gap: 2 hours ensures resolution completes before refund available
```

#### Test File Rename
- `PumpDump.t.sol` → `BondingCurveEconomics.t.sol` (better describes content)
- Contract renamed from `PumpDumpTest` → `BondingCurveEconomicsTest`

### Security Notes
- **All bond/fee mechanisms verified safe** - See `SECURITY_ANALYSIS_v3.6.0.md`
- Resolution path and Emergency refund path are now **mutually exclusive by design**
- **Virtual liquidity / Heat levels NOT affected** - Bonding curve code unchanged
- 179 tests passing (15 new security tests added)
- Slither analysis: 35 findings (no critical/high issues)

### Migration Notes
- **Breaking:** Markets created after upgrade have 22h resolution window (not 24h)
- **Frontend:** Should show "Resolution closes in X hours" warning
- **Subgraph:** No changes needed (same events)
- **Existing markets unaffected:** Fix applies to all markets (storage unchanged)

---

## [3.5.0] - 2026-01-14

### ⚠️ DEPRECATED - Contains Critical Bug
- **DO NOT USE** - Has Emergency Refund Double-Spend vulnerability
- Upgrade to v3.6.0 immediately

### Added

#### Two New Heat Levels - APEX and CORE 🔥
Expanded the heat level system from 3 tiers to 5 tiers to support institutional-grade markets.

**New Heat Levels:**
| Tier | Name | Virtual Liquidity | Target Use Case |
|------|------|-------------------|-----------------|
| APEX | INSTITUTION | 2,000 BNB | Large-cap markets, ~2% per 20 BNB |
| CORE | DEEP SPACE | 10,000 BNB | Maximum stability, ~1% per 100 BNB |

**New State Variables:**
```solidity
uint256 public heatLevelApex = 2000 * 1e18;
uint256 public heatLevelCore = 10000 * 1e18;
```

**New ActionTypes:**
- `SetHeatLevelApex` - Governance can adjust APEX liquidity
- `SetHeatLevelCore` - Governance can adjust CORE liquidity

**Updated Enum:**
```solidity
enum HeatLevel { CRACK, HIGH, PRO, APEX, CORE }
```

### Changed

#### Virtual Liquidity Rebalance (10x Increase) 💧
All existing heat levels increased by 10x to improve price stability and playability.

**Problem Solved:**
Markets were too volatile - a 0.7 BNB trade in PRO tier moved price from 50% to 75% (25 points), making markets unplayable for serious betting.

**Before → After:**
| Tier | Name | OLD | NEW | Price Impact |
|------|------|-----|-----|--------------|
| CRACK | DEGEN FLASH | 5 BNB | 50 BNB | ~5-10% per 0.1 BNB |
| HIGH | STREET FIGHT | 20 BNB | 200 BNB | ~3-5% per 1 BNB |
| PRO | WHALE POND | 50 BNB | 500 BNB | ~2-3% per 5 BNB |

**Updated Constant:**
```solidity
uint256 public constant MAX_HEAT_LEVEL = 15000 * 1e18; // was 200
```

### Migration Notes
- **Breaking:** MarketCreated event now emits new virtual liquidity values
- **Breaking:** Subgraph must be updated to handle 5 heat levels
- **Frontend:** HeatSelector must show 5 options instead of 3
- **Existing markets unaffected:** Virtual liquidity is stored per-market

---

## [3.4.1] - 2026-01-10

### Deployed ✅
- **Address:** `0x4e20Df1772D972f10E9604e7e9C775B1ae897464`
- **Network:** BNB Testnet (Chain ID: 97)
- **Block:** 83514593
- **BscScan:** https://testnet.bscscan.com/address/0x4e20Df1772D972f10E9604e7e9C775B1ae897464
- **Verified:** ✅ Yes

### Added

#### ReplaceSigner - Emergency Signer Recovery (2-of-3) 🔐
Emergency escape hatch for when a signer key is compromised or lost.

**Problem Solved:**
In a 3-of-3 MultiSig, if one signer loses their key or is compromised, the governance becomes permanently stuck. No parameters can be changed, and funds cannot be swept.

**The Solution:**
A new `ReplaceSigner` action that only requires 2-of-3 confirmations:

```solidity
// Propose replacing oldSigner with newSigner
proposeAction(ActionType.ReplaceSigner, abi.encode(oldSigner, newSigner));
// Only 2 signers need to confirm (not 3)
```

**Security Measures:**
1. **Cannot replace with address(0)** - Validates new signer is valid
2. **Cannot replace with same address** - old != new check
3. **Prevents duplicate signers** - New signer cannot already be a signer
4. **Event emitted** - `SignerReplaced(oldSigner, newSigner, actionId)` for monitoring
5. **1-hour expiry** - Action expires if not confirmed quickly

**Why 2-of-3?**
- Emergency recovery when one key is lost/compromised
- Two honest signers can recover governance
- All OTHER actions still require 3-of-3

**New ActionType:** `ReplaceSigner`
**New Event:** `SignerReplaced(address indexed oldSigner, address indexed newSigner, uint256 indexed actionId)`
**New Errors:** `InvalidSignerReplacement()`, `SignerNotFound()`

---

#### Constructor Duplicate Signer Validation 🛡️
Prevents deployment with duplicate signers.

**Problem:**
Without validation, someone could deploy with `[signerA, signerA, signerB]`, breaking 3-of-3 governance since signerA could confirm twice.

**Solution:**
Added nested loop in constructor:
```solidity
for (uint256 i = 0; i < 3; i++) {
    if (_signers[i] == address(0)) revert InvalidAddress();
    // Check for duplicate signers
    for (uint256 j = 0; j < i; j++) {
        if (_signers[i] == _signers[j]) revert InvalidAddress();
    }
    signers[i] = _signers[i];
}
```

---

#### Enhanced Sweep Protection 💰
`_calculateTotalLockedFunds()` now includes Pull Pattern pending funds.

**Problem:**
v3.4.0 added `pendingWithdrawals` and `pendingCreatorFees` mappings, but sweep calculation didn't include them. A sweep could accidentally take funds users haven't withdrawn yet.

**Solution:**
Added tracking variables and included them in sweep calculation:
```solidity
// New state variables
uint256 public totalPendingWithdrawals;
uint256 public totalPendingCreatorFees;

// In _calculateTotalLockedFunds()
totalLocked += totalPendingWithdrawals;
totalLocked += totalPendingCreatorFees;
```

**Result:** Sweep can NEVER touch user funds waiting in Pull Pattern queues.

---

### Changed
- `confirmAction()` now auto-executes at 2 confirmations for `ReplaceSigner` (was always 3)
- `executeAction()` now requires 2 confirmations for `ReplaceSigner` (was always 3)
- `_executeAction()` includes duplicate signer check before replacement

### Tests Added (PullPattern.t.sol - 28 tests)
- `test_ReplaceSigner_Success` - Full 2-of-3 flow works
- `test_ReplaceSigner_RequiresOnly2of3` - Doesn't need 3rd confirmation
- `test_ReplaceSigner_OnlySignerCanPropose` - Access control verified
- `test_ReplaceSigner_CannotReplaceWithZeroAddress` - Validation check
- `test_ReplaceSigner_CannotReplaceSameAddress` - old != new check
- `test_ReplaceSigner_PreventDuplicateSigner` - No duplicate signers
- Plus 22 other Pull Pattern tests for bonds, jury fees, creator fees, sweep protection

**Total Tests:** 164 passing (1 expected skip)

---

## [3.4.0] - 2026-01-09log

All notable changes to the PredictionMarket smart contracts will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.4.1] - 2026-01-10

### Added

#### ReplaceSigner (2-of-3 Emergency Signer Replacement) 🔐
Emergency mechanism to replace a compromised or unavailable signer with only 2-of-3 confirmations.

**Problem Solved:**
If one of the three MultiSig signers loses access to their key or becomes compromised, the protocol would be stuck - unable to execute ANY governance action (all other actions require 3-of-3).

**The Solution:**
A new `ReplaceSigner` action type that only requires 2-of-3 confirmations:

```solidity
// Propose replacement (signer1)
uint256 actionId = pm.proposeAction(
    ActionType.ReplaceSigner, 
    abi.encode(oldSigner, newSigner)
);

// Second signer confirms → auto-executes at 2 confirmations
pm.confirmAction(actionId); // From signer2
// Done! newSigner replaces oldSigner
```

**Safety Checks:**
1. `newSigner != address(0)` - Cannot set null signer
2. `oldSigner != newSigner` - Cannot replace with same address
3. `!_isSigner(newSigner)` - **Prevents duplicate signers** (critical!)
4. `oldSigner` must exist in signers array

**Why Prevent Duplicates?**
Without duplicate prevention, replacing SignerA with SignerB (already a signer) would result in:
- `signers = [SignerB, SignerB, SignerC]`
- SignerB now has 2 votes instead of 1
- 3-of-3 actions become impossible (only 2 unique signers)
- Protocol governance effectively broken

**New Components:**
- `ActionType.ReplaceSigner` - New governance action
- `SignerReplaced(oldSigner, newSigner, actionId)` event
- `InvalidSignerReplacement()` error - old==new or duplicate
- `SignerNotFound()` error - oldSigner not in array

#### Constructor Duplicate Signer Validation 🛡️
Added validation at deployment time to prevent duplicate signers in the constructor.

```solidity
constructor(address[3] memory _signers, address _treasury) {
    for (uint256 i = 0; i < 3; i++) {
        if (_signers[i] == address(0)) revert InvalidAddress();
        // Check for duplicate signers
        for (uint256 j = 0; j < i; j++) {
            if (_signers[i] == _signers[j]) revert InvalidAddress();
        }
        signers[i] = _signers[i];
    }
    // ...
}
```

**Why Added?**
Previously, deploying with `[Alice, Alice, Bob]` would succeed, immediately breaking 3-of-3 governance. Now it reverts.

#### Enhanced Sweep Protection 🧹
Updated `_calculateTotalLockedFunds()` to include Pull Pattern pending funds.

**Before v3.4.1:**
```solidity
totalLocked = sum(poolBalance) + sum(proposalBond) + sum(disputeBond)
```

**After v3.4.1:**
```solidity
totalLocked = sum(poolBalance) + sum(proposalBond) + sum(disputeBond) 
            + totalPendingWithdrawals  // NEW!
            + totalPendingCreatorFees  // NEW!
```

**Why Important?**
Without this, `SweepFunds` could accidentally sweep funds that belong to users waiting to withdraw their bonds or creator fees.

### Changed
- `confirmAction()` now checks if action is `ReplaceSigner` and only requires 2 confirmations
- `executeAction()` now checks if action is `ReplaceSigner` and only requires 2 confirmations
- `_calculateTotalLockedFunds()` includes pending withdrawal/creator fee totals

### Tests Added (PullPattern.t.sol - 28 tests)
- `test_CreatorFeeCreditedOnBuy` - Pull Pattern for creator fees
- `test_CreatorFeeCreditedOnSell` - Pull Pattern for creator fees
- `test_WithdrawBond_Success` - Bond withdrawal
- `test_WithdrawCreatorFees_Success` - Creator fee withdrawal
- `test_ProposeOutcome_BlocksEmptyMarket` - NoTradesToResolve check
- `test_ReplaceSigner_Success` - 2-of-3 replacement
- `test_ReplaceSigner_RequiresTwo` - Cannot execute with 1
- `test_ReplaceSigner_PreventDuplicateSigner` - Duplicate blocked
- `test_ReplaceSigner_CannotReplaceWithZero` - Zero address blocked
- `test_ReplaceSigner_CannotReplaceSameAddress` - Same address blocked
- `test_SweepProtection_IncludesPendingWithdrawals` - Sweep safety
- `test_SweepProtection_IncludesPendingCreatorFees` - Sweep safety
- `test_JuryFees_CreditedViaPullPattern` - Jury rewards
- `test_TieScenario_BondsReturnedViaPullPattern` - Tie handling
- And 14 more edge case tests...

**Total Tests:** 164 passing (1 skipped)

---

## [3.4.0] - 2026-01-09

### Added

#### Pull Pattern for Griefing Protection 🛡️
Refactored bond and fee distribution to use the Pull Pattern instead of Push Pattern to prevent griefing attacks.

**Problem Discovered:**
If a proposer, disputer, or market creator had a malicious/broken wallet (contract that reverts on receive), the entire `finalizeMarket()` transaction would fail, blocking market resolution for everyone.

**Attack Scenario:**
```
1. Attacker deploys griefing contract that reverts on ETH receive
2. Attacker proposes outcome with bond from griefing contract
3. Market dispute/voting completes
4. finalizeMarket() tries to send bond back → REVERT
5. Result: Market stuck forever, nobody can claim!
```

**The Solution:**
Changed from Push (immediate transfer) to Pull (credit + withdraw) pattern for:

| Transfer Type | Before (Push) | After (Pull) |
|---------------|--------------|--------------|
| Proposer bond | Direct transfer | `pendingWithdrawals[proposer]` |
| Disputer bond | Direct transfer | `pendingWithdrawals[disputer]` |
| Bond winner payout | Direct transfer | `pendingWithdrawals[winner]` |
| Jury fees | Direct transfer | `pendingWithdrawals[voter]` |
| Creator fees (0.5%) | Direct transfer | `pendingCreatorFees[creator]` |
| Treasury fees | Direct transfer | **Still Push** (we control it) |
| Claim payouts | Direct transfer | **Still Push** (user-initiated) |

**New State Variables:**
```solidity
mapping(address => uint256) public pendingWithdrawals;
mapping(address => uint256) public pendingCreatorFees;
```

**New Functions:**
- `withdrawBond()` - Withdraw pending bonds and jury fees
- `withdrawCreatorFees()` - Withdraw pending creator fees
- `getPendingWithdrawal(address)` - View pending withdrawal balance
- `getPendingCreatorFees(address)` - View pending creator fees

**New Events:**
- `WithdrawalCredited(address indexed user, uint256 amount, string reason)`
- `WithdrawalClaimed(address indexed user, uint256 amount)`
- `CreatorFeesCredited(address indexed creator, uint256 indexed marketId, uint256 amount)`
- `CreatorFeesClaimed(address indexed creator, uint256 amount)`

**New Errors:**
- `NothingToWithdraw()` - When trying to withdraw with 0 balance

**Result:**
- Griefing attack impossible - broken wallet only affects attacker
- Trades always succeed even if creator wallet is broken
- Market resolution never blocked by malicious recipients
- Full CEI (Checks-Effects-Interactions) compliance

#### Empty Market Proposal Block 🚫
Prevents proposals on markets with no trades.

**Problem:**
Markets with 0 YES and 0 NO supply have nothing to resolve, but proposals were still allowed.

**Solution:**
Added check in `proposeOutcome()`:
```solidity
if (market.yesSupply == 0 && market.noSupply == 0) {
    revert NoTradesToResolve();
}
```

**New Error:** `NoTradesToResolve()`

#### Empty Winning Side Safety Check 🛡️
Prevents a critical funds-locking vulnerability where markets could resolve to a side with zero holders.

**Problem Discovered:**
If someone proposes resolution to a side with 0 holders (e.g., propose NO when only YES holders exist), and nobody disputes within 30 minutes, the market would resolve to the empty side → **funds locked forever** (no one can claim because winning side has 0 supply = division by zero scenario).

**Attack Scenario:**
```
1. Market has only YES holders (e.g., 95% confidence question)
2. Attacker proposes NO outcome with minimum bond (0.005 BNB)
3. YES holders have no incentive to dispute (they'd be arguing FOR NO)
4. 30 minutes pass, nobody disputes
5. Market finalizes to NO
6. Result: All funds locked - nobody can claim!
```

**The Solution:**
Added safety check in `finalizeMarket()` for BOTH resolution paths:

1. **Proposed case (no dispute):** Check winning side supply before resolving
2. **Disputed case (after voting):** Check winning side supply after vote outcome determined

If winning side has 0 supply:
- Return all bonds (proposer and disputer if applicable)
- Emit `MarketResolutionFailed` event
- Don't resolve market (allow emergency refund after 24h)

**Implementation:**
- New event: `MarketResolutionFailed(uint256 indexed marketId, string reason)`
- Safety check added in Proposed finalization path
- Safety check added in Disputed finalization path
- Reuses existing `_returnBondsOnTie()` for bond returns

**Result:**
- Attacker loses nothing (bond returned)
- Traders protected (emergency refund available)
- No funds locked forever

### Changed
- `finalizeMarket()` now validates winning side has holders before resolving
- `_returnBondsOnTie()` uses Pull Pattern instead of direct transfers
- `_distributeBonds()` uses Pull Pattern for winner payout
- `_distributeJuryFees()` uses Pull Pattern for voter rewards
- `buyYes()`, `buyNo()`, `sellYes()`, `sellNo()` use Pull Pattern for creator fees
- All bond-related functions are now CEI compliant (state changes before external calls)
- Documentation updated in README.md with new safety rule explanation

### Tests Updated
- `EmptyWinningSide.t.sol` - Updated for Pull Pattern
- `Integration.t.sol` - Updated `DisputedPath_ProposerWins`, `DisputedPath_DisputerWins`, `TieScenario_NoVotes` for Pull Pattern
- `PumpDump.t.sol` - Updated proposer reward tests for Pull Pattern
- `PredictionMarket.fuzz.t.sol` - Updated creator fee collection test for Pull Pattern

---

## [3.3.0] - 2026-01-09

### Deployed
- **BNB Testnet:** [`0x986BF4058265a4c6A5d78ee4DF555198C8C3B7F7`](https://testnet.bscscan.com/address/0x986BF4058265a4c6A5d78ee4DF555198C8C3B7F7)
- **Verified:** ✅ Source code verified on BscScan
- **Status:** ✅ LIVE

### Added

#### Proposer Reward Feature
Incentivizes quick market resolution by rewarding proposers with 0.5% of the pool.

**Problem Solved:**
Previously, proposers risked their bond to resolve markets but received nothing in return (unless disputed and they won). This discouraged community members from proposing outcomes, leading to markets sitting unresolved.

**The Solution:**
Proposers now receive 0.5% of the pool balance as a reward when they successfully resolve a market:

| Scenario | Proposer Gets |
|----------|---------------|
| No dispute | Bond + 0.5% of pool |
| Disputed & wins | Bond + loser's bond share + 0.5% of pool |
| Disputed & loses | Nothing (loses bond) |

**Implementation:**
- New constant: `MAX_PROPOSER_REWARD_BPS = 200` (2% max)
- New state variable: `proposerRewardBps = 50` (0.5% default)
- New event: `ProposerRewardPaid(marketId, proposer, amount)`
- New error: `InvalidProposerReward()`
- New governance action: `SetProposerReward` for MultiSig adjustment

**Economic Impact:**
- For a 10 BNB pool: proposer earns 0.05 BNB (~$15) for resolving
- Winner payouts reduced by 0.5% (negligible impact)
- Creates incentive for prompt resolution

**Governance:**
MultiSig can adjust the reward between 0-2% via `SetProposerReward` action.

### Changed
- `finalizeMarket()` now calculates and pays proposer reward from pool
- `_distributeBonds()` signature updated to include proposer reward parameter
- Updated fee summary table in README.md RULES OF THE GAME

### Tests Added
- `test_ProposerReward_BondReturnedOnFinalize` - No dispute scenario
- `test_ProposerReward_DisputedProposerWins` - Proposer wins dispute
- `test_ProposerReward_DisputedProposerLoses` - Proposer loses dispute
- `test_ProposerReward_GovernanceCanAdjust` - MultiSig can change reward
- `test_ProposerReward_CannotExceedMax` - Max limit enforced
- `test_ProposerReward_CanBeDisabled` - Reward can be set to 0

### ArbitrageProof Test Suite Added
Comprehensive 17-test certification suite (`ArbitrageProof.t.sol`) verifying:
- Single user buy→sell = guaranteed loss (arbitrage blocked)
- Pump/dump scenarios document expected market behavior
- Sandwich attacks don't guarantee profit
- Both-sides arbitrage attempts fail
- All heat levels (CRACK/HIGH/PRO) tested
- Minimum/maximum bet sizes tested
- Fuzz tests with random amounts
- Pool solvency checks

**Total Tests:** 131 passing (1 skipped for pool edge case)

---

## [3.2.0] - 2026-01-09

### Fixed

#### CRITICAL: Bonding Curve Arbitrage Vulnerability
Fixed a critical bug in `_calculateSellBnb()` that allowed instant arbitrage profit.

**The Bug:**
The old formula used average price `(priceBefore + priceAfter) / 2` which created a mismatch between buy and sell calculations. Users could buy shares and immediately sell them for MORE BNB than they put in.

**Proof of Exploit:**
- Wallet A buys 0.01 BNB → gets 1.98 shares
- Wallet B buys 0.1 BNB → gets 16.9 shares
- Wallet B sells ALL 16.9 shares → gets 0.1067 BNB + keeps 2.2 shares
- **Result: 6.7% instant profit + free shares**

**The Fix:**
Changed to use post-sell state for price calculation:

```solidity
// OLD (BROKEN) - average price allowed arbitrage
uint256 avgPrice = (priceBeforeSell + priceAfterSell) / 2;
return (shares * avgPrice) / 1e18;

// NEW (FIXED) - post-sell state ensures loss
uint256 virtualSideAfter = virtualSide - shares;
uint256 totalVirtualAfter = totalVirtual - shares;
return (shares * UNIT_PRICE * virtualSideAfter) / (totalVirtualAfter * 1e18);
```

**After Fix:**
- Buy → immediate sell always results in ~3% loss (platform + creator fees)
- No arbitrage possible
- Pool remains solvent

### Breaking Changes
- **Contract must be redeployed** - existing markets cannot be migrated
- All existing positions on old contract should be closed/resolved first

---

## [3.1.0] - 2026-01-09

### Added

#### Heat Levels Feature
Configurable per-market virtual liquidity for different trading styles:

| Level | Name | Virtual Liquidity | Target Bet | Price Impact |
|-------|------|-------------------|------------|--------------|
| CRACK | Degen Flash | 5 × 1e18 | 0.005-0.1 BNB | ~15% per 0.05 BNB |
| HIGH | Street Fight (DEFAULT) | 20 × 1e18 | 0.1-1.0 BNB | ~15% per 0.5 BNB |
| PRO | Whale Pond | 50 × 1e18 | 1.0-5.0+ BNB | ~15% per 2.0 BNB |

**New Enum:**
```solidity
enum HeatLevel {
    CRACK,  // High volatility - 5 vLiq
    HIGH,   // Balanced (DEFAULT) - 20 vLiq
    PRO     // Low slippage - 50 vLiq
}
```

**New Market Struct Fields:**
- `uint256 virtualLiquidity` - Per-market virtual liquidity (immutable after creation)
- `HeatLevel heatLevel` - Heat level enum for display

**New State Variables:**
```solidity
uint256 public heatLevelCrack = 5 * 1e18;   // Configurable by MultiSig
uint256 public heatLevelHigh = 20 * 1e18;   // Configurable by MultiSig
uint256 public heatLevelPro = 50 * 1e18;    // Configurable by MultiSig
```

**New Constants:**
- `MIN_HEAT_LEVEL = 1 * 1e18` - Minimum allowed heat level value
- `MAX_HEAT_LEVEL = 200 * 1e18` - Maximum allowed heat level value

**New ActionTypes:**
- `SetHeatLevelCrack` - Adjust CRACK level virtual liquidity
- `SetHeatLevelHigh` - Adjust HIGH level virtual liquidity
- `SetHeatLevelPro` - Adjust PRO level virtual liquidity

**Breaking Changes:**
- `createMarket()` now requires `HeatLevel heatLevel` parameter
- `createMarketAndBuy()` now requires `HeatLevel heatLevel` parameter
- `MarketCreated` event now includes `heatLevel` and `virtualLiquidity`

**MultiSig Usage:**
```solidity
// Set CRACK level to 10 virtual liquidity
proposeAction(ActionType.SetHeatLevelCrack, abi.encode(10 * 1e18));
// Then 2 more signers call confirmAction(actionId)
```

**Tests:** Added 6 new tests:
- `test_CreateMarket_HeatLevelCrack`
- `test_CreateMarket_HeatLevelHigh`
- `test_CreateMarket_HeatLevelPro`
- `test_HeatLevel_PriceImpactComparison`
- `test_MultiSig_SetHeatLevelCrack`
- `test_MultiSig_SetHeatLevelHigh`

---

#### SweepFunds Feature
MultiSig governance can recover surplus/dust BNB from the contract.

**New ActionType:**
- `SweepFunds` - Sweep surplus BNB to treasury

**New Error:**
- `NothingToSweep` - Reverts when no surplus funds exist

**New Event:**
```solidity
event FundsSwept(uint256 amount, uint256 totalLocked, uint256 contractBalance);
```

**New View Function:**
```solidity
function getSweepableAmount() external view returns (
    uint256 surplus,
    uint256 totalLocked,
    uint256 contractBalance
);
```

**How It Works:**
1. `_calculateTotalLockedFunds()` iterates all markets to sum:
   - `poolBalance` for unresolved markets
   - Active `proposalBond` amounts
   - Active `disputeBond` amounts
2. Surplus = contract balance - total locked funds
3. Only surplus is sweepable (user funds never touched)

**MultiSig Usage:**
```solidity
// Check sweepable amount first
(uint256 surplus, , ) = pm.getSweepableAmount();

// Sweep surplus to treasury
proposeAction(ActionType.SweepFunds, "");
// Then 2 more signers call confirmAction(actionId)
```

**Tests:** Added 5 new tests:
- `test_SweepFunds_Success`
- `test_SweepFunds_NothingToSweep`
- `test_SweepFunds_ExcludesActivePools`
- `test_SweepFunds_ExcludesActiveBonds`
- `test_GetSweepableAmount_View`

---

### Removed

#### `proofLink` Parameter
Simplified the proposal flow by removing the optional proof link:

**Old Signature:**
```solidity
function proposeOutcome(uint256 marketId, bool outcome, string proofLink) payable
```

**New Signature:**
```solidity
function proposeOutcome(uint256 marketId, bool outcome) payable
```

**Why Removed:**
- Proof links were rarely used in practice
- Market's `evidenceLink` field already serves this purpose
- Simplifies frontend integration and reduces gas costs

**Changes:**
- `OutcomeProposed` event no longer includes `proofLink`
- `getProposal()` returns 5 values instead of 6

---

#### `receive()` Function
Contract now reverts on direct BNB transfers (no data).

**Why Removed:**
- Prevents accidental deposits that would inflate `getSweepableAmount()`
- All legitimate transfers require function calls with data
- Cleaner accounting of contract balance

---

### Changed

- Total tests: **173** (was 163)
- Slither findings: 36 total (0 critical/high, 2 medium, all mitigated)
- Contract lines: 1,701 (was 1,517)

---

## [2.5.0] - 2026-01-08

### Added

#### Market Creation Fee
- Added `marketCreationFee` state variable (defaults to 0 = free market creation)
- Added `MAX_MARKET_CREATION_FEE` constant (0.1 BNB max)
- Added `ActionType.SetMarketCreationFee` for MultiSig governance
- Added `InvalidMarketCreationFee` and `InsufficientCreationFee` errors
- `createMarket` is now `payable` and requires `msg.value >= marketCreationFee`
- `createMarketAndBuy` deducts creation fee from `msg.value` before bet calculation
- Creation fees are sent to the treasury wallet

**MultiSig Usage:**
```solidity
// Set fee to 0.01 BNB
proposeAction(ActionType.SetMarketCreationFee, abi.encode(0.01 ether));
// Then 2 more signers call confirmAction(actionId)
```

**Tests:** Added 15 new tests (12 unit + 3 fuzz):
- `test_MarketCreationFee_DefaultsToZero`
- `test_MultiSig_SetMarketCreationFee`
- `test_MultiSig_SetMarketCreationFee_ToZero`
- `test_MultiSig_RevertMarketCreationFeeTooHigh`
- `test_CreateMarket_WithFee_Success`
- `test_CreateMarket_WithFee_ExcessRefundedNotKept`
- `test_CreateMarket_WithFee_RevertInsufficientFee`
- `test_CreateMarket_WithFee_RevertNoFee`
- `test_CreateMarketAndBuy_WithFee_Success`
- `test_CreateMarketAndBuy_WithFee_RevertInsufficientForFee`
- `test_CreateMarketAndBuy_WithFee_RevertInsufficientForBet`
- `test_CreateMarket_ZeroFee_StillWorks`
- `testFuzz_MultiSig_SetMarketCreationFee_ValidRange`
- `testFuzz_CreateMarket_WithVariableFee`
- `testFuzz_CreateMarketAndBuy_WithVariableFee`

**Total Tests:** 163 passing

## [2.4.0] - 2026-01-08

### Added

#### Market Image URL Support
- Added `imageUrl` field to Market struct for market thumbnail images
- Updated `createMarket` function to accept `imageUrl` parameter
- Updated `createMarketAndBuy` function to accept `imageUrl` parameter  
- Updated `getMarket` view function to return `imageUrl` (now returns 11 values)
- Updated subgraph schema and mapping to index `imageUrl` field

**Breaking Change:** All `createMarket` and `createMarketAndBuy` calls now require an additional `imageUrl` parameter (can be empty string for no image).

**Tests:** All 148 tests updated and passing

## [2.3.0] - 2026-01-07

### Added

#### Weighted Voting Security Tests (Anti-Sybil)
Added 8 new tests to verify the weighted voting system is resistant to Sybil attacks:

- `test_Vote_WeightEqualsShares` - Verifies vote weight = yesShares + noShares
- `test_Vote_LargerPositionMorePower` - Larger shareholders have proportionally more voting power
- `test_Vote_SybilAttackResistance` - Splitting across wallets doesn't increase voting power
- `test_Vote_BothSidesCountForWeight` - Users holding both YES and NO get combined weight
- `test_Vote_WeightedMajorityWins` - Outcome determined by share-weighted majority
- `test_Vote_CantBuySharesAfterExpiry` - Trading blocked after expiry (prevents vote buying)
- `test_Vote_CantBuySharesDuringVoting` - Trading blocked during voting phase
- `test_Vote_ManySmallVotersCantBeatOneLarge` - Multiple small voters don't beat one large voter unfairly

#### Documentation: Weighted Voting Security
Added comprehensive documentation in `README.md` explaining:
- How vote weight is calculated (`voteWeight = yesShares + noShares`)
- Why Sybil attacks (multiple wallets) don't help attackers
- Additional protections (trading disabled after expiry, double-vote prevention)

**Tests:** 148 total tests now passing (+8 from 140)

---

## [2.2.0] - 2025-01-08

### Changed

#### Lowered Minimum Bond Floor
- `MIN_BOND_FLOOR_LOWER`: 0.01 BNB → 0.005 BNB (constant)
- `minBondFloor` default: 0.02 BNB → 0.005 BNB (configurable)

**Why the Change?**
- Makes resolution accessible for smaller markets
- 0.005 BNB (~$3) is still sufficient to deter spam
- Enables more participation in early-stage/low-liquidity markets
- Disputer bond (2x) is now 0.01 BNB minimum

**Bond Calculation:** `max(minBondFloor, pool × dynamicBondBps)`
- Small pools (< 0.5 BNB): Uses 0.005 BNB floor
- Larger pools: Uses 1% of pool (unchanged)

---

## [2.1.0] - 2025-01-07

### Added

#### New View Function: `getMaxSellableShares()`
```solidity
function getMaxSellableShares(uint256 marketId, uint256 userShares, bool isYes) 
    external view returns (uint256 maxShares, uint256 bnbOut)
```

**Purpose:** Calculate maximum shares sellable given current pool liquidity constraints.

**Why needed:** When a user is the only buyer in a market, they cannot immediately sell 100% of their position due to bonding curve math. This function lets the frontend:
- Show "Max Sellable Now" in the UI
- Power a "Sell Max Available" button
- Display liquidity health indicators

**Returns:**
- `maxShares` - Maximum shares that can be sold without exceeding pool balance
- `bnbOut` - Net BNB the user would receive after fees

**Tests:** 8 new tests in `InstantSellAnalysis.t.sol` (124 total tests now passing)

---

## [2.0.0] - 2025-01-08

### 🚀 Major: Street Consensus Resolution

**BREAKING CHANGE:** Complete replacement of UMA Oracle with Street Consensus mechanism.

#### Why the Change?
- UMA resolution took 48-72 hours (too slow for degen markets)
- External dependency on UMA protocol
- Required WBNB wrapping for bonds
- Complex dispute flow confusing for users

#### New: Street Consensus
Fast, trustless resolution where **bettors themselves decide outcomes**.

### Added

#### New Resolution Flow
- `proposeOutcome(marketId, outcome, proofLink)` - Propose YES/NO with optional proof
- `dispute(marketId, proofLink)` - Challenge proposal with 2× bond
- `vote(marketId, supportProposer)` - Vote weighted by share holdings
- `finalizeMarket(marketId)` - Settle after voting ends

#### New Market States
```solidity
enum MarketStatus { Active, Expired, Proposed, Disputed, Resolved }
```

#### Timing Windows
- `CREATOR_PRIORITY_WINDOW` = 10 minutes (creator can propose first)
- `DISPUTE_WINDOW` = 30 minutes (time to challenge)
- `VOTING_WINDOW` = 1 hour (voting period)
- `EMERGENCY_REFUND_DELAY` = 24 hours (unchanged)

#### MultiSig-Configurable Parameters
5 new parameters adjustable via 3-of-3 MultiSig:

| Parameter | Default | Range | Description |
|-----------|---------|-------|-------------|
| `creatorFeeBps` | 50 (0.5%) | 0-200 | Fee to market creator |
| `resolutionFeeBps` | 30 (0.3%) | 0-100 | Fee on propose/dispute/vote |
| `minBondFloor` | 0.005 BNB | 0.005-0.1 | Minimum bond |
| `dynamicBondBps` | 100 (1%) | 50-500 | Bond as % of pool |
| `bondWinnerShareBps` | 5000 (50%) | 2000-8000 | Winner's share of loser bond |

#### Voter Jury Fee
- Voters on winning side split 50% of loser's bond
- Incentivizes accurate voting participation
- Proportional to voting weight (share count)

#### New Events
```solidity
event OutcomeProposed(uint256 indexed marketId, address indexed proposer, bool outcome, uint256 bond, string proofLink);
event MarketDisputed(uint256 indexed marketId, address indexed disputer, uint256 bond, string proofLink);
event VoteCast(uint256 indexed marketId, address indexed voter, bool supportProposer, uint256 weight);
event MarketFinalized(uint256 indexed marketId, bool outcome, address winner, uint256 winnerBonus, uint256 voterPool);
event JuryFeePaid(uint256 indexed marketId, address indexed voter, uint256 amount);
```

#### New Errors
```solidity
error NotExpired();
error AlreadyProposed();
error ProposalWindowNotOpen();
error CreatorPriorityActive();
error InsufficientProposerBond();
error NotProposed();
error AlreadyDisputed();
error DisputeWindowEnded();
error InsufficientDisputerBond();
error NotDisputed();
error VotingNotActive();
error AlreadyVoted();
error NotShareHolder();
error VotingNotEnded();
error NothingToFinalize();
```

### Removed

#### UMA Integration (Completely Removed)
- ❌ `assertOutcome()` - Replaced by `proposeOutcome()`
- ❌ `assertionResolvedCallback()` - No external callbacks needed
- ❌ `umaOOv3` address - No oracle dependency
- ❌ WBNB wrapping for bonds - Uses native BNB
- ❌ `IOptimisticOracleV3` interface
- ❌ `OutcomeAsserted` event
- ❌ 2-hour liveness period (replaced by 30-min dispute window)

#### Asserter Reward (Replaced)
- ❌ `ASSERTER_REWARD_BPS` - No more 2% asserter reward
- ❌ `asserterRewardPaid` field - Removed from Market struct
- ✅ Replaced by bond distribution system

### Changed

#### Market Struct
```solidity
// Old (v1.x)
struct Market {
    // ...
    bytes32 assertionId;
    address asserter;
    bool asserterRewardPaid;
}

// New (v2.0)
struct Market {
    // ...
    address proposer;
    address disputer;
    uint256 proposerBond;
    uint256 disputerBond;
    uint256 proposalTimestamp;
    uint256 disputeTimestamp;
    bool proposedOutcome;
    string proposerProofLink;
    string disputerProofLink;
    uint256 proposerVotes;
    uint256 disputerVotes;
}
```

#### Position Struct
```solidity
// Old (v1.x)
struct Position {
    uint256 yesShares;
    uint256 noShares;
    bool claimed;
    bool emergencyRefunded;
}

// New (v2.0)
struct Position {
    uint256 yesShares;
    uint256 noShares;
    bool claimed;
    bool emergencyRefunded;
    bool hasVoted;
    bool votedForProposer;
}
```

#### getPosition() Return Value
- Old: Returns 4 values `(yesShares, noShares, claimed, emergencyRefunded)`
- New: Returns 6 values `(yesShares, noShares, claimed, emergencyRefunded, hasVoted, votedForProposer)`

#### getMarket() Return Value
- Updated to include all new resolution fields
- Returns 10 values total

### Testing
- **116 tests passing** (was 97)
  - 52 unit tests (PredictionMarket.t.sol)
  - 29 fuzz tests (PredictionMarket.fuzz.t.sol)
  - 4 vulnerability tests (VulnerabilityCheck.t.sol)
  - 31 pump & dump + feature tests (PumpDump.t.sol)
- New tests added:
  - `test_ProposeOutcome_Success`
  - `test_ProposeOutcome_CreatorPriority`
  - `test_ProposeOutcome_AfterPriorityWindow`
  - `test_Dispute_Success`
  - `test_Dispute_RequiresDoubleBond`
  - `test_Vote_Success`
  - `test_Vote_WeightedByShares`
  - `test_FinalizeMarket_ProposerWins`
  - `test_FinalizeMarket_DisputerWins`
  - `test_FinalizeMarket_TieReturnsBonds`
  - `test_FinalizeMarket_NoDisputeAcceptsProposal`
  - `test_JuryFee_DistributedToVoters`
  - Fuzz tests for all 5 configurable parameters

### Migration Guide

#### For Frontend Developers
```javascript
// Old (UMA)
await contract.assertOutcome(marketId, true);
// Wait 48-72 hours...
await contract.claim(marketId);

// New (Street Consensus)
await contract.proposeOutcome(marketId, true, "https://proof.link", { value: bond });
// Wait 30 min for disputes, or...
await contract.dispute(marketId, "https://counter-proof.link", { value: bond * 2 });
// If disputed, wait 1 hour voting...
await contract.vote(marketId, true); // Vote for proposer
// After voting ends...
await contract.finalizeMarket(marketId);
await contract.claim(marketId);
```

#### For Deployers
- Remove UMA OOv3 address from constructor
- Remove WBNB address (only needed if keeping legacy support)
- Constructor now simpler: `constructor(address[3] signers, address treasury)`

---

## [1.1.0] - 2025-01-07

### Added

#### Emergency Refund Mechanism
- `emergencyRefund()` - Self-claim refund when no assertion after 24 hours post-expiry
- `canEmergencyRefund()` - View function to check eligibility and time remaining
- `EMERGENCY_REFUND_DELAY` = 24 hours constant
- Fair distribution: Uses original pool balance, order-independent payouts
- Formula: `refund = (userShares / totalShares) * poolBalance`
- New errors: `EmergencyRefundTooEarly`, `NoPosition`, `AlreadyEmergencyRefunded`, `MarketHasAssertion`
- New event: `EmergencyRefunded(marketId, user, amount)`
- New field: `Position.emergencyRefunded` to prevent double-claiming

#### Asserter Reward Incentive
- 2% of pool balance paid to asserter on first winner claim
- `ASSERTER_REWARD_BPS` = 200 constant
- New field: `Market.asserterRewardPaid` to track payment
- New event: `AsserterRewardPaid(marketId, asserter, amount)`
- Reward deducted from pool before calculating winner payouts

#### Dynamic Bond Pricing
- `getRequiredBond()` - View function returns required bond for assertion
- Formula: `bond = max(MIN_BOND_FLOOR, poolBalance * 1%)`
- `MIN_BOND_FLOOR` = 0.02 BNB constant
- `DYNAMIC_BOND_BPS` = 100 constant (1% of pool)
- Prevents outsized profits on large pools
- Asserter ROI capped at ~100% (risks 1%, earns 2%)

#### UMA Oracle Flow Documentation
- **2-hour challenge window**: Assertions accepted if not disputed
- **Dispute flow**: Goes to UMA DVM for human voting (~48-72h)
- **Liar penalty**: Loses bond to disputer, market resets for new assertion
- **No assertion timeout**: Emergency refund available after 24h

### Changed
- `assertOutcome()` now uses dynamic bond instead of fixed `umaBond`
- `getPosition()` now returns 4 values (added `emergencyRefunded`)
- Default `umaBond` reduced to 0.02 BNB (still exists for admin override)

### Testing
- **97 tests passing** (was 74)
  - 37 unit tests (PredictionMarket.t.sol)
  - 25 fuzz tests (PredictionMarket.fuzz.t.sol)  
  - 4 vulnerability tests (VulnerabilityCheck.t.sol)
  - 31 pump & dump + feature tests (PumpDump.t.sol)

---

## [1.0.0] - 2025-01-06

### Added

#### Core Contract Features
- **Market Creation**
  - `createMarket()` - Free market creation (0 BNB)
  - `createMarketAndBuy()` - Atomic market creation + first buy (anti-frontrun guaranteed)
  - Market fields: question, evidenceLink, resolutionRules, creator, expiryTimestamp

- **Trading System**
  - `buyYes()` / `buyNo()` - Buy shares with BNB via bonding curve
  - `sellYes()` / `sellNo()` - Sell shares back to the pool
  - Slippage protection via `minSharesOut` / `minBnbOut` parameters
  - `previewBuy()` / `previewSell()` view functions for UI integration

- **Bonding Curve**
  - Constant Sum Linear Curve: `P(YES) + P(NO) = 0.01 BNB`
  - Virtual liquidity: 100 YES + 100 NO (scaled to 1e18)
  - Initial price: 0.005 BNB each side (50/50)
  - Average price formula for selling (ensures pool solvency)

- **Fee Structure**
  - Platform Fee: 1% (100 bps) - goes to treasury
  - Creator Fee: 0.5% (50 bps) - goes to market creator
  - Total: 1.5% on all buy AND sell trades
  - Platform fee adjustable via MultiSig (0-5% range)
  - Creator fee hardcoded (prevents abuse)

- **Resolution via UMA OOv3** (Deprecated in v2.0)
  - `assertOutcome()` - Assert market result with WBNB bond
  - `assertionResolvedCallback()` - UMA callback for resolution
  - 2-hour default liveness period

- **Claim System**
  - `claim()` - Winners claim proportional share of pool
  - Pro-rata distribution based on winning side shares
  - Double-claim protection

- **Security**
  - ReentrancyGuard on all external functions
  - CEI (Checks-Effects-Interactions) pattern
  - Solidity 0.8.24 overflow protection
  - Access control modifiers

- **Governance**
  - 3-of-3 MultiSig for admin functions
  - `proposeAction()` / `confirmAction()` / `executeAction()`
  - 1-hour action expiry
  - Pause/unpause functionality

### Testing
- **74 tests passing**
  - Unit tests for all functions
  - Fuzz tests for bonding curve math
  - Vulnerability tests (reentrancy, overflow, access control)
  - Economics verification tests

---

## [Unreleased]

### Planned
- Deployment scripts (BSC Testnet + Mainnet)
- Contract verification
- Gas optimization pass
- Additional fuzz test scenarios

---

## Version History

| Version | Date | Status |
|---------|------|--------|
| 2.0.0 | 2025-01-08 | ✅ Complete |
| 1.1.0 | 2025-01-07 | ✅ Complete |
| 1.0.0 | 2025-01-06 | ✅ Complete |

## Contract Addresses

### BSC Mainnet (Chain ID: 56)
| Contract | Address | Verified |
|----------|---------|----------|
| PredictionMarket | Not deployed | ❌ |

### BSC Testnet (Chain ID: 97)
| Contract | Address | Verified |
|----------|---------|----------|
| PredictionMarket | Not deployed | ❌ |
