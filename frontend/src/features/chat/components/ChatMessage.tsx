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
        <span className="text-jungle-muted font-mono">
          {formatAddress(message.sender_address)}
        </span>
        
        {holderBadge && (
          <span 
            className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
              holderBadge === 'yes' 
                ? 'bg-jungle-green/20 text-jungle-green' 
                : 'bg-jungle-red/20 text-jungle-red'
            }`}
          >
            {holderBadge === 'yes' ? '🟢 YES' : '🔴 NO'}
          </span>
        )}
        
        <span className="text-jungle-muted/60">
          {timeAgo}
        </span>
      </div>
      
      {/* Message Bubble */}
      <div 
        className={`max-w-[85%] px-3 py-2 rounded-lg break-words ${
          isOwnMessage 
            ? 'bg-jungle-primary/20 text-jungle-text' 
            : 'bg-jungle-card text-jungle-text'
        }`}
      >
        {message.message}
      </div>
    </div>
  )
}
