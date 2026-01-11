import { Router } from 'express';
import { prisma } from '../services/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { BILLING_CYCLE_MONTHS } from 'shared';

export const analyticsRouter = Router();

// All routes require authentication
analyticsRouter.use(authenticate);

// Get spending summary
analyticsRouter.get('/summary', async (req: AuthRequest, res, next) => {
  try {
    // Get all active subscriptions
    const subscriptions = await prisma.subscription.findMany({
      where: {
        userId: req.userId,
        status: { in: ['ACTIVE', 'TRIAL'] },
      },
      include: {
        category: true,
      },
    });

    // Calculate monthly cost for each subscription
    const normalizeToMonthly = (cost: number, cycle: string): number => {
      const months = BILLING_CYCLE_MONTHS[cycle] || 1;
      if (months === 0) return 0;
      return cost / months;
    };

    // Total monthly spend
    const totalMonthly = subscriptions.reduce((sum, sub) => {
      return sum + normalizeToMonthly(Number(sub.cost), sub.billingCycle);
    }, 0);

    // Spending by category
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

    // Upcoming renewals (next 30 days)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const upcomingRenewals = subscriptions
      .filter((sub) => sub.nextBillingDate && sub.nextBillingDate <= thirtyDaysFromNow)
      .map((sub) => ({
        subscriptionId: sub.id,
        name: sub.name,
        cost: Number(sub.cost),
        dueDate: sub.nextBillingDate,
        daysUntil: Math.ceil(
          (sub.nextBillingDate!.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        ),
      }))
      .sort((a, b) => a.daysUntil - b.daysUntil);

    // Subscription counts by status
    const statusCounts = await prisma.subscription.groupBy({
      by: ['status'],
      where: { userId: req.userId },
      _count: true,
    });

    const subscriptionCount = {
      active: 0,
      paused: 0,
      cancelled: 0,
      trial: 0,
    };

    statusCounts.forEach((item) => {
      const status = item.status.toLowerCase() as keyof typeof subscriptionCount;
      if (status in subscriptionCount) {
        subscriptionCount[status] = item._count;
      }
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
  } catch (error) {
    next(error);
  }
});

// Get monthly trend (last 12 months)
analyticsRouter.get('/trend', async (req: AuthRequest, res, next) => {
  try {
    // This would require historical data tracking
    // For MVP, return placeholder structure
    const months = [];
    const now = new Date();

    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        month: date.toISOString().slice(0, 7),
        label: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        amount: 0, // Would be calculated from historical data
      });
    }

    res.json({ success: true, data: months });
  } catch (error) {
    next(error);
  }
});
