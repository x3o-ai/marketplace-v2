import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'
import AIServiceManager, { TRINITY_AGENT_CONFIGS } from './ai-services'
import { PromptBuilder, ResponseValidator, ORACLE_PROMPTS, SENTINEL_PROMPTS, SAGE_PROMPTS } from './trinity-prompts'
import type { AgentContext } from './trinity-prompts'
import AnalyticsIntegrationManager, { AnalyticsData, MarketingInsight } from './analytics-integration'

export interface TrinityAgentResponse {
  agent: string
  type: string
  data: any
  timestamp: string
  interactionId: string
  trialMetrics?: any
}

export interface TrialAccess {
  userId: string
  status: 'ACTIVE' | 'EXPIRED' | 'SUSPENDED'
  daysRemaining: number
  usage: {
    oracle: number
    sentinel: number
    sage: number
  }
  limits: {
    oracle: number
    sentinel: number
    sage: number
  }
  accessTokens: {
    oracle?: string
    sentinel?: string
    sage?: string
  }
}

// Generate secure access token for Trinity Agent trial
export function generateTrialAccessToken(userId: string, agentType: 'oracle' | 'sentinel' | 'sage'): string {
  const payload = {
    userId,
    agentType,
    type: 'trinity_agent_trial',
    issuedAt: Date.now(),
    expiresAt: Date.now() + (14 * 24 * 60 * 60 * 1000) // 14 days
  }
  
  return jwt.sign(payload, process.env.JWT_SECRET || 'trinity-agent-secret', {
    expiresIn: '14d'
  })
}

// Verify Trinity Agent trial access token
export function verifyTrialAccessToken(token: string): any {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'trinity-agent-secret')
  } catch (error) {
    return null
  }
}

// Get comprehensive trial status for user
export async function getTrialStatus(userId: string): Promise<TrialAccess | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        aiInteractions: {
          where: {
            createdAt: {
              gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) // Last 14 days
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!user || !user.permissions.includes('trinity_agent_trial')) {
      return null
    }

    // Calculate days remaining (trial period: 14 days from user creation)
    const trialStartDate = user.createdAt
    const trialEndDate = new Date(trialStartDate.getTime() + (14 * 24 * 60 * 60 * 1000))
    const daysRemaining = Math.max(0, Math.ceil((trialEndDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000)))
    
    // Calculate usage by agent
    const usage = {
      oracle: user.aiInteractions.filter(i => i.agentId === 'oracle').length,
      sentinel: user.aiInteractions.filter(i => i.agentId === 'sentinel').length,
      sage: user.aiInteractions.filter(i => i.agentId === 'sage').length
    }

    // Set trial limits
    const limits = {
      oracle: parseInt(process.env.TRIAL_ORACLE_LIMIT || '100'),
      sentinel: parseInt(process.env.TRIAL_SENTINEL_LIMIT || '50'),
      sage: parseInt(process.env.TRIAL_SAGE_LIMIT || '200')
    }

    // Generate access tokens
    const accessTokens = {
      oracle: generateTrialAccessToken(userId, 'oracle'),
      sentinel: generateTrialAccessToken(userId, 'sentinel'),
      sage: generateTrialAccessToken(userId, 'sage')
    }

    return {
      userId,
      status: daysRemaining > 0 ? 'ACTIVE' : 'EXPIRED',
      daysRemaining,
      usage,
      limits,
      accessTokens
    }
  } catch (error) {
    console.error('Error getting trial status:', error)
    return null
  }
}

// Enhanced Trinity Agent with Real AI Integration
class TrinityAgentEngine {
  private aiService: AIServiceManager
  
  constructor() {
    this.aiService = AIServiceManager.getInstance()
  }

  // Oracle Analytics - Real AI-powered business intelligence
  async generateOracleResponse(query: string, context: AgentContext): Promise<any> {
    try {
      const promptType = PromptBuilder.detectPromptType('oracle', query)
      const messages = PromptBuilder.buildPrompt('oracle', promptType, query, context)
      const config = TRINITY_AGENT_CONFIGS.oracle

      const aiResponse = await this.aiService.generateResponse(messages, config, context)
      
      // Validate and parse response
      const expectedFormat = ORACLE_PROMPTS[promptType].responseFormat
      const validation = ResponseValidator.validateResponse(aiResponse.content, expectedFormat, 'oracle')
      
      if (!validation.isValid) {
        console.warn('Oracle response validation failed:', validation.errors)
        // Fallback to parsed response or create structured response
        return this.createFallbackOracleResponse(query, aiResponse.content)
      }

      return {
        ...validation.parsedResponse,
        aiMetadata: {
          model: aiResponse.model,
          provider: aiResponse.provider,
          confidence: aiResponse.confidence,
          processingTime: aiResponse.processingTime,
          usage: aiResponse.usage
        }
      }
    } catch (error) {
      console.error('Oracle AI generation failed:', error)
      return this.createFallbackOracleResponse(query, error.message)
    }
  }

