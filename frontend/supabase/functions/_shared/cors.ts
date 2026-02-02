/**
 * CORS Configuration for Edge Functions
 * 
 * Allows requests from:
 * - Production: https://jnglz.fun
 * - Development: http://localhost:* (any port)
 * 
 * Security: Only whitelisted origins can call these functions.
 */

// Allowed origins (production + local development)
const ALLOWED_ORIGINS = [
  'https://jnglz.fun',
  'https://www.jnglz.fun',
  // Development origins - localhost on any port
  'http://localhost:5173',  // Vite default
  'http://localhost:3000',  // Common alternative
  'http://localhost:4173',  // Vite preview
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:4173',
]

/**
 * Get CORS headers for a specific request origin
 * Returns headers with the origin if it's allowed, otherwise blocks the request
 */
export function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('origin') || ''
  
  // Check if origin is allowed
  const isAllowed = ALLOWED_ORIGINS.some(allowed => {
    // Exact match
    if (origin === allowed) return true
    // Match localhost with any port
    if (origin.match(/^http:\/\/(localhost|127\.0\.0\.1):\d+$/)) return true
    return false
  })
  
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
  }
}

// Static headers for backwards compatibility (uses dynamic origin checking)
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Will be overridden by getCorsHeaders in handlers
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

export function handleCors(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: getCorsHeaders(req) })
  }
  return null
}
