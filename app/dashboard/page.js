'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Package, FileText, Users, Send, BarChart3, Settings, LogOut,
  ChevronRight, Plus, Clock, CheckCircle, AlertCircle
} from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [company, setCompany] = useState(null)
  const [stats, setStats] = useState(null)
  const [recentIndents, setRecentIndents] = useState([])
  const [recentRFQs, setRecentRFQs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/')
      return
    }

    const userData = localStorage.getItem('user')
    const companyData = localStorage.getItem('company')
    if (userData) setUser(JSON.parse(userData))
    if (companyData) setCompany(JSON.parse(companyData))

    fetchDashboardData(token)
  }, [])

  const fetchDashboardData = async (token) => {
    try {
      const headers = { 'Authorization': `Bearer ${token}` }

      const [statsRes, indentsRes, rfqsRes] = await Promise.all([
        fetch('/api/dashboard/stats', { headers }),
        fetch('/api/indents', { headers }),
        fetch('/api/rfqs', { headers })
      ])

      if (statsRes.ok) {
        setStats(await statsRes.json())
      }
      if (indentsRes.ok) {
        const indents = await indentsRes.json()
        setRecentIndents(indents.slice(0, 5))
      }
      if (rfqsRes.ok) {
        const rfqs = await rfqsRes.json()
        setRecentRFQs(rfqs.slice(0, 5))
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('company')
    router.push('/')
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
      CLOSED: 'bg-gray-100 text-gray-700',
      SENT: 'bg-amber-100 text-amber-700',
      PARTIAL_RESPONSE: 'bg-cyan-100 text-cyan-700',
      ALL_RESPONDED: 'bg-green-100 text-green-700'
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
          <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary/10 text-primary font-medium">
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
          <Link href="/dashboard/comparison" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-700">
            <BarChart3 className="h-5 w-5" />
            Comparison
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64">
        {/* Top Bar */}
        <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">{company?.name}</p>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-medium">{user?.name?.[0]?.toUpperCase()}</span>
                </div>
                <span className="hidden sm:inline">{user?.name}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span>{user?.name}</span>
                  <span className="text-xs text-muted-foreground">{user?.email}</span>
                  <span className="text-xs text-muted-foreground capitalize">{user?.role?.toLowerCase()}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/dashboard/settings')}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* Dashboard Content */}
        <div className="p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Indents</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.activeIndents || 0}</div>
                <p className="text-xs text-muted-foreground">Indents in progress</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending RFQs</CardTitle>
                <Send className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.pendingRFQs || 0}</div>
                <p className="text-xs text-muted-foreground">Awaiting responses</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Quotes</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.pendingQuotes || 0}</div>
                <p className="text-xs text-muted-foreground">Vendors to respond</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recent Decisions</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.recentDecisions || 0}</div>
                <p className="text-xs text-muted-foreground">Last 7 days</p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Button 
              variant="outline" 
              className="h-auto py-4 justify-start"
              onClick={() => router.push('/dashboard/indents/new')}
            >
              <Plus className="mr-2 h-5 w-5" />
              <div className="text-left">
                <div className="font-medium">New Indent</div>
                <div className="text-xs text-muted-foreground">Upload or create indent</div>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-auto py-4 justify-start"
              onClick={() => router.push('/dashboard/vendors/new')}
            >
              <Users className="mr-2 h-5 w-5" />
              <div className="text-left">
                <div className="font-medium">Add Vendor</div>
                <div className="text-xs text-muted-foreground">Register new vendor</div>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-auto py-4 justify-start"
              onClick={() => router.push('/dashboard/comparison')}
            >
              <BarChart3 className="mr-2 h-5 w-5" />
              <div className="text-left">
                <div className="font-medium">Compare Quotes</div>
                <div className="text-xs text-muted-foreground">View comparisons</div>
              </div>
            </Button>
          </div>

          {/* Recent Items */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Indents */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Recent Indents</CardTitle>
                  <CardDescription>Latest indent requests</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/indents')}>
                  View All <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                {recentIndents.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No indents yet</p>
                    <Button variant="link" onClick={() => router.push('/dashboard/indents/new')}>
                      Create your first indent
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentIndents.map((indent) => (
                      <Link 
                        key={indent.id} 
                        href={`/dashboard/indents/${indent.id}`}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition"
                      >
                        <div>
                          <div className="font-medium">{indent.indentNumber}</div>
                          <div className="text-sm text-muted-foreground">{indent.title}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(indent.status)}`}>
                            {indent.status.replace('_', ' ')}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {indent._count?.lines || 0} items
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent RFQs */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Recent RFQs</CardTitle>
                  <CardDescription>Latest RFQ activity</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/rfqs')}>
                  View All <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                {recentRFQs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Send className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No RFQs yet</p>
                    <p className="text-sm">Create an indent first to send RFQs</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentRFQs.map((rfq) => (
                      <Link 
                        key={rfq.id} 
                        href={`/dashboard/rfqs/${rfq.id}`}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition"
                      >
                        <div>
                          <div className="font-medium">{rfq.rfqNumber}</div>
                          <div className="text-sm text-muted-foreground">{rfq.title}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(rfq.status)}`}>
                            {rfq.status.replace('_', ' ')}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {rfq.vendors?.length || 0} vendors
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
