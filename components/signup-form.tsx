"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

interface SignupFormProps {
  onSuccess?: (userData: any) => void
  onError?: (error: string) => void
  className?: string
}

export function SignupForm({ onSuccess, onError, className }: SignupFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    company: '',
    role: '',
    industry: '',
    trinityAgentInterest: [] as string[],
    useCase: '',
    teamSize: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (result.success) {
        // Redirect to trial dashboard
        window.location.href = result.user.accessUrl
        onSuccess?.(result)
      } else {
        onError?.(result.message || 'Registration failed')
      }
    } catch (error) {
      console.error('Registration error:', error)
      onError?.('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAgentInterestChange = (agent: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      trinityAgentInterest: checked 
        ? [...prev.trinityAgentInterest, agent]
        : prev.trinityAgentInterest.filter(a => a !== agent)
    }))
  }

  return (
    <Card className={cn("w-full max-w-2xl mx-auto", className)}>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-semibold text-[#37322F]">
          Start Your Trinity Agent Trial
        </CardTitle>
        <CardDescription className="text-[#605A57]">
          Get 14-day free access to enterprise AI automation. No credit card required.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
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
                placeholder="John Smith"
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
                placeholder="john@company.com"
              />
            </div>
          </div>

          {/* Company Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company" className="text-[#37322F] font-medium">Company</Label>
              <Input
                id="company"
                type="text"
                value={formData.company}
                onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                className="border-[#E0DEDB] focus:border-[#37322F]"
                placeholder="Acme Corporation"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="role" className="text-[#37322F] font-medium">Role</Label>
              <Input
                id="role"
                type="text"
                value={formData.role}
                onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                className="border-[#E0DEDB] focus:border-[#37322F]"
                placeholder="CEO, CTO, Data Analyst..."
              />
            </div>
          </div>

          {/* Business Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="industry" className="text-[#37322F] font-medium">Industry</Label>
              <Select value={formData.industry} onValueChange={(value) => setFormData(prev => ({ ...prev, industry: value }))}>
                <SelectTrigger className="border-[#E0DEDB] focus:border-[#37322F]">
                  <SelectValue placeholder="Select industry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="healthcare">Healthcare</SelectItem>
                  <SelectItem value="finance">Financial Services</SelectItem>
                  <SelectItem value="manufacturing">Manufacturing</SelectItem>
                  <SelectItem value="retail">Retail & E-commerce</SelectItem>
                  <SelectItem value="technology">Technology</SelectItem>
                  <SelectItem value="consulting">Consulting</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="teamSize" className="text-[#37322F] font-medium">Team Size</Label>
              <Select value={formData.teamSize} onValueChange={(value) => setFormData(prev => ({ ...prev, teamSize: value }))}>
                <SelectTrigger className="border-[#E0DEDB] focus:border-[#37322F]">
                  <SelectValue placeholder="Select team size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1-10">1-10 employees</SelectItem>
                  <SelectItem value="11-50">11-50 employees</SelectItem>
                  <SelectItem value="51-200">51-200 employees</SelectItem>
                  <SelectItem value="200+">200+ employees</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Trinity Agent Interest */}
          <div className="space-y-3">
            <Label className="text-[#37322F] font-medium">Which Trinity Agents interest you most?</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="flex items-center space-x-3 p-3 border border-[#E0DEDB] rounded-lg hover:bg-[#F7F5F3] transition-colors">
                <Checkbox
                  id="oracle"
                  checked={formData.trinityAgentInterest.includes('Oracle')}
                  onCheckedChange={(checked) => handleAgentInterestChange('Oracle', checked as boolean)}
                />
                <div className="flex-1">
                  <Label htmlFor="oracle" className="text-sm font-medium text-[#37322F] cursor-pointer">
                    Oracle Analytics
                  </Label>
                  <p className="text-xs text-[#605A57]">Business intelligence & predictive analytics</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 border border-[#E0DEDB] rounded-lg hover:bg-[#F7F5F3] transition-colors">
                <Checkbox
                  id="sentinel"
                  checked={formData.trinityAgentInterest.includes('Sentinel')}
                  onCheckedChange={(checked) => handleAgentInterestChange('Sentinel', checked as boolean)}
                />
                <div className="flex-1">
                  <Label htmlFor="sentinel" className="text-sm font-medium text-[#37322F] cursor-pointer">
                    Sentinel Monitoring
                  </Label>
                  <p className="text-xs text-[#605A57]">Autonomous system monitoring & optimization</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 border border-[#E0DEDB] rounded-lg hover:bg-[#F7F5F3] transition-colors">
                <Checkbox
                  id="sage"
                  checked={formData.trinityAgentInterest.includes('Sage')}
                  onCheckedChange={(checked) => handleAgentInterestChange('Sage', checked as boolean)}
                />
                <div className="flex-1">
                  <Label htmlFor="sage" className="text-sm font-medium text-[#37322F] cursor-pointer">
                    Sage Optimization
                  </Label>
                  <p className="text-xs text-[#605A57]">Intelligent process automation</p>
                </div>
              </div>
            </div>
          </div>

          {/* Use Case */}
          <div className="space-y-2">
            <Label htmlFor="useCase" className="text-[#37322F] font-medium">What's your primary automation goal?</Label>
            <Textarea
              id="useCase"
              value={formData.useCase}
              onChange={(e) => setFormData(prev => ({ ...prev, useCase: e.target.value }))}
              className="border-[#E0DEDB] focus:border-[#37322F] min-h-[80px]"
              placeholder="Describe what you'd like to automate (e.g., data analysis, content generation, system monitoring...)"
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isLoading || !formData.email || !formData.name}
            className="w-full h-12 bg-[#37322F] hover:bg-[#2A2520] text-white font-medium text-base rounded-full transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Creating Your Trial Access...</span>
              </div>
            ) : (
              'Start 14-Day Trinity Agent Trial'
            )}
          </Button>

          {/* Trial Benefits */}
          <div className="text-center text-sm text-[#605A57] space-y-1">
            <p>✅ 14-day free access to all Trinity Agents</p>
            <p>✅ No credit card required • Cancel anytime</p>
            <p>✅ Full enterprise features included</p>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}