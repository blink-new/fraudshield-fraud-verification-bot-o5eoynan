import { createClient } from '@blinkdotnew/sdk'

const blink = createClient({
  projectId: 'fraudshield-fraud-verification-bot-o5eoynan',
  authRequired: true
})

export interface ScamReport {
  id: string
  userId: string
  title: string
  description: string
  scamType: 'fake_pop' | 'ghost_business' | 'whatsapp_scam' | 'fake_document' | 'other'
  category: 'payment' | 'document' | 'business' | 'communication'
  location?: string
  riskLevel: number // 1-5
  phoneNumber?: string
  email?: string
  domain?: string
  companyName?: string
  amountLost?: number
  evidenceUrls: string[]
  upvotes: number
  verifications: number
  status: 'active' | 'resolved' | 'disputed'
  createdAt: string
  updatedAt: string
}

export interface TrustScore {
  id: string
  entityId: string
  entityType: 'phone' | 'email' | 'domain' | 'company'
  trustScore: number // 0-100
  verificationCount: number
  reportCount: number
  successfulTransactions: number
  badgeStatus: 'verified' | 'under_watch' | 'flagged' | 'unverified'
  lastUpdated: string
}

export interface BusinessListing {
  id: string
  userId: string
  businessName: string
  description?: string
  category: string
  subcategory?: string
  location?: string
  contactPhone?: string
  contactEmail?: string
  website?: string
  services: string[]
  verificationStatus: 'verified' | 'pending' | 'rejected'
  verifiedByOrg?: string
  trustScore: number
  reviewCount: number
  averageRating: number
  isStudentBusiness: boolean
  isSme: boolean
  createdAt: string
  updatedAt: string
}

export interface UserGamification {
  id: string
  userId: string
  points: number
  level: number
  badges: string[]
  scamReportsSubmitted: number
  verificationsMade: number
  businessesVerified: number
  fraudCatches: number
}

class CommunityService {
  // Scam Wall Functions
  async submitScamReport(report: Omit<ScamReport, 'id' | 'userId' | 'upvotes' | 'verifications' | 'createdAt' | 'updatedAt'>): Promise<ScamReport> {
    const user = await blink.auth.me()
    const id = `scam_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const newReport: ScamReport = {
      id,
      userId: user.id,
      ...report,
      upvotes: 0,
      verifications: 0,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    await blink.db.scamReports.create({
      id: newReport.id,
      userId: newReport.userId,
      title: newReport.title,
      description: newReport.description,
      scamType: newReport.scamType,
      category: newReport.category,
      location: newReport.location,
      riskLevel: newReport.riskLevel,
      phoneNumber: newReport.phoneNumber,
      email: newReport.email,
      domain: newReport.domain,
      companyName: newReport.companyName,
      amountLost: newReport.amountLost,
      evidenceUrls: JSON.stringify(newReport.evidenceUrls),
      upvotes: newReport.upvotes,
      verifications: newReport.verifications,
      status: newReport.status,
      createdAt: newReport.createdAt,
      updatedAt: newReport.updatedAt
    })

    // Update user gamification
    await this.updateUserGamification(user.id, { scamReportsSubmitted: 1 })
    
    // Update trust scores for mentioned entities
    await this.updateTrustScoresFromReport(newReport)

    return newReport
  }

  async getScamReports(filters?: {
    category?: string
    location?: string
    scamType?: string
    riskLevel?: number
    limit?: number
  }): Promise<ScamReport[]> {
    const whereClause: any = { status: 'active' }
    
    if (filters?.category) whereClause.category = filters.category
    if (filters?.location) whereClause.location = filters.location
    if (filters?.scamType) whereClause.scamType = filters.scamType
    if (filters?.riskLevel) whereClause.riskLevel = filters.riskLevel

    const reports = await blink.db.scamReports.list({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      limit: filters?.limit || 50
    })

    return reports.map(report => ({
      ...report,
      evidenceUrls: JSON.parse(report.evidenceUrls || '[]')
    }))
  }

  async verifyScamReport(reportId: string, verificationType: 'upvote' | 'happened_to_me' | 'dispute', comment?: string): Promise<void> {
    const user = await blink.auth.me()
    const verificationId = `verify_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    await blink.db.scamVerifications.create({
      id: verificationId,
      scamReportId: reportId,
      userId: user.id,
      verificationType,
      comment,
      createdAt: new Date().toISOString()
    })

    // Update report counts
    const report = await blink.db.scamReports.list({ where: { id: reportId }, limit: 1 })
    if (report.length > 0) {
      const currentReport = report[0]
      const updates: any = {}
      
      if (verificationType === 'upvote') {
        updates.upvotes = (currentReport.upvotes || 0) + 1
      } else if (verificationType === 'happened_to_me') {
        updates.verifications = (currentReport.verifications || 0) + 1
      }

      if (Object.keys(updates).length > 0) {
        await blink.db.scamReports.update(reportId, updates)
      }
    }

    // Update user gamification
    await this.updateUserGamification(user.id, { verificationsMade: 1 })
  }

