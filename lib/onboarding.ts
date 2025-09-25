import { prisma } from './prisma'
import { 
  OnboardingStep, 
  UserOnboardingProgress, 
  OnboardingStepStatus, 
  OnboardingEventType,
  OnboardingStepType,
  UserProfile,
  OnboardingTemplate,
  SuccessMilestone
} from '@/types/onboarding'

// ============================================================================
// ONBOARDING PROGRESS MANAGEMENT
// ============================================================================

export class OnboardingManager {
  private userId: string
  
  constructor(userId: string) {
    this.userId = userId
  }

  // Get user's current onboarding progress
  async getProgress(): Promise<UserOnboardingProgress[]> {
    return await prisma.userOnboardingProgress.findMany({
      where: { userId: this.userId },
      include: {
        step: true
      },
      orderBy: [
        { step: { order: 'asc' } }
      ]
    })
  }

  // Get next step for user
  async getNextStep(): Promise<OnboardingStep | null> {
    const progress = await this.getProgress()
    const completedStepIds = progress
      .filter(p => p.status === OnboardingStepStatus.COMPLETED)
      .map(p => p.stepId)

    const nextStep = await prisma.onboardingStep.findFirst({
      where: {
        active: true,
        required: true,
        id: {
          notIn: completedStepIds
        }
      },
      orderBy: { order: 'asc' }
    })

    return nextStep
  }

  // Start a step
  async startStep(stepId: string, variantId?: string): Promise<UserOnboardingProgress> {
    // Track analytics
    await this.trackEvent(OnboardingEventType.STEP_STARTED, { 
      stepId, 
      variantId,
      timestamp: new Date()
    })

    return await prisma.userOnboardingProgress.upsert({
      where: {
        userId_stepId: {
          userId: this.userId,
          stepId
        }
      },
      update: {
        status: OnboardingStepStatus.IN_PROGRESS,
        startedAt: new Date(),
        variantId,
        attempts: { increment: 1 }
      },
      create: {
        userId: this.userId,
        stepId,
        status: OnboardingStepStatus.IN_PROGRESS,
        startedAt: new Date(),
        variantId,
        attempts: 1
      },
      include: {
        step: true
      }
    })
  }

  // Complete a step
  async completeStep(stepId: string, completionData?: any): Promise<UserOnboardingProgress> {
    const startTime = await this.getStepStartTime(stepId)
    const timeSpent = startTime ? Date.now() - startTime.getTime() : undefined

    // Track analytics
    await this.trackEvent(OnboardingEventType.STEP_COMPLETED, { 
      stepId, 
      completionData,
      timeSpent,
      timestamp: new Date()
    })

    const result = await prisma.userOnboardingProgress.update({
      where: {
        userId_stepId: {
          userId: this.userId,
          stepId
        }
      },
      data: {
        status: OnboardingStepStatus.COMPLETED,
        completedAt: new Date(),
        completionData,
        timeSpent
      },
      include: {
        step: true
      }
    })

    // Check for success milestones
    await this.checkSuccessMilestones()

    return result
  }

  // Skip a step
  async skipStep(stepId: string, reason?: string): Promise<UserOnboardingProgress> {
    // Track analytics
    await this.trackEvent(OnboardingEventType.STEP_SKIPPED, { 
      stepId, 
      reason,
      timestamp: new Date()
    })

    return await prisma.userOnboardingProgress.upsert({
      where: {
        userId_stepId: {
          userId: this.userId,
          stepId
        }
      },
      update: {
        status: OnboardingStepStatus.SKIPPED,
        skippedAt: new Date()
      },
      create: {
        userId: this.userId,
        stepId,
        status: OnboardingStepStatus.SKIPPED,
        skippedAt: new Date()
      },
      include: {
        step: true
      }
    })
  }

  // Mark step as failed
  async failStep(stepId: string, error: string): Promise<UserOnboardingProgress> {
    // Track analytics
    await this.trackEvent(OnboardingEventType.STEP_FAILED, { 
      stepId, 
      error,
      timestamp: new Date()
    })

    return await prisma.userOnboardingProgress.update({
      where: {
        userId_stepId: {
          userId: this.userId,
          stepId
        }
      },
      data: {
        status: OnboardingStepStatus.FAILED,
        lastError: error,
        errors: {
          push: {
            timestamp: new Date(),
            error
          }
        }
      },
      include: {
        step: true
      }
    })
  }

