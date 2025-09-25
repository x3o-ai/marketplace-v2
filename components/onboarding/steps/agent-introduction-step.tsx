"use client"

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Brain, Shield, Zap, Play, ArrowRight, CheckCircle, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { OnboardingStepProps } from '@/types/onboarding'

const TRINITY_AGENTS = [
  {
    id: 'oracle',
    name: 'Oracle Analytics',
    icon: Brain,
    tagline: 'Predict the future of your business',
    description: 'Advanced business intelligence with predictive analytics that helps you make data-driven decisions with 94% accuracy.',
    keyBenefits: [
      'Revenue forecasting with machine learning',
      'Customer behavior prediction',
      'Market trend analysis and insights',
      'Automated risk assessment'
    ],
    realWorldExample: 'Helped TechCorp increase quarterly revenue by 23% through predictive customer behavior analysis',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    accentColor: 'bg-green-500'
  },
  {
    id: 'sentinel',
    name: 'Sentinel Monitoring',
    icon: Shield,
    tagline: 'Protect and optimize your systems 24/7',
    description: 'Autonomous system monitoring that prevents issues before they occur and maintains 99.8% uptime for your critical systems.',
    keyBenefits: [
      'Real-time system health monitoring',
      'Predictive maintenance alerts',
      'Automated performance optimization',
      'Security threat detection'
    ],
    realWorldExample: 'Reduced FinanceFlow\'s system downtime by 94% and prevented 156 potential outages last month',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    accentColor: 'bg-blue-500'
  },
  {
    id: 'sage',
    name: 'Sage Optimization',
    icon: Zap,
    tagline: 'Automate and optimize everything',
    description: 'Intelligent process automation and content generation that improves efficiency by 340% while maintaining brand consistency.',
    keyBenefits: [
      'High-converting content creation',
      'Marketing campaign optimization',
      'Workflow automation',
      'Brand consistency management'
    ],
    realWorldExample: 'Increased GrowthCorp\'s content engagement by 87% while reducing production time by 78%',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    accentColor: 'bg-purple-500'
  }
]

