// ============================================
// JunkieFun Subgraph - Event Mappings
// ============================================
// Handles all PredictionMarket contract events
// Transforms blockchain events into GraphQL entities

import { BigInt, BigDecimal, Address, Bytes } from "@graphprotocol/graph-ts";
import {
  MarketCreated,
  Trade as TradeEvent,
  OutcomeProposed,
  ProposalDisputed,
  VoteCast,
  MarketResolved,
  Claimed,
  EmergencyRefunded,
  BondDistributed,
  JuryFeeDistributed,
  FundsSwept,
  ProposerRewardPaid,
  WithdrawalCredited,
  WithdrawalClaimed,
  CreatorFeesCredited,
  CreatorFeesClaimed,
  PredictionMarket,
} from "../generated/PredictionMarket/PredictionMarket";
import {
  Market,
  Trade,
  User,
  Position,
  Vote,
  Claim,
  EmergencyRefund,
  GlobalStats,
  FundsSweep,
  ProposerReward,
  WithdrawalCredit,
  WithdrawalClaim,
  CreatorFeeCredit,
  CreatorFeeClaim,
} from "../generated/schema";

// ============================================
// Constants
// ============================================
const GLOBAL_STATS_ID = "global";
const ZERO_BI = BigInt.fromI32(0);
const ONE_BI = BigInt.fromI32(1);
const ZERO_BD = BigDecimal.fromString("0");

// ============================================
// Helper Functions
// ============================================

/**
 * Convert wei (BigInt) to BNB (BigDecimal)
 */
function toBigDecimal(value: BigInt): BigDecimal {
  return value.toBigDecimal().div(BigDecimal.fromString("1000000000000000000"));
}

/**
 * Get or create User entity
 */
function getOrCreateUser(address: Address): User {
  let id = address.toHexString();
  let user = User.load(id);

  if (user == null) {
    user = new User(id);
    user.address = address;
    user.totalTrades = ZERO_BI;
    user.totalVolume = ZERO_BD;
    user.marketsCreated = ZERO_BI;
    user.totalClaimed = ZERO_BD;
    user.totalRefunded = ZERO_BD;
    user.save();

    // Update global stats
    let stats = getOrCreateGlobalStats();
    stats.totalUsers = stats.totalUsers.plus(ONE_BI);
    stats.save();
  }

  return user;
}

/**
 * Get or create Position entity
 */
function getOrCreatePosition(marketId: string, userAddress: Address): Position {
  let id = marketId + "-" + userAddress.toHexString();
  let position = Position.load(id);

  if (position == null) {
    position = new Position(id);
    position.user = userAddress.toHexString();
    position.market = marketId;
    position.yesShares = ZERO_BI;
    position.noShares = ZERO_BI;
    position.totalInvested = ZERO_BD;
    position.averageYesPrice = ZERO_BD;
    position.averageNoPrice = ZERO_BD;
    position.claimed = false;
    position.emergencyRefunded = false;
    position.hasVoted = false;
    // votedForProposer left unset (null) until they vote
    position.save();
  }

  return position;
}

/**
 * Get or create GlobalStats singleton
 */
function getOrCreateGlobalStats(): GlobalStats {
  let stats = GlobalStats.load(GLOBAL_STATS_ID);

  if (stats == null) {
    stats = new GlobalStats(GLOBAL_STATS_ID);
    stats.totalMarkets = ZERO_BI;
    stats.activeMarkets = ZERO_BI;
    stats.resolvedMarkets = ZERO_BI;
    stats.totalVolume = ZERO_BD;
    stats.totalTrades = ZERO_BI;
    stats.totalUsers = ZERO_BI;
    stats.totalClaimed = ZERO_BD;
    stats.totalRefunded = ZERO_BD;
    stats.disputedMarkets = ZERO_BI;
    stats.totalSwept = ZERO_BD; // v3.1.0
    stats.save();
  }

  return stats;
}

// ============================================
// Event Handlers
// ============================================

/**
 * Handle MarketCreated event
 * Creates new Market entity and updates creator's stats
 */
