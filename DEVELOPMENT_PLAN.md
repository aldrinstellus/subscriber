# Subscriber - Subscription Tracking Application
## Development Plan

---

## 1. Executive Summary

**Subscriber** is a comprehensive subscription tracking application that automatically discovers, tracks, and analyzes all your recurring subscriptions across multiple data sources. The app scans browser history, parses email receipts, integrates with bank statements, and allows manual entry to create a unified view of your subscription spending.

**Key Value Propositions:**
- Automatic discovery of subscriptions from multiple sources
- Real-time spending analytics and forecasting
- Renewal reminders and cancellation tracking
- Multi-account and family plan support
- Export capabilities for budgeting tools

---

## 2. Core Features

### Must-Have (MVP)
| Feature | Description |
|---------|-------------|
| Manual Subscription Entry | Add/edit/delete subscriptions with full details |
| Dashboard Overview | Total spend, upcoming renewals, subscription count |
| Subscription Categories | Organize by type (streaming, software, gaming, etc.) |
| Billing Frequency Support | Free, trial, weekly, monthly, quarterly, yearly |
| Renewal Reminders | Email/push notifications before renewal dates |
| Basic Analytics | Monthly/yearly spend breakdown by category |
| User Authentication | Secure login with email/password |
| Data Export | CSV/JSON export of all subscriptions |

### Should-Have (Phase 2)
| Feature | Description |
|---------|-------------|
| Email Parsing | Scan Gmail/Outlook for subscription receipts |
| Browser Extension | Detect subscriptions from browsing activity |
| Bank Statement Import | Parse CSV/OFX bank statements |
| Price Change Tracking | Alert when subscription prices change |
| Subscription Recommendations | Suggest alternatives or bundle savings |
| Multi-currency Support | Handle international subscriptions |
| Sharing/Family Plans | Track shared subscriptions with cost splitting |

### Nice-to-Have (Phase 3)
| Feature | Description |
|---------|-------------|
| Plaid Integration | Direct bank account connection |
| Mobile App | iOS/Android companion apps |
| Subscription Marketplace | Compare services and find deals |
| AI-powered Categorization | Auto-categorize new subscriptions |
| Cancellation Assistance | Track cancellation processes |

---

## 3. Technical Architecture

