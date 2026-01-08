/**
 * ===== WRONG NETWORK MODAL =====
 *
 * CRITICAL: Shows when user is connected to an unsupported chain.
 *
 * This modal is essential to prevent users from getting stuck,
 * especially with wallets like Phantom that don't support BNB Chain.
 *
 * KEY FEATURES:
 * - Always shows disconnect button (NEVER hide this!)
 * - Prompts user to switch to BNB Chain
 * - Cannot be dismissed by clicking outside (must take action)
 * - Shows helpful error messages
 *
 * @module shared/components/WrongNetworkModal
 */

import { useChainValidation } from '@/shared/hooks/useChainValidation';
import { Modal } from '@/shared/components/ui/Modal';
import { Button } from '@/shared/components/ui/Button';
import { Spinner } from '@/shared/components/ui/Spinner';

export function WrongNetworkModal() {
  const {
    isWrongNetwork,
    targetChainName,
    isSwitching,
    switchError,
    switchToSupportedChain,
    disconnect,
  } = useChainValidation();

  // Don't render if on correct network
  if (!isWrongNetwork) return null;

  return (
    <Modal
      isOpen={isWrongNetwork}
      onClose={() => {}} // Cannot close by clicking outside
      preventClose // Disable escape key and backdrop click
      showCloseButton={false} // No close button
      title="⚠️ WRONG NETWORK"
      size="sm"
    >
      <div className="space-y-6">
        {/* Warning Icon & Message */}
        <div className="text-center">
          <div className="text-6xl mb-4">🔗</div>
          <p className="text-text-secondary text-sm">
            You're connected to an unsupported network.
          </p>
          <p className="text-white font-semibold mt-2">
            Please switch to <span className="text-cyber">{targetChainName}</span> to continue.
          </p>
        </div>

        {/* Error Message */}
        {switchError && (
          <div className="p-3 bg-no/10 border border-no text-no text-sm font-mono">
            <p className="font-semibold mb-1">SWITCH FAILED</p>
            <p className="text-xs opacity-80">
              {switchError.message.includes('user rejected')
                ? 'You rejected the network switch request.'
                : 'Your wallet may not support this network. Try disconnecting and using a different wallet.'}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {/* Switch Network Button */}
          <Button
            variant="cyber"
            size="lg"
            onClick={switchToSupportedChain}
            disabled={isSwitching}
            className="w-full"
          >
            {isSwitching ? (
              <span className="flex items-center justify-center gap-2">
                <Spinner size="sm" variant="cyber" />
                SWITCHING...
              </span>
            ) : (
              `SWITCH TO ${targetChainName.toUpperCase()}`
            )}
          </Button>

          {/* Disconnect Button - ALWAYS VISIBLE AND ENABLED */}
          <Button
            variant="ghost"
            size="lg"
            onClick={disconnect}
            className="w-full text-no hover:text-no hover:border-no"
          >
            DISCONNECT WALLET
          </Button>
        </div>

        {/* Help Text */}
        <p className="text-xs text-text-muted text-center">
          If you can't switch networks, disconnect and try a different wallet.
          <br />
          <span className="text-cyber">MetaMask</span> and{' '}
          <span className="text-cyber">Trust Wallet</span> work best with BNB Chain.
        </p>
      </div>
    </Modal>
  );
}

/**
 * Inline wrong network warning banner
 * Can be placed at the top of the page as a persistent warning
 */
export function WrongNetworkBanner() {
  const {
    isWrongNetwork,
    targetChainName,
    isSwitching,
    switchToSupportedChain,
    disconnect,
  } = useChainValidation();

  if (!isWrongNetwork) return null;

  return (
    <div className="bg-no/20 border-b border-no px-4 py-3">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-no font-bold">⚠️ WRONG NETWORK</span>
          <span className="text-text-secondary">
            Switch to {targetChainName} to trade
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="cyber"
            size="sm"
            onClick={switchToSupportedChain}
            disabled={isSwitching}
          >
            {isSwitching ? 'SWITCHING...' : 'SWITCH NETWORK'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={disconnect}
            className="text-no hover:text-no"
          >
            DISCONNECT
          </Button>
        </div>
      </div>
    </div>
  );
}

export default WrongNetworkModal;
