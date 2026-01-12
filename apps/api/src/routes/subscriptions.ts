import { Router, type Router as RouterType } from 'express';
import { prisma } from '../services/prisma';
import { AppError } from '../middleware/errorHandler';
import { authenticate, AuthRequest } from '../middleware/auth';
import { createSubscriptionSchema, updateSubscriptionSchema } from '../../../../packages/shared/dist';

export const subscriptionRouter: RouterType = Router();

// All routes require authentication
subscriptionRouter.use(authenticate);

// List subscriptions
subscriptionRouter.get('/', async (req: AuthRequest, res, next) => {
  try {
    const { status, categoryId, page = '1', limit = '50' } = req.query;

    const where: any = { userId: req.userId };
    if (status) where.status = status;
    if (categoryId) where.categoryId = categoryId;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    const [subscriptions, total] = await Promise.all([
      prisma.subscription.findMany({
        where,
        include: {
          category: true,
          account: true,
        },
        orderBy: { nextBillingDate: 'asc' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
      prisma.subscription.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        items: subscriptions,
        total,
        page: pageNum,
        pageSize: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get single subscription
subscriptionRouter.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    const subscription = await prisma.subscription.findFirst({
      where: {
        id: req.params.id as string,
        userId: req.userId,
      },
      include: {
        category: true,
        account: true,
        priceHistory: {
          orderBy: { changedAt: 'desc' },
          take: 10,
        },
        reminders: true,
      },
    });

    if (!subscription) {
      throw new AppError(404, 'Subscription not found');
    }

    res.json({ success: true, data: subscription });
  } catch (error) {
    next(error);
  }
});

// Create subscription
subscriptionRouter.post('/', async (req: AuthRequest, res, next) => {
  try {
    const data = createSubscriptionSchema.parse(req.body);

    // Serialize arrays to JSON strings for Prisma (SQLite stores as string)
    const { sharedWith, tags, ...rest } = data;
    const subscription = await prisma.subscription.create({
      data: {
        ...rest,
        userId: req.userId!,
        cost: data.cost,
        sharedWith: sharedWith ? sharedWith.map(s => JSON.stringify(s)) : undefined,
        tags: tags && tags.length > 0 ? tags : undefined,
      },
      include: {
        category: true,
        account: true,
      },
    });

    res.status(201).json({ success: true, data: subscription });
  } catch (error) {
    next(error);
  }
});

// Update subscription
subscriptionRouter.patch('/:id', async (req: AuthRequest, res, next) => {
  try {
    const data = updateSubscriptionSchema.parse(req.body);

    // Verify ownership
    const existing = await prisma.subscription.findFirst({
      where: { id: req.params.id as string, userId: req.userId },
    });

    if (!existing) {
      throw new AppError(404, 'Subscription not found');
    }

    // Track price changes
    if (data.cost !== undefined && data.cost !== Number(existing.cost)) {
      await prisma.priceHistory.create({
        data: {
          subscriptionId: existing.id,
          previousCost: existing.cost,
          newCost: data.cost,
        },
      });
    }

    // Serialize arrays for Prisma
    const { sharedWith, tags, ...rest } = data;
    const updateData: any = { ...rest };
    if (sharedWith !== undefined) {
      updateData.sharedWith = sharedWith ? sharedWith.map((s: any) => JSON.stringify(s)) : [];
    }
    if (tags !== undefined) {
      updateData.tags = tags && tags.length > 0 ? tags : [];
    }

    const subscription = await prisma.subscription.update({
      where: { id: req.params.id as string },
      data: updateData,
      include: {
        category: true,
        account: true,
      },
    });

    res.json({ success: true, data: subscription });
  } catch (error) {
    next(error);
  }
});

// Delete subscription
subscriptionRouter.delete('/:id', async (req: AuthRequest, res, next) => {
  try {
    // Verify ownership
    const existing = await prisma.subscription.findFirst({
      where: { id: req.params.id as string, userId: req.userId },
    });

    if (!existing) {
      throw new AppError(404, 'Subscription not found');
    }

    await prisma.subscription.delete({
      where: { id: req.params.id as string },
    });

    res.json({ success: true, message: 'Subscription deleted' });
  } catch (error) {
    next(error);
  }
});
