import { prisma } from './prisma'
import AnalyticsIntegrationManager, { AnalyticsData, AnalyticsProvider } from './analytics-integration'

export interface SyncJob {
  id: string
  organizationId: string
  providerId: string
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED'
  startedAt: Date
  completedAt?: Date
  recordsProcessed: number
  recordsUpdated: number
  error?: string
  nextRun?: Date
}

export interface CacheEntry {
  key: string
  data: any
  expires: number
  lastAccessed: number
  hitCount: number
  source: string
}

export class AnalyticsDataSyncManager {
  private cache: Map<string, CacheEntry> = new Map()
  private syncQueue: Map<string, SyncJob> = new Map()
  private readonly CACHE_TTL = {
    realtime: 5 * 60 * 1000,      // 5 minutes
    hourly: 60 * 60 * 1000,       // 1 hour  
    daily: 24 * 60 * 60 * 1000    // 24 hours
  }

  // Schedule analytics data synchronization
  async scheduleSync(
    organizationId: string,
    providers: AnalyticsProvider[],
    frequency: 'realtime' | 'hourly' | 'daily' = 'hourly'
  ): Promise<string[]> {
    const jobIds: string[] = []

    for (const provider of providers) {
      const jobId = `sync_${organizationId}_${provider.type}_${Date.now()}`
      
      const syncJob: SyncJob = {
        id: jobId,
        organizationId,
        providerId: provider.type,
        status: 'PENDING',
        startedAt: new Date(),
        recordsProcessed: 0,
        recordsUpdated: 0,
        nextRun: this.calculateNextRun(frequency)
      }

      this.syncQueue.set(jobId, syncJob)
      jobIds.push(jobId)

      // Execute sync immediately for realtime, schedule for others
      if (frequency === 'realtime') {
        this.executeSyncJob(jobId)
      } else {
        this.scheduleSyncJob(jobId, frequency)
      }
    }

    return jobIds
  }

  // Execute analytics data synchronization
  async executeSyncJob(jobId: string): Promise<void> {
    const job = this.syncQueue.get(jobId)
    if (!job) {
      throw new Error(`Sync job not found: ${jobId}`)
    }

    try {
      job.status = 'RUNNING'
      
      const analyticsManager = new AnalyticsIntegrationManager()
      
      // Determine sync time range based on last sync
      const lastSync = await this.getLastSyncTime(job.organizationId, job.providerId)
      const endDate = new Date().toISOString().split('T')[0]
      const startDate = lastSync 
        ? lastSync.toISOString().split('T')[0]
        : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // Default to 7 days

      // Fetch fresh analytics data
      const analyticsData = await analyticsManager.getAnalyticsData(
        job.organizationId,
        startDate,
        endDate,
        true // Force refresh
      )

      let recordsProcessed = 0
      let recordsUpdated = 0

      // Process and cache each data source
      for (const data of analyticsData) {
        if (data.source === job.providerId) {
          // Store in cache with appropriate TTL
          const cacheKey = this.generateCacheKey(job.organizationId, job.providerId, startDate, endDate)
          
          this.setCache(cacheKey, data, this.CACHE_TTL.hourly, job.providerId)
          
          // Store in database for persistence
          await this.persistAnalyticsData(job.organizationId, data)
          
          recordsProcessed++
          recordsUpdated++
        }
      }

      // Update job status
      job.status = 'COMPLETED'
      job.completedAt = new Date()
      job.recordsProcessed = recordsProcessed
      job.recordsUpdated = recordsUpdated

      // Log successful sync
      await this.logSyncResult(job)

      console.log(`Analytics sync completed for ${job.organizationId}:${job.providerId} - ${recordsUpdated} records updated`)

    } catch (error) {
      console.error(`Analytics sync failed for job ${jobId}:`, error)
      
      job.status = 'FAILED'
      job.error = error instanceof Error ? error.message : 'Sync failed'
      job.completedAt = new Date()

      await this.logSyncResult(job)
    }
  }

