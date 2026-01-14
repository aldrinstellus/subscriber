# Database Schema - Subscriber

## Overview
PostgreSQL database hosted on Supabase with Prisma ORM.

**Connection:** Session pooler (port 5432) with `?pgbouncer=true` for Prisma compatibility.

---

## Entity Relationship Diagram

```
┌─────────────────────┐
│       User          │
├─────────────────────┤
│ id (PK)             │
│ supabaseId (unique) │
│ email (unique)      │
│ name                │
│ avatar              │
│ currency            │
│ timezone            │
│ onboardingCompleted │
└─────────┬───────────┘
          │
          │ 1:N
          ├──────────────────┬──────────────────┬──────────────────┬──────────────────┐
          │                  │                  │                  │                  │
          ▼                  ▼                  ▼                  ▼                  ▼
┌─────────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────────┐  ┌─────────────────────┐
│ Subscription    │  │  Category    │  │   Account    │  │ConnectedAccount│  │NotificationSettings │
├─────────────────┤  ├──────────────┤  ├──────────────┤  ├────────────────┤  ├─────────────────────┤
│ id (PK)         │  │ id (PK)      │  │ id (PK)      │  │ id (PK)        │  │ id (PK)             │
│ userId (FK)     │  │ userId (FK)  │  │ userId (FK)  │  │ userId (FK)    │  │ userId (FK, unique) │
│ name            │  │ name         │  │ name         │  │ provider       │  │ emailEnabled        │
│ cost            │  │ icon         │  │ email        │  │ email          │  │ renewalReminders    │
│ billingCycle    │  │ color        │  │ type         │  │ accessToken    │  │ priceChangeAlerts   │
│ status          │  │ budget       │  └──────────────┘  │ refreshToken   │  └─────────────────────┘
│ categoryId (FK) │  └──────────────┘         │          │ status         │
│ accountId (FK)  │         │                 │          └────────────────┘
└────────┬────────┘         │                 │
         │                  │                 │
         │ 1:N              │ N:1             │ N:1
         ├──────────────────┴─────────────────┘
         │
         ├───────────────────┐
         │                   │
         ▼                   ▼
┌─────────────────┐  ┌──────────────┐
│  PriceHistory   │  │   Reminder   │
├─────────────────┤  ├──────────────┤
│ id (PK)         │  │ id (PK)      │
│ subscriptionId  │  │ subscriptionId│
│ previousCost    │  │ daysBefore   │
│ newCost         │  │ channel      │
│ changedAt       │  │ enabled      │
└─────────────────┘  └──────────────┘

┌─────────────────┐  ┌─────────────────┐
│ ImportHistory   │  │ ServiceDatabase │
├─────────────────┤  ├─────────────────┤
│ id (PK)         │  │ id (PK)         │
│ userId (FK)     │  │ name (unique)   │
│ source          │  │ aliases[]       │
│ status          │  │ logoUrl         │
│ itemsFound      │  │ emailDomains[]  │
└─────────────────┘  │ merchantNames[] │
                     └─────────────────┘
```

---

## Table Definitions

### users
Core user table linked to Supabase Auth.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | CUID | PK | Internal user ID |
| supabaseId | String | Unique, Nullable | Supabase auth UUID |
| email | String | Unique | User email |
| passwordHash | String | Nullable | For email/password auth |
| name | String | Nullable | Display name |
| avatar | String | Nullable | Avatar URL |
| currency | String | Default: USD | Preferred currency |
| timezone | String | Default: UTC | User timezone |
| onboardingCompleted | Boolean | Default: false | Onboarding status |
| createdAt | DateTime | Auto | Created timestamp |
| updatedAt | DateTime | Auto | Updated timestamp |

---

### subscriptions
Core subscription tracking table.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | CUID | PK | Subscription ID |
| userId | String | FK → users | Owner |
| name | String | Required | Service name |
| description | String | Nullable | Notes |
| logoUrl | String | Nullable | Service logo |
| websiteUrl | String | Nullable | Service URL |
| cost | Decimal(10,2) | Required | Amount |
| currency | String | Default: USD | Currency code |
| billingCycle | String | Default: MONTHLY | MONTHLY/YEARLY/WEEKLY |
| billingDay | Int | Nullable | Day of month (1-31) |
| startDate | DateTime | Required | Start date |
| endDate | DateTime | Nullable | End date |
| nextBillingDate | DateTime | Nullable | Next renewal |
| trialEndDate | DateTime | Nullable | Trial end |
| status | String | Default: ACTIVE | ACTIVE/PAUSED/CANCELLED |
| autoRenew | Boolean | Default: true | Auto-renewal |
| categoryId | String | FK → categories | Category |
| accountId | String | FK → accounts | Linked account |
| isShared | Boolean | Default: false | Shared subscription |
| sharedWith | String[] | Array | Shared user emails |
| source | String | Default: MANUAL | MANUAL/EMAIL/IMPORT |
| sourceId | String | Nullable | External ID |
| notes | String | Nullable | User notes |
| tags | String[] | Array | Custom tags |

**Indexes:** `[userId, status]`, `[nextBillingDate]`

---

