import { createClient } from '@blinkdotnew/sdk'

const blink = createClient({
  projectId: 'fraudshield-fraud-verification-bot-o5eoynan',
  authRequired: true
})

export interface UserTier {
  type: 'student_hustler' | 'informal_seller' | 'registered_business'
  label: string
  description: string
  requirements: string[]
  benefits: string[]
  verificationSteps: string[]
}

export interface VerificationStep {
  id: string
  name: string
  description: string
  required: boolean
  completed: boolean
  data?: any
}

export interface UserEndorsement {
  id: string
  endorserId: string
  endorsedId: string
  endorserName: string
  endorsementType: 'skill' | 'trustworthy' | 'reliable' | 'quality_service' | 'good_communication'
  message?: string
  createdAt: string
}

export const USER_TIERS: Record<string, UserTier> = {
  student_hustler: {
    type: 'student_hustler',
    label: '🎓 Student Hustler',
    description: 'Perfect for students running side businesses',
    requirements: ['Email address', 'Phone number', 'Optional business name'],
    benefits: ['Community access', 'Basic fraud protection', 'Student network'],
    verificationSteps: ['email', 'phone', 'business_name']
  },
  informal_seller: {
    type: 'informal_seller',
    label: '🏪 Informal Seller/SME',
    description: 'For small businesses and informal traders',
    requirements: ['Email', 'Phone', 'Business name', 'Proof of trade (optional)'],
    benefits: ['Directory listing', 'Enhanced trust score', 'Business verification badge'],
    verificationSteps: ['email', 'phone', 'business_name', 'proof_of_trade', 'social_media']
  },
  registered_business: {
    type: 'registered_business',
    label: '🏢 Registered Business',
    description: 'Fully registered companies with official documentation',
    requirements: ['CIPC registration', 'Business domain/email', 'Official documents'],
    benefits: ['Premium verification badge', 'Priority directory placement', 'Advanced features'],
    verificationSteps: ['email', 'phone', 'business_name', 'cipc_registration', 'business_domain', 'official_documents']
  }
}

export const ENDORSEMENT_TYPES = {
  skill: { label: '🎯 Skilled', description: 'Demonstrates expertise in their field' },
  trustworthy: { label: '🛡️ Trustworthy', description: 'Reliable and honest in dealings' },
  reliable: { label: '⏰ Reliable', description: 'Delivers on time and as promised' },
  quality_service: { label: '⭐ Quality Service', description: 'Provides excellent service' },
  good_communication: { label: '💬 Great Communication', description: 'Communicates clearly and promptly' }
}

class OnboardingService {
  async createUserProfile(userData: {
    email: string
    phone: string
    businessName?: string
    userType: 'student_hustler' | 'informal_seller' | 'registered_business'
    socialMediaLinks?: Record<string, string>
  }) {
    try {
      const user = await blink.auth.me()
      
      const profile = await blink.db.companies.create({
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        user_id: user.id,
        name: userData.businessName || userData.email.split('@')[0],
        email: userData.email,
        phone: userData.phone,
        user_type: userData.userType,
        verification_level: 'unverified',
        trust_level: 0,
        social_media_links: JSON.stringify(userData.socialMediaLinks || {}),
        verification_documents: JSON.stringify([]),
        endorsements_count: 0,
        verification_nudges_count: 0,
        created_at: new Date().toISOString()
      })

      // Initialize verification steps
      await this.initializeVerificationSteps(profile.id, userData.userType)

      return profile
    } catch (error) {
      console.error('Error creating user profile:', error)
      throw error
    }
  }

