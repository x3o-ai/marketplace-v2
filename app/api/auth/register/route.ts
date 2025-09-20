import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

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
    
    // TODO: Connect to actual user database (Prisma)
    // For now, we'll create a trial user record
    const user = {
      id: `user_${Date.now()}`,
      email: validatedData.email,
      name: validatedData.name,
      company: validatedData.company,
      role: validatedData.role,
      industry: validatedData.industry,
      trinityAgentInterest: validatedData.trinityAgentInterest || ['Oracle'],
      useCase: validatedData.useCase,
      teamSize: validatedData.teamSize,
      trialStatus: 'ACTIVE',
      trialStartDate: new Date().toISOString(),
      trialEndDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days
      createdAt: new Date().toISOString(),
    }
    
    // TODO: Save to database
    // await prisma.user.create({ data: user })
    
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