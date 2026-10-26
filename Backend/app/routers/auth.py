from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, EmailStr
from supabase import create_client
from slowapi import Limiter
from slowapi.util import get_remote_address
import logging

from app.core.config import SUPABASE_URL
from app.core.config import SUPABASE_PUBLISHABLE_KEY

router = APIRouter(prefix="/auth", tags=["Authentication"])
limiter = Limiter(key_func=get_remote_address)

supabase_auth = create_client(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
)


class LoginRequest(BaseModel):
    email: str
    password: str


@router.post("/login")
@limiter.limit("5/minute")  # H-1: Brute force protection
def login(request: Request, data: LoginRequest):
    try:
        response = supabase_auth.auth.sign_in_with_password({
            "email": data.email,
            "password": data.password,
        })
    except Exception:
        # H-2: Don't expose auth system details to caller
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password",
        )

    if not response.session or not response.user:
        raise HTTPException(
            status_code=401,
            detail="Login failed",
        )

    # Check is_suspended in profiles
    try:
        from app.db.supabase import supabase
        if supabase:
            prof_res = supabase.table("profiles").select("is_suspended").eq("id", response.user.id).execute()
            if prof_res.data and isinstance(prof_res.data, list) and len(prof_res.data) > 0:
                profile_record = prof_res.data[0]
                if isinstance(profile_record, dict) and profile_record.get("is_suspended"):
                    try:
                        supabase_auth.auth.sign_out()
                    except Exception:
                        pass
                    raise HTTPException(
                        status_code=403,
                        detail="บัญชีของคุณถูกระงับการใช้งาน หากคิดว่าเป็นข้อผิดพลาด สามารถติดต่อฝ่ายสนับสนุนได้ที่ phatsachon25488@gmail.com",
                    )

            # Defense-in-depth: Prevent admin accounts from logging in via public client /auth/login
            # Returns generic 401 to prevent User/Role Enumeration (OWASP)
            import os
            allow_admin_test = os.getenv("ALLOW_ADMIN_TEST_LOGIN", "").lower() in ("1", "true")
            if not allow_admin_test:
                admin_res = supabase.table("admins").select("id, is_active").eq("user_id", response.user.id).eq("is_active", True).execute()
                if admin_res.data and isinstance(admin_res.data, list) and len(admin_res.data) > 0:
                    try:
                        supabase_auth.auth.sign_out()
                    except Exception:
                        pass
                    raise HTTPException(
                        status_code=401,
                        detail="Invalid email or password",
                    )
    except HTTPException:
        raise
    except Exception as e:
        import logging
        logging.warning(f"Error checking user suspension or admin role during login: {e}")

    return {
        "success": True,
        "access_token": response.session.access_token,
        "refresh_token": response.session.refresh_token,
        "expires_in": response.session.expires_in,
        "user": {
            "id": response.user.id,
            "email": response.user.email,
        },
    }


from fastapi import Depends
from app.core.security import get_current_user
from app.db.supabase import supabase


@router.delete("/account")
def delete_account(user: dict = Depends(get_current_user)):
    """Permanently delete user account, avatars from storage, and cascade DB records."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Database connection uninitialized")

    user_id = user["id"]
    try:
        # 1. Clean up avatar files from Supabase Storage
        try:
            files = supabase.storage.from_("avatars").list(user_id)
            if files and isinstance(files, list):
                file_paths = [
                    f"{user_id}/{f['name']}"
                    for f in files
                    if isinstance(f, dict) and "name" in f and f["name"]
                ]
                if file_paths:
                    supabase.storage.from_("avatars").remove(file_paths)
        except Exception as storage_err:
            import logging
            logging.warning(f"Error removing avatar files for user {user_id}: {storage_err}")

        # 2. Delete user from Supabase Auth (triggers ON DELETE CASCADE in PostgreSQL)
        try:
            supabase.auth.admin.delete_user(user_id)
        except Exception as auth_err:
            import logging
            logging.error(f"Error deleting user from auth.admin: {auth_err}", exc_info=True)
            supabase.table("profiles").delete().eq("id", user_id).execute()

        return {
            "success": True,
            "message": "Account and all associated data have been permanently deleted",
        }
    except Exception as e:
        import logging
        logging.error(f"Failed to delete account for user {user_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Failed to delete account. Please try again or contact support.",
        )
