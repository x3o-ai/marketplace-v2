// Onboarding System Types
export interface OnboardingStep {
  id: string
  key: string
  name: string
  description?: string
  type: OnboardingStepType
  category?: string
  order: number
  title?: string
  content?: any
  component?: string
  required: boolean
  conditions?: any
  triggers?: any
  estimatedMinutes?: number
  skipAllowed: boolean
  variants?: any
  active: boolean
  createdAt: Date
  updatedAt: Date
}

export interface UserOnboardingProgress {
  id: string
  userId: string
  stepId: string
  status: OnboardingStepStatus
  startedAt?: Date
  completedAt?: Date
  skippedAt?: Date
  progressData?: any
  completionData?: any
  variantId?: string
  timeSpent?: number
  attempts: number
  helpUsed: boolean
  errors?: any
  lastError?: string
  createdAt: Date
  updatedAt: Date
  step?: OnboardingStep
}

export interface OnboardingTemplate {
  id: string
  name: string
  description?: string
  targetAudience: any
  steps: any
  industry?: string
  companySize?: string
  role?: string
  testGroup?: string
  weight: number
  conversionRate?: number
  completionRate?: number
  avgTimeToComplete?: number
  active: boolean
  createdAt: Date
  updatedAt: Date
}

export interface OnboardingAnalytics {
  id: string
  eventType: OnboardingEventType
  stepId?: string
  userId?: string
  eventData: any
  metadata?: any
  userAgent?: string
  ipAddress?: string
  sessionId?: string
  variantId?: string
  experimentId?: string
  pageLoadTime?: number
  interactionTime?: number
  conversionStep?: string
  conversionValue?: number
  timestamp: Date
}

export enum OnboardingStepType {
  WELCOME = 'WELCOME',
  PROFILE_SETUP = 'PROFILE_SETUP',
  AGENT_INTRODUCTION = 'AGENT_INTRODUCTION',
  AGENT_SETUP = 'AGENT_SETUP',
  FIRST_INTERACTION = 'FIRST_INTERACTION',
  SUCCESS_MILESTONE = 'SUCCESS_MILESTONE',
  FEATURE_DISCOVERY = 'FEATURE_DISCOVERY',
  INTEGRATION_SETUP = 'INTEGRATION_SETUP',
  COMPLETION = 'COMPLETION',
  CONVERSION = 'CONVERSION'
}

export enum OnboardingStepStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  SKIPPED = 'SKIPPED',
  FAILED = 'FAILED',
  ABANDONED = 'ABANDONED'
}

export enum OnboardingEventType {
  STEP_STARTED = 'STEP_STARTED',
  STEP_COMPLETED = 'STEP_COMPLETED',
  STEP_SKIPPED = 'STEP_SKIPPED',
  STEP_FAILED = 'STEP_FAILED',
  STEP_ABANDONED = 'STEP_ABANDONED',
  HELP_USED = 'HELP_USED',
  ERROR_OCCURRED = 'ERROR_OCCURRED',
  CONVERSION = 'CONVERSION',
  TEMPLATE_ASSIGNED = 'TEMPLATE_ASSIGNED',
  EXPERIMENT_VIEWED = 'EXPERIMENT_VIEWED'
}

// UI Component Props
export interface OnboardingWizardProps {
  userId: string
  onComplete?: () => void
  onSkip?: () => void
  className?: string
}

export interface OnboardingStepProps {
  step: OnboardingStep
  progress: UserOnboardingProgress
  onNext: () => void
  onPrevious: () => void
  onSkip: () => void
  onComplete: (data?: any) => void
  isFirst: boolean
  isLast: boolean
}

export interface TrinityAgentWizardProps {
  agentType: 'oracle' | 'sentinel' | 'sage'
  userId: string
  onComplete: (data: any) => void
  onSkip?: () => void
}

export interface OnboardingChecklistProps {
  userId: string
  templateId?: string
  showProgress?: boolean
  compact?: boolean
}

// Onboarding Flow Configuration
export interface OnboardingFlowConfig {
  steps: OnboardingStepConfig[]
  templates: OnboardingTemplateConfig[]
  analytics: OnboardingAnalyticsConfig
  abTesting: ABTestingConfig
}

export interface OnboardingStepConfig {
  key: string
  component: string
  conditions?: {
    userRole?: string[]
    companySize?: string[]
    industry?: string[]
    previousSteps?: string[]
  }
  variants?: {
    [key: string]: {
      title: string
      content: any
      weight: number
    }
  }
}

export interface OnboardingTemplateConfig {
  id: string
  name: string
  description: string
  steps: string[]
  targeting: {
    userRole?: string[]
    companySize?: string[]
    industry?: string[]
  }
  weight: number
}

export interface OnboardingAnalyticsConfig {
  trackingEnabled: boolean
  events: OnboardingEventType[]
  customEvents?: string[]
}

export interface ABTestingConfig {
  enabled: boolean
  experiments: {
    [key: string]: {
      variants: string[]
      traffic: number
      targeting?: any
    }
  }
}

// User Profile for Personalization
export interface UserProfile {
  id: string
  name?: string
  email: string
  role?: string
  department?: string
  jobTitle?: string
  organization?: {
    name: string
    industry?: string
    size?: string
  }
  preferences?: {
    primaryUseCase?: 'analytics' | 'monitoring' | 'content' | 'automation'
    experienceLevel?: 'beginner' | 'intermediate' | 'expert'
    timeAvailable?: 'quick' | 'thorough'
  }
}

// Success Milestones
export interface SuccessMilestone {
  id: string
  name: string
  description: string
  type: 'interaction' | 'achievement' | 'metric' | 'time_based'
  conditions: any
  reward?: {
    type: 'badge' | 'feature_unlock' | 'discount' | 'content'
    value: any
  }
}

// Trinity Agent specific types
export interface TrinityAgentConfig {
  oracle: {
    name: 'Oracle Analytics'
    description: 'Advanced business intelligence with predictive analytics'
    features: string[]
    setupSteps: string[]
    demoScenarios: string[]
  }
  sentinel: {
    name: 'Sentinel Monitoring'
    description: '24/7 autonomous system monitoring and optimization'
    features: string[]
    setupSteps: string[]
    demoScenarios: string[]
  }
  sage: {
    name: 'Sage Optimization'
    description: 'Intelligent process automation and content generation'
    features: string[]
    setupSteps: string[]
    demoScenarios: string[]
  }
}