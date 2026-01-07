# Changelog

All notable changes to the PredictionMarket smart contracts will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

- **Resolution via UMA OOv3**
  - `assertOutcome()` - Assert market result with WBNB bond
  - `assertionResolvedCallback()` - UMA callback for resolution
  - 2-hour default liveness period
  - Bond: 0.1 WBNB (configurable 0.01-1 WBNB)

- **Claims**
  - `claim()` - Winners claim proportional share of pool
  - Prevents double-claiming via `claimed` flag

- **Governance (3-of-3 MultiSig)**
  - `proposeAction()` / `confirmAction()` / `executeAction()`
  - Configurable parameters: platformFeeBps, minBet, umaBond, treasury, wbnb, umaOOv3
  - Pause/unpause functionality
  - 1-hour action expiry

#### Safety Features
- ReentrancyGuard on all payable functions
- CEI (Checks-Effects-Interactions) pattern
- `InsufficientPoolBalance` check prevents over-withdrawal
- Overflow protection (Solidity 0.8.24)
- Access control: `onlyUmaOOv3` for callback

#### Events
- `MarketCreated` - Market creation
- `Trade` - Buy/sell actions
- `OutcomeAsserted` - UMA assertion submitted
- `MarketResolved` - Final resolution
- `Claimed` - Winner payout
- `ActionProposed` / `ActionConfirmed` / `ActionExecuted` - Governance
- `Paused` / `Unpaused` - Emergency controls

#### Constants
- `UNIT_PRICE` = 0.01 ether
- `VIRTUAL_LIQUIDITY` = 100 × 1e18
- `CREATOR_FEE_BPS` = 50 (0.5%)
- `MAX_FEE_BPS` = 500 (5%)
- `BPS_DENOMINATOR` = 10000
- `ACTION_EXPIRY` = 1 hour
- `MIN_BET_LOWER` = 0.001 ether
- `MIN_BET_UPPER` = 0.1 ether
- `UMA_BOND_LOWER` = 0.01 ether
- `UMA_BOND_UPPER` = 1 ether

### Testing
- **74 tests passing**
  - 37 unit tests (PredictionMarket.t.sol)
  - 25 fuzz tests (PredictionMarket.fuzz.t.sol)
  - 4 vulnerability tests (VulnerabilityCheck.t.sol)
  - 8 pump & dump economics tests (PumpDump.t.sol)
- Test coverage for all core functions
- Fuzz testing for bonding curve math
- Rounding tolerance tests with `assertApproxEqAbs`
- **Pump & Dump Economics Verified:**
  - Early buyer profits +36.6% when late buyer enters
  - Late buyer loses ~27% when early buyer dumps
  - Pool solvency maintained (never goes negative)
  - InsufficientPoolBalance protection working
  - Creator first-mover advantage via `createMarketAndBuy()`

### Dependencies
- OpenZeppelin Contracts (ReentrancyGuard)
- UMA Optimistic Oracle V3
- WBNB token interface

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
