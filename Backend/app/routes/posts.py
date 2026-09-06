from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.core.security import get_current_user
from app.db.supabase import supabase

router = APIRouter(prefix="/posts", tags=["Posts"])


class PostCreate(BaseModel):
    food_name: str
    description: str | None = None
    restaurant_url: str | None = None
    image_url: str | None = None


class PostUpdate(BaseModel):
    food_name: str | None = None
    description: str | None = None
    restaurant_url: str | None = None
    image_url: str | None = None


@router.post("")
def create_post(
    post: PostCreate,
    user: dict = Depends(get_current_user),
):
    data = {
        "user_id": user["id"],
        "food_name": post.food_name,
        "description": post.description,
        "restaurant_url": post.restaurant_url,
        "image_url": post.image_url,
    }

    response = (
        supabase
        .table("posts")
        .insert(data)
        .execute()
    )

    return {
        "success": True,
        "data": response.data,
    }


@router.get("")
def get_posts(
    user: dict = Depends(get_current_user),
):
    response = (
        supabase
        .table("posts")
        .select("*")
        .order("created_at", desc=True)
        .execute()
    )

    return {
        "success": True,
        "data": response.data,
    }


@router.get("/{post_id}")
def get_post(
    post_id: int,
    user: dict = Depends(get_current_user),
):
    response = (
        supabase
        .table("posts")
        .select("*")
        .eq("id", post_id)
        .maybe_single()
        .execute()
    )

    if not response.data:
        raise HTTPException(
            status_code=404,
            detail="Post not found",
        )

    return {
        "success": True,
        "data": response.data,
    }


@router.patch("/{post_id}")
def update_post(
    post_id: int,
    post: PostUpdate,
    user: dict = Depends(get_current_user),
):
    update_data = post.model_dump(exclude_unset=True)

    if not update_data:
        raise HTTPException(
            status_code=400,
            detail="No fields to update",
        )

    response = (
        supabase
        .table("posts")
        .update(update_data)
        .eq("id", post_id)
        .eq("user_id", user["id"])
        .execute()
    )

    if not response.data:
        raise HTTPException(
            status_code=404,
            detail="Post not found or not owned by user",
        )

    return {
        "success": True,
        "data": response.data,
    }


@router.delete("/{post_id}")
def delete_post(
    post_id: int,
    user: dict = Depends(get_current_user),
):
    response = (
        supabase
        .table("posts")
        .delete()
        .eq("id", post_id)
        .eq("user_id", user["id"])
        .execute()
    )

    if not response.data:
        raise HTTPException(
            status_code=404,
            detail="Post not found or not owned by user",
        )

    return {
        "success": True,
        "message": "Post deleted successfully",
    }