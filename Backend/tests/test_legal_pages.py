# -*- coding: utf-8 -*-
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


# =========================================================
# Public Legal Pages Tests (No Authentication Required)
# =========================================================

def test_privacy_policy_routes():
    """Verify both /privacy and /privacy-policy return 200 OK HTML."""
    for path in ["/privacy", "/privacy-policy"]:
        response = client.get(path)
        assert response.status_code == 200, f"Failed at {path}"
        assert "text/html" in response.headers.get("content-type", "")
        text = response.text.lower()
        assert "kin-rai-dee" in text or "กินไรดี" in text


def test_terms_of_use_routes():
    """Verify /terms, /terms-of-use, and /terms-of-service return 200 OK HTML."""
    for path in ["/terms", "/terms-of-use", "/terms-of-service"]:
        response = client.get(path)
        assert response.status_code == 200, f"Failed at {path}"
        assert "text/html" in response.headers.get("content-type", "")
        text = response.text.lower()
        assert "kin-rai-dee" in text or "กินไรดี" in text


def test_delete_account_routes():
    """Verify all delete-account route aliases return 200 OK HTML."""
    aliases = [
        "/delete-account",
        "/support/delete-account",
        "/account-deletion",
        "/support/account-deletion",
    ]
    for path in aliases:
        response = client.get(path)
        assert response.status_code == 200, f"Failed at {path}"
        assert "text/html" in response.headers.get("content-type", "")
        text = response.text.lower()
        assert "kin-rai-dee" in text or "กินไรดี" in text
        assert "email" in text


def test_delete_account_api_unauthorized():
    """Verify DELETE /auth/account requires authentication (401)."""
    response = client.delete("/auth/account")
    assert response.status_code == 401


def test_submit_deletion_request_api():
    """Verify public POST /api/legal/delete-account-request functions."""
    payload = {
        "email": "test-deletion@example.com",
        "reason": "Test deletion reason",
    }
    response = client.post("/api/legal/delete-account-request", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data.get("success") is True
    assert "ลบบัญชี" in data.get("message", "")
