# -*- coding: utf-8 -*-
"""
Unit tests — Health check & Authentication
Covers: GET /, GET /me, POST /auth/login (indirectly via auth_headers fixture)
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


# ── Health ────────────────────────────────────────────────────────────────────

def test_root_returns_ok():
    """GET / must return 200 with { status: 'ok' }."""
    res = client.get("/")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"


def test_removed_debug_route_is_gone():
    """Security regression: /test/supabase must be 404 (route was removed in C-3 fix)."""
    res = client.get("/test/supabase")
    assert res.status_code == 404


# ── /me — Authentication guard ────────────────────────────────────────────────

def test_me_requires_auth():
    """GET /me without token must return 401 or 403."""
    res = client.get("/me")
    assert res.status_code in (401, 403)


def test_me_with_valid_token(auth_headers):
    """GET /me with valid token returns user id and email."""
    res = client.get("/me", headers=auth_headers)
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    assert body["user"]["id"]
    assert body["user"]["email"]

