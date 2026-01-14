# API Reference

**Base URL:** `/api`

## Health Check
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/health` | No | Returns `{ status: 'ok' }` |

## User
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/user/me` | Yes | Get current user profile (includes avatar) |
| POST | `/user/complete-onboarding` | Yes | Mark onboarding complete |
| PATCH | `/user/settings` | Yes | Update user settings (currency, timezone, name) |
| GET | `/user/connected-accounts` | Yes | List OAuth connections |
| DELETE | `/auth/disconnect/:accountId` | Yes | Remove OAuth connection |

## OAuth Integration
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/gmail/url` | Yes | Get Gmail OAuth URL |
| GET | `/auth/gmail/callback` | No | Gmail OAuth callback |
| POST | `/auth/outlook/url` | Yes | Get Outlook OAuth URL |
| GET | `/auth/outlook/callback` | No | Outlook OAuth callback |

## Subscriptions
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/subscriptions` | Yes | List subscriptions (paginated) |
| GET | `/subscriptions/:id` | Yes | Get subscription with relations |
| POST | `/subscriptions` | Yes | Create subscription |
| PUT | `/subscriptions/:id` | Yes | Update subscription |
| DELETE | `/subscriptions/:id` | Yes | Delete subscription |

**Query Parameters (GET /subscriptions):**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)
- `status` - Filter by status (ACTIVE, PAUSED, etc.)
- `categoryId` - Filter by category

## Categories
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/categories` | Yes | List user's categories |
| POST | `/categories` | Yes | Create category |
| PUT | `/categories/:id` | Yes | Update category |
| DELETE | `/categories/:id` | Yes | Delete category |

## Analytics
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/analytics/summary` | Yes | Spending summary |
| GET | `/analytics/trend` | Yes | Monthly spending trend |

**Summary Response:**
```json
{
  "totalMonthly": 247.99,
  "totalYearly": 2975.88,
  "byCategory": [{ "name": "Streaming", "total": 45.97 }],
  "upcomingRenewals": [...],
  "statusCounts": { "ACTIVE": 15, "PAUSED": 2 }
}
```

## Export
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/export/csv` | Yes | Export subscriptions as CSV |
| GET | `/export/json` | Yes | Export subscriptions as JSON |

## Response Format

**Success:**
```json
{ "success": true, "data": { ... } }
```

**Error:**
```json
{ "success": false, "error": "Error message" }
```

**Validation Error:**
```json
{
  "success": false,
  "error": "Validation failed",
  "details": [{ "field": "cost", "message": "Must be positive" }]
}
```

## Authentication Header
```
Authorization: Bearer <supabase_access_token>
```

## Enums

**BillingCycle:** FREE, TRIAL, WEEKLY, BIWEEKLY, MONTHLY, QUARTERLY, BIANNUAL, YEARLY, LIFETIME, CUSTOM

**SubscriptionStatus:** ACTIVE, PAUSED, CANCELLED, EXPIRED, TRIAL, PENDING

**DataSource:** MANUAL, EMAIL, BROWSER, BANK_IMPORT, PLAID, API
