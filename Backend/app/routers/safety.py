from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from app.db import supabase
from app.core.security import get_current_user
from app.services.safety_service import (
    get_blocked_users_list,
    is_blocked_between,
)

router = APIRouter(tags=["Safety, Moderation & Privacy"])


class ReportCreate(BaseModel):
    target_type: str = Field(..., pattern="^(post|comment|image|user)$")
    target_id: str = Field(..., min_length=1)
    reason_code: str = Field(..., min_length=1)
    explanation: Optional[str] = Field(None, max_length=1000)


@router.get("/api/reports/reasons")
def get_report_reasons():
    """Fetch active community rules / report reasons."""
    default_reasons = [
        {"code": "INAPPROPRIATE", "name": "เนื้อหาไม่เหมาะสมหรือไม่เกี่ยวข้องกับอาหาร", "description": "รูปภาพลามกอนาจาร รูปภาพที่ไม่เกี่ยวกับอาหาร หรือคำหยาบคาย"},
        {"code": "HARASSMENT", "name": "การคุกคามหรือกลั่นแกล้ง", "description": "การใช้ถ้อยคำดูถูก ข่มขู่ หรือล้อเลียนผู้อื่นให้เสียหาย"},
        {"code": "SPAM", "name": "สแปมหรือโฆษณาไม่พึงประสงค์", "description": "เนื้อหาซ้ำซ้อน ขายของผิดที่ โฆษณาเว็บพนันหรือสแปมลิงก์"},
        {"code": "COPYRIGHT", "name": "การละเมิดลิขสิทธิ์", "description": "คัดลอกรูปภาพหรือเนื้อหาที่มีลิขสิทธิ์โดยไม่ได้รับอนุญาต"},
        {"code": "PRIVACY", "name": "ละเมิดความเป็นส่วนตัว", "description": "การเปิดเผยข้อมูลส่วนบุคคล เบอร์โทรศัพท์ หรือภาพผู้อื่นโดยไม่ได้รับอนุญาต"},
        {"code": "HARMFUL", "name": "เนื้อหาที่เป็นอันตรายหรือผิดกฎหมาย", "description": "ข้อมูลสุขภาพที่บิดเบือน อาหารปลอมปน สิ่งผิดกฎหมาย"},
        {"code": "OTHER", "name": "อื่นๆ", "description": "พฤติกรรมที่ไม่เหมาะสมอื่นๆ ที่ขัดต่อแนวทางปฏิบัติของชุมชน"},
    ]
    if not supabase:
        return {"success": True, "data": default_reasons}

    try:
        res = (
            supabase.table("community_rules")
            .select("code, name, description")
            .eq("is_active", True)
            .order("id", desc=False)
            .execute()
        )
        if res.data and len(res.data) > 0:
            return {"success": True, "data": res.data}
    except Exception as e:
        print("Failed to fetch community rules from DB:", e)

    return {"success": True, "data": default_reasons}


