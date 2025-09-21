# Vercel Environment Variables Setup Guide

## Step 1: Access Vercel Dashboard
1. Go to [vercel.com](https://vercel.com) and sign in
2. Navigate to your x3o-marketplace-v2 project
3. Go to **Settings** → **Environment Variables**

## Step 2: Add Required Environment Variables

### Database Configuration (Supabase)
```
DATABASE_URL = postgres://postgres.gnakioyoxaiofkbljcme:I08dXkGlB8ScSq6a@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true

DIRECT_URL = postgres://postgres.gnakioyoxaiofkbljcme:I08dXkGlB8ScSq6a@aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require

SUPABASE_URL = https://gnakioyoxaiofkbljcme.supabase.co

NEXT_PUBLIC_SUPABASE_URL = https://gnakioyoxaiofkbljcme.supabase.co

NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImduYWtpb3lveGFpb2ZrYmxqY21lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzOTAwODksImV4cCI6MjA3Mzk2NjA4OX0.BcHkLwFkXJN_XNucoLwTNafoPq0gVgifDrbgu9Me3Fo

SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImduYWtpb3lveGFpb2ZrYmxqY21lIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODM5MDA4OSwiZXhwIjoyMDczOTY2MDg5fQ.cMqVKLLjif1K78UI8yfX4MxICWosd-ao5xBJ1QDh6_A

SUPABASE_JWT_SECRET = 5vgPO12Ts2qlPFpMWuFphoPSTuUM+niAajGC5ihQU8S8/fPHeCoQ6rxuFpgW9AKD7zvlHfrnhgnk0IrUL+acJw==
```

### NextAuth Configuration
```
NEXTAUTH_URL = https://[YOUR-VERCEL-DOMAIN].vercel.app

NEXTAUTH_SECRET = [GENERATE_SECURE_SECRET - Use: openssl rand -base64 32]
```

### Google OAuth (Production - Optional)
```
GOOGLE_CLIENT_ID = [YOUR_GOOGLE_OAUTH_CLIENT_ID]

GOOGLE_CLIENT_SECRET = [YOUR_GOOGLE_OAUTH_CLIENT_SECRET]
```

### Stripe Integration (Production - Optional)
```
STRIPE_PUBLIC_KEY = pk_live_[YOUR_STRIPE_PUBLIC_KEY]

STRIPE_SECRET_KEY = sk_live_[YOUR_STRIPE_SECRET_KEY]

STRIPE_WEBHOOK_SECRET = whsec_[YOUR_WEBHOOK_SECRET]
```

### Application URLs
```
NEXT_PUBLIC_APP_URL = https://[YOUR-VERCEL-DOMAIN].vercel.app

NEXT_PUBLIC_ENTERPRISE_DASHBOARD_URL = https://[YOUR-VERCEL-DOMAIN].vercel.app/trial-dashboard

NEXT_PUBLIC_SUPPORT_EMAIL = support@x3o.ai

NEXT_PUBLIC_SALES_EMAIL = sales@x3o.ai
```

### Security & Features
```
JWT_SECRET = [GENERATE_SECURE_JWT_SECRET - Use: openssl rand -base64 32]

ENCRYPTION_KEY = [GENERATE_32_CHAR_KEY - Use: openssl rand -hex 16]

API_RATE_LIMIT = 100

NODE_ENV = production

LOG_LEVEL = info

ENABLE_TRIAL_EXTENSIONS = true

ENABLE_ENTERPRISE_FEATURES = true

ENABLE_REAL_TRINITY_AGENTS = true

ENABLE_CONVERSION_TRACKING = true

TRIAL_DURATION_DAYS = 14

TRIAL_ORACLE_LIMIT = 100

TRIAL_SENTINEL_LIMIT = 50

TRIAL_SAGE_LIMIT = 200
```

## Step 3: Generate Secure Secrets

Run these commands locally to generate secure secrets:

```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Generate JWT_SECRET  
openssl rand -base64 32

# Generate ENCRYPTION_KEY
openssl rand -hex 16
```

## Step 4: Set Environment Variable Scope

For each environment variable in Vercel:
- **Environment**: Select "Production" (and "Preview" if needed)
- **Branch**: Leave blank (applies to all branches)

## Step 5: Deploy to Production

1. **Commit all changes** to your GitHub repository:
   ```bash
   git add .
   git commit -m "Fix: Complete application audit and navbar functionality"
   git push origin main
   ```

2. **Vercel will auto-deploy** with your new environment variables

3. **Run database migrations** on first deployment:
   - In Vercel dashboard, go to **Functions** → **View Function Logs**
   - Or manually trigger: `npx prisma migrate deploy` in Vercel terminal

## Step 6: Verify Deployment

After deployment, test these URLs:
- `https://[YOUR-DOMAIN]/` - Homepage with working navigation
- `https://[YOUR-DOMAIN]/products` - Trinity Agent showcase
- `https://[YOUR-DOMAIN]/pricing` - Pricing tiers
- `https://[YOUR-DOMAIN]/docs` - Documentation
- `https://[YOUR-DOMAIN]/signup` - Registration flow
- `https://[YOUR-DOMAIN]/trial-dashboard` - Trial experience

## Troubleshooting

If you encounter issues:

1. **Check Vercel Function Logs** for errors
2. **Verify all environment variables** are set correctly
3. **Ensure database migrations** have run successfully
4. **Test API routes** individually: `/api/auth/session`, `/api/trial/access`

## Database Migration Command (if needed)

If migrations don't run automatically:
```bash
npx prisma migrate deploy
```

Your application is now **production-ready** with:
✅ Real Supabase database connection
✅ All navigation working
✅ Complete authentication system
✅ Professional enterprise pages
✅ Auto-deployment configured