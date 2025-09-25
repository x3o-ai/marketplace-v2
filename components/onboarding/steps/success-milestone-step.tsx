"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Sparkles, ArrowRight, TrendingUp, Zap, Target, Gift, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { OnboardingStepProps } from '@/types/onboarding'

interface Achievement {
  id: string
  name: string
  description: string
  icon: any
  unlocked: boolean
  progress?: number
  reward?: string
}

const MILESTONES: Achievement[] = [
  {
    id: 'first_query',
    name: 'First Interaction',
    description: 'Successfully completed your first Trinity Agent query',
    icon: CheckCircle,
    unlocked: true,
    reward: 'Unlocked: Advanced Query Templates'
  },
  {
    id: 'quick_learner',
    name: 'Quick Learner',
    description: 'Completed onboarding in under 10 minutes',
    icon: Zap,
    unlocked: true,
    reward: 'Unlocked: Priority Support Access'
  },
  {
    id: 'explorer',
    name: 'Trinity Explorer',
    description: 'Viewed demos for multiple Trinity Agents',
    icon: Target,
    unlocked: true,
    progress: 100,
    reward: 'Unlocked: Advanced Features Preview'
  }
]

const UPCOMING_MILESTONES: Achievement[] = [
  {
    id: 'power_user',
    name: 'Power User',
    description: 'Complete 10 successful agent interactions',
    icon: TrendingUp,
    unlocked: false,
    progress: 10,
    reward: 'Unlock: Custom Agent Workflows'
  },
  {
    id: 'integration_master',
    name: 'Integration Master',
    description: 'Connect 3 external tools to Trinity Agents',
    icon: Gift,
    unlocked: false,
    progress: 0,
    reward: 'Unlock: Enterprise Features'
  }
]

