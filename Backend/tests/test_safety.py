# -*- coding: utf-8 -*-
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_get_report_reasons():
    """Verify both /api/reports/reasons and /reports/reasons return 200 with list of reasons."""
    for path in ["/api/reports/reasons", "/reports/reasons"]:
        response = client.get(path)
        assert response.status_code == 200, f"Failed at {path}"
        data = response.json()
        assert data.get("success") is True
        reasons = data.get("data", [])
        assert len(reasons) >= 5
        codes = [r["code"] for r in reasons]
        assert "HARASSMENT" in codes
        assert "SPAM" in codes


def test_safety_endpoints_require_auth():
    """Verify that reporting, blocking, and block-checking require authentication (401)."""
    for prefix in ["/api", ""]:
        # Create report without token
        r1 = client.post(
            f"{prefix}/reports",
            json={
                "target_type": "post",
                "target_id": "123",
                "reason_code": "SPAM",
                "explanation": "Spam content",
            },
        )
        assert r1.status_code == 401

        # Get blocked list without token
        r2 = client.get(f"{prefix}/blocks")
        assert r2.status_code == 401

        # Check block status without token
        r3 = client.get(f"{prefix}/blocks/status/some-user-id")
        assert r3.status_code == 401

        # Block user without token
        r4 = client.post(f"{prefix}/blocks/some-user-id")
        assert r4.status_code == 401

        # Unblock user without token
        r5 = client.delete(f"{prefix}/blocks/some-user-id")
        assert r5.status_code == 401

        # Delete account without token
        r6 = client.delete(f"{prefix}/auth/account")
        assert r6.status_code == 401


def test_search_posts_public_access():
    """Verify search endpoint works publicly without crashing."""
    response = client.get("/api/search?q=")
    assert response.status_code == 200
    assert isinstance(response.json(), list)
