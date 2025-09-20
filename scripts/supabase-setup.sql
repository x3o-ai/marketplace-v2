-- Trinity Agent Marketplace - Production Database Setup for Supabase
-- Run these commands in the Supabase SQL Editor to set up production tables

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enums first
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'ORG_ADMIN', 'MANAGER', 'ANALYST', 'USER', 'VIEWER');
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING');
CREATE TYPE "SubscriptionTier" AS ENUM ('STARTER', 'PROFESSIONAL', 'ENTERPRISE', 'CUSTOM');
CREATE TYPE "AgentTier" AS ENUM ('FREE', 'PRO', 'ENTERPRISE');
CREATE TYPE "AgentStatus" AS ENUM ('ACTIVE', 'MAINTENANCE', 'DEPRECATED', 'DISABLED');
CREATE TYPE "InteractionStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');
CREATE TYPE "MetricCategory" AS ENUM ('REVENUE', 'SALES', 'MARKETING', 'OPERATIONS', 'CUSTOMER', 'PRODUCT', 'FINANCIAL', 'HR', 'CUSTOM');
CREATE TYPE "MetricType" AS ENUM ('GAUGE', 'COUNTER', 'RATE', 'PERCENTAGE', 'CURRENCY', 'DURATION');
CREATE TYPE "DataSource" AS ENUM ('MANUAL', 'API', 'DATABASE', 'FILE_UPLOAD', 'HUBSPOT', 'SALESFORCE', 'GOOGLE_ANALYTICS', 'WEBHOOK', 'AI_GENERATED');
CREATE TYPE "UpdateFrequency" AS ENUM ('REAL_TIME', 'HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY');
CREATE TYPE "ChartType" AS ENUM ('LINE', 'BAR', 'PIE', 'DONUT', 'AREA', 'SCATTER', 'GAUGE', 'TABLE');
CREATE TYPE "MetricStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED', 'ERROR');
CREATE TYPE "DashboardStatus" AS ENUM ('ACTIVE', 'DRAFT', 'ARCHIVED');
CREATE TYPE "DashboardItemType" AS ENUM ('METRIC_CARD', 'CHART', 'TABLE', 'TEXT', 'IMAGE', 'AI_INSIGHT', 'CUSTOM');
CREATE TYPE "ReportType" AS ENUM ('EXECUTIVE_SUMMARY', 'PERFORMANCE_REPORT', 'AI_INSIGHTS', 'CUSTOM');
CREATE TYPE "ReportFormat" AS ENUM ('PDF', 'EXCEL', 'CSV', 'JSON', 'HTML');
CREATE TYPE "ReportStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'ARCHIVED');
CREATE TYPE "ExecutionStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED');
CREATE TYPE "IntegrationType" AS ENUM ('CRM', 'MARKETING', 'ANALYTICS', 'FINANCIAL', 'COMMUNICATION', 'STORAGE', 'CUSTOM');
CREATE TYPE "IntegrationStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ERROR', 'CONFIGURING', 'TESTING');
CREATE TYPE "SyncStatus" AS ENUM ('STARTED', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'PARTIAL');
CREATE TYPE "WebhookStatus" AS ENUM ('ACTIVE', 'PAUSED', 'FAILED', 'DISABLED');
CREATE TYPE "DeliveryStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'RETRY');
CREATE TYPE "SubscriptionPlan" AS ENUM ('TRIAL', 'CREATIVE', 'ORACLE', 'ENTERPRISE', 'CUSTOM');
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIAL', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'UNPAID', 'INCOMPLETE', 'INCOMPLETE_EXPIRED', 'TRIALING', 'PAUSED');
CREATE TYPE "BillingInterval" AS ENUM ('MONTHLY', 'YEARLY', 'QUARTERLY', 'WEEKLY');
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED', 'CANCELED', 'PROCESSING', 'REQUIRES_ACTION', 'REQUIRES_CONFIRMATION', 'REQUIRES_PAYMENT_METHOD');
CREATE TYPE "EmailType" AS ENUM ('TRIAL_WELCOME', 'TRIAL_DAY_3', 'TRIAL_DAY_7', 'TRIAL_DAY_10', 'TRIAL_EXPIRING', 'CONVERSION_SUCCESS', 'PAYMENT_SUCCESS', 'PAYMENT_FAILED', 'SUBSCRIPTION_CANCELED', 'INVOICE_REMINDER', 'WELCOME_ONBOARDING', 'FEATURE_ANNOUNCEMENT');
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'OPEN', 'PAID', 'VOID', 'UNCOLLECTIBLE');
CREATE TYPE "EmailStatus" AS ENUM ('PENDING', 'SENT', 'DELIVERED', 'OPENED', 'CLICKED', 'BOUNCED', 'FAILED', 'UNSUBSCRIBED');

-- Create tables in dependency order
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "name" TEXT NOT NULL,
    "domain" TEXT UNIQUE,
    "industry" TEXT,
    "size" TEXT,
    "logo" TEXT,
    "subscription" "SubscriptionTier" NOT NULL DEFAULT 'STARTER',
    "billingEmail" TEXT,
    "settings" JSONB,
    "integrationConfig" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "name" TEXT,
    "email" TEXT NOT NULL UNIQUE,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "organizationId" TEXT,
    "department" TEXT,
    "jobTitle" TEXT,
    "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLoginAt" TIMESTAMP(3),
    CONSTRAINT "users_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "accounts" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "sessions" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "sessionToken" TEXT NOT NULL UNIQUE,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL UNIQUE,
    "expires" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "ai_agents" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL UNIQUE,
    "description" TEXT,
    "model" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT '1.0.0',
    "config" JSONB,
    "prompts" JSONB,
    "capabilities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "tier" "AgentTier" NOT NULL DEFAULT 'FREE',
    "status" "AgentStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "ai_interactions" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT,
    "agentId" TEXT NOT NULL,
    "agentVersion" TEXT,
    "query" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION,
    "processingTime" INTEGER,
    "context" JSONB,
    "metadata" JSONB,
    "category" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "rating" INTEGER,
    "feedback" TEXT,
    "status" "InteractionStatus" NOT NULL DEFAULT 'COMPLETED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ai_interactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ai_interactions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ai_interactions_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "ai_agents"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "system_config" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "key" TEXT NOT NULL UNIQUE,
    "value" JSONB NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create unique indexes
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- Create performance indexes
CREATE INDEX "ai_interactions_userId_createdAt_idx" ON "ai_interactions"("userId", "createdAt");
CREATE INDEX "ai_interactions_organizationId_createdAt_idx" ON "ai_interactions"("organizationId", "createdAt");
CREATE INDEX "ai_interactions_agentId_createdAt_idx" ON "ai_interactions"("agentId", "createdAt");

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON "organizations" FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON "users" FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_ai_agents_updated_at BEFORE UPDATE ON "ai_agents" FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_ai_interactions_updated_at BEFORE UPDATE ON "ai_interactions" FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_system_config_updated_at BEFORE UPDATE ON "system_config" FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();