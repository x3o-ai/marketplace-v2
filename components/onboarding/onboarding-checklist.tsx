"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  CheckCircle, 
  Circle, 
  Clock, 
  ChevronDown, 
  ChevronUp,
  Star,
  Trophy,
  Sparkles,
  ArrowRight,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { OnboardingChecklistProps, OnboardingStepStatus } from '@/types/onboarding'

interface ChecklistItem {
  id: string
  title: string
  description: string
  status: OnboardingStepStatus
  estimatedTime: number
  optional: boolean
  category: string
  reward?: string
}

export function OnboardingChecklist({ 
  userId, 
  templateId, 
  showProgress = true, 
  compact = false 
}: OnboardingChecklistProps) {
  const [items, setItems] = useState<ChecklistItem[]>([])
  const [isExpanded, setIsExpanded] = useState(!compact)
  const [isVisible, setIsVisible] = useState(true)
  const [loading, setLoading] = useState(true)
  const [completionPercentage, setCompletionPercentage] = useState(0)

  // Load checklist data
  useEffect(() => {
    loadChecklistData()
  }, [userId, templateId])

  const loadChecklistData = async () => {
    try {
      setLoading(true)
      
      const response = await fetch(`/api/onboarding/checklist?userId=${userId}&templateId=${templateId || ''}`)
      const data = await response.json()
      
      if (data.success) {
        setItems(data.items)
        setCompletionPercentage(data.completionPercentage)
      }
    } catch (error) {
      console.error('Failed to load checklist:', error)
      // Fallback to sample data
      setItems(SAMPLE_CHECKLIST_ITEMS)
      calculateProgress(SAMPLE_CHECKLIST_ITEMS)
    } finally {
      setLoading(false)
    }
  }

  const calculateProgress = (checklistItems: ChecklistItem[]) => {
    const completedItems = checklistItems.filter(item => 
      item.status === OnboardingStepStatus.COMPLETED
    ).length
    const totalItems = checklistItems.filter(item => !item.optional).length
    const percentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0
    setCompletionPercentage(percentage)
  }

  const handleItemClick = async (itemId: string) => {
    // Navigate to specific step or mark as completed
    const item = items.find(i => i.id === itemId)
    if (item && item.status === OnboardingStepStatus.NOT_STARTED) {
      // Start the step
      try {
        await fetch('/api/onboarding/start-step', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, stepId: itemId })
        })
        await loadChecklistData() // Reload to get updated status
      } catch (error) {
        console.error('Failed to start step:', error)
      }
    }
  }

  const completedItems = items.filter(item => item.status === OnboardingStepStatus.COMPLETED)
  const inProgressItems = items.filter(item => item.status === OnboardingStepStatus.IN_PROGRESS)
  const totalRequiredItems = items.filter(item => !item.optional)
  const estimatedTimeRemaining = items
    .filter(item => item.status === OnboardingStepStatus.NOT_STARTED && !item.optional)
    .reduce((total, item) => total + item.estimatedTime, 0)

  if (!isVisible) return null

  return (
    <div className={`fixed ${compact ? 'bottom-4 right-4' : 'top-4 right-4'} z-40`}>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        className={`${compact ? 'w-80' : 'w-96'}`}
      >
        <Card className="shadow-lg border-2 border-gray-100">
          <CardHeader 
            className="cursor-pointer pb-3"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${
                  completionPercentage === 100 
                    ? 'bg-green-500' 
                    : completionPercentage > 0 
                      ? 'bg-blue-500' 
                      : 'bg-gray-400'
                }`} />
                Setup Progress
              </CardTitle>
              
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {completedItems.length}/{totalRequiredItems.length}
                </Badge>
                <Button variant="ghost" size="sm" onClick={() => setIsVisible(false)}>
                  <X className="h-4 w-4" />
                </Button>
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </div>
            </div>
            
            {showProgress && (
              <div className="space-y-2 mt-3">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Overall Progress</span>
                  <span>{completionPercentage}%</span>
                </div>
                <Progress value={completionPercentage} className="h-2" />
                
                {estimatedTimeRemaining > 0 && (
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    <span>{estimatedTimeRemaining} minutes remaining</span>
                  </div>
                )}
              </div>
            )}
          </CardHeader>
          
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <CardContent className="pt-0 space-y-3">
                  {loading ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#37322F] mx-auto"></div>
                    </div>
                  ) : (
                    <>
                      {/* In Progress Items */}
                      {inProgressItems.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-orange-600 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            In Progress
                          </h4>
                          {inProgressItems.map(item => (
                            <ChecklistItemComponent
                              key={item.id}
                              item={item}
                              onClick={() => handleItemClick(item.id)}
                              highlight={true}
                            />
                          ))}
                        </div>
                      )}
                      
                      {/* Completed Items */}
                      {completedItems.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-green-600 flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Completed ({completedItems.length})
                          </h4>
                          <div className="space-y-1">
                            {completedItems.slice(0, compact ? 2 : 5).map(item => (
                              <ChecklistItemComponent
                                key={item.id}
                                item={item}
                                onClick={() => handleItemClick(item.id)}
                                compact={true}
                              />
                            ))}
                            {completedItems.length > (compact ? 2 : 5) && (
                              <div className="text-xs text-gray-500 px-2 py-1">
                                +{completedItems.length - (compact ? 2 : 5)} more completed
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Remaining Items */}
                      {items.filter(item => 
                        item.status === OnboardingStepStatus.NOT_STARTED
                      ).length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-gray-600 flex items-center gap-1">
                            <Circle className="h-3 w-3" />
                            Next Steps
                          </h4>
                          {items
                            .filter(item => item.status === OnboardingStepStatus.NOT_STARTED)
                            .slice(0, compact ? 3 : 6)
                            .map(item => (
                              <ChecklistItemComponent
                                key={item.id}
                                item={item}
                                onClick={() => handleItemClick(item.id)}
                              />
                            ))}
                        </div>
                      )}
                      
                      {/* Completion Celebration */}
                      {completionPercentage === 100 && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200 text-center"
                        >
                          <Trophy className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
                          <h4 className="font-semibold text-green-800 mb-1">
                            Setup Complete! 🎉
                          </h4>
                          <p className="text-xs text-green-700 mb-2">
                            You're ready to start using Trinity Agents
                          </p>
                          <Button size="sm" className="text-xs h-6 bg-green-600 hover:bg-green-700">
                            <Sparkles className="h-3 w-3 mr-1" />
                            Go to Dashboard
                          </Button>
                        </motion.div>
                      )}
                    </>
                  )}
                </CardContent>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>
    </div>
  )
}

// Individual checklist item component
function ChecklistItemComponent({ 
  item, 
  onClick, 
  highlight = false, 
  compact = false 
}: {
  item: ChecklistItem
  onClick: () => void
  highlight?: boolean
  compact?: boolean
}) {
  const getStatusIcon = () => {
    switch (item.status) {
      case OnboardingStepStatus.COMPLETED:
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case OnboardingStepStatus.IN_PROGRESS:
        return <div className="h-4 w-4 border-2 border-orange-500 rounded-full animate-pulse bg-orange-100" />
      case OnboardingStepStatus.FAILED:
        return <Circle className="h-4 w-4 text-red-500" />
      default:
        return <Circle className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusColor = () => {
    switch (item.status) {
      case OnboardingStepStatus.COMPLETED:
        return 'bg-green-50 border-green-200'
      case OnboardingStepStatus.IN_PROGRESS:
        return 'bg-orange-50 border-orange-200'
      case OnboardingStepStatus.FAILED:
        return 'bg-red-50 border-red-200'
      default:
        return 'bg-gray-50 border-gray-200 hover:bg-gray-100'
    }
  }

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className={`p-2 rounded-lg border cursor-pointer transition-all ${getStatusColor()} ${
        highlight ? 'ring-2 ring-blue-500' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-start gap-2">
        {getStatusIcon()}
        <div className="flex-1 min-w-0">
          <div className={`font-medium text-sm ${compact ? 'truncate' : ''} ${
            item.status === OnboardingStepStatus.COMPLETED ? 'text-green-800' : 'text-[#37322F]'
          }`}>
            {item.title}
          </div>
          {!compact && (
            <div className="text-xs text-gray-600 mt-1">
              {item.description}
            </div>
          )}
          <div className="flex items-center gap-2 mt-1">
            {item.estimatedTime && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Clock className="h-3 w-3" />
                <span>{item.estimatedTime}m</span>
              </div>
            )}
            {item.optional && (
              <Badge variant="secondary" className="text-xs h-4">
                Optional
              </Badge>
            )}
            {item.reward && item.status === OnboardingStepStatus.COMPLETED && (
              <div className="flex items-center gap-1 text-xs text-yellow-600">
                <Star className="h-3 w-3" />
                <span>Reward unlocked</span>
              </div>
            )}
          </div>
        </div>
        {item.status === OnboardingStepStatus.NOT_STARTED && (
          <ArrowRight className="h-3 w-3 text-gray-400 flex-shrink-0 mt-0.5" />
        )}
      </div>
    </motion.div>
  )
}

