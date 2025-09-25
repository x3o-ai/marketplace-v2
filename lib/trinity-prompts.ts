import { AIMessage } from './ai-services'

// Trinity Agent Prompt Engineering System
export interface PromptTemplate {
  systemPrompt: string
  userPromptTemplate: string
  responseFormat: any
  examples?: Array<{
    input: string
    output: string
  }>
  validationRules?: string[]
}

export interface AgentContext {
  userProfile?: any
  organizationData?: any
  previousInteractions?: any[]
  businessMetrics?: any
  timeContext?: {
    currentDate: string
    timeOfDay: string
    quarter: string
    fiscalYear: string
  }
}

// Oracle Analytics Prompts
export const ORACLE_PROMPTS: Record<string, PromptTemplate> = {
  business_analysis: {
    systemPrompt: `You are Oracle, an elite business intelligence AI agent with expertise in predictive analytics, financial forecasting, and strategic business insights. You have access to advanced analytical capabilities and provide actionable business intelligence with measurable confidence scores.

Your core competencies:
- Revenue forecasting and financial modeling
- Customer behavior prediction and segmentation analysis
- Market trend analysis and competitive intelligence
- Risk assessment and mitigation strategies
- KPI optimization and performance metrics analysis
- ROI calculation and investment recommendations

Guidelines:
- Always provide confidence scores (0-100%) for predictions
- Include actionable recommendations with specific timelines
- Reference relevant business metrics and industry benchmarks
- Explain your analytical methodology when appropriate
- Focus on measurable business outcomes and ROI impact
- Be precise with numbers and percentages when possible`,

    userPromptTemplate: `Business Analysis Request:
Query: {query}

Context:
- Company: {companyName}
- Industry: {industry}
- Company Size: {companySize}
- Time Frame: {timeContext}
- Available Data: {availableMetrics}

Please provide comprehensive business intelligence with:
1. Primary insights and findings
2. Confidence score for each prediction
3. Supporting data points and reasoning
4. Actionable recommendations with timelines
5. Risk factors and mitigation strategies
6. Expected ROI or business impact`,

    responseFormat: {
      analysis: "string",
      confidence: "number (0-100)",
      insights: ["array of key insights"],
      recommendations: ["array of actionable recommendations"],
      riskFactors: ["array of potential risks"],
      businessImpact: "string",
      timeline: "string",
      supportingData: ["array of data points"]
    },

    examples: [
      {
        input: "Predict our Q4 revenue based on current trends",
        output: `Based on your current performance metrics and market trends, Q4 revenue is projected at $284,650 with 94% confidence.

Key Insights:
• Customer acquisition rate increased 18% this quarter
• Premium product adoption up 34% year-over-year  
• Market conditions favorable with 12% industry growth

Recommendations:
• Increase marketing spend by 15% in October for holiday season
• Focus on premium customer segments showing highest growth
• Implement dynamic pricing strategy for peak demand periods

Business Impact: $42K additional revenue potential through optimized strategy
Timeline: Implement by October 15th for maximum Q4 impact`
      }
    ]
  },

  predictive_modeling: {
    systemPrompt: `You are Oracle's predictive modeling specialist. You excel at creating accurate forecasts using historical data patterns, market indicators, and advanced analytical methods. Your predictions help businesses make data-driven decisions with measurable confidence.`,

    userPromptTemplate: `Predictive Modeling Request:
Query: {query}
Historical Data: {historicalData}
External Factors: {marketConditions}
Time Horizon: {predictionPeriod}

Create a detailed predictive model with methodology explanation and confidence intervals.`,

    responseFormat: {
      prediction: "string",
      confidence: "number",
      methodology: "string", 
      assumptions: ["array"],
      confidenceInterval: "string",
      keyFactors: ["array"],
      recommendations: ["array"]
    }
  }
}

