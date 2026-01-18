# JNGLZ.FUN Subgraph - Changelog

All notable changes to the subgraph will be documented here.

## [3.6.1] - 2026-01-18

### Changed - Contract v3.6.1 Integration
- **Contract Address**: `0x96662c54622304804065210F16483C5f2F3b6a75` (v3.6.1)
- **Start Block**: `85135831` (v3.6.1 deployment block)
- **ABI**: Updated with v3.6.1 ABI (Emergency Refund Security Fix + Dispute Window Fix)

### Contract Changes Indexed
- Emergency Refund Double-Spend vulnerability fixed
- Dispute Window Edge Case fixed (disputes allowed within 30-min window regardless of cutoff)
- Pool accounting fixes in `claim()` and `emergencyRefund()`
- 2-hour resolution cutoff buffer for proposals

### Deployed
- **Version**: `3.6.1`
- **Studio URL**: `https://thegraph.com/studio/subgraph/junkiefun-bnb-testnet`
- **Queries Endpoint**: `https://api.studio.thegraph.com/query/1722665/junkiefun-bnb-testnet/3.6.1`

---

## [3.4.2] - 2026-01-14

### Added - P/L Tracking for Leaderboard
- **User Entity P/L Fields** - Comprehensive profit/loss tracking for public leaderboard
  - Trading P/L: `totalBought`, `totalSold`, `tradingPnL` (realized from sells)
  - Resolution P/L: `totalInvestedInResolved`, `totalClaimedFromResolved`, `resolutionPnL`
  - Combined: `totalPnL` (tradingPnL + resolutionPnL)
  - Leaderboard Stats: `winCount`, `lossCount`, `winRate` (percentage)
  - Earnings: `totalCreatorFeesEarned`, `totalProposerRewardsEarned`, `totalJuryFeesEarned`
  - Withdrawal Tracking: `pendingWithdrawals`, `pendingCreatorFees`, `totalWithdrawn`

