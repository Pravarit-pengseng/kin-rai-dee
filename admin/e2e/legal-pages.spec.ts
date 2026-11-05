/**
 * E2E — Legal pages (backend-rendered HTML)
 * Tests: actual content assertions (not just body visible),
 *        form elements, responsiveness
 *
 * NOTE: Does NOT write any real deletion requests to the DB.
 *       POST /api/legal/delete-account-request is covered in api/public-endpoints.spec.ts
 *       using a cleanup strategy.
 */

import { test, expect } from '@playwright/test';

const backendBaseUrl = process.env.VITE_BACKEND_TEST_URL || 'http://127.0.0.1:8000';

test.describe('Legal Pages (Backend HTML)', () => {

  // ── Privacy Policy ────────────────────────────────────────────────────────

  test('Privacy Policy page has meaningful content', async ({ request }) => {
    const res = await request.get(`${backendBaseUrl}/privacy`);
    expect(res.ok()).toBeTruthy();
    const html = await res.text();
    expect(html).toMatch(/privacy|ความเป็นส่วนตัว|นโยบาย/i);
    expect(html).toMatch(/KIN RAI DEE|กินไรดี/i);
  });

  test('/privacy and /privacy-policy both return identical status', async ({ request }) => {
    const r1 = await request.get(`${backendBaseUrl}/privacy`);
    const r2 = await request.get(`${backendBaseUrl}/privacy-policy`);
    expect(r1.status()).toBe(200);
    expect(r2.status()).toBe(200);
  });

  // ── Terms of Use ──────────────────────────────────────────────────────────

  test('Terms of Use page has meaningful content', async ({ request }) => {
    const res = await request.get(`${backendBaseUrl}/terms`);
    expect(res.ok()).toBeTruthy();
    const html = await res.text();
    expect(html).toMatch(/terms|เงื่อนไข|ข้อกำหนด/i);
  });

  test('all 3 terms aliases return 200', async ({ request }) => {
    for (const path of ['/terms', '/terms-of-use', '/terms-of-service']) {
      const res = await request.get(`${backendBaseUrl}${path}`);
      expect(res.status()).toBe(200);
    }
  });

  // ── Delete Account Page ───────────────────────────────────────────────────

  test('Delete Account page renders form with email and reason inputs', async ({ page }) => {
    await page.goto(`${backendBaseUrl}/delete-account`);

    await expect(page.locator('.brand')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#reason')).toBeVisible();
    await expect(page.locator('#submitBtn')).toBeVisible();
  });

  test('Delete Account page aliases all return 200', async ({ request }) => {
    const aliases = [
      '/delete-account',
      '/support/delete-account',
      '/account-deletion',
      '/support/account-deletion',
    ];
    for (const path of aliases) {
      const res = await request.get(`${backendBaseUrl}${path}`);
      expect(res.status()).toBe(200);
    }
  });

  test('Delete Account page shows validation error on empty submit', async ({ page }) => {
    await page.goto(`${backendBaseUrl}/delete-account`);
    await page.locator('#submitBtn').click();

    // HTML5 required field validation or JS error message
    const emailInput = page.locator('#email');
    const validationMsg = await emailInput.evaluate((el: HTMLInputElement) => el.validationMessage);
    expect(validationMsg).toBeTruthy();
  });

  test('Delete Account page is responsive on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`${backendBaseUrl}/delete-account`);

    const container = page.locator('.container, form, main').first();
    const box = await container.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeLessThanOrEqual(375);

    const submitBtn = page.locator('#submitBtn');
    const btnBox = await submitBtn.boundingBox();
    expect(btnBox).not.toBeNull();
    expect(btnBox!.width).toBeGreaterThan(box!.width * 0.8);
  });

  test('Delete Account page is responsive on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto(`${backendBaseUrl}/delete-account`);
    await expect(page.locator('#submitBtn')).toBeVisible();
  });
});

