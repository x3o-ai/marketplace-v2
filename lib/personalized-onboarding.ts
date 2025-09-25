import { prisma } from './prisma'
import { OnboardingTemplateManager } from './onboarding'
import { UserProfile, OnboardingTemplate } from '@/types/onboarding'

// Onboarding path configurations
export interface OnboardingPath {
  id: string
  name: string
  description: string
  targetAudience: string[]
  steps: string[]
  estimatedTimeMinutes: number
  customizations: {
    skipSteps?: string[]
    emphasizeSteps?: string[]
    additionalContent?: Record<string, any>
    agentPriority?: ('oracle' | 'sentinel' | 'sage')[]
  }
}

export const ONBOARDING_PATHS: Record<string, OnboardingPath> = {
  executive: {
    id: 'executive',
    name: 'Executive Path',
    description: 'Streamlined onboarding focused on business outcomes and ROI',
    targetAudience: ['CEO', 'Founder', 'VP', 'Director', 'C-level'],
    steps: [
      'welcome',
      'executive_profile_setup',
      'roi_focused_agent_intro',
      'choose_primary_agent',
      'business_impact_demo',
      'executive_milestone',
      'strategic_features',
      'completion'
    ],
    estimatedTimeMinutes: 8,
    customizations: {
      skipSteps: ['detailed_technical_setup'],
      emphasizeSteps: ['roi_focused_agent_intro', 'business_impact_demo'],
      agentPriority: ['oracle', 'sage', 'sentinel'],
      additionalContent: {
        focusOnROI: true,
        showBusinessMetrics: true,
        highlightLeadershipFeatures: true
      }
    }
  },

  technical: {
    id: 'technical',
    name: 'Technical Path',
    description: 'Comprehensive setup for technical users with integration focus',
    targetAudience: ['CTO', 'Engineer', 'Developer', 'DevOps', 'System Administrator'],
    steps: [
      'welcome',
      'technical_profile_setup',
      'agent_introduction',
      'technical_capabilities_demo',
      'integration_overview',
      'first_technical_interaction',
      'system_setup_milestone',
      'advanced_features_discovery',
      'integration_setup',
      'completion'
    ],
    estimatedTimeMinutes: 15,
    customizations: {
      emphasizeSteps: ['technical_capabilities_demo', 'integration_overview'],
      agentPriority: ['sentinel', 'oracle', 'sage'],
      additionalContent: {
        showTechnicalSpecs: true,
        highlightAPIAccess: true,
        emphasizeSecurityFeatures: true,
        showIntegrationOptions: true
      }
    }
  },

  marketing: {
    id: 'marketing',
    name: 'Marketing Path',
    description: 'Content and campaign focused onboarding for marketing teams',
    targetAudience: ['Marketing', 'Content', 'Growth', 'Creative', 'Brand'],
    steps: [
      'welcome',
      'marketing_profile_setup',
      'content_agent_intro',
      'sage_priority_demo',
      'content_generation_tutorial',
      'campaign_optimization_demo',
      'marketing_milestone',
      'creative_features_discovery',
      'completion'
    ],
    estimatedTimeMinutes: 12,
    customizations: {
      emphasizeSteps: ['content_generation_tutorial', 'campaign_optimization_demo'],
      agentPriority: ['sage', 'oracle', 'sentinel'],
      additionalContent: {
        focusOnContentCreation: true,
        showEngagementMetrics: true,
        highlightCreativeFeatures: true,
        showCampaignTemplates: true
      }
    }
  },

  analyst: {
    id: 'analyst',
    name: 'Analyst Path',
    description: 'Data and analytics focused onboarding for business analysts',
    targetAudience: ['Analyst', 'Data Scientist', 'BI', 'Research', 'Strategy'],
    steps: [
      'welcome',
      'analyst_profile_setup',
      'data_focused_agent_intro',
      'oracle_deep_dive',
      'analytics_methodology_demo',
      'data_interpretation_tutorial',
      'analyst_milestone',
      'advanced_analytics_features',
      'completion'
    ],
    estimatedTimeMinutes: 14,
    customizations: {
      emphasizeSteps: ['oracle_deep_dive', 'analytics_methodology_demo'],
      agentPriority: ['oracle', 'sentinel', 'sage'],
      additionalContent: {
        focusOnDataAccuracy: true,
        showStatisticalMethods: true,
        highlightVisualizationTools: true,
        emphasizeDataSources: true
      }
    }
  },

  quick_start: {
    id: 'quick_start',
    name: 'Quick Start',
    description: 'Fast 5-minute setup for users with limited time',
    targetAudience: ['busy', 'limited_time', 'quick_evaluation'],
    steps: [
      'welcome',
      'minimal_profile_setup',
      'agent_selection',
      'quick_demo',
      'instant_results',
      'completion'
    ],
    estimatedTimeMinutes: 5,
    customizations: {
      skipSteps: ['detailed_features', 'advanced_setup'],
      additionalContent: {
        fastTrackMode: true,
        showEssentialsOnly: true,
        autoSelectBestAgent: true
      }
    }
  }
}

