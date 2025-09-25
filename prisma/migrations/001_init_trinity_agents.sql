-- Initial Trinity Agent Database Migration
-- This migration creates the foundation for the x3o.ai Trinity Agent platform

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Create custom types
CREATE TYPE user_role AS ENUM ('SUPER_ADMIN', 'ORG_ADMIN', 'MANAGER', 'ANALYST', 'USER', 'VIEWER');
CREATE TYPE user_status AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING');
CREATE TYPE subscription_plan AS ENUM ('TRIAL', 'CREATIVE', 'ORACLE', 'ENTERPRISE', 'CUSTOM');
CREATE TYPE subscription_status AS ENUM ('TRIAL', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'UNPAID', 'INCOMPLETE', 'INCOMPLETE_EXPIRED', 'TRIALING', 'PAUSED');
CREATE TYPE agent_tier AS ENUM ('FREE', 'PRO', 'ENTERPRISE');
CREATE TYPE agent_status AS ENUM ('ACTIVE', 'MAINTENANCE', 'DEPRECATED', 'DISABLED');

-- Organizations table
CREATE TABLE organizations (
    id TEXT PRIMARY KEY DEFAULT ('org_' || generate_random_uuid()),
    name TEXT NOT NULL,
    domain TEXT UNIQUE,
    industry TEXT,
    size TEXT,
    logo TEXT,
    subscription subscription_tier DEFAULT 'STARTER'::subscription_tier NOT NULL,
    billing_email TEXT,
    settings JSONB,
    integration_config JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Users table with Trinity Agent trial support
CREATE TABLE users (
    id TEXT PRIMARY KEY DEFAULT ('user_' || generate_random_uuid()),
    name TEXT,
    email TEXT UNIQUE NOT NULL,
    email_verified TIMESTAMP WITH TIME ZONE,
    image TEXT,
    role user_role DEFAULT 'USER' NOT NULL,
    status user_status DEFAULT 'ACTIVE' NOT NULL,
    organization_id TEXT REFERENCES organizations(id),
    department TEXT,
    job_title TEXT,
    permissions TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    last_login_at TIMESTAMP WITH TIME ZONE
);

-- AI Agents table for Trinity Agents
CREATE TABLE ai_agents (
    id TEXT PRIMARY KEY DEFAULT ('agent_' || generate_random_uuid()),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    model TEXT NOT NULL,
    version TEXT DEFAULT '1.0.0' NOT NULL,
    config JSONB,
    prompts JSONB,
    capabilities TEXT[] DEFAULT ARRAY[]::TEXT[],
    tier agent_tier DEFAULT 'FREE' NOT NULL,
    status agent_status DEFAULT 'ACTIVE' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- AI Interactions table for Trinity Agent conversations
CREATE TABLE ai_interactions (
    id TEXT PRIMARY KEY DEFAULT ('interaction_' || generate_random_uuid()),
    user_id TEXT NOT NULL REFERENCES users(id),
    organization_id TEXT REFERENCES organizations(id),
    agent_id TEXT NOT NULL REFERENCES ai_agents(id),
    agent_version TEXT,
    query TEXT NOT NULL,
    response TEXT NOT NULL,
    confidence DOUBLE PRECISION,
    processing_time INTEGER,
    context JSONB,
    metadata JSONB,
    category TEXT,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    feedback TEXT,
    status interaction_status DEFAULT 'COMPLETED' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Subscriptions table for billing
CREATE TABLE subscriptions (
    id TEXT PRIMARY KEY DEFAULT ('sub_' || generate_random_uuid()),
    user_id TEXT NOT NULL REFERENCES users(id),
    organization_id TEXT REFERENCES organizations(id),
    stripe_subscription_id TEXT UNIQUE NOT NULL,
    stripe_customer_id TEXT NOT NULL,
    stripe_price_id TEXT,
    stripe_product_id TEXT,
    plan subscription_plan NOT NULL,
    status subscription_status DEFAULT 'TRIAL' NOT NULL,
    seats INTEGER DEFAULT 1 NOT NULL,
    amount DOUBLE PRECISION NOT NULL,
    currency TEXT DEFAULT 'usd' NOT NULL,
    interval billing_interval NOT NULL,
    trial_start TIMESTAMP WITH TIME ZONE,
    trial_end TIMESTAMP WITH TIME ZONE,
    current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    cancel_at_period_end BOOLEAN DEFAULT FALSE NOT NULL,
    canceled_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Audit logs for compliance and monitoring
CREATE TABLE audit_logs (
    id TEXT PRIMARY KEY DEFAULT ('audit_' || generate_random_uuid()),
    user_id TEXT REFERENCES users(id),
    organization_id TEXT REFERENCES organizations(id),
    action TEXT NOT NULL,
    resource TEXT NOT NULL,
    resource_id TEXT,
    old_values JSONB,
    new_values JSONB,
    metadata JSONB,
    ip_address TEXT,
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- System configuration for production settings
CREATE TABLE system_config (
    id TEXT PRIMARY KEY DEFAULT ('config_' || generate_random_uuid()),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    category TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create performance indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_organization ON users(organization_id);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_ai_interactions_user_date ON ai_interactions(user_id, created_at DESC);
CREATE INDEX idx_ai_interactions_agent_date ON ai_interactions(agent_id, created_at DESC);
CREATE INDEX idx_ai_interactions_category ON ai_interactions(category);
CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe ON subscriptions(stripe_subscription_id);
CREATE INDEX idx_audit_logs_user_timestamp ON audit_logs(user_id, timestamp DESC);
CREATE INDEX idx_audit_logs_action_timestamp ON audit_logs(action, timestamp DESC);
CREATE INDEX idx_system_config_category ON system_config(category);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ai_agents_updated_at BEFORE UPDATE ON ai_agents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ai_interactions_updated_at BEFORE UPDATE ON ai_interactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_config_updated_at BEFORE UPDATE ON system_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert initial Trinity Agents
INSERT INTO ai_agents (name, slug, description, model, version, capabilities, tier, status) VALUES
('Oracle Analytics', 'oracle', 'Advanced business intelligence and predictive analytics engine with explainable AI decisions', 'gpt-4-trinity-oracle', '1.2.0', 
 ARRAY['revenue_forecasting', 'customer_analytics', 'market_analysis', 'risk_assessment', 'kpi_optimization'], 'ENTERPRISE', 'ACTIVE'),

('Sentinel Monitoring', 'sentinel', '24/7 autonomous system monitoring and optimization with intelligent threat detection', 'claude-3.5-trinity-sentinel', '1.2.0',
 ARRAY['system_monitoring', 'performance_optimization', 'security_analysis', 'predictive_maintenance', 'incident_response'], 'ENTERPRISE', 'ACTIVE'),

('Sage Optimization', 'sage', 'Intelligent content generation and process automation with brand consistency optimization', 'gpt-4-trinity-sage', '1.2.0',
 ARRAY['content_generation', 'brand_management', 'campaign_optimization', 'workflow_automation', 'process_optimization'], 'ENTERPRISE', 'ACTIVE');

-- Insert system configuration
INSERT INTO system_config (key, value, description, category) VALUES
('trinity_agent_settings', '{
  "trial": {
    "duration_days": 14,
    "limits": {
      "oracle": {"daily": 50, "total": 700},
      "sentinel": {"daily": 25, "total": 350}, 
      "sage": {"daily": 100, "total": 1400}
    }
  },
  "enterprise": {
    "unlimited_queries": true,
    "advanced_features": true
  }
}', 'Trinity Agent configuration and limits', 'trinity_agents'),

('email_templates', '{
  "trial_welcome": {
    "subject": "Welcome to Trinity Agents - Your 14-day trial is live!",
    "enabled": true
  },
  "trial_day_3": {
    "subject": "See your Trinity Agent ROI so far...",
    "enabled": true
  },
  "conversion_success": {
    "subject": "Welcome to x3o.ai Enterprise!",
    "enabled": true
  }
}', 'Email automation template configuration', 'email_automation'),

('production_features', '{
  "ai_integrations": {
    "openai": {"enabled": true, "model": "gpt-4-turbo-preview"},
    "claude": {"enabled": true, "model": "claude-3-5-sonnet-20241022"}
  },
  "enterprise_features": {
    "streaming_responses": true,
    "advanced_analytics": true,
    "custom_integrations": true
  },
  "monitoring": {
    "error_tracking": true,
    "performance_monitoring": true,
    "cost_optimization": true
  }
}', 'Production feature configuration', 'production_config');

-- Grant appropriate permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ${POSTGRES_USER};
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ${POSTGRES_USER};