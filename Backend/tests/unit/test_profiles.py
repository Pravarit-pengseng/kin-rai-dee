# -*- coding: utf-8 -*-
"""
Unit tests — Profiles
Covers: GET /api/profiles/me, PATCH /api/profiles/me,
        GET /api/profiles/{user_id} (public — checks privacy field stripping),
        GET /api/profiles/{user_id}/posts
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


# ── Auth guards ───────────────────────────────────────────────────────────────

def test_my_profile_requires_auth():
    res = client.get("/api/profiles/me")
    assert res.status_code in (401, 403)


def test_update_profile_requires_auth():
    res = client.patch("/api/profiles/me", json={"bio": "ไม่มี token"})
    assert res.status_code in (401, 403)


# ── Own profile ───────────────────────────────────────────────────────────────

def test_get_my_profile(auth_headers):
    res = client.get("/api/profiles/me", headers=auth_headers)
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    profile = body["data"]
    for field in ("id", "username", "display_name"):
        assert field in profile, f"Profile missing field '{field}'"


def test_update_my_bio(auth_headers):
    # Save original bio first
    original = client.get("/api/profiles/me", headers=auth_headers).json()["data"].get("bio", "")

    update_res = client.patch(
        "/api/profiles/me",
        headers=auth_headers,
        json={"bio": "ทดสอบอัปเดต bio pytest"},
    )
    assert update_res.status_code == 200
    assert update_res.json()["success"] is True

    # Verify change persisted
    updated = client.get("/api/profiles/me", headers=auth_headers).json()["data"]
    assert updated["bio"] == "ทดสอบอัปเดต bio pytest"

    # Restore original
    client.patch("/api/profiles/me", headers=auth_headers, json={"bio": original})


# ── Public profile ────────────────────────────────────────────────────────────

def test_public_profile_by_id(auth_headers):
    """GET /api/profiles/{user_id} should return public profile data."""
    # Use own user_id as a known valid target
    me = client.get("/api/profiles/me", headers=auth_headers).json()["data"]
    user_id = me["id"]

    res = client.get(f"/api/profiles/{user_id}", headers=auth_headers)
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    profile = body["data"]
    assert profile["id"] == user_id


def test_public_profile_strips_sensitive_fields(auth_headers):
    """
    Privacy regression: is_suspended and violation_count must NOT appear
    in the public profile response.
    """
    me = client.get("/api/profiles/me", headers=auth_headers).json()["data"]
    user_id = me["id"]

    res = client.get(f"/api/profiles/{user_id}", headers=auth_headers)
    profile = res.json()["data"]
    assert "is_suspended" not in profile, "is_suspended must not be exposed publicly"
    assert "violation_count" not in profile, "violation_count must not be exposed publicly"


def test_public_profile_nonexistent_returns_404(auth_headers):
    res = client.get("/api/profiles/00000000-0000-0000-0000-000000000000", headers=auth_headers)
    assert res.status_code == 404


def test_user_posts_by_id(auth_headers):
    """GET /api/profiles/{user_id}/posts should return a list of that user's posts."""
    me = client.get("/api/profiles/me", headers=auth_headers).json()["data"]
    user_id = me["id"]

    res = client.get(f"/api/profiles/{user_id}/posts", headers=auth_headers)
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    assert isinstance(body["data"], list)

