'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Package, FileText, Users, Send, BarChart3, Plus, Search, ArrowLeft, Mail, Eye } from 'lucide-react'

// Inner component that uses useSearchParams
function RFQsPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [rfqs, setRfqs] = useState([])
  const [indents, setIndents] = useState([])
  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  
  // New RFQ form
  const [showNewDialog, setShowNewDialog] = useState(false)
  const [selectedIndent, setSelectedIndent] = useState('')
  const [rfqTitle, setRfqTitle] = useState('')
  const [rfqDueDate, setRfqDueDate] = useState('')
  const [rfqNotes, setRfqNotes] = useState('')
  const [selectedVendors, setSelectedVendors] = useState([])
  const [creating, setCreating] = useState(false)

  // Email preview
  const [showEmailDialog, setShowEmailDialog] = useState(false)
  const [emailPreview, setEmailPreview] = useState(null)

  useEffect(() => {
    fetchData()
    
    // Auto-open new RFQ dialog if indentId in URL
    const indentId = searchParams.get('indentId')
    if (indentId) {
      setSelectedIndent(indentId)
      setShowNewDialog(true)
    }
  }, [searchParams])

  const getToken = () => localStorage.getItem('token')

  const fetchData = async () => {
    try {
      const headers = { 'Authorization': `Bearer ${getToken()}` }
      
      const [rfqsRes, indentsRes, vendorsRes] = await Promise.all([
        fetch('/api/rfqs', { headers }),
        fetch('/api/indents', { headers }),
        fetch('/api/vendors', { headers })
      ])

      if (rfqsRes.ok) setRfqs(await rfqsRes.json())
      if (indentsRes.ok) setIndents(await indentsRes.json())
      if (vendorsRes.ok) setVendors(await vendorsRes.json())
    } catch (error) {
      toast.error('Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateRFQ = async (e) => {
    e.preventDefault()
    if (selectedVendors.length === 0) {
      toast.error('Please select at least one vendor')
      return
    }

    setCreating(true)
    try {
      const res = await fetch('/api/rfqs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({
          indentId: selectedIndent,
          title: rfqTitle,
          dueDate: rfqDueDate || null,
          notes: rfqNotes || null,
          vendorIds: selectedVendors
        })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create RFQ')
      }

      const rfq = await res.json()
      toast.success('RFQ created successfully')
      setShowNewDialog(false)
      resetForm()
      router.push(`/dashboard/rfqs/${rfq.id}`)
    } catch (error) {
      toast.error(error.message)
    } finally {
      setCreating(false)
    }
  }

  const handlePreviewEmail = async (rfqId, vendorId) => {
    try {
      const res = await fetch(`/api/rfqs/${rfqId}/email/${vendorId}`, {
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

  const handleSendRFQ = async (rfqId, vendorIds) => {
    try {
      const res = await fetch(`/api/rfqs/${rfqId}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({ vendorIds })
      })

      if (res.ok) {
        const result = await res.json()
        toast.success(`RFQ sent to ${result.sent} vendors (mock - logged only)`)
        fetchData()
      }
    } catch (error) {
      toast.error('Failed to send RFQ')
    }
  }

  const resetForm = () => {
    setSelectedIndent('')
    setRfqTitle('')
    setRfqDueDate('')
    setRfqNotes('')
    setSelectedVendors([])
  }

  const toggleVendor = (vendorId) => {
    setSelectedVendors(prev => 
      prev.includes(vendorId) 
        ? prev.filter(id => id !== vendorId)
        : [...prev, vendorId]
    )
  }

  const getStatusColor = (status) => {
    const colors = {
      DRAFT: 'bg-slate-100 text-slate-700',
      SENT: 'bg-amber-100 text-amber-700',
      PARTIAL_RESPONSE: 'bg-cyan-100 text-cyan-700',
      ALL_RESPONDED: 'bg-green-100 text-green-700',
      CLOSED: 'bg-gray-100 text-gray-700'
    }
    return colors[status] || 'bg-slate-100 text-slate-700'
  }

  const filteredRfqs = rfqs.filter(rfq => 
    rfq.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rfq.rfqNumber.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Set title from indent when selected
  useEffect(() => {
    if (selectedIndent) {
      const indent = indents.find(i => i.id === selectedIndent)
      if (indent && !rfqTitle) {
        setRfqTitle(indent.title)
      }
    }
  }, [selectedIndent, indents])

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r hidden lg:block">
        <div className="p-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Package className="h-8 w-8 text-primary" />
            <span className="font-bold text-lg">Sourcing Copilot</span>
          </Link>
        </div>
        
        <nav className="px-4 space-y-1">
          <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-700">
            <BarChart3 className="h-5 w-5" />
            Dashboard
          </Link>
          <Link href="/dashboard/indents" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-700">
            <FileText className="h-5 w-5" />
            Indents
          </Link>
          <Link href="/dashboard/vendors" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-700">
            <Users className="h-5 w-5" />
            Vendors
          </Link>
          <Link href="/dashboard/rfqs" className="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary/10 text-primary font-medium">
            <Send className="h-5 w-5" />
            RFQs
          </Link>
          <Link href="/dashboard/comparison" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-700">
            <BarChart3 className="h-5 w-5" />
            Comparison
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64">
        <header className="bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">RFQs</h1>
                <p className="text-muted-foreground">Manage requests for quotation</p>
              </div>
            </div>
            
            <Button onClick={() => setShowNewDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New RFQ
            </Button>
          </div>
        </header>

        <div className="p-6">
          {/* Search */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search RFQs..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* RFQs Table */}
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : filteredRfqs.length === 0 ? (
                <div className="text-center py-12">
                  <Send className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">No RFQs found</p>
                  <Button variant="link" onClick={() => setShowNewDialog(true)}>
                    Create your first RFQ
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>RFQ #</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Indent</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Vendors</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRfqs.map((rfq) => (
                      <TableRow key={rfq.id}>
                        <TableCell className="font-medium">
                          <Link href={`/dashboard/rfqs/${rfq.id}`} className="hover:text-primary">
                            {rfq.rfqNumber}
                          </Link>
                        </TableCell>
                        <TableCell>{rfq.title}</TableCell>
                        <TableCell>{rfq.indent?.indentNumber}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(rfq.status)}`}>
                            {rfq.status.replace('_', ' ')}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex -space-x-2">
                            {rfq.vendors?.slice(0, 3).map((v, idx) => (
                              <div 
                                key={idx} 
                                className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center border-2 border-white"
                                title={v.vendor?.name}
                              >
                                <span className="text-xs font-medium text-primary">
                                  {v.vendor?.name?.[0]}
                                </span>
                              </div>
                            ))}
                            {rfq.vendors?.length > 3 && (
                              <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center border-2 border-white">
                                <span className="text-xs text-muted-foreground">+{rfq.vendors.length - 3}</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {rfq.dueDate ? new Date(rfq.dueDate).toLocaleDateString() : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => router.push(`/dashboard/rfqs/${rfq.id}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {rfq.status === 'DRAFT' && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleSendRFQ(rfq.id, rfq.vendors?.map(v => v.vendorId))}
                              >
                                <Mail className="mr-1 h-4 w-4" />
                                Send
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* New RFQ Dialog */}
        <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New RFQ</DialogTitle>
              <DialogDescription>
                Select an indent and vendors to create a Request for Quotation
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateRFQ}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Select Indent *</Label>
                  <Select value={selectedIndent} onValueChange={setSelectedIndent}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose an indent" />
                    </SelectTrigger>
                    <SelectContent>
                      {indents.filter(i => i.status !== 'CLOSED').map((indent) => (
                        <SelectItem key={indent.id} value={indent.id}>
                          {indent.indentNumber} - {indent.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>RFQ Title *</Label>
                  <Input
                    placeholder="RFQ for Bearings"
                    value={rfqTitle}
                    onChange={(e) => setRfqTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <Input
                    type="date"
                    value={rfqDueDate}
                    onChange={(e) => setRfqDueDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    placeholder="Additional instructions for vendors..."
                    value={rfqNotes}
                    onChange={(e) => setRfqNotes(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Select Vendors *</Label>
                  <div className="border rounded-lg p-4 max-h-48 overflow-y-auto space-y-2">
                    {vendors.filter(v => v.isActive).map((vendor) => (
                      <div key={vendor.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={vendor.id}
                          checked={selectedVendors.includes(vendor.id)}
                          onCheckedChange={() => toggleVendor(vendor.id)}
                        />
                        <label htmlFor={vendor.id} className="text-sm cursor-pointer flex-1">
                          <span className="font-medium">{vendor.name}</span>
                          <span className="text-muted-foreground ml-2">({vendor.email})</span>
                        </label>
                      </div>
                    ))}
                    {vendors.filter(v => v.isActive).length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No active vendors. <Link href="/dashboard/vendors" className="text-primary">Add vendors first</Link>
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Selected: {selectedVendors.length} vendor(s)
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => { setShowNewDialog(false); resetForm() }}>
                  Cancel
                </Button>
                <Button type="submit" disabled={creating || !selectedIndent}>
                  {creating ? 'Creating...' : 'Create RFQ'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Email Preview Dialog */}
        <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Email Preview</DialogTitle>
              <DialogDescription>Preview of the RFQ email to be sent</DialogDescription>
            </DialogHeader>
            {emailPreview && (
              <div className="space-y-4 py-4">
                <div>
                  <Label className="text-muted-foreground">Subject</Label>
                  <p className="font-medium">{emailPreview.subject}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Body</Label>
                  <pre className="whitespace-pre-wrap text-sm bg-slate-50 p-4 rounded-lg border">
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
      </main>
    </div>
  )
}

// Loading fallback component
function RFQsPageLoading() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  )
}

// Main page component with Suspense boundary
export default function RFQsPage() {
  return (
    <Suspense fallback={<RFQsPageLoading />}>
      <RFQsPageInner />
    </Suspense>
  )
}
