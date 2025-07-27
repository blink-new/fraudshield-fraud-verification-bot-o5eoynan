import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Alert, AlertDescription } from './ui/alert'
import { Upload, CheckCircle, AlertCircle, Star, Users, Shield, Trophy } from 'lucide-react'
import { onboardingService, USER_TIERS, ENDORSEMENT_TYPES, type VerificationStep, type UserEndorsement } from '../services/onboardingService'

interface FlexibleOnboardingProps {
  onComplete: (userProfile: any) => void
}

export function FlexibleOnboarding({ onComplete }: FlexibleOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedTier, setSelectedTier] = useState<string>('student_hustler')
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    businessName: '',
    socialMediaLinks: {
      instagram: '',
      facebook: '',
      twitter: '',
      linkedin: '',
      whatsapp: ''
    },
    proofOfTrade: null as File | null
  })
  const [loading, setLoading] = useState(false)
  const [verificationSteps, setVerificationSteps] = useState<VerificationStep[]>([])
  const [userProfile, setUserProfile] = useState<any>(null)

  const steps = [
    'Choose Your Tier',
    'Basic Information',
    'Verification Steps',
    'Complete Setup'
  ]

  const handleTierSelect = (tierType: string) => {
    setSelectedTier(tierType)
  }

  const handleInputChange = (field: string, value: string) => {
    if (field.startsWith('social.')) {
      const socialField = field.split('.')[1]
      setFormData(prev => ({
        ...prev,
        socialMediaLinks: {
          ...prev.socialMediaLinks,
          [socialField]: value
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }))
    }
  }

  const handleFileUpload = (file: File) => {
    setFormData(prev => ({
      ...prev,
      proofOfTrade: file
    }))
  }

  const handleCreateProfile = async () => {
    setLoading(true)
    try {
      const profile = await onboardingService.createUserProfile({
        email: formData.email,
        phone: formData.phone,
        businessName: formData.businessName,
        userType: selectedTier as any,
        socialMediaLinks: formData.socialMediaLinks
      })

      setUserProfile(profile)
      const steps = await onboardingService.getVerificationProgress(profile.id)
      setVerificationSteps(steps)
      setCurrentStep(2)
    } catch (error) {
      console.error('Error creating profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCompleteVerificationStep = async (stepName: string, data?: any) => {
    if (!userProfile) return

    try {
      await onboardingService.completeVerificationStep(userProfile.id, stepName, data)
      const updatedSteps = await onboardingService.getVerificationProgress(userProfile.id)
      setVerificationSteps(updatedSteps)
    } catch (error) {
      console.error('Error completing verification step:', error)
    }
  }

  const handleFinishOnboarding = () => {
    onComplete(userProfile)
  }

  const getCompletionPercentage = () => {
    if (verificationSteps.length === 0) return 0
    const completed = verificationSteps.filter(step => step.completed).length
    return Math.round((completed / verificationSteps.length) * 100)
  }

  const renderTierSelection = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Choose Your Business Tier</h2>
        <p className="text-gray-600">Select the option that best describes your business</p>
      </div>

      <div className="grid gap-4">
        {Object.entries(USER_TIERS).map(([key, tier]) => (
          <Card 
            key={key}
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedTier === key ? 'ring-2 ring-blue-500 bg-blue-50' : ''
            }`}
            onClick={() => handleTierSelect(key)}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{tier.label}</CardTitle>
                {selectedTier === key && <CheckCircle className="h-5 w-5 text-blue-500" />}
              </div>
              <CardDescription>{tier.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-sm mb-2">Requirements:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {tier.requirements.map((req, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-sm mb-2">Benefits:</h4>
                  <div className="flex flex-wrap gap-1">
                    {tier.benefits.map((benefit, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {benefit}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Button 
        onClick={() => setCurrentStep(1)} 
        className="w-full"
        disabled={!selectedTier}
      >
        Continue with {USER_TIERS[selectedTier]?.label}
      </Button>
    </div>
  )

  const renderBasicInformation = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Basic Information</h2>
        <p className="text-gray-600">Tell us about yourself and your business</p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="email">Email Address *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            placeholder="your@email.com"
            required
          />
        </div>

        <div>
          <Label htmlFor="phone">Phone Number *</Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            placeholder="+27 XX XXX XXXX"
            required
          />
        </div>

        <div>
          <Label htmlFor="businessName">Business Name</Label>
          <Input
            id="businessName"
            value={formData.businessName}
            onChange={(e) => handleInputChange('businessName', e.target.value)}
            placeholder="Your business name (optional)"
          />
        </div>

        {(selectedTier === 'informal_seller' || selectedTier === 'registered_business') && (
          <div className="space-y-4">
            <h3 className="font-medium">Social Media Links (Optional)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="instagram">Instagram</Label>
                <Input
                  id="instagram"
                  value={formData.socialMediaLinks.instagram}
                  onChange={(e) => handleInputChange('social.instagram', e.target.value)}
                  placeholder="@yourbusiness"
                />
              </div>
              <div>
                <Label htmlFor="facebook">Facebook</Label>
                <Input
                  id="facebook"
                  value={formData.socialMediaLinks.facebook}
                  onChange={(e) => handleInputChange('social.facebook', e.target.value)}
                  placeholder="facebook.com/yourbusiness"
                />
              </div>
              <div>
                <Label htmlFor="whatsapp">WhatsApp Business</Label>
                <Input
                  id="whatsapp"
                  value={formData.socialMediaLinks.whatsapp}
                  onChange={(e) => handleInputChange('social.whatsapp', e.target.value)}
                  placeholder="+27 XX XXX XXXX"
                />
              </div>
              <div>
                <Label htmlFor="linkedin">LinkedIn</Label>
                <Input
                  id="linkedin"
                  value={formData.socialMediaLinks.linkedin}
                  onChange={(e) => handleInputChange('social.linkedin', e.target.value)}
                  placeholder="linkedin.com/in/yourprofile"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={() => setCurrentStep(0)}>
          Back
        </Button>
        <Button 
          onClick={handleCreateProfile}
          disabled={!formData.email || !formData.phone || loading}
          className="flex-1"
        >
          {loading ? 'Creating Profile...' : 'Create Profile'}
        </Button>
      </div>
    </div>
  )

  const renderVerificationSteps = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Verification Progress</h2>
        <p className="text-gray-600">Complete these steps to increase your trust score</p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Completion Progress</span>
          <span className="text-sm text-gray-600">{getCompletionPercentage()}%</span>
        </div>
        <Progress value={getCompletionPercentage()} className="w-full" />
      </div>

      <div className="space-y-3">
        {verificationSteps.map((step) => (
          <Card key={step.id} className={step.completed ? 'bg-green-50 border-green-200' : ''}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {step.completed ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-gray-400" />
                  )}
                  <div>
                    <h4 className="font-medium">{step.description}</h4>
                    {step.required && (
                      <Badge variant="secondary" className="text-xs mt-1">Required</Badge>
                    )}
                  </div>
                </div>
                {!step.completed && (
                  <Button
                    size="sm"
                    onClick={() => handleCompleteVerificationStep(step.name)}
                  >
                    Complete
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>Verification Benefits:</strong> Each completed step increases your trust score and unlocks new features like directory listing, verification badges, and community endorsements.
        </AlertDescription>
      </Alert>

      <div className="flex gap-3">
        <Button variant="outline" onClick={() => setCurrentStep(1)}>
          Back
        </Button>
        <Button onClick={() => setCurrentStep(3)} className="flex-1">
          Continue
        </Button>
      </div>
    </div>
  )

  const renderCompleteSetup = () => (
    <div className="space-y-6 text-center">
      <div className="space-y-4">
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
          <Trophy className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold">Welcome to FraudShield!</h2>
        <p className="text-gray-600">Your profile has been created successfully</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Profile Type:</span>
              <Badge variant="secondary">{USER_TIERS[selectedTier]?.label}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Verification Progress:</span>
              <span className="font-medium">{getCompletionPercentage()}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Trust Level:</span>
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-500" />
                <span>{userProfile?.trustLevel || 0}/100</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h3 className="font-medium">What's Next?</h3>
        <div className="text-sm text-gray-600 space-y-2">
          <p>• Complete remaining verification steps to boost your trust score</p>
          <p>• Start using fraud verification tools</p>
          <p>• Join the community and get endorsements</p>
          <p>• List your business in the directory</p>
        </div>
      </div>

      <Button onClick={handleFinishOnboarding} className="w-full">
        Start Using FraudShield
      </Button>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  index <= currentStep ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {index + 1}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-12 h-0.5 mx-2 ${
                    index < currentStep ? 'bg-blue-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-gray-600">
            Step {currentStep + 1} of {steps.length}: {steps[currentStep]}
          </p>
        </div>

        <Card>
          <CardContent className="p-6">
            {currentStep === 0 && renderTierSelection()}
            {currentStep === 1 && renderBasicInformation()}
            {currentStep === 2 && renderVerificationSteps()}
            {currentStep === 3 && renderCompleteSetup()}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default FlexibleOnboarding