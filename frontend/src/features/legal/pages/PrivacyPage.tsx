/**
 * ===== PRIVACY POLICY PAGE =====
 *
 * Privacy policy for JNGLZ.FUN platform.
 * Emphasizes decentralized nature and on-chain transparency.
 *
 * @module features/legal/pages/PrivacyPage
 */

import { Link } from 'react-router-dom';
import { env } from '@/shared/config/env';
import { useSEO } from '@/shared/hooks/useSEO';

export function PrivacyPage() {
  // SEO: Set page title
  useSEO({
    title: 'Privacy Policy',
    description: 'Privacy Policy for JNGLZ.FUN decentralized prediction market protocol. Learn how we handle your data.',
    path: '/privacy',
  });

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="border-b border-dark-600 pb-6 mb-8">
          <Link to="/" className="text-cyber hover:underline text-sm mb-4 inline-block">
            ← Back to Markets
          </Link>
          <h1 className="text-3xl font-black uppercase">
            PRIVACY <span className="text-cyber">POLICY</span>
          </h1>
          <p className="text-text-muted text-sm mt-2 font-mono">
            Last Updated: January 9, 2026
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-invert max-w-none space-y-8">
          {/* Overview */}
          <section>
            <h2 className="text-xl font-bold text-white border-l-4 border-cyber pl-4 mb-4">
              1. OVERVIEW
            </h2>
            <div className="text-text-secondary space-y-4 pl-4">
              <p>
                JNGLZ.FUN ("Protocol", "we", "us") is a <strong className="text-white">decentralized application</strong> that 
                respects user privacy. This Privacy Policy explains what data we collect, how we use it, 
                and your rights regarding your information.
              </p>
              <div className="bg-cyber/10 border border-cyber p-4 my-4">
                <p className="text-cyber font-bold mb-2">🔒 KEY POINTS</p>
                <ul className="text-sm space-y-1">
                  <li>• We do NOT collect personal information</li>
                  <li>• We do NOT use tracking cookies or analytics</li>
                  <li>• Your wallet address and on-chain activity are PUBLIC</li>
                  <li>• We use essential cookies only for site functionality</li>
                </ul>
              </div>
            </div>
          </section>

          {/* On-Chain Data */}
          <section>
            <h2 className="text-xl font-bold text-white border-l-4 border-warning pl-4 mb-4">
              2. BLOCKCHAIN DATA
            </h2>
            <div className="text-text-secondary space-y-4 pl-4">
              <p>
                <strong className="text-white">IMPORTANT:</strong> JNGLZ.FUN operates on the BNB Chain blockchain. 
                By nature of blockchain technology:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>Your <strong className="text-white">wallet address</strong> is publicly visible</li>
                <li>All <strong className="text-white">transactions</strong> are recorded on the public blockchain</li>
                <li>Your <strong className="text-white">trading history</strong> is permanently and publicly stored</li>
                <li>Market creation, votes, and claims are all <strong className="text-white">on-chain and public</strong></li>
              </ul>
              <p className="text-no mt-4">
                This data CANNOT be deleted or made private. This is inherent to blockchain technology, 
                not a choice made by JNGLZ.FUN.
              </p>
            </div>
          </section>

          {/* What We Collect */}
          <section>
            <h2 className="text-xl font-bold text-white border-l-4 border-cyber pl-4 mb-4">
              3. DATA WE COLLECT
            </h2>
            <div className="text-text-secondary space-y-4 pl-4">
              <h3 className="font-bold text-white">Data We DO Collect:</h3>
              <ul className="list-disc list-inside space-y-2">
                <li><strong className="text-white">Wallet Address:</strong> When you connect your wallet (publicly visible anyway)</li>
                <li><strong className="text-white">Local Storage:</strong> Entry modal acceptance, cookie consent, UI preferences</li>
              </ul>

              <h3 className="font-bold text-white mt-6">Data We DO NOT Collect:</h3>
              <ul className="list-disc list-inside space-y-2">
                <li>❌ Names, emails, or personal identifiers</li>
                <li>❌ IP addresses (we don't log them)</li>
                <li>❌ Browsing behavior or tracking data</li>
                <li>❌ Device fingerprints</li>
                <li>❌ Location data</li>
              </ul>
            </div>
          </section>

          {/* Cookies */}
          <section>
            <h2 className="text-xl font-bold text-white border-l-4 border-cyber pl-4 mb-4">
              4. COOKIES & LOCAL STORAGE
            </h2>
            <div className="text-text-secondary space-y-4 pl-4">
              <p>
                We use <strong className="text-white">essential cookies and local storage only</strong> for:
              </p>
              <div className="bg-dark-800 border border-dark-600 p-4 font-mono text-sm">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>junkie_entry_accepted</span>
                    <span className="text-text-muted">Entry modal state</span>
                  </div>
                  <div className="flex justify-between">
                    <span>junkie_cookie_consent</span>
                    <span className="text-text-muted">Cookie banner state</span>
                  </div>
                  <div className="flex justify-between">
                    <span>wagmi.store</span>
                    <span className="text-text-muted">Wallet connection</span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-text-muted mt-4">
                We do NOT use Google Analytics, Facebook Pixel, or any third-party tracking services.
              </p>
            </div>
          </section>

          {/* Third Parties */}
          <section>
            <h2 className="text-xl font-bold text-white border-l-4 border-cyber pl-4 mb-4">
              5. THIRD-PARTY SERVICES
            </h2>
            <div className="text-text-secondary space-y-4 pl-4">
              <p>
                The following third-party services may process data when you use JNGLZ.FUN:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>
                  <strong className="text-white">WalletConnect / RainbowKit:</strong> Wallet connection infrastructure. 
                  See their <a href="https://walletconnect.com/privacy" className="text-cyber hover:underline">privacy policy</a>.
                </li>
                <li>
                  <strong className="text-white">The Graph:</strong> Blockchain indexing service for market data. 
                  Indexes public blockchain data only.
                </li>
                <li>
                  <strong className="text-white">BNB Chain RPC:</strong> Blockchain node provider for transactions.
                </li>
              </ul>
              <p className="text-xs text-text-muted mt-4">
                These services may have their own privacy policies. We encourage you to review them.
              </p>
            </div>
          </section>

          {/* Data Retention */}
          <section>
            <h2 className="text-xl font-bold text-white border-l-4 border-cyber pl-4 mb-4">
              6. DATA RETENTION
            </h2>
            <div className="text-text-secondary space-y-4 pl-4">
              <ul className="list-disc list-inside space-y-2">
                <li><strong className="text-white">Local Storage:</strong> Stored in your browser until you clear it</li>
                <li><strong className="text-white">Blockchain Data:</strong> Permanent and immutable (cannot be deleted)</li>
              </ul>
              <p className="mt-4">
                To clear locally stored data, simply clear your browser's local storage for this site.
              </p>
            </div>
          </section>

          {/* Your Rights */}
          <section>
            <h2 className="text-xl font-bold text-white border-l-4 border-cyber pl-4 mb-4">
              7. YOUR RIGHTS
            </h2>
            <div className="text-text-secondary space-y-4 pl-4">
              <p>
                Since we don't collect personal data, traditional data rights (access, deletion, portability) 
                are largely not applicable. However:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>You can <strong className="text-white">disconnect your wallet</strong> at any time</li>
                <li>You can <strong className="text-white">clear local storage</strong> to remove preferences</li>
                <li>You <strong className="text-no">CANNOT</strong> delete blockchain data (it's public and permanent)</li>
              </ul>
            </div>
          </section>

          {/* GDPR/CCPA */}
          <section>
            <h2 className="text-xl font-bold text-white border-l-4 border-cyber pl-4 mb-4">
              8. GDPR & CCPA
            </h2>
            <div className="text-text-secondary space-y-4 pl-4">
              <p>
                As a decentralized protocol that does not collect personal information, 
                JNGLZ.FUN is designed with privacy by default.
              </p>
              <p>
                If you believe we hold any personal data about you, contact us and we will 
                respond within 30 days.
              </p>
            </div>
          </section>

          {/* Children */}
          <section>
            <h2 className="text-xl font-bold text-white border-l-4 border-no pl-4 mb-4">
              9. CHILDREN
            </h2>
            <div className="text-text-secondary pl-4">
              <p>
                JNGLZ.FUN is <strong className="text-no">NOT intended for anyone under 18 years old</strong> 
                (or 21 in jurisdictions where required). We do not knowingly interact with minors.
              </p>
            </div>
          </section>

          {/* Changes */}
          <section>
            <h2 className="text-xl font-bold text-white border-l-4 border-cyber pl-4 mb-4">
              10. CHANGES TO THIS POLICY
            </h2>
            <div className="text-text-secondary pl-4">
              <p>
                We may update this Privacy Policy from time to time. Changes will be posted 
                on this page with an updated "Last Updated" date.
              </p>
            </div>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-xl font-bold text-white border-l-4 border-cyber pl-4 mb-4">
              11. CONTACT
            </h2>
            <div className="text-text-secondary pl-4">
              <p>
                For privacy-related questions, contact us via:
              </p>
              <ul className="list-disc list-inside mt-2">
                <li>X: <a href={env.X_URL} className="text-cyber hover:underline" target="_blank" rel="noopener noreferrer">@jnglzdotfun</a></li>
                <li>Telegram: <a href={env.TELEGRAM_URL} className="text-cyber hover:underline" target="_blank" rel="noopener noreferrer">t.me/jnglzdotfun</a></li>
              </ul>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="border-t border-dark-600 mt-12 pt-6 text-center">
          <Link to="/" className="text-cyber hover:underline">
            Return to Markets
          </Link>
        </div>
      </div>
    </div>
  );
}

export default PrivacyPage;