  async initializeVerificationSteps(userId: string, userType: string) {
    const tier = USER_TIERS[userType]
    const steps = tier.verificationSteps

    for (const stepName of steps) {
      await blink.db.verificationProgress.create({
        id: `step_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        user_id: userId,
        step_name: stepName,
        completed: false,
        created_at: new Date().toISOString()
      })
    }
  }

  async getVerificationProgress(userId: string): Promise<VerificationStep[]> {
    try {
      const steps = await blink.db.verificationProgress.list({
        where: { user_id: userId },
        orderBy: { created_at: 'asc' }
      })

      return steps.map(step => ({
        id: step.id,
        name: step.step_name,
        description: this.getStepDescription(step.step_name),
        required: this.isStepRequired(step.step_name),
        completed: Number(step.completed) > 0,
        data: step.data ? JSON.parse(step.data) : null
      }))
    } catch (error) {
      console.error('Error getting verification progress:', error)
      return []
    }
  }

  private getStepDescription(stepName: string): string {
    const descriptions: Record<string, string> = {
      email: 'Verify your email address',
      phone: 'Verify your phone number',
      business_name: 'Add your business name',
      proof_of_trade: 'Upload proof of trade (invoices, receipts, etc.)',
      social_media: 'Link your social media accounts',
      cipc_registration: 'Provide CIPC registration number',
      business_domain: 'Verify business domain/email',
      official_documents: 'Upload official business documents'
    }
    return descriptions[stepName] || stepName
  }

  private isStepRequired(stepName: string): boolean {
    const required = ['email', 'phone']
    return required.includes(stepName)
  }

  async completeVerificationStep(userId: string, stepName: string, data?: any) {
    try {
      const steps = await blink.db.verificationProgress.list({
        where: { user_id: userId, step_name: stepName }
      })

      if (steps.length > 0) {
        await blink.db.verificationProgress.update(steps[0].id, {
          completed: true,
          completed_at: new Date().toISOString(),
          data: data ? JSON.stringify(data) : null
        })

        // Update user's verification level and trust score
        await this.updateUserVerificationLevel(userId)
      }
    } catch (error) {
      console.error('Error completing verification step:', error)
      throw error
    }
  }

  async updateUserVerificationLevel(userId: string) {
    try {
      const user = await blink.db.companies.list({
        where: { user_id: userId }
      })

      if (user.length === 0) return

      const userProfile = user[0]
      const progress = await this.getVerificationProgress(userProfile.id)
      const completedSteps = progress.filter(step => step.completed).length
      const totalSteps = progress.length

      let verificationLevel = 'unverified'
      let trustLevel = userProfile.trust_level || 0

      if (completedSteps >= totalSteps) {
        verificationLevel = 'premium'
        trustLevel = Math.min(trustLevel + 30, 100)
      } else if (completedSteps >= totalSteps * 0.7) {
        verificationLevel = 'verified'
        trustLevel = Math.min(trustLevel + 20, 100)
      } else if (completedSteps >= totalSteps * 0.4) {
        verificationLevel = 'basic'
        trustLevel = Math.min(trustLevel + 10, 100)
      }

      await blink.db.companies.update(userProfile.id, {
        verification_level: verificationLevel,
        trust_level: trustLevel
      })
    } catch (error) {
      console.error('Error updating verification level:', error)
    }
  }

  async endorseUser(endorsedUserId: string, endorsementType: string, message?: string) {
    try {
      const user = await blink.auth.me()
      
      const endorsement = await blink.db.userEndorsements.create({
        id: `endorsement_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        endorser_id: user.id,
        endorsed_id: endorsedUserId,
        endorsement_type: endorsementType,
        message: message || '',
        created_at: new Date().toISOString()
      })

      // Update endorsement count
      const endorsedUser = await blink.db.companies.list({
        where: { user_id: endorsedUserId }
      })

      if (endorsedUser.length > 0) {
        const currentCount = endorsedUser[0].endorsements_count || 0
        await blink.db.companies.update(endorsedUser[0].id, {
          endorsements_count: currentCount + 1,
          trust_level: Math.min((endorsedUser[0].trust_level || 0) + 5, 100)
        })
      }

      return endorsement
    } catch (error) {
      console.error('Error endorsing user:', error)
      throw error
    }
  }

  async getUserEndorsements(userId: string): Promise<UserEndorsement[]> {
    try {
      const endorsements = await blink.db.userEndorsements.list({
        where: { endorsed_id: userId },
        orderBy: { created_at: 'desc' }
      })

      // Get endorser details
      const endorsementsWithDetails = await Promise.all(
        endorsements.map(async (endorsement) => {
          const endorser = await blink.db.companies.list({
            where: { user_id: endorsement.endorser_id }
          })

          return {
            id: endorsement.id,
            endorserId: endorsement.endorser_id,
            endorsedId: endorsement.endorsed_id,
            endorserName: endorser.length > 0 ? endorser[0].name : 'Anonymous',
            endorsementType: endorsement.endorsement_type as any,
            message: endorsement.message,
            createdAt: endorsement.created_at
          }
        })
      )

      return endorsementsWithDetails
    } catch (error) {
      console.error('Error getting user endorsements:', error)
      return []
    }
  }

  async sendVerificationNudge(userId: string, nudgeType: string) {
    try {
      await blink.db.verificationNudges.create({
        id: `nudge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        user_id: userId,
        nudge_type: nudgeType,
        sent_at: new Date().toISOString(),
        clicked: false,
        completed: false
      })

      // Update nudge count
      const user = await blink.db.companies.list({
        where: { user_id: userId }
      })

      if (user.length > 0) {
        const currentCount = user[0].verification_nudges_count || 0
        await blink.db.companies.update(user[0].id, {
          verification_nudges_count: currentCount + 1,
          last_nudge_date: new Date().toISOString()
        })
      }
    } catch (error) {
      console.error('Error sending verification nudge:', error)
    }
  }

  async getUserTierInfo(userType: string): Promise<UserTier> {
    return USER_TIERS[userType] || USER_TIERS.student_hustler
  }

  async getVerificationBenefits(verificationLevel: string): Promise<string[]> {
    const benefits: Record<string, string[]> = {
      unverified: ['Basic community access', 'Limited fraud protection'],
      basic: ['Enhanced community features', 'Basic verification badge', 'Improved trust score'],
      verified: ['Directory listing', 'Verified badge', 'Priority support', 'Advanced features'],
      premium: ['Premium verification badge', 'Top directory placement', 'All features unlocked', 'Priority customer support']
    }

    return benefits[verificationLevel] || benefits.unverified
  }
}

export const onboardingService = new OnboardingService()