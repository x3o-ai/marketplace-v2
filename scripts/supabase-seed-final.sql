-- Trinity Agent Marketplace - Production Seed Data (FINAL FIX)
-- Run this in Supabase SQL Editor after confirming tables exist

-- Insert Trinity AI Agents with explicit timestamps
INSERT INTO "ai_agents" ("id", "name", "slug", "description", "model", "version", "config", "prompts", "capabilities", "tier", "status", "createdAt", "updatedAt") VALUES
(
    'oracle-agent-prod-001',
    'Oracle Analytics',
    'oracle',
    'Advanced business intelligence and predictive analytics engine with explainable AI decisions',
    'gpt-4-trinity-oracle',
    '1.2.0',
    '{"maxTokens": 8192, "temperature": 0.3, "features": ["predictive_analytics", "business_intelligence", "roi_analysis", "trend_forecasting"], "specializations": ["revenue_prediction", "market_analysis", "customer_insights", "risk_assessment"]}',
    '{"system": "You are Oracle, the Trinity Agent specialized in advanced business intelligence and predictive analytics. You provide data-driven insights with explainable AI decisions and measurable ROI projections.", "analysis": "Analyze the provided business data and generate actionable insights with confidence scores and recommendations.", "prediction": "Create predictive models and forecasts based on historical data patterns and market trends."}',
    ARRAY['Revenue Forecasting', 'Customer Analytics', 'Market Trend Analysis', 'Risk Assessment', 'Performance Optimization', 'ROI Calculation', 'Predictive Modeling', 'Business Intelligence'],
    'ENTERPRISE',
    'ACTIVE',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    'sentinel-agent-prod-002',
    'Sentinel Monitoring',
    'sentinel',
    '24/7 autonomous system monitoring and optimization with intelligent threat detection',
    'gpt-4-trinity-sentinel',
    '1.2.0',
    '{"maxTokens": 4096, "temperature": 0.1, "features": ["system_monitoring", "anomaly_detection", "auto_optimization", "threat_analysis"], "specializations": ["performance_monitoring", "security_analysis", "resource_optimization", "uptime_management"]}',
    '{"system": "You are Sentinel, the Trinity Agent specialized in autonomous system monitoring and optimization. You maintain system health, detect anomalies, and optimize performance 24/7.", "monitor": "Monitor system metrics and identify potential issues, bottlenecks, or security threats.", "optimize": "Analyze system performance and recommend or implement optimizations to improve efficiency."}',
    ARRAY['System Health Monitoring', 'Performance Optimization', 'Anomaly Detection', 'Security Analysis', 'Resource Management', 'Uptime Monitoring', 'Alert Management', 'Auto-scaling'],
    'ENTERPRISE',
    'ACTIVE',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    'sage-agent-prod-003',
    'Sage Optimization',
    'sage',
    'Intelligent content generation and process automation with brand consistency optimization',
    'gpt-4-trinity-sage',
    '1.2.0',
    '{"maxTokens": 8192, "temperature": 0.7, "features": ["content_generation", "process_automation", "brand_optimization", "workflow_enhancement"], "specializations": ["marketing_content", "process_optimization", "brand_consistency", "campaign_management"]}',
    '{"system": "You are Sage, the Trinity Agent specialized in intelligent content generation and process optimization. You create high-quality content and automate workflows while maintaining brand consistency.", "generate": "Generate high-quality, brand-consistent content optimized for engagement and conversion.", "optimize": "Analyze and optimize existing processes, workflows, and content for maximum efficiency and impact."}',
    ARRAY['Content Generation', 'Campaign Optimization', 'Brand Consistency', 'Process Automation', 'Workflow Enhancement', 'A/B Testing', 'Performance Analysis', 'Creative Strategy'],
    'ENTERPRISE',
    'ACTIVE',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- Insert system configuration with explicit timestamps
INSERT INTO "system_config" ("key", "value", "description", "category", "createdAt", "updatedAt") VALUES
(
    'trinity_agent_settings',
    '{"trial_duration_days": 14, "limits": {"oracle": {"daily": 50, "total": 700}, "sentinel": {"daily": 25, "total": 350}, "sage": {"daily": 100, "total": 1400}}, "features": {"real_time_monitoring": true, "predictive_analytics": true, "content_generation": true, "automated_optimization": true}}',
    'Trinity Agent configuration and limits',
    'trinity_agents',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    'platform_settings',
    '{"maintenance_mode": false, "trial_signups_enabled": true, "enterprise_features_enabled": true, "conversion_tracking_enabled": true}',
    'Platform-wide settings and feature flags',
    'platform',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- Create demo organization with explicit timestamps
INSERT INTO "organizations" ("id", "name", "domain", "industry", "size", "subscription", "billingEmail", "settings", "integrationConfig", "createdAt", "updatedAt") VALUES
(
    'demo-org-x3o-prod',
    'Demo Enterprise Corp',
    'demo.x3o.ai',
    'Technology',
    '51-200',
    'ENTERPRISE',
    'billing@demo.x3o.ai',
    '{"theme": "light", "features": ["trinity_agents", "advanced_analytics", "custom_integrations"], "notifications": {"email": true, "slack": true, "webhook": false}}',
    '{"hubspot": {"enabled": false}, "salesforce": {"enabled": false}, "stripe": {"enabled": true}}',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- Create demo user with explicit timestamps
INSERT INTO "users" ("id", "name", "email", "role", "status", "organizationId", "department", "jobTitle", "permissions", "createdAt", "updatedAt") VALUES
(
    'demo-user-x3o-prod',
    'Trinity Demo User',
    'demo@x3o.ai',
    'MANAGER',
    'ACTIVE',
    'demo-org-x3o-prod',
    'Operations',
    'Operations Manager',
    ARRAY['trinity_agent_trial', 'analytics_access', 'dashboard_full'],
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- Create sample AI interactions with explicit timestamps
INSERT INTO "ai_interactions" ("userId", "organizationId", "agentId", "query", "response", "confidence", "processingTime", "category", "tags", "status", "createdAt", "updatedAt") VALUES
(
    'demo-user-x3o-prod',
    'demo-org-x3o-prod',
    'oracle-agent-prod-001',
    'What is our revenue forecast for next quarter?',
    '{"prediction": "$284,650 revenue forecast for Q2", "confidence": 94, "factors": ["Customer retention up 7%", "Market expansion opportunities", "Seasonal trends favorable"], "recommendation": "Increase marketing spend by 15% to capitalize on growth potential"}',
    0.94,
    1240,
    'business_intelligence',
    ARRAY['revenue', 'forecasting', 'quarterly'],
    'COMPLETED',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    'demo-user-x3o-prod',
    'demo-org-x3o-prod',
    'sentinel-agent-prod-002',
    'Monitor system performance and identify bottlenecks',
    '{"systemHealth": 99.8, "alerts": ["Database query optimization completed", "Memory usage reduced 18%"], "recommendations": ["Scale API servers during peak hours", "Implement caching layer"]}',
    0.98,
    340,
    'system_monitoring',
    ARRAY['performance', 'optimization', 'monitoring'],
    'COMPLETED',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    'demo-user-x3o-prod',
    'demo-org-x3o-prod',
    'sage-agent-prod-003',
    'Generate email campaign content for product launch',
    '{"emailSubject": "Revolutionary AI Automation - Now Available", "contentCreated": 5, "engagementPrediction": 87, "variations": ["Professional tone", "Casual tone", "Technical focus"]}',
    0.91,
    2100,
    'content_generation',
    ARRAY['email', 'campaign', 'product-launch'],
    'COMPLETED',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- Verify data was inserted correctly
SELECT 'Trinity Agents created:' as status, COUNT(*) as count FROM "ai_agents";
SELECT 'Organizations created:' as status, COUNT(*) as count FROM "organizations";
SELECT 'Users created:' as status, COUNT(*) as count FROM "users";
SELECT 'Interactions created:' as status, COUNT(*) as count FROM "ai_interactions";
SELECT 'System configs created:' as status, COUNT(*) as count FROM "system_config";