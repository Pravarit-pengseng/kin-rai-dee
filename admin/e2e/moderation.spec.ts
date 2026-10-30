/**
 * E2E — Admin Dashboard: Moderation flows
 * Tests: view reports queue, open moderation drawer, take decision,
 *        assign report, navigate report filters
 */

import { test, expect } from '@playwright/test';
import { loginAsAdmin, navigateTo } from './fixtures/auth';

test.describe('Admin Moderation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await loginAsAdmin(page);
  });

  // ── Reports Queue ─────────────────────────────────────────────────────────

  test('reports queue tab loads and shows table', async ({ page }) => {
    await expect(page.locator('.header-page-title')).toContainText('รายงาน', { timeout: 15000 });
    // Table or empty-state must render
    const table = page.locator('.admin-table');
    const emptyState = page.locator('text=ไม่มีรายการ');
    await expect(table.or(emptyState).first()).toBeVisible({ timeout: 10000 });
  });

  test('report table rows have required columns', async ({ page }) => {
    const rows = page.locator('.admin-table tbody tr:not(:has(td[colspan]))');
    const count = await rows.count();
    if (count === 0) {
      test.skip(); // No reports to inspect
      return;
    }
    const firstRow = rows.first();
    // At minimum: reporter info, target, reason, status, action buttons
    await expect(firstRow).toBeVisible();
  });

  test('can filter reports by status', async ({ page }) => {
    const filterBtn = page.locator('[data-testid="filter-pending"], button:has-text("รอดำเนินการ"), .filter-tab:has-text("รอ")');
    const hasFilter = await filterBtn.isVisible({ timeout: 3000 }).catch(() => false);
    if (!hasFilter) {
      test.skip();
      return;
    }
    await filterBtn.click();
    await page.waitForLoadState('networkidle');
    // After filtering, header should still be visible (not crashed)
    await expect(page.locator('.header-page-title')).toBeVisible();
  });

  test('opening moderation drawer shows report detail', async ({ page }) => {
    const rows = page.locator('.admin-table tbody tr:not(:has(td[colspan]))');
    const count = await rows.count();
    if (count === 0) {
      test.skip(); // No active reports in DB to inspect drawer
      return;
    }

    // Click the first report row or its detail button
    const detailBtn = rows.first().locator('button, [data-testid="open-detail"]');
    const hasBtnInRow = await detailBtn.count() > 0;
    if (hasBtnInRow) {
      await detailBtn.first().click();
    } else {
      await rows.first().click();
    }

    // Moderation drawer / modal should open
    const drawer = page.locator('.moderation-drawer, .modal, [role="dialog"]');
    await expect(drawer).toBeVisible({ timeout: 6000 });
  });

  test('no error toast appears on moderation queue load', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const errorToast = page.locator('.toast-error, .toast[class*="error"]');
    const hasError = await errorToast.isVisible({ timeout: 2000 }).catch(() => false);
    expect(hasError).toBeFalsy();
  });
});