  // Intelligent cache management
  setCache(key: string, data: any, ttl: number, source: string): void {
    const entry: CacheEntry = {
      key,
      data,
      expires: Date.now() + ttl,
      lastAccessed: Date.now(),
      hitCount: 0,
      source
    }

    this.cache.set(key, entry)
    
    // Cleanup expired entries
    this.cleanupExpiredCache()
  }

  getCache(key: string): any | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return null
    }

    // Check if expired
    if (Date.now() > entry.expires) {
      this.cache.delete(key)
      return null
    }

    // Update access stats
    entry.lastAccessed = Date.now()
    entry.hitCount++
    
    return entry.data
  }

  // Intelligent cache cleanup
  private cleanupExpiredCache(): void {
    const now = Date.now()
    let cleanedCount = 0

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expires) {
        this.cache.delete(key)
        cleanedCount++
      }
    }

    if (cleanedCount > 0) {
      console.log(`Cleaned up ${cleanedCount} expired cache entries`)
    }

    // If cache is getting large, remove least recently used entries
    if (this.cache.size > 1000) {
      const entries = Array.from(this.cache.entries())
        .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed)
      
      // Remove bottom 20%
      const toRemove = Math.floor(entries.length * 0.2)
      for (let i = 0; i < toRemove; i++) {
        this.cache.delete(entries[i][0])
      }

      console.log(`Removed ${toRemove} LRU cache entries`)
    }
  }

  // Generate cache key
  private generateCacheKey(organizationId: string, providerId: string, startDate: string, endDate: string): string {
    return `analytics_${organizationId}_${providerId}_${startDate}_${endDate}`
  }

  // Get cached or fresh analytics data
  async getCachedAnalyticsData(
    organizationId: string,
    startDate: string,
    endDate: string,
    forceRefresh = false
  ): Promise<AnalyticsData[]> {
    const results: AnalyticsData[] = []
    
    // Get organization's connected providers
    const providers = await this.getConnectedProviders(organizationId)
    
    for (const provider of providers) {
      const cacheKey = this.generateCacheKey(organizationId, provider, startDate, endDate)
      
      if (!forceRefresh) {
        const cachedData = this.getCache(cacheKey)
        if (cachedData) {
          results.push(cachedData)
          continue
        }
      }

      // Fetch fresh data if not cached or force refresh
      try {
        const analyticsManager = new AnalyticsIntegrationManager()
        const freshData = await analyticsManager.getAnalyticsData(organizationId, startDate, endDate, true)
        
        // Cache the fresh data
        freshData.forEach(data => {
          if (data.source === provider) {
            this.setCache(cacheKey, data, this.CACHE_TTL.hourly, provider)
            results.push(data)
          }
        })
      } catch (error) {
        console.error(`Failed to fetch data for ${provider}:`, error)
      }
    }

    return results
  }

  // Persist analytics data to database
  private async persistAnalyticsData(organizationId: string, data: AnalyticsData): Promise<void> {
    try {
      // Store analytics snapshot in system config
      await prisma.systemConfig.upsert({
        where: { key: `analytics_snapshot_${organizationId}_${data.source}_${Date.now()}` },
        update: {},
        create: {
          key: `analytics_snapshot_${organizationId}_${data.source}_${Date.now()}`,
          value: {
            ...data,
            organizationId,
            persistedAt: new Date().toISOString()
          },
          description: `Analytics data snapshot from ${data.source}`,
          category: 'analytics_data'
        }
      })

      // Create business metrics from analytics data
      await this.createBusinessMetricsFromAnalytics(organizationId, data)

    } catch (error) {
      console.error('Failed to persist analytics data:', error)
    }
  }

  // Create business metrics from analytics data
  private async createBusinessMetricsFromAnalytics(organizationId: string, data: AnalyticsData): Promise<void> {
    const metrics = [
      {
        name: 'Website Sessions',
        category: 'MARKETING',
        type: 'COUNTER',
        currentValue: data.metrics.sessions,
        source: 'API',
        sourceConfig: { provider: data.source }
      },
      {
        name: 'Conversion Rate',
        category: 'MARKETING', 
        type: 'PERCENTAGE',
        currentValue: data.metrics.conversionRate,
        source: 'API',
        sourceConfig: { provider: data.source }
      },
      {
        name: 'Website Revenue',
        category: 'REVENUE',
        type: 'CURRENCY',
        currentValue: data.metrics.revenue || 0,
        source: 'API',
        sourceConfig: { provider: data.source }
      }
    ]

    // Find a user to associate with metrics (use first admin user)
    const adminUser = await prisma.user.findFirst({
      where: { 
        organizationId,
        role: { in: ['ORG_ADMIN', 'SUPER_ADMIN'] }
      }
    })

    if (!adminUser) return

    // Create or update business metrics
    for (const metric of metrics) {
      await prisma.businessMetric.upsert({
        where: {
          organizationId_name: {
            organizationId,
            name: metric.name
          }
        },
        update: {
          currentValue: metric.currentValue,
          lastUpdated: new Date()
        },
        create: {
          organizationId,
          createdBy: adminUser.id,
          name: metric.name,
          category: metric.category as any,
          type: metric.type as any,
          currentValue: metric.currentValue,
          source: metric.source as any,
          sourceConfig: metric.sourceConfig,
          frequency: 'HOURLY',
          status: 'ACTIVE'
        }
      })
    }
  }

  // Helper methods
  private calculateNextRun(frequency: string): Date {
    const now = new Date()
    switch (frequency) {
      case 'hourly':
        return new Date(now.getTime() + 60 * 60 * 1000)
      case 'daily':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000)
      default:
        return new Date(now.getTime() + 60 * 60 * 1000)
    }
  }

  private scheduleSyncJob(jobId: string, frequency: string): void {
    const job = this.syncQueue.get(jobId)
    if (!job) return

    const delay = frequency === 'hourly' ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000
    
    setTimeout(() => {
      this.executeSyncJob(jobId)
    }, delay)
  }

  private async getLastSyncTime(organizationId: string, providerId: string): Promise<Date | null> {
    try {
      const lastSync = await prisma.systemConfig.findFirst({
        where: {
          key: { startsWith: `analytics_snapshot_${organizationId}_${providerId}` },
          category: 'analytics_data'
        },
        orderBy: { createdAt: 'desc' }
      })

      return lastSync ? lastSync.createdAt : null
    } catch {
      return null
    }
  }

  private async getConnectedProviders(organizationId: string): Promise<string[]> {
    try {
      const providerConfigs = await prisma.systemConfig.findMany({
        where: {
          key: { startsWith: `analytics_provider_${organizationId}` },
          category: 'analytics_integration'
        }
      })

      return providerConfigs
        .filter(config => (config.value as any).isConnected)
        .map(config => (config.value as any).type)
    } catch {
      return []
    }
  }

  private async logSyncResult(job: SyncJob): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          organizationId: job.organizationId,
          action: 'ANALYTICS_SYNC',
          resource: 'analytics_data',
          resourceId: job.id,
          metadata: {
            providerId: job.providerId,
            status: job.status,
            recordsProcessed: job.recordsProcessed,
            recordsUpdated: job.recordsUpdated,
            error: job.error,
            duration: job.completedAt 
              ? job.completedAt.getTime() - job.startedAt.getTime()
              : null
          }
        }
      })
    } catch (error) {
      console.error('Failed to log sync result:', error)
    }
  }

  // Get cache statistics
  getCacheStats(): {
    totalEntries: number
    totalSize: number
    hitRate: number
    expiredEntries: number
    topSources: Array<{ source: string; entries: number }>
  } {
    const now = Date.now()
    let totalHits = 0
    let totalAccesses = 0
    let expiredCount = 0
    const sourceCount: Record<string, number> = {}

    for (const entry of this.cache.values()) {
      totalHits += entry.hitCount
      totalAccesses += entry.hitCount + 1 // +1 for initial set
      
      if (now > entry.expires) {
        expiredCount++
      }

      sourceCount[entry.source] = (sourceCount[entry.source] || 0) + 1
    }

    const topSources = Object.entries(sourceCount)
      .map(([source, entries]) => ({ source, entries }))
      .sort((a, b) => b.entries - a.entries)
      .slice(0, 5)

    return {
      totalEntries: this.cache.size,
      totalSize: JSON.stringify(Array.from(this.cache.values())).length,
      hitRate: totalAccesses > 0 ? (totalHits / totalAccesses) * 100 : 0,
      expiredEntries: expiredCount,
      topSources
    }
  }

  // Manual cache operations
  clearCache(pattern?: string): number {
    let clearedCount = 0
    
    if (pattern) {
      for (const [key, entry] of this.cache.entries()) {
        if (key.includes(pattern)) {
          this.cache.delete(key)
          clearedCount++
        }
      }
    } else {
      clearedCount = this.cache.size
      this.cache.clear()
    }

    return clearedCount
  }

  // Get sync job status
  getSyncJobStatus(jobId: string): SyncJob | null {
    return this.syncQueue.get(jobId) || null
  }

  // Get all sync jobs for organization
  getOrganizationSyncJobs(organizationId: string): SyncJob[] {
    return Array.from(this.syncQueue.values())
      .filter(job => job.organizationId === organizationId)
      .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())
  }
}

