import { test, expect } from '@playwright/test';

test.describe('Public Account Deletion & Legal Pages (เว็บลบและนโยบาย)', () => {
  const backendBaseUrl = process.env.VITE_BACKEND_TEST_URL || 'http://127.0.0.1:8000';

  test('1. Should display Account Deletion page correctly', async ({ page }) => {
    await page.goto(`${backendBaseUrl}/delete-account`);

    // Verify title and headers
    await expect(page.locator('.brand')).toContainText('KIN-RAI-DEE');
    await expect(page.locator('h1')).toContainText('การขอลบบัญชีผู้ใช้และข้อมูลทั้งหมด');

    // Verify form elements exist
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#reason')).toBeVisible();
    await expect(page.locator('#submitBtn')).toBeVisible();
  });

  test('2. Should display Privacy Policy and Terms pages', async ({ page }) => {
    // Privacy Policy
    await page.goto(`${backendBaseUrl}/privacy`);
    await expect(page.locator('body')).toBeVisible();

    // Terms of Use
    await page.goto(`${backendBaseUrl}/terms`);
    await expect(page.locator('body')).toBeVisible();
  });

  test('3. Should submit account deletion request successfully', async ({ page }) => {
    await page.goto(`${backendBaseUrl}/delete-account`);

    // Fill the deletion form
    const testEmail = `playwright.test.${Date.now()}@example.com`;
    await page.fill('#email', testEmail);
    await page.fill('#reason', 'Playwright automated test deletion request');

    // Submit
    await page.click('#submitBtn');

    // Verify success box appears
    await expect(page.locator('#successMsg')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#successText')).toContainText('คำขอลบบัญชี');
  });
});