export function handleMarketCreated(event: MarketCreated): void {
  let marketId = event.params.marketId.toString();

  // Create Market entity
  let market = new Market(marketId);
  market.marketId = event.params.marketId;
  market.question = event.params.question;
  market.creatorAddress = event.params.creator;
  market.expiryTimestamp = event.params.expiryTimestamp;
  market.createdAt = event.block.timestamp;
  market.createdAtBlock = event.block.number;

  // Heat Level (v3.1.0) - from event params
  market.heatLevel = event.params.heatLevel;
  market.virtualLiquidity = event.params.virtualLiquidity;

  // Fetch additional market data from contract (evidenceLink, resolutionRules, imageUrl)
  // These fields are not in the event but stored in contract storage
  let contract = PredictionMarket.bind(event.address);
  let marketData = contract.try_getMarket(event.params.marketId);
  
  if (marketData.reverted) {
    // Fallback if contract call fails
    market.evidenceLink = "";
    market.resolutionRules = "";
    market.imageUrl = "";
  } else {
    market.evidenceLink = marketData.value.getEvidenceLink();
    market.resolutionRules = marketData.value.getResolutionRules();
    market.imageUrl = marketData.value.getImageUrl();
  }

  // Initialize bonding curve state
  market.yesShares = ZERO_BI;
  market.noShares = ZERO_BI;
  market.poolBalance = ZERO_BI;
  market.yesShares = ZERO_BI;
  market.noShares = ZERO_BI;
  market.poolBalance = ZERO_BI;

  // Initialize stats
  market.totalVolume = ZERO_BD;
  market.totalTrades = ZERO_BI;

  // Initialize resolution state
  market.status = "Active";
  market.resolved = false;
  // outcome left unset (null) until resolved

  // proposal/dispute fields left unset (null) until proposed/disputed
  // proposer, proposedOutcome, proposerBond, proposalTimestamp
  // disputer, disputerBond, disputeTimestamp

  // Initialize voting
  market.proposerVoteWeight = ZERO_BI;
  market.disputerVoteWeight = ZERO_BI;
  market.totalVoters = ZERO_BI;

  // Link to creator
  let creator = getOrCreateUser(event.params.creator);
  market.creator = creator.id;
  creator.marketsCreated = creator.marketsCreated.plus(ONE_BI);
  creator.save();

  market.save();

  // Update global stats
  let stats = getOrCreateGlobalStats();
  stats.totalMarkets = stats.totalMarkets.plus(ONE_BI);
  stats.activeMarkets = stats.activeMarkets.plus(ONE_BI);
  stats.save();
}

/**
 * Handle Trade event
 * Creates Trade entity, updates Market and Position
 */
export function handleTrade(event: TradeEvent): void {
  let marketId = event.params.marketId.toString();
  let tradeId =
    event.transaction.hash.toHexString() + "-" + event.logIndex.toString();

  // Load market
  let market = Market.load(marketId);
  if (market == null) {
    return; // Market should exist
  }

  // Get or create user
  let user = getOrCreateUser(event.params.trader);

  // Create Trade entity
  let trade = new Trade(tradeId);
  trade.market = marketId;
  trade.trader = user.id;
  trade.traderAddress = event.params.trader;
  trade.isYes = event.params.isYes;
  trade.isBuy = event.params.isBuy;
  trade.shares = event.params.shares;
  trade.bnbAmount = toBigDecimal(event.params.bnbAmount);
  trade.timestamp = event.block.timestamp;
  trade.txHash = event.transaction.hash;
  trade.blockNumber = event.block.number;
  trade.logIndex = event.logIndex;

  // Calculate price per share
  if (event.params.shares.gt(ZERO_BI)) {
    trade.pricePerShare = trade.bnbAmount.div(
      event.params.shares.toBigDecimal()
    );
  } else {
    trade.pricePerShare = ZERO_BD;
  }

  trade.save();

  // Update market stats
  market.totalVolume = market.totalVolume.plus(trade.bnbAmount);
  market.totalTrades = market.totalTrades.plus(ONE_BI);

  // Update share supplies
  if (event.params.isBuy) {
    if (event.params.isYes) {
      market.yesShares = market.yesShares.plus(event.params.shares);
    } else {
      market.noShares = market.noShares.plus(event.params.shares);
    }
    market.poolBalance = market.poolBalance.plus(event.params.bnbAmount);
  } else {
    // Sell
    if (event.params.isYes) {
      market.yesShares = market.yesShares.minus(event.params.shares);
    } else {
      market.noShares = market.noShares.minus(event.params.shares);
    }
    market.poolBalance = market.poolBalance.minus(event.params.bnbAmount);
  }

  market.save();

  // Update user stats
  user.totalTrades = user.totalTrades.plus(ONE_BI);
  user.totalVolume = user.totalVolume.plus(trade.bnbAmount);
  user.save();

  // Update position
  let position = getOrCreatePosition(marketId, event.params.trader);

  if (event.params.isBuy) {
    if (event.params.isYes) {
      // Update average YES price
      let totalYesCost = position.averageYesPrice.times(
        position.yesShares.toBigDecimal()
      );
      let newTotalCost = totalYesCost.plus(trade.bnbAmount);
      position.yesShares = position.yesShares.plus(event.params.shares);
      if (position.yesShares.gt(ZERO_BI)) {
        position.averageYesPrice = newTotalCost.div(
          position.yesShares.toBigDecimal()
        );
      }
    } else {
      // Update average NO price
      let totalNoCost = position.averageNoPrice.times(
        position.noShares.toBigDecimal()
      );
      let newTotalCost = totalNoCost.plus(trade.bnbAmount);
      position.noShares = position.noShares.plus(event.params.shares);
      if (position.noShares.gt(ZERO_BI)) {
        position.averageNoPrice = newTotalCost.div(
          position.noShares.toBigDecimal()
        );
      }
    }
    position.totalInvested = position.totalInvested.plus(trade.bnbAmount);
  } else {
    // Sell - reduce shares
    if (event.params.isYes) {
      position.yesShares = position.yesShares.minus(event.params.shares);
    } else {
      position.noShares = position.noShares.minus(event.params.shares);
    }
    // Note: We don't reduce totalInvested on sells (tracks cost basis)
  }

  position.save();

  // Update global stats
  let stats = getOrCreateGlobalStats();
  stats.totalVolume = stats.totalVolume.plus(trade.bnbAmount);
  stats.totalTrades = stats.totalTrades.plus(ONE_BI);
  stats.save();
}

