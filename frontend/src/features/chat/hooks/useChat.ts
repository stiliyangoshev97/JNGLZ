import { useState, useEffect, useCallback, useRef } from 'react'
import { useAccount } from 'wagmi'
import { useSIWE } from '@/shared/hooks/useSIWE'
import { 
  fetchChatMessages, 
  sendChatMessage, 
  subscribeToChatMessages 
} from '../api/chat.api'
import type { ChatMessage, Network } from '@/lib/database.types'

interface UseChatParams {
  marketId: string
  contractAddress: string
  network: Network
}

interface UseChatReturn {
  messages: ChatMessage[]
  isLoading: boolean
  isSending: boolean
  error: string | null
  rateLimitSeconds: number | null
  sendMessage: (message: string) => Promise<boolean>
  refreshMessages: () => Promise<void>
  isAuthenticated: boolean
  signIn: () => Promise<boolean>
  isSigningIn: boolean
}

export function useChat(params: UseChatParams): UseChatReturn {
  const { marketId, contractAddress, network } = params
  const { address } = useAccount()
  const { signIn: siweSignIn, isAuthenticated, getSession, isSigningIn } = useSIWE()
  
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rateLimitSeconds, setRateLimitSeconds] = useState<number | null>(null)
  
  const unsubscribeRef = useRef<(() => void) | null>(null)
  const rateLimitTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Fetch initial messages
  const refreshMessages = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const data = await fetchChatMessages({
        marketId,
        contractAddress,
        network,
      })
      setMessages(data)
    } catch (err) {
      setError('Failed to load chat messages')
      console.error('Error fetching chat messages:', err)
    } finally {
      setIsLoading(false)
    }
  }, [marketId, contractAddress, network])

  // Subscribe to real-time updates
  useEffect(() => {
    refreshMessages()
    
    // Subscribe to new messages
    const unsubscribe = subscribeToChatMessages(
      { marketId, contractAddress, network },
      (newMessage) => {
        setMessages(prev => {
          // Avoid duplicates
          if (prev.some(m => m.id === newMessage.id)) {
            return prev
          }
          return [...prev, newMessage]
        })
      }
    )
    
    unsubscribeRef.current = unsubscribe
    
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
      }
    }
  }, [marketId, contractAddress, network, refreshMessages])

  // Rate limit countdown timer
  useEffect(() => {
    if (rateLimitSeconds !== null && rateLimitSeconds > 0) {
      rateLimitTimerRef.current = setInterval(() => {
        setRateLimitSeconds(prev => {
          if (prev === null || prev <= 1) {
            if (rateLimitTimerRef.current) {
              clearInterval(rateLimitTimerRef.current)
            }
            return null
          }
          return prev - 1
        })
      }, 1000)
    }
    
    return () => {
      if (rateLimitTimerRef.current) {
        clearInterval(rateLimitTimerRef.current)
      }
    }
  }, [rateLimitSeconds])

  // Sign in with SIWE
  const signIn = useCallback(async (): Promise<boolean> => {
    const session = await siweSignIn()
    return !!session
  }, [siweSignIn])

  // Send message
  const sendMessage = useCallback(async (message: string): Promise<boolean> => {
    if (!address) {
      setError('Wallet not connected')
      return false
    }
    
    const trimmedMessage = message.trim()
    if (!trimmedMessage) {
      setError('Message cannot be empty')
      return false
    }
    
    if (trimmedMessage.length > 500) {
      setError('Message exceeds 500 character limit')
      return false
    }
    
    // Get or create SIWE session
    let session = getSession()
    if (!session) {
      session = await siweSignIn()
      if (!session) {
        setError('Please sign in to send messages')
        return false
      }
    }
    
    setIsSending(true)
    setError(null)
    
    try {
      const result = await sendChatMessage({
        message: trimmedMessage,
        siweMessage: session.message,
        signature: session.signature,
        address: session.address,
        marketId,
        contractAddress,
        network,
      })
      
      if (!result.success) {
        if (result.waitSeconds) {
          setRateLimitSeconds(result.waitSeconds)
          setError(`Rate limited. Please wait ${result.waitSeconds} seconds.`)
        } else {
          setError(result.error || 'Failed to send message')
        }
        return false
      }
      
      // Message will appear via real-time subscription
      return true
    } catch (err) {
      setError('Failed to send message')
      console.error('Error sending message:', err)
      return false
    } finally {
      setIsSending(false)
    }
  }, [address, marketId, contractAddress, network, getSession, siweSignIn])

  return {
    messages,
    isLoading,
    isSending,
    error,
    rateLimitSeconds,
    sendMessage,
    refreshMessages,
    isAuthenticated: isAuthenticated(),
    signIn,
    isSigningIn,
  }
}
