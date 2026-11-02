# -*- coding: utf-8 -*-
"""
Unit tests — Search & Search History
Covers: GET /api/search, GET/POST/DELETE /api/search/history
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


# ── Public search ─────────────────────────────────────────────────────────────

def test_search_with_query_returns_list():
    res = client.get("/api/search", params={"q": "กะเพรา"})
    assert res.status_code == 200
    assert isinstance(res.json(), list)


def test_search_empty_query_returns_list():
    res = client.get("/api/search", params={"q": ""})
    assert res.status_code == 200
    assert isinstance(res.json(), list)


def test_search_without_q_param():
    """Search without ?q at all should not crash."""
    res = client.get("/api/search")
    assert res.status_code == 200
    assert isinstance(res.json(), list)


def test_search_pagination():
    res = client.get("/api/search", params={"q": "ไก่", "limit": 3, "offset": 0})
    assert res.status_code == 200
    results = res.json()
    assert isinstance(results, list)
    assert len(results) <= 3


# ── Search history — auth guards ──────────────────────────────────────────────

def test_search_history_requires_auth():
    res = client.get("/api/search/history")
    assert res.status_code in (401, 403)


def test_add_search_history_requires_auth():
    res = client.post("/api/search/history", json={"query": "ทดสอบ"})
    assert res.status_code in (401, 403)


# ── Search history — CRUD ─────────────────────────────────────────────────────

def test_get_search_history(auth_headers):
    res = client.get("/api/search/history", headers=auth_headers)
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    assert isinstance(body["data"], list)


def test_add_and_delete_search_history_entry(auth_headers):
    # Add
    add_res = client.post(
        "/api/search/history",
        headers=auth_headers,
        json={"query": "pytest-unique-query"},
    )
    assert add_res.status_code == 200
    body = add_res.json()
    assert body["success"] is True
    entries = body.get("data") or []
    assert entries
    entry_id = entries[0]["id"]

    # Delete by id
    del_res = client.delete(f"/api/search/history/{entry_id}", headers=auth_headers)
    assert del_res.status_code == 200
    assert del_res.json()["success"] is True


def test_clear_all_search_history(auth_headers):
    res = client.delete("/api/search/history", headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["success"] is True

