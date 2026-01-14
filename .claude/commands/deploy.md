# Deploy to Production

Deploy the subscriber application to Vercel.

## Pre-Deployment Checklist
- [ ] All changes committed to master
- [ ] `pnpm build` passes locally
- [ ] No TypeScript errors
- [ ] Tested locally with `pnpm dev`

## Deployment

### Automatic (Recommended)
Push to master branch - Vercel auto-deploys:
```bash
git push origin master
```

### Manual
```bash
vercel deploy --prod
```

## Post-Deployment Verification

1. **Health Check**
   ```bash
   curl https://subscriber-gilt.vercel.app/api/health
   ```

2. **Check Vercel Dashboard**
   - https://vercel.com/dashboard
   - Review deployment logs for errors

3. **Test Auth Flow**
   - Sign out and sign in on production
   - Verify subscriptions load

4. **Check Logs**
   ```bash
   vercel logs https://subscriber-gilt.vercel.app
   ```

## Rollback
If issues found:
```bash
vercel rollback
```

## Environment Variables
If env vars changed, verify in Vercel Dashboard:
- Settings → Environment Variables
- Redeploy after changes

## Request: $ARGUMENTS
