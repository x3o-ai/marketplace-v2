import AnalyticsIntegrationManager, { AnalyticsData, MarketingInsight } from './analytics-integration'
import { AgentContext } from './trinity-prompts'

// Trinity Agent Analytics Enhancement System
export class TrinityAnalyticsEnhancer {
  private analyticsManager: AnalyticsIntegrationManager

  constructor() {
    this.analyticsManager = new AnalyticsIntegrationManager()
  }

  // Enhance Oracle Analytics with real marketing data
  async enhanceOracleWithRealData(
    query: string, 
    context: AgentContext,
    originalResponse: any
  ): Promise<any> {
    try {
      // Get real analytics data
      const analyticsData = await this.getOrganizationAnalytics(context)
      
      if (analyticsData.length === 0) {
        return {
          ...originalResponse,
          dataEnhancement: {
            realDataUsed: false,
            message: 'Connect Google Analytics or Mixpanel for real data insights',
            recommendation: 'Link your analytics platforms to get data-driven predictions'
          }
        }
      }

      // Generate marketing insights from real data
      const marketingInsights = await this.analyticsManager.generateMarketingInsights(analyticsData)
      
      // Enhance response with real data insights
      const enhancedResponse = {
        ...originalResponse,
        realDataInsights: this.extractRealInsights(analyticsData, marketingInsights),
        dataEnhancement: {
          realDataUsed: true,
          dataSources: analyticsData.map(d => d.source),
          timeRange: analyticsData[0]?.timeRange,
          confidence: originalResponse.confidence ? originalResponse.confidence + 10 : 95 // Boost confidence with real data
        },
        marketingMetrics: this.extractMarketingMetrics(analyticsData),
        actionableRecommendations: this.generateDataDrivenRecommendations(analyticsData, marketingInsights)
      }

      return enhancedResponse
    } catch (error) {
      console.error('Failed to enhance Oracle with real data:', error)
      return originalResponse
    }
  }

  // Enhance Sage Optimization with real campaign data
  async enhanceSageWithCampaignData(
    query: string,
    context: AgentContext, 
    originalResponse: any
  ): Promise<any> {
    try {
      const analyticsData = await this.getOrganizationAnalytics(context)
      
      if (analyticsData.length === 0) {
        return {
          ...originalResponse,
          campaignEnhancement: {
            realDataUsed: false,
            message: 'Connect analytics platforms for performance-based content recommendations'
          }
        }
      }

      // Extract campaign performance data
      const campaignData = this.extractCampaignPerformance(analyticsData)
      
      // Generate content recommendations based on real performance
      const performanceBasedRecommendations = this.generateContentRecommendations(campaignData)
      
      return {
        ...originalResponse,
        campaignEnhancement: {
          realDataUsed: true,
          performanceData: campaignData,
          recommendations: performanceBasedRecommendations,
          optimizationOpportunities: this.identifyOptimizationOpportunities(campaignData)
        },
        contentOptimization: {
          bestPerformingContent: this.identifyBestContent(analyticsData),
          contentGaps: this.identifyContentGaps(analyticsData),
          audienceInsights: this.extractAudienceInsights(analyticsData)
        }
      }
    } catch (error) {
      console.error('Failed to enhance Sage with campaign data:', error)
      return originalResponse
    }
  }

  // Get organization analytics data
  private async getOrganizationAnalytics(context: AgentContext): Promise<AnalyticsData[]> {
    if (!context.organizationData?.id) {
      return []
    }

    const endDate = new Date().toISOString().split('T')[0]
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    return await this.analyticsManager.getAnalyticsData(
      context.organizationData.id,
      startDate,
      endDate
    )
  }

