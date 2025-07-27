import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Badge } from './ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Label } from './ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Alert, AlertDescription } from './ui/alert'
import { communityService, ScamReport } from '../services/communityService'
import { AlertTriangle, ThumbsUp, Users, MapPin, Calendar, DollarSign, Phone, Mail, Globe, Building } from 'lucide-react'

export function ScamWall() {
  const [scamReports, setScamReports] = useState<ScamReport[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    category: '',
    location: '',
    scamType: '',
    riskLevel: ''
  })
  const [showReportDialog, setShowReportDialog] = useState(false)
  const [newReport, setNewReport] = useState({
    title: '',
    description: '',
    scamType: 'other' as const,
    category: 'other' as const,
    location: '',
    riskLevel: 1,
    phoneNumber: '',
    email: '',
    domain: '',
    companyName: '',
    amountLost: 0,
    evidenceUrls: [] as string[]
  })

  const loadScamReports = useCallback(async () => {
    try {
      setLoading(true)
      const filterObj = Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== '')
      )
      const reports = await communityService.getScamReports({
        ...filterObj,
        riskLevel: filters.riskLevel ? parseInt(filters.riskLevel) : undefined
      })
      setScamReports(reports)
    } catch (error) {
      console.error('Failed to load scam reports:', error)
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    loadScamReports()
  }, [filters, loadScamReports])

  const handleSubmitReport = async () => {
    try {
      await communityService.submitScamReport(newReport)
      setShowReportDialog(false)
      setNewReport({
        title: '',
        description: '',
        scamType: 'other',
        category: 'other',
        location: '',
        riskLevel: 1,
        phoneNumber: '',
        email: '',
        domain: '',
        companyName: '',
        amountLost: 0,
        evidenceUrls: []
      })
      loadScamReports()
    } catch (error) {
      console.error('Failed to submit report:', error)
    }
  }

  const handleVerifyReport = async (reportId: string, type: 'upvote' | 'happened_to_me') => {
    try {
      await communityService.verifyScamReport(reportId, type)
      loadScamReports()
    } catch (error) {
      console.error('Failed to verify report:', error)
    }
  }

  const getRiskLevelColor = (level: number) => {
    switch (level) {
      case 1: return 'bg-green-100 text-green-800'
      case 2: return 'bg-yellow-100 text-yellow-800'
      case 3: return 'bg-orange-100 text-orange-800'
      case 4: return 'bg-red-100 text-red-800'
      case 5: return 'bg-red-200 text-red-900'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRiskLevelText = (level: number) => {
    switch (level) {
      case 1: return 'Low Risk'
      case 2: return 'Medium Risk'
      case 3: return 'High Risk'
      case 4: return 'Very High Risk'
      case 5: return 'Critical Risk'
      default: return 'Unknown'
    }
  }

  const getScamTypeIcon = (type: string) => {
    switch (type) {
      case 'fake_pop': return <DollarSign className="w-4 h-4" />
      case 'ghost_business': return <Building className="w-4 h-4" />
      case 'whatsapp_scam': return <Phone className="w-4 h-4" />
      case 'fake_document': return <AlertTriangle className="w-4 h-4" />
      default: return <AlertTriangle className="w-4 h-4" />
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Community Scam Wall</h1>
          <p className="text-gray-600 mt-2">Help protect the community by sharing and verifying scam reports</p>
        </div>
        
        <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
          <DialogTrigger asChild>
            <Button className="bg-red-600 hover:bg-red-700">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Report Scam
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Report a Scam</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Scam Title</Label>
                <Input
                  id="title"
                  value={newReport.title}
                  onChange={(e) => setNewReport({ ...newReport, title: e.target.value })}
                  placeholder="Brief description of the scam"
                />
              </div>

              <div>
                <Label htmlFor="description">Detailed Description</Label>
                <Textarea
                  id="description"
                  value={newReport.description}
                  onChange={(e) => setNewReport({ ...newReport, description: e.target.value })}
                  placeholder="Provide detailed information about what happened"
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="scamType">Scam Type</Label>
                  <Select value={newReport.scamType} onValueChange={(value: any) => setNewReport({ ...newReport, scamType: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fake_pop">Fake Proof of Payment</SelectItem>
                      <SelectItem value="ghost_business">Ghost Business</SelectItem>
                      <SelectItem value="whatsapp_scam">WhatsApp Scam</SelectItem>
                      <SelectItem value="fake_document">Fake Document</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={newReport.category} onValueChange={(value: any) => setNewReport({ ...newReport, category: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="payment">Payment</SelectItem>
                      <SelectItem value="document">Document</SelectItem>
                      <SelectItem value="business">Business</SelectItem>
                      <SelectItem value="communication">Communication</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={newReport.location}
                    onChange={(e) => setNewReport({ ...newReport, location: e.target.value })}
                    placeholder="City, Province"
                  />
                </div>

                <div>
                  <Label htmlFor="riskLevel">Risk Level (1-5)</Label>
                  <Select value={newReport.riskLevel.toString()} onValueChange={(value) => setNewReport({ ...newReport, riskLevel: parseInt(value) })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 - Low Risk</SelectItem>
                      <SelectItem value="2">2 - Medium Risk</SelectItem>
                      <SelectItem value="3">3 - High Risk</SelectItem>
                      <SelectItem value="4">4 - Very High Risk</SelectItem>
                      <SelectItem value="5">5 - Critical Risk</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phoneNumber">Phone Number (if applicable)</Label>
                  <Input
                    id="phoneNumber"
                    value={newReport.phoneNumber}
                    onChange={(e) => setNewReport({ ...newReport, phoneNumber: e.target.value })}
                    placeholder="+27 XX XXX XXXX"
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email (if applicable)</Label>
                  <Input
                    id="email"
                    value={newReport.email}
                    onChange={(e) => setNewReport({ ...newReport, email: e.target.value })}
                    placeholder="scammer@example.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="domain">Website/Domain (if applicable)</Label>
                  <Input
                    id="domain"
                    value={newReport.domain}
                    onChange={(e) => setNewReport({ ...newReport, domain: e.target.value })}
                    placeholder="suspicious-site.com"
                  />
                </div>

                <div>
                  <Label htmlFor="companyName">Company Name (if applicable)</Label>
                  <Input
                    id="companyName"
                    value={newReport.companyName}
                    onChange={(e) => setNewReport({ ...newReport, companyName: e.target.value })}
                    placeholder="Fake Company Ltd"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="amountLost">Amount Lost (ZAR)</Label>
                <Input
                  id="amountLost"
                  type="number"
                  value={newReport.amountLost}
                  onChange={(e) => setNewReport({ ...newReport, amountLost: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>

              <Button onClick={handleSubmitReport} className="w-full">
                Submit Scam Report
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select value={filters.category} onValueChange={(value) => setFilters({ ...filters, category: value })}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Categories</SelectItem>
                <SelectItem value="payment">Payment</SelectItem>
                <SelectItem value="document">Document</SelectItem>
                <SelectItem value="business">Business</SelectItem>
                <SelectItem value="communication">Communication</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.scamType} onValueChange={(value) => setFilters({ ...filters, scamType: value })}>
              <SelectTrigger>
                <SelectValue placeholder="All Scam Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Scam Types</SelectItem>
                <SelectItem value="fake_pop">Fake Proof of Payment</SelectItem>
                <SelectItem value="ghost_business">Ghost Business</SelectItem>
                <SelectItem value="whatsapp_scam">WhatsApp Scam</SelectItem>
                <SelectItem value="fake_document">Fake Document</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>

            <Input
              placeholder="Location"
              value={filters.location}
              onChange={(e) => setFilters({ ...filters, location: e.target.value })}
            />

            <Select value={filters.riskLevel} onValueChange={(value) => setFilters({ ...filters, riskLevel: value })}>
              <SelectTrigger>
                <SelectValue placeholder="All Risk Levels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Risk Levels</SelectItem>
                <SelectItem value="1">Low Risk</SelectItem>
                <SelectItem value="2">Medium Risk</SelectItem>
                <SelectItem value="3">High Risk</SelectItem>
                <SelectItem value="4">Very High Risk</SelectItem>
                <SelectItem value="5">Critical Risk</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Scam Reports */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading scam reports...</p>
          </div>
        ) : scamReports.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No scam reports found matching your filters.</p>
            </CardContent>
          </Card>
        ) : (
          scamReports.map((report) => (
            <Card key={report.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-3">
                    {getScamTypeIcon(report.scamType)}
                    <div>
                      <CardTitle className="text-lg">{report.title}</CardTitle>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="outline" className="capitalize">
                          {report.scamType.replace('_', ' ')}
                        </Badge>
                        <Badge className={getRiskLevelColor(report.riskLevel)}>
                          {getRiskLevelText(report.riskLevel)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    {report.location && (
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-4 h-4" />
                        <span>{report.location}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <p className="text-gray-700 mb-4">{report.description}</p>
                
                {/* Entity Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {report.phoneNumber && (
                    <div className="flex items-center space-x-2 text-sm">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">Phone:</span>
                      <span className="font-mono">{report.phoneNumber}</span>
                    </div>
                  )}
                  {report.email && (
                    <div className="flex items-center space-x-2 text-sm">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">Email:</span>
                      <span className="font-mono">{report.email}</span>
                    </div>
                  )}
                  {report.domain && (
                    <div className="flex items-center space-x-2 text-sm">
                      <Globe className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">Domain:</span>
                      <span className="font-mono">{report.domain}</span>
                    </div>
                  )}
                  {report.companyName && (
                    <div className="flex items-center space-x-2 text-sm">
                      <Building className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">Company:</span>
                      <span>{report.companyName}</span>
                    </div>
                  )}
                </div>

                {report.amountLost && report.amountLost > 0 && (
                  <Alert className="mb-4">
                    <DollarSign className="w-4 h-4" />
                    <AlertDescription>
                      <strong>Amount Lost:</strong> R{report.amountLost.toLocaleString()}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center space-x-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleVerifyReport(report.id, 'upvote')}
                      className="flex items-center space-x-1"
                    >
                      <ThumbsUp className="w-4 h-4" />
                      <span>Helpful ({report.upvotes})</span>
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleVerifyReport(report.id, 'happened_to_me')}
                      className="flex items-center space-x-1"
                    >
                      <Users className="w-4 h-4" />
                      <span>Happened to me ({report.verifications})</span>
                    </Button>
                  </div>
                  
                  <Badge variant="secondary" className="capitalize">
                    {report.category}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}