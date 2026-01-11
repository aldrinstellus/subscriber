// Subscription Types

export type BillingCycle =
  | 'FREE'
  | 'TRIAL'
  | 'WEEKLY'
  | 'BIWEEKLY'
  | 'MONTHLY'
  | 'QUARTERLY'
  | 'BIANNUAL'
  | 'YEARLY'
  | 'LIFETIME'
  | 'CUSTOM';

export type SubscriptionStatus =
  | 'ACTIVE'
  | 'PAUSED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'TRIAL'
  | 'PENDING';

export type DataSource =
  | 'MANUAL'
  | 'EMAIL'
  | 'BROWSER'
  | 'BANK_IMPORT'
  | 'PLAID'
  | 'API';

export type AccountType = 'PERSONAL' | 'WORK' | 'FAMILY' | 'OTHER';

export type ReminderChannel = 'EMAIL' | 'PUSH' | 'SMS';

// User types
export interface User {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
  currency: string;
  timezone: string;
  createdAt: Date;
  updatedAt: Date;
}

// Subscription types
export interface Subscription {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
  websiteUrl: string | null;
  cost: number;
  currency: string;
  billingCycle: BillingCycle;
  billingDay: number | null;
  startDate: Date;
  endDate: Date | null;
  nextBillingDate: Date | null;
  trialEndDate: Date | null;
  status: SubscriptionStatus;
  autoRenew: boolean;
  categoryId: string | null;
  accountId: string | null;
  isShared: boolean;
  sharedWith: SharedMember[] | null;
  source: DataSource;
  sourceId: string | null;
  notes: string | null;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SharedMember {
  name: string;
  email?: string;
  splitAmount?: number;
}

// Category types
export interface Category {
  id: string;
  userId: string;
  name: string;
  icon: string | null;
  color: string | null;
  budget: number | null;
}

// Analytics types
export interface SpendingSummary {
  totalMonthly: number;
  totalYearly: number;
  byCategory: CategorySpending[];
  upcomingRenewals: UpcomingRenewal[];
  subscriptionCount: {
    active: number;
    paused: number;
    cancelled: number;
    trial: number;
  };
}

export interface CategorySpending {
  categoryId: string | null;
  categoryName: string;
  amount: number;
  percentage: number;
  count: number;
}

export interface UpcomingRenewal {
  subscriptionId: string;
  name: string;
  cost: number;
  dueDate: Date;
  daysUntil: number;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