@router.post("/api/reports")
def create_report(
    payload: ReportCreate,
    user: dict = Depends(get_current_user),
):
    """Submit a report for post, comment, or user."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Database uninitialized")

    reporter_id = user["id"]

    # Prevent reporting oneself if target is user
    if payload.target_type == "user" and str(payload.target_id) == str(reporter_id):
        raise HTTPException(status_code=400, detail="ไม่สามารถรายงานบัญชีตนเองได้")

    try:
        # Check duplicate pending report from same user on same target
        dup_check = (
            supabase.table("reports")
            .select("id")
            .eq("reporter_id", reporter_id)
            .eq("target_type", payload.target_type)
            .eq("target_id", str(payload.target_id))
            .in_("status", ["pending", "in_review"])
            .execute()
        )
        if dup_check.data and len(dup_check.data) > 0:
            return {
                "success": True,
                "message": "คุณได้ส่งรายงานสำหรับรายการนี้แล้ว ทีมงานกำลังดำเนินการตรวจสอบ",
                "already_reported": True,
            }

        report_data = {
            "reporter_id": reporter_id,
            "target_type": payload.target_type,
            "target_id": str(payload.target_id),
            "reason_code": payload.reason_code,
            "explanation": payload.explanation or "",
            "priority": "medium",
            "status": "pending",
        }

        res = supabase.table("reports").insert(report_data).execute()
        return {
            "success": True,
            "message": "ส่งรายงานเรียบร้อยแล้ว ขอบคุณที่ช่วยดูแลชุมชน Kin-Rai-Dee",
            "data": res.data[0] if res.data else None,
        }
    except Exception as e:
        print(f"Error creating report: {e}")
        # Even if DB error happens, acknowledge gracefully
        raise HTTPException(status_code=500, detail=f"Failed to submit report: {str(e)}")


# ── Block User Endpoints ──────────────────────────────────────────────────────

@router.get("/api/blocks")
def get_my_blocked_users(user: dict = Depends(get_current_user)):
    """Get list of users blocked by current user."""
    blocked_list = get_blocked_users_list(user["id"])
    return {"success": True, "data": blocked_list}


@router.get("/api/blocks/status/{target_user_id}")
def check_block_status(
    target_user_id: str,
    user: dict = Depends(get_current_user),
):
    """Check if current user has blocked target_user_id or vice versa."""
    if not supabase:
        return {"is_blocked": False, "blocked_by_me": False}

    my_id = user["id"]
    try:
        # Did I block target?
        my_block = (
            supabase.table("blocked_users")
            .select("id")
            .eq("blocker_id", my_id)
            .eq("blocked_id", target_user_id)
            .execute()
        )
        blocked_by_me = bool(my_block.data)

        # Did target block me?
        their_block = (
            supabase.table("blocked_users")
            .select("id")
            .eq("blocker_id", target_user_id)
            .eq("blocked_id", my_id)
            .execute()
        )
        blocked_by_them = bool(their_block.data)

        return {
            "is_blocked": blocked_by_me or blocked_by_them,
            "blocked_by_me": blocked_by_me,
            "blocked_by_them": blocked_by_them,
        }
    except Exception as e:
        print("Block status check error:", e)
        return {"is_blocked": False, "blocked_by_me": False}


@router.post("/api/blocks/{target_user_id}")
def block_user(
    target_user_id: str,
    user: dict = Depends(get_current_user),
):
    """Block a user."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Database uninitialized")

    my_id = user["id"]
    if str(target_user_id) == str(my_id):
        raise HTTPException(status_code=400, detail="ไม่สามารถบล็อกบัญชีของตนเองได้")

    try:
        # Check existing
        existing = (
            supabase.table("blocked_users")
            .select("id")
            .eq("blocker_id", my_id)
            .eq("blocked_id", target_user_id)
            .execute()
        )
        if existing.data:
            return {"success": True, "message": "บล็อกผู้ใช้นี้เรียบร้อยแล้ว"}

        supabase.table("blocked_users").insert(
            {"blocker_id": my_id, "blocked_id": target_user_id}
        ).execute()

        return {"success": True, "message": "บล็อกผู้ใช้เรียบร้อยแล้ว"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/api/blocks/{target_user_id}")
def unblock_user(
    target_user_id: str,
    user: dict = Depends(get_current_user),
):
    """Unblock a user."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Database uninitialized")

    my_id = user["id"]
    try:
        supabase.table("blocked_users").delete().eq("blocker_id", my_id).eq(
            "blocked_id", target_user_id
        ).execute()

        return {"success": True, "message": "ปลดบล็อกผู้ใช้เรียบร้อยแล้ว"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Delete Account Endpoint ───────────────────────────────────────────────────

@router.delete("/api/auth/account")
def delete_user_account(user: dict = Depends(get_current_user)):
    """
    Permanently delete the authenticated user's account and all associated data.
    Complies with Apple & Google App Store Account Deletion guidelines.
    """
    if not supabase:
        raise HTTPException(status_code=500, detail="Database uninitialized")

    user_id = user["id"]

    try:
        # 1. Delete comments made by user
        supabase.table("comments").delete().eq("user_id", user_id).execute()

        # 2. Delete user's bookmarks
        supabase.table("saved_posts").delete().eq("user_id", user_id).execute()

        # 3. Delete user's search history
        supabase.table("search_history").delete().eq("user_id", user_id).execute()

        # 4. Delete user's blocks relationships
        supabase.table("blocked_users").delete().or_(
            f"blocker_id.eq.{user_id},blocked_id.eq.{user_id}"
        ).execute()

        # 5. Delete posts created by user (and their post_categories)
        user_posts = supabase.table("posts").select("id").eq("user_id", user_id).execute()
        if user_posts.data:
            post_ids = [p["id"] for p in user_posts.data if isinstance(p, dict) and "id" in p]
            for pid in post_ids:
                supabase.table("post_categories").delete().eq("post_id", pid).execute()
                supabase.table("saved_posts").delete().eq("post_id", pid).execute()
                supabase.table("comments").delete().eq("post_id", pid).execute()
            supabase.table("posts").delete().eq("user_id", user_id).execute()

        # 6. Delete profile
        supabase.table("profiles").delete().eq("id", user_id).execute()

        # 7. Attempt delete from auth.users via admin if service role is available
        try:
            if hasattr(supabase.auth, "admin") and hasattr(supabase.auth.admin, "delete_user"):
                supabase.auth.admin.delete_user(user_id)
        except Exception as e:
            print(f"Auth admin delete user note: {e}")

        return {
            "success": True,
            "message": "บัญชีผู้ใช้และข้อมูลทั้งหมดถูกลบเรียบร้อยแล้วอย่างถาวร",
        }
    except Exception as e:
        print(f"Failed to delete account {user_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete account: {str(e)}")
