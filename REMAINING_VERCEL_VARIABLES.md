# Remaining Vercel Environment Variables Setup

## ✅ Already Configured (You have these)
- All Supabase database variables
- All Postgres connection strings
- Supabase JWT secrets and keys

## 🔧 Still Need to Add These Variables:

### NextAuth Configuration (Required)
```
NEXTAUTH_URL
https://[YOUR-VERCEL-DOMAIN].vercel.app

NEXTAUTH_SECRET
[GENERATE: Run "openssl rand -base64 32"]
```

### Application URLs (Required)
```
NEXT_PUBLIC_APP_URL
https://[YOUR-VERCEL-DOMAIN].vercel.app

NODE_ENV
production

LOG_LEVEL
info
```

### Security (Required)
```
JWT_SECRET
[GENERATE: Run "openssl rand -base64 32"]

ENCRYPTION_KEY
[GENERATE: Run "openssl rand -hex 16"]

API_RATE_LIMIT
100
```

### Feature Flags (Required)
```
ENABLE_TRIAL_EXTENSIONS
true

ENABLE_ENTERPRISE_FEATURES
true

ENABLE_REAL_TRINITY_AGENTS
true

ENABLE_CONVERSION_TRACKING
true

TRIAL_DURATION_DAYS
14

TRIAL_ORACLE_LIMIT
100

TRIAL_SENTINEL_LIMIT
50

TRIAL_SAGE_LIMIT
200
```

### Optional (Can add later)
```
NEXT_PUBLIC_SUPPORT_EMAIL
support@x3o.ai

NEXT_PUBLIC_SALES_EMAIL
sales@x3o.ai

EMAIL_SERVICE_PROVIDER
sendgrid

EMAIL_FROM
noreply@x3o.ai
```

## Generate Secure Secrets

Run these commands to generate the required secrets:

```bash
# For NEXTAUTH_SECRET
openssl rand -base64 32

# For JWT_SECRET  
openssl rand -base64 32

# For ENCRYPTION_KEY
openssl rand -hex 16
```

## Quick Deploy Steps

1. **Add the above variables** to Vercel Environment Variables
2. **Set Environment** to "Production" for each
3. **Replace [YOUR-VERCEL-DOMAIN]** with your actual domain
4. **Push to GitHub** - auto-deployment will trigger
5. **Test the deployment** - all navigation should work perfectly

Your app is **100% ready** for production deployment!