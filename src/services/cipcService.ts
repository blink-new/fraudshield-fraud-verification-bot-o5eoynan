import { createClient } from '@blinkdotnew/sdk'

const blink = createClient({
  projectId: 'fraudshield-fraud-verification-bot-o5eoynan',
  authRequired: true
})

export interface CompanyInfo {
  registrationNumber: string
  companyName: string
  status: 'active' | 'deregistered' | 'suspended' | 'unknown'
  registrationDate: string
  companyType: string
  directors: string[]
  businessAddress: string
  isVerified: boolean
  riskScore: number
}

export interface DomainInfo {
  domain: string
  isLegitimate: boolean
  registrar: string
  creationDate: string
  expirationDate: string
  nameServers: string[]
  riskFactors: string[]
  similarDomains: string[]
}

class CipcService {
  // CIPC Company Registry Integration
  async verifyCompany(registrationNumber: string): Promise<CompanyInfo> {
    try {
      // CIPC API integration
      const response = await blink.data.fetch({
        url: 'https://eservices.cipc.co.za/api/company/search',
        method: 'POST',
        headers: {
          'Authorization': 'Bearer {{cipc_api_key}}',
          'Content-Type': 'application/json'
        },
        body: {
          registrationNumber: registrationNumber.replace(/[^0-9]/g, ''),
          includeDirectors: true
        }
      })

      if (response.status === 200 && response.body.success) {
        const company = response.body.data
        return {
          registrationNumber: company.registrationNumber,
          companyName: company.companyName,
          status: this.mapCipcStatus(company.status),
          registrationDate: company.registrationDate,
          companyType: company.companyType,
          directors: company.directors?.map((d: any) => d.fullName) || [],
          businessAddress: company.businessAddress,
          isVerified: company.status === 'In Business',
          riskScore: this.calculateCompanyRiskScore(company)
        }
      }

      // Fallback to local database check
      return await this.checkLocalCompanyDatabase(registrationNumber)
    } catch (error) {
      console.error('CIPC API error:', error)
      return await this.checkLocalCompanyDatabase(registrationNumber)
    }
  }

