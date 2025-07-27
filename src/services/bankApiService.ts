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
  beneficiaryName?: string
}

export interface PaymentVerificationResponse {
  verified: boolean
  status: 'cleared' | 'pending' | 'failed' | 'not_found'
  amount: number
  reference: string
  transactionDate?: string
  beneficiaryName?: string
  message: string
  confidence: number
}

export interface BankAccount {
  accountNumber: string
  bankName: string
  accountType: string
  balance?: number
  isActive: boolean
}

class BankApiService {
  // Stitch Money API Integration
  async verifyPaymentStitch(request: PaymentVerificationRequest): Promise<PaymentVerificationResponse> {
    try {
      const response = await blink.data.fetch({
        url: 'https://api.stitch.money/graphql',
        method: 'POST',
        headers: {
          'Authorization': 'Bearer {{stitch_api_key}}',
          'Content-Type': 'application/json'
        },
        body: {
          query: `
            query GetPayment($reference: String!) {
              payment(reference: $reference) {
                id
                amount
                status
                createdAt
                reference
                beneficiary {
                  name
                  accountNumber
                }
              }
            }
          `,
          variables: {
            reference: request.reference
          }
        }
      })

      if (response.status === 200 && response.body.data?.payment) {
        const payment = response.body.data.payment
        return {
          verified: payment.status === 'COMPLETED',
          status: this.mapStitchStatus(payment.status),
          amount: payment.amount / 100, // Convert from cents
          reference: payment.reference,
          transactionDate: payment.createdAt,
          beneficiaryName: payment.beneficiary?.name,
          message: payment.status === 'COMPLETED' 
            ? `Payment verified: R${(payment.amount / 100).toLocaleString()} cleared from ${payment.beneficiary?.name || 'Unknown'}.`
            : `Payment status: ${payment.status}. Please wait for completion.`,
          confidence: payment.status === 'COMPLETED' ? 95 : 60
        }
      }

      return this.createNotFoundResponse(request)
    } catch (error) {
      console.error('Stitch API error:', error)
      return this.createErrorResponse(request)
    }
  }

  // Ozow API Integration
  async verifyPaymentOzow(request: PaymentVerificationRequest): Promise<PaymentVerificationResponse> {
    try {
      const response = await blink.data.fetch({
        url: 'https://api.ozow.com/GetTransaction',
        method: 'POST',
        headers: {
          'ApiKey': '{{ozow_api_key}}',
          'SiteCode': '{{ozow_site_code}}',
          'Content-Type': 'application/json'
        },
        body: {
          TransactionReference: request.reference,
          Amount: request.amount * 100 // Convert to cents
        }
      })

      if (response.status === 200 && response.body.IsSuccessful) {
        const transaction = response.body
        return {
          verified: transaction.Status === 'Complete',
          status: this.mapOzowStatus(transaction.Status),
          amount: transaction.Amount / 100,
          reference: transaction.TransactionReference,
          transactionDate: transaction.TransactionDate,
          beneficiaryName: transaction.CustomerName,
          message: transaction.Status === 'Complete'
            ? `Payment verified: R${(transaction.Amount / 100).toLocaleString()} cleared from ${transaction.CustomerName || 'Unknown'}.`
            : `Payment status: ${transaction.Status}. ${transaction.StatusMessage}`,
          confidence: transaction.Status === 'Complete' ? 90 : 50
        }
      }

      return this.createNotFoundResponse(request)
    } catch (error) {
      console.error('Ozow API error:', error)
      return this.createErrorResponse(request)
    }
  }