export class PersonalizedOnboardingManager {
  private userId: string

  constructor(userId: string) {
    this.userId = userId
  }

  // Analyze user profile and recommend best onboarding path
  async recommendPath(profile: UserProfile): Promise<OnboardingPath> {
    const pathScores = this.calculatePathScores(profile)
    const bestPathId = Object.keys(pathScores).reduce((a, b) => 
      pathScores[a] > pathScores[b] ? a : b
    )
    
    return ONBOARDING_PATHS[bestPathId] || ONBOARDING_PATHS.quick_start
  }

  // Calculate scores for each onboarding path based on user profile
  private calculatePathScores(profile: UserProfile): Record<string, number> {
    const scores: Record<string, number> = {}

    for (const [pathId, path] of Object.entries(ONBOARDING_PATHS)) {
      let score = 0

      // Role-based scoring
      if (profile.jobTitle) {
        const titleLower = profile.jobTitle.toLowerCase()
        const roleMatches = path.targetAudience.some(audience => 
          titleLower.includes(audience.toLowerCase())
        )
        if (roleMatches) score += 30
      }

      // Department-based scoring
      if (profile.department) {
        const deptLower = profile.department.toLowerCase()
        const deptMatches = path.targetAudience.some(audience => 
          deptLower.includes(audience.toLowerCase())
        )
        if (deptMatches) score += 20
      }

      // Company size considerations
      if (profile.organization?.size) {
        const size = profile.organization.size
        
        // Larger companies may prefer technical/analyst paths
        if ((pathId === 'technical' || pathId === 'analyst') && 
            (size.includes('1000+') || size.includes('201-1000'))) {
          score += 10
        }
        
        // Smaller companies may prefer executive/quick paths
        if ((pathId === 'executive' || pathId === 'quick_start') && 
            (size.includes('1-10') || size.includes('11-50'))) {
          score += 10
        }
      }

      // Time preference considerations
      if (profile.preferences?.timeAvailable === 'quick' && pathId === 'quick_start') {
        score += 25
      } else if (profile.preferences?.timeAvailable === 'thorough' && pathId !== 'quick_start') {
        score += 15
      }

      // Use case alignment
      if (profile.preferences?.primaryUseCase) {
        const useCase = profile.preferences.primaryUseCase
        
        if (useCase === 'analytics' && pathId === 'analyst') score += 20
        if (useCase === 'monitoring' && pathId === 'technical') score += 20
        if (useCase === 'content' && pathId === 'marketing') score += 20
        if (useCase === 'automation' && pathId === 'technical') score += 15
      }

      // Industry-specific adjustments
      if (profile.organization?.industry) {
        const industry = profile.organization.industry.toLowerCase()
        
        if (industry.includes('technology') && pathId === 'technical') score += 10
        if (industry.includes('marketing') && pathId === 'marketing') score += 10
        if (industry.includes('finance') && pathId === 'analyst') score += 10
      }

      scores[pathId] = Math.max(score, 1) // Ensure minimum score
    }

    return scores
  }

  // Create personalized onboarding template
  async createPersonalizedTemplate(
    profile: UserProfile, 
    path: OnboardingPath
  ): Promise<OnboardingTemplate> {
    // Check if user already has a template
    const existingTemplate = await OnboardingTemplateManager.getUserTemplate(this.userId)
    
    if (existingTemplate) {
      return existingTemplate
    }

    // Create new personalized template
    const template = await prisma.onboardingTemplate.create({
      data: {
        name: `${path.name} for ${profile.name || 'User'}`,
        description: `Personalized ${path.description.toLowerCase()}`,
        targetAudience: {
          role: profile.jobTitle,
          department: profile.department,
          companySize: profile.organization?.size,
          industry: profile.organization?.industry,
          preferences: profile.preferences
        },
        steps: path.steps,
        industry: profile.organization?.industry,
        companySize: profile.organization?.size,
        role: profile.jobTitle,
        weight: 1.0,
        active: true
      }
    })

    // Assign template to user
    await prisma.userOnboardingTemplate.create({
      data: {
        userId: this.userId,
        templateId: template.id,
        reason: `Auto-assigned based on ${path.name} matching user profile`,
        assignmentData: {
          profileAnalysis: profile,
          pathRecommendation: path,
          timestamp: new Date().toISOString()
        }
      }
    })

    return template
  }

