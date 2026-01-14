# Subscriber - Project Context

## WHAT
Subscription tracking application that helps users discover, track, and analyze recurring subscriptions through email scanning and manual entry.

**Tech Stack:**
- **Frontend:** React 18 + TypeScript + Vite + TailwindCSS + React Query + Zustand
- **Backend:** Express + TypeScript + Prisma ORM
- **Database:** PostgreSQL (Supabase) with PgBouncer connection pooling
- **Auth:** Supabase Auth (Email/Password + Google OAuth)
- **Email Integration:** Gmail OAuth + Outlook/Microsoft OAuth
- **Deployment:** Vercel (auto-deploys from master branch)

## WHY
- **Monorepo (Turborepo):** Shared types/validation between frontend and backend
- **Supabase:** Managed auth + PostgreSQL hosting + connection pooling
- **Vercel Serverless:** Zero-config deployment, auto-scaling
- **Prisma:** Type-safe database queries, declarative schema
- **Session Pooler:** PgBouncer (port 5432) for Prisma prepared statement compatibility

## Project Structure
```
subscriber/
├── api/index.ts                    # Vercel serverless API entry
├── apps/
│   ├── api/src/                    # Express API (local dev)
│   │   ├── routes/                 # API route handlers
│   │   │   ├── auth.ts             # Gmail/Outlook OAuth
│   │   │   ├── user.ts             # User profile, settings
│   │   │   ├── subscriptions.ts    # CRUD subscriptions
│   │   │   └── analytics.ts        # Spending analytics
│   │   ├── middleware/auth.ts      # Supabase JWT validation
│   │   └── services/prisma.ts      # Prisma client instance
│   └── web/src/                    # React frontend
│       ├── components/             # Reusable UI components
│       │   ├── AuthProvider.tsx    # Supabase auth context
│       │   ├── OnboardingCheck.tsx # Redirect if not onboarded
│       │   └── Layout.tsx          # App shell with sidebar
│       ├── pages/                  # Route pages
│       │   ├── Dashboard.tsx       # Overview, stats, charts
│       │   ├── Subscriptions.tsx   # List, add, edit
│       │   ├── Onboarding.tsx      # Email connection flow
│       │   └── Settings.tsx        # Profile, preferences
│       ├── services/api.ts         # Axios client + auth interceptor
│       └── lib/supabase.ts         # Supabase client config
├── packages/shared/                # Shared types & Zod schemas
├── prisma/schema.prisma            # Database models (10 tables)
└── agent_docs/                     # Detailed documentation
```

## Key Commands
```bash
# Development
pnpm dev                  # Start frontend (:5173) + API (:3001)
pnpm build                # Production build (required before commit!)
pnpm lint                 # ESLint check

# Database
pnpm prisma studio        # Database GUI
pnpm prisma db push       # Push schema changes (dev)
pnpm prisma generate      # Regenerate Prisma client
pnpm prisma migrate dev   # Create migration (production)

# Testing
pnpm test                 # Run unit tests
pnpm test:e2e             # Run Playwright E2E tests
```

## Environment Files
| File | Purpose |
|------|---------|
| `/.env` | DATABASE_URL (session pooler), SUPABASE_SERVICE_ROLE_KEY |
| `/apps/api/.env` | Google/Microsoft OAuth credentials, CORS settings |
| `/apps/web/.env` | VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY |

**Important:** Use Session pooler (port 5432) with `?pgbouncer=true` for DATABASE_URL.

## Database Schema
10 tables: `users`, `subscriptions`, `categories`, `accounts`, `connected_accounts`, `price_history`, `reminders`, `notification_settings`, `import_history`, `service_database`

See `agent_docs/db-schema.md` for complete ERD and table definitions.

## Architecture Decisions

### Auth Flow
1. User signs in via Supabase (email or Google OAuth)
2. Frontend gets Supabase JWT access token
3. API validates JWT using Supabase service role key
4. User auto-synced to Prisma `users` table on first API call

### Email Connection Flow
1. User clicks "Connect Gmail/Outlook" on onboarding
2. API generates OAuth URL with user ID in state
3. User grants permissions on Google/Microsoft
4. Callback saves tokens to `connected_accounts` table
5. Redirects to `/onboarding?connected=gmail`

### State Management
- **Zustand:** Auth state (persisted to localStorage)
- **React Query:** Server data (subscriptions, analytics)

### API Response Pattern
```typescript
{ success: boolean, data?: T, error?: string, message?: string }
```

## Live URLs
- **App:** https://subscriber-gilt.vercel.app
- **Supabase Dashboard:** https://supabase.com/dashboard/project/focqhiwagkajfubuyufk

## Common Issues

### "prepared statement 's0' already exists"
Use Session pooler (port 5432) with `?pgbouncer=true`, not Transaction pooler (port 6543).

### 401 Unauthorized on API calls
- Check Supabase session is valid
- API retries once on 401 (handles cold start)
- See `apps/web/src/services/api.ts` for interceptor logic

### Onboarding redirect loop
- Check `onboardingCompleted` flag in database
- See `OnboardingCheck.tsx` for redirect logic

## See Also
- `CLAUDE.md` - Agent execution instructions
- `agent_docs/architecture.md` - Detailed system design
- `agent_docs/api-reference.md` - API endpoints reference
- `agent_docs/db-schema.md` - Database schema & ERD
- `agent_docs/troubleshooting.md` - Common issues & solutions
- `DEVELOPMENT_PLAN.md` - Feature roadmap
