from fastapi import APIRouter, Depends, HTTPException
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