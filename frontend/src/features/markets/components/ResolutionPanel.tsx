/**
 * ===== RESOLUTION PANEL COMPONENT =====
 *
 * Handles Street Consensus resolution flow:
 * 1. Propose outcome (creator has 10 min priority)
 * 2. Dispute (within 30 min, requires 2× bond)
 * 3. Vote (if disputed, 1 hour voting window)
 * 4. Finalize (settles the market)
 * 5. Claim (winners get payout)
 *
 * @module features/markets/components/ResolutionPanel
 */

import { useState, useEffect, useRef } from 'react';
import { useAccount } from 'wagmi';
import { Button } from '@/shared/components/ui/Button';
import { Spinner } from '@/shared/components/ui/Spinner';
import { Badge } from '@/shared/components/ui/Badge';
import { AddressDisplay } from '@/shared/components/ui/Jazzicon';
import { useChainValidation } from '@/shared/hooks/useChainValidation';
import {
  useProposeOutcome,
  useDispute,
  useVote,
  useFinalizeMarket,
  useClaim,
  useEmergencyRefund,
  useRequiredBond,
  usePosition,
  useProposerRewardBps,
  useContractPaused,
} from '@/shared/hooks';
import { formatBNB, formatShares } from '@/shared/utils/format';
import { cn } from '@/shared/utils/cn';
import type { Market } from '@/shared/schemas';

interface ResolutionPanelProps {
  market: Market;
  onActionSuccess?: () => void;
}

// Time constants (from contract)
const CREATOR_PRIORITY_WINDOW = 10 * 60 * 1000; // 10 minutes
const DISPUTE_WINDOW = 30 * 60 * 1000; // 30 minutes
const VOTING_WINDOW = 60 * 60 * 1000; // 1 hour
const EMERGENCY_REFUND_DELAY = 24 * 60 * 60 * 1000; // 24 hours

// Frontend safety buffer: Block proposals when <2h remain before emergency refund
// This prevents race conditions between resolution and emergency refund
const PROPOSAL_CUTOFF_BUFFER = 2 * 60 * 60 * 1000; // 2 hours

