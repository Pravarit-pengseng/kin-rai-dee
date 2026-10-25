from typing import Optional
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from pydantic import BaseModel
from app.db import supabase
from app.core.security import get_current_user
from app.routers.posts import attach_profiles_to_posts, normalize_avatar_url, to_records

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
    profile = response.data
    if isinstance(profile, dict):
        profile["avatar_url"] = normalize_avatar_url(profile.get("avatar_url"))
    return {"success": True, "data": profile}


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
    data = response.data[0] if (response.data and isinstance(response.data, list)) else response.data
    if isinstance(data, dict):
        data["avatar_url"] = normalize_avatar_url(data.get("avatar_url"))
    return {"success": True, "data": data}


@router.post("/me/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user),
):
    """Upload avatar image to Supabase Storage and update profile (auth required)."""
    if not file.content_type:
        raise HTTPException(status_code=400, detail="Invalid file type")

    allowed_types = {"image/jpeg", "image/jpg", "image/png", "image/webp"}
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

    import time
    timestamp = int(time.time())
    avatar_url = f"{supabase.storage.from_('avatars').get_public_url(file_path)}?t={timestamp}"

    response = (
        supabase.table("profiles")
        .update({"avatar_url": avatar_url})
        .eq("id", user["id"])
        .execute()
    )

    avatar_url = normalize_avatar_url(avatar_url)
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
        profile = response.data
        if isinstance(profile, dict):
            profile["avatar_url"] = normalize_avatar_url(profile.get("avatar_url"))
        return profile
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
            .or_("is_hidden.is.null,is_hidden.eq.false")
            .order("created_at", desc=True)
            .execute()
        )
        posts = [p for p in to_records(response.data) if not p.get("is_hidden")]
        return attach_profiles_to_posts(posts)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/me")
def delete_my_account(user: dict = Depends(get_current_user)):
    """Permanently delete user account, avatars from storage, and cascade DB records."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Database connection uninitialized")

    user_id = user["id"]
    try:
        # 1. Clean up avatar files from Supabase Storage
        try:
            files = supabase.storage.from_("avatars").list(user_id)
            if files and isinstance(files, list):
                file_paths = [
                    f"{user_id}/{f['name']}"
                    for f in files
                    if isinstance(f, dict) and "name" in f and f["name"]
                ]
                if file_paths:
                    supabase.storage.from_("avatars").remove(file_paths)
        except Exception as storage_err:
            import logging
            logging.warning(f"Error removing avatar files for user {user_id}: {storage_err}")

        # 2. Delete user from Supabase Auth (triggers ON DELETE CASCADE in PostgreSQL)
        try:
            supabase.auth.admin.delete_user(user_id)
        except Exception as auth_err:
            import logging
            logging.error(f"Error deleting user from auth.admin: {auth_err}", exc_info=True)
            supabase.table("profiles").delete().eq("id", user_id).execute()

        return {
            "success": True,
            "message": "Account and all associated data have been permanently deleted",
        }
    except Exception as e:
        import logging
        logging.error(f"Failed to delete account for user {user_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete account: {str(e)}",
        )
