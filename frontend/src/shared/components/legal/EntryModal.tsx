/**
 * ===== ENTRY MODAL COMPONENT =====
 *
 * First-time visitor modal explaining how JNGLZ.FUN works.
 * Includes: prohibited jurisdictions, 3-step guide, age verification, risk disclaimer.
 * Must be confirmed before using the platform.
 *
 * @module shared/components/legal/EntryModal
 */

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/shared/components/ui/Button';
import { cn } from '@/shared/utils/cn';

const ENTRY_ACCEPTED_KEY = 'junkie_entry_accepted';
const ENTRY_ACCEPTED_VERSION = '3.0'; // v3.0 = Added UGP/Creator Liability disclaimer, fixed JNGLZ.FUN coloring

interface Step {
  number: string;
  title: string;
  description: string;
}

const STEPS: Step[] = [
  {
    number: '1',
    title: 'CREATE A MARKET',
    description: 'Anyone can create a prediction market for FREE. Ask any yes/no question about future events.',
  },
  {
    number: '2',
    title: 'TRADE ON THE CURVE',
    description: 'Buy YES or NO shares using BNB. Prices move on a linear bonding curve - price reflects probability directly.',
  },
  {
    number: '3',
    title: 'STREET CONSENSUS',
    description: 'Markets resolve via shareholder voting. No centralized oracle - the crowd decides the outcome.',
  },
];