- **Position Entity P/L Fields**
  - `totalReturned` - BNB returned from sell transactions
  - `netCostBasis` - totalInvested - totalReturned (what's "at risk")
  - `realizedPnL` - Calculated on market resolution (claimedAmount - netCostBasis)

### Changed
- **Contract Address**: `0x8e6c4437CAE7b9B78C593778cCfBD7C595Ce74a8` (v3.5.0)
- **Start Block**: `84281825` (v3.5.0 deployment block)
- **Heat Level Comments**: Updated to reflect 5 tiers (CRACK, HIGH, PRO, APEX, CORE)

### Updated Event Handlers
- `handleTrade` - Now tracks `totalBought`, `totalSold`, `tradingPnL`, `totalReturned`, `netCostBasis`
- `handleClaimed` - Now calculates `realizedPnL`, updates `resolutionPnL`, `winCount`, `lossCount`, `winRate`
- `handleJuryFeeDistributed` - Now tracks `totalJuryFeesEarned`
- `handleProposerRewardPaid` - Now tracks `totalProposerRewardsEarned`
- `handleWithdrawalCredited` - Now tracks `pendingWithdrawals`
- `handleWithdrawalClaimed` - Now updates `pendingWithdrawals`, `totalWithdrawn`
- `handleCreatorFeesCredited` - Now tracks `pendingCreatorFees`
- `handleCreatorFeesClaimed` - Now updates `pendingCreatorFees`, `totalCreatorFeesEarned`

### Deployed
- **Version**: `3.4.2`
- **Studio URL**: `https://api.studio.thegraph.com/query/1722665/junkiefun-bnb-testnet/3.4.2`
- **Queries Endpoint**: `https://api.studio.thegraph.com/query/1722665/junkiefun-bnb-testnet/3.4.2`

---

## [3.4.1] - 2026-01-10

### Added
- **Pull Pattern Entities** - Tracks pending withdrawals from v3.4.0+ contracts
  - `PendingWithdrawal` - Bonds and jury fees awaiting claim
    - Fields: `id`, `user`, `amount`, `reason`, `creditedAt`, `txHash`, `blockNumber`
  - `PendingCreatorFee` - Creator fees awaiting claim
    - Fields: `id`, `creator`, `market`, `amount`, `creditedAt`, `txHash`, `blockNumber`
  - `WithdrawalClaim` - Completed withdrawal records
    - Fields: `id`, `user`, `amount`, `claimedAt`, `txHash`, `blockNumber`
  - `CreatorFeeClaim` - Completed creator fee claim records
    - Fields: `id`, `creator`, `amount`, `claimedAt`, `txHash`, `blockNumber`

- **New Event Handlers**
  - `handleWithdrawalCredited` - Indexes `WithdrawalCredited(user, amount, reason)`
  - `handleWithdrawalClaimed` - Indexes `WithdrawalClaimed(user, amount)`
  - `handleCreatorFeesCredited` - Indexes `CreatorFeesCredited(creator, marketId, amount)`
  - `handleCreatorFeesClaimed` - Indexes `CreatorFeesClaimed(creator, amount)`

- **User Entity Extensions**
  - `totalPendingWithdrawals` - Sum of unclaimed bonds/jury fees
  - `totalPendingCreatorFees` - Sum of unclaimed creator fees
  - `totalWithdrawn` - Lifetime withdrawn amount
  - `totalCreatorFeesCollected` - Lifetime creator fees collected

### Changed
- **Contract Address**: `0x4e20Df1772D972f10E9604e7e9C775B1ae897464` (v3.4.1)
- **Start Block**: `83514593` (v3.4.1 deployment block)
- **ABI**: Updated with Pull Pattern events and functions

### Deployed
- **Studio URL**: `https://api.studio.thegraph.com/query/.../junkiefun-bnb-testnet/...`
- **Production URL**: `https://gateway.thegraph.com/api/subgraphs/id/21Mbjuj7SdV8YmHYaZ56Z17hVSgJBBgcDkKFceNjeDpn`
- **Rate Limit**: 100,000 queries/month (production gateway)

---

## [3.3.1] - 2026-01-10

### Added
- **ProposerReward Entity** - Tracks proposer reward payouts
  - Fields: `id`, `market`, `proposer`, `amount`, `timestamp`, `txHash`, `blockNumber`
  - Linked to `Market` entity via derived relation

- **handleProposerRewardPaid Event Handler**
  - Indexes `ProposerRewardPaid(marketId, proposer, amount)` events
  - Creates `ProposerReward` entity for each payout

### Changed
- **Contract Address**: Updated to `0x986BF4058265a4c6A5d78ee4DF555198C8C3B7F7` (v3.3.0)
- **Start Block**: Updated to `83435321` (v3.3.0 deployment block)
- **ABI**: Updated with fresh ABI from v3.3.0 contract (includes `ProposerRewardPaid` event)

### Technical
- Deployed as version `v3.3.1` to The Graph Studio
- Synced successfully with all historical events indexed

---

## [1.2.0] - 2026-01-08

### Fixed
- **Evidence link, resolution rules, and imageUrl not being indexed**
  - Root cause: `MarketCreated` event does not emit these fields (only stored in contract storage)
  - Solution: Added contract call to `getMarket()` in `handleMarketCreated` to fetch these fields
  - Now correctly populates `evidenceLink`, `resolutionRules`, and `imageUrl` for all new markets

### Changed
- Updated `handleMarketCreated` mapping to call contract's `getMarket()` function
- Deployed as version `0.0.2` to The Graph Studio

### Technical
- Uses `contract.try_getMarket()` with fallback to empty strings if call fails
- Fields are fetched from contract storage since they're not in the event parameters

## [1.1.0] - 2026-01-08

### Added
- `imageUrl` field to Market entity for market thumbnail images
- Updated schema.graphql and mapping.ts to support imageUrl
- Regenerated types from updated contract ABI

### Changed
- Updated PredictionMarket.json ABI with imageUrl parameter

## [1.0.0] - 2026-01-08

### Added
- Initial subgraph implementation for BNB Testnet
- **Entities (8 total):**
  - `Market` - Full market data with resolution status, voting results
  - `Trade` - Buy/sell transactions with price tracking
  - `User` - Trader profiles with volume stats
  - `Position` - User holdings per market with avg price tracking
  - `Vote` - Voting records for disputed markets (weighted)
  - `Claim` - Payout claim records
  - `EmergencyRefund` - Emergency refund records
  - `GlobalStats` - Platform-wide statistics (singleton)

- **Event Handlers (10 total):**
  - `handleMarketCreated` - Index new markets, create user entities
  - `handleTrade` - Index trades, update supplies/volume/positions
  - `handleOutcomeProposed` - Track resolution proposals with bonds
  - `handleProposalDisputed` - Track disputes with bonds
  - `handleVoteCast` - Track weighted votes for Street Consensus
  - `handleMarketResolved` - Final resolution outcome
  - `handleClaimed` - Track payouts, update positions
  - `handleEmergencyRefunded` - Track refunds, update positions
  - `handleBondDistributed` - Bond distribution analytics
  - `handleJuryFeeDistributed` - Voter reward analytics

- **Features:**
  - Weighted voting support for Street Consensus resolution
  - Average price tracking per position (YES and NO separately)
  - Global platform statistics (volume, trades, users, markets)
  - User leaderboard support (by volume, trades, markets created)
  - Market status tracking (Active → Proposed → Disputed → Resolved)
  - Full P&L tracking for users (invested, claimed, refunded)

### Technical
- AssemblyScript mappings with proper null handling
- BigDecimal for BNB amounts (18 decimals)
- BigInt for share amounts and timestamps
- Derived relations for efficient queries

### Contract
- Address: `0x568FEafFa8c7eED1D81d120a58f4e8DF7bc4E336`
- Network: BNB Testnet (Chapel)
- Start Block: 83119807

---

## Upcoming

### [1.1.0] - Mainnet Release (Planned)
- Deploy contract to BNB Mainnet
- Create mainnet subgraph configuration
- Deploy to Subgraph Studio (mainnet)
- Update deployment documentation
