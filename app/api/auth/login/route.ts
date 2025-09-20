import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { cookies } from 'next/headers'

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
    
    // TODO: Authenticate against actual user database
    // const user = await prisma.user.findUnique({
    //   where: { email: validatedData.email },
    //   include: { organization: true, subscription: true }
    // })
    
    // For now, simulate user lookup
    const mockUser = {
      id: `user_${Date.now()}`,
      email: validatedData.email,
      name: 'John Smith', // TODO: Get from database
      company: 'TechCorp Inc',
      role: 'Data Analyst',
      trialStatus: 'ACTIVE',
      trialDaysLeft: 11,
      subscriptionStatus: 'trial',
      permissions: ['trinity_agent_trial', 'oracle_access', 'sentinel_access', 'sage_access'],
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString()
    }

    // TODO: Verify password hash
    // const isValidPassword = await bcrypt.compare(validatedData.password, user.passwordHash)
    const isValidPassword = true // Simulate password check
    
    if (!isValidPassword) {
      return NextResponse.json({
        success: false,
        message: 'Invalid email or password',
      }, { status: 401 })
    }

    // Create user session
    const session = createUserSession(mockUser)
    
    // Set secure session cookie
    const cookieStore = cookies()
    cookieStore.set('x3o-session', session.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/'
    })

    // TODO: Update last login time
    // await prisma.user.update({
    //   where: { id: user.id },
    //   data: { lastLoginAt: new Date() }
    // })

    // Determine redirect URL based on user status
    let redirectUrl = '/trial-dashboard'
    
    if (mockUser.subscriptionStatus === 'active') {
      redirectUrl = '/dashboard' // Full enterprise dashboard
    } else if (mockUser.trialStatus === 'EXPIRED') {
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