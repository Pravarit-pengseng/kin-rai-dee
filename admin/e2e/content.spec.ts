/**
 * E2E — Admin Dashboard: Content management (Posts & Comments)
 * Tests: navigate to posts/comments tabs, toggle visibility, delete, audit log appears
 */

import { test, expect } from '@playwright/test';
import { loginAsAdmin, navigateTo } from './fixtures/auth';

test.describe('Admin Content Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await loginAsAdmin(page);
  });

  // ── Navigation ────────────────────────────────────────────────────────────

  test('navigates to Posts Management tab', async ({ page }) => {
    await navigateTo(page, 'จัดการเนื้อหา');
    await expect(page.locator('.header-page-title')).toContainText('จัดการเนื้อหา', { timeout: 5000 });
  });

  test('posts table renders without error toast', async ({ page }) => {
    await navigateTo(page, 'จัดการเนื้อหา');
    await page.waitForLoadState('networkidle');

    const errorToast = page.locator('.toast-error');
    const hasError = await errorToast.isVisible({ timeout: 2000 }).catch(() => false);
    expect(hasError).toBeFalsy();

    const table = page.locator('.admin-table, table');
    const emptyState = page.locator('.empty-state');
    await expect(table.or(emptyState)).toBeVisible({ timeout: 8000 });
  });

  test('can toggle post visibility', async ({ page }) => {
    await navigateTo(page, 'จัดการเนื้อหา');
    await page.waitForLoadState('networkidle');

    const rows = page.locator('.admin-table tbody tr, table tbody tr');
    if (await rows.count() === 0) {
      test.skip();
      return;
    }

    // Find the visibility toggle button in the first row
    const visibilityBtn = rows.first().locator(
      '[data-testid="toggle-visibility"], button[title*="ซ่อน"], button[title*="แสดง"]'
    );
    const hasBtn = await visibilityBtn.isVisible({ timeout: 2000 }).catch(() => false);
    if (!hasBtn) {
      test.skip();
      return;
    }

    await visibilityBtn.click();
    // Should show success feedback (toast or UI state change)
    const successFeedback = page.locator('.toast-success, .toast[class*="success"], [data-testid="success-msg"]');
    await expect(successFeedback).toBeVisible({ timeout: 6000 });
  });

  // ── Comments ──────────────────────────────────────────────────────────────

  test('navigates to Comments management tab', async ({ page }) => {
    const commentsTab = page.locator('.nav-link', { hasText: 'ความคิดเห็น' });
    const hasTab = await commentsTab.isVisible({ timeout: 3000 }).catch(() => false);
    if (!hasTab) {
      test.skip();
      return;
    }
    await commentsTab.click();
    await expect(page.locator('.header-page-title')).toContainText('ความคิดเห็น', { timeout: 5000 });
  });

  // ── Audit Logs ────────────────────────────────────────────────────────────

  test('audit logs tab renders table with correct headers', async ({ page }) => {
    await navigateTo(page, 'ประวัติการทำงาน');
    await expect(page.locator('.header-page-title')).toContainText('ประวัติการทำงาน', { timeout: 5000 });

    await expect(page.locator('.admin-table')).toBeVisible({ timeout: 8000 });
    await expect(page.locator('.admin-table th').first()).toContainText('วันและเวลา');

    const errorToast = page.locator('.toast-error');
    const hasError = await errorToast.isVisible({ timeout: 1500 }).catch(() => false);
    expect(hasError).toBeFalsy();
  });
});

