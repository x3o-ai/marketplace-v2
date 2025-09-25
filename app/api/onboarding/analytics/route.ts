import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { OnboardingEventType } from '@/types/onboarding'
import { z } from 'zod'

const analyticsEventSchema = z.object({
  eventType: z.nativeEnum(OnboardingEventType),
  stepId: z.string().optional(),
  userId: z.string().optional(),
  sessionId: z.string().optional(),
  eventData: z.object({}).passthrough(),
  metadata: z.object({}).passthrough().optional(),
  userAgent: z.string().optional(),
  ipAddress: z.string().optional(),
  variantId: z.string().optional(),
  experimentId: z.string().optional(),
  pageLoadTime: z.number().optional(),
  interactionTime: z.number().optional(),
  conversionStep: z.string().optional(),
  conversionValue: z.number().optional()
})

const analyticsQuerySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  eventType: z.string().optional(),
  stepId: z.string().optional(),
  userId: z.string().optional(),
  experimentId: z.string().optional(),
  limit: z.string().optional(),
  groupBy: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = analyticsEventSchema.parse(body)
    
    // Extract IP from headers if not provided
    const ipAddress = validatedData.ipAddress || 
      request.headers.get('x-forwarded-for') || 
      request.headers.get('x-real-ip') ||
      'unknown'
    
    // Extract user agent if not provided
    const userAgent = validatedData.userAgent || request.headers.get('user-agent') || 'unknown'

    const analyticsEvent = await prisma.onboardingAnalytics.create({
      data: {
        eventType: validatedData.eventType,
        stepId: validatedData.stepId,
        userId: validatedData.userId,
        eventData: validatedData.eventData,
        metadata: validatedData.metadata,
        userAgent,
        ipAddress,
        sessionId: validatedData.sessionId,
        variantId: validatedData.variantId,
        experimentId: validatedData.experimentId,
        pageLoadTime: validatedData.pageLoadTime,
        interactionTime: validatedData.interactionTime,
        conversionStep: validatedData.conversionStep,
        conversionValue: validatedData.conversionValue,
        timestamp: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      eventId: analyticsEvent.id
    })

  } catch (error) {
    console.error('Analytics tracking error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        message: 'Invalid event data',
        errors: error.errors
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      message: 'Failed to track analytics event'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = Object.fromEntries(searchParams.entries())
    const validatedQuery = analyticsQuerySchema.parse(query)

    // Build filters
    const where: any = {}
    
    if (validatedQuery.eventType) {
      where.eventType = validatedQuery.eventType as OnboardingEventType
    }
    
    if (validatedQuery.stepId) {
      where.stepId = validatedQuery.stepId
    }
    
    if (validatedQuery.userId) {
      where.userId = validatedQuery.userId
    }
    
    if (validatedQuery.experimentId) {
      where.experimentId = validatedQuery.experimentId
    }

    if (validatedQuery.startDate || validatedQuery.endDate) {
      where.timestamp = {}
      if (validatedQuery.startDate) {
        where.timestamp.gte = new Date(validatedQuery.startDate)
      }
      if (validatedQuery.endDate) {
        where.timestamp.lte = new Date(validatedQuery.endDate)
      }
    }

    const limit = validatedQuery.limit ? parseInt(validatedQuery.limit) : 100

    if (validatedQuery.groupBy) {
      // Aggregated analytics
      const aggregatedData = await getAggregatedAnalytics(where, validatedQuery.groupBy, limit)
      return NextResponse.json({
        success: true,
        data: aggregatedData,
        type: 'aggregated'
      })
    } else {
      // Raw events
      const events = await prisma.onboardingAnalytics.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              createdAt: true
            }
          },
          step: {
            select: {
              id: true,
              name: true,
              type: true,
              category: true
            }
          }
        }
      })

      return NextResponse.json({
        success: true,
        data: events,
        type: 'events'
      })
    }

  } catch (error) {
    console.error('Analytics retrieval error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        message: 'Invalid query parameters',
        errors: error.errors
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      message: 'Failed to retrieve analytics data'
    }, { status: 500 })
  }
}

async function getAggregatedAnalytics(where: any, groupBy: string, limit: number) {
  switch (groupBy) {
    case 'eventType':
      return await prisma.onboardingAnalytics.groupBy({
        by: ['eventType'],
        where,
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: limit
      })

    case 'stepId':
      return await prisma.onboardingAnalytics.groupBy({
        by: ['stepId'],
        where,
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: limit
      })

    case 'date':
      // Group by date
      const rawResults = await prisma.$queryRaw`
        SELECT DATE(timestamp) as date, COUNT(*) as count
        FROM onboarding_analytics
        WHERE ${where.timestamp?.gte ? `timestamp >= ${where.timestamp.gte}` : '1=1'}
          AND ${where.timestamp?.lte ? `timestamp <= ${where.timestamp.lte}` : '1=1'}
        GROUP BY DATE(timestamp)
        ORDER BY date DESC
        LIMIT ${limit}
      `
      return rawResults

    case 'hour':
      // Group by hour for detailed analysis
      const hourlyResults = await prisma.$queryRaw`
        SELECT 
          DATE(timestamp) as date,
          EXTRACT(HOUR FROM timestamp) as hour,
          COUNT(*) as count
        FROM onboarding_analytics
        WHERE ${where.timestamp?.gte ? `timestamp >= ${where.timestamp.gte}` : '1=1'}
          AND ${where.timestamp?.lte ? `timestamp <= ${where.timestamp.lte}` : '1=1'}
        GROUP BY DATE(timestamp), EXTRACT(HOUR FROM timestamp)
        ORDER BY date DESC, hour DESC
        LIMIT ${limit}
      `
      return hourlyResults

    default:
      return await prisma.onboardingAnalytics.groupBy({
        by: ['eventType'],
        where,
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } }
      })
  }
}