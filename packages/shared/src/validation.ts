import { z } from 'zod';

// Subscription validation schemas
export const createSubscriptionSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  logoUrl: z.string().url().optional(),
  websiteUrl: z.string().url().optional(),
  cost: z.number().min(0),
  currency: z.string().length(3).default('USD'),
  billingCycle: z.enum([
    'FREE',
    'TRIAL',
    'WEEKLY',
    'BIWEEKLY',
    'MONTHLY',
    'QUARTERLY',
    'BIANNUAL',
    'YEARLY',
    'LIFETIME',
    'CUSTOM',
  ]),
  billingDay: z.number().min(1).max(31).optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  nextBillingDate: z.coerce.date().optional(),
  trialEndDate: z.coerce.date().optional(),
  status: z
    .enum(['ACTIVE', 'PAUSED', 'CANCELLED', 'EXPIRED', 'TRIAL', 'PENDING'])
    .default('ACTIVE'),
  autoRenew: z.boolean().default(true),
  categoryId: z.string().optional(),
  accountId: z.string().optional(),
  isShared: z.boolean().default(false),
  sharedWith: z
    .array(
      z.object({
        name: z.string(),
        email: z.string().email().optional(),
        splitAmount: z.number().optional(),
      })
    )
    .optional(),
  notes: z.string().max(1000).optional(),
  tags: z.array(z.string()).default([]),
});

export const updateSubscriptionSchema = createSubscriptionSchema.partial();

// User validation schemas
export const registerUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
  name: z.string().min(1).max(100).optional(),
});

export const loginUserSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// Category validation schemas
export const createCategorySchema = z.object({
  name: z.string().min(1).max(50),
  icon: z.string().max(50).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  budget: z.number().min(0).optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

// Type exports
export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>;
export type UpdateSubscriptionInput = z.infer<typeof updateSubscriptionSchema>;
export type RegisterUserInput = z.infer<typeof registerUserSchema>;
export type LoginUserInput = z.infer<typeof loginUserSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
