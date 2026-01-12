# Subscriber - Complete Startup Guide

## Tech Stack Overview

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **Frontend** | React | 18.x | UI Framework |
| **Frontend** | Vite | 6.x | Build Tool |
| **Frontend** | TypeScript | 5.x | Type Safety |
| **Frontend** | TailwindCSS | 3.x | Styling |
| **Frontend** | Lucide React | - | Icons |
| **Backend** | Express.js | 4.x | API Framework |
| **Backend** | Vercel Serverless | - | Hosting |
| **Database** | PostgreSQL | 15.x | Data Storage |
| **Database** | Prisma | 6.x | ORM |
| **Auth** | Supabase Auth | - | Authentication |
| **Monorepo** | Turborepo | 2.x | Build System |
| **Package Manager** | pnpm | 9.x | Dependencies |

---

## Service URLs & Dashboards

### Production
| Service | URL |
|---------|-----|
| **Live App** | https://subscriber-gilt.vercel.app |
| **API Health** | https://subscriber-gilt.vercel.app/api/health |

### Dashboards
| Service | Dashboard URL |
|---------|---------------|
| **Vercel** | https://vercel.com/aldos-projects-8cf34b67/subscriber |
| **Supabase** | https://supabase.com/dashboard/project/focqhiwagkajfubuyufk |
| **GitHub** | https://github.com/aldrinstellus/subscriber |

---

## Credentials & Environment Variables

### Supabase Project
| Key | Value |
|-----|-------|
| **Project Ref** | `focqhiwagkajfubuyufk` |
| **Region** | ap-south-1 (Mumbai) |
| **API URL** | `https://focqhiwagkajfubuyufk.supabase.co` |

### Database Connection
| Type | Connection String |
|------|-------------------|
| **Pooler (Transaction)** | `postgresql://postgres.focqhiwagkajfubuyufk:[PASSWORD]@aws-1-ap-south-1.pooler.supabase.com:6543/postgres` |
| **Pooler (Session)** | `postgresql://postgres.focqhiwagkajfubuyufk:[PASSWORD]@aws-1-ap-south-1.pooler.supabase.com:5432/postgres` |
| **Direct** | `postgresql://postgres:[PASSWORD]@db.focqhiwagkajfubuyufk.supabase.co:5432/postgres` |

**Note:** Use Transaction Pooler (port 6543) for serverless deployments.

### Environment Variables Required

#### Frontend (Vite)
```env
VITE_SUPABASE_URL=https://focqhiwagkajfubuyufk.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Backend (API)
```env
DATABASE_URL=postgresql://postgres.focqhiwagkajfubuyufk:[PASSWORD]@aws-1-ap-south-1.pooler.supabase.com:6543/postgres
SUPABASE_URL=https://focqhiwagkajfubuyufk.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Test Account

| Field | Value |
|-------|-------|
| **Email** | test@subscriber.app |
| **Password** | TestPassword123! |

---

## Project Structure

```
subscriber/
├── api/
│   └── index.ts              # Vercel serverless API (Express)
├── apps/
│   ├── api/                  # API package (unused in Vercel)
│   │   └── package.json
│   └── web/                  # React frontend
│       ├── src/
│       │   ├── components/   # UI components
│       │   ├── contexts/     # React contexts (Auth)
│       │   ├── hooks/        # Custom hooks
│       │   ├── lib/          # Supabase client
│       │   ├── pages/        # Page components
│       │   └── services/     # API service layer
│       ├── package.json
│       └── vite.config.ts
├── packages/
│   └── shared/               # Shared types/utilities
├── prisma/
│   └── schema.prisma         # Database schema
├── package.json              # Root package.json
├── pnpm-lock.yaml            # Dependency lock file
├── pnpm-workspace.yaml       # Workspace config
├── turbo.json                # Turborepo config
├── vercel.json               # Vercel deployment config
├── FIXES.md                  # Bug fixes documentation
└── STARTUP.md                # This file
```

---

## Database Schema

