from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException
from app.db import supabase
from app.core.security import get_current_user
from pydantic import BaseModel, Field

router = APIRouter(prefix="/api/posts", tags=["Posts & Bookmarks"])


class PostCreate(BaseModel):
    food_name: str
    description: Optional[str] = None
    restaurant_url: Optional[str] = None
    image_url: Optional[str] = None
    category_ids: List[int] = Field(default_factory=list)


class PostUpdate(BaseModel):
    food_name: Optional[str] = None
    description: Optional[str] = None
    restaurant_url: Optional[str] = None
    image_url: Optional[str] = None
    category_ids: Optional[List[int]] = None

def attach_profiles_to_posts(posts: List[dict]) -> List[dict]:
    """Helper to attach user profiles to posts safely."""
    if not posts or not supabase:
        return posts

    user_ids = list(set([p["user_id"] for p in posts if p.get("user_id")]))
    profiles_map = {}

    if user_ids:
        try:
            prof_resp = (
                supabase.table("profiles")
                .select("id, username, display_name, avatar_url")
                .in_("id", user_ids)
                .execute()
            )
            if prof_resp.data:
                profiles_map = {prof["id"]: prof for prof in prof_resp.data}
        except Exception as e:
            print("Failed to fetch profiles for posts:", e)

    for post in posts:
        uid = post.get("user_id")
        post["profiles"] = profiles_map.get(
            uid,
            {
                "id": uid,
                "username": "user",
                "display_name": "User",
                "avatar_url": None,
            },
        )

    return posts


@router.get("/feed")
def get_feed_posts(limit: int = 20, offset: int = 0):
    """Fetch recent feed posts with user profiles and categories."""
    if not supabase:
        return []
    try:
        posts_resp = (
            supabase.table("posts")
            .select("*, post_categories(categories(id, name))")
            .order("created_at", desc=True)
            .range(offset, offset + limit - 1)
            .execute()
        )
        posts = posts_resp.data or []
        return attach_profiles_to_posts(posts)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("")
def get_posts(user: dict = Depends(get_current_user)):
    """Fetch all posts (auth required)."""
    try:
        response = (
            supabase.table("posts")
            .select("*, post_categories(categories(id, name))")
            .order("created_at", desc=True)
            .execute()
        )
        posts = response.data or []
        return {"success": True, "data": attach_profiles_to_posts(posts)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/saved")
def get_user_saved_posts(
    user: dict = Depends(get_current_user),
):
    try:
        response = (
            supabase
            .table("saved_posts")
            .select("post_id, posts(*)")
            .eq("user_id", user["id"])
            .order("created_at", desc=True)
            .execute()
        )

        posts = [
            item["posts"]
            for item in (response.data or [])
            if item.get("posts")
        ]

        return {
            "success": True,
            "data": attach_profiles_to_posts(posts),
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e),
        )


@router.get("/{post_id}")
def get_post_detail(post_id: int):
    """Fetch single post details."""
    if not supabase:
        raise HTTPException(status_code=404, detail="Post not found")
    try:
        response = (
            supabase.table("posts")
            .select("*, post_categories(categories(id, name))")
            .eq("id", post_id)
            .maybe_single()
            .execute()
        )
        if not response.data:
            raise HTTPException(status_code=404, detail="Post not found")
        return attach_profiles_to_posts([response.data])[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("")
def create_post(
    payload: PostCreate,
    user: dict = Depends(get_current_user),
):
    """Create a new post (auth required). user_id taken from JWT."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Database connection uninitialized")
    try:
        post_data = {
            "user_id": user["id"],
            "food_name": payload.food_name,
            "description": payload.description,
            "restaurant_url": payload.restaurant_url,
            "image_url": payload.image_url,
        }
        res = supabase.table("posts").insert(post_data).execute()
        if not res.data:
            raise HTTPException(status_code=400, detail="Failed to create post")

        new_post = res.data[0]
        new_post_id = new_post["id"]

        if payload.category_ids:
            cat_inserts = [
                {"post_id": new_post_id, "category_id": cid}
                for cid in payload.category_ids
            ]
            supabase.table("post_categories").insert(cat_inserts).execute()

        return {"success": True, "data": new_post}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/{post_id}")
def update_post(
    post_id: int,
    payload: PostUpdate,
    user: dict = Depends(get_current_user),
):
    """Update post (auth required, owner only)."""
    if not supabase:
        raise HTTPException(
            status_code=500,
            detail="Database connection uninitialized",
        )

    try:
        # Check ownership first
        owner_check = (
            supabase
            .table("posts")
            .select("id")
            .eq("id", post_id)
            .eq("user_id", user["id"])
            .maybe_single()
            .execute()
        )

        if not owner_check.data:
            raise HTTPException(
                status_code=404,
                detail="Post not found or not owned by user",
            )

        update_data = payload.model_dump(
            exclude_unset=True,
            exclude={"category_ids"},
        )

        if not update_data and payload.category_ids is None:
            raise HTTPException(
                status_code=400,
                detail="No fields to update",
            )

        # Update post fields
        if update_data:
            supabase.table("posts").update(update_data).eq(
                "id", post_id
            ).execute()

        # Update categories
        if payload.category_ids is not None:
            (
                supabase
                .table("post_categories")
                .delete()
                .eq("post_id", post_id)
                .execute()
            )

            if payload.category_ids:
                cat_inserts = [
                    {
                        "post_id": post_id,
                        "category_id": cid,
                    }
                    for cid in payload.category_ids
                ]

                supabase.table("post_categories").insert(
                    cat_inserts
                ).execute()

        return {
            "success": True,
            "id": post_id,
        }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e),
        )

@router.delete("/{post_id}")
def delete_post(
    post_id: int,
    user: dict = Depends(get_current_user),
):
    """Delete post (auth required, owner only)."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Database connection uninitialized")
    try:
        res = (
            supabase.table("posts")
            .delete()
            .eq("id", post_id)
            .eq("user_id", user["id"])
            .execute()
        )
        if not res.data:
            raise HTTPException(
                status_code=404, detail="Post not found or not owned by user"
            )
        return {"success": True, "message": "Post deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Bookmark endpoints ──────────────────────────────────────────────────────

@router.post("/{post_id}/bookmark")
def save_post(post_id: int, user: dict = Depends(get_current_user)):
    """Bookmark a post (auth required)."""
    if not supabase:
        return {"status": "ok"}
    try:
        supabase.table("saved_posts").insert(
            {"user_id": user["id"], "post_id": post_id}
        ).execute()
        return {"success": True, "status": "saved", "post_id": post_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{post_id}/bookmark")
def unsave_post(post_id: int, user: dict = Depends(get_current_user)):
    """Remove bookmark (auth required)."""
    if not supabase:
        return {"status": "ok"}
    try:
        supabase.table("saved_posts").delete().eq("post_id", post_id).eq(
            "user_id", user["id"]
        ).execute()
        return {"success": True, "status": "unsaved", "post_id": post_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
