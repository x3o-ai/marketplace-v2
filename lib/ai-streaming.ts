import { AIServiceManager, AIMessage, AIServiceConfig } from './ai-services'
import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'

export interface StreamingResponse {
  id: string
  agent: string
  type: 'partial' | 'complete' | 'error'
  content: string
  metadata?: any
  timestamp: string
}

export interface StreamingContext {
  userId: string
  agentType: 'oracle' | 'sentinel' | 'sage'
  sessionId: string
  interactionId?: string
}

export class AIStreamingManager {
  private openai: OpenAI
  private anthropic: Anthropic
  private activeStreams: Map<string, AbortController> = new Map()

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    })
  }

  // Create streaming response for Trinity Agents
  async* streamTrinityResponse(
    messages: AIMessage[],
    config: AIServiceConfig,
    context: StreamingContext
  ): AsyncGenerator<StreamingResponse, void, unknown> {
    const streamId = `${context.agentType}_${context.sessionId}_${Date.now()}`
    const abortController = new AbortController()
    this.activeStreams.set(streamId, abortController)

    try {
      yield {
        id: streamId,
        agent: context.agentType,
        type: 'partial',
        content: '',
        metadata: { status: 'started', provider: config.provider },
        timestamp: new Date().toISOString()
      }

      if (config.provider === 'openai') {
        yield* this.streamOpenAI(messages, config, streamId, context, abortController.signal)
      } else if (config.provider === 'claude') {
        yield* this.streamClaude(messages, config, streamId, context, abortController.signal)
      } else {
        throw new Error(`Streaming not supported for provider: ${config.provider}`)
      }

    } catch (error) {
      console.error('Streaming error:', error)
      
      yield {
        id: streamId,
        agent: context.agentType,
        type: 'error',
        content: error.message || 'Streaming failed',
        metadata: { error: true },
        timestamp: new Date().toISOString()
      }
    } finally {
      this.activeStreams.delete(streamId)
    }
  }

  // OpenAI streaming implementation
  private async* streamOpenAI(
    messages: AIMessage[],
    config: AIServiceConfig,
    streamId: string,
    context: StreamingContext,
    signal: AbortSignal
  ): AsyncGenerator<StreamingResponse, void, unknown> {
    const stream = await this.openai.chat.completions.create({
      model: config.model,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content
      })),
      max_tokens: config.maxTokens,
      temperature: config.temperature,
      top_p: config.topP,
      frequency_penalty: config.frequencyPenalty || 0,
      presence_penalty: config.presencePenalty || 0,
      stream: true
    })

    let fullContent = ''
    let tokenCount = 0

    for await (const chunk of stream) {
      if (signal.aborted) {
        break
      }

      const delta = chunk.choices[0]?.delta
      if (delta?.content) {
        fullContent += delta.content
        tokenCount++

        yield {
          id: streamId,
          agent: context.agentType,
          type: 'partial',
          content: fullContent,
          metadata: { 
            tokens: tokenCount,
            provider: 'openai',
            model: config.model,
            finishReason: chunk.choices[0]?.finish_reason
          },
          timestamp: new Date().toISOString()
        }
      }

      // Check for completion
      if (chunk.choices[0]?.finish_reason) {
        yield {
          id: streamId,
          agent: context.agentType,
          type: 'complete',
          content: fullContent,
          metadata: {
            tokens: tokenCount,
            provider: 'openai',
            model: config.model,
            finishReason: chunk.choices[0].finish_reason,
            completed: true
          },
          timestamp: new Date().toISOString()
        }
        break
      }
    }
  }

  // Claude streaming implementation  
  private async* streamClaude(
    messages: AIMessage[],
    config: AIServiceConfig,
    streamId: string,
    context: StreamingContext,
    signal: AbortSignal
  ): AsyncGenerator<StreamingResponse, void, unknown> {
    const systemMessage = messages.find(m => m.role === 'system')?.content || ''
    const conversationMessages = messages.filter(m => m.role !== 'system')

    const stream = await this.anthropic.messages.create({
      model: config.model,
      max_tokens: config.maxTokens,
      temperature: config.temperature,
      system: systemMessage,
      messages: conversationMessages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      })),
      stream: true
    })

    let fullContent = ''
    let tokenCount = 0

    for await (const chunk of stream) {
      if (signal.aborted) {
        break
      }

      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        fullContent += chunk.delta.text
        tokenCount++

        yield {
          id: streamId,
          agent: context.agentType,
          type: 'partial',
          content: fullContent,
          metadata: {
            tokens: tokenCount,
            provider: 'claude',
            model: config.model
          },
          timestamp: new Date().toISOString()
        }
      }

      if (chunk.type === 'message_stop') {
        yield {
          id: streamId,
          agent: context.agentType,
          type: 'complete',
          content: fullContent,
          metadata: {
            tokens: tokenCount,
            provider: 'claude',
            model: config.model,
            completed: true
          },
          timestamp: new Date().toISOString()
        }
        break
      }
    }
  }

  // Cancel streaming
  cancelStream(streamId: string): boolean {
    const controller = this.activeStreams.get(streamId)
    if (controller) {
      controller.abort()
      this.activeStreams.delete(streamId)
      return true
    }
    return false
  }

  // Get active streams
  getActiveStreams(): string[] {
    return Array.from(this.activeStreams.keys())
  }

  // Cleanup expired streams
  cleanupStreams(): void {
    // This would run periodically to clean up abandoned streams
    for (const [streamId, controller] of this.activeStreams.entries()) {
      // Check if stream is older than 5 minutes
      const streamTimestamp = parseInt(streamId.split('_').pop() || '0')
      if (Date.now() - streamTimestamp > 5 * 60 * 1000) {
        controller.abort()
        this.activeStreams.delete(streamId)
      }
    }
  }
}

// Utility function to create streaming response iterator
export async function* streamTrinityAgentResponse(
  agentType: 'oracle' | 'sentinel' | 'sage',
  query: string,
  context: any,
  userId: string,
  sessionId: string
): AsyncGenerator<StreamingResponse, void, unknown> {
  const streamingManager = new AIStreamingManager()
  
  // Import dependencies dynamically to avoid circular imports
  const { PromptBuilder } = await import('./trinity-prompts')
  const { TRINITY_AGENT_CONFIGS } = await import('./ai-services')
  
  try {
    // Build context and prompts
    const promptType = PromptBuilder.detectPromptType(agentType, query)
    const messages = PromptBuilder.buildPrompt(agentType, promptType, query, context)
    const config = TRINITY_AGENT_CONFIGS[agentType]

    const streamingContext: StreamingContext = {
      userId,
      agentType,
      sessionId
    }

    // Stream the response
    yield* streamingManager.streamTrinityResponse(messages, config, streamingContext)

  } catch (error) {
    console.error('Trinity Agent streaming error:', error)
    
    yield {
      id: `error_${Date.now()}`,
      agent: agentType,
      type: 'error',
      content: error.message || 'Streaming failed',
      metadata: { error: true },
      timestamp: new Date().toISOString()
    }
  }
}

export default AIStreamingManager