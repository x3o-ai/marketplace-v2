"use client"

import { useState, useEffect, createContext, useContext, ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  HelpCircle, 
  X, 
  ChevronRight, 
  Lightbulb, 
  BookOpen, 
  Video, 
  MessageCircle,
  ExternalLink,
  ArrowRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

// Context for managing help state
interface HelpContextType {
  isHelpMode: boolean
  setHelpMode: (enabled: boolean) => void
  currentTour: string | null
  startTour: (tourId: string) => void
  endTour: () => void
  showHelp: (helpId: string) => void
  hideHelp: () => void
  trackHelpUsage: (action: string, helpId?: string) => void
}

const HelpContext = createContext<HelpContextType | undefined>(undefined)

export function HelpProvider({ children }: { children: ReactNode }) {
  const [isHelpMode, setIsHelpMode] = useState(false)
  const [currentTour, setCurrentTour] = useState<string | null>(null)
  const [activeHelpId, setActiveHelpId] = useState<string | null>(null)

  const setHelpMode = (enabled: boolean) => {
    setIsHelpMode(enabled)
    if (enabled) {
      trackHelpUsage('help_mode_enabled')
    } else {
      trackHelpUsage('help_mode_disabled')
      setActiveHelpId(null)
    }
  }

  const startTour = (tourId: string) => {
    setCurrentTour(tourId)
    setIsHelpMode(true)
    trackHelpUsage('tour_started', tourId)
  }

  const endTour = () => {
    if (currentTour) {
      trackHelpUsage('tour_completed', currentTour)
    }
    setCurrentTour(null)
    setIsHelpMode(false)
  }

  const showHelp = (helpId: string) => {
    setActiveHelpId(helpId)
    trackHelpUsage('help_viewed', helpId)
  }

  const hideHelp = () => {
    setActiveHelpId(null)
  }

  const trackHelpUsage = async (action: string, helpId?: string) => {
    try {
      await fetch('/api/onboarding/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType: 'HELP_USED',
          eventData: { action, helpId, timestamp: new Date().toISOString() }
        })
      })
    } catch (error) {
      console.error('Failed to track help usage:', error)
    }
  }

  const contextValue: HelpContextType = {
    isHelpMode,
    setHelpMode,
    currentTour,
    startTour,
    endTour,
    showHelp,
    hideHelp,
    trackHelpUsage
  }

  return (
    <HelpContext.Provider value={contextValue}>
      <TooltipProvider>
        {children}
        {isHelpMode && <HelpOverlay />}
        {activeHelpId && <HelpDialog helpId={activeHelpId} onClose={hideHelp} />}
      </TooltipProvider>
    </HelpContext.Provider>
  )
}

export function useHelp() {
  const context = useContext(HelpContext)
  if (context === undefined) {
    throw new Error('useHelp must be used within a HelpProvider')
  }
  return context
}

// Help Tooltip Component
interface HelpTooltipProps {
  helpId: string
  children: ReactNode
  content?: string
  title?: string
  placement?: 'top' | 'bottom' | 'left' | 'right'
  trigger?: 'hover' | 'click'
  showIcon?: boolean
  className?: string
}

export function HelpTooltip({ 
  helpId, 
  children, 
  content, 
  title,
  placement = 'top',
  trigger = 'hover',
  showIcon = false,
  className = ""
}: HelpTooltipProps) {
  const { isHelpMode, showHelp, trackHelpUsage } = useHelp()
  const helpContent = content || HELP_CONTENT[helpId]

  if (!helpContent && !isHelpMode) {
    return <>{children}</>
  }

  const handleHelpClick = () => {
    showHelp(helpId)
    trackHelpUsage('tooltip_clicked', helpId)
  }

  return (
    <div className={`relative ${className}`}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`${isHelpMode ? 'ring-2 ring-blue-400 ring-opacity-50 rounded' : ''}`}>
            {children}
          </div>
        </TooltipTrigger>
        
        <TooltipContent side={placement}>
          <div className="max-w-xs">
            {title && <div className="font-medium mb-1">{title}</div>}
            <div className="text-sm">{helpContent?.description || 'Help information not available'}</div>
            {helpContent?.hasDetailedHelp && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleHelpClick}
                className="mt-2 text-xs h-6 p-1"
              >
                Learn More
                <ExternalLink className="h-3 w-3 ml-1" />
              </Button>
            )}
          </div>
        </TooltipContent>
      </Tooltip>

      {(showIcon || isHelpMode) && (
        <button
          onClick={handleHelpClick}
          title={`Get help for ${title || helpId}`}
          aria-label={`Get help for ${title || helpId}`}
          className={`absolute -top-1 -right-1 w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-blue-600 transition-colors ${
            isHelpMode ? 'animate-pulse' : ''
          }`}
        >
          <HelpCircle className="h-3 w-3" />
        </button>
      )}
    </div>
  )
}

