import { createClient } from '@blinkdotnew/sdk'

const blink = createClient({
  projectId: 'fraudshield-fraud-verification-bot-o5eoynan',
  authRequired: true
})

export interface DocumentMetadata {
  id: string
  fileName: string
  fileType: string
  fileSize: number
  fileUrl: string
  documentType: 'pop' | 'rfq' | 'po' | 'other'
  extractedText?: string
  uploadedAt: string
}

class DocumentService {
  // Upload and process document
  async uploadDocument(
    file: File, 
    documentType: 'pop' | 'rfq' | 'po' | 'other',
    verificationId?: string
  ): Promise<DocumentMetadata> {
    try {
      const user = await blink.auth.me()
      
      // Upload file to storage
      const { publicUrl } = await blink.storage.upload(
        file,
        `documents/${user.id}/${Date.now()}_${file.name}`,
        { upsert: true }
      )

      // Extract text content from document
      let extractedText = ''
      try {
        if (file.type === 'application/pdf' || file.type.startsWith('image/')) {
          extractedText = await blink.data.extractFromBlob(file)
        } else if (file.type.startsWith('text/')) {
          extractedText = await file.text()
        }
      } catch (error) {
        console.warn('Text extraction failed:', error)
      }

      // Store document metadata
      const documentId = `doc_${Date.now()}`
      const documentRecord = await blink.db.uploadedDocuments.create({
        id: documentId,
        userId: user.id,
        verificationId: verificationId || '',
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        fileUrl: publicUrl,
        documentType,
        extractedText
      })

      return {
        id: documentRecord.id,
        fileName: documentRecord.fileName,
        fileType: documentRecord.fileType,
        fileSize: documentRecord.fileSize,
        fileUrl: documentRecord.fileUrl,
        documentType: documentRecord.documentType as 'pop' | 'rfq' | 'po' | 'other',
        extractedText: documentRecord.extractedText,
        uploadedAt: documentRecord.createdAt
      }
    } catch (error) {
      console.error('Document upload error:', error)
      throw new Error('Failed to upload document')
    }
  }

  // Get user's uploaded documents
  async getUserDocuments(documentType?: string): Promise<DocumentMetadata[]> {
    try {
      const user = await blink.auth.me()
      const whereClause: any = { userId: user.id }
      
      if (documentType) {
        whereClause.documentType = documentType
      }

      const documents = await blink.db.uploadedDocuments.list({
        where: whereClause,
        orderBy: { createdAt: 'desc' }
      })

      return documents.map(doc => ({
        id: doc.id,
        fileName: doc.fileName,
        fileType: doc.fileType,
        fileSize: doc.fileSize,
        fileUrl: doc.fileUrl,
        documentType: doc.documentType as 'pop' | 'rfq' | 'po' | 'other',
        extractedText: doc.extractedText,
        uploadedAt: doc.createdAt
      }))
    } catch (error) {
      console.error('Error fetching documents:', error)
      return []
    }
  }

  // Delete document
  async deleteDocument(documentId: string): Promise<boolean> {
    try {
      const user = await blink.auth.me()
      
      // Get document to verify ownership
      const documents = await blink.db.uploadedDocuments.list({
        where: { 
          id: documentId,
          userId: user.id 
        }
      })

      if (documents.length === 0) {
        throw new Error('Document not found or access denied')
      }

      const document = documents[0]

      // Delete from storage
      try {
        const fileName = document.fileUrl.split('/').pop()
        if (fileName) {
          await blink.storage.remove(fileName)
        }
      } catch (error) {
        console.warn('Storage deletion failed:', error)
      }

      // Delete from database
      await blink.db.uploadedDocuments.delete(documentId)

      return true
    } catch (error) {
      console.error('Document deletion error:', error)
      return false
    }
  }

