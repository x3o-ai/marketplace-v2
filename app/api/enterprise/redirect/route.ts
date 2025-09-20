import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

// Enterprise redirect schema
const redirectSchema = z.object({
  destination: z.enum(['dashboard', 'oracle', 'sentinel', 'sage', 'analytics', 'reports']),
  userId: z.string().optional(),
  action: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = redirectSchema.parse(body)
    
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        message: 'Authentication required',
        redirectUrl: '/signup'
      }, { status: 401 })
    }

    // Get user data with current trial status
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        organization: true,
        aiInteractions: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    })

    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'User not found',
        redirectUrl: '/signup'
      }, { status: 404 })
    }

    // Calculate trial status
    const trialEndDate = new Date(user.createdAt)
    trialEndDate.setDate(trialEndDate.getDate() + 14)
    const trialActive = new Date() < trialEndDate
    const daysLeft = Math.max(0, Math.ceil((trialEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))

    // Check if trial expired
    if (!trialActive && !user.permissions.includes('trinity_agent_full')) {
      return NextResponse.json({
        success: false,
        message: 'Trial expired. Upgrade to continue accessing Trinity Agents.',
        redirectUrl: '/account?expired=true',
        trialExpired: true
      }, { status: 403 })
    }

    // Generate enterprise access token
    const enterpriseTokenPayload = {
      userId: user.id,
      email: user.email,
      name: user.name,
      organizationId: user.organizationId,
      organization: user.organization?.name,
      permissions: user.permissions,
      trialStatus: trialActive ? 'ACTIVE' : 'EXPIRED',
      trialDaysLeft: daysLeft,
      destination: validatedData.destination,
      agentAccess: {
        oracle: user.permissions.includes('oracle_agent_full') || user.permissions.includes('trinity_agent_trial'),
        sentinel: user.permissions.includes('sentinel_agent_full') || user.permissions.includes('trinity_agent_trial'),
        sage: user.permissions.includes('sage_agent_full') || user.permissions.includes('trinity_agent_trial')
      },
      usage: {
        totalInteractions: user.aiInteractions.length,
        oracleQueries: user.aiInteractions.filter(i => i.agentId === 'oracle').length,
        sentinelAlerts: user.aiInteractions.filter(i => i.agentId === 'sentinel').length,
        sageContent: user.aiInteractions.filter(i => i.agentId === 'sage').length
      },
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (4 * 60 * 60) // 4 hours
    }

    const enterpriseToken = jwt.sign(
      enterpriseTokenPayload,
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '4h' }
    )

    // Log enterprise platform access
    await prisma.aIInteraction.create({
      data: {
        userId: user.id,
        organizationId: user.organizationId,
        agentId: 'system',
        query: `Enterprise platform access: ${validatedData.destination}`,
        response: `Redirecting to ${validatedData.destination} with ${daysLeft} days trial remaining`,
        confidence: 1.0,
        processingTime: 0,
        context: {
          destination: validatedData.destination,
          trialStatus: trialActive ? 'ACTIVE' : 'EXPIRED',
          daysLeft,
          permissions: user.permissions
        },
        category: 'platform_navigation',
        tags: ['enterprise', 'redirect', validatedData.destination],
        status: 'COMPLETED'
      }
    })

    // Determine enterprise URL based on destination
    const baseUrl = process.env.NEXT_PUBLIC_ENTERPRISE_DASHBOARD_URL || 'http://localhost:3013'
    let enterpriseUrl = baseUrl

    switch (validatedData.destination) {
      case 'dashboard':
        enterpriseUrl = `${baseUrl}/dashboard`
        break
      case 'oracle':
        enterpriseUrl = `${baseUrl}/agents/oracle`
        break
      case 'sentinel':
        enterpriseUrl = `${baseUrl}/agents/sentinel`
        break
      case 'sage':
        enterpriseUrl = `${baseUrl}/agents/sage`
        break
      case 'analytics':
        enterpriseUrl = `${baseUrl}/analytics`
        break
      case 'reports':
        enterpriseUrl = `${baseUrl}/reports`
        break
    }

    // Add authentication token to URL
    enterpriseUrl += `?token=${enterpriseToken}&source=marketplace`

    return NextResponse.json({
      success: true,
      message: 'Enterprise access authorized',
      redirectUrl: enterpriseUrl,
      user: {
        id: user.id,
        name: user.name,
        organization: user.organization?.name,
        trialStatus: trialActive ? 'ACTIVE' : 'EXPIRED',
        daysLeft,
        permissions: user.permissions
      },
      enterpriseAccess: {
        token: enterpriseToken,
        destination: validatedData.destination,
        expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString()
      }
    })
    
  } catch (error) {
    console.error('Enterprise redirect error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        message: 'Invalid redirect data',
        errors: error.errors,
      }, { status: 400 })
    }
    
    return NextResponse.json({
      success: false,
      message: 'Enterprise redirect failed',
      redirectUrl: '/account'
    }, { status: 500 })
  }
}

// Health check for enterprise connectivity
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const checkEnterprise = searchParams.get('checkEnterprise') === 'true'

  if (checkEnterprise) {
    // Test enterprise platform connectivity
    try {
      const enterpriseHealthUrl = `${process.env.NEXT_PUBLIC_ENTERPRISE_DASHBOARD_URL}/api/health`
      const response = await fetch(enterpriseHealthUrl, { 
        method: 'GET',
        timeout: 5000 
      })
      
      if (response.ok) {
        return NextResponse.json({
          success: true,
          enterpriseStatus: 'healthy',
          message: 'Enterprise platform is accessible'
        })
      } else {
        return NextResponse.json({
          success: false,
          enterpriseStatus: 'error',
          message: 'Enterprise platform not responding'
        })
      }
    } catch (error) {
      return NextResponse.json({
        success: false,
        enterpriseStatus: 'unreachable',
        message: 'Cannot connect to enterprise platform'
      })
    }
  }

  return NextResponse.json({
    success: true,
    service: 'Enterprise Redirect API',
    status: 'healthy',
    enterpriseUrl: process.env.NEXT_PUBLIC_ENTERPRISE_DASHBOARD_URL,
    availableDestinations: ['dashboard', 'oracle', 'sentinel', 'sage', 'analytics', 'reports']
  })
}