// @ts-nocheck
import type { VercelRequest, VercelResponse } from '@vercel/node';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createClient } from '@supabase/supabase-js';
import { google } from 'googleapis';
import { ConfidentialClientApplication } from '@azure/msal-node';

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { z } from 'zod';

// Initialize Prisma
const prisma = new PrismaClient();

// Initialize Supabase Admin Client
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Initialize Express
const app = express();

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Auth middleware
interface AuthRequest extends Request {
  userId?: string;
  supabaseUserId?: string;
}

const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.substring(7);

    // Verify token with Supabase
    const { data: { user: supabaseUser }, error } = await supabaseAdmin.auth.getUser(token);

    if (error) {
      console.error('Supabase auth error:', error.message);
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    if (!supabaseUser) {
      console.error('No user returned from Supabase');
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    req.supabaseUserId = supabaseUser.id;

    // Find or create user in our database
    let user = await prisma.user.findUnique({
      where: { supabaseId: supabaseUser.id },
    });

    if (!user) {
      const email = supabaseUser.email;

      if (!email) {
        return res.status(400).json({ error: 'No email associated with account' });
      }

      // Check if user exists by email (migration from old auth)
      user = await prisma.user.findUnique({
        where: { email },
      });

      if (user) {
        // Link existing user to Supabase
        user = await prisma.user.update({
          where: { id: user.id },
          data: { supabaseId: supabaseUser.id },
        });
      } else {
        // Create new user
        user = await prisma.user.create({
          data: {
            supabaseId: supabaseUser.id,
            email,
            name: supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || null,
          },
        });

        // Create default categories for new user
        const defaultCategories = [
          { name: 'Streaming', icon: 'tv', color: '#ef4444' },
          { name: 'Music', icon: 'music', color: '#22c55e' },
          { name: 'Software', icon: 'code', color: '#3b82f6' },
          { name: 'Gaming', icon: 'gamepad-2', color: '#8b5cf6' },
          { name: 'Other', icon: 'box', color: '#6b7280' },
        ];

        await prisma.category.createMany({
          data: defaultCategories.map((cat) => ({
            ...cat,
            userId: user!.id,
          })),
        });
      }
    }

    req.userId = user.id;
    next();
  } catch (err) {
    console.error('Auth error:', err);
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

// Validation schemas
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const subscriptionSchema = z.object({
  name: z.string().min(1),
  cost: z.number().min(0),
  billingCycle: z.enum(['FREE', 'TRIAL', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'BIANNUAL', 'YEARLY', 'LIFETIME', 'CUSTOM']),
  categoryId: z.string().nullable().optional(),
  startDate: z.string(),
  nextBillingDate: z.string().nullable().optional(),
  status: z.enum(['ACTIVE', 'PAUSED', 'CANCELLED', 'EXPIRED', 'TRIAL', 'PENDING']).optional(),
  websiteUrl: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = registerSchema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, passwordHash, name },
      select: { id: true, email: true, name: true, currency: true, timezone: true },
    });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ success: true, data: { user, token } });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          currency: user.currency,
          timezone: user.timezone,
        },
        token,
      },
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid input' });
    }
    res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/api/auth/me', authenticate, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, email: true, name: true, currency: true, timezone: true, onboardingCompleted: true },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ success: true, data: user });
  } catch {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// OAuth helper functions
const getGoogleOAuthClient = () => {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || 'https://subscriber-gilt.vercel.app/api/auth/gmail/callback'
  );
};

const getMsalClient = () => {
  return new ConfidentialClientApplication({
    auth: {
      clientId: process.env.MICROSOFT_CLIENT_ID || '',
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET || '',
      authority: 'https://login.microsoftonline.com/common',
    },
  });
};

const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
];

const MICROSOFT_SCOPES = ['Mail.Read', 'User.Read', 'offline_access'];

