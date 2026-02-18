'use client'

import { useState, useEffect, use } from 'react'
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
import { Badge } from '@/components/ui/badge'
import { 
  Package, FileText, ArrowLeft, Save, Wand2, Send, Edit, Trash2, Plus, Check
} from 'lucide-react'

export default function IndentDetailPage({ params }) {
  const router = useRouter()
  const { id } = use(params)
  const [indent, setIndent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [normalizing, setNormalizing] = useState(false)
  const [editingLine, setEditingLine] = useState(null)
  const [showAddLineDialog, setShowAddLineDialog] = useState(false)
  const [newLine, setNewLine] = useState({ rawDescription: '', quantity: 1, unit: 'NOS' })

  useEffect(() => {
    fetchIndent()
  }, [id])

  const getToken = () => localStorage.getItem('token')

  const fetchIndent = async () => {
    try {
      const res = await fetch(`/api/indents/${id}`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      })
      if (res.ok) {
        setIndent(await res.json())
      } else {
        toast.error('Indent not found')
        router.push('/dashboard/indents')
      }
    } catch (error) {
      toast.error('Failed to fetch indent')
    } finally {
      setLoading(false)
    }
  }

  const handleNormalize = async () => {
    setNormalizing(true)
    try {
      const res = await fetch(`/api/indents/${id}/normalize`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${getToken()}` }
      })
      
      if (res.ok) {
        const data = await res.json()
        toast.success(`Normalized ${data.normalized} items`)
        fetchIndent()
      }
    } catch (error) {
      toast.error('Failed to normalize items')
    } finally {
      setNormalizing(false)
    }
  }

  const handleUpdateLine = async (lineId, updates) => {
    try {
      const res = await fetch(`/api/indent-lines/${lineId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify(updates)
      })
      
      if (res.ok) {
        toast.success('Line updated')
        setEditingLine(null)
        fetchIndent()
      }
    } catch (error) {
      toast.error('Failed to update line')
    }
  }

  const handleDeleteLine = async (lineId) => {
    if (!confirm('Delete this line?')) return
    
    try {
      const res = await fetch(`/api/indent-lines/${lineId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getToken()}` }
      })
      
      if (res.ok) {
        toast.success('Line deleted')
        fetchIndent()
      }
    } catch (error) {
      toast.error('Failed to delete line')
    }
  }

  const handleAddLine = async (e) => {
    e.preventDefault()
    try {
      const res = await fetch(`/api/indents/${id}/lines`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({ lines: [newLine] })
      })
      
      if (res.ok) {
        toast.success('Line added')
        setShowAddLineDialog(false)
        setNewLine({ rawDescription: '', quantity: 1, unit: 'NOS' })
        fetchIndent()
      }
    } catch (error) {
      toast.error('Failed to add line')
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      DRAFT: 'bg-slate-100 text-slate-700',
      NORMALIZED: 'bg-purple-100 text-purple-700',
      RFQ_SENT: 'bg-amber-100 text-amber-700'
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

  if (!indent) return null

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/indents')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{indent.indentNumber}</h1>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(indent.status)}`}>
                  {indent.status.replace('_', ' ')}
                </span>
              </div>
              <p className="text-muted-foreground">{indent.title}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleNormalize} disabled={normalizing}>
              <Wand2 className="mr-2 h-4 w-4" />
              {normalizing ? 'Normalizing...' : 'Normalize Items'}
            </Button>
            <Button onClick={() => router.push(`/dashboard/rfqs/new?indentId=${id}`)}>
              <Send className="mr-2 h-4 w-4" />
              Create RFQ
            </Button>
          </div>
        </div>
      </header>

      <div className="p-6">
        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{indent.lines?.length || 0}</div>
              <p className="text-sm text-muted-foreground">Line Items</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {indent.lines?.filter(l => l.normalizedItem).length || 0}
              </div>
              <p className="text-sm text-muted-foreground">Normalized</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{indent.rfqs?.length || 0}</div>
              <p className="text-sm text-muted-foreground">RFQs Sent</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{indent.createdBy?.name}</div>
              <p className="text-sm text-muted-foreground">Created By</p>
            </CardContent>
          </Card>
        </div>

        {/* Line Items */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Line Items</CardTitle>
              <CardDescription>Indent line items and normalized data</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowAddLineDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Line
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-24">Qty</TableHead>
                  <TableHead className="w-24">Unit</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Normalized</TableHead>
                  <TableHead className="w-24">Confidence</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {indent.lines?.map((line) => (
                  <TableRow key={line.id}>
                    <TableCell>{line.lineNumber}</TableCell>
                    <TableCell>
                      {editingLine === line.id ? (
                        <Input
                          defaultValue={line.rawDescription}
                          onBlur={(e) => handleUpdateLine(line.id, { rawDescription: e.target.value })}
                        />
                      ) : (
                        <span className="font-medium">{line.rawDescription}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingLine === line.id ? (
                        <Input
                          type="number"
                          defaultValue={line.quantity}
                          className="w-20"
                          onBlur={(e) => handleUpdateLine(line.id, { quantity: parseFloat(e.target.value) })}
                        />
                      ) : (
                        line.quantity
                      )}
                    </TableCell>
                    <TableCell>{line.unit}</TableCell>
                    <TableCell>
                      {line.normalizedItem ? (
                        <Badge variant="secondary">{line.normalizedItem.category}</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {line.normalizedItem ? (
                        <span className="text-sm">{line.normalizedItem.cleanDescription}</span>
                      ) : (
                        <span className="text-muted-foreground">Not normalized</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {line.normalizedItem ? (
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary" 
                              style={{ width: `${line.normalizedItem.confidence * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {Math.round(line.normalizedItem.confidence * 100)}%
                          </span>
                        </div>
                      ) : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => setEditingLine(editingLine === line.id ? null : line.id)}
                        >
                          {editingLine === line.id ? <Check className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDeleteLine(line.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Add Line Dialog */}
        <Dialog open={showAddLineDialog} onOpenChange={setShowAddLineDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Line Item</DialogTitle>
              <DialogDescription>Add a new item to this indent</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddLine}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    placeholder="e.g., SKF 6205-2RS Bearing"
                    value={newLine.rawDescription}
                    onChange={(e) => setNewLine({...newLine, rawDescription: e.target.value})}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      min="1"
                      value={newLine.quantity}
                      onChange={(e) => setNewLine({...newLine, quantity: parseFloat(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Unit</Label>
                    <Input
                      placeholder="NOS"
                      value={newLine.unit}
                      onChange={(e) => setNewLine({...newLine, unit: e.target.value})}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowAddLineDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit">Add Line</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
