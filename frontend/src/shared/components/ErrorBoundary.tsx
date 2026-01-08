/**
 * ===== ERROR BOUNDARY =====
 *
 * Handles application errors with a brutalist UI.
 * 
 * Two types of errors:
 * 1. Chunk loading errors (after deployments) - Shows "Update Available"
 * 2. General runtime errors - Shows error details with retry option
 *
 * USAGE:
 * Add as errorElement on your router configuration:
 * ```tsx
 * createBrowserRouter([
 *   {
 *     path: '/',
 *     element: <RootLayout />,
 *     errorElement: <ErrorBoundary />,
 *     children: [...]
 *   }
 * ])
 * ```
 *
 * @module shared/components/ErrorBoundary
 */

import { useRouteError, isRouteErrorResponse, Link } from 'react-router-dom';
import { Button } from './ui/Button';

/**
 * Checks if the error is related to chunk/module loading failures.
 * These errors typically occur after deployments when cached pages
 * reference old chunk files that no longer exist.
 */
function isChunkLoadError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('failed to fetch dynamically imported module') ||
      message.includes('loading chunk') ||
      message.includes('loading css chunk') ||
      message.includes('dynamically imported module') ||
      message.includes('failed to load')
    );
  }
  return false;
}

/**
 * Handles the page refresh action.
 */
function handleRefresh(): void {
  window.location.reload();
}

/**
 * ErrorBoundary Component
 *
 * Displays a brutalist "Update Available" UI when chunk loading fails,
 * or a detailed error message for other route errors.
 */
export function ErrorBoundary() {
  const error = useRouteError();

  // Check if this is a chunk loading error
  const isChunkError = isChunkLoadError(error);

  // For chunk errors, show the update available UI
  if (isChunkError) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="max-w-md w-full border-2 border-cyber bg-dark-900 p-8 text-center">
          {/* Glitch effect title */}
          <div className="mb-6">
            <p className="text-6xl mb-4">🔄</p>
            <h1 className="text-3xl font-black uppercase text-cyber glitch-text">
              UPDATE AVAILABLE
            </h1>
          </div>

          {/* Description */}
          <p className="text-text-secondary font-mono mb-6 leading-relaxed">
            A new version of JUNKIEFUN is available. Hit refresh to get the latest 
            updates and continue trading.
          </p>

          {/* Scanner line decoration */}
          <div className="h-px bg-gradient-to-r from-transparent via-cyber to-transparent mb-6" />

          {/* Refresh Button */}
          <Button
            onClick={handleRefresh}
            variant="cyber"
            size="lg"
            className="w-full"
          >
            ↻ REFRESH PAGE
          </Button>

          {/* Subtle note */}
          <p className="mt-6 text-xs text-text-muted font-mono uppercase">
            This happens after we ship new features 🚀
          </p>
        </div>
      </div>
    );
  }

  // Get error details for other errors
  const errorMessage = isRouteErrorResponse(error)
    ? `${error.status} - ${error.statusText}`
    : error instanceof Error
      ? error.message
      : 'An unexpected error occurred';

  const errorStack = error instanceof Error ? error.stack : undefined;

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-lg w-full border-2 border-no bg-dark-900 p-8 text-center">
        {/* Skull icon */}
        <div className="mb-6">
          <p className="text-6xl mb-4">💀</p>
          <h1 className="text-3xl font-black uppercase text-no">
            SOMETHING BROKE
          </h1>
        </div>

        {/* Error message */}
        <div className="border border-dark-600 bg-black p-4 mb-6 text-left">
          <p className="text-xs text-text-muted font-mono uppercase mb-2">ERROR:</p>
          <p className="text-no font-mono text-sm break-all">
            {errorMessage}
          </p>
          {errorStack && (
            <details className="mt-3">
              <summary className="text-xs text-text-muted font-mono cursor-pointer hover:text-text-secondary">
                STACK TRACE
              </summary>
              <pre className="mt-2 text-xs text-text-muted font-mono overflow-x-auto whitespace-pre-wrap max-h-40 overflow-y-auto">
                {errorStack}
              </pre>
            </details>
          )}
        </div>

        {/* Scanner line decoration */}
        <div className="h-px bg-gradient-to-r from-transparent via-no to-transparent mb-6" />

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={handleRefresh}
            variant="ghost"
            size="lg"
            className="flex-1"
          >
            ↻ TRY AGAIN
          </Button>
          <Link to="/" className="flex-1">
            <Button
              variant="cyber"
              size="lg"
              className="w-full"
            >
              🏠 GO HOME
            </Button>
          </Link>
        </div>

        {/* Dev tip */}
        <p className="mt-6 text-xs text-text-muted font-mono">
          If this keeps happening, try clearing your cache or{' '}
          <a 
            href="https://twitter.com/junkiefun" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-cyber hover:underline"
          >
            report it to us
          </a>
        </p>
      </div>
    </div>
  );
}

export default ErrorBoundary;
