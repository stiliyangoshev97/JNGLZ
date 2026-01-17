/**
 * JNGLZ.FUN App Root
 *
 * Main application component that wraps everything with providers
 * and renders the router.
 * 
 * MAINTENANCE MODE:
 * Set VITE_MAINTENANCE_MODE=true in .env.local to block the entire site.
 * Optionally set VITE_MAINTENANCE_MESSAGE and VITE_MAINTENANCE_END_TIME.
 * See README.md for full instructions.
 */

import { RouterProvider } from 'react-router-dom';
import { QueryProvider } from '@/providers/QueryProvider';
import { Web3Provider } from '@/providers/Web3Provider';
import { GraphQLProvider } from '@/providers/GraphQLProvider';
import { ToastProvider } from '@/shared/components/ui/Toast';
import { router } from '@/router';
import { MaintenancePage } from '@/features/maintenance';
import { env } from '@/shared/config/env';

function App() {
  // Show maintenance page if maintenance mode is enabled (blocks entire site)
  if (env.MAINTENANCE_MODE) {
    return <MaintenancePage />;
  }

  return (
    <QueryProvider>
      <Web3Provider>
        <GraphQLProvider>
          <ToastProvider>
            <RouterProvider router={router} />
          </ToastProvider>
        </GraphQLProvider>
      </Web3Provider>
    </QueryProvider>
  );
}

export default App;