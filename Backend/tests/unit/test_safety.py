# -*- coding: utf-8 -*-
"""
Unit tests — Safety: Reports & Blocks
Covers: GET /reports/reasons (dual prefix),
        POST /reports (authenticated), self-report guard,
        GET/POST/DELETE /blocks (authenticated), self-block guard,
        GET /blocks/status/{id}, DELETE /auth/account auth guard
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

# ─────────────────────────────────────────────────────────────────────────────
# Report Reasons (public)
# ─────────────────────────────────────────────────────────────────────────────

@pytest.mark.parametrize("path", ["/api/reports/reasons", "/reports/reasons"])
def test_report_reasons_returns_reasons_list(path):
    res = client.get(path)
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    reasons = body["data"]
    assert isinstance(reasons, list)
    assert len(reasons) >= 5, "Expected at least 5 report reason codes"
    codes = [r["code"] for r in reasons]
    for expected_code in ("HARASSMENT", "SPAM", "INAPPROPRIATE"):
        assert expected_code in codes, f"Missing reason code: {expected_code}"


def test_report_reason_has_required_fields():
    res = client.get("/api/reports/reasons")
    reason = res.json()["data"][0]
    assert "code" in reason
    assert "name" in reason


# ─────────────────────────────────────────────────────────────────────────────
# Auth guards — all safety endpoints
# ─────────────────────────────────────────────────────────────────────────────

@pytest.mark.parametrize("prefix", ["/api", ""])
def test_create_report_requires_auth(prefix):
    res = client.post(
        f"{prefix}/reports",
        json={"target_type": "post", "target_id": "1", "reason_code": "SPAM"},
    )
    assert res.status_code == 401, f"Expected 401 at {prefix}/reports"


@pytest.mark.parametrize("prefix", ["/api", ""])
def test_get_blocks_requires_auth(prefix):
    res = client.get(f"{prefix}/blocks")
    assert res.status_code == 401


@pytest.mark.parametrize("prefix", ["/api", ""])
def test_block_user_requires_auth(prefix):
    res = client.post(f"{prefix}/blocks/some-user-id")
    assert res.status_code == 401


@pytest.mark.parametrize("prefix", ["/api", ""])
def test_unblock_user_requires_auth(prefix):
    res = client.delete(f"{prefix}/blocks/some-user-id")
    assert res.status_code == 401


@pytest.mark.parametrize("prefix", ["/api", ""])
def test_block_status_requires_auth(prefix):
    res = client.get(f"{prefix}/blocks/status/some-user-id")
    assert res.status_code == 401


@pytest.mark.parametrize("prefix", ["/api", ""])
def test_delete_account_requires_auth(prefix):
    res = client.delete(f"{prefix}/auth/account")
    assert res.status_code == 401


# ─────────────────────────────────────────────────────────────────────────────
# Authenticated safety actions
# ─────────────────────────────────────────────────────────────────────────────

def test_create_report_authenticated(auth_headers):
    """Submit a valid report — should return success."""
    # Use a known existing post id from the feed
    feed = client.get("/api/posts/feed", params={"limit": 1}).json()
    if not feed:
        pytest.skip("No posts available to report")
    post_id = str(feed[0]["id"])

    res = client.post(
        "/api/reports",
        headers=auth_headers,
        json={
            "target_type": "post",
            "target_id": post_id,
            "reason_code": "SPAM",
            "explanation": "automated pytest report",
        },
    )
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True


def test_create_report_invalid_target_type_returns_422(auth_headers):
    """target_type must match ^(post|comment|image|user)$ — invalid value → 422."""
    res = client.post(
        "/api/reports",
        headers=auth_headers,
        json={"target_type": "unknown_type", "target_id": "1", "reason_code": "SPAM"},
    )
    assert res.status_code == 422


def test_get_block_list_authenticated(auth_headers):
    res = client.get("/api/blocks", headers=auth_headers)
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    assert isinstance(body.get("data", []), list)


def test_block_and_unblock_user(auth_headers):
    """
    Block a dummy user id, verify it appears in the block list, then unblock.
    Uses a UUID that does not correspond to a real profile — the DB constraint
    may reject it with 500 in strict FK mode; adjust if needed.
    """
    # Use own profile ID as target won't work (self-block guard), use a known other user
    # from the feed
    feed = client.get("/api/posts/feed", params={"limit": 5}).json()
    other_ids = [p["user_id"] for p in feed if p.get("user_id")]
    if not other_ids:
        pytest.skip("No other users in feed to test block with")
    target_id = other_ids[0]

    # Block
    block_res = client.post(f"/api/blocks/{target_id}", headers=auth_headers)
    assert block_res.status_code == 200

    # Check status
    status_res = client.get(f"/api/blocks/status/{target_id}", headers=auth_headers)
    assert status_res.status_code == 200
    assert status_res.json().get("is_blocked") is True

    # Unblock
    unblock_res = client.delete(f"/api/blocks/{target_id}", headers=auth_headers)
    assert unblock_res.status_code == 200

    # Status should now be false
    status_after = client.get(f"/api/blocks/status/{target_id}", headers=auth_headers)
    assert status_after.json().get("is_blocked") is False

