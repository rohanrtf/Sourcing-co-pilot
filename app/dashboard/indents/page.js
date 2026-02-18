'use client'

import { useState, useEffect, useRef } from 'react'
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
  DialogTrigger,
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
import { Package, FileText, Users, Send, BarChart3, Plus, Search, Trash2, Edit, ArrowLeft, Upload, FileUp } from 'lucide-react'

export default function IndentsPage() {
  const router = useRouter()
  const fileInputRef = useRef(null)
  const [indents, setIndents] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showNewDialog, setShowNewDialog] = useState(false)
  const [newIndent, setNewIndent] = useState({ title: '', rawText: '' })
  const [creating, setCreating] = useState(false)
  const [uploadMode, setUploadMode] = useState('text') // 'text' or 'file'
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    fetchIndents()
  }, [])

  const getToken = () => localStorage.getItem('token')

  const fetchIndents = async () => {
    try {
      const res = await fetch('/api/indents', {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      })
      if (res.ok) {
        setIndents(await res.json())
      }
    } catch (error) {
      toast.error('Failed to fetch indents')
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel']
      if (!validTypes.includes(file.type) && !file.name.endsWith('.pdf') && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        toast.error('Please upload a PDF or Excel file')
        return
      }
      setSelectedFile(file)
    }
  }

  const handleFileUpload = async (e) => {
    e.preventDefault()
    if (!selectedFile || !newIndent.title) {
      toast.error('Please provide a title and select a file')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('title', newIndent.title)

      const res = await fetch('/api/indents/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${getToken()}` },
        body: formData
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Upload failed')
      }

      const indent = await res.json()
      toast.success(`Indent created with ${indent.lines?.length || 0} items extracted`)
      setShowNewDialog(false)
      setNewIndent({ title: '', rawText: '' })
      setSelectedFile(null)
      router.push(`/dashboard/indents/${indent.id}`)
    } catch (error) {
      toast.error(error.message)
    } finally {
      setUploading(false)
    }
  }

  const handleCreateIndent = async (e) => {
    e.preventDefault()
    setCreating(true)
    
    try {
      const res = await fetch('/api/indents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify(newIndent)
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create indent')
      }
      
      const indent = await res.json()
      toast.success('Indent created successfully')
      setShowNewDialog(false)
      setNewIndent({ title: '', rawText: '' })
      router.push(`/dashboard/indents/${indent.id}`)
    } catch (error) {
      toast.error(error.message)
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteIndent = async (id) => {
    if (!confirm('Are you sure you want to delete this indent?')) return
    
    try {
      const res = await fetch(`/api/indents/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getToken()}` }
      })
      
      if (res.ok) {
        toast.success('Indent deleted')
        fetchIndents()
      }
    } catch (error) {
      toast.error('Failed to delete indent')
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      DRAFT: 'bg-slate-100 text-slate-700',
      PROCESSING: 'bg-blue-100 text-blue-700',
      NORMALIZED: 'bg-purple-100 text-purple-700',
      RFQ_SENT: 'bg-amber-100 text-amber-700',
      QUOTES_RECEIVED: 'bg-cyan-100 text-cyan-700',
      COMPARED: 'bg-indigo-100 text-indigo-700',
      DECIDED: 'bg-green-100 text-green-700',
      CLOSED: 'bg-gray-100 text-gray-700'
    }
    return colors[status] || 'bg-slate-100 text-slate-700'
  }

  const filteredIndents = indents.filter(indent => 
    indent.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    indent.indentNumber.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
          <Link href="/dashboard/indents" className="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary/10 text-primary font-medium">
            <FileText className="h-5 w-5" />
            Indents
          </Link>
          <Link href="/dashboard/vendors" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-700">
            <Users className="h-5 w-5" />
            Vendors
          </Link>
          <Link href="/dashboard/rfqs" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-700">
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
                <h1 className="text-2xl font-bold">Indents</h1>
                <p className="text-muted-foreground">Manage purchase indents</p>
              </div>
            </div>
            
            <Dialog open={showNewDialog} onOpenChange={(open) => { setShowNewDialog(open); if (!open) { setSelectedFile(null); setUploadMode('text'); } }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  New Indent
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Indent</DialogTitle>
                  <DialogDescription>
                    Upload a file or enter line items manually. AI will extract and normalize items.
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
                    <form onSubmit={handleCreateIndent}>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="title">Indent Title</Label>
                          <Input
                            id="title"
                            placeholder="e.g., Bearings for Plant Maintenance"
                            value={newIndent.title}
                            onChange={(e) => setNewIndent({...newIndent, title: e.target.value})}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="rawText">Line Items (one per line)</Label>
                          <Textarea
                            id="rawText"
                            placeholder="SKF 6205-2RS Bearing - 10 Nos
FAG 6308-ZZ Bearing - 5 Nos
NSK 6204-2RS Bearing - 8 Nos"
                            value={newIndent.rawText}
                            onChange={(e) => setNewIndent({...newIndent, rawText: e.target.value})}
                            rows={8}
                          />
                          <p className="text-xs text-muted-foreground">
                            Tip: Paste items with quantities. AI will extract details automatically.
                          </p>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setShowNewDialog(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={creating}>
                          {creating ? 'Creating...' : 'Create Indent'}
                        </Button>
                      </DialogFooter>
                    </form>
                  </TabsContent>
                  
                  <TabsContent value="file">
                    <form onSubmit={handleFileUpload}>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="file-title">Indent Title</Label>
                          <Input
                            id="file-title"
                            placeholder="e.g., Bearings for Plant Maintenance"
                            value={newIndent.title}
                            onChange={(e) => setNewIndent({...newIndent, title: e.target.value})}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Upload PDF or Excel File</Label>
                          <div 
                            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                              selectedFile ? 'border-primary bg-primary/5' : 'border-slate-200 hover:border-primary/50'
                            }`}
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <input
                              ref={fileInputRef}
                              type="file"
                              className="hidden"
                              accept=".pdf,.xlsx,.xls"
                              onChange={handleFileSelect}
                            />
                            {selectedFile ? (
                              <div className="space-y-2">
                                <FileUp className="h-10 w-10 mx-auto text-primary" />
                                <p className="font-medium">{selectedFile.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {(selectedFile.size / 1024).toFixed(1)} KB
                                </p>
                                <Button type="button" variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}>
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
                            AI will extract line items from your file automatically.
                          </p>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setShowNewDialog(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={uploading || !selectedFile}>
                          {uploading ? 'Uploading...' : 'Upload & Create'}
                        </Button>
                      </DialogFooter>
                    </form>
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>
          </div>
        </header>

        <div className="p-6">
          {/* Search */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search indents..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Indents Table */}
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : filteredIndents.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">No indents found</p>
                  <Button variant="link" onClick={() => setShowNewDialog(true)}>
                    Create your first indent
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Indent #</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Created By</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredIndents.map((indent) => (
                      <TableRow key={indent.id}>
                        <TableCell className="font-medium">
                          <Link href={`/dashboard/indents/${indent.id}`} className="hover:text-primary">
                            {indent.indentNumber}
                          </Link>
                        </TableCell>
                        <TableCell>{indent.title}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(indent.status)}`}>
                            {indent.status.replace('_', ' ')}
                          </span>
                        </TableCell>
                        <TableCell>{indent._count?.lines || 0}</TableCell>
                        <TableCell>{indent.createdBy?.name}</TableCell>
                        <TableCell>{new Date(indent.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => router.push(`/dashboard/indents/${indent.id}`)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleDeleteIndent(indent.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
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
      </main>
    </div>
  )
}