  // Get completion percentage
  async getCompletionPercentage(): Promise<number> {
    const totalSteps = await prisma.onboardingStep.count({
      where: { 
        active: true, 
        required: true 
      }
    })

    if (totalSteps === 0) return 100

    const completedSteps = await prisma.userOnboardingProgress.count({
      where: {
        userId: this.userId,
        status: OnboardingStepStatus.COMPLETED,
        step: {
          required: true
        }
      }
    })

    return Math.round((completedSteps / totalSteps) * 100)
  }

  // Private helper methods
  private async getStepStartTime(stepId: string): Promise<Date | null> {
    const progress = await prisma.userOnboardingProgress.findUnique({
      where: {
        userId_stepId: {
          userId: this.userId,
          stepId
        }
      }
    })

    return progress?.startedAt || null
  }

  private async checkSuccessMilestones(): Promise<void> {
    // Implementation for checking and awarding success milestones
    // This would check various conditions and award badges, unlock features, etc.
  }

  // Track analytics event
  async trackEvent(eventType: OnboardingEventType, eventData: any): Promise<void> {
    await prisma.onboardingAnalytics.create({
      data: {
        eventType,
        userId: this.userId,
        stepId: eventData.stepId,
        eventData,
        timestamp: new Date(),
        sessionId: eventData.sessionId,
        variantId: eventData.variantId,
        experimentId: eventData.experimentId,
        pageLoadTime: eventData.pageLoadTime,
        interactionTime: eventData.interactionTime
      }
    })
  }
}

// ============================================================================
// ONBOARDING TEMPLATE SYSTEM
// ============================================================================

export class OnboardingTemplateManager {
  
  // Assign template to user based on profile
  static async assignTemplate(userId: string, userProfile: UserProfile): Promise<OnboardingTemplate | null> {
    const templates = await prisma.onboardingTemplate.findMany({
      where: { active: true },
      orderBy: { weight: 'desc' }
    })

    // Find best matching template
    let bestMatch: OnboardingTemplate | null = null
    let bestScore = 0

    for (const template of templates) {
      const score = this.calculateTemplateScore(template, userProfile)
      if (score > bestScore) {
        bestScore = score
        bestMatch = template
      }
    }

    if (bestMatch) {
      // Assign template to user
      await prisma.userOnboardingTemplate.create({
        data: {
          userId,
          templateId: bestMatch.id,
          assignmentData: {
            profile: userProfile,
            score: bestScore,
            timestamp: new Date()
          }
        }
      })

      // Track analytics
      const manager = new OnboardingManager(userId)
      await manager.trackEvent(OnboardingEventType.TEMPLATE_ASSIGNED, {
        templateId: bestMatch.id,
        templateName: bestMatch.name,
        score: bestScore,
        profile: userProfile
      })
    }

    return bestMatch
  }

  // Calculate how well a template matches a user profile
  private static calculateTemplateScore(template: OnboardingTemplate, profile: UserProfile): number {
    let score = template.weight // Base weight

    const audience = template.targetAudience as any

    // Industry match
    if (audience.industry && profile.organization?.industry) {
      if (audience.industry.includes(profile.organization.industry)) {
        score += 20
      }
    }

    // Company size match  
    if (audience.companySize && profile.organization?.size) {
      if (audience.companySize.includes(profile.organization.size)) {
        score += 15
      }
    }

    // Role match
    if (audience.role && profile.jobTitle) {
      if (audience.role.some((role: string) => 
        profile.jobTitle?.toLowerCase().includes(role.toLowerCase())
      )) {
        score += 10
      }
    }

    return score
  }

  // Get user's assigned template
  static async getUserTemplate(userId: string): Promise<OnboardingTemplate | null> {
    const assignment = await prisma.userOnboardingTemplate.findFirst({
      where: { userId },
      include: { template: true },
      orderBy: { assignedAt: 'desc' }
    })

    return assignment?.template || null
  }
}

// ============================================================================
// ONBOARDING STEP DEFINITIONS
// ============================================================================

