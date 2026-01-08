/**
 * ===== ROUTES CONFIGURATION =====
 *
 * React Router configuration with all app routes.
 *
 * @module router/routes
 */

import { createBrowserRouter, Navigate } from 'react-router-dom';
import { RootLayout } from './RootLayout';
import { ErrorBoundary } from '@/shared/components';

// Lazy load pages for code splitting
import { lazy, Suspense } from 'react';
import { LoadingOverlay } from '@/shared/components/ui/Spinner';

// Page components (lazy loaded)
const MarketsPage = lazy(() => import('@/features/markets/pages/MarketsPage'));
const MarketDetailPage = lazy(() => import('@/features/markets/pages/MarketDetailPage'));
const PortfolioPage = lazy(() => import('@/features/portfolio/pages/PortfolioPage'));
const CreateMarketPage = lazy(() => import('@/features/create/pages/CreateMarketPage'));
const TermsPage = lazy(() => import('@/features/legal/pages/TermsPage'));
const PrivacyPage = lazy(() => import('@/features/legal/pages/PrivacyPage'));

/**
 * Suspense wrapper for lazy-loaded pages
 */
function PageLoader({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<LoadingOverlay message="LOADING PAGE" />}>
      {children}
    </Suspense>
  );
}

/**
 * Router configuration
 */
export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <ErrorBoundary />,
    children: [
      {
        index: true,
        element: (
          <PageLoader>
            <MarketsPage />
          </PageLoader>
        ),
      },
      {
        path: 'market/:marketId',
        element: (
          <PageLoader>
            <MarketDetailPage />
          </PageLoader>
        ),
      },
      {
        path: 'portfolio',
        element: (
          <PageLoader>
            <PortfolioPage />
          </PageLoader>
        ),
      },
      {
        path: 'create',
        element: (
          <PageLoader>
            <CreateMarketPage />
          </PageLoader>
        ),
      },
      {
        path: 'terms',
        element: (
          <PageLoader>
            <TermsPage />
          </PageLoader>
        ),
      },
      {
        path: 'privacy',
        element: (
          <PageLoader>
            <PrivacyPage />
          </PageLoader>
        ),
      },
      // Catch-all redirect to home
      {
        path: '*',
        element: <Navigate to="/" replace />,
      },
    ],
  },
]);

export default router;
