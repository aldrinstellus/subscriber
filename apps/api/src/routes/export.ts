import { Router } from 'express';
import { prisma } from '../services/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

export const exportRouter = Router();

// All routes require authentication
exportRouter.use(authenticate);

// Export subscriptions as CSV
exportRouter.get('/csv', async (req: AuthRequest, res, next) => {
  try {
    const subscriptions = await prisma.subscription.findMany({
      where: { userId: req.userId },
      include: {
        category: true,
      },
      orderBy: { name: 'asc' },
    });

    // CSV headers
    const headers = [
      'Name',
      'Cost',
      'Billing Cycle',
      'Status',
      'Category',
      'Start Date',
      'Next Billing Date',
      'Website URL',
      'Notes',
    ];

    // Escape CSV field (handle commas, quotes, newlines)
    const escapeCSV = (field: any): string => {
      if (field === null || field === undefined) return '';
      const str = String(field);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    // Format date for CSV
    const formatDate = (date: Date | null): string => {
      if (!date) return '';
      return new Date(date).toISOString().split('T')[0];
    };

    // Build CSV rows
    const rows = subscriptions.map((sub) => [
      escapeCSV(sub.name),
      escapeCSV(Number(sub.cost).toFixed(2)),
      escapeCSV(sub.billingCycle),
      escapeCSV(sub.status),
      escapeCSV(sub.category?.name || 'Uncategorized'),
      escapeCSV(formatDate(sub.startDate)),
      escapeCSV(formatDate(sub.nextBillingDate)),
      escapeCSV(sub.websiteUrl),
      escapeCSV(sub.notes),
    ]);

    // Combine headers and rows
    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

    // Set response headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="subscriptions-${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csvContent);
  } catch (error) {
    next(error);
  }
});

// Export subscriptions as JSON
exportRouter.get('/json', async (req: AuthRequest, res, next) => {
  try {
    const subscriptions = await prisma.subscription.findMany({
      where: { userId: req.userId },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            icon: true,
            color: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Transform for export (clean up internal fields)
    const exportData = subscriptions.map((sub) => ({
      name: sub.name,
      cost: Number(sub.cost),
      billingCycle: sub.billingCycle,
      status: sub.status,
      category: sub.category?.name || null,
      startDate: sub.startDate?.toISOString().split('T')[0] || null,
      nextBillingDate: sub.nextBillingDate?.toISOString().split('T')[0] || null,
      websiteUrl: sub.websiteUrl,
      logoUrl: sub.logoUrl,
      notes: sub.notes,
    }));

    const exportPayload = {
      exportedAt: new Date().toISOString(),
      count: exportData.length,
      subscriptions: exportData,
    };

    // Set response headers for file download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="subscriptions-${new Date().toISOString().split('T')[0]}.json"`);
    res.json(exportPayload);
  } catch (error) {
    next(error);
  }
});
