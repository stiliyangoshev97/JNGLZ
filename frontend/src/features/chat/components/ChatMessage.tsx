import { formatDistanceToNow } from 'date-fns'
import { Trash2, Loader2 } from 'lucide-react'
import type { ChatMessage as ChatMessageType } from '@/lib/database.types'
import { formatAddress } from '@/shared/utils/format'

interface ChatMessageProps {
  message: ChatMessageType
  isOwnMessage: boolean
  holderBadge?: 'yes' | 'no' | null
  isAdmin?: boolean
  onDelete?: () => Promise<boolean>
  isDeleting?: boolean
}

export function ChatMessage({ 
  message, 
  isOwnMessage, 
  holderBadge,
  isAdmin,
  onDelete,
  isDeleting,
}: ChatMessageProps) {
  const timeAgo = formatDistanceToNow(new Date(message.created_at), { addSuffix: true })
  
  return (
    <div className={`flex flex-col gap-1 ${isOwnMessage ? 'items-end' : 'items-start'}`}>
      {/* Header: Address + Badge + Time + Delete */}
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
        
        {/* Admin delete button */}
        {isAdmin && onDelete && (
          <button
            onClick={onDelete}
            disabled={isDeleting}
            className="text-no/60 hover:text-no transition-colors disabled:opacity-50"
            title="Delete message"
          >
            {isDeleting ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Trash2 className="w-3 h-3" />
            )}
          </button>
        )}
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
