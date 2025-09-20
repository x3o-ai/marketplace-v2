"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, CheckCircle, Calendar, Users, Shield } from 'lucide-react'
import Link from 'next/link'

export default function ContactSalesPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    role: '',
    phone: '',
    employees: '',
    timeline: '',
    budget: '',
    message: '',
    plan: 'enterprise'
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate API call
    setTimeout(() => {
      setSubmitted(true)
      setIsSubmitting(false)
    }, 2000)
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#F7F5F3] flex items-center justify-center p-6">
        <Card className="w-full max-w-2xl">
          <CardContent className="p-8 text-center space-y-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold text-[#37322F]">
                Thank you, {formData.name}!
              </h1>
              <p className="text-[#605A57]">
                Your enterprise inquiry has been received. Our Trinity Agent specialists will contact you within 2 business hours.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-800 mb-2">Next Steps:</h3>
              <div className="space-y-2 text-sm text-blue-700">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Enterprise consultation call scheduled</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>Custom Trinity Agent deployment planning</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  <span>Enterprise security and compliance review</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <Button asChild className="w-full bg-[#37322F] hover:bg-[#2A2520] text-white">
                <Link href="/">Return to x3o.ai</Link>
              </Button>
              
              <p className="text-xs text-[#605A57]">
                In the meantime, you can start a free trial to explore Trinity Agent capabilities.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F7F5F3]">
      {/* Header */}
      <div className="border-b border-[rgba(55,50,47,0.12)] bg-white">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-[#37322F] no-underline">
              <ArrowLeft className="h-4 w-4" />
              <span className="text-xl font-semibold">x3o.ai</span>
            </Link>
            <div className="flex items-center gap-2">
              <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                Enterprise Sales
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Sales Content */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Left Side - Enterprise Value */}
          <div className="space-y-6">
            <div className="space-y-4">
              <h1 className="text-3xl lg:text-4xl font-semibold text-[#37322F] leading-tight">
                Enterprise Trinity Agent Deployment
              </h1>
              <p className="text-lg text-[#605A57]">
                Transform your entire organization with custom Trinity Agent implementation. 
                Our enterprise specialists will design the perfect automation strategy for your business.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium text-[#37322F]">Enterprise features include:</h3>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-medium text-[#37322F]">Complete Trinity Agent Suite</div>
                    <div className="text-sm text-[#605A57]">Oracle, Sentinel, and Sage agents with unlimited usage</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center mt-0.5">
                    <CheckCircle className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <div className="font-medium text-[#37322F]">Custom Implementation</div>
                    <div className="text-sm text-[#605A57]">Dedicated onboarding and system integration</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <div className="font-medium text-[#37322F]">Enterprise Support</div>
                    <div className="text-sm text-[#605A57]">24/7 priority support with dedicated success manager</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center mt-0.5">
                    <CheckCircle className="h-4 w-4 text-orange-600" />
                  </div>
                  <div>
                    <div className="font-medium text-[#37322F]">Security & Compliance</div>
                    <div className="text-sm text-[#605A57]">SOC2, GDPR compliance with SSO integration</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-[#37322F]/5 border border-[#37322F]/20 rounded-lg">
              <div className="text-sm text-[#37322F]">
                <strong>Enterprise ROI:</strong> Organizations deploying AgentTrinity Pro report 
                $2.3M+ annual savings and 85% operational efficiency improvements.
              </div>
            </div>
          </div>

          {/* Right Side - Contact Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-[#37322F]">
                Speak with a Trinity Agent Specialist
              </CardTitle>
              <CardDescription className="text-[#605A57]">
                Get a custom enterprise automation strategy for your organization
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-[#37322F] font-medium">Full Name *</Label>
                    <Input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      required
                      className="border-[#E0DEDB] focus:border-[#37322F]"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-[#37322F] font-medium">Business Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      required
                      className="border-[#E0DEDB] focus:border-[#37322F]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company" className="text-[#37322F] font-medium">Company *</Label>
                    <Input
                      id="company"
                      type="text"
                      value={formData.company}
                      onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                      required
                      className="border-[#E0DEDB] focus:border-[#37322F]"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="role" className="text-[#37322F] font-medium">Role *</Label>
                    <Input
                      id="role"
                      type="text"
                      value={formData.role}
                      onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                      required
                      className="border-[#E0DEDB] focus:border-[#37322F]"
                      placeholder="CEO, CTO, VP Operations..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-[#37322F] font-medium">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className="border-[#E0DEDB] focus:border-[#37322F]"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="employees" className="text-[#37322F] font-medium">Company Size</Label>
                    <Select value={formData.employees} onValueChange={(value) => setFormData(prev => ({ ...prev, employees: value }))}>
                      <SelectTrigger className="border-[#E0DEDB] focus:border-[#37322F]">
                        <SelectValue placeholder="Select company size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="50-200">50-200 employees</SelectItem>
                        <SelectItem value="200-1000">200-1,000 employees</SelectItem>
                        <SelectItem value="1000-5000">1,000-5,000 employees</SelectItem>
                        <SelectItem value="5000+">5,000+ employees</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="timeline" className="text-[#37322F] font-medium">Implementation Timeline</Label>
                    <Select value={formData.timeline} onValueChange={(value) => setFormData(prev => ({ ...prev, timeline: value }))}>
                      <SelectTrigger className="border-[#E0DEDB] focus:border-[#37322F]">
                        <SelectValue placeholder="Select timeline" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="immediate">Immediate (0-30 days)</SelectItem>
                        <SelectItem value="quarter">This quarter (1-3 months)</SelectItem>
                        <SelectItem value="year">This year (3-12 months)</SelectItem>
                        <SelectItem value="planning">Planning phase</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="budget" className="text-[#37322F] font-medium">Annual Budget Range</Label>
                    <Select value={formData.budget} onValueChange={(value) => setFormData(prev => ({ ...prev, budget: value }))}>
                      <SelectTrigger className="border-[#E0DEDB] focus:border-[#37322F]">
                        <SelectValue placeholder="Select budget range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="50k-100k">$50K - $100K</SelectItem>
                        <SelectItem value="100k-500k">$100K - $500K</SelectItem>
                        <SelectItem value="500k-1m">$500K - $1M</SelectItem>
                        <SelectItem value="1m+">$1M+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message" className="text-[#37322F] font-medium">Project Details</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                    className="border-[#E0DEDB] focus:border-[#37322F] min-h-[100px]"
                    placeholder="Tell us about your automation goals, current challenges, and which departments you'd like to transform with Trinity Agents..."
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting || !formData.name || !formData.email || !formData.company}
                  className="w-full h-12 bg-[#37322F] hover:bg-[#2A2520] text-white font-medium text-base rounded-full"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Submitting Enterprise Inquiry...</span>
                    </div>
                  ) : (
                    'Schedule Enterprise Consultation'
                  )}
                </Button>

                <div className="text-center text-sm text-[#605A57] space-y-1">
                  <p>✅ Response within 2 business hours</p>
                  <p>✅ Custom Trinity Agent deployment strategy</p>
                  <p>✅ Enterprise security and compliance review</p>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}