import { useState, useEffect, useRef } from 'react'
import { ChatMessage } from './ChatMessage'
import { ChatInput } from './ChatInput'
import { TypingIndicator } from './TypingIndicator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { blink } from '@/blink/client'
import { nanoid } from 'nanoid'

interface Message {
  id: string
  content: string
  sender: 'user' | 'bot'
  timestamp: Date
  type?: 'text' | 'menu' | 'verification' | 'pin' | 'log'
}

export function FraudShieldChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [currentFlow, setCurrentFlow] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      if (state.user && messages.length === 0) {
        // Send welcome message
        addBotMessage(getWelcomeMessage())
      }
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight
      }
    }
  }, [messages, isTyping])

  const addBotMessage = (content: string, type: Message['type'] = 'text') => {
    const message: Message = {
      id: nanoid(),
      content,
      sender: 'bot',
      timestamp: new Date(),
      type
    }
    setMessages(prev => [...prev, message])
  }

  const addUserMessage = (content: string) => {
    const message: Message = {
      id: nanoid(),
      content,
      sender: 'user',
      timestamp: new Date()
    }
    setMessages(prev => [...prev, message])
  }

  const getWelcomeMessage = () => {
    return `🛡️ <strong>Welcome to FraudShield!</strong><br/><br/>
I'm your automated fraud verification assistant. I can help you with:<br/><br/>
🔷 <strong>1</strong> Verify EFT / PoP<br/>
🔷 <strong>2</strong> Check RFQ / PO authenticity<br/>
🔷 <strong>3</strong> Generate release PIN for driver<br/>
🔷 <strong>4</strong> View today's fraud check log<br/><br/>
Simply type the number (1-4) or describe what you need help with!`
  }

  const simulateTyping = async (duration = 1500) => {
    setIsTyping(true)
    await new Promise(resolve => setTimeout(resolve, duration))
    setIsTyping(false)
  }

  const handleSendMessage = async (message: string, files?: File[]) => {
    if (!user) return

    addUserMessage(message)
    await simulateTyping()

    // Handle different flows based on current state and message
    if (message === '1' || message.toLowerCase().includes('verify') || message.toLowerCase().includes('eft') || message.toLowerCase().includes('pop')) {
      setCurrentFlow('eft_pop')
      addBotMessage(`📄 <strong>Verify EFT / PoP</strong><br/><br/>
Please upload the proof of payment (screenshot, PDF) or enter transaction details:<br/><br/>
• Bank Name<br/>
• Reference<br/>
• Amount<br/><br/>
You can also upload files using the attachment button 📎`, 'verification')
    }
    else if (message === '2' || message.toLowerCase().includes('rfq') || message.toLowerCase().includes('po') || message.toLowerCase().includes('authenticity')) {
      setCurrentFlow('rfq_po')
      addBotMessage(`📄 <strong>Check RFQ / PO Authenticity</strong><br/><br/>
Please upload the RFQ / PO document or paste the full text/email here.<br/><br/>
I'll verify:<br/>
✅ Domain legitimacy<br/>
✅ Company name against registry<br/>
✅ Contact details<br/><br/>
Upload your document using the attachment button 📎`, 'verification')
    }
    else if (message === '3' || message.toLowerCase().includes('pin') || message.toLowerCase().includes('driver') || message.toLowerCase().includes('release')) {
      setCurrentFlow('release_pin')
      addBotMessage(`🚚 <strong>Generate Release PIN</strong><br/><br/>
Please enter:<br/><br/>
• Customer Name<br/>
• Order Amount<br/><br/>
Example: "ABC Foods, R12,500"`, 'verification')
    }
    else if (message === '4' || message.toLowerCase().includes('log') || message.toLowerCase().includes('view')) {
      setCurrentFlow('log_view')
      await handleLogView()
    }
    else if (currentFlow === 'eft_pop') {
      await handleEftPopVerification(message, files)
    }
    else if (currentFlow === 'rfq_po') {
      await handleRfqPoVerification(message, files)
    }
    else if (currentFlow === 'release_pin') {
      await handleReleasePinGeneration(message)
    }
    else if (message.toLowerCase().includes('help') || message.toLowerCase().includes('support')) {
      addBotMessage(`🆘 <strong>Help</strong><br/><br/>
You can:<br/>
• <strong>Verify PoP</strong> - Check payment authenticity<br/>
• <strong>Check RFQ/PO</strong> - Verify document legitimacy<br/>
• <strong>Get driver PIN</strong> - Generate secure release codes<br/>
• <strong>View logs</strong> - See today's fraud checks<br/><br/>
Or reply "Talk to support" to chat with our team.`)
    }
    else {
      // Default response - show menu again
      addBotMessage(`I'm not sure what you mean. Here's what I can help you with:<br/><br/>
🔷 <strong>1</strong> Verify EFT / PoP<br/>
🔷 <strong>2</strong> Check RFQ / PO authenticity<br/>
🔷 <strong>3</strong> Generate release PIN for driver<br/>
🔷 <strong>4</strong> View today's fraud check log<br/><br/>
Type a number or describe what you need!`)
    }
  }

  const handleEftPopVerification = async (message: string, files?: File[]) => {
    await simulateTyping(2000)
    
    // Simulate payment verification
    const isCleared = Math.random() > 0.3 // 70% chance of being cleared
    
    if (isCleared) {
      // Store verification in database
      await blink.db.paymentVerifications.create({
        id: nanoid(),
        userId: user.id,
        bankName: 'FNB', // Extract from message in real implementation
        reference: '483920',
        amount: 'R12,500',
        status: 'cleared',
        verificationDetails: JSON.stringify({
          verifiedAt: new Date().toISOString(),
          bankResponse: 'Payment cleared successfully'
        })
      })

      addBotMessage(`🔎 Checking payment against your linked bank account...<br/><br/>
✅ <strong>Payment verified:</strong> R12,500 cleared from ABC Foods.<br/><br/>
Do you want me to generate a release PIN for your driver? (Yes/No)`, 'verification')
    } else {
      addBotMessage(`🔎 Checking payment against your linked bank account...<br/><br/>
🚨 <strong>Warning:</strong> No cleared payment found for this transaction. Please wait until funds reflect before delivering.<br/><br/>
Do you want to save this check to your log? (Yes/No)`, 'verification')
    }

    // Log the fraud check
    await blink.db.fraudChecks.create({
      id: nanoid(),
      userId: user.id,
      checkType: 'eft_pop',
      status: isCleared ? 'verified' : 'suspicious',
      details: JSON.stringify({
        message,
        files: files?.map(f => f.name) || [],
        result: isCleared ? 'cleared' : 'not_cleared'
      })
    })
  }

  const handleRfqPoVerification = async (message: string, files?: File[]) => {
    await simulateTyping(2500)
    
    // Simulate document verification
    const isLegitimate = Math.random() > 0.4 // 60% chance of being legitimate
    
    if (isLegitimate) {
      addBotMessage(`🔎 Verifying document details:<br/>
✅ Checking domain legitimacy<br/>
✅ Matching company name against registry<br/>
✅ Checking contact details<br/><br/>
✅ <strong>RFQ/PO appears authentic</strong> and issued by a registered company (XYZ Supplies, Reg #2023/4567).`, 'verification')
    } else {
      addBotMessage(`🔎 Verifying document details:<br/>
✅ Checking domain legitimacy<br/>
✅ Matching company name against registry<br/>
✅ Checking contact details<br/><br/>
🚨 <strong>Warning:</strong> Domain "gov‑za.org" does NOT match official government domain. PO may be fraudulent. Please confirm with official contact.`, 'verification')
    }

    // Store verification in database
    await blink.db.documentVerifications.create({
      id: nanoid(),
      userId: user.id,
      documentType: 'rfq',
      companyName: 'XYZ Supplies',
      domain: 'xyzsupplies.com',
      status: isLegitimate ? 'verified' : 'suspicious',
      verificationDetails: JSON.stringify({
        verifiedAt: new Date().toISOString(),
        checks: ['domain', 'company_registry', 'contact_details']
      })
    })

    // Log the fraud check
    await blink.db.fraudChecks.create({
      id: nanoid(),
      userId: user.id,
      checkType: 'rfq_po',
      status: isLegitimate ? 'verified' : 'suspicious',
      details: JSON.stringify({
        message,
        files: files?.map(f => f.name) || [],
        result: isLegitimate ? 'legitimate' : 'suspicious'
      })
    })
  }

  const handleReleasePinGeneration = async (message: string) => {
    await simulateTyping(1500)
    
    // Generate random 6-digit PIN
    const pin = Math.floor(100000 + Math.random() * 900000).toString()
    
    // Store PIN in database
    await blink.db.releasePins.create({
      id: nanoid(),
      userId: user.id,
      customerName: 'ABC Foods', // Extract from message in real implementation
      orderAmount: 'R12,500',
      pinCode: pin,
      status: 'active',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    })

    addBotMessage(`🔎 Checking previous verification...<br/>
✅ Payment verified.<br/><br/>
🔐 <strong>Release PIN for driver: ${pin}</strong><br/><br/>
Share this PIN only when handing over goods.<br/><br/>
<em>PIN expires in 24 hours.</em>`, 'pin')

    // Log the fraud check
    await blink.db.fraudChecks.create({
      id: nanoid(),
      userId: user.id,
      checkType: 'release_pin',
      status: 'verified',
      details: JSON.stringify({
        customerName: 'ABC Foods',
        orderAmount: 'R12,500',
        pinGenerated: pin
      })
    })
  }

  const handleLogView = async () => {
    await simulateTyping(1000)
    
    // Fetch today's fraud checks
    const today = new Date().toISOString().split('T')[0]
    const checks = await blink.db.fraudChecks.list({
      where: { 
        userId: user.id,
        // In a real implementation, you'd filter by date
      },
      orderBy: { createdAt: 'desc' },
      limit: 10
    })

    const logContent = checks.length > 0 
      ? `📜 <strong>Today's Fraud Check Log</strong><br/><br/>
${checks.map((check, index) => 
  `${index + 1}. ${check.checkType.replace('_', ' ').toUpperCase()} - ${check.status.toUpperCase()}<br/>
   Time: ${new Date(check.createdAt).toLocaleTimeString()}<br/>`
).join('<br/>')}<br/>
<em>PDF report would be generated and attached in production.</em><br/><br/>
To view logs for a specific date, type: log YYYY-MM-DD`
      : `📜 <strong>Today's Fraud Check Log</strong><br/><br/>
No fraud checks performed today.<br/><br/>
To view logs for a specific date, type: log YYYY-MM-DD`

    addBotMessage(logContent, 'log')
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading FraudShield...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card p-4 flex items-center gap-3">
        <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
          <span className="text-primary-foreground font-bold text-lg">🛡️</span>
        </div>
        <div>
          <h1 className="font-semibold text-lg">FraudShield</h1>
          <p className="text-sm text-muted-foreground">✅ Verified Business Account</p>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
        <div className="max-w-4xl mx-auto">
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
          {isTyping && <TypingIndicator />}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="max-w-4xl mx-auto w-full">
        <ChatInput
          onSendMessage={handleSendMessage}
          disabled={isTyping}
          placeholder="Type a number (1-4) or describe what you need..."
        />
      </div>
    </div>
  )
}