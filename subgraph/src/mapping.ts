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
  MarketResolutionFailed,
  Claimed,
  EmergencyRefunded,
  BondDistributed,
  JuryFeesPoolCreated,
  JuryFeesClaimed,
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
  JuryFeesPool,
  JuryFeesClaim,
  MarketResolutionFailure,
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

// Fee constants (must match contract: platformFeeBps=100 + creatorFeeBps=50 = 150 bps = 1.5%)
// v3.8.2: BUY events now emit net BNB (after fees), so fee calculation only needed for SELL
const TOTAL_FEE_BPS = BigInt.fromI32(150); // 1.5% total fee
const BPS_DENOMINATOR = BigInt.fromI32(10000);

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
 * v3.5.0: Added P/L tracking fields for leaderboard
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
    
    // P/L Tracking (v3.5.0)
    user.totalBought = ZERO_BD;
    user.totalSold = ZERO_BD;
    user.tradingPnL = ZERO_BD;
    user.totalInvestedInResolved = ZERO_BD;
    user.totalClaimedFromResolved = ZERO_BD;
    user.resolutionPnL = ZERO_BD;
    user.totalPnL = ZERO_BD;
    user.winCount = ZERO_BI;
    user.lossCount = ZERO_BI;
    user.winRate = ZERO_BD;
    
    // Creator/Resolution earnings
    user.totalCreatorFeesEarned = ZERO_BD;
    user.totalProposerRewardsEarned = ZERO_BD;
    user.totalBondEarnings = ZERO_BD;
    user.totalJuryFeesEarned = ZERO_BD;
    
    // Withdrawal tracking
    user.pendingWithdrawals = ZERO_BD;
    user.pendingCreatorFees = ZERO_BD;
    user.totalWithdrawn = ZERO_BD;
    
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
 * v3.5.0: Added P/L tracking fields
 * v3.7.0: Added juryFeesClaimed field
 * v5.0.0: Added share tracking fields for accurate trading P/L
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
    
    // v5.0.0: Share tracking for accurate P/L calculation
    position.totalYesSharesBought = ZERO_BI;
    position.totalYesSharesSold = ZERO_BI;
    position.totalNoSharesBought = ZERO_BI;
    position.totalNoSharesSold = ZERO_BI;
    position.totalYesBnbBought = ZERO_BD;
    position.totalYesBnbSold = ZERO_BD;
    position.totalNoBnbBought = ZERO_BD;
    position.totalNoBnbSold = ZERO_BD;
    
    position.totalInvested = ZERO_BD;
    position.totalReturned = ZERO_BD;
    position.averageYesPrice = ZERO_BD;
    position.averageNoPrice = ZERO_BD;
    position.netCostBasis = ZERO_BD;
    position.fullyExited = false;
    position.tradingPnLRealized = ZERO_BD;
    position.claimed = false;
    position.emergencyRefunded = false;
    position.hasVoted = false;
    position.juryFeesClaimed = false; // v3.7.0
    // votedForProposer, claimedAmount, refundedAmount, realizedPnL, juryFeesClaimedAmount left unset (null) until set
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
    stats.totalJuryFeesPooled = ZERO_BD; // v3.7.0
    stats.totalJuryFeesClaimed = ZERO_BD; // v3.7.0
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

  // Update share supplies and pool balance
  // v3.8.2: Trade event now emits NET BNB (after fees) for both BUY and SELL
  // BUY: event emits amountAfterFee (what goes to pool)
  // SELL: event emits bnbOut (what user receives after fees)
  if (event.params.isBuy) {
    if (event.params.isYes) {
      market.yesShares = market.yesShares.plus(event.params.shares);
    } else {
      market.noShares = market.noShares.plus(event.params.shares);
    }
    // v3.8.2: Event now emits net BNB directly - pool receives exactly this amount
    market.poolBalance = market.poolBalance.plus(event.params.bnbAmount);
  } else {
    // Sell
    if (event.params.isYes) {
      market.yesShares = market.yesShares.minus(event.params.shares);
    } else {
      market.noShares = market.noShares.minus(event.params.shares);
    }
    // Pool loses grossBnbOut, but event emits bnbOut (net after fee)
    // grossBnbOut = bnbOut * 10000 / (10000 - 150) = bnbOut * 10000 / 9850
    let grossBnbOut = event.params.bnbAmount.times(BPS_DENOMINATOR).div(BPS_DENOMINATOR.minus(TOTAL_FEE_BPS));
    
    // v4.0.1 FIX: Clamp pool balance to 0 to prevent negative values from rounding errors
    // Due to integer division differences between Solidity and AssemblyScript, 
    // accumulated rounding can cause poolBalance to go slightly negative after many partial sells
    if (grossBnbOut.gt(market.poolBalance)) {
      market.poolBalance = ZERO_BI;
    } else {
      market.poolBalance = market.poolBalance.minus(grossBnbOut);
    }
  }

  market.save();

  // Update user stats
  user.totalTrades = user.totalTrades.plus(ONE_BI);
  user.totalVolume = user.totalVolume.plus(trade.bnbAmount);
  
  // P/L Tracking (v3.5.0) - track raw totals for reference
  if (event.params.isBuy) {
    user.totalBought = user.totalBought.plus(trade.bnbAmount);
  } else {
    user.totalSold = user.totalSold.plus(trade.bnbAmount);
  }
  // NOTE: tradingPnL is now updated on every sell using avg cost basis (v5.0.0)
  
  user.save();

  // Update position
  let position = getOrCreatePosition(marketId, event.params.trader);
  let bnbAmountBD = trade.bnbAmount;
  let sharesBD = event.params.shares.toBigDecimal();

  if (event.params.isBuy) {
    // ============================================
    // BUY: Track shares and BNB spent per side (v5.0.0)
    // ============================================
    if (event.params.isYes) {
      // Update YES tracking
      position.totalYesSharesBought = position.totalYesSharesBought.plus(event.params.shares);
      position.totalYesBnbBought = position.totalYesBnbBought.plus(bnbAmountBD);
      
      // Update average YES price (legacy)
      let totalYesCost = position.averageYesPrice.times(position.yesShares.toBigDecimal());
      let newTotalCost = totalYesCost.plus(bnbAmountBD);
      position.yesShares = position.yesShares.plus(event.params.shares);
      if (position.yesShares.gt(ZERO_BI)) {
        position.averageYesPrice = newTotalCost.div(position.yesShares.toBigDecimal());
      }
    } else {
      // Update NO tracking
      position.totalNoSharesBought = position.totalNoSharesBought.plus(event.params.shares);
      position.totalNoBnbBought = position.totalNoBnbBought.plus(bnbAmountBD);
      
      // Update average NO price (legacy)
      let totalNoCost = position.averageNoPrice.times(position.noShares.toBigDecimal());
      let newTotalCost = totalNoCost.plus(bnbAmountBD);
      position.noShares = position.noShares.plus(event.params.shares);
      if (position.noShares.gt(ZERO_BI)) {
        position.averageNoPrice = newTotalCost.div(position.noShares.toBigDecimal());
      }
    }
    position.totalInvested = position.totalInvested.plus(bnbAmountBD);
    
    // If user buys back after fully exiting, position is no longer fully exited
    if (position.fullyExited) {
      position.fullyExited = false;
      // Note: We don't reverse tradingPnLRealized - it represents realized gains from past sells
      // Any new trades will add to it
    }
  } else {
    // ============================================
    // SELL: Calculate trading P/L using avg cost basis (v5.0.0)
    // Same formula as frontend: avgCostPerShare * sharesSold = costBasis
    // tradingPnL = bnbReceived - costBasis
    // ============================================
    let thisSellPnL = ZERO_BD;
    
    if (event.params.isYes) {
      // Track YES sell
      position.totalYesSharesSold = position.totalYesSharesSold.plus(event.params.shares);
      position.totalYesBnbSold = position.totalYesBnbSold.plus(bnbAmountBD);
      position.yesShares = position.yesShares.minus(event.params.shares);
      
      // Calculate P/L for this sell using average cost basis
      if (position.totalYesSharesBought.gt(ZERO_BI)) {
        let avgCostPerShare = position.totalYesBnbBought.div(position.totalYesSharesBought.toBigDecimal());
        let costBasisOfSold = avgCostPerShare.times(sharesBD);
        thisSellPnL = bnbAmountBD.minus(costBasisOfSold);
      }
    } else {
      // Track NO sell
      position.totalNoSharesSold = position.totalNoSharesSold.plus(event.params.shares);
      position.totalNoBnbSold = position.totalNoBnbSold.plus(bnbAmountBD);
      position.noShares = position.noShares.minus(event.params.shares);
      
      // Calculate P/L for this sell using average cost basis
      if (position.totalNoSharesBought.gt(ZERO_BI)) {
        let avgCostPerShare = position.totalNoBnbBought.div(position.totalNoSharesBought.toBigDecimal());
        let costBasisOfSold = avgCostPerShare.times(sharesBD);
        thisSellPnL = bnbAmountBD.minus(costBasisOfSold);
      }
    }
    
    // Track total returned from sells (legacy)
    position.totalReturned = position.totalReturned.plus(bnbAmountBD);
    
    // ============================================
    // v5.0.0: Update trading P/L on EVERY sell (not just full exits)
    // This fixes the leaderboard P/L calculation for partial sells
    // ============================================
    position.tradingPnLRealized = position.tradingPnLRealized.plus(thisSellPnL);
    
    // Update user's trading P/L immediately
    user.tradingPnL = user.tradingPnL.plus(thisSellPnL);
    user.totalPnL = user.tradingPnL.plus(user.resolutionPnL);
    user.save();
    
    // Check if position is now fully exited (0 shares on BOTH sides)
    if (position.yesShares.equals(ZERO_BI) && position.noShares.equals(ZERO_BI)) {
      position.fullyExited = true;
    }
  }
  
  // Update net cost basis (what's still "at risk")
  position.netCostBasis = position.totalInvested.minus(position.totalReturned);

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
 * v3.5.0: Added P/L tracking for leaderboard
 * v5.0.0: Simplified - trading P/L is now tracked on every sell, no longer calculated here
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
  
  // Update position
  let position = getOrCreatePosition(marketId, event.params.user);
  position.claimed = true;
  position.claimedAmount = claimAmount;
  
  // v5.0.0: Trading P/L is already tracked on every sell
  // Mark position as finalized for clarity
  position.fullyExited = true;
  
  // Calculate realized P/L for this position: claimed - netCostBasis
  // netCostBasis is what's still "at risk" after sells: totalInvested - totalReturned
  // Clamp negative netCostBasis to 0 (user sold at profit, nothing at risk)
  let effectiveNetCostBasis = position.netCostBasis.gt(ZERO_BD) ? position.netCostBasis : ZERO_BD;
  let realizedPnL = claimAmount.minus(effectiveNetCostBasis);
  position.realizedPnL = realizedPnL;
  position.save();
  
  // Update user resolution P/L (only count non-negative cost basis)
  user.totalInvestedInResolved = user.totalInvestedInResolved.plus(effectiveNetCostBasis);
  user.totalClaimedFromResolved = user.totalClaimedFromResolved.plus(claimAmount);
  user.resolutionPnL = user.totalClaimedFromResolved.minus(user.totalInvestedInResolved);
  
  // Update win/loss count
  if (realizedPnL.gt(ZERO_BD)) {
    user.winCount = user.winCount.plus(ONE_BI);
  } else if (realizedPnL.lt(ZERO_BD)) {
    user.lossCount = user.lossCount.plus(ONE_BI);
  }
  
  // Update win rate
  let totalResolved = user.winCount.plus(user.lossCount);
  if (totalResolved.gt(ZERO_BI)) {
    user.winRate = user.winCount.toBigDecimal().div(totalResolved.toBigDecimal()).times(BigDecimal.fromString("100"));
  }
  
  // Update total P/L (trading + resolution)
  user.totalPnL = user.tradingPnL.plus(user.resolutionPnL);
  
  user.save();

  // Update market pool balance
  // Claims drain the pool - subtract the claimed amount
  let market = Market.load(marketId);
  if (market != null) {
    // The event emits the net amount after 0.3% resolution fee
    // But pool loses the gross amount (bnbOut + fee)
    // grossPayout = claimAmount * 10000 / 9970 (inverse of 0.3% fee)
    // However, for simplicity and since resolution fee is small, we use the event amount
    // The pool is being drained anyway on resolution
    let claimAmountWei = event.params.amount;
    if (market.poolBalance.gt(claimAmountWei)) {
      market.poolBalance = market.poolBalance.minus(claimAmountWei);
    } else {
      market.poolBalance = ZERO_BI;
    }
    market.save();
  }

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

  // Update market pool balance
  // Emergency refunds drain the pool - subtract the refunded amount
  let market = Market.load(marketId);
  if (market != null) {
    let refundAmountWei = event.params.amount;
    if (market.poolBalance.gt(refundAmountWei)) {
      market.poolBalance = market.poolBalance.minus(refundAmountWei);
    } else {
      market.poolBalance = ZERO_BI;
    }
    market.save();
  }

  // Update global stats
  let stats = getOrCreateGlobalStats();
  stats.totalRefunded = stats.totalRefunded.plus(refundAmount);
  stats.save();
}

