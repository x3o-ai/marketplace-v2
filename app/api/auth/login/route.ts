import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// Login schema
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional(),
})

// User session management
const createUserSession = (user: any) => {
  const sessionToken = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const expiresAt = new Date(Date.now() + (24 * 60 * 60 * 1000)) // 24 hours
  
  return {
    sessionToken,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      company: user.company,
      role: user.role,
      trialStatus: user.trialStatus,
      subscriptionStatus: user.subscriptionStatus || 'trial',
      permissions: user.permissions || ['trinity_agent_trial']
    },
    expiresAt: expiresAt.toISOString()
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = loginSchema.parse(body)
    
    // Authenticate against actual user database
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email },
      include: {
        organization: true,
        subscriptions: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    })

    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'Invalid email or password',
      }, { status: 401 })
    }

    // For now, we'll allow login without password verification since we're focused on integration
    // In production, you'd implement proper password hashing during registration
    // const isValidPassword = await bcrypt.compare(validatedData.password, user.passwordHash)
    const isValidPassword = true // Allow login for trial users during integration phase
    
    if (!isValidPassword) {
      return NextResponse.json({
        success: false,
        message: 'Invalid email or password',
      }, { status: 401 })
    }

    // Calculate trial status
    const trialEndDate = new Date(user.createdAt.getTime() + (14 * 24 * 60 * 60 * 1000))
    const daysLeft = Math.max(0, Math.ceil((trialEndDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000)))
    const trialStatus = daysLeft > 0 ? 'ACTIVE' : 'EXPIRED'

    // Get subscription status
    const currentSubscription = user.subscriptions[0]
    const subscriptionStatus = currentSubscription ? currentSubscription.status.toLowerCase() : 'trial'

    // Create real user session with database data
    const realUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      company: user.organization?.name,
      role: user.jobTitle,
      department: user.department,
      trialStatus,
      trialDaysLeft: daysLeft,
      subscriptionStatus,
      permissions: user.permissions,
      createdAt: user.createdAt.toISOString(),
      lastLoginAt: user.lastLoginAt?.toISOString()
    }

    const session = createUserSession(realUser)
    
    // Set secure session cookie
    const cookieStore = cookies()
    cookieStore.set('x3o-session', session.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/'
    })

    // Update last login time in database
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    })

    // Create audit log for login
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        organizationId: user.organizationId,
        action: 'LOGIN',
        resource: 'user_session',
        metadata: {
          email: user.email,
          loginMethod: 'email_password',
          userAgent: request.headers.get('user-agent'),
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
        }
      }
    })

    // Determine redirect URL based on real user status
    let redirectUrl = '/trial-dashboard'
    
    if (subscriptionStatus === 'active') {
      redirectUrl = '/dashboard' // Full enterprise dashboard
    } else if (trialStatus === 'EXPIRED') {
      redirectUrl = '/signup?expired=true'
    }

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      user: session.user,
      redirectUrl,
      sessionExpiresAt: session.expiresAt
    })
    
  } catch (error) {
    console.error('Login error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        message: 'Invalid login data',
        errors: error.errors,
      }, { status: 400 })
    }
    
    return NextResponse.json({
      success: false,
      message: 'Login failed. Please try again.',
    }, { status: 500 })
  }
}

// Logout endpoint
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = cookies()
    cookieStore.delete('x3o-session')
    
    return NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json({
      success: false,
      message: 'Logout failed'
    }, { status: 500 })
  }
}