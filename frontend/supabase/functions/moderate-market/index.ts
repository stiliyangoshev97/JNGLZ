import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders, handleCors } from '../_shared/cors.ts'
import { createServiceClient } from '../_shared/supabase.ts'
import { verifySIWE } from '../_shared/siwe.ts'

interface ModerateMarketRequest {
  siweMessage: string
  signature: string
  address: string
  marketId: string
  contractAddress: string
  network: 'bnb-testnet' | 'bnb-mainnet'
  action: 'hide' | 'unhide'
  hiddenFields?: ('name' | 'rules' | 'evidence' | 'image')[]
  reason?: string
}

serve(async (req) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    const body: ModerateMarketRequest = await req.json()
    const { 
      siweMessage, 
      signature, 
      address, 
      marketId, 
      contractAddress, 
      network,
      action,
      hiddenFields,
      reason 
    } = body

    // Validate required fields
    if (!siweMessage || !signature || !address || !marketId || !contractAddress || !network || !action) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate action
    if (!['hide', 'unhide'].includes(action)) {
      return new Response(
        JSON.stringify({ error: 'Invalid action. Must be "hide" or "unhide"' }),
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

    // Validate hiddenFields for hide action
    if (action === 'hide') {
      if (!hiddenFields || hiddenFields.length === 0) {
        return new Response(
          JSON.stringify({ error: 'hiddenFields required for hide action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      const validFields = ['name', 'rules', 'evidence', 'image']
      for (const field of hiddenFields) {
        if (!validFields.includes(field)) {
          return new Response(
            JSON.stringify({ error: `Invalid field: ${field}. Must be one of: ${validFields.join(', ')}` }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      }
    }

    // Verify SIWE signature
    const isValidSig = await verifySIWE(siweMessage, signature as `0x${string}`, address)
    if (!isValidSig) {
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if address is admin
    const adminAddresses = Deno.env.get('ADMIN_ADDRESSES')?.split(',').map(a => a.toLowerCase()) || []
    if (!adminAddresses.includes(address.toLowerCase())) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized. Only admins can moderate markets.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase client with service role
    const supabase = createServiceClient()

    if (action === 'hide') {
      // Insert or update moderation record
      const { data, error } = await supabase
        .from('moderated_markets')
        .upsert({
          market_id: marketId,
          contract_address: contractAddress.toLowerCase(),
          network,
          hidden_fields: hiddenFields,
          reason: reason || null,
          moderated_by: address.toLowerCase(),
          moderated_at: new Date().toISOString(),
          is_active: true,
        }, {
          onConflict: 'contract_address,network,market_id'
        })
        .select()
        .single()

      if (error) {
        console.error('Moderation insert error:', error)
        return new Response(
          JSON.stringify({ error: 'Failed to moderate market' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ success: true, action: 'hide', moderation: data }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )

    } else {
      // Unhide: Set is_active to false
      const { data, error } = await supabase
        .from('moderated_markets')
        .update({
          is_active: false,
          moderated_by: address.toLowerCase(),
          moderated_at: new Date().toISOString(),
        })
        .eq('contract_address', contractAddress.toLowerCase())
        .eq('network', network)
        .eq('market_id', marketId)
        .select()
        .single()

      if (error) {
        // No record found is OK for unhide
        if (error.code === 'PGRST116') {
          return new Response(
            JSON.stringify({ success: true, action: 'unhide', message: 'Market was not moderated' }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        
        console.error('Moderation update error:', error)
        return new Response(
          JSON.stringify({ error: 'Failed to unhide market' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ success: true, action: 'unhide', moderation: data }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