/**
 * Handle BondDistributed event (v3.6.1 - Earnings tracking)
 * Tracks bond earnings when winning disputes (50% of loser's bond)
 * 
 * Event: BondDistributed(marketId, winner, winnerAmount, voterPoolAmount)
 * - winner: proposer or disputer who won
 * - winnerAmount: total payout (original bond + 50% loser bond + proposer reward if applicable)
 * - voterPoolAmount: 50% of loser bond that goes to jury (same as winner's bond earnings)
 */
export function handleBondDistributed(event: BondDistributed): void {
  // voterPoolAmount = 50% of loser's bond = winner's bond earnings
  let bondEarnings = toBigDecimal(event.params.voterPoolAmount);
  
  // Get or create winner user
  let user = getOrCreateUser(event.params.winner);
  
  // Track bond earnings (50% of loser's bond)
  user.totalBondEarnings = user.totalBondEarnings.plus(bondEarnings);
  user.save();
}

/**
 * Handle JuryFeesPoolCreated event (v3.7.0)
 * Creates JuryFeesPool entity when jury fee pool is created for a market
 */
export function handleJuryFeesPoolCreated(event: JuryFeesPoolCreated): void {
  let poolId =
    event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
  let marketId = event.params.marketId.toString();
  let poolAmount = toBigDecimal(event.params.amount);

  // Create JuryFeesPool entity
  let pool = new JuryFeesPool(poolId);
  pool.market = marketId;
  pool.amount = poolAmount;
  pool.timestamp = event.block.timestamp;
  pool.txHash = event.transaction.hash;
  pool.blockNumber = event.block.number;
  pool.save();

  // Update global stats
  let stats = getOrCreateGlobalStats();
  stats.totalJuryFeesPooled = stats.totalJuryFeesPooled.plus(poolAmount);
  stats.save();
}

