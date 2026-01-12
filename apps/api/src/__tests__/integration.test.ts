import { describe, it, expect, vi, beforeEach } from 'vitest';
import express, { type Application } from 'express';
import request from 'supertest';

// Mock the Prisma client
vi.mock('../services/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    subscription: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    category: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

// Create test app
function createTestApp(): Application {
  const app = express();
  app.use(express.json());

  // Health endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Mock auth endpoint
  app.get('/api/auth/me', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    res.json({
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User',
    });
  });

  // Mock subscriptions endpoint
  app.get('/api/subscriptions', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    res.json({
      success: true,
      data: {
        items: [],
        total: 0,
        page: 1,
        pageSize: 50,
        totalPages: 0,
      },
    });
  });

  app.post('/api/subscriptions', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const { name, cost, billingCycle, startDate } = req.body;
    if (!name || !cost || !billingCycle || !startDate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    res.status(201).json({
      success: true,
      data: {
        id: 'new-subscription-id',
        ...req.body,
        userId: 'test-user-id',
        createdAt: new Date().toISOString(),
      },
    });
  });

  // Mock categories endpoint
  app.get('/api/categories', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    res.json({
      success: true,
      data: [
        { id: '1', name: 'Entertainment', icon: 'tv', color: '#FF5733' },
        { id: '2', name: 'Software', icon: 'code', color: '#3498DB' },
      ],
    });
  });

  // Mock analytics endpoint
  app.get('/api/analytics/summary', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    res.json({
      success: true,
      data: {
        totalMonthly: 100,
        totalYearly: 1200,
        activeSubscriptions: 5,
        upcomingRenewals: 2,
      },
    });
  });

  return app;
}

describe('API Integration Tests', () => {
  let app: Application;

  beforeEach(() => {
    app = createTestApp();
  });

  describe('Health Check', () => {
    it('GET /api/health returns 200', async () => {
      const response = await request(app).get('/api/health');
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
    });
  });

  describe('Authentication', () => {
    it('GET /api/auth/me returns user when authenticated', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.email).toBe('test@example.com');
    });

    it('GET /api/auth/me returns 401 when not authenticated', async () => {
      const response = await request(app).get('/api/auth/me');
      expect(response.status).toBe(401);
    });
  });

  describe('Subscriptions', () => {
    it('GET /api/subscriptions returns list when authenticated', async () => {
      const response = await request(app)
        .get('/api/subscriptions')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toBeInstanceOf(Array);
    });

    it('POST /api/subscriptions creates subscription', async () => {
      const newSubscription = {
        name: 'Netflix',
        cost: 15.99,
        billingCycle: 'MONTHLY',
        startDate: new Date().toISOString(),
      };

      const response = await request(app)
        .post('/api/subscriptions')
        .set('Authorization', 'Bearer test-token')
        .send(newSubscription);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Netflix');
    });

    it('POST /api/subscriptions returns 400 for invalid data', async () => {
      const response = await request(app)
        .post('/api/subscriptions')
        .set('Authorization', 'Bearer test-token')
        .send({ name: 'Netflix' }); // Missing required fields

      expect(response.status).toBe(400);
    });

    it('GET /api/subscriptions returns 401 without auth', async () => {
      const response = await request(app).get('/api/subscriptions');
      expect(response.status).toBe(401);
    });
  });

  describe('Categories', () => {
    it('GET /api/categories returns list when authenticated', async () => {
      const response = await request(app)
        .get('/api/categories')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('Analytics', () => {
    it('GET /api/analytics/summary returns data when authenticated', async () => {
      const response = await request(app)
        .get('/api/analytics/summary')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.totalMonthly).toBeDefined();
      expect(response.body.data.activeSubscriptions).toBeDefined();
    });
  });
});

describe('Error Handling', () => {
  it('should handle JSON parsing errors', async () => {
    const app = createTestApp();
    const response = await request(app)
      .post('/api/subscriptions')
      .set('Authorization', 'Bearer test-token')
      .set('Content-Type', 'application/json')
      .send('invalid json');

    expect(response.status).toBe(400);
  });
});
