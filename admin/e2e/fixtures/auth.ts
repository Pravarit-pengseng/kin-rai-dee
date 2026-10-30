/**
 * Shared auth helper for Playwright E2E tests.
 *
 * Usage:
 *   import { loginAsAdmin } from './fixtures/auth';
 *   await loginAsAdmin(page);
 *
 * Credentials are read from environment variables (never hardcoded):
 *   ADMIN_EMAIL, ADMIN_PASSWORD
 *
 * Set them in admin/.env.test or your CI secrets.
 */

import { Page, expect } from '@playwright/test';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? '';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? '';

/** Log in via the admin dashboard login form. */
export async function loginAsAdmin(page: Page): Promise<void> {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    throw new Error(
      'Set ADMIN_EMAIL and ADMIN_PASSWORD environment variables before running E2E tests.'
    );
  }

  const loginCard = page.locator('.login-card');
  const isLoginVisible = await loginCard.isVisible({ timeout: 5000 }).catch(() => false);

  if (isLoginVisible) {
    await page.fill('input[type="text"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
  }

  // Wait for authenticated state — brand title is visible after successful login
  await expect(page.locator('.brand-title')).toContainText('KIN RAI DEE', { timeout: 15000 });
}

/** Navigate to a nav tab by its Thai label text. */
export async function navigateTo(page: Page, tabText: string): Promise<void> {
  await page.locator('.nav-link', { hasText: tabText }).click();
  // Wait for navigation to settle
  await page.waitForLoadState('networkidle');
}

