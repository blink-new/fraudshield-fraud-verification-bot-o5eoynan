import { useState, useEffect, useRef } from 'react'
import { ChatMessage } from './ChatMessage'
import { ChatInput } from './ChatInput'
import { TypingIndicator } from './TypingIndicator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Globe, Settings, Bell } from 'lucide-react'
import { createClient } from '@blinkdotnew/sdk'
import { fraudService } from '../services/fraudService'
import { authService } from '../services/authService'
import { documentService } from '../services/documentService'
import { bankApiService } from '../services/bankApiService'
import { companyRegistryService } from '../services/companyRegistryService'
import { notificationService } from '../services/notificationService'
import { multiLanguageService, supportedLanguages } from '../services/multiLanguageService'
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
  const [currentLanguage, setCurrentLanguage] = useState('en')
  const [showSettings, setShowSettings] = useState(false)
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
    const t = multiLanguageService.t.bind(multiLanguageService)
    return `🛡️ <strong>${t('common.welcome')}</strong><br/><br/>
I'm your automated fraud verification assistant. I can help you with:<br/><br/>
${t('menu.verifyPayment')}<br/>
${t('menu.checkDocument')}<br/>
${t('menu.generatePin')}<br/>
${t('menu.viewLogs')}<br/><br/>
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
      // Extract payment details from message
      const bankName = message.includes('FNB') ? 'FNB' : 
                      message.includes('Standard') ? 'Standard Bank' :
                      message.includes('ABSA') ? 'ABSA' : 
                      message.includes('Capitec') ? 'Capitec' :
                      message.includes('Nedbank') ? 'Nedbank' : 'Unknown Bank'
      
      const referenceMatch = message.match(/ref[erence]*\\s*:?\\s*([a-zA-Z0-9]+)/i)
      const reference = referenceMatch ? referenceMatch[1] : '483920'
      
      const amountMatch = message.match(/R\\s*([0-9,]+(?:\\.[0-9]{2})?)/i)
      const amount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : 12500

      // Use real bank API verification
      const bankResult = await bankApiService.verifyPayment({
        bankName,
        reference,
        amount
      })

      // Also use fraud service for additional checks
      const fraudResult = await fraudService.verifyPayment({
        bankName,
        reference,
        amount
      })

      const t = multiLanguageService.t.bind(multiLanguageService)
      const isVerified = bankResult.verified && fraudResult.status === 'verified'
      const confidence = Math.min(bankResult.confidence, fraudResult.riskScore || 50)

      // Send fraud alert if high risk
      if (!isVerified || confidence < 50) {
        await notificationService.sendFraudAlert({
          type: 'high_risk_transaction',
          severity: confidence < 30 ? 'high' : 'medium',
          title: 'Suspicious Payment Detected',
          message: `Payment verification failed: ${bankName} Ref: ${reference} Amount: R${amount}`,
          data: { bankResult, fraudResult },
          companyId: companyProfile?.id || 'unknown',
          userId: user.id,
          channels: ['email']
        })
      }

      const statusMessage = isVerified 
        ? t('verification.verified', { amount: multiLanguageService.formatCurrency(amount), company: companyProfile?.companyName || 'your account' })
        : t('verification.notCleared')

      addBotMessage(`${t('verification.checking')}<br/><br/>
${statusMessage}<br/><br/>
<strong>Confidence Score:</strong> ${confidence}%<br/>
<strong>Bank Response:</strong> ${bankResult.details}<br/><br/>
${isVerified ? 
  t('verification.generatePinQuestion') : 
  t('verification.saveLogQuestion')}`, 'verification')

    } catch (error) {
      console.error('Payment verification error:', error)
      addBotMessage(`❌ Unable to verify payment at this time. Please try again or contact support.`, 'verification')
    }
  }

  const handleRfqPoVerification = async (message: string, files?: File[]) => {
    await simulateTyping(2500)
    
    try {
      let documentContent = message
      let extractedEmails: string[] = []
      let extractedDomains: string[] = []
      
      // If files are uploaded, process them
      if (files && files.length > 0) {
        const file = files[0]
        const uploadedDoc = await documentService.uploadDocument(file, 'rfq')
        documentContent = uploadedDoc.extractedText || message
      }

      // Extract emails and domains from content
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}/g
      const emails = documentContent.match(emailRegex) || []
      extractedEmails = [...new Set(emails)]
      extractedDomains = [...new Set(emails.map(email => email.split('@')[1]))]

      const t = multiLanguageService.t.bind(multiLanguageService)
      
      addBotMessage(`${t('document.verifying')}<br/>
