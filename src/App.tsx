import { useState, useEffect } from 'react'
import { FraudShieldChat } from './components/FraudShieldChat'
import { CompanySetup } from './components/CompanySetup'
import { AdminDashboard } from './components/AdminDashboard'
import { ApiSettings } from './components/ApiSettings'
import { Button } from './components/ui/button'
import { Settings, BarChart3, MessageSquare, LogOut } from 'lucide-react'
import { createClient } from '@blinkdotnew/sdk'

const blink = createClient({
  projectId: 'fraudshield-fraud-verification-bot-o5eoynan',
  authRequired: true
})

function App() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [hasCompanyProfile, setHasCompanyProfile] = useState(false)
  const [currentView, setCurrentView] = useState<'chat' | 'setup' | 'dashboard' | 'settings'>('chat')

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged(async (state) => {
      setUser(state.user)
      setLoading(state.isLoading)
      
      if (state.user) {
        // Check if user has company profile
        try {
          const companies = await blink.db.companies.list({
            where: { user_id: state.user.id },
            limit: 1
          })
          
          if (companies.length > 0) {
            setHasCompanyProfile(true)
            setCurrentView('chat')
          } else {
            setHasCompanyProfile(false)
            setCurrentView('setup')
          }
        } catch (error) {
          console.error('Error checking company profile:', error)
          setCurrentView('setup')
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
            variant={currentView === 'dashboard' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setCurrentView('dashboard')}
            className="flex items-center gap-2"
          >
            <BarChart3 className="w-4 h-4" />
            Dashboard
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
          
          <div className="text-sm text-muted-foreground mr-2">
            {user.email}
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