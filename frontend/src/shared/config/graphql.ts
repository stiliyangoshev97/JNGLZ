/**
 * Apollo Client Configuration
 *
 * Configures Apollo Client for The Graph subgraph queries.
 * No authentication needed - subgraph is public.
 *
 * @module shared/config/graphql
 */

import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';
import { env } from './env';

/**
 * Apollo Client for The Graph
 * 
 * Connected to: junkiefun-bnb-testnet subgraph
 * Endpoint: https://api.studio.thegraph.com/query/1722665/junkiefun-bnb-testnet/0.0.2
 */
export const apolloClient = new ApolloClient({
  link: new HttpLink({
    uri: env.SUBGRAPH_URL,
  }),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          // Merge paginated market queries
          markets: {
            keyArgs: ['where', 'orderBy', 'orderDirection'],
            merge(_existing = [], incoming) {
              return [...incoming];
            },
          },
          // Merge paginated trade queries
          trades: {
            keyArgs: ['where', 'orderBy', 'orderDirection'],
            merge(_existing = [], incoming) {
              return [...incoming];
            },
          },
        },
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
      errorPolicy: 'all',
    },
    query: {
      fetchPolicy: 'cache-first',
      errorPolicy: 'all',
    },
  },
});
