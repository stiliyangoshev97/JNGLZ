# Changelog

All notable changes to the PredictionMarket smart contracts will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
| ☢️ CRACK | Degen Flash | 5 × 1e18 | 0.005-0.1 BNB | ~15% per 0.05 BNB |
| 🔥 HIGH | Street Fight (DEFAULT) | 20 × 1e18 | 0.1-1.0 BNB | ~15% per 0.5 BNB |
| 🧊 PRO | Whale Pond | 50 × 1e18 | 1.0-5.0+ BNB | ~15% per 2.0 BNB |

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
