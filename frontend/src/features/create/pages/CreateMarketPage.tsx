/**
 * ===== CREATE MARKET PAGE =====
 *
 * Form for creating new prediction markets.
 * 
 * KEY CONTRACT MECHANICS:
 * - Market creation is FREE (marketCreationFee defaults to 0)
 * - Virtual liquidity (100 YES + 100 NO shares) provides initial pricing
 * - NO "initial liquidity" needed - the bonding curve handles it
 * - Creator can OPTIONALLY buy first shares atomically with createMarketAndBuy()
 * - This prevents front-running if creator wants to be first buyer
 * 
 * TWO CREATION MODES:
 * 1. createMarket() - Just create, no initial bet (FREE)
 * 2. createMarketAndBuy() - Create + first bet atomically (min 0.005 BNB)
 *
 * @module features/create/pages/CreateMarketPage
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccount, useBalance } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { parseEther, formatEther } from 'viem';
import { Card } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Spinner } from '@/shared/components/ui/Spinner';
import { useChainValidation } from '@/shared/hooks/useChainValidation';
import {
  useCreateMarket,
  useCreateMarketAndBuy,
  useMarketCreationFee,
} from '@/shared/hooks';
import { formatBNB } from '@/shared/utils/format';

// Quick duration presets
const DURATION_PRESETS = [
  { label: '1H', hours: 1 },
  { label: '6H', hours: 6 },
  { label: '1D', hours: 24 },
  { label: '3D', hours: 72 },
  { label: '7D', hours: 168 },
  { label: '30D', hours: 720 },
];

// First bet presets (in BNB)
const BET_PRESETS = ['0.01', '0.05', '0.1', '0.5', '1'];

// Form validation schema
const createMarketSchema = z.object({
  question: z
    .string()
    .min(10, 'Question must be at least 10 characters')
    .max(500, 'Question must be under 500 characters'),
  evidenceUrl: z
    .string()
    .url('Must be a valid URL')
    .optional()
    .or(z.literal('')),
  resolutionRules: z
    .string()
    .max(2000, 'Rules must be under 2000 characters')
    .optional()
    .or(z.literal('')),
  imageUrl: z
    .string()
    .url('Must be a valid URL')
    .optional()
    .or(z.literal('')),
  durationHours: z.number().min(1, 'Min 1 hour').max(8760, 'Max 365 days'),
  // Optional first bet
  wantFirstBet: z.boolean(),
  firstBetSide: z.enum(['yes', 'no']),
  firstBetAmount: z.string(),
});

type CreateMarketForm = z.infer<typeof createMarketSchema>;

export function CreateMarketPage() {
  const navigate = useNavigate();
  const { isConnected, address } = useAccount();
  const { canTrade, isWrongNetwork } = useChainValidation();
  
  // Get user's BNB balance
  const { data: balanceData } = useBalance({
    address,
  });
  
  // Get market creation fee from contract (usually 0)
  const { data: creationFeeData } = useMarketCreationFee();
  const creationFee = (creationFeeData as bigint) || 0n;
  
  // Contract write hooks
  const {
    createMarket,
    isPending: isCreatingMarket,
    isConfirming: isConfirmingCreate,
    isSuccess: isCreateSuccess,
    error: createError,
    hash: createHash,
  } = useCreateMarket();
  
  const {
    createMarketAndBuy,
    isPending: isCreatingAndBuying,
    isConfirming: isConfirmingBuy,
    isSuccess: isBuySuccess,
    error: buyError,
    hash: buyHash,
  } = useCreateMarketAndBuy();
  
  const isPending = isCreatingMarket || isCreatingAndBuying;
  const isConfirming = isConfirmingCreate || isConfirmingBuy;
  const isSuccess = isCreateSuccess || isBuySuccess;
  const error = createError || buyError;
  const hash = createHash || buyHash;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateMarketForm>({
    resolver: zodResolver(createMarketSchema),
    defaultValues: {
      question: '',
      evidenceUrl: '',
      resolutionRules: '',
      imageUrl: '',
      durationHours: 24, // Default 1 day
      wantFirstBet: false,
      firstBetSide: 'yes',
      firstBetAmount: '0.05',
    },
  });

  const watchedQuestion = watch('question');
  const watchedDuration = watch('durationHours');
  const wantFirstBet = watch('wantFirstBet');
  const firstBetSide = watch('firstBetSide');
  const firstBetAmount = watch('firstBetAmount');

  // Calculate total cost
  const firstBetWei = wantFirstBet && firstBetAmount ? parseEther(firstBetAmount || '0') : 0n;
  const totalCost = creationFee + firstBetWei;
  const hasEnoughBalance = balanceData ? balanceData.value >= totalCost : false;
  
  // Calculate expiry timestamp
  const expiryTimestamp = BigInt(Math.floor(Date.now() / 1000) + (watchedDuration || 24) * 3600);

  // Navigate on success
  useEffect(() => {
    if (isSuccess && hash) {
      // Could parse the MarketCreated event to get marketId, for now go to home
      setTimeout(() => navigate('/'), 2000);
    }
  }, [isSuccess, hash, navigate]);

  const onSubmit = async (data: CreateMarketForm) => {
    if (!canTrade) return;

    const expiryTs = BigInt(Math.floor(Date.now() / 1000) + data.durationHours * 3600);

    if (data.wantFirstBet && parseFloat(data.firstBetAmount) >= 0.005) {
      // Create market AND buy first shares
      await createMarketAndBuy({
        question: data.question,
        evidenceLink: data.evidenceUrl || '',
        resolutionRules: data.resolutionRules || '',
        imageUrl: data.imageUrl || '',
        expiryTimestamp: expiryTs,
        buyYesSide: data.firstBetSide === 'yes',
        betAmount: data.firstBetAmount,
        creationFee,
      });
    } else {
      // Just create market (free)
      await createMarket({
        question: data.question,
        evidenceLink: data.evidenceUrl || '',
        resolutionRules: data.resolutionRules || '',
        imageUrl: data.imageUrl || '',
        expiryTimestamp: expiryTs,
        creationFee,
      });
    }
  };

  // Not connected state
  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <p className="text-6xl mb-6">🔐</p>
          <h1 className="text-2xl font-bold mb-4">CONNECT WALLET</h1>
          <p className="text-text-secondary mb-6">
            Connect your wallet to create a prediction market.
          </p>
          <ConnectButton />
        </div>
      </div>
    );
  }

  // Wrong network state
  if (isWrongNetwork) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <p className="text-6xl mb-6">⚠️</p>
          <h1 className="text-2xl font-bold text-no mb-4">WRONG NETWORK</h1>
          <p className="text-text-secondary mb-6">
            Please switch to BNB Chain to create markets.
          </p>
        </div>
      </div>
    );
  }

  // Success state
  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <p className="text-6xl mb-6">🎉</p>
          <h1 className="text-2xl font-bold text-yes mb-4">MARKET CREATED!</h1>
          <p className="text-text-secondary mb-4">
            Your market is now live.
          </p>
          {hash && (
            <a
              href={`https://testnet.bscscan.com/tx/${hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyber underline text-sm"
            >
              View transaction →
            </a>
          )}
          <p className="text-text-muted text-sm mt-4">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black uppercase tracking-tight">
            CREATE <span className="text-cyber">MARKET</span>
          </h1>
          <p className="text-text-secondary mt-2">
            Create a prediction market. {creationFee === 0n ? 'It\'s FREE!' : `Fee: ${formatBNB(creationFee)} BNB`}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Question */}
          <Card className="p-6">
            <h2 className="font-bold uppercase mb-4 flex items-center gap-2">
              <span className="text-cyber">01</span> QUESTION
            </h2>
            <Input
              {...register('question')}
              placeholder="Will Bitcoin reach $100,000 by end of 2026?"
              error={errors.question?.message}
              helperText={`${watchedQuestion?.length || 0}/500 characters`}
            />
            <p className="text-xs text-text-muted mt-2">
              Ask a clear yes/no question that can be objectively resolved.
            </p>
          </Card>

          {/* Expiration - FIXED with working presets */}
          <Card className="p-6">
            <h2 className="font-bold uppercase mb-4 flex items-center gap-2">
              <span className="text-cyber">02</span> EXPIRATION
            </h2>
            <div className="grid grid-cols-6 gap-2 mb-4">
              {DURATION_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setValue('durationHours', preset.hours)}
                  className={`py-2 text-sm font-mono border transition-colors ${
                    watchedDuration === preset.hours
                      ? 'border-cyber text-cyber bg-cyber/10'
                      : 'border-dark-600 text-text-secondary hover:text-white hover:border-dark-500'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <Input
              {...register('durationHours', { valueAsNumber: true })}
              type="number"
              label="Custom duration (hours)"
              error={errors.durationHours?.message}
            />
            <p className="text-xs text-text-muted mt-2">
              Expires: {new Date(Number(expiryTimestamp) * 1000).toLocaleString()}
            </p>
          </Card>

          {/* Evidence & Rules - Optional */}
          <Card className="p-6">
            <h2 className="font-bold uppercase mb-4 flex items-center gap-2">
              <span className="text-cyber">03</span> EVIDENCE & RULES
              <span className="text-text-muted text-xs font-normal">(optional)</span>
            </h2>
            <div className="space-y-4">
              <Input
                {...register('evidenceUrl')}
                label="Evidence URL"
                placeholder="https://example.com/source"
                error={errors.evidenceUrl?.message}
                helperText="Link to a reliable source for resolution"
              />
              <div>
                <label className="block text-sm font-mono text-text-secondary uppercase mb-2">
                  Resolution Rules
                </label>
                <textarea
                  {...register('resolutionRules')}
                  className="w-full px-4 py-3 bg-black border border-dark-600 text-white font-mono placeholder-dark-400 focus:outline-none focus:border-cyber transition-colors resize-none"
                  rows={3}
                  placeholder="e.g., Market resolves YES if BTC price on CoinGecko exceeds $100,000 at any point before expiry."
                />
                {errors.resolutionRules && (
                  <p className="text-no text-xs mt-1">{errors.resolutionRules.message}</p>
                )}
              </div>
            </div>
          </Card>

          {/* Image - Optional */}
          <Card className="p-6">
            <h2 className="font-bold uppercase mb-4 flex items-center gap-2">
              <span className="text-cyber">04</span> IMAGE
              <span className="text-text-muted text-xs font-normal">(optional)</span>
            </h2>
            <Input
              {...register('imageUrl')}
              placeholder="https://example.com/image.jpg"
              error={errors.imageUrl?.message}
              helperText="Direct link to an image (JPG, PNG, GIF)"
            />
          </Card>

          {/* First Bet - OPTIONAL */}
          <Card className="p-6">
            <h2 className="font-bold uppercase mb-4 flex items-center gap-2">
              <span className="text-cyber">05</span> FIRST BET
              <span className="text-text-muted text-xs font-normal">(optional)</span>
            </h2>
            
            <p className="text-sm text-text-secondary mb-4">
              Be the first buyer! Your bet is placed atomically with market creation - no one can front-run you.
            </p>

            {/* Toggle */}
            <label className="flex items-center gap-3 cursor-pointer mb-4 group">
              <input
                type="checkbox"
                {...register('wantFirstBet')}
                className="sr-only"
              />
              <div 
                className={`w-6 h-6 border-2 flex items-center justify-center transition-all ${
                  wantFirstBet 
                    ? 'bg-cyber border-cyber' 
                    : 'bg-black border-dark-500 group-hover:border-cyber/50'
                }`}
              >
                {wantFirstBet && (
                  <svg 
                    className="w-4 h-4 text-black" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor" 
                    strokeWidth={3}
                  >
                    <path strokeLinecap="square" strokeLinejoin="miter" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className={`font-mono text-sm uppercase tracking-wide transition-colors ${
                wantFirstBet ? 'text-cyber' : 'text-text-secondary group-hover:text-white'
              }`}>
                I want to place the first bet
              </span>
            </label>

            {wantFirstBet && (
              <div className="space-y-4 border-t border-dark-600 pt-4">
                {/* Side selection */}
                <div>
                  <label className="block text-sm font-mono text-text-secondary uppercase mb-2">
                    Bet on
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setValue('firstBetSide', 'yes')}
                      className={`py-3 font-bold uppercase transition-colors ${
                        firstBetSide === 'yes'
                          ? 'bg-yes text-black border border-yes'
                          : 'bg-transparent text-yes border border-yes/50 hover:border-yes'
                      }`}
                    >
                      YES
                    </button>
                    <button
                      type="button"
                      onClick={() => setValue('firstBetSide', 'no')}
                      className={`py-3 font-bold uppercase transition-colors ${
                        firstBetSide === 'no'
                          ? 'bg-no text-black border border-no'
                          : 'bg-transparent text-no border border-no/50 hover:border-no'
                      }`}
                    >
                      NO
                    </button>
                  </div>
                </div>

                {/* Amount */}
                <div>
                  <Input
                    {...register('firstBetAmount')}
                    type="number"
                    step="0.01"
                    label="Bet Amount (BNB)"
                    error={errors.firstBetAmount?.message}
                  />
                  <div className="flex gap-2 mt-2">
                    {BET_PRESETS.map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setValue('firstBetAmount', val)}
                        className={`flex-1 py-2 text-sm font-mono border transition-colors ${
                          firstBetAmount === val
                            ? 'border-cyber text-cyber bg-cyber/10'
                            : 'border-dark-600 text-text-secondary hover:text-white hover:border-dark-500'
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-text-muted mt-2">
                    Minimum bet: 0.005 BNB. First buyer gets best price!
                  </p>
                </div>
              </div>
            )}
          </Card>

          {/* Summary & Submit */}
          <Card className="p-6 border-cyber">
            <h2 className="font-bold uppercase mb-4">SUMMARY</h2>
            <div className="space-y-2 mb-6 text-sm">
              <div className="flex justify-between">
                <span className="text-text-muted">Creation Fee</span>
                <span className="font-mono">
                  {creationFee === 0n ? 'FREE' : `${formatBNB(creationFee)} BNB`}
                </span>
              </div>
              {wantFirstBet && (
                <div className="flex justify-between">
                  <span className="text-text-muted">First Bet ({firstBetSide?.toUpperCase()})</span>
                  <span className="font-mono">{firstBetAmount || '0'} BNB</span>
                </div>
              )}
              <div className="flex justify-between border-t border-dark-600 pt-2">
                <span className="font-bold">Total</span>
                <span className="font-mono font-bold text-cyber">
                  {totalCost === 0n ? 'FREE (gas only)' : `${formatEther(totalCost)} BNB`}
                </span>
              </div>
              {balanceData && (
                <div className="flex justify-between text-xs">
                  <span className="text-text-muted">Your balance</span>
                  <span className={`font-mono ${hasEnoughBalance ? 'text-text-secondary' : 'text-no'}`}>
                    {formatBNB(balanceData.value)} BNB
                  </span>
                </div>
              )}
            </div>

            {/* Error display */}
            {error && (
              <div className="mb-4 p-3 border border-no bg-no/10 text-no text-sm">
                {error.message || 'Transaction failed'}
              </div>
            )}

            <Button
              type="submit"
              variant="cyber"
              size="lg"
              disabled={isPending || isConfirming || !hasEnoughBalance}
              className="w-full"
            >
              {isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <Spinner size="sm" variant="cyber" />
                  CONFIRM IN WALLET...
                </span>
              ) : isConfirming ? (
                <span className="flex items-center justify-center gap-2">
                  <Spinner size="sm" variant="cyber" />
                  CREATING...
                </span>
              ) : !hasEnoughBalance ? (
                'INSUFFICIENT BALANCE'
              ) : wantFirstBet ? (
                'CREATE MARKET & BET'
              ) : (
                'CREATE MARKET (FREE)'
              )}
            </Button>
          </Card>
        </form>
      </div>
    </div>
  );
}

export default CreateMarketPage;
