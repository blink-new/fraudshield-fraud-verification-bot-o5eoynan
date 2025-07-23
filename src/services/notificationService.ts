import { createClient } from '@blinkdotnew/sdk'
import { languageService } from './languageService'

const blink = createClient({
  projectId: 'fraudshield-fraud-verification-bot-o5eoynan',
  authRequired: true
})

export interface NotificationPreferences {
  email: boolean
  whatsapp: boolean
  sms: boolean
  suspiciousActivity: boolean
  paymentVerification: boolean
  documentAlerts: boolean
  dailySummary: boolean
}

export interface AlertData {
  type: 'suspicious_payment' | 'suspicious_document' | 'high_risk_transaction' | 'daily_summary'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  message: string
  data: any
  companyId: string
  userId: string
}

class NotificationService {
  // Send email notification
  async sendEmailAlert(
    recipients: string[],
    subject: string,
    htmlContent: string,
    alertData?: AlertData
  ): Promise<boolean> {
    try {
      const result = await blink.notifications.email({
        to: recipients,
        from: 'alerts@fraudshield.co.za',
        subject: subject,
        html: htmlContent,
        text: this.stripHtml(htmlContent)
      })

      if (result.success && alertData) {
        // Log the notification
        await this.logNotification({
          id: `notif_${Date.now()}`,
          type: 'email',
          recipients: recipients.join(','),
          subject,
          alertType: alertData.type,
          severity: alertData.severity,
          companyId: alertData.companyId,
          userId: alertData.userId,
          status: 'sent',
          sentAt: new Date().toISOString()
        })
      }

      return result.success
    } catch (error) {
      console.error('Email notification error:', error)
      return false
    }
  }

  // Send WhatsApp notification via WhatsApp Cloud API
  async sendWhatsAppAlert(
    phoneNumber: string,
    message: string,
    alertData?: AlertData
  ): Promise<boolean> {
    try {
      const response = await blink.data.fetch({
        url: 'https://graph.facebook.com/v18.0/{{whatsapp_phone_number_id}}/messages',
        method: 'POST',
        headers: {
          'Authorization': 'Bearer {{whatsapp_access_token}}',
          'Content-Type': 'application/json'
        },
        body: {
          messaging_product: 'whatsapp',
          to: phoneNumber.replace(/[^0-9]/g, ''), // Clean phone number
          type: 'text',
          text: {
            body: message
          }
        }
      })

      if (response.status === 200 && alertData) {
        await this.logNotification({
          id: `notif_${Date.now()}`,
          type: 'whatsapp',
          recipients: phoneNumber,
          subject: alertData.title,
          alertType: alertData.type,
          severity: alertData.severity,
          companyId: alertData.companyId,
          userId: alertData.userId,
          status: 'sent',
          sentAt: new Date().toISOString()
        })
      }

      return response.status === 200
    } catch (error) {
      console.error('WhatsApp notification error:', error)
      return false
    }
  }

  // Send structured WhatsApp message with buttons
  async sendWhatsAppInteractiveAlert(
    phoneNumber: string,
    headerText: string,
    bodyText: string,
    buttons: Array<{ id: string; title: string }>,
    alertData?: AlertData
  ): Promise<boolean> {
    try {
      const response = await blink.data.fetch({
        url: 'https://graph.facebook.com/v18.0/{{whatsapp_phone_number_id}}/messages',
        method: 'POST',
        headers: {
          'Authorization': 'Bearer {{whatsapp_access_token}}',
          'Content-Type': 'application/json'
        },
        body: {
          messaging_product: 'whatsapp',
          to: phoneNumber.replace(/[^0-9]/g, ''),
          type: 'interactive',
          interactive: {
            type: 'button',
            header: {
              type: 'text',
              text: headerText
            },
            body: {
              text: bodyText
            },
            action: {
              buttons: buttons.map(btn => ({
                type: 'reply',
                reply: {
                  id: btn.id,
                  title: btn.title
                }
              }))
            }
          }
        }
      })

      return response.status === 200
    } catch (error) {
      console.error('WhatsApp interactive notification error:', error)
      return false
    }
  }