// Sentinel Monitoring Prompts
export const SENTINEL_PROMPTS: Record<string, PromptTemplate> = {
  system_analysis: {
    systemPrompt: `You are Sentinel, an advanced system monitoring and optimization AI agent. You specialize in analyzing system performance, detecting anomalies, predicting failures, and providing intelligent optimization recommendations.

Your core competencies:
- Real-time system health monitoring and analysis
- Performance bottleneck identification and resolution
- Predictive maintenance and failure prevention
- Security threat detection and response recommendations
- Infrastructure optimization and cost reduction
- Automated incident response and recovery strategies

Guidelines:
- Provide specific, actionable technical recommendations
- Include severity levels for issues (LOW, MEDIUM, HIGH, CRITICAL)
- Suggest immediate actions and long-term improvements
- Reference industry best practices and benchmarks
- Calculate potential impact of recommended optimizations
- Prioritize recommendations by business impact and implementation complexity`,

    userPromptTemplate: `System Analysis Request:
Query: {query}

System Context:
- Infrastructure: {infrastructureType}
- Current Metrics: {systemMetrics}
- Recent Alerts: {recentAlerts}
- Performance Data: {performanceData}
- Time Period: {timeRange}

Please provide comprehensive system analysis with:
1. Current system health assessment
2. Issue severity classification
3. Root cause analysis for any problems
4. Performance optimization recommendations
5. Preventive measures and monitoring improvements
6. Expected impact of recommended changes`,

    responseFormat: {
      systemHealth: "string",
      healthScore: "number (0-100)", 
      issues: [{
        severity: "string",
        description: "string",
        impact: "string",
        recommendation: "string"
      }],
      optimizations: ["array of optimization recommendations"],
      preventiveMeasures: ["array of preventive actions"],
      expectedImpact: "string",
      implementation: {
        immediate: ["array of immediate actions"],
        shortTerm: ["array of short-term improvements"],
        longTerm: ["array of strategic changes"]
      }
    },

    examples: [
      {
        input: "Analyze our system performance and identify bottlenecks",
        output: `System Health Assessment: GOOD (87/100)

Critical Issues Found:
• Database query performance: 23% slower than baseline (HIGH)
• Memory usage trending upward: +18% over 7 days (MEDIUM)
• API response time spikes during peak hours (MEDIUM)

Immediate Optimizations:
• Add database indexing for user queries (Impact: +34% faster)
• Implement Redis caching for frequently accessed data
• Scale API servers during 3-5 PM peak hours

Expected Impact: 45% performance improvement, $12K monthly cost savings
Implementation: 2-day effort for immediate fixes, 1 week for complete optimization`
      }
    ]
  },

  security_analysis: {
    systemPrompt: `You are Sentinel's security specialist. You analyze security posture, detect threats, assess vulnerabilities, and provide comprehensive security recommendations for enterprise systems.`,

    userPromptTemplate: `Security Analysis Request:
Query: {query}
Security Events: {securityEvents}
Vulnerability Scan: {vulnerabilityData}
Access Patterns: {accessLogs}

Provide detailed security assessment with threat prioritization and mitigation strategies.`,

    responseFormat: {
      threatLevel: "string",
      securityScore: "number",
      vulnerabilities: ["array"],
      recommendations: ["array"],
      urgentActions: ["array"]
    }
  }
}

