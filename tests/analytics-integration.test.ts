import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { GoogleAnalyticsConnector, MixpanelConnector, AnalyticsIntegrationManager } from '@/lib/analytics-integration'
import TrinityAnalyticsEnhancer from '@/lib/trinity-analytics-enhancement'
import AnalyticsDataSyncManager from '@/lib/analytics-sync'
import AnalyticsSecurityManager, { PrivacyComplianceManager } from '@/lib/analytics-security'

// Mock external dependencies
jest.mock('googleapis')
jest.mock('@/lib/prisma')

describe('Analytics Integration Testing Suite', () => {
  let mockOrganizationId: string
  let mockUserId: string
  let mockAnalyticsData: any

  beforeEach(() => {
    mockOrganizationId = 'test-org-123'
    mockUserId = 'test-user-456'
    
    mockAnalyticsData = {
      source: 'google_analytics',
      timeRange: { startDate: '2024-01-01', endDate: '2024-01-31' },
      metrics: {
        sessions: 15420,
        users: 12330,
        pageviews: 45680,
        bounceRate: 42.3,
        avgSessionDuration: 180,
        conversions: 234,
        conversionRate: 1.52,
        revenue: 47250
      },
      dimensions: {
        traffic_sources: [
          { source: 'google / organic', sessions: 8540, conversions: 156 },
          { source: 'direct / none', sessions: 3420, conversions: 45 },
          { source: 'facebook / social', sessions: 2180, conversions: 23 }
        ],
        top_pages: [
          { page: '/', pageviews: 12340, exits: 1234 },
          { page: '/pricing', pageviews: 8750, exits: 875 },
          { page: '/signup', pageviews: 6420, exits: 320 }
        ],
        user_segments: []
      },
      events: [
        { name: 'sign_up', count: 234, value: 0 },
        { name: 'trial_start', count: 234, value: 0 },
        { name: 'purchase', count: 89, value: 47250 }
      ],
      goals: [
        { name: 'Newsletter Signup', completions: 234, value: 0 },
        { name: 'Trial Registration', completions: 234, value: 0 },
        { name: 'Subscription Purchase', completions: 89, value: 47250 }
      ],
      lastUpdated: new Date()
    }

    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Google Analytics Integration', () => {
    test('should connect to GA4 API successfully', async () => {
      const mockGoogleAuth = {
        setGlobalAuth: jest.fn(),
        GoogleAuth: jest.fn().mockImplementation(() => ({}))
      }

      const mockAnalyticsApi = {
        properties: {
          runReport: jest.fn().mockResolvedValue({
            data: {
              rows: [{
                metricValues: [
                  { value: '15420' }, // sessions
                  { value: '12330' }, // users  
                  { value: '45680' }, // pageviews
                  { value: '42.3' },  // bounce rate
                  { value: '180' },   // avg session duration
                  { value: '234' },   // conversions
                  { value: '47250' }  // revenue
                ]
              }]
            }
          })
        }
      }

      jest.doMock('googleapis', () => ({
        google: {
          auth: mockGoogleAuth,
          analyticsdata: jest.fn().mockReturnValue(mockAnalyticsApi)
        }
      }))

      const connector = new GoogleAnalyticsConnector(
        { client_email: 'test@test.com', private_key: 'test-key' },
        '123456789'
      )

      const result = await connector.fetchAnalyticsData('2024-01-01', '2024-01-31')

      expect(result.source).toBe('google_analytics')
      expect(result.metrics.sessions).toBe(15420)
      expect(result.metrics.users).toBe(12330)
      expect(result.metrics.conversionRate).toBeCloseTo(1.52)
    })

    test('should handle GA4 API errors gracefully', async () => {
      const mockAnalyticsApi = {
        properties: {
          runReport: jest.fn().mockRejectedValue(new Error('API quota exceeded'))
        }
      }

      jest.doMock('googleapis', () => ({
        google: {
          auth: { setGlobalAuth: jest.fn(), GoogleAuth: jest.fn() },
          analyticsdata: jest.fn().mockReturnValue(mockAnalyticsApi)
        }
      }))

      const connector = new GoogleAnalyticsConnector({}, '123456789')

      await expect(connector.fetchAnalyticsData('2024-01-01', '2024-01-31'))
        .rejects.toThrow('Failed to fetch Google Analytics data')
    })

    test('should validate GA4 connection', async () => {
      const mockAnalyticsApi = {
        properties: {
          runReport: jest.fn().mockResolvedValue({ data: { rows: [] } })
        }
      }

      jest.doMock('googleapis', () => ({
        google: {
          auth: { setGlobalAuth: jest.fn(), GoogleAuth: jest.fn() },
          analyticsdata: jest.fn().mockReturnValue(mockAnalyticsApi)
        }
      }))

      const connector = new GoogleAnalyticsConnector({}, '123456789')
      const isConnected = await connector.testConnection()

      expect(isConnected).toBe(true)
    })
  })

  describe('Mixpanel Integration', () => {
    test('should fetch Mixpanel data correctly', async () => {
      const mockFetch = jest.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            data: {
              signup: { '2024-01-01': 45, '2024-01-02': 52 },
              trial_start: { '2024-01-01': 43, '2024-01-02': 48 }
            }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            data: {
              steps: [
                { name: 'Visit', count: 15420 },
                { name: 'Signup', count: 234 },
                { name: 'Purchase', count: 89 }
              ]
            }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ total: 47250 })
        })

      global.fetch = mockFetch

      const connector = new MixpanelConnector('test-api-key', 'test-secret', 'test-project')
      const result = await connector.fetchAnalyticsData('2024-01-01', '2024-01-31')

      expect(result.source).toBe('mixpanel')
      expect(result.metrics.users).toBe(15420)
      expect(result.metrics.conversions).toBe(89)
      expect(mockFetch).toHaveBeenCalledTimes(3)
    })

    test('should handle Mixpanel API authentication errors', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized'
      })

      const connector = new MixpanelConnector('invalid-key', 'invalid-secret', 'test-project')

      await expect(connector.fetchAnalyticsData('2024-01-01', '2024-01-31'))
        .rejects.toThrow('Mixpanel API error: 401 Unauthorized')
    })
  })

  describe('Trinity Agent Analytics Enhancement', () => {
    test('should enhance Oracle with real analytics data', async () => {
      const enhancer = new TrinityAnalyticsEnhancer()
      
      // Mock analytics manager
      jest.spyOn(enhancer as any, 'getOrganizationAnalytics').mockResolvedValue([mockAnalyticsData])

      const originalResponse = {
        analysis: 'Basic business analysis',
        confidence: 80,
        insights: ['Generic insight'],
        recommendations: ['Generic recommendation']
      }

      const context = {
        organizationData: { id: mockOrganizationId },
        userProfile: { name: 'Test User' }
      }

      const enhanced = await enhancer.enhanceOracleWithRealData('analyze revenue trends', context, originalResponse)

      expect(enhanced.dataEnhancement.realDataUsed).toBe(true)
      expect(enhanced.dataEnhancement.dataSources).toContain('google_analytics')
      expect(enhanced.dataEnhancement.confidence).toBeGreaterThan(originalResponse.confidence)
      expect(enhanced.realDataInsights).toBeDefined()
      expect(enhanced.marketingMetrics.totalSessions).toBe(15420)
      expect(enhanced.actionableRecommendations).toHaveLength(5)
    })

    test('should enhance Sage with campaign performance data', async () => {
      const enhancer = new TrinityAnalyticsEnhancer()
      
      jest.spyOn(enhancer as any, 'getOrganizationAnalytics').mockResolvedValue([mockAnalyticsData])

      const originalResponse = {
        content: { body: 'Generated content' },
        brandAlignment: 85,
        recommendations: ['Generic content recommendation']
      }

      const context = {
        organizationData: { id: mockOrganizationId }
      }

      const enhanced = await enhancer.enhanceSageWithCampaignData('optimize email campaign', context, originalResponse)

      expect(enhanced.campaignEnhancement.realDataUsed).toBe(true)
      expect(enhanced.campaignEnhancement.performanceData).toBeDefined()
      expect(enhanced.contentOptimization.bestPerformingContent).toHaveLength(5)
      expect(enhanced.contentOptimization.audienceInsights).toHaveLength(3)
    })

    test('should handle missing analytics data gracefully', async () => {
      const enhancer = new TrinityAnalyticsEnhancer()
      
      jest.spyOn(enhancer as any, 'getOrganizationAnalytics').mockResolvedValue([])

      const originalResponse = { analysis: 'Basic analysis' }
      const context = { organizationData: { id: mockOrganizationId } }

      const enhanced = await enhancer.enhanceOracleWithRealData('test query', context, originalResponse)

      expect(enhanced.dataEnhancement.realDataUsed).toBe(false)
      expect(enhanced.dataEnhancement.message).toContain('Connect Google Analytics')
    })
  })

  describe('Data Synchronization System', () => {
    test('should cache analytics data with appropriate TTL', async () => {
      const syncManager = new AnalyticsDataSyncManager()
      
      const cacheKey = 'test_org_google_analytics_2024-01-01_2024-01-31'
      
      syncManager.setCache(cacheKey, mockAnalyticsData, 60 * 60 * 1000, 'google_analytics')
      
      const cachedData = syncManager.getCache(cacheKey)
      expect(cachedData).toEqual(mockAnalyticsData)
      
      // Test cache stats
      const stats = syncManager.getCacheStats()
      expect(stats.totalEntries).toBe(1)
      expect(stats.topSources).toContainEqual({ source: 'google_analytics', entries: 1 })
    })

    test('should expire and cleanup old cache entries', async () => {
      const syncManager = new AnalyticsDataSyncManager()
      
      // Set cache entry with very short TTL
      syncManager.setCache('test_key', { test: 'data' }, 1, 'test_source') // 1ms TTL
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 10))
      
      const expiredData = syncManager.getCache('test_key')
      expect(expiredData).toBeNull()
    })

    test('should handle sync job execution', async () => {
      const syncManager = new AnalyticsDataSyncManager()
      
      // Mock analytics manager
      const mockAnalyticsManager = {
        getAnalyticsData: jest.fn().mockResolvedValue([mockAnalyticsData])
      }

      jest.doMock('@/lib/analytics-integration', () => ({
        default: jest.fn().mockImplementation(() => mockAnalyticsManager)
      }))

      const jobIds = await syncManager.scheduleSync(
        mockOrganizationId,
        [{
          type: 'google_analytics',
          credentials: {},
          config: { propertyId: '123456', syncFrequency: 'hourly', metrics: [] },
          isConnected: true
        }],
        'realtime'
      )

      expect(jobIds).toHaveLength(1)
      
      const jobStatus = syncManager.getSyncJobStatus(jobIds[0])
      expect(jobStatus).toBeDefined()
      expect(jobStatus?.organizationId).toBe(mockOrganizationId)
    })
  })

  describe('Analytics Security and Privacy', () => {
    test('should encrypt and decrypt analytics data', () => {
      const securityManager = new AnalyticsSecurityManager()
      
      const testData = { sensitive: 'user data', metrics: [1, 2, 3] }
      
      const encrypted = securityManager.encryptAnalyticsData(testData)
      expect(encrypted.encrypted).toBeDefined()
      expect(encrypted.iv).toBeDefined()
      expect(encrypted.tag).toBeDefined()
      
      const decrypted = securityManager.decryptAnalyticsData(encrypted.encrypted, encrypted.iv, encrypted.tag)
      expect(decrypted).toEqual(testData)
    })

    test('should check user access permissions correctly', async () => {
      const securityManager = new AnalyticsSecurityManager()
      
      // Mock user with analytics access
      const { prisma } = require('@/lib/prisma')
      prisma.user.findUnique.mockResolvedValue({
        id: mockUserId,
        organizationId: mockOrganizationId,
        permissions: ['analytics_access', 'trinity_agent_trial'],
        role: 'ANALYST'
      })

      const accessCheck = await securityManager.checkDataAccess(
        mockUserId,
        mockOrganizationId,
        'READ',
        'analytics_data'
      )

      expect(accessCheck.allowed).toBe(true)
    })

    test('should deny access for insufficient permissions', async () => {
      const securityManager = new AnalyticsSecurityManager()
      
      const { prisma } = require('@/lib/prisma')
      prisma.user.findUnique.mockResolvedValue({
        id: mockUserId,
        organizationId: mockOrganizationId,
        permissions: ['basic_access'], // No analytics permissions
        role: 'USER'
      })

      const accessCheck = await securityManager.checkDataAccess(
        mockUserId,
        mockOrganizationId,
        'READ',
        'analytics_data'
      )

      expect(accessCheck.allowed).toBe(false)
      expect(accessCheck.reason).toContain('Insufficient permissions')
    })

    test('should handle GDPR data requests', async () => {
      const complianceManager = new PrivacyComplianceManager()
      
      const { prisma } = require('@/lib/prisma')
      prisma.user.findUnique.mockResolvedValue({
        id: mockUserId,
        name: 'John Doe',
        email: 'john@company.com',
        organization: { name: 'Test Company' },
        aiInteractions: [
          { id: 'int1', query: 'test query', createdAt: new Date(), agentId: 'oracle' }
        ],
        auditLogs: [
          { action: 'LOGIN', timestamp: new Date() }
        ]
      })

      const exportedData = await complianceManager.handleGDPRRequest(mockUserId, 'access')

      expect(exportedData.personalData.email).toBe('john@company.com')
      expect(exportedData.analyticsInteractions).toHaveLength(1)
      expect(exportedData.gdprCompliant).toBe(true)
    })

    test('should anonymize analytics data for privacy compliance', () => {
      const securityManager = new AnalyticsSecurityManager()
      
      const sensitiveData = {
        userInfo: {
          id: 'user123',
          email: 'user@company.com'
        },
        sessions: [
          { id: 'session1', ipAddress: '192.168.1.100', data: 'test' }
        ],
        detailedUserBehavior: { trackingData: 'sensitive' }
      }

      const anonymized = securityManager.anonymizeAnalyticsData(sensitiveData)

      expect(anonymized.userInfo.anonymized).toBe(true)
      expect(anonymized.userInfo.id).not.toBe('user123') // Should be hashed
      expect(anonymized.sessions[0].ipAddress).toBe('192.168.1.0') // IP anonymized
      expect(anonymized.detailedUserBehavior).toBeUndefined() // Removed
    })
  })

  describe('Analytics Data Quality and Accuracy', () => {
    test('should validate analytics data structure', () => {
      const requiredFields = ['source', 'timeRange', 'metrics', 'dimensions', 'events', 'goals']
      
      requiredFields.forEach(field => {
        expect(mockAnalyticsData).toHaveProperty(field)
      })

      expect(mockAnalyticsData.metrics).toHaveProperty('sessions')
      expect(mockAnalyticsData.metrics).toHaveProperty('conversions')
      expect(mockAnalyticsData.metrics).toHaveProperty('conversionRate')
      expect(typeof mockAnalyticsData.metrics.sessions).toBe('number')
    })

    test('should calculate conversion rates accurately', () => {
      const conversionRate = (mockAnalyticsData.metrics.conversions / mockAnalyticsData.metrics.sessions) * 100
      
      expect(conversionRate).toBeCloseTo(mockAnalyticsData.metrics.conversionRate, 2)
      expect(conversionRate).toBeCloseTo(1.52, 2)
    })

    test('should validate traffic source data integrity', () => {
      const trafficSources = mockAnalyticsData.dimensions.traffic_sources
      
      expect(Array.isArray(trafficSources)).toBe(true)
      expect(trafficSources.length).toBeGreaterThan(0)
      
      trafficSources.forEach((source: any) => {
        expect(source).toHaveProperty('source')
        expect(source).toHaveProperty('sessions')
        expect(source).toHaveProperty('conversions')
        expect(typeof source.sessions).toBe('number')
        expect(typeof source.conversions).toBe('number')
      })

      // Verify sessions add up reasonably
      const totalSourceSessions = trafficSources.reduce((sum: number, source: any) => sum + source.sessions, 0)
      expect(totalSourceSessions).toBeLessThanOrEqual(mockAnalyticsData.metrics.sessions)
    })

    test('should detect anomalies in analytics data', () => {
      // Test for unrealistic conversion rates
      const highConversionData = {
        ...mockAnalyticsData,
        metrics: {
          ...mockAnalyticsData.metrics,
          conversionRate: 95 // Unrealistic conversion rate
        }
      }

      const isRealistic = highConversionData.metrics.conversionRate < 10 // Reasonable threshold
      expect(isRealistic).toBe(false)
    })
  })

  describe('Integration Performance Tests', () => {
    test('should complete data fetch within acceptable time limits', async () => {
      const startTime = Date.now()
      
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockAnalyticsData)
      })
      global.fetch = mockFetch

      const manager = new AnalyticsIntegrationManager()
      
      // Simulate adding and fetching data
      await manager.addProvider(
        mockOrganizationId,
        'mixpanel',
        { apiKey: 'test' },
        { projectId: 'test', apiKey: 'test', secretKey: 'test', syncFrequency: 'hourly', metrics: [] }
      )

      const responseTime = Date.now() - startTime
      expect(responseTime).toBeLessThan(5000) // Should complete within 5 seconds
    })

    test('should handle concurrent data requests efficiently', async () => {
      const syncManager = new AnalyticsDataSyncManager()
      
      const promises = []
      for (let i = 0; i < 10; i++) {
        promises.push(
          syncManager.getCachedAnalyticsData(
            `org_${i}`,
            '2024-01-01',
            '2024-01-31'
          )
        )
      }

      const results = await Promise.all(promises)
      expect(results).toHaveLength(10)
    })
  })

  describe('End-to-End Integration Tests', () => {
    test('should complete full analytics workflow', async () => {
      // 1. Connect analytics provider
      const manager = new AnalyticsIntegrationManager()
      const connected = await manager.addProvider(
        mockOrganizationId,
        'google_analytics',
        { client_email: 'test@test.com' },
        { propertyId: '123456', syncFrequency: 'hourly', metrics: [] }
      )

      expect(connected).toBe(true)

      // 2. Fetch analytics data
      jest.spyOn(manager, 'getAnalyticsData').mockResolvedValue([mockAnalyticsData])
      
      const data = await manager.getAnalyticsData(mockOrganizationId, '2024-01-01', '2024-01-31')
      expect(data).toHaveLength(1)
      expect(data[0].source).toBe('google_analytics')

      // 3. Generate marketing insights
      const insights = await manager.generateMarketingInsights(data)
      expect(Array.isArray(insights)).toBe(true)

      // 4. Enhance Trinity Agent response
      const enhancer = new TrinityAnalyticsEnhancer()
      jest.spyOn(enhancer as any, 'getOrganizationAnalytics').mockResolvedValue(data)

      const enhanced = await enhancer.enhanceOracleWithRealData(
        'analyze marketing performance',
        { organizationData: { id: mockOrganizationId } },
        { analysis: 'test' }
      )

      expect(enhanced.dataEnhancement.realDataUsed).toBe(true)
    })

    test('should maintain data quality throughout pipeline', async () => {
      // Test data integrity through entire pipeline
      const originalData = JSON.parse(JSON.stringify(mockAnalyticsData))
      
      // Process through security manager
      const securityManager = new AnalyticsSecurityManager()
      const encrypted = securityManager.encryptAnalyticsData(originalData)
      const decrypted = securityManager.decryptAnalyticsData(encrypted.encrypted, encrypted.iv, encrypted.tag)
      
      expect(decrypted).toEqual(originalData)
      
      // Process through sync manager
      const syncManager = new AnalyticsDataSyncManager()
      syncManager.setCache('test_key', decrypted, 60000, 'test')
      const cached = syncManager.getCache('test_key')
      
      expect(cached).toEqual(originalData)
    })
  })

  describe('Error Handling and Edge Cases', () => {
    test('should handle malformed analytics responses', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ malformed: 'response' })
      })

      const connector = new MixpanelConnector('test-key', 'test-secret', 'test-project')
      
      await expect(connector.fetchAnalyticsData('2024-01-01', '2024-01-31'))
        .resolves.toBeDefined() // Should not throw, should handle gracefully
    })

    test('should handle network timeouts', async () => {
      global.fetch = jest.fn().mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Network timeout')), 100)
        )
      )

      const connector = new MixpanelConnector('test-key', 'test-secret', 'test-project')
      
      await expect(connector.fetchAnalyticsData('2024-01-01', '2024-01-31'))
        .rejects.toThrow('Failed to fetch Mixpanel data')
    })

    test('should validate date ranges', () => {
      const isValidRange = (start: string, end: string) => {
        const startDate = new Date(start)
        const endDate = new Date(end)
        return startDate < endDate && endDate <= new Date()
      }

      expect(isValidRange('2024-01-01', '2024-01-31')).toBe(true)
      expect(isValidRange('2024-01-31', '2024-01-01')).toBe(false) // Invalid range
      expect(isValidRange('2024-01-01', '2025-12-31')).toBe(false) // Future date
    })
  })
})