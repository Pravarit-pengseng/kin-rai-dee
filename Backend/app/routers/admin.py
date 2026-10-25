import re
from typing import Optional, List, Any, Dict
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from app.db import supabase
from app.core.config import SUPABASE_URL
from postgrest import CountMethod
from app.core.security import get_current_admin

router = APIRouter(
    prefix="/api/admin",
    tags=["Admin & Moderation"],
    dependencies=[Depends(get_current_admin)],
)


def normalize_avatar_url(url: Optional[str]) -> Optional[str]:
    if not url:
        return None
    if not SUPABASE_URL:
        return url
    marker = "/storage/v1/object/public/avatars/"
    if marker in url:
        idx = url.find(marker)
        path = url[idx:]
        return f"{SUPABASE_URL.rstrip('/')}{path}"
    return url


def to_records(data: Any) -> List[Dict[str, Any]]:
    """Type-safe helper to narrow Supabase JSON responses to a list of dicts."""
    if isinstance(data, list):
        return [item for item in data if isinstance(item, dict)]
    return []



# ── Pydantic Request Models ───────────────────────────────────────────────────

class AssignReportPayload(BaseModel):
    moderator_id: Optional[str] = None
    moderator_name: Optional[str] = None


class DecisionPayload(BaseModel):
    action_type: str = Field(..., pattern="^(keep|hide|remove|warn|restrict|escalate)$")
    reason_code: str
    internal_note: Optional[str] = None
    notify_user: Optional[bool] = False
    moderator_id: Optional[str] = "admin"
    moderator_name: Optional[str] = "ผู้ดูแลระบบ"


class VisibilityPayload(BaseModel):
    is_hidden: bool
    moderator_id: Optional[str] = "admin"
    moderator_name: Optional[str] = "ผู้ดูแลระบบ"


class UserStatusPayload(BaseModel):
    status: str = Field(..., pattern="^(active|suspended)$")
    reason: Optional[str] = None
    moderator_id: Optional[str] = "admin"
    moderator_name: Optional[str] = "ผู้ดูแลระบบ"


# ── Helper: Audit Logging ─────────────────────────────────────────────────────

def log_audit_event(
    actor_id: Optional[str],
    actor_name: Optional[str],
    event_type: str,
    target_type: str,
    target_id: Any,
    metadata: Optional[Dict[str, Any]] = None,
):
    if not supabase:
        return
    try:
        supabase.table("audit_logs").insert({
            "actor_id": actor_id if actor_id and len(str(actor_id)) > 10 else None,
            "actor_name": actor_name or "ผู้ดูแลระบบ",
            "event_type": event_type,
            "target_type": target_type,
            "target_id": str(target_id) if target_id is not None else "0",
            "metadata": metadata or {},
        }).execute()
    except Exception as e:
        print("Audit log insertion note:", e)


# ── 1. Stats Overview ─────────────────────────────────────────────────────────

