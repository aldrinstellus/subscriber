# Deploying Subscriber to Vercel

This guide covers deploying the Subscriber app to Vercel with a PostgreSQL database.

## Prerequisites

- [Vercel account](https://vercel.com/signup)
- [Vercel CLI](https://vercel.com/cli) installed (`npm i -g vercel`)
- PostgreSQL database (recommended: [Neon](https://neon.tech), [Supabase](https://supabase.com), or [PlanetScale](https://planetscale.com))

## Database Setup

### Option 1: Neon (Recommended)
1. Create account at [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string (looks like `postgresql://user:pass@host/db?sslmode=require`)

### Option 2: Supabase
1. Create account at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings → Database → Connection string → URI

### Option 3: Vercel Postgres
1. In Vercel dashboard, go to Storage
2. Create a new Postgres database
3. Connection string is auto-configured

## Deployment Steps

### 1. Install Vercel CLI
```bash
npm i -g vercel
```

### 2. Login to Vercel
```bash
vercel login
```

### 3. Link Project
```bash
cd subscriber
vercel link
```

### 4. Set Environment Variables

In Vercel Dashboard → Project → Settings → Environment Variables, add:

| Variable | Value | Description |
|----------|-------|-------------|
| `DATABASE_URL` | `postgresql://...` | Your PostgreSQL connection string |
| `JWT_SECRET` | `your-secret-key` | Random 32+ character string for JWT |
| `VITE_API_URL` | `/api` | API endpoint (use `/api` for same-origin) |

Generate a secure JWT secret:
```bash
openssl rand -base64 32
```

### 5. Deploy

```bash
# Preview deployment
vercel

# Production deployment
vercel --prod
```

### 6. Run Database Migrations

After first deployment, run Prisma migrations:

```bash
# Option A: Using Vercel CLI
vercel env pull .env.local
npx prisma db push

# Option B: Manually with connection string
DATABASE_URL="your-connection-string" npx prisma db push
```

### 7. Seed Demo Data (Optional)

```bash
DATABASE_URL="your-connection-string" npx tsx prisma/seed.ts
```

## Project Structure for Vercel

```
subscriber/
├── api/                    # Vercel Serverless Functions
│   ├── index.ts           # Main API handler (Express)
│   └── [...path].ts       # Catch-all route
├── apps/
│   └── web/               # Frontend (Vite + React)
├── prisma/
│   └── schema.prisma      # Database schema
└── vercel.json            # Vercel configuration
```

## Environment Variables Reference

### Production (Vercel)
```env
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
JWT_SECRET=your-super-secret-jwt-key-at-least-32-chars
VITE_API_URL=/api
```

### Local Development
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/subscriber
JWT_SECRET=dev-secret-change-in-production
VITE_API_URL=http://localhost:3001/api
```

## Troubleshooting

### "Module not found" errors
Make sure all dependencies are in `dependencies` (not `devDependencies`) for serverless functions.

### Database connection issues
- Check that `DATABASE_URL` is set correctly
- Ensure SSL is enabled (`?sslmode=require` in connection string)
- Verify IP allowlist includes Vercel's IPs (or allow all: `0.0.0.0/0`)

### CORS issues
The `vercel.json` includes CORS headers. If issues persist, check:
- `Access-Control-Allow-Origin` header
- Preflight `OPTIONS` requests are handled

### Cold starts
Serverless functions have cold starts. To minimize:
- Keep functions small
- Use `maxDuration: 10` in `vercel.json`
- Consider Vercel Edge Functions for faster response

## Useful Commands

```bash
# View logs
vercel logs

# List deployments
vercel ls

# Rollback to previous deployment
vercel rollback

# View environment variables
vercel env ls
```

## Custom Domain

1. Go to Vercel Dashboard → Project → Settings → Domains
2. Add your domain
3. Update DNS records as instructed
4. SSL is automatically provisioned

## Monitoring

Vercel provides built-in analytics:
- **Analytics**: Page views, visitors, performance
- **Logs**: Real-time function logs
- **Speed Insights**: Core Web Vitals

Enable in Project Settings → Analytics.