/**
 * Handle OutcomeProposed event
 * Updates Market with proposal info
 * v3.1.0: proofLink removed from event
 */
export function handleOutcomeProposed(event: OutcomeProposed): void {
  let marketId = event.params.marketId.toString();
  let market = Market.load(marketId);

  if (market == null) {
    return;
  }

  market.status = "Proposed";
  market.proposer = event.params.proposer;
  market.proposedOutcome = event.params.outcome;
  market.proposerBond = event.params.bond;
  // proofLink removed in v3.1.0
  market.proposalTimestamp = event.block.timestamp;

  market.save();
}

/**
 * Handle ProposalDisputed event
 * Updates Market with dispute info
 */
export function handleProposalDisputed(event: ProposalDisputed): void {
  let marketId = event.params.marketId.toString();
  let market = Market.load(marketId);

  if (market == null) {
    return;
  }

  market.status = "Disputed";
  market.disputer = event.params.disputer;
  market.disputerBond = event.params.bond;
  market.disputeTimestamp = event.block.timestamp;

  market.save();

  // Update global stats
  let stats = getOrCreateGlobalStats();
  stats.disputedMarkets = stats.disputedMarkets.plus(ONE_BI);
  stats.save();
}

/**
 * Handle VoteCast event
 * Creates Vote entity and updates Market voting tallies
 */
export function handleVoteCast(event: VoteCast): void {
  let marketId = event.params.marketId.toString();
  let voteId = marketId + "-" + event.params.voter.toHexString();

  // Load market
  let market = Market.load(marketId);
  if (market == null) {
    return;
  }

  // Get or create user
  let user = getOrCreateUser(event.params.voter);

  // Create Vote entity
  let vote = new Vote(voteId);
  vote.market = marketId;
  vote.voter = user.id;
  vote.voterAddress = event.params.voter;
  vote.supportedProposer = event.params.outcome; // true = for proposer
  vote.weight = event.params.weight;
  vote.timestamp = event.block.timestamp;
  vote.txHash = event.transaction.hash;
  vote.blockNumber = event.block.number;
  vote.save();

  // Update market voting tallies
  if (event.params.outcome) {
    // Voted for proposer
    market.proposerVoteWeight = market.proposerVoteWeight.plus(
      event.params.weight
    );
  } else {
    // Voted for disputer
    market.disputerVoteWeight = market.disputerVoteWeight.plus(
      event.params.weight
    );
  }
  market.totalVoters = market.totalVoters.plus(ONE_BI);
  market.save();

  // Update position voting status
  let position = getOrCreatePosition(marketId, event.params.voter);
  position.hasVoted = true;
  position.votedForProposer = event.params.outcome;
  position.save();
}

