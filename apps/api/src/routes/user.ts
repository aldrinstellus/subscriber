import { Router, type Router as RouterType } from 'express';
import { prisma } from '../services/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { triggerEmailScan } from '../services/emailScanner';

export const userRouter: RouterType = Router();

// All routes require authentication
userRouter.use(authenticate);

// Get current user
userRouter.get('/me', async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        currency: true,
        timezone: true,
        onboardingCompleted: true,
        createdAt: true,
      },
    });

    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
});

// Update user settings
userRouter.patch('/settings', async (req: AuthRequest, res, next) => {
  try {
    const { currency, timezone, name } = req.body;

    const user = await prisma.user.update({
      where: { id: req.userId },
      data: {
        ...(currency && { currency }),
        ...(timezone && { timezone }),
        ...(name !== undefined && { name }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        currency: true,
        timezone: true,
      },
    });

    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
});

// Complete onboarding
userRouter.post('/complete-onboarding', async (req: AuthRequest, res, next) => {
  try {
    await prisma.user.update({
      where: { id: req.userId },
      data: { onboardingCompleted: true },
    });

    res.json({ success: true, data: { onboardingCompleted: true } });
  } catch (error) {
    next(error);
  }
});

// Get connected accounts
userRouter.get('/connected-accounts', async (req: AuthRequest, res, next) => {
  try {
    const accounts = await prisma.connectedAccount.findMany({
      where: { userId: req.userId },
      select: {
        id: true,
        provider: true,
        email: true,
        status: true,
        lastSyncAt: true,
        syncStatus: true,
        createdAt: true,
      },
    });

    res.json({ success: true, data: { accounts } });
  } catch (error) {
    next(error);
  }
});

// Scan connected email accounts for subscriptions
userRouter.post('/scan-emails', async (req: AuthRequest, res, next) => {
  try {
    const userId = req.userId!;

    // Check if user has connected accounts
    const accounts = await prisma.connectedAccount.findMany({
      where: { userId, status: 'ACTIVE' },
    });

    if (accounts.length === 0) {
      return res.json({
        success: true,
        data: {
          message: 'No connected email accounts found. Please connect Gmail or Outlook first.',
          results: [],
        },
      });
    }

    // Trigger scan
    const { results } = await triggerEmailScan(userId);

    const totalFound = results.reduce((sum, r) => sum + r.found, 0);
    const totalAdded = results.reduce((sum, r) => sum + r.added, 0);

    res.json({
      success: true,
      data: {
        message: `Scanned ${accounts.length} account(s). Found ${totalFound} subscriptions, added ${totalAdded} new.`,
        results,
      },
    });
  } catch (error) {
    console.error('Email scan error:', error);
    next(error);
  }
});
