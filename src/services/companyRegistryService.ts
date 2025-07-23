import { blink } from '../blink/client'

export interface CompanyInfo {
  registrationNumber: string
  name: string
  status: 'active' | 'deregistered' | 'suspended' | 'unknown'
  registrationDate?: string
  businessType?: string
  directors?: string[]
  address?: string
  verified: boolean
  confidence: number
  source: 'cipc' | 'whois' | 'safps' | 'manual'
}

export interface DomainInfo {
  domain: string
  registrar?: string
  registrationDate?: string
  expiryDate?: string
  nameServers?: string[]
  isLegitimate: boolean
  riskScore: number
  warnings: string[]
}

class CompanyRegistryService {
  private readonly CIPC_API_URL = 'https://eservices.cipc.co.za/api'
  private readonly WHOIS_API_URL = 'https://api.whoisjson.com/v1'
  private readonly SAFPS_API_URL = 'https://api.safps.org.za/v1'

  // CIPC (Companies and Intellectual Property Commission) Integration
  async verifyCIPCCompany(registrationNumber: string): Promise<CompanyInfo> {
    try {
      const response = await blink.data.fetch({
        url: `${this.CIPC_API_URL}/company/${registrationNumber}`,
        method: 'GET',
        headers: {
          'Authorization': 'Bearer {{cipc_api_key}}',
          'Content-Type': 'application/json'
        }
      })

      if (response.status === 200 && response.body.success) {
        const company = response.body.data
        return {
          registrationNumber: company.registrationNumber,
          name: company.companyName,
          status: company.companyStatus.toLowerCase(),
          registrationDate: company.registrationDate,
          businessType: company.companyType,
          directors: company.directors?.map((d: any) => d.fullName) || [],
          address: company.registeredAddress,
          verified: company.companyStatus === 'Active',
          confidence: company.companyStatus === 'Active' ? 95 : 60,
          source: 'cipc'
        }
      }

      return {
        registrationNumber,
        name: 'Unknown',
        status: 'unknown',
        verified: false,
        confidence: 0,
        source: 'cipc'
      }
    } catch (error) {
      console.error('CIPC API error:', error)
      return {
        registrationNumber,
        name: 'Unknown',
        status: 'unknown',
        verified: false,
        confidence: 0,
        source: 'cipc'
      }
    }
  }

  // WHOIS Domain Verification
  async verifyDomain(domain: string): Promise<DomainInfo> {
    try {
      const response = await blink.data.fetch({
        url: `${this.WHOIS_API_URL}/${domain}`,
        method: 'GET',
        headers: {
          'Authorization': 'Bearer {{whois_api_key}}'
        }
      })

      if (response.status === 200 && response.body) {
        const whois = response.body
        const warnings: string[] = []
        let riskScore = 0

        // Check for suspicious patterns
        if (domain.includes('gov') && !domain.endsWith('.gov.za')) {
          warnings.push('Suspicious government domain - may be typosquatting')
          riskScore += 40
        }

        if (domain.includes('-') && domain.split('-').length > 3) {
          warnings.push('Excessive hyphens may indicate suspicious domain')
          riskScore += 20
        }

        // Check domain age
        const registrationDate = new Date(whois.registrationDate)
        const daysSinceRegistration = (Date.now() - registrationDate.getTime()) / (1000 * 60 * 60 * 24)
        
        if (daysSinceRegistration < 30) {
          warnings.push('Recently registered domain (less than 30 days)')
          riskScore += 30
        }

        // Check for privacy protection
        if (whois.registrant?.includes('privacy') || whois.registrant?.includes('protected')) {
          warnings.push('Domain uses privacy protection')
          riskScore += 10
        }

        return {
          domain,
          registrar: whois.registrar,
          registrationDate: whois.registrationDate,
          expiryDate: whois.expiryDate,
          nameServers: whois.nameServers,
          isLegitimate: riskScore < 50,
          riskScore,
          warnings
        }
      }

      return {
        domain,
        isLegitimate: false,
        riskScore: 100,
        warnings: ['Unable to verify domain information']
      }
    } catch (error) {
      console.error('WHOIS API error:', error)
      return {
        domain,
        isLegitimate: false,
        riskScore: 100,
        warnings: ['Domain verification service unavailable']
      }
    }
  }

