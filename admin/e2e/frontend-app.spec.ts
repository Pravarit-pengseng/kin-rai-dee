import { test, expect } from '@playwright/test';

test.describe('Frontend Mobile Web App E2E Suite (Expo Web)', () => {
  const frontendBaseUrl = process.env.FRONTEND_TEST_URL || 'http://localhost:8081';

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
  });

  test('1. Should render Home Screen and Brand Header', async ({ page }) => {
    await page.goto(`${frontendBaseUrl}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    // KIN RAI DEE Brand
    await expect(page.locator('text=KIN RAI DEE').first()).toBeVisible({ timeout: 15000 });
    // Navigation / Feed header
    await expect(page.getByText('วันนี้กินอะไรกันดี?')).toBeVisible({ timeout: 15000 });
  });

  test('2. Should render Login Screen with inputs and actions', async ({ page }) => {
    await page.goto(`${frontendBaseUrl}/login`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    // Title and welcome message
    await expect(page.locator('text=ยินดีต้อนรับเข้าสู่ KIN RAI DEE')).toBeVisible({ timeout: 15000 });

    // Inputs & action buttons
    const emailInput = page.getByPlaceholder('อีเมล');
    const passwordInput = page.getByPlaceholder('รหัสผ่าน', { exact: true });
    const submitBtn = page.locator('text=เข้าสู่ระบบ →');

    await expect(emailInput).toBeVisible({ timeout: 10000 });
    await expect(passwordInput).toBeVisible({ timeout: 10000 });
    await expect(submitBtn).toBeVisible({ timeout: 10000 });
  });

  test('3. Should display validation error on empty login submission', async ({ page }) => {
    await page.goto(`${frontendBaseUrl}/login`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    const submitBtn = page.locator('text=เข้าสู่ระบบ →');
    await submitBtn.click();

    // Validation warning should appear
    await expect(page.getByText('กรุณากรอกอีเมล')).toBeVisible({ timeout: 10000 });
  });

  test('4. Should render Register Screen with form inputs', async ({ page }) => {
    await page.goto(`${frontendBaseUrl}/register`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    // Welcome title for registration
    await expect(page.locator('text=มาร่วมเป็นครอบครัว KIN RAI DEE')).toBeVisible({ timeout: 15000 });

    // Required inputs for registration
    await expect(page.getByPlaceholder('ชื่อที่แสดง')).toBeVisible({ timeout: 10000 });
    await expect(page.getByPlaceholder('อีเมล')).toBeVisible({ timeout: 10000 });
    await expect(page.getByPlaceholder('รหัสผ่าน', { exact: true })).toBeVisible({ timeout: 10000 });
    await expect(page.getByPlaceholder('ยืนยันรหัสผ่าน')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=สมัครบัญชี →')).toBeVisible({ timeout: 10000 });
  });

  test('5. Should render Forgot Password recovery screen', async ({ page }) => {
    await page.goto(`${frontendBaseUrl}/forgot-password`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    // Recovery UI title
    await expect(page.locator('text=ลืมรหัสผ่าน').first()).toBeVisible({ timeout: 15000 });

    // Should have email recovery input
    await expect(page.getByPlaceholder('อีเมล')).toBeVisible({ timeout: 10000 });
  });

  test('6. Should render Privacy Policy and Terms of Use on mobile view', async ({ page }) => {
    // Privacy Policy
    await page.goto(`${frontendBaseUrl}/privacy-policy`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).toBeVisible();

    // Terms of Use
    await page.goto(`${frontendBaseUrl}/terms-of-use`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).toBeVisible();
  });
});
