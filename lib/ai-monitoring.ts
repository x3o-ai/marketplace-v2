import { prisma } from './prisma'

export interface AIServiceMetrics {
  provider: string
  model: string
  requestCount: number
  successCount: number
  errorCount: number
  totalTokens: number
  totalCost: number
  averageLatency: number
  lastRequest: Date
  errorRate: number
}

export interface AIUsageAlert {
  type: 'COST_THRESHOLD' | 'RATE_LIMIT' | 'ERROR_RATE' | 'QUOTA_WARNING'
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  message: string
  provider: string
  threshold: number
  currentValue: number
  timestamp: Date
}

export interface CostOptimization {
  provider: string
  model: string
  currentCost: number
  optimizedCost: number
  savings: number
  recommendations: string[]
}

export class AIMonitoringManager {
  private static instance: AIMonitoringManager
  private metrics: Map<string, AIServiceMetrics> = new Map()
  private costTracking: Map<string, number> = new Map()
  
  // Cost per token by provider/model (in dollars)
  private readonly TOKEN_COSTS = {
    'openai:gpt-4-turbo-preview': {
      input: 0.00001, // $0.01 per 1K tokens
      output: 0.00003 // $0.03 per 1K tokens
    },
    'claude:claude-3-5-sonnet-20241022': {
      input: 0.000003, // $0.003 per 1K tokens
      output: 0.000015 // $0.015 per 1K tokens
    }
  }

  private readonly ALERT_THRESHOLDS = {
    dailyCostLimit: 100, // $100 per day
    hourlyRequestLimit: 1000,
    errorRateThreshold: 0.05, // 5%
    latencyThreshold: 10000 // 10 seconds
  }

  private constructor() {}

  static getInstance(): AIMonitoringManager {
    if (!AIMonitoringManager.instance) {
      AIMonitoringManager.instance = new AIMonitoringManager()
    }
    return AIMonitoringManager.instance
  }

  // Track AI service usage
  async trackUsage(
    provider: string,
    model: string,
    success: boolean,
    tokens: { prompt: number; completion: number },
    latency: number,
    error?: string
  ): Promise<void> {
    const key = `${provider}:${model}`
    const current = this.metrics.get(key) || this.createEmptyMetrics(provider, model)

    // Update metrics
    current.requestCount++
    if (success) {
      current.successCount++
    } else {
      current.errorCount++
    }
    
    current.totalTokens += tokens.prompt + tokens.completion
    current.lastRequest = new Date()
    current.errorRate = current.errorCount / current.requestCount
    current.averageLatency = (current.averageLatency * (current.requestCount - 1) + latency) / current.requestCount

    // Calculate cost
    const cost = this.calculateCost(provider, model, tokens)
    current.totalCost += cost
    this.costTracking.set(key, (this.costTracking.get(key) || 0) + cost)

    this.metrics.set(key, current)

    // Check for alerts
    await this.checkAlerts(current)

    // Log to database for persistent tracking
    await this.logMetrics(current, { success, tokens, latency, error, cost })
  }

  // Calculate cost for AI service usage
  private calculateCost(
    provider: string,
    model: string,
    tokens: { prompt: number; completion: number }
  ): number {
    const key = `${provider}:${model}`
    const costs = this.TOKEN_COSTS[key as keyof typeof this.TOKEN_COSTS]
    
    if (!costs) {
      console.warn(`No cost data for ${key}, using default rates`)
      return (tokens.prompt + tokens.completion) * 0.00002 // Default rate
    }

    return (tokens.prompt * costs.input) + (tokens.completion * costs.output)
  }

  // Check for usage alerts
  private async checkAlerts(metrics: AIServiceMetrics): Promise<void> {
    const alerts: AIUsageAlert[] = []

    // Cost threshold alert
    const dailyCost = this.getDailyCost(metrics.provider, metrics.model)
    if (dailyCost > this.ALERT_THRESHOLDS.dailyCostLimit * 0.8) {
      alerts.push({
        type: 'COST_THRESHOLD',
        severity: dailyCost > this.ALERT_THRESHOLDS.dailyCostLimit ? 'CRITICAL' : 'HIGH',
        message: `Daily cost for ${metrics.provider}:${metrics.model} approaching limit`,
        provider: metrics.provider,
        threshold: this.ALERT_THRESHOLDS.dailyCostLimit,
        currentValue: dailyCost,
        timestamp: new Date()
      })
    }

    // Error rate alert
    if (metrics.errorRate > this.ALERT_THRESHOLDS.errorRateThreshold) {
      alerts.push({
        type: 'ERROR_RATE',
        severity: metrics.errorRate > 0.1 ? 'CRITICAL' : 'HIGH',
        message: `High error rate detected for ${metrics.provider}:${metrics.model}`,
        provider: metrics.provider,
        threshold: this.ALERT_THRESHOLDS.errorRateThreshold,
        currentValue: metrics.errorRate,
        timestamp: new Date()
      })
    }

    // Latency alert
    if (metrics.averageLatency > this.ALERT_THRESHOLDS.latencyThreshold) {
      alerts.push({
        type: 'RATE_LIMIT',
        severity: 'MEDIUM',
        message: `High latency detected for ${metrics.provider}:${metrics.model}`,
        provider: metrics.provider,
        threshold: this.ALERT_THRESHOLDS.latencyThreshold,
        currentValue: metrics.averageLatency,
        timestamp: new Date()
      })
    }

    // Process alerts
    for (const alert of alerts) {
      await this.processAlert(alert)
    }
  }