export function EntryModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [termsConfirmed, setTermsConfirmed] = useState(false);
  const [jurisdictionConfirmed, setJurisdictionConfirmed] = useState(false);

  // Check if user has already accepted
  useEffect(() => {
    const accepted = localStorage.getItem(ENTRY_ACCEPTED_KEY);
    if (accepted !== ENTRY_ACCEPTED_VERSION) {
      setIsOpen(true);
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleConfirm = () => {
    if (ageConfirmed && termsConfirmed && jurisdictionConfirmed) {
      localStorage.setItem(ENTRY_ACCEPTED_KEY, ENTRY_ACCEPTED_VERSION);
      setIsOpen(false);
      document.body.style.overflow = '';
    }
  };

  const canConfirm = ageConfirmed && termsConfirmed && jurisdictionConfirmed;

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop - NO CLOSE ON CLICK */}
      <div className="absolute inset-0 bg-black/95" />
      
      {/* Modal Content */}
      <div className="relative bg-dark-900 border-2 border-cyber w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="border-b border-cyber px-6 py-4 bg-cyber/10">
          <div className="flex items-center gap-3">
            <img src="/jnglz-logo.png" alt="JNGLZ.FUN" className="h-10 w-10" />
            <div>
              <h1 className="text-2xl font-black">
                <span className="text-white">JNGLZ</span><span className="text-cyber">.FUN</span>
              </h1>
              <p className="text-xs text-text-secondary font-mono">DECENTRALIZED PREDICTION PROTOCOL ON BNB CHAIN</p>
            </div>
          </div>
        </div>

        {/* PROHIBITED JURISDICTIONS - FIRST AND PROMINENT */}
        <div className="px-6 py-4 border-b border-no bg-no/10">
          <h3 className="text-sm font-bold text-no mb-3">PROHIBITED JURISDICTIONS</h3>
          <p className="text-xs text-text-secondary mb-3">
            This Protocol is <strong className="text-no">NOT AVAILABLE</strong> to users from the following jurisdictions:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            <div className="space-y-1">
              <p className="text-white font-bold">United States</p>
              <p className="text-text-muted">Including all U.S. territories</p>
            </div>
            <div className="space-y-1">
              <p className="text-white font-bold">European Economic Area (EEA)</p>
              <p className="text-text-muted">All 27 EU states + Iceland, Liechtenstein, Norway</p>
            </div>
            <div className="space-y-1">
              <p className="text-white font-bold">United Kingdom</p>
            </div>
            <div className="space-y-1">
              <p className="text-white font-bold">Singapore</p>
            </div>
            <div className="space-y-1">
              <p className="text-white font-bold">China</p>
              <p className="text-text-muted">Including Hong Kong and Macau</p>
            </div>
            <div className="space-y-1">
              <p className="text-white font-bold">OFAC Sanctioned Countries</p>
              <p className="text-text-muted">Cuba, Iran, North Korea, Syria, Crimea</p>
            </div>
          </div>
          <p className="text-xs text-no mt-3 font-bold">
            If you are located in any of these jurisdictions, you must exit this site immediately.
          </p>
        </div>

        {/* How It Works */}
        <div className="px-6 py-6 border-b border-dark-600">
          <h2 className="text-lg font-bold mb-4 text-white">HOW IT WORKS</h2>
          <div className="space-y-4">
            {STEPS.map((step, index) => (
              <div key={index} className="flex gap-4 items-start">
                <div className="w-8 h-8 bg-cyber/20 border border-cyber rounded flex items-center justify-center text-cyber font-bold text-lg">
                  {step.number}
                </div>
                <div>
                  <h3 className="font-bold text-cyber text-sm">{step.title}</h3>
                  <p className="text-text-secondary text-sm">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* USER-GENERATED MARKETS DISCLAIMER */}
        <div className="px-6 py-4 border-b border-warning bg-warning/5">
          <div className="flex gap-3">
            <div className="w-8 h-8 bg-warning/20 border border-warning rounded flex items-center justify-center text-warning font-bold text-lg flex-shrink-0">
              ⚠
            </div>
            <div>
              <h3 className="text-sm font-bold text-warning mb-2">USER-GENERATED MARKETS</h3>
              <p className="text-xs text-text-secondary leading-relaxed mb-2">
                <span className="text-white font-bold">ALL MARKETS ARE CREATED BY INDEPENDENT USERS.</span>{' '}
                <span className="text-white">JNGLZ</span><span className="text-cyber">.FUN</span> is a 
                <strong className="text-white"> neutral, permissionless protocol</strong>. We do NOT create, 
                curate, endorse, verify, or control any markets.
              </p>
              <div className="bg-dark-800/50 border border-warning/30 p-2 mt-2">
                <p className="text-xs text-warning font-bold mb-1">MARKET CREATOR RESPONSIBILITY:</p>
                <p className="text-xs text-text-secondary">
                  By creating a market, the creator accepts <strong className="text-white">full legal responsibility</strong> for 
                  the content, legality, and clarity of the prediction question. The Protocol carries 
                  <strong className="text-no"> NO LIABILITY</strong> for markets that violate laws, regulations, 
                  or third-party rights.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Fees Section */}
        <div className="px-6 py-4 border-b border-dark-600 bg-dark-800">
          <h3 className="text-sm font-bold text-white mb-2">FEE STRUCTURE</h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-text-muted">Platform Fee:</span>
              <div className="text-right">
                <span className="font-mono text-white">1%</span>
                <span className="text-text-muted ml-1">→ Treasury</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-text-muted">Creator Fee:</span>
              <div className="text-right">
                <span className="font-mono text-white">0.5%</span>
                <span className="text-text-muted ml-1">→ Market Creator</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-text-muted">Resolution Fee:</span>
              <div className="text-right">
                <span className="font-mono text-white">0.3%</span>
                <span className="text-text-muted ml-1">→ Treasury</span>
              </div>
            </div>
            <div className="border-t border-dark-600 pt-2 mt-2">
              <div className="flex justify-between items-center">
                <span className="text-text-muted">Market Creation:</span>
                <span className="font-mono text-yes">FREE</span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-text-muted">Min Trade:</span>
                <span className="font-mono text-white">0.005 BNB</span>
              </div>
            </div>
          </div>
          <div className="mt-3 p-2 bg-dark-900 border border-dark-500 rounded text-[10px]">
            <p className="text-text-muted mb-1">
              <strong className="text-white">Trading fees (1.5% total)</strong> are deducted on every buy/sell.
            </p>
            <p className="text-text-muted mb-1">
              <strong className="text-white">Resolution fee (0.3%)</strong> is deducted from your payout when claiming winnings → goes to <strong className="text-cyber">Protocol Treasury</strong>.
            </p>
            <p className="text-text-muted">
              <strong className="text-warning">Jury fees</strong> (from disputes) are <strong className="text-white">SEPARATE</strong> → come from the loser's forfeited bond, NOT from the 0.3% resolution fee.
            </p>
          </div>
        </div>

        {/* Market Rules Section */}
        <div className="px-6 py-4 border-b border-dark-600">
          <h3 className="text-sm font-bold text-white mb-3">MARKET RULES</h3>
          <div className="space-y-3 text-xs text-text-secondary">
            
            {/* Bonding Curve */}
            <div>
              <span className="text-cyber font-bold">Linear Bonding Curve:</span>
              <p className="mt-1">We use a <strong className="text-white">Linear Constant Sum AMM</strong> (not exponential like pump.fun). YES + NO price always equals 0.01 BNB. Price reflects market probability directly. Buying pushes price up, selling pushes it down. <strong className="text-no">No arbitrage</strong> - instant buy/sell = guaranteed loss due to price impact + fees.</p>
            </div>

            {/* Resolution Timeline */}
            <div>
              <span className="text-cyber font-bold">Resolution Timeline:</span>
              <ul className="mt-1 ml-4 list-disc space-y-1">
                <li>Market expires → <strong className="text-white">Trading stops</strong></li>
                <li>First <strong className="text-white">10 min</strong>: Only creator can propose the outcome</li>
                <li>After 10 min: <strong className="text-white">Anyone</strong> can propose (if creator didn't)</li>
                <li>After proposal → <strong className="text-white">30 min</strong> dispute window</li>
                <li>If disputed → <strong className="text-white">1 hour</strong> shareholder voting</li>
                <li>If no proposal for 24h → <strong className="text-white">Emergency refund</strong> available</li>
              </ul>
            </div>

            {/* Bond Formula */}
            <div>
              <span className="text-cyber font-bold">Bond Formula:</span>
              <div className="mt-1 bg-dark-800 border border-dark-600 p-2 font-mono">
                <div>Proposer Bond = <strong className="text-white">max(0.005 BNB, 1% of pool)</strong></div>
                <div>Disputer Bond = <strong className="text-white">2x Proposer Bond</strong></div>
              </div>
            </div>

            {/* Bond Rewards - NO DISPUTE */}
            <div>
              <span className="text-yes font-bold">If NOT Disputed (Proposal Accepted):</span>
              <ul className="mt-1 ml-4 list-disc space-y-1">
                <li>Proposer gets <strong className="text-white">bond back</strong> + <strong className="text-yes">0.5% of pool</strong> as reward</li>
              </ul>
            </div>

            {/* Bond Rewards - WITH DISPUTE */}
            <div>
              <span className="text-yellow-500 font-bold">If Disputed (Voting Decides):</span>
              
              {/* Vote Weight Clarification */}
              <div className="mt-2 p-2 bg-cyber/10 border border-cyber/30 rounded text-xs">
                <p className="text-cyber font-bold mb-1">How Voting Works:</p>
                <p className="text-text-secondary">
                  Your vote weight = <strong className="text-white">ALL your shares</strong> (YES + NO combined).
                  You vote for either the Proposer or the Disputer.
                </p>
              </div>
              
              {/* Sub-scenario: Original Proposer Wins */}
              <div className="mt-2 ml-2 border-l-2 border-yes/30 pl-3">
                <span className="text-yes text-xs font-bold">If PROPOSER wins the vote:</span>
                <ul className="mt-1 ml-4 list-disc space-y-0.5 text-xs">
                  <li><strong className="text-white">Proposer</strong>: Bond back + 50% of disputer's bond + <strong className="text-yes">0.5% pool reward</strong></li>
                  <li><strong className="text-white">Disputer</strong>: <strong className="text-no">Loses entire bond</strong></li>
                  <li><strong className="text-white">Voters on winning side</strong>: Share remaining 50% of disputer's bond</li>
                  <li><strong className="text-no">Voters on losing side</strong>: Get ZERO jury fees</li>
                </ul>
              </div>
              
              {/* Sub-scenario: Disputer Wins */}
              <div className="mt-2 ml-2 border-l-2 border-cyber/30 pl-3">
                <span className="text-cyber text-xs font-bold">If DISPUTER wins the vote:</span>
                <ul className="mt-1 ml-4 list-disc space-y-0.5 text-xs">
                  <li><strong className="text-white">Disputer</strong>: Bond back + 50% of proposer's bond (no pool reward)</li>
                  <li><strong className="text-white">Proposer</strong>: <strong className="text-no">Loses entire bond</strong></li>
                  <li><strong className="text-white">Voters on winning side</strong>: Share remaining 50% of proposer's bond</li>
                  <li><strong className="text-no">Voters on losing side</strong>: Get ZERO jury fees</li>
                </ul>
              </div>
            </div>
            
            {/* Winner Payouts - SEPARATE from bonds */}
            <div>
              <span className="text-cyber font-bold">Winner Payouts (After Resolution):</span>
              <p className="mt-1"><strong className="text-white">Winning shareholders</strong> (YES or NO) claim the <strong className="text-yes">entire pool</strong> proportionally. Losing shareholders get <strong className="text-no">nothing</strong>. This is separate from bond/voter rewards above.</p>
            </div>

            {/* Empty Winning Side */}
            <div>
              <span className="text-yellow-500 font-bold">Empty Winning Side Protection:</span>
              <p className="mt-1">If market resolves to an outcome with <strong className="text-white">0 shareholders</strong>: Resolution is blocked, <strong className="text-yes">all bonds returned</strong>, shareholders can claim emergency refund after 24h.</p>
            </div>
          </div>
        </div>

        {/* Risk Warning */}
        <div className="px-6 py-4 border-b border-dark-600 bg-no/5">
          <div className="flex gap-3">
            <div className="w-8 h-8 bg-no/20 border border-no rounded flex items-center justify-center text-no font-bold text-lg flex-shrink-0">
              !
            </div>
            <div>
              <h3 className="text-sm font-bold text-no mb-1">RISK DISCLAIMER</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                <span className="text-white">JNGLZ</span><span className="text-cyber">.FUN</span> is a{' '}
                <strong className="text-white">decentralized, non-custodial protocol</strong>. 
                All markets are <strong className="text-white">user-generated</strong> and{' '}
                <strong className="text-white">user-resolved</strong> via autonomous smart contracts. 
                Protocol contributors DO NOT control market creation, content, or outcomes. 
                You interact directly with immutable smart contracts at your own risk.{' '}
                <strong className="text-no">Never invest more than you can afford to lose.</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Checkboxes */}
        <div className="px-6 py-4 space-y-3">
          {/* Jurisdiction Confirmation - NEW */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={jurisdictionConfirmed}
              onChange={(e) => setJurisdictionConfirmed(e.target.checked)}
              className="mt-1 min-w-5 min-h-5 w-5 h-5 flex-shrink-0 bg-dark-800 border-2 border-dark-600 checked:bg-cyber checked:border-cyber appearance-none cursor-pointer relative after:content-['✓'] after:absolute after:inset-0 after:flex after:items-center after:justify-center after:text-black after:font-bold after:opacity-0 checked:after:opacity-100"
            />
            <span className="text-sm text-text-secondary group-hover:text-white transition-colors">
              I confirm that I am <strong className="text-no">NOT</strong> a resident, citizen, or entity of any 
              <strong className="text-white"> Prohibited Jurisdiction</strong> (USA, EEA, UK, Singapore, China, or OFAC sanctioned countries) 
              and I am not using a VPN to circumvent geographic restrictions.
            </span>
          </label>

          {/* Age Verification */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={ageConfirmed}
              onChange={(e) => setAgeConfirmed(e.target.checked)}
              className="mt-1 min-w-5 min-h-5 w-5 h-5 flex-shrink-0 bg-dark-800 border-2 border-dark-600 checked:bg-cyber checked:border-cyber appearance-none cursor-pointer relative after:content-['✓'] after:absolute after:inset-0 after:flex after:items-center after:justify-center after:text-black after:font-bold after:opacity-0 checked:after:opacity-100"
            />
            <span className="text-sm text-text-secondary group-hover:text-white transition-colors">
              I confirm that I am <strong className="text-white">18 years or older</strong> (or 21+ where required by local law) 
              and that online prediction markets are legal in my jurisdiction.
            </span>
          </label>

          {/* Terms Agreement */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={termsConfirmed}
              onChange={(e) => setTermsConfirmed(e.target.checked)}
              className="mt-1 min-w-5 min-h-5 w-5 h-5 flex-shrink-0 bg-dark-800 border-2 border-dark-600 checked:bg-cyber checked:border-cyber appearance-none cursor-pointer relative after:content-['✓'] after:absolute after:inset-0 after:flex after:items-center after:justify-center after:text-black after:font-bold after:opacity-0 checked:after:opacity-100"
            />
            <span className="text-sm text-text-secondary group-hover:text-white transition-colors">
              I have read and agree to the{' '}
              <a href="/terms" target="_blank" className="text-cyber hover:underline">Terms of Service</a>
              {' '}and{' '}
              <a href="/privacy" target="_blank" className="text-cyber hover:underline">Privacy Policy</a>.
            </span>
          </label>
          
          {/* Game Rules Link */}
          <div className="pt-2 text-center">
            <a href="/how-to-play" target="_blank" className="text-cyber hover:underline text-sm font-bold">
              Read the full Game Rules & Strategies →
            </a>
          </div>

          {/* VPN Warning */}
          <p className="text-xs text-text-muted text-center mt-3 px-2">
            Accessing this protocol from a prohibited jurisdiction via VPN is a breach of our Terms and may result in the loss of access to the interface.
          </p>
        </div>

        {/* Confirm Button */}
        <div className="px-6 py-4 border-t border-dark-600">
          <Button
            variant="cyber"
            size="lg"
            onClick={handleConfirm}
            disabled={!canConfirm}
            className={cn(
              'w-full text-lg',
              !canConfirm && 'opacity-50 cursor-not-allowed'
            )}
          >
            {canConfirm ? "ENTER THE JUNGLE" : 'CONFIRM ALL ABOVE TO CONTINUE'}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default EntryModal;