/**
 * Handle JuryFeesClaimed event (v3.7.0)
 * Tracks individual voter jury fee claims (replaces JuryFeeDistributed)
 */
export function handleJuryFeesClaimed(event: JuryFeesClaimed): void {
  let claimId =
    event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
  let marketId = event.params.marketId.toString();
  let feeAmount = toBigDecimal(event.params.amount);

  // Get or create user (the voter who received the fee)
  let user = getOrCreateUser(event.params.voter);

  // Create JuryFeesClaim entity
  let claim = new JuryFeesClaim(claimId);
  claim.market = marketId;
  claim.voter = user.id;
  claim.voterAddress = event.params.voter;
  claim.amount = feeAmount;
  claim.timestamp = event.block.timestamp;
  claim.txHash = event.transaction.hash;
  claim.blockNumber = event.block.number;
  claim.save();

  // Update Position entity to track jury fees claimed
  let positionId = marketId + "-" + event.params.voter.toHexString();
  let position = Position.load(positionId);
  if (position) {
    position.juryFeesClaimed = true;
    position.juryFeesClaimedAmount = feeAmount;
    position.save();
  }

  // Update jury fee earnings
  user.totalJuryFeesEarned = user.totalJuryFeesEarned.plus(feeAmount);
  user.save();

  // Update global stats
  let stats = getOrCreateGlobalStats();
  stats.totalJuryFeesClaimed = stats.totalJuryFeesClaimed.plus(feeAmount);
  stats.save();
}

