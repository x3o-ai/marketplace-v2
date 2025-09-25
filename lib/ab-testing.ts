import { prisma } from './prisma'
import { OnboardingEventType } from '@/types/onboarding'

export interface ABExperiment {
  id: string
  name: string
  description: string
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED'
  type: 'ONBOARDING_FLOW' | 'STEP_VARIANT' | 'CONTENT_TEST' | 'UI_TEST'
  variants: ABVariant[]
  targeting: ABTargeting
  metrics: ABMetric[]
  startDate: Date
  endDate?: Date
  trafficAllocation: number // Percentage of users to include
  minimumSampleSize: number
  createdAt: Date
  updatedAt: Date
}

export interface ABVariant {
  id: string
  name: string
  description: string
  weight: number // Traffic split percentage
  configuration: any // Variant-specific configuration
  isControl: boolean
}

export interface ABTargeting {
  userSegments?: string[] // Target specific user segments
  geographicRegions?: string[]
  deviceTypes?: string[]
  trafficSource?: string[]
  userAttributes?: Record<string, any>
  customRules?: string // SQL-like conditions
}

export interface ABMetric {
  id: string
  name: string
  type: 'CONVERSION' | 'ENGAGEMENT' | 'TIME' | 'COUNT' | 'CUSTOM'
  eventType?: OnboardingEventType
  description: string
  isPrimary: boolean
  goal?: 'INCREASE' | 'DECREASE'
  targetValue?: number
}

export interface ABAssignment {
  userId: string
  experimentId: string
  variantId: string
  assignedAt: Date
  sessionId?: string
  userAttributes?: Record<string, any>
}

export class ABTestingManager {
  private userId?: string
  private sessionId?: string

  constructor(userId?: string, sessionId?: string) {
    this.userId = userId
    this.sessionId = sessionId
  }

  // Get variant assignment for a specific experiment
  async getVariantAssignment(experimentId: string): Promise<ABVariant | null> {
    if (!this.userId) {
      return null
    }

    // Check for existing assignment
    const existingAssignment = await prisma.onboardingAnalytics.findFirst({
      where: {
        userId: this.userId,
        experimentId,
        eventType: OnboardingEventType.EXPERIMENT_VIEWED
      }
    })

    if (existingAssignment && existingAssignment.variantId) {
      const experiment = await this.getExperiment(experimentId)
      return experiment?.variants.find(v => v.id === existingAssignment.variantId) || null
    }

    // Get experiment details
    const experiment = await this.getExperiment(experimentId)
    if (!experiment || experiment.status !== 'ACTIVE') {
      return null
    }

    // Check if user qualifies for experiment
    const qualifies = await this.checkExperimentEligibility(experiment)
    if (!qualifies) {
      return null
    }

    // Assign variant based on traffic allocation and weights
    const variant = this.assignVariant(experiment)
    
    if (variant) {
      // Record assignment
      await this.recordExperimentAssignment(experimentId, variant.id)
      
      // Track experiment view
      await this.trackEvent(OnboardingEventType.EXPERIMENT_VIEWED, {
        experimentId,
        variantId: variant.id,
        userId: this.userId,
        assignmentTimestamp: new Date().toISOString()
      })
    }

    return variant
  }

