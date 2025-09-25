"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  CheckCircle, 
  Sparkles, 
  ArrowRight, 
  Calendar, 
  BookOpen, 
  MessageCircle,
  Gift,
  Star,
  Zap,
  Users,
  TrendingUp
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { OnboardingStepProps } from '@/types/onboarding'

interface NextStep {
  id: string
  title: string
  description: string
  icon: any
  action: string
  priority: 'high' | 'medium' | 'low'
}

const NEXT_STEPS: NextStep[] = [
  {
    id: 'first_real_query',
    title: 'Try a Real Business Query',
    description: 'Use your actual business data with Trinity Agents',
    icon: Zap,
    action: 'Go to Dashboard',
    priority: 'high'
  },
  {
    id: 'schedule_onboarding',
    title: 'Schedule Implementation Call',
    description: 'Get personalized setup help from our success team',
    icon: Calendar,
    action: 'Schedule Call',
    priority: 'high'
  },
  {
    id: 'explore_integrations',
    title: 'Connect Your Tools',
    description: 'Integrate with your existing business systems',
    icon: Users,
    action: 'View Integrations',
    priority: 'medium'
  },
  {
    id: 'invite_team',
    title: 'Invite Your Team',
    description: 'Collaborate with colleagues on Trinity Agent insights',
    icon: Users,
    action: 'Invite Team',
    priority: 'medium'
  }
]

const RESOURCES = [
  {
    title: 'Trinity Agent Documentation',
    description: 'Complete guides and API references',
    icon: BookOpen,
    link: '/docs'
  },
  {
    title: 'Video Tutorials',
    description: 'Learn advanced features step by step',
    icon: Star,
    link: '/tutorials'
  },
  {
    title: 'Community Forum',
    description: 'Connect with other Trinity Agent users',
    icon: MessageCircle,
    link: '/community'
  }
]