/**
 * Handle MarketResolutionFailed event (v3.7.0)
 * Creates MarketResolutionFailure entity when resolution fails
 */
export function handleMarketResolutionFailed(event: MarketResolutionFailed): void {
  let failureId =
    event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
  let marketId = event.params.marketId.toString();

  // Create MarketResolutionFailure entity
  let failure = new MarketResolutionFailure(failureId);
  failure.market = marketId;
  failure.reason = event.params.reason;
  failure.timestamp = event.block.timestamp;
  failure.txHash = event.transaction.hash;
  failure.blockNumber = event.block.number;
  failure.save();
}

/**
 * Handle ProposerRewardPaid event (v3.3.0)
 * Creates ProposerReward entity to track proposer incentive payments
 * v3.5.0: Added P/L tracking for leaderboard
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
  
  // Update user proposer reward earnings (v3.5.0)
  user.totalProposerRewardsEarned = user.totalProposerRewardsEarned.plus(rewardAmount);
  user.save();
}

// ============================================
// Pull Pattern Event Handlers (v3.4.1)
// ============================================

/**
 * Handle WithdrawalCredited event (v3.4.1)
 * Creates WithdrawalCredit entity when funds are credited for withdrawal
 * v3.5.0: Added pending withdrawal tracking
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
  
  // Track pending withdrawals (v3.5.0)
  user.pendingWithdrawals = user.pendingWithdrawals.plus(creditAmount);
  user.save();
}

/**
 * Handle WithdrawalClaimed event (v3.4.1)
 * Creates WithdrawalClaim entity when user claims their pending withdrawal
 * v3.5.0: Added withdrawal tracking
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
  
  // Update withdrawal tracking (v3.5.0)
  user.pendingWithdrawals = user.pendingWithdrawals.minus(claimAmount);
  user.totalWithdrawn = user.totalWithdrawn.plus(claimAmount);
  user.save();
}

/**
 * Handle CreatorFeesCredited event (v3.4.1)
 * Creates CreatorFeeCredit entity when creator fees are credited
 * v3.5.0: Added pending creator fees tracking
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
  
  // Track pending creator fees (v3.5.0)
  user.pendingCreatorFees = user.pendingCreatorFees.plus(creditAmount);
  user.save();
}

/**
 * Handle CreatorFeesClaimed event (v3.4.1)
 * Creates CreatorFeeClaim entity when creator claims their accumulated fees
 * v3.5.0: Added creator fee earnings tracking
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
  
  // Update creator fee tracking (v3.5.0)
  user.pendingCreatorFees = user.pendingCreatorFees.minus(claimAmount);
  user.totalCreatorFeesEarned = user.totalCreatorFeesEarned.plus(claimAmount);
  user.save();
}
