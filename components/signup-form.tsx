"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Loader2, Brain, Shield, Sparkles, CheckCircle } from 'lucide-react'

interface SignupFormProps {
  onSuccess?: (data: any) => void
  onError?: (error: string) => void
}

export function SignupForm({ onSuccess, onError }: SignupFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    company: '',
    role: '',
    industry: '',
    teamSize: '',
    useCase: '',
    trinityAgentInterest: [] as string[]
  })

  const trinityAgents = [
    {
      id: 'Oracle',
      name: 'Oracle Analytics',
      description: 'Advanced business intelligence with predictive analytics',
      icon: Brain,
      color: 'text-green-600 bg-green-100 border-green-200'
    },
    {
      id: 'Sentinel',
      name: 'Sentinel Monitoring',
      description: '24/7 autonomous system monitoring and optimization',
      icon: Shield,
      color: 'text-blue-600 bg-blue-100 border-blue-200'
    },
    {
      id: 'Sage',
      name: 'Sage Optimization',
      description: 'Intelligent content generation and process automation',
      icon: Sparkles,
      color: 'text-purple-600 bg-purple-100 border-purple-200'
    }
  ]

  const industries = [
    'Technology',
    'Financial Services',
    'Healthcare',
    'Manufacturing',
    'Retail & E-commerce',
    'Education',
    'Government',
    'Other'
  ]

  const roles = [
    'CEO/Founder',
    'CTO/VP Engineering',
    'Data Scientist',
    'Product Manager',
    'Operations Manager',
    'Business Analyst',
    'Developer',
    'Other'
  ]

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleTrinityAgentToggle = (agentId: string) => {
    setFormData(prev => ({
      ...prev,
      trinityAgentInterest: prev.trinityAgentInterest.includes(agentId)
        ? prev.trinityAgentInterest.filter(id => id !== agentId)
        : [...prev.trinityAgentInterest, agentId]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.email || !formData.name) {
      onError?.('Please fill in all required fields')
      return
    }

    if (formData.trinityAgentInterest.length === 0) {
      onError?.('Please select at least one Trinity Agent to trial')
      return
    }

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

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-semibold text-[#37322F]">
          Start Your Trinity Agent Trial
        </CardTitle>
        <CardDescription>
          Get 14 days of full enterprise access to Oracle, Sentinel, and Sage
        </CardDescription>
        <div className="flex justify-center">
          <Badge className="bg-green-100 text-green-700 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            No Credit Card Required
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="font-medium text-[#37322F]">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="John Smith"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Business Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="john@company.com"
                  required
                />
              </div>
            </div>
          </div>

          {/* Company Information */}
          <div className="space-y-4">
            <h3 className="font-medium text-[#37322F]">Company Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company">Company Name</Label>
                <Input
                  id="company"
                  type="text"
                  value={formData.company}
                  onChange={(e) => handleInputChange('company', e.target.value)}
                  placeholder="Acme Corp"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Your Role</Label>
                <Select value={formData.role} onValueChange={(value) => handleInputChange('role', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role} value={role}>{role}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="industry">Industry</Label>
                <Select value={formData.industry} onValueChange={(value) => handleInputChange('industry', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {industries.map((industry) => (
                      <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="teamSize">Team Size</Label>
                <Select value={formData.teamSize} onValueChange={(value) => handleInputChange('teamSize', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select team size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-10">1-10 people</SelectItem>
                    <SelectItem value="11-50">11-50 people</SelectItem>
                    <SelectItem value="51-200">51-200 people</SelectItem>
                    <SelectItem value="200+">200+ people</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Trinity Agent Selection */}
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-[#37322F] mb-2">Select Trinity Agents to Trial *</h3>
              <p className="text-sm text-[#605A57] mb-4">Choose the AI agents you'd like to experience during your trial</p>
            </div>
            
            <div className="grid gap-3">
              {trinityAgents.map((agent) => {
                const Icon = agent.icon
                const isSelected = formData.trinityAgentInterest.includes(agent.id)
                
                return (
                  <div
                    key={agent.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      isSelected 
                        ? 'border-[#37322F] bg-[#37322F]/5' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleTrinityAgentToggle(agent.id)}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={isSelected}
                        onChange={() => handleTrinityAgentToggle(agent.id)}
                        className="mt-1"
                      />
                      <div className={`p-2 rounded-lg ${agent.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-[#37322F]">{agent.name}</div>
                        <div className="text-sm text-[#605A57] mt-1">{agent.description}</div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Use Case */}
          <div className="space-y-2">
            <Label htmlFor="useCase">Primary Use Case (Optional)</Label>
            <textarea
              id="useCase"
              value={formData.useCase}
              onChange={(e) => handleInputChange('useCase', e.target.value)}
              placeholder="Tell us how you plan to use Trinity Agents in your organization..."
              className="w-full min-h-[80px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#37322F] focus:border-transparent resize-none"
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isLoading || formData.trinityAgentInterest.length === 0}
            className="w-full h-12 bg-[#37322F] hover:bg-[#2A2520] text-white font-medium text-base"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Setting up your Trinity Agent trial...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5 mr-2" />
                Start My Trinity Agent Trial
              </>
            )}
          </Button>

          <div className="text-center">
            <p className="text-xs text-[#605A57]">
              By signing up, you agree to our Terms of Service and Privacy Policy.
              <br />
              Your 14-day trial includes full access to all selected Trinity Agents.
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}