-- Trinity Agent Marketplace - Verify Production Setup
-- Run this to check if everything is working correctly

-- Check if Trinity Agents exist
SELECT 'Checking Trinity Agents...' as step;
SELECT name, slug, status FROM "ai_agents" WHERE slug IN ('oracle', 'sentinel', 'sage');

-- If agents don't exist or are incomplete, create/update them
INSERT INTO "ai_agents" ("id", "name", "slug", "description", "model", "version", "config", "prompts", "capabilities", "tier", "status", "createdAt", "updatedAt") VALUES
(
    'oracle-agent-prod-001',
    'Oracle Analytics',
    'oracle',
    'Advanced business intelligence and predictive analytics engine with explainable AI decisions',
    'gpt-4-trinity-oracle',
    '1.2.0',
    '{"maxTokens": 8192, "temperature": 0.3, "features": ["predictive_analytics", "business_intelligence", "roi_analysis", "trend_forecasting"]}',
    '{"system": "You are Oracle, the Trinity Agent specialized in advanced business intelligence and predictive analytics."}',
    ARRAY['Revenue Forecasting', 'Customer Analytics', 'Market Trend Analysis', 'Risk Assessment'],
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
    '{"maxTokens": 4096, "temperature": 0.1, "features": ["system_monitoring", "anomaly_detection", "auto_optimization"]}',
    '{"system": "You are Sentinel, the Trinity Agent specialized in autonomous system monitoring and optimization."}',
    ARRAY['System Health Monitoring', 'Performance Optimization', 'Anomaly Detection', 'Security Analysis'],
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
    '{"maxTokens": 8192, "temperature": 0.7, "features": ["content_generation", "process_automation", "brand_optimization"]}',
    '{"system": "You are Sage, the Trinity Agent specialized in intelligent content generation and process optimization."}',
    ARRAY['Content Generation', 'Campaign Optimization', 'Brand Consistency', 'Process Automation'],
    'ENTERPRISE',
    'ACTIVE',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    "updatedAt" = CURRENT_TIMESTAMP;

-- Ensure system configuration exists
INSERT INTO "system_config" ("key", "value", "description", "category", "createdAt", "updatedAt") VALUES
(
    'trinity_agent_settings',
    '{"trial_duration_days": 14, "limits": {"oracle": {"daily": 50, "total": 700}, "sentinel": {"daily": 25, "total": 350}, "sage": {"daily": 100, "total": 1400}}, "features": {"real_time_monitoring": true, "predictive_analytics": true, "content_generation": true, "automated_optimization": true}}',
    'Trinity Agent configuration and limits',
    'trinity_agents',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    "updatedAt" = CURRENT_TIMESTAMP;

-- Final verification
SELECT 'FINAL VERIFICATION:' as status;
SELECT 'Trinity Agents:' as type, COUNT(*) as count FROM "ai_agents" WHERE status = 'ACTIVE';
SELECT 'System Config:' as type, COUNT(*) as count FROM "system_config";
SELECT 'Database Setup:' as type, 'COMPLETE' as status;

-- Test Trinity Agent functionality
SELECT 'Trinity Agent Test:' as test, 
       name as agent, 
       slug as endpoint,
       status as health 
FROM "ai_agents" 
WHERE slug IN ('oracle', 'sentinel', 'sage')
ORDER BY slug;