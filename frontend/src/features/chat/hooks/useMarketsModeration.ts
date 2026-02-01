/**
 * Hook to fetch moderation status for multiple markets at once
 * 
 * Used in the markets list page to batch fetch moderation data
 * for all displayed markets.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { fetchMarketsModeration } from '../api/moderation.api'
import type { ModeratedMarket, HiddenField, Network } from '@/lib/database.types'

interface UseMarketsModerationParams {
  marketIds: string[]
  contractAddress: string
  network: Network
}

interface UseMarketsModerationReturn {
  /** Map of marketId -> ModeratedMarket */
  moderationMap: Map<string, ModeratedMarket>
  isLoading: boolean
  error: string | null
  /** Check if a specific field is hidden for a market */
  isFieldHidden: (marketId: string, field: HiddenField) => boolean
  /** Refetch moderation status */
  refetch: () => Promise<void>
}

export function useMarketsModeration({
  marketIds,
  contractAddress,
  network,
}: UseMarketsModerationParams): UseMarketsModerationReturn {
  const [moderationMap, setModerationMap] = useState<Map<string, ModeratedMarket>>(new Map())
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Track the last fetched market IDs to avoid refetching for the same set
  const lastFetchedIdsRef = useRef<string>('')

  const fetchModeration = useCallback(async () => {
    if (!contractAddress || marketIds.length === 0) {
      return
    }

    // Create a sorted string of IDs to compare
    const idsKey = [...marketIds].sort().join(',')
    
    // Skip if we already fetched for these IDs
    if (idsKey === lastFetchedIdsRef.current) {
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      
      const result = await fetchMarketsModeration({
        marketIds,
        contractAddress,
        network,
      })
      
      setModerationMap(result)
      lastFetchedIdsRef.current = idsKey
    } catch (err) {
      console.error('Error fetching markets moderation:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch moderation status')
    } finally {
      setIsLoading(false)
    }
  }, [marketIds, contractAddress, network])

  // Fetch moderation when market IDs change
  useEffect(() => {
    fetchModeration()
  }, [fetchModeration])

  // Helper to check if a field is hidden for a specific market
  const isFieldHidden = useCallback(
    (marketId: string, field: HiddenField): boolean => {
      const moderation = moderationMap.get(marketId)
      if (!moderation || !moderation.is_active) {
        return false
      }
      return moderation.hidden_fields.includes(field)
    },
    [moderationMap]
  )

  return {
    moderationMap,
    isLoading,
    error,
    isFieldHidden,
    refetch: fetchModeration,
  }
}
