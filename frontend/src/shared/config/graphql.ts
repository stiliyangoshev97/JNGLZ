/**
 * Apollo Client Configuration
 *
 * Configures Apollo Client for The Graph subgraph queries.
 * Uses Bearer token authentication for production gateway.
 *
 * @module shared/config/graphql
 */

import { ApolloClient, InMemoryCache, HttpLink, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { env } from './env';

/**
 * HTTP Link - connects to The Graph gateway
 */
const httpLink = new HttpLink({
  uri: env.SUBGRAPH_URL,
});

/**
 * Auth Link - adds Bearer token for The Graph production gateway
 * Required for published subgraphs with rate limit protection
 */
const authLink = setContext((_, { headers }) => {
  return {
    headers: {
      ...headers,
      Authorization: env.GRAPH_API_KEY ? `Bearer ${env.GRAPH_API_KEY}` : '',
    },
  };
});

/**
 * Apollo Client for The Graph
 * 
 * Connected to: junkiefun-bnb-testnet subgraph (Production Gateway)
 * Rate Limit: 100,000 queries/month
 * Domains: localhost, junkie.fun (whitelisted)
 */
export const apolloClient = new ApolloClient({
  link: from([authLink, httpLink]),
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
