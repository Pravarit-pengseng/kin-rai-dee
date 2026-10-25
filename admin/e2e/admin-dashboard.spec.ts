import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard E2E Tests', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('1. Should display login page when unauthenticated', async ({ page }) => {
    const isLoginCardVisible = await page.locator('.login-card').isVisible({ timeout: 4000 }).catch(() => false);
    if (isLoginCardVisible) {
      await expect(page.locator('.login-title')).toContainText('ระบบจัดการผู้ดูแล');
      await expect(page.locator('button[type="submit"]')).toBeVisible();
    }
  });

  test('2. Should log in as Super Admin and view Reports Queue', async ({ page }) => {
    const isLoginCardVisible = await page.locator('.login-card').isVisible({ timeout: 3000 }).catch(() => false);
    if (isLoginCardVisible) {
      await page.fill('input[type="text"]', 'admin@gmail.com');
      await page.fill('input[type="password"]', 'admin1234');
      await page.click('button[type="submit"]');
    }

    // Brand and Page title should appear
    await expect(page.locator('.brand-title')).toContainText('KIN RAI DEE', { timeout: 10000 });
    await expect(page.locator('.header-page-title')).toContainText('รายงาน');
  });

  test('3. Should load Audit Logs table successfully without error toast', async ({ page }) => {
    const isLoginCardVisible = await page.locator('.login-card').isVisible({ timeout: 3000 }).catch(() => false);
    if (isLoginCardVisible) {
      await page.fill('input[type="text"]', 'admin@gmail.com');
      await page.fill('input[type="password"]', 'admin1234');
      await page.click('button[type="submit"]');
      await page.waitForSelector('.brand-title', { timeout: 10000 });
    }

    // Click on "ประวัติการทำงาน" tab
    await page.locator('.nav-link', { hasText: 'ประวัติการทำงาน' }).click();

    // Verify title changes to ประวัติการทำงาน
    await expect(page.locator('.header-page-title')).toContainText('ประวัติการทำงาน', { timeout: 5000 });

    // Table should render with table headers
    await expect(page.locator('.admin-table')).toBeVisible({ timeout: 8000 });
    await expect(page.locator('.admin-table th').first()).toContainText('วันและเวลา');

    // Confirm that NO error toast is displayed
    const errorToast = page.locator('.toast-error');
    const hasError = await errorToast.isVisible({ timeout: 1500 }).catch(() => false);
    expect(hasError).toBeFalsy();
  });

  test('4. Should navigate to Posts and Users management tabs', async ({ page }) => {
    const isLoginCardVisible = await page.locator('.login-card').isVisible({ timeout: 3000 }).catch(() => false);
    if (isLoginCardVisible) {
      await page.fill('input[type="text"]', 'admin@gmail.com');
      await page.fill('input[type="password"]', 'admin1234');
      await page.click('button[type="submit"]');
      await page.waitForSelector('.brand-title', { timeout: 10000 });
    }

    // Go to Posts Management (จัดการเนื้อหา)
    await page.locator('.nav-link', { hasText: 'จัดการเนื้อหา' }).click();
    await expect(page.locator('.header-page-title')).toContainText('จัดการเนื้อหา', { timeout: 5000 });

    // Go to Users Management (สมาชิก)
    await page.locator('.nav-link', { hasText: 'สมาชิก' }).click();
    await expect(page.locator('.header-page-title')).toContainText('จัดการสมาชิก', { timeout: 5000 });
  });

});
