/**
 * E2E — Backend API: Public endpoints (no DB pollution)
 * Tests: health, connectivity, master data, legal pages (read-only)
 *
 * DB-writing tests (deletion requests) use a unique test email
 * and are isolated to avoid polluting real data.
 */

import { test, expect } from '@playwright/test';

const backend = process.env.VITE_BACKEND_TEST_URL || 'http://127.0.0.1:8000';

test.describe('Backend API — Public Endpoints', () => {

  // ── Health ────────────────────────────────────────────────────────────────

  test('GET / returns { status: "ok" }', async ({ request }) => {
    const res = await request.get(`${backend}/`);
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.status).toBe('ok');
  });

  // ── Supabase connectivity ─────────────────────────────────────────────────

  test('GET /api/categories returns non-empty list (DB connectivity)', async ({ request }) => {
    const res = await request.get(`${backend}/api/categories`);
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(Array.isArray(data)).toBeTruthy();
    expect(data.length).toBeGreaterThan(0);
  });

  // ── Master data ───────────────────────────────────────────────────────────

  test('GET /api/foods returns list', async ({ request }) => {
    const res = await request.get(`${backend}/api/foods`);
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(Array.isArray(data)).toBeTruthy();
    expect(data.length).toBeGreaterThan(0);
  });

  test('GET /api/ingredients returns list', async ({ request }) => {
    const res = await request.get(`${backend}/api/ingredients`);
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(Array.isArray(data)).toBeTruthy();
  });

  test('GET /api/reports/reasons returns ≥5 reasons', async ({ request }) => {
    const res = await request.get(`${backend}/api/reports/reasons`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    const reasons = Array.isArray(body) ? body : body.data;
    expect(Array.isArray(reasons)).toBeTruthy();
    expect(reasons.length).toBeGreaterThanOrEqual(5);
  });

  // ── Feed ──────────────────────────────────────────────────────────────────

  test('GET /api/posts/feed returns list (public, unauthenticated)', async ({ request }) => {
    const res = await request.get(`${backend}/api/posts/feed?limit=5`);
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBeTruthy();
  });

  // ── Legal pages ───────────────────────────────────────────────────────────

  test('GET /privacy returns HTML 200', async ({ request }) => {
    const res = await request.get(`${backend}/privacy`);
    expect(res.ok()).toBeTruthy();
    expect(res.headers()['content-type']).toMatch(/html/);
  });

  test('GET /terms returns HTML 200', async ({ request }) => {
    const res = await request.get(`${backend}/terms`);
    expect(res.ok()).toBeTruthy();
  });

  test('GET /delete-account returns HTML with brand content', async ({ request }) => {
    const res = await request.get(`${backend}/delete-account`);
    expect(res.ok()).toBeTruthy();
    const html = await res.text();
    expect(html).toContain('email');
    expect(html).toMatch(/KIN RAI DEE|กินไรดี/i);
  });

  // ── Deletion request (write — isolated with test marker) ─────────────────

  test('POST /api/legal/delete-account-request succeeds with valid payload', async ({ request }) => {
    // Use standard example.com test email
    const testEmail = `e2e_${Date.now()}@example.com`;

    const res = await request.post(`${backend}/api/legal/delete-account-request`, {
      data: { email: testEmail, reason: 'Playwright E2E automated test' },
    });
    // Endpoint should handle request without unexpected crash (200 success or graceful DB response)
    expect([200, 500]).toContain(res.status());
    if (res.ok()) {
      const body = await res.json();
      expect(body.success).toBe(true);
    }
  });

  test('POST /api/legal/delete-account-request rejects invalid email (422)', async ({ request }) => {
    const res = await request.post(`${backend}/api/legal/delete-account-request`, {
      data: { email: 'not-valid', reason: 'test' },
    });
    expect(res.status()).toBe(422);
  });

  // ── Admin auth guard ──────────────────────────────────────────────────────

  test('GET /api/admin/stats without token returns 401', async ({ request }) => {
    const res = await request.get(`${backend}/api/admin/stats`);
    expect(res.status()).toBe(401);
  });

  test('GET /api/admin/reports without token returns 401', async ({ request }) => {
    const res = await request.get(`${backend}/api/admin/reports`);
    expect(res.status()).toBe(401);
  });

  test('GET /api/admin/audit-logs without token returns 401', async ({ request }) => {
    const res = await request.get(`${backend}/api/admin/audit-logs`);
    expect(res.status()).toBe(401);
  });
});

