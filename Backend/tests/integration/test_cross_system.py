# -*- coding: utf-8 -*-
"""
Integration tests — Cross-system scenarios
Tests that span multiple subsystems (admin action → mobile feed effect,
admin suspension → user login blocked, block → feed filtered).

Requires real credentials (auth_headers, admin_headers).
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.security import get_current_admin

client = TestClient(app)


# ─────────────────────────────────────────────────────────────────────────────
# 1. Admin hides post → Post disappears from public feed
# ─────────────────────────────────────────────────────────────────────────────

def test_admin_hide_post_removes_from_feed(admin_client, auth_headers):
    """
    Scenario:
      1. User creates a post.
      2. Admin hides the post.
      3. Public feed must no longer contain that post.
      4. Cleanup: admin unhides, user deletes.
    """
    # Step 1: Create post as authenticated user
    create = client.post(
        "/api/posts",
        headers=auth_headers,
        json={"food_name": "โพสต์ที่จะถูกซ่อน pytest"},
    )
    assert create.status_code == 200, f"Post creation failed: {create.text}"
    post_id = create.json()["data"]["id"]

    try:
        # Step 2: Admin hides the post
        hide = admin_client.patch(
            f"/api/admin/posts/{post_id}/visibility",
            json={"is_hidden": True},
        )
        assert hide.status_code == 200, f"Admin hide failed: {hide.text}"

        # Step 3: Verify post is absent from feed
        feed = client.get("/api/posts/feed", params={"limit": 50}).json()
        feed_ids = [p["id"] for p in feed]
        assert post_id not in feed_ids, (
            f"Post {post_id} should be hidden from feed after admin action"
        )

    finally:
        # Cleanup: unhide then delete
        admin_client.patch(f"/api/admin/posts/{post_id}/visibility", json={"is_hidden": False})
        client.delete(f"/api/posts/{post_id}", headers=auth_headers)


# ─────────────────────────────────────────────────────────────────────────────
# 2. Admin suspends user → That user's requests return 403
# ─────────────────────────────────────────────────────────────────────────────

def test_admin_suspend_user_blocks_their_requests(admin_client, auth_headers):
    """
    Scenario:
      1. Confirm the user can currently access /me.
      2. Admin suspends that user.
      3. The same token now gets 403 on /me.
      4. Admin restores the user.

    NOTE: This test touches a real user account. It restores state in the
    finally block, but should be run against a dedicated test account.
    """
    # Step 1: Confirm user is active
    me = client.get("/me", headers=auth_headers)
    assert me.status_code == 200
    user_id = me.json()["user"]["id"]

    try:
        # Step 2: Admin suspends the user
        suspend = admin_client.patch(
            f"/api/admin/users/{user_id}/status",
            json={"status": "suspended", "reason": "pytest cross-system test"},
        )
        if suspend.status_code != 200:
            pytest.skip(f"Could not suspend user (status {suspend.status_code}) — skipping cross-system test")

        # Step 3: The user's token should now receive 403
        blocked = client.get("/me", headers=auth_headers)
        assert blocked.status_code == 403, (
            f"Suspended user should get 403, got {blocked.status_code}"
        )

    finally:
        # Step 4: Always restore to active
        admin_client.patch(
            f"/api/admin/users/{user_id}/status",
            json={"status": "active", "reason": "restored after pytest cross-system test"},
        )


# ─────────────────────────────────────────────────────────────────────────────
# 3. Public feed is always accessible (never 404 or 500)
# ─────────────────────────────────────────────────────────────────────────────

def test_public_feed_always_accessible():
    """
    The public feed must return 200 even without a token.
    A 404 here would mean the route itself is misconfigured.
    """
    res = client.get("/api/posts/feed", params={"limit": 10})
    assert res.status_code == 200, (
        f"Public feed returned {res.status_code} — this is a routing error"
    )
    assert isinstance(res.json(), list)

