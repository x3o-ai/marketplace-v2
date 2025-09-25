"use client"

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  ArrowRight, 
  CheckCircle, 
  Sparkles, 
  Zap, 
  Users, 
  BarChart3, 
  Settings,
  Bell,
  Shield,
  Calendar,
  MessageSquare,
  FileText
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { OnboardingStepProps } from '@/types/onboarding'

interface Feature {
  id: string
  name: string
  description: string
  icon: any
  category: 'analytics' | 'automation' | 'collaboration' | 'security'
  enabled: boolean
  popular: boolean
  comingSoon?: boolean
}

const ADVANCED_FEATURES: Feature[] = [
  {
    id: 'custom_dashboards',
    name: 'Custom Dashboards',
    description: 'Create personalized analytics dashboards with drag-and-drop widgets',
    icon: BarChart3,
    category: 'analytics',
    enabled: true,
    popular: true
  },
  {
    id: 'workflow_automation',
    name: 'Workflow Automation',
    description: 'Set up automated workflows that trigger based on specific conditions',
    icon: Zap,
    category: 'automation',
    enabled: true,
    popular: true
  },
  {
    id: 'team_collaboration',
    name: 'Team Collaboration',
    description: 'Share insights and collaborate with team members in real-time',
    icon: Users,
    category: 'collaboration',
    enabled: false,
    popular: false
  },
  {
    id: 'smart_alerts',
    name: 'Smart Alerts',
    description: 'Get intelligent notifications when important metrics change',
    icon: Bell,
    category: 'automation',
    enabled: true,
    popular: true
  },
  {
    id: 'advanced_security',
    name: 'Advanced Security',
    description: 'Enterprise-grade security with SSO and audit logs',
    icon: Shield,
    category: 'security',
    enabled: false,
    popular: false
  },
  {
    id: 'scheduled_reports',
    name: 'Scheduled Reports',
    description: 'Automatically generate and send reports on a schedule',
    icon: Calendar,
    category: 'automation',
    enabled: true,
    popular: false
  },
  {
    id: 'ai_chat',
    name: 'AI Chat Interface',
    description: 'Chat directly with Trinity Agents using natural language',
    icon: MessageSquare,
    category: 'collaboration',
    enabled: false,
    popular: true,
    comingSoon: true
  },
  {
    id: 'custom_integrations',
    name: 'Custom Integrations',
    description: 'Connect Trinity Agents to your existing tools and systems',
    icon: Settings,
    category: 'automation',
    enabled: false,
    popular: false
  }
]

const CATEGORY_INFO = {
  analytics: { name: 'Analytics', color: 'text-green-600', bgColor: 'bg-green-50' },
  automation: { name: 'Automation', color: 'text-blue-600', bgColor: 'bg-blue-50' },
  collaboration: { name: 'Collaboration', color: 'text-purple-600', bgColor: 'bg-purple-50' },
  security: { name: 'Security', color: 'text-red-600', bgColor: 'bg-red-50' }
}