// Gmail OAuth URL
app.post('/api/auth/gmail/url', authenticate, async (req: AuthRequest, res) => {
  try {
    const oauth2Client = getGoogleOAuthClient();
    const state = Buffer.from(JSON.stringify({ userId: req.userId })).toString('base64');
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: GMAIL_SCOPES,
      state,
      prompt: 'consent',
    });
    res.json({ success: true, url: authUrl });
  } catch (error) {
    console.error('Gmail OAuth URL error:', error);
    res.status(500).json({ success: false, error: 'Failed to generate OAuth URL' });
  }
});

// Gmail OAuth callback
app.get('/api/auth/gmail/callback', async (req: Request, res: Response) => {
  const frontendUrl = process.env.FRONTEND_URL || 'https://subscriber-gilt.vercel.app';
  try {
    const { code, state } = req.query;
    if (!code || typeof code !== 'string') throw new Error('No code');
    const stateData = JSON.parse(Buffer.from(state as string, 'base64').toString());
    const userId = stateData.userId;
    const oauth2Client = getGoogleOAuthClient();
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data: userInfo } = await oauth2.userinfo.get();
    if (!userInfo.email) throw new Error('No email');
    await prisma.connectedAccount.upsert({
      where: { userId_provider_email: { userId, provider: 'GMAIL', email: userInfo.email } },
      update: { accessToken: tokens.access_token, refreshToken: tokens.refresh_token || undefined, tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null, scopes: GMAIL_SCOPES.join(' '), status: 'ACTIVE' },
      create: { userId, provider: 'GMAIL', email: userInfo.email, accessToken: tokens.access_token, refreshToken: tokens.refresh_token, tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null, scopes: GMAIL_SCOPES.join(' '), status: 'ACTIVE' },
    });
    res.redirect(frontendUrl + '/onboarding?connected=gmail');
  } catch (error) {
    console.error('Gmail callback error:', error);
    res.redirect(frontendUrl + '/onboarding?error=gmail_callback_failed');
  }
});

// Outlook OAuth URL
app.post('/api/auth/outlook/url', authenticate, async (req: AuthRequest, res) => {
  try {
    const msalClient = getMsalClient();
    const state = Buffer.from(JSON.stringify({ userId: req.userId })).toString('base64');
    const authUrl = await msalClient.getAuthCodeUrl({
      scopes: MICROSOFT_SCOPES,
      redirectUri: process.env.MICROSOFT_REDIRECT_URI || 'https://subscriber-gilt.vercel.app/api/auth/outlook/callback',
      state,
    });
    res.json({ success: true, url: authUrl });
  } catch (error) {
    console.error('Outlook OAuth URL error:', error);
    res.status(500).json({ success: false, error: 'Failed to generate OAuth URL' });
  }
});

// Outlook OAuth callback
app.get('/api/auth/outlook/callback', async (req: Request, res: Response) => {
  const frontendUrl = process.env.FRONTEND_URL || 'https://subscriber-gilt.vercel.app';
  try {
    const { code, state } = req.query;
    if (!code || typeof code !== 'string') throw new Error('No code');
    const stateData = JSON.parse(Buffer.from(state as string, 'base64').toString());
    const userId = stateData.userId;
    const msalClient = getMsalClient();
    const tokenResponse = await msalClient.acquireTokenByCode({
      code,
      scopes: MICROSOFT_SCOPES,
      redirectUri: process.env.MICROSOFT_REDIRECT_URI || 'https://subscriber-gilt.vercel.app/api/auth/outlook/callback',
    });
    if (!tokenResponse?.account?.username) throw new Error('No email');
    const email = tokenResponse.account.username;
    await prisma.connectedAccount.upsert({
      where: { userId_provider_email: { userId, provider: 'OUTLOOK', email } },
      update: { accessToken: tokenResponse.accessToken, tokenExpiry: tokenResponse.expiresOn || null, scopes: MICROSOFT_SCOPES.join(' '), status: 'ACTIVE' },
      create: { userId, provider: 'OUTLOOK', email, accessToken: tokenResponse.accessToken, tokenExpiry: tokenResponse.expiresOn || null, scopes: MICROSOFT_SCOPES.join(' '), status: 'ACTIVE' },
    });
    res.redirect(frontendUrl + '/onboarding?connected=outlook');
  } catch (error) {
    console.error('Outlook callback error:', error);
    res.redirect(frontendUrl + '/onboarding?error=outlook_callback_failed');
  }
});

