import { describe, it, expect } from 'vitest';
import { createSubscriptionSchema, updateSubscriptionSchema, createCategorySchema } from '../../../../packages/shared/dist';

describe('Subscription Validation', () => {
  describe('createSubscriptionSchema', () => {
    it('should validate a valid subscription', () => {
      const validSubscription = {
        name: 'Netflix',
        cost: 15.99,
        billingCycle: 'MONTHLY',
        startDate: new Date().toISOString(),
      };
      const result = createSubscriptionSchema.safeParse(validSubscription);
      expect(result.success).toBe(true);
    });

    it('should reject subscription without name', () => {
      const invalidSubscription = {
        cost: 15.99,
        billingCycle: 'MONTHLY',
        startDate: new Date().toISOString(),
      };
      const result = createSubscriptionSchema.safeParse(invalidSubscription);
      expect(result.success).toBe(false);
    });

    it('should reject negative cost', () => {
      const invalidSubscription = {
        name: 'Netflix',
        cost: -15.99,
        billingCycle: 'MONTHLY',
        startDate: new Date().toISOString(),
      };
      const result = createSubscriptionSchema.safeParse(invalidSubscription);
      expect(result.success).toBe(false);
    });

    it('should accept optional fields', () => {
      const subscriptionWithOptionals = {
        name: 'Spotify',
        cost: 9.99,
        billingCycle: 'MONTHLY',
        startDate: new Date().toISOString(),
        description: 'Music streaming',
        tags: ['music', 'entertainment'],
      };
      const result = createSubscriptionSchema.safeParse(subscriptionWithOptionals);
      expect(result.success).toBe(true);
    });
  });

  describe('updateSubscriptionSchema', () => {
    it('should allow partial updates', () => {
      const partialUpdate = {
        name: 'Netflix Premium',
      };
      const result = updateSubscriptionSchema.safeParse(partialUpdate);
      expect(result.success).toBe(true);
    });

    it('should allow cost update', () => {
      const costUpdate = {
        cost: 19.99,
      };
      const result = updateSubscriptionSchema.safeParse(costUpdate);
      expect(result.success).toBe(true);
    });

    it('should reject invalid billing cycle', () => {
      const invalidUpdate = {
        billingCycle: 'INVALID',
      };
      const result = updateSubscriptionSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });
  });
});

describe('Category Validation', () => {
  describe('createCategorySchema', () => {
    it('should validate a valid category', () => {
      const validCategory = {
        name: 'Entertainment',
      };
      const result = createCategorySchema.safeParse(validCategory);
      expect(result.success).toBe(true);
    });

    it('should accept optional fields', () => {
      const categoryWithOptionals = {
        name: 'Entertainment',
        icon: 'tv',
        color: '#FF5733',
        budget: 100,
      };
      const result = createCategorySchema.safeParse(categoryWithOptionals);
      expect(result.success).toBe(true);
    });

    it('should reject empty name', () => {
      const invalidCategory = {
        name: '',
      };
      const result = createCategorySchema.safeParse(invalidCategory);
      expect(result.success).toBe(false);
    });
  });
});
