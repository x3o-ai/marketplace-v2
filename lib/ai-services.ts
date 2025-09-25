import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import AIMonitoringManager from './ai-monitoring'

// AI Service Configuration
export interface AIServiceConfig {
  provider: 'openai' | 'claude' | 'gemini'
  model: string
  maxTokens: number
  temperature: number
  topP?: number
  frequencyPenalty?: number
  presencePenalty?: number
}

export interface AIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
  metadata?: any
}

export interface AIResponse {
  content: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  model: string
  provider: string
  confidence?: number
  processingTime: number
  metadata?: any
}

export interface AIServiceError {
  type: 'RATE_LIMIT' | 'INVALID_REQUEST' | 'API_ERROR' | 'NETWORK_ERROR' | 'QUOTA_EXCEEDED'
  message: string
  retryAfter?: number
  provider: string
}

// Initialize AI services
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
})

// AI Service Abstraction Layer
export class AIServiceManager {
  private static instance: AIServiceManager
  private requestCount: Map<string, { count: number; lastReset: number }> = new Map()
  private cache: Map<string, { response: AIResponse; expires: number }> = new Map()
  private monitoring: AIMonitoringManager

  private constructor() {
    this.monitoring = AIMonitoringManager.getInstance()
  }

  static getInstance(): AIServiceManager {
    if (!AIServiceManager.instance) {
      AIServiceManager.instance = new AIServiceManager()
    }
    return AIServiceManager.instance
  }

  // Main AI request method with fallback logic
  async generateResponse(
    messages: AIMessage[],
    config: AIServiceConfig,
    agentContext?: any
  ): Promise<AIResponse> {
    const startTime = Date.now()
    
    // Check cache first
    const cacheKey = this.generateCacheKey(messages, config)
    const cached = this.cache.get(cacheKey)
    if (cached && cached.expires > Date.now()) {
      return {
        ...cached.response,
        processingTime: Date.now() - startTime
      }
    }

    // Check rate limits
    await this.checkRateLimit(config.provider)

    try {
      let response: AIResponse

      switch (config.provider) {
        case 'openai':
          response = await this.callOpenAI(messages, config)
          break
        case 'claude':
          response = await this.callClaude(messages, config)
          break
        default:
          throw new Error(`Unsupported AI provider: ${config.provider}`)
      }

      response.processingTime = Date.now() - startTime

      // Cache successful responses
      this.cacheResponse(cacheKey, response)

      // Track usage and costs for monitoring
      await this.monitoring.trackUsage(
        config.provider,
        config.model,
        true, // success
        {
          prompt: response.usage?.promptTokens || 0,
          completion: response.usage?.completionTokens || 0
        },
        response.processingTime
      )

      return response

    } catch (error) {
      console.error('AI service error:', error)
      
      // Track failed request
      await this.monitoring.trackUsage(
        config.provider,
        config.model,
        false, // failed
        { prompt: 0, completion: 0 },
        Date.now() - startTime,
        error instanceof Error ? error.message : 'Unknown error'
      )
      
      // Try fallback provider
      if (config.provider === 'openai') {
        try {
          console.log('Falling back to Claude API...')
          const fallbackConfig = { ...config, provider: 'claude' as const, model: 'claude-3-5-sonnet-20241022' }
          const fallbackResponse = await this.callClaude(messages, fallbackConfig)
          
          // Track successful fallback
          await this.monitoring.trackUsage(
            fallbackConfig.provider,
            fallbackConfig.model,
            true,
            {
              prompt: fallbackResponse.usage?.promptTokens || 0,
              completion: fallbackResponse.usage?.completionTokens || 0
            },
            fallbackResponse.processingTime
          )
          
          return fallbackResponse
        } catch (fallbackError) {
          console.error('Fallback provider also failed:', fallbackError)
        }
      }

      throw this.standardizeError(error, config.provider)
    }
  }

