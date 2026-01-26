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
    <div className="min-h-screen py-8 md:py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="border-b border-dark-600 pb-4 md:pb-6 mb-6 md:mb-8">
          <Link to="/" className="text-cyber hover:underline text-sm mb-3 md:mb-4 inline-block">
            ← Back to Markets
          </Link>
          <h1 className="text-2xl md:text-3xl font-black uppercase">
            HOW TO <span className="text-cyber">PLAY</span>
          </h1>
          <p className="text-text-muted text-sm mt-2">
            Master the Jungle. Dominate the Markets.
          </p>
        </div>

        {/* Content */}
        <div className="space-y-8 md:space-y-12">
          
          {/* ===== THE GOAL OF JNGLZ ===== */}
          <section>
            <h2 className="text-xl md:text-2xl font-black text-white border-l-4 border-cyber pl-4 mb-4 md:mb-6">
              THE GOAL OF JNGLZ
            </h2>
            <div className="bg-dark-800 border border-cyber/30 p-4 md:p-6">
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
                Whether you are sniping a <strong className="text-yes">700% flip</strong> in <span className="text-no">DEGEN FLASH</span> or 
                building a massive position in <span className="text-purple-400">DEEP SPACE</span>, the mission is the same: 
                <strong className="text-cyber"> Be right about the truth before the market finds its equilibrium.</strong>
              </p>
            </div>
          </section>

          {/* ===== HEAT LEVELS ===== */}
          <section>
            <h2 className="text-xl md:text-2xl font-black text-white border-l-4 border-cyber pl-4 mb-4 md:mb-6">
              THE JNGLZ HEAT LEVELS
            </h2>
            <p className="text-text-secondary mb-4 md:mb-6 text-sm md:text-base">
              Each jungle uses a specific <strong className="text-white">Virtual Liquidity (vLiq)</strong> setting. 
              This determines the "weight" of the market and how much capital is required to move the price. 
              <strong className="text-cyber"> Higher vLiq = More Stability.</strong>
            </p>
            
            {/* Heat Level Table - Scrollable on mobile */}
            <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 mb-6">
              <table className="w-full text-xs md:text-sm border border-dark-600 min-w-[600px]">
                <thead>
                  <tr className="bg-dark-800">
                    <th className="text-left p-3 border-b border-dark-600 text-text-muted">HEAT LEVEL</th>
                    <th className="text-left p-3 border-b border-dark-600 text-text-muted">vLiq</th>
                    <th className="text-left p-3 border-b border-dark-600 text-text-muted">1 BNB IMPACT</th>
                    <th className="text-left p-3 border-b border-dark-600 text-text-muted">TARGET USER</th>
                    <th className="text-left p-3 border-b border-dark-600 text-text-muted">THE "VIBE"</th>
                  </tr>
                </thead>
                <tbody className="font-mono">
                  <tr className="border-b border-dark-700">
                    <td className="p-3 text-no">DEGEN FLASH</td>
                    <td className="p-3 text-white">50</td>
                    <td className="p-3 text-no font-bold">50¢ → 83¢</td>
                    <td className="p-3 text-text-secondary">Moon-Bagger</td>
                    <td className="p-3 text-text-muted text-xs">Total Chaos. Small trades move the needle. Extreme volatility.</td>
                  </tr>
                  <tr className="border-b border-dark-700">
                    <td className="p-3 text-yellow-500">STREET FIGHT</td>
                    <td className="p-3 text-white">200</td>
                    <td className="p-3 text-yellow-500 font-bold">50¢ → 66¢</td>
                    <td className="p-3 text-text-secondary">The Trader</td>
                    <td className="p-3 text-text-muted text-xs">The Standard. Strategic tug-of-war. High ROI potential.</td>
                  </tr>
                  <tr className="border-b border-dark-700">
                    <td className="p-3 text-cyber">WHALE POND</td>
                    <td className="p-3 text-white">500</td>
                    <td className="p-3 text-cyber font-bold">50¢ → 58¢</td>
                    <td className="p-3 text-text-secondary">The Shark</td>
                    <td className="p-3 text-text-muted text-xs">Serious Stakes. Balanced slippage for high-conviction players.</td>
                  </tr>
                  <tr className="border-b border-dark-700">
                    <td className="p-3 text-blue-400">INSTITUTION</td>
                    <td className="p-3 text-white">2000</td>
                    <td className="p-3 text-blue-400 font-bold">50¢ → 52¢</td>
                    <td className="p-3 text-text-secondary">The Whale</td>
                    <td className="p-3 text-text-muted text-xs">The Professional. Deep liquidity. Price moves slowly.</td>
                  </tr>
                  <tr>
                    <td className="p-3 text-purple-400">DEEP SPACE</td>
                    <td className="p-3 text-white">10000</td>
                    <td className="p-3 text-purple-400 font-bold">50¢ → ~50¢</td>
                    <td className="p-3 text-text-secondary">The Titan</td>
                    <td className="p-3 text-text-muted text-xs">Infinite Depth. Near-zero slippage. The final source of truth.</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Price Impact Reference */}
            <div className="bg-dark-800 border border-dark-600 p-4">
              <h4 className="text-white font-bold mb-3">PRICE IMPACT REFERENCE (TESTED)</h4>
              <p className="text-text-secondary text-sm mb-2">
                How much a <strong className="text-white">1 BNB first buy</strong> moves the price on a fresh market (starting at 50¢):
              </p>
              <p className="text-yellow-500 text-xs mb-3 font-bold">
                These are real tested values. If others have already traded, 
                the actual impact will differ based on the current market state.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 font-mono text-sm">
                <div className="flex justify-between p-2 bg-dark-900">
                  <span className="text-no">DEGEN FLASH</span>
                  <span className="text-white">+33¢ move</span>
                </div>
                <div className="flex justify-between p-2 bg-dark-900">
                  <span className="text-yellow-500">STREET FIGHT</span>
                  <span className="text-white">+16¢ move</span>
                </div>
                <div className="flex justify-between p-2 bg-dark-900">
                  <span className="text-cyber">WHALE POND</span>
                  <span className="text-white">+8¢ move</span>
                </div>
                <div className="flex justify-between p-2 bg-dark-900">
                  <span className="text-blue-400">INSTITUTION</span>
                  <span className="text-white">+2¢ move</span>
                </div>
                <div className="flex justify-between p-2 bg-dark-900">
                  <span className="text-purple-400">DEEP SPACE</span>
                  <span className="text-white">&lt;1¢ move</span>
                </div>
              </div>
            </div>
          </section>

          {/* ===== STRATEGIES ===== */}
          <section>
            <h2 className="text-xl md:text-2xl font-black text-white border-l-4 border-cyber pl-4 mb-4 md:mb-6">
              THE JUNGLE STRATEGIES
            </h2>
            <p className="text-text-secondary mb-4 md:mb-6 text-sm md:text-base">
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

              {/* THE FIRST MOVER - Advanced Arbitrage */}
              <div className="bg-dark-800 border border-yes/50 p-5">
                <h3 className="text-xl font-black text-yes mb-2">THE FIRST MOVER <span className="text-sm font-normal text-text-muted">(Free Shares Arbitrage)</span></h3>
                <p className="text-text-secondary mb-3">
                  <strong className="text-white">The Goal:</strong> Get "free" shares with house money.
                </p>
                <div className="space-y-2 text-sm">
                  <p className="text-text-secondary">
                    <strong className="text-cyber">The Play:</strong> Be the <strong className="text-yes">first buyer</strong> in a fresh market. 
                    Buy a position (e.g., 1 BNB of YES shares at 50%). Then <strong className="text-white">partially sell</strong> — 
                    the bonding curve lets you extract most of your BNB back while keeping some shares.
                  </p>
                  <p className="text-text-secondary">
                    <strong className="text-yes">The Win:</strong> You now hold shares that cost you <strong className="text-white">almost nothing</strong> (just the 1.5% trading fees). 
                    If someone else buys after you, your remaining shares increase in value — sell for profit. 
                    If your side wins at resolution, you claim winnings from shares you barely paid for!
                  </p>
                  <div className="bg-dark-900/50 p-3 mt-3 border border-dark-600">
                    <p className="text-white font-bold text-xs mb-2">Example:</p>
                    <div className="text-text-muted text-xs space-y-1">
                      <p>1. Buy 1 BNB of YES at 50% → Get ~200 shares</p>
                      <p>2. Sell 150 shares → Get ~0.97 BNB back (after fees)</p>
                      <p>3. You still hold <span className="text-yes">50 shares</span> that only cost you <span className="text-cyber">~0.03 BNB</span></p>
                      <p>4. If YES wins → Your 50 shares claim from the entire pool = <span className="text-yes">massive ROI</span></p>
                    </div>
                  </div>
                  <p className="text-warning text-xs mt-3">
                    ⚠️ This works best when you're the first/only trader. Once others trade, the math changes.
                  </p>
                </div>
              </div>

              {/* THE REFUND FARMER - Refund Arbitrage */}
              <div className="bg-dark-800 border border-warning/50 p-5">
                <h3 className="text-xl font-black text-warning mb-2">THE REFUND FARMER <span className="text-sm font-normal text-text-muted">(Cancellation Arbitrage)</span></h3>
                <p className="text-text-secondary mb-3">
                  <strong className="text-white">The Goal:</strong> Profit from potential market cancellation.
                </p>
                <div className="space-y-2 text-sm">
                  <p className="text-text-secondary">
                    <strong className="text-cyber">The Play:</strong> Look for markets likely to be <strong className="text-warning">cancelled</strong> 
                    (one-sided, ambiguous questions, no activity). Buy shares <strong className="text-white">early at low prices</strong>. 
                    Since refunds are based on <strong className="text-warning">share count, not amount paid</strong>, 
                    early buyers get a disproportionate refund.
                  </p>
                  <p className="text-text-secondary">
                    <strong className="text-yes">The Win:</strong> If the market gets cancelled, you receive more BNB back than you paid — 
                    funded by late buyers who paid higher prices for fewer shares.
                  </p>
                  <div className="bg-dark-900/50 p-3 mt-3 border border-dark-600">
                    <p className="text-white font-bold text-xs mb-2">Example: One-Sided Market Refund</p>
                    <div className="text-text-muted text-xs space-y-1">
                      <p>1. You buy early: <span className="text-white">100 shares</span> for <span className="text-white">1 BNB</span> (0.01 BNB/share)</p>
                      <p>2. Late buyer: <span className="text-white">50 shares</span> for <span className="text-white">2 BNB</span> (0.04 BNB/share)</p>
                      <p>3. Market cancelled → Pool has ~2.7 BNB (after fees)</p>
                      <p>4. You own 66.7% of shares → Refund = <span className="text-yes">1.8 BNB</span> (paid 1 BNB = <span className="text-yes">+0.8 profit</span>)</p>
                      <p>5. Late buyer owns 33.3% → Refund = <span className="text-no">0.9 BNB</span> (paid 2 BNB = <span className="text-no">-1.1 loss</span>)</p>
                    </div>
                  </div>
                  <div className="bg-no/10 p-3 mt-3 border border-no">
                    <p className="text-no font-bold text-xs mb-1">⚠️ ETHICAL WARNING</p>
                    <p className="text-text-muted text-xs">
                      This strategy profits at the expense of late buyers. While it's valid AMM behavior, 
                      use it responsibly. Don't create fake markets just to farm refunds.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ===== RESOLUTION ROLES ===== */}
          <section>
            <h2 className="text-xl md:text-2xl font-black text-white border-l-4 border-cyber pl-4 mb-4 md:mb-6">
              RESOLUTION ROLES
            </h2>
            <p className="text-text-secondary mb-4 md:mb-6 text-sm md:text-base">
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

                {/* TIE SCENARIO */}
                <div className="bg-yellow-500/10 p-4 border border-yellow-500">
                  <p className="text-yellow-500 font-bold mb-2">⚖️ WHAT IF THE VOTE IS A TIE?</p>
                  <p className="text-text-secondary text-sm mb-3">
                    If the dispute vote ends in an <strong className="text-white">exact 50/50 tie</strong> (equal votes on both sides), 
                    the community couldn't reach consensus. In this case:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-text-secondary text-sm">
                    <li><span className="text-yes">✓</span> <strong className="text-white">Proposer's bond is returned</strong> (no penalty)</li>
                    <li><span className="text-yes">✓</span> <strong className="text-white">Disputer's bond is returned</strong> (no penalty)</li>
                    <li><span className="text-cyber">⏳</span> <strong className="text-white">Emergency refund activates</strong> for all traders</li>
                  </ul>
                  <p className="text-text-muted text-xs mt-3">
                    When the crowd can't decide, nobody gets punished. All traders can claim emergency refunds 
                    after the 24-hour window from market expiry passes.
                  </p>
                </div>

                {/* 2-HOUR CUTOFF */}
                <div className="bg-orange-500/10 p-4 border border-orange-500">
                  <p className="text-orange-400 font-bold mb-2">⏰ 2-HOUR PROPOSAL CUTOFF</p>
                  <p className="text-text-secondary text-sm mb-3">
                    To prevent race conditions between resolution and emergency refund:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-text-secondary text-sm">
                    <li><span className="text-orange-400">🚫</span> <strong className="text-white">No new proposals</strong> allowed within 2 hours of emergency refund (22h+ after expiry)</li>
                    <li><span className="text-yes">✓</span> <strong className="text-white">Disputes still allowed</strong> within the natural 30-minute dispute window</li>
                    <li><span className="text-cyber">⏳</span> <strong className="text-white">Voting continues</strong> normally if already in progress</li>
                  </ul>
                  <p className="text-text-muted text-xs mt-3">
                    This ensures resolution always completes before emergency refund becomes available. 
                    The worst case: proposal at T=21:59, dispute at T=22:29, voting ends at T=23:29 — 
                    still 30 minutes before emergency refund at T=24:00.
                  </p>
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

          {/* ===== THE MATH BEHIND THE CURVE ===== */}
          <section>
            <h2 className="text-2xl font-black text-white border-l-4 border-purple-500 pl-4 mb-6">
              THE MATH BEHIND THE CURVE
            </h2>
            
            <p className="text-text-secondary mb-6">
              JNGLZ.FUN uses a <strong className="text-cyber">Linear Constant Sum AMM</strong> — a bonding curve model 
              specifically designed for prediction markets. Here's how it works and why we chose it.
            </p>

            {/* Linear vs Exponential */}
            <div className="bg-dark-800 border border-purple-500/30 p-6 mb-6">
              <h4 className="text-purple-400 font-black text-lg mb-4">LINEAR vs EXPONENTIAL CURVES</h4>
              
              <div className="grid md:grid-cols-2 gap-6">
                {/* Exponential (what we DON'T use) */}
                <div className="border border-dark-600 p-4">
                  <h5 className="text-text-muted font-bold mb-3 flex items-center gap-2">
                    <span className="text-no">✗</span> Exponential (Pump.fun style)
                  </h5>
                  <div className="space-y-2 text-sm text-text-secondary">
                    <p>Price = k × Supply²</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Price increases <strong className="text-white">exponentially</strong> with supply</li>
                      <li>Early buyers get extreme advantages</li>
                      <li>Late buyers face massive slippage</li>
                      <li>Great for tokens, <span className="text-no">bad for predictions</span></li>
                    </ul>
                    <p className="text-text-muted text-xs mt-3">
                      Problem: A 90% YES price doesn't mean 90% probability — it means lots of people bought early.
                    </p>
                  </div>
                </div>

                {/* Linear (what we use) */}
                <div className="border border-cyber p-4 bg-cyber/5">
                  <h5 className="text-cyber font-bold mb-3 flex items-center gap-2">
                    <span className="text-yes">✓</span> Linear Constant Sum (JNGLZ)
                  </h5>
                  <div className="space-y-2 text-sm text-text-secondary">
                    <p>P(YES) = <span className="text-cyber">0.01</span> × virtualYes / totalVirtual</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Price changes <strong className="text-white">proportionally</strong> to demand</li>
                      <li>P(YES) + P(NO) = 0.01 BNB <strong className="text-cyber">always</strong></li>
                      <li>Price directly reflects market probability</li>
                      <li><span className="text-yes">Perfect for prediction markets</span></li>
                    </ul>
                    <p className="text-text-muted text-xs mt-3">
                      Benefit: A 70% YES price means the market believes there's a 70% chance of YES winning.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* The Formula */}
            <div className="bg-dark-800 border border-dark-600 p-6 mb-6">
              <h4 className="text-white font-black text-lg mb-4">THE PRICE FORMULA</h4>
              
              <div className="bg-dark-900 p-4 font-mono text-sm mb-4 overflow-x-auto">
                <div className="space-y-2">
                  <p><span className="text-text-muted">// Virtual shares (includes liquidity buffer)</span></p>
                  <p><span className="text-cyan-400">virtualYes</span> = yesSupply + <span className="text-purple-400">virtualLiquidity</span></p>
                  <p><span className="text-cyan-400">virtualNo</span> = noSupply + <span className="text-purple-400">virtualLiquidity</span></p>
                  <p><span className="text-cyan-400">totalVirtual</span> = virtualYes + virtualNo</p>
                  <p className="mt-3"><span className="text-text-muted">// Price calculation</span></p>
                  <p><span className="text-yes">P(YES)</span> = <span className="text-cyber">0.01 BNB</span> × virtualYes / totalVirtual</p>
                  <p><span className="text-no">P(NO)</span> = <span className="text-cyber">0.01 BNB</span> × virtualNo / totalVirtual</p>
                </div>
              </div>
              
              <div className="bg-cyber/10 border border-cyber p-3">
                <p className="text-sm text-text-secondary">
                  <strong className="text-cyber">Key Insight:</strong> The prices are just the <strong className="text-white">ratio</strong> of 
                  virtual shares on each side. More YES shares → higher YES price, lower NO price. The total always equals 0.01 BNB.
                </p>
              </div>
            </div>

            {/* Worked Example */}
            <div className="bg-dark-800 border border-dark-600 p-6 mb-6">
              <h4 className="text-white font-black text-lg mb-4">WORKED EXAMPLE</h4>
              
              <div className="space-y-4 text-sm">
                <div className="p-4 bg-dark-900 border border-dark-700">
                  <p className="text-yellow-500 font-bold mb-2">Scenario: STREET FIGHT market (vLiq = 200)</p>
                  <p className="text-text-secondary">Market just created. No trades yet.</p>
                </div>
                
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-3 bg-dark-900 text-center">
                    <p className="text-text-muted text-xs">YES Supply</p>
                    <p className="text-white font-mono text-lg">0</p>
                  </div>
                  <div className="p-3 bg-dark-900 text-center">
                    <p className="text-text-muted text-xs">NO Supply</p>
                    <p className="text-white font-mono text-lg">0</p>
                  </div>
                  <div className="p-3 bg-dark-900 text-center">
                    <p className="text-text-muted text-xs">Virtual Liquidity</p>
                    <p className="text-purple-400 font-mono text-lg">200</p>
                  </div>
                </div>

                <div className="bg-dark-900 p-4 font-mono text-xs">
                  <p className="text-text-muted mb-2">Calculate initial prices:</p>
                  <p>virtualYes = 0 + 200 = <span className="text-cyan-400">200</span></p>
                  <p>virtualNo = 0 + 200 = <span className="text-cyan-400">200</span></p>
                  <p>totalVirtual = 200 + 200 = <span className="text-cyan-400">400</span></p>
                  <p className="mt-2">P(YES) = 0.01 × (200/400) = <span className="text-yes">0.005 BNB (50%)</span></p>
                  <p>P(NO) = 0.01 × (200/400) = <span className="text-no">0.005 BNB (50%)</span></p>
                </div>

                <div className="p-4 bg-yes/10 border border-yes/30">
                  <p className="text-yes font-bold mb-2">Now someone buys 100 YES shares:</p>
                  <div className="bg-dark-900 p-3 font-mono text-xs mt-2">
                    <p>virtualYes = 100 + 200 = <span className="text-cyan-400">300</span></p>
                    <p>virtualNo = 0 + 200 = <span className="text-cyan-400">200</span></p>
                    <p>totalVirtual = 300 + 200 = <span className="text-cyan-400">500</span></p>
                    <p className="mt-2">P(YES) = 0.01 × (300/500) = <span className="text-yes">0.006 BNB (60%)</span></p>
                    <p>P(NO) = 0.01 × (500-300)/500 = <span className="text-no">0.004 BNB (40%)</span></p>
                  </div>
                  <p className="text-text-secondary text-xs mt-3">
                    Result: YES price moved from 50% → 60%. The 100 share purchase shifted the market by 10 percentage points.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ===== VIRTUAL LIQUIDITY DEEP DIVE ===== */}
          <section>
            <h2 className="text-2xl font-black text-white border-l-4 border-purple-500 pl-4 mb-6">
              VIRTUAL LIQUIDITY EXPLAINED
            </h2>
            
            <p className="text-text-secondary mb-6">
              <strong className="text-purple-400">Virtual Liquidity</strong> is the secret sauce that makes JNGLZ markets work. 
              It's "phantom" shares that exist only in the pricing formula — they're never actually minted or owned by anyone.
            </p>

            {/* The Problem */}
            <div className="bg-dark-800 border border-no/30 p-6 mb-6">
              <h4 className="text-no font-black mb-3">THE PROBLEM IT SOLVES</h4>
              <p className="text-text-secondary text-sm mb-4">
                Imagine a brand new market with <strong className="text-white">0 shares</strong> on each side. 
                How do you calculate the price? You can't divide by zero!
              </p>
              <div className="bg-dark-900 p-3 font-mono text-sm text-no">
                P(YES) = 0.01 × (0 / 0) = ❌ UNDEFINED
              </div>
              <p className="text-text-secondary text-sm mt-4">
                Without virtual liquidity, new markets would have no starting price, and the first trade would be impossible.
              </p>
            </div>

            {/* The Solution */}
            <div className="bg-dark-800 border border-yes/30 p-6 mb-6">
              <h4 className="text-yes font-black mb-3">THE SOLUTION</h4>
              <p className="text-text-secondary text-sm mb-4">
                We add <strong className="text-purple-400">virtual shares</strong> to both sides. These phantom shares:
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm text-text-secondary mb-4">
                <li>Provide a <strong className="text-white">starting price</strong> (50/50) for new markets</li>
                <li>Act as a <strong className="text-white">"weight"</strong> that dampens price movements</li>
                <li>Control <strong className="text-white">volatility</strong> — more vLiq = smaller price swings</li>
                <li>Are <strong className="text-white">never owned</strong> by anyone — they're just math</li>
              </ul>
              <div className="bg-dark-900 p-3 font-mono text-sm text-yes">
                P(YES) = 0.01 × (0 + 200) / (0 + 200 + 0 + 200) = 0.005 ✓
              </div>
            </div>

            {/* vLiq as Weight */}
            <div className="bg-dark-800 border border-dark-600 p-6 mb-6">
              <h4 className="text-white font-black mb-4">VIRTUAL LIQUIDITY AS "MARKET WEIGHT"</h4>
              
              <p className="text-text-secondary text-sm mb-4">
                Think of virtual liquidity as <strong className="text-cyber">ballast on a ship</strong>. 
                More ballast = more stability = harder to tip.
              </p>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-no/10 border border-no/30">
                  <p className="text-no font-bold mb-2">Low vLiq (DEGEN FLASH = 50)</p>
                  <p className="text-text-secondary text-xs mb-2">Like a small rowboat — tips easily</p>
                  <ul className="text-xs text-text-secondary space-y-1">
                    <li>• Small trades = BIG price swings</li>
                    <li>• 0.1 BNB can move price 10%+</li>
                    <li>• High volatility, degen playground</li>
                  </ul>
                </div>
                <div className="p-4 bg-purple-500/10 border border-purple-500/30">
                  <p className="text-purple-400 font-bold mb-2">High vLiq (DEEP SPACE = 10,000)</p>
                  <p className="text-text-secondary text-xs mb-2">Like an aircraft carrier — almost immovable</p>
                  <ul className="text-xs text-text-secondary space-y-1">
                    <li>• Massive trades = small price swings</li>
                    <li>• 10 BNB might move price 0.5%</li>
                    <li>• Ultra stable, institutional grade</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Key Insight */}
            <div className="bg-dark-800 border border-cyber/30 p-6">
              <h4 className="text-cyber font-black mb-3">KEY TAKEAWAY</h4>
              <p className="text-text-secondary text-sm">
                Virtual Liquidity controls how "heavy" the market feels. More vLiq = more capital needed to move the price.
                Check the <strong className="text-white">Heat Levels table above</strong> for tested 1 BNB price impacts on fresh markets.
              </p>
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
                  <h4 className="text-white font-bold mb-3">Resolution Fee (0.3%)</h4>
                  <p className="text-text-secondary text-sm mb-3">
                    The 0.3% resolution fee is applied when you <strong className="text-white">deposit</strong> bonds or <strong className="text-white">claim</strong> winnings:
                  </p>
                  
                  <div className="space-y-2">
                    {/* Winner Claims */}
                    <div className="p-3 bg-dark-900 flex justify-between items-center">
                      <div>
                        <p className="text-text-muted text-xs">Claiming Pool Winnings</p>
                        <p className="text-yes text-lg font-mono">0.3% of payout</p>
                      </div>
                      <div className="text-right">
                        <p className="text-text-muted text-xs">goes to</p>
                        <p className="text-cyber text-sm font-bold">Treasury</p>
                      </div>
                    </div>
                    
                    {/* Proposer Bond */}
                    <div className="p-3 bg-dark-900 flex justify-between items-center">
                      <div>
                        <p className="text-text-muted text-xs">Proposer Bond (on deposit)</p>
                        <p className="text-yellow-500 text-lg font-mono">0.3% of amount sent</p>
                      </div>
                      <div className="text-right">
                        <p className="text-text-muted text-xs">goes to</p>
                        <p className="text-cyber text-sm font-bold">Treasury</p>
                      </div>
                    </div>
                    
                    {/* Disputer Bond */}
                    <div className="p-3 bg-dark-900 flex justify-between items-center">
                      <div>
                        <p className="text-text-muted text-xs">Disputer Bond (on deposit)</p>
                        <p className="text-no text-lg font-mono">0.3% of amount sent</p>
                      </div>
                      <div className="text-right">
                        <p className="text-text-muted text-xs">goes to</p>
                        <p className="text-cyber text-sm font-bold">Treasury</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Example calculation */}
                  <div className="mt-3 p-3 bg-dark-900/50 border border-dark-600">
                    <p className="text-white text-xs font-bold mb-2">Example: Proposing with 0.01 BNB required bond</p>
                    <ul className="text-text-secondary text-xs space-y-1">
                      <li>• Required bond: <span className="text-white font-mono">0.01 BNB</span></li>
                      <li>• You must send: <span className="text-white font-mono">~0.01003 BNB</span> (so bond after fee ≥ 0.01)</li>
                      <li>• 0.3% fee taken: <span className="text-cyber font-mono">~0.00003 BNB</span> → Treasury</li>
                      <li>• Bond stored on-chain: <span className="text-yes font-mono">0.01 BNB</span></li>
                    </ul>
                    <p className="text-text-muted text-xs mt-2 border-t border-dark-600 pt-2">
                      If you win, you receive the <strong className="text-white">stored bond amount</strong> (0.01 BNB) plus 50% of the loser's stored bond. 
                      <strong className="text-yes"> No additional fee on withdrawal.</strong>
                    </p>
                  </div>
                  
                  {/* NO FEE items */}
                  <div className="mt-3 p-3 bg-yes/10 border border-yes/30">
                    <p className="text-yes text-xs font-bold mb-2">NO 0.3% FEE ON:</p>
                    <ul className="text-text-secondary text-xs space-y-1">
                      <li>• <strong className="text-white">Bond Withdrawals</strong> - When you withdraw your bond winnings (fee was already paid on deposit)</li>
                      <li>• <strong className="text-white">Jury Fee Claims</strong> - Voters get 100% of their proportional share from the loser's bond</li>
                      <li>• <strong className="text-white">Creator Fee Withdrawals</strong> - Market creators get 100% of accumulated fees</li>
                    </ul>
                  </div>
                  
                  {/* Important clarification */}
                  <div className="mt-3 p-3 bg-warning/10 border border-warning/30">
                    <p className="text-warning text-xs font-bold mb-1">IMPORTANT: Resolution Fee ≠ Jury Fees</p>
                    <p className="text-text-secondary text-xs">
                      The <strong className="text-white">0.3% resolution fee</strong> is a protocol fee that goes to the <strong className="text-cyber">Treasury</strong>. 
                      <strong className="text-no"> Completely separate</strong> from jury fees earned by voters during disputed resolution.
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

              <div className="flex items-center gap-4 p-4 bg-dark-800 border border-orange-500/30">
                <div className="w-8 h-8 bg-dark-900 rounded flex items-center justify-center text-orange-400 font-bold">⚠</div>
                <div>
                  <p className="text-orange-400 font-bold">2-Hour Proposal Cutoff (22h+ after expiry)</p>
                  <p className="text-text-secondary text-sm">
                    No new proposals allowed. <strong className="text-white">Disputes still allowed</strong> within 30min of any existing proposal. 
                    Ensures resolution completes before emergency refund.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ===== ONE-SIDED MARKETS ===== */}
          <section>
            <h2 className="text-2xl font-black text-white border-l-4 border-warning pl-4 mb-6">
              ONE-SIDED MARKETS
            </h2>
            
            <div className="bg-warning/10 border-2 border-warning p-6 mb-6">
              <p className="text-warning font-black text-lg mb-4">WHAT IS A ONE-SIDED MARKET?</p>
              
              <div className="space-y-4 text-sm">
                <p className="text-text-secondary">
                  A <strong className="text-warning">one-sided market</strong> occurs when only one outcome has holders. For example:
                </p>
                <ul className="list-disc list-inside space-y-2 text-text-secondary">
                  <li>Everyone bought <span className="text-yes">YES</span> shares, nobody holds <span className="text-no">NO</span></li>
                  <li>Everyone bought <span className="text-no">NO</span> shares, nobody holds <span className="text-yes">YES</span></li>
                  <li>Everyone sold all their shares (both sides empty)</li>
                </ul>
                
                <div className="bg-dark-900/50 p-4 border border-dark-600 mt-4">
                  <p className="text-white font-bold mb-2">Why is this a problem?</p>
                  <p className="text-text-secondary">
                    If only YES holders exist and YES wins → who pays them? There are no losers to fund the winners!
                    The pool has BNB from YES buyers, but there's no "other side" to lose their stake.
                  </p>
                </div>

                <div className="bg-no/10 p-4 border border-no mt-4">
                  <p className="text-no font-bold mb-2">⚠️ ONE-SIDED MARKETS CANNOT BE RESOLVED</p>
                  <p className="text-text-secondary">
                    The smart contract <strong className="text-white">blocks proposals</strong> on one-sided markets. 
                    Nobody can propose an outcome because there's no fair way to resolve it.
                  </p>
                  <p className="text-text-secondary mt-2">
                    <strong className="text-cyber">Solution:</strong> Wait 24 hours after expiry and claim your <strong className="text-white">emergency refund</strong>. 
                    You'll get back your proportional share of the pool.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ===== EMERGENCY REFUND ===== */}
          <section>
            <h2 className="text-2xl font-black text-white border-l-4 border-no pl-4 mb-6">
              EMERGENCY REFUND
            </h2>
            
            <div className="bg-no/10 border-2 border-no p-6 mb-6">
              <p className="text-no font-black text-lg mb-4">WHEN MARKETS CAN'T BE RESOLVED</p>
              
              <div className="space-y-4 text-sm">
                <p className="text-text-secondary">
                  Sometimes a market cannot be resolved normally. In these cases, an <strong className="text-no">emergency refund</strong> becomes 
                  available <strong className="text-white">24 hours after market expiry</strong>.
                </p>

                <div className="bg-dark-900/50 p-4 border border-dark-600">
                  <p className="text-white font-bold mb-3">Emergency Refund Triggers:</p>
                  <ol className="list-decimal list-inside space-y-3 text-text-secondary">
                    <li>
                      <strong className="text-warning">No Proposal Submitted</strong>
                      <p className="ml-6 text-xs text-text-muted mt-1">
                        24+ hours passed after expiry and nobody proposed an outcome. Market is stuck.
                      </p>
                    </li>
                    <li>
                      <strong className="text-warning">One-Sided Market</strong>
                      <p className="ml-6 text-xs text-text-muted mt-1">
                        Only YES or only NO holders exist. Proposals are blocked, emergency refund is the only option.
                      </p>
                    </li>
                    <li>
                      <strong className="text-warning">Voting Tie (50/50)</strong>
                      <p className="ml-6 text-xs text-text-muted mt-1">
                        Dispute vote ended in exact tie. Both bonds returned, market stays unresolved.
                      </p>
                    </li>
                    <li>
                      <strong className="text-warning">Contract Paused (Emergency)</strong>
                      <p className="ml-6 text-xs text-text-muted mt-1">
                        If admins pause the contract due to a critical issue, emergency refunds become available as an escape hatch.
                      </p>
                    </li>
                  </ol>
                </div>

                <div className="bg-cyber/10 p-4 border border-cyber mt-4">
                  <p className="text-cyber font-bold mb-2">HOW EMERGENCY REFUND WORKS</p>
                  <div className="font-mono text-xs bg-dark-900/50 p-3 mb-3">
                    Your Refund = (Your Total Shares / All Shares) × Pool Balance
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-text-secondary text-xs">
                    <li>Your total shares = YES shares + NO shares combined</li>
                    <li>Refund is <strong className="text-white">proportional</strong> to your position</li>
                    <li>Fees already taken are <strong className="text-no">not refunded</strong></li>
                    <li>You can only claim emergency refund <strong className="text-white">once per market</strong></li>
                  </ul>
                </div>

                {/* CRITICAL WARNING: Refund based on shares, not amount paid */}
                <div className="bg-warning/20 p-4 border-2 border-warning mt-4">
                  <p className="text-warning font-black mb-3 flex items-center gap-2">
                    ⚠️ CRITICAL: REFUNDS ARE BASED ON SHARES, NOT AMOUNT PAID
                  </p>
                  <p className="text-text-secondary text-sm mb-4">
                    Due to the <strong className="text-white">bonding curve</strong>, early buyers pay less per share than late buyers.
                    However, refunds are calculated based on <strong className="text-warning">share count</strong>, not how much BNB you invested.
                  </p>
                  
                  <div className="bg-dark-900/70 p-4 border border-dark-600 mb-4">
                    <p className="text-white font-bold mb-3 text-sm">Example: Why Late Buyers Can Lose on Refund</p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs font-mono">
                        <thead>
                          <tr className="border-b border-dark-600">
                            <th className="text-left p-2 text-text-muted">Trader</th>
                            <th className="text-right p-2 text-text-muted">Shares</th>
                            <th className="text-right p-2 text-text-muted">Paid</th>
                            <th className="text-right p-2 text-text-muted">Refund</th>
                            <th className="text-right p-2 text-text-muted">Net P&L</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-dark-700">
                            <td className="p-2 text-white">Alice <span className="text-text-muted">(early)</span></td>
                            <td className="p-2 text-yes text-right">100</td>
                            <td className="p-2 text-right">1.0 BNB</td>
                            <td className="p-2 text-cyber text-right">1.8 BNB</td>
                            <td className="p-2 text-yes text-right font-bold">+0.8 BNB</td>
                          </tr>
                          <tr>
                            <td className="p-2 text-white">Bob <span className="text-text-muted">(late)</span></td>
                            <td className="p-2 text-yes text-right">50</td>
                            <td className="p-2 text-right">2.0 BNB</td>
                            <td className="p-2 text-cyber text-right">0.9 BNB</td>
                            <td className="p-2 text-no text-right font-bold">-1.1 BNB</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <p className="text-text-muted text-xs mt-3">
                      Pool: ~2.7 BNB (after fees). Alice owns 66.7% of shares → gets 66.7% of pool.
                      Bob owns 33.3% → gets 33.3%. Bob paid MORE but gets LESS because he has fewer shares.
                    </p>
                  </div>

                  <div className="space-y-2 text-xs">
                    <p className="text-white font-bold">Why does this happen?</p>
                    <ul className="list-disc list-inside space-y-1 text-text-secondary">
                      <li><strong className="text-cyber">Bonding curve:</strong> Early buyers get shares cheaper, late buyers pay more per share</li>
                      <li><strong className="text-cyber">Share-based refund:</strong> The contract only knows how many shares you own, not what you paid</li>
                      <li><strong className="text-cyber">Early risk premium:</strong> Early buyers took more risk when liquidity was low</li>
                    </ul>
                  </div>

                  <div className="bg-dark-800 p-3 mt-4 border border-dark-600">
                    <p className="text-cyber font-bold text-xs mb-2">💡 PRO TIP: Minimize Refund Risk</p>
                    <ul className="list-disc list-inside space-y-1 text-text-muted text-xs">
                      <li>Avoid buying into <strong className="text-warning">one-sided markets</strong> (99%+ on one side) - high cancellation risk</li>
                      <li>Check <strong className="text-white">market activity</strong> before buying at high prices</li>
                      <li>Consider <strong className="text-white">selling before deadline</strong> if you're unsure about resolution</li>
                      <li>The <strong className="text-white">earlier you buy</strong>, the better your refund ratio if cancelled</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-dark-900/50 p-4 border border-dark-600 mt-4">
                  <p className="text-white font-bold mb-2">Basic Example (Equal Share Prices):</p>
                  <div className="text-text-secondary space-y-2 text-xs">
                    <p>Market expired 24+ hours ago with no proposal. Pool has <span className="text-cyber">5 BNB</span>.</p>
                    <p>Total shares in market: <span className="text-white">500 YES + 300 NO = 800 total</span></p>
                    <div className="mt-3 space-y-1">
                      <p>• Alice holds <span className="text-yes">200 YES</span> → Refund: 5 × (200/800) = <span className="text-cyber">1.25 BNB</span></p>
                      <p>• Bob holds <span className="text-yes">100 YES</span> + <span className="text-no">100 NO</span> → Refund: 5 × (200/800) = <span className="text-cyber">1.25 BNB</span></p>
                      <p>• Carol holds <span className="text-no">200 NO</span> → Refund: 5 × (200/800) = <span className="text-cyber">1.25 BNB</span></p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ===== FINALIZATION ===== */}
          <section>
            <h2 className="text-2xl font-black text-white border-l-4 border-yes pl-4 mb-6">
              FINALIZATION PROCESS
            </h2>
            
            <div className="bg-yes/10 border-2 border-yes p-6 mb-6">
              <p className="text-yes font-black text-lg mb-4">HOW MARKETS GET FINALIZED</p>
              
              <div className="space-y-4 text-sm">
                <p className="text-text-secondary">
                  After a proposal is submitted (and optionally disputed/voted), someone must call <strong className="text-white">Finalize</strong> to 
                  officially resolve the market and enable claims.
                </p>

                <div className="bg-dark-900/50 p-4 border border-dark-600">
                  <p className="text-white font-bold mb-3">Finalization Scenarios:</p>
                  
                  <div className="space-y-4">
                    {/* Scenario 1: No Dispute */}
                    <div className="p-3 bg-dark-800 border-l-4 border-yes">
                      <p className="text-yes font-bold text-xs mb-1">SCENARIO 1: No Dispute</p>
                      <p className="text-text-secondary text-xs">
                        Proposal submitted → 30 minutes pass with no dispute → <strong className="text-white">Anyone can finalize</strong>
                      </p>
                      <ul className="list-disc list-inside text-text-muted text-xs mt-2 space-y-1">
                        <li>Market resolves to the proposed outcome</li>
                        <li>Proposer gets bond back + 0.5% reward</li>
                        <li>Winners can now claim their payouts</li>
                      </ul>
                    </div>

                    {/* Scenario 2: Disputed - Proposer Wins */}
                    <div className="p-3 bg-dark-800 border-l-4 border-cyber">
                      <p className="text-cyber font-bold text-xs mb-1">SCENARIO 2: Disputed → Proposer Wins Vote</p>
                      <p className="text-text-secondary text-xs">
                        Proposal disputed → 1-hour voting → Proposer gets more votes → <strong className="text-white">Anyone can finalize</strong>
                      </p>
                      <ul className="list-disc list-inside text-text-muted text-xs mt-2 space-y-1">
                        <li>Market resolves to <strong>original proposal</strong></li>
                        <li>Proposer gets bond + 50% of disputer's bond + 0.5% reward</li>
                        <li>Disputer loses entire bond</li>
                        <li>Winning voters split 50% of disputer's bond</li>
                      </ul>
                    </div>

                    {/* Scenario 3: Disputed - Disputer Wins */}
                    <div className="p-3 bg-dark-800 border-l-4 border-no">
                      <p className="text-no font-bold text-xs mb-1">SCENARIO 3: Disputed → Disputer Wins Vote</p>
                      <p className="text-text-secondary text-xs">
                        Proposal disputed → 1-hour voting → Disputer gets more votes → <strong className="text-white">Anyone can finalize</strong>
                      </p>
                      <ul className="list-disc list-inside text-text-muted text-xs mt-2 space-y-1">
                        <li>Market resolves to <strong>OPPOSITE</strong> of original proposal</li>
                        <li>Disputer gets bond + 50% of proposer's bond</li>
                        <li>Proposer loses entire bond (no reward)</li>
                        <li>Winning voters split 50% of proposer's bond</li>
                      </ul>
                    </div>

                    {/* Scenario 4: Tie Vote */}
                    <div className="p-3 bg-dark-800 border-l-4 border-warning">
                      <p className="text-warning font-bold text-xs mb-1">SCENARIO 4: Voting Tie (50/50)</p>
                      <p className="text-text-secondary text-xs">
                        Exact same votes on both sides → <strong className="text-white">Market NOT resolved</strong>
                      </p>
                      <ul className="list-disc list-inside text-text-muted text-xs mt-2 space-y-1">
                        <li>Both proposer and disputer get bonds returned</li>
                        <li>No jury fees distributed</li>
                        <li>Emergency refund becomes available after 24h from expiry</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-cyber/10 p-4 border border-cyber mt-4">
                  <p className="text-cyber font-bold mb-2">WHO CAN FINALIZE?</p>
                  <p className="text-text-secondary text-xs">
                    <strong className="text-white">Anyone</strong> can call finalize once the conditions are met (dispute window passed, or voting ended). 
                    The finalizer doesn't receive any special reward — it's a public service to complete the market.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ===== POOL LIQUIDITY & SELLING ===== */}
          <section>
            <h2 className="text-2xl font-black text-white border-l-4 border-purple-500 pl-4 mb-6">
              AMM MECHANICS & THE "FREE SHARES" PHENOMENON
            </h2>
            
            <div className="bg-purple-500/10 border-2 border-purple-500 p-6 mb-6">
              <p className="text-purple-400 font-black text-lg mb-4">HOW THE AMM ACTUALLY WORKS</p>
              
              <div className="space-y-4 text-sm">
                <p className="text-text-secondary">
                  JNGLZ uses an <strong className="text-purple-400">Automated Market Maker (AMM)</strong> with a bonding curve. 
                  This creates a unique property: <strong className="text-yes">you can often extract your entire investment 
                  AND still keep shares</strong>. This isn't a bug — it's how AMM math works.
                </p>

                {/* The Key Insight */}
                <div className="bg-yes/10 p-4 border-2 border-yes">
                  <p className="text-yes font-bold mb-2">🔑 THE KEY INSIGHT: PARTIAL SELL = FREE REMAINING SHARES</p>
                  <p className="text-text-secondary text-xs mb-3">
                    When you buy shares, you push the price UP. When you sell some back, you're selling at this 
                    <strong className="text-white"> higher price</strong>. The AMM pays you from the pool — often enough to 
                    recover your entire initial investment while leaving you with "free" shares.
                  </p>
                  <div className="bg-dark-900/70 p-3 border border-dark-600">
                    <p className="text-white font-bold text-xs mb-2">Real Example (Actual Trade History):</p>
                    <div className="font-mono text-xs space-y-1">
                      <p className="text-cyber">Step 1: BUY NO → 0.985 BNB → 197 shares</p>
                      <p className="text-warning">Step 2: SELL NO → 98.50 shares → 0.4875 BNB</p>
                      <p className="text-warning">Step 3: SELL NO → 98.01 shares → 0.4827 BNB</p>
                      <p className="border-t border-dark-600 pt-2 mt-2">
                        <span className="text-text-muted">Total sold:</span> <span className="text-white">196.51 shares</span> for <span className="text-yes">0.9702 BNB</span>
                      </p>
                      <p>
                        <span className="text-text-muted">Remaining:</span> <span className="text-yes">~0.49 shares</span> that cost you <span className="text-cyber">~0.015 BNB</span> (just the fees!)
                      </p>
                    </div>
                  </div>
                </div>

                {/* What This Means */}
                <div className="bg-cyber/10 p-4 border border-cyber mt-4">
                  <p className="text-cyber font-bold mb-2">WHAT THIS MEANS FOR YOU</p>
                  <p className="text-text-secondary text-xs mb-3">
                    After partial selling, your remaining shares are essentially <strong className="text-white">"house money"</strong>:
                  </p>
                  <ul className="list-disc list-inside text-text-secondary text-xs space-y-2">
                    <li>
                      <strong className="text-yes">If someone buys after you:</strong> Price goes up → 
                      sell your remaining shares for <strong className="text-yes">pure profit</strong>
                    </li>
                    <li>
                      <strong className="text-yes">If market resolves in your favor:</strong> Your "free" shares 
                      claim a portion of the <strong className="text-yes">entire losing side's BNB</strong>
                    </li>
                    <li>
                      <strong className="text-no">If market resolves against you:</strong> You only lose the 
                      <strong className="text-white"> ~1.5% trading fees</strong> you already paid
                    </li>
                  </ul>
                </div>

                {/* Why This Happens - Math */}
                <div className="bg-dark-900/50 p-4 border border-dark-600 mt-4">
                  <p className="text-white font-bold mb-2">Why Does This Happen? (The Math)</p>
                  <p className="text-text-secondary text-xs mb-3">
                    The bonding curve prices shares based on <strong className="text-white">current supply ratio</strong>, 
                    not your purchase history:
                  </p>
                  <div className="bg-dark-800 p-3 text-xs font-mono space-y-2">
                    <p className="text-text-muted">Fresh market at 50/50:</p>
                    <p>1. You buy 200 NO shares → Price rises to ~60% NO</p>
                    <p>2. You sell 100 shares at the <span className="text-yes">new higher price</span></p>
                    <p>3. Price drops back, but you already extracted value</p>
                    <p>4. Sell another 100 → Extract more value</p>
                    <p className="text-cyber mt-2">Result: You've drained most of your BNB back, but math says you still own shares!</p>
                  </div>
                </div>

                {/* Important Caveats */}
                <div className="bg-warning/10 p-4 border border-warning mt-4">
                  <p className="text-warning font-bold mb-2">⚠️ IMPORTANT CAVEATS</p>
                  <ul className="list-disc list-inside text-text-secondary text-xs space-y-2">
                    <li>
                      <strong className="text-white">Works best as first buyer:</strong> You push price up with no one 
                      ahead of you. Later buyers compete with existing supply.
                    </li>
                    <li>
                      <strong className="text-white">Fees are real:</strong> You pay 1.5% on every trade. 
                      The "free shares" cost you these fees.
                    </li>
                    <li>
                      <strong className="text-white">Someone else may do this too:</strong> If everyone tries this, 
                      no one has an edge. It's an opportunity, not a guarantee.
                    </li>
                  </ul>
                </div>

                {/* Heat Level Reality Check */}
                <div className="bg-purple-500/10 p-4 border-2 border-purple-500 mt-4">
                  <p className="text-purple-400 font-bold mb-2">🌡️ HEAT LEVEL REALITY CHECK</p>
                  <p className="text-text-secondary text-xs mb-3">
                    This "free shares" phenomenon <strong className="text-warning">entirely depends on the heat level</strong>. 
                    The effect is dramatic in low vLiq markets but nearly impossible in high vLiq markets:
                  </p>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-start gap-2 p-2 bg-dark-900/50 border border-no/30">
                      <span className="text-no font-bold">DEGEN FLASH (vLiq=50):</span>
                      <span className="text-text-secondary">1 BNB moves price ~33%. Easy to extract value. <span className="text-yes">Best opportunity.</span></span>
                    </div>
                    <div className="flex items-start gap-2 p-2 bg-dark-900/50 border border-yellow-500/30">
                      <span className="text-yellow-500 font-bold">STREET FIGHT (vLiq=200):</span>
                      <span className="text-text-secondary">1 BNB moves price ~16%. Still possible with decent capital.</span>
                    </div>
                    <div className="flex items-start gap-2 p-2 bg-dark-900/50 border border-blue-400/30">
                      <span className="text-blue-400 font-bold">INSTITUTION (vLiq=2000):</span>
                      <span className="text-text-secondary">1 BNB moves price ~2%. Need 10+ BNB to see meaningful effect.</span>
                    </div>
                    <div className="flex items-start gap-2 p-2 bg-dark-900/50 border border-purple-400/30">
                      <span className="text-purple-400 font-bold">DEEP SPACE (vLiq=10000):</span>
                      <span className="text-text-secondary">1 BNB moves price &lt;1%. <span className="text-no">Requires massive capital. Not worth the risk.</span></span>
                    </div>
                  </div>
                  <div className="mt-3 p-2 bg-dark-900/70 border border-dark-600">
                    <p className="text-text-muted text-xs">
                      <strong className="text-warning">Bottom line:</strong> In most markets, this strategy isn't worth actively pursuing. 
                      The risk vs. reward rarely makes sense unless you're in a <span className="text-no">DEGEN FLASH</span> market 
                      and happen to be first. Some traders may get lucky, but don't count on it as a reliable strategy.
                    </p>
                  </div>
                </div>

                {/* Pool Solvency */}
                <div className="bg-dark-900/50 p-4 border border-dark-600 mt-4">
                  <p className="text-white font-bold mb-2">Pool Solvency</p>
                  <p className="text-text-secondary text-xs mb-2">
                    The contract includes an <strong className="text-white">InsufficientPoolBalance</strong> safety check. 
                    If the pool can't afford your payout, the transaction reverts safely. Options:
                  </p>
                  <ul className="list-disc list-inside text-text-muted text-xs space-y-1">
                    <li><strong className="text-white">Wait for others to buy</strong> — any buy (YES or NO) adds BNB to the pool</li>
                    <li><strong className="text-white">Hold until resolution</strong> — if your side wins, claim from the full pool</li>
                    <li><strong className="text-white">Emergency refund</strong> — proportional refund available 24h after expiry</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>
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

          {/* ===== EDGE CASES & CONFUSING P/L ===== */}
          <section>
            <h2 className="text-2xl font-black text-white border-l-4 border-warning pl-4 mb-6">
              EDGE CASES & CONFUSING P/L SCENARIOS
            </h2>
            
            <div className="bg-warning/10 border-2 border-warning p-6 mb-6">
              <p className="text-warning font-black text-lg mb-4">WHEN WINNING DOESN'T FEEL LIKE WINNING</p>
              
              <div className="space-y-6 text-sm">
                <p className="text-text-secondary">
                  Sometimes the P/L math can be confusing. Here are edge cases that might seem like bugs but are 
                  actually <strong className="text-white">how AMM markets work</strong>.
                </p>

                {/* Edge Case 1: Empty Pool Winner */}
                <div className="bg-dark-900/50 p-5 border border-warning">
                  <p className="text-warning font-bold mb-3 flex items-center gap-2">
                    ⚠️ EDGE CASE: "I WON BUT GOT 0 BNB!"
                  </p>
                  
                  <div className="space-y-4">
                    <div className="bg-dark-800 p-4 border border-dark-600">
                      <p className="text-white font-bold mb-2">The Scenario:</p>
                      <div className="text-text-secondary text-xs space-y-1">
                        <p>1. You buy 100 YES shares for 0.5 BNB</p>
                        <p>2. Another trader sells ALL their shares before resolution</p>
                        <p>3. Pool is now nearly empty (0 BNB)</p>
                        <p>4. Market resolves <span className="text-yes font-bold">YES</span> — you won!</p>
                        <p>5. You claim... and receive <span className="text-no font-bold">0 BNB</span></p>
                      </div>
                    </div>

                    <div className="bg-dark-800 p-4 border border-dark-600">
                      <p className="text-white font-bold mb-2">Why This Happens:</p>
                      <p className="text-text-secondary text-xs mb-3">
                        The payout formula is: <span className="text-cyber font-mono">(Your Shares / Total Winning Shares) × Pool Balance</span>
                      </p>
                      <p className="text-text-secondary text-xs">
                        If the pool has <strong className="text-white">0 BNB</strong>, then:
                      </p>
                      <div className="bg-dark-900 p-2 font-mono text-xs mt-2">
                        <p className="text-no">Payout = (100 / 100) × 0 = <span className="text-no font-bold">0 BNB</span></p>
                      </div>
                      <p className="text-text-muted text-xs mt-2">
                        You "won" the prediction, but there's nothing in the pool to pay you!
                      </p>
                    </div>

                    <div className="bg-dark-800 p-4 border border-dark-600">
                      <p className="text-white font-bold mb-2">Your P/L Breakdown:</p>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs font-mono">
                          <tbody>
                            <tr className="border-b border-dark-700">
                              <td className="p-2 text-text-muted">Cost basis (what you paid):</td>
                              <td className="p-2 text-white text-right">0.5 BNB</td>
                            </tr>
                            <tr className="border-b border-dark-700">
                              <td className="p-2 text-text-muted">Amount claimed:</td>
                              <td className="p-2 text-white text-right">0 BNB</td>
                            </tr>
                            <tr className="bg-no/10">
                              <td className="p-2 text-no font-bold">Resolution P/L:</td>
                              <td className="p-2 text-no text-right font-bold">-0.5 BNB</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      <p className="text-text-muted text-xs mt-3">
                        Your P/L shows a <span className="text-no">loss</span> because you invested 0.5 BNB and got 0 BNB back — 
                        even though you "won" the prediction.
                      </p>
                    </div>

                    <div className="bg-cyber/10 p-4 border border-cyber">
                      <p className="text-cyber font-bold mb-2">Where Did Your BNB Go?</p>
                      <p className="text-text-secondary text-xs">
                        When you bought shares, your BNB went <strong className="text-white">into the pool</strong>. 
                        When others <strong className="text-white">sold their shares before you</strong>, they took BNB 
                        <strong className="text-white"> out of the pool</strong>. The sellers got your money — 
                        not because of any bug, but because AMM sells are paid from the pool.
                      </p>
                    </div>

                    <div className="bg-yes/10 p-4 border border-yes">
                      <p className="text-yes font-bold mb-2">💡 How to Avoid This</p>
                      <ul className="list-disc list-inside text-text-secondary text-xs space-y-1">
                        <li><strong className="text-white">Check pool balance</strong> before holding to resolution</li>
                        <li><strong className="text-white">Sell some shares yourself</strong> while the pool has liquidity</li>
                        <li><strong className="text-white">Don't be the last holder</strong> — if everyone sells, you're left holding worthless claims</li>
                        <li><strong className="text-white">Trading P/L matters too</strong> — you can profit from selling even if resolution pays nothing</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Edge Case 2: Negative P/L Despite Winning */}
                <div className="bg-dark-900/50 p-5 border border-dark-600">
                  <p className="text-white font-bold mb-3 flex items-center gap-2">
                    📊 UNDERSTANDING YOUR P/L
                  </p>
                  
                  <div className="space-y-3 text-xs text-text-secondary">
                    <p>
                      Your <strong className="text-white">Total P/L</strong> in JNGLZ has two parts:
                    </p>
                    
                    <div className="grid md:grid-cols-2 gap-3">
                      <div className="p-3 bg-dark-800 border border-cyber/30">
                        <p className="text-cyber font-bold mb-1">Trading P/L</p>
                        <p>Profit/loss from buying low and selling high (or vice versa) <strong className="text-white">before resolution</strong>.</p>
                        <p className="text-text-muted mt-1 text-xs">Formula: BNB received from sells - cost basis of shares sold</p>
                      </div>
                      <div className="p-3 bg-dark-800 border border-yes/30">
                        <p className="text-yes font-bold mb-1">Resolution P/L</p>
                        <p>Profit/loss from <strong className="text-white">claiming after market resolves</strong>.</p>
                        <p className="text-text-muted mt-1 text-xs">Formula: Amount claimed - remaining cost basis</p>
                      </div>
                    </div>

                    <div className="bg-dark-800 p-3 border border-dark-600 mt-2">
                      <p className="text-white font-bold mb-2">Total P/L = Trading P/L + Resolution P/L</p>
                      <p className="text-text-muted">
                        You can have positive Trading P/L but negative Resolution P/L (or vice versa). 
                        What matters is the <strong className="text-white">total</strong>.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Key Takeaway */}
                <div className="bg-dark-800 p-4 border border-dark-600">
                  <p className="text-cyber font-bold mb-2">🎯 KEY TAKEAWAY</p>
                  <p className="text-text-secondary text-sm">
                    In an AMM, <strong className="text-white">"winning" the prediction doesn't guarantee profit</strong>. 
                    The pool is a shared resource — if others drain it before resolution, there may be nothing left to claim.
                    Always consider <strong className="text-white">taking profits via selling</strong> rather than waiting for resolution, 
                    especially if you see the pool balance dropping.
                  </p>
                </div>
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