export function AgentIntroductionStep({ step, onComplete }: OnboardingStepProps) {
  const [currentAgent, setCurrentAgent] = useState(0)
  const [watchedAgents, setWatchedAgents] = useState<Set<number>>(new Set())
  const [showDetails, setShowDetails] = useState<number | null>(null)

  const handleWatchDemo = (agentIndex: number) => {
    setWatchedAgents(prev => new Set(prev).add(agentIndex))
    // In real implementation, this would play a demo video
    setTimeout(() => {
      setShowDetails(agentIndex)
    }, 1000)
  }

  const handleContinue = () => {
    onComplete({
      introducedAgents: TRINITY_AGENTS.map(agent => agent.id),
      watchedDemos: Array.from(watchedAgents),
      timeSpent: Date.now(),
      readyToChoose: true
    })
  }

  const agent = TRINITY_AGENTS[currentAgent]
  const Icon = agent.icon

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold text-[#37322F]">
          Meet Your Trinity Agents
        </h2>
        <p className="text-lg text-[#605A57] max-w-3xl mx-auto">
          Each Trinity Agent is a specialized AI system designed to transform different aspects of your business. 
          Together, they form a powerful ecosystem of automation and intelligence.
        </p>
      </div>

      {/* Agent Navigation */}
      <div className="flex justify-center mb-8">
        <div className="flex items-center bg-white rounded-full p-1 shadow-lg border">
          {TRINITY_AGENTS.map((agentItem, index) => {
            const AgentIcon = agentItem.icon
            const isActive = currentAgent === index
            const hasWatched = watchedAgents.has(index)
            
            return (
              <button
                key={agentItem.id}
                onClick={() => setCurrentAgent(index)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  isActive 
                    ? `${agentItem.bgColor} ${agentItem.color}` 
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <AgentIcon className="h-4 w-4" />
                <span className="hidden md:inline">{agentItem.name}</span>
                {hasWatched && <CheckCircle className="h-3 w-3 text-green-500" />}
              </button>
            )
          })}
        </div>
      </div>

      {/* Main Agent Display */}
      <motion.div
        key={currentAgent}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start"
      >
        {/* Left Side - Agent Info */}
        <div className="space-y-6">
          <div className={`p-6 ${agent.bgColor} rounded-xl border border-gray-100`}>
            <div className="flex items-center gap-4 mb-4">
              <div className={`w-12 h-12 ${agent.accentColor} rounded-lg flex items-center justify-center`}>
                <Icon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-[#37322F]">{agent.name}</h3>
                <p className={`${agent.color} font-medium`}>{agent.tagline}</p>
              </div>
            </div>
            
            <p className="text-[#605A57] mb-4">{agent.description}</p>
            
            <div className="space-y-2 mb-4">
              <h4 className="font-semibold text-[#37322F] text-sm">Key Benefits:</h4>
              <ul className="space-y-1">
                {agent.keyBenefits.map((benefit, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-[#605A57]">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="p-3 bg-white rounded-lg border border-gray-200">
              <div className="flex items-start gap-2">
                <TrendingUp className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h5 className="font-medium text-xs text-[#37322F] mb-1">Success Story:</h5>
                  <p className="text-xs text-[#605A57]">{agent.realWorldExample}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => handleWatchDemo(currentAgent)}
              disabled={watchedAgents.has(currentAgent)}
              className={`flex-1 ${agent.accentColor} hover:opacity-90 text-white`}
            >
              {watchedAgents.has(currentAgent) ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Demo Watched
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Watch 2-min Demo
                </>
              )}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => setShowDetails(showDetails === currentAgent ? null : currentAgent)}
              className="flex-1"
            >
              {showDetails === currentAgent ? 'Hide Details' : 'Learn More'}
            </Button>
          </div>
        </div>

        {/* Right Side - Demo/Details */}
        <div className="space-y-4">
          {watchedAgents.has(currentAgent) && showDetails === currentAgent && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl border shadow-lg p-6"
            >
              <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Icon className={`h-5 w-5 ${agent.color}`} />
                How {agent.name} Works
              </h4>
              
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h5 className="font-medium text-sm mb-2">Sample Interaction:</h5>
                  <div className="space-y-2">
                    <div className="bg-blue-100 p-2 rounded text-xs">
                      <strong>You:</strong> "Show me our revenue forecast for Q4"
                    </div>
                    <div className="bg-green-100 p-2 rounded text-xs">
                      <strong>{agent.name}:</strong> "Based on current trends, Q4 revenue is projected at $284,650 with 94% confidence. I've identified 3 growth opportunities that could increase this by 15%."
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">94%</div>
                    <div className="text-xs text-green-700">Accuracy Rate</div>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">&lt;5s</div>
                    <div className="text-xs text-blue-700">Response Time</div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {!watchedAgents.has(currentAgent) && (
            <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl p-8 text-center">
              <Icon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h4 className="font-semibold text-gray-600 mb-2">Demo Preview</h4>
              <p className="text-sm text-gray-500 mb-4">
                See {agent.name} in action with a live demonstration
              </p>
              <Button
                onClick={() => handleWatchDemo(currentAgent)}
                variant="outline"
                className="border-dashed"
              >
                <Play className="h-4 w-4 mr-2" />
                Start Demo
              </Button>
            </div>
          )}
        </div>
      </motion.div>

      {/* Progress Indicator */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 text-sm text-[#605A57] mb-6">
          <span>{watchedAgents.size} of {TRINITY_AGENTS.length} agents explored</span>
          <div className="flex gap-1">
            {TRINITY_AGENTS.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full ${
                  watchedAgents.has(index) ? 'bg-green-500' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>

        {watchedAgents.size >= 1 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Button
              size="lg"
              onClick={handleContinue}
              className="bg-[#37322F] hover:bg-[#2A2520] text-white px-8 py-4"
            >
              Ready to Choose My Starting Agent
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
            <p className="text-xs text-[#605A57] mt-2">
              {watchedAgents.size === 1 
                ? "Great start! You can explore more agents anytime." 
                : "Excellent! You've seen multiple agents in action."}
            </p>
          </motion.div>
        )}
      </div>
    </div>
  )
}