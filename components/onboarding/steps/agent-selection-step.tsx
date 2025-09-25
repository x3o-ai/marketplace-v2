"use client"

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Brain, Shield, Zap, ArrowRight, CheckCircle, BarChart3, Activity, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { OnboardingStepProps } from '@/types/onboarding'

interface AgentOption {
  id: 'oracle' | 'sentinel' | 'sage'
  name: string
  icon: any
  description: string
  capabilities: string[]
  idealFor: string[]
  demoScenario: string
  color: string
  bgColor: string
  borderColor: string
}

const AGENT_OPTIONS: AgentOption[] = [
  {
    id: 'oracle',
    name: 'Oracle Analytics',
    icon: Brain,
    description: 'Advanced business intelligence with predictive analytics and explainable AI decisions.',
    capabilities: [
      'Revenue forecasting with 94% accuracy',
      'Customer behavior prediction',
      'Market trend analysis',
      'Risk assessment automation',
      'ROI optimization recommendations'
    ],
    idealFor: [
      'CEOs and executives',
      'Business analysts',
      'Finance teams',
      'Strategic planners'
    ],
    demoScenario: 'Predict next quarter\'s revenue and identify growth opportunities',
    color: 'text-green-700',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  },
  {
    id: 'sentinel',
    name: 'Sentinel Monitoring',
    icon: Shield,
    description: '24/7 autonomous system monitoring with intelligent optimization and 99.8% uptime.',
    capabilities: [
      'Real-time system monitoring',
      'Predictive maintenance alerts',
      'Performance optimization',
      'Security threat detection',
      'Automated incident response'
    ],
    idealFor: [
      'CTOs and engineering teams',
      'DevOps engineers',
      'System administrators',
      'IT operations'
    ],
    demoScenario: 'Monitor your systems and prevent issues before they occur',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  },
  {
    id: 'sage',
    name: 'Sage Optimization',
    icon: Zap,
    description: 'Intelligent process automation and content generation with 87% engagement improvement.',
    capabilities: [
      'High-converting content creation',
      'Marketing campaign optimization',
      'Process automation workflows',
      'Brand consistency management',
      'Performance analytics'
    ],
    idealFor: [
      'Marketing directors',
      'Content creators',
      'Operations managers',
      'Growth teams'
    ],
    demoScenario: 'Generate marketing content and automate your workflows',
    color: 'text-purple-700',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200'
  }
]

