# -*- coding: utf-8 -*-
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.security import get_current_admin

@pytest.fixture
def client():
    app.dependency_overrides[get_current_admin] = lambda: {
        "id": "test-admin-id",
        "email": "admin@example.com",
        "name": "Admin Tester",
        "role": "admin",
    }
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.pop(get_current_admin, None)


def test_admin_stats(client):
    """Verify GET /api/admin/stats returns 200 with summary metrics."""
    response = client.get("/api/admin/stats")
    assert response.status_code == 200
    data = response.json()
    assert "total_reports" in data
    assert "pending_reports" in data
    assert "total_users" in data
    assert "total_posts" in data
    assert "total_comments" in data


def test_admin_reports_queue(client):
    """Verify GET /api/admin/reports returns list with success."""
    response = client.get("/api/admin/reports")
    assert response.status_code == 200
    data = response.json()
    assert data.get("success") is True
    assert isinstance(data.get("data"), list)


def test_admin_posts_management(client):
    """Verify GET /api/admin/posts returns 200."""
    response = client.get("/api/admin/posts")
    assert response.status_code == 200
    data = response.json()
    assert data.get("success") is True
    assert isinstance(data.get("data"), list)


def test_admin_comments_management(client):
    """Verify GET /api/admin/comments returns 200."""
    response = client.get("/api/admin/comments")
    assert response.status_code == 200
    data = response.json()
    assert data.get("success") is True
    assert isinstance(data.get("data"), list)


def test_admin_users_management(client):
    """Verify GET /api/admin/users returns 200."""
    response = client.get("/api/admin/users")
    assert response.status_code == 200
    data = response.json()
    assert data.get("success") is True
    assert isinstance(data.get("data"), list)


def test_admin_audit_logs(client):
    """Verify GET /api/admin/audit-logs returns 200."""
    response = client.get("/api/admin/audit-logs")
    assert response.status_code == 200
    data = response.json()
    assert data.get("success") is True
    assert isinstance(data.get("data"), list)
