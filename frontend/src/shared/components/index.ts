/**
 * Shared Components Barrel Export
 *
 * @module shared/components
 */

// UI Components
export * from './ui';

// App-wide components
export { WrongNetworkModal, WrongNetworkBanner } from './WrongNetworkModal';
export { ErrorBoundary } from './ErrorBoundary';
export { SlippageSettings, useSlippage, applySlippage, getSavedSlippage, DEFAULT_SLIPPAGE_BPS } from './SlippageSettings';

// Legal components
export * from './legal';