  // Get cost optimization recommendations
  async getCostOptimizations(): Promise<CostOptimization[]> {
    const optimizations: CostOptimization[] = []

    for (const [key, metrics] of this.metrics.entries()) {
      const [provider, model] = key.split(':')
      const currentCost = this.getDailyCost(provider, model)
      
      // Analyze optimization opportunities
      let optimizedCost = currentCost
      const recommendations: string[] = []

      // Model optimization
      if (provider === 'openai' && model === 'gpt-4-turbo-preview') {
        if (metrics.averageLatency < 2000) {
          optimizedCost *= 0.7 // 30% savings with GPT-3.5
          recommendations.push('Consider using GPT-3.5 Turbo for faster queries to reduce costs by 30%')
        }
      }

      // Caching optimization
      if (metrics.requestCount > 100) {
        optimizedCost *= 0.85 // 15% savings with better caching
        recommendations.push('Implement aggressive caching to reduce redundant requests by 15%')
      }

      // Prompt optimization
      if (metrics.totalTokens / metrics.requestCount > 2000) {
        optimizedCost *= 0.9 // 10% savings with shorter prompts
        recommendations.push('Optimize prompts to reduce average token usage by 10%')
      }

      if (recommendations.length > 0) {
        optimizations.push({
          provider,
          model,
          currentCost,
          optimizedCost,
          savings: currentCost - optimizedCost,
          recommendations
        })
      }
    }

    return optimizations
  }

  // Get current AI service metrics
  getMetrics(): AIServiceMetrics[] {
    return Array.from(this.metrics.values())
  }

  // Get daily cost for provider/model
  private getDailyCost(provider: string, model: string): number {
    const key = `${provider}:${model}`
    return this.costTracking.get(key) || 0
  }

  // Create empty metrics object
  private createEmptyMetrics(provider: string, model: string): AIServiceMetrics {
    return {
      provider,
      model,
      requestCount: 0,
      successCount: 0,
      errorCount: 0,
      totalTokens: 0,
      totalCost: 0,
      averageLatency: 0,
      lastRequest: new Date(),
      errorRate: 0
    }
  }

  // Process alert (send notifications, etc.)
  private async processAlert(alert: AIUsageAlert): Promise<void> {
    console.warn('AI Service Alert:', alert)
    
    // Log alert to database
    try {
      await prisma.systemConfig.upsert({
        where: { key: `ai_alert_${Date.now()}` },
        update: {},
        create: {
          key: `ai_alert_${Date.now()}`,
          value: alert,
          description: `AI service alert: ${alert.type}`,
          category: 'ai_monitoring'
        }
      })
    } catch (error) {
      console.error('Failed to log AI alert:', error)
    }

    // Send notifications based on severity
    if (alert.severity === 'CRITICAL' || alert.severity === 'HIGH') {
      // Would integrate with notification system (email, Slack, etc.)
      console.error(`CRITICAL AI ALERT: ${alert.message}`)
    }
  }

  // Log metrics to database for persistence
  private async logMetrics(
    metrics: AIServiceMetrics,
    requestDetails: {
      success: boolean
      tokens: { prompt: number; completion: number }
      latency: number
      error?: string
      cost: number
    }
  ): Promise<void> {
    try {
      // Store in system config for now (would use dedicated metrics table in production)
      await prisma.systemConfig.upsert({
        where: { key: `ai_metrics_${metrics.provider}_${metrics.model}` },
        update: {
          value: {
            ...metrics,
            lastUpdate: new Date().toISOString(),
            recentRequest: requestDetails
          }
        },
        create: {
          key: `ai_metrics_${metrics.provider}_${metrics.model}`,
          value: {
            ...metrics,
            lastUpdate: new Date().toISOString(),
            recentRequest: requestDetails
          },
          description: `AI service metrics for ${metrics.provider}:${metrics.model}`,
          category: 'ai_metrics'
        }
      })
    } catch (error) {
      console.error('Failed to log AI metrics:', error)
    }
  }

  // Reset daily cost tracking (call at midnight)
  resetDailyCosts(): void {
    this.costTracking.clear()
    console.log('Daily AI cost tracking reset')
  }

  // Get comprehensive usage report
  async getUsageReport(days: number = 7): Promise<{
    summary: {
      totalRequests: number
      totalCost: number
      averageLatency: number
      errorRate: number
    }
    byProvider: Record<string, AIServiceMetrics>
    costBreakdown: Record<string, number>
    optimizations: CostOptimization[]
  }> {
    const metrics = this.getMetrics()
    const optimizations = await this.getCostOptimizations()

    const summary = {
      totalRequests: metrics.reduce((sum, m) => sum + m.requestCount, 0),
      totalCost: metrics.reduce((sum, m) => sum + m.totalCost, 0),
      averageLatency: metrics.reduce((sum, m) => sum + m.averageLatency, 0) / metrics.length,
      errorRate: metrics.reduce((sum, m) => sum + m.errorRate, 0) / metrics.length
    }

    const byProvider: Record<string, AIServiceMetrics> = {}
    const costBreakdown: Record<string, number> = {}

    for (const metric of metrics) {
      const key = `${metric.provider}:${metric.model}`
      byProvider[key] = metric
      costBreakdown[key] = metric.totalCost
    }

    return {
      summary,
      byProvider,
      costBreakdown,
      optimizations
    }
  }
}

export default AIMonitoringManager