### connected_accounts
OAuth-connected email accounts for email scanning.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | CUID | PK | Account ID |
| userId | String | FK → users | Owner |
| provider | String | Required | GMAIL/OUTLOOK |
| email | String | Required | Connected email |
| accessToken | String | Nullable | OAuth token |
| refreshToken | String | Nullable | Refresh token |
| tokenExpiry | DateTime | Nullable | Token expiration |
| scopes | String | Nullable | Granted scopes |
| status | String | Default: ACTIVE | ACTIVE/EXPIRED/REVOKED |
| lastSyncAt | DateTime | Nullable | Last email scan |
| syncStatus | String | Nullable | Sync status |

**Unique:** `[userId, provider, email]`

---

### categories
User-defined subscription categories.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | CUID | PK | Category ID |
| userId | String | FK → users | Owner |
| name | String | Required | Category name |
| icon | String | Nullable | Icon identifier |
| color | String | Nullable | Hex color |
| budget | Decimal(10,2) | Nullable | Monthly budget |

**Unique:** `[userId, name]`

---

### accounts
Payment accounts (cards, bank accounts).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | CUID | PK | Account ID |
| userId | String | FK → users | Owner |
| name | String | Required | Account name |
| email | String | Nullable | Associated email |
| type | String | Default: PERSONAL | PERSONAL/BUSINESS |

**Unique:** `[userId, name]`

---

### price_history
Tracks subscription price changes.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | CUID | PK | History ID |
| subscriptionId | String | FK → subscriptions | Subscription |
| previousCost | Decimal(10,2) | Required | Old price |
| newCost | Decimal(10,2) | Required | New price |
| changedAt | DateTime | Auto | Change timestamp |
| source | String | Default: MANUAL | Change source |

**Index:** `[subscriptionId, changedAt]`

---

### reminders
Subscription renewal reminders.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | CUID | PK | Reminder ID |
| subscriptionId | String | FK → subscriptions | Subscription |
| daysBefore | Int | Default: 3 | Days before renewal |
| channel | String | Default: EMAIL | EMAIL/PUSH |
| enabled | Boolean | Default: true | Is active |
| lastSentAt | DateTime | Nullable | Last sent |

**Unique:** `[subscriptionId, daysBefore, channel]`

---

### notification_settings
User notification preferences.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | CUID | PK | Settings ID |
| userId | String | FK → users, Unique | Owner |
| emailEnabled | Boolean | Default: true | Email notifications |
| pushEnabled | Boolean | Default: false | Push notifications |
| renewalReminders | Boolean | Default: true | Renewal alerts |
| priceChangeAlerts | Boolean | Default: true | Price change alerts |
| weeklyDigest | Boolean | Default: false | Weekly summary |
| monthlyReport | Boolean | Default: true | Monthly report |

---

### import_history
Tracks import jobs.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | CUID | PK | Import ID |
| userId | String | FK → users | Owner |
| source | String | Required | Import source |
| filename | String | Nullable | Uploaded filename |
| status | String | Default: PENDING | PENDING/PROCESSING/COMPLETED/FAILED |
| itemsFound | Int | Default: 0 | Items discovered |
| itemsAdded | Int | Default: 0 | Items imported |
| errors | String | Nullable | Error messages |
| startedAt | DateTime | Auto | Start time |
| completedAt | DateTime | Nullable | Completion time |

---

### service_database
Known subscription services for auto-detection.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | CUID | PK | Service ID |
| name | String | Unique | Service name |
| aliases | String[] | Array | Alternative names |
| logoUrl | String | Nullable | Logo URL |
| websiteUrl | String | Nullable | Website URL |
| category | String | Nullable | Default category |
| typicalCost | Decimal(10,2) | Nullable | Typical price |
| billingCycle | String | Nullable | Typical billing |
| emailDomains | String[] | Array | From email domains |
| merchantNames | String[] | Array | Bank statement names |
| urlPatterns | String[] | Array | URL patterns |

**Index:** `[name]`

---

## Common Queries

### Get user's active subscriptions with categories
```sql
SELECT s.*, c.name as category_name, c.color as category_color
FROM subscriptions s
LEFT JOIN categories c ON s."categoryId" = c.id
WHERE s."userId" = $1 AND s.status IN ('ACTIVE', 'TRIAL')
ORDER BY s."nextBillingDate" ASC;
```

### Get monthly spending by category
```sql
SELECT c.name, c.color, SUM(s.cost) as total
FROM subscriptions s
JOIN categories c ON s."categoryId" = c.id
WHERE s."userId" = $1 AND s.status = 'ACTIVE' AND s."billingCycle" = 'MONTHLY'
GROUP BY c.id;
```

### Get connected accounts for user
```sql
SELECT id, provider, email, status, "lastSyncAt", "syncStatus"
FROM connected_accounts
WHERE "userId" = $1;
```

---

## Migration Commands

```bash
# Push schema changes (dev)
pnpm prisma db push

# Generate migration (production)
pnpm prisma migrate dev --name <migration_name>

# Apply migrations (CI/CD)
pnpm prisma migrate deploy

# Reset database (caution!)
pnpm prisma migrate reset
```
