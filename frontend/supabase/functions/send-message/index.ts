import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders, handleCors } from '../_shared/cors.ts'
import { createServiceClient } from '../_shared/supabase.ts'
import { verifySIWE } from '../_shared/siwe.ts'

interface SendMessageRequest {
  message: string
  siweMessage: string
  signature: string
  address: string
  marketId: string
  contractAddress: string
  network: 'bnb-testnet' | 'bnb-mainnet'
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

    // Validate message length
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

    // Check rate limit (1 message per minute)
    const { data: rateLimit } = await supabase
      .from('chat_rate_limits')
      .select('last_message_at')
      .eq('wallet_address', address.toLowerCase())
      .single()

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
            waitSeconds 
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Insert the message
    const { data: newMessage, error: insertError } = await supabase
      .from('chat_messages')
      .insert({
        market_id: marketId,
        contract_address: contractAddress.toLowerCase(),
        network,
        sender_address: address.toLowerCase(),
        message: message.trim(),
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

    // Update rate limit
    await supabase
      .from('chat_rate_limits')
      .upsert({
        wallet_address: address.toLowerCase(),
        last_message_at: new Date().toISOString(),
      })

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