  // Create a new A/B experiment
  async createExperiment(experiment: Omit<ABExperiment, 'id' | 'createdAt' | 'updatedAt'>): Promise<ABExperiment> {
    // Validate experiment configuration
    this.validateExperimentConfig(experiment)

    // Create experiment record (using system config as experiments aren't in schema yet)
    const experimentId = `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const experimentConfig: ABExperiment = {
      id: experimentId,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...experiment
    }

    await prisma.systemConfig.create({
      data: {
        key: `ab_experiment_${experimentId}`,
        value: experimentConfig,
        description: `A/B Test: ${experiment.name}`,
        category: 'ab_testing'
      }
    })

    return experimentConfig
  }

  // Update experiment status
  async updateExperimentStatus(experimentId: string, status: ABExperiment['status']): Promise<void> {
    const experiment = await this.getExperiment(experimentId)
    if (!experiment) {
      throw new Error('Experiment not found')
    }

    experiment.status = status
    experiment.updatedAt = new Date()

    await prisma.systemConfig.update({
      where: { key: `ab_experiment_${experimentId}` },
      data: { value: experiment }
    })

    // Track status change
    await this.trackEvent(OnboardingEventType.EXPERIMENT_VIEWED, {
      experimentId,
      action: 'status_changed',
      newStatus: status,
      timestamp: new Date().toISOString()
    })
  }

  // Get experiment results and analysis
  async getExperimentResults(experimentId: string): Promise<{
    experiment: ABExperiment
    variants: Array<{
      variant: ABVariant
      participants: number
      conversions: number
      conversionRate: number
      metrics: Record<string, number>
    }>
    statisticalSignificance?: {
      isSignificant: boolean
      confidence: number
      winner?: string
    }
  }> {
    const experiment = await this.getExperiment(experimentId)
    if (!experiment) {
      throw new Error('Experiment not found')
    }

    const results = []

    for (const variant of experiment.variants) {
      // Get participants count
      const participants = await prisma.onboardingAnalytics.count({
        where: {
          experimentId,
          variantId: variant.id,
          eventType: OnboardingEventType.EXPERIMENT_VIEWED
        }
      })

      // Calculate conversions based on primary metric
      const primaryMetric = experiment.metrics.find(m => m.isPrimary)
      let conversions = 0

      if (primaryMetric?.eventType) {
        conversions = await prisma.onboardingAnalytics.count({
          where: {
            experimentId,
            variantId: variant.id,
            eventType: primaryMetric.eventType
          }
        })
      }

      const conversionRate = participants > 0 ? (conversions / participants) * 100 : 0

      // Calculate other metrics
      const metrics: Record<string, number> = {}
      for (const metric of experiment.metrics) {
        if (metric.eventType && metric.eventType !== primaryMetric?.eventType) {
          metrics[metric.name] = await prisma.onboardingAnalytics.count({
            where: {
              experimentId,
              variantId: variant.id,
              eventType: metric.eventType
            }
          })
        }
      }

      results.push({
        variant,
        participants,
        conversions,
        conversionRate,
        metrics
      })
    }

    // Calculate statistical significance if enough data
    const statisticalSignificance = this.calculateStatisticalSignificance(results)

    return {
      experiment,
      variants: results,
      statisticalSignificance
    }
  }

  // Private helper methods
  private async getExperiment(experimentId: string): Promise<ABExperiment | null> {
    try {
      const config = await prisma.systemConfig.findUnique({
        where: { key: `ab_experiment_${experimentId}` }
      })

      return config ? (config.value as ABExperiment) : null
    } catch {
      return null
    }
  }

  private async checkExperimentEligibility(experiment: ABExperiment): Promise<boolean> {
    if (!this.userId) return false

    // Check traffic allocation
    const userHash = this.hashUserId(this.userId, experiment.id)
    const inTraffic = userHash < (experiment.trafficAllocation / 100)
    
    if (!inTraffic) return false

    // Check targeting rules
    if (experiment.targeting.userSegments || experiment.targeting.userAttributes) {
      const user = await prisma.user.findUnique({
        where: { id: this.userId },
        include: { organization: true }
      })

      if (!user) return false

      // Add targeting logic here based on user attributes
      // This is a simplified version - you'd implement more sophisticated targeting
    }

    return true
  }

  private assignVariant(experiment: ABExperiment): ABVariant | null {
    if (!this.userId) return null

    const userHash = this.hashUserId(this.userId, experiment.id + '_variant')
    let cumulative = 0

    for (const variant of experiment.variants) {
      cumulative += variant.weight
      if (userHash * 100 < cumulative) {
        return variant
      }
    }

    return experiment.variants[0] // Fallback to first variant
  }

  private hashUserId(userId: string, seed: string): number {
    // Simple hash function for deterministic variant assignment
    let hash = 0
    const str = userId + seed
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash) / Math.pow(2, 31) // Normalize to 0-1
  }

  private async recordExperimentAssignment(experimentId: string, variantId: string): Promise<void> {
    if (!this.userId) return

    // Record in analytics for later analysis
    await this.trackEvent(OnboardingEventType.EXPERIMENT_VIEWED, {
      experimentId,
      variantId,
      action: 'assigned',
      userId: this.userId,
      sessionId: this.sessionId,
      timestamp: new Date().toISOString()
    })
  }

  private async trackEvent(eventType: OnboardingEventType, eventData: any): Promise<void> {
    try {
      await prisma.onboardingAnalytics.create({
        data: {
          eventType,
          userId: this.userId,
          experimentId: eventData.experimentId,
          variantId: eventData.variantId,
          eventData,
          sessionId: this.sessionId,
          timestamp: new Date()
        }
      })
    } catch (error) {
      console.error('Failed to track A/B test event:', error)
    }
  }

  private validateExperimentConfig(experiment: Omit<ABExperiment, 'id' | 'createdAt' | 'updatedAt'>): void {
    // Validate variant weights sum to 100
    const totalWeight = experiment.variants.reduce((sum, variant) => sum + variant.weight, 0)
    if (Math.abs(totalWeight - 100) > 0.01) {
      throw new Error('Variant weights must sum to 100%')
    }

    // Ensure at least one control variant
    const hasControl = experiment.variants.some(v => v.isControl)
    if (!hasControl) {
      throw new Error('Experiment must have at least one control variant')
    }

    // Validate metric configuration
    const primaryMetrics = experiment.metrics.filter(m => m.isPrimary)
    if (primaryMetrics.length !== 1) {
      throw new Error('Experiment must have exactly one primary metric')
    }
  }

  private calculateStatisticalSignificance(results: any[]): {
    isSignificant: boolean
    confidence: number
    winner?: string
  } | undefined {
    // Simplified statistical significance calculation
    // In production, you'd use proper statistical tests
    
    if (results.length < 2) return undefined

    const control = results.find(r => r.variant.isControl)
    const variants = results.filter(r => !r.variant.isControl)
    
    if (!control || variants.length === 0) return undefined

    // Find best performing variant
    const bestVariant = [...variants, control].reduce((best, current) => 
      current.conversionRate > best.conversionRate ? current : best
    )

    // Simple significance check (in production, use proper statistical tests)
    const isSignificant = Math.abs(bestVariant.conversionRate - control.conversionRate) > 2.0 // 2% threshold
    const confidence = isSignificant ? 95 : 80 // Simplified confidence calculation

    return {
      isSignificant,
      confidence,
      winner: isSignificant ? bestVariant.variant.id : undefined
    }
  }
}

// Utility functions for common A/B test scenarios
export const ONBOARDING_EXPERIMENTS = {
  WELCOME_MESSAGE_TEST: {
    name: 'Welcome Message Variation Test',
    description: 'Test different welcome messages for conversion impact',
    type: 'CONTENT_TEST' as const,
    variants: [
      {
        id: 'welcome_control',
        name: 'Standard Welcome',
        description: 'Current welcome message',
        weight: 50,
        isControl: true,
        configuration: { messageType: 'standard' }
      },
      {
        id: 'welcome_urgent',
        name: 'Urgency-focused Welcome',
        description: 'Welcome message emphasizing time-sensitive benefits',
        weight: 50,
        isControl: false,
        configuration: { messageType: 'urgent' }
      }
    ],
    metrics: [
      {
        id: 'completion_rate',
        name: 'Onboarding Completion Rate',
        type: 'CONVERSION' as const,
        eventType: OnboardingEventType.STEP_COMPLETED,
        description: 'Percentage of users who complete onboarding',
        isPrimary: true,
        goal: 'INCREASE' as const
      }
    ]
  },

  AGENT_SELECTION_FLOW: {
    name: 'Agent Selection Flow Test',
    description: 'Test simplified vs detailed agent selection',
    type: 'ONBOARDING_FLOW' as const,
    variants: [
      {
        id: 'detailed_selection',
        name: 'Detailed Selection',
        description: 'Show full agent capabilities and comparison',
        weight: 50,
        isControl: true,
        configuration: { flowType: 'detailed' }
      },
      {
        id: 'simplified_selection',
        name: 'Simplified Selection',
        description: 'Quick agent selection with minimal details',
        weight: 50,
        isControl: false,
        configuration: { flowType: 'simplified' }
      }
    ]
  }
}

export default ABTestingManager