  // SAFPS (Southern African Fraud Prevention Service) Check
  async checkSAFPSFraud(companyName: string, registrationNumber?: string): Promise<{
    isFraudulent: boolean
    riskLevel: 'low' | 'medium' | 'high'
    alerts: string[]
    confidence: number
  }> {
    try {
      const response = await blink.data.fetch({
        url: `${this.SAFPS_API_URL}/fraud-check`,
        method: 'POST',
        headers: {
          'Authorization': 'Bearer {{safps_api_key}}',
          'Content-Type': 'application/json'
        },
        body: {
          companyName,
          registrationNumber,
          checkType: 'comprehensive'
        }
      })

      if (response.status === 200 && response.body.success) {
        const result = response.body.data
        return {
          isFraudulent: result.fraudulent,
          riskLevel: result.riskLevel,
          alerts: result.alerts || [],
          confidence: result.confidence || 80
        }
      }

      return {
        isFraudulent: false,
        riskLevel: 'low',
        alerts: [],
        confidence: 50
      }
    } catch (error) {
      console.error('SAFPS API error:', error)
      return {
        isFraudulent: false,
        riskLevel: 'low',
        alerts: ['SAFPS service unavailable'],
        confidence: 0
      }
    }
  }

  // Comprehensive company verification
  async verifyCompany(companyName: string, registrationNumber?: string, domain?: string): Promise<{
    company: CompanyInfo
    domain?: DomainInfo
    fraudCheck: {
      isFraudulent: boolean
      riskLevel: 'low' | 'medium' | 'high'
      alerts: string[]
      confidence: number
    }
    overallRisk: number
    recommendation: 'approve' | 'review' | 'reject'
  }> {
    const results = await Promise.allSettled([
      registrationNumber ? this.verifyCIPCCompany(registrationNumber) : Promise.resolve(null),
      domain ? this.verifyDomain(domain) : Promise.resolve(null),
      this.checkSAFPSFraud(companyName, registrationNumber)
    ])

    const company = results[0].status === 'fulfilled' ? results[0].value : null
    const domainInfo = results[1].status === 'fulfilled' ? results[1].value : null
    const fraudCheck = results[2].status === 'fulfilled' ? results[2].value : {
      isFraudulent: false,
      riskLevel: 'low' as const,
      alerts: [],
      confidence: 0
    }

    // Calculate overall risk score
    let overallRisk = 0
    
    if (company && !company.verified) overallRisk += 30
    if (domainInfo && domainInfo.riskScore > 50) overallRisk += domainInfo.riskScore * 0.4
    if (fraudCheck.isFraudulent) overallRisk += 50
    if (fraudCheck.riskLevel === 'high') overallRisk += 30
    else if (fraudCheck.riskLevel === 'medium') overallRisk += 15

    // Determine recommendation
    let recommendation: 'approve' | 'review' | 'reject'
    if (overallRisk < 20) recommendation = 'approve'
    else if (overallRisk < 60) recommendation = 'review'
    else recommendation = 'reject'

    return {
      company: company || {
        registrationNumber: registrationNumber || 'unknown',
        name: companyName,
        status: 'unknown',
        verified: false,
        confidence: 0,
        source: 'manual'
      },
      domain: domainInfo || undefined,
      fraudCheck,
      overallRisk: Math.min(100, overallRisk),
      recommendation
    }
  }

  // Email domain verification for RFQ/PO documents
  async verifyEmailDomain(email: string): Promise<{
    isLegitimate: boolean
    domain: string
    riskFactors: string[]
    confidence: number
  }> {
    const domain = email.split('@')[1]
    if (!domain) {
      return {
        isLegitimate: false,
        domain: '',
        riskFactors: ['Invalid email format'],
        confidence: 0
      }
    }

    const domainInfo = await this.verifyDomain(domain)
    const riskFactors: string[] = []

    // Check for common fraud patterns
    if (domain.includes('gov') && !domain.endsWith('.gov.za')) {
      riskFactors.push('Suspicious government domain')
    }

    if (domain.includes('gmail') || domain.includes('yahoo') || domain.includes('hotmail')) {
      riskFactors.push('Free email provider - verify business legitimacy')
    }

    if (domain.split('.').length > 3) {
      riskFactors.push('Complex subdomain structure')
    }

    const confidence = Math.max(0, 100 - domainInfo.riskScore - (riskFactors.length * 10))

    return {
      isLegitimate: domainInfo.isLegitimate && riskFactors.length < 2,
      domain,
      riskFactors: [...riskFactors, ...domainInfo.warnings],
      confidence
    }
  }
}

export const companyRegistryService = new CompanyRegistryService()