  // Send suspicious activity alert
  async sendSuspiciousActivityAlert(alertData: AlertData): Promise<void> {
    const company = await this.getCompanyDetails(alertData.companyId)
    if (!company) return

    const preferences = await this.getNotificationPreferences(alertData.companyId)
    if (!preferences.suspiciousActivity) return

    const language = company.preferredLanguage || 'en'
    languageService.setLanguage(language)

    const subject = this.getSeverityEmoji(alertData.severity) + ' ' + 
                   languageService.translate('notifications.suspiciousActivity.subject')
    
    const emailContent = this.generateSuspiciousActivityEmail(alertData, company)
    const whatsappMessage = this.generateSuspiciousActivityWhatsApp(alertData, company)

    // Send email if enabled
    if (preferences.email && company.contactEmail) {
      await this.sendEmailAlert([company.contactEmail], subject, emailContent, alertData)
    }

    // Send WhatsApp if enabled
    if (preferences.whatsapp && company.whatsappNumber) {
      await this.sendWhatsAppAlert(company.whatsappNumber, whatsappMessage, alertData)
    }
  }

  // Send daily summary
  async sendDailySummary(companyId: string): Promise<void> {
    const company = await this.getCompanyDetails(companyId)
    if (!company) return

    const preferences = await this.getNotificationPreferences(companyId)
    if (!preferences.dailySummary) return

    const summary = await this.generateDailySummary(companyId)
    const language = company.preferredLanguage || 'en'
    languageService.setLanguage(language)

    const subject = '📊 ' + languageService.translate('notifications.dailySummary.subject')
    const emailContent = this.generateDailySummaryEmail(summary, company)
    const whatsappMessage = this.generateDailySummaryWhatsApp(summary, company)

    // Send email if enabled
    if (preferences.email && company.contactEmail) {
      await this.sendEmailAlert([company.contactEmail], subject, emailContent)
    }

    // Send WhatsApp if enabled
    if (preferences.whatsapp && company.whatsappNumber) {
      await this.sendWhatsAppAlert(company.whatsappNumber, whatsappMessage)
    }
  }

  // Generate suspicious activity email
  private generateSuspiciousActivityEmail(alertData: AlertData, company: any): string {
    const severityColor = this.getSeverityColor(alertData.severity)
    const severityEmoji = this.getSeverityEmoji(alertData.severity)

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>FraudShield Alert</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">🛡️ FraudShield Alert</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">Fraud Detection System</p>
          </div>
          
          <div style="background: white; padding: 30px; border: 1px solid #ddd; border-top: none;">
            <div style="background: ${severityColor}; color: white; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
              <h2 style="margin: 0; font-size: 18px;">${severityEmoji} ${alertData.title}</h2>
            </div>
            
            <p style="font-size: 16px; margin-bottom: 20px;">${alertData.message}</p>
            
            <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
              <h3 style="margin: 0 0 10px 0; color: #495057;">Alert Details:</h3>
              <ul style="margin: 0; padding-left: 20px;">
                <li><strong>Type:</strong> ${alertData.type.replace('_', ' ').toUpperCase()}</li>
                <li><strong>Severity:</strong> ${alertData.severity.toUpperCase()}</li>
                <li><strong>Time:</strong> ${new Date().toLocaleString()}</li>
                <li><strong>Company:</strong> ${company.companyName}</li>
              </ul>
            </div>
            
            ${this.generateAlertDataSection(alertData)}
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="https://fraudshield-fraud-verification-bot-o5eoynan.sites.blink.new" 
                 style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                View Dashboard
              </a>
            </div>
          </div>
          
          <div style="background: #f8f9fa; padding: 15px; border-radius: 0 0 8px 8px; text-align: center; font-size: 12px; color: #6c757d;">
            <p style="margin: 0;">This is an automated alert from FraudShield. Do not reply to this email.</p>
            <p style="margin: 5px 0 0 0;">© 2024 FraudShield. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }

  // Generate suspicious activity WhatsApp message
  private generateSuspiciousActivityWhatsApp(alertData: AlertData, company: any): string {
    const severityEmoji = this.getSeverityEmoji(alertData.severity)
    
    return `🛡️ *FraudShield Alert*

${severityEmoji} *${alertData.title}*

${alertData.message}

*Alert Details:*
• Type: ${alertData.type.replace('_', ' ').toUpperCase()}
• Severity: ${alertData.severity.toUpperCase()}
• Time: ${new Date().toLocaleString()}
• Company: ${company.companyName}

View full details: https://fraudshield-fraud-verification-bot-o5eoynan.sites.blink.new

_This is an automated alert from FraudShield._`
  }

  // Generate daily summary email
  private generateDailySummaryEmail(summary: any, company: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>FraudShield Daily Summary</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">📊 Daily Fraud Summary</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">${new Date().toLocaleDateString()}</p>
          </div>
          
          <div style="background: white; padding: 30px; border: 1px solid #ddd; border-top: none;">
            <h2 style="color: #495057; margin-bottom: 20px;">Hello ${company.companyName},</h2>
            
            <p>Here's your fraud detection summary for today:</p>
            
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 20px 0;">
              <div style="background: #e3f2fd; padding: 15px; border-radius: 6px; text-align: center;">
                <h3 style="margin: 0; color: #1976d2; font-size: 24px;">${summary.totalChecks}</h3>
                <p style="margin: 5px 0 0 0; color: #666;">Total Checks</p>
              </div>
              <div style="background: #e8f5e8; padding: 15px; border-radius: 6px; text-align: center;">
                <h3 style="margin: 0; color: #388e3c; font-size: 24px;">${summary.verifiedPayments}</h3>
                <p style="margin: 5px 0 0 0; color: #666;">Verified Payments</p>
              </div>
              <div style="background: #fff3e0; padding: 15px; border-radius: 6px; text-align: center;">
                <h3 style="margin: 0; color: #f57c00; font-size: 24px;">${summary.suspiciousDocuments}</h3>
                <p style="margin: 5px 0 0 0; color: #666;">Suspicious Documents</p>
              </div>
              <div style="background: #fce4ec; padding: 15px; border-radius: 6px; text-align: center;">
                <h3 style="margin: 0; color: #c2185b; font-size: 24px;">${summary.generatedPins}</h3>
                <p style="margin: 5px 0 0 0; color: #666;">Generated PINs</p>
              </div>
            </div>
            
            ${summary.alerts.length > 0 ? `
            <div style="background: #ffebee; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0; color: #d32f2f;">⚠️ Today's Alerts</h3>
              <ul style="margin: 0; padding-left: 20px;">
                ${summary.alerts.map((alert: any) => `<li>${alert.message}</li>`).join('')}
              </ul>
            </div>
            ` : ''}
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="https://fraudshield-fraud-verification-bot-o5eoynan.sites.blink.new" 
                 style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                View Full Report
              </a>
            </div>
          </div>
          
          <div style="background: #f8f9fa; padding: 15px; border-radius: 0 0 8px 8px; text-align: center; font-size: 12px; color: #6c757d;">
            <p style="margin: 0;">© 2024 FraudShield. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }

  // Generate daily summary WhatsApp message
  private generateDailySummaryWhatsApp(summary: any, company: any): string {
    return `📊 *FraudShield Daily Summary*
${new Date().toLocaleDateString()}

Hello ${company.companyName},

*Today's Activity:*
• Total Checks: ${summary.totalChecks}
• Verified Payments: ${summary.verifiedPayments}
• Suspicious Documents: ${summary.suspiciousDocuments}
• Generated PINs: ${summary.generatedPins}

${summary.alerts.length > 0 ? `
⚠️ *Today's Alerts:*
${summary.alerts.map((alert: any) => `• ${alert.message}`).join('\n')}
` : ''}

View full report: https://fraudshield-fraud-verification-bot-o5eoynan.sites.blink.new

_Automated daily summary from FraudShield_`
  }

