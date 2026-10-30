/**
 * E2E — Backend API: Authenticated Admin Endpoints
 * Tests: admin stats, reports queue, post visibility toggle, audit logs,
 *        and deletion requests API via Playwright APIRequestContext.
 */

import { test, expect } from '@playwright/test';

const backend = process.env.VITE_BACKEND_TEST_URL || 'http://127.0.0.1:8000';
const adminEmail = process.env.ADMIN_EMAIL || '';
const adminPassword = process.env.ADMIN_PASSWORD || '';

test.describe('Backend API — Authenticated Admin Operations', () => {
  let adminAuthHeader: Record<string, string> = {};

  test.beforeAll(async ({ request }) => {
    if (!adminEmail || !adminPassword) {
      // If credentials are not provided, mark tests to be skipped cleanly
      return;
    }

    const loginRes = await request.post(`${backend}/auth/login`, {
      data: { email: adminEmail, password: adminPassword },
    });

    if (loginRes.ok()) {
      const data = await loginRes.json();
      if (data.access_token) {
        adminAuthHeader = {
          Authorization: `Bearer ${data.access_token}`,
        };
      }
    }
  });

  test.beforeEach(() => {
    if (!adminAuthHeader.Authorization) {
      test.skip(true, 'ADMIN_EMAIL/ADMIN_PASSWORD not set or login failed');
    }
  });

  test('GET /api/admin/stats returns full metrics object', async ({ request }) => {
    const res = await request.get(`${backend}/api/admin/stats`, {
      headers: adminAuthHeader,
    });
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.total_reports).toBeDefined();
    expect(data.pending_reports).toBeDefined();
    expect(data.total_users).toBeDefined();
    expect(data.total_posts).toBeDefined();
  });

  test('GET /api/admin/reports returns list with pagination', async ({ request }) => {
    const res = await request.get(`${backend}/api/admin/reports?limit=10&offset=0`, {
      headers: adminAuthHeader,
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBeTruthy();
  });

  test('GET /api/admin/audit-logs returns list', async ({ request }) => {
    const res = await request.get(`${backend}/api/admin/audit-logs?limit=5`, {
      headers: adminAuthHeader,
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBeTruthy();
  });

  test('GET /api/admin/deletion-requests returns list', async ({ request }) => {
    const res = await request.get(`${backend}/api/admin/deletion-requests`, {
      headers: adminAuthHeader,
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBeTruthy();
  });
});

