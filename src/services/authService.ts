import { createClient } from '@blinkdotnew/sdk'

const blink = createClient({
  projectId: 'fraudshield-fraud-verification-bot-o5eoynan',
  authRequired: true
})

export interface CompanyProfile {
  id: string
  companyName: string
  registrationNumber?: string
  contactEmail?: string
  contactPhone?: string
  bankAccountNumber?: string
  bankName?: string
  verificationStatus: 'pending' | 'verified' | 'rejected'
}

export interface UserRole {
  role: 'owner' | 'staff' | 'viewer'
  permissions: string[]
}

class AuthService {
  // Get current user
  async getCurrentUser() {
    try {
      return await blink.auth.me()
    } catch (error) {
      console.error('Auth error:', error)
      return null
    }
  }

  // Create or update company profile
  async createCompanyProfile(profileData: Omit<CompanyProfile, 'id' | 'verificationStatus'>): Promise<CompanyProfile> {
    try {
      const user = await blink.auth.me()
      const companyId = `comp_${Date.now()}`

      const company = await blink.db.companies.create({
        id: companyId,
        userId: user.id,
        companyName: profileData.companyName,
        registrationNumber: profileData.registrationNumber || '',
        contactEmail: profileData.contactEmail || '',
        contactPhone: profileData.contactPhone || '',
        bankAccountNumber: profileData.bankAccountNumber || '',
        bankName: profileData.bankName || '',
        verificationStatus: 'pending'
      })

      return {
        id: company.id,
        companyName: company.companyName,
        registrationNumber: company.registrationNumber,
        contactEmail: company.contactEmail,
        contactPhone: company.contactPhone,
        bankAccountNumber: company.bankAccountNumber,
        bankName: company.bankName,
        verificationStatus: company.verificationStatus as 'pending' | 'verified' | 'rejected'
      }
    } catch (error) {
      console.error('Company profile creation error:', error)
      throw new Error('Failed to create company profile')
    }
  }

  // Get user's company profile
  async getCompanyProfile(): Promise<CompanyProfile | null> {
    try {
      const user = await blink.auth.me()
      const companies = await blink.db.companies.list({
        where: { userId: user.id },
        limit: 1
      })

      if (companies.length === 0) return null

      const company = companies[0]
      return {
        id: company.id,
        companyName: company.companyName,
        registrationNumber: company.registrationNumber,
        contactEmail: company.contactEmail,
        contactPhone: company.contactPhone,
        bankAccountNumber: company.bankAccountNumber,
        bankName: company.bankName,
        verificationStatus: company.verificationStatus as 'pending' | 'verified' | 'rejected'
      }
    } catch (error) {
      console.error('Error fetching company profile:', error)
      return null
    }
  }

  // Update company profile
  async updateCompanyProfile(updates: Partial<CompanyProfile>): Promise<CompanyProfile> {
    try {
      const user = await blink.auth.me()
      const companies = await blink.db.companies.list({
        where: { userId: user.id },
        limit: 1
      })

      if (companies.length === 0) {
        throw new Error('No company profile found')
      }

      const company = companies[0]
      const updatedCompany = await blink.db.companies.update(company.id, {
        companyName: updates.companyName || company.companyName,
        registrationNumber: updates.registrationNumber || company.registrationNumber,
        contactEmail: updates.contactEmail || company.contactEmail,
        contactPhone: updates.contactPhone || company.contactPhone,
        bankAccountNumber: updates.bankAccountNumber || company.bankAccountNumber,
        bankName: updates.bankName || company.bankName,
        updatedAt: new Date().toISOString()
      })

      return {
        id: updatedCompany.id,
        companyName: updatedCompany.companyName,
        registrationNumber: updatedCompany.registrationNumber,
        contactEmail: updatedCompany.contactEmail,
        contactPhone: updatedCompany.contactPhone,
        bankAccountNumber: updatedCompany.bankAccountNumber,
        bankName: updatedCompany.bankName,
        verificationStatus: updatedCompany.verificationStatus as 'pending' | 'verified' | 'rejected'
      }
    } catch (error) {
      console.error('Company profile update error:', error)
      throw new Error('Failed to update company profile')
    }
  }

  // Check user permissions (role-based access)
  getUserRole(): UserRole {
    // In a full implementation, this would check against a roles table
    // For now, we'll assume all authenticated users are owners
    return {
      role: 'owner',
      permissions: [
        'verify_payments',
        'check_documents',
        'generate_pins',
        'view_logs',
        'manage_company',
        'view_analytics'
      ]
    }
  }

  // Check if user has specific permission
  hasPermission(permission: string): boolean {
    const userRole = this.getUserRole()
    return userRole.permissions.includes(permission)
  }

  // Verify company business registration (mock implementation)
  async verifyBusinessRegistration(registrationNumber: string): Promise<{
    isValid: boolean
    companyName?: string
    status?: string
    message: string
  }> {
    try {
      // In production, this would integrate with CIPC API
      // Mock verification for demo
      const isValid = registrationNumber.length >= 10 && /^\d+\/\d+$/.test(registrationNumber)
      
      if (isValid) {
        return {
          isValid: true,
          companyName: 'Verified Company Name',
          status: 'active',
          message: 'Business registration verified successfully'
        }
      } else {
        return {
          isValid: false,
          message: 'Invalid registration number format. Please use format: YYYY/NNNNNN/NN'
        }
      }
    } catch (error) {
      console.error('Business verification error:', error)
      return {
        isValid: false,
        message: 'Unable to verify business registration at this time'
      }
    }
  }

  // Get verification statistics for dashboard
  async getVerificationStats(): Promise<{
    totalVerifications: number
    successfulVerifications: number
    suspiciousActivities: number
    activePins: number
  }> {
    try {
      const user = await blink.auth.me()
      
      const allVerifications = await blink.db.verificationHistory.list({
        where: { userId: user.id }
      })

      const activePins = await blink.db.driverPins.list({
        where: { 
          userId: user.id,
          status: 'active'
        }
      })

      const successfulVerifications = allVerifications.filter(v => v.verificationResult === 'verified').length
      const suspiciousActivities = allVerifications.filter(v => v.verificationResult === 'suspicious').length

      return {
        totalVerifications: allVerifications.length,
        successfulVerifications,
        suspiciousActivities,
        activePins: activePins.length
      }
    } catch (error) {
      console.error('Stats error:', error)
      return {
        totalVerifications: 0,
        successfulVerifications: 0,
        suspiciousActivities: 0,
        activePins: 0
      }
    }
  }
}

export const authService = new AuthService()