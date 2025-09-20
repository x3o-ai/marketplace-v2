import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

// Session bridge schema for enterprise platform access
const sessionBridgeSchema = z.object({
  action: z.enum(['create_enterprise_token', 'validate_token', 'sync_session']),
  userId: z.string().optional(),
  enterpriseToken: z.string().optional(),
  redirectUrl: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = sessionBridgeSchema.parse(body)
    
    const session = await getServerSession(authOptions)
    
    switch (validatedData.action) {
      case 'create_enterprise_token':
        if (!session?.user?.id) {
          return NextResponse.json({
            success: false,
            message: 'User not authenticated',
          }, { status: 401 })
        }

        // Get user data from database
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
          }, { status: 404 })
        }

        // Calculate trial status and remaining time
        const trialEndDate = new Date(user.createdAt)
        trialEndDate.setDate(trialEndDate.getDate() + 14)
        const trialActive = new Date() < trialEndDate
        const daysLeft = Math.max(0, Math.ceil((trialEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))

        // Create enterprise platform token
        const enterpriseTokenPayload = {
          userId: user.id,
          email: user.email,
          name: user.name,
          organizationId: user.organizationId,
          organization: user.organization?.name,
          permissions: user.permissions,
          trialStatus: trialActive ? 'ACTIVE' : 'EXPIRED',
          trialDaysLeft: daysLeft,
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
          exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
        }

        const enterpriseToken = jwt.sign(
          enterpriseTokenPayload,
          process.env.JWT_SECRET || 'fallback-secret',
          { expiresIn: '24h' }
        )

        return NextResponse.json({
          success: true,
          enterpriseToken,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            organization: user.organization?.name,
            trialStatus: trialActive ? 'ACTIVE' : 'EXPIRED',
            daysLeft
          },
          enterpriseUrls: {
            dashboard: `${process.env.NEXT_PUBLIC_ENTERPRISE_DASHBOARD_URL}?token=${enterpriseToken}`,
            oracle: `${process.env.NEXT_PUBLIC_ENTERPRISE_DASHBOARD_URL}/agents/oracle?token=${enterpriseToken}`,
            sentinel: `${process.env.NEXT_PUBLIC_ENTERPRISE_DASHBOARD_URL}/agents/sentinel?token=${enterpriseToken}`,
            sage: `${process.env.NEXT_PUBLIC_ENTERPRISE_DASHBOARD_URL}/agents/sage?token=${enterpriseToken}`
          }
        })

      case 'validate_token':
        if (!validatedData.enterpriseToken) {
          return NextResponse.json({
            success: false,
            message: 'Enterprise token required',
          }, { status: 400 })
        }

        try {
          const decoded = jwt.verify(
            validatedData.enterpriseToken,
            process.env.JWT_SECRET || 'fallback-secret'
          ) as any

          // Verify user still exists and has valid trial
          const tokenUser = await prisma.user.findUnique({
            where: { id: decoded.userId }
          })

          if (!tokenUser) {
            return NextResponse.json({
              success: false,
              message: 'Invalid token - user not found',
            }, { status: 404 })
          }

          return NextResponse.json({
            success: true,
            valid: true,
            user: decoded,
            message: 'Token is valid'
          })

        } catch (error) {
          return NextResponse.json({
            success: false,
            valid: false,
            message: 'Invalid or expired token',
          }, { status: 401 })
        }

      case 'sync_session':
        // Sync session data between platforms
        if (!session?.user?.id) {
          return NextResponse.json({
            success: false,
            message: 'No active session to sync',
          }, { status: 401 })
        }

        // Update last activity
        await prisma.user.update({
          where: { id: session.user.id },
          data: { lastLoginAt: new Date() }
        })

        return NextResponse.json({
          success: true,
          message: 'Session synchronized',
          lastActivity: new Date().toISOString()
        })

      default:
        return NextResponse.json({
          success: false,
          message: 'Invalid action',
        }, { status: 400 })
    }
    
  } catch (error) {
    console.error('Session bridge error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        message: 'Invalid session bridge data',
        errors: error.errors,
      }, { status: 400 })
    }
    
    return NextResponse.json({
      success: false,
      message: 'Session bridge failed',
    }, { status: 500 })
  }
}

// Get current session status
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        authenticated: false,
        message: 'No active session'
      })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { organization: true }
    })

    if (!user) {
      return NextResponse.json({
        success: false,
        authenticated: false,
        message: 'User not found'
      })
    }

    // Calculate trial status
    const trialEndDate = new Date(user.createdAt)
    trialEndDate.setDate(trialEndDate.getDate() + 14)
    const trialActive = new Date() < trialEndDate
    const daysLeft = Math.max(0, Math.ceil((trialEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))

    return NextResponse.json({
      success: true,
      authenticated: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        organization: user.organization?.name,
        trialStatus: trialActive ? 'ACTIVE' : 'EXPIRED',
        trialDaysLeft: daysLeft,
        permissions: user.permissions,
        lastLoginAt: user.lastLoginAt?.toISOString()
      }
    })
    
  } catch (error) {
    console.error('Session status error:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to get session status'
    }, { status: 500 })
  }
}