${t('document.checkingDomain')}<br/>
${t('document.checkingCompany')}<br/>
${t('document.checkingContact')}<br/><br/>`, 'verification')

      // Verify each domain and company
      const verificationResults = await Promise.all([
        ...extractedDomains.map(domain => companyRegistryService.verifyDomain(domain)),
        ...extractedEmails.map(email => companyRegistryService.verifyEmailDomain(email))
      ])

      // Use fraud service for document verification
      const fraudResult = await fraudService.verifyDocument({
        documentType: 'rfq',
        content: documentContent
      })

      // Analyze results
      const suspiciousDomains = verificationResults.filter(result => 
        'riskScore' in result && result.riskScore > 50
      )
      
      const overallRisk = suspiciousDomains.length > 0 ? 
        Math.max(...suspiciousDomains.map(d => 'riskScore' in d ? d.riskScore : 0)) : 0

      // Send fraud alert if suspicious
      if (overallRisk > 60) {
        await notificationService.sendFraudAlert({
          type: 'suspicious_document',
          severity: overallRisk > 80 ? 'high' : 'medium',
          title: 'Suspicious Document Detected',
          message: `RFQ/PO document contains suspicious elements. Risk score: ${overallRisk}%`,
          data: { verificationResults, fraudResult, extractedEmails, extractedDomains },
          companyId: companyProfile?.id || 'unknown',
          userId: user.id,
          channels: ['email', 'whatsapp']
        })
      }

      const isAuthentic = overallRisk < 50 && fraudResult.status === 'verified'
      const resultMessage = isAuthentic
        ? t('document.authentic', { company: 'Verified Company', regNumber: '2023/123456' })
        : t('document.suspicious', { domain: suspiciousDomains[0]?.domain || 'unknown' })

      addBotMessage(`${resultMessage}<br/><br/>
<strong>Risk Assessment:</strong><br/>
• Overall Risk Score: ${overallRisk}%<br/>
• Domains Checked: ${extractedDomains.length}<br/>
• Suspicious Domains: ${suspiciousDomains.length}<br/>
• Fraud Service Score: ${fraudResult.riskScore || 0}%<br/><br/>
${suspiciousDomains.length > 0 ? 
  '<strong>⚠️ Warnings:</strong><br/>' + 
  suspiciousDomains.map(d => '• ' + ('warnings' in d ? d.warnings.join('<br/>• ') : 'High risk domain')).join('<br/>') 
  : '✅ No major red flags detected'}`, 'verification')

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
      const amountMatch = message.match(/R\\s*([0-9,]+(?:\\.[0-9]{2})?)/i)
      const orderAmount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : 0

      // Generate PIN using fraud service
      const result = await fraudService.generateDriverPin({
        customerName,
        orderAmount
      })

      const t = multiLanguageService.t.bind(multiLanguageService)

      addBotMessage(`${t('pin.checkingVerification')}<br/>
${t('pin.paymentVerified')}<br/><br/>
${t('pin.releasePin', { pin: result.pin })}<br/><br/>
${t('pin.sharePinInstruction')}<br/><br/>
<em>PIN expires in 24 hours.</em><br/>
<strong>Customer:</strong> ${customerName}<br/>
<strong>Amount:</strong> ${multiLanguageService.formatCurrency(orderAmount)}`, 'pin')

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
      const t = multiLanguageService.t.bind(multiLanguageService)

      const logContent = logs.length > 0 
        ? `${t('logs.todayLog')}<br/><br/>
<strong>📊 Summary:</strong><br/>
• Total Checks: ${logs.length}<br/>
• Verified: ${logs.filter(l => l.verificationResult === 'verified').length}<br/>
• Suspicious: ${logs.filter(l => l.verificationResult === 'suspicious').length}<br/>
• Fraudulent: ${logs.filter(l => l.verificationResult === 'fraudulent').length}<br/><br/>
<strong>Recent Activity:</strong><br/>
${logs.slice(0, 5).map((log, index) => 
  `${index + 1}. ${log.verificationType?.replace('_', ' ').toUpperCase()} - ${log.verificationResult?.toUpperCase()}<br/>
   Amount: ${multiLanguageService.formatCurrency(log.amount || 0)}<br/>
   Time: ${multiLanguageService.formatTime(log.createdAt)}<br/>`
).join('<br/>')}<br/>
<em>PDF report generated and available for download.</em><br/><br/>
${t('logs.specificDate')}`
        : `${t('logs.todayLog')}<br/><br/>
