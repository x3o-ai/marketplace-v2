import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// User registration schema for Trinity Agent trial signup
const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  company: z.string().optional(),
  role: z.string().optional(),
  industry: z.string().optional(),
  trinityAgentInterest: z.array(z.enum(['Oracle', 'Sentinel', 'Sage'])).optional(),
  useCase: z.string().optional(),
  teamSize: z.enum(['1-10', '11-50', '51-200', '200+']).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input data
    const validatedData = registerSchema.parse(body)
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    })

    if (existingUser) {
      return NextResponse.json({
        success: false,
        message: 'User already exists with this email address',
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
          subscription: 'STARTER', // Start with trial subscription
        }
      })
      organizationId = organization.id
    }

    // Create user with real database
    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        name: validatedData.name,
        role: 'USER',
        status: 'ACTIVE',
        organizationId,
        department: validatedData.role || null,
        jobTitle: validatedData.role || null,
        permissions: ['trinity_agent_trial'],
      },
      include: {
        organization: true
      }
    })

    // Create trial access record
    const trialEndDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    
    // Log initial AI interaction for trial setup
    const initialInteraction = await prisma.aIInteraction.create({
      data: {
        userId: user.id,
        organizationId: organizationId,
        agentId: 'oracle', // Default to Oracle for new trials
        query: `Trial signup: ${validatedData.useCase || 'Enterprise automation trial'}`,
        response: `Welcome to Trinity Agents! Your 14-day trial includes Oracle Analytics, Sentinel Monitoring, and Sage Optimization.`,
        confidence: 1.0,
        processingTime: 0,
        context: {
          trinityAgentInterest: validatedData.trinityAgentInterest,
          useCase: validatedData.useCase,
          industry: validatedData.industry,
          teamSize: validatedData.teamSize
        },
        category: 'trial_onboarding',
        tags: ['trial', 'onboarding', 'signup'],
        status: 'COMPLETED'
      }
    })
    
    // TODO: Send welcome email with Trinity Agent trial access
    // await sendTrialWelcomeEmail(user)
    
    // TODO: Create trial access tokens for Trinity Agents
    // const trialTokens = await createTrialAccess(user.id, validatedData.trinityAgentInterest)
    
    // Return success response with trial access info
    return NextResponse.json({
      success: true,
      message: 'Registration successful! Check your email for Trinity Agent trial access.',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        trialStatus: user.trialStatus,
        trialEndDate: user.trialEndDate,
        accessUrl: `/trial-dashboard?user=${user.id}`,
      },
      trialAccess: {
        oracle: validatedData.trinityAgentInterest?.includes('Oracle') ?? false,
        sentinel: validatedData.trinityAgentInterest?.includes('Sentinel') ?? false,
        sage: validatedData.trinityAgentInterest?.includes('Sage') ?? false,
        dashboardUrl: `/trial-dashboard`,
        expiresAt: user.trialEndDate,
      }
    }, { status: 201 })
    
  } catch (error) {
    console.error('Registration error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        message: 'Invalid input data',
        errors: error.errors,
      }, { status: 400 })
    }
    
    return NextResponse.json({
      success: false,
      message: 'Registration failed. Please try again.',
    }, { status: 500 })
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    service: 'x3o.ai Registration API',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  })
}