### Technology Stack

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│  React 18 + TypeScript + Vite + TailwindCSS + React Query   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        BACKEND                               │
│  Node.js + Express + TypeScript + Prisma ORM                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       DATABASE                               │
│  PostgreSQL (Production) / SQLite (Development)             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                         │
│  Gmail API │ Plaid │ SendGrid │ Redis │ S3                  │
└─────────────────────────────────────────────────────────────┘
```

### Project Structure

```
subscriber/
├── apps/
│   ├── web/                    # React frontend
│   │   ├── src/
│   │   │   ├── components/     # UI components
│   │   │   ├── pages/          # Route pages
│   │   │   ├── hooks/          # Custom React hooks
│   │   │   ├── services/       # API client
│   │   │   ├── stores/         # State management
│   │   │   └── utils/          # Helpers
│   │   └── package.json
│   │
│   ├── api/                    # Express backend
│   │   ├── src/
│   │   │   ├── controllers/    # Route handlers
│   │   │   ├── services/       # Business logic
│   │   │   ├── models/         # Data models
│   │   │   ├── middleware/     # Auth, validation
│   │   │   ├── jobs/           # Background tasks
│   │   │   └── integrations/   # External APIs
│   │   └── package.json
│   │
│   └── extension/              # Browser extension
│       ├── manifest.json
│       ├── background.js
│       └── content.js
│
├── packages/
│   ├── shared/                 # Shared types & utils
│   ├── email-parser/           # Email parsing logic
│   └── bank-parser/            # Bank statement parser
│
├── prisma/
│   └── schema.prisma           # Database schema
│
├── docker-compose.yml
├── turbo.json                  # Monorepo config
└── package.json
```

---

## 4. Data Collection Strategy

### 4.1 Manual Entry Interface
- Form with autocomplete for common services (Netflix, Spotify, etc.)
- Service logo/icon lookup via Clearbit or similar API
- Smart defaults based on service selection
- Bulk import via CSV template

### 4.2 Email Parsing Strategy
```
Gmail/Outlook OAuth → Fetch Emails → Filter Receipts → Extract Data → Match Services
```

**Email Patterns to Detect:**
- Subject line keywords: "receipt", "invoice", "subscription", "renewal", "payment"
- Sender domains from known services
- Price patterns in email body (regex: `\$[\d,]+\.?\d*`)
- Date patterns for billing cycles

**Privacy Considerations:**
- OAuth with minimal scope (read-only, specific labels)
- Process emails on-device when possible
- Never store full email content, only extracted metadata
- Clear consent UI explaining what data is accessed

### 4.3 Browser Integration
**Extension Capabilities:**
- Detect visits to subscription management pages
- Capture subscription confirmations on checkout pages
- Monitor for price change indicators
- Track login frequency to services

**Data Captured:**
- Domain visited (e.g., netflix.com/account)
- Page title indicating subscription status
- No sensitive form data or passwords

### 4.4 Bank Statement Import
**Supported Formats:**
- CSV (universal)
- OFX/QFX (Quicken format)
- PDF parsing (OCR for statements)

**Matching Algorithm:**
1. Extract merchant names from transactions
2. Match against known subscription services database
3. Identify recurring patterns (same amount, regular intervals)
4. Flag potential subscriptions for user confirmation

---

## 5. Database Schema

### Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String         @id @default(cuid())
  email         String         @unique
  passwordHash  String
  name          String?
  currency      String         @default("USD")
  timezone      String         @default("UTC")
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt

  subscriptions Subscription[]
  accounts      Account[]
  categories    Category[]
  notifications NotificationSettings?
  importHistory ImportHistory[]
}

model Subscription {
  id              String             @id @default(cuid())
  userId          String
  user            User               @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Basic Info
  name            String
  description     String?
  logoUrl         String?
  websiteUrl      String?

  // Billing
  cost            Decimal            @db.Decimal(10, 2)
  currency        String             @default("USD")
  billingCycle    BillingCycle
  billingDay      Int?               // Day of month/week for billing

  // Dates
  startDate       DateTime
  endDate         DateTime?          // For cancelled/expired
  nextBillingDate DateTime?
  trialEndDate    DateTime?

  // Status
  status          SubscriptionStatus @default(ACTIVE)
  autoRenew       Boolean            @default(true)

  // Organization
  categoryId      String?
  category        Category?          @relation(fields: [categoryId], references: [id])
  accountId       String?
  account         Account?           @relation(fields: [accountId], references: [id])

  // Sharing
  isShared        Boolean            @default(false)
  sharedWith      Json?              // Array of {name, email, splitAmount}

  // Source tracking
  source          DataSource         @default(MANUAL)
  sourceId        String?            // External reference ID

  // Metadata
  notes           String?
  tags            String[]
  customFields    Json?

  createdAt       DateTime           @default(now())
  updatedAt       DateTime           @updatedAt

  priceHistory    PriceHistory[]
  reminders       Reminder[]

  @@index([userId, status])
  @@index([nextBillingDate])
}

model Category {
  id            String         @id @default(cuid())
  userId        String
  user          User           @relation(fields: [userId], references: [id], onDelete: Cascade)

  name          String
  icon          String?
  color         String?
  budget        Decimal?       @db.Decimal(10, 2)

  subscriptions Subscription[]

  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt

  @@unique([userId, name])
}

model Account {
  id            String         @id @default(cuid())
  userId        String
  user          User           @relation(fields: [userId], references: [id], onDelete: Cascade)

  name          String         // e.g., "Personal Gmail", "Work Account"
  email         String?
  type          AccountType

  subscriptions Subscription[]

  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt

  @@unique([userId, name])
}

model PriceHistory {
  id             String       @id @default(cuid())
  subscriptionId String
  subscription   Subscription @relation(fields: [subscriptionId], references: [id], onDelete: Cascade)

  previousCost   Decimal      @db.Decimal(10, 2)
  newCost        Decimal      @db.Decimal(10, 2)
  changedAt      DateTime     @default(now())
  source         DataSource   @default(MANUAL)

  @@index([subscriptionId, changedAt])
}

model Reminder {
  id             String       @id @default(cuid())
  subscriptionId String
  subscription   Subscription @relation(fields: [subscriptionId], references: [id], onDelete: Cascade)

  daysBefore     Int          @default(3)
  channel        ReminderChannel
  enabled        Boolean      @default(true)
  lastSentAt     DateTime?

  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt

  @@unique([subscriptionId, daysBefore, channel])
}

model NotificationSettings {
  id                    String   @id @default(cuid())
  userId                String   @unique
  user                  User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  emailEnabled          Boolean  @default(true)
  pushEnabled           Boolean  @default(false)
  renewalReminders      Boolean  @default(true)
  priceChangeAlerts     Boolean  @default(true)
  weeklyDigest          Boolean  @default(false)
  monthlyReport         Boolean  @default(true)

  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
}

model ImportHistory {
  id          String       @id @default(cuid())
  userId      String
  user        User         @relation(fields: [userId], references: [id], onDelete: Cascade)

  source      DataSource
  filename    String?
  status      ImportStatus
  itemsFound  Int          @default(0)
  itemsAdded  Int          @default(0)
  errors      Json?

  startedAt   DateTime     @default(now())
  completedAt DateTime?
}

model ServiceDatabase {
  id           String   @id @default(cuid())
  name         String   @unique
  aliases      String[]
  logoUrl      String?
  websiteUrl   String?
  category     String?
  typicalCost  Decimal? @db.Decimal(10, 2)
  billingCycle BillingCycle?

  // Matching patterns
  emailDomains String[]
  merchantNames String[]
  urlPatterns  String[]

  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@index([name])
}

// Enums

enum BillingCycle {
  FREE
  TRIAL
  WEEKLY
  BIWEEKLY
  MONTHLY
  QUARTERLY
  BIANNUAL
  YEARLY
  LIFETIME
  CUSTOM
}

enum SubscriptionStatus {
  ACTIVE
  PAUSED
  CANCELLED
  EXPIRED
  TRIAL
  PENDING
}

enum DataSource {
  MANUAL
  EMAIL
  BROWSER
  BANK_IMPORT
  PLAID
  API
}

enum AccountType {
  PERSONAL
  WORK
  FAMILY
  OTHER
}

enum ReminderChannel {
  EMAIL
  PUSH
  SMS
}

enum ImportStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
}
```

