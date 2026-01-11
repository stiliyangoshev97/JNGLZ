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

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Button } from '@/shared/components/ui/Button';
import { Spinner } from '@/shared/components/ui/Spinner';
import { Badge } from '@/shared/components/ui/Badge';
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
  const { position } = usePosition(marketId, address);
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
  const { claim, isPending: isClaiming, isConfirming: isConfirmingClaim } = useClaim();
  const { emergencyRefund, isPending: isRefunding, isConfirming: isConfirmingRefund } = useEmergencyRefund();

  // Trigger refetch when any action succeeds
  useEffect(() => {
    if (proposeSuccess || disputeSuccess || voteSuccess || finalizeSuccess) {
      // Wait for subgraph to index (3 seconds)
      const timer = setTimeout(() => {
        onActionSuccess?.();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [proposeSuccess, disputeSuccess, voteSuccess, finalizeSuccess, onActionSuccess]);

  // Calculate timestamps
  const expiryMs = Number(market.expiryTimestamp) * 1000;
  const proposalMs = market.proposalTimestamp ? Number(market.proposalTimestamp) * 1000 : 0;
  const disputeMs = market.disputeTimestamp ? Number(market.disputeTimestamp) * 1000 : 0;
  const now = Date.now();
  
  // Market total supply (from subgraph)
  const marketYesSupply = BigInt(market.yesShares || '0');
  const marketNoSupply = BigInt(market.noShares || '0');
  const marketTotalSupply = marketYesSupply + marketNoSupply;
  const isEmptyMarket = marketTotalSupply === 0n;
  
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
  
  // Can only propose if market has participants (contract will revert with NoTradesToResolve otherwise)
  const canPropose = isExpired && !hasProposal && !isEmptyMarket && (inCreatorPriority ? isCreator : true);
  
  const disputeWindowEnd = proposalMs + DISPUTE_WINDOW;
  // Proposer cannot dispute their own proposal
  const canDispute = hasProposal && !hasDispute && now < disputeWindowEnd && !isProposer;
  
  const votingWindowEnd = disputeMs + VOTING_WINDOW;
  const canVote = hasDispute && now < votingWindowEnd && totalShares > 0n && !hasVoted;
  
  const canFinalize = hasProposal && !isResolved && (
    (hasDispute && now > votingWindowEnd) || 
    (!hasDispute && now > disputeWindowEnd)
  );
  
  // Can only claim if resolved AND user has shares on the WINNING side
  const canClaim = isResolved && winningShares > 0n && !hasClaimed;
  
  // Emergency refund: 24h after expiry, market not resolved, user has shares, hasn't refunded
  // NOTE: Contract allows emergency refund even if there IS a proposal (as long as not resolved)
  const emergencyRefundTime = expiryMs + EMERGENCY_REFUND_DELAY;
  const canEmergencyRefund = isExpired && !isResolved && now > emergencyRefundTime && totalShares > 0n && !hasEmergencyRefunded;
  
  // Show "waiting for emergency refund" when market stuck but 24h not passed yet
  const isWaitingForEmergencyRefund = isExpired && !isResolved && now <= emergencyRefundTime && totalShares > 0n && !hasEmergencyRefunded;
  
  // Detect "Resolution Failed" scenario:
  // - Has proposal (or dispute)
  // - Finalize window has passed
  // - Market still NOT resolved (means empty winning side safety triggered)
  const resolutionMayHaveFailed = hasProposal && !isResolved && (
    (hasDispute && now > votingWindowEnd) || 
    (!hasDispute && now > disputeWindowEnd)
  );

  // Detect tie scenario: disputed, voting ended, equal votes, not resolved
  const proposerVotes = BigInt(market.proposerVoteWeight || '0');
  const disputerVotes = BigInt(market.disputerVoteWeight || '0');
  const isTie = hasDispute && now > votingWindowEnd && !isResolved && 
    proposerVotes === disputerVotes && (proposerVotes > 0n || disputerVotes > 0n);

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
    if (!canTrade) return;
    await vote({ marketId, supportProposer });
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
          <Badge variant={market.outcome ? 'yes' : 'no'}>
            {market.outcome ? 'YES WINS' : 'NO WINS'}
          </Badge>
        ) : isEmptyMarket ? (
          <Badge variant="neutral">NO ACTIVITY</Badge>
        ) : hasDispute ? (
          <Badge variant="neutral">DISPUTED</Badge>
        ) : hasProposal ? (
          <Badge variant="neutral">PROPOSED</Badge>
        ) : (
          <Badge variant="neutral">AWAITING</Badge>
        )}
      </div>

      <div className="p-4 space-y-4">
        {/* Empty Market Message */}
        {isEmptyMarket && !isResolved && (
          <div className="p-3 bg-dark-800 border border-dark-600 text-center">
            <p className="text-text-muted text-sm">
              This market had no participants. Nothing to resolve.
            </p>
          </div>
        )}

        {/* Resolution Failed Warning */}
        {resolutionMayHaveFailed && !canEmergencyRefund && !isTie && (
          <div className="p-3 bg-dark-800 border border-no/50 text-sm">
            <p className="text-no font-bold mb-2">⚠️ RESOLUTION BLOCKED</p>
            <p className="text-text-secondary text-xs mb-2">
              The proposed outcome ({market.proposedOutcome ? 'YES' : 'NO'}) has no shareholders. 
              The market cannot resolve to an empty side.
            </p>
            <p className="text-text-muted text-xs">
              Emergency refund available in: <span className="text-cyber font-mono">{formatTimeLeft(emergencyRefundTime)}</span>
            </p>
          </div>
        )}

        {/* Tie Warning */}
        {isTie && !canEmergencyRefund && (
          <div className="p-3 bg-dark-800 border border-yellow-500/50 text-sm">
            <p className="text-yellow-500 font-bold mb-2">⚖️ VOTING ENDED IN TIE</p>
            <p className="text-text-secondary text-xs mb-2">
              The vote ended with equal support for both sides ({formatShares(proposerVotes)} votes each). 
              When the community can't decide, nobody gets punished.
            </p>
            <div className="text-xs space-y-1 mb-2">
              <p className="text-yes">✓ Proposer bond returned (no penalty)</p>
              <p className="text-yes">✓ Disputer bond returned (no penalty)</p>
              <p className="text-cyber">⏳ Emergency refund available for all traders</p>
            </div>
            <p className="text-text-muted text-xs">
              Emergency refund available in: <span className="text-cyber font-mono">{formatTimeLeft(emergencyRefundTime)}</span>
            </p>
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
          </div>
        )}

        {/* Dispute Info */}
        {hasDispute && !isResolved && (
          <div className="p-3 bg-dark-800 border border-no/50 text-sm">
            <p className="text-no font-bold mb-2">⚠️ DISPUTED - VOTING ACTIVE</p>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-text-muted">Voting ends:</span>
              <span className="font-mono text-cyber">{formatTimeLeft(votingWindowEnd)}</span>
            </div>
            <div className="border-t border-dark-600 pt-2 mt-2 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-text-muted">
                  Proposer ({market.proposedOutcome ? <span className="text-yes">YES</span> : <span className="text-no">NO</span>}):
                </span>
                <span className="font-mono text-white">{formatShares(BigInt(market.proposerVoteWeight || '0'))} votes</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-text-muted">
                  Disputer ({market.proposedOutcome ? <span className="text-no">NO</span> : <span className="text-yes">YES</span>}):
                </span>
                <span className="font-mono text-white">{formatShares(BigInt(market.disputerVoteWeight || '0'))} votes</span>
              </div>
            </div>
          </div>
        )}

        {/* Propose Section */}
        {canPropose && !isResolved && (
          <div className="space-y-3">
            <p className="text-sm text-text-secondary">
              {inCreatorPriority && isCreator 
                ? 'You have priority to propose the outcome.'
                : 'Propose the market outcome. Bond will be returned if correct.'}
            </p>
            
            {/* Proposer Reward Info Box */}
            <div className="p-3 bg-dark-800 border border-dark-600 text-sm space-y-2">
              <p className="text-cyber font-bold">RESOLUTION ECONOMICS</p>
              <div className="text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-text-muted">Your bond:</span>
                  <span className="text-white font-mono">{formatBNB(bondAmount)} BNB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Potential reward:</span>
                  <span className="text-yes font-mono">+{formatBNB(estimatedReward)} BNB</span>
                </div>
              </div>
              <div className="border-t border-dark-600 pt-2 text-xs">
                <p className="text-yes mb-1">✓ <span className="font-bold">If undisputed or you win vote:</span> Bond back + reward</p>
                <p className="text-no">✗ <span className="font-bold">If disputed & you lose vote:</span> Bond goes to disputer</p>
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

            <div className="text-xs text-text-muted space-y-1">
              <div>
                Required bond: <span className="text-cyber font-mono">{formatBNB(bondAmount)} BNB</span>
                <span className="text-text-muted"> (includes 0.3% fee)</span>
              </div>
              <div className="text-yes">
                ✓ If correct: Bond returned + {formatBNB(estimatedReward)} BNB reward
              </div>
              <div className="text-no">
                ✗ If disputed & you lose: Bond goes to winner
              </div>
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
              <p className="text-no font-bold">⚔️ DISPUTE ECONOMICS</p>
              <div className="text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-text-muted">Your bond:</span>
                  <span className="text-white font-mono">{formatBNB(disputeBond)} BNB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">If you win vote:</span>
                  <span className="text-yes font-mono">+{formatBNB(proposerBondFromMarket)} BNB (proposer's bond)</span>
                </div>
              </div>
              <div className="border-t border-dark-600 pt-2 text-xs">
                <p className="text-yes mb-1">✓ <span className="font-bold">If you win:</span> Your bond back + proposer's bond</p>
                <p className="text-no">✗ <span className="font-bold">If you lose:</span> Your bond goes to proposer</p>
              </div>
            </div>
            
            <div className="text-xs text-text-muted">
              Time remaining: <span className="text-cyber font-mono">{formatTimeLeft(disputeWindowEnd)}</span>
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

        {/* Vote Section */}
        {canVote && !isResolved && (
          <div className="space-y-3 border-t border-dark-600 pt-4">
            <div className="p-3 bg-cyber/10 border border-cyber text-sm">
              <p className="text-cyber font-bold mb-1">🗳️ YOUR VOTE MATTERS!</p>
              <p className="text-text-secondary text-xs">
                Vote weight: <span className="text-cyber font-mono">{formatShares(totalShares)}</span> shares
              </p>
              <p className="text-text-muted text-xs mt-1">
                Your weight = <strong className="text-white">ALL shares</strong> (YES + NO). You're voting on which resolution is correct, not which side wins.
              </p>
            </div>

            <div className="text-xs text-text-muted space-y-1">
              <div>Time remaining: <span className="text-cyber font-mono">{formatTimeLeft(votingWindowEnd)}</span></div>
              <div className="text-yes">✓ No bond required - only gas (~$0.01)</div>
              <div className="text-yes">✓ Winning voters share <span className="text-white font-mono">{formatBNB(disputeBond)}</span> BNB (loser's bond)</div>
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
                  'VOTE YES'
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
                  'VOTE NO'
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Finalize Section */}
        {canFinalize && !isResolved && (
          <div className="space-y-3 border-t border-dark-600 pt-4">
            <p className="text-sm text-text-secondary">
              {hasDispute ? 'Voting ended. Finalize to settle the market.' : 'Dispute window ended. Finalize to confirm the outcome.'}
            </p>
            
            {/* Proposer reward info */}
            {estimatedReward > 0n && (
              <div className="text-xs text-text-muted">
                💰 Proposer will receive <span className="text-yes font-mono">{formatBNB(estimatedReward)} BNB</span> reward
              </div>
            )}
            
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
              <p className="text-yes font-bold mb-1">🎉 YOU WON!</p>
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
          </div>
        )}

        {/* Already Claimed */}
        {hasClaimed && (
          <div className="p-3 bg-dark-800 border border-dark-600 text-center">
            <p className="text-yes font-bold">✓ CLAIMED</p>
            <p className="text-text-muted text-xs mt-1">You have already claimed your winnings</p>
          </div>
        )}

        {/* Emergency Refund */}
        {canEmergencyRefund && (
          <div className="space-y-3 border-t border-dark-600 pt-4">
            {/* Explain why refund is available */}
            {isTie ? (
              <div className="p-3 bg-dark-800 border border-yellow-500/50 text-sm">
                <p className="text-yellow-500 font-bold mb-2">⚖️ VOTING TIED - REFUND AVAILABLE</p>
                <p className="text-text-secondary text-xs">
                  The vote ended in an exact 50/50 tie. Since the community couldn't reach consensus, 
                  all traders can claim a proportional refund based on their total shares.
                </p>
              </div>
            ) : resolutionMayHaveFailed ? (
              <div className="p-3 bg-dark-800 border border-no/50 text-sm">
                <p className="text-no font-bold mb-2">🛡️ EMPTY WINNER PROTECTION</p>
                <p className="text-text-secondary text-xs">
                  The proposed winning side ({market.proposedOutcome ? 'YES' : 'NO'}) had no shareholders.
                  Resolution was blocked to protect funds. All traders can claim a proportional refund.
                </p>
              </div>
            ) : (
              <div className="p-3 bg-dark-800 border border-dark-600 text-sm">
                <p className="text-cyber font-bold mb-2">🆘 EMERGENCY REFUND</p>
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
          </div>
        )}

        {/* Already Emergency Refunded */}
        {hasEmergencyRefunded && (
          <div className="p-3 bg-dark-800 border border-dark-600 text-center">
            <p className="text-yes font-bold">✓ REFUNDED</p>
            <p className="text-text-muted text-xs mt-1">You have already claimed your emergency refund</p>
          </div>
        )}

        {/* Waiting for Emergency Refund */}
        {isWaitingForEmergencyRefund && !canPropose && !canDispute && !canVote && !canFinalize && (
          <div className="p-3 bg-dark-800 border border-dark-600 text-center">
            <p className="text-text-secondary text-sm">⏳ Emergency refund available in:</p>
            <p className="text-cyber font-mono text-lg mt-1">{formatTimeLeft(emergencyRefundTime)}</p>
            <p className="text-text-muted text-xs mt-2">
              If the market isn't resolved, you can claim a proportional refund
            </p>
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
