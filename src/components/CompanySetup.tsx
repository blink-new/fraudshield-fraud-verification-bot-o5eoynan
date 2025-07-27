import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { authService } from '../services/authService'
import { Building2, Shield, CheckCircle, AlertCircle } from 'lucide-react'

interface CompanySetupProps {
  onComplete: () => void
}

export function CompanySetup({ onComplete }: CompanySetupProps) {
  const [formData, setFormData] = useState({
    companyName: '',
    registrationNumber: '',
    contactEmail: '',
    contactPhone: '',
    bankAccountNumber: '',
    bankName: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [verificationResult, setVerificationResult] = useState<any>(null)
  const [error, setError] = useState('')

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError('')
  }

  const handleVerifyRegistration = async () => {
    if (!formData.registrationNumber) {
      setError('Please enter a registration number')
      return
    }

    setIsLoading(true)
    try {
      const result = await authService.verifyBusinessRegistration(formData.registrationNumber)
      setVerificationResult(result)
      
      if (result.isValid && result.companyName) {
        setFormData(prev => ({ ...prev, companyName: result.companyName }))
      }
    } catch (error) {
      setError('Failed to verify registration number')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.companyName || !formData.contactEmail) {
      setError('Please fill in all required fields')
      return
    }

    setIsLoading(true)
    try {
      await authService.createCompanyProfile({
        companyName: formData.companyName,
        registrationNumber: formData.registrationNumber,
        contactEmail: formData.contactEmail,
        contactPhone: formData.contactPhone,
        bankAccountNumber: formData.bankAccountNumber,
        bankName: formData.bankName
      })
      
      onComplete()
    } catch (error) {
      setError('Failed to create company profile. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">Welcome to FraudShield</CardTitle>
          <CardDescription>
            Set up your company profile to start using our fraud verification services
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Company Registration */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                <Label className="text-base font-semibold">Company Information</Label>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="registrationNumber">Registration Number</Label>
                  <div className="flex gap-2">
                    <Input
                      id="registrationNumber"
                      placeholder="e.g., 2023/123456/07"
                      value={formData.registrationNumber}
                      onChange={(e) => handleInputChange('registrationNumber', e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleVerifyRegistration}
                      disabled={isLoading || !formData.registrationNumber}
                    >
                      Verify
                    </Button>
                  </div>
                  {verificationResult && (
                    <div className="flex items-center gap-2 text-sm">
                      {verificationResult.isValid ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-green-700">{verificationResult.message}</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-4 h-4 text-red-500" />
                          <span className="text-red-700">{verificationResult.message}</span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name *</Label>
                  <Input
                    id="companyName"
                    placeholder="Your Company Name"
                    value={formData.companyName}
                    onChange={(e) => handleInputChange('companyName', e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Contact Information</Label>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Contact Email *</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    placeholder="contact@company.com"
                    value={formData.contactEmail}
                    onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactPhone">Contact Phone</Label>
                  <Input
                    id="contactPhone"
                    placeholder="+27 11 123 4567"
                    value={formData.contactPhone}
                    onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Banking Information */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Banking Information (Optional)</Label>
              <p className="text-sm text-muted-foreground">
                This information helps us verify payments more accurately
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bankName">Bank Name</Label>
                  <Input
                    id="bankName"
                    placeholder="e.g., FNB, Standard Bank"
                    value={formData.bankName}
                    onChange={(e) => handleInputChange('bankName', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bankAccountNumber">Account Number</Label>
                  <Input
                    id="bankAccountNumber"
                    placeholder="Account number"
                    value={formData.bankAccountNumber}
                    onChange={(e) => handleInputChange('bankAccountNumber', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-md">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            {/* Security Features */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">🔒 Security & Privacy</h3>
              <div className="space-y-2 text-sm text-blue-800">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    End-to-end encryption
                  </Badge>
                  <span>All sensitive data is encrypted</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    POPIA compliant
                  </Badge>
                  <span>Full compliance with South African privacy laws</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    Role-based access
                  </Badge>
                  <span>Control who can access what information</span>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Setting up...' : 'Complete Setup'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}