// Sample data for fallback
const SAMPLE_CHECKLIST_ITEMS: ChecklistItem[] = [
  {
    id: 'welcome',
    title: 'Welcome Introduction',
    description: 'Learn about Trinity Agents and their capabilities',
    status: OnboardingStepStatus.COMPLETED,
    estimatedTime: 2,
    optional: false,
    category: 'introduction'
  },
  {
    id: 'profile_setup',
    title: 'Profile Setup',
    description: 'Tell us about your company and role',
    status: OnboardingStepStatus.COMPLETED,
    estimatedTime: 3,
    optional: false,
    category: 'setup'
  },
  {
    id: 'agent_introduction',
    title: 'Meet Trinity Agents',
    description: 'Discover Oracle, Sentinel, and Sage capabilities',
    status: OnboardingStepStatus.IN_PROGRESS,
    estimatedTime: 4,
    optional: false,
    category: 'introduction'
  },
  {
    id: 'first_interaction',
    title: 'First Interaction',
    description: 'Try your first Trinity Agent query',
    status: OnboardingStepStatus.NOT_STARTED,
    estimatedTime: 5,
    optional: false,
    category: 'interaction'
  },
  {
    id: 'feature_discovery',
    title: 'Advanced Features',
    description: 'Explore additional capabilities and settings',
    status: OnboardingStepStatus.NOT_STARTED,
    estimatedTime: 8,
    optional: true,
    category: 'discovery',
    reward: 'Premium features unlocked'
  }
]