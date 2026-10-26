from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, field_validator
from app.db import supabase
from app.core.security import get_current_user, get_optional_current_user
from app.services.safety_service import get_blocked_user_ids, is_blocked_between
from app.core.validators import validate_public_url

router = APIRouter(prefix="/api/posts", tags=["Posts & Bookmarks"])


class PostCreate(BaseModel):
    food_name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=2000)
    restaurant_url: Optional[str] = None
    image_url: Optional[str] = None
    category_ids: List[int] = Field(default_factory=list)

    @field_validator("image_url", "restaurant_url", mode="before")
    @classmethod
    def validate_urls(cls, v: Optional[str]) -> Optional[str]:
        try:
            return validate_public_url(v, "URL")
        except ValueError as exc:
            raise ValueError(str(exc)) from exc


class PostUpdate(BaseModel):
    food_name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=2000)
    restaurant_url: Optional[str] = None
    image_url: Optional[str] = None
    category_ids: Optional[List[int]] = None

    @field_validator("image_url", "restaurant_url", mode="before")
    @classmethod
    def validate_urls(cls, v: Optional[str]) -> Optional[str]:
        try:
            return validate_public_url(v, "URL")
        except ValueError as exc:
            raise ValueError(str(exc)) from exc


class CommentCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=1000)


class CommentUpdate(BaseModel):
    content: str = Field(..., min_length=1, max_length=1000)

from app.core.config import SUPABASE_URL

def to_records(data: Any) -> List[Dict[str, Any]]:
    """Type-safe helper to narrow Supabase JSON responses to a list of dicts."""
    if isinstance(data, list):
        return [item for item in data if isinstance(item, dict)]
    return []

def normalize_avatar_url(url: Any) -> Optional[str]:
    """Ensure Supabase storage avatar URLs point to the current SUPABASE_URL."""
    if not url or not isinstance(url, str):
        return None
    if not SUPABASE_URL:
        return url
    marker = "/storage/v1/object/public/avatars/"
    if marker in url:
        idx = url.find(marker)
        path = url[idx:]
        return f"{SUPABASE_URL.rstrip('/')}{path}"
    return url

def attach_profiles_to_posts(posts: Any) -> List[Dict[str, Any]]:
    """Helper to attach user profiles to posts safely."""
    post_list = to_records(posts) if not isinstance(posts, list) else [p for p in posts if isinstance(p, dict)]
    if not post_list or not supabase:
        return post_list

    user_ids = list(set([p["user_id"] for p in post_list if p.get("user_id")]))
    profiles_map: Dict[str, Dict[str, Any]] = {}

    if user_ids:
        try:
            prof_resp = (
                supabase.table("profiles")
                .select("id, username, display_name, avatar_url")
                .in_("id", user_ids)
                .execute()
            )
            for prof in to_records(prof_resp.data):
                if "id" in prof:
                    prof["avatar_url"] = normalize_avatar_url(prof.get("avatar_url"))
                    profiles_map[str(prof["id"])] = prof
        except Exception as e:
            print("Failed to fetch profiles for posts:", e)

    for post in post_list:
        uid = post.get("user_id")
        prof = profiles_map.get(str(uid)) if uid else None
        if not isinstance(prof, dict):
            prof = {
                "id": uid,
                "username": "user",
                "display_name": "User",
                "avatar_url": None,
            }
        post["profiles"] = prof

    return post_list


def attach_profiles_to_comments(comments: Any) -> List[Dict[str, Any]]:
    """Helper to attach user profiles and friendly fields to comments."""
    comment_list = to_records(comments) if not isinstance(comments, list) else [c for c in comments if isinstance(c, dict)]
    if not comment_list or not supabase:
        return comment_list

    user_ids = list(set([c["user_id"] for c in comment_list if c.get("user_id")]))
    profiles_map: Dict[str, Dict[str, Any]] = {}

    if user_ids:
        try:
            prof_resp = (
                supabase.table("profiles")
                .select("id, username, display_name, avatar_url")
                .in_("id", user_ids)
                .execute()
            )
            for prof in to_records(prof_resp.data):
                if "id" in prof:
                    prof["avatar_url"] = normalize_avatar_url(prof.get("avatar_url"))
                    profiles_map[str(prof["id"])] = prof
        except Exception as e:
            print("Failed to fetch profiles for comments:", e)

    for comment in comment_list:
        uid = comment.get("user_id")
        prof = profiles_map.get(str(uid)) if uid else None
        if not isinstance(prof, dict):
            prof = {
                "id": uid,
                "username": "user",
                "display_name": "User",
                "avatar_url": None,
            }
        comment["profiles"] = prof
        comment["username"] = prof.get("display_name") or prof.get("username") or "ผู้ใช้งาน"
        comment["text"] = comment.get("content", "")

    return comment_list


