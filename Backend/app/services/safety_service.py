from typing import Set, List, Dict, Any, Optional
from app.db import supabase
from app.core.config import SUPABASE_URL


def normalize_avatar_url(url: Any) -> Optional[str]:
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


def get_blocked_user_ids(user_id: str) -> Set[str]:
    """
    Returns a set of user IDs that are either:
    1. Blocked by this user (blocker_id == user_id)
    2. Has blocked this user (blocked_id == user_id)
    """
    if not supabase or not user_id:
        return set()

    blocked_ids: Set[str] = set()

    try:
        # Users I blocked
        res1 = (
            supabase.table("blocked_users")
            .select("blocked_id")
            .eq("blocker_id", user_id)
            .execute()
        )
        if res1.data:
            for row in res1.data:
                if isinstance(row, dict) and "blocked_id" in row:
                    blocked_ids.add(str(row["blocked_id"]))

        # Users who blocked me
        res2 = (
            supabase.table("blocked_users")
            .select("blocker_id")
            .eq("blocked_id", user_id)
            .execute()
        )
        if res2.data:
            for row in res2.data:
                if isinstance(row, dict) and "blocker_id" in row:
                    blocked_ids.add(str(row["blocker_id"]))
    except Exception as e:
        print(f"Error fetching blocked user ids for {user_id}: {e}")

    return blocked_ids


def is_blocked_between(user_a: str, user_b: str) -> bool:
    """Check if either user has blocked the other."""
    if not supabase or not user_a or not user_b:
        return False
    if str(user_a) == str(user_b):
        return False

    try:
        res = (
            supabase.table("blocked_users")
            .select("id")
            .or_(
                f"and(blocker_id.eq.{user_a},blocked_id.eq.{user_b}),and(blocker_id.eq.{user_b},blocked_id.eq.{user_a})"
            )
            .limit(1)
            .execute()
        )
        return bool(res.data)
    except Exception as e:
        print(f"Error checking block status between {user_a} and {user_b}: {e}")
        return False


def get_blocked_users_list(blocker_id: str) -> List[Dict[str, Any]]:
    """Get full profile details of users blocked by blocker_id."""
    if not supabase or not blocker_id:
        return []

    try:
        res = (
            supabase.table("blocked_users")
            .select("id, blocked_id, created_at")
            .eq("blocker_id", blocker_id)
            .order("created_at", desc=True)
            .execute()
        )
        blocks = res.data or []
        if not blocks:
            return []

        blocked_ids = [
            b["blocked_id"]
            for b in blocks
            if isinstance(b, dict) and "blocked_id" in b
        ]
        prof_res = (
            supabase.table("profiles")
            .select("id, username, display_name, avatar_url, bio")
            .in_("id", blocked_ids)
            .execute()
        )
        prof_map: Dict[str, Any] = {}
        if prof_res.data:
            for p in prof_res.data:
                if isinstance(p, dict) and "id" in p:
                    p["avatar_url"] = normalize_avatar_url(p.get("avatar_url"))
                    prof_map[str(p["id"])] = p

        result: List[Dict[str, Any]] = []
        for b in blocks:
            if not isinstance(b, dict):
                continue
            bid = b.get("blocked_id")
            if not bid:
                continue
            prof = prof_map.get(
                str(bid),
                {
                    "id": bid,
                    "username": "user",
                    "display_name": "ผู้ใช้",
                    "avatar_url": None,
                },
            )
            result.append(
                {
                    "id": b.get("id"),
                    "blocked_user_id": bid,
                    "blocked_at": b.get("created_at"),
                    "profile": prof,
                }
            )
        return result
    except Exception as e:
        print(f"Error getting blocked users list for {blocker_id}: {e}")
        return []
