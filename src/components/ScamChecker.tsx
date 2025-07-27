import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Badge } from './ui/badge'
import { Alert, AlertDescription } from './ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { communityService, ScamReport, TrustScore } from '../services/communityService'
import { Search, Shield, AlertTriangle, CheckCircle, XCircle, Info, Phone, Mail, Globe, Building, TrendingUp, TrendingDown } from 'lucide-react'

export function ScamChecker() {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchType, setSearchType] = useState<'phone' | 'email' | 'domain' | 'company'>('phone')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<{
    trustScore: TrustScore | null
    reports: ScamReport[]
    riskAssessment: {
      riskLevel: number
      riskFactors: string[]
      recommendations: string[]
    }
  } | null>(null)

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    try {
      setLoading(true)
      const searchResults = await communityService.checkEntity(searchQuery.trim(), searchType)
      setResults(searchResults)
    } catch (error) {
      console.error('Failed to check entity:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRiskLevelColor = (level: number) => {
    switch (level) {
      case 1: return 'text-green-600 bg-green-50 border-green-200'
      case 2: return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 3: return 'text-orange-600 bg-orange-50 border-orange-200'
      case 4: return 'text-red-600 bg-red-50 border-red-200'
      case 5: return 'text-red-800 bg-red-100 border-red-300'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
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

  const getRiskIcon = (level: number) => {
    switch (level) {
      case 1: return <CheckCircle className="w-5 h-5 text-green-600" />
      case 2: return <Info className="w-5 h-5 text-yellow-600" />
      case 3: return <AlertTriangle className="w-5 h-5 text-orange-600" />
      case 4: return <XCircle className="w-5 h-5 text-red-600" />
      case 5: return <XCircle className="w-5 h-5 text-red-800" />
      default: return <Info className="w-5 h-5 text-gray-600" />
    }
  }

  const getBadgeColor = (badge: string) => {
    switch (badge) {
      case 'verified': return 'bg-green-100 text-green-800 border-green-200'
      case 'under_watch': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'flagged': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getBadgeIcon = (badge: string) => {
    switch (badge) {
      case 'verified': return <CheckCircle className="w-4 h-4" />
      case 'under_watch': return <AlertTriangle className="w-4 h-4" />
      case 'flagged': return <XCircle className="w-4 h-4" />
      default: return <Info className="w-4 h-4" />
    }
  }

  const getSearchIcon = (type: string) => {
    switch (type) {
      case 'phone': return <Phone className="w-4 h-4" />
      case 'email': return <Mail className="w-4 h-4" />
      case 'domain': return <Globe className="w-4 h-4" />
      case 'company': return <Building className="w-4 h-4" />
      default: return <Search className="w-4 h-4" />
    }
  }

  const getPlaceholder = (type: string) => {
    switch (type) {
      case 'phone': return '+27 XX XXX XXXX'
      case 'email': return 'example@domain.com'
      case 'domain': return 'example.com'
      case 'company': return 'Company Name Ltd'
      default: return 'Enter search query'
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Scam Checker Tool</h1>
        <p className="text-gray-600">Verify the trustworthiness of phone numbers, emails, domains, and companies</p>
      </div>

      {/* Search Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <span>Check Entity</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <div className="flex-1">
              <div className="flex space-x-2">
                <Select value={searchType} onValueChange={(value: any) => setSearchType(value)}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="phone">
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4" />
                        <span>Phone</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="email">
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4" />
                        <span>Email</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="domain">
                      <div className="flex items-center space-x-2">
                        <Globe className="w-4 h-4" />
                        <span>Domain</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="company">
                      <div className="flex items-center space-x-2">
                        <Building className="w-4 h-4" />
                        <span>Company</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={getPlaceholder(searchType)}
                  className="flex-1"
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
            </div>
            
            <Button onClick={handleSearch} disabled={loading || !searchQuery.trim()}>
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <>
                  {getSearchIcon(searchType)}
                  <span className="ml-2">Check</span>
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {results && (
        <div className="space-y-6">
          {/* Risk Assessment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getRiskIcon(results.riskAssessment.riskLevel)}
                  <span>Risk Assessment</span>
                </div>
                <Badge className={`${getRiskLevelColor(results.riskAssessment.riskLevel)} border`}>
                  {getRiskLevelText(results.riskAssessment.riskLevel)}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Risk Factors */}
                {results.riskAssessment.riskFactors.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Risk Factors:</h4>
                    <ul className="space-y-1">
                      {results.riskAssessment.riskFactors.map((factor, index) => (
                        <li key={index} className="flex items-center space-x-2 text-sm text-red-600">
                          <XCircle className="w-4 h-4" />
                          <span>{factor}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Recommendations */}
                {results.riskAssessment.recommendations.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Recommendations:</h4>
                    <ul className="space-y-1">
                      {results.riskAssessment.recommendations.map((recommendation, index) => (
                        <li key={index} className="flex items-center space-x-2 text-sm text-blue-600">
                          <Info className="w-4 h-4" />
                          <span>{recommendation}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Trust Score */}
          {results.trustScore && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5" />
                    <span>Trust Score</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={`${getBadgeColor(results.trustScore.badgeStatus)} border flex items-center space-x-1`}>
                      {getBadgeIcon(results.trustScore.badgeStatus)}
                      <span className="capitalize">{results.trustScore.badgeStatus.replace('_', ' ')}</span>
                    </Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Trust Score Bar */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Trust Score</span>
                      <span className="text-2xl font-bold text-gray-900">{results.trustScore.trustScore}/100</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all duration-300 ${
                          results.trustScore.trustScore >= 70 ? 'bg-green-500' :
                          results.trustScore.trustScore >= 50 ? 'bg-yellow-500' :
                          results.trustScore.trustScore >= 30 ? 'bg-orange-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${results.trustScore.trustScore}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Statistics */}
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="bg-green-50 p-3 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{results.trustScore.verificationCount}</div>
                      <div className="text-sm text-green-700">Verifications</div>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{results.trustScore.successfulTransactions}</div>
                      <div className="text-sm text-blue-700">Successful Transactions</div>
                    </div>
                    <div className="bg-red-50 p-3 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">{results.trustScore.reportCount}</div>
                      <div className="text-sm text-red-700">Reports</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Scam Reports */}
          {results.reports.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <span>Related Scam Reports ({results.reports.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {results.reports.map((report) => (
                    <div key={report.id} className="border rounded-lg p-4 bg-red-50 border-red-200">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-gray-900">{report.title}</h4>
                        <Badge className="bg-red-100 text-red-800">
                          Risk Level {report.riskLevel}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{report.description}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                        <div className="flex items-center space-x-4">
                          <span>{report.upvotes} helpful</span>
                          <span>{report.verifications} verified</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* No Reports Found */}
          {results.reports.length === 0 && !results.trustScore && (
            <Card>
              <CardContent className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Reports Found</h3>
                <p className="text-gray-600">
                  No scam reports or trust data found for this {searchType}. 
                  This could be a good sign, but always verify through official channels.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Help Section */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-blue-800">
            <Info className="w-5 h-5" />
            <span>How to Use the Scam Checker</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-blue-700">
          <ul className="space-y-2 text-sm">
            <li>• <strong>Phone Numbers:</strong> Check if a phone number has been reported for scams</li>
            <li>• <strong>Email Addresses:</strong> Verify if an email is associated with fraudulent activities</li>
            <li>• <strong>Domains:</strong> Check for typosquatting and suspicious websites</li>
            <li>• <strong>Companies:</strong> Verify business legitimacy and check for fraud reports</li>
          </ul>
          <Alert className="mt-4 bg-blue-100 border-blue-300">
            <AlertTriangle className="w-4 h-4" />
            <AlertDescription className="text-blue-800">
              <strong>Important:</strong> This tool provides community-driven insights. Always verify through official channels before making important decisions.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  )
}