---

## 6. Analytics & Reporting

### Key Metrics Dashboard

| Metric | Calculation | Visualization |
|--------|-------------|---------------|
| Total Monthly Spend | Sum of all active subscriptions normalized to monthly | Large number card |
| Total Yearly Spend | Monthly × 12 + yearly subscriptions | Large number card |
| Spend by Category | Group by category, sum costs | Pie/Donut chart |
| Monthly Trend | Last 12 months spending | Line chart |
| Upcoming Renewals | Next 30 days renewals | Timeline/List |
| Subscription Count | Active vs total | Stat with breakdown |
| Most Expensive | Top 5 by cost | Ranked list |
| Recently Added | Last 10 additions | Activity feed |
| Price Changes | Recent increases/decreases | Alert list |
| Unused Subscriptions | No browser activity in 30+ days | Warning list |

### Export Capabilities
- **CSV Export**: All subscriptions with full details
- **JSON Export**: Structured data for API consumption
- **PDF Report**: Monthly/yearly summary with charts
- **Calendar Export**: iCal feed for renewal dates
- **Budget App Integration**: YNAB, Mint format exports

---

## 7. User Interface Design

### Dashboard Layout

```
┌────────────────────────────────────────────────────────────────┐
│  HEADER: Logo │ Search │ Add Subscription │ Settings │ Profile │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐           │
│  │ $247.99/mo   │ │ $2,975/yr    │ │ 23 Active    │           │
│  │ Monthly      │ │ Yearly       │ │ Subscriptions│           │
│  └──────────────┘ └──────────────┘ └──────────────┘           │
│                                                                │
│  ┌─────────────────────────────┐ ┌────────────────────────────┤
│  │                             │ │ UPCOMING RENEWALS          │
│  │   SPENDING BY CATEGORY      │ │ ─────────────────          │
│  │        [PIE CHART]          │ │ □ Netflix     $15.99  3d   │
│  │                             │ │ □ Spotify      $9.99  5d   │
│  │                             │ │ □ GitHub      $4.00   7d   │
│  └─────────────────────────────┘ └────────────────────────────┤
│                                                                │
│  SUBSCRIPTIONS                              Filter │ Sort │    │
│  ──────────────────────────────────────────────────────────   │
│  ┌────────────────────────────────────────────────────────┐   │
│  │ [Logo] Netflix        Streaming    $15.99/mo   Active  │   │
│  │ [Logo] Spotify        Music        $9.99/mo    Active  │   │
│  │ [Logo] Adobe CC       Software     $54.99/mo   Active  │   │
│  │ [Logo] ChatGPT Plus   AI           $20.00/mo   Active  │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Key Pages
1. **Dashboard** - Overview with stats and quick actions
2. **Subscriptions List** - Full list with filtering/sorting
3. **Subscription Detail** - Single subscription with history
4. **Add/Edit Subscription** - Form with service autocomplete
5. **Analytics** - Deep dive into spending patterns
6. **Import** - Email/bank statement import wizards
7. **Settings** - Notifications, accounts, preferences
8. **Profile** - User settings, export, delete account

---

## 8. Security & Privacy

### Authentication
- **Password**: bcrypt hashing with salt rounds = 12
- **Sessions**: JWT with 7-day expiry, HTTP-only cookies
- **OAuth**: Google/GitHub SSO option
- **2FA**: TOTP-based two-factor authentication (optional)

### Data Protection
```
┌─────────────────────────────────────────────┐
│           SECURITY LAYERS                    │
├─────────────────────────────────────────────┤
│ Transport: TLS 1.3 (HTTPS only)             │
│ Storage: AES-256 encryption at rest         │
│ Database: Row-level security (RLS)          │
│ API: Rate limiting + CORS                   │
│ Input: Sanitization + validation            │
└─────────────────────────────────────────────┘
```

### Privacy Measures
- Email scanning uses OAuth with minimal scopes
- No full email content stored—only extracted metadata
- Bank data processed client-side, only results sent
- Clear data deletion with 30-day retention policy
- GDPR/CCPA compliant data export and deletion
- Transparent privacy policy with consent flows

### Sensitive Data Handling
- Credit card numbers: NEVER stored
- Bank account numbers: Encrypted, optional
- Passwords: Only bcrypt hashes stored
- API keys: Environment variables, never in code

---

## 9. Implementation Roadmap

### Phase 1: MVP (Core Foundation)
**Scope:**
- User authentication (email/password)
- Manual subscription CRUD
- Basic dashboard with stats
- Category management
- Simple renewal reminders (email)
- CSV export

**Deliverables:**
- Working web app deployed to cloud
- Basic feature set for personal use
- Documentation for self-hosting

### Phase 2: Smart Discovery
**Scope:**
- Gmail OAuth integration
- Email receipt parsing
- Bank statement CSV import
- Browser extension (basic)
- Price change tracking
- Enhanced analytics

**Deliverables:**
- Automated subscription discovery
- Multi-source data aggregation
- Advanced reporting features

### Phase 3: Advanced Features
**Scope:**
- Plaid integration (direct bank)
- Family/shared subscription support
- Mobile companion app
- AI categorization
- Subscription recommendations
- Calendar integrations

**Deliverables:**
- Full-featured subscription management platform
- Cross-platform availability
- Enterprise-ready features

---

## 10. Portability Strategy

### Code Organization for Portability
```
packages/
├── core/           # Pure business logic (no framework deps)
│   ├── models/     # TypeScript interfaces
│   ├── services/   # Business logic functions
│   └── utils/      # Shared utilities
│
├── email-parser/   # Standalone email parsing
├── bank-parser/    # Standalone bank parsing
└── ui-components/  # Headless UI components
```

### Platform Targets
| Platform | Approach |
|----------|----------|
| Web App | React + Express (primary) |
| Desktop | Electron wrapper around web |
| Chrome Extension | Manifest V3, shared core |
| Mobile | React Native with shared logic |
| CLI | Node.js with shared core |

### API Design
- RESTful API with OpenAPI spec
- GraphQL layer for complex queries
- Webhook support for integrations
- Rate-limited public API for third-party apps

---

## 11. Testing Strategy

### Test Pyramid
```
          ┌───────────┐
          │   E2E     │  Playwright/Cypress
          ├───────────┤
          │Integration│  Supertest + Test DB
        ┌─┴───────────┴─┐
        │   Unit Tests  │  Vitest/Jest
        └───────────────┘
