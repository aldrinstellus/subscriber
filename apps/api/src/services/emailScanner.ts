import { google } from 'googleapis';
import { prisma } from './prisma';

interface ExtractedSubscription {
  name: string;
  cost: number;
  currency: string;
  billingCycle: string;
  fromEmail: string;
  emailSubject: string;
  emailDate: Date;
}

// Known subscription services for matching
const KNOWN_SERVICES: Record<string, { name: string; category?: string }> = {
  'netflix.com': { name: 'Netflix', category: 'Streaming' },
  'spotify.com': { name: 'Spotify', category: 'Music' },
  'apple.com': { name: 'Apple', category: 'Software' },
  'google.com': { name: 'Google One', category: 'Software' },
  'amazon.com': { name: 'Amazon Prime', category: 'Streaming' },
  'primevideo.com': { name: 'Amazon Prime Video', category: 'Streaming' },
  'hulu.com': { name: 'Hulu', category: 'Streaming' },
  'disneyplus.com': { name: 'Disney+', category: 'Streaming' },
  'hbomax.com': { name: 'HBO Max', category: 'Streaming' },
  'max.com': { name: 'Max', category: 'Streaming' },
  'youtube.com': { name: 'YouTube Premium', category: 'Streaming' },
  'notion.so': { name: 'Notion', category: 'Software' },
  'notion.com': { name: 'Notion', category: 'Software' },
  'figma.com': { name: 'Figma', category: 'Software' },
  'github.com': { name: 'GitHub', category: 'Software' },
  'slack.com': { name: 'Slack', category: 'Software' },
  'zoom.us': { name: 'Zoom', category: 'Software' },
  'dropbox.com': { name: 'Dropbox', category: 'Software' },
  'adobe.com': { name: 'Adobe Creative Cloud', category: 'Software' },
  'microsoft.com': { name: 'Microsoft 365', category: 'Software' },
  'office.com': { name: 'Microsoft 365', category: 'Software' },
  'openai.com': { name: 'ChatGPT Plus', category: 'Software' },
  'anthropic.com': { name: 'Claude Pro', category: 'Software' },
  'canva.com': { name: 'Canva Pro', category: 'Software' },
  'grammarly.com': { name: 'Grammarly', category: 'Software' },
  'linkedin.com': { name: 'LinkedIn Premium', category: 'Software' },
  'medium.com': { name: 'Medium', category: 'Other' },
  'patreon.com': { name: 'Patreon', category: 'Other' },
  'twitch.tv': { name: 'Twitch', category: 'Streaming' },
  'playstation.com': { name: 'PlayStation Plus', category: 'Gaming' },
  'xbox.com': { name: 'Xbox Game Pass', category: 'Gaming' },
  'nintendo.com': { name: 'Nintendo Switch Online', category: 'Gaming' },
  'audible.com': { name: 'Audible', category: 'Other' },
  'scribd.com': { name: 'Scribd', category: 'Other' },
  'masterclass.com': { name: 'MasterClass', category: 'Other' },
  'skillshare.com': { name: 'Skillshare', category: 'Other' },
  'coursera.org': { name: 'Coursera', category: 'Other' },
  'udemy.com': { name: 'Udemy', category: 'Other' },
  'nordvpn.com': { name: 'NordVPN', category: 'Software' },
  'expressvpn.com': { name: 'ExpressVPN', category: 'Software' },
  '1password.com': { name: '1Password', category: 'Software' },
  'lastpass.com': { name: 'LastPass', category: 'Software' },
  'bitwarden.com': { name: 'Bitwarden', category: 'Software' },
  'evernote.com': { name: 'Evernote', category: 'Software' },
  'todoist.com': { name: 'Todoist', category: 'Software' },
  'asana.com': { name: 'Asana', category: 'Software' },
  'trello.com': { name: 'Trello', category: 'Software' },
  'monday.com': { name: 'Monday.com', category: 'Software' },
  'calendly.com': { name: 'Calendly', category: 'Software' },
  'mailchimp.com': { name: 'Mailchimp', category: 'Software' },
  'hubspot.com': { name: 'HubSpot', category: 'Software' },
  'salesforce.com': { name: 'Salesforce', category: 'Software' },
  'zendesk.com': { name: 'Zendesk', category: 'Software' },
  'intercom.com': { name: 'Intercom', category: 'Software' },
  'vercel.com': { name: 'Vercel', category: 'Software' },
  'netlify.com': { name: 'Netlify', category: 'Software' },
  'heroku.com': { name: 'Heroku', category: 'Software' },
  'digitalocean.com': { name: 'DigitalOcean', category: 'Software' },
  'aws.amazon.com': { name: 'AWS', category: 'Software' },
  'cloud.google.com': { name: 'Google Cloud', category: 'Software' },
  'azure.microsoft.com': { name: 'Azure', category: 'Software' },
  'supabase.com': { name: 'Supabase', category: 'Software' },
  'firebase.google.com': { name: 'Firebase', category: 'Software' },
  'stripe.com': { name: 'Stripe', category: 'Software' },
  'paddle.com': { name: 'Paddle', category: 'Software' },
  'hotstar.com': { name: 'Disney+ Hotstar', category: 'Streaming' },
  'jiocinema.com': { name: 'JioCinema', category: 'Streaming' },
  'sonyliv.com': { name: 'SonyLIV', category: 'Streaming' },
  'zee5.com': { name: 'ZEE5', category: 'Streaming' },
  'voot.com': { name: 'Voot', category: 'Streaming' },
};

