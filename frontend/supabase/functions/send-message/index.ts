import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders, handleCors } from '../_shared/cors.ts'
import { createServiceClient } from '../_shared/supabase.ts'
import { verifySIWE } from '../_shared/siwe.ts'
import { 
  processMessage, 
  hasEnoughShares, 
  MIN_SHARES_TO_CHAT 
} from '../_shared/validation.ts'

interface SendMessageRequest {
  message: string
  siweMessage: string
  signature: string
  address: string
  marketId: string
  contractAddress: string
  network: 'bnb-testnet' | 'bnb-mainnet'
}

// Subgraph endpoints for position verification
const SUBGRAPH_URLS: Record<string, string> = {
  'bnb-testnet': Deno.env.get('SUBGRAPH_URL_TESTNET') || 'https://api.studio.thegraph.com/query/1722665/jnglz-testnet-fresh/v3.0.0',
  'bnb-mainnet': Deno.env.get('SUBGRAPH_URL_MAINNET') || '',
}

/**
 * Verify user's position via subgraph query
 * This is the source of truth - don't trust frontend data
 */
async function verifyPosition(
  network: string,
  marketId: string,
  userAddress: string
): Promise<{ yesShares: string; noShares: string; isCreator: boolean } | null> {
  const subgraphUrl = SUBGRAPH_URLS[network]
  if (!subgraphUrl) {
    console.error('No subgraph URL for network:', network)
    return null
  }

  const query = `
    query GetPosition($marketId: ID!, $positionId: ID!) {
      market(id: $marketId) {
        creatorAddress
      }
      position(id: $positionId) {
        yesShares
        noShares
      }
    }
  `

  // Position ID format: marketId-userAddress
  const positionId = `${marketId}-${userAddress.toLowerCase()}`

  try {
    const response = await fetch(subgraphUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        variables: { marketId, positionId }
      })
    })

    const result = await response.json()
    
    if (result.errors) {
      console.error('Subgraph query error:', result.errors)
      return null
    }

    const market = result.data?.market
    const position = result.data?.position

    return {
      yesShares: position?.yesShares || '0',
      noShares: position?.noShares || '0',
      isCreator: market?.creatorAddress?.toLowerCase() === userAddress.toLowerCase()
    }
  } catch (error) {
    console.error('Subgraph fetch error:', error)
    return null
  }
}

serve(async (req) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    const body: SendMessageRequest = await req.json()
    const { message, siweMessage, signature, address, marketId, contractAddress, network } = body

    // Validate required fields
    if (!message || !siweMessage || !signature || !address || !marketId || !contractAddress || !network) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate message length (before sanitization to give accurate feedback)
    if (message.length > 500) {
      return new Response(
        JSON.stringify({ error: 'Message exceeds 500 character limit' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate network
    if (!['bnb-testnet', 'bnb-mainnet'].includes(network)) {
      return new Response(
        JSON.stringify({ error: 'Invalid network' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify SIWE signature
    const isValidSig = await verifySIWE(siweMessage, signature as `0x${string}`, address)
    if (!isValidSig) {
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase client with service role
    const supabase = createServiceClient()

    // ============ HOLDER VERIFICATION ============
    // Verify position via subgraph (source of truth)
    const positionData = await verifyPosition(network, marketId, address)
    
    if (!positionData) {
      // Subgraph query failed - allow with warning (graceful degradation)
      console.warn('Could not verify position, allowing message')
    } else {
      const { yesShares, noShares, isCreator } = positionData
      
      // Check if user can chat:
      // 1. Creator can always chat in their own market
      // 2. Holders with >= 0.001 shares can chat
      if (!isCreator && !hasEnoughShares(yesShares, noShares)) {
        const minSharesFormatted = (Number(MIN_SHARES_TO_CHAT) / 1e18).toFixed(3)
        return new Response(
          JSON.stringify({ 
            error: `You need at least ${minSharesFormatted} shares to chat in this market`,
            code: 'INSUFFICIENT_SHARES'
          }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // ============ RATE LIMIT CHECK ============
    // First try to get with last_message_content, fall back to just last_message_at
    let rateLimit: { last_message_at: string; last_message_content?: string } | null = null
    
    const { data: rateLimitData, error: rateLimitError } = await supabase
      .from('chat_rate_limits')
      .select('last_message_at, last_message_content')
      .eq('wallet_address', address.toLowerCase())
      .single()
    
    if (rateLimitError && rateLimitError.code !== 'PGRST116') {
      // PGRST116 = no rows found (normal case for new users)
      // If error is about missing column, try without it
      if (rateLimitError.message?.includes('last_message_content')) {
        console.warn('last_message_content column not found, fetching without it')
        const { data: fallbackData } = await supabase
          .from('chat_rate_limits')
          .select('last_message_at')
          .eq('wallet_address', address.toLowerCase())
          .single()
        if (fallbackData) {
          rateLimit = { last_message_at: fallbackData.last_message_at }
        }
      } else {
        console.error('Rate limit query error:', rateLimitError)
      }
    } else if (rateLimitData) {
      rateLimit = rateLimitData
    }

    if (rateLimit) {
      const lastMessage = new Date(rateLimit.last_message_at)
      const now = new Date()
      const diffMs = now.getTime() - lastMessage.getTime()
      const diffSeconds = Math.floor(diffMs / 1000)
      
      if (diffSeconds < 60) {
        const waitSeconds = 60 - diffSeconds
        return new Response(
          JSON.stringify({ 
            error: `Rate limited. Please wait ${waitSeconds} seconds before sending another message.`,
            waitSeconds,
            code: 'RATE_LIMITED'
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // ============ MESSAGE VALIDATION ============
    // Process message: sanitize + validate (links, profanity, spam)
    const lastMessageContent = rateLimit?.last_message_content || null
    const { sanitized, error: validationError } = processMessage(message, lastMessageContent)
    
    if (validationError) {
      return new Response(
        JSON.stringify({ 
          error: validationError,
          code: 'VALIDATION_FAILED'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check sanitized message is not empty
    if (!sanitized || sanitized.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Message cannot be empty' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ============ INSERT MESSAGE ============
    const { data: newMessage, error: insertError } = await supabase
      .from('chat_messages')
      .insert({
        market_id: marketId,
        contract_address: contractAddress.toLowerCase(),
        network,
        sender_address: address.toLowerCase(),
        message: sanitized, // Use sanitized message
      })
      .select()
      .single()

    if (insertError) {
      console.error('Insert error:', insertError)
      return new Response(
        JSON.stringify({ error: 'Failed to send message' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ============ UPDATE RATE LIMIT ============
    // Try with last_message_content, fall back without it if column doesn't exist
    const { error: upsertError } = await supabase
      .from('chat_rate_limits')
      .upsert({
        wallet_address: address.toLowerCase(),
        last_message_at: new Date().toISOString(),
        last_message_content: sanitized, // Store for spam detection
      })
    
    if (upsertError && upsertError.message?.includes('last_message_content')) {
      // Column doesn't exist, try without it
      console.warn('last_message_content column not found in upsert, using fallback')
      await supabase
        .from('chat_rate_limits')
        .upsert({
          wallet_address: address.toLowerCase(),
          last_message_at: new Date().toISOString(),
        })
    }

    return new Response(
      JSON.stringify({ success: true, message: newMessage }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
