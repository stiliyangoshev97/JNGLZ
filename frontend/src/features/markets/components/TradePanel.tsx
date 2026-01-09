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
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { parseEther, formatEther } from 'viem';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Spinner } from '@/shared/components/ui/Spinner';
import { SlippageSettings, useSlippage, applySlippage } from '@/shared/components/SlippageSettings';
import { useChainValidation } from '@/shared/hooks/useChainValidation';
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
  
  // Slippage settings (default 1%)
  const { slippageBps, slippagePercent } = useSlippage();
  
  // User's BNB balance
  const { data: balanceData } = useBalance({ address });
  
  // Find user's position from market data (for PNL display)
  const userPositionData = useMemo(() => {
    if (!address || !market.positions) return null;
    const pos = market.positions.find(
      (p: { user?: { address?: string } }) => 
        p.user?.address?.toLowerCase() === address.toLowerCase()
    );
    if (!pos) return null;
    return {
      totalInvested: parseFloat(pos.totalInvested || '0'),
    };
  }, [address, market.positions]);
  
  // User's position in this market
  const marketId = BigInt(market.marketId);
  const { position, refetch: refetchPosition } = usePosition(marketId, address);
  
  const [direction, setDirection] = useState<TradeDirection>('yes');
  const [action, setAction] = useState<TradeAction>('buy');
  const [amount, setAmount] = useState('');

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

  // Get max sellable shares from contract (respects pool liquidity limits)
  const { maxShares: maxSellableYes, bnbOut: maxSellBnbYes } = useMaxSellableShares(marketId, userYesShares, true);
  const { maxShares: maxSellableNo, bnbOut: maxSellBnbNo } = useMaxSellableShares(marketId, userNoShares, false);
  
  const maxSellableShares = direction === 'yes' ? maxSellableYes : maxSellableNo;
  const maxSellBnbOut = direction === 'yes' ? maxSellBnbYes : maxSellBnbNo;

  // Check if pool liquidity limits selling all shares
  const isPoolLimited = useMemo(() => {
    if (currentShares === 0n || maxSellableShares === undefined) return false;
    return maxSellableShares < currentShares;
  }, [currentShares, maxSellableShares]);

  // Check if selling all shares
  const isSellAll = useMemo(() => {
    if (action !== 'sell' || !amount || currentShares === 0n) return false;
    try {
      const sharesToSell = parseEther(amount);
      // Use maxSellableShares if pool is limited
      const effectiveMax = maxSellableShares !== undefined ? maxSellableShares : currentShares;
      return sharesToSell >= effectiveMax;
    } catch {
      return false;
    }
  }, [action, amount, currentShares, maxSellableShares]);

  // Reset form on success
  useEffect(() => {
    if (isSuccess) {
      setAmount('');
      // Refetch position after successful trade
      refetchPosition();
      // Trigger market data refetch for instant UI update
      onTradeSuccess?.();
      // Reset all write hooks
      setTimeout(() => {
        resetBuyYes();
        resetBuyNo();
        resetSellYes();
        resetSellNo();
      }, 2000);
    }
  }, [isSuccess, resetBuyYes, resetBuyNo, resetSellYes, resetSellNo, onTradeSuccess]);

  // Calculate estimated output
  const estimatedOutput = useMemo(() => {
    if (action === 'buy' && previewBuyData) {
      return formatShares(previewBuyData as bigint);
    }
    if (action === 'sell' && previewSellData) {
      return `${formatBNB(previewSellData as bigint)} BNB`;
    }
    return '0';
  }, [action, previewBuyData, previewSellData]);

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

  // Success state (briefly show)
  if (isSuccess) {
    return (
      <div className="border border-yes bg-yes/10 p-6">
        <h3 className="font-bold uppercase mb-4 text-center text-yes">✓ TRADE SUCCESSFUL</h3>
        <p className="text-text-secondary text-sm text-center">
          Your trade has been executed
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
            onClick={() => setDirection('yes')}
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
            onClick={() => setDirection('no')}
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
            
            {/* PNL Display */}
            {userPositionData && userPositionData.totalInvested > 0 && (() => {
              // Calculate current value using UNIT_PRICE
              const UNIT_PRICE = 0.01; // BNB
              const yesPrice = UNIT_PRICE * yesPercent / 100;
              const noPrice = UNIT_PRICE * noPercent / 100;
              const yesSharesNum = Number(userYesShares) / 1e18;
              const noSharesNum = Number(userNoShares) / 1e18;
              const currentValue = (yesSharesNum * yesPrice) + (noSharesNum * noPrice);
              const invested = userPositionData.totalInvested;
              const pnl = currentValue - invested;
              const pnlPercent = invested > 0 ? (pnl / invested) * 100 : 0;
              
              return (
                <div className={cn(
                  'flex justify-between pt-2 border-t border-dark-600',
                  pnl >= 0 ? 'text-yes' : 'text-no'
                )}>
                  <span className="text-text-muted">P/L:</span>
                  <span className="font-mono font-bold">
                    {pnl >= 0 ? '+' : ''}{pnl.toFixed(4)} BNB
                    <span className="text-xs ml-1 opacity-70">
                      ({pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(1)}%)
                    </span>
                  </span>
                </div>
              );
            })()}
            
            {/* Pool Liquidity Warning */}
            {action === 'sell' && isPoolLimited && maxSellableShares !== undefined && (
              <div className="pt-2 border-t border-dark-600">
                <p className="text-warning text-xs">
                  ⚠️ Pool liquidity limits max sell to {formatShares(maxSellableShares)} {direction.toUpperCase()} shares
                  {maxSellBnbOut && ` (~${formatBNB(maxSellBnbOut)} BNB)`}
                </p>
              </div>
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

        {/* Amount Input */}
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
            <div className="flex justify-between text-xs mt-1">
              <span className="text-text-muted">Min. after slippage ({slippagePercent}%)</span>
              <span className="font-mono text-text-secondary">
                {action === 'buy' && previewBuyData
                  ? formatShares(applySlippage(previewBuyData as bigint, slippageBps))
                  : action === 'sell' && previewSellData
                  ? `${formatBNB(applySlippage(previewSellData as bigint, slippageBps))} BNB`
                  : '0'}
              </span>
            </div>
            {action === 'buy' && (
              <div className="flex justify-between text-xs mt-1">
                <span className="text-text-muted">Fee (1.5%)</span>
                <span className="font-mono text-text-secondary">
                  {(parseFloat(amount) * 0.015).toFixed(4)} BNB
                </span>
              </div>
            )}
          </div>
        )}

        {/* Sell All Warning */}
        {isSellAll && (
          <div className="p-3 bg-warning/10 border border-warning text-sm">
            <div className="flex gap-2">
              <span className="text-warning">⚠️</span>
              <div>
                <p className="text-warning font-bold text-xs mb-1">SELLING ALL SHARES</p>
                <p className="text-text-secondary text-xs">
                  You will exit your position and receive BNB now.
                  You will NOT receive any payout when the market resolves.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Pool Limited Info - explain remaining shares */}
        {action === 'sell' && isPoolLimited && !isSellAll && (
          <div className="p-3 bg-cyber/10 border border-cyber text-sm">
            <div className="flex gap-2">
              <span className="text-cyber">💡</span>
              <div>
                <p className="text-cyber font-bold text-xs mb-1">PARTIAL SELL DUE TO POOL LIQUIDITY</p>
                <p className="text-text-secondary text-xs">
                  You can sell up to {maxSellableShares ? formatShares(maxSellableShares) : '0'} shares now. 
                  Your remaining shares stay in the market - if {direction.toUpperCase()} wins, 
                  you'll receive the full payout for those shares!
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
