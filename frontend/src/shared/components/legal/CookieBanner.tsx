/**
 * ===== COOKIE BANNER COMPONENT =====
 *
 * Simple cookie/privacy notice fixed to bottom right.
 * Essential cookies only - no tracking.
 *
 * @module shared/components/legal/CookieBanner
 */

import { useState, useEffect } from 'react';
import { Button } from '@/shared/components/ui/Button';

const COOKIE_CONSENT_KEY = 'junkie_cookie_consent';

export function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already consented
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      // Small delay before showing
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm animate-slide-up">
      <div className="bg-dark-800 border border-dark-600 p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <span className="text-xl">🍪</span>
          <div className="flex-1">
            <h4 className="font-bold text-sm text-white mb-1">Cookies & Privacy</h4>
            <p className="text-xs text-text-secondary mb-3">
              We use <strong className="text-white">essential cookies only</strong> for site functionality. 
              No tracking. Your wallet address and on-chain actions are public by nature of the blockchain.
            </p>
            <div className="flex gap-2">
              <Button
                variant="cyber"
                size="sm"
                onClick={handleAccept}
              >
                GOT IT
              </Button>
              <a
                href="/privacy"
                className="text-xs text-text-muted hover:text-cyber transition-colors px-2 py-1"
              >
                Learn more
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CookieBanner;
