/**
 * Web3 Provider
 *
 * Wraps the application with Wagmi and RainbowKit providers for Web3 functionality.
 * Configures wallet connection for BNB Chain with a custom BRUTALIST dark theme.
 *
 * @module providers/Web3Provider
 *
 * IMPORTANT: Must be wrapped by QueryProvider (React Query) for RainbowKit to work
 *
 * THEME: Custom brutalist dark theme
 * - No rounded corners
 * - Harsh borders
 * - Neon accent colors
 */

import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider, darkTheme, type Theme } from '@rainbow-me/rainbowkit';
import { wagmiConfig } from '@/shared/config/wagmi';

// Import RainbowKit styles
import '@rainbow-me/rainbowkit/styles.css';

interface Web3ProviderProps {
  children: React.ReactNode;
}

/**
 * Custom BRUTALIST dark theme for RainbowKit
 * - No rounded corners (0px radius)
 * - Cyber blue accent
 * - True black background
 */
const brutalistTheme: Theme = {
  ...darkTheme({
    accentColor: '#00E0FF', // Cyber blue
    accentColorForeground: '#000000',
    borderRadius: 'none', // NO rounded corners
    fontStack: 'system',
    overlayBlur: 'none',
  }),
  colors: {
    ...darkTheme().colors,
    // Override with true black
    modalBackground: '#000000',
    modalBackdrop: 'rgba(0, 0, 0, 0.8)',
    profileForeground: '#0a0a0a',
    actionButtonBorder: '#262626',
    actionButtonBorderMobile: '#262626',
    actionButtonSecondaryBackground: '#141414',
    closeButton: '#666666',
    closeButtonBackground: '#141414',
    connectButtonBackground: '#000000',
    connectButtonBackgroundError: '#FF3131',
    connectButtonInnerBackground: '#141414',
    connectButtonText: '#FFFFFF',
    connectButtonTextError: '#FFFFFF',
    connectionIndicator: '#39FF14',
    error: '#FF3131',
    generalBorder: '#262626',
    generalBorderDim: '#1a1a1a',
    menuItemBackground: '#141414',
    modalBorder: '#262626',
    modalText: '#FFFFFF',
    modalTextDim: '#666666',
    modalTextSecondary: '#A0A0A0',
    profileAction: '#141414',
    profileActionHover: '#1a1a1a',
    selectedOptionBorder: '#00E0FF',
    standby: '#FFB800',
  },
  radii: {
    actionButton: '0px',
    connectButton: '0px',
    menuButton: '0px',
    modal: '0px',
    modalMobile: '0px',
  },
  shadows: {
    connectButton: 'none',
    dialog: 'none',
    profileDetailsAction: 'none',
    selectedOption: 'none',
    selectedWallet: 'none',
    walletLogo: 'none',
  },
};

export function Web3Provider({ children }: Web3ProviderProps) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <RainbowKitProvider
        theme={brutalistTheme}
        modalSize="compact"
        appInfo={{
          appName: 'JunkieFun',
          learnMoreUrl: 'https://junkie.fun/about',
        }}
      >
        {children}
      </RainbowKitProvider>
    </WagmiProvider>
  );
}

export default Web3Provider;