  // Scam Checker Tool
  async checkEntity(entityId: string, entityType: 'phone' | 'email' | 'domain' | 'company'): Promise<{
    trustScore: TrustScore | null
    reports: ScamReport[]
    riskAssessment: {
      riskLevel: number
      riskFactors: string[]
      recommendations: string[]
    }
  }> {
    // Get trust score
    const trustScores = await blink.db.trustScores.list({
      where: { entityId, entityType },
      limit: 1
    })
    const trustScore = trustScores.length > 0 ? trustScores[0] : null

    // Get related scam reports
    const whereClause: any = { status: 'active' }
    if (entityType === 'phone') whereClause.phoneNumber = entityId
    else if (entityType === 'email') whereClause.email = entityId
    else if (entityType === 'domain') whereClause.domain = entityId
    else if (entityType === 'company') whereClause.companyName = entityId

    const reports = await blink.db.scamReports.list({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      limit: 10
    })

    // Calculate risk assessment
    const riskAssessment = this.calculateRiskAssessment(entityId, entityType, trustScore, reports)

    return {
      trustScore,
      reports: reports.map(report => ({
        ...report,
        evidenceUrls: JSON.parse(report.evidenceUrls || '[]')
      })),
      riskAssessment
    }
  }

  private calculateRiskAssessment(entityId: string, entityType: string, trustScore: TrustScore | null, reports: any[]): {
    riskLevel: number
    riskFactors: string[]
    recommendations: string[]
  } {
    const riskFactors: string[] = []
    const recommendations: string[] = []
    let riskLevel = 1

    // Check trust score
    if (!trustScore || trustScore.trustScore < 30) {
      riskLevel = Math.max(riskLevel, 4)
      riskFactors.push('Low or no trust score')
      recommendations.push('Proceed with extreme caution')
    } else if (trustScore.trustScore < 50) {
      riskLevel = Math.max(riskLevel, 3)
      riskFactors.push('Below average trust score')
      recommendations.push('Verify through additional channels')
    }

    // Check scam reports
    if (reports.length > 0) {
      riskLevel = Math.max(riskLevel, 4)
      riskFactors.push(`${reports.length} scam report(s) found`)
      recommendations.push('Multiple fraud reports - avoid transaction')
    }

    // Domain-specific checks
    if (entityType === 'domain') {
      if (this.checkTyposquatting(entityId)) {
        riskLevel = 5
        riskFactors.push('Potential typosquatting domain')
        recommendations.push('Verify official domain spelling')
      }
    }

    // Phone number checks
    if (entityType === 'phone') {
      if (!this.isValidSAPhoneNumber(entityId)) {
        riskLevel = Math.max(riskLevel, 3)
        riskFactors.push('Invalid or suspicious phone number format')
        recommendations.push('Verify phone number with official sources')
      }
    }

    if (riskLevel === 1 && trustScore && trustScore.trustScore > 70) {
      recommendations.push('Entity appears trustworthy based on community data')
    }

    return { riskLevel, riskFactors, recommendations }
  }

  private checkTyposquatting(domain: string): boolean {
    const commonTargets = [
      'gov.za', 'co.za', 'org.za', 'ac.za',
      'fnb.co.za', 'standardbank.co.za', 'absa.co.za',
      'capitecbank.co.za', 'nedbank.co.za'
    ]

    return commonTargets.some(target => {
      const similarity = this.calculateStringSimilarity(domain, target)
      return similarity > 0.7 && similarity < 1.0
    })
  }

  private calculateStringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2
    const shorter = str1.length > str2.length ? str2 : str1
    
    if (longer.length === 0) return 1.0
    
