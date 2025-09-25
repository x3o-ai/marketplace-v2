import { google } from 'googleapis'

// Analytics Platform Integration Architecture
export interface AnalyticsProvider {
  type: 'google_analytics' | 'mixpanel' | 'adobe_analytics' | 'segment'
  credentials: any
  config: AnalyticsConfig
  isConnected: boolean
  lastSync?: Date
}

export interface AnalyticsConfig {
  propertyId?: string // GA4 property ID
  projectId?: string // Mixpanel project ID
  apiKey?: string
  secretKey?: string
  refreshToken?: string
  syncFrequency: 'real_time' | 'hourly' | 'daily'
  dataRetention: number // days
  metrics: string[]
}

export interface AnalyticsData {
  source: string
  timeRange: {
    startDate: string
    endDate: string
  }
  metrics: {
    sessions: number
    pageviews: number
    users: number
    bounceRate: number
    avgSessionDuration: number
    conversions: number
    conversionRate: number
    revenue?: number
  }
  dimensions: {
    traffic_sources: Array<{
      source: string
      sessions: number
      conversions: number
    }>
    top_pages: Array<{
      page: string
      pageviews: number
      exits: number
    }>
    user_segments: Array<{
      segment: string
      users: number
      value: number
    }>
  }
  events: Array<{
    name: string
    count: number
    value?: number
  }>
  goals: Array<{
    name: string
    completions: number
    value: number
  }>
  lastUpdated: Date
}

export interface MarketingInsight {
  type: 'performance' | 'optimization' | 'prediction' | 'alert'
  title: string
  description: string
  data: any
  confidence: number
  actionable: boolean
  priority: 'low' | 'medium' | 'high' | 'critical'
  source: string
  timestamp: Date
}

// Google Analytics 4 Integration
export class GoogleAnalyticsConnector {
  private analytics: any
  private propertyId: string

