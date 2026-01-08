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

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
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
} from '@/shared/hooks';
import { formatBNB, formatShares } from '@/shared/utils/format';
import { cn } from '@/shared/utils/cn';
import type { Market } from '@/shared/schemas';

interface ResolutionPanelProps {
  market: Market;
}

// Time constants (from contract)
const CREATOR_PRIORITY_WINDOW = 10 * 60 * 1000; // 10 minutes
const DISPUTE_WINDOW = 30 * 60 * 1000; // 30 minutes
const VOTING_WINDOW = 60 * 60 * 1000; // 1 hour
const EMERGENCY_REFUND_DELAY = 24 * 60 * 60 * 1000; // 24 hours

export function ResolutionPanel({ market }: ResolutionPanelProps) {
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
  
  // Form states
  const [proofLink, setProofLink] = useState('');
  const [proposedOutcome, setProposedOutcome] = useState<boolean>(true);

  // Contract write hooks
  const { proposeOutcome, isPending: isProposing, isConfirming: isConfirmingPropose } = useProposeOutcome();
  const { dispute, isPending: isDisputing, isConfirming: isConfirmingDispute } = useDispute();
  const { vote, isPending: isVoting, isConfirming: isConfirmingVote } = useVote();
  const { finalizeMarket, isPending: isFinalizing, isConfirming: isConfirmingFinalize } = useFinalizeMarket();
  const { claim, isPending: isClaiming, isConfirming: isConfirmingClaim } = useClaim();
  const { emergencyRefund, isPending: isRefunding, isConfirming: isConfirmingRefund } = useEmergencyRefund();

  // Calculate timestamps
  const expiryMs = Number(market.expiryTimestamp) * 1000;
  const proposalMs = market.proposalTimestamp ? Number(market.proposalTimestamp) * 1000 : 0;
  const disputeMs = market.disputeTimestamp ? Number(market.disputeTimestamp) * 1000 : 0;
  const now = Date.now();
  
  // Status checks
  const isExpired = now > expiryMs;
  const isResolved = market.resolved;
  const hasProposal = market.proposer && market.proposer !== '0x0000000000000000000000000000000000000000';
  const hasDispute = market.disputer && market.disputer !== '0x0000000000000000000000000000000000000000';
  
  // Time windows
  const inCreatorPriority = isExpired && now < expiryMs + CREATOR_PRIORITY_WINDOW;
  const isCreator = address?.toLowerCase() === market.creatorAddress?.toLowerCase();
  const canPropose = isExpired && !hasProposal && (inCreatorPriority ? isCreator : true);
  
  const disputeWindowEnd = proposalMs + DISPUTE_WINDOW;
  const canDispute = hasProposal && !hasDispute && now < disputeWindowEnd;
  
  const votingWindowEnd = disputeMs + VOTING_WINDOW;
  const canVote = hasDispute && now < votingWindowEnd && totalShares > 0n && !hasVoted;
  
  const canFinalize = hasProposal && !isResolved && (
    (hasDispute && now > votingWindowEnd) || 
    (!hasDispute && now > disputeWindowEnd)
  );
  
  const canClaim = isResolved && totalShares > 0n && !hasClaimed;
  const canEmergencyRefund = isExpired && !hasProposal && now > expiryMs + EMERGENCY_REFUND_DELAY && totalShares > 0n;

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
      proofLink: proofLink || '',
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
    const mins = Math.floor(diff / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
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
        ) : hasDispute ? (
          <Badge variant="neutral">DISPUTED</Badge>
        ) : hasProposal ? (
          <Badge variant="neutral">PROPOSED</Badge>
        ) : (
          <Badge variant="neutral">AWAITING</Badge>
        )}
      </div>

      <div className="p-4 space-y-4">
        {/* Status Display */}
        {hasProposal && !isResolved && (
          <div className="p-3 bg-dark-800 border border-dark-600 text-sm">
            <div className="flex justify-between mb-2">
              <span className="text-text-muted">Proposed Outcome:</span>
              <span className={market.proposedOutcome ? 'text-yes font-bold' : 'text-no font-bold'}>
                {market.proposedOutcome ? 'YES' : 'NO'}
              </span>
            </div>
            {market.proposalProofLink && (
              <div className="text-xs">
                <span className="text-text-muted">Proof: </span>
                <a href={market.proposalProofLink} target="_blank" rel="noopener noreferrer" className="text-cyber hover:underline break-all">
                  {market.proposalProofLink}
                </a>
              </div>
            )}
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

            <Input
              value={proofLink}
              onChange={(e) => setProofLink(e.target.value)}
              placeholder="https://... (optional)"
              label="Proof URL"
              helperText="Link showing evidence of the outcome. Leave empty if evidence link is sufficient."
            />

            <div className="text-xs text-text-muted">
              Required bond: <span className="text-cyber font-mono">{formatBNB(bondAmount)} BNB</span>
              <span className="text-text-muted"> (includes 0.3% fee)</span>
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
            <p className="text-sm text-text-secondary">
              Disagree with the proposal? Dispute it to trigger shareholder voting.
            </p>
            
            <div className="text-xs text-text-muted">
              Time remaining: <span className="text-cyber font-mono">{formatTimeLeft(disputeWindowEnd)}</span>
            </div>

            <div className="text-xs text-text-muted">
              Required bond: <span className="text-no font-mono">{formatBNB(disputeBond)} BNB</span>
              <span className="text-text-muted"> (2× proposer bond + 0.3% fee)</span>
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

        {/* Vote Section */}
        {canVote && !isResolved && (
          <div className="space-y-3 border-t border-dark-600 pt-4">
            <div className="p-3 bg-cyber/10 border border-cyber text-sm">
              <p className="text-cyber font-bold mb-1">🗳️ YOUR VOTE MATTERS!</p>
              <p className="text-text-secondary text-xs">
                Vote weight: <span className="text-cyber font-mono">{formatShares(totalShares)}</span> shares
              </p>
            </div>

            <div className="text-xs text-text-muted space-y-1">
              <div>Time remaining: <span className="text-cyber font-mono">{formatTimeLeft(votingWindowEnd)}</span></div>
              <div className="text-yes">💰 No bond required! Only pay gas (~$0.01). Correct voters share jury fees.</div>
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
                You have {formatShares(market.outcome ? userYesShares : userNoShares)} winning shares
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
            <p className="text-sm text-text-secondary">
              No one proposed an outcome within 24h. You can claim a refund.
            </p>
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
                'EMERGENCY REFUND'
              )}
            </Button>
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
              <p className="text-text-muted text-xs mt-1">
                You had {market.outcome ? formatShares(userNoShares) : formatShares(userYesShares)} losing shares
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ResolutionPanel;