@router.get("/feed")
def get_feed_posts(
    limit: int = 20,
    offset: int = 0,
    user: Optional[dict] = Depends(get_optional_current_user),
):
    """Fetch recent feed posts with user profiles and categories, filtering blocked users."""
    if not supabase:
        return []
    try:
        posts_resp = (
            supabase.table("posts")
            .select("*, post_categories(categories(id, name))")
            .or_("is_hidden.is.null,is_hidden.eq.false")
            .order("created_at", desc=True)
            .range(offset, offset + limit - 1)
            .execute()
        )
        posts = to_records(posts_resp.data)
        posts = [p for p in posts if not p.get("is_hidden")]

        # Filter out blocked users if user is authenticated
        if user and user.get("id"):
            blocked_ids = get_blocked_user_ids(user["id"])
            if blocked_ids:
                posts = [p for p in posts if str(p.get("user_id")) not in blocked_ids]

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
            .or_("is_hidden.is.null,is_hidden.eq.false")
            .order("created_at", desc=True)
            .execute()
        )
        posts = to_records(response.data)
        posts = [p for p in posts if not p.get("is_hidden")]
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
            if isinstance(item, dict)
            and isinstance(item.get("posts"), dict)
            and not item["posts"].get("is_hidden")
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
            .execute()
        )

        posts = to_records(response.data)

        if not posts or posts[0].get("is_hidden"):
            raise HTTPException(
                status_code=404,
                detail="Post not found",
            )

        return attach_profiles_to_posts([posts[0]])[0]

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e),
        )

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
        if not isinstance(new_post, dict):
            raise HTTPException(status_code=400, detail="Failed to create post")

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
            .execute()
        )

        if not getattr(owner_check, "data", None):
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
        # Check ownership first
        owner_check = (
            supabase.table("posts")
            .select("id")
            .eq("id", post_id)
            .eq("user_id", user["id"])
            .execute()
        )
        if not getattr(owner_check, "data", None):
            raise HTTPException(
                status_code=404, detail="Post not found or not owned by user"
            )

        # Delete dependent records manually in case ON DELETE CASCADE is missing
        supabase.table("post_categories").delete().eq("post_id", post_id).execute()
        supabase.table("saved_posts").delete().eq("post_id", post_id).execute()

        # Delete the post
        res = (
            supabase.table("posts")
            .delete()
            .eq("id", post_id)
            .eq("user_id", user["id"])
            .execute()
        )
        return {"success": True, "message": "Post deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Bookmark endpoints ──────────────────────────────────────────────────────

@router.post("/{post_id}/bookmark")
def save_post(
    post_id: int,
    user: dict = Depends(get_current_user),
):
    """Bookmark a post (auth required)."""
    if not supabase:
        raise HTTPException(
            status_code=500,
            detail="Database connection uninitialized",
        )

    try:
        # Check whether the post exists
        post_response = (
            supabase.table("posts")
            .select("id, user_id")
            .eq("id", post_id)
            .execute()
        )

        posts = to_records(post_response.data)
        if not posts:
            raise HTTPException(
                status_code=404,
                detail="Post not found",
            )

        post_data = posts[0]
        post_owner_id = str(post_data.get("user_id") or "")
        # Check block status
        if post_owner_id and is_blocked_between(str(user["id"]), post_owner_id):
            raise HTTPException(
                status_code=403,
                detail="ไม่สามารถบันทึกโพสต์นี้ได้เนื่องจากมีสถานะการบล็อกระหว่างผู้ใช้",
            )

        # Check whether already bookmarked
        existing = (
            supabase.table("saved_posts")
            .select("user_id, post_id")
            .eq("user_id", user["id"])
            .eq("post_id", post_id)
            .execute()
        )

        if existing and getattr(existing, "data", None):
            return {
                "success": True,
                "status": "saved",
                "post_id": post_id,
                "message": "Post already bookmarked",
            }

        # Create bookmark
        supabase.table("saved_posts").insert(
            {
                "user_id": user["id"],
                "post_id": post_id,
            }
        ).execute()

        return {
            "success": True,
            "status": "saved",
            "post_id": post_id,
        }

    except HTTPException:
        raise

    except Exception as e:
        import logging
        logging.error("Failed to bookmark post", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=str(e),
        )

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


# ── Comment endpoints ───────────────────────────────────────────────────────

@router.get("/{post_id}/comments")
def get_post_comments(
    post_id: int,
    user: Optional[dict] = Depends(get_optional_current_user),
):
    """Fetch comments for a post ordered by created_at ascending, filtering blocked users."""
    if not supabase:
        return {"success": True, "data": []}

    try:
        # Check whether post exists
        post_check = supabase.table("posts").select("id").eq("id", post_id).execute()
        if not getattr(post_check, "data", None):
            raise HTTPException(status_code=404, detail="Post not found")

        resp = (
            supabase.table("comments")
            .select("*")
            .eq("post_id", post_id)
            .or_("is_hidden.is.null,is_hidden.eq.false")
            .order("created_at", desc=False)
            .execute()
        )
        comments = to_records(resp.data)
        comments = [c for c in comments if not c.get("is_hidden")]

        # Filter out comments from blocked users
        if user and user.get("id"):
            blocked_ids = get_blocked_user_ids(user["id"])
            if blocked_ids:
                comments = [c for c in comments if str(c.get("user_id")) not in blocked_ids]

        return {"success": True, "data": attach_profiles_to_comments(comments)}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{post_id}/comments")
def create_comment(
    post_id: int,
    payload: CommentCreate,
    user: dict = Depends(get_current_user),
):
    """Add a new comment to a post (auth required, checks block status)."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Database connection uninitialized")

    content = payload.content.strip()
    if not content:
        raise HTTPException(status_code=400, detail="Comment content cannot be empty")

    try:
        # Check post existence and owner
        post_check = supabase.table("posts").select("id, user_id").eq("id", post_id).execute()
        posts = to_records(post_check.data)
        if not posts:
            raise HTTPException(status_code=404, detail="Post not found")

        post_data = posts[0]
        post_owner_id = str(post_data.get("user_id") or "")
        # Check block status between commenter and post owner
        if post_owner_id and is_blocked_between(str(user["id"]), post_owner_id):
            raise HTTPException(
                status_code=403,
                detail="ไม่สามารถแสดงความคิดเห็นได้เนื่องจากมีสถานะการบล็อกระหว่างผู้ใช้",
            )

        insert_data = {
            "post_id": post_id,
            "user_id": user["id"],
            "content": content,
        }
        res = supabase.table("comments").insert(insert_data).execute()
        res_records = to_records(res.data)
        if not res_records:
            raise HTTPException(status_code=400, detail="Failed to create comment")

        attached = attach_profiles_to_comments([res_records[0]])[0]
        return {"success": True, "data": attached}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/{post_id}/comments/{comment_id}")
def update_comment(
    post_id: int,
    comment_id: int,
    payload: CommentUpdate,
    user: dict = Depends(get_current_user),
):
    """Update a comment (auth required, author only)."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Database connection uninitialized")

    content = payload.content.strip()
    if not content:
        raise HTTPException(status_code=400, detail="Comment content cannot be empty")

    try:
        # Check comment ownership
        comment_check = (
            supabase.table("comments")
            .select("id, user_id, post_id")
            .eq("id", comment_id)
            .eq("post_id", post_id)
            .execute()
        )
        comments = to_records(comment_check.data)
        if not comments:
            raise HTTPException(status_code=404, detail="Comment not found")

        comment = comments[0]
        if str(comment.get("user_id")) != str(user["id"]):
            raise HTTPException(
                status_code=403,
                detail="Not authorized to edit this comment",
            )

        res = (
            supabase.table("comments")
            .update({"content": content})
            .eq("id", comment_id)
            .execute()
        )
        res_records = to_records(res.data)
        attached = attach_profiles_to_comments([res_records[0]])[0] if res_records else None
        return {
            "success": True,
            "message": "Comment updated successfully",
            "data": attached,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{post_id}/comments/{comment_id}")
def delete_comment(
    post_id: int,
    comment_id: int,
    user: dict = Depends(get_current_user),
):
    """Delete a comment (auth required, author only)."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Database connection uninitialized")

    try:
        # Check comment ownership
        comment_check = (
            supabase.table("comments")
            .select("id, user_id, post_id")
            .eq("id", comment_id)
            .eq("post_id", post_id)
            .execute()
        )
        comments = to_records(comment_check.data)
        if not comments:
            raise HTTPException(status_code=404, detail="Comment not found")

        comment = comments[0]
        if str(comment.get("user_id")) != str(user["id"]):
            raise HTTPException(
                status_code=403,
                detail="Not authorized to delete this comment",
            )

        supabase.table("comments").delete().eq("id", comment_id).execute()
        return {"success": True, "message": "Comment deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
