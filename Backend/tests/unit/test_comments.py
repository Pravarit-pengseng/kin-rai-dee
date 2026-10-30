# -*- coding: utf-8 -*-
"""
Unit tests — Comments
Covers: GET /api/posts/{id}/comments, POST, PATCH, DELETE comments,
        auth guard, nonexistent post
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


# ── Auth guards ───────────────────────────────────────────────────────────────

def test_create_comment_requires_auth():
    res = client.post("/api/posts/1/comments", json={"content": "ไม่มี token"})
    assert res.status_code in (401, 403)


def test_update_comment_requires_auth():
    res = client.patch("/api/posts/1/comments/1", json={"content": "แก้ไข"})
    assert res.status_code in (401, 403)


def test_delete_comment_requires_auth():
    res = client.delete("/api/posts/1/comments/1")
    assert res.status_code in (401, 403)


# ── Nonexistent post ──────────────────────────────────────────────────────────

def test_comments_on_nonexistent_post_returns_404():
    res = client.get("/api/posts/999999999/comments")
    assert res.status_code == 404


# ── Full lifecycle ────────────────────────────────────────────────────────────

@pytest.fixture(scope="module")
def post_for_comments(auth_headers):
    """Create a temporary post to comment on; delete after module."""
    res = client.post(
        "/api/posts",
        headers=auth_headers,
        json={"food_name": "โพสต์สำหรับทดสอบ comment"},
    )
    assert res.status_code == 200
    post_id = res.json()["data"]["id"]
    yield post_id
    client.delete(f"/api/posts/{post_id}", headers=auth_headers)


def test_create_comment(auth_headers, post_for_comments):
    res = client.post(
        f"/api/posts/{post_for_comments}/comments",
        headers=auth_headers,
        json={"content": "อร่อยมากเลย"},
    )
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    assert body["data"]["content"] == "อร่อยมากเลย"
    assert body["data"]["id"]


def test_list_comments_returns_created_comment(auth_headers, post_for_comments):
    # Create a comment first
    create = client.post(
        f"/api/posts/{post_for_comments}/comments",
        headers=auth_headers,
        json={"content": "คอมเมนต์ทดสอบ list"},
    )
    comment_id = create.json()["data"]["id"]

    res = client.get(f"/api/posts/{post_for_comments}/comments")
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    ids = [c["id"] for c in body["data"]]
    assert comment_id in ids

    # Cleanup
    client.delete(f"/api/posts/{post_for_comments}/comments/{comment_id}", headers=auth_headers)


def test_update_comment(auth_headers, post_for_comments):
    create = client.post(
        f"/api/posts/{post_for_comments}/comments",
        headers=auth_headers,
        json={"content": "ก่อนแก้"},
    )
    comment_id = create.json()["data"]["id"]

    update = client.patch(
        f"/api/posts/{post_for_comments}/comments/{comment_id}",
        headers=auth_headers,
        json={"content": "หลังแก้"},
    )
    assert update.status_code == 200
    assert update.json()["success"] is True

    # Cleanup
    client.delete(f"/api/posts/{post_for_comments}/comments/{comment_id}", headers=auth_headers)


def test_delete_comment(auth_headers, post_for_comments):
    create = client.post(
        f"/api/posts/{post_for_comments}/comments",
        headers=auth_headers,
        json={"content": "จะถูกลบ"},
    )
    comment_id = create.json()["data"]["id"]

    delete = client.delete(
        f"/api/posts/{post_for_comments}/comments/{comment_id}",
        headers=auth_headers,
    )
    assert delete.status_code == 200
    assert delete.json()["success"] is True


def test_create_comment_missing_content_returns_422(auth_headers, post_for_comments):
    res = client.post(
        f"/api/posts/{post_for_comments}/comments",
        headers=auth_headers,
        json={},
    )
    assert res.status_code == 422

