'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Package, FileText, Users, Send, BarChart3, ArrowLeft, CheckCircle, 
  TrendingDown, Clock, Download
} from 'lucide-react'

export default function ComparisonPage() {
  const router = useRouter()
  const [indents, setIndents] = useState([])
  const [selectedIndent, setSelectedIndent] = useState('')
  const [comparison, setComparison] = useState(null)
  const [decisions, setDecisions] = useState({})
  const [loading, setLoading] = useState(true)
  const [loadingComparison, setLoadingComparison] = useState(false)
  const [approving, setApproving] = useState(false)
  const [exporting, setExporting] = useState(false)

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
        const data = await res.json()
        // Filter indents that have quotes
        setIndents(data.filter(i => ['QUOTES_RECEIVED', 'COMPARED', 'DECIDED'].includes(i.status) || i._count?.rfqs > 0))
      }
    } catch (error) {
      toast.error('Failed to fetch indents')
    } finally {
      setLoading(false)
    }
  }

  const fetchComparison = async (indentId) => {
    setLoadingComparison(true)
    try {
      const res = await fetch(`/api/indents/${indentId}/comparison`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      })
      if (res.ok) {
        const data = await res.json()
        setComparison(data)
        
        // Pre-select lowest cost vendors
        const autoDecisions = {}
        data.comparison.forEach(line => {
          if (line.lowestCostVendor && line.vendors[line.lowestCostVendor]) {
            autoDecisions[line.lineId] = line.vendors[line.lowestCostVendor].quoteLineId
          }
        })
        setDecisions(autoDecisions)
      }
    } catch (error) {
      toast.error('Failed to fetch comparison')
    } finally {
      setLoadingComparison(false)
    }
  }

  const handleIndentChange = (indentId) => {
    setSelectedIndent(indentId)
    setComparison(null)
    setDecisions({})
    if (indentId) {
      fetchComparison(indentId)
    }
  }

  const handleSelectVendor = (lineId, quoteLineId) => {
    setDecisions(prev => ({
      ...prev,
      [lineId]: quoteLineId
    }))
  }

  const handleApproveDecisions = async () => {
    const decisionsArray = Object.entries(decisions).map(([indentLineId, selectedQuoteLineId]) => ({
      indentLineId,
      selectedQuoteLineId
    }))

    if (decisionsArray.length === 0) {
      toast.error('Please select vendors for at least one line item')
      return
    }

    setApproving(true)
    try {
      const res = await fetch('/api/decisions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({
          indentId: selectedIndent,
          decisions: decisionsArray
        })
      })

      if (res.ok) {
        toast.success('Decisions approved successfully!')
        fetchIndents()
      } else {
        const data = await res.json()
        throw new Error(data.error || 'Failed to approve decisions')
      }
    } catch (error) {
      toast.error(error.message)
    } finally {
      setApproving(false)
    }
  }

  const handleExportExcel = async () => {
    if (!selectedIndent) {
      toast.error('Please select an indent first')
      return
    }

    setExporting(true)
    try {
      const res = await fetch(`/api/indents/${selectedIndent}/export`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      })

      if (!res.ok) {
        throw new Error('Export failed')
      }

      // Download the file
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `comparison_report.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success('Comparison report downloaded!')
    } catch (error) {
      toast.error(error.message || 'Failed to export')
    } finally {
      setExporting(false)
    }
  }

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '-'
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  // Get unique vendors from comparison
  const getUniqueVendors = () => {
    if (!comparison) return []
    const vendorMap = new Map()
    comparison.comparison.forEach(line => {
      Object.entries(line.vendors).forEach(([vendorId, data]) => {
        if (!vendorMap.has(vendorId)) {
          vendorMap.set(vendorId, data.vendorName)
        }
      })
    })
    return Array.from(vendorMap.entries())
  }

  const vendors = getUniqueVendors()

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
          <Link href="/dashboard/rfqs" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-700">
            <Send className="h-5 w-5" />
            RFQs
          </Link>
          <Link href="/dashboard/comparison" className="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary/10 text-primary font-medium">
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
                <h1 className="text-2xl font-bold">Quote Comparison</h1>
                <p className="text-muted-foreground">Compare vendor quotes and make decisions</p>
              </div>
            </div>
            
            {comparison && (
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleExportExcel} disabled={exporting}>
                  <Download className="mr-2 h-4 w-4" />
                  {exporting ? 'Exporting...' : 'Export Excel'}
                </Button>
                <Button onClick={handleApproveDecisions} disabled={approving}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  {approving ? 'Approving...' : 'Approve Decisions'}
                </Button>
              </div>
            )}
          </div>
        </header>

        <div className="p-6">
          {/* Indent Selection */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Select Indent</CardTitle>
              <CardDescription>Choose an indent to compare vendor quotes</CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={selectedIndent} onValueChange={handleIndentChange}>
                <SelectTrigger className="max-w-md">
                  <SelectValue placeholder="Select an indent with quotes" />
                </SelectTrigger>
                <SelectContent>
                  {indents.map((indent) => (
                    <SelectItem key={indent.id} value={indent.id}>
                      {indent.indentNumber} - {indent.title} ({indent._count?.lines || 0} items)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {indents.length === 0 && !loading && (
                <p className="text-sm text-muted-foreground mt-4">
                  No indents with quotes available. Create RFQs and upload vendor quotes first.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Loading State */}
          {loadingComparison && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          )}

          {/* Comparison Table */}
          {comparison && !loadingComparison && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FileText className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{comparison.comparison.length}</p>
                        <p className="text-sm text-muted-foreground">Line Items</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
                        <Users className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{vendors.length}</p>
                        <p className="text-sm text-muted-foreground">Vendors Quoted</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-lg bg-amber-100 flex items-center justify-center">
                        <CheckCircle className="h-6 w-6 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{Object.keys(decisions).length}</p>
                        <p className="text-sm text-muted-foreground">Selections Made</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Comparison Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Side-by-Side Comparison</CardTitle>
                  <CardDescription>
                    Click on a vendor's row to select them. Green highlight = lowest cost, Blue = lowest lead time.
                  </CardDescription>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  {comparison.comparison.length === 0 || vendors.length === 0 ? (
                    <div className="text-center py-12">
                      <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <p className="text-muted-foreground">No quotes available for comparison</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Upload vendor quotes to see the comparison
                      </p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="sticky left-0 bg-white z-10 min-w-[200px]">#</TableHead>
                          <TableHead className="sticky left-0 bg-white z-10 min-w-[300px]">Item Description</TableHead>
                          <TableHead className="text-center">Qty</TableHead>
                          {vendors.map(([vendorId, vendorName]) => (
                            <TableHead key={vendorId} className="text-center min-w-[180px]">
                              <div className="font-medium">{vendorName}</div>
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {comparison.comparison.map((line) => (
                          <TableRow key={line.lineId}>
                            <TableCell className="sticky left-0 bg-white font-medium">
                              {line.lineNumber}
                            </TableCell>
                            <TableCell className="sticky left-0 bg-white">
                              <div className="max-w-[280px]">
                                <p className="font-medium truncate" title={line.description}>
                                  {line.description}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              {line.quantity} {line.unit}
                            </TableCell>
                            {vendors.map(([vendorId, vendorName]) => {
                              const vendorData = line.vendors[vendorId]
                              const isLowestCost = vendorId === line.lowestCostVendor
                              const isLowestTime = vendorId === line.lowestLeadTimeVendor
                              const isSelected = decisions[line.lineId] === vendorData?.quoteLineId

                              return (
                                <TableCell 
                                  key={vendorId} 
                                  className={`text-center cursor-pointer transition-colors ${
                                    isSelected 
                                      ? 'bg-primary/20 ring-2 ring-primary ring-inset' 
                                      : isLowestCost 
                                        ? 'bg-green-50 hover:bg-green-100' 
                                        : 'hover:bg-slate-50'
                                  }`}
                                  onClick={() => vendorData && handleSelectVendor(line.lineId, vendorData.quoteLineId)}
                                >
                                  {vendorData ? (
                                    <div className="space-y-1">
                                      <div className="flex items-center justify-center gap-1">
                                        <span className={`font-bold ${
                                          isLowestCost ? 'text-green-600' : ''
                                        }`}>
                                          {formatCurrency(vendorData.landedCost)}
                                        </span>
                                        {isLowestCost && (
                                          <TrendingDown className="h-4 w-4 text-green-600" />
                                        )}
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        Unit: {formatCurrency(vendorData.unitPrice)}
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        GST: {vendorData.gstPercent}%
                                      </div>
                                      {vendorData.leadTimeDays && (
                                        <div className={`flex items-center justify-center gap-1 text-xs ${
                                          isLowestTime ? 'text-blue-600 font-medium' : 'text-muted-foreground'
                                        }`}>
                                          <Clock className="h-3 w-3" />
                                          {vendorData.leadTimeDays} days
                                        </div>
                                      )}
                                      {vendorData.brand && (
                                        <Badge variant="outline" className="text-xs">
                                          {vendorData.brand}
                                        </Badge>
                                      )}
                                      {isSelected && (
                                        <div className="mt-2">
                                          <Badge variant="default" className="text-xs">
                                            <CheckCircle className="h-3 w-3 mr-1" />
                                            Selected
                                          </Badge>
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground">-</span>
                                  )}
                                </TableCell>
                              )
                            })}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              {/* Legend */}
              <div className="mt-4 flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded bg-green-100 border border-green-300"></div>
                  <span className="text-muted-foreground">Lowest Cost</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded bg-primary/20 border-2 border-primary"></div>
                  <span className="text-muted-foreground">Selected</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span className="text-muted-foreground">Lowest Lead Time</span>
                </div>
              </div>
            </>
          )}

          {/* Empty State */}
          {!selectedIndent && !loading && (
            <div className="text-center py-12">
              <BarChart3 className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">No Indent Selected</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Select an indent above to view and compare vendor quotes. 
                Make sure you have uploaded quotes from vendors first.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
