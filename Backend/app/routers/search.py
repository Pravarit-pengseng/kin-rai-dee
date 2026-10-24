import re
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from app.core.security import get_current_user, get_optional_current_user
from app.db import supabase
from app.routers.posts import attach_profiles_to_posts
from app.services.safety_service import get_blocked_user_ids


router = APIRouter(
    prefix="/api/search",
    tags=["Search"],
)


class SearchHistoryCreate(BaseModel):
    query: str


@router.get("")
def search_posts(
    q: str = Query("", description="Search term"),
    limit: int = Query(20, ge=1, le=100, description="Max items to return"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
    user: Optional[dict] = Depends(get_optional_current_user),
):
    """Search posts by food_name or description with partial match, pagination, and blocked user filtering."""
    if not supabase:
        return []

    try:
        search_term = q.strip()

        # Empty search → latest posts with pagination
        if not search_term:
            response = (
                supabase
                .table("posts")
                .select("*, post_categories(categories(id, name))")
                .order("created_at", desc=True)
                .range(offset, offset + limit - 1)
                .execute()
            )

            posts = response.data or []

            if user and user.get("id"):
                blocked_ids = get_blocked_user_ids(user["id"])
                if blocked_ids:
                    posts = [p for p in posts if str(p.get("user_id")) not in blocked_ids]

            return attach_profiles_to_posts(posts)

        # Sanitize term for PostgREST .or_() filter
        safe_term = re.sub(r'[,()"]', '', search_term).strip()
        if not safe_term:
            return []

        # Search users by display_name or username
        user_resp = supabase.table("profiles").select("id").or_(f"username.ilike.%{safe_term}%,display_name.ilike.%{safe_term}%").execute()
        user_ids = [u["id"] for u in user_resp.data] if user_resp.data else []

        # Search categories
        cat_resp = supabase.table("categories").select("id").ilike("name", f"%{safe_term}%").execute()
        cat_ids = [c["id"] for c in cat_resp.data] if cat_resp.data else []
        
        cat_post_ids = []
        if cat_ids:
            post_cats_resp = supabase.table("post_categories").select("post_id").in_("category_id", cat_ids).execute()
            cat_post_ids = [pc["post_id"] for pc in post_cats_resp.data] if post_cats_resp.data else []

        or_conds = [
            f"food_name.ilike.%{safe_term}%",
            f"description.ilike.%{safe_term}%"
        ]
        if user_ids:
            user_id_list = ",".join(user_ids)
            or_conds.append(f"user_id.in.({user_id_list})")
            
        if cat_post_ids:
            post_id_list = ",".join(map(str, cat_post_ids))
            or_conds.append(f"id.in.({post_id_list})")
            
        or_query = ",".join(or_conds)

        response = (
            supabase
            .table("posts")
            .select("*, post_categories(categories(id, name))")
            .or_(or_query)
            .order("created_at", desc=True)
            .range(offset, offset + limit - 1)
            .execute()
        )

        posts = response.data or []

        if user and user.get("id"):
            blocked_ids = get_blocked_user_ids(user["id"])
            if blocked_ids:
                posts = [p for p in posts if str(p.get("user_id")) not in blocked_ids]

        return attach_profiles_to_posts(posts)

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e),
        )


# ─────────────────────────────────────────────────────────────
# Search History
# ─────────────────────────────────────────────────────────────

@router.get("/history")
def get_search_history(
    user: dict = Depends(get_current_user),
):
    """Get search history of current user."""
    try:
        response = (
            supabase
            .table("search_history")
            .select("*")
            .eq("user_id", user["id"])
            .order("created_at", desc=True)
            .execute()
        )

        return {
            "success": True,
            "data": response.data or [],
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e),
        )


@router.post("/history")
def add_search_history(
    payload: SearchHistoryCreate,
    user: dict = Depends(get_current_user),
):
    """Add search history for current user."""
    query = payload.query.strip()

    if not query:
        raise HTTPException(
            status_code=400,
            detail="Search query cannot be empty",
        )

    try:
        response = (
            supabase
            .table("search_history")
            .insert({
                "user_id": user["id"],
                "query": query,
            })
            .execute()
        )

        return {
            "success": True,
            "data": response.data,
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e),
        )


@router.delete("/history/{history_id}")
def delete_search_history_item(
    history_id: int,
    user: dict = Depends(get_current_user),
):
    """Delete a search history item owned by current user."""
    try:
        response = (
            supabase
            .table("search_history")
            .delete()
            .eq("id", history_id)
            .eq("user_id", user["id"])
            .execute()
        )

        if not response.data:
            raise HTTPException(
                status_code=404,
                detail="Search history not found",
            )

        return {
            "success": True,
            "message": "Search history deleted successfully",
        }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e),
        )


@router.delete("/history")
def clear_search_history(
    user: dict = Depends(get_current_user),
):
    """Delete all search history of current user."""
    try:
        response = (
            supabase
            .table("search_history")
            .delete()
            .eq("user_id", user["id"])
            .execute()
        )

        return {
            "success": True,
            "message": "Search history cleared successfully",
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e),
        )