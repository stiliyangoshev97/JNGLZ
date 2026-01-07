# JunkieFun Subgraph - Changelog

All notable changes to the subgraph will be documented here.

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
