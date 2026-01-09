/**
 * ===== ENTRY MODAL COMPONENT =====
 *
 * First-time visitor modal explaining how JunkieFun works.
 * Includes: 3-step guide, age verification, risk disclaimer.
 * Must be confirmed before using the platform.
 *
 * @module shared/components/legal/EntryModal
 */

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/shared/components/ui/Button';
import { cn } from '@/shared/utils/cn';

const ENTRY_ACCEPTED_KEY = 'junkie_entry_accepted';
const ENTRY_ACCEPTED_VERSION = '1.0'; // Increment to re-show modal after ToS changes

interface Step {
  emoji: string;
  title: string;
  description: string;
}

const STEPS: Step[] = [
  {
    emoji: '🎯',
    title: '1. CREATE A MARKET',
    description: 'Anyone can create a prediction market for FREE. Ask any yes/no question about future events.',
  },
  {
    emoji: '📈',
    title: '2. TRADE ON THE CURVE',
    description: 'Buy YES or NO shares using BNB. Prices move on a bonding curve - early believers profit when others join.',
  },
  {
    emoji: '🗳️',
    title: '3. STREET CONSENSUS',
    description: 'Markets resolve via shareholder voting. No centralized oracle - the crowd decides the truth.',
  },
];

export function EntryModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [termsConfirmed, setTermsConfirmed] = useState(false);

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
    if (ageConfirmed && termsConfirmed) {
      localStorage.setItem(ENTRY_ACCEPTED_KEY, ENTRY_ACCEPTED_VERSION);
      setIsOpen(false);
      document.body.style.overflow = '';
    }
  };

  const canConfirm = ageConfirmed && termsConfirmed;

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
            <img src="/logo.png" alt="JunkieFun" className="h-10 w-10" />
            <div>
              <h1 className="text-2xl font-black text-cyber">JUNKIEFUN</h1>
              <p className="text-xs text-text-secondary font-mono">PREDICTION MARKETS ON BNB CHAIN</p>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="px-6 py-6 border-b border-dark-600">
          <h2 className="text-lg font-bold mb-4 text-white">HOW IT WORKS</h2>
          <div className="space-y-4">
            {STEPS.map((step, index) => (
              <div key={index} className="flex gap-4 items-start">
                <div className="text-3xl">{step.emoji}</div>
                <div>
                  <h3 className="font-bold text-cyber text-sm">{step.title}</h3>
                  <p className="text-text-secondary text-sm">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Fees Section */}
        <div className="px-6 py-4 border-b border-dark-600 bg-dark-800">
          <h3 className="text-sm font-bold text-white mb-2">💰 FEE STRUCTURE</h3>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="flex justify-between">
              <span className="text-text-muted">Platform Fee:</span>
              <span className="font-mono text-white">1%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Creator Fee:</span>
              <span className="font-mono text-white">0.5%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Resolution Fee:</span>
              <span className="font-mono text-white">0.3%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Market Creation:</span>
              <span className="font-mono text-yes">FREE</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Min Bet:</span>
              <span className="font-mono text-white">0.005 BNB</span>
            </div>
          </div>
        </div>

        {/* Risk Warning */}
        <div className="px-6 py-4 border-b border-dark-600 bg-no/5">
          <div className="flex gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <h3 className="text-sm font-bold text-no mb-1">RISK DISCLAIMER</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                JunkieFun is a <strong className="text-white">decentralized protocol</strong>. 
                All markets are user-created. You are interacting directly with smart contracts 
                at your own risk. Past performance does not guarantee future results. 
                Never invest more than you can afford to lose.
              </p>
            </div>
          </div>
        </div>

        {/* Checkboxes */}
        <div className="px-6 py-4 space-y-3">
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
            {canConfirm ? "LET'S GO 🚀" : 'CONFIRM ABOVE TO CONTINUE'}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default EntryModal;