```

### Key Test Areas
| Area | Tools | Coverage Target |
|------|-------|-----------------|
| API Routes | Supertest | 90% |
| Business Logic | Vitest | 95% |
| React Components | Testing Library | 80% |
| Email Parser | Unit tests | 95% |
| Bank Parser | Unit tests | 95% |
| E2E Flows | Playwright | Critical paths |

### Critical Test Scenarios
1. User registration/login flow
2. Subscription CRUD operations
3. Email import and parsing accuracy
4. Bank statement parsing accuracy
5. Reminder scheduling and delivery
6. Data export integrity
7. Multi-currency calculations

---

## 12. Potential Challenges

| Challenge | Risk | Mitigation |
|-----------|------|------------|
| Email parsing accuracy | Medium | Build extensive test suite with real email samples; use ML for edge cases |
| Bank statement formats | High | Start with CSV only; add formats based on user demand |
| OAuth security/compliance | Medium | Follow OAuth best practices; regular security audits |
| Subscription service database | Medium | Start with top 100 services; crowdsource additions |
| Performance at scale | Low | Proper indexing; caching layer; background jobs |
| Browser extension security | Medium | Minimal permissions; content security policy |
| User data privacy | High | Privacy-first design; encryption; clear policies |
| Recurring pattern detection | Medium | Start simple (same amount + interval); improve over time |

---

## 13. Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL 15+ (or SQLite for dev)
- pnpm (package manager)
- Docker (optional, for services)

### Quick Start
```bash
# Clone and install
git clone <repo>
cd subscriber
pnpm install

# Set up environment
cp .env.example .env
# Edit .env with your values

# Set up database
pnpm db:push
pnpm db:seed

# Start development
pnpm dev
```

### Environment Variables
```env
# Database
DATABASE_URL="postgresql://..."

# Auth
JWT_SECRET="..."
SESSION_SECRET="..."

# Email (Gmail API)
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

# Notifications
SENDGRID_API_KEY="..."

# Optional
PLAID_CLIENT_ID="..."
PLAID_SECRET="..."
```

---

## Next Steps

1. **Set up monorepo** with Turborepo
2. **Initialize Prisma** with PostgreSQL
3. **Create Express API** with auth routes
4. **Build React dashboard** with core UI
5. **Implement manual subscription CRUD**
6. **Add basic analytics calculations**
7. **Deploy MVP to cloud** (Railway/Render)

---

*Document Version: 1.0*
*Last Updated: January 2026*
