# Troubleshooting Guide

## 401 Authentication Errors

### Symptoms
- API returns 401 Unauthorized
- User redirected to sign-in unexpectedly
- "Invalid token" errors in console

### Solutions
1. **Check env vars for trailing newlines**
   ```bash
   # Bad: has \n at end
   SUPABASE_SERVICE_ROLE_KEY="eyJ...\n"

   # Good: no trailing whitespace
   SUPABASE_SERVICE_ROLE_KEY="eyJ..."
   ```

2. **Verify SUPABASE_SERVICE_ROLE_KEY is correct**
   - Go to Supabase Dashboard → Settings → API
   - Copy "service_role" key (NOT anon key)

3. **Check database connection**
   ```bash
   pnpm prisma db push
   ```

4. **Cold start handling**
   - Frontend has retry logic in `/apps/web/src/services/api.ts`
   - Retries once before redirecting to sign-in

---

## Database Connection Issues

### Symptoms
- Prisma errors on API calls
- "Connection refused" errors
- Timeout errors
- **"prepared statement 's0' already exists"** error

### Solutions
1. **Use Session Pooler (port 5432) with pgbouncer=true**
   ```
   # Correct (Session Pooler - port 5432 with pgbouncer flag)
   postgresql://user:pass@aws-0-region.pooler.supabase.com:5432/postgres?pgbouncer=true

   # WRONG (Transaction Pooler - port 6543) - causes prepared statement errors
   postgresql://user:pass@aws-0-region.pooler.supabase.com:6543/postgres

   # WRONG (Direct - for migrations only)
   postgresql://user:pass@db.project.supabase.co:5432/postgres
   ```

   **Important:** Prisma uses prepared statements which are incompatible with Transaction pooler.
   Always use Session pooler (port 5432) with `?pgbouncer=true` query parameter.

2. **Check password encoding**
   - Special characters need URL encoding
   - `#` → `%23`, `@` → `%40`, etc.

3. **Verify Supabase project is active**
   - Paused projects return connection errors
   - Check dashboard: https://supabase.com/dashboard

4. **Use DIRECT_URL for migrations**
   ```env
   DATABASE_URL="postgresql://...@pooler.supabase.com:5432/postgres?pgbouncer=true"
   DIRECT_URL="postgresql://...@db.project.supabase.co:5432/postgres"
   ```

---

## Build Failures

### Symptoms
- `pnpm build` fails
- TypeScript errors
- Vercel deployment fails

### Solutions
1. **Always build locally first**
   ```bash
   pnpm build
   ```

2. **Rebuild shared package**
   ```bash
   pnpm --filter shared build
   ```

3. **Regenerate Prisma client**
   ```bash
   pnpm prisma generate
   ```

4. **Check TypeScript errors in all packages**
   ```bash
   pnpm tsc --noEmit
   ```

---

## Prisma Issues

### Schema changes not reflected
```bash
pnpm prisma db push
pnpm prisma generate
```

### Reset database (destructive)
```bash
pnpm prisma db push --force-reset
```

### View database
```bash
pnpm prisma studio
```

---

## Frontend Issues

### API calls failing
1. Check browser DevTools → Network tab
2. Verify token in request headers
3. Check CORS errors (should not happen with same-origin)

### Auth state not persisting
1. Check localStorage for `auth-storage` key
2. Clear and re-login
3. Check Zustand persist middleware in `authStore.ts`

### React Query cache stale
```typescript
// Force refetch
queryClient.invalidateQueries({ queryKey: ['subscriptions'] })
```

---

## Vercel Deployment

### Environment variables not working
1. Go to Vercel Dashboard → Project → Settings → Environment Variables
2. Verify no trailing whitespace
3. Redeploy after changes: `vercel --prod`

### Function timeout
- Vercel serverless has 10s timeout (hobby) / 60s (pro)
- Optimize slow database queries
- Add indexes in Prisma schema

### Check logs
```bash
vercel logs https://subscriber-gilt.vercel.app
```

---

## Quick Diagnostic Commands

```bash
# Check API health
curl https://subscriber-gilt.vercel.app/api/health

# Test local API
curl http://localhost:3001/api/health

# Check Prisma connection
pnpm prisma db pull

# View env vars (masked)
vercel env ls
```