// Background service for analytics synchronization
export class AnalyticsSyncService {
  private syncManager: AnalyticsDataSyncManager
  private isRunning = false

  constructor() {
    this.syncManager = new AnalyticsDataSyncManager()
  }

  // Start background sync service
  async start(): Promise<void> {
    if (this.isRunning) {
      console.warn('Analytics sync service already running')
      return
    }

    this.isRunning = true
    console.log('Starting analytics sync service...')

    // Schedule regular cleanup
    setInterval(() => {
      this.syncManager.cleanupExpiredCache()
    }, 30 * 60 * 1000) // Every 30 minutes

    // Schedule hourly syncs for all organizations
    setInterval(async () => {
      await this.syncAllOrganizations()
    }, 60 * 60 * 1000) // Every hour

    console.log('Analytics sync service started')
  }

  // Stop background sync service
  stop(): void {
    this.isRunning = false
    console.log('Analytics sync service stopped')
  }

  // Sync analytics data for all organizations
  private async syncAllOrganizations(): Promise<void> {
    try {
      // Get all organizations with analytics integrations
      const organizations = await prisma.organization.findMany({
        where: {
          // Only sync for organizations with active analytics integrations
          settings: {
            path: ['features'],
            array_contains: ['analytics_integration']
          }
        }
      })

      console.log(`Starting scheduled sync for ${organizations.length} organizations`)

      for (const org of organizations) {
        try {
          // Get connected providers for this organization
          const providers = await this.getOrganizationProviders(org.id)
          
          if (providers.length > 0) {
            await this.syncManager.scheduleSync(org.id, providers, 'hourly')
          }
        } catch (error) {
          console.error(`Failed to sync organization ${org.id}:`, error)
        }
      }
    } catch (error) {
      console.error('Failed to sync all organizations:', error)
    }
  }

  // Get analytics providers for organization
  private async getOrganizationProviders(organizationId: string): Promise<AnalyticsProvider[]> {
    try {
      const providerConfigs = await prisma.systemConfig.findMany({
        where: {
          key: { startsWith: `analytics_provider_${organizationId}` },
          category: 'analytics_integration'
        }
      })

      return providerConfigs
        .map(config => config.value as AnalyticsProvider)
        .filter(provider => provider.isConnected)
    } catch {
      return []
    }
  }
}

export default AnalyticsDataSyncManager