export const DEFAULT_ONBOARDING_STEPS = [
  {
    key: 'welcome',
    name: 'Welcome',
    description: 'Welcome new users and set expectations',
    type: OnboardingStepType.WELCOME,
    category: 'introduction',
    order: 1,
    title: 'Welcome to x3o.ai Trinity Agents',
    required: true,
    skipAllowed: false,
    estimatedMinutes: 2,
    component: 'WelcomeStep',
    active: true
  },
  {
    key: 'profile_setup',
    name: 'Profile Setup',
    description: 'Collect user profile information for personalization',
    type: OnboardingStepType.PROFILE_SETUP,
    category: 'setup',
    order: 2,
    title: 'Tell us about yourself',
    required: true,
    skipAllowed: false,
    estimatedMinutes: 3,
    component: 'ProfileSetupStep',
    active: true
  },
  {
    key: 'agent_introduction',
    name: 'Trinity Agent Overview',
    description: 'Introduce the three Trinity Agents',
    type: OnboardingStepType.AGENT_INTRODUCTION,
    category: 'introduction',
    order: 3,
    title: 'Meet Your Trinity Agents',
    required: true,
    skipAllowed: false,
    estimatedMinutes: 4,
    component: 'AgentIntroductionStep',
    active: true
  },
  {
    key: 'choose_primary_agent',
    name: 'Choose Primary Agent',
    description: 'User selects which agent to start with',
    type: OnboardingStepType.AGENT_SETUP,
    category: 'setup',
    order: 4,
    title: 'Which Trinity Agent interests you most?',
    required: true,
    skipAllowed: false,
    estimatedMinutes: 1,
    component: 'AgentSelectionStep',
    active: true
  },
  {
    key: 'first_interaction',
    name: 'First Interaction',
    description: 'User completes first successful interaction with chosen agent',
    type: OnboardingStepType.FIRST_INTERACTION,
    category: 'interaction',
    order: 5,
    title: 'Try your first interaction',
    required: true,
    skipAllowed: false,
    estimatedMinutes: 5,
    component: 'FirstInteractionStep',
    active: true
  },
  {
    key: 'success_milestone',
    name: 'First Success',
    description: 'Celebrate first successful interaction',
    type: OnboardingStepType.SUCCESS_MILESTONE,
    category: 'milestone',
    order: 6,
    title: 'Congratulations! 🎉',
    required: true,
    skipAllowed: false,
    estimatedMinutes: 2,
    component: 'SuccessMilestoneStep',
    active: true
  },
  {
    key: 'feature_discovery',
    name: 'Discover More Features',
    description: 'Show additional capabilities and features',
    type: OnboardingStepType.FEATURE_DISCOVERY,
    category: 'discovery',
    order: 7,
    title: 'Explore more capabilities',
    required: false,
    skipAllowed: true,
    estimatedMinutes: 8,
    component: 'FeatureDiscoveryStep',
    active: true
  },
  {
    key: 'onboarding_complete',
    name: 'Onboarding Complete',
    description: 'Onboarding completion celebration and next steps',
    type: OnboardingStepType.COMPLETION,
    category: 'completion',
    order: 8,
    title: 'You\'re all set!',
    required: true,
    skipAllowed: false,
    estimatedMinutes: 2,
    component: 'CompletionStep',
    active: true
  }
]

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export async function initializeUserOnboarding(userId: string, userProfile: UserProfile): Promise<void> {
  // Assign appropriate template
  await OnboardingTemplateManager.assignTemplate(userId, userProfile)
  
  // Initialize progress tracking
  const manager = new OnboardingManager(userId)
  await manager.trackEvent(OnboardingEventType.TEMPLATE_ASSIGNED, {
    userId,
    profile: userProfile,
    timestamp: new Date()
  })
}

export async function seedOnboardingSteps(): Promise<void> {
  for (const stepData of DEFAULT_ONBOARDING_STEPS) {
    await prisma.onboardingStep.upsert({
      where: { key: stepData.key },
      update: stepData,
      create: stepData
    })
  }
}

export async function getOnboardingAnalytics(userId?: string, stepId?: string) {
  const where: any = {}
  if (userId) where.userId = userId
  if (stepId) where.stepId = stepId

  return await prisma.onboardingAnalytics.findMany({
    where,
    orderBy: { timestamp: 'desc' },
    take: 100
  })
}