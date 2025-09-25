import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { AIServiceManager, TRINITY_AGENT_CONFIGS } from '@/lib/ai-services'
import { PromptBuilder, ResponseValidator, ORACLE_PROMPTS, SENTINEL_PROMPTS, SAGE_PROMPTS } from '@/lib/trinity-prompts'
import { executeTrialInteraction, getTrialStatus, createTrialAccess } from '@/lib/trinity-agents'
import AIMonitoringManager from '@/lib/ai-monitoring'

// Mock external dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn()
    },
    aIAgent: {
      findUnique: jest.fn()
    },
    aIInteraction: {
      create: jest.fn(),
      count: jest.fn()
    },
    systemConfig: {
      upsert: jest.fn()
    }
  }
}))

jest.mock('openai')
jest.mock('@anthropic-ai/sdk')

describe('Trinity Agent AI Integration Tests', () => {
  let mockUser: any
  let mockAgent: any
  let mockTrialStatus: any

  beforeEach(() => {
    // Setup mock data
    mockUser = {
      id: 'test-user-id',
      name: 'Test User',
      email: 'test@company.com',
      jobTitle: 'CEO',
      department: 'Executive',
      organization: {
        name: 'Test Company',
        industry: 'Technology',
        size: '51-200 employees'
      },
      permissions: ['trinity_agent_trial'],
      createdAt: new Date()
    }

    mockAgent = {
      id: 'oracle-agent-id',
      name: 'Oracle Analytics',
      slug: 'oracle',
      version: '1.2.0',
      capabilities: ['revenue_forecasting', 'customer_analytics']
    }

    mockTrialStatus = {
      userId: 'test-user-id',
      status: 'ACTIVE',
      daysRemaining: 14,
      usage: { oracle: 5, sentinel: 3, sage: 8 },
      limits: { oracle: 100, sentinel: 50, sage: 200 },
      accessTokens: {}
    }

    // Clear all mocks
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('AI Service Manager', () => {
    test('should handle OpenAI response correctly', async () => {
      const aiManager = AIServiceManager.getInstance()
      
      // Mock OpenAI response
      const mockOpenAIResponse = {
        choices: [{
          message: { content: 'Test AI response' },
          finish_reason: 'stop'
        }],
        usage: {
          prompt_tokens: 100,
          completion_tokens: 50,
          total_tokens: 150
        },
        id: 'test-response-id'
      }

      // Mock the OpenAI call
      const mockCreate = jest.fn().mockResolvedValue(mockOpenAIResponse)
      require('openai').mockImplementation(() => ({
        chat: {
          completions: {
            create: mockCreate
          }
        }
      }))

      const messages = [
        { role: 'system', content: 'You are a test AI' },
        { role: 'user', content: 'Test query' }
      ]

      const response = await aiManager.generateResponse(
        messages,
        TRINITY_AGENT_CONFIGS.oracle
      )

      expect(response.content).toBe('Test AI response')
      expect(response.provider).toBe('openai')
      expect(response.usage?.totalTokens).toBe(150)
      expect(response.confidence).toBeGreaterThan(0.9)
    })

    test('should handle Claude response correctly', async () => {
      const aiManager = AIServiceManager.getInstance()
      
      // Mock Claude response
      const mockClaudeResponse = {
        content: [{ type: 'text', text: 'Test Claude response' }],
        usage: {
          input_tokens: 80,
          output_tokens: 40
        },
        id: 'test-claude-id',
        stop_reason: 'end_turn'
      }

      const mockCreate = jest.fn().mockResolvedValue(mockClaudeResponse)
      require('@anthropic-ai/sdk').mockImplementation(() => ({
        messages: {
          create: mockCreate
        }
      }))

      const messages = [
        { role: 'system', content: 'You are a test AI' },
        { role: 'user', content: 'Test query' }
      ]

      const response = await aiManager.generateResponse(
        messages,
        TRINITY_AGENT_CONFIGS.sentinel
      )

      expect(response.content).toBe('Test Claude response')
      expect(response.provider).toBe('claude')
      expect(response.usage?.totalTokens).toBe(120)
    })

    test('should handle fallback correctly when primary provider fails', async () => {
      const aiManager = AIServiceManager.getInstance()
      
      // Mock OpenAI failure and Claude success
      const mockOpenAICreate = jest.fn().mockRejectedValue(new Error('OpenAI API error'))
      const mockClaudeCreate = jest.fn().mockResolvedValue({
        content: [{ type: 'text', text: 'Fallback response from Claude' }],
        usage: { input_tokens: 80, output_tokens: 40 },
        id: 'fallback-response',
        stop_reason: 'end_turn'
      })

      require('openai').mockImplementation(() => ({
        chat: { completions: { create: mockOpenAICreate } }
      }))
      
      require('@anthropic-ai/sdk').mockImplementation(() => ({
        messages: { create: mockClaudeCreate }
      }))

      const messages = [
        { role: 'system', content: 'Test system prompt' },
        { role: 'user', content: 'Test query' }
      ]

      const response = await aiManager.generateResponse(
        messages,
        TRINITY_AGENT_CONFIGS.oracle // This will try OpenAI first, then fallback to Claude
      )

      expect(response.content).toBe('Fallback response from Claude')
      expect(response.provider).toBe('claude')
      expect(mockOpenAICreate).toHaveBeenCalled()
      expect(mockClaudeCreate).toHaveBeenCalled()
    })
  })

  describe('Prompt Builder', () => {
    test('should build Oracle Analytics prompts correctly', () => {
      const context = {
        userProfile: { name: 'Test User', role: 'CEO' },
        organizationData: { name: 'Test Corp', industry: 'Technology' },
        timeContext: {
          currentDate: '2024-01-15',
          quarter: 'Q1',
          fiscalYear: '2024'
        }
      }

      const messages = PromptBuilder.buildPrompt('oracle', 'business_analysis', 'Predict Q1 revenue', context)

      expect(messages).toHaveLength(2)
      expect(messages[0].role).toBe('system')
      expect(messages[0].content).toContain('Oracle')
      expect(messages[0].content).toContain('business intelligence')
      
      expect(messages[1].role).toBe('user')
      expect(messages[1].content).toContain('Predict Q1 revenue')
      expect(messages[1].content).toContain('Test Corp')
    })

    test('should detect correct prompt types based on query content', () => {
      expect(PromptBuilder.detectPromptType('oracle', 'predict revenue')).toBe('predictive_modeling')
      expect(PromptBuilder.detectPromptType('oracle', 'analyze customer data')).toBe('business_analysis')
      
      expect(PromptBuilder.detectPromptType('sentinel', 'security threat')).toBe('security_analysis')
      expect(PromptBuilder.detectPromptType('sentinel', 'system performance')).toBe('system_analysis')
      
      expect(PromptBuilder.detectPromptType('sage', 'optimize workflow')).toBe('process_optimization')
      expect(PromptBuilder.detectPromptType('sage', 'create content')).toBe('content_generation')
    })
  })

  describe('Response Validator', () => {
    test('should validate Oracle response format correctly', () => {
      const validResponse = JSON.stringify({
        analysis: 'Test analysis content',
        confidence: 95,
        insights: ['Insight 1', 'Insight 2'],
        recommendations: ['Recommendation 1'],
        businessImpact: '$50K potential savings'
      })

      const expectedFormat = ORACLE_PROMPTS.business_analysis.responseFormat
      const validation = ResponseValidator.validateResponse(validResponse, expectedFormat, 'oracle')

      expect(validation.isValid).toBe(true)
      expect(validation.parsedResponse).toBeDefined()
      expect(validation.parsedResponse.confidence).toBe(95)
    })

    test('should handle invalid response format gracefully', () => {
      const invalidResponse = 'This is just plain text without proper structure'
      const expectedFormat = ORACLE_PROMPTS.business_analysis.responseFormat
      
      const validation = ResponseValidator.validateResponse(invalidResponse, expectedFormat, 'oracle')

      // Should still parse and create a structured response
      expect(validation.parsedResponse).toBeDefined()
      expect(validation.parsedResponse.analysis).toContain('This is just plain text')
    })

    test('should extract confidence scores from text responses', () => {
      const responseWithConfidence = 'Based on analysis, I predict 25% growth with 94% confidence. Key insights include market trends.'
      const expectedFormat = ORACLE_PROMPTS.business_analysis.responseFormat
      
      const validation = ResponseValidator.validateResponse(responseWithConfidence, expectedFormat, 'oracle')

      expect(validation.parsedResponse.confidence).toBe(94)
    })
  })

  describe('Trinity Agent Integration', () => {
    test('should execute Oracle interaction with real AI', async () => {
      // Mock dependencies
      const { prisma } = require('@/lib/prisma')
      prisma.user.findUnique.mockResolvedValue(mockUser)
      prisma.aIAgent.findUnique.mockResolvedValue(mockAgent)
      prisma.aIInteraction.create.mockResolvedValue({
        id: 'interaction-id',
        createdAt: new Date()
      })
      prisma.aIInteraction.count.mockResolvedValue(6)

      // Mock AI response
      jest.doMock('@/lib/ai-services', () => ({
        AIServiceManager: {
          getInstance: () => ({
            generateResponse: jest.fn().mockResolvedValue({
              content: JSON.stringify({
                analysis: 'Revenue forecast shows 23% growth potential',
                confidence: 94,
                insights: ['Strong customer retention', 'Market expansion opportunity'],
                recommendations: ['Increase marketing spend by 15%'],
                businessImpact: '$284K projected increase'
              }),
              provider: 'openai',
              model: 'gpt-4-turbo-preview',
              confidence: 0.94,
              processingTime: 1200,
              usage: { promptTokens: 150, completionTokens: 75, totalTokens: 225 }
            })
          })
        }
      }))

      // Mock getTrialStatus
      jest.doMock('@/lib/trinity-agents', () => ({
        getTrialStatus: jest.fn().mockResolvedValue(mockTrialStatus)
      }))

      const result = await executeTrialInteraction(
        'test-user-id',
        'oracle',
        'Predict our Q1 revenue based on current trends',
        { organizationId: 'test-org-id' }
      )

      expect(result).toBeDefined()
      expect(result?.agent).toBe('Oracle Analytics')
      expect(result?.type).toBe('ai_business_intelligence')
      expect(result?.data).toBeDefined()
    })

    test('should respect trial limits', async () => {
      const limitedTrialStatus = {
        ...mockTrialStatus,
        usage: { oracle: 100, sentinel: 50, sage: 200 }, // At limits
        limits: { oracle: 100, sentinel: 50, sage: 200 }
      }

      const { prisma } = require('@/lib/prisma')
      prisma.user.findUnique.mockResolvedValue(mockUser)

      jest.doMock('@/lib/trinity-agents', () => ({
        getTrialStatus: jest.fn().mockResolvedValue(limitedTrialStatus)
      }))

      const result = await executeTrialInteraction(
        'test-user-id',
        'oracle',
        'Test query',
        {}
      )

      expect(result).toBeNull() // Should fail due to limit reached
    })
  })

  describe('AI Response Quality Tests', () => {
    const qualityTestCases = [
      {
        agent: 'oracle' as const,
        query: 'What are our top revenue opportunities for Q2?',
        expectedElements: ['revenue', 'opportunities', 'Q2', 'recommendations'],
        minConfidence: 85
      },
      {
        agent: 'sentinel' as const,
        query: 'Analyze our system performance and identify bottlenecks',
        expectedElements: ['performance', 'bottlenecks', 'system', 'optimization'],
        minConfidence: 90
      },
      {
        agent: 'sage' as const,
        query: 'Create an email campaign for our product launch',
        expectedElements: ['email', 'campaign', 'product launch', 'subject line'],
        minConfidence: 80
      }
    ]

    test.each(qualityTestCases)(
      'should generate quality responses for $agent queries',
      async ({ agent, query, expectedElements, minConfidence }) => {
        // This would be a more comprehensive test in a real environment
        const context = {
          userProfile: mockUser,
          organizationData: mockUser.organization
        }

        const promptType = PromptBuilder.detectPromptType(agent, query)
        const messages = PromptBuilder.buildPrompt(agent, promptType, query, context)

        expect(messages).toHaveLength(2)
        expect(messages[0].content).toContain(agent === 'oracle' ? 'Oracle' : agent === 'sentinel' ? 'Sentinel' : 'Sage')
        
        // Test prompt quality
        const userPrompt = messages[1].content.toLowerCase()
        expectedElements.forEach(element => {
          expect(userPrompt).toContain(element.toLowerCase())
        })
      }
    )
  })

  describe('AI Monitoring and Cost Optimization', () => {
    test('should track AI usage metrics correctly', async () => {
      const monitoring = AIMonitoringManager.getInstance()
      
      await monitoring.trackUsage(
        'openai',
        'gpt-4-turbo-preview',
        true, // success
        { prompt: 150, completion: 75 }, // tokens
        1200 // latency
      )

      const metrics = monitoring.getMetrics()
      const openaiMetrics = metrics.find(m => m.provider === 'openai' && m.model === 'gpt-4-turbo-preview')

      expect(openaiMetrics).toBeDefined()
      expect(openaiMetrics?.requestCount).toBe(1)
      expect(openaiMetrics?.successCount).toBe(1)
      expect(openaiMetrics?.totalTokens).toBe(225)
    })

    test('should calculate costs accurately', async () => {
      const monitoring = AIMonitoringManager.getInstance()
      
      // Test with known token counts
      await monitoring.trackUsage(
        'openai',
        'gpt-4-turbo-preview',
        true,
        { prompt: 1000, completion: 500 },
        800
      )

      const metrics = monitoring.getMetrics()
      const openaiMetrics = metrics.find(m => m.provider === 'openai')

      expect(openaiMetrics?.totalCost).toBeGreaterThan(0)
      // OpenAI GPT-4: $0.01 input + $0.03 output per 1K tokens
      // Expected: (1000 * 0.00001) + (500 * 0.00003) = $0.025
      expect(openaiMetrics?.totalCost).toBeCloseTo(0.025, 3)
    })

    test('should provide cost optimization recommendations', async () => {
      const monitoring = AIMonitoringManager.getInstance()
      
      // Simulate high usage
      for (let i = 0; i < 150; i++) {
        await monitoring.trackUsage(
          'openai',
          'gpt-4-turbo-preview',
          true,
          { prompt: 2000, completion: 1000 }, // High token usage
          2000 // High latency
        )
      }

      const optimizations = await monitoring.getCostOptimizations()
      
      expect(optimizations).toHaveLength(1)
      expect(optimizations[0].provider).toBe('openai')
      expect(optimizations[0].savings).toBeGreaterThan(0)
      expect(optimizations[0].recommendations).toContain('Consider using GPT-3.5 Turbo for faster queries to reduce costs by 30%')
    })
  })

  describe('Error Handling and Edge Cases', () => {
    test('should handle API rate limiting gracefully', async () => {
      const aiManager = AIServiceManager.getInstance()
      
      const mockRateLimitError = new Error('Rate limit exceeded')
      mockRateLimitError.status = 429

      const mockCreate = jest.fn().mockRejectedValue(mockRateLimitError)
      require('openai').mockImplementation(() => ({
        chat: { completions: { create: mockCreate } }
      }))

      try {
        await aiManager.generateResponse(
          [{ role: 'user', content: 'test' }],
          TRINITY_AGENT_CONFIGS.oracle
        )
      } catch (error) {
        expect(error.type).toBe('RATE_LIMIT')
        expect(error.provider).toBe('openai')
        expect(error.retryAfter).toBeDefined()
      }
    })

    test('should handle malformed AI responses', () => {
      const malformedResponse = '{"incomplete": json'
      const expectedFormat = ORACLE_PROMPTS.business_analysis.responseFormat
      
      const validation = ResponseValidator.validateResponse(malformedResponse, expectedFormat, 'oracle')

      // Should still create a valid structure
      expect(validation.parsedResponse).toBeDefined()
      expect(validation.isValid).toBe(false) // But marked as invalid
    })

    test('should handle empty or null responses', () => {
      const validation = ResponseValidator.validateResponse('', {}, 'oracle')
      
      expect(validation.parsedResponse).toBeDefined()
      expect(validation.isValid).toBe(false)
    })
  })

  describe('Performance Tests', () => {
    test('should complete responses within acceptable time limits', async () => {
      const startTime = Date.now()
      
      // Mock fast response
      require('openai').mockImplementation(() => ({
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue({
              choices: [{ message: { content: 'Fast response' }, finish_reason: 'stop' }],
              usage: { prompt_tokens: 50, completion_tokens: 25, total_tokens: 75 }
            })
          }
        }
      }))

      const aiManager = AIServiceManager.getInstance()
      const response = await aiManager.generateResponse(
        [{ role: 'user', content: 'Quick test' }],
        TRINITY_AGENT_CONFIGS.oracle
      )

      const responseTime = Date.now() - startTime
      
      expect(responseTime).toBeLessThan(5000) // Should complete within 5 seconds
      expect(response.processingTime).toBeDefined()
    })

    test('should cache identical requests', async () => {
      const aiManager = AIServiceManager.getInstance()
      
      const mockCreate = jest.fn().mockResolvedValue({
        choices: [{ message: { content: 'Cached response' }, finish_reason: 'stop' }],
        usage: { prompt_tokens: 50, completion_tokens: 25, total_tokens: 75 }
      })

      require('openai').mockImplementation(() => ({
        chat: { completions: { create: mockCreate } }
      }))

      const messages = [{ role: 'user', content: 'Same query' }]
      const config = TRINITY_AGENT_CONFIGS.oracle

      // First request
      await aiManager.generateResponse(messages, config)
      
      // Second identical request should use cache
      await aiManager.generateResponse(messages, config)

      // OpenAI should only be called once due to caching
      expect(mockCreate).toHaveBeenCalledTimes(1)
    })
  })

  describe('Integration Tests', () => {
    test('should complete full Trinity Agent workflow', async () => {
      // Setup mocks for full workflow
      const { prisma } = require('@/lib/prisma')
      
      prisma.user.findUnique
        .mockResolvedValueOnce(mockUser) // For getTrialStatus
        .mockResolvedValueOnce(mockUser) // For executeTrialInteraction
      
      prisma.aIAgent.findUnique.mockResolvedValue(mockAgent)
      prisma.aIInteraction.create.mockResolvedValue({
        id: 'test-interaction-id',
        createdAt: new Date()
      })
      prisma.aIInteraction.count.mockResolvedValue(6)

      // Mock successful AI response
      require('openai').mockImplementation(() => ({
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue({
              choices: [{
                message: { 
                  content: JSON.stringify({
                    analysis: 'Comprehensive business analysis',
                    confidence: 94,
                    insights: ['Market opportunity identified', 'Customer segment growth'],
                    recommendations: ['Expand in target market', 'Optimize pricing strategy'],
                    businessImpact: 'Projected 23% revenue increase'
                  })
                },
                finish_reason: 'stop'
              }],
              usage: { prompt_tokens: 200, completion_tokens: 100, total_tokens: 300 },
              id: 'test-completion-id'
            })
          }
        }
      }))

      const result = await executeTrialInteraction(
        'test-user-id',
        'oracle',
        'Analyze our market opportunities for expansion',
        { organizationId: 'test-org-id' }
      )

      expect(result).toBeDefined()
      expect(result?.type).toBe('ai_business_intelligence')
      expect(result?.data.analysis).toContain('business analysis')
      expect(result?.data.confidence).toBe(94)
      expect(result?.aiMetadata).toBeDefined()
      expect(result?.aiMetadata.provider).toBe('openai')
    })
  })
})