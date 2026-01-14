# System Architecture

## Overview
Monorepo using pnpm workspaces + Turborepo for build orchestration.

## Request Flow
```
Browser → Vite Dev Server (localhost:5173)
       → /api/* proxied to Vercel Function
       → Express Router (/api/index.ts)
       → Prisma ORM
       → Supabase PostgreSQL
```

## Authentication Flow
```
1. User clicks "Sign In" → Supabase Auth UI
2. Supabase authenticates (Google OAuth or Email/Password)
3. Frontend receives JWT access token
4. Token stored in Zustand authStore (persisted to localStorage)
5. API requests include: Authorization: Bearer <token>
6. Backend middleware validates token with Supabase service key
7. User auto-created/synced in local Prisma database
8. req.userId available in route handlers
```

## Key Files

| File | Purpose |
|------|---------|
| `/api/index.ts` | Main API entry (Express on Vercel) |
| `/apps/web/src/lib/supabase.ts` | Supabase client initialization |
| `/apps/web/src/services/api.ts` | Axios client with auth interceptor |
| `/apps/web/src/stores/authStore.ts` | Zustand auth state (persisted) |
| `/packages/shared/src/validation.ts` | Zod schemas (shared) |
| `/packages/shared/src/types.ts` | TypeScript interfaces |
| `/prisma/schema.prisma` | Database models |

## Database Models

| Model | Purpose |
|-------|---------|
| User | App user (linked to Supabase via supabaseId) |
| Subscription | Core entity - user's subscriptions |
| Category | User-defined categories for organizing |
| Account | Payment accounts (Personal, Work, Family) |
| ConnectedAccount | OAuth integrations (Gmail, Outlook) |
| PriceHistory | Tracks subscription cost changes |
| Reminder | Renewal notification settings |
| NotificationSettings | User notification preferences |
| ImportHistory | Data import tracking |
| ServiceDatabase | Reference data for subscription services |

## State Management

| Layer | Tool | Purpose |
|-------|------|---------|
| Auth State | Zustand | User session, token (persisted) |
| Server Data | React Query | Subscriptions, categories, analytics |
| Forms | React state + Zod | Form validation |
| UI State | React state | Modals, filters, pagination |

## API Response Pattern
```typescript
// Success
{ success: true, data: T }

// Error
{ success: false, error: string, message?: string }

// Paginated
{
  success: true,
  data: {
    items: T[],
    total: number,
    page: number,
    pageSize: number,
    totalPages: number
  }
}
```

## Environment Variables

| Variable | Location | Purpose |
|----------|----------|---------|
| DATABASE_URL | /.env | Supabase Pooler connection |
| SUPABASE_URL | /.env | Supabase project URL |
| SUPABASE_SERVICE_ROLE_KEY | /.env | Backend auth validation |
| VITE_SUPABASE_URL | /apps/web/.env | Frontend Supabase client |
| VITE_SUPABASE_ANON_KEY | /apps/web/.env | Frontend public key |