// Search queries for finding subscription emails
const SEARCH_QUERIES = [
  'subject:(subscription OR receipt OR payment OR invoice OR billing OR renewal OR charged)',
  'from:(noreply OR no-reply OR billing OR payments OR receipt OR invoice)',
  'subject:(monthly OR annual OR yearly)',
  '"your subscription" OR "payment received" OR "receipt for" OR "invoice for"',
  '"auto-renewal" OR "renewed" OR "next billing"',
];

// Price extraction patterns
const PRICE_PATTERNS = [
  /(?:USD|INR|EUR|GBP|CAD|AUD)?\s*[\$\u20B9\u20AC\u00A3]?\s*(\d{1,5}(?:[.,]\d{2})?)\s*(?:USD|INR|EUR|GBP|CAD|AUD)?/gi,
  /(?:Total|Amount|Charged|Price|Cost)[:.]?\s*[\$\u20B9\u20AC\u00A3]?\s*(\d{1,5}(?:[.,]\d{2})?)/gi,
  /(\d{1,5}(?:[.,]\d{2})?)\s*(?:per\s+month|\/month|monthly|per\s+year|\/year|yearly|annually)/gi,
];

// Currency detection
function detectCurrency(text: string): string {
  if (text.includes('\u20B9') || text.includes('INR') || text.includes('Rs')) return 'INR';
  if (text.includes('\u20AC') || text.includes('EUR')) return 'EUR';
  if (text.includes('\u00A3') || text.includes('GBP')) return 'GBP';
  if (text.includes('CAD') || text.includes('C$')) return 'CAD';
  if (text.includes('AUD') || text.includes('A$')) return 'AUD';
  return 'USD';
}

// Billing cycle detection
function detectBillingCycle(text: string): string {
  const lowerText = text.toLowerCase();
  if (lowerText.includes('annual') || lowerText.includes('yearly') || lowerText.includes('per year') || lowerText.includes('/year')) {
    return 'YEARLY';
  }
  if (lowerText.includes('quarterly') || lowerText.includes('every 3 months')) {
    return 'QUARTERLY';
  }
  if (lowerText.includes('weekly') || lowerText.includes('per week')) {
    return 'WEEKLY';
  }
  return 'MONTHLY';
}

// Extract price from email content
function extractPrice(text: string): number | null {
  for (const pattern of PRICE_PATTERNS) {
    const matches = text.match(pattern);
    if (matches) {
      for (const match of matches) {
        const numMatch = match.match(/(\d{1,5}(?:[.,]\d{2})?)/);
        if (numMatch) {
          const price = parseFloat(numMatch[1].replace(',', '.'));
          // Filter out unrealistic prices (too low or too high)
          if (price >= 0.99 && price <= 9999) {
            return price;
          }
        }
      }
    }
  }
  return null;
}