  constructor(credentials: any, propertyId: string) {
    this.propertyId = propertyId
    this.analytics = google.analyticsdata('v1beta')
    
    // Set up authentication
    google.auth.setGlobalAuth(new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/analytics.readonly']
    }))
  }

  // Fetch comprehensive analytics data
  async fetchAnalyticsData(startDate: string, endDate: string): Promise<AnalyticsData> {
    try {
      // Fetch core metrics
      const coreMetricsResponse = await this.analytics.properties.runReport({
        property: `properties/${this.propertyId}`,
        requestBody: {
          dateRanges: [{ startDate, endDate }],
          metrics: [
            { name: 'sessions' },
            { name: 'totalUsers' },
            { name: 'screenPageViews' },
            { name: 'bounceRate' },
            { name: 'averageSessionDuration' },
            { name: 'conversions' },
            { name: 'totalRevenue' }
          ]
        }
      })

      // Fetch traffic sources
      const trafficSourcesResponse = await this.analytics.properties.runReport({
        property: `properties/${this.propertyId}`,
        requestBody: {
          dateRanges: [{ startDate, endDate }],
          metrics: [
            { name: 'sessions' },
            { name: 'conversions' }
          ],
          dimensions: [
            { name: 'sessionSource' },
            { name: 'sessionMedium' }
          ]
        }
      })

      // Fetch top pages
      const topPagesResponse = await this.analytics.properties.runReport({
        property: `properties/${this.propertyId}`,
        requestBody: {
          dateRanges: [{ startDate, endDate }],
          metrics: [
            { name: 'screenPageViews' },
            { name: 'exits' }
          ],
          dimensions: [
            { name: 'pagePath' }
          ],
          orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
          limit: 20
        }
      })

      // Fetch conversion events
      const eventsResponse = await this.analytics.properties.runReport({
        property: `properties/${this.propertyId}`,
        requestBody: {
          dateRanges: [{ startDate, endDate }],
          metrics: [
            { name: 'eventCount' },
            { name: 'eventValue' }
          ],
          dimensions: [
            { name: 'eventName' }
          ],
          dimensionFilter: {
            filter: {
              fieldName: 'eventName',
              inListFilter: {
                values: ['purchase', 'sign_up', 'trial_start', 'subscription_create']
              }
            }
          }
        }
      })

      // Process and structure the data
      const coreMetrics = this.extractMetrics(coreMetricsResponse.data)
      const trafficSources = this.extractTrafficSources(trafficSourcesResponse.data)
      const topPages = this.extractTopPages(topPagesResponse.data)
      const events = this.extractEvents(eventsResponse.data)

      return {
        source: 'google_analytics',
        timeRange: { startDate, endDate },
        metrics: {
          sessions: coreMetrics.sessions || 0,
          pageviews: coreMetrics.pageviews || 0,
          users: coreMetrics.users || 0,
          bounceRate: coreMetrics.bounceRate || 0,
          avgSessionDuration: coreMetrics.avgSessionDuration || 0,
          conversions: coreMetrics.conversions || 0,
          conversionRate: coreMetrics.conversions > 0 ? (coreMetrics.conversions / coreMetrics.sessions) * 100 : 0,
          revenue: coreMetrics.revenue || 0
        },
        dimensions: {
          traffic_sources: trafficSources,
          top_pages: topPages,
          user_segments: [] // Would be populated with audience data
        },
        events,
        goals: events.filter(event => ['purchase', 'sign_up', 'subscription_create'].includes(event.name)),
        lastUpdated: new Date()
      }
    } catch (error) {
      console.error('Google Analytics fetch error:', error)
      throw new Error(`Failed to fetch Google Analytics data: ${error.message}`)
    }
  }

  // Extract metrics from GA4 response
  private extractMetrics(responseData: any): any {
    const rows = responseData.rows || []
    if (rows.length === 0) return {}

    const metricValues = rows[0].metricValues || []
    
    return {
      sessions: parseInt(metricValues[0]?.value || '0'),
      users: parseInt(metricValues[1]?.value || '0'),
      pageviews: parseInt(metricValues[2]?.value || '0'),
      bounceRate: parseFloat(metricValues[3]?.value || '0'),
      avgSessionDuration: parseFloat(metricValues[4]?.value || '0'),
      conversions: parseInt(metricValues[5]?.value || '0'),
      revenue: parseFloat(metricValues[6]?.value || '0')
    }
  }

  // Extract traffic sources
  private extractTrafficSources(responseData: any): Array<any> {
    const rows = responseData.rows || []
    
    return rows.map((row: any) => ({
      source: `${row.dimensionValues[0]?.value} / ${row.dimensionValues[1]?.value}`,
      sessions: parseInt(row.metricValues[0]?.value || '0'),
      conversions: parseInt(row.metricValues[1]?.value || '0')
    })).slice(0, 10)
  }

  // Extract top pages
  private extractTopPages(responseData: any): Array<any> {
    const rows = responseData.rows || []
    
    return rows.map((row: any) => ({
      page: row.dimensionValues[0]?.value || '',
      pageviews: parseInt(row.metricValues[0]?.value || '0'),
      exits: parseInt(row.metricValues[1]?.value || '0')
    })).slice(0, 10)
  }

  // Extract events
  private extractEvents(responseData: any): Array<any> {
    const rows = responseData.rows || []
    
    return rows.map((row: any) => ({
      name: row.dimensionValues[0]?.value || '',
      count: parseInt(row.metricValues[0]?.value || '0'),
      value: parseFloat(row.metricValues[1]?.value || '0')
    }))
  }

  // Test connection
  async testConnection(): Promise<boolean> {
    try {
      await this.analytics.properties.runReport({
        property: `properties/${this.propertyId}`,
        requestBody: {
          dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
          metrics: [{ name: 'sessions' }]
        }
      })
      return true
    } catch (error) {
      console.error('GA4 connection test failed:', error)
      return false
    }
  }
}

// Mixpanel Integration
export class MixpanelConnector {
  private apiKey: string
  private secretKey: string
  private projectId: string

  constructor(apiKey: string, secretKey: string, projectId: string) {
    this.apiKey = apiKey
    this.secretKey = secretKey
    this.projectId = projectId
  }

  // Fetch Mixpanel analytics data
  async fetchAnalyticsData(startDate: string, endDate: string): Promise<AnalyticsData> {
    try {
      // Fetch events data
      const eventsData = await this.makeRequest('/api/2.0/events', {
        event: ['signup', 'trial_start', 'upgrade', 'churn'],
        from_date: startDate,
        to_date: endDate,
        unit: 'day'
      })

      // Fetch funnel data
      const funnelData = await this.makeRequest('/api/2.0/funnels', {
        funnel_id: 'signup_to_paid',
        from_date: startDate,
        to_date: endDate
      })

      // Fetch revenue data
      const revenueData = await this.makeRequest('/api/2.0/revenue', {
        from_date: startDate,
        to_date: endDate
      })

      // Process and structure the data
      return {
        source: 'mixpanel',
        timeRange: { startDate, endDate },
        metrics: this.processMixpanelMetrics(eventsData, funnelData, revenueData),
        dimensions: {
          traffic_sources: this.extractTrafficSources(eventsData),
          top_pages: [], // Mixpanel is event-based, not page-based
          user_segments: this.extractUserSegments(eventsData)
        },
        events: this.extractEvents(eventsData),
        goals: this.extractGoals(funnelData),
        lastUpdated: new Date()
      }
    } catch (error) {
      console.error('Mixpanel fetch error:', error)
      throw new Error(`Failed to fetch Mixpanel data: ${error.message}`)
    }
  }

