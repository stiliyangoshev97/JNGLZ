/**
 * ===== TERMS OF SERVICE PAGE =====
 *
 * Legal terms for using JNGLZ.FUN platform.
 * Clean, professional, readable.
 * Only legal/protective content - game rules moved to HowToPlayPage.
 *
 * @module features/legal/pages/TermsPage
 */

import { Link } from 'react-router-dom';

export function TermsPage() {
  return (
    <div className="min-h-screen py-12">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="border-b border-dark-600 pb-6 mb-8">
          <Link to="/" className="text-cyber hover:underline text-sm mb-4 inline-block">
            ← Back to Markets
          </Link>
          <h1 className="text-3xl font-black uppercase">
            TERMS OF <span className="text-cyber">SERVICE</span>
          </h1>
          <p className="text-text-muted text-sm mt-2 font-mono">
            Last Updated: January 16, 2026
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-invert max-w-none space-y-8">
          
          {/* Introduction */}
          <section>
            <h2 className="text-xl font-bold text-white border-l-4 border-cyber pl-4 mb-4">
              1. INTRODUCTION
            </h2>
            <div className="text-text-secondary space-y-4 pl-4">
              <p>
                Welcome to JNGLZ.FUN ("Platform", "Protocol", "we", "us", or "our"). 
                By accessing or using our decentralized prediction market protocol, 
                you agree to be bound by these Terms of Service ("Terms").
              </p>
              <p>
                JNGLZ.FUN is a <strong className="text-white">decentralized, non-custodial protocol</strong> deployed 
                on the BNB Chain blockchain. We do not control, manage, or have custody over 
                any user funds. All interactions occur directly with smart contracts.
              </p>
              <p className="text-sm">
                For game mechanics, strategies, and how to play, see our{' '}
                <Link to="/how-to-play" className="text-cyber hover:underline">How to Play Guide</Link>.
              </p>
            </div>
          </section>

          {/* Eligibility */}
          <section>
            <h2 className="text-xl font-bold text-white border-l-4 border-cyber pl-4 mb-4">
              2. ELIGIBILITY
            </h2>
            <div className="text-text-secondary space-y-4 pl-4">
              <p>By using JNGLZ.FUN, you represent and warrant that:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>You are at least 18 years old (or 21 in jurisdictions where required)</li>
                <li>You have full legal capacity to enter into these Terms</li>
                <li>You are not located in a Prohibited Jurisdiction (see Section 4)</li>
                <li>You are using the Protocol in compliance with all applicable laws</li>
              </ul>
            </div>
          </section>

          {/* Protocol Description */}
          <section>
            <h2 className="text-xl font-bold text-white border-l-4 border-cyber pl-4 mb-4">
              3. PROTOCOL DESCRIPTION
            </h2>
            <div className="text-text-secondary space-y-4 pl-4">
              <p>JNGLZ.FUN enables users to:</p>
              <ul className="list-disc list-inside space-y-2">
                <li><strong className="text-white">Create Markets:</strong> Ask any yes/no prediction question (FREE)</li>
                <li><strong className="text-white">Trade Shares:</strong> Buy/sell YES or NO shares using BNB via bonding curve</li>
                <li><strong className="text-white">Resolve Markets:</strong> Markets are resolved via "Street Consensus" - shareholder voting</li>
                <li><strong className="text-white">Claim Winnings:</strong> Winners receive proportional payouts from the pool</li>
              </ul>
              <p className="mt-4">
                All market outcomes are determined by the <strong className="text-white">Street Consensus</strong> mechanism - 
                a decentralized oracle where shareholders vote on outcomes. The protocol owners 
                <strong className="text-no"> DO NOT</strong> intervene in or guarantee any market outcome.
              </p>
            </div>
          </section>

          {/* Prohibited Jurisdictions */}
          <section>
            <h2 className="text-xl font-bold text-white border-l-4 border-no pl-4 mb-4">
              4. PROHIBITED JURISDICTIONS
            </h2>
            <div className="text-text-secondary space-y-4 pl-4">
              <p>
                <strong className="text-no">YOU ARE SOLELY RESPONSIBLE</strong> for determining whether 
                accessing or using JNGLZ.FUN is legal in your jurisdiction.
              </p>
              <p>
                Users from the following jurisdictions are <strong className="text-no">PROHIBITED</strong> from 
                using this Protocol:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>United States of America and its territories</li>
                <li>United Kingdom</li>
                <li>Singapore</li>
                <li>China (PRC)</li>
                <li>Cuba, Iran, North Korea, Syria</li>
                <li>Any jurisdiction where prediction markets or gambling is prohibited</li>
              </ul>
              <p className="text-xs text-text-muted mt-4">
                This list is not exhaustive. Users must verify their local regulations.
              </p>
            </div>
          </section>

          {/* Information Protocol Disclaimer */}
          <section>
            <h2 className="text-xl font-bold text-white border-l-4 border-warning pl-4 mb-4">
              5. INFORMATION & PREDICTION PROTOCOL
            </h2>
            <div className="text-text-secondary space-y-4 pl-4">
              <p>
                JNGLZ.FUN is an <strong className="text-white">information and prediction protocol</strong>. 
                Users trade on the probability of future events based on publicly available information.
              </p>
              <div className="bg-warning/10 border border-warning p-4 my-4">
                <p className="text-warning font-bold mb-2">⚠️ GAMBLING DISCLAIMER</p>
                <p className="text-sm">
                  In some jurisdictions, prediction markets may be classified as gambling. 
                  If online gambling or prediction markets are illegal in your location, 
                  <strong className="text-white"> DO NOT USE THIS PROTOCOL</strong>.
                </p>
              </div>
            </div>
          </section>

          {/* No Guarantee */}
          <section>
            <h2 className="text-xl font-bold text-white border-l-4 border-cyber pl-4 mb-4">
              6. NO GUARANTEE OF OUTCOME
            </h2>
            <div className="text-text-secondary space-y-4 pl-4">
              <p>
                Market outcomes are determined <strong className="text-white">solely by the Street Consensus mechanism</strong> - 
                a voting system where shareholders decide the outcome.
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>Protocol operators <strong className="text-no">DO NOT</strong> control or intervene in market resolution</li>
                <li>Protocol operators <strong className="text-no">DO NOT</strong> guarantee the accuracy of any outcome</li>
                <li>Protocol operators <strong className="text-no">DO NOT</strong> verify the truthfulness of market questions</li>
                <li>All markets are user-created and user-resolved</li>
              </ul>
            </div>
          </section>

          {/* Risks */}
          <section>
            <h2 className="text-xl font-bold text-white border-l-4 border-no pl-4 mb-4">
              7. RISK ACKNOWLEDGMENT
            </h2>
            <div className="text-text-secondary space-y-4 pl-4">
              <p>By using JNGLZ.FUN, you acknowledge and accept:</p>
              <ul className="list-disc list-inside space-y-2">
                <li><strong className="text-white">Smart Contract Risk:</strong> Bugs or exploits could result in loss of funds</li>
                <li><strong className="text-white">Market Risk:</strong> You may lose your entire investment</li>
                <li><strong className="text-white">Oracle Risk:</strong> Street Consensus may produce incorrect outcomes</li>
                <li><strong className="text-white">Volatility Risk:</strong> Prices can move rapidly on the bonding curve</li>
                <li><strong className="text-white">Regulatory Risk:</strong> Laws may change, affecting legality</li>
                <li><strong className="text-white">Network Risk:</strong> BNB Chain congestion or issues may affect transactions</li>
              </ul>
              <p className="mt-4 text-no font-bold">
                NEVER INVEST MORE THAN YOU CAN AFFORD TO LOSE.
              </p>
            </div>
          </section>

          {/* Prohibited Activities */}
          <section>
            <h2 className="text-xl font-bold text-white border-l-4 border-cyber pl-4 mb-4">
              8. PROHIBITED ACTIVITIES
            </h2>
            <div className="text-text-secondary space-y-4 pl-4">
              <p>You agree NOT to:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>Use the Protocol for money laundering or illegal activities</li>
                <li>Create markets about illegal events (assassinations, attacks, etc.)</li>
                <li>Attempt to manipulate market outcomes through false information</li>
                <li>Use bots or automated systems to gain unfair advantage</li>
                <li>Exploit bugs or vulnerabilities (responsible disclosure encouraged)</li>
                <li>Circumvent geographic restrictions</li>
              </ul>
            </div>
          </section>

          {/* Limitation of Liability */}
          <section>
            <h2 className="text-xl font-bold text-white border-l-4 border-cyber pl-4 mb-4">
              9. LIMITATION OF LIABILITY
            </h2>
            <div className="text-text-secondary space-y-4 pl-4">
              <p>
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, JNGLZ.FUN AND ITS CONTRIBUTORS 
                SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, 
                OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, DATA, OR FUNDS.
              </p>
              <p>
                THE PROTOCOL IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND.
              </p>
            </div>
          </section>

          {/* Technical Truth - AMM Math */}
          <section>
            <h2 className="text-xl font-bold text-white border-l-4 border-cyber pl-4 mb-4">
              10. TECHNICAL SPECIFICATION
            </h2>
            <div className="text-text-secondary space-y-4 pl-4">
              <p>
                The Protocol operates on a <strong className="text-white">Constant Sum Market Maker</strong> formula:
              </p>
              <div className="bg-dark-800 border border-dark-600 p-4 font-mono text-xs space-y-3 mb-3">
                <div>
                  <span className="text-text-muted">Price Calculation:</span>
                  <div className="text-cyber mt-1">
                    P(YES) = 0.01 × virtualYes / (virtualYes + virtualNo)
                  </div>
                  <div className="text-no mt-1">
                    P(NO) = 0.01 × virtualNo / (virtualYes + virtualNo)
                  </div>
                  <div className="text-text-muted mt-1">
                    P(YES) + P(NO) = 0.01 BNB (always)
                  </div>
                </div>
                <div>
                  <span className="text-text-muted">Buy Shares:</span>
                  <div className="text-white mt-1">
                    shares = (bnbAmount × totalVirtual × 10¹⁸) / (UNIT_PRICE × virtualSide)
                  </div>
                </div>
                <div>
                  <span className="text-text-muted">Sell Shares (uses POST-SELL state):</span>
                  <div className="text-white mt-1">
                    bnbOut = (shares × UNIT_PRICE × virtualSideAfter) / (totalVirtualAfter × 10¹⁸)
                  </div>
                </div>
              </div>
              <p className="text-xs text-text-muted">
                Selling uses post-sale virtual balances, creating natural slippage that prevents risk-free arbitrage.
              </p>
              
              {/* Pool Solvency */}
              <div className="mt-4">
                <h3 className="text-white font-bold mb-2">🔐 Guaranteed Pool Solvency</h3>
                <p className="mb-3">
                  The pool can <strong className="text-white">ALWAYS</strong> pay all winning shareholders because:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm mb-3">
                  <li>Every BNB deposited creates shares; every share burned returns BNB</li>
                  <li>Sells use post-sale state, ensuring pool retains adequate reserves</li>
                  <li>NO external liquidity providers — the pool IS the liquidity</li>
                  <li>Mathematical impossibility to withdraw more than deposited (minus fees)</li>
                </ul>
                <div className="bg-dark-800 border border-dark-600 p-3 font-mono text-xs">
                  <span className="text-text-muted">Invariant:</span>
                  <span className="text-white ml-2">poolBalance ≥ sum(all possible payouts)</span>
                </div>
              </div>
            </div>
          </section>

          {/* Changes to Terms */}
          <section>
            <h2 className="text-xl font-bold text-white border-l-4 border-cyber pl-4 mb-4">
              11. CHANGES TO TERMS
            </h2>
            <div className="text-text-secondary space-y-4 pl-4">
              <p>
                We may update these Terms at any time. Continued use of the Protocol after 
                changes constitutes acceptance of the new Terms. Material changes will be 
                announced via our official channels.
              </p>
            </div>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-xl font-bold text-white border-l-4 border-cyber pl-4 mb-4">
              12. CONTACT
            </h2>
            <div className="text-text-secondary pl-4">
              <p>
                For questions about these Terms, contact us via:
              </p>
              <ul className="list-disc list-inside mt-2">
                <li>Twitter: <a href="https://twitter.com/jnglzfun" className="text-cyber hover:underline">@jnglzfun</a></li>
                <li>GitHub: <a href="https://github.com/jnglzfun" className="text-cyber hover:underline">github.com/jnglzfun</a></li>
              </ul>
            </div>
          </section>

        </div>

        {/* Footer */}
        <div className="border-t border-dark-600 mt-12 pt-6 text-center space-y-4">
          <Link to="/how-to-play" className="text-cyber hover:underline block">
            📖 How to Play Guide
          </Link>
          <Link to="/" className="text-text-secondary hover:text-white">
            Return to Markets
          </Link>
        </div>
      </div>
    </div>
  );
}

export default TermsPage;
