import { describe, it, expect } from 'vitest';

// Utility functions to test
function calculateMonthlyEquivalent(cost: number, billingCycle: string): number {
  switch (billingCycle) {
    case 'WEEKLY':
      return cost * 4.33;
    case 'MONTHLY':
      return cost;
    case 'QUARTERLY':
      return cost / 3;
    case 'YEARLY':
      return cost / 12;
    default:
      return cost;
  }
}

function calculateNextBillingDate(startDate: Date, billingCycle: string): Date {
  const now = new Date();
  const nextDate = new Date(startDate);

  while (nextDate <= now) {
    switch (billingCycle) {
      case 'WEEKLY':
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case 'MONTHLY':
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case 'QUARTERLY':
        nextDate.setMonth(nextDate.getMonth() + 3);
        break;
      case 'YEARLY':
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
    }
  }

  return nextDate;
}

describe('Utility Functions', () => {
  describe('calculateMonthlyEquivalent', () => {
    it('should return same cost for monthly billing', () => {
      expect(calculateMonthlyEquivalent(10, 'MONTHLY')).toBe(10);
    });

    it('should divide by 12 for yearly billing', () => {
      expect(calculateMonthlyEquivalent(120, 'YEARLY')).toBe(10);
    });

    it('should divide by 3 for quarterly billing', () => {
      expect(calculateMonthlyEquivalent(30, 'QUARTERLY')).toBe(10);
    });

    it('should multiply by 4.33 for weekly billing', () => {
      expect(calculateMonthlyEquivalent(10, 'WEEKLY')).toBeCloseTo(43.3);
    });
  });

  describe('calculateNextBillingDate', () => {
    it('should calculate next monthly billing date', () => {
      const startDate = new Date('2024-01-15');
      const nextDate = calculateNextBillingDate(startDate, 'MONTHLY');
      expect(nextDate.getDate()).toBe(15);
      expect(nextDate > new Date()).toBe(true);
    });

    it('should calculate next yearly billing date', () => {
      const startDate = new Date('2024-01-01');
      const nextDate = calculateNextBillingDate(startDate, 'YEARLY');
      expect(nextDate.getMonth()).toBe(0); // January
      expect(nextDate.getDate()).toBe(1);
      expect(nextDate > new Date()).toBe(true);
    });
  });
});

describe('Data Transformations', () => {
  it('should correctly format currency', () => {
    const formatCurrency = (amount: number, currency: string = 'USD') => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
      }).format(amount);
    };

    expect(formatCurrency(10.99)).toBe('$10.99');
    expect(formatCurrency(1000)).toBe('$1,000.00');
    expect(formatCurrency(10.99, 'EUR')).toContain('10.99');
  });

  it('should correctly calculate subscription totals', () => {
    const subscriptions = [
      { cost: 10, billingCycle: 'MONTHLY' },
      { cost: 120, billingCycle: 'YEARLY' },
      { cost: 30, billingCycle: 'QUARTERLY' },
    ];

    const monthlyTotal = subscriptions.reduce((total, sub) => {
      return total + calculateMonthlyEquivalent(sub.cost, sub.billingCycle);
    }, 0);

    expect(monthlyTotal).toBe(30); // 10 + 10 + 10
  });
});
