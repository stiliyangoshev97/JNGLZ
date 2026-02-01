import { useEffect, useRef } from 'react'
import { useAccount } from 'wagmi'
import { MessageSquare, Loader2, AlertCircle } from 'lucide-react'
import { useChat } from '../hooks/useChat'
import { ChatMessage } from './ChatMessage'
import { ChatInput } from './ChatInput'
import type { Network } from '@/lib/database.types'
import { isSupabaseConfigured } from '@/lib/supabase'

interface ChatTabProps {
  marketId: string
  contractAddress: string
  network: Network
  /** Map of wallet address -> 'yes' | 'no' for holder badges */
  holders?: Map<string, 'yes' | 'no'>
}

export function ChatTab({ marketId, contractAddress, network, holders }: ChatTabProps) {
  const { address } = useAccount()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const {
    messages,
    isLoading,
    isSending,
    error,
    rateLimitSeconds,
    sendMessage,
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
            {messages.map((msg) => (
              <ChatMessage
                key={msg.id}
                message={msg}
                isOwnMessage={
                  !!address && 
                  msg.sender_address.toLowerCase() === address.toLowerCase()
                }
                holderBadge={holders?.get(msg.sender_address.toLowerCase()) || null}
              />
            ))}
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
      />
    </div>
  )
}
