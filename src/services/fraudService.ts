import { createClient } from '@blinkdotnew/sdk'

const blink = createClient({
  projectId: 'fraudshield-fraud-verification-bot-o5eoynan',
  authRequired: true
})

export interface PaymentVerificationRequest {
  bankName: string
  reference: string
  amount: number
  accountNumber?: string
}

export interface DocumentVerificationRequest {
  documentType: 'rfq' | 'po' | 'invoice'
  content: string
  fileUrl?: string
}

export interface PinGenerationRequest {
  customerName: string
  orderAmount: number
  verificationId?: string
}

export interface VerificationResult {
  status: 'verified' | 'failed' | 'suspicious'
  message: string
  riskScore: number
  details?: any
}

class FraudService {
  // Payment verification using bank APIs
  async verifyPayment(request: PaymentVerificationRequest): Promise<VerificationResult> {
    try {
      // Simulate bank API call (Stitch/Ozow integration would go here)
      const bankApiResponse = await this.callBankAPI(request)
      
      // Log verification attempt
      const verificationId = await this.logVerification({
        type: 'payment',
        data: request,
        result: bankApiResponse.status
      })

      // Apply fraud rules
      const riskScore = await this.calculateRiskScore('payment', request)

      return {
        status: bankApiResponse.cleared ? 'verified' : 'failed',
        message: bankApiResponse.cleared 
          ? `✅ Payment verified: R${request.amount.toLocaleString()} cleared from ${request.bankName}.`
          : `🚨 Warning: No cleared payment found for this transaction. Please wait until funds reflect before delivering.`,
        riskScore,
        details: {
          verificationId,
          transactionId: bankApiResponse.transactionId,
          clearedAmount: bankApiResponse.clearedAmount
        }
      }
    } catch (error) {
      console.error('Payment verification error:', error)
      return {
        status: 'failed',
        message: '❌ Unable to verify payment. Please try again or contact support.',
        riskScore: 100
      }
    }
  }

  // Document authenticity verification
  async verifyDocument(request: DocumentVerificationRequest): Promise<VerificationResult> {
    try {
      // Extract and analyze document content
      const analysis = await this.analyzeDocument(request.content)
      
      // Check against fraud rules
      const riskScore = await this.calculateRiskScore('document', request)
      
      // Log verification
      const verificationId = await this.logVerification({
        type: 'document',
        data: request,
        result: analysis.isAuthentic ? 'verified' : 'suspicious'
      })

      const status = riskScore > 70 ? 'suspicious' : (analysis.isAuthentic ? 'verified' : 'failed')

      return {
        status,
        message: this.getDocumentVerificationMessage(status, analysis),
        riskScore,
        details: {
          verificationId,
          domainCheck: analysis.domainCheck,
          companyCheck: analysis.companyCheck,
          contactCheck: analysis.contactCheck
        }
      }
    } catch (error) {
      console.error('Document verification error:', error)
      return {
        status: 'failed',
        message: '❌ Unable to verify document. Please try again.',
        riskScore: 100
      }
    }
  }

  // Generate secure driver PIN
  async generateDriverPin(request: PinGenerationRequest): Promise<{ pin: string; pinId: string }> {
    try {
      const user = await blink.auth.me()
      const pin = this.generateSecurePin()
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

      // Store PIN in database
      const pinRecord = await blink.db.driverPins.create({
        id: `pin_${Date.now()}`,
        userId: user.id,
        pinCode: pin,
        customerName: request.customerName,
        orderAmount: request.orderAmount,
        verificationId: request.verificationId,
        expiresAt: expiresAt.toISOString(),
        status: 'active'
      })

      return {
        pin,
        pinId: pinRecord.id
      }
    } catch (error) {
      console.error('PIN generation error:', error)
      throw new Error('Failed to generate PIN')
    }
  }

  // Get fraud check logs
  async getFraudLogs(date?: string): Promise<any[]> {
    try {
      const user = await blink.auth.me()
      const targetDate = date || new Date().toISOString().split('T')[0]
      
      const logs = await blink.db.verificationHistory.list({
        where: {
          userId: user.id,
          createdAt: { gte: `${targetDate} 00:00:00` }
        },
        orderBy: { createdAt: 'desc' }
      })

      return logs
    } catch (error) {
      console.error('Error fetching logs:', error)
      return []
    }
  }

  // Private helper methods
  private async callBankAPI(request: PaymentVerificationRequest): Promise<any> {
    // Simulate Stitch/Ozow API call
    // In production, this would make actual API calls to bank services
    
    // Mock response for demo
    const isCleared = Math.random() > 0.3 // 70% success rate for demo
    
    return {
      cleared: isCleared,
      transactionId: `TXN_${Date.now()}`,
      clearedAmount: isCleared ? request.amount : 0,
      bankReference: request.reference
    }
  }

  private async analyzeDocument(content: string): Promise<any> {
    // Extract domains and company names from document
    const domains = this.extractDomains(content)
    const companies = this.extractCompanyNames(content)
    
    // Check domains against fraud rules
    const domainCheck = await this.checkDomains(domains)
    const companyCheck = await this.checkCompanies(companies)
    const contactCheck = await this.checkContactDetails(content)

    return {
      isAuthentic: domainCheck.isValid && companyCheck.isValid && contactCheck.isValid,
      domainCheck,
      companyCheck,
      contactCheck
    }
  }

