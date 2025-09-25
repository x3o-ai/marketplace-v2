import { prisma } from './prisma'
import { OnboardingManager, OnboardingTemplateManager } from './onboarding'
import { EmailService, logEmail } from './email'
import { OnboardingStepStatus, OnboardingEventType } from '@/types/onboarding'

export interface DropOffDetection {
  userId: string
  lastActiveStep: string
  lastActiveTime: Date
  dropOffReason: 'TIME_BASED' | 'STEP_FAILURE' | 'ERROR_ENCOUNTERED' | 'USER_EXIT'
  context: any
  recoveryAttempts: number
  recoveryStatus: 'PENDING' | 'IN_PROGRESS' | 'RECOVERED' | 'ABANDONED'
}

export interface RecoveryAction {
  type: 'EMAIL' | 'IN_APP_NOTIFICATION' | 'SIMPLIFIED_FLOW' | 'PERSONAL_OUTREACH'
  trigger: 'IMMEDIATE' | 'DELAYED_1H' | 'DELAYED_24H' | 'DELAYED_72H' | 'WEEKLY'
  content: any
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
}

export class OnboardingRecoveryManager {
  private userId: string

  constructor(userId: string) {
    this.userId = userId
  }

  // Detect potential drop-offs
  async detectDropOffs(): Promise<DropOffDetection[]> {
    const now = new Date()
    const cutoffTimes = {
      immediate: new Date(now.getTime() - 5 * 60 * 1000), // 5 minutes
      short: new Date(now.getTime() - 60 * 60 * 1000), // 1 hour
      medium: new Date(now.getTime() - 24 * 60 * 60 * 1000), // 24 hours
      long: new Date(now.getTime() - 72 * 60 * 60 * 1000) // 72 hours
    }

    // Find users with incomplete onboarding
    const incompleteUsers = await prisma.user.findMany({
      where: {
        createdAt: {
          gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) // Within last 30 days
        }
      },
      include: {
        onboardingProgress: {
          include: { step: true },
          orderBy: { updatedAt: 'desc' }
        }
      }
    })

    const dropOffs: DropOffDetection[] = []

    for (const user of incompleteUsers) {
      const manager = new OnboardingManager(user.id)
      const completionPercentage = await manager.getCompletionPercentage()

      if (completionPercentage >= 100) continue // Onboarding complete

      const lastProgress = user.onboardingProgress[0]
      if (!lastProgress) continue

      const timeSinceLastActivity = now.getTime() - lastProgress.updatedAt.getTime()
      const lastActiveTime = lastProgress.updatedAt

      let dropOffReason: DropOffDetection['dropOffReason'] = 'TIME_BASED'
      
      // Analyze drop-off reason
      if (lastProgress.status === OnboardingStepStatus.FAILED) {
        dropOffReason = 'STEP_FAILURE'
      } else if (lastProgress.errors && Object.keys(lastProgress.errors).length > 0) {
        dropOffReason = 'ERROR_ENCOUNTERED'
      } else if (timeSinceLastActivity > 60 * 60 * 1000) { // More than 1 hour
        dropOffReason = 'TIME_BASED'
      }

      // Check existing recovery attempts
      const existingRecovery = await this.getExistingRecovery(user.id)

      dropOffs.push({
        userId: user.id,
        lastActiveStep: lastProgress.step.key,
        lastActiveTime,
        dropOffReason,
        context: {
          completionPercentage,
          stepsCompleted: user.onboardingProgress.filter(p => 
            p.status === OnboardingStepStatus.COMPLETED
          ).length,
          lastError: lastProgress.lastError,
          userProfile: {
            name: user.name,
            email: user.email,
            createdAt: user.createdAt
          }
        },
        recoveryAttempts: existingRecovery?.attempts || 0,
        recoveryStatus: existingRecovery?.status || 'PENDING'
      })
    }