/**
 * Handle MarketResolved event
 * Updates Market with final resolution
 */
export function handleMarketResolved(event: MarketResolved): void {
  let marketId = event.params.marketId.toString();
  let market = Market.load(marketId);

  if (market == null) {
    return;
  }

  market.status = "Resolved";
  market.resolved = true;
  market.outcome = event.params.outcome;

  market.save();

  // Update global stats
  let stats = getOrCreateGlobalStats();
  stats.resolvedMarkets = stats.resolvedMarkets.plus(ONE_BI);
  stats.activeMarkets = stats.activeMarkets.minus(ONE_BI);
  stats.save();
}

/**
 * Handle Claimed event
 * Creates Claim entity and updates User/Position
 */
export function handleClaimed(event: Claimed): void {
  let marketId = event.params.marketId.toString();
  let claimId =
    event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
  let claimAmount = toBigDecimal(event.params.amount);

  // Get or create user
  let user = getOrCreateUser(event.params.user);

  // Create Claim entity
  let claim = new Claim(claimId);
  claim.market = marketId;
  claim.user = user.id;
  claim.userAddress = event.params.user;
  claim.amount = claimAmount;
  claim.timestamp = event.block.timestamp;
  claim.txHash = event.transaction.hash;
  claim.blockNumber = event.block.number;
  claim.save();

  // Update user stats
  user.totalClaimed = user.totalClaimed.plus(claimAmount);
  user.save();

  // Update position
  let position = getOrCreatePosition(marketId, event.params.user);
  position.claimed = true;
  position.claimedAmount = claimAmount;
  position.save();

  // Update global stats
  let stats = getOrCreateGlobalStats();
  stats.totalClaimed = stats.totalClaimed.plus(claimAmount);
  stats.save();
}

/**
 * Handle EmergencyRefunded event
 * Creates EmergencyRefund entity and updates User/Position
 */
export function handleEmergencyRefunded(event: EmergencyRefunded): void {
  let marketId = event.params.marketId.toString();
  let refundId =
    event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
  let refundAmount = toBigDecimal(event.params.amount);

  // Get or create user
  let user = getOrCreateUser(event.params.user);

  // Create EmergencyRefund entity
  let refund = new EmergencyRefund(refundId);
  refund.market = marketId;
  refund.user = user.id;
  refund.userAddress = event.params.user;
  refund.amount = refundAmount;
  refund.timestamp = event.block.timestamp;
  refund.txHash = event.transaction.hash;
  refund.blockNumber = event.block.number;
  refund.save();

  // Update user stats
  user.totalRefunded = user.totalRefunded.plus(refundAmount);
  user.save();

  // Update position
  let position = getOrCreatePosition(marketId, event.params.user);
  position.emergencyRefunded = true;
  position.refundedAmount = refundAmount;
  position.save();

  // Update global stats
  let stats = getOrCreateGlobalStats();
  stats.totalRefunded = stats.totalRefunded.plus(refundAmount);
  stats.save();
}

/**
 * Handle BondDistributed event (optional - for analytics)
 * Can be used to track bond distribution details
 */
export function handleBondDistributed(event: BondDistributed): void {
  // This event is primarily for analytics/transparency
  // The key data is already tracked in Market resolution
  // Could add a BondDistribution entity if detailed tracking needed
}

/**
 * Handle JuryFeeDistributed event (optional - for analytics)
 * Tracks individual voter rewards
 */
export function handleJuryFeeDistributed(event: JuryFeeDistributed): void {
  // This event tracks individual voter rewards
  // Could add a JuryReward entity if detailed tracking needed
  // For now, the Vote entity captures participation
}

/**
 * Handle FundsSwept event (v3.1.0)
 * Creates FundsSweep entity and updates GlobalStats
 */
export function handleFundsSwept(event: FundsSwept): void {
  let sweepId =
    event.transaction.hash.toHexString() + "-" + event.logIndex.toString();

  // Create FundsSweep entity
  let sweep = new FundsSweep(sweepId);
  sweep.amount = toBigDecimal(event.params.amount);
  sweep.totalLocked = toBigDecimal(event.params.totalLocked);
  sweep.contractBalance = toBigDecimal(event.params.contractBalance);
  sweep.timestamp = event.block.timestamp;
  sweep.txHash = event.transaction.hash;
  sweep.blockNumber = event.block.number;
  sweep.save();

  // Update global stats
  let stats = getOrCreateGlobalStats();
  stats.totalSwept = stats.totalSwept.plus(sweep.amount);
  stats.save();
}

