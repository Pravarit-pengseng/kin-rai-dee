from typing import Optional
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from pydantic import BaseModel
from app.db import supabase
from app.core.security import get_current_user
from app.routers.posts import attach_profiles_to_posts

router = APIRouter(prefix="/api/profiles", tags=["Profiles"])


class ProfileUpdate(BaseModel):
    username: Optional[str] = None
    display_name: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None


@router.get("/me")
def get_my_profile(user: dict = Depends(get_current_user)):
    """Get current user's profile (auth required)."""
    response = (
        supabase.table("profiles")
        .select("*")
        .eq("id", user["id"])
        .single()
        .execute()
    )
    if not response.data:
        raise HTTPException(status_code=404, detail="Profile not found")
    return {"success": True, "data": response.data}


@router.patch("/me")
def update_my_profile(
    profile: ProfileUpdate,
    user: dict = Depends(get_current_user),
):
    """Update current user's profile (auth required)."""
    update_data = profile.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    response = (
        supabase.table("profiles")
        .update(update_data)
        .eq("id", user["id"])
        .execute()
    )
    return {"success": True, "data": response.data}


@router.post("/me/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user),
):
    """Upload avatar image to Supabase Storage and update profile (auth required)."""
    if not file.content_type:
        raise HTTPException(status_code=400, detail="Invalid file type")

    allowed_types = {"image/jpeg", "image/png", "image/webp"}
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="Only JPG, PNG, and WEBP images are allowed",
        )

    file_data = await file.read()
    file_extension = file.content_type.split("/")[-1]
    file_path = f"{user['id']}/avatar.{file_extension}"

    try:
        supabase.storage.from_("avatars").upload(
            path=file_path,
            file=file_data,
            file_options={"content-type": file.content_type, "upsert": "true"},
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to upload avatar: {str(e)}"
        )

    avatar_url = supabase.storage.from_("avatars").get_public_url(file_path)

    response = (
        supabase.table("profiles")
        .update({"avatar_url": avatar_url})
        .eq("id", user["id"])
        .execute()
    )

    return {"success": True, "avatar_url": avatar_url, "data": response.data}


@router.get("/{user_id}")
def get_user_profile(user_id: str):
    """Fetch any user's public profile."""
    if not supabase:
        raise HTTPException(status_code=404, detail="Profile not found")
    try:
        response = (
            supabase.table("profiles")
            .select("*")
            .eq("id", user_id)
            .single()
            .execute()
        )
        return response.data
    except Exception:
        raise HTTPException(status_code=404, detail="Profile not found")



@router.get("/{user_id}/posts")
def get_user_posts(user_id: str):
    """Fetch posts by a specific user."""
    if not supabase:
        return []
    try:
        response = (
            supabase.table("posts")
            .select("*, post_categories(categories(id, name))")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .execute()
        )
        posts = response.data or []
        return attach_profiles_to_posts(posts)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
