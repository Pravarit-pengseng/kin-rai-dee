"""
Health & Smoke Test Script for Kin-Rai-Dee Backend
Tests:
  1. Health & DB Master Data (Categories, Foods, Ingredients, Reasons)
  2. Public Legal & Account Deletion Web Endpoints
  3. Feed & Mobile Endpoints (Public vs Protected)
  4. Admin RBAC Guard Protection (401/403 for unauthenticated access)

Supports local or production testing:
  python backend/test_system_apis.py --base-url http://localhost:8000
  python backend/test_system_apis.py --base-url https://kin-rai-dee-backend.onrender.com
"""

import sys
import argparse
import json
import urllib.request
import urllib.error
import time
from typing import Optional, Tuple

if sys.platform == "win32":
    for stream in (sys.stdout, sys.stderr):
        reconfigure = getattr(stream, "reconfigure", None)
        if callable(reconfigure):
            try:
                reconfigure(encoding="utf-8")
            except Exception:
                pass


def make_request(url: str, method: str = "GET", payload: Optional[dict] = None, headers: Optional[dict] = None) -> Tuple[int, str, str]:
    req_headers = {
        "User-Agent": "KinRaiDee-SmokeTest/2.0",
        "Accept": "application/json, text/html, */*",
    }
    if headers:
        req_headers.update(headers)

    data = None
    if payload is not None:
        data = json.dumps(payload).encode("utf-8")
        req_headers["Content-Type"] = "application/json"

    req = urllib.request.Request(url, data=data, headers=req_headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            body = resp.read().decode("utf-8", errors="replace")
            content_type = resp.headers.get("Content-Type", "")
            return resp.getcode(), body, content_type
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        return e.code, body, e.headers.get("Content-Type", "")
    except Exception as e:
        return 0, str(e), ""


def run_tests(base_url: str):
    base_url = base_url.rstrip("/")
    print("=" * 70)
    print(f"🚀 Running Smoke & Health API Checks on: {base_url}")
    print("=" * 70)

    results = []

    def record(name: str, passed: bool, detail: str = ""):
        results.append((name, passed, detail))
        icon = "✅" if passed else "❌"
        print(f"{icon} {name}: {'PASSED' if passed else 'FAILED'} {detail}")

    # 1. Health & Root
    code, body, _ = make_request(f"{base_url}/")
    record("1. Root Health Check (/)", code == 200 and '"ok"' in body, f"(Status {code})")

    # 2. Supabase DB Connection (Food Categories)
    code, body, _ = make_request(f"{base_url}/api/categories")
    has_cats = False
    try:
        data = json.loads(body)
        has_cats = isinstance(data, list) and len(data) > 0
    except Exception:
        pass
    record("2. DB Check: Food Categories (GET /api/categories)", code == 200 and has_cats, f"(Status {code})")

    # 3. Ingredient Categories
    code, body, _ = make_request(f"{base_url}/api/ingredient-categories")
    record("3. Ingredient Categories (GET /api/ingredient-categories)", code == 200, f"(Status {code})")

    # 4. Foods List
    code, body, _ = make_request(f"{base_url}/api/foods")
    record("4. Foods List (GET /api/foods)", code == 200, f"(Status {code})")

    # 5. Public Posts Feed (must be 200 for guest)
    code, body, _ = make_request(f"{base_url}/api/posts/feed?limit=5")
    record("5. Public Posts Feed (GET /api/posts/feed)", code == 200, f"(Status {code})")

    # 6. Authenticated User Posts (must be 401 for guest)
    code, _, _ = make_request(f"{base_url}/api/posts")
    record("6. User Posts Auth Guard (GET /api/posts)", code in (401, 403), f"(Status {code})")

    # 7. Report Reasons Master Data
    code, body, _ = make_request(f"{base_url}/api/reports/reasons")
    has_reasons = "HARASSMENT" in body or "SPAM" in body
    record("7. Safety: Report Reasons (GET /api/reports/reasons)", code == 200 and has_reasons, f"(Status {code})")

    # 8. Legal: Delete Account Page (HTML Form)
    code, body, _ = make_request(f"{base_url}/delete-account")
    has_form = "deleteForm" in body or "ขอลบบัญชี" in body or "email" in body
    record("8. Legal: Account Deletion Page (GET /delete-account)", code == 200 and has_form, f"(Status {code})")

    # 9. Legal: Privacy Policy
    code, body, _ = make_request(f"{base_url}/privacy")
    record("9. Legal: Privacy Policy Page (GET /privacy)", code == 200, f"(Status {code})")

    # 10. Legal: Terms of Service
    code, body, _ = make_request(f"{base_url}/terms")
    record("10. Legal: Terms of Service Page (GET /terms)", code == 200, f"(Status {code})")

    # 11. Legal: Account Deletion Submission API
    test_email = f"smoketest-{int(time.time())}@e2e.invalid"
    code, body, _ = make_request(
        f"{base_url}/api/legal/delete-account-request",
        method="POST",
        payload={"email": test_email, "reason": "Automated system smoke test"},
    )
    is_success = False
    try:
        res_json = json.loads(body)
        is_success = res_json.get("success") is True
    except Exception:
        pass
    record("11. Legal API: Submit Deletion Request (POST)", code == 200 and is_success, f"(Status {code})")

    # 12-14. Admin RBAC Guard: Unauthenticated requests must receive 401/403
    code, _, _ = make_request(f"{base_url}/api/admin/stats")
    record("12. Admin Auth Guard: Stats (/api/admin/stats)", code in (401, 403), f"(Status {code})")

    code, _, _ = make_request(f"{base_url}/api/admin/reports")
    record("13. Admin Auth Guard: Reports (/api/admin/reports)", code in (401, 403), f"(Status {code})")

    code, _, _ = make_request(f"{base_url}/api/admin/audit-logs")
    record("14. Admin Auth Guard: Audit Logs (/api/admin/audit-logs)", code in (401, 403), f"(Status {code})")

    # Summary
    total = len(results)
    passed = sum(1 for _, p, _ in results if p)
    print("=" * 70)
    print(f"📊 SMOKE TEST SUMMARY: {passed}/{total} checks passed ({passed/total*100:.1f}%)")
    print("=" * 70)

    if passed < total:
        sys.exit(1)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Health & Smoke Test for Kin-Rai-Dee APIs")
    parser.add_argument("--base-url", default="http://localhost:8000", help="Base backend URL")
    args = parser.parse_args()
    run_tests(args.base_url)
