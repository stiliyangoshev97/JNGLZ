import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { getCorsHeaders, handleCors } from '../_shared/cors.ts'
import { createServiceClient } from '../_shared/supabase.ts'
import { verifySIWE } from '../_shared/siwe.ts'

interface DeleteMessageRequest {
  siweMessage: string
  signature: string
  address: string
  messageId: string
}

serve(async (req) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse
  
  // Get dynamic CORS headers for this request
  const corsHeaders = getCorsHeaders(req)

  try {
    const body: DeleteMessageRequest = await req.json()
    const { siweMessage, signature, address, messageId } = body

    // Validate required fields
    if (!siweMessage || !signature || !address || !messageId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
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

    // Check if address is admin
    const adminAddresses = Deno.env.get('ADMIN_ADDRESSES')?.split(',').map(a => a.toLowerCase()) || []
    if (!adminAddresses.includes(address.toLowerCase())) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized. Only admins can delete messages.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase client with service role
    const supabase = createServiceClient()

    // Delete the message
    const { error } = await supabase
      .from('chat_messages')
      .delete()
      .eq('id', messageId)

    if (error) {
      console.error('Delete message error:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to delete message' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('Delete message error:', err)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