@router.get("/stats")
def get_admin_stats():
    """Summary statistics for admin dashboard."""
    if not supabase:
        return {
            "total_reports": 0,
            "pending_reports": 0,
            "in_review": 0,
            "action_taken": 0,
            "dismissed": 0,
            "urgent_reports": 0,
            "total_users": 0,
            "total_posts": 0,
            "total_comments": 0,
        }

    try:
        # Reports
        reports_resp = supabase.table("reports").select("id, status, priority").execute()
        reports = to_records(reports_resp.data)
        total_reports = len(reports)
        pending_reports = sum(1 for r in reports if r.get("status") == "pending")
        in_review = sum(1 for r in reports if r.get("status") == "in_review")
        action_taken = sum(1 for r in reports if r.get("status") == "action_taken")
        dismissed = sum(1 for r in reports if r.get("status") == "dismissed")
        urgent_reports = sum(1 for r in reports if r.get("priority") in ["high", "urgent"] and r.get("status") == "pending")

        # Counts
        users_resp = supabase.table("profiles").select("id", count=CountMethod.exact).execute()
        total_users = users_resp.count or len(to_records(users_resp.data))

        posts_resp = supabase.table("posts").select("id", count=CountMethod.exact).execute()
        total_posts = posts_resp.count or len(to_records(posts_resp.data))

        comments_resp = supabase.table("comments").select("id", count=CountMethod.exact).execute()
        total_comments = comments_resp.count or len(to_records(comments_resp.data))

        return {
            "total_reports": total_reports,
            "pending_reports": pending_reports,
            "in_review": in_review,
            "action_taken": action_taken,
            "dismissed": dismissed,
            "urgent_reports": urgent_reports,
            "total_users": total_users,
            "total_posts": total_posts,
            "total_comments": total_comments,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── 2. Reports Queue ──────────────────────────────────────────────────────────

@router.get("/reports")
def get_reports_queue(
    status_filter: Optional[str] = Query("all", alias="status"),
    priority: Optional[str] = "all",
    target_type: Optional[str] = "all",
    search: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
):
    """Fetch reports queue with enriched target and reporter information."""
    if not supabase:
        return {"success": True, "data": [], "total": 0}

    try:
        query = supabase.table("reports").select("*")

        if status_filter and status_filter != "all":
            query = query.eq("status", status_filter)

        if priority and priority != "all":
            query = query.eq("priority", priority)

        if target_type and target_type != "all":
            query = query.eq("target_type", target_type)

        query = query.order("created_at", desc=True).range(offset, offset + limit - 1)
        resp = query.execute()
        reports = to_records(resp.data)

        # Enrich reporter and target details
        if reports:
            reporter_ids = list(set([r["reporter_id"] for r in reports if r.get("reporter_id")]))
            profiles_map = {}
            if reporter_ids:
                prof_resp = supabase.table("profiles").select("id, username, display_name, avatar_url").in_("id", reporter_ids).execute()
                prof_data = to_records(prof_resp.data)
                if prof_data:
                    for p in prof_data:
                        p["avatar_url"] = normalize_avatar_url(p.get("avatar_url"))
                    profiles_map = {p["id"]: p for p in prof_data}

            # Enrich target contents
            post_ids = [int(r["target_id"]) for r in reports if r.get("target_type") == "post" and str(r.get("target_id")).isdigit()]
            comment_ids = [int(r["target_id"]) for r in reports if r.get("target_type") == "comment" and str(r.get("target_id")).isdigit()]

            posts_map = {}
            if post_ids:
                p_resp = supabase.table("posts").select("id, food_name, description, image_url, user_id, is_hidden").in_("id", post_ids).execute()
                p_data = to_records(p_resp.data)
                if p_data:
                    posts_map = {p["id"]: p for p in p_data}

            comments_map = {}
            if comment_ids:
                c_resp = supabase.table("comments").select("id, content, post_id, user_id, is_hidden").in_("id", comment_ids).execute()
                c_data = to_records(c_resp.data)
                if c_data:
                    comments_map = {c["id"]: c for c in c_data}

            for r in reports:
                # Reporter
                rep_id = r.get("reporter_id")
                r["reporter"] = profiles_map.get(rep_id, {"username": "anonymous", "display_name": "ผู้ใช้ทั่วไป"})

                # Target Content
                t_type = r.get("target_type")
                t_id = r.get("target_id")
                if t_id is not None and str(t_id).isdigit():
                    t_id_int = int(t_id)
                    if t_type == "post":
                        r["target_content"] = posts_map.get(t_id_int)
                    elif t_type == "comment":
                        r["target_content"] = comments_map.get(t_id_int)

        return {"success": True, "data": reports, "total": len(reports)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/reports/{report_id}/assign")
def assign_report(report_id: int, payload: AssignReportPayload):
    """Assign report to a moderator."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Database uninitialized")

    try:
        mod_id = payload.moderator_id
        update_data = {
            "assigned_to": mod_id if mod_id and len(mod_id) > 10 else None,
            "status": "in_review",
        }
        res = supabase.table("reports").update(update_data).eq("id", report_id).execute()

        log_audit_event(
            actor_id=payload.moderator_id,
            actor_name=payload.moderator_name,
            event_type="ASSIGN_REPORT",
            target_type="report",
            target_id=report_id,
            metadata={"assigned_to": payload.moderator_name or payload.moderator_id},
        )

        return {"success": True, "message": "มอบหมายงานเรียบร้อยแล้ว"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/reports/{report_id}/decision")
def apply_report_decision(report_id: int, payload: DecisionPayload):
    """Apply moderation decision on a report."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Database uninitialized")

    try:
        # Fetch report details
        rep_resp = supabase.table("reports").select("*").eq("id", report_id).execute()
        rep_data = to_records(rep_resp.data)
        if not rep_data:
            raise HTTPException(status_code=404, detail="ไม่พบรายงานที่ระบุ")

        report = rep_data[0]
        target_type = report["target_type"]
        target_id = report["target_id"]

        action = payload.action_type

        # 1. Execute moderation action
        if action == "hide":
            if target_type == "post" and str(target_id).isdigit():
                supabase.table("posts").update({"is_hidden": True}).eq("id", int(target_id)).execute()
            elif target_type == "comment" and str(target_id).isdigit():
                supabase.table("comments").update({"is_hidden": True}).eq("id", int(target_id)).execute()

        elif action == "remove":
            if target_type == "post" and str(target_id).isdigit():
                pid = int(target_id)
                supabase.table("post_categories").delete().eq("post_id", pid).execute()
                supabase.table("saved_posts").delete().eq("post_id", pid).execute()
                supabase.table("comments").delete().eq("post_id", pid).execute()
                supabase.table("posts").delete().eq("id", pid).execute()
            elif target_type == "comment" and str(target_id).isdigit():
                supabase.table("comments").delete().eq("id", int(target_id)).execute()

        elif action == "restrict":
            # Suspend user
            user_target_id = target_id
            if target_type == "post" and str(target_id).isdigit():
                post_data = supabase.table("posts").select("user_id").eq("id", int(target_id)).execute()
                post_records = to_records(post_data.data)
                if post_records:
                    user_target_id = post_records[0]["user_id"]
                    supabase.table("posts").update({"is_hidden": True}).eq("id", int(target_id)).execute()

            if user_target_id:
                supabase.table("profiles").update({"is_suspended": True}).eq("id", user_target_id).execute()

        # 2. Update report status
        new_status = "dismissed" if action == "keep" else "action_taken"
        import datetime
        supabase.table("reports").update({
            "status": new_status,
            "resolved_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        }).eq("id", report_id).execute()

        # 3. Log to moderation_actions and audit_logs
        try:
            supabase.table("moderation_actions").insert({
                "target_type": target_type,
                "target_id": str(target_id) if target_id is not None else "0",
                "action_type": action,
                "reason_code": payload.reason_code,
                "internal_note": payload.internal_note or f"คำตัดสิน {action}",
            }).execute()
        except Exception as mod_err:
            print("moderation_actions record note:", mod_err)

        log_audit_event(
            actor_id=payload.moderator_id,
            actor_name=payload.moderator_name,
            event_type=f"MODERATION_{action.upper()}",
            target_type=target_type,
            target_id=target_id,
            metadata={"report_id": report_id, "action": action, "note": payload.internal_note},
        )

        return {"success": True, "message": f"ดำเนินการเรียบร้อยแล้ว ({action})"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── 3. Posts Management ───────────────────────────────────────────────────────

@router.get("/posts")
def get_admin_posts(
    search: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
):
    """Fetch posts with profile and category info for admin management."""
    if not supabase:
        return {"success": True, "data": []}

    try:
        query = supabase.table("posts").select("*, post_categories(categories(id, name))")
        if search and search.strip():
            safe_term = re.sub(r'[,()"]', '', search).strip()
            query = query.or_(f"food_name.ilike.%{safe_term}%,description.ilike.%{safe_term}%")

        resp = query.order("created_at", desc=True).range(offset, offset + limit - 1).execute()
        posts = to_records(resp.data)

        # Enrich author profiles
        if posts:
            user_ids = list(set([p["user_id"] for p in posts if p.get("user_id")]))
            if user_ids:
                prof_resp = supabase.table("profiles").select("id, username, display_name, avatar_url").in_("id", user_ids).execute()
                prof_map = {p["id"]: p for p in to_records(prof_resp.data)}
                for p in posts:
                    uid = p.get("user_id")
                    p["profiles"] = prof_map.get(uid, {"username": "user", "display_name": "ผู้ใช้งาน"})

        return {"success": True, "data": posts}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/posts/{post_id}/visibility")
def toggle_post_visibility(post_id: int, payload: VisibilityPayload):
    """Toggle post visibility (hide or unhide)."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Database uninitialized")

    try:
        supabase.table("posts").update({"is_hidden": payload.is_hidden}).eq("id", post_id).execute()

        log_audit_event(
            actor_id=payload.moderator_id,
            actor_name=payload.moderator_name,
            event_type="HIDE_POST" if payload.is_hidden else "UNHIDE_POST",
            target_type="post",
            target_id=post_id,
            metadata={"is_hidden": payload.is_hidden},
        )

        action_text = "ซ่อนโพสต์เรียบร้อยแล้ว" if payload.is_hidden else "แสดงโพสต์กลับตามปกติแล้ว"
        return {"success": True, "message": action_text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/posts/{post_id}")
def delete_post_as_admin(
    post_id: int,
    moderator_id: Optional[str] = "admin",
    moderator_name: Optional[str] = "ผู้ดูแลระบบ",
):
    """Permanently delete post and all associated records."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Database uninitialized")

    try:
        supabase.table("post_categories").delete().eq("post_id", post_id).execute()
        supabase.table("saved_posts").delete().eq("post_id", post_id).execute()
        supabase.table("comments").delete().eq("post_id", post_id).execute()
        supabase.table("posts").delete().eq("id", post_id).execute()

        log_audit_event(
            actor_id=moderator_id,
            actor_name=moderator_name,
            event_type="DELETE_POST",
            target_type="post",
            target_id=post_id,
        )

        return {"success": True, "message": "ลบโพสต์เรียบร้อยแล้ว"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── 4. Comments Management ────────────────────────────────────────────────────

@router.get("/comments")
def get_admin_comments(
    post_id: Optional[int] = None,
    search: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
):
    """Fetch comments for admin review with post and author enrichment."""
    if not supabase:
        return {"success": True, "data": []}

    try:
        query = supabase.table("comments").select("*")
        if post_id:
            query = query.eq("post_id", post_id)
        if status == "hidden":
            query = query.eq("is_hidden", True)
        elif status == "published":
            query = query.eq("is_hidden", False)

        resp = query.order("created_at", desc=True).range(offset, offset + limit - 1).execute()
        comments = to_records(resp.data)

        # Enrich profiles and post details
        if comments:
            user_ids = list(set([c["user_id"] for c in comments if c.get("user_id")]))
            if user_ids:
                try:
                    prof_resp = supabase.table("profiles").select("id, username, display_name, avatar_url").in_("id", user_ids).execute()
                    prof_map = {p["id"]: p for p in to_records(prof_resp.data)}
                    for c in comments:
                        uid = c.get("user_id")
                        c["profiles"] = prof_map.get(uid, {"username": "user", "display_name": "ผู้ใช้งาน"})
                except Exception as p_err:
                    print("Error enriching profiles:", p_err)

            post_ids = list(set([c["post_id"] for c in comments if c.get("post_id")]))
            if post_ids:
                try:
                    post_resp = supabase.table("posts").select("id, food_name, image_url").in_("id", post_ids).execute()
                    post_map = {p["id"]: p for p in to_records(post_resp.data)}
                    for c in comments:
                        pid = c.get("post_id")
                        c["post"] = post_map.get(pid, {"id": pid, "food_name": f"โพสต์ #{pid}"})
                except Exception as post_err:
                    print("Error enriching posts:", post_err)

        if search:
            q = search.strip().lower()
            comments = [
                c for c in comments
                if q in str(c.get("id", "")).lower()
                or q in str(c.get("content", "")).lower()
                or q in str(c.get("post_id", "")).lower()
                or q in str(c.get("post", {}).get("food_name", "")).lower()
                or q in str(c.get("profiles", {}).get("username", "")).lower()
                or q in str(c.get("profiles", {}).get("display_name", "")).lower()
            ]

        return {"success": True, "data": comments}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/comments/{comment_id}/visibility")
def toggle_comment_visibility(comment_id: int, payload: VisibilityPayload):
    """Toggle comment visibility."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Database uninitialized")

    try:
        supabase.table("comments").update({"is_hidden": payload.is_hidden}).eq("id", comment_id).execute()

        log_audit_event(
            actor_id=payload.moderator_id,
            actor_name=payload.moderator_name,
            event_type="HIDE_COMMENT" if payload.is_hidden else "UNHIDE_COMMENT",
            target_type="comment",
            target_id=comment_id,
            metadata={"is_hidden": payload.is_hidden},
        )

        action_text = "ซ่อนความคิดเห็นเรียบร้อยแล้ว" if payload.is_hidden else "แสดงความคิดเห็นกลับตามปกติแล้ว"
        return {"success": True, "message": action_text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/comments/{comment_id}")
def delete_comment_as_admin(
    comment_id: int,
    moderator_id: Optional[str] = "admin",
    moderator_name: Optional[str] = "ผู้ดูแลระบบ",
):
    """Permanently delete a comment."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Database uninitialized")

    try:
        supabase.table("comments").delete().eq("id", comment_id).execute()

        log_audit_event(
            actor_id=moderator_id,
            actor_name=moderator_name,
            event_type="DELETE_COMMENT",
            target_type="comment",
            target_id=comment_id,
        )

        return {"success": True, "message": "ลบความคิดเห็นเรียบร้อยแล้ว"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── 5. Users Management ───────────────────────────────────────────────────────

@router.get("/users")
def get_admin_users(
    search: Optional[str] = None,
    status_filter: Optional[str] = Query("all", alias="status"),
    limit: int = 50,
    offset: int = 0,
):
    """Fetch users list for admin dashboard."""
    if not supabase:
        return {"success": True, "data": []}

    try:
        query = supabase.table("profiles").select("*")

        if status_filter == "suspended":
            query = query.eq("is_suspended", True)
        elif status_filter == "active":
            query = query.eq("is_suspended", False)

        if search and search.strip():
            safe_term = re.sub(r'[,()"]', '', search).strip()
            query = query.or_(f"username.ilike.%{safe_term}%,display_name.ilike.%{safe_term}%")

        resp = query.order("created_at", desc=True).range(offset, offset + limit - 1).execute()
        users = to_records(resp.data)

        for u in users:
            u["avatar_url"] = normalize_avatar_url(u.get("avatar_url"))
            u["_suspended"] = u.get("is_suspended", False)

        return {"success": True, "data": users}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/users/{user_id}/status")
def toggle_user_status(user_id: str, payload: UserStatusPayload):
    """Suspend or activate user account."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Database uninitialized")

    try:
        is_suspended = payload.status == "suspended"
        supabase.table("profiles").update({"is_suspended": is_suspended}).eq("id", user_id).execute()

        # Enrich metadata with human-readable user details
        u_name = "ผู้ใช้"
        u_handle = ""
        try:
            p_res = supabase.table("profiles").select("username, display_name").eq("id", user_id).limit(1).execute()
            p_records = to_records(p_res.data)
            if p_records:
                u_handle = p_records[0].get("username") or ""
                u_name = p_records[0].get("display_name") or u_handle or "ผู้ใช้"
        except Exception:
            pass

        log_audit_event(
            actor_id=payload.moderator_id,
            actor_name=payload.moderator_name,
            event_type="SUSPEND_USER" if is_suspended else "ACTIVATE_USER",
            target_type="user",
            target_id=user_id,
            metadata={
                "status": payload.status,
                "reason": payload.reason,
                "user_id": user_id,
                "username": u_handle,
                "display_name": u_name,
                "user_name": u_name,
            },
        )

        msg = "ระงับบัญชีผู้ใช้เรียบร้อยแล้ว" if is_suspended else "ปลดการระงับบัญชีเรียบร้อยแล้ว"
        return {"success": True, "message": msg}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── 6. Audit Logs ─────────────────────────────────────────────────────────────

@router.get("/audit-logs")
def get_audit_logs(limit: int = 100, offset: int = 0):
    """Fetch recent admin audit logs with target enrichment."""
    if not supabase:
        return {"success": True, "data": []}

    try:
        resp = supabase.table("audit_logs").select("*").order("created_at", desc=True).range(offset, offset + limit - 1).execute()
        logs = to_records(resp.data)

        # Enrich user targets
        user_ids = list(set([
            str(l.get("target_id"))
            for l in logs
            if l.get("target_type") == "user" and l.get("target_id") and str(l.get("target_id")) != "0"
        ]))
        user_map = {}
        if user_ids:
            try:
                p_resp = supabase.table("profiles").select("id, username, display_name").in_("id", user_ids).execute()
                for p in to_records(p_resp.data):
                    user_map[str(p.get("id"))] = p
            except Exception as pe:
                print("Enrich audit user error:", pe)

        # Convert to admin dashboard friendly structure
        formatted_logs = []
        for l in logs:
            t_id = str(l.get("target_id") or "")
            t_type = l.get("target_type")
            meta = l.get("metadata") or {}

            # Fallback if t_id was "0" but user_id was stored in metadata
            if t_type == "user" and (t_id == "0" or not t_id) and meta.get("user_id"):
                t_id = str(meta.get("user_id"))

            target_display = None
            if t_type == "user":
                u_info = user_map.get(t_id, {})
                display_name = u_info.get("display_name") or meta.get("display_name") or meta.get("user_name")
                username = u_info.get("username") or meta.get("username")
                if username and display_name:
                    target_display = f"{display_name} (@{username})"
                elif username:
                    target_display = f"@{username}"
                elif display_name:
                    target_display = str(display_name)

            formatted_logs.append({
                "id": str(l.get("id")),
                "timestamp": l.get("created_at"),
                "actorId": str(l.get("actor_id") or "admin"),
                "actorName": l.get("actor_name") or "ผู้ดูแลระบบ",
                "actionType": l.get("event_type"),
                "targetType": t_type,
                "targetId": t_id,
                "targetName": target_display,
                "reasonCode": meta.get("action") or meta.get("reason") or "MODERATION",
                "note": meta.get("note") or f"{l.get('event_type')} on {t_type}",
                "metadata": meta,
            })

        return {"success": True, "data": formatted_logs}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
