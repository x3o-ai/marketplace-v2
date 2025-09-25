import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { prisma } from './prisma'

export interface APIError {
  code: string
  message: string
  statusCode: number
  details?: any
  userId?: string
  requestId?: string
  timestamp: string
}

export interface ErrorLogEntry {
  requestId: string
  method: string
  url: string
  userId?: string
  error: APIError
  stackTrace?: string
  userAgent?: string
  ipAddress?: string
  timestamp: Date
}

export class ErrorHandler {
  private static requestIdCounter = 0

  // Generate unique request ID
  static generateRequestId(): string {
    this.requestIdCounter++
    return `req_${Date.now()}_${this.requestIdCounter.toString().padStart(4, '0')}`
  }

  // Standardized error response
  static createErrorResponse(
    error: any,
    requestId: string,
    userId?: string
  ): NextResponse {
    let apiError: APIError

    if (error instanceof ZodError) {
      apiError = {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        statusCode: 400,
        details: {
          validationErrors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code
          }))
        },
        userId,
        requestId,
        timestamp: new Date().toISOString()
      }
    } else if (error.name === 'StripeError') {
      apiError = {
        code: 'PAYMENT_ERROR',
        message: 'Payment processing failed',
        statusCode: 402,
        details: {
          stripeErrorType: error.type,
          stripeErrorCode: error.code,
          declineCode: error.decline_code
        },
        userId,
        requestId,
        timestamp: new Date().toISOString()
      }
    } else if (error.message?.includes('rate limit') || error.status === 429) {
      apiError = {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please try again later.',
        statusCode: 429,
        details: {
          retryAfter: 60,
          limitType: 'api_calls'
        },
        userId,
        requestId,
        timestamp: new Date().toISOString()
      }
    } else if (error.code === 'P2002') { // Prisma unique constraint error
      apiError = {
        code: 'RESOURCE_CONFLICT',
        message: 'Resource already exists',
        statusCode: 409,
        details: {
          constraint: error.meta?.target,
          field: error.meta?.field_name
        },
        userId,
        requestId,
        timestamp: new Date().toISOString()
      }
    } else if (error.code === 'P2025') { // Prisma record not found
      apiError = {
        code: 'RESOURCE_NOT_FOUND',
        message: 'Requested resource not found',
        statusCode: 404,
        details: {
          resource: error.meta?.cause
        },
        userId,
        requestId,
        timestamp: new Date().toISOString()
      }
    } else {
      // Generic server error
      apiError = {
        code: 'INTERNAL_ERROR',
        message: process.env.NODE_ENV === 'production' 
          ? 'An internal error occurred' 
          : error.message || 'Unknown error',
        statusCode: 500,
        details: process.env.NODE_ENV === 'development' ? {
          stack: error.stack,
          name: error.name
        } : undefined,
        userId,
        requestId,
        timestamp: new Date().toISOString()
      }
    }

    return NextResponse.json(apiError, { 
      status: apiError.statusCode,
      headers: {
        'X-Request-ID': requestId,
        'Content-Type': 'application/json'
      }
    })
  }

  // Log error to database and external services
  static async logError(
    error: any,
    request: NextRequest,
    requestId: string,
    userId?: string
  ): Promise<void> {
    try {
      const errorLog: ErrorLogEntry = {
        requestId,
        method: request.method,
        url: request.url,
        userId,
        error: this.extractErrorInfo(error, requestId, userId),
        stackTrace: error.stack,
        userAgent: request.headers.get('user-agent') || undefined,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
        timestamp: new Date()
      }

      // Log to database using audit logs
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'API_ERROR',
          resource: 'api_request',
          resourceId: requestId,
          metadata: {
            error: errorLog.error,
            request: {
              method: errorLog.method,
              url: errorLog.url,
              userAgent: errorLog.userAgent,
              ipAddress: errorLog.ipAddress
            },
            stackTrace: process.env.NODE_ENV === 'development' ? errorLog.stackTrace : undefined
          },
          ipAddress: errorLog.ipAddress,
          userAgent: errorLog.userAgent
        }
      })

      // Log to console for development
      if (process.env.NODE_ENV === 'development') {
        console.error('API Error:', {
          requestId,
          error: errorLog.error,
          stack: error.stack
        })
      }

      // Send to external monitoring service in production
      if (process.env.NODE_ENV === 'production' && errorLog.error.statusCode >= 500) {
        await this.sendToMonitoringService(errorLog)
      }

    } catch (logError) {
      console.error('Failed to log error:', logError)
      // Don't throw here to avoid infinite error loops
    }
  }

  // Extract standardized error information
  private static extractErrorInfo(error: any, requestId: string, userId?: string): APIError {
    if (error instanceof ZodError) {
      return {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        statusCode: 400,
        details: { validationErrors: error.errors },
        userId,
        requestId,
        timestamp: new Date().toISOString()
      }
    }

    return {
      code: error.code || 'UNKNOWN_ERROR',
      message: error.message || 'An unknown error occurred',
      statusCode: error.statusCode || error.status || 500,
      details: error.details,
      userId,
      requestId,
      timestamp: new Date().toISOString()
    }
  }

  // Send critical errors to monitoring service
  private static async sendToMonitoringService(errorLog: ErrorLogEntry): Promise<void> {
    try {
      // This would integrate with services like Sentry, LogRocket, or Datadog
      console.error('CRITICAL ERROR:', errorLog)
      
      // Store critical errors in system config for admin review
      await prisma.systemConfig.create({
        data: {
          key: `critical_error_${errorLog.requestId}`,
          value: {
            ...errorLog,
            severity: 'CRITICAL',
            requiresReview: true
          },
          description: `Critical API error: ${errorLog.error.code}`,
          category: 'error_monitoring'
        }
      })
    } catch (monitoringError) {
      console.error('Failed to send to monitoring service:', monitoringError)
    }
  }

  // Rate limiting helper
  static async checkRateLimit(
    identifier: string, 
    limit: number, 
    windowMs: number
  ): Promise<{ allowed: boolean; retryAfter?: number }> {
    try {
      const key = `rate_limit_${identifier}`
      const now = Date.now()
      
      // Get current rate limit data
      const rateLimitData = await prisma.systemConfig.findUnique({
        where: { key }
      })

      const current = rateLimitData ? rateLimitData.value as any : { count: 0, lastReset: now }

      // Reset window if needed
      if (now - current.lastReset > windowMs) {
        current.count = 0
        current.lastReset = now
      }

      // Check limit
      if (current.count >= limit) {
        const retryAfter = Math.ceil((windowMs - (now - current.lastReset)) / 1000)
        return { allowed: false, retryAfter }
      }

      // Increment counter
      current.count++
      
      // Update in database
      await prisma.systemConfig.upsert({
        where: { key },
        update: { value: current },
        create: {
          key,
          value: current,
          description: `Rate limit tracking for ${identifier}`,
          category: 'rate_limiting'
        }
      })

      return { allowed: true }
    } catch (error) {
      console.error('Rate limit check failed:', error)
      return { allowed: true } // Allow on error to not block legitimate requests
    }
  }
}