export function CompletionStep({ step, onComplete }: OnboardingStepProps) {
  const [showCelebration, setShowCelebration] = useState(true)
  const [selectedNextSteps, setSelectedNextSteps] = useState<Set<string>>(new Set())

  useEffect(() => {
    // Auto-select high priority next steps
    setSelectedNextSteps(new Set(NEXT_STEPS.filter(s => s.priority === 'high').map(s => s.id)))
  }, [])

  const toggleNextStep = (stepId: string) => {
    setSelectedNextSteps(prev => {
      const newSet = new Set(prev)
      if (newSet.has(stepId)) {
        newSet.delete(stepId)
      } else {
        newSet.add(stepId)
      }
      return newSet
    })
  }

  const handleFinish = () => {
    onComplete({
      onboardingCompleted: true,
      selectedNextSteps: Array.from(selectedNextSteps),
      completionTimestamp: new Date().toISOString(),
      readyForDashboard: true,
      trialActivated: true
    })
  }

  const handleGoToDashboard = () => {
    // This would redirect to the main dashboard
    window.location.href = '/trial-dashboard'
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Celebration Header */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", duration: 0.6 }}
        className="text-center space-y-6"
      >
        <div className="relative">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full mb-6"
          >
            <CheckCircle className="h-12 w-12 text-white" />
          </motion.div>
          
          {/* Success particles */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
            className="absolute inset-0 pointer-events-none"
          >
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  x: 0, 
                  y: 0, 
                  opacity: 0,
                  scale: 0 
                }}
                animate={{ 
                  x: Math.cos(i * 45 * Math.PI / 180) * 60,
                  y: Math.sin(i * 45 * Math.PI / 180) * 60,
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0]
                }}
                transition={{ 
                  duration: 2, 
                  delay: i * 0.1,
                  repeat: Infinity,
                  repeatDelay: 3
                }}
                className="absolute left-1/2 top-1/2 w-2 h-2 bg-green-400 rounded-full"
              />
            ))}
          </motion.div>
        </div>
        
        <div className="space-y-4">
          <h2 className="text-4xl font-bold text-[#37322F]">
            Welcome to Trinity Agents! 🚀
          </h2>
          <p className="text-xl text-[#605A57] max-w-3xl mx-auto leading-relaxed">
            Congratulations! You've successfully set up your Trinity Agent workspace. 
            Your 14-day trial is now active with full enterprise features.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="flex justify-center">
          <div className="grid grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">100%</div>
              <div className="text-sm text-[#605A57]">Setup Complete</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">14 Days</div>
              <div className="text-sm text-[#605A57]">Trial Access</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">3</div>
              <div className="text-sm text-[#605A57]">Trinity Agents</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Trial Benefits */}
      <div className="bg-gradient-to-r from-[#37322F] to-[#2A2520] rounded-xl p-8 text-white">
        <h3 className="text-2xl font-semibold mb-6 text-center">
          Your Trial Includes Everything
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
          <div className="space-y-2">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mx-auto">
              <Zap className="h-6 w-6" />
            </div>
            <h4 className="font-medium">Unlimited Queries</h4>
            <p className="text-sm opacity-80">No limits on Trinity Agent interactions</p>
          </div>
          <div className="space-y-2">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mx-auto">
              <TrendingUp className="h-6 w-6" />
            </div>
            <h4 className="font-medium">Advanced Analytics</h4>
            <p className="text-sm opacity-80">Full access to predictive insights</p>
          </div>
          <div className="space-y-2">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mx-auto">
              <Users className="h-6 w-6" />
            </div>
            <h4 className="font-medium">Team Collaboration</h4>
            <p className="text-sm opacity-80">Invite unlimited team members</p>
          </div>
          <div className="space-y-2">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mx-auto">
              <Gift className="h-6 w-6" />
            </div>
            <h4 className="font-medium">Premium Support</h4>
            <p className="text-sm opacity-80">Priority assistance and onboarding</p>
          </div>
        </div>
      </div>

      {/* Next Steps */}
      <div className="space-y-6">
        <h3 className="text-2xl font-bold text-[#37322F] text-center">
          Recommended Next Steps
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {NEXT_STEPS.map((nextStep, index) => {
            const Icon = nextStep.icon
            const isSelected = selectedNextSteps.has(nextStep.id)
            
            return (
              <motion.div
                key={nextStep.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card 
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    isSelected ? 'ring-2 ring-[#37322F] bg-green-50' : ''
                  }`}
                  onClick={() => toggleNextStep(nextStep.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        nextStep.priority === 'high' 
                          ? 'bg-red-100 text-red-600' 
                          : 'bg-blue-100 text-blue-600'
                      }`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-[#37322F]">{nextStep.title}</h4>
                          <Badge 
                            variant={nextStep.priority === 'high' ? 'destructive' : 'secondary'}
                            className="text-xs"
                          >
                            {nextStep.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-[#605A57] mb-2">{nextStep.description}</p>
                        <Button size="sm" variant="outline" className="text-xs h-6">
                          {nextStep.action}
                        </Button>
                      </div>
                      
                      {isSelected && (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Resources */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-[#37322F] text-center">
          Helpful Resources
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {RESOURCES.map((resource, index) => {
            const Icon = resource.icon
            
            return (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 text-center">
                  <Icon className="h-8 w-8 text-[#37322F] mx-auto mb-3" />
                  <h4 className="font-medium text-[#37322F] mb-1">{resource.title}</h4>
                  <p className="text-sm text-[#605A57] mb-3">{resource.description}</p>
                  <Button size="sm" variant="ghost" className="text-xs">
                    Learn More
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Final CTA */}
      <div className="text-center space-y-6">
        <div className="p-6 bg-green-50 rounded-xl border border-green-200">
          <h4 className="font-semibold text-green-800 mb-2">
            🎉 Your Trinity Agent trial is now active!
          </h4>
          <p className="text-green-700 text-sm">
            You have full access to all enterprise features for the next 14 days. 
            Start exploring real business insights today.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            size="lg"
            onClick={handleGoToDashboard}
            className="bg-[#37322F] hover:bg-[#2A2520] text-white px-8 py-4"
          >
            <Sparkles className="h-5 w-5 mr-2" />
            Go to My Dashboard
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
          
          <Button
            size="lg"
            variant="outline"
            onClick={handleFinish}
            className="px-8 py-4"
          >
            I'll Explore Later
          </Button>
        </div>

        <p className="text-sm text-[#605A57]">
          Questions? Our success team is here to help you get the most out of Trinity Agents.
        </p>
      </div>
    </div>
  )
}