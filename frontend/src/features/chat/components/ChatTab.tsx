import { useEffect, useRef, useMemo } from 'react'
import { useAccount } from 'wagmi'
import { MessageSquare, Loader2, AlertCircle } from 'lucide-react'
import { useChat } from '../hooks/useChat'
import { ChatMessage } from './ChatMessage'
import { ChatInput } from './ChatInput'
import type { Network } from '@/lib/database.types'
import { isSupabaseConfigured } from '@/lib/supabase'
import { env } from '@/shared/config/env'

// Minimum shares required to chat (must match backend)
const MIN_SHARES_TO_CHAT = 0.001

interface ChatTabProps {
  marketId: string
  contractAddress: string
  network: Network
  /** Map of wallet address -> 'yes' | 'no' for holder badges */
  holders?: Map<string, 'yes' | 'no'>
  /** Creator address of this market */
  creatorAddress?: string
  /** User's position data */
  userPosition?: {
    yesShares: string
    noShares: string
  }
}

export function ChatTab({ 
  marketId, 
  contractAddress, 
  network, 
  holders,
  creatorAddress,
  userPosition,
}: ChatTabProps) {
  const { address } = useAccount()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // Check if current user is admin
  const isAdmin = address ? env.ADMIN_ADDRESSES.includes(address.toLowerCase()) : false
  
  // Check if current user is the market creator
  const isCreator = useMemo(() => {
    if (!address || !creatorAddress) return false
    return address.toLowerCase() === creatorAddress.toLowerCase()
  }, [address, creatorAddress])
  
  // Check if user has enough shares to chat
  const canChat = useMemo(() => {
    // Not connected = can't chat
    if (!address) return false
    
    // Creators can always chat in their own market
    if (isCreator) return true
    
    // Check shares
    if (!userPosition) return false
    
    const yesShares = Number(BigInt(userPosition.yesShares || '0')) / 1e18
    const noShares = Number(BigInt(userPosition.noShares || '0')) / 1e18
    const totalShares = yesShares + noShares
    
    return totalShares >= MIN_SHARES_TO_CHAT
  }, [address, isCreator, userPosition])
  
  // Build holder badge map (keep original types)
  const holderBadges = useMemo(() => {
    return holders || new Map<string, 'yes' | 'no'>()
  }, [holders])
  
  const {
    messages,
    isLoading,
    isSending,
    isDeleting,
    error,
    rateLimitSeconds,
    sendMessage,
    deleteMessage,
    isAuthenticated,
    signIn,
    isSigningIn,
  } = useChat({ marketId, contractAddress, network })

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Show error if Supabase not configured
  if (!isSupabaseConfigured) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <MessageSquare className="w-12 h-12 text-text-muted mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">
          Chat Not Available
        </h3>
        <p className="text-text-muted text-sm">
          Chat feature is not configured for this deployment.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[400px] bg-dark-900 overflow-hidden">
      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 text-cyber animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageSquare className="w-12 h-12 text-text-muted mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">
              No messages yet
            </h3>
            <p className="text-text-muted text-sm">
              Be the first to start the conversation!
            </p>
          </div>
        ) : (
          <>
            {messages.map((msg) => {
              const senderAddr = msg.sender_address.toLowerCase()
              const isMessageFromCreator = creatorAddress?.toLowerCase() === senderAddr
              const holderBadge = holderBadges.get(senderAddr) || null
              
              return (
                <ChatMessage
                  key={msg.id}
                  message={msg}
                  isOwnMessage={
                    !!address && 
                    senderAddr === address.toLowerCase()
                  }
                  holderBadge={holderBadge}
                  isCreator={isMessageFromCreator}
                  isAdmin={isAdmin}
                  onDelete={isAdmin ? () => deleteMessage(msg.id) : undefined}
                  isDeleting={isDeleting}
                />
              )
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
      
      {/* Error Banner */}
      {error && (
        <div className="px-4 py-2 bg-no/20 border-t border-no/30 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-no flex-shrink-0" />
          <span className="text-sm text-no">{error}</span>
        </div>
      )}
      
      {/* Input */}
      <ChatInput
        onSend={sendMessage}
        isSending={isSending}
        rateLimitSeconds={rateLimitSeconds}
        isAuthenticated={isAuthenticated}
        onSignIn={signIn}
        isSigningIn={isSigningIn}
        canChat={canChat}
      />
    </div>
  )
}
