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
    { name: 'News', icon: 'newspaper', color: '#f97316' },
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
    {
      name: 'Netflix',
      cost: 15.99,
      billingCycle: 'MONTHLY' as const,
      category: 'Streaming',
      status: 'ACTIVE' as const,
      daysOffset: 5,
    },
    {
      name: 'Spotify',
      cost: 10.99,
      billingCycle: 'MONTHLY' as const,
      category: 'Music',
      status: 'ACTIVE' as const,
      daysOffset: 12,
    },
    {
      name: 'Disney+',
      cost: 7.99,
      billingCycle: 'MONTHLY' as const,
      category: 'Streaming',
      status: 'ACTIVE' as const,
      daysOffset: 18,
    },
    {
      name: 'Adobe Creative Cloud',
      cost: 54.99,
      billingCycle: 'MONTHLY' as const,
      category: 'Software',
      status: 'ACTIVE' as const,
      daysOffset: 1,
    },
    {
      name: 'ChatGPT Plus',
      cost: 20.0,
      billingCycle: 'MONTHLY' as const,
      category: 'Software',
      status: 'ACTIVE' as const,
      daysOffset: 8,
    },
    {
      name: 'GitHub Pro',
      cost: 4.0,
      billingCycle: 'MONTHLY' as const,
      category: 'Software',
      status: 'ACTIVE' as const,
      daysOffset: 15,
    },
    {
      name: 'Dropbox Plus',
      cost: 11.99,
      billingCycle: 'MONTHLY' as const,
      category: 'Cloud Storage',
      status: 'ACTIVE' as const,
      daysOffset: 22,
    },
    {
      name: 'Notion',
      cost: 10.0,
      billingCycle: 'MONTHLY' as const,
      category: 'Productivity',
      status: 'TRIAL' as const,
      daysOffset: 25,
    },
    {
      name: 'Xbox Game Pass',
      cost: 14.99,
      billingCycle: 'MONTHLY' as const,
      category: 'Gaming',
      status: 'ACTIVE' as const,
      daysOffset: 3,
    },
    {
      name: 'YouTube Premium',
      cost: 13.99,
      billingCycle: 'MONTHLY' as const,
      category: 'Streaming',
      status: 'ACTIVE' as const,
      daysOffset: 10,
    },
    {
      name: 'Microsoft 365',
      cost: 99.99,
      billingCycle: 'YEARLY' as const,
      category: 'Software',
      status: 'ACTIVE' as const,
      daysOffset: 45,
    },
    {
      name: 'Peloton',
      cost: 44.0,
      billingCycle: 'MONTHLY' as const,
      category: 'Fitness',
      status: 'PAUSED' as const,
      daysOffset: 7,
    },
  ];

  for (const sub of subscriptions) {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 3); // Started 3 months ago

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

  // Seed service database for autocomplete
  const services = [
    { name: 'Netflix', category: 'Streaming', typicalCost: 15.99, emailDomains: ['netflix.com'] },
    { name: 'Spotify', category: 'Music', typicalCost: 10.99, emailDomains: ['spotify.com'] },
    { name: 'Disney+', category: 'Streaming', typicalCost: 7.99, emailDomains: ['disneyplus.com'] },
    { name: 'HBO Max', category: 'Streaming', typicalCost: 15.99, emailDomains: ['hbomax.com'] },
    { name: 'Amazon Prime', category: 'Streaming', typicalCost: 14.99, emailDomains: ['amazon.com'] },
    { name: 'YouTube Premium', category: 'Streaming', typicalCost: 13.99, emailDomains: ['youtube.com'] },
    { name: 'Apple Music', category: 'Music', typicalCost: 10.99, emailDomains: ['apple.com'] },
    { name: 'Adobe Creative Cloud', category: 'Software', typicalCost: 54.99, emailDomains: ['adobe.com'] },
    { name: 'Microsoft 365', category: 'Software', typicalCost: 9.99, emailDomains: ['microsoft.com'] },
    { name: 'Dropbox', category: 'Cloud Storage', typicalCost: 11.99, emailDomains: ['dropbox.com'] },
    { name: 'Google One', category: 'Cloud Storage', typicalCost: 2.99, emailDomains: ['google.com'] },
    { name: 'ChatGPT Plus', category: 'Software', typicalCost: 20.0, emailDomains: ['openai.com'] },
    { name: 'GitHub Pro', category: 'Software', typicalCost: 4.0, emailDomains: ['github.com'] },
    { name: 'Notion', category: 'Productivity', typicalCost: 10.0, emailDomains: ['notion.so'] },
    { name: 'Slack', category: 'Productivity', typicalCost: 8.75, emailDomains: ['slack.com'] },
    { name: 'Figma', category: 'Software', typicalCost: 15.0, emailDomains: ['figma.com'] },
  ];

  for (const service of services) {
    await prisma.serviceDatabase.upsert({
      where: { name: service.name },
      update: {},
      create: {
        name: service.name,
        category: service.category,
        typicalCost: service.typicalCost,
        billingCycle: 'MONTHLY',
        emailDomains: service.emailDomains,
        aliases: [],
        merchantNames: [],
        urlPatterns: [],
      },
    });
  }
  console.log('Created service database:', services.length);

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
