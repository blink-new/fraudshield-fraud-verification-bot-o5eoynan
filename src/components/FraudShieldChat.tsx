import { useState, useEffect, useRef } from 'react'
import { ChatMessage } from './ChatMessage'
import { ChatInput } from './ChatInput'
import { TypingIndicator } from './TypingIndicator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { createClient } from '@blinkdotnew/sdk'
import { fraudService } from '../services/fraudService'
import { authService } from '../services/authService'
import { documentService } from '../services/documentService'
import { nanoid } from 'nanoid'

const blink = createClient({
  projectId: 'fraudshield-fraud-verification-bot-o5eoynan',
  authRequired: true
})

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
  const [companyProfile, setCompanyProfile] = useState<any>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

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

  const handleEftPopVerification = async (message: string, files?: File[]) => {
    await simulateTyping(2000)
    
    try {
      // Extract payment details from message (simplified)
      const bankName = message.includes('FNB') ? 'FNB' : 
                      message.includes('Standard') ? 'Standard Bank' :
                      message.includes('ABSA') ? 'ABSA' : 'Unknown Bank'
      
      const referenceMatch = message.match(/ref[erence]*\s*:?\s*([a-zA-Z0-9]+)/i)
      const reference = referenceMatch ? referenceMatch[1] : '483920'
      
      const amountMatch = message.match(/R\s*([0-9,]+(?:\.[0-9]{2})?)/i)
      const amount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : 12500

      // Use fraud service for verification
      const result = await fraudService.verifyPayment({
        bankName,
        reference,
        amount
      })

      addBotMessage(`🔎 Checking payment against your linked bank account...<br/><br/>
${result.message}<br/><br/>
${result.status === 'verified' ? 
  'Do you want me to generate a release PIN for your driver? (Yes/No)' : 
  'Do you want to save this check to your log? (Yes/No)'}`, 'verification')

    } catch (error) {
      console.error('Payment verification error:', error)
      addBotMessage(`❌ Unable to verify payment at this time. Please try again or contact support.`, 'verification')
    }
  }

  const handleRfqPoVerification = async (message: string, files?: File[]) => {
    await simulateTyping(2500)
    
    try {
      let documentContent = message
      
      // If files are uploaded, process them
      if (files && files.length > 0) {
        const file = files[0]
        const uploadedDoc = await documentService.uploadDocument(file, 'rfq')
        documentContent = uploadedDoc.extractedText || message
      }

      // Use fraud service for document verification
      const result = await fraudService.verifyDocument({
        documentType: 'rfq',
        content: documentContent
      })

      addBotMessage(`🔎 Verifying document details:<br/>
✅ Checking domain legitimacy<br/>
✅ Matching company name against registry<br/>
✅ Checking contact details<br/><br/>
${result.message}`, 'verification')

    } catch (error) {
      console.error('Document verification error:', error)
      addBotMessage(`❌ Unable to verify document at this time. Please try again or contact support.`, 'verification')
    }
  }

  const handleReleasePinGeneration = async (message: string) => {
    await simulateTyping(1500)
    
    try {
      // Extract customer name and amount from message
      const parts = message.split(',')
      const customerName = parts[0]?.trim() || 'Unknown Customer'
      const amountMatch = message.match(/R\s*([0-9,]+(?:\.[0-9]{2})?)/i)
      const orderAmount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : 0

      // Generate PIN using fraud service
      const result = await fraudService.generateDriverPin({
        customerName,
        orderAmount
      })

      addBotMessage(`🔎 Checking previous verification...<br/>
✅ Payment verified.<br/><br/>
🔐 <strong>Release PIN for driver: ${result.pin}</strong><br/><br/>
Share this PIN only when handing over goods.<br/><br/>
<em>PIN expires in 24 hours.</em>`, 'pin')

    } catch (error) {
      console.error('PIN generation error:', error)
      addBotMessage(`❌ Unable to generate PIN at this time. Please try again or contact support.`, 'verification')
    }
  }

  const handleLogView = async () => {
    await simulateTyping(1000)
    
    try {
      // Fetch fraud logs using fraud service
      const logs = await fraudService.getFraudLogs()

      const logContent = logs.length > 0 
        ? `📜 <strong>Today's Fraud Check Log</strong><br/><br/>
${logs.map((log, index) => 
  `${index + 1}. ${log.verificationType?.replace('_', ' ').toUpperCase()} - ${log.verificationResult?.toUpperCase()}<br/>
   Amount: R${log.amount || 0}<br/>
   Time: ${new Date(log.createdAt).toLocaleTimeString()}<br/>`
).join('<br/>')}<br/>
<em>PDF report would be generated and attached in production.</em><br/><br/>
To view logs for a specific date, type: log YYYY-MM-DD`
        : `📜 <strong>Today's Fraud Check Log</strong><br/><br/>
No fraud checks performed today.<br/><br/>
To view logs for a specific date, type: log YYYY-MM-DD`

      addBotMessage(logContent, 'log')

    } catch (error) {
      console.error('Log fetch error:', error)
      addBotMessage(`❌ Unable to fetch logs at this time. Please try again.`, 'log')
    }
  }

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged(async (state) => {
      setUser(state.user)
      if (state.user) {
        // Load company profile
        try {
          const profile = await authService.getCompanyProfile()
          setCompanyProfile(profile)
        } catch (error) {
          console.error('Error loading company profile:', error)
        }

        if (messages.length === 0) {
          // Send welcome message
          addBotMessage(getWelcomeMessage())
        }
      }
    })
    return unsubscribe
  }, [messages.length])

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight
      }
    }
  }, [messages, isTyping])

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
        <div className="flex-1">
          <h1 className="font-semibold text-lg">FraudShield</h1>
          <p className="text-sm text-muted-foreground">✅ Verified Business Account</p>
        </div>
        {companyProfile && (
          <div className="text-right">
            <p className="text-sm font-medium">{companyProfile.companyName}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
        )}
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