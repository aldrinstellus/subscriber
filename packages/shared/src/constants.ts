// Application constants

export const BILLING_CYCLE_LABELS: Record<string, string> = {
  FREE: 'Free',
  TRIAL: 'Trial',
  WEEKLY: 'Weekly',
  BIWEEKLY: 'Bi-weekly',
  MONTHLY: 'Monthly',
  QUARTERLY: 'Quarterly',
  BIANNUAL: 'Bi-annual',
  YEARLY: 'Yearly',
  LIFETIME: 'Lifetime',
  CUSTOM: 'Custom',
};

export const BILLING_CYCLE_MONTHS: Record<string, number> = {
  FREE: 0,
  TRIAL: 0,
  WEEKLY: 0.25,
  BIWEEKLY: 0.5,
  MONTHLY: 1,
  QUARTERLY: 3,
  BIANNUAL: 6,
  YEARLY: 12,
  LIFETIME: 0,
  CUSTOM: 1,
};

export const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Active',
  PAUSED: 'Paused',
  CANCELLED: 'Cancelled',
  EXPIRED: 'Expired',
  TRIAL: 'Trial',
  PENDING: 'Pending',
};

export const STATUS_COLORS: Record<string, string> = {
  ACTIVE: '#22c55e',
  PAUSED: '#eab308',
  CANCELLED: '#ef4444',
  EXPIRED: '#6b7280',
  TRIAL: '#3b82f6',
  PENDING: '#f97316',
};

export const DEFAULT_CATEGORIES = [
  { name: 'Streaming', icon: 'tv', color: '#ef4444' },
  { name: 'Music', icon: 'music', color: '#22c55e' },
  { name: 'Software', icon: 'code', color: '#3b82f6' },
  { name: 'Gaming', icon: 'gamepad-2', color: '#8b5cf6' },
  { name: 'News', icon: 'newspaper', color: '#f97316' },
  { name: 'Cloud Storage', icon: 'cloud', color: '#06b6d4' },
  { name: 'Productivity', icon: 'briefcase', color: '#6366f1' },
  { name: 'Education', icon: 'graduation-cap', color: '#ec4899' },
  { name: 'Fitness', icon: 'dumbbell', color: '#10b981' },
  { name: 'Other', icon: 'box', color: '#6b7280' },
];

export const POPULAR_SERVICES = [
  { name: 'Netflix', category: 'Streaming', typicalCost: 15.99, cycle: 'MONTHLY' },
  { name: 'Spotify', category: 'Music', typicalCost: 10.99, cycle: 'MONTHLY' },
  { name: 'Disney+', category: 'Streaming', typicalCost: 7.99, cycle: 'MONTHLY' },
  { name: 'HBO Max', category: 'Streaming', typicalCost: 15.99, cycle: 'MONTHLY' },
  { name: 'Amazon Prime', category: 'Streaming', typicalCost: 14.99, cycle: 'MONTHLY' },
  { name: 'YouTube Premium', category: 'Streaming', typicalCost: 13.99, cycle: 'MONTHLY' },
  { name: 'Apple Music', category: 'Music', typicalCost: 10.99, cycle: 'MONTHLY' },
  { name: 'Adobe Creative Cloud', category: 'Software', typicalCost: 54.99, cycle: 'MONTHLY' },
  { name: 'Microsoft 365', category: 'Software', typicalCost: 9.99, cycle: 'MONTHLY' },
  { name: 'Dropbox', category: 'Cloud Storage', typicalCost: 11.99, cycle: 'MONTHLY' },
  { name: 'Google One', category: 'Cloud Storage', typicalCost: 2.99, cycle: 'MONTHLY' },
  { name: 'iCloud+', category: 'Cloud Storage', typicalCost: 2.99, cycle: 'MONTHLY' },
  { name: 'ChatGPT Plus', category: 'Software', typicalCost: 20.00, cycle: 'MONTHLY' },
  { name: 'GitHub Pro', category: 'Software', typicalCost: 4.00, cycle: 'MONTHLY' },
  { name: 'Notion', category: 'Productivity', typicalCost: 10.00, cycle: 'MONTHLY' },
];

export const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
];
