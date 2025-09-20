import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

// Account linking schema for enterprise platform access
const linkAccountSchema = z.object({
  marketplaceUserId: z.string(),
  email: z.string().email(),
  enterpriseAccessLevel: z.enum(['trial', 'oracle', 'creative', 'enterprise']),
  trialEndDate: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = linkAccountSchema.parse(body)
    
    // Find the marketplace user
    const marketplaceUser = await prisma.user.findUnique({
      where: { id: validatedData.marketplaceUserId },
      include: {
        organization: true,
        aiInteractions: true
      }
    })

    if (!marketplaceUser) {
      return NextResponse.json({
        success: false,
        message: 'Marketplace user not found',
      }, { status: 404 })
    }

    // Create enterprise platform permissions based on access level
    let enterprisePermissions = []
    let agentAccess = []

    switch (validatedData.enterpriseAccessLevel) {
      case 'trial':
        enterprisePermissions = [
          'trinity_agent_trial',
          'dashboard_view',
          'basic_analytics',
          'trial_features'
        ]
        agentAccess = ['oracle', 'sentinel', 'sage']
        break
      case 'oracle':
        enterprisePermissions = [
          'oracle_agent_full',
          'advanced_analytics',
          'dashboard_full',
          'reporting_access',
          'api_access'
        ]
        agentAccess = ['oracle']
        break
      case 'creative':
        enterprisePermissions = [
          'sage_agent_full',
          'content_generation',
          'campaign_management',
          'brand_consistency',
          'creative_analytics'
        ]
        agentAccess = ['sage']
        break
      case 'enterprise':
        enterprisePermissions = [
          'trinity_agent_full',
          'oracle_agent_full',
          'sentinel_agent_full', 
          'sage_agent_full',
          'enterprise_admin',
          'advanced_analytics',
          'white_label_access',
          'priority_support',
          'custom_integrations'
        ]
        agentAccess = ['oracle', 'sentinel', 'sage']
        break
    }

    // Update user permissions in database
    const updatedUser = await prisma.user.update({
      where: { id: marketplaceUser.id },
      data: {
        permissions: enterprisePermissions,
        // Add enterprise platform metadata
        lastLoginAt: new Date(),
      }
    })

    // Create enterprise access token for seamless login
    const enterpriseToken = {
      userId: marketplaceUser.id,
      email: marketplaceUser.email,
      accessLevel: validatedData.enterpriseAccessLevel,
      agentAccess,
      permissions: enterprisePermissions,
      trialEndDate: validatedData.trialEndDate,
      enterpriseUrl: process.env.NEXT_PUBLIC_ENTERPRISE_DASHBOARD_URL || 'https://dashboard.x3o.ai',
      expiresAt: new Date(Date.now() + (24 * 60 * 60 * 1000)).toISOString() // 24 hours
    }

    // Log enterprise access creation
    await prisma.aIInteraction.create({
      data: {
        userId: marketplaceUser.id,
        organizationId: marketplaceUser.organizationId,
        agentId: 'system',
        query: `Enterprise platform access granted: ${validatedData.enterpriseAccessLevel}`,
        response: `User linked to enterprise platform with ${agentAccess.join(', ')} agent access`,
        confidence: 1.0,
        processingTime: 0,
        context: {
          accessLevel: validatedData.enterpriseAccessLevel,
          agentAccess,
          permissions: enterprisePermissions
        },
        category: 'enterprise_access',
        tags: ['enterprise', 'access', 'linking', validatedData.enterpriseAccessLevel],
        status: 'COMPLETED'
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Account successfully linked to enterprise platform',
      enterpriseAccess: {
        userId: updatedUser.id,
        accessLevel: validatedData.enterpriseAccessLevel,
        agentAccess,
        permissions: enterprisePermissions,
        dashboardUrl: `${process.env.NEXT_PUBLIC_ENTERPRISE_DASHBOARD_URL}/dashboard?token=${btoa(JSON.stringify(enterpriseToken))}`,
        directUrls: {
          oracle: agentAccess.includes('oracle') ? `${process.env.NEXT_PUBLIC_ENTERPRISE_DASHBOARD_URL}/agents/oracle` : null,
          sentinel: agentAccess.includes('sentinel') ? `${process.env.NEXT_PUBLIC_ENTERPRISE_DASHBOARD_URL}/agents/sentinel` : null,
          sage: agentAccess.includes('sage') ? `${process.env.NEXT_PUBLIC_ENTERPRISE_DASHBOARD_URL}/agents/sage` : null,
        }
      },
      trialStatus: {
        active: validatedData.enterpriseAccessLevel === 'trial',
        endDate: validatedData.trialEndDate,
        upgradeUrl: '/account?action=upgrade'
      }
    })
    
  } catch (error) {
    console.error('Enterprise account linking error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        message: 'Invalid account linking data',
        errors: error.errors,
      }, { status: 400 })
    }
    
    return NextResponse.json({
      success: false,
      message: 'Enterprise account linking failed',
    }, { status: 500 })
  }
}

// Get enterprise access status
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')
  
  if (!userId) {
    return NextResponse.json({
      success: false,
      message: 'User ID required'
    }, { status: 400 })
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      organization: true,
      aiInteractions: {
        where: { category: 'enterprise_access' },
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    }
  })

  if (!user) {
    return NextResponse.json({
      success: false,
      message: 'User not found'
    }, { status: 404 })
  }

  // Determine access level based on permissions
  let accessLevel = 'trial'
  if (user.permissions.includes('trinity_agent_full')) {
    accessLevel = 'enterprise'
  } else if (user.permissions.includes('oracle_agent_full')) {
    accessLevel = 'oracle'
  } else if (user.permissions.includes('sage_agent_full')) {
    accessLevel = 'creative'
  }

  return NextResponse.json({
    success: true,
    enterpriseAccess: {
      userId: user.id,
      accessLevel,
      permissions: user.permissions,
      agentAccess: [
        ...(user.permissions.includes('oracle_agent_full') || user.permissions.includes('trinity_agent_trial') ? ['oracle'] : []),
        ...(user.permissions.includes('sentinel_agent_full') || user.permissions.includes('trinity_agent_trial') ? ['sentinel'] : []),
        ...(user.permissions.includes('sage_agent_full') || user.permissions.includes('trinity_agent_trial') ? ['sage'] : []),
      ],
      organization: user.organization?.name,
      lastAccess: user.aiInteractions[0]?.createdAt?.toISOString()
    }
  })
}