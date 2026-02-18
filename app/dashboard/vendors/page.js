'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { Badge } from '@/components/ui/badge'
import { Package, FileText, Users, Send, BarChart3, Plus, Search, Trash2, Edit, ArrowLeft } from 'lucide-react'

export default function VendorsPage() {
  const router = useRouter()
  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showDialog, setShowDialog] = useState(false)
  const [editingVendor, setEditingVendor] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    gstin: '',
    categoriesSupported: ''
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchVendors()
  }, [])

  const getToken = () => localStorage.getItem('token')

  const fetchVendors = async () => {
    try {
      const res = await fetch('/api/vendors', {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      })
      if (res.ok) {
        setVendors(await res.json())
      }
    } catch (error) {
      toast.error('Failed to fetch vendors')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    
    try {
      const payload = {
        ...formData,
        categoriesSupported: formData.categoriesSupported
          ? formData.categoriesSupported.split(',').map(c => c.trim())
          : []
      }

      const url = editingVendor ? `/api/vendors/${editingVendor.id}` : '/api/vendors'
      const method = editingVendor ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify(payload)
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save vendor')
      }
      
      toast.success(editingVendor ? 'Vendor updated' : 'Vendor created')
      setShowDialog(false)
      resetForm()
      fetchVendors()
    } catch (error) {
      toast.error(error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (vendor) => {
    setEditingVendor(vendor)
    setFormData({
      name: vendor.name,
      email: vendor.email,
      phone: vendor.phone || '',
      location: vendor.location || '',
      gstin: vendor.gstin || '',
      categoriesSupported: vendor.categoriesSupported?.join(', ') || ''
    })
    setShowDialog(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this vendor?')) return
    
    try {
      const res = await fetch(`/api/vendors/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getToken()}` }
      })
      
      if (res.ok) {
        toast.success('Vendor deleted')
        fetchVendors()
      }
    } catch (error) {
      toast.error('Failed to delete vendor')
    }
  }

  const resetForm = () => {
    setEditingVendor(null)
    setFormData({
      name: '',
      email: '',
      phone: '',
      location: '',
      gstin: '',
      categoriesSupported: ''
    })
  }

  const filteredVendors = vendors.filter(vendor => 
    vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vendor.email.toLowerCase().includes(searchQuery.toLowerCase())
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
          <Link href="/dashboard/indents" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-700">
            <FileText className="h-5 w-5" />
            Indents
          </Link>
          <Link href="/dashboard/vendors" className="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary/10 text-primary font-medium">
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
                <h1 className="text-2xl font-bold">Vendors</h1>
                <p className="text-muted-foreground">Manage your vendor database</p>
              </div>
            </div>
            
            <Dialog open={showDialog} onOpenChange={(open) => { setShowDialog(open); if (!open) resetForm() }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Vendor
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingVendor ? 'Edit Vendor' : 'Add New Vendor'}</DialogTitle>
                  <DialogDescription>
                    {editingVendor ? 'Update vendor information' : 'Add a new vendor to your database'}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                  <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Vendor Name *</Label>
                        <Input
                          placeholder="Acme Bearings Ltd"
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Email *</Label>
                        <Input
                          type="email"
                          placeholder="sales@vendor.com"
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Phone</Label>
                        <Input
                          placeholder="+91 98765 43210"
                          value={formData.phone}
                          onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Location</Label>
                        <Input
                          placeholder="Mumbai, India"
                          value={formData.location}
                          onChange={(e) => setFormData({...formData, location: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>GSTIN</Label>
                      <Input
                        placeholder="27AABCU9603R1ZM"
                        value={formData.gstin}
                        onChange={(e) => setFormData({...formData, gstin: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Categories Supported</Label>
                      <Input
                        placeholder="Bearings, Motors, Valves (comma separated)"
                        value={formData.categoriesSupported}
                        onChange={(e) => setFormData({...formData, categoriesSupported: e.target.value})}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => { setShowDialog(false); resetForm() }}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={saving}>
                      {saving ? 'Saving...' : (editingVendor ? 'Update' : 'Add Vendor')}
                    </Button>
                  </DialogFooter>
                </form>
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
                placeholder="Search vendors..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Vendors Table */}
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : filteredVendors.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">No vendors found</p>
                  <Button variant="link" onClick={() => setShowDialog(true)}>
                    Add your first vendor
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Categories</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVendors.map((vendor) => (
                      <TableRow key={vendor.id}>
                        <TableCell className="font-medium">{vendor.name}</TableCell>
                        <TableCell>{vendor.email}</TableCell>
                        <TableCell>{vendor.phone || '-'}</TableCell>
                        <TableCell>{vendor.location || '-'}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {vendor.categoriesSupported?.slice(0, 2).map((cat, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {cat}
                              </Badge>
                            ))}
                            {vendor.categoriesSupported?.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{vendor.categoriesSupported.length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={vendor.isActive ? 'default' : 'secondary'}>
                            {vendor.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleEdit(vendor)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleDelete(vendor.id)}
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
