/**
 * ===== TRADE PANEL COMPONENT =====
 *
 * Trading interface for buying/selling YES/NO shares.
 * Uses actual contract calls via wagmi hooks.
 * Includes slippage protection (default 1%).
 *
 * @module features/markets/components/TradePanel
 */

import { useState, useEffect, useMemo } from 'react';
import { useAccount, useBalance } from 'wagmi';
import { useQueryClient } from '@tanstack/react-query';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { parseEther, formatEther } from 'viem';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Spinner } from '@/shared/components/ui/Spinner';
import { SlippageSettings, useSlippage, applySlippage } from '@/shared/components/SlippageSettings';
import { useChainValidation } from '@/shared/hooks/useChainValidation';
import { useToast } from '@/shared/components/ui/Toast';
import {
  useBuyYes,
  useBuyNo,
  useSellYes,
  useSellNo,
  usePreviewBuy,
  usePreviewSell,
  usePosition,
  useMaxSellableShares,
} from '@/shared/hooks';
import { cn } from '@/shared/utils/cn';
import { formatBNB, formatShares } from '@/shared/utils/format';
import type { Market } from '@/shared/schemas';

interface TradePanelProps {
  market: Market;
  yesPercent: number;
  noPercent: number;
  isActive: boolean;
  onTradeSuccess?: () => void;
}

type TradeDirection = 'yes' | 'no';
type TradeAction = 'buy' | 'sell';

// Quick amount presets for buying (BNB)
const BUY_PRESETS = ['0.01', '0.05', '0.1', '0.5'];

