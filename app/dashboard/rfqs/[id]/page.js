'use client'

import { useState, useEffect, use, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, Send, Mail, Eye, Plus, Upload, FileText, CheckCircle, FileUp
} from 'lucide-react'

export default function RFQDetailPage({ params }) {
  const router = useRouter()
  const { id } = use(params)
  const fileInputRef = useRef(null)
  const [rfq, setRfq] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  
  // Quote upload
  const [showQuoteDialog, setShowQuoteDialog] = useState(false)
  const [selectedVendor, setSelectedVendor] = useState(null)
  const [quoteText, setQuoteText] = useState('')
  const [selectedQuoteFile, setSelectedQuoteFile] = useState(null)
  const [uploadMode, setUploadMode] = useState('text')
  const [uploading, setUploading] = useState(false)

  // Email preview
  const [showEmailDialog, setShowEmailDialog] = useState(false)
  const [emailPreview, setEmailPreview] = useState(null)

  useEffect(() => {
    fetchRFQ()
  }, [id])

  const getToken = () => localStorage.getItem('token')

  const fetchRFQ = async () => {
    try {
      const res = await fetch(`/api/rfqs/${id}`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      })
      if (res.ok) {
        setRfq(await res.json())
      } else {
        toast.error('RFQ not found')
        router.push('/dashboard/rfqs')
      }
    } catch (error) {
      toast.error('Failed to fetch RFQ')
    } finally {
      setLoading(false)
    }
  }

  const handlePreviewEmail = async (vendorId) => {
    try {
      const res = await fetch(`/api/rfqs/${id}/email/${vendorId}`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      })

      if (res.ok) {
        const email = await res.json()
        setEmailPreview(email)
        setShowEmailDialog(true)
      }
    } catch (error) {
      toast.error('Failed to load email preview')
    }
  }

  const handleSendRFQ = async (vendorIds) => {
    setSending(true)
    try {
      const res = await fetch(`/api/rfqs/${id}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({ vendorIds })
      })

      if (res.ok) {
        const result = await res.json()
        toast.success(`RFQ sent to ${result.sent} vendor(s) (MOCK - logged only)`)
        fetchRFQ()
      }
    } catch (error) {
      toast.error('Failed to send RFQ')
    } finally {
      setSending(false)
    }
  }

  const handleQuoteFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel']
      if (!validTypes.includes(file.type) && !file.name.endsWith('.pdf') && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        toast.error('Please upload a PDF or Excel file')
        return
      }
      setSelectedQuoteFile(file)
    }
  }

  const handleUploadQuoteText = async (e) => {
    e.preventDefault()
    if (!quoteText.trim()) {
      toast.error('Please enter quote details')
      return
    }

    setUploading(true)
    try {
      const res = await fetch('/api/quotes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({
          rfqVendorId: selectedVendor.id,
          vendorId: selectedVendor.vendorId,
          rawText: quoteText
        })
      })

      if (res.ok) {
        toast.success('Quote uploaded and parsed')
        setShowQuoteDialog(false)
        setQuoteText('')
        setSelectedVendor(null)
        fetchRFQ()
      }
    } catch (error) {
      toast.error('Failed to upload quote')
    } finally {
      setUploading(false)
    }
  }

  const handleUploadQuoteFile = async (e) => {
    e.preventDefault()
    if (!selectedQuoteFile) {
      toast.error('Please select a file')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', selectedQuoteFile)
      formData.append('rfqVendorId', selectedVendor.id)
      formData.append('vendorId', selectedVendor.vendorId)

      const res = await fetch('/api/quotes/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${getToken()}` },
        body: formData
      })

      if (res.ok) {
        const quote = await res.json()
        toast.success(`Quote uploaded with ${quote.lines?.length || 0} lines parsed`)
        setShowQuoteDialog(false)
        setSelectedQuoteFile(null)
        setSelectedVendor(null)
        fetchRFQ()
      } else {
        const data = await res.json()
        throw new Error(data.error || 'Upload failed')
      }
    } catch (error) {
      toast.error(error.message || 'Failed to upload quote')
    } finally {
      setUploading(false)
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      DRAFT: 'bg-slate-100 text-slate-700',
      SENT: 'bg-amber-100 text-amber-700',
      PENDING: 'bg-slate-100 text-slate-700',
      VIEWED: 'bg-blue-100 text-blue-700',
      RESPONDED: 'bg-green-100 text-green-700',
      DECLINED: 'bg-red-100 text-red-700'
    }
    return colors[status] || 'bg-slate-100 text-slate-700'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!rfq) return null

  const pendingVendors = rfq.vendors?.filter(v => v.status === 'PENDING') || []
  const sentVendors = rfq.vendors?.filter(v => v.status === 'SENT') || []
  const respondedVendors = rfq.vendors?.filter(v => v.status === 'RESPONDED') || []

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/rfqs')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{rfq.rfqNumber}</h1>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(rfq.status)}`}>
                  {rfq.status.replace('_', ' ')}
                </span>
              </div>
              <p className="text-muted-foreground">{rfq.title}</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            {rfq.status === 'DRAFT' && pendingVendors.length > 0 && (
              <Button 
                onClick={() => handleSendRFQ(pendingVendors.map(v => v.vendorId))}
                disabled={sending}
              >
                <Send className="mr-2 h-4 w-4" />
                {sending ? 'Sending...' : 'Send to All Vendors'}
              </Button>
            )}
            {respondedVendors.length > 0 && (
              <Button 
                variant="outline"
                onClick={() => router.push(`/dashboard/comparison?indentId=${rfq.indentId}`)}
              >
                View Comparison
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="p-6">
        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{rfq.vendors?.length || 0}</div>
              <p className="text-sm text-muted-foreground">Total Vendors</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{sentVendors.length}</div>
              <p className="text-sm text-muted-foreground">RFQs Sent</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{respondedVendors.length}</div>
              <p className="text-sm text-muted-foreground">Quotes Received</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{rfq.indent?.lines?.length || 0}</div>
              <p className="text-sm text-muted-foreground">Line Items</p>
            </CardContent>
          </Card>
        </div>

        {/* Vendors */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Vendors</CardTitle>
            <CardDescription>RFQ status for each vendor</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sent At</TableHead>
                  <TableHead>Responded</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rfq.vendors?.map((rv) => (
                  <TableRow key={rv.id}>
                    <TableCell className="font-medium">{rv.vendor?.name}</TableCell>
                    <TableCell>{rv.vendor?.email}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(rv.status)}`}>
                        {rv.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      {rv.sentAt ? new Date(rv.sentAt).toLocaleString() : '-'}
                    </TableCell>
                    <TableCell>
                      {rv.respondedAt ? new Date(rv.respondedAt).toLocaleString() : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handlePreviewEmail(rv.vendorId)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Preview
                        </Button>
                        {rv.status === 'PENDING' && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleSendRFQ([rv.vendorId])}
                            disabled={sending}
                          >
                            <Mail className="h-4 w-4 mr-1" />
                            Send
                          </Button>
                        )}
                        {(rv.status === 'SENT' || rv.status === 'PENDING') && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => { setSelectedVendor(rv); setShowQuoteDialog(true) }}
                          >
                            <Upload className="h-4 w-4 mr-1" />
                            Upload Quote
                          </Button>
                        )}
                        {rv.quotes?.length > 0 && (
                          <Badge variant="secondary">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            {rv.quotes.length} Quote(s)
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Line Items */}
        <Card>
          <CardHeader>
            <CardTitle>RFQ Line Items</CardTitle>
            <CardDescription>Items included in this RFQ from indent {rfq.indent?.indentNumber}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Unit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rfq.indent?.lines?.map((line) => (
                  <TableRow key={line.id}>
                    <TableCell>{line.lineNumber}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {line.normalizedItem?.cleanDescription || line.rawDescription}
                        </p>
                        {line.normalizedItem && (
                          <Badge variant="outline" className="mt-1 text-xs">
                            {line.normalizedItem.category}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{line.quantity}</TableCell>
                    <TableCell>{line.unit}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Upload Quote Dialog */}
        <Dialog open={showQuoteDialog} onOpenChange={(open) => { setShowQuoteDialog(open); if (!open) { setSelectedQuoteFile(null); setUploadMode('text'); } }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Upload Quote</DialogTitle>
              <DialogDescription>
                Upload a file or enter quote details from {selectedVendor?.vendor?.name}
              </DialogDescription>
            </DialogHeader>
            
            <Tabs value={uploadMode} onValueChange={setUploadMode} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="text">
                  <FileText className="mr-2 h-4 w-4" />
                  Enter Text
                </TabsTrigger>
                <TabsTrigger value="file">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload File
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="text">
                <form onSubmit={handleUploadQuoteText}>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Quote Details</Label>
                      <Textarea
                        placeholder="Paste quote content here. Include item descriptions, quantities, unit prices, GST, freight, lead time, etc.

Example:
SKF 6205-2RS - 10 Nos - Rs. 850/- + 18% GST - 7 days
FAG 6308-ZZ - 5 Nos - Rs. 1250/- + 18% GST - 10 days"
                        value={quoteText}
                        onChange={(e) => setQuoteText(e.target.value)}
                        rows={10}
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        AI will parse and extract line items, prices, and terms automatically.
                      </p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setShowQuoteDialog(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={uploading}>
                      {uploading ? 'Processing...' : 'Upload & Parse'}
                    </Button>
                  </DialogFooter>
                </form>
              </TabsContent>
              
              <TabsContent value="file">
                <form onSubmit={handleUploadQuoteFile}>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Upload PDF or Excel File</Label>
                      <div 
                        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                          selectedQuoteFile ? 'border-primary bg-primary/5' : 'border-slate-200 hover:border-primary/50'
                        }`}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          className="hidden"
                          accept=".pdf,.xlsx,.xls"
                          onChange={handleQuoteFileSelect}
                        />
                        {selectedQuoteFile ? (
                          <div className="space-y-2">
                            <FileUp className="h-10 w-10 mx-auto text-primary" />
                            <p className="font-medium">{selectedQuoteFile.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {(selectedQuoteFile.size / 1024).toFixed(1)} KB
                            </p>
                            <Button type="button" variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedQuoteFile(null); }}>
                              Remove
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <Upload className="h-10 w-10 mx-auto text-muted-foreground" />
                            <p className="font-medium">Click to upload or drag and drop</p>
                            <p className="text-sm text-muted-foreground">PDF or Excel files (max 10MB)</p>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        AI will extract line items, prices, and terms from your file automatically.
                      </p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setShowQuoteDialog(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={uploading || !selectedQuoteFile}>
                      {uploading ? 'Uploading...' : 'Upload & Parse'}
                    </Button>
                  </DialogFooter>
                </form>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>

        {/* Email Preview Dialog */}
        <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Email Preview</DialogTitle>
              <DialogDescription>Preview of the RFQ email</DialogDescription>
            </DialogHeader>
            {emailPreview && (
              <div className="space-y-4 py-4">
                <div>
                  <Label className="text-muted-foreground">Subject</Label>
                  <p className="font-medium">{emailPreview.subject}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Body</Label>
                  <pre className="whitespace-pre-wrap text-sm bg-slate-50 p-4 rounded-lg border max-h-96 overflow-y-auto">
                    {emailPreview.body}
                  </pre>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEmailDialog(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
