import os
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse, HTMLResponse

router = APIRouter(tags=["Public Legal Pages"])

BASE_DIR = os.path.dirname(os.path.dirname(__file__))
TEMPLATES_DIR = os.path.join(BASE_DIR, "templates")
STATIC_DIST_DIR = os.path.join(BASE_DIR, "static")
FRONTEND_DIST_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", "..", "frontend", "dist"))
WEB_DIST_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", "..", "web"))


def _resolve_page(filename: str) -> str:
    """Resolve file from templates, static, web, or frontend dist."""
    search_paths = [
        os.path.join(TEMPLATES_DIR, filename),
        os.path.join(STATIC_DIST_DIR, filename),
        os.path.join(WEB_DIST_DIR, filename),
        os.path.join(FRONTEND_DIST_DIR, filename),
    ]
    for path in search_paths:
        if os.path.exists(path):
            return path
    raise HTTPException(status_code=404, detail=f"Page {filename} not found")


# Privacy Policy Routes
@router.get("/privacy", response_class=HTMLResponse)
@router.get("/privacy-policy", response_class=HTMLResponse)
def get_privacy_policy_page():
    """Public read-only Privacy Policy page (accessible via /privacy and /privacy-policy)."""
    return FileResponse(_resolve_page("privacy-policy.html"))


# Terms of Use Routes
@router.get("/terms", response_class=HTMLResponse)
@router.get("/terms-of-use", response_class=HTMLResponse)
@router.get("/terms-of-service", response_class=HTMLResponse)
def get_terms_of_use_page():
    """Public read-only Terms of Use page."""
    return FileResponse(_resolve_page("terms-of-use.html"))


# Account Deletion Routes (Google Play Requirement)
@router.get("/delete-account", response_class=HTMLResponse)
@router.get("/account-deletion", response_class=HTMLResponse)
@router.get("/support/delete-account", response_class=HTMLResponse)
@router.get("/support/account-deletion", response_class=HTMLResponse)
def get_account_deletion_page():
    """Public web page for user account & data deletion requests."""
    return FileResponse(_resolve_page("delete-account.html"))


from typing import Optional, Any, Dict, List
from pydantic import BaseModel, EmailStr
from app.db import supabase


def _to_records(data: Any) -> List[Dict[str, Any]]:
    """Helper to safely narrow Supabase JSON response to list of dicts."""
    if isinstance(data, list):
        return [item for item in data if isinstance(item, dict)]
    return []

class DeletionRequestPayload(BaseModel):
    email: EmailStr
    reason: Optional[str] = None


@router.post("/api/legal/delete-account-request")
@router.post("/api/delete-account-request")
def submit_account_deletion_request(payload: DeletionRequestPayload):
    """Public API for users to submit account & data deletion requests."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Database uninitialized")

    clean_email = payload.email.strip().lower()

    # Look up user ID if exists in auth
    user_id = None
    try:
        users = supabase.auth.admin.list_users()
        for u in users:
            if u.email and u.email.strip().lower() == clean_email:
                user_id = str(u.id)
                break
    except Exception as e:
        print("User lookup note:", e)

    # Check for existing pending request
    try:
        existing = (
            supabase.table("account_deletion_requests")
            .select("id, status")
            .eq("email", clean_email)
            .eq("status", "pending")
            .limit(1)
            .execute()
        )
        existing_records = _to_records(existing.data)
        if existing_records:
            return {
                "success": True,
                "message": "ระบบได้รับคำขอลบบัญชีของท่านไว้เรียบร้อยแล้ว และอยู่ระหว่างรอแอดมินดำเนินการ",
                "request_id": existing_records[0].get("id"),
            }

        insert_res = (
            supabase.table("account_deletion_requests")
            .insert({
                "email": clean_email,
                "user_id": user_id,
                "reason": payload.reason or "",
                "status": "pending",
            })
            .execute()
        )

        insert_records = _to_records(insert_res.data)
        req_id = insert_records[0].get("id") if insert_records else None
        return {
            "success": True,
            "message": "ส่งคำขอลบบัญชีผู้ใช้เรียบร้อยแล้ว แอดมินจะดำเนินการตรวจสอบและลบบัญชีให้ท่านโดยเร็ว",
            "request_id": req_id,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

