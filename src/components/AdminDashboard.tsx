import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { authService } from '../services/authService'
import { fraudService } from '../services/fraudService'
import { 
  BarChart3, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp,
  Users,
  FileText,
  Key,
  Settings,
  Download
} from 'lucide-react'

export function AdminDashboard() {
  const [stats, setStats] = useState<any>(null)
  const [recentLogs, setRecentLogs] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadDashboardData = async () => {
    try {
      const [statsData, logsData] = await Promise.all([
        authService.getVerificationStats(),
        fraudService.getFraudLogs()
      ])
      
      setStats(statsData)
      setRecentLogs(logsData.slice(0, 10)) // Show last 10 logs
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'bg-green-100 text-green-800'
      case 'suspicious': return 'bg-yellow-100 text-yellow-800'
      case 'failed': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified': return <CheckCircle className="w-4 h-4" />
      case 'suspicious': return <AlertTriangle className="w-4 h-4" />
      case 'failed': return <AlertTriangle className="w-4 h-4" />
      default: return <Shield className="w-4 h-4" />
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">FraudShield Dashboard</h1>
          <p className="text-muted-foreground">Monitor fraud detection activities and manage security settings</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Verifications</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalVerifications || 0}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Successful Verifications</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats?.successfulVerifications || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.totalVerifications > 0 
                  ? `${Math.round((stats.successfulVerifications / stats.totalVerifications) * 100)}% success rate`
                  : 'No data'
                }
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Suspicious Activities</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats?.suspiciousActivities || 0}</div>
              <p className="text-xs text-muted-foreground">Requires attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active PINs</CardTitle>
              <Key className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats?.activePins || 0}</div>
              <p className="text-xs text-muted-foreground">Currently valid</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="activity" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="activity">Recent Activity</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="settings">Fraud Rules</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="activity" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Fraud Checks</CardTitle>
                <CardDescription>Latest verification activities</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-4">
                    {recentLogs.length > 0 ? (
                      recentLogs.map((log, index) => (
                        <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-3">
                            {getStatusIcon(log.verificationResult)}
                            <div>
                              <p className="font-medium">
                                {log.verificationType?.replace('_', ' ').toUpperCase()}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {log.bankName && `Bank: ${log.bankName}`}
                                {log.amount && ` • Amount: R${log.amount}`}
                                {log.transactionReference && ` • Ref: ${log.transactionReference}`}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge className={getStatusColor(log.verificationResult)}>
                              {log.verificationResult?.toUpperCase()}
                            </Badge>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(log.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No fraud checks performed yet</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Verification Types</CardTitle>
                  <CardDescription>Breakdown by verification type</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <span>Payment Verification</span>
                      </div>
                      <Badge variant="secondary">
                        {recentLogs.filter(log => log.verificationType === 'payment').length}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-green-600" />
                        <span>Document Verification</span>
                      </div>
                      <Badge variant="secondary">
                        {recentLogs.filter(log => log.verificationType === 'document').length}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Key className="w-4 h-4 text-purple-600" />
                        <span>PIN Generation</span>
                      </div>
                      <Badge variant="secondary">
                        {recentLogs.filter(log => log.verificationType === 'pin_generation').length}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Risk Assessment</CardTitle>
                  <CardDescription>Risk score distribution</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-green-600">Low Risk (0-30)</span>
                      <Badge className="bg-green-100 text-green-800">
                        {recentLogs.filter(log => (log.riskScore || 0) <= 30).length}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-yellow-600">Medium Risk (31-70)</span>
                      <Badge className="bg-yellow-100 text-yellow-800">
                        {recentLogs.filter(log => (log.riskScore || 0) > 30 && (log.riskScore || 0) <= 70).length}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-red-600">High Risk (71-100)</span>
                      <Badge className="bg-red-100 text-red-800">
                        {recentLogs.filter(log => (log.riskScore || 0) > 70).length}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Fraud Detection Rules</CardTitle>
                <CardDescription>Configure automated fraud detection parameters</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <h3 className="font-semibold mb-2">Domain Verification</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        Check for suspicious domain patterns and typosquatting
                      </p>
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    </div>
                    
                    <div className="p-4 border rounded-lg">
                      <h3 className="font-semibold mb-2">Amount Thresholds</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        Flag transactions above R100,000 for manual review
                      </p>
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    </div>
                    
                    <div className="p-4 border rounded-lg">
                      <h3 className="font-semibold mb-2">Language Analysis</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        Detect urgent/suspicious language patterns
                      </p>
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    </div>
                    
                    <div className="p-4 border rounded-lg">
                      <h3 className="font-semibold mb-2">Contact Verification</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        Ensure documents contain valid contact information
                      </p>
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    </div>
                  </div>
                  
                  <Button className="w-full">
                    <Settings className="w-4 h-4 mr-2" />
                    Configure Advanced Rules
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Generate Reports</CardTitle>
                <CardDescription>Export fraud detection data and analytics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button variant="outline" className="h-20 flex-col">
                    <Download className="w-6 h-6 mb-2" />
                    Daily Fraud Report
                  </Button>
                  
                  <Button variant="outline" className="h-20 flex-col">
                    <BarChart3 className="w-6 h-6 mb-2" />
                    Weekly Analytics
                  </Button>
                  
                  <Button variant="outline" className="h-20 flex-col">
                    <TrendingUp className="w-6 h-6 mb-2" />
                    Monthly Summary
                  </Button>
                  
                  <Button variant="outline" className="h-20 flex-col">
                    <Users className="w-6 h-6 mb-2" />
                    User Activity Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}