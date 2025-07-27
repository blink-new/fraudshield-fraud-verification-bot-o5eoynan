import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Shield } from 'lucide-react'

export function TypingIndicator() {
  return (
    <div className="flex gap-3 mb-4 justify-start animate-fade-in">
      <Avatar className="w-8 h-8 bg-primary">
        <AvatarFallback className="bg-primary text-primary-foreground">
          <Shield className="w-4 h-4" />
        </AvatarFallback>
      </Avatar>
      
      <div className="message-bubble bot shadow-sm">
        <div className="typing-indicator">
          <div className="typing-dot" style={{ animationDelay: '0ms' }}></div>
          <div className="typing-dot" style={{ animationDelay: '150ms' }}></div>
          <div className="typing-dot" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  )
}