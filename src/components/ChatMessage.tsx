import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Shield, User } from 'lucide-react'

interface ChatMessageProps {
  message: {
    id: string
    content: string
    sender: 'user' | 'bot'
    timestamp: Date
    type?: 'text' | 'menu' | 'verification' | 'pin' | 'log'
  }
  className?: string
}

export function ChatMessage({ message, className }: ChatMessageProps) {
  const isBot = message.sender === 'bot'
  
  return (
    <div className={cn(
      'flex gap-3 mb-4 animate-slide-up',
      isBot ? 'justify-start' : 'justify-end',
      className
    )}>
      {isBot && (
        <Avatar className="w-8 h-8 bg-primary">
          <AvatarFallback className="bg-primary text-primary-foreground">
            <Shield className="w-4 h-4" />
          </AvatarFallback>
        </Avatar>
      )}
      
      <div className={cn(
        'message-bubble',
        isBot ? 'bot' : 'user',
        'shadow-sm'
      )}>
        <div 
          className="whitespace-pre-wrap text-sm leading-relaxed"
          dangerouslySetInnerHTML={{ __html: message.content }}
        />
        <div className={cn(
          'text-xs mt-2 opacity-70',
          isBot ? 'text-muted-foreground' : 'text-primary-foreground/70'
        )}>
          {message.timestamp.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </div>
      </div>
      
      {!isBot && (
        <Avatar className="w-8 h-8 bg-secondary">
          <AvatarFallback className="bg-secondary text-secondary-foreground">
            <User className="w-4 h-4" />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  )
}