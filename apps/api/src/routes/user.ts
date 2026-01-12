import { Router, type Router as RouterType } from 'express';
import { prisma } from '../services/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

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
    const user = await prisma.user.update({
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

    res.json({ success: true, data: accounts });
  } catch (error) {
    next(error);
  }
});
