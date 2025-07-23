import { useState, useEffect } from 'react'
import { FraudShieldChat } from './components/FraudShieldChat'
import { CompanySetup } from './components/CompanySetup'
import { createClient } from '@blinkdotnew/sdk'
import { authService } from './services/authService'
import './App.css'

const blink = createClient({
  projectId: 'fraudshield-fraud-verification-bot-o5eoynan',
  authRequired: true
})

function App() {
  const [user, setUser] = useState<any>(null)
  const [companyProfile, setCompanyProfile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged(async (state) => {
      setUser(state.user)
      
      if (state.user) {
        try {
          const profile = await authService.getCompanyProfile()
          setCompanyProfile(profile)
        } catch (error) {
          console.error('Error loading company profile:', error)
        }
      }
      
      setIsLoading(false)
    })
    
    return unsubscribe
  }, [])

  const handleCompanySetupComplete = async () => {
    try {
      const profile = await authService.getCompanyProfile()
      setCompanyProfile(profile)
    } catch (error) {
      console.error('Error loading company profile after setup:', error)
    }
  }

  if (isLoading) {
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Authenticating...</p>
        </div>
      </div>
    )
  }

  if (!companyProfile) {
    return <CompanySetup onComplete={handleCompanySetupComplete} />
  }

  return <FraudShieldChat />
}

export default App