// Middleware function to wrap API routes with error handling
export function withErrorHandling(
  handler: (request: NextRequest, params?: any) => Promise<NextResponse>
) {
  return async (request: NextRequest, params?: any): Promise<NextResponse> => {
    const requestId = ErrorHandler.generateRequestId()
    const startTime = Date.now()
    
    // Add request ID header
    request.headers.set('X-Request-ID', requestId)
    
    try {
      // Execute the handler
      const response = await handler(request, params)
      
      // Add performance headers
      const processingTime = Date.now() - startTime
      response.headers.set('X-Request-ID', requestId)
      response.headers.set('X-Processing-Time', `${processingTime}ms`)
      
      return response
    } catch (error) {
      // Extract user ID if available
      let userId: string | undefined
      try {
        const body = await request.clone().json()
        userId = body.userId
      } catch {
        // No user ID in request body
      }

      // Log the error
      await ErrorHandler.logError(error, request, requestId, userId)
      
      // Return standardized error response
      return ErrorHandler.createErrorResponse(error, requestId, userId)
    }
  }
}

// Helper function to validate environment variables
export function validateEnvironmentVariables(): { isValid: boolean; missing: string[] } {
  const required = [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'SENDGRID_API_KEY',
    'STRIPE_SECRET_KEY',
    'OPENAI_API_KEY',
    'ANTHROPIC_API_KEY'
  ]

  const missing = required.filter(key => !process.env[key])
  
  return {
    isValid: missing.length === 0,
    missing
  }
}

export default ErrorHandler