'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Package, FileText, Users, BarChart3, ArrowRight, CheckCircle } from 'lucide-react'

export default function HomePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('login')
  
  // Login form
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  
  // Register form
  const [companyName, setCompanyName] = useState('')
  const [userName, setUserName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')

  useEffect(() => {
    // Check if already logged in
    const token = localStorage.getItem('token')
    if (token) {
      router.push('/dashboard')
    }
  }, [])

  const handleLogin = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Login failed')
      }
      
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      localStorage.setItem('company', JSON.stringify(data.company))
      
      toast.success('Login successful!')
      router.push('/dashboard')
    } catch (error) {
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName,
          userName,
          email: regEmail,
          password: regPassword
        })
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed')
      }
      
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      localStorage.setItem('company', JSON.stringify(data.company))
      
      toast.success('Registration successful!')
      router.push('/dashboard')
    } catch (error) {
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const features = [
    {
      icon: FileText,
      title: 'Smart Indent Processing',
      description: 'Upload indents via PDF, Excel, or text. AI extracts and normalizes line items automatically.'
    },
    {
      icon: Users,
      title: 'Vendor Management',
      description: 'Manage your vendor database. Send RFQs and track responses efficiently.'
    },
    {
      icon: BarChart3,
      title: 'Quote Comparison',
      description: 'Compare vendor quotes side-by-side. AI calculates landed costs and highlights best options.'
    },
    {
      icon: CheckCircle,
      title: 'Decision Workflow',
      description: 'Approve decisions with full audit trail. Export comparison reports for ERP integration.'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">Sourcing Copilot</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition">Features</a>
            <a href="#auth" className="text-muted-foreground hover:text-foreground transition">Get Started</a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
              AI-Powered Procurement for 
              <span className="text-primary"> Industrial Sourcing</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Streamline your RFQ workflow. From indent upload to vendor comparison - 
              automate procurement decisions with intelligent insights.
            </p>
            <div className="flex gap-4">
              <Button size="lg" onClick={() => document.getElementById('auth')?.scrollIntoView({ behavior: 'smooth' })}>
                Get Started <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>
                Learn More
              </Button>
            </div>
          </div>
          
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/5 rounded-3xl blur-3xl" />
            <Card className="relative">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">Sample Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                    <span className="font-medium">SKF 6205-2RS</span>
                    <span className="text-green-600 font-semibold">₹850 (Best)</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <span className="font-medium">SKF 6205-2RS</span>
                    <span className="text-muted-foreground">₹920</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <span className="font-medium">SKF 6205-2RS</span>
                    <span className="text-muted-foreground">₹975</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-white py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Streamline Your Sourcing Workflow</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              From indent creation to final decision - manage the complete RFQ lifecycle with AI assistance.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, idx) => (
              <Card key={idx} className="border-2 hover:border-primary/50 transition-colors">
                <CardHeader>
                  <feature.icon className="h-10 w-10 text-primary mb-2" />
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Auth Section */}
      <section id="auth" className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader className="text-center">
              <CardTitle>Welcome to Sourcing Copilot</CardTitle>
              <CardDescription>Sign in to your account or create a new one</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Sign In</TabsTrigger>
                  <TabsTrigger value="register">Register</TabsTrigger>
                </TabsList>
                
                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="you@company.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password">Password</Label>
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? 'Signing in...' : 'Sign In'}
                    </Button>
                  </form>
                </TabsContent>
                
                <TabsContent value="register">
                  <form onSubmit={handleRegister} className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="company-name">Company Name</Label>
                      <Input
                        id="company-name"
                        placeholder="Acme Industries"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="user-name">Your Name</Label>
                      <Input
                        id="user-name"
                        placeholder="John Doe"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-email">Email</Label>
                      <Input
                        id="reg-email"
                        type="email"
                        placeholder="you@company.com"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-password">Password</Label>
                      <Input
                        id="reg-password"
                        type="password"
                        placeholder="••••••••"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        required
                        minLength={6}
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? 'Creating account...' : 'Create Account'}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="text-center text-sm text-muted-foreground">
              <p className="w-full">By continuing, you agree to our Terms of Service</p>
            </CardFooter>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2025 Sourcing Copilot. AI-Powered Procurement Platform.</p>
        </div>
      </footer>
    </div>
  )
}
