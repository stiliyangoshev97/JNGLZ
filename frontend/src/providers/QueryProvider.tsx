/**
 * React Query Provider
 *
 * Configures TanStack Query (React Query) for server state management.
 * Handles caching, background refetching, and request deduplication.
 *
 * @module providers/QueryProvider
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';

interface QueryProviderProps {
  children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  // Create QueryClient inside component to avoid SSR issues
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Don't refetch on window focus (Web3 apps have wallet popups)
            refetchOnWindowFocus: false,
            // Retry failed requests once
            retry: 1,
            // Data is fresh for 2 minutes
            staleTime: 1000 * 60 * 2,
            // Keep unused data for 10 minutes
            gcTime: 1000 * 60 * 10,
          },
          mutations: {
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

export default QueryProvider;
