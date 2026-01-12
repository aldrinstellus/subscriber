import { Page } from '@playwright/test';

// Test user credentials - these should be set up in Supabase
// For E2E tests, create a test user: test@subscriber.local / TestPassword123!
export const TEST_USER = {
  email: process.env.E2E_TEST_EMAIL || 'test@subscriber.local',
  password: process.env.E2E_TEST_PASSWORD || 'TestPassword123!',
  name: 'E2E Test User',
};

/**
 * Sign in with test credentials
 * This performs actual authentication through the UI
 */
export async function signInTestUser(page: Page): Promise<boolean> {
  await page.goto('/sign-in');

  // Fill in credentials
  await page.getByLabel(/email/i).fill(TEST_USER.email);
  await page.getByLabel(/password/i).fill(TEST_USER.password);

  // Submit form
  await page.getByRole('button', { name: /sign in/i }).click();

  // Wait for redirect (success) or error message (failure)
  try {
    await Promise.race([
      page.waitForURL('/', { timeout: 10000 }),
      page.waitForURL('/onboarding', { timeout: 10000 }),
      page.waitForSelector('text=/error|invalid|incorrect/i', { timeout: 10000 }),
    ]);

    // Check if we're on a protected page (success)
    const url = page.url();
    return url.includes('/') && !url.includes('/sign-in');
  } catch {
    return false;
  }
}

/**
 * Sign out the current user
 */
export async function signOutUser(page: Page): Promise<void> {
  // Look for logout button in settings or sidebar
  try {
    const logoutButton = page.getByRole('button', { name: /log ?out|sign ?out/i });
    if (await logoutButton.isVisible({ timeout: 2000 })) {
      await logoutButton.click();
    }
  } catch {
    // Navigate to sign-in to clear session
    await page.goto('/sign-in');
  }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  await page.goto('/');
  const url = page.url();
  return !url.includes('/sign-in');
}
