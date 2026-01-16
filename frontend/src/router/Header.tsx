/**
 * ===== HEADER COMPONENT =====
 *
 * Main navigation header with logo, nav links, and wallet connect.
 * Brutalist design with harsh borders and neon accents.
 *
 * @module router/Header
 */

import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { cn } from '@/shared/utils/cn';
import { useChainValidation } from '@/shared/hooks/useChainValidation';
import { env } from '@/shared/config/env';

const navLinks = [
  { to: '/', label: 'MARKETS' },
  { to: '/portfolio', label: 'PORTFOLIO' },
  { to: '/create', label: 'CREATE' },
  { to: '/leaderboard', label: 'LEADERS' },
];

export function Header() {
  const { isConnected } = useAccount();
  const { isWrongNetwork } = useChainValidation();

  return (
    <header className="sticky top-0 z-40 bg-black border-b border-dark-600">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center group">
            <span className="text-xl font-bold text-white tracking-tight">
              JNGLZ<span className="text-cyber">.FUN</span>
            </span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  cn(
                    'px-4 py-2 text-sm font-semibold uppercase tracking-wider transition-colors',
                    'border border-transparent',
                    isActive
                      ? 'text-cyber border-cyber bg-cyber/10'
                      : 'text-text-secondary hover:text-white hover:border-dark-500'
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          {/* Right side: Wallet + Status */}
          <div className="flex items-center gap-3">
            {/* Network warning indicator */}
            {isConnected && isWrongNetwork && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-no/20 border border-no text-no text-xs font-mono">
                <span className="animate-pulse">●</span>
                WRONG NETWORK
              </div>
            )}

            {/* RainbowKit Connect Button */}
            <ConnectButton.Custom>
              {({
                account,
                chain,
                openAccountModal,
                openChainModal,
                openConnectModal,
                mounted,
              }) => {
                const ready = mounted;
                const connected = ready && account && chain;

                return (
                  <div
                    {...(!ready && {
                      'aria-hidden': true,
                      style: {
                        opacity: 0,
                        pointerEvents: 'none',
                        userSelect: 'none',
                      },
                    })}
                  >
                    {(() => {
                      if (!connected) {
                        return (
                          <button
                            onClick={openConnectModal}
                            className="px-4 py-2 bg-cyber text-black font-bold text-sm uppercase tracking-wider border border-cyber hover:bg-cyber/80 transition-colors"
                          >
                            CONNECT
                          </button>
                        );
                      }

                      return (
                        <div className="flex items-center gap-2">
                          {/* Chain button - visible on all screen sizes */}
                          <button
                            onClick={openChainModal}
                            className={cn(
                              'flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 border text-xs sm:text-sm font-mono transition-colors',
                              chain.unsupported
                                ? 'border-no text-no bg-no/10'
                                : 'border-dark-600 text-text-secondary hover:border-dark-500'
                            )}
                          >
                            {chain.hasIcon && chain.iconUrl && (
                              <img
                                src={chain.iconUrl}
                                alt={chain.name ?? 'Chain'}
                                className="w-4 h-4"
                              />
                            )}
                            <span className="hidden sm:inline">
                              {chain.unsupported ? 'WRONG' : chain.name}
                            </span>
                            {/* Mobile: show abbreviated or icon only if wrong */}
                            <span className="sm:hidden">
                              {chain.unsupported ? '!' : ''}
                            </span>
                          </button>

                          {/* Account button */}
                          <button
                            onClick={openAccountModal}
                            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 border border-dark-600 text-xs sm:text-sm font-mono hover:border-cyber transition-colors"
                          >
                            <span className="text-white">
                              {account.displayName}
                            </span>
                            {account.displayBalance && !account.displayBalance.includes('NaN') && (
                              <span className="text-text-secondary hidden sm:inline">
                                {account.displayBalance}
                              </span>
                            )}
                          </button>
                        </div>
                      );
                    })()}
                  </div>
                );
              }}
            </ConnectButton.Custom>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <MobileNav />
    </header>
  );
}

/**
 * Mobile bottom navigation with expandable MORE menu
 */
function MobileNav() {
  const [showMore, setShowMore] = useState(false);

  return (
    <>
      {/* More Menu Overlay */}
      {showMore && (
        <div 
          className="md:hidden fixed inset-0 z-30 bg-black/80"
          onClick={() => setShowMore(false)}
        />
      )}
      
      {/* More Menu Panel */}
      {showMore && (
        <div className="md:hidden fixed bottom-14 left-0 right-0 z-40 bg-dark-900 border-t border-dark-600 animate-in slide-in-from-bottom duration-200">
          <div className="p-4 grid grid-cols-3 gap-3">
            <Link
              to="/how-to-play"
              onClick={() => setShowMore(false)}
              className="flex flex-col items-center justify-center p-3 bg-dark-800 border border-dark-600 hover:border-cyber transition-colors"
            >
              <span className="text-xs font-mono text-text-secondary">HOW TO PLAY</span>
            </Link>
            <a
              href={env.X_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setShowMore(false)}
              className="flex flex-col items-center justify-center p-3 bg-dark-800 border border-dark-600 hover:border-cyber transition-colors"
            >
              <span className="text-xs font-mono text-text-secondary">TWITTER</span>
            </a>
            <a
              href={env.TELEGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setShowMore(false)}
              className="flex flex-col items-center justify-center p-3 bg-dark-800 border border-dark-600 hover:border-cyber transition-colors"
            >
              <span className="text-xs font-mono text-text-secondary">TELEGRAM</span>
            </a>
            <Link
              to="/terms"
              onClick={() => setShowMore(false)}
              className="flex flex-col items-center justify-center p-3 bg-dark-800 border border-dark-600 hover:border-cyber transition-colors"
            >
              <span className="text-xs font-mono text-text-secondary">TERMS</span>
            </Link>
            <Link
              to="/privacy"
              onClick={() => setShowMore(false)}
              className="flex flex-col items-center justify-center p-3 bg-dark-800 border border-dark-600 hover:border-cyber transition-colors"
            >
              <span className="text-xs font-mono text-text-secondary">PRIVACY</span>
            </Link>
            <div className="flex flex-col items-center justify-center gap-1 p-3 bg-dark-800 border border-dark-600">
              <span className="w-2 h-2 bg-yes animate-pulse rounded-full" />
              <span className="text-xs font-mono text-text-muted">BNB CHAIN</span>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-black border-t border-dark-600">
        <div className="flex items-center h-14">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                cn(
                  'flex-1 flex flex-col items-center justify-center h-full',
                  'text-xs font-bold uppercase tracking-wide transition-colors',
                  isActive ? 'text-cyber' : 'text-text-secondary'
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
          {/* MORE button */}
          <button
            onClick={() => setShowMore(!showMore)}
            className={cn(
              'flex-1 flex flex-col items-center justify-center h-full',
              'text-xs font-bold uppercase tracking-wide transition-colors',
              showMore ? 'text-cyber' : 'text-text-secondary'
            )}
          >
            {showMore ? '✕' : 'MORE'}
          </button>
        </div>
      </nav>
    </>
  );
}

export default Header;