  // Extract real insights from analytics data
  private extractRealInsights(analyticsData: AnalyticsData[], marketingInsights: MarketingInsight[]): any[] {
    const realInsights = []

    for (const data of analyticsData) {
      // Traffic insights
      if (data.metrics.sessions > 0) {
        realInsights.push({
          type: 'traffic_analysis',
          insight: `${data.metrics.sessions.toLocaleString()} sessions with ${data.metrics.conversionRate.toFixed(2)}% conversion rate`,
          source: data.source,
          actionable: true
        })
      }

      // Conversion insights
      if (data.metrics.conversions > 0) {
        const avgRevenue = (data.metrics.revenue || 0) / data.metrics.conversions
        realInsights.push({
          type: 'conversion_analysis',
          insight: `${data.metrics.conversions} conversions with $${avgRevenue.toFixed(2)} average order value`,
          source: data.source,
          actionable: true
        })
      }

      // Traffic source insights
      const topSource = data.dimensions.traffic_sources[0]
      if (topSource) {
        realInsights.push({
          type: 'traffic_source_analysis',
          insight: `Top traffic source: ${topSource.source} with ${topSource.sessions.toLocaleString()} sessions`,
          source: data.source,
          actionable: true
        })
      }
    }

    // Add marketing insights
    marketingInsights.forEach(insight => {
      realInsights.push({
        type: insight.type,
        insight: insight.description,
        source: insight.source,
        priority: insight.priority,
        actionable: insight.actionable
      })
    })

    return realInsights.slice(0, 8) // Limit to top 8 insights
  }

  // Extract marketing metrics from real data
  private extractMarketingMetrics(analyticsData: AnalyticsData[]): any {
    const combinedMetrics = {
      totalSessions: 0,
      totalUsers: 0,
      totalConversions: 0,
      totalRevenue: 0,
      avgConversionRate: 0,
      avgBounceRate: 0
    }

    analyticsData.forEach(data => {
      combinedMetrics.totalSessions += data.metrics.sessions
      combinedMetrics.totalUsers += data.metrics.users
      combinedMetrics.totalConversions += data.metrics.conversions
      combinedMetrics.totalRevenue += data.metrics.revenue || 0
    })

    if (analyticsData.length > 0) {
      combinedMetrics.avgConversionRate = analyticsData.reduce((sum, d) => sum + d.metrics.conversionRate, 0) / analyticsData.length
      combinedMetrics.avgBounceRate = analyticsData.reduce((sum, d) => sum + d.metrics.bounceRate, 0) / analyticsData.length
    }

    return combinedMetrics
  }

  // Generate data-driven recommendations
  private generateDataDrivenRecommendations(analyticsData: AnalyticsData[], insights: MarketingInsight[]): string[] {
    const recommendations = []

    for (const data of analyticsData) {
      // Conversion rate optimization
      if (data.metrics.conversionRate < 2) {
        recommendations.push(`Improve conversion rate from ${data.metrics.conversionRate.toFixed(2)}% - optimize landing pages and CTAs`)
      }

      // Bounce rate optimization
      if (data.metrics.bounceRate > 60) {
        recommendations.push(`Reduce bounce rate from ${data.metrics.bounceRate.toFixed(1)}% - improve page load speed and content relevance`)
      }

      // Traffic diversification
      const topSource = data.dimensions.traffic_sources[0]
      if (topSource && (topSource.sessions / data.metrics.sessions) > 0.4) {
        recommendations.push(`Diversify traffic sources - ${topSource.source} accounts for ${Math.round((topSource.sessions / data.metrics.sessions) * 100)}% of traffic`)
      }

      // Revenue optimization
      if (data.metrics.revenue && data.metrics.conversions) {
        const aov = data.metrics.revenue / data.metrics.conversions
        if (aov < 100) {
          recommendations.push(`Increase average order value from $${aov.toFixed(2)} through upselling and cross-selling`)
        }
      }
    }

    // Add insight-based recommendations
    insights.filter(i => i.actionable && i.priority === 'high').forEach(insight => {
      recommendations.push(insight.description)
    })

    return recommendations.slice(0, 5) // Top 5 recommendations
  }