export function TradePanel({ market, yesPercent, noPercent, isActive, onTradeSuccess }: TradePanelProps) {
  const { isConnected, address } = useAccount();
  const { canTrade, isWrongNetwork } = useChainValidation();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  
  // Slippage settings (default 1%)
  const { slippageBps, slippagePercent } = useSlippage();
  
  // User's BNB balance
  const { data: balanceData, refetch: refetchBalance } = useBalance({ address });
  
  // User's position in this market
  const marketId = BigInt(market.marketId);
  const { position, refetch: refetchPosition } = usePosition(marketId, address);
  
  const [direction, setDirection] = useState<TradeDirection>('yes');
  const [action, setAction] = useState<TradeAction>('buy');
  const [amount, setAmount] = useState('');

  // Reset form and invalidate cached data when wallet changes
  useEffect(() => {
    // Reset form state
    setAmount('');
    setAction('buy');
    // Invalidate all contract reads to ensure fresh data for new wallet
    queryClient.invalidateQueries({ queryKey: ['readContract'] });
  }, [address, queryClient]);

  // Parse amount for contract calls
  const amountWei = useMemo(() => {
    try {
      const parsed = parseFloat(amount);
      if (isNaN(parsed) || parsed <= 0) return 0n;
      return parseEther(amount);
    } catch {
      return 0n;
    }
  }, [amount]);

  // Preview hooks for estimated output
  const { data: previewBuyData } = usePreviewBuy(
    marketId,
    action === 'buy' ? amountWei : undefined,
    direction === 'yes'
  );

  const { data: previewSellData } = usePreviewSell(
    marketId,
    action === 'sell' ? amountWei : undefined, // shares in 1e18
    direction === 'yes'
  );

  // Contract write hooks
  const { buyYes, isPending: isBuyingYes, isConfirming: isConfirmingBuyYes, isSuccess: isBuyYesSuccess, reset: resetBuyYes } = useBuyYes();
  const { buyNo, isPending: isBuyingNo, isConfirming: isConfirmingBuyNo, isSuccess: isBuyNoSuccess, reset: resetBuyNo } = useBuyNo();
  const { sellYes, isPending: isSellingYes, isConfirming: isConfirmingSellYes, isSuccess: isSellYesSuccess, reset: resetSellYes } = useSellYes();
  const { sellNo, isPending: isSellingNo, isConfirming: isConfirmingSellNo, isSuccess: isSellNoSuccess, reset: resetSellNo } = useSellNo();

  const isPending = isBuyingYes || isBuyingNo || isSellingYes || isSellingNo;
  const isConfirming = isConfirmingBuyYes || isConfirmingBuyNo || isConfirmingSellYes || isConfirmingSellNo;
  const isSuccess = isBuyYesSuccess || isBuyNoSuccess || isSellYesSuccess || isSellNoSuccess;
  const isLoading = isPending || isConfirming;

  // Get user's shares for sell mode
  const userYesShares = position?.yesShares || 0n;
  const userNoShares = position?.noShares || 0n;
  const currentShares = direction === 'yes' ? userYesShares : userNoShares;

  // Market share supplies (for payout calculations)
  const totalYesShares = BigInt(market.yesShares || '0');
  const totalNoShares = BigInt(market.noShares || '0');
  const poolBalance = BigInt(market.poolBalance || '0');

  // Get max sellable shares from contract (respects pool liquidity limits)
  const { maxShares: maxSellableYes, refetch: refetchMaxSellableYes } = useMaxSellableShares(marketId, userYesShares, true);
  const { maxShares: maxSellableNo, refetch: refetchMaxSellableNo } = useMaxSellableShares(marketId, userNoShares, false);
  
  const maxSellableShares = direction === 'yes' ? maxSellableYes : maxSellableNo;

  // Check if pool liquidity limits selling all shares
  const isPoolLimited = useMemo(() => {
    if (currentShares === 0n || maxSellableShares === undefined) return false;
    return maxSellableShares < currentShares;
  }, [currentShares, maxSellableShares]);

  // Check if selling ALL shares (true full position exit)
  const isSellAll = useMemo(() => {
    if (action !== 'sell' || !amount || currentShares === 0n) return false;
    try {
      const sharesToSell = parseEther(amount);
      // Only true when selling entire position (not just pool max)
      return sharesToSell >= currentShares;
    } catch {
      return false;
    }
  }, [action, amount, currentShares]);

  // Check if selling pool maximum (when pool-limited and selling max possible)
  const isSellingPoolMax = useMemo(() => {
    if (action !== 'sell' || !amount || !isPoolLimited || maxSellableShares === undefined) return false;
    try {
      const sharesToSell = parseEther(amount);
      // True when selling the pool max but NOT the full position
      return sharesToSell >= maxSellableShares && sharesToSell < currentShares;
    } catch {
      return false;
    }
  }, [action, amount, isPoolLimited, maxSellableShares, currentShares]);

  // Reset form on success
  useEffect(() => {
    if (isSuccess) {
      // Show success toast
      showToast('Trade successful!', 'success');
      setAmount('');
      // Refetch position after successful trade (maxSellable will auto-update via position effect below)
      refetchPosition();
      // Refetch user's BNB balance (local)
      refetchBalance();
      // Invalidate ALL balance queries so Header/other components update too
      queryClient.invalidateQueries({ queryKey: ['balance'] });
      // Invalidate ALL readContract queries to ensure fresh data
      // This ensures maxSellable queries with new args get fresh results
      queryClient.invalidateQueries({ queryKey: ['readContract'] });
      // Trigger market data refetch for instant UI update
      onTradeSuccess?.();
      // Reset all write hooks immediately (no delay needed since we use toast)
      resetBuyYes();
      resetBuyNo();
      resetSellYes();
      resetSellNo();
    }
  }, [isSuccess, resetBuyYes, resetBuyNo, resetSellYes, resetSellNo, onTradeSuccess, refetchPosition, refetchBalance, queryClient, showToast]);

  // Re-fetch maxSellable shares when position changes
  // This ensures correct data after trades (position args change → new query needs fetching)
  useEffect(() => {
    if (userYesShares > 0n) {
      refetchMaxSellableYes();
    }
    if (userNoShares > 0n) {
      refetchMaxSellableNo();
    }
  }, [userYesShares, userNoShares, refetchMaxSellableYes, refetchMaxSellableNo]);

  // Calculate estimated output
  const estimatedOutput = useMemo(() => {
    if (action === 'buy' && previewBuyData) {
      return formatShares(previewBuyData as bigint);
    }
    if (action === 'sell' && previewSellData) {
      // Use 6 decimals for sell estimates to show precise values
      return `${formatBNB(previewSellData as bigint, 6)} BNB`;
    }
    return '0';
  }, [action, previewBuyData, previewSellData]);

  // Calculate "If wins now" payout for existing position
  const existingPositionPayout = useMemo(() => {
    // Calculate for YES position
    const yesPayout = userYesShares > 0n && totalYesShares > 0n && poolBalance > 0n
      ? (userYesShares * poolBalance) / totalYesShares
      : 0n;
    
    // Calculate for NO position
    const noPayout = userNoShares > 0n && totalNoShares > 0n && poolBalance > 0n
      ? (userNoShares * poolBalance) / totalNoShares
      : 0n;

    return {
      yesPayout,
      noPayout,
    };
  }, [userYesShares, userNoShares, totalYesShares, totalNoShares, poolBalance]);

  // Calculate "If wins now" payout for buy preview
  const buyPreviewPayout = useMemo(() => {
    if (action !== 'buy' || !previewBuyData || amountWei === 0n) return null;
    
    const newShares = previewBuyData as bigint;
    const newPoolBalance = poolBalance + amountWei;
    
    if (direction === 'yes') {
      const newTotalYesShares = totalYesShares + newShares;
      const totalUserYesShares = userYesShares + newShares;
      
      if (newTotalYesShares === 0n) return null;
      
      const payout = (totalUserYesShares * newPoolBalance) / newTotalYesShares;
      // Multiplier based on current buy amount only
      const multiplier = amountWei > 0n ? Number(payout * 100n / amountWei) / 100 : 0;
      
      return { payout, multiplier };
    } else {
      const newTotalNoShares = totalNoShares + newShares;
      const totalUserNoShares = userNoShares + newShares;
      
      if (newTotalNoShares === 0n) return null;
      
      const payout = (totalUserNoShares * newPoolBalance) / newTotalNoShares;
      // Multiplier based on current buy amount only
      const multiplier = amountWei > 0n ? Number(payout * 100n / amountWei) / 100 : 0;
      
      return { payout, multiplier };
    }
  }, [action, previewBuyData, amountWei, direction, poolBalance, totalYesShares, totalNoShares, userYesShares, userNoShares]);

  // Sell preset buttons (25%, 50%, 75%, MAX) - use maxSellableShares to respect pool limits
  const sellPresets = useMemo(() => {
    // Use maxSellableShares if available (respects pool liquidity), otherwise fall back to user shares
    const effectiveMax = maxSellableShares !== undefined ? maxSellableShares : currentShares;
    if (effectiveMax === 0n) return [];
    return [
      { label: '25%', shares: effectiveMax / 4n },
      { label: '50%', shares: effectiveMax / 2n },
      { label: '75%', shares: (effectiveMax * 3n) / 4n },
      { label: 'MAX', shares: effectiveMax },
    ];
  }, [currentShares, maxSellableShares]);

  const handleTrade = async () => {
    if (!canTrade || !amount) return;
    
    if (action === 'buy') {
      // Calculate minSharesOut with slippage protection
      const expectedShares = previewBuyData as bigint | undefined;
      const minSharesOut = expectedShares ? applySlippage(expectedShares, slippageBps) : 0n;
      
      if (direction === 'yes') {
        await buyYes({ marketId, amount, minSharesOut });
      } else {
        await buyNo({ marketId, amount, minSharesOut });
      }
    } else {
      // Sell - amount is in shares (need to convert to 1e18)
      const sharesToSell = parseEther(amount);
      // Calculate minBnbOut with slippage protection
      const expectedBnb = previewSellData as bigint | undefined;
      const minBnbOut = expectedBnb ? applySlippage(expectedBnb, slippageBps) : 0n;
      
      if (direction === 'yes') {
        await sellYes({ marketId, shares: sharesToSell, minBnbOut });
      } else {
        await sellNo({ marketId, shares: sharesToSell, minBnbOut });
      }
    }
  };

  // Not connected state
  if (!isConnected) {
    return (
      <div className="border border-dark-600 bg-dark-900 p-6">
        <h3 className="font-bold uppercase mb-4 text-center">TRADE</h3>
        <p className="text-text-secondary text-sm text-center mb-4">
          Connect your wallet to trade
        </p>
        <div className="flex justify-center">
          <ConnectButton.Custom>
            {({ openConnectModal }) => (
              <Button variant="cyber" onClick={openConnectModal}>
                CONNECT WALLET
              </Button>
            )}
          </ConnectButton.Custom>
        </div>
      </div>
    );
  }

  // Wrong network state
  if (isWrongNetwork) {
    return (
      <div className="border border-no bg-no/10 p-6">
        <h3 className="font-bold uppercase mb-4 text-center text-no">⚠️ WRONG NETWORK</h3>
        <p className="text-text-secondary text-sm text-center">
          Switch to BNB Chain to trade
        </p>
      </div>
    );
  }

  // Market not active
  if (!isActive) {
    return (
      <div className="border border-dark-600 bg-dark-900 p-6">
        <h3 className="font-bold uppercase mb-4 text-center">TRADING CLOSED</h3>
        <p className="text-text-secondary text-sm text-center">
          This market is no longer accepting trades
        </p>
      </div>
    );
  }

  return (
    <div className="border border-dark-600 bg-dark-900">
      {/* Header */}
      <div className="border-b border-dark-600 px-4 py-3 flex justify-between items-center">
        <h3 className="font-bold uppercase">TRADE</h3>
        <div className="flex items-center gap-2">
          {balanceData && (
            <span className="text-xs font-mono text-text-muted">
              BAL: {formatBNB(balanceData.value)} BNB
            </span>
          )}
          <SlippageSettings />
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Direction Selection (YES/NO) */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => { setDirection('yes'); setAmount(''); }}
            className={cn(
              'py-4 text-center font-bold text-xl uppercase border-2 transition-all',
              direction === 'yes'
                ? 'bg-yes text-black border-yes'
                : 'bg-yes/10 text-yes border-yes/50 hover:border-yes'
            )}
          >
            YES
            <span className="block text-lg font-mono mt-1">
              {Math.round(yesPercent)}¢
            </span>
          </button>
          <button
            onClick={() => { setDirection('no'); setAmount(''); }}
            className={cn(
              'py-4 text-center font-bold text-xl uppercase border-2 transition-all',
              direction === 'no'
                ? 'bg-no text-black border-no'
                : 'bg-no/10 text-no border-no/50 hover:border-no'
            )}
          >
            NO
            <span className="block text-lg font-mono mt-1">
              {Math.round(noPercent)}¢
            </span>
          </button>
        </div>

        {/* User's Position with PNL */}
        {(userYesShares > 0n || userNoShares > 0n) && (
          <div className="p-3 bg-dark-800 border border-dark-600 text-sm space-y-2">
            {/* Position shares */}
            <div className="flex justify-between">
              <span className="text-text-muted">Your Position:</span>
              <span>
                {userYesShares > 0n && (
                  <span className="text-yes mr-2">{formatShares(userYesShares)} YES</span>
                )}
                {userNoShares > 0n && (
                  <span className="text-no">{formatShares(userNoShares)} NO</span>
                )}
              </span>
            </div>
            
            {/* If wins now payout - YES */}
            {userYesShares > 0n && existingPositionPayout.yesPayout > 0n && (
              <div className="flex justify-between">
                <span className="text-text-muted">If YES wins now:</span>
                <span className="text-yes font-mono">
                  ~{formatBNB(existingPositionPayout.yesPayout)} BNB
                </span>
              </div>
            )}
            
            {/* If wins now payout - NO */}
            {userNoShares > 0n && existingPositionPayout.noPayout > 0n && (
              <div className="flex justify-between">
                <span className="text-text-muted">If NO wins now:</span>
                <span className="text-yes font-mono">
                  ~{formatBNB(existingPositionPayout.noPayout)} BNB
                </span>
              </div>
            )}
            
            {/* Returns change note */}
            {(existingPositionPayout.yesPayout > 0n || existingPositionPayout.noPayout > 0n) && (
              <p className="text-text-muted text-xs italic">
                Returns change as others trade
              </p>
            )}
          </div>
        )}

        {/* Action Selection (Buy/Sell) */}
        <div className="flex border border-dark-600">
          <button
            onClick={() => { setAction('buy'); setAmount(''); }}
            className={cn(
              'flex-1 py-2 text-sm font-bold uppercase transition-colors',
              action === 'buy'
                ? 'bg-dark-700 text-white'
                : 'bg-dark-800 text-text-secondary hover:text-white'
            )}
          >
            BUY
          </button>
          <button
            onClick={() => { setAction('sell'); setAmount(''); }}
            disabled={currentShares === 0n}
            className={cn(
              'flex-1 py-2 text-sm font-bold uppercase transition-colors border-l border-dark-600',
              action === 'sell'
                ? 'bg-dark-700 text-white'
                : 'bg-dark-800 text-text-secondary hover:text-white',
              currentShares === 0n && 'opacity-50 cursor-not-allowed'
            )}
          >
            SELL
          </button>
        </div>

        {/* No shares to sell warning */}
        {action === 'sell' && currentShares === 0n && (
          <div className="p-3 bg-dark-800 border border-dark-600 text-center">
            <p className="text-text-secondary text-sm">
              You don't have any {direction.toUpperCase()} shares to sell.
            </p>
          </div>
        )}

        {/* Amount Input - hidden when trying to sell 0 shares */}
        {!(action === 'sell' && currentShares === 0n) && (
          <>
            <Input
              type="text"
              inputMode="decimal"
              placeholder={action === 'buy' ? 'Amount in BNB' : 'Shares to sell'}
              value={amount}
              onChange={(e) => {
                // Replace comma with period for decimal input
                const value = e.target.value.replace(',', '.');
                // Only allow valid decimal numbers
                if (value === '' || /^\d*\.?\d*$/.test(value)) {
                  setAmount(value);
                }
              }}
              label={action === 'buy' ? 'AMOUNT (BNB)' : 'SHARES'}
            />

            {/* Quick amounts */}
            <div className="flex gap-2">
              {action === 'buy' ? (
                BUY_PRESETS.map((val) => (
                  <button
                    key={val}
                    onClick={() => setAmount(val)}
                    className={cn(
                      'flex-1 py-1 text-xs font-mono border transition-colors',
                      amount === val
                        ? 'border-cyber text-cyber bg-cyber/10'
                        : 'border-dark-600 text-text-secondary hover:text-white hover:border-dark-500'
                    )}
                  >
                    {val}
                  </button>
                ))
              ) : (
                sellPresets.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => setAmount(formatEther(preset.shares))}
                    className="flex-1 py-1 text-xs font-mono border border-dark-600 text-text-secondary hover:text-white hover:border-dark-500 transition-colors"
                  >
                    {preset.label}
                  </button>
                ))
              )}
            </div>
          </>
        )}

        {/* Estimate */}
        {amount && parseFloat(amount) > 0 && (
          <div className="p-3 bg-dark-800 border border-dark-600">
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">
                {action === 'buy' ? 'Est. Shares' : 'Est. Return'}
              </span>
              <span className={cn('font-mono', direction === 'yes' ? 'text-yes' : 'text-no')}>
                {estimatedOutput}
              </span>
            </div>
            {/* Minimum output with slippage */}
            <div className="flex justify-between text-xs mt-1 gap-2">
              <span className="text-text-muted whitespace-nowrap">Min. after slippage ({slippagePercent}%)</span>
              <span className="font-mono text-text-secondary text-right flex-shrink-0">
                {action === 'buy' && previewBuyData
                  ? formatShares(applySlippage(previewBuyData as bigint, slippageBps))
                  : action === 'sell' && previewSellData
                  ? `${formatBNB(applySlippage(previewSellData as bigint, slippageBps), 6)} BNB`
                  : '0'}
              </span>
            </div>
            {action === 'buy' && (
              <div className="flex justify-between text-xs mt-1">
                <span className="text-text-muted">Fee (1.5%)</span>
                <span className="font-mono text-text-secondary">
                  {(parseFloat(amount) * 0.015).toFixed(6)} BNB
                </span>
              </div>
            )}
            {action === 'sell' && previewSellData && (
              <div className="flex justify-between text-xs mt-1">
                <span className="text-text-muted">Fee (1.5% included)</span>
                <span className="font-mono text-text-secondary">
                  ~{formatBNB((previewSellData as bigint) * 15n / 985n, 6)} BNB
                </span>
              </div>
            )}
            
            {/* Buy Preview - If wins now payout */}
            {action === 'buy' && buyPreviewPayout && (
              <div className="mt-3 pt-3 border-t border-dark-600">
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">If {direction.toUpperCase()} wins now:</span>
                  <span className="text-yes font-mono">
                    ~{formatBNB(buyPreviewPayout.payout)} BNB
                    {buyPreviewPayout.multiplier > 0 && (
                      <span className="text-text-secondary ml-1">
                        ({buyPreviewPayout.multiplier.toFixed(2)}x)
                      </span>
                    )}
                  </span>
                </div>
                <p className="text-text-muted text-xs italic mt-1">
                  Returns change as others trade
                </p>
              </div>
            )}
          </div>
        )}

        {/* Sell All Warning - true full position exit */}
        {isSellAll && (
          <div className="p-3 bg-warning/10 border border-warning text-sm">
            <div className="flex gap-2">
              <span className="text-warning">⚠️</span>
              <div>
                <p className="text-warning font-bold text-xs mb-1">EXITING FULL POSITION</p>
                <p className="text-text-secondary text-xs">
                  You will sell all your shares and receive BNB now.
                  You will NOT receive any payout when the market resolves.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Selling Pool Maximum - when pool limits but user is selling max possible */}
        {isSellingPoolMax && (
          <div className="p-3 bg-cyber/10 border border-cyber text-sm">
            <div className="flex gap-2">
              <span className="text-cyber">⚠️</span>
              <div>
                <p className="text-cyber font-bold text-xs mb-1">SELLING MAXIMUM POSSIBLE</p>
                <p className="text-text-secondary text-xs">
                  Pool liquidity limits this sale to {maxSellableShares ? formatShares(maxSellableShares) : '0'} shares.
                  You'll keep {currentShares && maxSellableShares ? formatShares(currentShares - maxSellableShares) : '0'} shares - 
                  if {direction.toUpperCase()} wins, you'll receive the full payout for those!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Trade Button */}
        <Button
          variant={direction === 'yes' ? 'yes' : 'no'}
          size="lg"
          onClick={handleTrade}
          disabled={!amount || parseFloat(amount) <= 0 || isLoading}
          className="w-full"
        >
          {isPending ? (
            <span className="flex items-center justify-center gap-2">
              <Spinner size="sm" variant={direction === 'yes' ? 'yes' : 'no'} />
              CONFIRM IN WALLET...
            </span>
          ) : isConfirming ? (
            <span className="flex items-center justify-center gap-2">
              <Spinner size="sm" variant={direction === 'yes' ? 'yes' : 'no'} />
              PROCESSING...
            </span>
          ) : (
            `${action.toUpperCase()} ${direction.toUpperCase()}`
          )}
        </Button>

        {/* Info */}
        <p className="text-xs text-text-muted text-center">
          Min trade: 0.005 BNB • Platform fee: 1% • Creator fee: 0.5%
        </p>
      </div>
    </div>
  );
}

export default TradePanel;
