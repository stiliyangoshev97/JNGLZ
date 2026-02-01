import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { ChatMessage, Network } from '@/lib/database.types'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL

interface SendMessageParams {
  message: string
  siweMessage: string
  signature: string
  address: string
  marketId: string
  contractAddress: string
  network: Network
}

interface SendMessageResponse {
  success: boolean
  message?: ChatMessage
  error?: string
  waitSeconds?: number
}

/**
 * Fetch chat messages for a specific market
 */
export async function fetchChatMessages(params: {
  marketId: string
  contractAddress: string
  network: Network
  limit?: number
}): Promise<ChatMessage[]> {
  if (!isSupabaseConfigured || !supabase) {
    console.warn('Supabase not configured')
    return []
  }

  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('market_id', params.marketId)
    .eq('contract_address', params.contractAddress.toLowerCase())
    .eq('network', params.network)
    .order('created_at', { ascending: true })
    .limit(params.limit || 100)

  if (error) {
    console.error('Error fetching chat messages:', error)
    return []
  }

  return data || []
}

/**
 * Send a chat message via Edge Function
 */
export async function sendChatMessage(params: SendMessageParams): Promise<SendMessageResponse> {
  if (!SUPABASE_URL) {
    return { success: false, error: 'Supabase not configured' }
  }

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/send-message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Failed to send message',
        waitSeconds: data.waitSeconds,
      }
    }

    return {
      success: true,
      message: data.message,
    }
  } catch (error) {
    console.error('Error sending chat message:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send message',
    }
  }
}

/**
 * Subscribe to real-time chat updates
 */
export function subscribeToChatMessages(
  params: {
    marketId: string
    contractAddress: string
    network: Network
  },
  onMessage: (message: ChatMessage) => void
): (() => void) | null {
  if (!isSupabaseConfigured || !supabase) {
    console.warn('Supabase not configured')
    return null
  }

  const channel = supabase
    .channel(`chat-${params.contractAddress}-${params.network}-${params.marketId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `market_id=eq.${params.marketId}`,
      },
      (payload) => {
        const newMessage = payload.new as ChatMessage
        // Verify it's for this contract/network
        if (
          newMessage.contract_address.toLowerCase() === params.contractAddress.toLowerCase() &&
          newMessage.network === params.network
        ) {
          onMessage(newMessage)
        }
      }
    )
    .subscribe()

  // Return unsubscribe function
  return () => {
    if (supabase) {
      supabase.removeChannel(channel)
    }
  }
}
