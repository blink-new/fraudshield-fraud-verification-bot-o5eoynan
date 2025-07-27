import { useState, useEffect } from 'react'
import { FraudShieldChat } from './components/FraudShieldChat'
import { CompanySetup } from './components/CompanySetup'
import { AdminDashboard } from './components/AdminDashboard'
import { ApiSettings } from './components/ApiSettings'
import { ScamWall } from './components/ScamWall'
import { ScamChecker } from './components/ScamChecker'
import { BusinessDirectory } from './components/BusinessDirectory'
import FlexibleOnboarding from './components/FlexibleOnboarding'
import UserProfile from './components/UserProfile'
import { Button } from './components/ui/button'
import { Badge } from './components/ui/badge'
import { Settings, BarChart3, MessageSquare, LogOut, Shield, Search, Building, User, Star } from 'lucide-react'
import { createClient } from '@blinkdotnew/sdk'

const blink = createClient({
  projectId: 'fraudshield-fraud-verification-bot-o5eoynan',
  authRequired: true
})

function App() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [hasCompanyProfile, setHasCompanyProfile] = useState(false)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [needsOnboarding, setNeedsOnboarding] = useState(false)
  const [currentView, setCurrentView] = useState<'chat' | 'setup' | 'onboarding' | 'profile' | 'dashboard' | 'settings' | 'scam-wall' | 'scam-checker' | 'directory'>('chat')

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged(async (state) => {
      setUser(state.user)
      setLoading(state.isLoading)
      
      if (state.user) {
        // Check if user has company profile
        try {
          const companies = await blink.db.companies.list({
            where: { userId: state.user.id },
            limit: 1
          })
          
          if (companies.length > 0) {
            const profile = companies[0]
            setUserProfile(profile)
            setHasCompanyProfile(true)
            
            // Check if user needs onboarding (new tiered system)
            if (!profile.userType || profile.verificationLevel === 'unverified') {
              setNeedsOnboarding(true)
              setCurrentView('onboarding')
            } else {
              setNeedsOnboarding(false)
              setCurrentView('chat')
            }
          } else {
            setHasCompanyProfile(false)
            setNeedsOnboarding(true)
            setCurrentView('onboarding')
          }
        } catch (error) {
          console.error('Error checking company profile:', error)
          setNeedsOnboarding(true)
          setCurrentView('onboarding')
        }
      }
    })
    
    return unsubscribe
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading FraudShield...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">🛡️ FraudShield</h1>
          <p className="text-muted-foreground mb-4">Please sign in to continue</p>
          <button 
            onClick={() => blink.auth.login()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Sign In
          </button>
        </div>
      </div>
    )
  }

  if (currentView === 'onboarding') {
    return (
      <FlexibleOnboarding 
        onComplete={(profile) => {
          setUserProfile(profile)
          setHasCompanyProfile(true)
          setNeedsOnboarding(false)
          setCurrentView('chat')
        }}
      />
    )
  }

  if (currentView === 'setup') {
    return (
      <CompanySetup 
        onComplete={() => {
          setHasCompanyProfile(true)
          setCurrentView('chat')
        }}
      />
    )
  }

  const renderCurrentView = () => {
    switch (currentView) {
      case 'scam-wall':
        return <ScamWall />
      case 'scam-checker':
        return <ScamChecker />
      case 'directory':
        return <BusinessDirectory />
      case 'profile':
        return <UserProfile userId={user.id} isOwnProfile={true} />
      case 'dashboard':
        return <AdminDashboard />
      case 'settings':
        return <ApiSettings />
      default:
        return <FraudShieldChat />
    }
  }

  const getViewTitle = () => {
    switch (currentView) {
      case 'scam-wall':
        return 'Community Scam Wall'
      case 'scam-checker':
        return 'Scam Checker Tool'
      case 'directory':
        return 'Business Directory'
      case 'profile':
        return 'My Profile'
      case 'dashboard':
        return 'Admin Dashboard'
      case 'settings':
        return 'API & Settings'
      default:
        return 'FraudShield Chat'
    }
  }

  return (
    <div className="h-screen flex flex-col">
      <nav className="border-b bg-card p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">🛡️</span>
          </div>
          <h1 className="font-semibold">{getViewTitle()}</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant={currentView === 'chat' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setCurrentView('chat')}
            className="flex items-center gap-2"
          >
            <MessageSquare className="w-4 h-4" />
            Chat
          </Button>
          
          <Button
            variant={currentView === 'scam-wall' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setCurrentView('scam-wall')}
            className="flex items-center gap-2"
          >
            <Shield className="w-4 h-4" />
            Scam Wall
          </Button>
          
          <Button
            variant={currentView === 'scam-checker' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setCurrentView('scam-checker')}
            className="flex items-center gap-2"
          >
            <Search className="w-4 h-4" />
            Checker
          </Button>
          
          <Button
            variant={currentView === 'directory' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setCurrentView('directory')}
            className="flex items-center gap-2"
          >
            <Building className="w-4 h-4" />
            Directory
          </Button>
          
          <Button
            variant={currentView === 'dashboard' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setCurrentView('dashboard')}
            className="flex items-center gap-2"
          >
            <BarChart3 className="w-4 h-4" />
            Dashboard
          </Button>
          
          <Button
            variant={currentView === 'profile' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setCurrentView('profile')}
            className="flex items-center gap-2"
          >
            <User className="w-4 h-4" />
            Profile
          </Button>
          
          <Button
            variant={currentView === 'settings' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setCurrentView('settings')}
            className="flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            Settings
          </Button>
          
          <div className="h-6 w-px bg-border mx-2" />
          
          <div className="flex items-center gap-3">
            {userProfile && (
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-500" />
                <span className="text-sm font-medium">{userProfile.trustLevel || 0}/100</span>
                <Badge variant="secondary" className="text-xs">
                  {userProfile.userType?.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || 'User'}
                </Badge>
              </div>
            )}
            <div className="text-sm text-muted-foreground">
              {user.email}
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => blink.auth.logout()}
            className="flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>
      </nav>
      
      <div className="flex-1 overflow-hidden">
        {renderCurrentView()}
      </div>
    </div>
  )
}

export default App