  // Make authenticated request to Mixpanel API
  private async makeRequest(endpoint: string, params: any): Promise<any> {
    const url = new URL(`https://mixpanel.com${endpoint}`)
    
    // Add authentication and parameters
    url.searchParams.append('api_key', this.apiKey)
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, Array.isArray(value) ? JSON.stringify(value) : String(value))
    })

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Mixpanel API error: ${response.status} ${response.statusText}`)
    }

    return await response.json()
  }

  // Process Mixpanel metrics
  private processMixpanelMetrics(eventsData: any, funnelData: any, revenueData: any): any {
    const totalEvents = Object.values(eventsData.data || {}).reduce((sum: number, dayData: any) => {
      return sum + Object.values(dayData).reduce((daySum: number, count: any) => daySum + (count || 0), 0)
    }, 0)

    return {
      sessions: totalEvents, // Approximate sessions from events
      pageviews: totalEvents,
      users: funnelData.data?.steps?.[0]?.count || 0,
      bounceRate: 0, // Not directly available in Mixpanel
      avgSessionDuration: 0, // Not directly available
      conversions: funnelData.data?.steps?.[funnelData.data.steps.length - 1]?.count || 0,
      conversionRate: this.calculateConversionRate(funnelData),
      revenue: revenueData.total || 0
    }
  }

  private calculateConversionRate(funnelData: any): number {
    const steps = funnelData.data?.steps || []
    if (steps.length < 2) return 0
    
    const firstStep = steps[0].count || 0
    const lastStep = steps[steps.length - 1].count || 0
    
    return firstStep > 0 ? (lastStep / firstStep) * 100 : 0
  }

  private extractTrafficSources(eventsData: any): Array<any> {
    // Process traffic source data from Mixpanel events
    return []
  }

  private extractUserSegments(eventsData: any): Array<any> {
    // Process user segmentation data
    return []
  }

  private extractEvents(eventsData: any): Array<any> {
    const events = []
    const data = eventsData.data || {}
    
    for (const [eventName, dayData] of Object.entries(data)) {
      const totalCount = Object.values(dayData as any).reduce((sum: number, count: any) => sum + (count || 0), 0)
      events.push({
        name: eventName,
        count: totalCount,
        value: 0 // Would need revenue tracking for value
      })
    }
    
    return events
  }

  private extractGoals(funnelData: any): Array<any> {
    const steps = funnelData.data?.steps || []
    
    return steps.map((step: any, index: number) => ({
      name: step.name || `Step ${index + 1}`,
      completions: step.count || 0,
      value: step.avg_revenue || 0
    }))
  }

  // Test connection
  async testConnection(): Promise<boolean> {
    try {
      await this.makeRequest('/api/2.0/events/names', {
        type: 'general'
      })
      return true
    } catch (error) {
      console.error('Mixpanel connection test failed:', error)
      return false
    }
  }
}

// Analytics Integration Manager
export class AnalyticsIntegrationManager {
  private providers: Map<string, AnalyticsProvider> = new Map()
  private dataCache: Map<string, { data: AnalyticsData; expires: number }> = new Map()

  // Add analytics provider
  async addProvider(
    organizationId: string, 
    providerType: AnalyticsProvider['type'],
    credentials: any,
    config: AnalyticsConfig
  ): Promise<boolean> {
    try {
      let connector: GoogleAnalyticsConnector | MixpanelConnector
      
      switch (providerType) {
        case 'google_analytics':
          connector = new GoogleAnalyticsConnector(credentials, config.propertyId!)
          break
        case 'mixpanel':
          connector = new MixpanelConnector(config.apiKey!, config.secretKey!, config.projectId!)
          break
        default:
          throw new Error(`Unsupported analytics provider: ${providerType}`)
      }

      // Test connection
      const isConnected = await connector.testConnection()
      
      if (!isConnected) {
        throw new Error(`Failed to connect to ${providerType}`)
      }

      // Store provider configuration
      const provider: AnalyticsProvider = {
        type: providerType,
        credentials,
        config,
        isConnected: true,
        lastSync: new Date()
      }

      this.providers.set(`${organizationId}_${providerType}`, provider)

      // Save to database
      await this.saveProviderConfig(organizationId, provider)

      return true
    } catch (error) {
      console.error('Failed to add analytics provider:', error)
      return false
    }
  }

  // Get analytics data for organization
  async getAnalyticsData(
    organizationId: string, 
    startDate: string, 
    endDate: string,
    forceRefresh = false
  ): Promise<AnalyticsData[]> {
    const results: AnalyticsData[] = []
    
    for (const [key, provider] of this.providers.entries()) {
      if (!key.startsWith(organizationId)) continue
      
      try {
        const cacheKey = `${key}_${startDate}_${endDate}`
        const cached = this.dataCache.get(cacheKey)
        
        if (!forceRefresh && cached && cached.expires > Date.now()) {
          results.push(cached.data)
          continue
        }

        let data: AnalyticsData
        
        switch (provider.type) {
          case 'google_analytics':
            const gaConnector = new GoogleAnalyticsConnector(
              provider.credentials, 
              provider.config.propertyId!
            )
            data = await gaConnector.fetchAnalyticsData(startDate, endDate)
            break
            
          case 'mixpanel':
            const mpConnector = new MixpanelConnector(
              provider.config.apiKey!,
              provider.config.secretKey!,
              provider.config.projectId!
            )
            data = await mpConnector.fetchAnalyticsData(startDate, endDate)
            break
            
          default:
            continue
        }

        // Cache the data
        this.dataCache.set(cacheKey, {
          data,
          expires: Date.now() + (60 * 60 * 1000) // 1 hour cache
        })

        results.push(data)
      } catch (error) {
        console.error(`Failed to fetch data from ${provider.type}:`, error)
      }
    }

    return results
  }

  // Generate marketing insights from analytics data
  async generateMarketingInsights(analyticsData: AnalyticsData[]): Promise<MarketingInsight[]> {
    const insights: MarketingInsight[] = []

    for (const data of analyticsData) {
      // Performance insights
      if (data.metrics.conversionRate < 2) {
        insights.push({
          type: 'optimization',
          title: 'Low Conversion Rate Detected',
          description: `Conversion rate of ${data.metrics.conversionRate.toFixed(1)}% is below industry average of 2-3%`,
          data: { currentRate: data.metrics.conversionRate, benchmark: 2.5 },
          confidence: 90,
          actionable: true,
          priority: 'high',
          source: data.source,
          timestamp: new Date()
        })
      }

      // Traffic source insights
      const topTrafficSource = data.dimensions.traffic_sources[0]
      if (topTrafficSource && topTrafficSource.sessions > data.metrics.sessions * 0.4) {
        insights.push({
          type: 'alert',
          title: 'High Traffic Source Dependency',
          description: `${topTrafficSource.source} accounts for ${Math.round((topTrafficSource.sessions / data.metrics.sessions) * 100)}% of traffic`,
          data: { source: topTrafficSource.source, percentage: (topTrafficSource.sessions / data.metrics.sessions) * 100 },
          confidence: 95,
          actionable: true,
          priority: 'medium',
          source: data.source,
          timestamp: new Date()
        })
      }

      // Revenue optimization insights
      if (data.metrics.revenue && data.metrics.conversions) {
        const avgOrderValue = data.metrics.revenue / data.metrics.conversions
        if (avgOrderValue > 0) {
          insights.push({
            type: 'performance',
            title: 'Revenue Performance Analysis',
            description: `Average order value: $${avgOrderValue.toFixed(2)}`,
            data: { aov: avgOrderValue, revenue: data.metrics.revenue, conversions: data.metrics.conversions },
            confidence: 85,
            actionable: false,
            priority: 'low',
            source: data.source,
            timestamp: new Date()
          })
        }
      }
    }

    return insights
  }

  // Save provider configuration to database
  private async saveProviderConfig(organizationId: string, provider: AnalyticsProvider): Promise<void> {
    const { prisma } = await import('./prisma')
    
    await prisma.systemConfig.upsert({
      where: { key: `analytics_provider_${organizationId}_${provider.type}` },
      update: {
        value: {
          type: provider.type,
          config: provider.config,
          isConnected: provider.isConnected,
          lastSync: provider.lastSync,
          credentials: '***encrypted***' // Don't store actual credentials in plain text
        }
      },
      create: {
        key: `analytics_provider_${organizationId}_${provider.type}`,
        value: {
          type: provider.type,
          config: provider.config,
          isConnected: provider.isConnected,
          lastSync: provider.lastSync,
          credentials: '***encrypted***'
        },
        description: `Analytics provider configuration for ${provider.type}`,
        category: 'analytics_integration'
      }
    })
  }
}

export default AnalyticsIntegrationManager