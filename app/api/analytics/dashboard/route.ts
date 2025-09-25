import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import AnalyticsIntegrationManager from '@/lib/analytics-integration'
import TrinityAnalyticsEnhancer from '@/lib/trinity-analytics-enhancement'

const dashboardQuerySchema = z.object({
  organizationId: z.string(),
  timeRange: z.enum(['7d', '30d', '90d']).optional().default('30d'),
  breakdown: z.enum(['daily', 'weekly', 'monthly']).optional().default('daily')
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = Object.fromEntries(searchParams.entries())
    const validatedQuery = dashboardQuerySchema.parse(query)

    const analyticsManager = new AnalyticsIntegrationManager()
    const enhancer = new TrinityAnalyticsEnhancer()

    // Calculate date range
    const endDate = new Date().toISOString().split('T')[0]
    const daysBack = validatedQuery.timeRange === '7d' ? 7 : validatedQuery.timeRange === '30d' ? 30 : 90
    const startDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    // Fetch analytics data from connected platforms
    const analyticsData = await analyticsManager.getAnalyticsData(
      validatedQuery.organizationId,
      startDate,
      endDate
    )

    if (analyticsData.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          metrics: {
            sessions: 0,
            users: 0,
            conversions: 0,
            revenue: 0,
            conversionRate: 0,
            bounceRate: 0
          },
          insights: [{
            type: 'setup_required',
            insight: 'Connect Google Analytics or Mixpanel to see real marketing data',
            priority: 'high',
            actionable: true
          }],
          trafficSources: [],
          topPages: [],
          trends: {
            sessionsChange: 0,
            conversionsChange: 0,
            revenueChange: 0
          },
          lastUpdated: new Date().toISOString(),
          dataConnected: false
        }
      })
    }

    // Combine metrics from all connected platforms
    const combinedMetrics = combineAnalyticsData(analyticsData)
    
    // Generate AI-powered marketing insights
    const marketingInsights = await analyticsManager.generateMarketingInsights(analyticsData)

    // Calculate trends (compare with previous period)
    const previousPeriodStart = new Date(Date.now() - (daysBack * 2) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const previousPeriodEnd = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    
    const previousData = await analyticsManager.getAnalyticsData(
      validatedQuery.organizationId,
      previousPeriodStart,
      previousPeriodEnd
    )

    const trends = calculateTrends(combinedMetrics, previousData)

    // Structure dashboard data
    const dashboardData = {
      metrics: combinedMetrics,
      insights: marketingInsights.map(insight => ({
        type: insight.type,
        insight: insight.description,
        priority: insight.priority,
        actionable: insight.actionable
      })),
      trafficSources: extractTopTrafficSources(analyticsData),
      topPages: extractTopPages(analyticsData),
      trends,
      lastUpdated: new Date().toISOString(),
      dataConnected: true,
      connectedPlatforms: analyticsData.map(d => d.source)
    }

    return NextResponse.json({
      success: true,
      data: dashboardData
    })

  } catch (error) {
    console.error('Dashboard API error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        message: 'Invalid query parameters',
        errors: error.errors
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      message: 'Failed to load dashboard data'
    }, { status: 500 })
  }
}

// Combine analytics data from multiple platforms
function combineAnalyticsData(analyticsData: any[]): any {
  return analyticsData.reduce((combined, data) => ({
    sessions: combined.sessions + data.metrics.sessions,
    users: combined.users + data.metrics.users,
    conversions: combined.conversions + data.metrics.conversions,
    revenue: combined.revenue + (data.metrics.revenue || 0),
    conversionRate: (combined.conversionRate + data.metrics.conversionRate) / 2, // Average
    bounceRate: (combined.bounceRate + data.metrics.bounceRate) / 2 // Average
  }), {
    sessions: 0,
    users: 0,
    conversions: 0,
    revenue: 0,
    conversionRate: 0,
    bounceRate: 0
  })
}

// Calculate trends compared to previous period
function calculateTrends(currentMetrics: any, previousData: any[]): any {
  if (previousData.length === 0) {
    return {
      sessionsChange: 0,
      conversionsChange: 0,
      revenueChange: 0
    }
  }

  const previousMetrics = combineAnalyticsData(previousData)

  return {
    sessionsChange: previousMetrics.sessions > 0 
      ? ((currentMetrics.sessions - previousMetrics.sessions) / previousMetrics.sessions) * 100 
      : 0,
    conversionsChange: previousMetrics.conversions > 0
      ? ((currentMetrics.conversions - previousMetrics.conversions) / previousMetrics.conversions) * 100
      : 0,
    revenueChange: previousMetrics.revenue > 0
      ? ((currentMetrics.revenue - previousMetrics.revenue) / previousMetrics.revenue) * 100
      : 0
  }
}

// Extract top traffic sources across platforms
function extractTopTrafficSources(analyticsData: any[]): any[] {
  const allSources: any[] = []
  
  analyticsData.forEach(data => {
    data.dimensions.traffic_sources.forEach((source: any) => {
      allSources.push({
        source: source.source,
        sessions: source.sessions,
        conversions: source.conversions,
        conversionRate: (source.conversions / source.sessions) * 100
      })
    })
  })

  // Sort by sessions and return top sources
  return allSources
    .sort((a, b) => b.sessions - a.sessions)
    .slice(0, 8)
}

// Extract top pages across platforms
function extractTopPages(analyticsData: any[]): any[] {
  const allPages: any[] = []
  
  analyticsData.forEach(data => {
    data.dimensions.top_pages.forEach((page: any) => {
      allPages.push(page)
    })
  })

  // Sort by pageviews and return top pages
  return allPages
    .sort((a, b) => b.pageviews - a.pageviews)
    .slice(0, 10)
}