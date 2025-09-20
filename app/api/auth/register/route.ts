import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { createTrialAccess } from '@/lib/trinity-agents'

// Enhanced Trinity Agent trial registration schema
const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  company: z.string().optional(),
  role: z.string().optional(),
  industry: z.string().optional(),
  trinityAgentInterest: z.array(z.enum(['Oracle', 'Sentinel', 'Sage'])).min(1, 'Select at least one Trinity Agent'),
  useCase: z.string().optional(),
  teamSize: z.enum(['1-10', '11-50', '51-200', '200+']).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input data with Trinity Agent requirements
    const validatedData = registerSchema.parse(body)
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email.toLowerCase() }
    })

    if (existingUser) {
      return NextResponse.json({
        success: false,
        message: 'User already exists with this email address. Try signing in instead.',
        redirect: '/signin'
      }, { status: 409 })
    }

    // Create organization if provided
    let organizationId = null
    if (validatedData.company) {
      const organization = await prisma.organization.create({
        data: {
          name: validatedData.company,
          industry: validatedData.industry || null,
          size: validatedData.teamSize || null,
          subscription: 'STARTER',
          settings: {
            trinityAgentTrial: {
              enabled: true,
              selectedAgents: validatedData.trinityAgentInterest,
              startDate: new Date().toISOString(),
              duration: 14
            },
            features: ['trinity_agents', 'trial_access', 'basic_analytics']
          }
        }
      })
      organizationId = organization.id
    }

    // Create Trinity Agent trial user
    const user = await prisma.user.create({
      data: {
        email: validatedData.email.toLowerCase(),
        name: validatedData.name,
        role: 'USER',
        status: 'ACTIVE',
        organizationId,
        department: validatedData.role || null,
        jobTitle: validatedData.role || null,
        permissions: [
          'trinity_agent_trial',
          'dashboard_access',
          'trial_dashboard_full',
          ...validatedData.trinityAgentInterest.map(agent => `${agent.toLowerCase()}_access`)
        ],
      },
      include: {
        organization: true
      }
    })

    // Create Trinity Agent trial access with selected agents
    const agentTypes = validatedData.trinityAgentInterest.map(agent => 
      agent.toLowerCase() as 'oracle' | 'sentinel' | 'sage'
    )
    
    const trialAccess = await createTrialAccess(user.id, agentTypes)
    
    if (!trialAccess) {
      // Cleanup user if trial creation failed
      await prisma.user.delete({ where: { id: user.id } })
      if (organizationId) {
        await prisma.organization.delete({ where: { id: organizationId } })
      }
      
      return NextResponse.json({
        success: false,
        message: 'Failed to create Trinity Agent trial access. Please try again.',
      }, { status: 500 })
    }

    // Log successful Trinity Agent trial creation
    console.log('Trinity Agent trial created:', {
      userId: user.id,
      email: user.email,
      agents: validatedData.trinityAgentInterest,
      company: validatedData.company,
      useCase: validatedData.useCase
    })

    // TODO: Send Trinity Agent welcome email
    // await sendTrinityAgentWelcomeEmail(user, trialAccess, validatedData.trinityAgentInterest)
    
    // Return comprehensive success response
    return NextResponse.json({
      success: true,
      message: 'Trinity Agent trial created successfully! Welcome to the future of AI automation.',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        accessUrl: `/trial-dashboard?welcome=true`,
        organization: user.organization
      },
      trialAccess: {
        status: trialAccess.status,
        daysRemaining: trialAccess.daysRemaining,
        selectedAgents: validatedData.trinityAgentInterest,
        usage: trialAccess.usage,
        limits: trialAccess.limits,
        dashboardUrl: '/trial-dashboard',
        expiresAt: new Date(Date.now() + trialAccess.daysRemaining * 24 * 60 * 60 * 1000).toISOString(),
        accessTokens: trialAccess.accessTokens
      },
      features: {
        oracle: {
          name: 'Oracle Analytics',
          description: 'Advanced business intelligence with predictive analytics',
          enabled: validatedData.trinityAgentInterest.includes('Oracle'),
          capabilities: [
            'Revenue forecasting',
            'Customer analytics', 
            'Market trend analysis',
            'Risk assessment'
          ]
        },
        sentinel: {
          name: 'Sentinel Monitoring',
          description: '24/7 autonomous system monitoring and optimization',
          enabled: validatedData.trinityAgentInterest.includes('Sentinel'),
          capabilities: [
            'System health monitoring',
            'Performance optimization',
            'Anomaly detection',
            'Security analysis'
          ]
        },
        sage: {
          name: 'Sage Optimization',
          description: 'Intelligent content generation and process automation',
          enabled: validatedData.trinityAgentInterest.includes('Sage'),
          capabilities: [
            'Content generation',
            'Campaign optimization',
            'Brand consistency',
            'Process automation'
          ]
        }
      }
    }, { status: 201 })
    
  } catch (error) {
    console.error('Trinity Agent registration error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        message: 'Please check your input and ensure you select at least one Trinity Agent',
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        })),
      }, { status: 400 })
    }
    
    return NextResponse.json({
      success: false,
      message: 'Trinity Agent registration failed. Please try again or contact support.',
      error: 'REGISTRATION_ERROR'
    }, { status: 500 })
  }
}

// Health check endpoint for Trinity Agent registration service
export async function GET() {
  try {
    // Check database connection and Trinity Agent availability
    const agentCount = await prisma.aIAgent.count({
      where: { status: 'ACTIVE' }
    })
    
    const activeTrials = await prisma.user.count({
      where: {
        permissions: {
          has: 'trinity_agent_trial'
        },
        createdAt: {
          gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) // Last 14 days
        }
      }
    })

    return NextResponse.json({
      service: 'Trinity Agent Registration API',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '2.0.0',
      metrics: {
        activeAgents: agentCount,
        activeTrials,
        features: {
          trinityAgentTrials: true,
          realTimeInteractions: true,
          comprehensiveAnalytics: true,
          secureTokens: true
        }
      },
      endpoints: [
        'POST /api/auth/register - Create Trinity Agent trial',
        'GET /api/trial/access - Get trial status', 
        'POST /api/trial/access - Trinity Agent interactions'
      ]
    })
  } catch (error) {
    return NextResponse.json({
      service: 'Trinity Agent Registration API',
      status: 'degraded',
      timestamp: new Date().toISOString(),
      error: 'Database connection issues'
    }, { status: 500 })
  }
}