// Identify service from email
function identifyService(fromEmail: string, subject: string, body: string): { name: string; category?: string } | null {
  const lowerFrom = fromEmail.toLowerCase();
  const lowerSubject = subject.toLowerCase();
  const lowerBody = body.toLowerCase();

  // Check known services by email domain
  for (const [domain, service] of Object.entries(KNOWN_SERVICES)) {
    if (lowerFrom.includes(domain) || lowerSubject.includes(domain) || lowerBody.includes(domain.split('.')[0])) {
      return service;
    }
  }

  // Try to extract service name from subject
  const subjectPatterns = [
    /(?:your\s+)?(\w+(?:\s+\w+)?)\s+(?:subscription|receipt|invoice|payment)/i,
    /(?:receipt|invoice|payment)\s+(?:for|from)\s+(\w+(?:\s+\w+)?)/i,
    /(?:thank\s+you\s+for\s+(?:your\s+)?)?(\w+(?:\s+\w+)?)\s+(?:premium|pro|plus)/i,
  ];

  for (const pattern of subjectPatterns) {
    const match = subject.match(pattern);
    if (match && match[1]) {
      const name = match[1].trim();
      if (name.length > 2 && name.length < 50) {
        return { name };
      }
    }
  }

  return null;
}

export async function scanGmailForSubscriptions(userId: string, connectedAccountId: string): Promise<{
  found: number;
  added: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let found = 0;
  let added = 0;

  try {
    // Get the connected account with tokens
    const account = await prisma.connectedAccount.findUnique({
      where: { id: connectedAccountId },
    });

    if (!account || account.provider !== 'GMAIL') {
      throw new Error('Gmail account not found');
    }

    if (!account.accessToken) {
      throw new Error('No access token available');
    }

    // Set up Gmail API client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    oauth2Client.setCredentials({
      access_token: account.accessToken,
      refresh_token: account.refreshToken || undefined,
    });

    // Refresh token if needed
    if (account.tokenExpiry && new Date(account.tokenExpiry) < new Date()) {
      try {
        const { credentials } = await oauth2Client.refreshAccessToken();
        await prisma.connectedAccount.update({
          where: { id: connectedAccountId },
          data: {
            accessToken: credentials.access_token,
            refreshToken: credentials.refresh_token || account.refreshToken,
            tokenExpiry: credentials.expiry_date ? new Date(credentials.expiry_date) : null,
          },
        });
        oauth2Client.setCredentials(credentials);
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        await prisma.connectedAccount.update({
          where: { id: connectedAccountId },
          data: { status: 'EXPIRED' },
        });
        throw new Error('Token expired and refresh failed');
      }
    }

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Get existing subscriptions to avoid duplicates
    const existingSubscriptions = await prisma.subscription.findMany({
      where: { userId },
      select: { name: true, sourceId: true },
    });
    const existingNames = new Set(existingSubscriptions.map(s => s.name.toLowerCase()));
    const existingSourceIds = new Set(existingSubscriptions.filter(s => s.sourceId).map(s => s.sourceId));

    // Get user's categories for mapping
    const categories = await prisma.category.findMany({
      where: { userId },
    });
    const categoryMap = new Map(categories.map(c => [c.name.toLowerCase(), c.id]));

    const extractedSubscriptions: ExtractedSubscription[] = [];

    // Search emails with different queries
    for (const query of SEARCH_QUERIES) {
      try {
        const response = await gmail.users.messages.list({
          userId: 'me',
          q: query,
          maxResults: 50,
        });

        if (!response.data.messages) continue;

        for (const message of response.data.messages) {
          if (!message.id) continue;

          // Skip if already processed
          if (existingSourceIds.has(message.id)) continue;

          try {
            const fullMessage = await gmail.users.messages.get({
              userId: 'me',
              id: message.id,
              format: 'full',
            });

            const headers = fullMessage.data.payload?.headers || [];
            const fromHeader = headers.find(h => h.name?.toLowerCase() === 'from');
            const subjectHeader = headers.find(h => h.name?.toLowerCase() === 'subject');
            const dateHeader = headers.find(h => h.name?.toLowerCase() === 'date');

            const fromEmail = fromHeader?.value || '';
            const subject = subjectHeader?.value || '';
            const emailDate = dateHeader?.value ? new Date(dateHeader.value) : new Date();

            // Extract body text
            let bodyText = '';
            const extractText = (part: any): string => {
              if (part.mimeType === 'text/plain' && part.body?.data) {
                return Buffer.from(part.body.data, 'base64').toString('utf-8');
              }
              if (part.parts) {
                return part.parts.map(extractText).join('\n');
              }
              return '';
            };
            bodyText = extractText(fullMessage.data.payload);

            // Combine subject and body for analysis
            const fullText = `${subject}\n${bodyText}`;

            // Identify the service
            const service = identifyService(fromEmail, subject, bodyText);
            if (!service) continue;

            // Skip if we already have this subscription
            if (existingNames.has(service.name.toLowerCase())) continue;

            // Extract price
            const price = extractPrice(fullText);
            if (!price) continue;

            // Detect currency and billing cycle
            const currency = detectCurrency(fullText);
            const billingCycle = detectBillingCycle(fullText);

            extractedSubscriptions.push({
              name: service.name,
              cost: price,
              currency,
              billingCycle,
              fromEmail,
              emailSubject: subject,
              emailDate,
            });

            // Add to existing names to prevent duplicates in this scan
            existingNames.add(service.name.toLowerCase());
            found++;

          } catch (msgError) {
            console.error('Error processing message:', msgError);
          }
        }
      } catch (searchError) {
        console.error('Search error:', searchError);
        errors.push(`Search failed: ${query.substring(0, 30)}...`);
      }
    }

    // Create subscriptions in database
    for (const sub of extractedSubscriptions) {
      try {
        // Find matching category
        let categoryId: string | undefined;
        const knownService = Object.values(KNOWN_SERVICES).find(s => s.name === sub.name);
        if (knownService?.category) {
          categoryId = categoryMap.get(knownService.category.toLowerCase());
        }

        await prisma.subscription.create({
          data: {
            userId,
            name: sub.name,
            cost: sub.cost,
            currency: sub.currency,
            billingCycle: sub.billingCycle,
            startDate: sub.emailDate,
            nextBillingDate: calculateNextBillingDate(sub.emailDate, sub.billingCycle),
            status: 'ACTIVE',
            source: 'EMAIL',
            sourceId: `gmail-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            categoryId,
            notes: `Imported from email: ${sub.emailSubject}`,
          },
        });
        added++;
      } catch (createError) {
        console.error('Error creating subscription:', createError);
        errors.push(`Failed to create: ${sub.name}`);
      }
    }

    // Update sync status
    await prisma.connectedAccount.update({
      where: { id: connectedAccountId },
      data: {
        lastSyncAt: new Date(),
        syncStatus: `Found ${found}, Added ${added}`,
      },
    });

    return { found, added, errors };

  } catch (error) {
    console.error('Gmail scan error:', error);
    throw error;
  }
}

function calculateNextBillingDate(startDate: Date, billingCycle: string): Date {
  const next = new Date(startDate);
  const now = new Date();

  while (next < now) {
    switch (billingCycle) {
      case 'WEEKLY':
        next.setDate(next.getDate() + 7);
        break;
      case 'MONTHLY':
        next.setMonth(next.getMonth() + 1);
        break;
      case 'QUARTERLY':
        next.setMonth(next.getMonth() + 3);
        break;
      case 'YEARLY':
        next.setFullYear(next.getFullYear() + 1);
        break;
      default:
        next.setMonth(next.getMonth() + 1);
    }
  }

  return next;
}

export async function triggerEmailScan(userId: string): Promise<{
  success: boolean;
  results: { provider: string; found: number; added: number; errors: string[] }[];
}> {
  const results: { provider: string; found: number; added: number; errors: string[] }[] = [];

  // Get all connected accounts for user
  const accounts = await prisma.connectedAccount.findMany({
    where: { userId, status: 'ACTIVE' },
  });

  for (const account of accounts) {
    try {
      if (account.provider === 'GMAIL') {
        const result = await scanGmailForSubscriptions(userId, account.id);
        results.push({ provider: 'Gmail', ...result });
      }
      // TODO: Add Outlook scanning
    } catch (error) {
      console.error(`Scan error for ${account.provider}:`, error);
      results.push({
        provider: account.provider,
        found: 0,
        added: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      });
    }
  }

  return { success: true, results };
}
