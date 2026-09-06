from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.db import supabase
from app.routers.posts import attach_profiles_to_posts

router = APIRouter(prefix="/api/profiles", tags=["Profiles"])

class ProfileUpdate(BaseModel):
    display_name: Optional[str] = None
    username: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None

@router.get("/{user_id}")
def get_user_profile(user_id: str):
    """Fetch user profile from DB."""
    if not supabase:
        return None
    try:
        response = supabase.table("profiles").select("*").eq("id", user_id).single().execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=404, detail="Profile not found")

@router.put("/{user_id}")
def update_user_profile(user_id: str, payload: ProfileUpdate):
    """Update user profile in DB."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Database connection uninitialized")
    try:
        update_data = {}
        if payload.display_name is not None:
            update_data["display_name"] = payload.display_name
        if payload.username is not None:
            update_data["username"] = payload.username
        if payload.bio is not None:
            update_data["bio"] = payload.bio
        if payload.avatar_url is not None:
            update_data["avatar_url"] = payload.avatar_url
            
        update_data["updated_at"] = "now()"

        response = supabase.table("profiles").update(update_data).eq("id", user_id).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{user_id}/posts")
def get_user_posts(user_id: str):
    """Fetch posts by a specific user from DB."""
    if not supabase:
        return []
    try:
        response = supabase.table("posts") \
            .select("*, post_categories(categories(id, name))") \
            .eq("user_id", user_id) \
            .order("created_at", desc=True) \
            .execute()
        posts = response.data or []
        return attach_profiles_to_posts(posts)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
