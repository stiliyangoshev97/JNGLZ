/**
 * ===== SLIPPAGE SETTINGS COMPONENT =====
 * 
 * Allows users to configure slippage tolerance for trades.
 * Default: 1% (100 basis points)
 * 
 * @module shared/components/SlippageSettings
 */

import { useState, useEffect } from 'react';
import { cn } from '@/shared/utils/cn';

// Slippage presets in basis points (1 bps = 0.01%)
const SLIPPAGE_PRESETS = [
  { label: '0.5%', bps: 50 },
  { label: '1%', bps: 100 },
  { label: '2%', bps: 200 },
  { label: '5%', bps: 500 },
];

// Local storage key
const SLIPPAGE_STORAGE_KEY = 'jnglz_slippage_bps';

// Default slippage: 1% (100 bps)
export const DEFAULT_SLIPPAGE_BPS = 100;

interface SlippageSettingsProps {
  onSlippageChange?: (bps: number) => void;
  className?: string;
}

/**
 * Get saved slippage from localStorage or return default
 */
export function getSavedSlippage(): number {
  if (typeof window === 'undefined') return DEFAULT_SLIPPAGE_BPS;
  const saved = localStorage.getItem(SLIPPAGE_STORAGE_KEY);
  if (saved) {
    const parsed = parseInt(saved, 10);
    if (!isNaN(parsed) && parsed >= 0 && parsed <= 5000) {
      return parsed;
    }
  }
  return DEFAULT_SLIPPAGE_BPS;
}

/**
 * Save slippage to localStorage
 */
export function saveSlippage(bps: number): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SLIPPAGE_STORAGE_KEY, bps.toString());
}

/**
 * Calculate minimum output with slippage applied
 * @param expectedOutput Expected output from preview
 * @param slippageBps Slippage in basis points (100 = 1%)
 * @returns Minimum acceptable output
 */
export function applySlippage(expectedOutput: bigint, slippageBps: number): bigint {
  if (expectedOutput === 0n) return 0n;
  // minOutput = expectedOutput * (10000 - slippageBps) / 10000
  return (expectedOutput * BigInt(10000 - slippageBps)) / 10000n;
}

export function SlippageSettings({ onSlippageChange, className }: SlippageSettingsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [slippageBps, setSlippageBps] = useState(DEFAULT_SLIPPAGE_BPS);
  const [customInput, setCustomInput] = useState('');
  const [isCustom, setIsCustom] = useState(false);

  // Load saved slippage on mount
  useEffect(() => {
    const saved = getSavedSlippage();
    setSlippageBps(saved);
    
    // Check if saved value matches a preset
    const matchesPreset = SLIPPAGE_PRESETS.some(p => p.bps === saved);
    if (!matchesPreset && saved !== DEFAULT_SLIPPAGE_BPS) {
      setIsCustom(true);
      setCustomInput((saved / 100).toString());
    }
  }, []);

  // Notify parent of slippage changes
  useEffect(() => {
    onSlippageChange?.(slippageBps);
  }, [slippageBps, onSlippageChange]);

  const handlePresetClick = (bps: number) => {
    setSlippageBps(bps);
    setIsCustom(false);
    setCustomInput('');
    saveSlippage(bps);
    // Notify other components
    window.dispatchEvent(new Event('slippage-updated'));
  };

  const handleCustomChange = (value: string) => {
    setCustomInput(value);
    const parsed = parseFloat(value);
    if (!isNaN(parsed) && parsed >= 0 && parsed <= 50) {
      const bps = Math.round(parsed * 100);
      setSlippageBps(bps);
      setIsCustom(true);
      saveSlippage(bps);
      // Notify other components
      window.dispatchEvent(new Event('slippage-updated'));
    }
  };

  const slippagePercent = slippageBps / 100;

  return (
    <div className={cn('relative', className)}>
      {/* Gear Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'p-2 rounded hover:bg-dark-700 transition-colors',
          'text-text-muted hover:text-text-primary',
          isOpen && 'bg-dark-700 text-text-primary'
        )}
        title={`Slippage: ${slippagePercent}%`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Panel */}
          <div className="absolute right-0 top-full mt-2 z-50 w-64 bg-dark-800 border border-dark-600 p-4 shadow-lg">
            <div className="flex justify-between items-center mb-3">
              <span className="font-bold text-sm uppercase">Slippage Tolerance</span>
              <span className="text-xs text-text-muted font-mono">
                {slippagePercent}%
              </span>
            </div>

            {/* Preset Buttons */}
            <div className="grid grid-cols-4 gap-2 mb-3">
              {SLIPPAGE_PRESETS.map((preset) => (
                <button
                  key={preset.bps}
                  onClick={() => handlePresetClick(preset.bps)}
                  className={cn(
                    'py-1.5 text-xs font-mono border transition-colors',
                    slippageBps === preset.bps && !isCustom
                      ? 'bg-cyber text-black border-cyber'
                      : 'bg-dark-700 text-text-secondary border-dark-600 hover:border-cyber'
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Custom Input */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                inputMode="decimal"
                min="0"
                max="50"
                placeholder="Custom"
                value={customInput}
                onChange={(e) => {
                  const value = e.target.value.replace(',', '.');
                  if (value === '' || /^\d*\.?\d*$/.test(value)) {
                    handleCustomChange(value);
                  }
                }}
                className={cn(
                  'w-20 px-2 py-1.5 text-xs font-mono text-center',
                  'bg-dark-900 border border-dark-600',
                  'focus:outline-none focus:border-cyber',
                  isCustom && 'border-cyber'
                )}
              />
              <span className="text-xs text-text-muted">%</span>
            </div>

            {/* Warning for high slippage */}
            {slippageBps > 500 && (
              <div className="mt-2 p-2 bg-warning/10 border border-warning/50 text-warning text-xs">
                ⚠️ High slippage may result in unfavorable trades
              </div>
            )}

            {/* Info text */}
            <p className="mt-3 text-xs text-text-muted">
              Your transaction will revert if the price changes unfavorably by more than this percentage.
            </p>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Hook to use slippage in components
 * Uses storage event to sync across components
 */
export function useSlippage() {
  const [slippageBps, setSlippageBps] = useState(DEFAULT_SLIPPAGE_BPS);

  useEffect(() => {
    // Initial load
    setSlippageBps(getSavedSlippage());

    // Listen for storage changes (from other components or tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === SLIPPAGE_STORAGE_KEY && e.newValue) {
        const parsed = parseInt(e.newValue, 10);
        if (!isNaN(parsed) && parsed >= 0 && parsed <= 5000) {
          setSlippageBps(parsed);
        }
      }
    };

    // Also listen for custom event (for same-tab updates)
    const handleSlippageUpdate = () => {
      setSlippageBps(getSavedSlippage());
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('slippage-updated', handleSlippageUpdate);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('slippage-updated', handleSlippageUpdate);
    };
  }, []);

  const updateSlippage = (bps: number) => {
    setSlippageBps(bps);
    saveSlippage(bps);
    // Dispatch custom event to notify other components in the same tab
    window.dispatchEvent(new Event('slippage-updated'));
  };

  return {
    slippageBps,
    slippagePercent: slippageBps / 100,
    setSlippage: updateSlippage,
    applySlippage: (amount: bigint) => applySlippage(amount, slippageBps),
  };
}
