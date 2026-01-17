/**
 * Maintenance Page
 *
 * Displayed when the site is under maintenance.
 * Completely blocks the site with a full-screen modal.
 *
 * To enable maintenance mode:
 * 1. Set VITE_MAINTENANCE_MODE=true in .env.local
 * 2. Optionally set VITE_MAINTENANCE_MESSAGE for custom message
 * 3. Optionally set VITE_MAINTENANCE_END_TIME for expected end time
 *
 * @module features/maintenance/pages/MaintenancePage
 */

import { env } from '@/shared/config/env';

export function MaintenancePage() {
  const customMessage = env.MAINTENANCE_MESSAGE;
  const endTime = env.MAINTENANCE_END_TIME;

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="max-w-lg text-center">
        {/* Logo */}
        <div className="mb-8">
          <img
            src="/logo.svg"
            alt="JNGLZ.FUN"
            className="h-32 w-32 mx-auto object-contain"
          />
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-white mb-4 font-mono">
          WE'LL BE RIGHT BACK
        </h1>

        {/* Description */}
        <p className="text-text-secondary text-lg mb-6">
          {customMessage ||
            "JNGLZ.FUN is currently undergoing scheduled maintenance. We're working hard to improve your experience."}
        </p>

        {/* End Time */}
        {endTime && (
          <div className="bg-dark-800 rounded-lg p-4 mb-8 border border-dark-600">
            <p className="text-text-secondary text-sm mb-1">
              Expected to be back by
            </p>
            <p className="text-cyber font-semibold text-lg font-mono">{endTime}</p>
          </div>
        )}

        {/* Social Links */}
        <div className="flex items-center justify-center gap-6">
          <a
            href={env.X_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-text-secondary hover:text-cyber transition-colors flex items-center gap-2 font-mono"
          >
            {/* X (Twitter) Icon */}
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            X
          </a>
          <a
            href={env.TELEGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-text-secondary hover:text-cyber transition-colors flex items-center gap-2 font-mono"
          >
            {/* Telegram Icon */}
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
            </svg>
            TELEGRAM
          </a>
        </div>

        {/* Footer Note */}
        <p className="text-text-secondary/50 text-xs mt-8 font-mono">
          Thank you for your patience. The jungle will be back soon!
        </p>
      </div>
    </div>
  );
}
