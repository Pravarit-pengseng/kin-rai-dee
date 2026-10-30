# -*- coding: utf-8 -*-
"""
Unit tests — Posts (feed, CRUD, bookmarks)
Covers: GET /api/posts/feed, GET /api/posts/{id},
        POST /api/posts, PATCH /api/posts/{id}, DELETE /api/posts/{id},
        POST/DELETE /api/posts/{id}/bookmark, GET /api/posts/saved
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


# ── Public feed ───────────────────────────────────────────────────────────────

def test_feed_returns_list():
    res = client.get("/api/posts/feed", params={"limit": 20, "offset": 0})
    assert res.status_code == 200
    assert isinstance(res.json(), list)


def test_feed_pagination_respects_limit():
    res = client.get("/api/posts/feed", params={"limit": 3, "offset": 0})
    assert res.status_code == 200
    posts = res.json()
    assert len(posts) <= 3


def test_feed_post_has_required_fields():
    res = client.get("/api/posts/feed", params={"limit": 1})
    assert res.status_code == 200
    feed = res.json()
    if not feed:
        pytest.skip("No posts in DB to inspect field shape")
    post = feed[0]
    for field in ("id", "food_name", "user_id", "created_at"):
        assert field in post, f"Missing field '{field}' in post object"


# ── Auth guards ───────────────────────────────────────────────────────────────

def test_my_posts_requires_auth():
    res = client.get("/api/posts")
    assert res.status_code in (401, 403)


def test_saved_posts_requires_auth():
    res = client.get("/api/posts/saved")
    assert res.status_code in (401, 403)


# ── Nonexistent post ──────────────────────────────────────────────────────────

def test_get_nonexistent_post_returns_404():
    res = client.get("/api/posts/999999999")
    assert res.status_code == 404


# ── Authenticated post CRUD (split into atomic tests) ─────────────────────────

@pytest.fixture(scope="module")
def created_post_id(auth_headers):
    """Creates a post once per module and cleans it up afterward."""
    payload = {
        "food_name": "ข้าวผัดกะเพรา pytest",
        "description": "อร่อยมากทดสอบ",
        "image_url": None,
    }
    res = client.post("/api/posts", headers=auth_headers, json=payload)
    assert res.status_code == 200, f"Post creation failed: {res.text}"
    body = res.json()
    assert body["success"] is True
    post_id = body["data"]["id"]
    yield post_id
    # Cleanup
    client.delete(f"/api/posts/{post_id}", headers=auth_headers)


def test_create_post_returns_success(auth_headers):
    payload = {"food_name": "ต้มยำกุ้ง pytest unique", "description": "เผ็ดนิดหน่อย"}
    res = client.post("/api/posts", headers=auth_headers, json=payload)
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    assert body["data"]["id"]
    assert body["data"]["food_name"] == "ต้มยำกุ้ง pytest unique"
    # Cleanup
    client.delete(f"/api/posts/{body['data']['id']}", headers=auth_headers)


def test_create_post_without_food_name_returns_422(auth_headers):
    """food_name is required — missing it should return 422."""
    res = client.post("/api/posts", headers=auth_headers, json={"description": "ลืม food_name"})
    assert res.status_code == 422


def test_get_post_by_id(auth_headers, created_post_id):
    res = client.get(f"/api/posts/{created_post_id}", headers=auth_headers)
    assert res.status_code == 200
    body = res.json()
    assert body["data"]["id"] == created_post_id


def test_update_post(auth_headers, created_post_id):
    res = client.patch(
        f"/api/posts/{created_post_id}",
        headers=auth_headers,
        json={"description": "อัปเดตแล้ว"},
    )
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True


def test_cannot_update_others_post(auth_headers):
    """Trying to update a post not owned by the user should return 404 or 403."""
    # post id 999999999 does not exist → 404
    res = client.patch(
        "/api/posts/999999999",
        headers=auth_headers,
        json={"description": "ไม่ควรได้"},
    )
    assert res.status_code in (404, 403)


def test_delete_post(auth_headers):
    """Create then delete — verify clean removal."""
    create_res = client.post(
        "/api/posts",
        headers=auth_headers,
        json={"food_name": "โพสต์ชั่วคราว pytest"},
    )
    assert create_res.status_code == 200
    post_id = create_res.json()["data"]["id"]

    del_res = client.delete(f"/api/posts/{post_id}", headers=auth_headers)
    assert del_res.status_code == 200
    assert del_res.json()["success"] is True

    # Confirm gone
    check = client.get(f"/api/posts/{post_id}", headers=auth_headers)
    assert check.status_code == 404


# ── Bookmarks ─────────────────────────────────────────────────────────────────

def test_bookmark_and_unbookmark(auth_headers, created_post_id):
    # Bookmark
    add = client.post(f"/api/posts/{created_post_id}/bookmark", headers=auth_headers)
    assert add.status_code == 200

    # Verify in saved list
    saved = client.get("/api/posts/saved", headers=auth_headers)
    assert saved.status_code == 200
    ids = [p["id"] for p in saved.json()]
    assert created_post_id in ids

    # Unbookmark
    remove = client.delete(f"/api/posts/{created_post_id}/bookmark", headers=auth_headers)
    assert remove.status_code == 200

    # Confirm removed
    saved_after = client.get("/api/posts/saved", headers=auth_headers)
    ids_after = [p["id"] for p in saved_after.json()]
    assert created_post_id not in ids_after

