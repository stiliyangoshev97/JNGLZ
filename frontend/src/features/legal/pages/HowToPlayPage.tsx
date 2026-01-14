/**
 * ===== HOW TO PLAY PAGE =====
 *
 * Game rules, strategies, and mechanics for JNGLZ.FUN.
 * The fun "manual" - separated from boring legal Terms.
 *
 * @module features/legal/pages/HowToPlayPage
 */

import { Link } from 'react-router-dom';

export function HowToPlayPage() {
  return (
    <div className="min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="border-b border-dark-600 pb-6 mb-8">
          <Link to="/" className="text-cyber hover:underline text-sm mb-4 inline-block">
            ← Back to Markets
          </Link>
          <h1 className="text-3xl font-black uppercase">
            HOW TO <span className="text-cyber">PLAY</span>
          </h1>
          <p className="text-text-muted text-sm mt-2">
            Master the Jungle. Dominate the Markets.
          </p>
        </div>

        {/* Content */}
        <div className="space-y-12">
          
          {/* ===== THE GOAL OF JNGLZ ===== */}
          <section>
            <h2 className="text-2xl font-black text-white border-l-4 border-cyber pl-4 mb-6">
              THE GOAL OF JNGLZ
            </h2>
            <div className="bg-dark-800 border border-cyber/30 p-6">
              <p className="text-text-secondary text-lg leading-relaxed mb-4">
                <strong className="text-cyber">JNGLZ</strong> is a high-velocity <strong className="text-white">Information Exchange</strong>. 
                Our goal is to provide a decentralized venue where <strong className="text-white">sentiment and truth</strong> are 
                traded against each other using instant AMM liquidity.
              </p>
              <p className="text-text-secondary leading-relaxed mb-4">
                In the Jungle, the price of an outcome is a reflection of the <strong className="text-white">collective conviction</strong> of 
                the market. Your objective is to <strong className="text-cyber">capitalize on market mispricing</strong>.
              </p>
              <p className="text-text-secondary leading-relaxed">
                Whether you are sniping a <strong className="text-yes">700% flip</strong> in <span className="text-no">CRACK</span> or 
                building a massive position in <span className="text-purple-400">DEEP SPACE</span>, the mission is the same: 
                <strong className="text-cyber"> Be right about the truth before the market finds its equilibrium.</strong>
              </p>
            </div>
          </section>

          {/* ===== HEAT LEVELS ===== */}
          <section>
            <h2 className="text-2xl font-black text-white border-l-4 border-cyber pl-4 mb-6">
              THE JNGLZ HEAT LEVELS
            </h2>
            <p className="text-text-secondary mb-6">
              Each jungle uses a specific <strong className="text-white">Virtual Liquidity (vLiq)</strong> setting. 
              This determines the "weight" of the market and how much capital is required to move the price. 
              <strong className="text-cyber"> Higher vLiq = More Stability.</strong>
            </p>
            
            {/* Heat Level Table */}
            <div className="overflow-x-auto mb-6">
              <table className="w-full text-sm border border-dark-600">
                <thead>
                  <tr className="bg-dark-800">
                    <th className="text-left p-3 border-b border-dark-600 text-text-muted">LEVEL</th>
                    <th className="text-left p-3 border-b border-dark-600 text-text-muted">NAME</th>
                    <th className="text-left p-3 border-b border-dark-600 text-text-muted">vLiq</th>
                    <th className="text-left p-3 border-b border-dark-600 text-text-muted">TARGET USER</th>
                    <th className="text-left p-3 border-b border-dark-600 text-text-muted">TRADE RANGE</th>
                    <th className="text-left p-3 border-b border-dark-600 text-text-muted">THE "VIBE"</th>
                  </tr>
                </thead>
                <tbody className="font-mono">
                  <tr className="border-b border-dark-700">
                    <td className="p-3 text-no">CRACK</td>
                    <td className="p-3 text-no">DEGEN FLASH</td>
                    <td className="p-3 text-white">50</td>
                    <td className="p-3 text-text-secondary">Moon-Bagger</td>
                    <td className="p-3 text-text-secondary">0.005 – 0.1 BNB</td>
                    <td className="p-3 text-text-muted text-xs">Total Chaos. Small trades move the needle. High volatility playground.</td>
                  </tr>
                  <tr className="border-b border-dark-700">
                    <td className="p-3 text-yellow-500">HIGH</td>
                    <td className="p-3 text-yellow-500">STREET FIGHT</td>
                    <td className="p-3 text-white">200</td>
                    <td className="p-3 text-text-secondary">The Trader</td>
                    <td className="p-3 text-text-secondary">0.1 – 1.0 BNB</td>
                    <td className="p-3 text-text-muted text-xs">The Standard. Strategic tug-of-war. Perfect for active day-trading.</td>
                  </tr>
                  <tr className="border-b border-dark-700">
                    <td className="p-3 text-cyber">PRO</td>
                    <td className="p-3 text-cyber">WHALE POND</td>
                    <td className="p-3 text-white">500</td>
                    <td className="p-3 text-text-secondary">The Shark</td>
                    <td className="p-3 text-text-secondary">1.0 – 5.0 BNB</td>
                    <td className="p-3 text-text-muted text-xs">Serious Stakes. Balanced slippage for high-conviction players.</td>
                  </tr>
                  <tr className="border-b border-dark-700">
                    <td className="p-3 text-blue-400">APEX</td>
                    <td className="p-3 text-blue-400">INSTITUTION</td>
                    <td className="p-3 text-white">2000</td>
                    <td className="p-3 text-text-secondary">The Whale</td>
                    <td className="p-3 text-text-secondary">5.0 – 20.0 BNB</td>
                    <td className="p-3 text-text-muted text-xs">The Professional. Deep liquidity. Price moves are slow and measured.</td>
                  </tr>
                  <tr>
                    <td className="p-3 text-purple-400">CORE</td>
                    <td className="p-3 text-purple-400">DEEP SPACE</td>
                    <td className="p-3 text-white">10000</td>
                    <td className="p-3 text-text-secondary">The Titan</td>
                    <td className="p-3 text-text-secondary">20.0 – 100+ BNB</td>
                    <td className="p-3 text-text-muted text-xs">Infinite Depth. Built for massive capital. The final source of truth.</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Slippage Reference */}
            <div className="bg-dark-800 border border-dark-600 p-4">
              <h4 className="text-white font-bold mb-3">SLIPPAGE & IMPACT REFERENCE</h4>
              <p className="text-text-secondary text-sm mb-2">
                How much a <strong className="text-white">1.0 BNB trade (~$600)</strong> shifts the market price at each level:
              </p>
              <p className="text-yellow-500 text-xs mb-3 font-bold">
                These values assume a fresh market starting at 50/50. If others have already traded, 
                the actual impact will differ based on the current price position.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 font-mono text-sm">
                <div className="flex justify-between p-2 bg-dark-900">
                  <span className="text-no">CRACK (50)</span>
                  <span className="text-white">~25.0%</span>
                </div>
                <div className="flex justify-between p-2 bg-dark-900">
                  <span className="text-yellow-500">HIGH (200)</span>
                  <span className="text-white">~7.0%</span>
                </div>
                <div className="flex justify-between p-2 bg-dark-900">
                  <span className="text-cyber">PRO (500)</span>
                  <span className="text-white">~3.0%</span>
                </div>
                <div className="flex justify-between p-2 bg-dark-900">
                  <span className="text-blue-400">APEX (2000)</span>
                  <span className="text-white">~0.75%</span>
                </div>
                <div className="flex justify-between p-2 bg-dark-900">
                  <span className="text-purple-400">CORE (10000)</span>
                  <span className="text-white">~0.15%</span>
                </div>
              </div>
            </div>
          </section>

          {/* ===== STRATEGIES ===== */}
          <section>
            <h2 className="text-2xl font-black text-white border-l-4 border-cyber pl-4 mb-6">
              THE JUNGLE STRATEGIES
            </h2>
            <p className="text-text-secondary mb-6">
              <strong className="text-cyber">JNGLZ.FUN</strong> is more than a prediction market—it's a tactical battlefield 
              where <strong className="text-white">truth and greed collide</strong>. Whether you are a high-speed trader or a 
              seeker of truth, there is a path for you to dominate.
            </p>

            <div className="space-y-6">
              {/* THE HUNTER */}
              <div className="bg-dark-800 border border-yellow-500/30 p-5">
                <h3 className="text-xl font-black text-yellow-500 mb-2">THE HUNTER <span className="text-sm font-normal text-text-muted">(Sentiment Arbitrage)</span></h3>
                <p className="text-text-secondary mb-3">
                  <strong className="text-white">The Goal:</strong> Find mispriced truth.
                </p>
                <div className="space-y-2 text-sm">
                  <p className="text-text-secondary">
                    <strong className="text-cyber">The Play:</strong> Look for a market where the "Chance" doesn't match reality. 
                    If everyone is "Apeing" into <span className="text-yes">YES</span> (90%) but you know the truth is a coin flip, 
                    snatch the <span className="text-no">NO</span> shares while they are cheap.
                  </p>
                  <p className="text-text-secondary">
                    <strong className="text-yes">The Win:</strong> As the market realizes its mistake, the price corrects. 
                    Sell your shares to the late-comers for a <strong className="text-white">massive multiplier</strong> before the market even expires.
                  </p>
                </div>
              </div>

              {/* THE SQUEEZE */}
              <div className="bg-dark-800 border border-purple-500/30 p-5">
                <h3 className="text-xl font-black text-purple-400 mb-2">THE SQUEEZE <span className="text-sm font-normal text-text-muted">(Volatility Ninja)</span></h3>
                <p className="text-text-secondary mb-3">
                  <strong className="text-white">The Goal:</strong> Tax the Whales.
                </p>
                <div className="space-y-2 text-sm">
                  <p className="text-text-secondary">
                    <strong className="text-cyber">The Play:</strong> In <span className="text-no">DEGEN FLASH</span> pools, 
                    big trades create massive "Price Impact." When a Whale pumps one side to an extreme, 
                    they make the opposite side mathematically the best deal in the jungle.
                  </p>
                  <p className="text-text-secondary">
                    <strong className="text-yes">The Win:</strong> Buy the "undervalued" side immediately. Even if the outcome is uncertain, 
                    the <strong className="text-white">"Rubber Band" effect</strong> of the bonding curve will snap back as counter-traders 
                    arrive to buy the discount. Profit from the swing and exit early.
                  </p>
                </div>
              </div>

              {/* THE DEFENDER */}
              <div className="bg-dark-800 border border-cyber/30 p-5">
                <h3 className="text-xl font-black text-cyber mb-2">THE DEFENDER <span className="text-sm font-normal text-text-muted">(The Moon Bagger)</span></h3>
                <p className="text-text-secondary mb-3">
                  <strong className="text-white">The Goal:</strong> Hold for the Final Payout.
                </p>
                <div className="space-y-2 text-sm">
                  <p className="text-text-secondary">
                    <strong className="text-cyber">The Play:</strong> You have total conviction. You don't care about the daily price swings 
                    or the "Whales" splashing in the pool. You buy your position and hold until the market is resolved.
                  </p>
                  <p className="text-text-secondary">
                    <strong className="text-yes">The Win:</strong> When the market resolves, you claim your proportional share of the 
                    <strong className="text-yes"> entire BNB pool</strong>. Winners take all.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ===== RESOLUTION ROLES ===== */}
          <section>
            <h2 className="text-2xl font-black text-white border-l-4 border-cyber pl-4 mb-6">
              RESOLUTION ROLES
            </h2>
            <p className="text-text-secondary mb-6">
              After a market expires, <strong className="text-white">resolution</strong> determines which side wins the pool. 
              These roles let you earn rewards for participating in the resolution process.
            </p>

            <div className="space-y-6">
              {/* THE PROPOSER */}
              <div className="bg-dark-800 border border-yes/30 p-5">
                <h3 className="text-xl font-black text-yes mb-2">THE PROPOSER</h3>
                <p className="text-text-secondary mb-3">
                  <strong className="text-white">Role:</strong> Submit the outcome (YES or NO) to resolve the market.
                </p>
                <div className="space-y-2 text-sm">
                  <p className="text-text-secondary">
                    <strong className="text-cyber">How it works:</strong> Once a market expires, the creator has 10 minutes to propose. 
                    After that, <strong className="text-white">anyone can propose</strong>. 
                    Stake a bond (1% of the pool, minimum 0.005 BNB) to submit your proposed outcome.
                  </p>
                  <p className="text-text-secondary">
                    <strong className="text-yes">If accepted:</strong> You get your 
                    <strong className="text-white"> bond back + 0.5% of the pool</strong> as a reward.
                  </p>
                  <p className="text-text-secondary">
                    <strong className="text-no">If disputed & you lose the vote:</strong> 
                    You <strong className="text-no">lose your ENTIRE bond</strong>. 
                    50% goes to the disputer, 50% goes to voters who voted against you.
                  </p>
                </div>
              </div>

              {/* THE DISPUTER */}
              <div className="bg-dark-800 border border-no/30 p-5">
                <h3 className="text-xl font-black text-no mb-2">THE DISPUTER</h3>
                <p className="text-text-secondary mb-3">
                  <strong className="text-white">Role:</strong> Challenge a proposal and trigger a shareholder vote.
                </p>
                <div className="space-y-2 text-sm">
                  <p className="text-text-secondary">
                    <strong className="text-cyber">How it works:</strong> If you disagree with a proposal, 
                    stake a <strong className="text-white">2x bond</strong> (double the proposer's bond) to dispute it. 
                    This triggers a 1-hour shareholder vote.
                  </p>
                  <p className="text-text-secondary">
                    <strong className="text-yes">If you win the vote:</strong> You get your bond back 
                    <strong className="text-white"> + 50% of the proposer's bond</strong>. The market resolves to the OPPOSITE outcome.
                  </p>
                  <p className="text-text-secondary">
                    <strong className="text-no">If you lose the vote:</strong> 
                    You <strong className="text-no">lose your ENTIRE 2x bond</strong>. 
                    50% goes to the proposer, 50% goes to voters who voted against you.
                  </p>
                </div>
              </div>

              {/* THE JURY */}
              <div className="bg-dark-800 border border-cyber/30 p-5">
                <h3 className="text-xl font-black text-cyber mb-2">THE JURY</h3>
                <p className="text-text-secondary mb-3">
                  <strong className="text-white">Role:</strong> Vote on disputed markets and earn jury fees.
                </p>
                <div className="space-y-2 text-sm">
                  <p className="text-text-secondary">
                    <strong className="text-cyber">How it works:</strong> When a dispute happens, all shareholders can vote. 
                    Your vote weight = <strong className="text-white">total shares (YES + NO combined)</strong>. 
                    Vote for whichever side you want—proposer or disputer.
                  </p>
                  <p className="text-text-secondary">
                    <strong className="text-yes">If you vote with the winning side:</strong> 
                    You earn a share of <strong className="text-white">50% of the loser's bond</strong> (proportional to your vote weight).
                  </p>
                  <p className="text-text-secondary">
                    <strong className="text-no">If you vote with the losing side:</strong> 
                    You get <strong className="text-no">ZERO jury fees</strong>. 
                    Only voters on the winning side split the jury fee portion.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ===== STREET CONSENSUS - IMPORTANT ===== */}
          <section>
            <h2 className="text-2xl font-black text-white border-l-4 border-warning pl-4 mb-6">
              STREET CONSENSUS VOTING
            </h2>
            
            <div className="bg-warning/10 border-2 border-warning p-6">
              <p className="text-warning font-black text-lg mb-4">HOW DISPUTE VOTING WORKS</p>
              
              <div className="space-y-4 text-sm">
                <div>
                  <p className="text-white font-bold">Vote Weight Calculation</p>
                  <p className="text-text-secondary">
                    Your vote weight = <strong className="text-cyber">ALL your shares (YES + NO combined)</strong>.
                    If you hold 100 YES and 50 NO shares, your vote weight is <strong className="text-cyber">150</strong>.
                  </p>
                </div>
                
                <div>
                  <p className="text-white font-bold">What Your Vote Does</p>
                  <p className="text-text-secondary">
                    You vote for either the <strong className="text-yes">Proposer</strong> or the <strong className="text-no">Disputer</strong>.
                    The side with more vote weight wins. The winning side determines the market outcome.
                  </p>
                </div>

                <div className="bg-dark-900/50 p-4 border border-dark-600">
                  <p className="text-white font-bold mb-2">Example:</p>
                  <p className="text-text-secondary mb-2">
                    Question: "Will BTC hit $100K by Dec 31?" — Proposer submitted <span className="text-yes">YES</span>, someone disputed.
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-text-secondary">
                    <li>Proposer wins vote → Market resolves <span className="text-yes">YES</span> → YES shareholders claim the pool</li>
                    <li>Disputer wins vote → Market resolves <span className="text-no">NO</span> → NO shareholders claim the pool</li>
                  </ul>
                </div>

                <div className="bg-cyber/10 p-4 border border-cyber">
                  <p className="text-cyber font-bold mb-2">JURY FEE DISTRIBUTION</p>
                  <ul className="list-disc list-inside space-y-1 text-text-secondary">
                    <li>The losing bonder forfeits their entire bond</li>
                    <li><strong className="text-white">50%</strong> → Winning bonder</li>
                    <li><strong className="text-white">50%</strong> → Split among voters who voted for the winning side (proportional to vote weight)</li>
                    <li className="text-no">Voters on the losing side receive <strong>ZERO</strong> jury fees</li>
                  </ul>
                  
                  {/* Explicit Numeric Example - DETAILED */}
                  <div className="mt-4 p-3 bg-dark-900/70 border border-dark-600">
                    <p className="text-white font-bold text-sm mb-3">EXAMPLE: Complete Bond & Jury Fee Split</p>
                    <div className="text-xs text-text-secondary space-y-2">
                      <p className="text-text-muted">Scenario: Disputer loses the vote with a <span className="text-no font-bold">0.02 BNB</span> bond</p>
                      
                      <div className="mt-3 space-y-2">
                        <p className="font-bold text-white">Step 1: Bond Split (Loser's 0.02 BNB)</p>
                        <ul className="ml-4 space-y-1">
                          <li>• <span className="text-yes">0.01 BNB (50%)</span> → Winner (proposer)</li>
                          <li>• <span className="text-cyber">0.01 BNB (50%)</span> → Voter Pool (split among winning voters)</li>
                        </ul>
                      </div>
                      
                      <div className="mt-3 space-y-2">
                        <p className="font-bold text-white">Step 2: Voter Pool Distribution</p>
                        <p className="text-text-muted">If Voter A has 1000 shares and Voter B has 3000 shares (both voted for proposer):</p>
                        <ul className="ml-4 space-y-1">
                          <li>• Total winning votes = <span className="text-white">4000 shares</span></li>
                          <li>• <span className="text-cyber">Voter A</span> gets: 0.01 × (1000/4000) = <span className="text-yes font-bold">0.0025 BNB</span></li>
                          <li>• <span className="text-cyber">Voter B</span> gets: 0.01 × (3000/4000) = <span className="text-yes font-bold">0.0075 BNB</span></li>
                        </ul>
                      </div>
                      
                      <div className="mt-3 pt-2 border-t border-dark-600">
                        <p className="text-warning text-xs"><strong>NOTE:</strong> This is SEPARATE from the 0.3% resolution fee. 
                        The 0.3% is a protocol fee on claim payouts that goes to Treasury. 
                        Jury fees come from the loser's bond, NOT from any percentage fee.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-dark-900/50 p-4 border border-dark-600">
                  <p className="text-white font-bold mb-2">Vote vs. Share Position</p>
                  <p className="text-text-secondary">
                    Your vote and your shares are <strong className="text-white">independent</strong>. 
                    You can vote for either side regardless of which shares you hold.
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-text-secondary mt-2">
                    <li>Jury fees are earned based on <strong className="text-cyber">how you voted</strong></li>
                    <li>Pool winnings are earned based on <strong className="text-cyber">which shares you hold</strong></li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* ===== BONDING CURVE BASICS ===== */}
          <section>
            <h2 className="text-2xl font-black text-white border-l-4 border-cyber pl-4 mb-6">
              BONDING CURVE BASICS
            </h2>
            
            <div className="space-y-4">
              <div className="bg-dark-800 border border-dark-600 p-5">
                <h4 className="text-white font-bold mb-3">The Core Rule</h4>
                <div className="text-center py-4">
                  <span className="text-2xl font-mono">
                    <span className="text-yes">P(YES)</span> + <span className="text-no">P(NO)</span> = <span className="text-cyber">0.01 BNB</span>
                  </span>
                </div>
                <p className="text-text-secondary text-sm text-center">Always. No exceptions.</p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-dark-800 border border-yes/30 p-4">
                  <h4 className="text-yes font-bold mb-2">Buying</h4>
                  <p className="text-text-secondary text-sm">
                    Buying pushes price <strong className="text-white">UP</strong>. More demand = higher price.
                  </p>
                </div>
                <div className="bg-dark-800 border border-no/30 p-4">
                  <h4 className="text-no font-bold mb-2">Selling</h4>
                  <p className="text-text-secondary text-sm">
                    Selling pushes price <strong className="text-white">DOWN</strong>. Uses post-sale state (natural slippage).
                  </p>
                </div>
              </div>

              <div className="bg-dark-800 border border-dark-600 p-4">
                <h4 className="text-white font-bold mb-2">Initial State</h4>
                <div className="flex justify-center gap-8 font-mono">
                  <span><span className="text-yes">YES</span> = 0.005 BNB <span className="text-text-muted">(50%)</span></span>
                  <span><span className="text-no">NO</span> = 0.005 BNB <span className="text-text-muted">(50%)</span></span>
                </div>
              </div>

              <div className="bg-no/10 border border-no p-4">
                <h4 className="text-no font-bold mb-2">No Free Lunch</h4>
                <p className="text-text-secondary text-sm">
                  <strong className="text-white">Instant buy→sell = guaranteed loss</strong> due to price impact + fees. 
                  There is no risk-free arbitrage in the Jungle.
                </p>
              </div>
            </div>
          </section>

          {/* ===== FEE STRUCTURE ===== */}
          <section>
            <h2 className="text-2xl font-black text-white border-l-4 border-cyber pl-4 mb-6">
              FEE STRUCTURE
            </h2>
            
            <div className="bg-dark-800 border border-dark-600 p-6">
              {/* Fee Grid with Destinations */}
              <div className="space-y-4">
                {/* Trading Fees */}
                <div>
                  <h4 className="text-white font-bold mb-3">Trading Fees (on every buy/sell)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3 bg-dark-900 flex justify-between items-center">
                      <div>
                        <p className="text-text-muted text-xs">Platform Fee</p>
                        <p className="text-cyber text-xl font-mono">1.0%</p>
                      </div>
                      <div className="text-right">
                        <p className="text-text-muted text-xs">goes to</p>
                        <p className="text-cyber text-sm font-bold">Treasury</p>
                      </div>
                    </div>
                    <div className="p-3 bg-dark-900 flex justify-between items-center">
                      <div>
                        <p className="text-text-muted text-xs">Creator Fee</p>
                        <p className="text-yellow-500 text-xl font-mono">0.5%</p>
                      </div>
                      <div className="text-right">
                        <p className="text-text-muted text-xs">goes to</p>
                        <p className="text-yellow-500 text-sm font-bold">Market Creator</p>
                      </div>
                    </div>
                  </div>
                  <p className="text-text-muted text-xs mt-2 text-center">Total trading fee: 1.5% per trade</p>
                </div>

                {/* Resolution Fee */}
                <div>
                  <h4 className="text-white font-bold mb-3">Resolution Fee (on winning claims)</h4>
                  <div className="p-3 bg-dark-900 flex justify-between items-center">
                    <div>
                      <p className="text-text-muted text-xs">Resolution Fee</p>
                      <p className="text-cyber text-xl font-mono">0.3%</p>
                    </div>
                    <div className="text-right">
                      <p className="text-text-muted text-xs">goes to</p>
                      <p className="text-cyber text-sm font-bold">Treasury</p>
                    </div>
                  </div>
                  <p className="text-text-muted text-xs mt-2 text-center">Deducted from your payout when you claim winnings</p>
                  
                  {/* Important clarification */}
                  <div className="mt-3 p-3 bg-warning/10 border border-warning/30">
                    <p className="text-warning text-xs font-bold mb-1">IMPORTANT: Resolution Fee ≠ Jury Fees</p>
                    <p className="text-text-secondary text-xs">
                      The <strong className="text-white">0.3% resolution fee</strong> is a protocol fee on claim payouts that goes to the <strong className="text-cyber">Treasury</strong>. 
                      This is <strong className="text-no">completely separate</strong> from jury fees earned by voters during disputed resolution.
                      Voters earn their share of the <strong className="text-white">50% loser's bond</strong>, NOT the 0.3% fee.
                    </p>
                  </div>
                </div>

                {/* Other Info */}
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-dark-600">
                  <div className="p-3 bg-dark-900">
                    <p className="text-text-muted text-xs mb-1">Market Creation</p>
                    <p className="text-yes text-xl font-mono">FREE</p>
                  </div>
                  <div className="p-3 bg-dark-900">
                    <p className="text-text-muted text-xs mb-1">Minimum Trade</p>
                    <p className="text-white text-xl font-mono">0.005 BNB</p>
                  </div>
                </div>
              </div>

              <p className="text-text-muted text-xs mt-4 text-center">
                All fees are non-refundable and automatically deducted by the smart contract.
              </p>
            </div>
          </section>

          {/* ===== BOND REQUIREMENTS ===== */}
          <section>
            <h2 className="text-2xl font-black text-white border-l-4 border-cyber pl-4 mb-6">
              BOND REQUIREMENTS
            </h2>
            
            <div className="space-y-4">
              <div className="bg-dark-800 border border-dark-600 p-5 font-mono">
                <div className="space-y-2">
                  <p>
                    <span className="text-text-muted">Proposer Bond =</span> 
                    <strong className="text-cyber ml-2">max(0.005 BNB, 1% of pool)</strong>
                  </p>
                  <p>
                    <span className="text-text-muted">Disputer Bond =</span> 
                    <strong className="text-cyber ml-2">2× Proposer Bond</strong>
                  </p>
                </div>
              </div>

              <div className="bg-dark-800 border border-dark-600 p-4">
                <h4 className="text-white font-bold mb-3">Example Calculations</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm font-mono">
                    <thead>
                      <tr className="border-b border-dark-600">
                        <th className="text-left p-2 text-text-muted">Pool Size</th>
                        <th className="text-left p-2 text-text-muted">Proposer Bond</th>
                        <th className="text-left p-2 text-text-muted">Disputer Bond</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-dark-700">
                        <td className="p-2 text-white">0.3 BNB</td>
                        <td className="p-2 text-yes">0.005 BNB (min)</td>
                        <td className="p-2 text-no">0.01 BNB</td>
                      </tr>
                      <tr className="border-b border-dark-700">
                        <td className="p-2 text-white">2 BNB</td>
                        <td className="p-2 text-yes">0.02 BNB</td>
                        <td className="p-2 text-no">0.04 BNB</td>
                      </tr>
                      <tr>
                        <td className="p-2 text-white">10 BNB</td>
                        <td className="p-2 text-yes">0.1 BNB</td>
                        <td className="p-2 text-no">0.2 BNB</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>

          {/* ===== RESOLUTION TIMELINE ===== */}
          <section>
            <h2 className="text-2xl font-black text-white border-l-4 border-cyber pl-4 mb-6">
              RESOLUTION TIMELINE
            </h2>
            
            <div className="space-y-3">
              <div className="flex items-center gap-4 p-4 bg-dark-800 border border-dark-600">
                <div className="w-8 h-8 bg-dark-900 rounded flex items-center justify-center text-text-muted font-bold">1</div>
                <div>
                  <p className="text-white font-bold">Market Expires</p>
                  <p className="text-text-secondary text-sm">Trading stops. Resolution begins.</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 p-4 bg-dark-800 border border-cyber/30">
                <div className="w-8 h-8 bg-dark-900 rounded flex items-center justify-center text-cyber font-bold">2</div>
                <div>
                  <p className="text-cyber font-bold">First 10 Minutes</p>
                  <p className="text-text-secondary text-sm">Only the creator can propose the outcome.</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 p-4 bg-dark-800 border border-dark-600">
                <div className="w-8 h-8 bg-dark-900 rounded flex items-center justify-center text-text-muted font-bold">3</div>
                <div>
                  <p className="text-white font-bold">After 10 Minutes</p>
                  <p className="text-text-secondary text-sm">Anyone can propose (if creator didn't).</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 p-4 bg-dark-800 border border-yellow-500/30">
                <div className="w-8 h-8 bg-dark-900 rounded flex items-center justify-center text-yellow-500 font-bold">4</div>
                <div>
                  <p className="text-yellow-500 font-bold">30-Minute Dispute Window</p>
                  <p className="text-text-secondary text-sm">Anyone can challenge the proposal with a 2x bond.</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 p-4 bg-dark-800 border border-purple-500/30">
                <div className="w-8 h-8 bg-dark-900 rounded flex items-center justify-center text-purple-400 font-bold">5</div>
                <div>
                  <p className="text-purple-400 font-bold">If Disputed: 1-Hour Voting</p>
                  <p className="text-text-secondary text-sm">Shareholders vote. Majority wins.</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 p-4 bg-dark-800 border border-no/30">
                <div className="w-8 h-8 bg-dark-900 rounded flex items-center justify-center text-no font-bold">!</div>
                <div>
                  <p className="text-no font-bold">If No Proposal for 24h</p>
                  <p className="text-text-secondary text-sm">Emergency refund becomes available for all shareholders.</p>
                </div>
              </div>
            </div>
          </section>

          {/* ===== HOW WINNINGS ARE DISTRIBUTED ===== */}
          <section>
            <h2 className="text-2xl font-black text-white border-l-4 border-yes pl-4 mb-6">
              HOW WINNINGS ARE DISTRIBUTED
            </h2>
            
            <div className="bg-yes/10 border-2 border-yes p-6 mb-6">
              <p className="text-yes font-black text-lg mb-4">WINNERS TAKE ALL — PROPORTIONALLY</p>
              
              <div className="space-y-4 text-sm">
                <div>
                  <p className="text-white font-bold">When a market resolves:</p>
                  <ul className="list-disc list-inside space-y-1 text-text-secondary mt-2">
                    <li>The <strong className="text-no">losing side</strong> gets <strong className="text-no">NOTHING</strong> — their BNB stays in the pool</li>
                    <li>The <strong className="text-yes">winning side</strong> splits the <strong className="text-yes">ENTIRE pool</strong></li>
                    <li>Your payout depends on <strong className="text-white">how many shares you hold</strong></li>
                  </ul>
                </div>
                
                <div className="bg-dark-900/50 p-4 border border-dark-600 font-mono">
                  <p className="text-text-muted text-xs mb-2">PAYOUT FORMULA:</p>
                  <p className="text-cyber text-lg">
                    Your Payout = (Your Shares / Total Winning Shares) × Pool Balance
                  </p>
                </div>

                <div className="bg-dark-900/50 p-4 border border-dark-600">
                  <p className="text-white font-bold mb-2">Example:</p>
                  <div className="text-text-secondary space-y-2">
                    <p>Market resolves to <span className="text-yes font-bold">YES</span>. Pool has <span className="text-cyber">10 BNB</span>.</p>
                    <p>Total YES shares in existence: <span className="text-white">1,000 shares</span></p>
                    <div className="mt-3 space-y-1">
                      <p>• Alice holds <span className="text-yes">500 YES</span> shares → Gets <span className="text-yes">5.0 BNB</span> (50%)</p>
                      <p>• Bob holds <span className="text-yes">300 YES</span> shares → Gets <span className="text-yes">3.0 BNB</span> (30%)</p>
                      <p>• Carol holds <span className="text-yes">200 YES</span> shares → Gets <span className="text-yes">2.0 BNB</span> (20%)</p>
                      <p className="mt-2">• Dave holds <span className="text-no">500 NO</span> shares → Gets <span className="text-no">0 BNB</span> (wrong side)</p>
                    </div>
                  </div>
                </div>

                <p className="text-cyber font-bold">
                  The more shares you hold on the winning side, the bigger your slice of the pie!
                </p>
              </div>
            </div>
          </section>

          {/* ===== WHY PRICE TRADING WORKS ===== */}
          <section>
            <h2 className="text-2xl font-black text-white border-l-4 border-cyber pl-4 mb-6">
              WHY PRICE-BASED TRADING WORKS
            </h2>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-dark-800 border border-dark-600 p-5">
                <h4 className="text-text-muted font-bold mb-3">Traditional Prediction Markets</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <span className="text-text-muted">•</span>
                    <span className="text-text-secondary">Buy shares at current probability</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-text-muted">•</span>
                    <span className="text-text-secondary">Wait for event to occur</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-text-muted">•</span>
                    <span className="text-text-secondary">Winners get $1/share, losers get $0</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-no">✗</span>
                    <span className="text-no">No way to exit early at profit</span>
                  </li>
                </ul>
              </div>
              
              <div className="bg-cyber/10 border border-cyber p-5">
                <h4 className="text-cyber font-bold mb-3">JNGLZ.FUN Model</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <span className="text-cyber">•</span>
                    <span className="text-text-secondary">Buy shares at current price</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-cyber">•</span>
                    <span className="text-text-secondary">Price moves based on market demand</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-cyber">•</span>
                    <span className="text-text-secondary">Sell anytime for instant BNB</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-yes">✓</span>
                    <span className="text-yes">Profit from price movements + resolution</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

        </div>

        {/* Footer - Bridge to Legal */}
        <div className="border-t border-dark-600 mt-12 pt-6">
          <div className="bg-dark-800 border border-dark-600 p-4 mb-6 text-center">
            <p className="text-text-secondary text-sm">
              By participating in the Jungle, you agree to our{' '}
              <Link to="/terms" className="text-cyber hover:underline">Terms of Service</Link>.
              {' '}High volatility and smart contract risks apply.
            </p>
          </div>
          
          <div className="text-center">
            <Link to="/" className="text-cyber hover:underline">
              Return to Markets
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HowToPlayPage;
