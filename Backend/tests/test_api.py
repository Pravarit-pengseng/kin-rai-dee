import os
from dotenv import load_dotenv

import pytest
from fastapi.testclient import TestClient

from app.main import app

load_dotenv(".env.test")

client = TestClient(app)


# =========================================================
# Test configuration
# =========================================================

TEST_EMAIL = os.getenv("TEST_EMAIL")
TEST_PASSWORD = os.getenv("TEST_PASSWORD")


@pytest.fixture(scope="session")
def auth_headers():
    """
    Login once and reuse the access token for authenticated tests.
    Set TEST_EMAIL and TEST_PASSWORD before running pytest.
    """
    if not TEST_EMAIL or not TEST_PASSWORD:
        pytest.skip(
            "Set TEST_EMAIL and TEST_PASSWORD environment variables "
            "to run authenticated tests."
        )

    response = client.post(
        "/auth/login",
        json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD,
        },
    )

    assert response.status_code == 200, response.text

    body = response.json()

    assert body["success"] is True
    assert body.get("access_token")

    return {
        "Authorization": f"Bearer {body['access_token']}"
    }


# =========================================================
# Health / Connection
# =========================================================

def test_health_check():
    response = client.get("/")

    assert response.status_code == 200

    body = response.json()

    assert body["status"] == "ok"


def test_supabase_connection():
    response = client.get("/test/supabase")

    assert response.status_code == 200

    body = response.json()

    assert body["success"] is True
    assert "data" in body


# =========================================================
# Authentication
# =========================================================

def test_me_requires_auth():
    response = client.get("/me")

    assert response.status_code in (401, 403)


def test_me(auth_headers):
    response = client.get(
        "/me",
        headers=auth_headers,
    )

    assert response.status_code == 200

    body = response.json()

    assert body["success"] is True
    assert body["user"]["id"]
    assert body["user"]["email"]


# =========================================================
# Categories
# =========================================================

def test_get_food_categories():
    response = client.get("/api/categories")

    assert response.status_code == 200
    assert isinstance(response.json(), (list, dict))


def test_get_ingredient_categories():
    response = client.get("/api/ingredient-categories")

    assert response.status_code == 200
    assert isinstance(response.json(), (list, dict))


# =========================================================
# Foods
# =========================================================

def test_get_foods():
    response = client.get("/api/foods")

    assert response.status_code == 200
    assert isinstance(response.json(), (list, dict))


def test_get_foods_by_category():
    response = client.get(
        "/api/foods",
        params={"category_id": 1},
    )

    assert response.status_code == 200
    assert isinstance(response.json(), (list, dict))


def test_get_ingredients():
    response = client.get("/api/ingredients")

    assert response.status_code == 200
    assert isinstance(response.json(), (list, dict))


def test_random_food():
    response = client.get(
        "/api/random/food",
        params={"category_ids": "1,8"},
    )

    assert response.status_code in (200, 404)


def test_random_ingredient():
    response = client.get(
        "/api/random/ingredient",
        params={
            "veg": "true",
            "meat": "true",
        },
    )

    assert response.status_code in (200, 404)


# =========================================================
# Posts - Public
# =========================================================

def test_feed_posts():
    response = client.get(
        "/api/posts/feed",
        params={
            "limit": 20,
            "offset": 0,
        },
    )

    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_feed_posts_pagination():
    response = client.get(
        "/api/posts/feed",
        params={
            "limit": 5,
            "offset": 0,
        },
    )

    assert response.status_code == 200

    posts = response.json()

    assert isinstance(posts, list)
    assert len(posts) <= 5


def test_search_posts():
    response = client.get(
        "/api/search",
        params={"q": "กะเพรา"},
    )

    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_search_without_query():
    response = client.get("/api/search")

    assert response.status_code == 200
    assert isinstance(response.json(), list)


# =========================================================
# Posts - Authentication
# =========================================================

def test_get_posts_requires_auth():
    response = client.get("/api/posts")

    assert response.status_code in (401, 403)


def test_saved_posts_requires_auth():
    response = client.get("/api/posts/saved")

    assert response.status_code in (401, 403)


# =========================================================
# Posts - CRUD
# =========================================================