  // Analyze document for fraud indicators
  async analyzeDocumentForFraud(documentId: string): Promise<{
    riskScore: number
    indicators: string[]
    recommendations: string[]
  }> {
    try {
      const user = await blink.auth.me()
      
      const documents = await blink.db.uploadedDocuments.list({
        where: { 
          id: documentId,
          userId: user.id 
        }
      })

      if (documents.length === 0) {
        throw new Error('Document not found')
      }

      const document = documents[0]
      const text = document.extractedText || ''

      // Analyze for fraud indicators
      const indicators: string[] = []
      let riskScore = 0

      // Check for suspicious domains
      const suspiciousDomains = text.match(/gov.*(?<!\.gov\.za)|g0v|g0vernment|offical|goverment/gi)
      if (suspiciousDomains) {
        indicators.push(`Suspicious domains detected: ${suspiciousDomains.join(', ')}`)
        riskScore += 30
      }

      // Check for urgent language
      const urgentKeywords = text.match(/urgent|immediate|asap|winner|lottery|inheritance/gi)
      if (urgentKeywords) {
        indicators.push(`Urgent/suspicious language detected: ${urgentKeywords.join(', ')}`)
        riskScore += 20
      }

      // Check for missing contact information
      const hasEmail = /@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(text)
      const hasPhone = /(?:\+27|0)[0-9]{9,10}/.test(text)
      if (!hasEmail && !hasPhone) {
        indicators.push('Missing contact information')
        riskScore += 25
      }

      // Check for poor grammar/spelling (simplified)
      const grammarIssues = text.match(/recieve|seperate|occured|definately|loose\s+money/gi)
      if (grammarIssues) {
        indicators.push('Potential grammar/spelling issues detected')
        riskScore += 15
      }

      // Generate recommendations
      const recommendations: string[] = []
      if (riskScore > 50) {
        recommendations.push('Verify sender identity through official channels')
        recommendations.push('Cross-check company registration details')
        recommendations.push('Contact the company directly using known contact information')
      }
      if (riskScore > 70) {
        recommendations.push('High risk - recommend rejecting this document')
        recommendations.push('Report suspicious activity to relevant authorities')
      }

      return {
        riskScore: Math.min(riskScore, 100),
        indicators,
        recommendations
      }
    } catch (error) {
      console.error('Document analysis error:', error)
      return {
        riskScore: 50,
        indicators: ['Analysis failed - manual review recommended'],
        recommendations: ['Unable to complete automated analysis']
      }
    }
  }

  // Extract structured data from document
  async extractStructuredData(documentId: string): Promise<{
    companyName?: string
    contactEmail?: string
    contactPhone?: string
    amount?: number
    reference?: string
    date?: string
    documentNumber?: string
  }> {
    try {
      const user = await blink.auth.me()
      
      const documents = await blink.db.uploadedDocuments.list({
        where: { 
          id: documentId,
          userId: user.id 
        }
      })

      if (documents.length === 0) {
        throw new Error('Document not found')
      }

      const text = documents[0].extractedText || ''

      // Extract structured data using regex patterns
      const companyName = text.match(/([A-Z][a-zA-Z\s]+(?:Ltd|Pty|Inc|Corp|Company|Co\.|Limited))/)?.[1]
      const contactEmail = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)?.[0]
      const contactPhone = text.match(/(?:\+27|0)[0-9]{9,10}/)?.[0]
      const amount = text.match(/R\s*([0-9,]+(?:\.[0-9]{2})?)/)?.[1]?.replace(/,/g, '')
      const reference = text.match(/(?:ref|reference|ref\s*#|reference\s*#)\s*:?\s*([a-zA-Z0-9]+)/i)?.[1]
      const date = text.match(/(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/)?.[1]
      const documentNumber = text.match(/(?:po|rfq|invoice|doc)\s*#?\s*:?\s*([a-zA-Z0-9-]+)/i)?.[1]

      return {
        companyName,
        contactEmail,
        contactPhone,
        amount: amount ? parseFloat(amount) : undefined,
        reference,
        date,
        documentNumber
      }
    } catch (error) {
      console.error('Data extraction error:', error)
      return {}
    }
  }

  // Generate document verification report
  async generateVerificationReport(documentId: string): Promise<{
    documentInfo: DocumentMetadata
    fraudAnalysis: any
    structuredData: any
    verificationStatus: 'verified' | 'suspicious' | 'failed'
    reportUrl?: string
  }> {
    try {
      const user = await blink.auth.me()
      
      const documents = await blink.db.uploadedDocuments.list({
        where: { 
          id: documentId,
          userId: user.id 
        }
      })

      if (documents.length === 0) {
        throw new Error('Document not found')
      }

      const document = documents[0]
      const documentInfo: DocumentMetadata = {
        id: document.id,
        fileName: document.fileName,
        fileType: document.fileType,
        fileSize: document.fileSize,
        fileUrl: document.fileUrl,
        documentType: document.documentType as 'pop' | 'rfq' | 'po' | 'other',
        extractedText: document.extractedText,
        uploadedAt: document.createdAt
      }

      const fraudAnalysis = await this.analyzeDocumentForFraud(documentId)
      const structuredData = await this.extractStructuredData(documentId)

      let verificationStatus: 'verified' | 'suspicious' | 'failed'
      if (fraudAnalysis.riskScore < 30) {
        verificationStatus = 'verified'
      } else if (fraudAnalysis.riskScore < 70) {
        verificationStatus = 'suspicious'
      } else {
        verificationStatus = 'failed'
      }

      return {
        documentInfo,
        fraudAnalysis,
        structuredData,
        verificationStatus
      }
    } catch (error) {
      console.error('Report generation error:', error)
      throw new Error('Failed to generate verification report')
    }
  }
}

export const documentService = new DocumentService()