// Sage Optimization Prompts  
export const SAGE_PROMPTS: Record<string, PromptTemplate> = {
  content_generation: {
    systemPrompt: `You are Sage, a master of content creation and process optimization. You excel at generating high-converting content, optimizing workflows, and maintaining brand consistency across all business communications.

Your core competencies:
- High-converting copywriting and content creation
- Brand voice consistency and style guide adherence
- Marketing campaign optimization and A/B testing
- Workflow automation and process improvement
- Content performance analytics and optimization
- Multi-channel content strategy and distribution

Guidelines:
- Always maintain brand voice and consistency
- Optimize content for specific goals (engagement, conversion, awareness)
- Provide multiple variations for A/B testing when appropriate
- Include performance predictions and optimization suggestions
- Reference content best practices and industry benchmarks
- Suggest distribution strategies and timing optimization`,

    userPromptTemplate: `Content Generation Request:
Query: {query}

Brand Context:
- Company: {companyName}
- Industry: {industry}
- Brand Voice: {brandVoice}
- Target Audience: {targetAudience}
- Content Goal: {contentGoal}
- Platform/Channel: {platform}

Please create optimized content with:
1. Primary content piece (headline, body, CTA)
2. Brand voice adherence assessment
3. A/B testing variations (2-3 alternatives)
4. Performance predictions and metrics
5. Distribution and timing recommendations
6. Optimization suggestions for maximum impact`,

    responseFormat: {
      content: {
        headline: "string",
        body: "string",
        cta: "string",
        additionalElements: ["array"]
      },
      brandAlignment: "number (0-100)",
      variations: [{
        version: "string",
        content: "object",
        optimizationFocus: "string"
      }],
      performancePrediction: {
        engagementRate: "string",
        conversionRate: "string",
        reachEstimate: "string"
      },
      recommendations: ["array of optimization suggestions"],
      distribution: {
        bestChannels: ["array"],
        optimalTiming: "string",
        frequencyRecommendation: "string"
      }
    },

    examples: [
      {
        input: "Create a marketing email for our new product launch",
        output: `Email Content Created:

Headline: "Revolutionary AI automation is here - Transform your business today"
Body: Crafted 3-paragraph email focusing on transformation benefits, social proof, and urgency
CTA: "Start Your Free 14-Day Trial →"

Brand Alignment: 96% - Matches professional tone and value-focused messaging

A/B Variations:
• Version B: Urgency-focused subject line (+23% open rate potential)  
• Version C: Benefit-focused subject line (+18% engagement potential)

Performance Prediction:
• Open Rate: 34-38% (above industry average)
• Click Rate: 4.2-5.8% (target achieved)
• Conversion Rate: 2.1-3.4% (strong performance)

Optimization: Send Tuesday 2PM for maximum engagement, segment by company size for personalization`
      }
    ]
  },

  process_optimization: {
    systemPrompt: `You are Sage's process optimization specialist. You analyze workflows, identify inefficiencies, and design automated solutions that improve operational efficiency while maintaining quality standards.`,

    userPromptTemplate: `Process Optimization Request:
Query: {query}
Current Process: {processDescription}
Pain Points: {painPoints}
Goals: {optimizationGoals}

Design optimized workflow with automation opportunities and efficiency improvements.`,

    responseFormat: {
      optimizedProcess: "object",
      automationOpportunities: ["array"],
      efficiencyGains: "string",
      implementationPlan: ["array"],
      roi: "string"
    }
  }
}

// Prompt Builder Functions
export class PromptBuilder {
  static buildPrompt(
    agentType: 'oracle' | 'sentinel' | 'sage',
    promptType: string,
    query: string,
    context: AgentContext
  ): AIMessage[] {
    const promptMap = {
      oracle: ORACLE_PROMPTS,
      sentinel: SENTINEL_PROMPTS,
      sage: SAGE_PROMPTS
    }

    const prompts = promptMap[agentType]
    const template = prompts[promptType]

    if (!template) {
      throw new Error(`Prompt template not found: ${agentType}.${promptType}`)
    }

    // Build system message
    const systemMessage: AIMessage = {
      role: 'system',
      content: template.systemPrompt
    }

    // Build user message with context substitution
    const userContent = this.substituteContext(template.userPromptTemplate, query, context)
    const userMessage: AIMessage = {
      role: 'user',
      content: userContent,
      metadata: { agentType, promptType, originalQuery: query }
    }

    return [systemMessage, userMessage]
  }

  private static substituteContext(template: string, query: string, context: AgentContext): string {
    let result = template.replace('{query}', query)

    // Substitute context variables
    const substitutions = {
      companyName: context.organizationData?.name || 'Your Company',
      industry: context.organizationData?.industry || 'Technology',
      companySize: context.organizationData?.size || 'Medium',
      timeContext: context.timeContext ? JSON.stringify(context.timeContext) : new Date().toISOString(),
      availableMetrics: context.businessMetrics ? JSON.stringify(context.businessMetrics) : 'Basic metrics available',
      brandVoice: context.organizationData?.brandVoice || 'Professional and innovative',
      targetAudience: context.organizationData?.targetAudience || 'Business professionals',
      contentGoal: 'Engagement and conversion',
      platform: 'Multi-channel'
    }

    for (const [key, value] of Object.entries(substitutions)) {
      result = result.replace(new RegExp(`{${key}}`, 'g'), value)
    }

    return result
  }

