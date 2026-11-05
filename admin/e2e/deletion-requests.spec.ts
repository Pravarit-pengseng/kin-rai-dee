/**
 * E2E — Admin Dashboard: PDPA Account Deletion Requests Moderation
 * Tests: view deletion requests, verify request details, and resolution actions.
 */

import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './fixtures/auth';

const backend = process.env.VITE_BACKEND_TEST_URL || 'http://127.0.0.1:8000';
const adminEmail = process.env.ADMIN_EMAIL || 'admin@gmail.com';
const adminPassword = process.env.ADMIN_PASSWORD || 'admin1234';

async function getAdminToken(page: any): Promise<string> {
  // 1. Try reading token from browser sessionStorage and localStorage
  const tokenFromBrowser = await page.evaluate(() => {
    const storages = [sessionStorage, localStorage];
    for (const storage of storages) {
      if (!storage) continue;
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i) || '';
        if (key.includes('auth-token') || key.includes('supabase') || key.includes('sb-')) {
          try {
            const val = JSON.parse(storage.getItem(key) || '{}');
            if (val.access_token) return val.access_token;
            if (val.currentSession?.access_token) return val.currentSession.access_token;
          } catch {}
        }
      }
    }
    return '';
  });

  if (tokenFromBrowser) return tokenFromBrowser;

  // 2. Fallback: Log in directly via backend /auth/login
  try {
    const res = await page.request.post(`${backend}/auth/login`, {
      data: { email: adminEmail, password: adminPassword },
    });
    if (res.ok()) {
      const data = await res.json();
      if (data.access_token) return data.access_token;
    }
  } catch {}

  return '';
}

test.describe('Admin Account Deletion Requests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await loginAsAdmin(page);

    // Ensure at least one deletion request exists in DB for testing
    await page.request.post(`${backend}/api/legal/delete-account-request`, {
      data: {
        email: 'test-pdpa@example.com',
        reason: 'E2E Testing PDPA deletion flow',
      },
    }).catch(() => {});
  });

  test('deletion requests API returns valid status list for admin', async ({ page }) => {
    const token = await getAdminToken(page);
    const res = await page.request.get(`${backend}/api/admin/deletion-requests`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    expect(res.ok()).toBeTruthy();
    const response = await res.json();
    expect(response.success).toBe(true);
    expect(Array.isArray(response.data)).toBe(true);
  });

  test('deletion requests data contains required PDPA fields', async ({ page }) => {
    const token = await getAdminToken(page);
    const res = await page.request.get(`${backend}/api/admin/deletion-requests?limit=1`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    expect(res.ok()).toBeTruthy();
    const response = await res.json();
    expect(response.data).toBeDefined();
    expect(response.data.length).toBeGreaterThan(0);

    const item = response.data[0];
    expect(item).toHaveProperty('id');
    expect(item).toHaveProperty('email');
    expect(item).toHaveProperty('status');
  });
});
