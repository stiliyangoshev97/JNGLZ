import { useState, useRef, useEffect, type FormEvent } from 'react'
import { useAccount } from 'wagmi'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { Send, Loader2, Lock } from 'lucide-react'

interface ChatInputProps {
  onSend: (message: string) => Promise<boolean>
  isSending: boolean
  rateLimitSeconds: number | null
  isAuthenticated: boolean
  onSignIn: () => Promise<boolean>
  isSigningIn: boolean
  disabled?: boolean
}

export function ChatInput({
  onSend,
  isSending,
  rateLimitSeconds,
  isAuthenticated,
  onSignIn,
  isSigningIn,
  disabled,
}: ChatInputProps) {
  const { isConnected } = useAccount()
  const { openConnectModal } = useConnectModal()
  
  const [message, setMessage] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  
  const charCount = message.length
  const isOverLimit = charCount > 500
  const canSend = message.trim().length > 0 && !isOverLimit && !isSending && !rateLimitSeconds && !disabled
  
  // Focus input after sending
  useEffect(() => {
    if (!isSending && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isSending])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    
    if (!canSend) return
    
    const success = await onSend(message)
    if (success) {
      setMessage('')
    }
  }

  // Not connected state
  if (!isConnected) {
    return (
      <div className="border-t border-jungle-border p-4">
        <button
          onClick={openConnectModal}
          className="w-full py-2 px-4 bg-jungle-primary/20 hover:bg-jungle-primary/30 
                     text-jungle-primary rounded-lg transition-colors flex items-center 
                     justify-center gap-2"
        >
          <Lock className="w-4 h-4" />
          Connect wallet to chat
        </button>
      </div>
    )
  }

  // Not authenticated with SIWE
  if (!isAuthenticated) {
    return (
      <div className="border-t border-jungle-border p-4">
        <button
          onClick={onSignIn}
          disabled={isSigningIn}
          className="w-full py-2 px-4 bg-jungle-primary/20 hover:bg-jungle-primary/30 
                     text-jungle-primary rounded-lg transition-colors flex items-center 
                     justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSigningIn ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Signing in...
            </>
          ) : (
            <>
              <Lock className="w-4 h-4" />
              Sign in to chat
            </>
          )}
        </button>
        <p className="text-xs text-jungle-muted text-center mt-2">
          Sign a message to verify your wallet and enable chat
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="border-t border-jungle-border p-4">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <input
            ref={inputRef}
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={rateLimitSeconds ? `Wait ${rateLimitSeconds}s...` : 'Type a message...'}
            disabled={isSending || !!rateLimitSeconds || disabled}
            maxLength={550} // Allow some overage for UX, validation will block
            className={`w-full px-4 py-2 bg-jungle-dark border rounded-lg 
                       text-jungle-text placeholder-jungle-muted/50
                       focus:outline-none focus:ring-2 focus:ring-jungle-primary/50
                       disabled:opacity-50 disabled:cursor-not-allowed
                       ${isOverLimit ? 'border-jungle-red' : 'border-jungle-border'}`}
          />
          
          {/* Character count */}
          {message.length > 0 && (
            <span 
              className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs
                         ${isOverLimit ? 'text-jungle-red' : 'text-jungle-muted'}`}
            >
              {charCount}/500
            </span>
          )}
        </div>
        
        <button
          type="submit"
          disabled={!canSend}
          className="px-4 py-2 bg-jungle-primary hover:bg-jungle-primary/80 
                     text-jungle-dark font-semibold rounded-lg transition-colors
                     disabled:opacity-50 disabled:cursor-not-allowed
                     flex items-center justify-center min-w-[48px]"
        >
          {isSending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </div>
      
      {isOverLimit && (
        <p className="text-xs text-jungle-red mt-1">
          Message exceeds 500 character limit
        </p>
      )}
    </form>
  )
}