// Get connected accounts
app.get('/api/user/connected-accounts', authenticate, async (req: AuthRequest, res) => {
  try {
    const accounts = await prisma.connectedAccount.findMany({
      where: { userId: req.userId },
      select: { id: true, provider: true, email: true, status: true, createdAt: true },
    });
    res.json({ success: true, data: accounts });
  } catch (error) {
    console.error('Get connected accounts error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch connected accounts' });
  }
});

// Disconnect account
app.delete('/api/auth/disconnect/:accountId', authenticate, async (req: AuthRequest, res) => {
  try {
    const accountId = req.params.accountId as string;
    const userId = req.userId!;
    const account = await prisma.connectedAccount.findFirst({ where: { id: accountId, userId } });
    if (!account) return res.status(404).json({ success: false, error: 'Not found' });
    await prisma.connectedAccount.delete({ where: { id: accountId } });
    res.json({ success: true, message: 'Disconnected' });
  } catch (error) {
    console.error('Disconnect error:', error);
    res.status(500).json({ success: false, error: 'Failed' });
  }
});

// User routes
app.post('/api/user/complete-onboarding', authenticate, async (req: AuthRequest, res) => {
  try {
    await prisma.user.update({
      where: { id: req.userId },
      data: { onboardingCompleted: true },
    });
    res.json({ success: true, data: { onboardingCompleted: true } });
  } catch {
    res.status(500).json({ error: 'Failed to complete onboarding' });
  }
});

// Subscriptions routes
app.get('/api/subscriptions', authenticate, async (req: AuthRequest, res) => {
  try {
    const { status, categoryId } = req.query;

    const where: any = { userId: req.userId };
    if (status) where.status = status;
    if (categoryId) where.categoryId = categoryId;

    const subscriptions = await prisma.subscription.findMany({
      where,
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: { items: subscriptions, total: subscriptions.length } });
  } catch {
    res.status(500).json({ error: 'Failed to fetch subscriptions' });
  }
});

app.post('/api/subscriptions', authenticate, async (req: AuthRequest, res) => {
  try {
    const data = subscriptionSchema.parse(req.body);

    const subscription = await prisma.subscription.create({
      data: {
        ...data,
        userId: req.userId!,
        startDate: new Date(data.startDate),
        nextBillingDate: data.nextBillingDate ? new Date(data.nextBillingDate) : null,
      },
      include: { category: true },
    });

    res.status(201).json({ success: true, data: subscription });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to create subscription' });
  }
});

app.put('/api/subscriptions/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const data = subscriptionSchema.partial().parse(req.body);

    const existing = await prisma.subscription.findFirst({
      where: { id, userId: req.userId },
    });
    if (!existing) return res.status(404).json({ error: 'Subscription not found' });

    const subscription = await prisma.subscription.update({
      where: { id },
      data: {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        nextBillingDate: data.nextBillingDate ? new Date(data.nextBillingDate) : undefined,
      },
      include: { category: true },
    });

    res.json({ success: true, data: subscription });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid input' });
    }
    res.status(500).json({ error: 'Failed to update subscription' });
  }
});

app.delete('/api/subscriptions/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.subscription.findFirst({
      where: { id, userId: req.userId },
    });
    if (!existing) return res.status(404).json({ error: 'Subscription not found' });

    await prisma.subscription.delete({ where: { id } });
    res.json({ success: true, message: 'Subscription deleted' });
  } catch {
    res.status(500).json({ error: 'Failed to delete subscription' });
  }
});