  // Sentinel Monitoring - Real AI-powered system analysis
  async generateSentinelResponse(query: string, context: AgentContext): Promise<any> {
    try {
      const promptType = PromptBuilder.detectPromptType('sentinel', query)
      const messages = PromptBuilder.buildPrompt('sentinel', promptType, query, context)
      const config = TRINITY_AGENT_CONFIGS.sentinel

      const aiResponse = await this.aiService.generateResponse(messages, config, context)
      
      const expectedFormat = SENTINEL_PROMPTS[promptType].responseFormat
      const validation = ResponseValidator.validateResponse(aiResponse.content, expectedFormat, 'sentinel')
      
      if (!validation.isValid) {
        console.warn('Sentinel response validation failed:', validation.errors)
        return this.createFallbackSentinelResponse(query, aiResponse.content)
      }

      return {
        ...validation.parsedResponse,
        aiMetadata: {
          model: aiResponse.model,
          provider: aiResponse.provider,
          confidence: aiResponse.confidence,
          processingTime: aiResponse.processingTime,
          usage: aiResponse.usage
        }
      }
    } catch (error) {
      console.error('Sentinel AI generation failed:', error)
      return this.createFallbackSentinelResponse(query, error.message)
    }
  }

  // Sage Optimization - Real AI-powered content generation
  async generateSageResponse(query: string, context: AgentContext): Promise<any> {
    try {
      const promptType = PromptBuilder.detectPromptType('sage', query)
      const messages = PromptBuilder.buildPrompt('sage', promptType, query, context)
      const config = TRINITY_AGENT_CONFIGS.sage

      const aiResponse = await this.aiService.generateResponse(messages, config, context)
      
      const expectedFormat = SAGE_PROMPTS[promptType].responseFormat
      const validation = ResponseValidator.validateResponse(aiResponse.content, expectedFormat, 'sage')
      
      if (!validation.isValid) {
        console.warn('Sage response validation failed:', validation.errors)
        return this.createFallbackSageResponse(query, aiResponse.content)
      }

      return {
        ...validation.parsedResponse,
        aiMetadata: {
          model: aiResponse.model,
          provider: aiResponse.provider,
          confidence: aiResponse.confidence,
          processingTime: aiResponse.processingTime,
          usage: aiResponse.usage
        }
      }
    } catch (error) {
      console.error('Sage AI generation failed:', error)
      return this.createFallbackSageResponse(query, error.message)
    }
  }

  // Fallback responses for error cases
  private createFallbackOracleResponse(query: string, content: string): any {
    return {
      analysis: content.substring(0, 200) + '...',
      confidence: 75,
      insights: ['Analysis completed with limited data', 'Recommend connecting more data sources'],
      recommendations: ['Review data inputs for better accuracy'],
      businessImpact: 'Impact assessment requires additional data',
      riskFactors: ['Limited data availability'],
      fallback: true
    }
  }

  private createFallbackSentinelResponse(query: string, content: string): any {
    return {
      systemHealth: 'Monitoring Active',
      healthScore: 85,
      issues: [{ severity: 'INFO', description: 'AI analysis in progress', recommendation: 'Continue monitoring' }],
      optimizations: ['System monitoring is active'],
      recommendations: ['Check back for detailed analysis'],
      fallback: true
    }
  }

  private createFallbackSageResponse(query: string, content: string): any {
    return {
      content: { body: content.substring(0, 300) + '...' },
      brandAlignment: 80,
      recommendations: ['Content generated successfully'],
      performancePrediction: { engagementRate: 'Analysis pending' },
      fallback: true
    }
  }
}

// Global Trinity Agent engine instance
const trinityEngine = new TrinityAgentEngine()

