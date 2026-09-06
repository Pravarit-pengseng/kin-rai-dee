from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from app.db import supabase
from app.routers.posts import attach_profiles_to_posts

router = APIRouter(prefix="/api/search", tags=["Search"])

class SearchHistoryCreate(BaseModel):
    user_id: str
    query: str

@router.get("")
def search_posts(q: str = Query("", description="Search term")):
    """Search posts by food_name or description."""
    if not supabase:
        return []
    try:
        search_term = q.strip()
        if not search_term:
            response = supabase.table("posts") \
                .select("*, post_categories(categories(id, name))") \
                .order("created_at", desc=True) \
                .limit(20) \
                .execute()
            posts = response.data or []
            return attach_profiles_to_posts(posts)
            
        response = supabase.table("posts") \
            .select("*, post_categories(categories(id, name))") \
            .or_(f"food_name.ilike.%{search_term}%,description.ilike.%{search_term}%") \
            .order("created_at", desc=True) \
            .execute()

        posts = response.data or []
        return attach_profiles_to_posts(posts)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/history")
def get_search_history(user_id: str = Query(..., description="User ID")):
    """Get search history for a user."""
    if not supabase:
        return []
    try:
        response = supabase.table("search_history") \
            .select("*") \
            .eq("user_id", user_id) \
            .order("created_at", desc=True) \
            .limit(10) \
            .execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/history")
def add_search_history(payload: SearchHistoryCreate):
    """Add a new search query to user search history."""
    if not supabase:
        return {"status": "ok"}
    try:
        existing = supabase.table("search_history") \
            .select("id") \
            .eq("user_id", payload.user_id) \
            .eq("query", payload.query) \
            .execute()
            
        if not existing.data:
            supabase.table("search_history").insert({
                "user_id": payload.user_id,
                "query": payload.query
            }).execute()
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/history/{history_id}")
def delete_search_history_item(history_id: int):
    """Delete a single search history item by ID."""
    if not supabase:
        return {"status": "ok"}
    try:
        supabase.table("search_history").delete().eq("id", history_id).execute()
        return {"status": "deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/history")
def clear_search_history(user_id: str = Query(..., description="User ID")):
    """Clear all search history for a user."""
    if not supabase:
        return {"status": "ok"}
    try:
        supabase.table("search_history").delete().eq("user_id", user_id).execute()
        return {"status": "cleared"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
