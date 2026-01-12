import { describe, it, expect } from 'vitest';

// Test utility functions
describe('Frontend Utilities', () => {
  describe('formatCurrency', () => {
    const formatCurrency = (amount: number, currency: string = 'USD') => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
      }).format(amount);
    };

    it('should format USD correctly', () => {
      expect(formatCurrency(10.99)).toBe('$10.99');
    });

    it('should handle large numbers', () => {
      expect(formatCurrency(1000000)).toBe('$1,000,000.00');
    });

    it('should handle zero', () => {
      expect(formatCurrency(0)).toBe('$0.00');
    });
  });

  describe('Date formatting', () => {
    const formatDate = (date: Date) => {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    };

    it('should format date correctly', () => {
      const date = new Date('2024-01-15');
      expect(formatDate(date)).toContain('Jan');
      expect(formatDate(date)).toContain('15');
      expect(formatDate(date)).toContain('2024');
    });
  });

  describe('Subscription calculations', () => {
    const calculateAnnualCost = (monthlyCost: number) => monthlyCost * 12;
    const calculateMonthlyCost = (cost: number, cycle: string) => {
      switch (cycle) {
        case 'WEEKLY': return cost * 4.33;
        case 'MONTHLY': return cost;
        case 'QUARTERLY': return cost / 3;
        case 'YEARLY': return cost / 12;
        default: return cost;
      }
    };

    it('should calculate annual cost from monthly', () => {
      expect(calculateAnnualCost(10)).toBe(120);
    });

    it('should convert yearly to monthly', () => {
      expect(calculateMonthlyCost(120, 'YEARLY')).toBe(10);
    });

    it('should convert quarterly to monthly', () => {
      expect(calculateMonthlyCost(30, 'QUARTERLY')).toBe(10);
    });
  });
});

describe('Data Validation', () => {
  describe('Email validation', () => {
    const isValidEmail = (email: string) => {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    it('should validate correct email', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
    });

    it('should reject invalid email', () => {
      expect(isValidEmail('invalid-email')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
    });
  });

  describe('URL validation', () => {
    const isValidUrl = (url: string) => {
      try {
        new URL(url);
        return true;
      } catch {
        return false;
      }
    };

    it('should validate correct URL', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('http://localhost:3000')).toBe(true);
    });

    it('should reject invalid URL', () => {
      expect(isValidUrl('not-a-url')).toBe(false);
    });
  });
});