// Execute Trinity Agent interaction with comprehensive logging
export async function executeTrialInteraction(
  userId: string,
  agentType: 'oracle' | 'sentinel' | 'sage',
  query: string,
  context: any = {}
): Promise<TrinityAgentResponse | null> {
  try {
    // Verify trial access
    const trialStatus = await getTrialStatus(userId)
    if (!trialStatus || trialStatus.status !== 'ACTIVE') {
      throw new Error('Trial access expired or invalid')
    }

    // Check usage limits
    if (trialStatus.usage[agentType] >= trialStatus.limits[agentType]) {
      throw new Error(`${agentType.charAt(0).toUpperCase() + agentType.slice(1)} trial limit reached`)
    }

    // Get agent from database
    const agent = await prisma.aIAgent.findUnique({
      where: { slug: agentType }
    })

    if (!agent) {
      throw new Error(`${agentType} agent not found`)
    }

    // Get user and organization context for AI
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { organization: true }
    })

    // Build enhanced context for AI
    const agentContext: AgentContext = {
      userProfile: {
        name: user?.name,
        role: user?.jobTitle,
        department: user?.department
      },
      organizationData: {
        name: user?.organization?.name,
        industry: user?.organization?.industry,
        size: user?.organization?.size,
        settings: user?.organization?.settings
      },
      previousInteractions: context.previousInteractions || [],
      timeContext: {
        currentDate: new Date().toISOString(),
        timeOfDay: new Date().getHours() > 12 ? 'afternoon' : 'morning',
        quarter: `Q${Math.ceil((new Date().getMonth() + 1) / 3)}`,
        fiscalYear: new Date().getFullYear().toString()
      },
      ...context
    }

    // Generate real AI response using Trinity Engine
    let responseData
    const startTime = Date.now()

    switch (agentType) {
      case 'oracle':
        responseData = await trinityEngine.generateOracleResponse(query, agentContext)
        break
      case 'sentinel':
        responseData = await trinityEngine.generateSentinelResponse(query, agentContext)
        break
      case 'sage':
        responseData = await trinityEngine.generateSageResponse(query, agentContext)
        break
      default:
        throw new Error('Invalid agent type')
    }

    const processingTime = Date.now() - startTime

    // Save interaction to database with AI metadata
    const interaction = await prisma.aIInteraction.create({
      data: {
        userId,
        organizationId: context.organizationId || user?.organizationId,
        agentId: agent.id,
        agentVersion: agent.version,
        query,
        response: JSON.stringify(responseData),
        confidence: responseData.aiMetadata?.confidence || 0.9,
        processingTime,
        context: {
          ...agentContext,
          trialInteraction: true,
          aiProvider: responseData.aiMetadata?.provider,
          aiModel: responseData.aiMetadata?.model
        },
        metadata: {
          aiUsage: responseData.aiMetadata?.usage,
          responseValidation: responseData.fallback ? 'fallback_used' : 'validated',
          processingDetails: {
            promptType: PromptBuilder.detectPromptType(agentType, query),
            responseSize: JSON.stringify(responseData).length
          }
        },
        category: `${agentType}_ai_powered`,
        tags: ['trial', agentType, 'ai_powered', responseData.aiMetadata?.provider || 'unknown'],
        status: 'COMPLETED'
      }
    })

    // Calculate updated trial metrics
    const updatedUsage = await prisma.aIInteraction.count({
      where: {
        userId,
        agentId: agent.id,
        createdAt: {
          gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
        }
      }
    })

    return {
      agent: agent.name,
      type: agentType === 'oracle' ? 'ai_business_intelligence' :
            agentType === 'sentinel' ? 'ai_system_monitoring' : 'ai_content_optimization',
      data: responseData,
      timestamp: interaction.createdAt.toISOString(),
      interactionId: interaction.id,
      trialMetrics: {
        usageCount: updatedUsage,
        limit: trialStatus.limits[agentType],
        remainingInteractions: trialStatus.limits[agentType] - updatedUsage,
        daysRemaining: trialStatus.daysRemaining
      },
      aiMetadata: responseData.aiMetadata
    }
  } catch (error) {
    console.error('Trinity Agent interaction error:', error)
    return null
  }
}

// Create trial access for new users
export async function createTrialAccess(userId: string, agentTypes: ('oracle' | 'sentinel' | 'sage')[]): Promise<TrialAccess | null> {
  try {
    // Update user permissions
    await prisma.user.update({
      where: { id: userId },
      data: {
        permissions: {
          push: 'trinity_agent_trial'
        }
      }
    })

    // Generate welcome interactions for selected agents
    for (const agentType of agentTypes) {
      const agent = await prisma.aIAgent.findUnique({
        where: { slug: agentType }
      })

      if (agent) {
        await prisma.aIInteraction.create({
          data: {
            userId,
            agentId: agent.id,
            query: `Welcome to ${agent.name}! Let's explore what I can do for you.`,
            response: JSON.stringify({
              welcome: `Hello! I'm ${agent.name}, ready to help you with ${
                agentType === 'oracle' ? 'business intelligence and predictive analytics' :
                agentType === 'sentinel' ? 'system monitoring and optimization' :
                'content generation and process automation'
              }. Your 14-day trial starts now!`,
              capabilities: agent.capabilities,
              trialInfo: 'You have full access to all features during your trial period.'
            }),
            confidence: 1.0,
            processingTime: 0,
            category: 'trial_welcome',
            tags: ['welcome', 'trial', agentType],
            status: 'COMPLETED'
          }
        })
      }
    }

    return await getTrialStatus(userId)
  } catch (error) {
    console.error('Error creating trial access:', error)
    return null
  }
}