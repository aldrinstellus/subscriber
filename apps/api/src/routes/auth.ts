import { Router, Request, Response, type Router as RouterType } from 'express';
import { google } from 'googleapis';
import { ConfidentialClientApplication } from '@azure/msal-node';
import { prisma } from '../services/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

export const authRouter: RouterType = Router();

const getGoogleOAuthClient = () => {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/api/auth/gmail/callback'
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

// Get Gmail OAuth URL (authenticated - returns URL to redirect to)
authRouter.post('/gmail/url', authenticate, async (req: AuthRequest, res: Response) => {
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

// Gmail OAuth callback (public - handles Google redirect)
authRouter.get('/gmail/callback', async (req: Request, res: Response) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5175';
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

// Get Outlook OAuth URL (authenticated - returns URL to redirect to)
authRouter.post('/outlook/url', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const msalClient = getMsalClient();
    const state = Buffer.from(JSON.stringify({ userId: req.userId })).toString('base64');
    const authUrl = await msalClient.getAuthCodeUrl({
      scopes: MICROSOFT_SCOPES,
      redirectUri: process.env.MICROSOFT_REDIRECT_URI || 'http://localhost:3001/api/auth/outlook/callback',
      state,
    });
    res.json({ success: true, url: authUrl });
  } catch (error) {
    console.error('Outlook OAuth URL error:', error);
    res.status(500).json({ success: false, error: 'Failed to generate OAuth URL' });
  }
});

// Outlook OAuth callback (public - handles Microsoft redirect)
authRouter.get('/outlook/callback', async (req: Request, res: Response) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5175';
  try {
    const { code, state } = req.query;
    if (!code || typeof code !== 'string') throw new Error('No code');
    const stateData = JSON.parse(Buffer.from(state as string, 'base64').toString());
    const userId = stateData.userId;
    const msalClient = getMsalClient();
    const tokenResponse = await msalClient.acquireTokenByCode({
      code,
      scopes: MICROSOFT_SCOPES,
      redirectUri: process.env.MICROSOFT_REDIRECT_URI || 'http://localhost:3001/api/auth/outlook/callback',
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

// Disconnect an account
authRouter.delete('/disconnect/:accountId', authenticate, async (req: AuthRequest, res: Response) => {
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
