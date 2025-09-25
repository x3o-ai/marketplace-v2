import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { OnboardingManager } from '@/lib/onboarding'
import { z } from 'zod'

const progressQuerySchema = z.object({
  userId: z.string()
})

const updateProgressSchema = z.object({
  userId: z.string(),
  stepId: z.string(),
  action: z.enum(['start', 'complete', 'skip', 'fail']),
  data: z.object({}).passthrough().optional(),
  variantId: z.string().optional(),
  error: z.string().optional()
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({
        success: false,
        message: 'User ID is required'
      }, { status: 400 })
    }

    const manager = new OnboardingManager(userId)
    const progress = await manager.getProgress()
    const completionPercentage = await manager.getCompletionPercentage()

    return NextResponse.json({
      success: true,
      progress,
      completionPercentage
    })
  } catch (error) {
    console.error('Failed to fetch onboarding progress:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch onboarding progress'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = updateProgressSchema.parse(body)
    
    const manager = new OnboardingManager(validatedData.userId)
    let result

    switch (validatedData.action) {
      case 'start':
        result = await manager.startStep(validatedData.stepId, validatedData.variantId)
        break
      
      case 'complete':
        result = await manager.completeStep(validatedData.stepId, validatedData.data)
        break
      
      case 'skip':
        result = await manager.skipStep(validatedData.stepId, validatedData.error || 'User skipped')
        break
      
      case 'fail':
        if (!validatedData.error) {
          return NextResponse.json({
            success: false,
            message: 'Error message is required for failed steps'
          }, { status: 400 })
        }
        result = await manager.failStep(validatedData.stepId, validatedData.error)
        break
      
      default:
        return NextResponse.json({
          success: false,
          message: 'Invalid action'
        }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      progress: result
    })
  } catch (error) {
    console.error('Failed to update onboarding progress:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        message: 'Invalid request data',
        errors: error.errors
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      message: 'Failed to update onboarding progress'
    }, { status: 500 })
  }
}