  // Get customized step content based on path
  getCustomizedStepContent(stepId: string, path: OnboardingPath): any {
    const baseCustomizations = path.customizations
    
    if (baseCustomizations.skipSteps?.includes(stepId)) {
      return { skip: true, reason: 'Not relevant for this user path' }
    }

    const customContent: any = {
      emphasized: baseCustomizations.emphasizeSteps?.includes(stepId),
      additionalContent: baseCustomizations.additionalContent || {}
    }

    // Step-specific customizations
    switch (stepId) {
      case 'agent_introduction':
        customContent.agentOrder = baseCustomizations.agentPriority || ['oracle', 'sentinel', 'sage']
        break
      
      case 'choose_primary_agent':
        customContent.recommendedAgent = baseCustomizations.agentPriority?.[0] || 'oracle'
        break
      
      case 'first_interaction':
        customContent.suggestedQueries = this.getCustomizedQueries(path)
        break
    }

    return customContent
  }

  // Get customized sample queries based on path
  private getCustomizedQueries(path: OnboardingPath): string[] {
    const queryMap: Record<string, string[]> = {
      executive: [
        'What are our top 3 business opportunities this quarter?',
        'Predict our revenue growth for the next 6 months',
        'Which departments have the highest ROI potential?'
      ],
      technical: [
        'Monitor our system performance and identify bottlenecks',
        'What security vulnerabilities should we prioritize?',
        'Analyze our API response times and suggest optimizations'
      ],
      marketing: [
        'Create a social media campaign for our new product',
        'What content types have the highest engagement?',
        'Optimize our email marketing conversion rates'
      ],
      analyst: [
        'Analyze customer behavior patterns from our data',
        'What factors most influence customer churn?',
        'Create a predictive model for sales forecasting'
      ],
      quick_start: [
        'Show me what Trinity Agents can do',
        'Give me a quick business insight',
        'Demonstrate your capabilities'
      ]
    }

    return queryMap[path.id] || queryMap.quick_start
  }

  // Track path effectiveness for optimization
  async trackPathPerformance(pathId: string, userId: string, metrics: {
    completionRate: number
    timeSpent: number
    satisfactionScore: number
    conversionToTrial: boolean
  }): Promise<void> {
    try {
      await prisma.onboardingAnalytics.create({
        data: {
          eventType: 'PATH_PERFORMANCE',
          userId,
          eventData: {
            pathId,
            metrics,
            timestamp: new Date().toISOString()
          }
        }
      })
    } catch (error) {
      console.error('Failed to track path performance:', error)
    }
  }
}

// Utility functions
export function getPathRecommendation(profile: UserProfile): string {
  // Quick heuristics for path recommendation
  if (profile.preferences?.timeAvailable === 'quick') {
    return 'quick_start'
  }

  if (profile.jobTitle) {
    const title = profile.jobTitle.toLowerCase()
    if (title.includes('ceo') || title.includes('founder') || title.includes('vp')) {
      return 'executive'
    }
    if (title.includes('engineer') || title.includes('developer') || title.includes('cto')) {
      return 'technical'
    }
    if (title.includes('marketing') || title.includes('content') || title.includes('creative')) {
      return 'marketing'
    }
    if (title.includes('analyst') || title.includes('data') || title.includes('research')) {
      return 'analyst'
    }
  }

  return 'quick_start' // Default fallback
}

export async function initializePersonalizedOnboarding(
  userId: string, 
  profile: UserProfile
): Promise<{
  path: OnboardingPath
  template: OnboardingTemplate
  estimatedTime: number
}> {
  const manager = new PersonalizedOnboardingManager(userId)
  const recommendedPath = await manager.recommendPath(profile)
  const template = await manager.createPersonalizedTemplate(profile, recommendedPath)

  return {
    path: recommendedPath,
    template,
    estimatedTime: recommendedPath.estimatedTimeMinutes
  }
}