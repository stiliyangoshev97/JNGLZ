import { useState, useEffect } from 'react'
import { X, Loader2, Shield, Eye, EyeOff } from 'lucide-react'
import { useSIWE } from '@/shared/hooks/useSIWE'
import { moderateMarket, fetchMarketModeration } from '../api/moderation.api'
import type { HiddenField, Network, ModeratedMarket } from '@/lib/database.types'

interface ModerationModalProps {
  isOpen: boolean
  onClose: () => void
  marketId: string
  contractAddress: string
  network: Network
  onModerationChange?: () => void
}

const MODERATION_FIELDS: { key: HiddenField; label: string; description: string }[] = [
  { key: 'name', label: 'Event Name', description: 'Hide the market question/title' },
  { key: 'rules', label: 'Resolution Rules', description: 'Hide the resolution rules text' },
  { key: 'evidence', label: 'Evidence Link', description: 'Hide the evidence/source URL' },
  { key: 'image', label: 'Market Image', description: 'Hide the market photo/image' },
]

export function ModerationModal({
  isOpen,
  onClose,
  marketId,
  contractAddress,
  network,
  onModerationChange,
}: ModerationModalProps) {
  const { signIn, getSession, isSigningIn } = useSIWE()
  
  const [moderation, setModeration] = useState<ModeratedMarket | null>(null)
  const [selectedFields, setSelectedFields] = useState<Set<HiddenField>>(new Set())
  const [reason, setReason] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch current moderation status
  useEffect(() => {
    if (!isOpen) return
    
    async function loadModeration() {
      setIsLoading(true)
      setError(null)
      
      try {
        const data = await fetchMarketModeration({ marketId, contractAddress, network })
        setModeration(data)
        if (data) {
          setSelectedFields(new Set(data.hidden_fields))
          setReason(data.reason || '')
        } else {
          setSelectedFields(new Set())
          setReason('')
        }
      } catch (err) {
        setError('Failed to load moderation status')
        console.error('Error loading moderation:', err)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadModeration()
  }, [isOpen, marketId, contractAddress, network])

  const toggleField = (field: HiddenField) => {
    setSelectedFields(prev => {
      const newSet = new Set(prev)
      if (newSet.has(field)) {
        newSet.delete(field)
      } else {
        newSet.add(field)
      }
      return newSet
    })
  }

  const handleSave = async () => {
    // Get or create SIWE session
    let session = getSession()
    if (!session) {
      session = await signIn()
      if (!session) {
        setError('Please sign in to moderate')
        return
      }
    }
    
    setIsSaving(true)
    setError(null)
    
    try {
      const action = selectedFields.size > 0 ? 'hide' : 'unhide'
      
      const result = await moderateMarket({
        siweMessage: session.message,
        signature: session.signature,
        address: session.address,
        marketId,
        contractAddress,
        network,
        action,
        hiddenFields: action === 'hide' ? Array.from(selectedFields) : undefined,
        reason: action === 'hide' ? reason || undefined : undefined,
      })
      
      if (!result.success) {
        setError(result.error || 'Failed to moderate market')
        return
      }
      
      // Update local state
      setModeration(result.moderation || null)
      onModerationChange?.()
      onClose()
    } catch (err) {
      setError('Failed to moderate market')
      console.error('Error moderating market:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const hasChanges = () => {
    if (!moderation && selectedFields.size === 0) return false
    if (!moderation && selectedFields.size > 0) return true
    if (moderation) {
      const currentFields = new Set(moderation.hidden_fields)
      if (currentFields.size !== selectedFields.size) return true
      for (const field of selectedFields) {
        if (!currentFields.has(field)) return true
      }
    }
    return false
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-dark-900 border border-dark-600 w-full max-w-md mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-dark-600">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-admin" />
            <h2 className="font-bold text-white">Moderate Market</h2>
          </div>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 text-cyber animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-text-secondary text-sm">
                Select which content to hide from this market. Hidden content will be replaced with "[Content Hidden]".
              </p>
              
              {/* Field toggles */}
              <div className="space-y-2">
                {MODERATION_FIELDS.map((field) => (
                  <button
                    key={field.key}
                    onClick={() => toggleField(field.key)}
                    className={`w-full flex items-center justify-between p-3 border transition-colors ${
                      selectedFields.has(field.key)
                        ? 'border-no bg-no/10'
                        : 'border-dark-600 hover:border-dark-500'
                    }`}
                  >
                    <div className="text-left">
                      <p className="text-white font-medium">{field.label}</p>
                      <p className="text-text-muted text-xs">{field.description}</p>
                    </div>
                    {selectedFields.has(field.key) ? (
                      <EyeOff className="w-5 h-5 text-no flex-shrink-0" />
                    ) : (
                      <Eye className="w-5 h-5 text-text-muted flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
              
              {/* Reason (optional) */}
              {selectedFields.size > 0 && (
                <div>
                  <label className="block text-text-muted text-sm mb-1">
                    Reason (optional)
                  </label>
                  <input
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="e.g., Inappropriate content"
                    className="w-full px-3 py-2 bg-dark-800 border border-dark-600 text-white placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-cyber/50"
                  />
                </div>
              )}
              
              {/* Current status */}
              {moderation && (
                <div className="p-3 bg-no/10 border border-no/30">
                  <p className="text-no text-sm font-medium">
                    Currently hidden: {moderation.hidden_fields.join(', ')}
                  </p>
                  {moderation.reason && (
                    <p className="text-text-muted text-xs mt-1">
                      Reason: {moderation.reason}
                    </p>
                  )}
                </div>
              )}
              
              {/* Error */}
              {error && (
                <div className="p-3 bg-no/10 border border-no/30">
                  <p className="text-no text-sm">{error}</p>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="px-4 py-3 border-t border-dark-600 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 px-4 border border-dark-600 text-text-secondary hover:text-white hover:border-dark-500 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges() || isSaving || isSigningIn}
            className="flex-1 py-2 px-4 bg-cyber text-black font-semibold hover:bg-cyber/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSaving || isSigningIn ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {isSigningIn ? 'Signing...' : 'Saving...'}
              </>
            ) : selectedFields.size > 0 ? (
              'Hide Content'
            ) : moderation ? (
              'Unhide All'
            ) : (
              'Save'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
