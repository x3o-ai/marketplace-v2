import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { OnboardingManager, OnboardingTemplateManager } from '@/lib/onboarding'
import { OnboardingStepStatus } from '@/types/onboarding'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const templateId = searchParams.get('templateId')

    if (!userId) {
      return NextResponse.json({
        success: false,
        message: 'User ID is required'
      }, { status: 400 })
    }

    const manager = new OnboardingManager(userId)
    
    // Get user's onboarding template
    let template = null
    if (templateId) {
      template = await prisma.onboardingTemplate.findUnique({
        where: { id: templateId }
      })
    } else {
      template = await OnboardingTemplateManager.getUserTemplate(userId)
    }

    // Get all steps and progress
    const [steps, progress] = await Promise.all([
      prisma.onboardingStep.findMany({
        where: { active: true },
        orderBy: { order: 'asc' }
      }),
      manager.getProgress()
    ])

    // Transform into checklist items
    const items = steps.map(step => {
      const stepProgress = progress.find(p => p.stepId === step.id)
      
      return {
        id: step.id,
        title: step.title || step.name,
        description: step.description || '',
        status: stepProgress?.status || OnboardingStepStatus.NOT_STARTED,
        estimatedTime: step.estimatedMinutes || 5,
        optional: !step.required,
        category: step.category || 'general',
        reward: extractRewardFromContent(step.content)
      }
    })

    // Calculate completion percentage
    const completionPercentage = await manager.getCompletionPercentage()

    // Get template-specific customizations
    if (template) {
      // Filter or reorder items based on template
      const templateSteps = template.steps as any
      if (Array.isArray(templateSteps)) {
        // Reorder items based on template step order
        const orderedItems = templateSteps
          .map((stepKey: string) => items.find(item => item.id === stepKey))
          .filter(Boolean)
        
        // Add any remaining items not in template
        const remainingItems = items.filter(item => 
          !templateSteps.includes(item.id)
        )
        
        return NextResponse.json({
          success: true,
          items: [...orderedItems, ...remainingItems],
          completionPercentage,
          template: {
            id: template.id,
            name: template.name,
            description: template.description
          }
        })
      }
    }

    return NextResponse.json({
      success: true,
      items,
      completionPercentage,
      template: null
    })

  } catch (error) {
    console.error('Failed to fetch onboarding checklist:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch onboarding checklist'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, action, itemIds } = body

    if (!userId || !action) {
      return NextResponse.json({
        success: false,
        message: 'User ID and action are required'
      }, { status: 400 })
    }

    const manager = new OnboardingManager(userId)

    switch (action) {
      case 'mark_completed':
        if (!Array.isArray(itemIds)) {
          return NextResponse.json({
            success: false,
            message: 'Item IDs array is required for mark_completed action'
          }, { status: 400 })
        }

        const results = []
        for (const itemId of itemIds) {
          try {
            const result = await manager.completeStep(itemId, { 
              source: 'checklist', 
              timestamp: new Date().toISOString() 
            })
            results.push(result)
          } catch (error) {
            console.error(`Failed to complete step ${itemId}:`, error)
          }
        }

        return NextResponse.json({
          success: true,
          message: `Marked ${results.length} items as completed`,
          completedItems: results
        })

      case 'reset_progress':
        // Reset all progress for user (use with caution)
        await prisma.userOnboardingProgress.deleteMany({
          where: { userId }
        })

        return NextResponse.json({
          success: true,
          message: 'Onboarding progress reset successfully'
        })

      default:
        return NextResponse.json({
          success: false,
          message: 'Invalid action'
        }, { status: 400 })
    }

  } catch (error) {
    console.error('Failed to update checklist:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to update checklist'
    }, { status: 500 })
  }
}

// Helper function to extract reward information from step content
function extractRewardFromContent(content: any): string | undefined {
  if (!content) return undefined
  
  if (typeof content === 'object') {
    return content.reward || content.badge || content.unlock
  }
  
  return undefined
}