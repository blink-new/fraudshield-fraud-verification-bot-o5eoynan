import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Badge } from './ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Label } from './ui/label'
import { Switch } from './ui/switch'
import { communityService, BusinessListing } from '../services/communityService'
import { Plus, Building, MapPin, Phone, Mail, Globe, Star, Shield, Users, GraduationCap, Briefcase } from 'lucide-react'

export function BusinessDirectory() {
  const [businesses, setBusinesses] = useState<BusinessListing[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    category: '',
    location: '',
    verificationStatus: '',
    isStudentBusiness: undefined as boolean | undefined,
    verifiedByOrg: ''
  })
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [newBusiness, setNewBusiness] = useState({
    businessName: '',
    description: '',
    category: '',
    subcategory: '',
    location: '',
    contactPhone: '',
    contactEmail: '',
    website: '',
    services: [] as string[],
    verificationStatus: 'pending' as const,
    verifiedByOrg: '',
    isStudentBusiness: false,
    isSme: true
  })
  const [serviceInput, setServiceInput] = useState('')

  const categories = [
    'Technology', 'Food & Beverage', 'Retail', 'Services', 'Education',
    'Healthcare', 'Construction', 'Transportation', 'Entertainment', 'Other'
  ]

  const loadBusinesses = useCallback(async () => {
    try {
      setLoading(true)
      const filterObj = Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== '' && value !== undefined)
      )
      const businessList = await communityService.getBusinessListings(filterObj)
      setBusinesses(businessList)
    } catch (error) {
      console.error('Failed to load businesses:', error)
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    loadBusinesses()
  }, [loadBusinesses])

  const handleAddBusiness = async () => {
    try {
      await communityService.addBusinessListing(newBusiness)
      setShowAddDialog(false)
      setNewBusiness({
        businessName: '',
        description: '',
        category: '',
        subcategory: '',
        location: '',
        contactPhone: '',
        contactEmail: '',
        website: '',
        services: [],
        verificationStatus: 'pending',
        verifiedByOrg: '',
        isStudentBusiness: false,
        isSme: true
      })
      setServiceInput('')
      loadBusinesses()
    } catch (error) {
      console.error('Failed to add business:', error)
    }
  }

  const addService = () => {
    if (serviceInput.trim() && !newBusiness.services.includes(serviceInput.trim())) {
      setNewBusiness({
        ...newBusiness,
        services: [...newBusiness.services, serviceInput.trim()]
      })
      setServiceInput('')
    }
  }

  const removeService = (service: string) => {
    setNewBusiness({
      ...newBusiness,
      services: newBusiness.services.filter(s => s !== service)
    })
  }

  const getVerificationBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-green-100 text-green-800 border-green-200">✅ Verified</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">⏳ Pending</Badge>
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 border-red-200">❌ Rejected</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">❓ Unknown</Badge>
    }
  }

  const getTrustScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600'
    if (score >= 50) return 'text-yellow-600'
    if (score >= 30) return 'text-orange-600'
    return 'text-red-600'
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ))
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Business Directory</h1>
          <p className="text-gray-600 mt-2">Discover verified student businesses and SMEs in your community</p>
        </div>
        
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Business
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Your Business</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="businessName">Business Name *</Label>
                <Input
                  id="businessName"
                  value={newBusiness.businessName}
                  onChange={(e) => setNewBusiness({ ...newBusiness, businessName: e.target.value })}
                  placeholder="Your Business Name"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newBusiness.description}
                  onChange={(e) => setNewBusiness({ ...newBusiness, description: e.target.value })}
                  placeholder="Brief description of your business"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select value={newBusiness.category} onValueChange={(value) => setNewBusiness({ ...newBusiness, category: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="subcategory">Subcategory</Label>
                  <Input
                    id="subcategory"
                    value={newBusiness.subcategory}
                    onChange={(e) => setNewBusiness({ ...newBusiness, subcategory: e.target.value })}
                    placeholder="e.g., Web Development"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={newBusiness.location}
                  onChange={(e) => setNewBusiness({ ...newBusiness, location: e.target.value })}
                  placeholder="City, Province"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contactPhone">Phone Number</Label>
                  <Input
                    id="contactPhone"
                    value={newBusiness.contactPhone}
                    onChange={(e) => setNewBusiness({ ...newBusiness, contactPhone: e.target.value })}
                    placeholder="+27 XX XXX XXXX"
                  />
                </div>

                <div>
                  <Label htmlFor="contactEmail">Email</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={newBusiness.contactEmail}
                    onChange={(e) => setNewBusiness({ ...newBusiness, contactEmail: e.target.value })}
                    placeholder="contact@business.com"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={newBusiness.website}
                  onChange={(e) => setNewBusiness({ ...newBusiness, website: e.target.value })}
                  placeholder="https://www.yourbusiness.com"
                />
              </div>

              <div>
                <Label htmlFor="services">Services/Products</Label>
                <div className="flex space-x-2 mb-2">
                  <Input
                    value={serviceInput}
                    onChange={(e) => setServiceInput(e.target.value)}
                    placeholder="Add a service or product"
                    onKeyPress={(e) => e.key === 'Enter' && addService()}
                  />
                  <Button type="button" onClick={addService} variant="outline">
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {newBusiness.services.map((service, index) => (
                    <Badge key={index} variant="secondary" className="cursor-pointer" onClick={() => removeService(service)}>
                      {service} ×
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="verifiedByOrg">Verified by Organization (optional)</Label>
                <Input
                  id="verifiedByOrg"
                  value={newBusiness.verifiedByOrg}
                  onChange={(e) => setNewBusiness({ ...newBusiness, verifiedByOrg: e.target.value })}
                  placeholder="e.g., University of Cape Town, Student Union"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isStudentBusiness"
                  checked={newBusiness.isStudentBusiness}
                  onCheckedChange={(checked) => setNewBusiness({ ...newBusiness, isStudentBusiness: checked })}
                />
                <Label htmlFor="isStudentBusiness">This is a student-run business</Label>
              </div>

              <Button onClick={handleAddBusiness} className="w-full">
                Add Business to Directory
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Businesses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Select value={filters.category} onValueChange={(value) => setFilters({ ...filters, category: value })}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              placeholder="Location"
              value={filters.location}
              onChange={(e) => setFilters({ ...filters, location: e.target.value })}
            />

            <Select value={filters.verificationStatus} onValueChange={(value) => setFilters({ ...filters, verificationStatus: value })}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>

            <Select 
              value={filters.isStudentBusiness === undefined ? '' : filters.isStudentBusiness.toString()} 
              onValueChange={(value) => setFilters({ 
                ...filters, 
                isStudentBusiness: value === '' ? undefined : value === 'true' 
              })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
                <SelectItem value="true">Student Businesses</SelectItem>
                <SelectItem value="false">SMEs</SelectItem>
              </SelectContent>
            </Select>

            <Input
              placeholder="Verified by Organization"
              value={filters.verifiedByOrg}
              onChange={(e) => setFilters({ ...filters, verifiedByOrg: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Business Listings */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading businesses...</p>
          </div>
        ) : businesses.length === 0 ? (
          <div className="col-span-full text-center py-8">
            <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No businesses found matching your filters.</p>
          </div>
        ) : (
          businesses.map((business) => (
            <Card key={business.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <Building className="w-5 h-5" />
                      <span>{business.businessName}</span>
                    </CardTitle>
                    <div className="flex items-center space-x-2 mt-2">
                      {getVerificationBadge(business.verificationStatus)}
                      {business.isStudentBusiness && (
                        <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                          <GraduationCap className="w-3 h-3 mr-1" />
                          Student
                        </Badge>
                      )}
                      {business.isSme && (
                        <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                          <Briefcase className="w-3 h-3 mr-1" />
                          SME
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${getTrustScoreColor(business.trustScore)}`}>
                      {business.trustScore}
                    </div>
                    <div className="text-xs text-gray-500">Trust Score</div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  {business.description && (
                    <p className="text-gray-700 text-sm">{business.description}</p>
                  )}

                  <div className="flex items-center space-x-2 text-sm">
                    <Badge variant="outline">{business.category}</Badge>
                    {business.subcategory && (
                      <Badge variant="outline" className="text-xs">{business.subcategory}</Badge>
                    )}
                  </div>

                  {business.location && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span>{business.location}</span>
                    </div>
                  )}

                  {business.verifiedByOrg && (
                    <div className="flex items-center space-x-2 text-sm text-green-600">
                      <Shield className="w-4 h-4" />
                      <span>Verified by {business.verifiedByOrg}</span>
                    </div>
                  )}

                  {business.services.length > 0 && (
                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-1">Services:</div>
                      <div className="flex flex-wrap gap-1">
                        {business.services.slice(0, 3).map((service, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {service}
                          </Badge>
                        ))}
                        {business.services.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{business.services.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Rating */}
                  {business.reviewCount > 0 && (
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center">
                        {renderStars(Math.round(business.averageRating))}
                      </div>
                      <span className="text-sm text-gray-600">
                        {business.averageRating.toFixed(1)} ({business.reviewCount} reviews)
                      </span>
                    </div>
                  )}

                  {/* Contact Information */}
                  <div className="pt-3 border-t space-y-2">
                    {business.contactPhone && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Phone className="w-4 h-4" />
                        <span className="font-mono">{business.contactPhone}</span>
                      </div>
                    )}
                    {business.contactEmail && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Mail className="w-4 h-4" />
                        <span className="font-mono">{business.contactEmail}</span>
                      </div>
                    )}
                    {business.website && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Globe className="w-4 h-4" />
                        <a 
                          href={business.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          Visit Website
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Statistics */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-800">Directory Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{businesses.length}</div>
              <div className="text-sm text-blue-700">Total Businesses</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {businesses.filter(b => b.verificationStatus === 'verified').length}
              </div>
              <div className="text-sm text-green-700">Verified</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {businesses.filter(b => b.isStudentBusiness).length}
              </div>
              <div className="text-sm text-purple-700">Student Businesses</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">
                {new Set(businesses.map(b => b.category)).size}
              </div>
              <div className="text-sm text-orange-700">Categories</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}