  // PayShap API Integration (Real-time payments)
  async verifyPaymentPayShap(request: PaymentVerificationRequest): Promise<PaymentVerificationResponse> {
    try {
      const response = await blink.data.fetch({
        url: 'https://api.payshap.co.za/v1/payments/verify',
        method: 'POST',
        headers: {
          'Authorization': 'Bearer {{payshap_api_key}}',
          'Content-Type': 'application/json'
        },
        body: {
          reference: request.reference,
          amount: request.amount,
          bank_name: request.bankName
        }
      })

      if (response.status === 200 && response.body.success) {
        const payment = response.body.data
        return {
          verified: payment.status === 'completed',
          status: payment.status === 'completed' ? 'cleared' : 'pending',
          amount: payment.amount,
          reference: payment.reference,
          transactionDate: payment.processed_at,
          beneficiaryName: payment.payer_name,
          message: payment.status === 'completed'
            ? `Real-time payment verified: R${payment.amount.toLocaleString()} from ${payment.payer_name}.`
            : `Payment processing: ${payment.status_message}`,
          confidence: payment.status === 'completed' ? 98 : 70
        }
      }

      return this.createNotFoundResponse(request)
    } catch (error) {
      console.error('PayShap API error:', error)
      return this.createErrorResponse(request)
    }
  }

  // Multi-provider verification with fallback
  async verifyPayment(request: PaymentVerificationRequest): Promise<PaymentVerificationResponse> {
    // Try primary provider first (Stitch)
    try {
      const stitchResult = await this.verifyPaymentStitch(request)
      if (stitchResult.verified || stitchResult.status !== 'not_found') {
        return stitchResult
      }
    } catch (error) {
      console.log('Stitch verification failed, trying Ozow...')
    }

    // Fallback to Ozow
    try {
      const ozowResult = await this.verifyPaymentOzow(request)
      if (ozowResult.verified || ozowResult.status !== 'not_found') {
        return ozowResult
      }
    } catch (error) {
      console.log('Ozow verification failed, trying PayShap...')
    }

    // Final fallback to PayShap
    try {
      return await this.verifyPaymentPayShap(request)
    } catch (error) {
      console.error('All payment verification providers failed:', error)
      return this.createErrorResponse(request)
    }
  }

  // Get linked bank accounts
  async getBankAccounts(companyId: string): Promise<BankAccount[]> {
    try {
      const accounts = await blink.db.bankAccounts.list({
        where: { companyId },
        orderBy: { createdAt: 'desc' }
      })

      return accounts.map(account => ({
        accountNumber: account.accountNumber,
        bankName: account.bankName,
        accountType: account.accountType,
        balance: account.balance,
        isActive: Number(account.isActive) > 0
      }))
    } catch (error) {
      console.error('Error fetching bank accounts:', error)
      return []
    }
  }

  // Link new bank account
  async linkBankAccount(companyId: string, account: Omit<BankAccount, 'isActive'>): Promise<boolean> {
    try {
      await blink.db.bankAccounts.create({
        id: `bank_${Date.now()}`,
        companyId,
        accountNumber: account.accountNumber,
        bankName: account.bankName,
        accountType: account.accountType,
        balance: account.balance || 0,
        isActive: true,
        createdAt: new Date().toISOString()
      })
      return true
    } catch (error) {
      console.error('Error linking bank account:', error)
      return false
    }
  }

  // Helper methods
  private mapStitchStatus(status: string): 'cleared' | 'pending' | 'failed' | 'not_found' {
    switch (status) {
      case 'COMPLETED': return 'cleared'
      case 'PENDING': return 'pending'
      case 'FAILED': return 'failed'
      default: return 'not_found'
    }
  }

  private mapOzowStatus(status: string): 'cleared' | 'pending' | 'failed' | 'not_found' {
    switch (status) {
      case 'Complete': return 'cleared'
      case 'Pending': return 'pending'
      case 'Cancelled':
      case 'Error': return 'failed'
      default: return 'not_found'
    }
  }

  private createNotFoundResponse(request: PaymentVerificationRequest): PaymentVerificationResponse {
    return {
      verified: false,
      status: 'not_found',
      amount: request.amount,
      reference: request.reference,
      message: `No cleared payment found for reference ${request.reference}. Please wait until funds reflect before delivering.`,
      confidence: 0
    }
  }

  private createErrorResponse(request: PaymentVerificationRequest): PaymentVerificationResponse {
    return {
      verified: false,
      status: 'failed',
      amount: request.amount,
      reference: request.reference,
      message: 'Unable to verify payment at this time. Please try again later or contact support.',
      confidence: 0
    }
  }
}

export const bankApiService = new BankApiService()