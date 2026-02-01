import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { ModeratedMarket, HiddenField, Network } from '@/lib/database.types'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL

interface ModerateMarketParams {
  siweMessage: string
  signature: string
  address: string
  marketId: string
  contractAddress: string
  network: Network
  action: 'hide' | 'unhide'
  hiddenFields?: HiddenField[]
  reason?: string
}

interface ModerateMarketResponse {
  success: boolean
  moderation?: ModeratedMarket
  error?: string
}

/**
 * Fetch moderation status for a specific market
 */
export async function fetchMarketModeration(params: {
  marketId: string
  contractAddress: string
  network: Network
}): Promise<ModeratedMarket | null> {
  if (!isSupabaseConfigured || !supabase) {
    return null
  }

  const { data, error } = await supabase
    .from('moderated_markets')
    .select('*')
    .eq('market_id', params.marketId)
    .eq('contract_address', params.contractAddress.toLowerCase())
    .eq('network', params.network)
    .eq('is_active', true)
    .single()

  if (error) {
    // No record found is not an error
    if (error.code === 'PGRST116') {
      return null
    }
    console.error('Error fetching market moderation:', error)
    return null
  }

  return data
}

/**
 * Fetch moderation status for multiple markets
 */
export async function fetchMarketsModeration(params: {
  marketIds: string[]
  contractAddress: string
  network: Network
}): Promise<Map<string, ModeratedMarket>> {
  if (!isSupabaseConfigured || !supabase || params.marketIds.length === 0) {
    return new Map()
  }

  const { data, error } = await supabase
    .from('moderated_markets')
    .select('*')
    .in('market_id', params.marketIds)
    .eq('contract_address', params.contractAddress.toLowerCase())
    .eq('network', params.network)
    .eq('is_active', true)
    .returns<ModeratedMarket[]>()

  if (error) {
    console.error('Error fetching markets moderation:', error)
    return new Map()
  }

  const moderationMap = new Map<string, ModeratedMarket>()
  if (data) {
    for (const mod of data) {
      moderationMap.set(mod.market_id, mod)
    }
  }

  return moderationMap
}

/**
 * Moderate a market via Edge Function
 */
export async function moderateMarket(params: ModerateMarketParams): Promise<ModerateMarketResponse> {
  if (!SUPABASE_URL) {
    return { success: false, error: 'Supabase not configured' }
  }

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/moderate-market`, {
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
        error: data.error || 'Failed to moderate market',
      }
    }

    return {
      success: true,
      moderation: data.moderation,
    }
  } catch (error) {
    console.error('Error moderating market:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to moderate market',
    }
  }
}

/**
 * Check if a field should be hidden for a market
 */
export function isFieldHidden(
  moderation: ModeratedMarket | null | undefined,
  field: HiddenField
): boolean {
  if (!moderation || !moderation.is_active) {
    return false
  }
  return moderation.hidden_fields.includes(field)
}

/**
 * Get placeholder text for hidden content
 */
export function getHiddenPlaceholder(field: HiddenField): string {
  switch (field) {
    case 'name':
      return '[Content Hidden by Moderator]'
    case 'rules':
      return '[Content Hidden by Moderator]'
    case 'evidence':
      return '[Link Hidden]'
    case 'image':
      return 'CONTENT HIDDEN'
    default:
      return '[Hidden]'
  }
}