export function AgentSelectionStep({ step, onComplete }: OnboardingStepProps) {
  const [selectedAgent, setSelectedAgent] = useState<'oracle' | 'sentinel' | 'sage' | null>(null)
  const [showDetails, setShowDetails] = useState<string | null>(null)

  const handleAgentSelect = (agentId: 'oracle' | 'sentinel' | 'sage') => {
    setSelectedAgent(agentId)
  }

  const handleContinue = () => {
    if (selectedAgent) {
      onComplete({
        selectedAgent,
        timestamp: new Date().toISOString(),
        nextStep: `${selectedAgent}_setup`
      })
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold text-[#37322F]">
          Choose Your First Trinity Agent
        </h2>
        <p className="text-lg text-[#605A57] max-w-2xl mx-auto">
          Each Trinity Agent specializes in different areas. You can explore all three later, 
          but let's start with the one that matches your primary goal.
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full text-sm text-blue-700">
          <CheckCircle className="h-4 w-4" />
          Don't worry - you'll have access to all agents during your trial
        </div>
      </div>

      {/* Agent Options */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {AGENT_OPTIONS.map((agent, index) => {
          const Icon = agent.icon
          const isSelected = selectedAgent === agent.id
          const showingDetails = showDetails === agent.id

          return (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative"
            >
              <Card 
                className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                  isSelected 
                    ? `ring-2 ring-[#37322F] ${agent.bgColor}` 
                    : 'hover:shadow-md'
                }`}
                onClick={() => handleAgentSelect(agent.id)}
              >
                <CardHeader className="text-center pb-4">
                  <div className={`w-16 h-16 ${agent.bgColor} rounded-xl flex items-center justify-center mx-auto mb-4 ${agent.borderColor} border`}>
                    <Icon className={`h-8 w-8 ${agent.color}`} />
                  </div>
                  <CardTitle className="text-xl mb-2">{agent.name}</CardTitle>
                  <p className="text-sm text-[#605A57]">{agent.description}</p>
                  
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-[#37322F] rounded-full flex items-center justify-center"
                    >
                      <CheckCircle className="h-4 w-4 text-white" />
                    </motion.div>
                  )}
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Key Capabilities */}
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Key Capabilities:</h4>
                    <ul className="space-y-1">
                      {agent.capabilities.slice(0, 3).map((capability, idx) => (
                        <li key={idx} className="text-xs text-[#605A57] flex items-start gap-2">
                          <div className={`w-1.5 h-1.5 ${agent.bgColor.replace('bg-', 'bg-')} rounded-full mt-1.5 flex-shrink-0`} />
                          {capability}
                        </li>
                      ))}
                      {agent.capabilities.length > 3 && (
                        <li className="text-xs text-[#37322F] font-medium">
                          +{agent.capabilities.length - 3} more capabilities
                        </li>
                      )}
                    </ul>
                  </div>

                  {/* Demo Scenario */}
                  <div className={`p-3 ${agent.bgColor} rounded-lg ${agent.borderColor} border`}>
                    <h5 className={`font-medium text-xs ${agent.color} mb-1`}>Demo Scenario:</h5>
                    <p className="text-xs text-gray-700">{agent.demoScenario}</p>
                  </div>

                  {/* Ideal For */}
                  <div>
                    <h5 className="font-medium text-xs text-[#37322F] mb-2">Ideal for:</h5>
                    <div className="flex flex-wrap gap-1">
                      {agent.idealFor.slice(0, 2).map((role, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {role}
                        </Badge>
                      ))}
                      {agent.idealFor.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{agent.idealFor.length - 2} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* View Details */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs"
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowDetails(showingDetails ? null : agent.id)
                    }}
                  >
                    {showingDetails ? 'Hide Details' : 'View Details'}
                  </Button>
                </CardContent>

                {/* Expanded Details */}
                {showingDetails && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border-t border-gray-200 p-4 space-y-3"
                  >
                    <div>
                      <h5 className="font-semibold text-sm mb-2">All Capabilities:</h5>
                      <ul className="space-y-1">
                        {agent.capabilities.map((capability, idx) => (
                          <li key={idx} className="text-xs text-[#605A57] flex items-start gap-2">
                            <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                            {capability}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h5 className="font-semibold text-sm mb-2">Perfect for teams focused on:</h5>
                      <ul className="space-y-1">
                        {agent.idealFor.map((role, idx) => (
                          <li key={idx} className="text-xs text-[#605A57] flex items-start gap-2">
                            <div className={`w-2 h-2 ${agent.color.replace('text-', 'bg-')} rounded-full mt-1 flex-shrink-0`} />
                            {role}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                )}
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Selection Summary */}
      {selectedAgent && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-6"
        >
          <div className="p-6 bg-gradient-to-r from-[#37322F] to-[#2A2520] rounded-xl text-white">
            <h3 className="text-xl font-semibold mb-3">
              Great choice! Let's set up {AGENT_OPTIONS.find(a => a.id === selectedAgent)?.name}
            </h3>
            <p className="text-gray-200 mb-4">
              We'll walk you through a quick demo and help you get your first results in just a few minutes.
            </p>
            <div className="flex items-center justify-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                <span>Interactive demo</span>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                <span>Real results</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                <span>5-minute setup</span>
              </div>
            </div>
          </div>

          <Button
            size="lg"
            onClick={handleContinue}
            className="bg-[#37322F] hover:bg-[#2A2520] text-white px-8 py-4 text-lg font-semibold"
          >
            Set Up {AGENT_OPTIONS.find(a => a.id === selectedAgent)?.name}
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
        </motion.div>
      )}

      {/* Helper Text */}
      <div className="text-center text-sm text-[#605A57] pt-4">
        Remember: This is just your starting point. You'll have full access to all Trinity Agents during your trial.
      </div>
    </div>
  )
}