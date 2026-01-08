/**
 * ===== TRADE PANEL COMPONENT =====
 *
 * Trading interface for buying/selling YES/NO shares.
 * Brutalist design with chunky buttons and clear feedback.
 *
 * @module features/markets/components/TradePanel
 */

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Spinner } from '@/shared/components/ui/Spinner';
import { useChainValidation } from '@/shared/hooks/useChainValidation';
import { cn } from '@/shared/utils/cn';
import type { Market } from '@/shared/schemas';

interface TradePanelProps {
  market: Market;
  yesPercent: number;
  noPercent: number;
  isActive: boolean;
}

type TradeDirection = 'yes' | 'no';
type TradeAction = 'buy' | 'sell';

export function TradePanel({ market: _market, yesPercent, noPercent, isActive }: TradePanelProps) {
  const { isConnected } = useAccount();
  const { canTrade, isWrongNetwork } = useChainValidation();
  
  const [direction, setDirection] = useState<TradeDirection>('yes');
  const [action, setAction] = useState<TradeAction>('buy');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Calculate estimated output
  const estimatedShares = calculateEstimatedShares(
    amount,
    direction,
    action,
    yesPercent
  );

  const handleTrade = async () => {
    if (!canTrade || !amount) return;
    
    setIsLoading(true);
    try {
      // TODO: Implement actual trade execution
      console.log('Trading:', { direction, action, amount });
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error('Trade failed:', error);
    } finally {
      setIsLoading(false);
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
          <ConnectButton />
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
      <div className="border-b border-dark-600 px-4 py-3">
        <h3 className="font-bold uppercase">TRADE</h3>
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

        {/* Action Selection (Buy/Sell) */}
        <div className="flex border border-dark-600">
          <button
            onClick={() => setAction('buy')}
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
            onClick={() => setAction('sell')}
            className={cn(
              'flex-1 py-2 text-sm font-bold uppercase transition-colors border-l border-dark-600',
              action === 'sell'
                ? 'bg-dark-700 text-white'
                : 'bg-dark-800 text-text-secondary hover:text-white'
            )}
          >
            SELL
          </button>
        </div>

        {/* Amount Input */}
        <Input
          type="number"
          placeholder={action === 'buy' ? 'Amount in BNB' : 'Shares to sell'}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          label={action === 'buy' ? 'AMOUNT (BNB)' : 'SHARES'}
        />

        {/* Quick amounts */}
        <div className="flex gap-2">
          {['0.1', '0.5', '1', '5'].map((val) => (
            <button
              key={val}
              onClick={() => setAmount(val)}
              className="flex-1 py-1 text-xs font-mono border border-dark-600 text-text-secondary hover:text-white hover:border-dark-500 transition-colors"
            >
              {val}
            </button>
          ))}
        </div>

        {/* Estimate */}
        {amount && (
          <div className="p-3 bg-dark-800 border border-dark-600">
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">
                {action === 'buy' ? 'Est. Shares' : 'Est. Return'}
              </span>
              <span className={cn('font-mono', direction === 'yes' ? 'text-yes' : 'text-no')}>
                {estimatedShares}
              </span>
            </div>
          </div>
        )}

        {/* Trade Button */}
        <Button
          variant={direction === 'yes' ? 'yes' : 'no'}
          size="lg"
          onClick={handleTrade}
          disabled={!amount || isLoading}
          className="w-full"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <Spinner size="sm" variant={direction === 'yes' ? 'yes' : 'no'} />
              PROCESSING...
            </span>
          ) : (
            `${action.toUpperCase()} ${direction.toUpperCase()}`
          )}
        </Button>

        {/* Warning */}
        <p className="text-xs text-text-muted text-center">
          Trading involves risk. Only trade what you can afford to lose.
        </p>
      </div>
    </div>
  );
}

function calculateEstimatedShares(
  amount: string,
  direction: TradeDirection,
  action: TradeAction,
  yesPercent: number
): string {
  const bnbAmount = parseFloat(amount);
  if (isNaN(bnbAmount) || bnbAmount <= 0) return '0';

  // Simplified estimate - actual calculation would use contract view function
  const price = direction === 'yes' ? yesPercent / 100 : (100 - yesPercent) / 100;
  
  if (action === 'buy') {
    const shares = bnbAmount / price;
    return shares.toFixed(4);
  } else {
    const bnbReturn = bnbAmount * price;
    return `${bnbReturn.toFixed(4)} BNB`;
  }
}

export default TradePanel;
