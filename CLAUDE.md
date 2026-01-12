# Claude Code Instructions

## Browser Automation
- Maximum ONE browser instance at a time
- Prefer non-browser methods (MCP tools, CLI, APIs) over browser automation
- Always close browser when done
- Never use multiple browser tools (playwright, chrome-devtools) in parallel

## Project Info
- **Stack:** React + Vite frontend, Express API, Prisma ORM, Supabase (Auth + PostgreSQL)
- **Package Manager:** pnpm (monorepo with Turborepo)
- **Deployment:** Vercel (auto-deploys from master branch)
- **Live URL:** https://subscriber-gilt.vercel.app

## Development
```bash
pnpm dev          # Start dev servers (frontend :5173, API :3001)
pnpm build        # Production build
pnpm prisma studio # Database GUI
```

## Environment Files
- `/.env` - Root (DATABASE_URL, Supabase credentials)
- `/apps/web/.env` - Frontend (VITE_SUPABASE_*)
- `/apps/api/.env` - Backend API
