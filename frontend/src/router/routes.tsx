/**
 * ===== ROUTES CONFIGURATION =====
 *
 * React Router configuration with all app routes.
 *
 * @module router/routes
 */

import { createBrowserRouter, Navigate } from 'react-router-dom';
import { RootLayout } from './RootLayout';

// Lazy load pages for code splitting
import { lazy, Suspense } from 'react';
import { LoadingOverlay } from '@/shared/components/ui/Spinner';

// Page components (lazy loaded)
const MarketsPage = lazy(() => import('@/features/markets/pages/MarketsPage'));
const MarketDetailPage = lazy(() => import('@/features/markets/pages/MarketDetailPage'));
const PortfolioPage = lazy(() => import('@/features/portfolio/pages/PortfolioPage'));
const CreateMarketPage = lazy(() => import('@/features/create/pages/CreateMarketPage'));

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
      // Catch-all redirect to home
      {
        path: '*',
        element: <Navigate to="/" replace />,
      },
    ],
  },
]);

export default router;