/**
 * Handle ProposerRewardPaid event (v3.3.0)
 * Creates ProposerReward entity to track proposer incentive payments
 */
export function handleProposerRewardPaid(event: ProposerRewardPaid): void {
  let rewardId =
    event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
  let marketId = event.params.marketId.toString();
  let rewardAmount = toBigDecimal(event.params.amount);

  // Get or create user
  let user = getOrCreateUser(event.params.proposer);

  // Create ProposerReward entity
  let reward = new ProposerReward(rewardId);
  reward.market = marketId;
  reward.proposer = user.id;
  reward.proposerAddress = event.params.proposer;
  reward.amount = rewardAmount;
  reward.timestamp = event.block.timestamp;
  reward.txHash = event.transaction.hash;
  reward.blockNumber = event.block.number;
  reward.save();
}

// ============================================
// Pull Pattern Event Handlers (v3.4.1)
// ============================================

/**
 * Handle WithdrawalCredited event (v3.4.1)
 * Creates WithdrawalCredit entity when funds are credited for withdrawal
 */
export function handleWithdrawalCredited(event: WithdrawalCredited): void {
  let creditId =
    event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
  let creditAmount = toBigDecimal(event.params.amount);

  // Get or create user
  let user = getOrCreateUser(event.params.user);

  // Create WithdrawalCredit entity
  let credit = new WithdrawalCredit(creditId);
  credit.user = user.id;
  credit.userAddress = event.params.user;
  credit.amount = creditAmount;
  credit.reason = event.params.reason;
  credit.timestamp = event.block.timestamp;
  credit.txHash = event.transaction.hash;
  credit.blockNumber = event.block.number;
  credit.save();
}

/**
 * Handle WithdrawalClaimed event (v3.4.1)
 * Creates WithdrawalClaim entity when user claims their pending withdrawal
 */
export function handleWithdrawalClaimed(event: WithdrawalClaimed): void {
  let claimId =
    event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
  let claimAmount = toBigDecimal(event.params.amount);

  // Get or create user
  let user = getOrCreateUser(event.params.user);

  // Create WithdrawalClaim entity
  let claim = new WithdrawalClaim(claimId);
  claim.user = user.id;
  claim.userAddress = event.params.user;
  claim.amount = claimAmount;
  claim.timestamp = event.block.timestamp;
  claim.txHash = event.transaction.hash;
  claim.blockNumber = event.block.number;
  claim.save();
}

/**
 * Handle CreatorFeesCredited event (v3.4.1)
 * Creates CreatorFeeCredit entity when creator fees are credited
 */
export function handleCreatorFeesCredited(event: CreatorFeesCredited): void {
  let creditId =
    event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
  let marketId = event.params.marketId.toString();
  let creditAmount = toBigDecimal(event.params.amount);

  // Get or create user
  let user = getOrCreateUser(event.params.creator);

  // Create CreatorFeeCredit entity
  let credit = new CreatorFeeCredit(creditId);
  credit.creator = user.id;
  credit.creatorAddress = event.params.creator;
  credit.market = marketId;
  credit.amount = creditAmount;
  credit.timestamp = event.block.timestamp;
  credit.txHash = event.transaction.hash;
  credit.blockNumber = event.block.number;
  credit.save();
}

/**
 * Handle CreatorFeesClaimed event (v3.4.1)
 * Creates CreatorFeeClaim entity when creator claims their accumulated fees
 */
export function handleCreatorFeesClaimed(event: CreatorFeesClaimed): void {
  let claimId =
    event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
  let claimAmount = toBigDecimal(event.params.amount);

  // Get or create user
  let user = getOrCreateUser(event.params.creator);

  // Create CreatorFeeClaim entity
  let claim = new CreatorFeeClaim(claimId);
  claim.creator = user.id;
  claim.creatorAddress = event.params.creator;
  claim.amount = claimAmount;
  claim.timestamp = event.block.timestamp;
  claim.txHash = event.transaction.hash;
  claim.blockNumber = event.block.number;
  claim.save();
}
