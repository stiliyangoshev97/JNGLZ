# Changelog

All notable changes to the PredictionMarket smart contracts will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
| `minBondFloor` | 0.02 BNB | 0.01-0.1 | Minimum bond |
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