### Models
| Model | Description |
|-------|-------------|
| **User** | User accounts with Supabase auth link |
| **Subscription** | User's subscriptions |
| **Category** | Subscription categories |
| **ConnectedAccount** | OAuth connected email accounts |
| **ImportHistory** | Email import history |
| **NotificationSettings** | User notification preferences |

### Key Fields (User)
```prisma
model User {
  id                  String    @id @default(cuid())
  supabaseId          String?   @unique
  email               String    @unique
  name                String?
  currency            String    @default("USD")
  timezone            String    @default("UTC")
  onboardingCompleted Boolean   @default(false)
}
```

---

## API Endpoints

### Public
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |

### Auth Required
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auth/me` | Get current user |
| POST | `/api/user/complete-onboarding` | Mark onboarding complete |
| GET | `/api/subscriptions` | List subscriptions |
| POST | `/api/subscriptions` | Create subscription |
| PUT | `/api/subscriptions/:id` | Update subscription |
| DELETE | `/api/subscriptions/:id` | Delete subscription |
| GET | `/api/categories` | List categories |
| POST | `/api/categories` | Create category |
| GET | `/api/analytics/summary` | Get analytics summary |

---

## Local Development Setup

### Prerequisites
- Node.js >= 20.0.0
- pnpm >= 9.x
- Git

### Step 1: Clone Repository
```bash
git clone https://github.com/aldrinstellus/subscriber.git
cd subscriber
```

### Step 2: Install Dependencies
```bash
pnpm install
```

### Step 3: Setup Environment
Create `apps/web/.env`:
```env
VITE_SUPABASE_URL=https://focqhiwagkajfubuyufk.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

Create `apps/api/.env`:
```env
DATABASE_URL=postgresql://postgres.focqhiwagkajfubuyufk:<password>@aws-1-ap-south-1.pooler.supabase.com:6543/postgres
SUPABASE_URL=https://focqhiwagkajfubuyufk.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

### Step 4: Generate Prisma Client
```bash
pnpm prisma generate
```

### Step 5: Start Development Server
```bash
pnpm dev
```

Frontend: http://localhost:5173
API: Served via Vercel dev or local Express

---

## Deployment

### Vercel (Production)
The app auto-deploys on push to `master` branch.

Manual deploy:
```bash
vercel deploy --prod
```

### Environment Variables on Vercel
Set these in Vercel Dashboard > Settings > Environment Variables:
- `DATABASE_URL`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

**Important:** Do NOT include trailing newlines in env values.

---

## Common Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm prisma studio` | Open Prisma database GUI |
| `pnpm prisma db push` | Push schema to database |
| `pnpm prisma generate` | Generate Prisma client |
| `vercel deploy --prod` | Deploy to production |
| `vercel env ls` | List environment variables |
| `vercel logs <url>` | View deployment logs |

---

## Troubleshooting

### 401 Authentication Errors
1. Check Supabase env vars don't have trailing `\n`
2. Verify `SUPABASE_SERVICE_ROLE_KEY` is correct
3. Check database connection with `prisma db push`

### Database Connection Issues
1. Use Pooler connection string (not direct)
2. Use port `6543` for Transaction mode
3. Verify password in connection string

### Cold Start Issues
The frontend has retry logic for 401s to handle serverless cold starts.

---

## Recent Fixes Applied

See `FIXES.md` for detailed documentation of:
1. DATABASE_URL connection string fix
2. Database tables creation
3. Complete onboarding endpoint
4. Auth/Me response update
5. Frontend 401 interceptor retry logic
6. Error logging improvements
7. Vercel env vars trailing newline fix

---

## Support & Resources

| Resource | URL |
|----------|-----|
| Supabase Docs | https://supabase.com/docs |
| Prisma Docs | https://www.prisma.io/docs |
| Vercel Docs | https://vercel.com/docs |
| Turborepo Docs | https://turbo.build/repo/docs |
| React Docs | https://react.dev |
| Vite Docs | https://vitejs.dev |