  // Helper methods
  private getSeverityColor(severity: string): string {
    switch (severity) {
      case 'critical': return '#d32f2f'
      case 'high': return '#f57c00'
      case 'medium': return '#fbc02d'
      case 'low': return '#388e3c'
      default: return '#666'
    }
  }

  private getSeverityEmoji(severity: string): string {
    switch (severity) {
      case 'critical': return '🚨'
      case 'high': return '⚠️'
      case 'medium': return '⚡'
      case 'low': return 'ℹ️'
      default: return '📢'
    }
  }

  private generateAlertDataSection(alertData: AlertData): string {
    if (!alertData.data) return ''

    let content = '<div style="background: #f8f9fa; padding: 15px; border-radius: 6px; margin-bottom: 20px;">'
    content += '<h3 style="margin: 0 0 10px 0; color: #495057;">Additional Information:</h3>'
    content += '<ul style="margin: 0; padding-left: 20px;">'

    Object.entries(alertData.data).forEach(([key, value]) => {
      content += `<li><strong>${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</strong> ${value}</li>`
    })

    content += '</ul></div>'
    return content
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
  }

  private async getCompanyDetails(companyId: string): Promise<any> {
    try {
      const companies = await blink.db.companies.list({
        where: { id: companyId },
        limit: 1
      })
      return companies.length > 0 ? companies[0] : null
    } catch (error) {
      console.error('Error fetching company details:', error)
      return null
    }
  }

  private async getNotificationPreferences(companyId: string): Promise<NotificationPreferences> {
    try {
      const prefs = await blink.db.notificationPreferences.list({
        where: { companyId },
        limit: 1
      })

      if (prefs.length > 0) {
        const pref = prefs[0]
        return {
          email: Number(pref.email) > 0,
          whatsapp: Number(pref.whatsapp) > 0,
          sms: Number(pref.sms) > 0,
          suspiciousActivity: Number(pref.suspiciousActivity) > 0,
          paymentVerification: Number(pref.paymentVerification) > 0,
          documentAlerts: Number(pref.documentAlerts) > 0,
          dailySummary: Number(pref.dailySummary) > 0
        }
      }

      // Default preferences
      return {
        email: true,
        whatsapp: false,
        sms: false,
        suspiciousActivity: true,
        paymentVerification: true,
        documentAlerts: true,
        dailySummary: true
      }
    } catch (error) {
      console.error('Error fetching notification preferences:', error)
      return {
        email: true,
        whatsapp: false,
        sms: false,
        suspiciousActivity: true,
        paymentVerification: true,
        documentAlerts: true,
        dailySummary: true
      }
    }
  }

  private async generateDailySummary(companyId: string): Promise<any> {
    const today = new Date().toISOString().split('T')[0]

    try {
      const history = await blink.db.verificationHistory.list({
        where: { 
          companyId,
          createdAt: { gte: today + 'T00:00:00.000Z' }
        }
      })

      const totalChecks = history.length
      const verifiedPayments = history.filter(h => h.verificationType === 'payment' && h.result === 'verified').length
      const suspiciousDocuments = history.filter(h => h.verificationType === 'document' && h.result === 'suspicious').length
      const generatedPins = history.filter(h => h.verificationType === 'pin_generation').length

      const alerts = history
        .filter(h => h.riskScore > 70)
        .map(h => ({ message: `High risk ${h.verificationType}: ${h.details}` }))

      return {
        totalChecks,
        verifiedPayments,
        suspiciousDocuments,
        generatedPins,
        alerts
      }
    } catch (error) {
      console.error('Error generating daily summary:', error)
      return {
        totalChecks: 0,
        verifiedPayments: 0,
        suspiciousDocuments: 0,
        generatedPins: 0,
        alerts: []
      }
    }
  }

  private async logNotification(notification: any): Promise<void> {
    try {
      await blink.db.notificationLogs.create(notification)
    } catch (error) {
      console.error('Error logging notification:', error)
    }
  }
}

export const notificationService = new NotificationService()