/**
 * ===== CREATE MARKET PAGE =====
 *
 * Form for creating new prediction markets.
 * Requires wallet connection and BNB for initial liquidity.
 *
 * @module features/create/pages/CreateMarketPage
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Spinner } from '@/shared/components/ui/Spinner';
import { useChainValidation } from '@/shared/hooks/useChainValidation';

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
    .optional(),
  imageUrl: z
    .string()
    .url('Must be a valid URL')
    .optional()
    .or(z.literal('')),
  expirationDays: z
    .number()
    .min(1, 'Must be at least 1 day')
    .max(365, 'Must be under 365 days'),
  initialLiquidity: z
    .string()
    .refine((val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num >= 0.01;
    }, 'Minimum 0.01 BNB'),
});

type CreateMarketForm = z.infer<typeof createMarketSchema>;

export function CreateMarketPage() {
  const navigate = useNavigate();
  const { isConnected } = useAccount();
  const { canTrade, isWrongNetwork } = useChainValidation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CreateMarketForm>({
    resolver: zodResolver(createMarketSchema),
    defaultValues: {
      question: '',
      evidenceUrl: '',
      resolutionRules: '',
      imageUrl: '',
      expirationDays: 7,
      initialLiquidity: '0.1',
    },
  });

  const watchedQuestion = watch('question');
  const watchedLiquidity = watch('initialLiquidity');

  const onSubmit = async (data: CreateMarketForm) => {
    if (!canTrade) return;

    setIsSubmitting(true);
    try {
      // Calculate expiration timestamp
      const expirationTimestamp = Math.floor(
        Date.now() / 1000 + data.expirationDays * 24 * 60 * 60
      );

      console.log('Creating market:', {
        ...data,
        expirationTimestamp,
      });

      // TODO: Implement actual contract call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Navigate to the new market (placeholder)
      navigate('/');
    } catch (error) {
      console.error('Failed to create market:', error);
    } finally {
      setIsSubmitting(false);
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

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black uppercase tracking-tight">
            CREATE <span className="text-cyber">MARKET</span>
          </h1>
          <p className="text-text-secondary mt-2">
            Create a new prediction market and provide initial liquidity.
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

          {/* Evidence & Rules */}
          <Card className="p-6">
            <h2 className="font-bold uppercase mb-4 flex items-center gap-2">
              <span className="text-cyber">02</span> EVIDENCE & RULES
            </h2>
            <div className="space-y-4">
              <Input
                {...register('evidenceUrl')}
                label="Evidence URL (optional)"
                placeholder="https://example.com/source"
                error={errors.evidenceUrl?.message}
                helperText="Link to a reliable source for resolution"
              />
              <div>
                <label className="block text-sm font-mono text-text-secondary uppercase mb-2">
                  Resolution Rules (optional)
                </label>
                <textarea
                  {...register('resolutionRules')}
                  className="w-full px-4 py-3 bg-black border border-dark-600 text-white font-mono placeholder-dark-400 focus:outline-none focus:border-cyber transition-colors resize-none"
                  rows={4}
                  placeholder="Describe how this market should be resolved..."
                />
                {errors.resolutionRules && (
                  <p className="text-no text-xs mt-1">{errors.resolutionRules.message}</p>
                )}
              </div>
            </div>
          </Card>

          {/* Image */}
          <Card className="p-6">
            <h2 className="font-bold uppercase mb-4 flex items-center gap-2">
              <span className="text-cyber">03</span> IMAGE (OPTIONAL)
            </h2>
            <Input
              {...register('imageUrl')}
              placeholder="https://example.com/image.jpg"
              error={errors.imageUrl?.message}
              helperText="Direct link to an image (JPG, PNG, GIF)"
            />
          </Card>

          {/* Expiration */}
          <Card className="p-6">
            <h2 className="font-bold uppercase mb-4 flex items-center gap-2">
              <span className="text-cyber">04</span> EXPIRATION
            </h2>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {[1, 7, 30, 90].map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => {
                    // Would need setValue from react-hook-form
                  }}
                  className="py-2 text-sm font-mono border border-dark-600 text-text-secondary hover:text-white hover:border-dark-500 transition-colors"
                >
                  {days}D
                </button>
              ))}
            </div>
            <Input
              {...register('expirationDays', { valueAsNumber: true })}
              type="number"
              label="Days until expiration"
              error={errors.expirationDays?.message}
            />
          </Card>

          {/* Liquidity */}
          <Card className="p-6">
            <h2 className="font-bold uppercase mb-4 flex items-center gap-2">
              <span className="text-cyber">05</span> INITIAL LIQUIDITY
            </h2>
            <Input
              {...register('initialLiquidity')}
              type="number"
              step="0.01"
              placeholder="0.1"
              error={errors.initialLiquidity?.message}
            />
            <div className="flex gap-2 mt-3">
              {['0.1', '0.5', '1', '5'].map((val) => (
                <button
                  key={val}
                  type="button"
                  className="flex-1 py-2 text-sm font-mono border border-dark-600 text-text-secondary hover:text-white hover:border-dark-500 transition-colors"
                >
                  {val} BNB
                </button>
              ))}
            </div>
            <p className="text-xs text-text-muted mt-3">
              Higher liquidity = better prices for traders. Minimum 0.01 BNB.
            </p>
          </Card>

          {/* Summary & Submit */}
          <Card className="p-6 border-cyber">
            <h2 className="font-bold uppercase mb-4">SUMMARY</h2>
            <div className="space-y-2 mb-6 text-sm">
              <div className="flex justify-between">
                <span className="text-text-muted">Initial Liquidity</span>
                <span className="font-mono">{watchedLiquidity || '0'} BNB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Creation Fee</span>
                <span className="font-mono text-text-secondary">0 BNB</span>
              </div>
              <div className="flex justify-between border-t border-dark-600 pt-2">
                <span className="font-bold">Total</span>
                <span className="font-mono font-bold text-cyber">
                  {watchedLiquidity || '0'} BNB
                </span>
              </div>
            </div>

            <Button
              type="submit"
              variant="cyber"
              size="lg"
              disabled={isSubmitting}
              className="w-full"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Spinner size="sm" variant="cyber" />
                  CREATING...
                </span>
              ) : (
                'CREATE MARKET'
              )}
            </Button>
          </Card>
        </form>
      </div>
    </div>
  );
}

export default CreateMarketPage;
