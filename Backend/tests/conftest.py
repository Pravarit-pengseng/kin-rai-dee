# -*- coding: utf-8 -*-
"""
Shared pytest fixtures for all test layers.

Usage:
  - `client`        – unauthenticated TestClient (guest)
  - `admin_client`  – TestClient with admin dependency overridden (no network call)
  - `user_client`   – TestClient with normal-user dependency overridden (no network call)
  - `auth_headers`  – real Bearer token from Supabase (requires TEST_EMAIL/TEST_PASSWORD)
  - `admin_headers` – real Bearer token for admin account (requires ADMIN_EMAIL/ADMIN_PASSWORD)

ENV vars (.env.test):
  TEST_EMAIL, TEST_PASSWORD        – regular mobile user
  ADMIN_EMAIL, ADMIN_PASSWORD      – admin account
"""

import os
import pytest
from fastapi.testclient import TestClient
from dotenv import load_dotenv

from app.main import app
from app.core.security import get_current_admin, get_current_user, get_optional_current_user

load_dotenv(".env.test")

# ── Fake identity constants ───────────────────────────────────────────────────

FAKE_USER = {
    "id": "00000000-0000-0000-0000-000000000001",
    "email": "testuser@example.com",
}

FAKE_ADMIN = {
    "id": "00000000-0000-0000-0000-000000000002",
    "email": "admin@example.com",
    "name": "Test Admin",
    "role": "super_admin",
}


# ── Unauthenticated client ────────────────────────────────────────────────────

@pytest.fixture(scope="session")
def client():
    """Plain TestClient with no auth overrides (guest/public access)."""
    # Clear any leftover overrides from previous test sessions
    app.dependency_overrides.clear()
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


# ── Dependency-injected clients (no real network) ─────────────────────────────

@pytest.fixture
def admin_client():
    """
    TestClient that bypasses JWT validation and presents as an authorized admin.
    Use for testing admin endpoint logic without a live Supabase auth call.
    """
    app.dependency_overrides[get_current_admin] = lambda: FAKE_ADMIN
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.pop(get_current_admin, None)


@pytest.fixture
def user_client():
    """
    TestClient that bypasses JWT validation and presents as a regular mobile user.
    Admin routes will still reject this client because get_current_admin is not overridden.
    """
    app.dependency_overrides[get_current_user] = lambda: FAKE_USER
    app.dependency_overrides[get_optional_current_user] = lambda: FAKE_USER
    app.dependency_overrides.pop(get_current_admin, None)
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.pop(get_current_user, None)
    app.dependency_overrides.pop(get_optional_current_user, None)


# ── Real credential-based fixtures (require ENV vars) ────────────────────────

def _login(email: str, password: str) -> dict:
    """Log in via the real /auth/login endpoint and return Bearer headers."""
    with TestClient(app) as c:
        res = c.post("/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200, f"Login failed: {res.text}"
    body = res.json()
    assert body.get("access_token"), "No access_token in login response"
    return {"Authorization": f"Bearer {body['access_token']}"}


@pytest.fixture(scope="session")
def auth_headers():
    """
    Real Bearer token for a regular mobile user.
    Skips the entire session if TEST_EMAIL/TEST_PASSWORD are not set —
    and raises a HARD FAILURE so CI cannot silently pass without credentials.
    """
    email = os.getenv("TEST_EMAIL")
    password = os.getenv("TEST_PASSWORD")
    if not email or not password:
        pytest.fail(
            "Authenticated tests require TEST_EMAIL and TEST_PASSWORD environment variables. "
            "Set them in .env.test or your CI environment."
        )
    return _login(email, password)


@pytest.fixture(scope="session")
def admin_headers():
    """
    Real Bearer token for an admin account.
    Skips the entire session if ADMIN_EMAIL/ADMIN_PASSWORD are not set.
    """
    email = os.getenv("ADMIN_EMAIL")
    password = os.getenv("ADMIN_PASSWORD")
    if not email or not password:
        pytest.fail(
            "Admin integration tests require ADMIN_EMAIL and ADMIN_PASSWORD environment variables."
        )
    return _login(email, password)

