# Subscriber

A comprehensive subscription tracking application that helps you discover, track, and analyze all your recurring subscriptions.

## Features

- **Manual Subscription Management** - Add, edit, and delete subscriptions
- **Dashboard Overview** - See total spend, upcoming renewals, and more
- **Category Organization** - Organize subscriptions by type
- **Analytics** - Deep dive into spending patterns
- **Renewal Reminders** - Never miss a billing date
- **Multi-currency Support** - Track international subscriptions

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, TailwindCSS, React Query, Zustand
- **Backend**: Node.js, Express, TypeScript, Prisma ORM
- **Database**: PostgreSQL (production) / SQLite (development)
- **Monorepo**: Turborepo with pnpm workspaces

## Project Structure

```
subscriber/
├── apps/
│   ├── api/          # Express backend
│   └── web/          # React frontend
├── packages/
│   ├── shared/       # Shared types & utilities
│   ├── email-parser/ # Email parsing (Phase 2)
│   └── bank-parser/  # Bank statement parsing (Phase 2)
├── prisma/           # Database schema
└── ...config files
```

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- PostgreSQL 15+ (or use SQLite for dev)

### Installation

```bash
# Clone the repo
git clone <repo-url>
cd subscriber

# Install dependencies
pnpm install

# Set up environment
cp .env.example .env
# Edit .env with your database URL and secrets

# Push database schema
pnpm db:push

# Generate Prisma client
pnpm db:generate

# Start development servers
pnpm dev
```

### Environment Variables

Copy `.env.example` to `.env` and configure:

```env
DATABASE_URL="postgresql://..."
JWT_SECRET="your-secret-key"
```

## Development

```bash
# Start all services
pnpm dev

# Run API only
pnpm --filter api dev

# Run web only
pnpm --filter web dev

# Build all
pnpm build

# Run tests
pnpm test
```

## API Endpoints

### Auth
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Subscriptions
- `GET /api/subscriptions` - List subscriptions
- `GET /api/subscriptions/:id` - Get subscription
- `POST /api/subscriptions` - Create subscription
- `PATCH /api/subscriptions/:id` - Update subscription
- `DELETE /api/subscriptions/:id` - Delete subscription

### Categories
- `GET /api/categories` - List categories
- `POST /api/categories` - Create category
- `PATCH /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

### Analytics
- `GET /api/analytics/summary` - Get spending summary
- `GET /api/analytics/trend` - Get monthly trend

## Roadmap

### Phase 1: MVP (Current)
- [x] User authentication
- [x] Manual subscription CRUD
- [x] Dashboard with stats
- [x] Category management
- [ ] Renewal reminders

### Phase 2: Smart Discovery
- [ ] Gmail integration
- [ ] Email receipt parsing
- [ ] Bank statement import
- [ ] Browser extension

### Phase 3: Advanced
- [ ] Plaid integration
- [ ] Mobile app
- [ ] AI categorization
- [ ] Subscription recommendations

## License

MIT
