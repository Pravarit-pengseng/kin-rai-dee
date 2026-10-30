# -*- coding: utf-8 -*-
"""
Integration tests — RBAC Boundary Matrix
Verifies that each role (guest, normal user, admin) gets the correct access
level on every protected endpoint.
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.security import get_current_admin, get_current_user, get_optional_current_user


# ─────────────────────────────────────────────────────────────────────────────
# 1. Guest (unauthenticated) — admin endpoints must all be 401
# ─────────────────────────────────────────────────────────────────────────────

ADMIN_READ_ENDPOINTS = [
    "/api/admin/stats",
    "/api/admin/reports",
    "/api/admin/posts",
    "/api/admin/comments",
    "/api/admin/users",
    "/api/admin/deletion-requests",
    "/api/admin/audit-logs",
]

USER_AUTH_ENDPOINTS = [
    "/api/posts",
    "/api/posts/saved",
    "/api/profiles/me",
    "/api/search/history",
    "/api/blocks",
]


@pytest.mark.parametrize("endpoint", ADMIN_READ_ENDPOINTS)
def test_guest_cannot_access_admin_endpoints(client, endpoint):
    """Unauthenticated request to any admin endpoint must return 401."""
    res = client.get(endpoint)
    assert res.status_code == 401, (
        f"Expected 401 at GET {endpoint} for guest, got {res.status_code}"
    )


@pytest.mark.parametrize("endpoint", USER_AUTH_ENDPOINTS)
def test_guest_cannot_access_user_endpoints(client, endpoint):
    """Unauthenticated request to authenticated user endpoints must return 401 or 403."""
    res = client.get(endpoint)
    assert res.status_code in (401, 403), (
        f"Expected 401/403 at GET {endpoint} for guest, got {res.status_code}"
    )


# ─────────────────────────────────────────────────────────────────────────────
# 2. Normal user — must be blocked from admin endpoints
# ─────────────────────────────────────────────────────────────────────────────

@pytest.mark.parametrize("endpoint", ADMIN_READ_ENDPOINTS)
def test_normal_user_cannot_access_admin_endpoints(user_client, endpoint):
    """Authenticated regular user must NOT access admin endpoints (401 or 403)."""
    res = user_client.get(endpoint)
    assert res.status_code in (401, 403), (
        f"Normal user should be blocked at GET {endpoint}, got {res.status_code}"
    )


def test_normal_user_can_access_feed(user_client):
    """Regular user can access public feed."""
    res = user_client.get("/api/posts/feed")
    assert res.status_code == 200


def test_normal_user_can_access_own_profile(user_client):
    """Regular user can access /api/profiles/me."""
    res = user_client.get("/api/profiles/me")
    # May get 404 if the fake user id doesn't have a profile row — that's acceptable
    assert res.status_code in (200, 404)


# ─────────────────────────────────────────────────────────────────────────────
# 3. Admin — can access all admin endpoints
# ─────────────────────────────────────────────────────────────────────────────

@pytest.mark.parametrize("endpoint", ADMIN_READ_ENDPOINTS)
def test_admin_can_access_all_admin_endpoints(admin_client, endpoint):
    """Authorized admin must receive 200 on all admin read endpoints."""
    res = admin_client.get(endpoint)
    assert res.status_code == 200, (
        f"Admin should get 200 at GET {endpoint}, got {res.status_code}: {res.text[:200]}"
    )


# ─────────────────────────────────────────────────────────────────────────────
# 4. Admin write — dangerous mutation endpoints are accessible
# ─────────────────────────────────────────────────────────────────────────────

def test_admin_can_call_assign_report_endpoint(admin_client):
    """POST /api/admin/reports/{id}/assign responds (not 401/403/405)."""
    # Any report id — we just verify admin has access, not that the operation succeeds
    res = admin_client.post(
        "/api/admin/reports/1/assign",
        json={"moderator_name": "Test Admin"},
    )
    assert res.status_code not in (401, 403, 405), (
        f"Admin should be able to reach POST /api/admin/reports/1/assign, got {res.status_code}"
    )


def test_admin_can_call_visibility_endpoint(admin_client):
    res = admin_client.patch(
        "/api/admin/posts/1/visibility",
        json={"is_hidden": False},
    )
    assert res.status_code not in (401, 403, 405)


def test_admin_can_call_user_status_endpoint(admin_client):
    res = admin_client.patch(
        "/api/admin/users/some-id/status",
        json={"status": "active"},
    )
    assert res.status_code not in (401, 403, 405)

