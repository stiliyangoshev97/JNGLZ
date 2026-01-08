/**
 * GraphQL Provider
 *
 * Wraps the application with Apollo Client for The Graph subgraph queries.
 *
 * @module providers/GraphQLProvider
 */

import { ApolloProvider } from '@apollo/client/react';
import { apolloClient } from '@/shared/config/graphql';

interface GraphQLProviderProps {
  children: React.ReactNode;
}

export function GraphQLProvider({ children }: GraphQLProviderProps) {
  return (
    <ApolloProvider client={apolloClient}>
      {children}
    </ApolloProvider>
  );
}

export default GraphQLProvider;