export function SuccessMilestoneStep({ step, onComplete, progress }: OnboardingStepProps) {
  const [showCelebration, setShowCelebration] = useState(true)
  const [currentMilestone, setCurrentMilestone] = useState(0)
  const [showUpcoming, setShowUpcoming] = useState(false)

  useEffect(() => {
    // Auto-advance through milestones
    const timer = setTimeout(() => {
      if (currentMilestone < MILESTONES.length - 1) {
        setCurrentMilestone(prev => prev + 1)
      } else if (!showUpcoming) {
        setShowUpcoming(true)
      }
    }, 2000)

    return () => clearTimeout(timer)
  }, [currentMilestone, showUpcoming])

  const handleContinue = () => {
    onComplete({
      milestonesUnlocked: MILESTONES.map(m => m.id),
      celebrationViewed: true,
      motivationLevel: 'high',
      readyForNext: true,
      timestamp: new Date().toISOString()
    })
  }

  const handleViewFeatures = () => {
    setShowUpcoming(true)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Celebration Header */}
      {showCelebration && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", duration: 0.8 }}
          className="text-center space-y-6"
        >
          <div className="relative">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mb-6"
            >
              <Trophy className="h-12 w-12 text-white" />
            </motion.div>
            
            {/* Confetti Effect */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 3, times: [0, 0.5, 1] }}
              className="absolute inset-0 pointer-events-none"
            >
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ 
                    x: 0, 
                    y: 0, 
                    opacity: 1,
                    scale: 0 
                  }}
                  animate={{ 
                    x: Math.random() * 400 - 200,
                    y: Math.random() * 300 - 150,
                    opacity: 0,
                    scale: 1,
                    rotate: Math.random() * 360
                  }}
                  transition={{ 
                    duration: 2 + Math.random(), 
                    delay: Math.random() * 0.5 
                  }}
                  className={`absolute left-1/2 top-1/2 w-3 h-3 rounded-full ${
                    ['bg-yellow-400', 'bg-orange-500', 'bg-red-500', 'bg-pink-500', 'bg-purple-500', 'bg-blue-500'][i % 6]
                  }`}
                />
              ))}
            </motion.div>
          </div>
          
          <div className="space-y-4">
            <h2 className="text-4xl font-bold text-[#37322F]">
              Congratulations! 🎉
            </h2>
            <p className="text-xl text-[#605A57] max-w-2xl mx-auto">
              You've successfully completed your first Trinity Agent interaction! 
              This is just the beginning of your AI automation journey.
            </p>
          </div>
        </motion.div>
      )}

      {/* Achievement Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {MILESTONES.map((milestone, index) => {
          const Icon = milestone.icon
          const isCurrentlyShowing = index <= currentMilestone
          
          return (
            <motion.div
              key={milestone.id}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={isCurrentlyShowing ? { 
                opacity: 1, 
                y: 0, 
                scale: 1 
              } : {
                opacity: 0.3,
                y: 20,
                scale: 0.9
              }}
              transition={{ delay: index * 0.2 }}
            >
              <Card className={`relative overflow-hidden ${
                milestone.unlocked 
                  ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200' 
                  : 'bg-gray-50 border-gray-200'
              }`}>
                <CardHeader className="text-center pb-2">
                  <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-3 ${
                    milestone.unlocked 
                      ? 'bg-green-500' 
                      : 'bg-gray-400'
                  }`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-lg">{milestone.name}</CardTitle>
                </CardHeader>
                
                <CardContent className="text-center space-y-3">
                  <p className="text-sm text-[#605A57]">{milestone.description}</p>
                  
                  {milestone.unlocked && milestone.reward && (
                    <div className="p-2 bg-yellow-100 rounded-lg border border-yellow-200">
                      <p className="text-xs text-yellow-800 font-medium">
                        🎁 {milestone.reward}
                      </p>
                    </div>
                  )}
                  
                  {milestone.progress !== undefined && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>Progress</span>
                        <span>{milestone.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <motion.div
                          className="bg-green-500 h-2 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${milestone.progress}%` }}
                          transition={{ delay: index * 0.3, duration: 1 }}
                        />
                      </div>
                    </div>
                  )}
                  
                  <Badge 
                    variant={milestone.unlocked ? "default" : "secondary"}
                    className={milestone.unlocked ? "bg-green-500" : ""}
                  >
                    {milestone.unlocked ? "Unlocked!" : "Locked"}
                  </Badge>
                </CardContent>
                
                {milestone.unlocked && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.3 + 0.5 }}
                    className="absolute top-2 right-2"
                  >
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </motion.div>
                )}
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Upcoming Milestones */}
      {showUpcoming && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="text-center">
            <h3 className="text-2xl font-bold text-[#37322F] mb-2">
              What's Next?
            </h3>
            <p className="text-[#605A57]">
              Keep using Trinity Agents to unlock more achievements and features
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {UPCOMING_MILESTONES.map((milestone, index) => {
              const Icon = milestone.icon
              
              return (
                <Card key={milestone.id} className="border border-dashed border-gray-300">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Icon className="h-5 w-5 text-gray-500" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-[#37322F] mb-1">{milestone.name}</h4>
                        <p className="text-sm text-[#605A57] mb-2">{milestone.description}</p>
                        {milestone.reward && (
                          <p className="text-xs text-purple-600 font-medium">
                            🎁 {milestone.reward}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </motion.div>
      )}

      {/* Action Buttons */}
      <div className="text-center space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {!showUpcoming && (
            <Button
              variant="outline"
              onClick={handleViewFeatures}
              className="flex items-center gap-2"
            >
              <Sparkles className="h-4 w-4" />
              See What's Coming Next
            </Button>
          )}
          
          <Button
            onClick={handleContinue}
            size="lg"
            className="bg-[#37322F] hover:bg-[#2A2520] text-white px-8 py-4"
          >
            Continue My Journey
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
        </div>
        
        <p className="text-sm text-[#605A57]">
          Ready to discover more Trinity Agent capabilities?
        </p>
      </div>
    </div>
  )
}