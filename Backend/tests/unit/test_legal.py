# -*- coding: utf-8 -*-
"""
Unit tests — Legal pages & Account deletion request
Covers: GET /privacy, /privacy-policy, /terms, /terms-of-use, /terms-of-service,
        GET /delete-account (+ aliases), DELETE /auth/account (auth guard),
        POST /api/legal/delete-account-request (including validation failures)
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


# ── Privacy Policy ────────────────────────────────────────────────────────────

@pytest.mark.parametrize("path", ["/privacy", "/privacy-policy"])
def test_privacy_page_returns_html(path):
    res = client.get(path)
    assert res.status_code == 200, f"Expected 200 at {path}, got {res.status_code}"
    assert "text/html" in res.headers.get("content-type", "")


@pytest.mark.parametrize("path", ["/privacy", "/privacy-policy"])
def test_privacy_page_contains_brand_and_policy_text(path):
    res = client.get(path)
    text = res.text.lower()
    assert "kin" in text or "กิน" in text, "Privacy page should mention the brand"
    # Verify actual policy content exists (not just a blank shell)
    assert any(keyword in text for keyword in ("privacy", "ความเป็นส่วนตัว", "นโยบาย")), (
        f"Privacy page at {path} appears to have no privacy policy content"
    )


# ── Terms of Use ──────────────────────────────────────────────────────────────

@pytest.mark.parametrize("path", ["/terms", "/terms-of-use", "/terms-of-service"])
def test_terms_page_returns_html(path):
    res = client.get(path)
    assert res.status_code == 200, f"Expected 200 at {path}, got {res.status_code}"
    assert "text/html" in res.headers.get("content-type", "")


@pytest.mark.parametrize("path", ["/terms", "/terms-of-use", "/terms-of-service"])
def test_terms_page_contains_terms_content(path):
    res = client.get(path)
    text = res.text.lower()
    assert any(keyword in text for keyword in ("terms", "เงื่อนไข", "ข้อกำหนด")), (
        f"Terms page at {path} appears to have no terms content"
    )


# ── Delete Account page ───────────────────────────────────────────────────────

@pytest.mark.parametrize("path", [
    "/delete-account",
    "/support/delete-account",
    "/account-deletion",
    "/support/account-deletion",
])
def test_delete_account_page_returns_html_with_form(path):
    res = client.get(path)
    assert res.status_code == 200, f"Expected 200 at {path}"
    assert "text/html" in res.headers.get("content-type", "")
    text = res.text.lower()
    assert "email" in text, f"Delete-account page at {path} must have an email input"


# ── DELETE /auth/account — auth guard ────────────────────────────────────────

def test_delete_account_endpoint_requires_auth():
    """Both route prefixes must block unauthenticated requests."""
    for path in ["/auth/account", "/api/auth/account"]:
        res = client.delete(path)
        assert res.status_code == 401, f"Expected 401 at DELETE {path}, got {res.status_code}"


# ── POST /api/legal/delete-account-request ───────────────────────────────────

def test_submit_deletion_request_succeeds():
    res = client.post(
        "/api/legal/delete-account-request",
        json={"email": "legal-test@example.com", "reason": "pytest test run"},
    )
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    assert "ลบบัญชี" in body.get("message", ""), "Response message should mention account deletion"


def test_submit_deletion_request_invalid_email_returns_422():
    """Email field must be a valid email address — malformed input → 422."""
    res = client.post(
        "/api/legal/delete-account-request",
        json={"email": "not-an-email", "reason": "test"},
    )
    assert res.status_code == 422


def test_submit_deletion_request_missing_email_returns_422():
    res = client.post(
        "/api/legal/delete-account-request",
        json={"reason": "ลืมใส่ email"},
    )
    assert res.status_code == 422


def test_submit_deletion_request_empty_email_returns_422():
    res = client.post(
        "/api/legal/delete-account-request",
        json={"email": "", "reason": "email ว่าง"},
    )
    assert res.status_code in (422, 400)