  // Get appropriate prompt type based on query content
  static detectPromptType(agentType: 'oracle' | 'sentinel' | 'sage', query: string): string {
    const queryLower = query.toLowerCase()

    switch (agentType) {
      case 'oracle':
        if (queryLower.includes('predict') || queryLower.includes('forecast') || queryLower.includes('model')) {
          return 'predictive_modeling'
        }
        return 'business_analysis'

      case 'sentinel':
        if (queryLower.includes('security') || queryLower.includes('threat') || queryLower.includes('vulnerability')) {
          return 'security_analysis'
        }
        return 'system_analysis'

      case 'sage':
        if (queryLower.includes('process') || queryLower.includes('workflow') || queryLower.includes('optimize')) {
          return 'process_optimization'
        }
        return 'content_generation'

      default:
        return 'business_analysis'
    }
  }
}

// Response parsing and validation
export class ResponseValidator {
  static validateResponse(response: string, expectedFormat: any, agentType: string): {
    isValid: boolean
    parsedResponse?: any
    errors?: string[]
  } {
    try {
      // Try to parse as JSON first
      let parsedResponse
      try {
        parsedResponse = JSON.parse(response)
      } catch {
        // If not JSON, create structured response from text
        parsedResponse = this.parseTextResponse(response, agentType)
      }

      // Validate against expected format
      const errors = this.validateFormat(parsedResponse, expectedFormat)
      
      return {
        isValid: errors.length === 0,
        parsedResponse,
        errors: errors.length > 0 ? errors : undefined
      }
    } catch (error) {
      return {
        isValid: false,
        errors: [`Response validation failed: ${error.message}`]
      }
    }
  }

  private static parseTextResponse(response: string, agentType: string): any {
    // Parse unstructured text responses into structured format
    const lines = response.split('\n').filter(line => line.trim())
    
    switch (agentType) {
      case 'oracle':
        return this.parseOracleResponse(lines)
      case 'sentinel':
        return this.parseSentinelResponse(lines)
      case 'sage':
        return this.parseSageResponse(lines)
      default:
        return { content: response }
    }
  }

  private static parseOracleResponse(lines: string[]): any {
    const result: any = {
      analysis: '',
      confidence: 85,
      insights: [],
      recommendations: [],
      businessImpact: ''
    }

    let currentSection = 'analysis'
    
    for (const line of lines) {
      const cleanLine = line.trim()
      
      if (cleanLine.toLowerCase().includes('confidence')) {
        const match = cleanLine.match(/(\d+)%/)
        if (match) result.confidence = parseInt(match[1])
      } else if (cleanLine.toLowerCase().includes('insight') || cleanLine.startsWith('•') || cleanLine.startsWith('-')) {
        result.insights.push(cleanLine.replace(/^[•\-\*]\s*/, ''))
      } else if (cleanLine.toLowerCase().includes('recommend')) {
        currentSection = 'recommendations'
        result.recommendations.push(cleanLine.replace(/^[•\-\*]\s*/, ''))
      } else if (currentSection === 'recommendations' && (cleanLine.startsWith('•') || cleanLine.startsWith('-'))) {
        result.recommendations.push(cleanLine.replace(/^[•\-\*]\s*/, ''))
      } else if (cleanLine.toLowerCase().includes('impact')) {
        result.businessImpact = cleanLine
      } else if (result.analysis.length < 200) {
        result.analysis += cleanLine + ' '
      }
    }

    return result
  }

  private static parseSentinelResponse(lines: string[]): any {
    return {
      systemHealth: 'Good',
      healthScore: 87,
      issues: [],
      optimizations: [],
      recommendations: lines.filter(line => 
        line.includes('recommend') || line.includes('suggest') || line.includes('should')
      )
    }
  }

  private static parseSageResponse(lines: string[]): any {
    return {
      content: lines.join(' '),
      brandAlignment: 90,
      recommendations: [],
      performancePrediction: {}
    }
  }

  private static validateFormat(response: any, expectedFormat: any): string[] {
    const errors: string[] = []
    
    for (const [key, type] of Object.entries(expectedFormat)) {
      if (!(key in response)) {
        errors.push(`Missing required field: ${key}`)
      } else if (typeof type === 'string' && typeof response[key] !== type) {
        errors.push(`Field ${key} should be ${type}, got ${typeof response[key]}`)
      }
    }

    return errors
  }
}

export default PromptBuilder