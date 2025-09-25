"use client"

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, X, HelpCircle, Clock, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

import { OnboardingManager } from '@/lib/onboarding'
import { 
  OnboardingStep, 
  UserOnboardingProgress, 
  OnboardingStepStatus,
  OnboardingWizardProps,
  OnboardingStepProps
} from '@/types/onboarding'

// Step Components
import { WelcomeStep } from './steps/welcome-step'
import { ProfileSetupStep } from './steps/profile-setup-step'
import { AgentIntroductionStep } from './steps/agent-introduction-step'
import { AgentSelectionStep } from './steps/agent-selection-step'
import { FirstInteractionStep } from './steps/first-interaction-step'
import { SuccessMilestoneStep } from './steps/success-milestone-step'
import { FeatureDiscoveryStep } from './steps/feature-discovery-step'
import { CompletionStep } from './steps/completion-step'

const STEP_COMPONENTS: { [key: string]: React.ComponentType<OnboardingStepProps> } = {
  WelcomeStep,
  ProfileSetupStep,
  AgentIntroductionStep,
  AgentSelectionStep,
  FirstInteractionStep,
  SuccessMilestoneStep,
  FeatureDiscoveryStep,
  CompletionStep
}

export function OnboardingWizard({ 
  userId, 
  onComplete, 
  onSkip,
  className 
}: OnboardingWizardProps) {
  const { data: session } = useSession()
  const [steps, setSteps] = useState<OnboardingStep[]>([])
  const [progress, setProgress] = useState<UserOnboardingProgress[]>([])
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [completionPercentage, setCompletionPercentage] = useState(0)
  const [showHelp, setShowHelp] = useState(false)
  
  const onboardingManager = new OnboardingManager(userId)

  // Load onboarding data
  const loadOnboardingData = useCallback(async () => {
    try {
      setLoading(true)
      
      // Fetch steps and progress
      const [stepsResponse, progressResponse] = await Promise.all([
        fetch('/api/onboarding/steps'),
        fetch(`/api/onboarding/progress?userId=${userId}`)
      ])
      
      const stepsData = await stepsResponse.json()
      const progressData = await progressResponse.json()
      
      if (stepsData.success && progressData.success) {
        setSteps(stepsData.steps)
        setProgress(progressData.progress)
        
        // Find current step index
        const currentIndex = findCurrentStepIndex(stepsData.steps, progressData.progress)
        setCurrentStepIndex(currentIndex)
        
        // Update completion percentage
        const percentage = await onboardingManager.getCompletionPercentage()
        setCompletionPercentage(percentage)
      }
    } catch (error) {
      console.error('Failed to load onboarding data:', error)
    } finally {
      setLoading(false)
    }
  }, [userId, onboardingManager])

  useEffect(() => {
    loadOnboardingData()
  }, [loadOnboardingData])

  // Find the current step index based on progress
  const findCurrentStepIndex = (steps: OnboardingStep[], progress: UserOnboardingProgress[]): number => {
    // Find first incomplete required step
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i]
      const stepProgress = progress.find(p => p.stepId === step.id)
      
      if (!stepProgress || stepProgress.status === OnboardingStepStatus.NOT_STARTED) {
        return i
      }
      
      if (stepProgress.status === OnboardingStepStatus.IN_PROGRESS) {
        return i
      }
    }
    
    // All steps completed
    return Math.max(0, steps.length - 1)
  }

  // Navigation handlers
  const handleNext = async () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1)
      
      // Start the next step
      const nextStep = steps[currentStepIndex + 1]
      await onboardingManager.startStep(nextStep.id)
      await loadOnboardingData()
    }
  }

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1)
    }
  }

  const handleSkipStep = async () => {
    const currentStep = steps[currentStepIndex]
    if (currentStep?.skipAllowed) {
      await onboardingManager.skipStep(currentStep.id, 'User skipped')
      await loadOnboardingData()
      handleNext()
    }
  }

  const handleCompleteStep = async (completionData?: any) => {
    const currentStep = steps[currentStepIndex]
    await onboardingManager.completeStep(currentStep.id, completionData)
    await loadOnboardingData()
    
    // Check if this was the last step
    if (currentStepIndex === steps.length - 1) {
      onComplete?.()
    } else {
      handleNext()
    }
  }

  const handleClose = () => {
    onSkip?.()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#37322F]"></div>
      </div>
    )
  }

  if (steps.length === 0) {
    return null
  }

  const currentStep = steps[currentStepIndex]
  const currentProgress = progress.find(p => p.stepId === currentStep?.id)
  const isFirst = currentStepIndex === 0
  const isLast = currentStepIndex === steps.length - 1
  
  const StepComponent = STEP_COMPONENTS[currentStep?.component || '']

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={cn(
        "fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4",
        className
      )}
    >
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="border-b border-gray-200 p-6 pb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-semibold text-[#37322F]">
                Getting Started with Trinity Agents
              </h2>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                Step {currentStepIndex + 1} of {steps.length}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHelp(!showHelp)}
                className="text-gray-500"
              >
                <HelpCircle className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="text-gray-500"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Overall Progress</span>
              <span>{completionPercentage}% complete</span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
          </div>

          {/* Step Info */}
          {currentStep && (
            <div className="flex items-center gap-4 mt-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{currentStep.estimatedMinutes || 2} min</span>
              </div>
              {currentStep.category && (
                <Badge variant="secondary" className="text-xs">
                  {currentStep.category}
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Help Panel */}
        <AnimatePresence>
          {showHelp && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-b border-gray-200 bg-blue-50 p-4"
            >
              <div className="flex items-start gap-3">
                <HelpCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-blue-900 mb-1">Need help?</h3>
                  <p className="text-sm text-blue-700 mb-2">
                    {currentStep?.description || "Follow the instructions on this step to continue."}
                  </p>
                  <p className="text-xs text-blue-600">
                    You can skip optional steps or contact support if you get stuck.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep?.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="p-6"
            >
              {StepComponent && currentStep && currentProgress && (
                <StepComponent
                  step={currentStep}
                  progress={currentProgress}
                  onNext={handleNext}
                  onPrevious={handlePrevious}
                  onSkip={handleSkipStep}
                  onComplete={handleCompleteStep}
                  isFirst={isFirst}
                  isLast={isLast}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer Navigation */}
        <div className="border-t border-gray-200 p-6 pt-4">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={isFirst}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>

            <div className="flex items-center gap-2">
              {currentStep?.skipAllowed && !isLast && (
                <Button
                  variant="ghost"
                  onClick={handleSkipStep}
                  className="text-gray-500"
                >
                  Skip for now
                </Button>
              )}
              
              <Button
                onClick={isLast ? () => handleCompleteStep() : handleNext}
                className="flex items-center gap-2 bg-[#37322F] hover:bg-[#2A2520]"
              >
                {isLast ? (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Complete Setup
                  </>
                ) : (
                  <>
                    Continue
                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}