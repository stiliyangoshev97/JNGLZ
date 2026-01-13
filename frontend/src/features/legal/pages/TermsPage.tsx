/**
 * ===== TERMS OF SERVICE PAGE =====
 *
 * Legal terms for using JNGLZ.FUN protocol.
 * Clean, professional, readable.
 * Only legal/protective content - game rules moved to HowToPlayPage.
 *
 * @module features/legal/pages/TermsPage
 */

import { Link } from 'react-router-dom';
import { env } from '@/shared/config/env';

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
            Last Updated: January 14, 2026
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
                Welcome to JNGLZ.FUN ("Protocol", "Platform", "we", "us", or "our"). 
                By accessing or using our decentralized prediction market protocol, 
                you agree to be bound by these Terms of Service ("Terms").
              </p>
              <p>
                JNGLZ.FUN is a <strong className="text-white">decentralized, non-custodial, permissionless protocol</strong> deployed 
                on the BNB Chain blockchain. The Protocol consists of immutable smart contracts that operate autonomously.
                We do not control, manage, or have custody over any user funds. All interactions occur directly 
                between users and the smart contracts.
              </p>
              <p>
                The Protocol is provided as open-source software. The frontend interface at jnglz.fun is merely 
                one way to interact with the underlying smart contracts, which can be accessed directly or 
                through any compatible interface.
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
                <li>You are NOT located in a Prohibited Jurisdiction (see Section 4)</li>
                <li>You are NOT a resident, citizen, or entity organized in any Prohibited Jurisdiction</li>
                <li>You are using the Protocol in compliance with all applicable laws in your jurisdiction</li>
                <li>You are not using a VPN or other means to circumvent geographic restrictions</li>
              </ul>
            </div>
          </section>

          {/* Protocol Description */}
          <section>
            <h2 className="text-xl font-bold text-white border-l-4 border-cyber pl-4 mb-4">
              3. PROTOCOL DESCRIPTION
            </h2>
            <div className="text-text-secondary space-y-4 pl-4">
              <p>
                JNGLZ.FUN is an autonomous, decentralized protocol that enables peer-to-peer prediction markets.
                The Protocol operates through immutable smart contracts deployed on BNB Chain.
              </p>
              <p>Users can:</p>
              <ul className="list-disc list-inside space-y-2">
                <li><strong className="text-white">Create Markets:</strong> Deploy prediction markets for any yes/no question (FREE, no gas cost for market creation)</li>
                <li><strong className="text-white">Trade Shares:</strong> Buy and sell YES or NO outcome shares using BNB via an automated bonding curve</li>
                <li><strong className="text-white">Resolve Markets:</strong> Participate in the decentralized "Street Consensus" resolution mechanism</li>
                <li><strong className="text-white">Claim Winnings:</strong> Withdraw proportional payouts from resolved markets</li>
              </ul>
              <p className="mt-4">
                All market outcomes are determined <strong className="text-white">exclusively</strong> by the Street Consensus mechanism—a 
                decentralized oracle where shareholders vote on outcomes. The Protocol operates autonomously; 
                Protocol contributors <strong className="text-no">DO NOT</strong> and <strong className="text-no">CANNOT</strong> intervene 
                in or control any market outcome.
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
                accessing or using JNGLZ.FUN is legal in your jurisdiction. The Protocol does not verify 
                user location or identity.
              </p>
              <p>
                Users from the following jurisdictions are <strong className="text-no">STRICTLY PROHIBITED</strong> from 
                using this Protocol:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li><strong className="text-white">United States of America</strong> and all U.S. territories (Puerto Rico, Guam, U.S. Virgin Islands, etc.)</li>
                <li><strong className="text-white">European Economic Area (EEA)</strong> — all 27 EU member states plus Iceland, Liechtenstein, and Norway</li>
                <li><strong className="text-white">United Kingdom</strong></li>
                <li><strong className="text-white">Singapore</strong></li>
                <li><strong className="text-white">China</strong> (People's Republic of China, including Hong Kong and Macau)</li>
                <li><strong className="text-white">OFAC Sanctioned Countries:</strong> Cuba, Iran, North Korea, Syria, Crimea region, Donetsk, Luhansk</li>
                <li>Any jurisdiction where prediction markets, gambling, or crypto-assets are prohibited or restricted</li>
              </ul>
              <p className="text-xs text-text-muted mt-4">
                This list is not exhaustive. Users must independently verify their local regulations. 
                Using VPNs or other tools to circumvent geographic restrictions is a violation of these Terms.
              </p>
            </div>
          </section>

          {/* MiCA Compliance - NEW SECTION */}
          <section>
            <h2 className="text-xl font-bold text-white border-l-4 border-no pl-4 mb-4">
              5. EUROPEAN UNION & MiCA REGULATION
            </h2>
            <div className="text-text-secondary space-y-4 pl-4">
              <div className="bg-no/10 border border-no p-4 my-4">
                <p className="text-no font-bold mb-2">EEA USERS ARE PROHIBITED</p>
                <p className="text-sm">
                  JNGLZ.FUN is <strong className="text-white">NOT AVAILABLE</strong> to residents, citizens, or entities 
                  located in or organized under the laws of any European Economic Area (EEA) member state.
                </p>
              </div>
              <p>
                The Markets in Crypto-Assets Regulation (MiCA) establishes a comprehensive regulatory framework 
                for crypto-assets within the European Union. Under MiCA:
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm">
                <li>Crypto-asset service providers must be authorized by competent authorities</li>
                <li>Specific requirements apply to the issuance and trading of crypto-assets</li>
                <li>Consumer protection and market integrity rules must be followed</li>
              </ul>
              <p className="mt-4">
                JNGLZ.FUN is a <strong className="text-white">decentralized, permissionless protocol</strong> that operates 
                without a central operator, issuer, or service provider. The Protocol:
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm">
                <li>Does NOT issue or offer crypto-assets to the public</li>
                <li>Does NOT provide custody or exchange services</li>
                <li>Does NOT operate as a crypto-asset service provider (CASP)</li>
                <li>Operates autonomously through immutable smart contracts</li>
              </ul>
              <p className="mt-4 text-sm">
                Notwithstanding the decentralized nature of the Protocol, to avoid any potential regulatory 
                uncertainty, <strong className="text-no">access to the Protocol is prohibited for all EEA residents</strong>.
                This includes but is not limited to residents of: Austria, Belgium, Bulgaria, Croatia, Cyprus, 
                Czech Republic, Denmark, Estonia, Finland, France, Germany, Greece, Hungary, Ireland, Italy, 
                Latvia, Lithuania, Luxembourg, Malta, Netherlands, Poland, Portugal, Romania, Slovakia, Slovenia, 
                Spain, Sweden, Iceland, Liechtenstein, and Norway.
              </p>
            </div>
          </section>

          {/* Information Protocol Disclaimer */}
          <section>
            <h2 className="text-xl font-bold text-white border-l-4 border-warning pl-4 mb-4">
              6. INFORMATION & PREDICTION PROTOCOL
            </h2>
            <div className="text-text-secondary space-y-4 pl-4">
              <p>
                JNGLZ.FUN is an <strong className="text-white">information and prediction protocol</strong>. 
                Users trade on the probability of future events based on publicly available information.
                The Protocol facilitates peer-to-peer markets where prices reflect collective market sentiment.
              </p>
              <div className="bg-warning/10 border border-warning p-4 my-4">
                <p className="text-warning font-bold mb-2">GAMBLING DISCLAIMER</p>
                <p className="text-sm">
                  In some jurisdictions, prediction markets may be classified as gambling, betting, 
                  or wagering. If online gambling, prediction markets, or similar activities are 
                  illegal, restricted, or require licensing in your location, 
                  <strong className="text-white"> DO NOT USE THIS PROTOCOL</strong>.
                </p>
              </div>
              <p>
                The Protocol does not provide investment advice, financial services, or gambling services.
                Users interact directly with autonomous smart contracts at their own discretion and risk.
              </p>
            </div>
          </section>

          {/* No Guarantee */}
          <section>
            <h2 className="text-xl font-bold text-white border-l-4 border-cyber pl-4 mb-4">
              7. NO GUARANTEE OF OUTCOME
            </h2>
            <div className="text-text-secondary space-y-4 pl-4">
              <p>
                Market outcomes are determined <strong className="text-white">solely by the Street Consensus mechanism</strong>—a 
                decentralized voting system where shareholders decide the outcome by staking bonds and voting.
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>Protocol contributors <strong className="text-no">DO NOT</strong> and <strong className="text-no">CANNOT</strong> control or intervene in market resolution</li>
                <li>Protocol contributors <strong className="text-no">DO NOT</strong> guarantee the accuracy of any outcome</li>
                <li>Protocol contributors <strong className="text-no">DO NOT</strong> verify the truthfulness of market questions</li>
                <li>Protocol contributors <strong className="text-no">DO NOT</strong> have the ability to pause, modify, or reverse any market</li>
                <li>All markets are user-created and user-resolved through autonomous smart contract logic</li>
              </ul>
            </div>
          </section>

          {/* Risks */}
          <section>
            <h2 className="text-xl font-bold text-white border-l-4 border-no pl-4 mb-4">
              8. RISK ACKNOWLEDGMENT
            </h2>
            <div className="text-text-secondary space-y-4 pl-4">
              <p>By using JNGLZ.FUN, you acknowledge and accept the following risks:</p>
              <ul className="list-disc list-inside space-y-2">
                <li><strong className="text-white">Smart Contract Risk:</strong> Despite audits, bugs or exploits in the smart contracts could result in partial or total loss of funds</li>
                <li><strong className="text-white">Market Risk:</strong> You may lose your entire position; prediction markets are highly speculative</li>
                <li><strong className="text-white">Oracle Risk:</strong> Street Consensus voting may produce outcomes that differ from real-world events</li>
                <li><strong className="text-white">Volatility Risk:</strong> Share prices can move rapidly on the bonding curve; large trades cause significant price impact</li>
                <li><strong className="text-white">Liquidity Risk:</strong> Selling large positions may result in substantial slippage</li>
                <li><strong className="text-white">Regulatory Risk:</strong> Laws may change, potentially affecting the legality or availability of the Protocol</li>
                <li><strong className="text-white">Network Risk:</strong> BNB Chain congestion, forks, or outages may affect transaction execution</li>
                <li><strong className="text-white">Key Management Risk:</strong> Loss of private keys results in permanent loss of funds</li>
              </ul>
              <p className="mt-4 text-no font-bold">
                NEVER INVEST MORE THAN YOU CAN AFFORD TO LOSE. THIS IS NOT FINANCIAL ADVICE.
              </p>
            </div>
          </section>

          {/* Prohibited Activities */}
          <section>
            <h2 className="text-xl font-bold text-white border-l-4 border-cyber pl-4 mb-4">
              9. PROHIBITED ACTIVITIES
            </h2>
            <div className="text-text-secondary space-y-4 pl-4">
              <p>You agree NOT to:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>Use the Protocol for money laundering, terrorist financing, or other illegal activities</li>
                <li>Create markets about illegal events (assassinations, attacks, harm to individuals, etc.)</li>
                <li>Attempt to manipulate market outcomes through coordinated campaigns or false information</li>
                <li>Exploit bugs, vulnerabilities, or unintended behavior in the smart contracts (responsible disclosure encouraged)</li>
                <li>Use VPNs or other tools to circumvent geographic restrictions</li>
                <li>Access the Protocol from a Prohibited Jurisdiction</li>
                <li>Violate any applicable laws in your jurisdiction</li>
              </ul>
            </div>
          </section>

          {/* Limitation of Liability */}
          <section>
            <h2 className="text-xl font-bold text-white border-l-4 border-cyber pl-4 mb-4">
              10. LIMITATION OF LIABILITY
            </h2>
            <div className="text-text-secondary space-y-4 pl-4">
              <p>
                TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, JNGLZ.FUN, ITS CONTRIBUTORS, 
                DEVELOPERS, AND AFFILIATES SHALL NOT BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, 
                SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF 
                PROFITS, DATA, FUNDS, OR GOODWILL, ARISING FROM YOUR USE OF THE PROTOCOL.
              </p>
              <p>
                THE PROTOCOL IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, 
                EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, 
                FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
              </p>
              <p>
                You acknowledge that you are using the Protocol at your own risk and that you are 
                solely responsible for any losses incurred.
              </p>
            </div>
          </section>

          {/* Technical Specification */}
          <section>
            <h2 className="text-xl font-bold text-white border-l-4 border-cyber pl-4 mb-4">
              11. TECHNICAL SPECIFICATION
            </h2>
            <div className="text-text-secondary space-y-4 pl-4">
              <p>
                The Protocol operates on a <strong className="text-white">Constant Sum Market Maker (CSMM)</strong> formula 
                implemented in immutable smart contracts:
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
                    P(YES) + P(NO) = 0.01 BNB (invariant)
                  </div>
                </div>
                <div>
                  <span className="text-text-muted">Buy Shares:</span>
                  <div className="text-white mt-1">
                    shares = (bnbAmount × totalVirtual × 10^18) / (UNIT_PRICE × virtualSide)
                  </div>
                </div>
                <div>
                  <span className="text-text-muted">Sell Shares (uses post-sell state):</span>
                  <div className="text-white mt-1">
                    bnbOut = (shares × UNIT_PRICE × virtualSideAfter) / (totalVirtualAfter × 10^18)
                  </div>
                </div>
              </div>
              <p className="text-xs text-text-muted">
                Selling uses post-sale virtual balances, creating natural slippage that prevents risk-free arbitrage.
              </p>
              
              {/* Pool Solvency */}
              <div className="mt-4">
                <h3 className="text-white font-bold mb-2">Guaranteed Pool Solvency</h3>
                <p className="mb-3">
                  The pool can <strong className="text-white">ALWAYS</strong> pay all winning shareholders because:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm mb-3">
                  <li>Every BNB deposited creates shares; every share burned returns BNB</li>
                  <li>Sells use post-sale state, ensuring the pool retains adequate reserves</li>
                  <li>No external liquidity providers—the pool IS the liquidity</li>
                  <li>Mathematical impossibility to withdraw more than deposited (minus fees)</li>
                </ul>
                <div className="bg-dark-800 border border-dark-600 p-3 font-mono text-xs">
                  <span className="text-text-muted">Invariant:</span>
                  <span className="text-white ml-2">poolBalance ≥ sum(all possible payouts)</span>
                </div>
              </div>
            </div>
          </section>

          {/* Fees */}
          <section>
            <h2 className="text-xl font-bold text-white border-l-4 border-cyber pl-4 mb-4">
              12. PROTOCOL FEES
            </h2>
            <div className="text-text-secondary space-y-4 pl-4">
              <p>
                The Protocol charges the following fees, which are enforced by the smart contracts:
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm">
                <li><strong className="text-white">Platform Fee:</strong> 1.0% on all trades (buy and sell)</li>
                <li><strong className="text-white">Creator Fee:</strong> 0.5% on all trades, paid to market creator</li>
                <li><strong className="text-white">Resolution Fee:</strong> 0.3% on winning claims at market resolution</li>
                <li><strong className="text-white">Market Creation:</strong> FREE (no cost to create markets)</li>
              </ul>
              <p className="text-xs text-text-muted mt-4">
                Fees are non-refundable and automatically deducted by the smart contracts. 
                Fee parameters are immutable and cannot be changed after deployment.
              </p>
            </div>
          </section>

          {/* Changes to Terms */}
          <section>
            <h2 className="text-xl font-bold text-white border-l-4 border-cyber pl-4 mb-4">
              13. CHANGES TO TERMS
            </h2>
            <div className="text-text-secondary space-y-4 pl-4">
              <p>
                We may update these Terms at any time. Continued use of the Protocol after 
                changes constitutes acceptance of the new Terms. Material changes will be 
                announced via our official channels.
              </p>
              <p>
                Note that these Terms govern your use of the frontend interface. The underlying 
                smart contracts are immutable and operate independently of these Terms.
              </p>
            </div>
          </section>

          {/* Governing Law */}
          <section>
            <h2 className="text-xl font-bold text-white border-l-4 border-cyber pl-4 mb-4">
              14. GOVERNING LAW & DISPUTES
            </h2>
            <div className="text-text-secondary space-y-4 pl-4">
              <p>
                These Terms shall be governed by and construed in accordance with the laws 
                of the British Virgin Islands, without regard to its conflict of law principles.
              </p>
              <p>
                Any dispute arising out of or relating to these Terms shall be resolved through 
                binding arbitration in accordance with the rules of the British Virgin Islands 
                International Arbitration Centre.
              </p>
              <p>
                You waive any right to participate in a class action lawsuit or class-wide arbitration.
              </p>
            </div>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-xl font-bold text-white border-l-4 border-cyber pl-4 mb-4">
              15. CONTACT
            </h2>
            <div className="text-text-secondary pl-4">
              <p>
                For questions about these Terms, contact us via:
              </p>
              <ul className="list-disc list-inside mt-2">
                <li>X: <a href={env.X_URL} className="text-cyber hover:underline" target="_blank" rel="noopener noreferrer">@jnglzdotfun</a></li>
                <li>Telegram: <a href={env.TELEGRAM_URL} className="text-cyber hover:underline" target="_blank" rel="noopener noreferrer">t.me/jnglzdotfun</a></li>
              </ul>
            </div>
          </section>

        </div>

        {/* Footer */}
        <div className="border-t border-dark-600 mt-12 pt-6 text-center space-y-4">
          <Link to="/how-to-play" className="text-cyber hover:underline block">
            How to Play Guide
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
