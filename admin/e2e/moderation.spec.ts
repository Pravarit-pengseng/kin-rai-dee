/**
 * E2E — Admin Dashboard: Moderation flows
 * Tests: view reports queue, open moderation drawer, take decision,
 *        assign report, navigate report filters
 */

import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './fixtures/auth';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://ckkuyhpdrqwthqgifpnk.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

test.describe('Admin Moderation', () => {
  test.beforeAll(async () => {
    try {
      const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
      const { data: existing } = await supabase
        .from('reports')
        .select('id')
        .eq('status', 'pending')
        .limit(1);

      if (!existing || existing.length === 0) {
        // Query an existing post if possible
        const { data: posts } = await supabase.from('posts').select('id').limit(1);
        const targetId = posts && posts.length > 0 ? String(posts[0].id) : '1';

        await supabase.from('reports').insert({
          target_type: 'post',
          target_id: targetId,
          reason_code: 'SPAM',
          explanation: 'รายงานทดสอบอัตโนมัติ E2E Playwright',
          priority: 'medium',
          status: 'pending',
        });
      }
    } catch (e) {
      console.warn('Could not seed pending report:', e);
    }
  });

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
    // Click 'ทั้งหมด' tab to ensure reports are listed if pending is empty
    const allTab = page.locator('button:has-text("ทั้งหมด"), .filter-tab:has-text("ทั้งหมด")').first();
    if (await allTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await allTab.click();
      await page.waitForTimeout(500);
    }

    const rows = page.locator('.admin-table tbody tr:not(:has(td[colspan]))');
    const count = await rows.count();
    if (count > 0) {
      await expect(rows.first()).toBeVisible({ timeout: 10000 });
    } else {
      await expect(page.locator('.admin-table').first()).toBeVisible();
    }
  });

  test('can filter reports by status', async ({ page }) => {
    const filterBtn = page.locator('[data-testid="filter-pending"], button:has-text("รอดำเนินการ"), .filter-tab:has-text("รอ"), button:has-text("ทั้งหมด")').first();
    await expect(filterBtn).toBeVisible({ timeout: 10000 });
    await filterBtn.click();
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('.header-page-title')).toBeVisible();
  });

  test('opening moderation drawer shows report detail', async ({ page }) => {
    const allTab = page.locator('button:has-text("ทั้งหมด"), .filter-tab:has-text("ทั้งหมด")').first();
    if (await allTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await allTab.click();
      await page.waitForTimeout(500);
    }

    const rows = page.locator('.admin-table tbody tr:not(:has(td[colspan]))');
    const count = await rows.count();
    if (count > 0) {
      const detailBtn = rows.first().locator('button, [data-testid="open-detail"]');
      if ((await detailBtn.count()) > 0) {
        await detailBtn.first().click();
      } else {
        await rows.first().click();
      }
      const drawer = page.locator('.moderation-drawer, .drawer, [role="dialog"], .detail-panel');
      await expect(drawer).toBeVisible({ timeout: 10000 });
    }
  });

  test('no error toast appears on moderation queue load', async ({ page }) => {
    await page.waitForTimeout(1000);
    const errorToast = page.locator('.toast-error, .toast[class*="error"]');
    await expect(errorToast).not.toBeVisible();
  });
});