// Categories routes
app.get('/api/categories', authenticate, async (req: AuthRequest, res) => {
  try {
    const categories = await prisma.category.findMany({
      where: { userId: req.userId },
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, data: categories });
  } catch {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

app.post('/api/categories', authenticate, async (req: AuthRequest, res) => {
  try {
    const { name, icon, color, budget } = req.body;

    const category = await prisma.category.create({
      data: { userId: req.userId!, name, icon, color, budget },
    });

    res.status(201).json({ success: true, data: category });
  } catch {
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// Analytics routes
app.get('/api/analytics/summary', authenticate, async (req: AuthRequest, res) => {
  try {
    const subscriptions = await prisma.subscription.findMany({
      where: { userId: req.userId, status: { in: ['ACTIVE', 'TRIAL'] } },
      include: { category: true },
    });

    const BILLING_CYCLE_MONTHS: Record<string, number> = {
      FREE: 0, TRIAL: 0, WEEKLY: 0.25, BIWEEKLY: 0.5,
      MONTHLY: 1, QUARTERLY: 3, BIANNUAL: 6, YEARLY: 12, LIFETIME: 0, CUSTOM: 1,
    };

    const normalizeToMonthly = (cost: number, cycle: string) => {
      const months = BILLING_CYCLE_MONTHS[cycle] || 1;
      return months === 0 ? 0 : cost / months;
    };

    const totalMonthly = subscriptions.reduce(
      (sum, sub) => sum + normalizeToMonthly(Number(sub.cost), sub.billingCycle),
      0
    );

    const categoryMap = new Map<string, { name: string; amount: number; count: number }>();
    subscriptions.forEach((sub) => {
      const catId = sub.categoryId || 'uncategorized';
      const catName = sub.category?.name || 'Uncategorized';
      const monthlyCost = normalizeToMonthly(Number(sub.cost), sub.billingCycle);

      if (!categoryMap.has(catId)) {
        categoryMap.set(catId, { name: catName, amount: 0, count: 0 });
      }
      const cat = categoryMap.get(catId)!;
      cat.amount += monthlyCost;
      cat.count += 1;
    });

    const byCategory = Array.from(categoryMap.entries()).map(([id, data]) => ({
      categoryId: id === 'uncategorized' ? null : id,
      categoryName: data.name,
      amount: Math.round(data.amount * 100) / 100,
      percentage: totalMonthly > 0 ? Math.round((data.amount / totalMonthly) * 100) : 0,
      count: data.count,
    }));

    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const upcomingRenewals = subscriptions
      .filter((sub) => sub.nextBillingDate && sub.nextBillingDate <= thirtyDaysFromNow)
      .map((sub) => ({
        subscriptionId: sub.id,
        name: sub.name,
        cost: Number(sub.cost),
        dueDate: sub.nextBillingDate,
        daysUntil: Math.ceil((sub.nextBillingDate!.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
      }))
      .sort((a, b) => a.daysUntil - b.daysUntil);

    const statusCounts = await prisma.subscription.groupBy({
      by: ['status'],
      where: { userId: req.userId },
      _count: true,
    });

    const subscriptionCount = { active: 0, paused: 0, cancelled: 0, trial: 0 };
    statusCounts.forEach((item) => {
      const status = item.status.toLowerCase() as keyof typeof subscriptionCount;
      if (status in subscriptionCount) subscriptionCount[status] = item._count;
    });

    res.json({
      success: true,
      data: {
        totalMonthly: Math.round(totalMonthly * 100) / 100,
        totalYearly: Math.round(totalMonthly * 12 * 100) / 100,
        byCategory,
        upcomingRenewals,
        subscriptionCount,
      },
    });
  } catch {
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Export as Vercel serverless function
export default async function handler(req: VercelRequest, res: VercelResponse) {
  return app(req as any, res as any);
}