def test_create_get_update_delete_post(auth_headers):
    payload = {
        "food_name": "pytest test post",
        "description": "created by automated API test",
        "restaurant_url": "https://example.com",
        "image_url": None,
        "category_ids": [],
    }

    # -------------------------
    # CREATE
    # -------------------------

    create_response = client.post(
        "/api/posts",
        headers=auth_headers,
        json=payload,
    )

    assert create_response.status_code == 200, create_response.text

    created = create_response.json()

    assert created["success"] is True
    assert created["data"]["id"]

    post_id = created["data"]["id"]

    try:
        # -------------------------
        # GET
        # -------------------------

        get_response = client.get(
            f"/api/posts/{post_id}"
        )

        assert get_response.status_code == 200

        post = get_response.json()

        assert post["id"] == post_id
        assert post["food_name"] == "pytest test post"

        # -------------------------
        # UPDATE
        # -------------------------

        update_response = client.patch(
            f"/api/posts/{post_id}",
            headers=auth_headers,
            json={
                "description": "updated by pytest",
            },
        )

        assert update_response.status_code == 200, update_response.text

        updated = update_response.json()

        assert updated["success"] is True
        assert updated["id"] == post_id

        # Verify update
        verify_response = client.get(
            f"/api/posts/{post_id}"
        )

        assert verify_response.status_code == 200

        updated_post = verify_response.json()

        assert updated_post["description"] == "updated by pytest"

    finally:
        # -------------------------
        # DELETE
        # -------------------------

        delete_response = client.delete(
            f"/api/posts/{post_id}",
            headers=auth_headers,
        )

        assert delete_response.status_code == 200, delete_response.text

        assert delete_response.json()["success"] is True

    # -------------------------
    # Verify deleted
    # -------------------------

    get_deleted_response = client.get(
        f"/api/posts/{post_id}"
    )

    assert get_deleted_response.status_code == 404


# =========================================================
# Posts - Bookmark
# =========================================================

def test_bookmark_and_unbookmark(auth_headers):
    feed_response = client.get(
        "/api/posts/feed",
        params={
            "limit": 1,
            "offset": 0,
        },
    )

    assert feed_response.status_code == 200

    posts = feed_response.json()

    if not posts:
        pytest.skip(
            "No post exists. Create a post before running bookmark test."
        )

    post_id = posts[0]["id"]

    # Ensure the post is not already bookmarked
    client.delete(
        f"/api/posts/{post_id}/bookmark",
        headers=auth_headers,
    )

    # -------------------------
    # BOOKMARK
    # -------------------------

    save_response = client.post(
        f"/api/posts/{post_id}/bookmark",
        headers=auth_headers,
    )

    assert save_response.status_code == 200, save_response.text

    save_body = save_response.json()

    assert save_body["success"] is True
    assert save_body["status"] == "saved"
    assert save_body["post_id"] == post_id

    # -------------------------
    # SAVED POSTS
    # -------------------------

    saved_response = client.get(
        "/api/posts/saved",
        headers=auth_headers,
    )

    assert saved_response.status_code == 200

    saved_body = saved_response.json()

    assert saved_body["success"] is True
    assert isinstance(saved_body["data"], list)

    # -------------------------
    # UNSAVE
    # -------------------------

    unsave_response = client.delete(
        f"/api/posts/{post_id}/bookmark",
        headers=auth_headers,
    )

    assert unsave_response.status_code == 200, unsave_response.text

    unsave_body = unsave_response.json()

    assert unsave_body["success"] is True
    assert unsave_body["status"] == "unsaved"
    assert unsave_body["post_id"] == post_id


# =========================================================
# Profiles
# =========================================================

def test_my_profile_requires_auth():
    response = client.get("/api/profiles/me")

    assert response.status_code in (401, 403)


def test_my_profile(auth_headers):
    response = client.get(
        "/api/profiles/me",
        headers=auth_headers,
    )

    assert response.status_code == 200

    body = response.json()

    assert body["success"] is True
    assert body["data"]["id"]


def test_update_my_profile(auth_headers):
    # Get current profile first
    get_response = client.get(
        "/api/profiles/me",
        headers=auth_headers,
    )

    assert get_response.status_code == 200

    original = get_response.json()["data"]

    original_bio = original.get("bio")

    # Update
    update_response = client.patch(
        "/api/profiles/me",
        headers=auth_headers,
        json={
            "bio": "pytest temporary bio",
        },
    )

    assert update_response.status_code == 200, update_response.text

    body = update_response.json()

    assert body["success"] is True

    # Restore original value
    restore_response = client.patch(
        "/api/profiles/me",
        headers=auth_headers,
        json={
            "bio": original_bio,
        },
    )

    assert restore_response.status_code == 200


# =========================================================
# Search History
# =========================================================

def test_search_history_requires_auth():
    response = client.get("/api/search/history")

    assert response.status_code in (401, 403)


def test_search_history(auth_headers):
    response = client.get(
        "/api/search/history",
        headers=auth_headers,
    )

    assert response.status_code == 200

    body = response.json()

    assert body["success"] is True
    assert isinstance(body["data"], list)


def test_add_and_delete_search_history(auth_headers):
    # -------------------------
    # CREATE
    # -------------------------

    create_response = client.post(
        "/api/search/history",
        headers=auth_headers,
        json={
            "query": "pytest-test-query",
        },
    )

    assert create_response.status_code == 200, create_response.text

    created = create_response.json()

    assert created["success"] is True

    rows = created.get("data") or []

    assert rows

    history_id = rows[0]["id"]

    # -------------------------
    # DELETE
    # -------------------------

    delete_response = client.delete(
        f"/api/search/history/{history_id}",
        headers=auth_headers,
    )

    assert delete_response.status_code == 200, delete_response.text

    body = delete_response.json()

    assert body["success"] is True


def test_clear_search_history(auth_headers):
    response = client.delete(
        "/api/search/history",
        headers=auth_headers,
    )

    assert response.status_code == 200

    body = response.json()

    assert body["success"] is True