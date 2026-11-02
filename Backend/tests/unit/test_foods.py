# -*- coding: utf-8 -*-
"""
Unit tests — Master data: Foods, Ingredients, Categories
Covers: GET /api/categories, /api/ingredient-categories,
        GET /api/foods, /api/ingredients,
        GET /api/random/food, /api/random/ingredient
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


# ── Categories ────────────────────────────────────────────────────────────────

def test_food_categories_returns_list():
    res = client.get("/api/categories")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list), "Expected list, got dict (possible error response)"
    assert len(data) > 0, "Food categories should not be empty"


def test_food_category_has_required_fields():
    res = client.get("/api/categories")
    assert res.status_code == 200
    category = res.json()[0]
    assert "id" in category
    assert "name" in category


def test_ingredient_categories_returns_list():
    res = client.get("/api/ingredient-categories")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    assert len(data) > 0


# ── Foods ─────────────────────────────────────────────────────────────────────

def test_foods_returns_list():
    res = client.get("/api/foods")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    assert len(data) > 0


def test_foods_filter_by_category():
    # Get a valid category id first
    cats = client.get("/api/categories").json()
    category_id = cats[0]["id"]

    res = client.get("/api/foods", params={"category_id": category_id})
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)


def test_ingredients_returns_list():
    res = client.get("/api/ingredients")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    assert len(data) > 0


# ── Random endpoints ──────────────────────────────────────────────────────────

def test_random_food_returns_food_object():
    """Random food should return 200 with a food object (not 404 — data must exist)."""
    res = client.get("/api/random/food", params={"category_ids": "1,8"})
    assert res.status_code == 200, (
        f"Expected 200 but got {res.status_code}. "
        "If the DB is empty for category 1 & 8, use categories with known data."
    )
    data = res.json()
    assert "name" in data or "food_name" in data or isinstance(data, dict)


def test_random_food_without_filter_returns_food():
    """Random food with no category filter should still return a result."""
    res = client.get("/api/random/food")
    assert res.status_code == 200


def test_random_ingredient_returns_ingredient():
    res = client.get("/api/random/ingredient", params={"veg": "true", "meat": "true"})
    assert res.status_code == 200

