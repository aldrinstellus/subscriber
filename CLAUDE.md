# Claude Code Instructions

## Execution Style
- Autonomous execution - don't ask for permissions, just get it done
- Full spectrum automated testing until perfect
- Iterate: check, refactor, improve until flawless

## Browser Automation
- Maximum ONE browser instance at a time
- Prefer non-browser methods (MCP tools, CLI, APIs) over browser automation
- Always close browser when done
- Never use multiple browser tools (playwright, chrome-devtools) in parallel

## Important Notes
- API code lives in `/api/index.ts` (Vercel serverless entry point)
- Frontend API calls go through `/apps/web/src/services/api.ts`
- Shared types/validation in `/packages/shared/`
- Always run `pnpm build` before committing to catch TypeScript errors
- Use Session Pooler (port 5432) with `?pgbouncer=true` for Supabase (NOT Transaction Pooler port 6543)

## Quick Commands
```bash
pnpm dev              # Frontend :5173, API :3001
pnpm build            # Production build (required before commit)
pnpm prisma studio    # Database GUI
pnpm prisma db push   # Push schema changes
```

## Documentation
- `context.md` - Full project context (WHAT, WHY, HOW)
- `agent_docs/` - Detailed documentation
  - `architecture.md` - System design
  - `api-reference.md` - API endpoints
  - `troubleshooting.md` - Common issues
- `DEVELOPMENT_PLAN.md` - Feature roadmap

## Live URLs
- **App:** https://subscriber-gilt.vercel.app
- **Supabase:** https://supabase.com/dashboard/project/focqhiwagkajfubuyufk
