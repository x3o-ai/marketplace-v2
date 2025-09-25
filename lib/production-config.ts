import { validateEnvironmentVariables } from './error-handling'

// Production Environment Configuration
export interface ProductionConfig {
  environment: 'development' | 'staging' | 'production'
  security: {
    cors: {
      origin: string[]
      credentials: boolean
    }
    headers: Record<string, string>
    rateLimiting: {
      enabled: boolean
      windowMs: number
      maxRequests: number
    }
  }
  ai: {
    providers: {
      openai: { enabled: boolean; rateLimitRpm: number }
      claude: { enabled: boolean; rateLimitRpm: number }
    }
    fallbacks: boolean
    caching: boolean
    costThresholds: {
      daily: number
      monthly: number
    }
  }
}

export const PRODUCTION_CONFIG: ProductionConfig = {
  environment: (process.env.NODE_ENV as any) || 'development',
  
  security: {
    cors: {
      origin: process.env.NODE_ENV === 'production' 
        ? ['https://x3o.ai', 'https://www.x3o.ai', 'https://app.x3o.ai']
        : ['http://localhost:3000', 'http://localhost:3001'],
      credentials: true
    },
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Strict-Transport-Security': process.env.NODE_ENV === 'production' 
        ? 'max-age=31536000; includeSubDomains' 
        : ''
    },
    rateLimiting: {
      enabled: true,
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: process.env.NODE_ENV === 'production' ? 100 : 1000
    }
  },

  ai: {
    providers: {
      openai: { 
        enabled: !!process.env.OPENAI_API_KEY, 
        rateLimitRpm: parseInt(process.env.OPENAI_RATE_LIMIT || '50')
      },
      claude: { 
        enabled: !!process.env.ANTHROPIC_API_KEY, 
        rateLimitRpm: parseInt(process.env.CLAUDE_RATE_LIMIT || '30')
      }
    },
    fallbacks: true,
    caching: true,
    costThresholds: {
      daily: parseInt(process.env.AI_DAILY_COST_LIMIT || '100'),
      monthly: parseInt(process.env.AI_MONTHLY_COST_LIMIT || '2500')
    }
  }
}

// Production startup checks
export async function performProductionChecks(): Promise<void> {
  console.log('🔍 Performing production environment checks...')

  const validation = validateEnvironmentVariables()

  if (!validation.isValid) {
    console.error('❌ Missing environment variables:', validation.missing)
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Production environment validation failed')
    }
  }

  // Test database connectivity
  try {
    const { prisma } = await import('./prisma')
    await prisma.$queryRaw`SELECT 1`
    console.log('✅ Database: Connected')
  } catch (error) {
    console.error('❌ Database: Failed to connect')
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Database connectivity required for production')
    }
  }

  console.log('✅ Production environment validation complete')
}

export const SECURITY_CONFIG = {
  rateLimits: {
    auth: { windowMs: 15 * 60 * 1000, max: 5 },
    api: { windowMs: 15 * 60 * 1000, max: 100 },
    ai: { windowMs: 60 * 1000, max: 10 },
    signup: { windowMs: 60 * 60 * 1000, max: 3 }
  },
  session: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 24 * 60 * 60,
    name: process.env.NODE_ENV === 'production' ? '__Secure-x3o-session' : 'x3o-session'
  }
}

export default PRODUCTION_CONFIG