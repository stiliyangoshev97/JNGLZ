/**
 * Hook to fetch and manage market moderation status
 * 
 * Fetches the moderation status from Supabase and provides
 * helper functions to check if specific fields are hidden.
 */

import { useState, useEffect, useCallback } from 'react'
import { fetchMarketModeration, isFieldHidden, getHiddenPlaceholder } from '../api/moderation.api'
import type { ModeratedMarket, HiddenField, Network } from '@/lib/database.types'

interface UseMarketModerationParams {
  marketId: string
  contractAddress: string
  network: Network
}

interface UseMarketModerationReturn {
  moderation: ModeratedMarket | null
  isLoading: boolean
  error: string | null
  /** Check if a specific field is hidden */
  isHidden: (field: HiddenField) => boolean
  /** Get placeholder text for a hidden field */
  getPlaceholder: (field: HiddenField) => string
  /** Apply moderation to a field value - returns hidden placeholder or original value */
  applyModeration: <T extends string | null | undefined>(field: HiddenField, value: T) => T | string
  /** Refetch moderation status */
  refetch: () => Promise<void>
}

export function useMarketModeration({
  marketId,
  contractAddress,
  network,
}: UseMarketModerationParams): UseMarketModerationReturn {
  const [moderation, setModeration] = useState<ModeratedMarket | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchModeration = useCallback(async () => {
    if (!marketId || !contractAddress) {
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      
      const result = await fetchMarketModeration({
        marketId,
        contractAddress,
        network,
      })
      
      setModeration(result)
    } catch (err) {
      console.error('Error fetching market moderation:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch moderation status')
    } finally {
      setIsLoading(false)
    }
  }, [marketId, contractAddress, network])

  // Fetch moderation on mount and when params change
  useEffect(() => {
    fetchModeration()
  }, [fetchModeration])

  // Helper to check if a field is hidden
  const isHidden = useCallback(
    (field: HiddenField): boolean => {
      return isFieldHidden(moderation, field)
    },
    [moderation]
  )

  // Helper to get placeholder text
  const getPlaceholder = useCallback(
    (field: HiddenField): string => {
      return getHiddenPlaceholder(field)
    },
    []
  )

  // Helper to apply moderation to a field value
  // Returns the hidden placeholder if field is hidden, otherwise returns original value
  const applyModeration = useCallback(
    <T extends string | null | undefined>(field: HiddenField, value: T): T | string => {
      if (isFieldHidden(moderation, field)) {
        return getHiddenPlaceholder(field)
      }
      return value
    },
    [moderation]
  )

  return {
    moderation,
    isLoading,
    error,
    isHidden,
    getPlaceholder,
    applyModeration,
    refetch: fetchModeration,
  }
}