  // WHOIS Domain Verification
  async verifyDomain(domain: string): Promise<DomainInfo> {
    try {
      const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/.*$/, '')
      
      const response = await blink.data.fetch({
        url: 'https://api.whoisjson.com/v1/whois',
        method: 'GET',
        query: {
          domain: cleanDomain,
          api_key: '{{whois_api_key}}'
        }
      })

      if (response.status === 200 && response.body.success) {
        const whoisData = response.body
        const riskFactors = this.analyzeDomainRisk(cleanDomain, whoisData)
        
        return {
          domain: cleanDomain,
          isLegitimate: riskFactors.length === 0,
          registrar: whoisData.registrar?.name || 'Unknown',
          creationDate: whoisData.created_date,
          expirationDate: whoisData.expires_date,
          nameServers: whoisData.name_servers || [],
          riskFactors,
          similarDomains: await this.findSimilarDomains(cleanDomain)
        }
      }

      return await this.performBasicDomainCheck(cleanDomain)
    } catch (error) {
      console.error('WHOIS API error:', error)
      return await this.performBasicDomainCheck(domain)
    }
  }

  // SAFPS (Southern African Fraud Prevention Service) Integration
  async checkFraudDatabase(companyName: string, registrationNumber?: string): Promise<{
    isFlagged: boolean
    riskLevel: 'low' | 'medium' | 'high'
    alerts: string[]
    lastChecked: string
  }> {
    try {
      const response = await blink.data.fetch({
        url: 'https://api.safps.org.za/fraud-check',
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
        const fraudData = response.body.data
        return {
          isFlagged: fraudData.isFlagged,
          riskLevel: fraudData.riskLevel,
          alerts: fraudData.alerts || [],
          lastChecked: new Date().toISOString()
        }
      }

      // Fallback to local fraud patterns
      return await this.checkLocalFraudPatterns(companyName, registrationNumber)
    } catch (error) {
      console.error('SAFPS API error:', error)
      return await this.checkLocalFraudPatterns(companyName, registrationNumber)
    }
  }

  // Enhanced domain risk analysis
  private analyzeDomainRisk(domain: string, whoisData: any): string[] {
    const riskFactors: string[] = []

    // Check for government domain spoofing
    const govPatterns = [
      /gov[^.]*\.(?!za$)/i,  // gov-something.notza
      /g[o0]v\.za/i,          // g0v.za
      /gov-za\./i,            // gov-za.org
      /\.gov-za$/i,           // something.gov-za
      /government[^.]*\.(?!za$)/i
    ]

    govPatterns.forEach(pattern => {
      if (pattern.test(domain)) {
        riskFactors.push('Suspicious government domain pattern detected')
      }
    })

    // Check for banking domain spoofing
    const bankPatterns = [
      /fnb[^.]*\.(?!co\.za$)/i,
      /standardbank[^.]*\.(?!co\.za$)/i,
      /absa[^.]*\.(?!co\.za$)/i,
      /nedbank[^.]*\.(?!co\.za$)/i,
      /capitec[^.]*\.(?!co\.za$)/i
    ]

    bankPatterns.forEach(pattern => {
      if (pattern.test(domain)) {
        riskFactors.push('Suspicious banking domain pattern detected')
      }
    })

    // Check domain age
    if (whoisData.created_date) {
      const creationDate = new Date(whoisData.created_date)
      const daysSinceCreation = (Date.now() - creationDate.getTime()) / (1000 * 60 * 60 * 24)
      
      if (daysSinceCreation < 30) {
        riskFactors.push('Domain created less than 30 days ago')
      }
    }

    // Check for suspicious TLDs
    const suspiciousTlds = ['.tk', '.ml', '.ga', '.cf', '.click', '.download']
    if (suspiciousTlds.some(tld => domain.endsWith(tld))) {
      riskFactors.push('Domain uses suspicious top-level domain')
    }

    // Check for homograph attacks
    const suspiciousChars = /[а-я]|[α-ω]|[０-９]/
    if (suspiciousChars.test(domain)) {
      riskFactors.push('Domain contains non-Latin characters (possible homograph attack)')
    }

    return riskFactors
  }

  // Find similar domains that might be used for spoofing
  private async findSimilarDomains(domain: string): Promise<string[]> {
    const similarDomains: string[] = []
    const baseDomain = domain.split('.')[0]

    // Common typosquatting patterns
    const variations = [
      baseDomain.replace('o', '0'),
      baseDomain.replace('i', '1'),
      baseDomain.replace('l', '1'),
      baseDomain + '-za',
      baseDomain + 'za',
      'www-' + baseDomain,
      baseDomain.replace(/(.)(.)/, '$2$1'), // swap first two chars
    ]

    // Check if variations exist (simplified check)
    for (const variation of variations) {
      if (variation !== baseDomain && variation.length > 2) {
        similarDomains.push(`${variation}.com`)
        similarDomains.push(`${variation}.co.za`)
        similarDomains.push(`${variation}.org`)
      }
    }

    return similarDomains.slice(0, 5) // Return top 5 similar domains
  }

  // Local company database fallback
  private async checkLocalCompanyDatabase(registrationNumber: string): Promise<CompanyInfo> {
    try {
      const companies = await blink.db.verifiedCompanies.list({
        where: { registrationNumber },
        limit: 1
      })

      if (companies.length > 0) {
        const company = companies[0]
        return {
          registrationNumber: company.registrationNumber,
          companyName: company.companyName,
          status: company.status as any,
          registrationDate: company.registrationDate,
          companyType: company.companyType,
          directors: JSON.parse(company.directors || '[]'),
          businessAddress: company.businessAddress,
          isVerified: Number(company.isVerified) > 0,
          riskScore: company.riskScore || 50
        }
      }

      return {
        registrationNumber,
        companyName: 'Unknown Company',
        status: 'unknown',
        registrationDate: '',
        companyType: 'Unknown',
        directors: [],
        businessAddress: '',
        isVerified: false,
        riskScore: 80
      }
    } catch (error) {
      console.error('Local company database error:', error)
      return {
        registrationNumber,
        companyName: 'Unknown Company',
        status: 'unknown',
        registrationDate: '',
        companyType: 'Unknown',
        directors: [],
        businessAddress: '',
        isVerified: false,
        riskScore: 90
      }
    }
  }

  // Basic domain check fallback
  private async performBasicDomainCheck(domain: string): Promise<DomainInfo> {
    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/.*$/, '')
    const riskFactors = this.analyzeDomainRisk(cleanDomain, {})

    return {
      domain: cleanDomain,
      isLegitimate: riskFactors.length === 0,
      registrar: 'Unknown',
      creationDate: '',
      expirationDate: '',
      nameServers: [],
      riskFactors,
      similarDomains: await this.findSimilarDomains(cleanDomain)
    }
  }

  // Local fraud patterns check
  private async checkLocalFraudPatterns(companyName: string, registrationNumber?: string): Promise<{
    isFlagged: boolean
    riskLevel: 'low' | 'medium' | 'high'
    alerts: string[]
    lastChecked: string
  }> {
    const alerts: string[] = []
    let riskLevel: 'low' | 'medium' | 'high' = 'low'

    // Check for suspicious company name patterns
    const suspiciousPatterns = [
      /government/i,
      /official/i,
      /department/i,
      /ministry/i,
      /treasury/i,
      /revenue/i,
      /sars/i
    ]

    suspiciousPatterns.forEach(pattern => {
      if (pattern.test(companyName)) {
        alerts.push(`Company name contains suspicious keyword: ${pattern.source}`)
        riskLevel = 'high'
      }
    })

    // Check registration number format
    if (registrationNumber && !/^\d{4}\/\d{6}\/\d{2}$/.test(registrationNumber)) {
      alerts.push('Registration number format is invalid')
      riskLevel = riskLevel === 'high' ? 'high' : 'medium'
    }

    return {
      isFlagged: alerts.length > 0,
      riskLevel,
      alerts,
      lastChecked: new Date().toISOString()
    }
  }

  private mapCipcStatus(status: string): 'active' | 'deregistered' | 'suspended' | 'unknown' {
    switch (status?.toLowerCase()) {
      case 'in business':
      case 'active': return 'active'
      case 'deregistered':
      case 'dissolved': return 'deregistered'
      case 'suspended': return 'suspended'
      default: return 'unknown'
    }
  }

  private calculateCompanyRiskScore(company: any): number {
    let score = 10 // Start with low risk

    // Increase risk based on various factors
    if (company.status !== 'In Business') score += 30
    if (!company.directors || company.directors.length === 0) score += 20
    if (!company.businessAddress) score += 15
    
    const registrationDate = new Date(company.registrationDate)
    const daysSinceRegistration = (Date.now() - registrationDate.getTime()) / (1000 * 60 * 60 * 24)
    
    if (daysSinceRegistration < 90) score += 25 // Very new company
    else if (daysSinceRegistration < 365) score += 10 // Less than a year old

    return Math.min(score, 100) // Cap at 100
  }
}

export const cipcService = new CipcService()