# 🚨 PRODUCTION HOTFIX - NextAuth Configuration

## Issue Identified
- `/api/auth/session` returning 500 errors
- NextAuth CLIENT_FETCH_ERROR
- Agent selection on signup page failing

## Root Cause
Missing **NEXTAUTH_URL** and **NEXTAUTH_SECRET** in Vercel environment variables.

## 🔧 IMMEDIATE FIX REQUIRED

### Add These to Vercel Environment Variables NOW:

1. **NEXTAUTH_URL**
   ```
   https://[YOUR-ACTUAL-VERCEL-DOMAIN].vercel.app
   ```

2. **NEXTAUTH_SECRET** (Generate this secret)
   ```bash
   # Run this command to generate:
   openssl rand -base64 32
   ```
   Then add the output to Vercel.

3. **NODE_ENV**
   ```
   production
   ```

## Steps to Fix:

1. **Go to Vercel Dashboard**
   - Project: x3o-marketplace-v2
   - Settings → Environment Variables

2. **Add missing variables:**
   - `NEXTAUTH_URL` = `https://[YOUR-DOMAIN].vercel.app`
   - `NEXTAUTH_SECRET` = `[32-char secret from openssl command]`
   - `NODE_ENV` = `production`

3. **Redeploy**
   - Vercel → Deployments → Redeploy latest

## Verification
After adding variables, test:
- `https://[YOUR-DOMAIN]/api/auth/session` should return 200
- Signup page agent selection should work
- Authentication flow should be functional

## Critical Note
Without `NEXTAUTH_SECRET`, NextAuth cannot encrypt sessions, causing 500 errors on all auth endpoints.