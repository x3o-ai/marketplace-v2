import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding Trinity Agents and sample data...')

  // Create Trinity AI Agents
  const oracleAgent = await prisma.aIAgent.upsert({
    where: { slug: 'oracle' },
    update: {},
    create: {
      name: 'Oracle Analytics',
      slug: 'oracle',
      description: 'Advanced business intelligence and predictive analytics engine with explainable AI decisions',
      model: 'gpt-4-trinity-oracle',
      version: '1.2.0',
      config: {
        maxTokens: 8192,
        temperature: 0.3,
        features: ['predictive_analytics', 'business_intelligence', 'roi_analysis', 'trend_forecasting'],
        specializations: ['revenue_prediction', 'market_analysis', 'customer_insights', 'risk_assessment']
      },
      prompts: {
        system: "You are Oracle, the Trinity Agent specialized in advanced business intelligence and predictive analytics. You provide data-driven insights with explainable AI decisions and measurable ROI projections.",
        analysis: "Analyze the provided business data and generate actionable insights with confidence scores and recommendations.",
        prediction: "Create predictive models and forecasts based on historical data patterns and market trends."
      },
      capabilities: [
        'Revenue Forecasting',
        'Customer Analytics',
        'Market Trend Analysis', 
        'Risk Assessment',
        'Performance Optimization',
        'ROI Calculation',
        'Predictive Modeling',
        'Business Intelligence'
      ],
      tier: 'ENTERPRISE',
      status: 'ACTIVE'
    }
  })

  const sentinelAgent = await prisma.aIAgent.upsert({
    where: { slug: 'sentinel' },
    update: {},
    create: {
      name: 'Sentinel Monitoring',
      slug: 'sentinel',
      description: '24/7 autonomous system monitoring and optimization with intelligent threat detection',
      model: 'gpt-4-trinity-sentinel',
      version: '1.2.0',
      config: {
        maxTokens: 4096,
        temperature: 0.1,
        features: ['system_monitoring', 'anomaly_detection', 'auto_optimization', 'threat_analysis'],
        specializations: ['performance_monitoring', 'security_analysis', 'resource_optimization', 'uptime_management']
      },
      prompts: {
        system: "You are Sentinel, the Trinity Agent specialized in autonomous system monitoring and optimization. You maintain system health, detect anomalies, and optimize performance 24/7.",
        monitor: "Monitor system metrics and identify potential issues, bottlenecks, or security threats.",
        optimize: "Analyze system performance and recommend or implement optimizations to improve efficiency."
      },
      capabilities: [
        'System Health Monitoring',
        'Performance Optimization',
        'Anomaly Detection',
        'Security Analysis',
        'Resource Management',
        'Uptime Monitoring',
        'Alert Management',
        'Auto-scaling'
      ],
      tier: 'ENTERPRISE',
      status: 'ACTIVE'
    }
  })

  const sageAgent = await prisma.aIAgent.upsert({
    where: { slug: 'sage' },
    update: {},
    create: {
      name: 'Sage Optimization',
      slug: 'sage',
      description: 'Intelligent content generation and process automation with brand consistency optimization',
      model: 'gpt-4-trinity-sage',
      version: '1.2.0',
      config: {
        maxTokens: 8192,
        temperature: 0.7,
        features: ['content_generation', 'process_automation', 'brand_optimization', 'workflow_enhancement'],
        specializations: ['marketing_content', 'process_optimization', 'brand_consistency', 'campaign_management']
      },
      prompts: {
        system: "You are Sage, the Trinity Agent specialized in intelligent content generation and process optimization. You create high-quality content and automate workflows while maintaining brand consistency.",
        generate: "Generate high-quality, brand-consistent content optimized for engagement and conversion.",
        optimize: "Analyze and optimize existing processes, workflows, and content for maximum efficiency and impact."
      },
      capabilities: [
        'Content Generation',
        'Campaign Optimization',
        'Brand Consistency',
        'Process Automation',
        'Workflow Enhancement',
        'A/B Testing',
        'Performance Analysis',
        'Creative Strategy'
      ],
      tier: 'ENTERPRISE',
      status: 'ACTIVE'
    }
  })

  console.log('✅ Trinity Agents created:', {
    oracle: oracleAgent.id,
    sentinel: sentinelAgent.id,
    sage: sageAgent.id
  })

  // Create sample organization for testing
  const sampleOrg = await prisma.organization.upsert({
    where: { domain: 'demo.x3o.ai' },
    update: {},
    create: {
      name: 'Demo Enterprise Corp',
      domain: 'demo.x3o.ai',
      industry: 'Technology',
      size: '51-200',
      subscription: 'ENTERPRISE',
      billingEmail: 'billing@demo.x3o.ai',
      settings: {
        theme: 'light',
        features: ['trinity_agents', 'advanced_analytics', 'custom_integrations'],
        notifications: {
          email: true,
          slack: true,
          webhook: false
        }
      },
      integrationConfig: {
        hubspot: { enabled: false },
        salesforce: { enabled: false },
        stripe: { enabled: true }
      }
    }
  })

  // Create demo user for testing Trinity Agents
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@x3o.ai' },
    update: {},
    create: {
      name: 'Trinity Demo User',
      email: 'demo@x3o.ai',
      role: 'MANAGER',
      status: 'ACTIVE',
      organizationId: sampleOrg.id,
      department: 'Operations',
      jobTitle: 'Operations Manager',
      permissions: ['trinity_agent_trial', 'analytics_access', 'dashboard_full']
    }
  })

  // Create sample AI interactions for demo data
  const sampleInteractions = [
    {
      userId: demoUser.id,
      organizationId: sampleOrg.id,
      agentId: oracleAgent.id,
      query: 'What is our revenue forecast for next quarter?',
      response: JSON.stringify({
        prediction: '$284,650 revenue forecast for Q2',
        confidence: 94,
        factors: ['Customer retention up 7%', 'Market expansion opportunities', 'Seasonal trends favorable'],
        recommendation: 'Increase marketing spend by 15% to capitalize on growth potential'
      }),
      confidence: 0.94,
      processingTime: 1240,
      category: 'business_intelligence',
      tags: ['revenue', 'forecasting', 'quarterly'],
      status: 'COMPLETED'
    },
    {
      userId: demoUser.id,
      organizationId: sampleOrg.id,
      agentId: sentinelAgent.id,
      query: 'Monitor system performance and identify bottlenecks',
      response: JSON.stringify({
        systemHealth: 99.8,
        alerts: ['Database query optimization completed', 'Memory usage reduced 18%'],
        recommendations: ['Scale API servers during peak hours', 'Implement caching layer']
      }),
      confidence: 0.98,
      processingTime: 340,
      category: 'system_monitoring',
      tags: ['performance', 'optimization', 'monitoring'],
      status: 'COMPLETED'
    },
    {
      userId: demoUser.id,
      organizationId: sampleOrg.id,
      agentId: sageAgent.id,
      query: 'Generate email campaign content for product launch',
      response: JSON.stringify({
        emailSubject: 'Revolutionary AI Automation - Now Available',
        contentCreated: 5,
        engagementPrediction: 87,
        variations: ['Professional tone', 'Casual tone', 'Technical focus']
      }),
      confidence: 0.91,
      processingTime: 2100,
      category: 'content_generation',
      tags: ['email', 'campaign', 'product-launch'],
      status: 'COMPLETED'
    }
  ]

  for (const interaction of sampleInteractions) {
    await prisma.aIInteraction.create({ data: interaction })
  }

  // Create sample business metrics
  const revenueMetric = await prisma.businessMetric.create({
    data: {
      organizationId: sampleOrg.id,
      createdBy: demoUser.id,
      name: 'Monthly Recurring Revenue',
      description: 'Total monthly recurring revenue from all subscriptions',
      category: 'REVENUE',
      type: 'CURRENCY',
      unit: 'USD',
      source: 'API',
      currentValue: 284650,
      previousValue: 267230,
      targetValue: 300000,
      frequency: 'DAILY',
      chartType: 'LINE',
      status: 'ACTIVE',
      dataPoints: {
        create: [
          { value: 250000, timestamp: new Date('2024-01-01') },
          { value: 267230, timestamp: new Date('2024-02-01') },
          { value: 284650, timestamp: new Date('2024-03-01') }
        ]
      }
    }
  })

  console.log('✅ Sample data created:', {
    organization: sampleOrg.id,
    user: demoUser.id,
    interactions: sampleInteractions.length,
    metrics: 1
  })

  // Create system configuration
  await prisma.systemConfig.upsert({
    where: { key: 'trinity_agent_settings' },
    update: {},
    create: {
      key: 'trinity_agent_settings',
      value: {
        trial_duration_days: 14,
        limits: {
          oracle: { daily: 50, total: 700 },
          sentinel: { daily: 25, total: 350 },
          sage: { daily: 100, total: 1400 }
        },
        features: {
          real_time_monitoring: true,
          predictive_analytics: true,
          content_generation: true,
          automated_optimization: true
        }
      },
      description: 'Trinity Agent configuration and limits',
      category: 'trinity_agents'
    }
  })

  await prisma.systemConfig.upsert({
    where: { key: 'platform_settings' },
    update: {},
    create: {
      key: 'platform_settings',
      value: {
        maintenance_mode: false,
        trial_signups_enabled: true,
        enterprise_features_enabled: true,
        conversion_tracking_enabled: true
      },
      description: 'Platform-wide settings and feature flags',
      category: 'platform'
    }
  })

  console.log('✅ System configuration created')
  console.log('🎉 Trinity Agent marketplace seeding complete!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })