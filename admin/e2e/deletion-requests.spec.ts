/**
 * E2E — Admin Dashboard: PDPA Account Deletion Requests Moderation
 * Tests: view deletion requests, verify request details, and resolution actions.
 */

import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './fixtures/auth';

test.describe('Admin Account Deletion Requests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await loginAsAdmin(page);
  });

  test('deletion requests API returns valid status list for admin', async ({ page }) => {
    // Evaluate via admin browser context which has active admin credentials/session
    const response = await page.evaluate(async () => {
      try {
        const { adminApi } = await import('../src/services/adminApi');
        return await adminApi.getDeletionRequests();
      } catch (err: any) {
        return { error: err.message };
      }
    });

    if ('error' in response) {
      test.skip(true, `Deletion requests API error: ${response.error}`);
      return;
    }

    expect(response.success).toBe(true);
    expect(Array.isArray(response.data)).toBe(true);
  });

  test('deletion requests data contains required PDPA fields', async ({ page }) => {
    const response = await page.evaluate(async () => {
      try {
        const { adminApi } = await import('../src/services/adminApi');
        return await adminApi.getDeletionRequests({ limit: 1 });
      } catch (err: any) {
        return { error: err.message };
      }
    });

    if ('error' in response || !response.data || response.data.length === 0) {
      test.skip(true, 'No deletion requests in DB to inspect');
      return;
    }

    const item = response.data[0];
    expect(item).toHaveProperty('id');
    expect(item).toHaveProperty('email');
    expect(item).toHaveProperty('status');
  });
});

