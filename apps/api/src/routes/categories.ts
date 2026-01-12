import { Router, type Router as RouterType } from 'express';
import { prisma } from '../services/prisma';
import { AppError } from '../middleware/errorHandler';
import { authenticate, AuthRequest } from '../middleware/auth';
import { createCategorySchema, updateCategorySchema } from '../../../../packages/shared/dist';

export const categoryRouter: RouterType = Router();

// All routes require authentication
categoryRouter.use(authenticate);

// List categories
categoryRouter.get('/', async (req: AuthRequest, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      where: { userId: req.userId },
      include: {
        _count: {
          select: { subscriptions: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    res.json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
});

// Create category
categoryRouter.post('/', async (req: AuthRequest, res, next) => {
  try {
    const data = createCategorySchema.parse(req.body);

    const category = await prisma.category.create({
      data: {
        ...data,
        userId: req.userId!,
      },
    });

    res.status(201).json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
});

// Update category
categoryRouter.patch('/:id', async (req: AuthRequest, res, next) => {
  try {
    const data = updateCategorySchema.parse(req.body);

    // Verify ownership
    const existing = await prisma.category.findFirst({
      where: { id: (req.params.id as string), userId: req.userId },
    });

    if (!existing) {
      throw new AppError(404, 'Category not found');
    }

    const category = await prisma.category.update({
      where: { id: (req.params.id as string) },
      data,
    });

    res.json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
});

// Delete category
categoryRouter.delete('/:id', async (req: AuthRequest, res, next) => {
  try {
    // Verify ownership
    const existing = await prisma.category.findFirst({
      where: { id: (req.params.id as string), userId: req.userId },
    });

    if (!existing) {
      throw new AppError(404, 'Category not found');
    }

    // Move subscriptions to uncategorized
    await prisma.subscription.updateMany({
      where: { categoryId: (req.params.id as string) },
      data: { categoryId: null },
    });

    await prisma.category.delete({
      where: { id: (req.params.id as string) },
    });

    res.json({ success: true, message: 'Category deleted' });
  } catch (error) {
    next(error);
  }
});
