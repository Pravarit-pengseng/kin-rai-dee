from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from pydantic import BaseModel

from app.core.security import get_current_user
from app.db.supabase import supabase

router = APIRouter(prefix="/profile", tags=["Profile"])


class ProfileUpdate(BaseModel):
    username: str | None = None
    display_name: str | None = None
    bio: str | None = None
    avatar_url: str | None = None


@router.get("")
def get_profile(user: dict = Depends(get_current_user)):
    response = (
        supabase
        .table("profiles")
        .select("*")
        .eq("id", user["id"])
        .single()
        .execute()
    )

    if not response.data:
        raise HTTPException(
            status_code=404,
            detail="Profile not found",
        )

    return {
        "success": True,
        "data": response.data,
    }


@router.patch("")
def update_profile(
    profile: ProfileUpdate,
    user: dict = Depends(get_current_user),
):
    update_data = profile.model_dump(exclude_unset=True)

    if not update_data:
        raise HTTPException(
            status_code=400,
            detail="No fields to update",
        )

    response = (
        supabase
        .table("profiles")
        .update(update_data)
        .eq("id", user["id"])
        .execute()
    )

    return {
        "success": True,
        "data": response.data,
    }
    
@router.post("/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user),
):
    if not file.content_type:
        raise HTTPException(
            status_code=400,
            detail="Invalid file type",
        )

    allowed_types = {
        "image/jpeg",
        "image/png",
        "image/webp",
    }

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
            file_options={
                "content-type": file.content_type,
                "upsert": "true",
            },
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to upload avatar: {str(e)}",
        )

    avatar_url = (
        supabase.storage
        .from_("avatars")
        .get_public_url(file_path)
    )

    response = (
        supabase
        .table("profiles")
        .update({
            "avatar_url": avatar_url,
        })
        .eq("id", user["id"])
        .execute()
    )

    return {
        "success": True,
        "avatar_url": avatar_url,
        "data": response.data,
    }