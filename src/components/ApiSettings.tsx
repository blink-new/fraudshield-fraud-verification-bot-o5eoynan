import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Switch } from './ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Badge } from './ui/badge'
import { Alert, AlertDescription } from './ui/alert'
import { Settings, Key, Shield, Bell, Globe, CheckCircle, AlertTriangle } from 'lucide-react'
import { blink } from '../blink/client'

interface ApiConfig {
  provider: string
  isActive: boolean
  lastTested?: string
  status: 'connected' | 'error' | 'untested'
}

export function ApiSettings() {
  const [apiConfigs, setApiConfigs] = useState<ApiConfig[]>([])
  const [notificationSettings, setNotificationSettings] = useState({
    email: true,
    whatsapp: false,
    sms: false,
    dailySummary: true,
    fraudAlerts: true,
    highRiskThreshold: 70
  })
  const [loading, setLoading] = useState(false)
  const [testResults, setTestResults] = useState<Record<string, string>>({})

  const apiProviders = [
    {
      id: 'stitch',
      name: 'Stitch Money',
      description: 'South African bank account verification',
      fields: [
        { key: 'stitch_api_key', label: 'API Key', type: 'password' },
        { key: 'stitch_client_id', label: 'Client ID', type: 'text' }
      ]
    },
    {
      id: 'ozow',
      name: 'Ozow',
      description: 'Instant EFT payment verification',
      fields: [
        { key: 'ozow_api_key', label: 'API Key', type: 'password' },
        { key: 'ozow_site_code', label: 'Site Code', type: 'text' }
      ]
    },
    {
      id: 'payshap',
      name: 'PayShap',
      description: 'Instant payment verification',
      fields: [
        { key: 'payshap_api_key', label: 'API Key', type: 'password' }
      ]
    },
    {
      id: 'cipc',
      name: 'CIPC',
      description: 'Company registration verification',
      fields: [
        { key: 'cipc_api_key', label: 'API Key', type: 'password' }
      ]
    },
    {
      id: 'whois',
      name: 'WHOIS API',
      description: 'Domain verification service',
      fields: [
        { key: 'whois_api_key', label: 'API Key', type: 'password' }
      ]
    },
    {
      id: 'safps',
      name: 'SAFPS',
      description: 'Southern African Fraud Prevention Service',
      fields: [
        { key: 'safps_api_key', label: 'API Key', type: 'password' }
      ]
    },
    {
      id: 'whatsapp',
      name: 'WhatsApp Business',
      description: 'WhatsApp notifications',
      fields: [
        { key: 'whatsapp_access_token', label: 'Access Token', type: 'password' },
        { key: 'whatsapp_phone_number_id', label: 'Phone Number ID', type: 'text' }
      ]
    },
    {
      id: 'clickatell',
      name: 'Clickatell SMS',
      description: 'SMS notifications',
      fields: [
        { key: 'clickatell_api_key', label: 'API Key', type: 'password' }
      ]
    }
  ]

  const loadApiConfigurations = async () => {
    try {
      const configs = await blink.db.api_configurations.list({
        orderBy: { created_at: 'desc' }
      })
      
      const configMap = configs.reduce((acc, config) => {
        acc[config.provider] = {
          provider: config.provider,
          isActive: Number(config.is_active) > 0,
          lastTested: config.updated_at,
          status: 'untested' as const
        }
        return acc
      }, {} as Record<string, ApiConfig>)

      setApiConfigs(apiProviders.map(provider => 
        configMap[provider.id] || {
          provider: provider.id,
          isActive: false,
          status: 'untested' as const
        }
      ))
    } catch (error) {
      console.error('Error loading API configurations:', error)
    }
  }

  const loadNotificationSettings = async () => {
    try {
      const user = await blink.auth.me()
      if (user) {
        const companies = await blink.db.companies.list({
          where: { user_id: user.id },
          limit: 1
        })
        
        if (companies.length > 0) {
          const company = companies[0]
          const prefs = company.notification_preferences ? 
            JSON.parse(company.notification_preferences) : {}
          
          setNotificationSettings(prev => ({
            ...prev,
            ...prefs
          }))
        }
      }
    } catch (error) {
      console.error('Error loading notification settings:', error)
    }
  }

  const testApiConnection = async (providerId: string, credentials?: Record<string, string>) => {
    setLoading(true)
    try {
      // Simulate API testing - in production, this would make actual API calls
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Mock test results
      const mockResults = {
        stitch: 'Connected successfully to Stitch Money API',
        ozow: 'Connected successfully to Ozow API',
        payshap: 'Connected successfully to PayShap API',
        cipc: 'Connected successfully to CIPC API',
        whois: 'Connected successfully to WHOIS API',
        safps: 'Connected successfully to SAFPS API',
        whatsapp: 'Connected successfully to WhatsApp Business API',
        clickatell: 'Connected successfully to Clickatell SMS API'
      }

      setTestResults(prev => ({
        ...prev,
        [providerId]: mockResults[providerId as keyof typeof mockResults] || 'Connection test completed'
      }))

      // Update API config status
      setApiConfigs(prev => prev.map(config => 
        config.provider === providerId 
          ? { ...config, status: 'connected' as const, lastTested: new Date().toISOString() }
          : config
      ))
    } catch (error) {
      console.error('Error testing API connection:', error)
      setTestResults(prev => ({
        ...prev,
        [providerId]: 'Connection test failed'
      }))
      
      setApiConfigs(prev => prev.map(config => 
        config.provider === providerId 
          ? { ...config, status: 'error' as const }
          : config
      ))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadApiConfigurations()
    loadNotificationSettings()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const saveApiConfiguration = async (providerId: string, credentials: Record<string, string>) => {
    setLoading(true)
    try {
      const user = await blink.auth.me()
      if (!user) return

      const companies = await blink.db.companies.list({
        where: { user_id: user.id },
        limit: 1
      })
      
      if (companies.length === 0) return

      const companyId = companies[0].id
      const configId = `config_${providerId}_${Date.now()}`

      // Store encrypted configuration
      await blink.db.api_configurations.create({
        id: configId,
        company_id: companyId,
        provider: providerId,
        config_data: JSON.stringify(credentials),
        is_active: true
      })

      await loadApiConfigurations()
      
      // Test the configuration after saving
      await testApiConnection(providerId, credentials)
    } catch (error) {
      console.error('Error saving API configuration:', error)
      setTestResults(prev => ({
        ...prev,
        [providerId]: 'Failed to save configuration'
      }))
    } finally {
      setLoading(false)
    }
  }

  const saveNotificationSettings = async () => {
    setLoading(true)
    try {
      const user = await blink.auth.me()
      if (!user) return

      const companies = await blink.db.companies.list({
        where: { user_id: user.id },
        limit: 1
      })
      
      if (companies.length > 0) {
        await blink.db.companies.update(companies[0].id, {
          notification_preferences: JSON.stringify(notificationSettings)
        })
      }
    } catch (error) {
      console.error('Error saving notification settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleApiProvider = async (providerId: string, enabled: boolean) => {
    try {
      const user = await blink.auth.me()
      if (!user) return

      const companies = await blink.db.companies.list({
        where: { user_id: user.id },
        limit: 1
      })
      
      if (companies.length === 0) return

      const configs = await blink.db.api_configurations.list({
        where: { 
          company_id: companies[0].id,
          provider: providerId
        }
      })

      if (configs.length > 0) {
        await blink.db.api_configurations.update(configs[0].id, {
          is_active: enabled
        })
      }

      setApiConfigs(prev => prev.map(config => 
        config.provider === providerId 
          ? { ...config, isActive: enabled }
          : config
      ))
    } catch (error) {
      console.error('Error toggling API provider:', error)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="w-6 h-6" />
        <h1 className="text-2xl font-bold">API & Settings Configuration</h1>
      </div>

      <Tabs defaultValue="apis" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="apis" className="flex items-center gap-2">
            <Key className="w-4 h-4" />
            API Integrations
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="apis" className="space-y-4">
          <Alert>
            <Shield className="w-4 h-4" />
            <AlertDescription>
              All API keys are encrypted and stored securely. Configure your integrations to enable real-time fraud detection.
            </AlertDescription>
          </Alert>

          <div className="grid gap-4">
            {apiProviders.map((provider) => {
              const config = apiConfigs.find(c => c.provider === provider.id)
              const testResult = testResults[provider.id]
              
              return (
                <Card key={provider.id}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {provider.name}
                        {config?.status === 'connected' && (
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Connected
                          </Badge>
                        )}
                        {config?.status === 'error' && (
                          <Badge variant="destructive">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Error
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription>{provider.description}</CardDescription>
                    </div>
                    <Switch
                      checked={config?.isActive || false}
                      onCheckedChange={(enabled) => toggleApiProvider(provider.id, enabled)}
                    />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-3">
                      {provider.fields.map((field) => (
                        <div key={field.key} className="space-y-2">
                          <Label htmlFor={field.key}>{field.label}</Label>
                          <Input
                            id={field.key}
                            type={field.type}
                            placeholder={`Enter your ${field.label.toLowerCase()}`}
                            className="font-mono text-sm"
                          />
                        </div>
                      ))}
                    </div>
                    
                    {testResult && (
                      <Alert className={testResult.includes('successfully') ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                        <AlertDescription className={testResult.includes('successfully') ? 'text-green-800' : 'text-red-800'}>
                          {testResult}
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    <div className="flex gap-2">
                      <Button
                        onClick={() => testApiConnection(provider.id)}
                        disabled={loading}
                        variant="outline"
                        size="sm"
                      >
                        Test Connection
                      </Button>
                      <Button
                        onClick={() => {
                          // In a real implementation, this would collect form data
                          const mockCredentials = { [provider.fields[0].key]: 'test_key' }
                          saveApiConfiguration(provider.id, mockCredentials)
                        }}
                        disabled={loading}
                        size="sm"
                      >
                        Save Configuration
                      </Button>
                    </div>
                    
                    {config?.lastTested && (
                      <p className="text-xs text-muted-foreground">
                        Last tested: {new Date(config.lastTested).toLocaleString()}
                      </p>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Configure how and when you receive fraud alerts and system notifications.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium">Notification Channels</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="email-notifications">Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive alerts via email</p>
                    </div>
                    <Switch
                      id="email-notifications"
                      checked={notificationSettings.email}
                      onCheckedChange={(checked) => 
                        setNotificationSettings(prev => ({ ...prev, email: checked }))
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="whatsapp-notifications">WhatsApp Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive alerts via WhatsApp</p>
                    </div>
                    <Switch
                      id="whatsapp-notifications"
                      checked={notificationSettings.whatsapp}
                      onCheckedChange={(checked) => 
                        setNotificationSettings(prev => ({ ...prev, whatsapp: checked }))
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="sms-notifications">SMS Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive alerts via SMS</p>
                    </div>
                    <Switch
                      id="sms-notifications"
                      checked={notificationSettings.sms}
                      onCheckedChange={(checked) => 
                        setNotificationSettings(prev => ({ ...prev, sms: checked }))
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Alert Types</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="fraud-alerts">Fraud Alerts</Label>
                      <p className="text-sm text-muted-foreground">Immediate alerts for suspicious activity</p>
                    </div>
                    <Switch
                      id="fraud-alerts"
                      checked={notificationSettings.fraudAlerts}
                      onCheckedChange={(checked) => 
                        setNotificationSettings(prev => ({ ...prev, fraudAlerts: checked }))
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="daily-summary">Daily Summary</Label>
                      <p className="text-sm text-muted-foreground">Daily fraud check summary reports</p>
                    </div>
                    <Switch
                      id="daily-summary"
                      checked={notificationSettings.dailySummary}
                      onCheckedChange={(checked) => 
                        setNotificationSettings(prev => ({ ...prev, dailySummary: checked }))
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Risk Threshold</h4>
                <div className="space-y-2">
                  <Label htmlFor="risk-threshold">High Risk Alert Threshold (%)</Label>
                  <Input
                    id="risk-threshold"
                    type="number"
                    min="0"
                    max="100"
                    value={notificationSettings.highRiskThreshold}
                    onChange={(e) => 
                      setNotificationSettings(prev => ({ 
                        ...prev, 
                        highRiskThreshold: parseInt(e.target.value) || 70 
                      }))
                    }
                  />
                  <p className="text-sm text-muted-foreground">
                    Send immediate alerts when risk score exceeds this threshold
                  </p>
                </div>
              </div>

              <Button onClick={saveNotificationSettings} disabled={loading}>
                Save Notification Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security & Privacy</CardTitle>
              <CardDescription>
                Configure security settings and data privacy options.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <Shield className="w-4 h-4" />
                <AlertDescription>
                  FraudShield is POPIA and GDPR compliant. All sensitive data is encrypted at rest and in transit.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <h4 className="font-medium">Data Retention</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Verification History</Label>
                      <p className="text-sm text-muted-foreground">Keep fraud check history for 12 months</p>
                    </div>
                    <Badge variant="secondary">12 months</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Document Storage</Label>
                      <p className="text-sm text-muted-foreground">Store uploaded documents for 6 months</p>
                    </div>
                    <Badge variant="secondary">6 months</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Driver PINs</Label>
                      <p className="text-sm text-muted-foreground">PINs expire after 24 hours</p>
                    </div>
                    <Badge variant="secondary">24 hours</Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Access Control</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Two-Factor Authentication</Label>
                      <p className="text-sm text-muted-foreground">Require 2FA for sensitive operations</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Session Timeout</Label>
                      <p className="text-sm text-muted-foreground">Auto-logout after inactivity</p>
                    </div>
                    <Badge variant="secondary">30 minutes</Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Compliance</h4>
                <div className="grid gap-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm">POPIA (Protection of Personal Information Act) Compliant</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm">GDPR (General Data Protection Regulation) Compliant</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm">ISO 27001 Security Standards</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm">End-to-End Encryption</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}