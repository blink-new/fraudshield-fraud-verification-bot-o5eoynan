import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { Textarea } from './ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Alert, AlertDescription } from './ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { 
  Star, 
  Shield, 
  CheckCircle, 
  AlertCircle, 
  Users, 
  Trophy, 
  ThumbsUp,
  MessageSquare,
  ExternalLink,
  Phone,
  Mail,
  Instagram,
  Facebook,
  Linkedin
} from 'lucide-react'
import { onboardingService, ENDORSEMENT_TYPES, type UserEndorsement, type VerificationStep } from '../services/onboardingService'

interface UserProfileProps {
  userId: string
  isOwnProfile?: boolean
  onEndorse?: () => void
}

export function UserProfile({ userId, isOwnProfile = false, onEndorse }: UserProfileProps) {
  const [userProfile, setUserProfile] = useState<any>(null)
  const [verificationSteps, setVerificationSteps] = useState<VerificationStep[]>([])
  const [endorsements, setEndorsements] = useState<UserEndorsement[]>([])
  const [loading, setLoading] = useState(true)
  const [endorseDialogOpen, setEndorseDialogOpen] = useState(false)
  const [selectedEndorsementType, setSelectedEndorsementType] = useState('')
  const [endorsementMessage, setEndorsementMessage] = useState('')
  const [showVerificationNudge, setShowVerificationNudge] = useState(false)

  const getUserProfile = async (userId: string) => {
    // This would typically fetch from your user service
    // For now, we'll simulate the data structure
    return {
      id: userId,
      name: 'Sample Business',
      email: 'business@example.com',
      phone: '+27 XX XXX XXXX',
      userType: 'informal_seller',
      verificationLevel: 'basic',
      trustLevel: 65,
      endorsementsCount: 12,
      socialMediaLinks: {
        instagram: '@samplebusiness',
        facebook: 'facebook.com/samplebusiness',
        whatsapp: '+27 XX XXX XXXX'
      },
      createdAt: new Date().toISOString()
    }
  }

  const loadUserProfile = useCallback(async () => {
    setLoading(true)
    try {
      // Load user profile, verification steps, and endorsements
      const [profile, steps, userEndorsements] = await Promise.all([
        getUserProfile(userId),
        onboardingService.getVerificationProgress(userId),
        onboardingService.getUserEndorsements(userId)
      ])

      setUserProfile(profile)
      setVerificationSteps(steps)
      setEndorsements(userEndorsements)

      // Show verification nudge for own profile if verification is low
      if (isOwnProfile && profile && profile.verificationLevel === 'unverified') {
        setShowVerificationNudge(true)
      }
    } catch (error) {
      console.error('Error loading user profile:', error)
    } finally {
      setLoading(false)
    }
  }, [userId, isOwnProfile])

  useEffect(() => {
    loadUserProfile()
  }, [userId, loadUserProfile])

  const handleEndorseUser = async () => {
    if (!selectedEndorsementType) return

    try {
      await onboardingService.endorseUser(userId, selectedEndorsementType, endorsementMessage)
      setEndorseDialogOpen(false)
      setSelectedEndorsementType('')
      setEndorsementMessage('')
      loadUserProfile() // Refresh data
      onEndorse?.()
    } catch (error) {
      console.error('Error endorsing user:', error)
    }
  }

  const handleCompleteVerificationStep = async (stepName: string) => {
    try {
      await onboardingService.completeVerificationStep(userId, stepName)
      loadUserProfile() // Refresh data
    } catch (error) {
      console.error('Error completing verification step:', error)
    }
  }

  const getVerificationBadge = (level: string) => {
    const badges = {
      unverified: { label: 'Unverified but Active', color: 'bg-gray-100 text-gray-700', icon: AlertCircle },
      basic: { label: 'Basic Verification', color: 'bg-blue-100 text-blue-700', icon: Shield },
      verified: { label: 'Verified Business', color: 'bg-green-100 text-green-700', icon: CheckCircle },
      premium: { label: 'Premium Verified', color: 'bg-purple-100 text-purple-700', icon: Trophy }
    }
    return badges[level as keyof typeof badges] || badges.unverified
  }

  const getTrustLevelColor = (level: number) => {
    if (level >= 80) return 'text-green-600'
    if (level >= 60) return 'text-yellow-600'
    if (level >= 40) return 'text-orange-600'
    return 'text-red-600'
  }

  const getSocialIcon = (platform: string) => {
    const icons = {
      instagram: Instagram,
      facebook: Facebook,
      linkedin: Linkedin,
      whatsapp: Phone
    }
    return icons[platform as keyof typeof icons] || ExternalLink
  }

  const getCompletionPercentage = () => {
    if (verificationSteps.length === 0) return 0
    const completed = verificationSteps.filter(step => step.completed).length
    return Math.round((completed / verificationSteps.length) * 100)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!userProfile) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-600">User profile not found</p>
      </div>
    )
  }

  const badge = getVerificationBadge(userProfile.verificationLevel)
  const BadgeIcon = badge.icon

  return (
    <div className="space-y-6">
      {/* Verification Nudge for Own Profile */}
      {showVerificationNudge && isOwnProfile && (
        <Alert className="border-blue-200 bg-blue-50">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <span>
                <strong>Boost your trust score!</strong> Complete verification steps to unlock more features and gain community trust.
              </span>
              <Button size="sm" onClick={() => setShowVerificationNudge(false)}>
                Got it
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Profile Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <CardTitle className="text-2xl">{userProfile.name}</CardTitle>
              <div className="flex items-center gap-2">
                <Badge className={badge.color}>
                  <BadgeIcon className="h-3 w-3 mr-1" />
                  {badge.label}
                </Badge>
                <Badge variant="outline">
                  {userProfile.userType.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                </Badge>
              </div>
            </div>
            {!isOwnProfile && (
              <Dialog open={endorseDialogOpen} onOpenChange={setEndorseDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <ThumbsUp className="h-4 w-4 mr-2" />
                    Endorse
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Endorse {userProfile.name}</DialogTitle>
                    <DialogDescription>
                      Help build trust in the community by endorsing this business
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Endorsement Type</label>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(ENDORSEMENT_TYPES).map(([key, type]) => (
                          <Button
                            key={key}
                            variant={selectedEndorsementType === key ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedEndorsementType(key)}
                            className="justify-start text-left h-auto p-3"
                          >
                            <div>
                              <div className="font-medium">{type.label}</div>
                              <div className="text-xs text-gray-600">{type.description}</div>
                            </div>
                          </Button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Message (Optional)</label>
                      <Textarea
                        value={endorsementMessage}
                        onChange={(e) => setEndorsementMessage(e.target.value)}
                        placeholder="Share your experience with this business..."
                        rows={3}
                      />
                    </div>
                    <Button 
                      onClick={handleEndorseUser}
                      disabled={!selectedEndorsementType}
                      className="w-full"
                    >
                      Submit Endorsement
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Trust Score */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-medium">Trust Score</span>
              </div>
              <div className="flex items-center gap-3">
                <Progress value={userProfile.trustLevel} className="flex-1" />
                <span className={`font-bold ${getTrustLevelColor(userProfile.trustLevel)}`}>
                  {userProfile.trustLevel}/100
                </span>
              </div>
            </div>

            {/* Endorsements */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Community Endorsements</span>
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {userProfile.endorsementsCount}
              </div>
            </div>

            {/* Verification Progress */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Verification</span>
              </div>
              <div className="flex items-center gap-3">
                <Progress value={getCompletionPercentage()} className="flex-1" />
                <span className="font-bold text-green-600">
                  {getCompletionPercentage()}%
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Details */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="endorsements">Endorsements</TabsTrigger>
          <TabsTrigger value="verification">Verification</TabsTrigger>
          <TabsTrigger value="contact">Contact</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Business Type</label>
                  <p className="font-medium">
                    {userProfile.userType.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Member Since</label>
                  <p className="font-medium">
                    {new Date(userProfile.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              {userProfile.socialMediaLinks && Object.keys(userProfile.socialMediaLinks).length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-600 mb-2 block">Social Media</label>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(userProfile.socialMediaLinks).map(([platform, link]) => {
                      if (!link) return null
                      const Icon = getSocialIcon(platform)
                      return (
                        <Button key={platform} variant="outline" size="sm" asChild>
                          <a href={link} target="_blank" rel="noopener noreferrer">
                            <Icon className="h-4 w-4 mr-2" />
                            {platform.charAt(0).toUpperCase() + platform.slice(1)}
                          </a>
                        </Button>
                      )
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="endorsements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Community Endorsements ({endorsements.length})</CardTitle>
              <CardDescription>
                What the community says about this business
              </CardDescription>
            </CardHeader>
            <CardContent>
              {endorsements.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No endorsements yet</p>
                  {!isOwnProfile && (
                    <p className="text-sm">Be the first to endorse this business!</p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {endorsements.map((endorsement) => (
                    <div key={endorsement.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">
                            {ENDORSEMENT_TYPES[endorsement.endorsementType]?.label}
                          </Badge>
                          <span className="text-sm text-gray-600">
                            by {endorsement.endorserName}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(endorsement.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {endorsement.message && (
                        <p className="text-sm text-gray-700">{endorsement.message}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="verification" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Verification Steps</CardTitle>
              <CardDescription>
                Track verification progress and trust-building activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {verificationSteps.map((step) => (
                  <div key={step.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {step.completed ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-gray-400" />
                      )}
                      <div>
                        <p className="font-medium">{step.description}</p>
                        {step.required && (
                          <Badge variant="secondary" className="text-xs mt-1">Required</Badge>
                        )}
                      </div>
                    </div>
                    {!step.completed && isOwnProfile && (
                      <Button
                        size="sm"
                        onClick={() => handleCompleteVerificationStep(step.name)}
                      >
                        Complete
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contact" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-gray-500" />
                <span>{userProfile.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-gray-500" />
                <span>{userProfile.phone}</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default UserProfile