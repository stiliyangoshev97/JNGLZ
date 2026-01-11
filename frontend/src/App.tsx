/**
 * JNGLZ.FUN App Root
 *
 * Main application component that wraps everything with providers
 * and renders the router.
 */

import { RouterProvider } from 'react-router-dom';
import { QueryProvider } from '@/providers/QueryProvider';
import { Web3Provider } from '@/providers/Web3Provider';
import { GraphQLProvider } from '@/providers/GraphQLProvider';
import { router } from '@/router';

function App() {
  return (
    <QueryProvider>
      <Web3Provider>
        <GraphQLProvider>
          <RouterProvider router={router} />
        </GraphQLProvider>
      </Web3Provider>
    </QueryProvider>
  );
}

export default App;