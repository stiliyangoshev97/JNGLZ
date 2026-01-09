/**
 * ===== TRADE PANEL COMPONENT =====
 *
 * Trading interface for buying/selling YES/NO shares.
 * Uses actual contract calls via wagmi hooks.
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
import { useChainValidation } from '@/shared/hooks/useChainValidation';
import {
  useBuyYes,
  useBuyNo,
  useSellYes,
  useSellNo,
  usePreviewBuy,
  usePreviewSell,
  usePosition,
} from '@/shared/hooks';
import { cn } from '@/shared/utils/cn';
import { formatBNB, formatShares } from '@/shared/utils/format';
import type { Market } from '@/shared/schemas';

interface TradePanelProps {
  market: Market;
  yesPercent: number;
  noPercent: number;
  isActive: boolean;
}

type TradeDirection = 'yes' | 'no';
type TradeAction = 'buy' | 'sell';

// Quick amount presets for buying (BNB)
const BUY_PRESETS = ['0.01', '0.05', '0.1', '0.5'];

export function TradePanel({ market, yesPercent, noPercent, isActive }: TradePanelProps) {
  const { isConnected, address } = useAccount();
  const { canTrade, isWrongNetwork } = useChainValidation();
  
  // User's BNB balance
  const { data: balanceData } = useBalance({ address });
  
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

  // Check if selling all shares
  const isSellAll = useMemo(() => {
    if (action !== 'sell' || !amount || currentShares === 0n) return false;
    try {
      const sharesToSell = parseEther(amount);
      return sharesToSell >= currentShares;
    } catch {
      return false;
    }
  }, [action, amount, currentShares]);

  // Reset form on success
  useEffect(() => {
    if (isSuccess) {
      setAmount('');
      // Refetch position after successful trade
      refetchPosition();
      // Reset all write hooks
      setTimeout(() => {
        resetBuyYes();
        resetBuyNo();
        resetSellYes();
        resetSellNo();
      }, 2000);
    }
  }, [isSuccess, resetBuyYes, resetBuyNo, resetSellYes, resetSellNo]);

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

  // Sell preset buttons (25%, 50%, 75%, MAX)
  const sellPresets = useMemo(() => {
    if (currentShares === 0n) return [];
    return [
      { label: '25%', shares: currentShares / 4n },
      { label: '50%', shares: currentShares / 2n },
      { label: '75%', shares: (currentShares * 3n) / 4n },
      { label: 'MAX', shares: currentShares },
    ];
  }, [currentShares]);

  const handleTrade = async () => {
    if (!canTrade || !amount) return;
    
    if (action === 'buy') {
      if (direction === 'yes') {
        await buyYes({ marketId, amount });
      } else {
        await buyNo({ marketId, amount });
      }
    } else {
      // Sell - amount is in shares (need to convert to 1e18)
      const sharesToSell = parseEther(amount);
      if (direction === 'yes') {
        await sellYes({ marketId, shares: sharesToSell });
      } else {
        await sellNo({ marketId, shares: sharesToSell });
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
        {balanceData && (
          <span className="text-xs font-mono text-text-muted">
            BAL: {formatBNB(balanceData.value)} BNB
          </span>
        )}
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
            <span className="block text-sm font-mono mt-1">
              {yesPercent.toFixed(0)}%
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
            <span className="block text-sm font-mono mt-1">
              {noPercent.toFixed(0)}%
            </span>
          </button>
        </div>

        {/* User's Position */}
        {(userYesShares > 0n || userNoShares > 0n) && (
          <div className="p-2 bg-dark-800 border border-dark-600 text-xs">
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
          type="number"
          step="0.01"
          placeholder={action === 'buy' ? 'Amount in BNB' : 'Shares to sell'}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
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
                  You will not receive any payout when the market resolves. 
                  You are cashing out your current value now.
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
