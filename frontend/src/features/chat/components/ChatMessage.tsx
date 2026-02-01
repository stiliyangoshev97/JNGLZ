import { formatDistanceToNow } from 'date-fns'
import type { ChatMessage as ChatMessageType } from '@/lib/database.types'
import { formatAddress } from '@/shared/utils/format'

interface ChatMessageProps {
  message: ChatMessageType
  isOwnMessage: boolean
  holderBadge?: 'yes' | 'no' | null
}

export function ChatMessage({ message, isOwnMessage, holderBadge }: ChatMessageProps) {
  const timeAgo = formatDistanceToNow(new Date(message.created_at), { addSuffix: true })
  
  return (
    <div className={`flex flex-col gap-1 ${isOwnMessage ? 'items-end' : 'items-start'}`}>
      {/* Header: Address + Badge + Time */}
      <div className="flex items-center gap-2 text-xs">
        <span className="text-text-muted font-mono">
          {formatAddress(message.sender_address)}
        </span>
        
        {holderBadge && (
          <span 
            className={`px-1.5 py-0.5 text-[10px] font-bold uppercase ${
              holderBadge === 'yes' 
                ? 'bg-yes/20 text-yes' 
                : 'bg-no/20 text-no'
            }`}
          >
            {holderBadge === 'yes' ? '🟢 YES' : '🔴 NO'}
          </span>
        )}
        
        <span className="text-text-muted/60">
          {timeAgo}
        </span>
      </div>
      
      {/* Message Bubble */}
      <div 
        className={`max-w-[85%] px-3 py-2 break-words ${
          isOwnMessage 
            ? 'bg-cyber/20 text-white border border-cyber/30' 
            : 'bg-dark-800 text-text-secondary border border-dark-600'
        }`}
      >
        {message.message}
      </div>
    </div>
  )
}