    return dropOffs
  }

  // Execute recovery actions for drop-offs
  async executeRecoveryActions(dropOffs: DropOffDetection[]): Promise<void> {
    for (const dropOff of dropOffs) {
      if (dropOff.recoveryStatus === 'ABANDONED' || dropOff.recoveryAttempts >= 5) {
        continue // Skip abandoned or over-attempted recoveries
      }

      const recoveryActions = this.determineRecoveryActions(dropOff)
      
      for (const action of recoveryActions) {
        await this.executeRecoveryAction(dropOff, action)
      }
    }
  }

  // Determine appropriate recovery actions
  private determineRecoveryActions(dropOff: DropOffDetection): RecoveryAction[] {
    const actions: RecoveryAction[] = []
    const timeSinceDropOff = Date.now() - dropOff.lastActiveTime.getTime()
    const hoursAgo = timeSinceDropOff / (1000 * 60 * 60)

    // Immediate recovery (within 5 minutes)
    if (hoursAgo <= 0.1 && dropOff.recoveryAttempts === 0) {
      actions.push({
        type: 'IN_APP_NOTIFICATION',
        trigger: 'IMMEDIATE',
        content: {
          title: 'Continue Your Setup',
          message: 'You\'re almost done! Complete your Trinity Agent setup in just 2 more minutes.',
          ctaText: 'Continue Setup',
          ctaUrl: `/onboarding?step=${dropOff.lastActiveStep}`
        },
        priority: 'HIGH'
      })
    }

    // 1-hour recovery email
    if (hoursAgo >= 1 && hoursAgo <= 2 && dropOff.recoveryAttempts <= 1) {
      actions.push({
        type: 'EMAIL',
        trigger: 'DELAYED_1H',
        content: this.getRecoveryEmailContent('1hour', dropOff),
        priority: 'HIGH'
      })
    }

    // 24-hour recovery with simplified flow
    if (hoursAgo >= 24 && hoursAgo <= 48 && dropOff.recoveryAttempts <= 2) {
      actions.push({
        type: 'EMAIL',
        trigger: 'DELAYED_24H',
        content: this.getRecoveryEmailContent('24hour', dropOff),
        priority: 'MEDIUM'
      })

      actions.push({
        type: 'SIMPLIFIED_FLOW',
        trigger: 'DELAYED_24H',
        content: {
          skipToStep: this.getSimplifiedResumeStep(dropOff.lastActiveStep),
          simplifications: ['skip_detailed_explanations', 'auto_select_defaults', 'reduce_options']
        },
        priority: 'MEDIUM'
      })
    }

    // 72-hour final attempt
    if (hoursAgo >= 72 && hoursAgo <= 168 && dropOff.recoveryAttempts <= 3) {
      actions.push({
        type: 'EMAIL',
        trigger: 'DELAYED_72H',
        content: this.getRecoveryEmailContent('final', dropOff),
        priority: 'LOW'
      })
    }

    // Weekly check for high-value prospects
    if (hoursAgo >= 168 && dropOff.context.completionPercentage > 50) {
      actions.push({
        type: 'PERSONAL_OUTREACH',
        trigger: 'WEEKLY',
        content: {
          reason: 'high_completion_rate',
          personalizedMessage: true,
          offerCall: true
        },
        priority: 'MEDIUM'
      })
    }

    return actions
  }

  // Execute individual recovery action
  private async executeRecoveryAction(dropOff: DropOffDetection, action: RecoveryAction): Promise<void> {
    try {
      switch (action.type) {
        case 'EMAIL':
          await this.sendRecoveryEmail(dropOff, action.content)
          break

        case 'IN_APP_NOTIFICATION':
          await this.createInAppNotification(dropOff, action.content)
          break

        case 'SIMPLIFIED_FLOW':
          await this.setupSimplifiedFlow(dropOff, action.content)
          break

        case 'PERSONAL_OUTREACH':
          await this.schedulePersonalOutreach(dropOff, action.content)
          break
      }

      // Track recovery attempt
      await this.trackRecoveryAttempt(dropOff.userId, action.type, 'EXECUTED')

      // Update recovery status
      await this.updateRecoveryStatus(dropOff.userId, 'IN_PROGRESS')

    } catch (error) {
      console.error('Failed to execute recovery action:', error)
      await this.trackRecoveryAttempt(dropOff.userId, action.type, 'FAILED')
    }
  }

  // Send recovery email
  private async sendRecoveryEmail(dropOff: DropOffDetection, emailContent: any): Promise<void> {
    const result = await EmailService.sendEmail({
      to: dropOff.context.userProfile.email,
      subject: emailContent.subject,
      html: emailContent.html
    })

    await logEmail({
      userId: dropOff.userId,
      type: 'ONBOARDING_RECOVERY',
      recipient: dropOff.context.userProfile.email,
      subject: emailContent.subject,
      content: emailContent.html,
      provider: 'sendgrid',
      providerMessageId: result.messageId,
      status: result.success ? 'SENT' : 'FAILED',
      error: result.error
    })
  }

  // Get recovery email content templates
  private getRecoveryEmailContent(type: string, dropOff: DropOffDetection): any {
    const userName = dropOff.context.userProfile.name || 'there'
    const completionPercentage = dropOff.context.completionPercentage
    const resumeUrl = `${process.env.NEXT_PUBLIC_APP_URL}/onboarding?step=${dropOff.lastActiveStep}`

    const templates = {
      '1hour': {
        subject: `${userName}, you're ${completionPercentage}% done with Trinity Agent setup`,
        html: `
          <h2>Quick question, ${userName}...</h2>
          <p>I noticed you started setting up Trinity Agents but didn't finish. Did you run into any issues?</p>
          
          <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>You're ${completionPercentage}% complete!</h3>
            <p>Just ${Math.ceil((100 - completionPercentage) * 0.1)} more minutes to unlock:</p>
            <ul>
              <li>✅ Predictive business analytics</li>
              <li>✅ 24/7 system monitoring</li>
              <li>✅ Intelligent content generation</li>
            </ul>
          </div>
          
          <a href="${resumeUrl}" style="background: #37322f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Continue Setup (${Math.ceil((100 - completionPercentage) * 0.1)} min)
          </a>
          
          <p style="margin-top: 20px;">
            <small>Having trouble? Just reply to this email and I'll personally help you get set up.</small>
          </p>
        `
      },

      '24hour': {
        subject: `${userName}, let's finish your Trinity Agent setup`,
        html: `
          <h2>Hi ${userName},</h2>
          <p>You're so close to experiencing the full power of Trinity Agents!</p>
          
          <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #f59e0b;">
            <h3>⚡ Quick Setup Available</h3>
            <p>Since it's been a day, I've prepared a streamlined 2-minute setup that skips the details and gets you straight to results.</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resumeUrl}&quick=true" style="background: #10b981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              Complete Setup in 2 Minutes
            </a>
          </div>
          
          <p>Or if you prefer, <a href="${resumeUrl}">continue where you left off</a> with the full experience.</p>
        `
      },

      'final': {
        subject: `Last chance to activate Trinity Agents, ${userName}`,
        html: `
          <h2>Hi ${userName},</h2>
          <p>This is my final email about your Trinity Agent setup.</p>
          
          <p>I completely understand if you're not ready right now - but I wanted to make sure you know what you're missing:</p>
          
          <div style="background: #fee2e2; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>🚨 What you'll lose access to:</h3>
            <ul>
              <li>94% accurate revenue predictions</li>
              <li>Automated system optimization</li>
              <li>AI-powered content generation</li>
              <li>14-day free trial worth $2,500</li>
            </ul>
          </div>
          
          <div style="text-align: center;">
            <a href="${resumeUrl}&final=true" style="background: #dc2626; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              Activate Before It's Gone
            </a>
          </div>
          
          <p style="text-align: center; margin-top: 20px;">
            <small>This is the last email you'll receive about Trinity Agents.<br>
            If you change your mind later, you'll need to start over.</small>
          </p>
        `
      }
    }

    return templates[type as keyof typeof templates] || templates['1hour']
  }

  // Create simplified flow for recovery
  private async setupSimplifiedFlow(dropOff: DropOffDetection, content: any): Promise<void> {
    // Create a simplified template for this user
    const simplifiedTemplate = await prisma.onboardingTemplate.create({
      data: {
        name: `Recovery Flow for ${dropOff.context.userProfile.name}`,
        description: 'Simplified onboarding flow for recovery',
        targetAudience: { recoveryUser: true },
        steps: this.getSimplifiedSteps(dropOff.lastActiveStep),
        active: true,
        weight: 1.0
      }
    })

    // Assign to user
    await prisma.userOnboardingTemplate.create({
      data: {
        userId: dropOff.userId,
        templateId: simplifiedTemplate.id,
        reason: 'Onboarding recovery - simplified flow',
        assignmentData: {
          originalDropOff: dropOff,
          simplifications: content.simplifications
        }
      }
    })
  }

  // Get simplified step sequence
  private getSimplifiedSteps(lastActiveStep: string): string[] {
    const stepProgressions: Record<string, string[]> = {
      'welcome': ['welcome', 'quick_agent_selection', 'instant_demo', 'completion'],
      'profile_setup': ['agent_selection', 'quick_demo', 'completion'],
      'agent_introduction': ['choose_primary_agent', 'first_interaction', 'completion'],
      'first_interaction': ['success_milestone', 'completion'],
      'default': ['quick_demo', 'completion']
    }

    return stepProgressions[lastActiveStep] || stepProgressions['default']
  }

  private getSimplifiedResumeStep(lastActiveStep: string): string {
    const resumeMap: Record<string, string> = {
      'welcome': 'quick_agent_selection',
      'profile_setup': 'agent_selection',
      'agent_introduction': 'choose_primary_agent',
      'first_interaction': 'success_milestone'
    }

    return resumeMap[lastActiveStep] || 'quick_demo'
  }

  // Helper methods
  private async getExistingRecovery(userId: string): Promise<{ attempts: number; status: string } | null> {
    const recoveryEvents = await prisma.onboardingAnalytics.findMany({
      where: {
        userId,
        eventType: OnboardingEventType.RECOVERY_ATTEMPT
      }
    })

    if (recoveryEvents.length === 0) return null

    return {
      attempts: recoveryEvents.length,
      status: recoveryEvents[recoveryEvents.length - 1].eventData.status || 'PENDING'
    }
  }

  private async trackRecoveryAttempt(userId: string, actionType: string, status: string): Promise<void> {
    await prisma.onboardingAnalytics.create({
      data: {
        eventType: OnboardingEventType.RECOVERY_ATTEMPT,
        userId,
        eventData: {
          actionType,
          status,
          timestamp: new Date().toISOString()
        }
      }
    })
  }

  private async updateRecoveryStatus(userId: string, status: string): Promise<void> {
    await this.trackRecoveryAttempt(userId, 'STATUS_UPDATE', status)
  }

  private async createInAppNotification(dropOff: DropOffDetection, content: any): Promise<void> {
    // This would integrate with your notification system
    console.log('Would create in-app notification:', content)
  }

  private async schedulePersonalOutreach(dropOff: DropOffDetection, content: any): Promise<void> {
    // This would integrate with your CRM or sales system
    console.log('Would schedule personal outreach for:', dropOff.userId)
  }
}

// Background job to process recovery flows
export async function processOnboardingRecovery(): Promise<void> {
  const recoveryManager = new OnboardingRecoveryManager('')
  
  try {
    const dropOffs = await recoveryManager.detectDropOffs()
    console.log(`Found ${dropOffs.length} users who dropped off onboarding`)
    
    if (dropOffs.length > 0) {
      await recoveryManager.executeRecoveryActions(dropOffs)
      console.log('Recovery actions executed successfully')
    }
  } catch (error) {
    console.error('Failed to process onboarding recovery:', error)
  }
}

// Recovery configuration
export const RECOVERY_CONFIG = {
  maxRecoveryAttempts: 5,
  recoveryTimeouts: {
    immediate: 5 * 60 * 1000, // 5 minutes
    short: 60 * 60 * 1000, // 1 hour
    medium: 24 * 60 * 60 * 1000, // 24 hours
    long: 72 * 60 * 60 * 1000 // 72 hours
  },
  emailTemplates: {
    subject_personalization: true,
    include_progress_bar: true,
    show_roi_metrics: true,
    offer_simplified_flow: true
  }
}

export default OnboardingRecoveryManager