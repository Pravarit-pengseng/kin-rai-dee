from typing import Optional, List
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.db import supabase

router = APIRouter(prefix="/api/posts", tags=["Posts & Bookmarks"])

class PostCreate(BaseModel):
    user_id: str
    food_name: str
    description: Optional[str] = None
    restaurant_url: Optional[str] = None
    image_url: Optional[str] = None
    category_ids: Optional[List[int]] = []

class PostUpdate(BaseModel):
    food_name: Optional[str] = None
    description: Optional[str] = None
    restaurant_url: Optional[str] = None
    image_url: Optional[str] = None
    category_ids: Optional[List[int]] = None

class BookmarkPayload(BaseModel):
    user_id: str

def attach_profiles_to_posts(posts: List[dict]) -> List[dict]:
    """Helper to attach user profiles to posts safely."""
    if not posts or not supabase:
        return posts

    user_ids = list(set([p["user_id"] for p in posts if p.get("user_id")]))
    profiles_map = {}

    if user_ids:
        try:
            prof_resp = supabase.table("profiles").select("id, username, display_name, avatar_url").in_("id", user_ids).execute()
            if prof_resp.data:
                profiles_map = {prof["id"]: prof for prof in prof_resp.data}
        except Exception as e:
            print("Failed to fetch profiles for posts:", e)

    for post in posts:
        uid = post.get("user_id")
        post["profiles"] = profiles_map.get(uid, {
            "id": uid,
            "username": "user",
            "display_name": "User",
            "avatar_url": None
        })

    return posts

@router.get("/feed")
def get_feed_posts(
    limit: int = 20,
    offset: int = 0
):
    """Fetch recent feed posts with user profiles and categories from DB."""
    if not supabase:
        return []
    try:
        limit_val = int(limit) if isinstance(limit, (int, str)) else 20
        offset_val = int(offset) if isinstance(offset, (int, str)) else 0

        posts_resp = supabase.table("posts") \
            .select("*, post_categories(categories(id, name))") \
            .order("created_at", desc=True) \
            .range(offset_val, offset_val + limit_val - 1) \
            .execute()

        posts = posts_resp.data or []
        return attach_profiles_to_posts(posts)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{post_id}")
def get_post_detail(post_id: int):
    """Fetch single post details from DB."""
    if not supabase:
        raise HTTPException(status_code=404, detail="Post not found")
    try:
        response = supabase.table("posts") \
            .select("*, post_categories(categories(id, name))") \
            .eq("id", post_id) \
            .single() \
            .execute()

        if not response.data:
            raise HTTPException(status_code=404, detail="Post not found")

        post = response.data
        attached = attach_profiles_to_posts([post])
        return attached[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("")
def create_post(payload: PostCreate):
    """Create a new post and associate categories in DB."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Database connection uninitialized")
    try:
        post_data = {
            "user_id": payload.user_id,
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
            cat_inserts = [{"post_id": new_post_id, "category_id": cid} for cid in payload.category_ids]
            supabase.table("post_categories").insert(cat_inserts).execute()

        return new_post
    except Exception as e:
        err_msg = str(e)
        if "posts_user_id_fkey" in err_msg or "23503" in err_msg:
            raise HTTPException(
                status_code=400,
                detail=f"User ID '{payload.user_id}' does not exist in Supabase Auth (auth.users). Please sign up / register a user first or pass a valid registered user_id."
            )
        raise HTTPException(status_code=500, detail=err_msg)

@router.put("/{post_id}")
def update_post(post_id: int, payload: PostUpdate):
    """Update post in DB."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Database connection uninitialized")
    try:
        update_data = {}
        if payload.food_name is not None:
            update_data["food_name"] = payload.food_name
        if payload.description is not None:
            update_data["description"] = payload.description
        if payload.restaurant_url is not None:
            update_data["restaurant_url"] = payload.restaurant_url
        if payload.image_url is not None:
            update_data["image_url"] = payload.image_url

        if update_data:
            supabase.table("posts").update(update_data).eq("id", post_id).execute()

        if payload.category_ids is not None:
            supabase.table("post_categories").delete().eq("post_id", post_id).execute()
            if payload.category_ids:
                cat_inserts = [{"post_id": post_id, "category_id": cid} for cid in payload.category_ids]
                supabase.table("post_categories").insert(cat_inserts).execute()

        return {"status": "updated", "id": post_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{post_id}")
def delete_post(post_id: int, user_id: str):
    """Delete post from DB."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Database connection uninitialized")
    try:
        supabase.table("posts").delete().eq("id", post_id).eq("user_id", user_id).execute()
        return {"status": "deleted", "id": post_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Bookmark endpoints
@router.post("/{post_id}/bookmark")
def save_post(post_id: int, payload: BookmarkPayload):
    """Save/Bookmark a post for a user in DB."""
    if not supabase:
        return {"status": "ok"}
    try:
        supabase.table("saved_posts").insert({
            "user_id": payload.user_id,
            "post_id": post_id
        }).execute()
        return {"status": "saved", "post_id": post_id}
    except Exception as e:
        err_msg = str(e)
        if "saved_posts_user_id_fkey" in err_msg or "23503" in err_msg:
            raise HTTPException(
                status_code=400,
                detail=f"User ID '{payload.user_id}' does not exist in Supabase Auth (auth.users)."
            )
        raise HTTPException(status_code=500, detail=err_msg)

@router.delete("/{post_id}/bookmark")
def unsave_post(post_id: int, user_id: str):
    """Unsave/Remove bookmark in DB."""
    if not supabase:
        return {"status": "ok"}
    try:
        supabase.table("saved_posts").delete().eq("post_id", post_id).eq("user_id", user_id).execute()
        return {"status": "unsaved", "post_id": post_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/saved/{user_id}")
def get_user_saved_posts(user_id: str):
    """Fetch user's bookmarked posts from DB."""
    if not supabase:
        return []
    try:
        response = supabase.table("saved_posts") \
            .select("post_id, posts(*)") \
            .eq("user_id", user_id) \
            .order("created_at", desc=True) \
            .execute()

        posts = [item["posts"] for item in (response.data or []) if item.get("posts")]
        return attach_profiles_to_posts(posts)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
