import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create demo user
  const passwordHash = await bcrypt.hash('demo1234', 12);
  const user = await prisma.user.upsert({
    where: { email: 'demo@subscriber.app' },
    update: {},
    create: {
      email: 'demo@subscriber.app',
      passwordHash,
      name: 'Demo User',
      currency: 'USD',
      timezone: 'America/New_York',
    },
  });
  console.log('Created demo user:', user.email);

  // Create categories
  const categories = [
    { name: 'Streaming', icon: 'tv', color: '#ef4444' },
    { name: 'Music', icon: 'music', color: '#22c55e' },
    { name: 'Software', icon: 'code', color: '#3b82f6' },
    { name: 'Gaming', icon: 'gamepad-2', color: '#8b5cf6' },
    { name: 'Cloud Storage', icon: 'cloud', color: '#06b6d4' },
    { name: 'Productivity', icon: 'briefcase', color: '#6366f1' },
    { name: 'Fitness', icon: 'dumbbell', color: '#10b981' },
  ];

  const createdCategories: Record<string, string> = {};

  for (const cat of categories) {
    const created = await prisma.category.upsert({
      where: { userId_name: { userId: user.id, name: cat.name } },
      update: {},
      create: {
        userId: user.id,
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
      },
    });
    createdCategories[cat.name] = created.id;
  }
  console.log('Created categories:', Object.keys(createdCategories).length);

  // Create sample subscriptions
  const subscriptions = [
    { name: 'Netflix', cost: 15.99, billingCycle: 'MONTHLY', category: 'Streaming', status: 'ACTIVE', daysOffset: 5 },
    { name: 'Spotify', cost: 10.99, billingCycle: 'MONTHLY', category: 'Music', status: 'ACTIVE', daysOffset: 12 },
    { name: 'Disney+', cost: 7.99, billingCycle: 'MONTHLY', category: 'Streaming', status: 'ACTIVE', daysOffset: 18 },
    { name: 'Adobe Creative Cloud', cost: 54.99, billingCycle: 'MONTHLY', category: 'Software', status: 'ACTIVE', daysOffset: 1 },
    { name: 'ChatGPT Plus', cost: 20.0, billingCycle: 'MONTHLY', category: 'Software', status: 'ACTIVE', daysOffset: 8 },
    { name: 'GitHub Pro', cost: 4.0, billingCycle: 'MONTHLY', category: 'Software', status: 'ACTIVE', daysOffset: 15 },
    { name: 'Dropbox Plus', cost: 11.99, billingCycle: 'MONTHLY', category: 'Cloud Storage', status: 'ACTIVE', daysOffset: 22 },
    { name: 'Notion', cost: 10.0, billingCycle: 'MONTHLY', category: 'Productivity', status: 'TRIAL', daysOffset: 25 },
    { name: 'Xbox Game Pass', cost: 14.99, billingCycle: 'MONTHLY', category: 'Gaming', status: 'ACTIVE', daysOffset: 3 },
    { name: 'YouTube Premium', cost: 13.99, billingCycle: 'MONTHLY', category: 'Streaming', status: 'ACTIVE', daysOffset: 10 },
    { name: 'Microsoft 365', cost: 99.99, billingCycle: 'YEARLY', category: 'Software', status: 'ACTIVE', daysOffset: 45 },
    { name: 'Peloton', cost: 44.0, billingCycle: 'MONTHLY', category: 'Fitness', status: 'PAUSED', daysOffset: 7 },
  ];

  // Delete existing subscriptions for this user
  await prisma.subscription.deleteMany({ where: { userId: user.id } });

  for (const sub of subscriptions) {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 3);

    const nextBillingDate = new Date();
    nextBillingDate.setDate(nextBillingDate.getDate() + sub.daysOffset);

    await prisma.subscription.create({
      data: {
        userId: user.id,
        name: sub.name,
        cost: sub.cost,
        billingCycle: sub.billingCycle,
        categoryId: createdCategories[sub.category],
        status: sub.status,
        startDate,
        nextBillingDate,
        autoRenew: true,
        source: 'MANUAL',
      },
    });
  }
  console.log('Created subscriptions:', subscriptions.length);

  // Create notification settings
  await prisma.notificationSettings.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      emailEnabled: true,
      renewalReminders: true,
      priceChangeAlerts: true,
      monthlyReport: true,
    },
  });
  console.log('Created notification settings');

  console.log('\n✅ Seeding complete!');
  console.log('\nDemo account:');
  console.log('  Email: demo@subscriber.app');
  console.log('  Password: demo1234');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