export function ResolutionPanel({ market, onActionSuccess }: ResolutionPanelProps) {
  const { address } = useAccount();
  const { canTrade } = useChainValidation();
  
  const marketId = BigInt(market.marketId);
  
  // Get required bond for proposing
  // Contract takes 0.3% fee from bond, so we need to send extra to cover it
  // Formula: bondAfterFee = msg.value - (msg.value * 0.003)
  // So: msg.value = requiredBond / (1 - 0.003) = requiredBond / 0.997
  // We add 0.5% buffer to be safe
  const { data: requiredBond } = useRequiredBond(marketId);
  const baseBond = (requiredBond as bigint) || 0n;
  // Add ~0.5% to cover the 0.3% fee plus some buffer for rounding
  const bondAmount = baseBond > 0n ? (baseBond * 1005n) / 1000n : 0n;
  
  // Get proposer reward percentage (default 50 bps = 0.5%)
  const { data: proposerRewardBps } = useProposerRewardBps();
  const rewardBps = (proposerRewardBps as bigint) || 50n;
  
  // Check if contract is paused (emergency mode)
  // When paused, emergency refund is allowed even with active proposals
  const { isPaused: contractPaused } = useContractPaused();
  
  // Calculate estimated proposer reward (0.5% of pool balance)
  const poolBalance = BigInt(market.poolBalance || '0');
  const estimatedReward = (poolBalance * rewardBps) / 10000n;
  
  // Dispute bond is 2× the actual proposerBond (stored in market after proposal)
  // Plus we need to add fee buffer for the dispute transaction too
  const proposerBondFromMarket = market.proposerBond ? BigInt(market.proposerBond) : 0n;
  const baseDisputeBond = proposerBondFromMarket * 2n;
  // Add 0.5% to cover the 0.3% fee plus buffer
  const disputeBond = baseDisputeBond > 0n ? (baseDisputeBond * 1005n) / 1000n : bondAmount * 2n;
  
  // User's position
  const { position, refetch: refetchPosition } = usePosition(marketId, address);
  const userYesShares = position?.yesShares || 0n;
  const userNoShares = position?.noShares || 0n;
  const totalShares = userYesShares + userNoShares;
  const hasClaimed = position?.claimed || false;
  const hasVoted = position?.hasVoted || false;
  const hasEmergencyRefunded = position?.emergencyRefunded || false;
  
  // Calculate winning shares based on market outcome
  const winningShares = market.outcome ? userYesShares : userNoShares;
  const losingShares = market.outcome ? userNoShares : userYesShares;
  
  // Form states
  const [proposedOutcome, setProposedOutcome] = useState<boolean>(true);

  // Contract write hooks
  const { proposeOutcome, isPending: isProposing, isConfirming: isConfirmingPropose, isSuccess: proposeSuccess } = useProposeOutcome();
  const { dispute, isPending: isDisputing, isConfirming: isConfirmingDispute, isSuccess: disputeSuccess } = useDispute();
  const { vote, isPending: isVoting, isConfirming: isConfirmingVote, isSuccess: voteSuccess } = useVote();
  const { finalizeMarket, isPending: isFinalizing, isConfirming: isConfirmingFinalize, isSuccess: finalizeSuccess } = useFinalizeMarket();
  const { claim, isPending: isClaiming, isConfirming: isConfirmingClaim, isSuccess: claimSuccess } = useClaim();
  const { emergencyRefund, isPending: isRefunding, isConfirming: isConfirmingRefund, isSuccess: refundSuccess } = useEmergencyRefund();

  // Aggressive refetch: refs to store timeouts for cleanup
  const refetchTimeoutsRef = useRef<NodeJS.Timeout[]>([]);

  // Trigger aggressive refetch when any action succeeds
  // Pattern: refetch at 1s, 2s, 4s, 8s to catch subgraph indexing
  useEffect(() => {
    if (proposeSuccess || disputeSuccess || voteSuccess || finalizeSuccess || claimSuccess || refundSuccess) {
      // Immediately refetch position from contract (instant update)
      refetchPosition();
      
      // Clear any pending timeouts
      refetchTimeoutsRef.current.forEach(clearTimeout);
      refetchTimeoutsRef.current = [];
      
      // Aggressive refetch pattern: 1s, 2s, 4s, 8s
      const delays = [1000, 2000, 4000, 8000];
      delays.forEach((delay) => {
        const timeout = setTimeout(() => {
          refetchPosition();
          onActionSuccess?.();
        }, delay);
        refetchTimeoutsRef.current.push(timeout);
      });
    }
    
    return () => {
      refetchTimeoutsRef.current.forEach(clearTimeout);
    };
  }, [proposeSuccess, disputeSuccess, voteSuccess, finalizeSuccess, claimSuccess, refundSuccess, onActionSuccess, refetchPosition]);

  // Calculate timestamps
  const expiryMs = Number(market.expiryTimestamp) * 1000;
  const proposalMs = market.proposalTimestamp ? Number(market.proposalTimestamp) * 1000 : 0;
  const disputeMs = market.disputeTimestamp ? Number(market.disputeTimestamp) * 1000 : 0;
  
  // Live-updating "now" for countdown timers
  const [now, setNow] = useState(Date.now());
  
  // Update "now" every second for live countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  
  // Market total supply (from subgraph)
  const marketYesSupply = BigInt(market.yesShares || '0');
  const marketNoSupply = BigInt(market.noShares || '0');
  const marketTotalSupply = marketYesSupply + marketNoSupply;
  const isEmptyMarket = marketTotalSupply === 0n;
  
  // One-sided market: has activity but only on one side (proposal is futile)
  const isOneSidedMarket = !isEmptyMarket && (marketYesSupply === 0n || marketNoSupply === 0n);
  
  // Status checks
  const isExpired = now > expiryMs;
  const isResolved = market.resolved;
  const hasProposal = market.proposer && market.proposer !== '0x0000000000000000000000000000000000000000';
  const hasDispute = market.disputer && market.disputer !== '0x0000000000000000000000000000000000000000';
  
  // Time windows
  const inCreatorPriority = isExpired && now < expiryMs + CREATOR_PRIORITY_WINDOW;
  const isCreator = address?.toLowerCase() === market.creatorAddress?.toLowerCase();
  
  // Check if current user is the proposer (proposer cannot dispute their own proposal)
  const isProposer = address?.toLowerCase() === market.proposer?.toLowerCase();
  
  // Emergency refund time (24h after expiry)
  const emergencyRefundTime = expiryMs + EMERGENCY_REFUND_DELAY;
  
  // Resolution cutoff time (2h before emergency refund) - blocks PROPOSALS ONLY
  // Disputes are NOT blocked by cutoff - they're allowed anytime within their 30-min window (v3.6.1)
  // This ensures legitimate disputes on late proposals aren't unfairly blocked
  const resolutionCutoffTime = emergencyRefundTime - PROPOSAL_CUTOFF_BUFFER;
  const isInResolutionCutoff = isExpired && !isResolved && now >= resolutionCutoffTime && now < emergencyRefundTime;
  
  // Can only propose if market has participants on BOTH sides (one-sided = futile, contract safety check will block finalization anyway)
  // Also: don't show propose if emergency refund is already available (24h passed) OR within 2h cutoff period
  const canPropose = isExpired && !hasProposal && !isEmptyMarket && !isOneSidedMarket && (inCreatorPriority ? isCreator : true) && now < resolutionCutoffTime;
  
  const disputeWindowEnd = proposalMs + DISPUTE_WINDOW;
  // Proposer cannot dispute their own proposal
  // v3.6.1: Disputes are allowed even after cutoff, as long as within 30-min dispute window
  // The proposal cutoff already ensures resolution completes before emergency refund
  const canDispute = hasProposal && !hasDispute && now < disputeWindowEnd && !isProposer;
  
  const votingWindowEnd = disputeMs + VOTING_WINDOW;
  const canVote = hasDispute && now < votingWindowEnd && totalShares > 0n && !hasVoted;
  
  // Check if proposed winning side has shareholders (if not, finalize will fail)
  const proposedWinningSideHasShares = hasProposal && (
    market.proposedOutcome ? marketYesSupply > 0n : marketNoSupply > 0n
  );
  
  // Detect tie scenario: disputed, voting ended, equal votes, not resolved
  // Includes 0:0 case (no one voted) - contract treats this as a tie too
  const proposerVotes = BigInt(market.proposerVoteWeight || '0');
  const disputerVotes = BigInt(market.disputerVoteWeight || '0');
  const isTie = hasDispute && now > votingWindowEnd && !isResolved && 
    proposerVotes === disputerVotes;
  
  // Detect if market WAS a tie (for UI messages even after finalize cleared proposer/disputer)
  // If disputeTimestamp exists but no proposer/disputer, and votes are equal, it was a tie
  const wasTie = !isResolved && disputeMs > 0 && now > votingWindowEnd && 
    !hasProposal && !hasDispute && proposerVotes === disputerVotes;
  
  // canFinalize: only if proposed side has shareholders AND not a tie (normal finalization)
  const canFinalize = hasProposal && !isResolved && proposedWinningSideHasShares && !isTie && (
    (hasDispute && now > votingWindowEnd) || 
    (!hasDispute && now > disputeWindowEnd)
  );
  
  // canFinalizeTie: for ties, finalizeMarket() MUST be called to return bonds and clear proposer
  // This enables emergency refund afterward (contract clears market.proposer on tie)
  const canFinalizeTie = isTie && hasProposal;
  
  // Can only claim if resolved AND user has shares on the WINNING side
  const canClaim = isResolved && winningShares > 0n && !hasClaimed;
  
  // Emergency refund logic:
  // Contract requirement: 24h after expiry, market not resolved, user has shares, hasn't refunded
  // BUT: If contract is NOT paused and there's a proposal, refund is BLOCKED (must finalize first)
  // Exception: If contract IS paused (emergency mode), refund is ALWAYS allowed (escape hatch)
  const hasProposer = !!market.proposer && market.proposer !== '0x0000000000000000000000000000000000000000';
  const emergencyRefundBlockedByProposal = !contractPaused && hasProposer;
  
  // Can emergency refund: basic conditions + not blocked by active proposal (unless paused)
  const canEmergencyRefund = isExpired && !isResolved && now > emergencyRefundTime && totalShares > 0n && !hasEmergencyRefunded && !emergencyRefundBlockedByProposal;
  
  // v0.8.17: Show emergency refund info to ALL users (market state is relevant info)
  // The claim button is only shown to participants (totalShares > 0n)
  const showEmergencyRefundInfo = isExpired && !isResolved && now <= emergencyRefundTime;
  
  // Detect "Resolution Failed" scenario:
  // - Has proposal (or dispute)
  // - Finalize window has passed
  // - Market still NOT resolved (means empty winning side safety triggered OR tie)
  const resolutionMayHaveFailed = hasProposal && !isResolved && !proposedWinningSideHasShares && (
    (hasDispute && now > votingWindowEnd) || 
    (!hasDispute && now > disputeWindowEnd)
  );
  
  // canFinalizeResolutionFailed: when winning side is empty, finalize returns bond and clears proposer
  // This is needed to enable emergency refund (otherwise proposal blocks it)
  const canFinalizeResolutionFailed = resolutionMayHaveFailed && hasProposer && !isTie;

  // Don't show panel if market is active
  if (!isExpired && !isResolved) {
    return null;
  }

  // Handler functions
  const handlePropose = async () => {
    if (!canTrade || bondAmount === 0n) return;
    await proposeOutcome({
      marketId,
      outcome: proposedOutcome,
      bond: bondAmount,
    });
  };

  const handleDispute = async () => {
    if (!canTrade) return;
    await dispute({
      marketId,
      bond: disputeBond,
    });
  };

  const handleVote = async (supportProposer: boolean) => {
    if (!canTrade || market.proposedOutcome === null || market.proposedOutcome === undefined) return;
    // Convert supportProposer to actual outcome
    // supportProposer=true means vote for proposer's outcome
    // supportProposer=false means vote for opposite (disputer's position)
    const outcome = supportProposer ? market.proposedOutcome : !market.proposedOutcome;
    await vote({ marketId, outcome });
  };

  const handleFinalize = async () => {
    await finalizeMarket(marketId);
  };

  const handleClaim = async () => {
    await claim(marketId);
  };

  const handleEmergencyRefund = async () => {
    await emergencyRefund(marketId);
  };

  // Format time remaining
  const formatTimeLeft = (endMs: number) => {
    const diff = endMs - now;
    if (diff <= 0) return 'Ended';
    const hours = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    if (hours > 0) return `${hours}h ${mins}m`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  return (
    <div className="border border-dark-600 bg-dark-900">
      <div className="border-b border-dark-600 px-4 py-3 flex items-center justify-between">
        <h3 className="font-bold uppercase">RESOLUTION</h3>
        {isResolved ? (
          <Badge variant="yes">
            RESOLVED ({market.outcome ? 'YES WINS' : 'NO WINS'})
          </Badge>
        ) : now > emergencyRefundTime ? (
          <Badge variant="no">UNRESOLVED</Badge>
        ) : isEmptyMarket ? (
          <Badge variant="neutral">NO ACTIVITY</Badge>
        ) : isOneSidedMarket && !hasProposal ? (
          <Badge variant="disputed">ONE-SIDED</Badge>
        ) : hasDispute ? (
          <Badge variant="neutral">DISPUTED</Badge>
        ) : hasProposal ? (
          <Badge variant="neutral">PROPOSED</Badge>
        ) : (
          <Badge variant="neutral">AWAITING</Badge>
        )}
      </div>

      <div className="p-4 space-y-4">
        {/* Contract Paused Banner - Emergency Mode */}
        {contractPaused && (
          <div className="p-3 bg-yellow-500/10 border border-yellow-500/50 text-sm">
            <p className="text-yellow-500 font-bold mb-1">⚠️ CONTRACT PAUSED - EMERGENCY MODE</p>
            <p className="text-text-secondary text-xs">
              The contract is in emergency mode. Trading is disabled, but emergency refunds are available as an escape hatch.
            </p>
          </div>
        )}

        {/* Emergency Refund Blocked by Proposal (only when not paused) */}
        {!contractPaused && emergencyRefundBlockedByProposal && now > emergencyRefundTime && !isResolved && totalShares > 0n && !hasEmergencyRefunded && (
          <div className="p-3 bg-dark-800 border border-no/50 text-sm">
            <p className="text-no font-bold mb-2">EMERGENCY REFUND BLOCKED</p>
            <p className="text-text-secondary text-xs mb-2">
              A resolution proposal exists. You must finalize the market first before emergency refund is available.
            </p>
            <p className="text-text-muted text-xs">
              Call <span className="text-cyber font-mono">Finalize</span> to complete the resolution process.
            </p>
          </div>
        )}

        {/* Empty Market Message */}
        {isEmptyMarket && !isResolved && (
          <div className="p-3 bg-dark-800 border border-dark-600 text-sm">
            <p className="text-text-muted text-center mb-3">
              This market had no participants. Nothing to resolve.
            </p>
            {now <= emergencyRefundTime && (
              <div className="flex justify-between items-center p-2 bg-dark-700 rounded">
                <span className="text-text-muted text-xs">Status changes to UNRESOLVED in:</span>
                <span className="text-cyber font-mono font-bold">{formatTimeLeft(emergencyRefundTime)}</span>
              </div>
            )}
          </div>
        )}

        {/* One-Sided Market Message */}
        {isOneSidedMarket && !isResolved && !hasProposal && (
          <div className="p-3 bg-dark-800 border border-dark-600 text-sm">
            <p className="text-status-disputed font-bold mb-2">ONE-SIDED MARKET</p>
            <p className="text-text-secondary text-xs mb-3">
              This market has no opposing positions — only <span className={marketYesSupply > 0n ? 'text-yes font-bold' : 'text-no font-bold'}>{marketYesSupply > 0n ? 'YES' : 'NO'}</span> holders exist.
              Resolution is not possible because there is no valid winning outcome.
            </p>
            {now < emergencyRefundTime ? (
              <div className="flex justify-between items-center p-2 bg-dark-700 rounded">
                <span className="text-text-muted text-xs">Emergency refund available in:</span>
                <span className="text-cyber font-mono font-bold">{formatTimeLeft(emergencyRefundTime)}</span>
              </div>
            ) : (
              <div className="p-2 bg-yes/10 border border-yes/30 rounded text-center">
                <p className="text-yes font-bold text-xs">✓ EMERGENCY REFUND AVAILABLE</p>
              </div>
            )}
            <p className="text-text-muted text-xs mt-2">
              All traders will be able to claim a full refund of their invested BNB.
            </p>
          </div>
        )}

        {/* Resolution Failed Warning + Finalize Button */}
        {resolutionMayHaveFailed && !canEmergencyRefund && !isTie && (
          <div className="p-3 bg-dark-800 border border-no/50 text-sm">
            <p className="text-no font-bold mb-2">RESOLUTION BLOCKED</p>
            <p className="text-text-secondary text-xs mb-2">
              The proposed outcome ({market.proposedOutcome ? 'YES' : 'NO'}) has no shareholders. 
              The market cannot resolve to an empty side.
            </p>
            
            {/* Finalize Button - clears proposal and enables emergency refund */}
            {canFinalizeResolutionFailed && (
              <div className="mt-3 pt-3 border-t border-no/30">
                <p className="text-text-muted text-xs mb-2">
                  Click below to process — this returns the proposer's bond and enables emergency refunds.
                </p>
                <Button
                  variant="cyber"
                  onClick={handleFinalize}
                  disabled={isFinalizing || isConfirmingFinalize}
                  className="w-full"
                >
                  {isFinalizing || isConfirmingFinalize ? (
                    <span className="flex items-center justify-center gap-2">
                      <Spinner size="sm" variant="cyber" />
                      PROCESSING...
                    </span>
                  ) : (
                    'FINALIZE (RETURN BOND & ENABLE REFUND)'
                  )}
                </Button>
              </div>
            )}
            
            {!canFinalizeResolutionFailed && (
              <p className="text-text-muted text-xs">
                Emergency refund available in: <span className="text-cyber font-mono">{formatTimeLeft(emergencyRefundTime)}</span>
              </p>
            )}
          </div>
        )}

        {/* Tie Warning + Finalize Tie Button */}
        {isTie && !canEmergencyRefund && (
          <div className="p-3 bg-dark-800 border border-yellow-500/50 text-sm">
            <p className="text-yellow-500 font-bold mb-2">VOTING ENDED IN TIE</p>
            <p className="text-text-secondary text-xs mb-2">
              {proposerVotes === 0n && disputerVotes === 0n 
                ? "No one voted during the dispute window. Without community input, the market cannot be resolved."
                : `The vote ended with equal support for both sides (${formatShares(proposerVotes)} votes each). When the community can't decide, nobody gets punished.`
              }
            </p>
            <div className="text-xs space-y-1 mb-2">
              <p className="text-yes">✓ Proposer bond returned (no penalty)</p>
              <p className="text-yes">✓ Disputer bond returned (no penalty)</p>
              <p className="text-cyber">⏳ Emergency refund available for all traders</p>
            </div>
            
            {/* Finalize Tie Button - MUST be called to return bonds and enable refund */}
            {canFinalizeTie && (
              <div className="mt-3 pt-3 border-t border-yellow-500/30">
                <p className="text-text-muted text-xs mb-2">
                  Click below to process the tie — this returns all bonds and enables emergency refunds.
                </p>
                <Button
                  variant="cyber"
                  onClick={handleFinalize}
                  disabled={isFinalizing || isConfirmingFinalize}
                  className="w-full"
                >
                  {isFinalizing || isConfirmingFinalize ? (
                    <span className="flex items-center justify-center gap-2">
                      <Spinner size="sm" variant="cyber" />
                      PROCESSING TIE...
                    </span>
                  ) : (
                    'FINALIZE TIE (RETURN BONDS)'
                  )}
                </Button>
              </div>
            )}
            
            {!canFinalizeTie && (
              <p className="text-text-muted text-xs">
                Emergency refund available in: <span className="text-cyber font-mono">{formatTimeLeft(emergencyRefundTime)}</span>
              </p>
            )}
          </div>
        )}

        {/* Status Display */}
        {hasProposal && !isResolved && !resolutionMayHaveFailed && (
          <div className="p-3 bg-dark-800 border border-dark-600 text-sm">
            <div className="flex justify-between mb-2">
              <span className="text-text-muted">Proposed Outcome:</span>
              <span className={market.proposedOutcome ? 'text-yes font-bold' : 'text-no font-bold'}>
                {market.proposedOutcome ? 'YES' : 'NO'}
              </span>
            </div>
            {/* Proposer Address */}
            <div className="flex justify-between items-center">
              <span className="text-text-muted">Proposed by:</span>
              <div className="flex items-center gap-2">
                <AddressDisplay address={market.proposer || ''} truncateLength={4} />
                {market.proposer?.toLowerCase() === market.creatorAddress?.toLowerCase() && (
                  <Badge variant="admin" className="text-[10px] px-1.5 py-0.5">CREATOR</Badge>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Dispute Info - Always visible during dispute (for everyone) */}
        {hasDispute && !isResolved && (
          <div className="p-3 bg-dark-800 border border-no/50 text-sm">
            <p className="text-no font-bold mb-2">DISPUTED - VOTING {now < votingWindowEnd ? 'ACTIVE' : 'ENDED'}</p>
            <div className="flex justify-between text-xs mb-3">
              <span className="text-text-muted">{now < votingWindowEnd ? 'Voting ends:' : 'Voting ended'}</span>
              <span className="font-mono text-cyber">{now < votingWindowEnd ? formatTimeLeft(votingWindowEnd) : '—'}</span>
            </div>
            
            {/* Live Vote Tally - Always visible */}
            <div className="grid grid-cols-2 gap-2 text-center mb-3">
              <div className="p-2 border border-yes/30 bg-yes/10">
                <p className="text-yes font-bold text-xs mb-1">
                  PROPOSER ({market.proposedOutcome ? 'YES' : 'NO'})
                </p>
                <div className="flex items-center justify-center gap-1 mb-1">
                  <AddressDisplay address={market.proposer || ''} truncateLength={3} className="text-[10px]" />
                  {market.proposer?.toLowerCase() === market.creatorAddress?.toLowerCase() && (
                    <span className="text-cyber text-[8px]">👑</span>
                  )}
                </div>
                <p className="text-white font-mono text-lg">{formatShares(proposerVotes)}</p>
                <p className="text-text-muted text-[10px]">votes</p>
              </div>
              <div className="p-2 border border-no/30 bg-no/10">
                <p className="text-no font-bold text-xs mb-1">
                  DISPUTER ({market.proposedOutcome ? 'NO' : 'YES'})
                </p>
                <div className="flex items-center justify-center gap-1 mb-1">
                  <AddressDisplay address={market.disputer || ''} truncateLength={3} className="text-[10px]" />
                  {market.disputer?.toLowerCase() === market.creatorAddress?.toLowerCase() && (
                    <span className="text-cyber text-[8px]">👑</span>
                  )}
                </div>
                <p className="text-white font-mono text-lg">{formatShares(disputerVotes)}</p>
                <p className="text-text-muted text-[10px]">votes</p>
              </div>
            </div>

            {/* Vote status messages */}
            {hasVoted && (
              <div className="p-2 bg-yes/10 border border-yes/30 text-xs text-center">
                <span className="text-yes">✓ You have voted</span>
              </div>
            )}
            {!hasVoted && totalShares === 0n && (
              <div className="p-2 bg-dark-700 border border-dark-600 text-xs text-center">
                <span className="text-text-muted">Only shareholders can vote</span>
              </div>
            )}
            {!hasVoted && totalShares > 0n && now >= votingWindowEnd && (
              <div className="p-2 bg-dark-700 border border-dark-600 text-xs text-center">
                <span className="text-text-muted">Voting window has ended</span>
              </div>
            )}
          </div>
        )}

        {/* Creator Priority Window Message - shown to non-creators during first 10 minutes */}
        {inCreatorPriority && !isCreator && !hasProposal && !isEmptyMarket && !isOneSidedMarket && !isResolved && (
          <div className="p-3 bg-dark-800 border border-cyber/50 text-sm">
            <p className="text-cyber font-bold mb-2">CREATOR PRIORITY WINDOW</p>
            <p className="text-text-secondary text-xs mb-3">
              The market creator has exclusive rights to propose the outcome for the first 10 minutes after expiry.
            </p>
            <div className="flex justify-between items-center p-2 bg-dark-700 rounded">
              <span className="text-text-muted text-xs">You can propose in:</span>
              <span className="text-cyber font-mono font-bold">{formatTimeLeft(expiryMs + CREATOR_PRIORITY_WINDOW)}</span>
            </div>
            <p className="text-text-muted text-xs mt-2">
              After this window, anyone can propose the outcome.
            </p>
          </div>
        )}

        {/* Propose Section */}
        {canPropose && !isResolved && (
          <div className="space-y-3">
            {/* Emergency Refund Timer - Always show when awaiting proposal */}
            <div className="p-3 bg-dark-800 border border-dark-600 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-text-muted">Emergency refund available in:</span>
                <span className="text-cyber font-mono font-bold">{formatTimeLeft(emergencyRefundTime)}</span>
              </div>
              <p className="text-text-muted text-xs mt-1">
                If no one resolves by then, all traders can claim a refund.
              </p>
            </div>

            <p className="text-sm text-text-secondary">
              {inCreatorPriority && isCreator 
                ? 'You have priority to propose the outcome.'
                : 'Propose the market outcome. Bond will be returned if correct.'}
            </p>
            
            {/* Proposer Reward Info Box */}
            <div className="p-3 bg-dark-800 border border-dark-600 text-sm space-y-2">
              <p className="text-cyber font-bold">PROPOSER ECONOMICS</p>
              
              {/* Bond & Reward Summary */}
              <div className="text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-text-muted">Your bond:</span>
                  <span className="text-white font-mono">{formatBNB(bondAmount)} BNB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Pool reward (0.5%):</span>
                  <span className="text-yes font-mono">+{formatBNB(estimatedReward)} BNB</span>
                </div>
              </div>
              
              {/* Outcome Scenarios */}
              <div className="border-t border-dark-600 pt-2 space-y-2">
                {/* Scenario: Undisputed */}
                <div className="p-2 bg-yes/10 border border-yes/30 rounded">
                  <p className="text-yes text-xs font-bold mb-1">✓ IF NO ONE DISPUTES (30 min):</p>
                  <div className="text-xs space-y-0.5">
                    <div className="flex justify-between">
                      <span className="text-text-secondary">You get back:</span>
                      <span className="text-white font-mono">{formatBNB(bondAmount)} BNB (bond)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Plus reward:</span>
                      <span className="text-yes font-mono">+{formatBNB(estimatedReward)} BNB</span>
                    </div>
                    <div className="flex justify-between border-t border-yes/20 pt-1 mt-1">
                      <span className="text-white font-bold">Net profit:</span>
                      <span className="text-yes font-mono font-bold">+{formatBNB(estimatedReward)} BNB</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setProposedOutcome(true)}
                className={cn(
                  'py-3 font-bold uppercase border-2 transition-colors',
                  proposedOutcome
                    ? 'bg-yes text-black border-yes'
                    : 'bg-transparent text-yes border-yes/50 hover:border-yes'
                )}
              >
                YES
              </button>
              <button
                onClick={() => setProposedOutcome(false)}
                className={cn(
                  'py-3 font-bold uppercase border-2 transition-colors',
                  !proposedOutcome
                    ? 'bg-no text-black border-no'
                    : 'bg-transparent text-no border-no/50 hover:border-no'
                )}
              >
                NO
              </button>
            </div>

            <div className="text-xs text-text-muted">
              Required bond: <span className="text-cyber font-mono">{formatBNB(bondAmount)} BNB</span>
              <span className="text-text-muted"> (includes 0.3% fee buffer)</span>
            </div>

            <Button
              variant="cyber"
              onClick={handlePropose}
              disabled={isProposing || isConfirmingPropose || !canTrade}
              className="w-full"
            >
              {isProposing || isConfirmingPropose ? (
                <span className="flex items-center justify-center gap-2">
                  <Spinner size="sm" variant="cyber" />
                  {isProposing ? 'CONFIRM...' : 'SUBMITTING...'}
                </span>
              ) : (
                `PROPOSE ${proposedOutcome ? 'YES' : 'NO'}`
              )}
            </Button>
          </div>
        )}

        {/* Dispute Section */}
        {canDispute && !isResolved && (
          <div className="space-y-3 border-t border-dark-600 pt-4">
            {/* Dispute Economics Box */}
            <div className="p-3 bg-dark-800 border border-dark-600 text-sm space-y-2">
              <p className="text-no font-bold">DISPUTER ECONOMICS</p>
              <p className="text-text-muted text-xs mb-2">
                You believe the outcome should be <span className={market.proposedOutcome ? 'text-no font-bold' : 'text-yes font-bold'}>{market.proposedOutcome ? 'NO' : 'YES'}</span> instead of <span className={market.proposedOutcome ? 'text-yes font-bold' : 'text-no font-bold'}>{market.proposedOutcome ? 'YES' : 'NO'}</span>
              </p>
              
              {/* Bond Info */}
              <div className="text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-text-muted">Your bond (2× proposer):</span>
                  <span className="text-white font-mono">{formatBNB(disputeBond)} BNB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Proposer's bond at stake:</span>
                  <span className="text-white font-mono">{formatBNB(proposerBondFromMarket)} BNB</span>
                </div>
              </div>
              
              {/* Outcome Scenarios */}
              <div className="border-t border-dark-600 pt-2 space-y-2">
                {/* Scenario 1: You Win the Vote */}
                <div className="p-2 bg-yes/10 border border-yes/30 rounded">
                  <p className="text-yes text-xs font-bold mb-1">✓ IF YOU WIN THE VOTE (1hr voting):</p>
                  <div className="text-xs space-y-0.5">
                    <div className="flex justify-between">
                      <span className="text-text-secondary">You get back:</span>
                      <span className="text-white font-mono">{formatBNB(disputeBond)} BNB (bond)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">From proposer:</span>
                      <span className="text-yes font-mono">+{formatBNB(proposerBondFromMarket / 2n)} BNB (50%)</span>
                    </div>
                    <div className="flex justify-between border-t border-yes/20 pt-1 mt-1">
                      <span className="text-white font-bold">Net profit:</span>
                      <span className="text-yes font-mono font-bold">+{formatBNB(proposerBondFromMarket / 2n)} BNB</span>
                    </div>
                  </div>
                  <p className="text-text-muted text-[10px] mt-1">
                    * Other 50% of proposer's bond goes to voters who supported you
                  </p>
                </div>
                
                {/* Scenario 2: You Lose the Vote */}
                <div className="p-2 bg-no/10 border border-no/30 rounded">
                  <p className="text-no text-xs font-bold mb-1">✗ IF YOU LOSE THE VOTE:</p>
                  <div className="text-xs space-y-0.5">
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Your bond goes to:</span>
                      <span className="text-no font-mono">Proposer & voters</span>
                    </div>
                    <div className="flex justify-between border-t border-no/20 pt-1 mt-1">
                      <span className="text-white font-bold">Net loss:</span>
                      <span className="text-no font-mono font-bold">-{formatBNB(disputeBond)} BNB</span>
                    </div>
                  </div>
                  <p className="text-text-muted text-[10px] mt-1">
                    * Proposer gets 50% + pool reward, voters share other 50%
                  </p>
                </div>
              </div>
            </div>
            
            <div className="text-xs text-text-muted">
              Time remaining to dispute: <span className="text-cyber font-mono">{formatTimeLeft(disputeWindowEnd)}</span>
            </div>

            <Button
              variant="no"
              onClick={handleDispute}
              disabled={isDisputing || isConfirmingDispute || !canTrade}
              className="w-full"
            >
              {isDisputing || isConfirmingDispute ? (
                <span className="flex items-center justify-center gap-2">
                  <Spinner size="sm" variant="no" />
                  {isDisputing ? 'CONFIRM...' : 'DISPUTING...'}
                </span>
              ) : (
                'DISPUTE'
              )}
            </Button>
          </div>
        )}

        {/* Proposer Can't Dispute Notice */}
        {isProposer && hasProposal && !hasDispute && now < disputeWindowEnd && !isResolved && (
          <div className="p-3 bg-dark-800 border border-dark-600 text-sm">
            <p className="text-text-muted">
              ✓ You proposed <span className={market.proposedOutcome ? 'text-yes font-bold' : 'text-no font-bold'}>{market.proposedOutcome ? 'YES' : 'NO'}</span>. 
              Waiting for dispute window to end.
            </p>
            <p className="text-xs text-text-muted mt-1">
              Time remaining: <span className="text-cyber font-mono">{formatTimeLeft(disputeWindowEnd)}</span>
            </p>
          </div>
        )}

        {/* Vote Section - Only for users who CAN vote */}
        {canVote && !isResolved && (
          <div className="space-y-3 border-t border-dark-600 pt-4">
            {/* Voting Power & Potential Earnings */}
            <div className="p-3 bg-cyber/10 border border-cyber text-sm">
              <p className="text-cyber font-bold mb-2">JURY DUTY</p>
              
              {/* Your Voting Power */}
              <div className="flex justify-between items-center mb-2">
                <span className="text-text-muted text-xs">Your Voting Power:</span>
                <span className="text-cyber font-mono font-bold">{formatShares(totalShares)} shares</span>
              </div>
              
              {/* Potential Earnings Calculation */}
              <div className="bg-dark-900/50 p-2 rounded border border-dark-600 mb-2">
                <p className="text-text-muted text-xs mb-1">Potential Jury Fee (if you vote with winners):</p>
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary text-xs">Prize Pool:</span>
                  <span className="text-white font-mono">{formatBNB(disputeBond)} BNB</span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-text-secondary text-xs">Your Est. Share:</span>
                  <span className="text-yes font-mono font-bold">
                    ~{formatBNB(marketTotalSupply > 0n ? (totalShares * disputeBond) / marketTotalSupply : 0n)} BNB
                  </span>
                </div>
                <p className="text-text-muted text-[10px] mt-1">
                  * Actual earnings depend on total winning votes
                </p>
              </div>
              
              <p className="text-text-muted text-xs">
                Vote for the <strong className="text-white">CORRECT outcome</strong>, not your position. Your weight = ALL shares (YES + NO).
              </p>
            </div>

            <div className="text-xs text-text-muted space-y-1">
              <div className="text-yes">✓ No bond required - only gas (~$0.01)</div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="yes"
                onClick={() => handleVote(true)}
                disabled={isVoting || isConfirmingVote || !canTrade}
              >
                {isVoting || isConfirmingVote ? (
                  <Spinner size="sm" variant="yes" />
                ) : (
                  `VOTE ${market.proposedOutcome ? 'YES' : 'NO'}`
                )}
              </Button>
              <Button
                variant="no"
                onClick={() => handleVote(false)}
                disabled={isVoting || isConfirmingVote || !canTrade}
              >
                {isVoting || isConfirmingVote ? (
                  <Spinner size="sm" variant="no" />
                ) : (
                  `VOTE ${market.proposedOutcome ? 'NO' : 'YES'}`
                )}
              </Button>
            </div>
            
            {/* Clarification */}
            <div className="text-xs text-text-muted text-center p-2 bg-dark-800 border border-dark-600">
              <p><strong className="text-white">Proposer</strong> says outcome is <span className={market.proposedOutcome ? 'text-yes' : 'text-no'}>{market.proposedOutcome ? 'YES' : 'NO'}</span></p>
              <p><strong className="text-white">Disputer</strong> says outcome is <span className={market.proposedOutcome ? 'text-no' : 'text-yes'}>{market.proposedOutcome ? 'NO' : 'YES'}</span></p>
            </div>
          </div>
        )}

        {/* Finalize Section */}
        {canFinalize && !isResolved && (
          <div className="space-y-3 border-t border-dark-600 pt-4">
            <p className="text-sm text-text-secondary">
              {hasDispute ? 'Voting ended. Finalize to settle the market.' : 'Dispute window ended. Finalize to confirm the outcome.'}
            </p>
            
            {/* Proposer/Disputer reward breakdown */}
            {(() => {
              // Get bond values
              const proposerBond = proposerBondFromMarket;
              const disputerBondValue = market.disputerBond ? BigInt(market.disputerBond) : 0n;
              
              // Determine winner based on vote counts (proposer wins if proposerVotes >= disputerVotes)
              const proposerWins = !hasDispute || proposerVotes >= disputerVotes;
              
              // Bond winner share is 50% (5000 bps)
              const BOND_WINNER_SHARE_BPS = 5000n;
              const BPS_DENOMINATOR = 10000n;
              
              if (proposerWins) {
                // Proposer wins: bond back + 50% disputer bond (if disputed) + pool reward
                const bondShare = hasDispute ? (disputerBondValue * BOND_WINNER_SHARE_BPS) / BPS_DENOMINATOR : 0n;
                const totalToProposer = proposerBond + bondShare + estimatedReward;
                
                return (
                  <div className="p-3 bg-dark-800 border border-dark-600 space-y-2">
                    <p className="text-xs font-bold text-white mb-2">PROPOSER RECEIVES:</p>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-text-muted">Bond returned:</span>
                        <span className="font-mono text-white">{formatBNB(proposerBond)} BNB</span>
                      </div>
                      {hasDispute && bondShare > 0n && (
                        <div className="flex justify-between">
                          <span className="text-text-muted">50% of disputer bond:</span>
                          <span className="font-mono text-yes">+{formatBNB(bondShare)} BNB</span>
                        </div>
                      )}
                      {estimatedReward > 0n && (
                        <div className="flex justify-between">
                          <span className="text-text-muted">Pool reward (0.5%):</span>
                          <span className="font-mono text-yes">+{formatBNB(estimatedReward)} BNB</span>
                        </div>
                      )}
                      <div className="flex justify-between border-t border-dark-500 pt-1 mt-1">
                        <span className="text-white font-bold">Total:</span>
                        <span className="font-mono text-yes font-bold">{formatBNB(totalToProposer)} BNB</span>
                      </div>
                    </div>
                  </div>
                );
              } else {
                // Disputer wins: bond back + 50% proposer bond (no pool reward)
                const bondShare = (proposerBond * BOND_WINNER_SHARE_BPS) / BPS_DENOMINATOR;
                const totalToDisputer = disputerBondValue + bondShare;
                
                return (
                  <div className="p-3 bg-dark-800 border border-dark-600 space-y-2">
                    <p className="text-xs font-bold text-white mb-2">DISPUTER RECEIVES:</p>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-text-muted">Bond returned:</span>
                        <span className="font-mono text-white">{formatBNB(disputerBondValue)} BNB</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-muted">50% of proposer bond:</span>
                        <span className="font-mono text-yes">+{formatBNB(bondShare)} BNB</span>
                      </div>
                      <div className="flex justify-between border-t border-dark-500 pt-1 mt-1">
                        <span className="text-white font-bold">Total:</span>
                        <span className="font-mono text-yes font-bold">{formatBNB(totalToDisputer)} BNB</span>
                      </div>
                    </div>
                    <p className="text-text-muted text-xs italic mt-2">
                      Note: Disputer does not receive pool reward.
                    </p>
                  </div>
                );
              }
            })()}
            
            <Button
              variant="cyber"
              onClick={handleFinalize}
              disabled={isFinalizing || isConfirmingFinalize}
              className="w-full"
            >
              {isFinalizing || isConfirmingFinalize ? (
                <span className="flex items-center justify-center gap-2">
                  <Spinner size="sm" variant="cyber" />
                  FINALIZING...
                </span>
              ) : (
                'FINALIZE MARKET'
              )}
            </Button>
          </div>
        )}

        {/* Claim Section */}
        {canClaim && (
          <div className="space-y-3">
            <div className="p-3 bg-yes/10 border border-yes text-sm">
              <p className="text-yes font-bold mb-1">YOU WON!</p>
              <p className="text-text-secondary text-xs">
                You have {formatShares(winningShares)} winning shares
              </p>
            </div>
            <Button
              variant="yes"
              onClick={handleClaim}
              disabled={isClaiming || isConfirmingClaim}
              className="w-full"
            >
              {isClaiming || isConfirmingClaim ? (
                <span className="flex items-center justify-center gap-2">
                  <Spinner size="sm" variant="yes" />
                  CLAIMING...
                </span>
              ) : (
                'CLAIM WINNINGS'
              )}
            </Button>
            {/* Payout estimate */}
            {(() => {
              const totalWinningShares = market.outcome ? marketYesSupply : marketNoSupply;
              if (totalWinningShares > 0n) {
                const grossPayout = (winningShares * poolBalance) / totalWinningShares;
                // Apply 0.3% resolution fee (same as contract)
                const resolutionFee = (grossPayout * 30n) / 10000n;
                const netPayout = grossPayout - resolutionFee;
                return (
                  <div className="text-center text-sm space-y-1">
                    <div>
                      <span className="text-text-muted">Est. payout: </span>
                      <span className="text-yes font-mono font-bold">
                        {formatBNB(netPayout)} BNB
                      </span>
                    </div>
                    <p className="text-text-muted text-xs">
                      (after 0.3% resolution fee)
                    </p>
                  </div>
                );
              }
              return null;
            })()}
          </div>
        )}

        {/* Already Claimed */}
        {hasClaimed && (
          <div className="p-3 bg-dark-800 border border-dark-600 text-center">
            <p className="text-yes font-bold">✓ CLAIMED</p>
            <p className="text-text-muted text-xs mt-1">You have already claimed your winnings</p>
          </div>
        )}

        {/* Resolution History - Show proposer/disputer info after market is resolved */}
        {isResolved && market.proposer && (
          <div className="p-3 bg-dark-800 border border-dark-600 text-sm">
            <p className="text-text-muted font-bold text-xs mb-3">RESOLUTION HISTORY</p>
            
            {/* Proposer Info */}
            <div className="flex justify-between items-center mb-2">
              <span className="text-text-muted text-xs">Proposed by:</span>
              <div className="flex items-center gap-2">
                <AddressDisplay address={market.proposer} truncateLength={4} />
                {market.proposer?.toLowerCase() === market.creatorAddress?.toLowerCase() && (
                  <Badge variant="admin" className="text-[10px] px-1.5 py-0.5">CREATOR</Badge>
                )}
              </div>
            </div>
            
            {/* Disputer Info (if disputed) */}
            {market.disputer && market.disputer !== '0x0000000000000000000000000000000000000000' && (
              <>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-text-muted text-xs">Disputed by:</span>
                  <div className="flex items-center gap-2">
                    <AddressDisplay address={market.disputer} truncateLength={4} />
                    {market.disputer?.toLowerCase() === market.creatorAddress?.toLowerCase() && (
                      <Badge variant="admin" className="text-[10px] px-1.5 py-0.5">CREATOR</Badge>
                    )}
                  </div>
                </div>
                
                {/* Vote Results */}
                <div className="grid grid-cols-2 gap-2 text-center mt-3 pt-3 border-t border-dark-500">
                  <div className={cn(
                    "p-2 border",
                    proposerVotes >= disputerVotes 
                      ? "border-yes/50 bg-yes/10" 
                      : "border-dark-500 bg-dark-700"
                  )}>
                    <p className={cn(
                      "font-bold text-xs mb-1",
                      proposerVotes >= disputerVotes ? "text-yes" : "text-text-muted"
                    )}>
                      PROPOSER {proposerVotes >= disputerVotes && "✓"}
                    </p>
                    <p className="text-white font-mono">{formatShares(proposerVotes)}</p>
                    <p className="text-text-muted text-[10px]">votes</p>
                  </div>
                  <div className={cn(
                    "p-2 border",
                    disputerVotes > proposerVotes 
                      ? "border-yes/50 bg-yes/10" 
                      : "border-dark-500 bg-dark-700"
                  )}>
                    <p className={cn(
                      "font-bold text-xs mb-1",
                      disputerVotes > proposerVotes ? "text-yes" : "text-text-muted"
                    )}>
                      DISPUTER {disputerVotes > proposerVotes && "✓"}
                    </p>
                    <p className="text-white font-mono">{formatShares(disputerVotes)}</p>
                    <p className="text-text-muted text-[10px]">votes</p>
                  </div>
                </div>
                
                {/* Earnings Breakdown for Disputed Market */}
                {(() => {
                  const pBond = proposerBondFromMarket;
                  const dBond = market.disputerBond ? BigInt(market.disputerBond) : 0n;
                  const BOND_WINNER_SHARE_BPS = 5000n;
                  const BPS_DENOMINATOR = 10000n;
                  const proposerWon = proposerVotes >= disputerVotes;
                  
                  if (proposerWon) {
                    // Proposer won: bond back + 50% disputer bond + pool reward
                    const bondWinnings = (dBond * BOND_WINNER_SHARE_BPS) / BPS_DENOMINATOR;
                    const proposerProfit = bondWinnings + estimatedReward;
                    
                    return (
                      <div className="mt-3 pt-3 border-t border-dark-500 space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-text-muted">Proposer earned:</span>
                          <span className="text-yes font-mono">+{formatBNB(proposerProfit)} BNB</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-text-muted">Disputer lost:</span>
                          <span className="text-no font-mono">-{formatBNB(dBond)} BNB</span>
                        </div>
                      </div>
                    );
                  } else {
                    // Disputer won: bond back + 50% proposer bond (no pool reward)
                    const bondWinnings = (pBond * BOND_WINNER_SHARE_BPS) / BPS_DENOMINATOR;
                    const disputerProfit = bondWinnings;
                    
                    return (
                      <div className="mt-3 pt-3 border-t border-dark-500 space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-text-muted">Disputer earned:</span>
                          <span className="text-yes font-mono">+{formatBNB(disputerProfit)} BNB</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-text-muted">Proposer lost:</span>
                          <span className="text-no font-mono">-{formatBNB(pBond)} BNB</span>
                        </div>
                      </div>
                    );
                  }
                })()}
              </>
            )}
            
            {/* No dispute - uncontested: Show proposer earnings */}
            {(!market.disputer || market.disputer === '0x0000000000000000000000000000000000000000') && (
              <div className="space-y-2">
                <p className="text-text-muted text-xs italic mb-2">
                  Proposal was uncontested (no dispute filed)
                </p>
                <div className="flex justify-between text-xs pt-2 border-t border-dark-500">
                  <span className="text-text-muted">Proposer earned:</span>
                  <span className="text-yes font-mono">+{formatBNB(estimatedReward)} BNB</span>
                </div>
                <p className="text-text-muted text-[10px] italic">(0.5% pool reward)</p>
              </div>
            )}
          </div>
        )}

        {/* Emergency Refund */}
        {canEmergencyRefund && (
          <div className="space-y-3 border-t border-dark-600 pt-4">
            {/* Explain why refund is available */}
            {(isTie || wasTie) ? (
              <div className="p-3 bg-dark-800 border border-yellow-500/50 text-sm">
                <p className="text-yellow-500 font-bold mb-2">VOTING TIED - REFUND AVAILABLE</p>
                <p className="text-text-secondary text-xs">
                  {proposerVotes === 0n && disputerVotes === 0n 
                    ? "No one voted during the dispute window. Since the community didn't participate, all traders can claim a proportional refund."
                    : "The vote ended in an exact 50/50 tie. Since the community couldn't reach consensus, all traders can claim a proportional refund based on their total shares."
                  }
                </p>
              </div>
            ) : resolutionMayHaveFailed ? (
              <div className="p-3 bg-dark-800 border border-no/50 text-sm">
                <p className="text-no font-bold mb-2">EMPTY WINNER PROTECTION</p>
                <p className="text-text-secondary text-xs">
                  The proposed winning side ({market.proposedOutcome ? 'YES' : 'NO'}) had no shareholders.
                  Resolution was blocked to protect funds. All traders can claim a proportional refund.
                </p>
              </div>
            ) : (
              <div className="p-3 bg-dark-800 border border-dark-600 text-sm">
                <p className="text-cyber font-bold mb-2">EMERGENCY REFUND</p>
                <p className="text-text-secondary text-xs">
                  This market wasn't resolved within 24 hours after expiry. 
                  You can claim a proportional refund based on your total shares.
                </p>
              </div>
            )}
            <Button
              variant="ghost"
              onClick={handleEmergencyRefund}
              disabled={isRefunding || isConfirmingRefund}
              className="w-full"
            >
              {isRefunding || isConfirmingRefund ? (
                <span className="flex items-center justify-center gap-2">
                  <Spinner size="sm" />
                  REFUNDING...
                </span>
              ) : (
                'CLAIM REFUND'
              )}
            </Button>
            {/* Refund value display */}
            {marketTotalSupply > 0n && (
              <div className="text-center text-sm">
                <span className="text-text-muted">Your refund: </span>
                <span className="text-cyber font-mono font-bold">
                  {formatBNB((totalShares * poolBalance) / marketTotalSupply)} BNB
                </span>
              </div>
            )}
          </div>
        )}

        {/* Already Emergency Refunded */}
        {hasEmergencyRefunded && (
          <div className="p-3 bg-dark-800 border border-dark-600 text-center">
            <p className="text-yes font-bold">✓ REFUNDED</p>
            <p className="text-text-muted text-xs mt-1">You have already claimed your emergency refund</p>
          </div>
        )}

        {/* Resolution Cutoff Period - Less than 2h before emergency refund, only new proposals blocked */}
        {/* v0.8.17: Show to ALL users (not just participants) - market state is relevant info */}
        {isInResolutionCutoff && !isOneSidedMarket && !hasEmergencyRefunded && !hasProposal && (
          <div className="p-3 bg-dark-800 border border-orange-500/30 text-center">
            <p className="text-orange-400 font-bold text-sm mb-2">PROPOSAL WINDOW CLOSED</p>
            <p className="text-text-secondary text-xs mb-3">
              No resolution was proposed in time. Emergency refund will be available soon.
            </p>
            <div className="bg-dark-900 border border-dark-600 p-3">
              <p className="text-text-muted text-xs">Emergency refund unlocks in:</p>
              <p className="text-cyber font-mono text-2xl mt-1">{formatTimeLeft(emergencyRefundTime)}</p>
            </div>
            {/* Only show shares info for participants */}
            {totalShares > 0n && (
              <p className="text-text-muted text-xs mt-3">
                You'll be able to claim a proportional refund based on your {formatShares(totalShares)} shares
              </p>
            )}
          </div>
        )}

        {/* Waiting for Emergency Refund - Show when resolution is stuck (but NOT in cutoff period which has its own section) */}
        {/* v0.8.17: Show to ALL users using showEmergencyRefundInfo, shares info only for participants */}
        {showEmergencyRefundInfo && !canPropose && !canDispute && !canVote && !canFinalize && !isOneSidedMarket && !isInResolutionCutoff && (resolutionMayHaveFailed || isTie || wasTie || !hasProposal) && (
          <div className="p-3 bg-dark-800 border border-cyber/30 text-center">
            {resolutionMayHaveFailed ? (
              <>
                <p className="text-no font-bold text-sm mb-2">RESOLUTION BLOCKED</p>
                <p className="text-text-secondary text-xs mb-3">
                  The proposed outcome ({market.proposedOutcome ? 'YES' : 'NO'}) has no shareholders. 
                  Emergency refund will be available soon.
                </p>
              </>
            ) : (isTie || wasTie) ? (
              <>
                <p className="text-yellow-500 font-bold text-sm mb-2">VOTING TIED</p>
                <p className="text-text-secondary text-xs mb-3">
                  The vote ended in an exact tie. Emergency refund will be available soon.
                </p>
              </>
            ) : (
              <>
                <p className="text-cyber font-bold text-sm mb-2">WAITING FOR RESOLUTION</p>
                <p className="text-text-secondary text-xs mb-3">
                  No one has proposed an outcome yet. Emergency refund will be available soon.
                </p>
              </>
            )}
            <div className="bg-dark-900 border border-dark-600 p-3">
              <p className="text-text-muted text-xs">Emergency refund unlocks in:</p>
              <p className="text-cyber font-mono text-2xl mt-1">{formatTimeLeft(emergencyRefundTime)}</p>
            </div>
            {/* Only show shares info for participants */}
            {totalShares > 0n && !hasEmergencyRefunded && (
              <p className="text-text-muted text-xs mt-3">
                You'll be able to claim a proportional refund based on your {formatShares(totalShares)} shares
              </p>
            )}
          </div>
        )}

        {/* Resolved - Show Outcome */}
        {isResolved && !canClaim && !hasClaimed && (
          <div className="p-3 bg-dark-800 border border-dark-600 text-center">
            <p className={cn('text-xl font-bold', market.outcome ? 'text-yes' : 'text-no')}>
              {market.outcome ? 'YES' : 'NO'} WINS
            </p>
            {totalShares === 0n ? (
              <p className="text-text-muted text-xs mt-1">You didn't participate in this market</p>
            ) : (
              <p className="text-no text-xs mt-1">
                You lost with {formatShares(losingShares)} shares on the wrong side
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ResolutionPanel;
