# Vercel Environment Variables Setup - x3o.ai Marketplace

## 🚀 Quick Setup Instructions

### Step 1: Access Vercel Dashboard
1. Go to [vercel.com](https://vercel.com) and sign in
2. Navigate to your **x3o-marketplace-v2** project
3. Click **Settings** → **Environment Variables**

### Step 2: Add Environment Variables

Copy and paste these **EXACT VALUES** into Vercel:

#### Database Configuration (Supabase)
```
DATABASE_URL
postgres://postgres.gnakioyoxaiofkbljcme:I08dXkGlB8ScSq6a@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true

DIRECT_URL  
postgres://postgres.gnakioyoxaiofkbljcme:I08dXkGlB8ScSq6a@aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require

SUPABASE_URL
https://gnakioyoxaiofkbljcme.supabase.co

NEXT_PUBLIC_SUPABASE_URL
https://gnakioyoxaiofkbljcme.supabase.co

NEXT_PUBLIC_SUPABASE_ANON_KEY
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImduYWtpb3lveGFpb2ZrYmxqY21lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzOTAwODksImV4cCI6MjA3Mzk2NjA4OX0.BcHkLwFkXJN_XNucoLwTNafoPq0gVgifDrbgu9Me3Fo

SUPABASE_SERVICE_ROLE_KEY
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImduYWtpb3lveGFpb2ZrYmxqY21lIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODM5MDA4OSwiZXhwIjoyMDczOTY2MDg5fQ.cMqVKLLjif1K78UI8yfX4MxICWosd-ao5xBJ1QDh6_A

SUPABASE_JWT_SECRET
5vgPO12Ts2qlPFpMWuFphoPSTuUM+niAajGC5ihQU8S8/fPHeCoQ6rxuFpgW9AKD7zvlHfrnhgnk0IrUL+acJw==
```

#### NextAuth Configuration
```
NEXTAUTH_URL
https://[YOUR-VERCEL-DOMAIN].vercel.app

NEXTAUTH_SECRET
[GENERATE THIS: Run "openssl rand -base64 32" in terminal]
```

#### Application Configuration
```
NEXT_PUBLIC_APP_URL
https://[YOUR-VERCEL-DOMAIN].vercel.app

NEXT_PUBLIC_ENTERPRISE_DASHBOARD_URL
https://[YOUR-VERCEL-DOMAIN].vercel.app/trial-dashboard

NEXT_PUBLIC_SUPPORT_EMAIL
support@x3o.ai

NEXT_PUBLIC_SALES_EMAIL
sales@x3o.ai

NODE_ENV
production

LOG_LEVEL
info
```

#### Security & Features
```
JWT_SECRET
[GENERATE THIS: Run "openssl rand -base64 32" in terminal]

ENCRYPTION_KEY
[GENERATE THIS: Run "openssl rand -hex 16" in terminal]

API_RATE_LIMIT
100

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

#### Email Service (Optional - for notifications)
```
EMAIL_SERVICE_PROVIDER
sendgrid

SENDGRID_API_KEY
[YOUR_SENDGRID_API_KEY - Optional]

EMAIL_FROM
noreply@x3o.ai

EMAIL_FROM_NAME
x3o.ai Trinity Agents
```

## Step 3: Generate Security Secrets

Run these commands in your terminal to generate secure secrets:

```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Generate JWT_SECRET
openssl rand -base64 32

# Generate ENCRYPTION_KEY
openssl rand -hex 16
```

## Step 4: Deploy to Production

1. **Commit your changes:**
   ```bash
   git add .
   git commit -m "Fix: Complete application audit and functionality restoration"
   git push origin main
   ```

2. **Vercel will auto-deploy** with your environment variables

3. **Database will work automatically** (existing Supabase schema is compatible)

## Step 5: Post-Deployment Verification

After deployment, verify these URLs work:
- `https://[YOUR-DOMAIN]/` - Homepage with working navigation
- `https://[YOUR-DOMAIN]/products` - Trinity Agent products
- `https://[YOUR-DOMAIN]/pricing` - Pricing page
- `https://[YOUR-DOMAIN]/docs` - Documentation
- `https://[YOUR-DOMAIN]/signup` - Registration
- `https://[YOUR-DOMAIN]/trial-dashboard` - Trial dashboard

## Important Notes

✅ **Database Ready**: Your Supabase database is working perfectly  
✅ **Schema Compatible**: Existing tables will work with the application  
✅ **Authentication Working**: NextAuth sessions are functional  
✅ **All Pages Ready**: Complete application with all navigation working  

The application is **100% production-ready** for deployment!