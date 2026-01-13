/**
 * ===== ROOT LAYOUT =====
 *
 * Main layout wrapper for all pages.
 * Includes Header, WrongNetworkModal, and page content area.
 *
 * @module router/RootLayout
 */

import { Outlet, Link } from 'react-router-dom';
import { Header } from './Header';
import { WrongNetworkModal, WrongNetworkBanner } from '@/shared/components/WrongNetworkModal';
import { EntryModal, CookieBanner } from '@/shared/components/legal';
import { useChainValidation } from '@/shared/hooks/useChainValidation';

export function RootLayout() {
  const { isWrongNetwork } = useChainValidation();

  return (
    <div className="min-h-screen bg-black text-white flex flex-col overflow-x-hidden">
      {/* Entry Modal (first-time visitors) */}
      <EntryModal />

      {/* Cookie Banner */}
      <CookieBanner />

      {/* Wrong Network Modal (blocks interaction) */}
      <WrongNetworkModal />

      {/* Wrong Network Banner (inline warning) */}
      {isWrongNetwork && <WrongNetworkBanner />}

      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="flex-1 pb-16 md:pb-0">
        <Outlet />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}

/**
 * Simple footer with links
 */
function Footer() {
  return (
    <footer className="hidden md:block border-t border-dark-600 py-6 mt-auto">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <img src="/jnglz-logo.png" alt="JNGLZ.FUN" className="h-6 w-6" />
            <span className="text-sm text-text-secondary">
              © 2026 JNGLZ.FUN - Decentralized Prediction Markets
            </span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6 text-sm font-mono">
            <Link
              to="/how-to-play"
              className="text-text-secondary hover:text-cyber transition-colors"
            >
              HOW TO PLAY
            </Link>
            <a
              href="https://twitter.com/jnglzfun"
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-secondary hover:text-cyber transition-colors"
            >
              TWITTER
            </a>
            <Link
              to="/terms"
              className="text-text-secondary hover:text-cyber transition-colors"
            >
              TERMS
            </Link>
            <Link
              to="/privacy"
              className="text-text-secondary hover:text-cyber transition-colors"
            >
              PRIVACY
            </Link>
          </div>

          {/* Network indicator */}
          <div className="flex items-center gap-2 text-xs font-mono text-text-muted">
            <span className="w-2 h-2 bg-yes animate-pulse" />
            BNB CHAIN
          </div>
        </div>
      </div>
    </footer>
  );
}

export default RootLayout;