    const editDistance = this.levenshteinDistance(longer, shorter)
    return (longer.length - editDistance) / longer.length
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = []
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i]
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          )
        }
      }
    }
    
    return matrix[str2.length][str1.length]
  }

  private isValidSAPhoneNumber(phone: string): boolean {
    // South African phone number patterns
    const patterns = [
      /^(\+27|0)[1-9][0-9]{8}$/, // Standard landline/mobile
      /^(\+27|0)[6-8][0-9]{8}$/, // Mobile specific
    ]
    
    return patterns.some(pattern => pattern.test(phone.replace(/\s/g, '')))
  }

  // Business Directory Functions
  async addBusinessListing(business: Omit<BusinessListing, 'id' | 'userId' | 'trustScore' | 'reviewCount' | 'averageRating' | 'createdAt' | 'updatedAt'>): Promise<BusinessListing> {
    const user = await blink.auth.me()
    const id = `business_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const newBusiness: BusinessListing = {
      id,
      userId: user.id,
      ...business,
      trustScore: 50,
      reviewCount: 0,
      averageRating: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    await blink.db.businessDirectory.create({
      id: newBusiness.id,
      userId: newBusiness.userId,
      businessName: newBusiness.businessName,
      description: newBusiness.description,
      category: newBusiness.category,
      subcategory: newBusiness.subcategory,
      location: newBusiness.location,
      contactPhone: newBusiness.contactPhone,
      contactEmail: newBusiness.contactEmail,
      website: newBusiness.website,
      services: JSON.stringify(newBusiness.services),
      verificationStatus: newBusiness.verificationStatus,
      verifiedByOrg: newBusiness.verifiedByOrg,
      trustScore: newBusiness.trustScore,
      reviewCount: newBusiness.reviewCount,
      averageRating: newBusiness.averageRating,
      isStudentBusiness: newBusiness.isStudentBusiness,
      isSme: newBusiness.isSme,
      createdAt: newBusiness.createdAt,
      updatedAt: newBusiness.updatedAt
    })

    return newBusiness
  }

  async getBusinessListings(filters?: {
    category?: string
    location?: string
    verificationStatus?: string
    isStudentBusiness?: boolean
    verifiedByOrg?: string
    limit?: number
  }): Promise<BusinessListing[]> {
    const whereClause: any = {}
    
    if (filters?.category) whereClause.category = filters.category
    if (filters?.location) whereClause.location = filters.location
    if (filters?.verificationStatus) whereClause.verificationStatus = filters.verificationStatus
    if (filters?.isStudentBusiness !== undefined) whereClause.isStudentBusiness = filters.isStudentBusiness
    if (filters?.verifiedByOrg) whereClause.verifiedByOrg = filters.verifiedByOrg

    const businesses = await blink.db.businessDirectory.list({
      where: whereClause,
      orderBy: { trustScore: 'desc' },
      limit: filters?.limit || 50
    })

    return businesses.map(business => ({
      ...business,
      services: JSON.parse(business.services || '[]')
    }))
  }

  // Trust Score Management
  private async updateTrustScoresFromReport(report: ScamReport): Promise<void> {
    const entities = [
      { id: report.phoneNumber, type: 'phone' },
      { id: report.email, type: 'email' },
      { id: report.domain, type: 'domain' },
      { id: report.companyName, type: 'company' }
    ].filter(entity => entity.id)

    for (const entity of entities) {
      await this.updateTrustScore(entity.id!, entity.type as any, { reportCount: 1 })
    }
  }

  private async updateTrustScore(entityId: string, entityType: 'phone' | 'email' | 'domain' | 'company', updates: {
    verificationCount?: number
    reportCount?: number
    successfulTransactions?: number
  }): Promise<void> {
    const existing = await blink.db.trustScores.list({
      where: { entityId, entityType },
      limit: 1
    })

    if (existing.length > 0) {
      const current = existing[0]
      const newScore = this.calculateTrustScore(
        (current.verificationCount || 0) + (updates.verificationCount || 0),
        (current.reportCount || 0) + (updates.reportCount || 0),
        (current.successfulTransactions || 0) + (updates.successfulTransactions || 0)
      )

      await blink.db.trustScores.update(current.id, {
        trustScore: newScore.score,
        verificationCount: (current.verificationCount || 0) + (updates.verificationCount || 0),
        reportCount: (current.reportCount || 0) + (updates.reportCount || 0),
        successfulTransactions: (current.successfulTransactions || 0) + (updates.successfulTransactions || 0),
        badgeStatus: newScore.badge,
        lastUpdated: new Date().toISOString()
      })
    } else {
      const newScore = this.calculateTrustScore(
        updates.verificationCount || 0,
        updates.reportCount || 0,
        updates.successfulTransactions || 0
      )

      const id = `trust_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      await blink.db.trustScores.create({
        id,
        entityId,
        entityType,
        trustScore: newScore.score,
        verificationCount: updates.verificationCount || 0,
        reportCount: updates.reportCount || 0,
        successfulTransactions: updates.successfulTransactions || 0,
        badgeStatus: newScore.badge,
        lastUpdated: new Date().toISOString(),
        createdAt: new Date().toISOString()
      })
    }
  }

  private calculateTrustScore(verifications: number, reports: number, transactions: number): {
    score: number
    badge: 'verified' | 'under_watch' | 'flagged' | 'unverified'
  } {
    let score = 50 // Base score

    // Positive factors
    score += Math.min(verifications * 5, 25) // Max +25 for verifications
    score += Math.min(transactions * 2, 20) // Max +20 for successful transactions

    // Negative factors
    score -= Math.min(reports * 15, 40) // Max -40 for reports

    // Ensure score is within bounds
    score = Math.max(0, Math.min(100, score))

    // Determine badge
    let badge: 'verified' | 'under_watch' | 'flagged' | 'unverified' = 'unverified'
    
    if (reports > 2 || score < 20) {
      badge = 'flagged'
    } else if (reports > 0 || score < 40) {
      badge = 'under_watch'
    } else if (score > 70 && verifications > 2) {
      badge = 'verified'
    }

    return { score, badge }
  }

  // Gamification Functions
  private async updateUserGamification(userId: string, updates: {
    scamReportsSubmitted?: number
    verificationsMade?: number
    businessesVerified?: number
    fraudCatches?: number
  }): Promise<void> {
    const existing = await blink.db.userGamification.list({
      where: { userId },
      limit: 1
    })

    if (existing.length > 0) {
      const current = existing[0]
      const newStats = {
        scamReportsSubmitted: (current.scamReportsSubmitted || 0) + (updates.scamReportsSubmitted || 0),
        verificationsMade: (current.verificationsMade || 0) + (updates.verificationsMade || 0),
        businessesVerified: (current.businessesVerified || 0) + (updates.businessesVerified || 0),
        fraudCatches: (current.fraudCatches || 0) + (updates.fraudCatches || 0)
      }

      const { points, level, badges } = this.calculateGamificationRewards(newStats)

      await blink.db.userGamification.update(current.id, {
        points: (current.points || 0) + points,
        level,
        badges: JSON.stringify(badges),
        ...newStats,
        updatedAt: new Date().toISOString()
      })
    } else {
      const { points, level, badges } = this.calculateGamificationRewards(updates)
      const id = `gamification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      await blink.db.userGamification.create({
        id,
        userId,
        points,
        level,
        badges: JSON.stringify(badges),
        scamReportsSubmitted: updates.scamReportsSubmitted || 0,
        verificationsMade: updates.verificationsMade || 0,
        businessesVerified: updates.businessesVerified || 0,
        fraudCatches: updates.fraudCatches || 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
    }
  }

  private calculateGamificationRewards(stats: {
    scamReportsSubmitted?: number
    verificationsMade?: number
    businessesVerified?: number
    fraudCatches?: number
  }): { points: number, level: number, badges: string[] } {
    let points = 0
    const badges: string[] = []

    // Points calculation
    points += (stats.scamReportsSubmitted || 0) * 10
    points += (stats.verificationsMade || 0) * 5
    points += (stats.businessesVerified || 0) * 15
    points += (stats.fraudCatches || 0) * 20

    // Level calculation (every 100 points = 1 level)
    const level = Math.floor(points / 100) + 1

    // Badge calculation
    if ((stats.fraudCatches || 0) >= 10) badges.push('Fraud Hunter')
    if ((stats.businessesVerified || 0) >= 5) badges.push('Business Verifier')
    if ((stats.scamReportsSubmitted || 0) >= 20) badges.push('Community Guardian')
    if ((stats.verificationsMade || 0) >= 50) badges.push('Trusted Scout')

    return { points, level, badges }
  }

  async getUserGamification(userId: string): Promise<UserGamification | null> {
    const results = await blink.db.userGamification.list({
      where: { userId },
      limit: 1
    })

    if (results.length === 0) return null

    const result = results[0]
    return {
      ...result,
      badges: JSON.parse(result.badges || '[]')
    }
  }
}

export const communityService = new CommunityService()