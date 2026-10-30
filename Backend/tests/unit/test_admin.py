# -*- coding: utf-8 -*-
"""
Unit tests — Admin endpoints (reads + mutations + input validation)
Uses dependency-injection fixtures — no real Supabase auth call required.

Fixtures: admin_client (from conftest.py)
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app


# ─────────────────────────────────────────────────────────────────────────────
# 1. Stats
# ─────────────────────────────────────────────────────────────────────────────

def test_admin_stats_returns_all_fields(admin_client):
    res = admin_client.get("/api/admin/stats")
    assert res.status_code == 200
    data = res.json()
    required_keys = (
        "total_reports", "pending_reports", "in_review",
        "action_taken", "dismissed", "urgent_reports",
        "total_users", "total_posts", "total_comments",
    )
    for key in required_keys:
        assert key in data, f"Stats response missing key: '{key}'"


def test_admin_stats_values_are_non_negative(admin_client):
    data = admin_client.get("/api/admin/stats").json()
    for key, val in data.items():
        assert isinstance(val, int) and val >= 0, f"Stats key '{key}' = {val} should be int ≥ 0"


# ─────────────────────────────────────────────────────────────────────────────
# 2. Reports Queue
# ─────────────────────────────────────────────────────────────────────────────

def test_admin_reports_queue_default(admin_client):
    res = admin_client.get("/api/admin/reports")
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    assert isinstance(body["data"], list)


@pytest.mark.parametrize("status_val", ["pending", "in_review", "action_taken", "dismissed"])
def test_admin_reports_filter_by_status(admin_client, status_val):
    res = admin_client.get("/api/admin/reports", params={"status": status_val})
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    # All returned reports must match the requested status
    for report in body["data"]:
        assert report.get("status") == status_val, (
            f"Filter by status={status_val} returned a report with status={report.get('status')}"
        )


def test_admin_reports_pagination(admin_client):
    page1 = admin_client.get("/api/admin/reports", params={"limit": 2, "offset": 0}).json()["data"]
    page2 = admin_client.get("/api/admin/reports", params={"limit": 2, "offset": 2}).json()["data"]
    # Pages should not overlap (different ids)
    ids1 = {r["id"] for r in page1}
    ids2 = {r["id"] for r in page2}
    assert ids1.isdisjoint(ids2), "Paginated results overlap — pagination is broken"


# ─────────────────────────────────────────────────────────────────────────────
# 3. Posts management
# ─────────────────────────────────────────────────────────────────────────────

def test_admin_posts_returns_list(admin_client):
    res = admin_client.get("/api/admin/posts")
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    assert isinstance(body["data"], list)


def test_admin_toggle_post_visibility_valid(admin_client):
    """
    PATCH /api/admin/posts/{id}/visibility with a valid payload and known post.
    Requires at least one post in the DB. Skips if none available.
    """
    posts = admin_client.get("/api/admin/posts", params={"limit": 1}).json()["data"]
    if not posts:
        pytest.skip("No posts in DB to test visibility toggle")
    post_id = posts[0]["id"]

    res = admin_client.patch(
        f"/api/admin/posts/{post_id}/visibility",
        json={"is_hidden": True},
    )
    assert res.status_code == 200
    assert res.json()["success"] is True

    # Restore
    admin_client.patch(f"/api/admin/posts/{post_id}/visibility", json={"is_hidden": False})


def test_admin_toggle_post_visibility_nonexistent_returns_error(admin_client):
    res = admin_client.patch(
        "/api/admin/posts/999999999/visibility",
        json={"is_hidden": True},
    )
    assert res.status_code in (404, 500)


def test_admin_delete_post(admin_client):
    """Admin should be able to delete a post by id."""
    posts = admin_client.get("/api/admin/posts", params={"limit": 1}).json()["data"]
    if not posts:
        pytest.skip("No posts in DB to test deletion")
    post_id = posts[0]["id"]

    res = admin_client.delete(f"/api/admin/posts/{post_id}")
    # Accept 200 (deleted) or 404 (race condition with other tests)
    assert res.status_code in (200, 404)
    if res.status_code == 200:
        assert res.json()["success"] is True


# ─────────────────────────────────────────────────────────────────────────────
# 4. Comments management
# ─────────────────────────────────────────────────────────────────────────────

def test_admin_comments_returns_list(admin_client):
    res = admin_client.get("/api/admin/comments")
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    assert isinstance(body["data"], list)


def test_admin_toggle_comment_visibility(admin_client):
    comments = admin_client.get("/api/admin/comments", params={"limit": 1}).json()["data"]
    if not comments:
        pytest.skip("No comments in DB to test visibility toggle")
    comment_id = comments[0]["id"]
    post_id = comments[0].get("post_id")

    res = admin_client.patch(
        f"/api/admin/comments/{comment_id}/visibility",
        json={"is_hidden": True},
    )
    assert res.status_code == 200
    assert res.json()["success"] is True

    # Restore
    admin_client.patch(
        f"/api/admin/comments/{comment_id}/visibility",
        json={"is_hidden": False},
    )


# ─────────────────────────────────────────────────────────────────────────────
# 5. Users management
# ─────────────────────────────────────────────────────────────────────────────

def test_admin_users_returns_list(admin_client):
    res = admin_client.get("/api/admin/users")
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    assert isinstance(body["data"], list)


def test_admin_suspend_user(admin_client):
    """
    PATCH /api/admin/users/{id}/status with status=suspended must use a real user.
    Skips if no users available.
    """
    users = admin_client.get("/api/admin/users", params={"limit": 1}).json()["data"]
    if not users:
        pytest.skip("No users in DB to test suspension")
    user_id = users[0]["id"]

    res = admin_client.patch(
        f"/api/admin/users/{user_id}/status",
        json={"status": "suspended", "reason": "pytest test suspension"},
    )
    assert res.status_code == 200
    assert res.json()["success"] is True

    # Restore to active
    admin_client.patch(
        f"/api/admin/users/{user_id}/status",
        json={"status": "active", "reason": "restored after pytest"},
    )


def test_admin_suspend_user_invalid_status_returns_422(admin_client):
    """status must match ^(active|suspended)$ — invalid value → 422."""
    res = admin_client.patch(
        "/api/admin/users/some-id/status",
        json={"status": "banned"},  # not in the allowed enum
    )
    assert res.status_code == 422


# ─────────────────────────────────────────────────────────────────────────────
# 6. Reports — Assign & Decision
# ─────────────────────────────────────────────────────────────────────────────

def test_admin_assign_report(admin_client):
    reports = admin_client.get("/api/admin/reports", params={"status": "pending", "limit": 1}).json()["data"]
    if not reports:
        pytest.skip("No pending reports to assign")
    report_id = reports[0]["id"]

    res = admin_client.post(
        f"/api/admin/reports/{report_id}/assign",
        json={"moderator_id": "00000000-0000-0000-0000-000000000002", "moderator_name": "Test Admin"},
    )
    assert res.status_code == 200
    assert res.json()["success"] is True


@pytest.mark.parametrize("action_type", ["keep", "hide", "remove", "warn", "restrict", "escalate"])
def test_admin_report_decision_valid_actions(admin_client, action_type):
    reports = admin_client.get("/api/admin/reports", params={"limit": 1}).json()["data"]
    if not reports:
        pytest.skip("No reports available for decision test")
    report_id = reports[0]["id"]

    res = admin_client.post(
        f"/api/admin/reports/{report_id}/decision",
        json={
            "action_type": action_type,
            "reason_code": "SPAM",
            "internal_note": f"pytest decision: {action_type}",
        },
    )
    assert res.status_code == 200
    assert res.json()["success"] is True


def test_admin_report_decision_invalid_action_type_returns_422(admin_client):
    """action_type must match ^(keep|hide|remove|warn|restrict|escalate)$ — invalid → 422."""
    reports = admin_client.get("/api/admin/reports", params={"limit": 1}).json()["data"]
    if not reports:
        pytest.skip("No reports available")
    report_id = reports[0]["id"]

    res = admin_client.post(
        f"/api/admin/reports/{report_id}/decision",
        json={"action_type": "delete_everything", "reason_code": "SPAM"},
    )
    assert res.status_code == 422


# ─────────────────────────────────────────────────────────────────────────────
# 7. Deletion Requests
# ─────────────────────────────────────────────────────────────────────────────

def test_admin_deletion_requests_returns_list(admin_client):
    res = admin_client.get("/api/admin/deletion-requests")
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    assert isinstance(body["data"], list)


def test_admin_approve_deletion_request(admin_client):
    requests = admin_client.get("/api/admin/deletion-requests").json()["data"]
    pending = [r for r in requests if r.get("status") == "pending"]
    if not pending:
        pytest.skip("No pending deletion requests to approve")
    req_id = pending[0]["id"]

    res = admin_client.post(
        f"/api/admin/deletion-requests/{req_id}/approve",
        json={"moderator_id": "00000000-0000-0000-0000-000000000002", "moderator_name": "Test Admin"},
    )
    assert res.status_code == 200
    assert res.json()["success"] is True


def test_admin_reject_deletion_request(admin_client):
    requests = admin_client.get("/api/admin/deletion-requests").json()["data"]
    pending = [r for r in requests if r.get("status") == "pending"]
    if not pending:
        pytest.skip("No pending deletion requests to reject")
    req_id = pending[0]["id"]

    res = admin_client.post(
        f"/api/admin/deletion-requests/{req_id}/reject",
        json={"notes": "ปฏิเสธโดย pytest", "moderator_name": "Test Admin"},
    )
    assert res.status_code == 200
    assert res.json()["success"] is True


# ─────────────────────────────────────────────────────────────────────────────
# 8. Audit Logs
# ─────────────────────────────────────────────────────────────────────────────

def test_admin_audit_logs_returns_list(admin_client):
    res = admin_client.get("/api/admin/audit-logs")
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    assert isinstance(body["data"], list)


def test_admin_audit_log_has_required_fields(admin_client):
    res = admin_client.get("/api/admin/audit-logs", params={"limit": 1})
    logs = res.json()["data"]
    if not logs:
        pytest.skip("No audit logs to inspect")
    log = logs[0]
    for field in ("id", "timestamp", "actorName", "actionType", "targetType"):
        assert field in log, f"Audit log entry missing field: '{field}'"


def test_admin_audit_logs_pagination(admin_client):
    res = admin_client.get("/api/admin/audit-logs", params={"limit": 5, "offset": 0})
    assert res.status_code == 200
    assert len(res.json()["data"]) <= 5

