# Subscriber App - Fixes Applied

## Completed Fixes

### 1. DATABASE_URL Connection String
- **Issue**: DATABASE_URL was using wrong pooler hostname (`aws-0-ap-south-1` instead of `aws-1-ap-south-1`)
- **Fix**: Updated Vercel production env var to use correct Shared Pooler connection string
- **Status**: DONE

### 2. Database Tables Created
- **Issue**: Prisma tables didn't exist in Supabase
- **Fix**: Ran `pnpm prisma db push` to create all tables
- **Status**: DONE

### 3. Complete Onboarding Endpoint
- **Issue**: Missing `/api/user/complete-onboarding` endpoint
- **Fix**: Added endpoint to `api/index.ts`
- **Status**: DONE (code committed)

### 4. Auth/Me Response Updated
- **Issue**: `/api/auth/me` didn't return `onboardingCompleted` field
- **Fix**: Added `onboardingCompleted` to select query in `api/index.ts`
- **Status**: DONE (code committed)

### 5. Frontend 401 Interceptor
- **Issue**: 401 errors immediately redirected to sign-in, causing infinite loop on cold starts
- **Fix**: Added retry logic in `apps/web/src/services/api.ts` - retries once before redirecting
- **Status**: DONE (code committed)

### 6. Better Error Logging
- **Issue**: Auth errors weren't logged with details
- **Fix**: Added `console.error` statements for Supabase auth errors
- **Status**: DONE (code committed)

### 7. Vercel Environment Variables Fixed
- **Issue**: `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` had trailing `\n` breaking authentication
- **Fix**: Removed and re-added env vars without trailing newlines, redeployed
- **Status**: DONE

## Files Modified

1. `api/index.ts` - Added onboarding endpoint, improved error logging, added onboardingCompleted to auth/me
2. `apps/web/src/services/api.ts` - Added 401 retry logic for cold start handling

## Git Commits

- `6e3bf2c` - Fix auth loop and add onboarding endpoint
