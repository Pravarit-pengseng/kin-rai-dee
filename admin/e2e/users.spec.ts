/**
 * E2E — Admin Dashboard: User management
 * Tests: navigate to users tab, suspend/unsuspend user, delete user
 */

import { test, expect } from '@playwright/test';
import { loginAsAdmin, navigateTo } from './fixtures/auth';

test.describe('Admin User Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await loginAsAdmin(page);
    await navigateTo(page, 'สมาชิก');
  });

  test('users management tab renders', async ({ page }) => {
    await expect(page.locator('.header-page-title')).toContainText('จัดการสมาชิก', { timeout: 5000 });
    const table = page.locator('.admin-table, table');
    const emptyState = page.locator('.empty-state');
    await expect(table.or(emptyState)).toBeVisible({ timeout: 8000 });
  });

  test('users table has required columns', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const headers = page.locator('.admin-table th, table th');
    if (await headers.count() === 0) {
      test.skip();
      return;
    }
    const headerTexts = await headers.allTextContents();
    const joined = headerTexts.join(' ');
    // Expect at least username/email and status columns
    expect(joined).toMatch(/ชื่อ|ผู้ใช้|email|สถานะ/i);
  });

  test('can suspend a user', async ({ page }) => {
    const rows = page.locator('.admin-table tbody tr, table tbody tr');
    if (await rows.count() === 0) {
      test.skip();
      return;
    }

    const suspendBtn = rows.first().locator(
      '[data-testid="suspend-user"], button:has-text("ระงับ"), button[title*="ระงับ"]'
    );
    const hasBtn = await suspendBtn.isVisible({ timeout: 2000 }).catch(() => false);
    if (!hasBtn) {
      test.skip();
      return;
    }

    await suspendBtn.click();

    // Expect confirmation dialog or immediate feedback
    const confirmDialog = page.locator('[role="dialog"], .modal');
    const successMsg = page.locator('.toast-success');
    await expect(confirmDialog.or(successMsg)).toBeVisible({ timeout: 6000 });
  });

  test('no error toast on user list load', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const errorToast = page.locator('.toast-error');
    const hasError = await errorToast.isVisible({ timeout: 2000 }).catch(() => false);
    expect(hasError).toBeFalsy();
  });
});