  private async calculateRiskScore(type: string, data: any): Promise<number> {
    try {
      const rules = await blink.db.fraudRules.list({
        where: { isActive: "1" }
      })

      let totalRisk = 0
      let ruleCount = 0

      for (const rule of rules) {
        const riskScore = Number(rule.riskScore) || 0
        
        if (rule.ruleType === 'domain' && data.content) {
          const regex = new RegExp(rule.rulePattern, 'i')
          if (regex.test(data.content)) {
            totalRisk += riskScore
            ruleCount++
          }
        } else if (rule.ruleType === 'amount' && data.amount) {
          if (rule.rulePattern.startsWith('>') && data.amount > parseInt(rule.rulePattern.slice(1))) {
            totalRisk += riskScore
            ruleCount++
          }
        } else if (rule.ruleType === 'pattern' && data.content) {
          const regex = new RegExp(rule.rulePattern, 'i')
          if (regex.test(data.content)) {
            totalRisk += riskScore
            ruleCount++
          }
        }
      }

      return ruleCount > 0 ? Math.min(totalRisk / ruleCount, 100) : 0
    } catch (error) {
      console.error('Risk calculation error:', error)
      return 50 // Default medium risk
    }
  }

  private async logVerification(params: { type: string; data: any; result: string }): Promise<string> {
    try {
      const user = await blink.auth.me()
      const verificationId = `ver_${Date.now()}`

      await blink.db.verificationHistory.create({
        id: verificationId,
        userId: user.id,
        verificationType: params.type,
        transactionReference: params.data.reference || '',
        amount: params.data.amount || 0,
        bankName: params.data.bankName || '',
        documentType: params.data.documentType || '',
        documentContent: params.data.content || '',
        verificationResult: params.result,
        riskScore: await this.calculateRiskScore(params.type, params.data)
      })

      return verificationId
    } catch (error) {
      console.error('Logging error:', error)
      return `ver_${Date.now()}`
    }
  }

  private extractDomains(content: string): string[] {
    const domainRegex = /(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+\.[a-zA-Z]{2,})/g
    const matches = content.match(domainRegex) || []
    return matches.map(domain => domain.replace(/^https?:\/\/(www\.)?/, ''))
  }

  private extractCompanyNames(content: string): string[] {
    // Simple company name extraction - in production, use NLP
    const companyPatterns = [
      /([A-Z][a-zA-Z\s]+(?:Ltd|Pty|Inc|Corp|Company|Co\.|Limited))/g,
      /([A-Z][a-zA-Z\s]+(?:Holdings|Group|Enterprises|Solutions))/g
    ]
    
    const companies: string[] = []
    companyPatterns.forEach(pattern => {
      const matches = content.match(pattern) || []
      companies.push(...matches)
    })
    
    return [...new Set(companies)]
  }

  private async checkDomains(domains: string[]): Promise<any> {
    // Check domains against known fraud patterns
    const suspiciousDomains = domains.filter(domain => {
      return /gov.*(?<!\.gov\.za)$/.test(domain) || 
             /(g0v|g0vernment|offical|goverment)/.test(domain)
    })

    return {
      isValid: suspiciousDomains.length === 0,
      checkedDomains: domains,
      suspiciousDomains,
      message: suspiciousDomains.length > 0 
        ? `Suspicious domains detected: ${suspiciousDomains.join(', ')}`
        : 'All domains appear legitimate'
    }
  }

  private async checkCompanies(companies: string[]): Promise<any> {
    // In production, integrate with CIPC API
    return {
      isValid: true,
      checkedCompanies: companies,
      message: companies.length > 0 
        ? `Companies found: ${companies.join(', ')}`
        : 'No company names detected'
    }
  }

  private async checkContactDetails(content: string): Promise<any> {
    const emails = content.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || []
    const phones = content.match(/(?:\+27|0)[0-9]{9,10}/g) || []

    return {
      isValid: emails.length > 0 || phones.length > 0,
      emails,
      phones,
      message: `Found ${emails.length} email(s) and ${phones.length} phone number(s)`
    }
  }

  private generateSecurePin(): string {
    return Math.floor(100000 + Math.random() * 900000).toString()
  }

  private getDocumentVerificationMessage(status: string, analysis: any): string {
    if (status === 'verified') {
      return `✅ RFQ/PO appears authentic and issued by a registered company.`
    } else if (status === 'suspicious') {
      const issues = []
      if (!analysis.domainCheck.isValid) issues.push('suspicious domains')
      if (!analysis.companyCheck.isValid) issues.push('unverified companies')
      if (!analysis.contactCheck.isValid) issues.push('missing contact details')
      
      return `🚨 Warning: Document may be fraudulent. Issues detected: ${issues.join(', ')}. Please verify with official contacts.`
    } else {
      return `❌ Unable to verify document authenticity. Please check the document and try again.`
    }
  }
}

export const fraudService = new FraudService()