"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Building, Users, Target, Clock, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { OnboardingStepProps } from '@/types/onboarding'

interface ProfileData {
  companyName: string
  industry: string
  companySize: string
  role: string
  department: string
  primaryUseCase: string
  experienceLevel: string
  timeAvailable: string
  specificGoals: string
}

const INDUSTRIES = [
  'Technology', 'Healthcare', 'Financial Services', 'Manufacturing', 
  'Retail', 'Education', 'Government', 'Non-profit', 'Other'
]

const COMPANY_SIZES = [
  '1-10 employees', '11-50 employees', '51-200 employees', 
  '201-1000 employees', '1000+ employees'
]

const ROLES = [
  'CEO/Founder', 'CTO/VP Engineering', 'Data Scientist', 'Business Analyst',
  'Operations Manager', 'Marketing Director', 'Product Manager', 'Other'
]

const DEPARTMENTS = [
  'Executive', 'Engineering', 'Data/Analytics', 'Operations', 
  'Marketing', 'Sales', 'Finance', 'HR', 'Other'
]

const USE_CASES = [
  'Business Analytics & Reporting', 'System Monitoring & Optimization', 
  'Content Generation & Marketing', 'Process Automation', 'All of the above'
]

export function ProfileSetupStep({ step, onComplete }: OnboardingStepProps) {
  const [formData, setFormData] = useState<ProfileData>({
    companyName: '',
    industry: '',
    companySize: '',
    role: '',
    department: '',
    primaryUseCase: '',
    experienceLevel: 'intermediate',
    timeAvailable: 'thorough',
    specificGoals: ''
  })

  const [errors, setErrors] = useState<Partial<ProfileData>>({})
  const [currentSection, setCurrentSection] = useState(0)

  const sections = [
    {
      title: 'Company Information',
      icon: Building,
      fields: ['companyName', 'industry', 'companySize']
    },
    {
      title: 'Your Role',
      icon: Users,
      fields: ['role', 'department']
    },
    {
      title: 'Your Goals',
      icon: Target,
      fields: ['primaryUseCase', 'specificGoals']
    },
    {
      title: 'Preferences',
      icon: Clock,
      fields: ['experienceLevel', 'timeAvailable']
    }
  ]

  const validateSection = (sectionIndex: number): boolean => {
    const section = sections[sectionIndex]
    const newErrors: Partial<ProfileData> = {}
    let hasErrors = false

    section.fields.forEach(field => {
      if (!formData[field as keyof ProfileData] && field !== 'specificGoals') {
        newErrors[field as keyof ProfileData] = 'This field is required'
        hasErrors = true
      }
    })

    setErrors(newErrors)
    return !hasErrors
  }

  const handleNext = () => {
    if (validateSection(currentSection)) {
      if (currentSection < sections.length - 1) {
        setCurrentSection(currentSection + 1)
      } else {
        handleComplete()
      }
    }
  }

  const handleComplete = () => {
    onComplete({
      profile: formData,
      completedAt: new Date().toISOString(),
      personalization: {
        onboardingPath: determineOnboardingPath(formData),
        primaryAgent: determinePrimaryAgent(formData),
        complexity: formData.experienceLevel
      }
    })
  }

  const determineOnboardingPath = (data: ProfileData): string => {
    if (data.role.includes('CEO') || data.role.includes('Founder')) return 'executive'
    if (data.role.includes('CTO') || data.role.includes('Engineer')) return 'technical'
    if (data.department.includes('Marketing')) return 'marketing'
    return 'standard'
  }

  const determinePrimaryAgent = (data: ProfileData): string => {
    if (data.primaryUseCase.includes('Analytics')) return 'oracle'
    if (data.primaryUseCase.includes('Monitoring')) return 'sentinel'
    if (data.primaryUseCase.includes('Content')) return 'sage'
    return 'oracle' // Default
  }

  const updateFormData = (field: keyof ProfileData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const currentSectionData = sections[currentSection]
  const SectionIcon = currentSectionData.icon
  const progress = ((currentSection + 1) / sections.length) * 100

  return (
    <div className="max-w-3xl mx-auto">
      {/* Progress Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-[#37322F]">Tell us about yourself</h2>
          <div className="text-sm text-[#605A57]">
            {currentSection + 1} of {sections.length}
          </div>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2">
          <motion.div
            className="bg-[#37322F] h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Section Navigation */}
      <div className="flex justify-center mb-8">
        <div className="flex items-center gap-4">
          {sections.map((section, index) => {
            const Icon = section.icon
            const isActive = index === currentSection
            const isCompleted = index < currentSection
            
            return (
              <div
                key={index}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive 
                    ? 'bg-[#37322F] text-white' 
                    : isCompleted 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-500'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden md:inline">{section.title}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Form Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <SectionIcon className="h-6 w-6 text-[#37322F]" />
            {currentSectionData.title}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSection}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {/* Company Information */}
              {currentSection === 0 && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                      id="companyName"
                      value={formData.companyName}
                      onChange={(e) => updateFormData('companyName', e.target.value)}
                      placeholder="Enter your company name"
                      className={errors.companyName ? 'border-red-500' : ''}
                    />
                    {errors.companyName && (
                      <p className="text-red-500 text-sm">{errors.companyName}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="industry">Industry</Label>
                    <Select value={formData.industry} onValueChange={(value) => updateFormData('industry', value)}>
                      <SelectTrigger className={errors.industry ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Select your industry" />
                      </SelectTrigger>
                      <SelectContent>
                        {INDUSTRIES.map(industry => (
                          <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.industry && (
                      <p className="text-red-500 text-sm">{errors.industry}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companySize">Company Size</Label>
                    <Select value={formData.companySize} onValueChange={(value) => updateFormData('companySize', value)}>
                      <SelectTrigger className={errors.companySize ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Select company size" />
                      </SelectTrigger>
                      <SelectContent>
                        {COMPANY_SIZES.map(size => (
                          <SelectItem key={size} value={size}>{size}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.companySize && (
                      <p className="text-red-500 text-sm">{errors.companySize}</p>
                    )}
                  </div>
                </>
              )}

              {/* Your Role */}
              {currentSection === 1 && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="role">Your Role</Label>
                    <Select value={formData.role} onValueChange={(value) => updateFormData('role', value)}>
                      <SelectTrigger className={errors.role ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLES.map(role => (
                          <SelectItem key={role} value={role}>{role}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.role && (
                      <p className="text-red-500 text-sm">{errors.role}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Select value={formData.department} onValueChange={(value) => updateFormData('department', value)}>
                      <SelectTrigger className={errors.department ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Select your department" />
                      </SelectTrigger>
                      <SelectContent>
                        {DEPARTMENTS.map(dept => (
                          <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.department && (
                      <p className="text-red-500 text-sm">{errors.department}</p>
                    )}
                  </div>
                </>
              )}

              {/* Your Goals */}
              {currentSection === 2 && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="primaryUseCase">Primary Use Case</Label>
                    <Select value={formData.primaryUseCase} onValueChange={(value) => updateFormData('primaryUseCase', value)}>
                      <SelectTrigger className={errors.primaryUseCase ? 'border-red-500' : ''}>
                        <SelectValue placeholder="What's your main goal?" />
                      </SelectTrigger>
                      <SelectContent>
                        {USE_CASES.map(useCase => (
                          <SelectItem key={useCase} value={useCase}>{useCase}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.primaryUseCase && (
                      <p className="text-red-500 text-sm">{errors.primaryUseCase}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="specificGoals">Specific Goals (Optional)</Label>
                    <Textarea
                      id="specificGoals"
                      value={formData.specificGoals}
                      onChange={(e) => updateFormData('specificGoals', e.target.value)}
                      placeholder="Tell us about any specific goals or challenges you'd like to address..."
                      rows={3}
                    />
                  </div>
                </>
              )}

              {/* Preferences */}
              {currentSection === 3 && (
                <>
                  <div className="space-y-3">
                    <Label>Experience Level with AI Tools</Label>
                    <RadioGroup
                      value={formData.experienceLevel}
                      onValueChange={(value) => updateFormData('experienceLevel', value)}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="beginner" id="beginner" />
                        <Label htmlFor="beginner">Beginner - I'm new to AI tools</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="intermediate" id="intermediate" />
                        <Label htmlFor="intermediate">Intermediate - I've used some AI tools</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="expert" id="expert" />
                        <Label htmlFor="expert">Expert - I'm very familiar with AI</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="space-y-3">
                    <Label>How much time do you have for setup?</Label>
                    <RadioGroup
                      value={formData.timeAvailable}
                      onValueChange={(value) => updateFormData('timeAvailable', value)}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="quick" id="quick" />
                        <Label htmlFor="quick">Quick setup (5 minutes) - Show me the essentials</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="thorough" id="thorough" />
                        <Label htmlFor="thorough">Thorough setup (15 minutes) - I want to see everything</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex justify-between pt-6">
            <Button
              variant="outline"
              onClick={() => setCurrentSection(Math.max(0, currentSection - 1))}
              disabled={currentSection === 0}
            >
              Previous
            </Button>

            <Button
              onClick={handleNext}
              className="bg-[#37322F] hover:bg-[#2A2520] text-white"
            >
              {currentSection === sections.length - 1 ? 'Complete Setup' : 'Continue'}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}