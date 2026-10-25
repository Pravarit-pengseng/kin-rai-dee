import { test, expect } from '@playwright/test';

test.describe('Backend API End-to-End Suite (FastAPI)', () => {
  const backendBaseUrl = process.env.VITE_BACKEND_TEST_URL || 'http://127.0.0.1:8000';

  test('1. Root and Supabase connectivity check', async ({ request }) => {
    // 1.1 Root check
    const rootRes = await request.get(`${backendBaseUrl}/`);
    expect(rootRes.ok()).toBeTruthy();
    const rootData = await rootRes.json();
    expect(rootData.status).toBeDefined();

    // 1.2 Supabase DB connectivity
    const dbRes = await request.get(`${backendBaseUrl}/test/supabase`);
    expect(dbRes.ok()).toBeTruthy();
    const dbData = await dbRes.json();
    expect(dbData.success).toBe(true);
  });

  test('2. Public Legal & Account Deletion endpoints', async ({ request }) => {
    // 2.1 GET /delete-account
    const deletePage = await request.get(`${backendBaseUrl}/delete-account`);
    expect(deletePage.ok()).toBeTruthy();
    const deleteHtml = await deletePage.text();
    expect(deleteHtml).toContain('ขอลบบัญชี');

    // 2.2 GET /privacy
    const privacyPage = await request.get(`${backendBaseUrl}/privacy`);
    expect(privacyPage.ok()).toBeTruthy();

    // 2.3 GET /terms
    const termsPage = await request.get(`${backendBaseUrl}/terms`);
    expect(termsPage.ok()).toBeTruthy();

    // 2.4 POST /api/legal/delete-account-request
    const postRes = await request.post(`${backendBaseUrl}/api/legal/delete-account-request`, {
      data: {
        email: `api.test.${Date.now()}@example.com`,
        reason: 'Playwright API automated test',
      },
    });
    expect(postRes.ok()).toBeTruthy();
    const postData = await postRes.json();
    expect(postData.success).toBe(true);
  });

  test('3. Mobile Application Master Data endpoints', async ({ request }) => {
    // 3.1 Categories
    const catRes = await request.get(`${backendBaseUrl}/api/categories`);
    expect(catRes.ok()).toBeTruthy();
    const categories = await catRes.json();
    expect(Array.isArray(categories)).toBeTruthy();

    // 3.2 Foods
    const foodRes = await request.get(`${backendBaseUrl}/api/foods`);
    expect(foodRes.ok()).toBeTruthy();
    const foods = await foodRes.json();
    expect(Array.isArray(foods)).toBeTruthy();

    // 3.3 Report Reasons
    const reportReasonsRes = await request.get(`${backendBaseUrl}/api/reports/reasons`);
    expect(reportReasonsRes.ok()).toBeTruthy();
    const reasons = await reportReasonsRes.json();
    const reasonsList = Array.isArray(reasons) ? reasons : reasons.data;
    expect(Array.isArray(reasonsList)).toBeTruthy();
  });

  test('4. Admin Moderation Protected APIs security check', async ({ request }) => {
    // Admin stats without token should return 401 or 403 (unauthorized)
    const statsRes = await request.get(`${backendBaseUrl}/api/admin/stats`);
    expect([401, 403]).toContain(statsRes.status());

    // Admin reports queue without token should return 401 or 403
    const reportsRes = await request.get(`${backendBaseUrl}/api/admin/reports`);
    expect([401, 403]).toContain(reportsRes.status());

    // Admin audit logs without token should return 401 or 403
    const auditRes = await request.get(`${backendBaseUrl}/api/admin/audit-logs`);
    expect([401, 403]).toContain(auditRes.status());
  });
});