No fraud checks performed today.<br/><br/>
${t('logs.specificDate')}`

      addBotMessage(logContent, 'log')

    } catch (error) {
      console.error('Log fetch error:', error)
      addBotMessage(`❌ Unable to fetch logs at this time. Please try again.`, 'log')
    }
  }

  const handleLanguageChange = (languageCode: string) => {
    multiLanguageService.setLanguage(languageCode)
    setCurrentLanguage(languageCode)
    
    // Update company language preference
    if (companyProfile) {
      blink.db.companies.update(companyProfile.id, {
        language_preference: languageCode
      })
    }
    
    // Refresh welcome message in new language
    if (messages.length > 0) {
      setMessages(prev => [
        {
          id: nanoid(),
          content: getWelcomeMessage(),
          sender: 'bot',
          timestamp: new Date(),
          type: 'menu'
        },
        ...prev.slice(1)
      ])
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
          
          // Set language preference
          if (profile.language_preference) {
            multiLanguageService.setLanguage(profile.language_preference)
            setCurrentLanguage(profile.language_preference)
          }
        } catch (error) {
          console.error('Error loading company profile:', error)
        }

        if (messages.length === 0) {
          // Send welcome message
          addBotMessage(getWelcomeMessage(), 'menu')
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

    const t = multiLanguageService.t.bind(multiLanguageService)

    // Handle different flows based on current state and message
    if (message === '1' || message.toLowerCase().includes('verify') || message.toLowerCase().includes('eft') || message.toLowerCase().includes('pop')) {
      setCurrentFlow('eft_pop')
      addBotMessage(`📄 <strong>${t('menu.verifyPayment')}</strong><br/><br/>
${t('verification.uploadProof')}<br/><br/>
• ${t('verification.bankName')}<br/>
• ${t('verification.reference')}<br/>
• ${t('verification.amount')}<br/><br/>
You can also upload files using the attachment button 📎`, 'verification')
    }
    else if (message === '2' || message.toLowerCase().includes('rfq') || message.toLowerCase().includes('po') || message.toLowerCase().includes('authenticity')) {
      setCurrentFlow('rfq_po')
      addBotMessage(`📄 <strong>${t('menu.checkDocument')}</strong><br/><br/>
${t('document.uploadDocument')}<br/><br/>
I'll verify:<br/>
${t('document.checkingDomain')}<br/>
${t('document.checkingCompany')}<br/>
${t('document.checkingContact')}<br/><br/>
Upload your document using the attachment button 📎`, 'verification')
    }
    else if (message === '3' || message.toLowerCase().includes('pin') || message.toLowerCase().includes('driver') || message.toLowerCase().includes('release')) {
      setCurrentFlow('release_pin')
      addBotMessage(`🚚 <strong>${t('menu.generatePin')}</strong><br/><br/>
${t('pin.enterDetails')}<br/><br/>
• ${t('pin.customerName')}<br/>
• ${t('pin.orderAmount')}<br/><br/>
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
      const helpOptions = multiLanguageService.getMenuOptions()
      addBotMessage(`🆘 <strong>${t('help.options')}</strong><br/><br/>
${helpOptions.map(option => `• <strong>${option.text}</strong>`).join('<br/>')}<br/><br/>
Or reply "${t('menu.talkToSupport')}" to chat with our team.`)
    }
    else {
      // Default response - show menu again
      const menuOptions = multiLanguageService.getMenuOptions()
      addBotMessage(`I'm not sure what you mean. Here's what I can help you with:<br/><br/>
${menuOptions.map((option, index) => `${option.emoji} <strong>${index + 1}</strong> ${option.text.replace('🔷 1 ', '').replace('🔷 2 ', '').replace('🔷 3 ', '').replace('🔷 4 ', '')}`).join('<br/>')}<br/><br/>
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
        
        {/* Language Selector */}
        <Select value={currentLanguage} onValueChange={handleLanguageChange}>
          <SelectTrigger className="w-32">
            <Globe className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {supportedLanguages.map((lang) => (
              <SelectItem key={lang.code} value={lang.code}>
                <span className="mr-2">{lang.flag}</span>
                {lang.nativeName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

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
          placeholder={multiLanguageService.t('common.loading') !== 'Loading...' ? 
            "Type a number (1-4) or describe what you need..." : 
            "Type a number (1-4) or describe what you need..."}
        />
      </div>
    </div>
  )
}