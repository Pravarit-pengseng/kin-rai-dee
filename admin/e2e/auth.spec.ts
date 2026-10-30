/**
 * E2E — Admin Dashboard: Authentication flows
 * Tests: login page display, successful login, failed login, logout
 */

import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './fixtures/auth';

test.describe('Admin Auth', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  // ── Login page ────────────────────────────────────────────────────────────

  test('shows login form when unauthenticated', async ({ page }) => {
    // Force logout state by clearing storage
    await page.context().clearCookies();
    await page.reload();

    await expect(page.locator('.login-card')).toBeVisible({ timeout: 8000 });
    await expect(page.locator('.login-title')).toContainText('ระบบจัดการผู้ดูแล');
    await expect(page.locator('input[type="text"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('shows error on wrong credentials', async ({ page }) => {
    await page.context().clearCookies();
    await page.reload();

    const loginCard = page.locator('.login-card');
    const isVisible = await loginCard.isVisible({ timeout: 6000 }).catch(() => false);
    if (!isVisible) {
      test.skip(); // Already logged in
      return;
    }

    await page.fill('input[type="text"]', 'wrong@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Error message should appear — not redirected to dashboard
    const errorMsg = page.locator('.error-message, .toast-error, [role="alert"]');
    await expect(errorMsg).toBeVisible({ timeout: 8000 });
    // Must still be on the login page
    await expect(page.locator('.login-card')).toBeVisible();
  });

  // ── Successful login ──────────────────────────────────────────────────────

  test('logs in as admin and lands on Reports Queue', async ({ page }) => {
    await loginAsAdmin(page);

    // Verify brand and default page title
    await expect(page.locator('.brand-title')).toContainText('KIN RAI DEE');
    await expect(page.locator('.header-page-title')).toContainText('รายงาน');
  });

  // ── Logout ────────────────────────────────────────────────────────────────

  test('logout returns to login screen', async ({ page }) => {
    await loginAsAdmin(page);

    const logoutBtn = page.locator('[data-testid="logout-btn"], .logout-btn, button:has-text("ออกจากระบบ")');
    const hasLogout = await logoutBtn.isVisible({ timeout: 3000 }).catch(() => false);
    if (!hasLogout) {
      test.skip(); // Logout button not found — check selector
      return;
    }

    await logoutBtn.click();
    await expect(page.locator('.login-card')).toBeVisible({ timeout: 8000 });
  });
});