  // OpenAI API integration
  private async callOpenAI(messages: AIMessage[], config: AIServiceConfig): Promise<AIResponse> {
    const completion = await openai.chat.completions.create({
      model: config.model,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content
      })),
      max_tokens: config.maxTokens,
      temperature: config.temperature,
      top_p: config.topP,
      frequency_penalty: config.frequencyPenalty || 0,
      presence_penalty: config.presencePenalty || 0
    })

    const choice = completion.choices[0]
    if (!choice?.message?.content) {
      throw new Error('No response content from OpenAI')
    }

    return {
      content: choice.message.content,
      usage: {
        promptTokens: completion.usage?.prompt_tokens || 0,
        completionTokens: completion.usage?.completion_tokens || 0,
        totalTokens: completion.usage?.total_tokens || 0
      },
      model: config.model,
      provider: 'openai',
      confidence: this.calculateConfidence(choice),
      processingTime: 0,
      metadata: {
        finishReason: choice.finish_reason,
        responseId: completion.id
      }
    }
  }

  // Claude API integration
  private async callClaude(messages: AIMessage[], config: AIServiceConfig): Promise<AIResponse> {
    const systemMessage = messages.find(m => m.role === 'system')?.content || ''
    const conversationMessages = messages.filter(m => m.role !== 'system')

    const completion = await anthropic.messages.create({
      model: config.model,
      max_tokens: config.maxTokens,
      temperature: config.temperature,
      system: systemMessage,
      messages: conversationMessages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      }))
    })

    const content = completion.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude')
    }

    return {
      content: content.text,
      usage: {
        promptTokens: completion.usage.input_tokens,
        completionTokens: completion.usage.output_tokens,
        totalTokens: completion.usage.input_tokens + completion.usage.output_tokens
      },
      model: config.model,
      provider: 'claude',
      confidence: 0.95,
      processingTime: 0,
      metadata: {
        responseId: completion.id,
        stopReason: completion.stop_reason
      }
    }
  }

  // Rate limiting
  private async checkRateLimit(provider: string): Promise<void> {
    const now = Date.now()
    const windowMs = 60 * 1000 // 1 minute window
    const limits = {
      openai: 50, // requests per minute
      claude: 30  // requests per minute
    }

    const key = `${provider}_requests`
    const current = this.requestCount.get(key) || { count: 0, lastReset: now }

    // Reset window if needed
    if (now - current.lastReset > windowMs) {
      current.count = 0
      current.lastReset = now
    }

    // Check limit
    if (current.count >= limits[provider as keyof typeof limits]) {
      throw new Error(`Rate limit exceeded for ${provider}. Please try again in ${Math.ceil((windowMs - (now - current.lastReset)) / 1000)} seconds.`)
    }

    current.count++
    this.requestCount.set(key, current)
  }

  // Utility methods
  private generateCacheKey(messages: AIMessage[], config: AIServiceConfig): string {
    const messagesHash = JSON.stringify(messages)
    const configHash = JSON.stringify(config)
    return Buffer.from(messagesHash + configHash).toString('base64').slice(0, 50)
  }

  private cacheResponse(key: string, response: AIResponse): void {
    const cacheExpiryMs = 10 * 60 * 1000 // 10 minutes
    this.cache.set(key, {
      response,
      expires: Date.now() + cacheExpiryMs
    })
  }

  private calculateConfidence(choice: any): number {
    if (choice.finish_reason === 'stop') return 0.95
    if (choice.finish_reason === 'length') return 0.85
    return 0.75
  }

  private trackUsage(provider: string): void {
    console.log(`AI request completed: ${provider}`)
  }

  private standardizeError(error: any, provider: string): AIServiceError {
    let errorType: AIServiceError['type'] = 'API_ERROR'
    let retryAfter: number | undefined

    if (error.message?.includes('rate limit') || error.status === 429) {
      errorType = 'RATE_LIMIT'
      retryAfter = 60
    } else if (error.status === 400 || error.message?.includes('invalid')) {
      errorType = 'INVALID_REQUEST'
    } else if (error.status === 402 || error.message?.includes('quota')) {
      errorType = 'QUOTA_EXCEEDED'
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      errorType = 'NETWORK_ERROR'
    }

    return {
      type: errorType,
      message: error.message || 'Unknown AI service error',
      retryAfter,
      provider
    }
  }

  clearExpiredCache(): void {
    const now = Date.now()
    for (const [key, value] of this.cache.entries()) {
      if (value.expires <= now) {
        this.cache.delete(key)
      }
    }
  }
}

// Default configurations for each Trinity Agent
export const TRINITY_AGENT_CONFIGS: Record<string, AIServiceConfig> = {
  oracle: {
    provider: 'openai',
    model: 'gpt-4-turbo-preview',
    maxTokens: 1500,
    temperature: 0.3,
    topP: 0.9,
    frequencyPenalty: 0.1,
    presencePenalty: 0.1
  },
  sentinel: {
    provider: 'claude',
    model: 'claude-3-5-sonnet-20241022',
    maxTokens: 1200,
    temperature: 0.2,
    topP: 0.8
  },
  sage: {
    provider: 'openai',
    model: 'gpt-4-turbo-preview',
    maxTokens: 2000,
    temperature: 0.7,
    topP: 0.95,
    frequencyPenalty: 0.2,
    presencePenalty: 0.3
  }
}

export default AIServiceManager