"""
Comprehensive End-to-End API Test Suite for Kin-Rai-Dee Backend
Tests:
  1. Mobile App Endpoints (Foods, Categories, Posts, Safety)
  2. Public Legal & Account Deletion Web Endpoints
  3. Admin Dashboard & Moderation Endpoints
Supports testing local or production via:
  python backend/test_system_apis.py --base-url http://localhost:8000
  python backend/test_system_apis.py --base-url https://kin-rai-dee-backend.onrender.com
"""

import sys
import argparse
import json
import urllib.request
import urllib.error
from typing import Optional

# Ensure UTF-8 output on Windows console
if sys.platform == "win32":
    for stream in (sys.stdout, sys.stderr):
        reconfigure = getattr(stream, "reconfigure", None)
        if callable(reconfigure):
            try:
                reconfigure(encoding="utf-8")
            except Exception:
                pass


def make_request(url: str, method: str = "GET", payload: Optional[dict] = None, headers: Optional[dict] = None) -> tuple:
    req_headers = {
        "User-Agent": "KinRaiDee-API-Test/1.0",
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
    print(f"🚀 Running Comprehensive Kin-Rai-Dee API Tests on: {base_url}")
    print("=" * 70)

    results = []

    def record(name: str, passed: bool, detail: str = ""):
        results.append((name, passed, detail))
        icon = "✅" if passed else "❌"
        print(f"{icon} {name}: {'PASSED' if passed else 'FAILED'} {detail}")

    # 1. Health & Root Check
    code, body, _ = make_request(f"{base_url}/")
    record("1. Root Endpoint (/)", code == 200 and "status" in body, f"(Status {code})")

    code, body, _ = make_request(f"{base_url}/test/supabase")
    record("2. Supabase DB Connection Check (/test/supabase)", code == 200, f"(Status {code})")

    # 2. Public Legal & Account Deletion Web Pages ("เว็บลบ")
    code, body, _ = make_request(f"{base_url}/delete-account")
    has_form = "deleteForm" in body or "ขอลบบัญชี" in body
    record("3. Account Deletion Page (GET /delete-account)", code == 200 and has_form, f"(Status {code})")

    code, body, _ = make_request(f"{base_url}/privacy")
    record("4. Privacy Policy Page (GET /privacy)", code == 200, f"(Status {code})")

    code, body, _ = make_request(f"{base_url}/terms")
    record("5. Terms of Service Page (GET /terms)", code == 200, f"(Status {code})")

    # 3. Account Deletion Submission API ("API เว็บลบ")
    test_email = "apitest.user@example.com"
    code, body, _ = make_request(
        f"{base_url}/api/legal/delete-account-request",
        method="POST",
        payload={"email": test_email, "reason": "Automated system test"}
    )
    is_success = False
    try:
        res_json = json.loads(body)
        is_success = res_json.get("success") is True
    except Exception:
        pass
    record("6. Submit Account Deletion Request (POST /api/legal/delete-account-request)", code == 200 and is_success, f"(Status {code})")

    # 4. Mobile API Endpoints
    code, body, _ = make_request(f"{base_url}/api/categories")
    record("7. Mobile: Food Categories (GET /api/categories)", code == 200, f"(Status {code})")

    code, body, _ = make_request(f"{base_url}/api/foods")
    record("8. Mobile: Foods List (GET /api/foods)", code == 200, f"(Status {code})")

    code, body, _ = make_request(f"{base_url}/api/posts")
    # Feed may require authentication (401) or be public (200)
    record("9. Mobile: Posts Feed (GET /api/posts)", code in (200, 401), f"(Status {code})")

    code, body, _ = make_request(f"{base_url}/api/reports/reasons")
    record("10. Mobile: Report Reasons (GET /api/reports/reasons)", code == 200, f"(Status {code})")

    # 5. Admin API Endpoints (Admin auth protected check: 401/403 or 200)
    code, body, _ = make_request(f"{base_url}/api/admin/stats")
    is_admin_handled = code in (200, 401, 403)
    record("11. Admin: Dashboard Stats (/api/admin/stats)", is_admin_handled, f"(Status {code})")

    code, body, _ = make_request(f"{base_url}/api/admin/reports")
    is_reports_handled = code in (200, 401, 403)
    record("12. Admin: Reports List (/api/admin/reports)", is_reports_handled, f"(Status {code})")

    code, body, _ = make_request(f"{base_url}/api/admin/audit-logs")
    is_audit_handled = code in (200, 401, 403)
    record("13. Admin: Audit Logs (/api/admin/audit-logs)", is_audit_handled, f"(Status {code})")

    # Summary
    total = len(results)
    passed = sum(1 for _, p, _ in results if p)
    print("=" * 70)
    print(f"📊 SUMMARY: {passed}/{total} tests passed ({passed/total*100:.1f}%)")
    print("=" * 70)

    if passed < total:
        sys.exit(1)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Test Kin-Rai-Dee APIs")
    parser.add_argument("--base-url", default="http://localhost:8000", help="Base backend URL")
    args = parser.parse_args()
    run_tests(args.base_url)
