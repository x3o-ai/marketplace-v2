"use client"

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, Shield, Zap, Send, Loader2, Sparkles, ArrowRight, Lightbulb, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { OnboardingStepProps } from '@/types/onboarding'

interface AgentResponse {
  query: string
  response: string
  confidence: number
  processingTime: number
  insights: string[]
  actionable: boolean
}

const AGENT_CONFIGS = {
  oracle: {
    name: 'Oracle Analytics',
    icon: Brain,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    accentColor: 'bg-green-500',
    placeholder: 'Ask Oracle to predict your business metrics...',
    suggestedQueries: [
      'Predict our Q4 revenue based on current trends',
      'What factors are driving our customer churn?',
      'Identify our highest-value customer segments',
      'Forecast demand for our top products next month'
    ],
    demoResponse: {
      query: 'Predict our Q4 revenue based on current trends',
      response: 'Based on current market trends and your historical data, Q4 revenue is projected at $284,650 with 94% confidence. I\'ve identified 3 key growth opportunities that could increase this by 15-23%.',
      confidence: 94,
      processingTime: 1200,
      insights: [
        'Customer acquisition rate increased 18% this quarter',
        'Premium product sales trending 34% above last year',
        'Seasonal demand patterns suggest December spike opportunity'
      ],
      actionable: true
    }
  },
  sentinel: {
    name: 'Sentinel Monitoring',
    icon: Shield,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    accentColor: 'bg-blue-500',
    placeholder: 'Ask Sentinel about system performance...',
    suggestedQueries: [
      'Check our system health and identify any issues',
      'What optimizations can improve our app performance?',
      'Monitor our database for potential bottlenecks',
      'Analyze our server response times this week'
    ],
    demoResponse: {
      query: 'Check our system health and identify any issues',
      response: 'System health is optimal at 99.2% uptime. I\'ve detected 3 minor performance opportunities and prevented 2 potential issues before they affected users.',
      confidence: 99,
      processingTime: 800,
      insights: [
        'Database query optimization could improve response time by 23%',
        'Memory usage spike prevented through auto-scaling',
        'SSL certificate renewal scheduled for next week'
      ],
      actionable: true
    }
  },
  sage: {
    name: 'Sage Optimization',
    icon: Zap,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    accentColor: 'bg-purple-500',
    placeholder: 'Ask Sage to optimize your content or processes...',
    suggestedQueries: [
      'Create a marketing email for our new product launch',
      'Optimize our checkout process to reduce abandonment',
      'Generate social media content for this week',
      'Improve our customer onboarding workflow'
    ],
    demoResponse: {
      query: 'Create a marketing email for our new product launch',
      response: 'I\'ve created a high-converting email campaign with a compelling subject line and clear CTA. Based on your audience data, this approach typically achieves 34% higher engagement.',
      confidence: 87,
      processingTime: 1500,
      insights: [
        'Subject line A/B testing could increase open rates by 12%',
        'Personalized product recommendations boost CTR by 45%',
        'Optimal send time: Tuesday 2pm in recipient timezone'
      ],
      actionable: true
    }
  }
}