// Help Overlay for Help Mode
function HelpOverlay() {
  const { setHelpMode, endTour, currentTour } = useHelp()

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-blue-900/20 backdrop-blur-sm z-40 pointer-events-none"
    >
      <div className="fixed top-4 right-4 pointer-events-auto">
        <Card className="shadow-lg border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <Lightbulb className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="font-medium text-blue-900">
                  {currentTour ? 'Interactive Tour' : 'Help Mode Active'}
                </h3>
                <p className="text-sm text-blue-700">
                  {currentTour ? 'Follow the tour highlights' : 'Click highlighted elements for help'}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {currentTour ? (
                <Button size="sm" onClick={endTour} className="text-xs">
                  End Tour
                </Button>
              ) : (
                <Button size="sm" onClick={() => setHelpMode(false)} className="text-xs">
                  Exit Help Mode
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  )
}

// Detailed Help Dialog
interface HelpDialogProps {
  helpId: string
  onClose: () => void
}

function HelpDialog({ helpId, onClose }: HelpDialogProps) {
  const helpContent = HELP_CONTENT[helpId]

  if (!helpContent) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
      >
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-blue-500" />
              {helpContent.title}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6 overflow-y-auto">
          <div className="space-y-6">
            <div>
              <p className="text-gray-700 leading-relaxed">{helpContent.description}</p>
            </div>

            {helpContent.steps && (
              <div>
                <h4 className="font-semibold mb-3">Step-by-step guide:</h4>
                <ol className="space-y-2">
                  {helpContent.steps.map((step, index) => (
                    <li key={index} className="flex gap-3">
                      <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                        {index + 1}
                      </div>
                      <div className="text-sm text-gray-700">{step}</div>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {helpContent.tips && (
              <div>
                <h4 className="font-semibold mb-3">💡 Pro Tips:</h4>
                <ul className="space-y-2">
                  {helpContent.tips.map((tip, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                      <ArrowRight className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {helpContent.relatedLinks && (
              <div>
                <h4 className="font-semibold mb-3">Related Resources:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {helpContent.relatedLinks.map((link, index) => (
                    <a
                      key={index}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                    >
                      {link.type === 'video' ? (
                        <Video className="h-4 w-4 text-blue-500" />
                      ) : link.type === 'documentation' ? (
                        <BookOpen className="h-4 w-4 text-blue-500" />
                      ) : (
                        <MessageCircle className="h-4 w-4 text-blue-500" />
                      )}
                      <div className="flex-1">
                        <div className="text-sm font-medium">{link.title}</div>
                        {link.description && (
                          <div className="text-xs text-gray-500">{link.description}</div>
                        )}
                      </div>
                      <ExternalLink className="h-3 w-3 text-gray-400" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </motion.div>
    </motion.div>
  )
}

// Help Mode Toggle Button
export function HelpModeToggle() {
  const { isHelpMode, setHelpMode } = useHelp()

  return (
    <Button
      variant={isHelpMode ? "default" : "outline"}
      size="sm"
      onClick={() => setHelpMode(!isHelpMode)}
      className={`fixed bottom-4 left-4 z-30 shadow-lg ${
        isHelpMode ? 'bg-blue-500 hover:bg-blue-600' : ''
      }`}
    >
      <HelpCircle className="h-4 w-4 mr-1" />
      {isHelpMode ? 'Exit Help' : 'Need Help?'}
    </Button>
  )
}

// Help Content Definitions
interface HelpContent {
  title: string
  description: string
  hasDetailedHelp: boolean
  steps?: string[]
  tips?: string[]
  relatedLinks?: Array<{
    title: string
    description?: string
    url: string
    type: 'video' | 'documentation' | 'support'
  }>
}

const HELP_CONTENT: { [key: string]: HelpContent } = {
  'trinity-agent-selector': {
    title: 'Choosing Your Trinity Agent',
    description: 'Select the Trinity Agent that best matches your primary business needs.',
    hasDetailedHelp: true,
    steps: [
      'Review each agent\'s capabilities and ideal use cases',
      'Consider your primary business goal (analytics, monitoring, or optimization)',
      'Click on an agent card to select it',
      'You can explore other agents later during your trial'
    ],
    tips: [
      'Oracle is best for executives and analysts focused on business insights',
      'Sentinel is ideal for technical teams managing systems and infrastructure',
      'Sage excels at marketing and content generation workflows'
    ],
    relatedLinks: [
      {
        title: 'Trinity Agent Comparison Guide',
        description: 'Detailed breakdown of each agent\'s capabilities',
        url: '/docs/agents/comparison',
        type: 'documentation'
      },
      {
        title: 'Getting Started Video',
        description: '5-minute overview of Trinity Agents',
        url: '/tutorials/getting-started',
        type: 'video'
      }
    ]
  },

  'first-query-input': {
    title: 'Making Your First Query',
    description: 'Type your question in natural language - Trinity Agents understand conversational queries.',
    hasDetailedHelp: true,
    steps: [
      'Type your question using everyday business language',
      'Be specific about what you want to know or accomplish',
      'Click send or press Enter to submit your query',
      'Review the AI-generated response and insights'
    ],
    tips: [
      'Start with suggested queries for the best experience',
      'Ask follow-up questions to dive deeper into insights',
      'Trinity Agents learn from your interactions to provide better responses'
    ]
  },

  'onboarding-progress': {
    title: 'Setup Progress Tracking',
    description: 'Track your onboarding completion and see what steps remain.',
    hasDetailedHelp: true,
    tips: [
      'Complete required steps first for the core experience',
      'Optional steps unlock additional features and capabilities',
      'You can always return to incomplete steps later'
    ]
  },

  'profile-setup-form': {
    title: 'Profile Setup',
    description: 'Tell us about your business to personalize your Trinity Agent experience.',
    hasDetailedHelp: true,
    steps: [
      'Provide basic company information for context',
      'Select your role and department for personalized recommendations',
      'Choose your primary use case to customize your onboarding path',
      'Set your experience level and available time preferences'
    ],
    tips: [
      'More accurate information leads to better personalization',
      'You can update your profile anytime from account settings',
      'This information helps us recommend the best features for you'
    ]
  },

  'agent-demo-interaction': {
    title: 'Interactive Agent Demo',
    description: 'Experience how Trinity Agents respond to real business questions.',
    hasDetailedHelp: true,
    tips: [
      'Try multiple sample queries to see different response types',
      'Pay attention to confidence scores and processing times',
      'Notice how agents provide actionable insights, not just data'
    ]
  }
}

export { HELP_CONTENT }