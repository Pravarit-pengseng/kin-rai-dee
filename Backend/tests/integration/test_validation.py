# -*- coding: utf-8 -*-
"""
Integration tests — Input Validation Matrix (HTTP 422 Unprocessable Entity)
Verifies that all API endpoints properly reject malformed, incomplete, or invalid
request bodies with status 422 according to their Pydantic schemas.
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


# ─────────────────────────────────────────────────────────────────────────────
# 1. Posts Validation
# ─────────────────────────────────────────────────────────────────────────────

def test_post_creation_missing_food_name(auth_headers):
    """POST /api/posts without required food_name must return 422."""
    res = client.post(
        "/api/posts",
        headers=auth_headers,
        json={"description": "ไม่มีชื่ออาหาร"},
    )
    assert res.status_code == 422
    errors = res.json().get("detail", [])
    assert any("food_name" in str(err.get("loc", [])) for err in errors)


def test_post_creation_empty_body(auth_headers):
    """POST /api/posts with empty body must return 422."""
    res = client.post(
        "/api/posts",
        headers=auth_headers,
        json={},
    )
    assert res.status_code == 422


# ─────────────────────────────────────────────────────────────────────────────
# 2. Comments Validation
# ─────────────────────────────────────────────────────────────────────────────

def test_comment_creation_missing_content(auth_headers):
    """POST /api/posts/{id}/comments with missing content field must return 422."""
    res = client.post(
        "/api/posts/1/comments",
        headers=auth_headers,
        json={},
    )
    assert res.status_code == 422


# ─────────────────────────────────────────────────────────────────────────────
# 3. Reports & Safety Validation
# ─────────────────────────────────────────────────────────────────────────────

def test_report_creation_invalid_target_type(auth_headers):
    """target_type must match ^(post|comment|image|user)$."""
    res = client.post(
        "/api/reports",
        headers=auth_headers,
        json={
            "target_type": "invalid_kind",
            "target_id": "1",
            "reason_code": "SPAM",
        },
    )
    assert res.status_code == 422


def test_report_creation_missing_target_id(auth_headers):
    res = client.post(
        "/api/reports",
        headers=auth_headers,
        json={
            "target_type": "post",
            "reason_code": "SPAM",
        },
    )
    assert res.status_code == 422


def test_report_creation_empty_strings(auth_headers):
    """target_id and reason_code require min_length=1."""
    res = client.post(
        "/api/reports",
        headers=auth_headers,
        json={
            "target_type": "post",
            "target_id": "",
            "reason_code": "",
        },
    )
    assert res.status_code == 422


# ─────────────────────────────────────────────────────────────────────────────
# 4. Legal / Account Deletion Validation
# ─────────────────────────────────────────────────────────────────────────────

def test_deletion_request_invalid_email():
    """Invalid email format in deletion request must return 422."""
    res = client.post(
        "/api/legal/delete-account-request",
        json={"email": "plain-string-no-domain", "reason": "test"},
    )
    assert res.status_code == 422


def test_deletion_request_missing_email():
    res = client.post(
        "/api/legal/delete-account-request",
        json={"reason": "test"},
    )
    assert res.status_code == 422


# ─────────────────────────────────────────────────────────────────────────────
# 5. Admin Actions Validation
# ─────────────────────────────────────────────────────────────────────────────

def test_admin_decision_invalid_action_type(admin_client):
    """action_type must match ^(keep|hide|remove|warn|restrict|escalate)$."""
    res = admin_client.post(
        "/api/admin/reports/1/decision",
        json={
            "action_type": "illegal_action",
            "reason_code": "SPAM",
        },
    )
    assert res.status_code == 422


def test_admin_decision_missing_reason_code(admin_client):
    res = admin_client.post(
        "/api/admin/reports/1/decision",
        json={"action_type": "hide"},
    )
    assert res.status_code == 422


def test_admin_user_status_invalid_value(admin_client):
    """status must match ^(active|suspended)$."""
    res = admin_client.patch(
        "/api/admin/users/fake-user-id/status",
        json={"status": "deleted"},
    )
    assert res.status_code == 422


def test_admin_visibility_invalid_type(admin_client):
    """is_hidden must be boolean."""
    res = admin_client.patch(
        "/api/admin/posts/1/visibility",
        json={"is_hidden": "not-a-boolean"},
    )
    assert res.status_code == 422