  // Extract campaign performance data
  private extractCampaignPerformance(analyticsData: AnalyticsData[]): any {
    const campaignData = {
      channels: {},
      performance: {},
      trends: {}
    }

    analyticsData.forEach(data => {
      // Process traffic sources as campaign channels
      data.dimensions.traffic_sources.forEach(source => {
        const channelKey = source.source.split(' / ')[1] || source.source
        if (!campaignData.channels[channelKey]) {
          campaignData.channels[channelKey] = {
            sessions: 0,
            conversions: 0,
            conversionRate: 0
          }
        }
        
        campaignData.channels[channelKey].sessions += source.sessions
        campaignData.channels[channelKey].conversions += source.conversions
        campaignData.channels[channelKey].conversionRate = 
          (campaignData.channels[channelKey].conversions / campaignData.channels[channelKey].sessions) * 100
      })
    })

    return campaignData
  }

  // Generate content recommendations based on performance
  private generateContentRecommendations(campaignData: any): string[] {
    const recommendations = []
    
    // Find best performing channels
    const channels = Object.entries(campaignData.channels).sort((a: any, b: any) => 
      b[1].conversionRate - a[1].conversionRate
    )

    if (channels.length > 0) {
      const bestChannel = channels[0]
      recommendations.push(`Focus content creation on ${bestChannel[0]} - highest conversion rate at ${bestChannel[1].conversionRate.toFixed(2)}%`)
    }

    if (channels.length > 1) {
      const worstChannel = channels[channels.length - 1]
      recommendations.push(`Optimize ${worstChannel[0]} content - conversion rate only ${worstChannel[1].conversionRate.toFixed(2)}%`)
    }

    return recommendations
  }

  // Identify optimization opportunities
  private identifyOptimizationOpportunities(campaignData: any): any[] {
    const opportunities = []

    Object.entries(campaignData.channels).forEach(([channel, data]: [string, any]) => {
      if (data.conversionRate < 2) {
        opportunities.push({
          channel,
          type: 'conversion_optimization',
          currentRate: data.conversionRate,
          targetRate: 2.5,
          potentialImpact: `+${((2.5 - data.conversionRate) * data.sessions / 100).toFixed(0)} conversions`
        })
      }
    })

    return opportunities
  }

  // Identify best performing content
  private identifyBestContent(analyticsData: AnalyticsData[]): any[] {
    const bestContent = []

    analyticsData.forEach(data => {
      data.dimensions.top_pages.slice(0, 3).forEach(page => {
        bestContent.push({
          page: page.page,
          pageviews: page.pageviews,
          performance: 'high',
          source: data.source
        })
      })
    })

    return bestContent.slice(0, 5)
  }

  // Identify content gaps
  private identifyContentGaps(analyticsData: AnalyticsData[]): string[] {
    const gaps = []

    analyticsData.forEach(data => {
      if (data.metrics.bounceRate > 60) {
        gaps.push('High bounce rate indicates need for more engaging landing page content')
      }
      
      if (data.metrics.avgSessionDuration < 120) {
        gaps.push('Low session duration suggests need for more compelling content to increase engagement')
      }
    })

    return gaps
  }

  // Extract audience insights
  private extractAudienceInsights(analyticsData: AnalyticsData[]): any[] {
    const insights = []

    analyticsData.forEach(data => {
      // Traffic source insights provide audience behavior patterns
      data.dimensions.traffic_sources.forEach(source => {
        if (source.sessions > 100) { // Only significant traffic sources
          insights.push({
            segment: source.source,
            behavior: {
              sessions: source.sessions,
              conversions: source.conversions,
              conversionRate: (source.conversions / source.sessions) * 100
            },
            recommendation: source.conversions / source.sessions > 0.02 
              ? 'High-value audience - increase targeting'
              : 'Low-converting audience - optimize messaging'
          })
        }
      })
    })

    return insights.slice(0, 5)
  }
}

export default TrinityAnalyticsEnhancer