export function FeatureDiscoveryStep({ step, onComplete }: OnboardingStepProps) {
  const [features, setFeatures] = useState<Feature[]>(ADVANCED_FEATURES)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [exploredFeatures, setExploredFeatures] = useState<Set<string>>(new Set())

  const toggleFeature = (featureId: string) => {
    setFeatures(prev => prev.map(f => 
      f.id === featureId ? { ...f, enabled: !f.enabled } : f
    ))
    setExploredFeatures(prev => new Set(prev).add(featureId))
  }

  const handleExploreFeature = (featureId: string) => {
    setExploredFeatures(prev => new Set(prev).add(featureId))
  }

  const handleContinue = () => {
    const enabledFeatures = features.filter(f => f.enabled).map(f => f.id)
    
    onComplete({
      enabledFeatures,
      exploredFeatures: Array.from(exploredFeatures),
      customization: {
        preferences: enabledFeatures,
        explorationLevel: exploredFeatures.size
      },
      readyForCompletion: true,
      timestamp: new Date().toISOString()
    })
  }

  const filteredFeatures = selectedCategory 
    ? features.filter(f => f.category === selectedCategory)
    : features

  const popularFeatures = features.filter(f => f.popular)
  const enabledCount = features.filter(f => f.enabled).length

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold text-[#37322F]">
          Discover Advanced Features
        </h2>
        <p className="text-lg text-[#605A57] max-w-3xl mx-auto">
          Trinity Agents offer powerful advanced features to supercharge your workflow. 
          Explore and enable the ones that matter most to your business.
        </p>
        <div className="flex items-center justify-center gap-4 text-sm">
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            {enabledCount} features enabled
          </Badge>
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            {exploredFeatures.size} explored
          </Badge>
        </div>
      </div>

      {/* Popular Features Highlight */}
      <div className="bg-gradient-to-r from-[#37322F] to-[#2A2520] rounded-xl p-6 text-white">
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Most Popular Features
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {popularFeatures.map(feature => {
            const Icon = feature.icon
            return (
              <div key={feature.id} className="flex items-center gap-3 p-3 bg-white/10 rounded-lg">
                <Icon className="h-5 w-5" />
                <div>
                  <div className="font-medium">{feature.name}</div>
                  <div className="text-sm opacity-80">{CATEGORY_INFO[feature.category].name}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex justify-center">
        <div className="flex items-center bg-white rounded-full p-1 shadow-md border">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              selectedCategory === null 
                ? 'bg-[#37322F] text-white' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            All Features
          </button>
          {Object.entries(CATEGORY_INFO).map(([key, info]) => (
            <button
              key={key}
              onClick={() => setSelectedCategory(key)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedCategory === key 
                  ? `${info.bgColor} ${info.color}` 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {info.name}
            </button>
          ))}
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredFeatures.map((feature, index) => {
          const Icon = feature.icon
          const categoryInfo = CATEGORY_INFO[feature.category]
          const isExplored = exploredFeatures.has(feature.id)
          
          return (
            <motion.div
              key={feature.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`relative transition-all hover:shadow-lg ${
                feature.enabled ? 'ring-2 ring-[#37322F] bg-green-50' : ''
              } ${feature.comingSoon ? 'opacity-75' : ''}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className={`w-10 h-10 ${categoryInfo.bgColor} rounded-lg flex items-center justify-center`}>
                      <Icon className={`h-5 w-5 ${categoryInfo.color}`} />
                    </div>
                    <div className="flex items-center gap-2">
                      {feature.popular && (
                        <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
                          Popular
                        </Badge>
                      )}
                      {feature.comingSoon && (
                        <Badge variant="outline" className="text-xs">
                          Soon
                        </Badge>
                      )}
                      {!feature.comingSoon && (
                        <Switch
                          checked={feature.enabled}
                          onCheckedChange={() => toggleFeature(feature.id)}
                        />
                      )}
                    </div>
                  </div>
                  <CardTitle className="text-lg">{feature.name}</CardTitle>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  <p className="text-sm text-[#605A57]">{feature.description}</p>
                  
                  <div className="flex items-center justify-between">
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${categoryInfo.color} border-current`}
                    >
                      {categoryInfo.name}
                    </Badge>
                    
                    {!isExplored && !feature.comingSoon && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleExploreFeature(feature.id)}
                        className="text-xs h-6 px-2"
                      >
                        Learn More
                      </Button>
                    )}
                    
                    {isExplored && (
                      <div className="flex items-center gap-1 text-xs text-green-600">
                        <CheckCircle className="h-3 w-3" />
                        Explored
                      </div>
                    )}
                  </div>
                </CardContent>

                {feature.enabled && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center"
                  >
                    <CheckCircle className="h-4 w-4 text-white" />
                  </motion.div>
                )}
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Summary & Continue */}
      <div className="text-center space-y-6">
        <div className="p-6 bg-gray-50 rounded-xl">
          <h4 className="font-semibold text-[#37322F] mb-3">Your Customization Summary</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{enabledCount}</div>
              <div className="text-gray-600">Features Enabled</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{exploredFeatures.size}</div>
              <div className="text-gray-600">Features Explored</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {Math.round((enabledCount / features.length) * 100)}%
              </div>
              <div className="text-gray-600">Setup Complete</div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <Button
            size="lg"
            onClick={handleContinue}
            className="bg-[#37322F] hover:bg-[#2A2520] text-white px-8 py-4"
          >
            Perfect! Let's Finish Setup
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
          
          <p className="text-sm text-[#605A57]">
            Don't worry - you can always change these settings later from your dashboard
          </p>
        </div>
      </div>
    </div>
  )
}