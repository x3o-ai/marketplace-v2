import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { executeTrialInteraction, getTrialStatus, verifyTrialAccessToken } from '@/lib/trinity-agents'

// Enhanced Trinity Agent trial access schema
const trialAccessSchema = z.object({
  userId: z.string(),
  agentType: z.enum(['oracle', 'sentinel', 'sage']),
  action: z.enum(['query', 'interact', 'status']),
  query: z.string().optional(),
  context: z.object({}).passthrough().optional(),
  accessToken: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = trialAccessSchema.parse(body)
    
    // Verify access token if provided
    if (validatedData.accessToken) {
      const tokenData = verifyTrialAccessToken(validatedData.accessToken)
      if (!tokenData || tokenData.userId !== validatedData.userId || tokenData.agentType !== validatedData.agentType) {
        return NextResponse.json({
          success: false,
          message: 'Invalid or expired access token',
          error: 'INVALID_TOKEN'
        }, { status: 401 })
      }
    }

    // Get current trial status
    const trialStatus = await getTrialStatus(validatedData.userId)
    if (!trialStatus) {
      return NextResponse.json({
        success: false,
        message: 'Trial access not found or expired',
        error: 'TRIAL_NOT_FOUND'
      }, { status: 404 })
    }

    if (trialStatus.status !== 'ACTIVE') {
      return NextResponse.json({
        success: false,
        message: 'Trial access has expired',
        error: 'TRIAL_EXPIRED',
        trialStatus
      }, { status: 403 })
    }

    // Handle different actions
    switch (validatedData.action) {
      case 'status':
        return NextResponse.json({
          success: true,
          trialStatus,
          message: 'Trial status retrieved successfully'
        })

      case 'query':
      case 'interact':
        if (!validatedData.query) {
          return NextResponse.json({
            success: false,
            message: 'Query is required for interactions',
            error: 'MISSING_QUERY'
          }, { status: 400 })
        }

        // Check usage limits before interaction
        if (trialStatus.usage[validatedData.agentType] >= trialStatus.limits[validatedData.agentType]) {
          return NextResponse.json({
            success: false,
            message: `${validatedData.agentType.charAt(0).toUpperCase() + validatedData.agentType.slice(1)} trial limit reached`,
            error: 'USAGE_LIMIT_EXCEEDED',
            trialStatus
          }, { status: 429 })
        }

        // Execute Trinity Agent interaction
        const response = await executeTrialInteraction(
          validatedData.userId,
          validatedData.agentType,
          validatedData.query,
          validatedData.context || {}
        )

        if (!response) {
          return NextResponse.json({
            success: false,
            message: 'Failed to execute Trinity Agent interaction',
            error: 'INTERACTION_FAILED'
          }, { status: 500 })
        }

        // Get updated trial status after interaction
        const updatedTrialStatus = await getTrialStatus(validatedData.userId)

        return NextResponse.json({
          success: true,
          response,
          trialStatus: updatedTrialStatus,
          message: `${response.agent} interaction completed successfully`
        })

      default:
        return NextResponse.json({
          success: false,
          message: 'Invalid action specified',
          error: 'INVALID_ACTION'
        }, { status: 400 })
    }
    
  } catch (error) {
    console.error('Trinity Agent trial access error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        message: 'Invalid request data',
        errors: error.errors,
      }, { status: 400 })
    }
    
    return NextResponse.json({
      success: false,
      message: 'Trinity Agent trial access failed. Please try again.',
      error: 'INTERNAL_ERROR'
    }, { status: 500 })
  }
}

// Get comprehensive trial status
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')
  const agentType = searchParams.get('agentType') as 'oracle' | 'sentinel' | 'sage' | null
  
  if (!userId) {
    return NextResponse.json({
      success: false,
      message: 'User ID required'
    }, { status: 400 })
  }

  try {
    const trialStatus = await getTrialStatus(userId)
    
    if (!trialStatus) {
      return NextResponse.json({
        success: false,
        message: 'Trial not found',
        error: 'TRIAL_NOT_FOUND'
      }, { status: 404 })
    }

    // If specific agent type requested, include detailed metrics
    let agentMetrics = {}
    if (agentType && ['oracle', 'sentinel', 'sage'].includes(agentType)) {
      agentMetrics = {
        [`${agentType}Metrics`]: {
          usageCount: trialStatus.usage[agentType],
          limit: trialStatus.limits[agentType],
          remainingInteractions: Math.max(0, trialStatus.limits[agentType] - trialStatus.usage[agentType]),
          usagePercentage: Math.round((trialStatus.usage[agentType] / trialStatus.limits[agentType]) * 100),
          accessToken: trialStatus.accessTokens[agentType]
        }
      }
    }

    // Calculate overall trial progress
    const totalUsage = Object.values(trialStatus.usage).reduce((sum, count) => sum + count, 0)
    const totalLimits = Object.values(trialStatus.limits).reduce((sum, limit) => sum + limit, 0)
    const overallProgress = Math.round((totalUsage / totalLimits) * 100)

    // Estimate ROI and cost savings based on usage
    const estimatedMonthlySavings = Math.floor(totalUsage * 650 + 25000) // Base calculation
    const timeReduced = Math.floor(totalUsage * 2.8 + 18) // Hours saved
    const efficiencyGain = Math.min(400, Math.floor(totalUsage * 12 + 85)) // Efficiency percentage

    return NextResponse.json({
      success: true,
      trial: {
        ...trialStatus,
        overallProgress,
        totalUsage,
        totalLimits,
        estimatedROI: {
          monthlySavings: `$${estimatedMonthlySavings.toLocaleString()}`,
          timeReduced: `${timeReduced} hours per week`,
          efficiencyGain: `${efficiencyGain}%`,
          accuracyImprovement: '94.2%'
        },
        ...agentMetrics
      }
    })
  } catch (error) {
    console.error('Error retrieving trial status:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to retrieve trial status',
      error: 'INTERNAL_ERROR'
    }, { status: 500 })
  }
}