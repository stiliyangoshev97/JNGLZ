/**
 * ===== TERMS OF SERVICE PAGE =====
 *
 * Legal terms for using JNGLZ.FUN platform.
 * Clean, professional, readable.
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
            Last Updated: January 9, 2026
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
                <li>You are not located in a Prohibited Jurisdiction (see Section 5)</li>
                <li>You are using the Protocol in compliance with all applicable laws</li>
              </ul>
            </div>
          </section>

          {/* How It Works */}
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

          {/* Fees */}
          <section>
            <h2 className="text-xl font-bold text-white border-l-4 border-cyber pl-4 mb-4">
              4. FEE STRUCTURE
            </h2>
            <div className="text-text-secondary pl-4">
              <p className="mb-4">The following fees apply to all transactions:</p>
              <div className="bg-dark-800 border border-dark-600 p-4 font-mono text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <span>Platform Fee (Trading):</span>
                  <span className="text-cyber">1.0%</span>
                  <span>Creator Fee (Trading):</span>
                  <span className="text-cyber">0.5%</span>
                  <span>Resolution Fee:</span>
                  <span className="text-cyber">0.3%</span>
                  <span>Market Creation:</span>
                  <span className="text-yes">FREE</span>
                  <span>Minimum Trade:</span>
                  <span className="text-white">0.005 BNB</span>
                </div>
              </div>
              <p className="mt-4 text-xs text-text-muted">
                Fees are non-refundable and are automatically deducted by the smart contract.
              </p>
            </div>
          </section>

          {/* Market Rules */}
          <section>
            <h2 className="text-xl font-bold text-white border-l-4 border-cyber pl-4 mb-4">
              5. MARKET RULES
            </h2>
            <div className="text-text-secondary space-y-6 pl-4">
              {/* Bonding Curve */}
              <div>
                <h3 className="text-white font-bold mb-2">💹 Bonding Curve Pricing</h3>
                <p className="mb-2">All trades execute on an automated bonding curve:</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>YES + NO price always equals <strong className="text-white">0.01 BNB</strong></li>
                  <li>Buying pushes price UP; Selling pushes price DOWN</li>
                  <li>Initial price: YES = 0.005 BNB (50%), NO = 0.005 BNB (50%)</li>
                  <li><strong className="text-no">No arbitrage possible</strong>: Instant buy→sell = guaranteed loss due to price impact + fees</li>
                </ul>
              </div>

              {/* Heat Levels */}
              <div>
                <h3 className="text-white font-bold mb-2">Heat Levels</h3>
                <p className="mb-2">Markets have different volatility settings:</p>
                <div className="bg-dark-800 border border-dark-600 p-3 font-mono text-xs">
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-no">DEGEN FLASH</span>
                    <span>~25% per 0.1 BNB</span>
                    <span className="text-text-muted">Meme markets</span>
                    <span className="text-yellow-500">STREET FIGHT</span>
                    <span>~7% per 0.1 BNB</span>
                    <span className="text-text-muted">Standard markets</span>
                    <span className="text-cyber">WHALE POND</span>
                    <span>~3% per 0.1 BNB</span>
                    <span className="text-text-muted">Whale markets</span>
                  </div>
                </div>
              </div>

              {/* Resolution Timeline */}
              <div>
                <h3 className="text-white font-bold mb-2">⏱️ Resolution Timeline</h3>
                <div className="bg-dark-800 border border-dark-600 p-3 font-mono text-xs space-y-2">
                  <div className="flex justify-between">
                    <span>Market Expires</span>
                    <span className="text-white">Trading stops</span>
                  </div>
                  <div className="flex justify-between">
                    <span>First 10 minutes</span>
                    <span className="text-cyber">Only creator can propose</span>
                  </div>
                  <div className="flex justify-between">
                    <span>After 10 minutes</span>
                    <span className="text-white">Anyone can propose (if creator didn't)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>After proposal</span>
                    <span className="text-cyber">30 min dispute window</span>
                  </div>
                  <div className="flex justify-between">
                    <span>If disputed</span>
                    <span className="text-cyber">1 hour shareholder voting</span>
                  </div>
                  <div className="flex justify-between">
                    <span>If no proposal for 24h</span>
                    <span className="text-no">Emergency refund available</span>
                  </div>
                </div>
              </div>

              {/* Bond Amounts */}
              <div>
                <h3 className="text-white font-bold mb-2">💎 Bond Requirements</h3>
                <div className="bg-dark-800 border border-dark-600 p-3 font-mono text-sm mb-3">
                  <div className="space-y-1">
                    <div>Proposer Bond = <strong className="text-cyber">max(0.005 BNB, 1% of pool)</strong></div>
                    <div>Disputer Bond = <strong className="text-cyber">2× Proposer Bond</strong></div>
                  </div>
                </div>
                <p className="text-sm text-text-muted mb-3">
                  Example: If pool has 2 BNB → Proposer needs 0.02 BNB, Disputer needs 0.04 BNB
                </p>
                
                <h4 className="text-white font-bold mb-2 text-sm">✓ If NOT Disputed (Proposal Accepted):</h4>
                <ul className="list-disc list-inside space-y-1 text-sm mb-3">
                  <li>Proposer gets <strong className="text-white">bond back</strong> + <strong className="text-yes">0.5% of pool</strong> as reward</li>
                </ul>
                
                <h4 className="text-white font-bold mb-2 text-sm">⚔️ If Disputed (Voting Decides):</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li><strong className="text-white">Winner</strong> (Proposer or Disputer): Bond back + <strong className="text-yes">50% of loser's bond</strong></li>
                  <li><strong className="text-white">Loser</strong>: <strong className="text-no">Loses entire bond</strong></li>
                  <li><strong className="text-white">Correct Voters</strong>: Share <strong className="text-yes">50% of loser's bond</strong> (proportional to votes)</li>
                  <li>If Proposer wins: Also gets <strong className="text-yes">0.5% of pool</strong> reward</li>
                </ul>
              </div>

              {/* Voting */}
              <div>
                <h3 className="text-white font-bold mb-2">🗳️ Shareholder Voting</h3>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Vote weight = total shares held (YES + NO combined)</li>
                  <li>Majority wins; outcome is finalized</li>
                  <li>Correct voters share 50% of losing bonder's bond</li>
                  <li><strong className="text-white">Exact 50/50 tie:</strong> Both bonds returned, emergency refund available</li>
                </ul>
              </div>

              {/* Emergency Refund */}
              <div>
                <h3 className="text-white font-bold mb-2">🆘 Emergency Refund</h3>
                <p className="text-sm">
                  If a market cannot be resolved (no proposal for 24h or exact tie), 
                  all traders can claim a proportional refund based on their total shares.
                </p>
              </div>

              {/* Empty Winning Side */}
              <div>
                <h3 className="text-white font-bold mb-2">⚠️ Empty Winning Side (Edge Case)</h3>
                <p className="text-sm mb-2">
                  If a market resolves to an outcome with <strong className="text-white">zero shareholders</strong> (e.g., resolves YES but nobody holds YES shares):
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li><strong className="text-white">Resolution is blocked</strong> - market stays unresolved</li>
                  <li><strong className="text-yes">Proposer gets bond back</strong> (no penalty)</li>
                  <li><strong className="text-yes">Disputer gets bond back</strong> (if disputed, no penalty)</li>
                  <li><strong className="text-cyber">Shareholders keep their funds</strong> - can claim emergency refund after 24h</li>
                  <li className="text-text-muted">This prevents funds from being locked forever in edge cases</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Prohibited Jurisdictions */}
          <section>
            <h2 className="text-xl font-bold text-white border-l-4 border-no pl-4 mb-4">
              6. PROHIBITED JURISDICTIONS
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
              7. INFORMATION & PREDICTION PROTOCOL
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
              8. NO GUARANTEE OF OUTCOME
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
              9. RISK ACKNOWLEDGMENT
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
              10. PROHIBITED ACTIVITIES
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
              11. LIMITATION OF LIABILITY
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

          {/* Changes to Terms */}
          <section>
            <h2 className="text-xl font-bold text-white border-l-4 border-cyber pl-4 mb-4">
              12. CHANGES TO TERMS
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
              13. CONTACT
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
        <div className="border-t border-dark-600 mt-12 pt-6 text-center">
          <Link to="/" className="text-cyber hover:underline">
            Return to Markets
          </Link>
        </div>
      </div>
    </div>
  );
}

export default TermsPage;