export function FirstInteractionStep({ step, onComplete, progress }: OnboardingStepProps) {
  const [selectedAgent, setSelectedAgent] = useState<'oracle' | 'sentinel' | 'sage'>('oracle')
  const [query, setQuery] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [response, setResponse] = useState<AgentResponse | null>(null)
  const [showSuggestions, setShowSuggestions] = useState(true)
  const [step1Complete, setStep1Complete] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Get agent from progress data if available
  useEffect(() => {
    if (progress.completionData?.selectedAgent) {
      setSelectedAgent(progress.completionData.selectedAgent)
    }
  }, [progress])

  const agentConfig = AGENT_CONFIGS[selectedAgent]
  const AgentIcon = agentConfig.icon

  const handleSuggestedQuery = (suggestedQuery: string) => {
    setQuery(suggestedQuery)
    setShowSuggestions(false)
    inputRef.current?.focus()
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!query.trim() || isProcessing) return

    setIsProcessing(true)
    setShowSuggestions(false)

    // Simulate API call
    setTimeout(() => {
      setResponse(agentConfig.demoResponse)
      setIsProcessing(false)
      setStep1Complete(true)
    }, 2000)
  }

  const handleTryAnother = () => {
    setQuery('')
    setResponse(null)
    setShowSuggestions(true)
    inputRef.current?.focus()
  }

  const handleComplete = () => {
    onComplete({
      firstInteraction: {
        agent: selectedAgent,
        query: query,
        response: response?.response,
        confidence: response?.confidence,
        processingTime: response?.processingTime,
        timestamp: new Date().toISOString()
      },
      userSatisfaction: 'positive',
      readyForNext: true
    })
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className={`inline-flex items-center justify-center w-16 h-16 ${agentConfig.bgColor} rounded-xl border border-gray-200 mb-4`}>
          <AgentIcon className={`h-8 w-8 ${agentConfig.color}`} />
        </div>
        <h2 className="text-3xl font-bold text-[#37322F]">
          Try Your First {agentConfig.name} Query
        </h2>
        <p className="text-lg text-[#605A57] max-w-2xl mx-auto">
          Let's see {agentConfig.name} in action! Ask a question related to your business 
          and experience the power of AI-driven insights.
        </p>
      </div>

      {/* Main Interaction Area */}
      <Card className="border-2 border-gray-100 shadow-lg">
        <CardHeader className={`${agentConfig.bgColor} border-b`}>
          <CardTitle className="flex items-center gap-3">
            <AgentIcon className={`h-6 w-6 ${agentConfig.color}`} />
            <span>{agentConfig.name} Demo</span>
            <Badge variant="secondary" className="text-xs">Interactive</Badge>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="p-6 space-y-6">
          {/* Query Input */}
          <div className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#37322F]">
                  Ask {agentConfig.name} anything:
                </label>
                <div className="relative">
                  <Textarea
                    ref={inputRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={agentConfig.placeholder}
                    className="min-h-[80px] pr-12"
                    disabled={isProcessing}
                  />
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!query.trim() || isProcessing}
                    className={`absolute bottom-2 right-2 ${agentConfig.accentColor} hover:opacity-90 text-white`}
                  >
                    {isProcessing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </form>

            {/* Suggested Queries */}
            <AnimatePresence>
              {showSuggestions && !response && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <div className="flex items-center gap-2 text-sm text-[#605A57]">
                    <Lightbulb className="h-4 w-4" />
                    <span>Try these sample queries:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {agentConfig.suggestedQueries.map((suggested, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => handleSuggestedQuery(suggested)}
                        className="text-xs h-auto py-2 px-3 hover:bg-gray-50"
                      >
                        {suggested}
                      </Button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Processing State */}
          {isProcessing && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 ${agentConfig.bgColor} rounded-lg border border-gray-200`}
            >
              <div className="flex items-center gap-3">
                <Loader2 className={`h-5 w-5 animate-spin ${agentConfig.color}`} />
                <div>
                  <h4 className={`font-medium ${agentConfig.color}`}>
                    {agentConfig.name} is processing...
                  </h4>
                  <p className="text-sm text-gray-600">
                    Analyzing your query and generating insights
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Response */}
          <AnimatePresence>
            {response && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {/* Main Response */}
                <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 ${agentConfig.accentColor} rounded-lg flex items-center justify-center flex-shrink-0`}>
                      <AgentIcon className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#37322F]">{agentConfig.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {response.confidence}% confidence
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {response.processingTime}ms
                        </span>
                      </div>
                      <p className="text-gray-700">{response.response}</p>
                    </div>
                  </div>
                </div>

                {/* Insights */}
                <div className={`p-4 ${agentConfig.bgColor} rounded-lg`}>
                  <h4 className={`font-medium ${agentConfig.color} mb-3 flex items-center gap-2`}>
                    <Sparkles className="h-4 w-4" />
                    Key Insights
                  </h4>
                  <ul className="space-y-2">
                    {response.insights.map((insight, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                        <div className={`w-1.5 h-1.5 ${agentConfig.accentColor} rounded-full mt-2 flex-shrink-0`} />
                        {insight}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="text-center space-y-4">
        {step1Complete && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className={`inline-flex items-center gap-2 px-4 py-2 ${agentConfig.bgColor} rounded-full text-sm ${agentConfig.color} font-medium`}>
              <Sparkles className="h-4 w-4" />
              Great! You've completed your first {agentConfig.name} interaction
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                variant="outline"
                onClick={handleTryAnother}
                className="flex items-center gap-2"
              >
                <MessageSquare className="h-4 w-4" />
                Try Another Query
              </Button>
              
              <Button
                onClick={handleComplete}
                className="bg-[#37322F] hover:bg-[#2A2520] text-white flex items-center gap-2"
              >
                This is Amazing! Continue
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>

            <p className="text-sm text-[#605A57]">
              You can explore more agents and advanced features next
            </p>
          </motion.div>
        )}

        {!step1Complete && !response && (
          <div className="text-sm text-[#605A57]">
            💡 Pro tip: Start with a suggested query for the best experience
          </div>
        )}
      </div>
    </div>
  )
}