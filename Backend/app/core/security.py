from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.db.supabase import supabase

__all__ = [
    "security",
    "optional_security",
    "get_current_user",
    "get_optional_current_user",
    "get_current_admin",
]

security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    token = credentials.credentials

    try:
        response = supabase.auth.get_user(token)
    except Exception as e:
        import logging
        logging.error(f"Auth get_user failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired access token: {e}",
        )

    user = response.user if response else None

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token",
        )

    # Check if user is suspended in profiles
    try:
        prof_res = supabase.table("profiles").select("is_suspended").eq("id", user.id).execute()
        if prof_res.data and len(prof_res.data) > 0:
            if prof_res.data[0].get("is_suspended"):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="บัญชีของคุณถูกระงับการใช้งาน หากคิดว่าเป็นข้อผิดพลาด สามารถติดต่อฝ่ายสนับสนุนได้ที่ phatsachon25488@gmail.com",
                )
    except HTTPException:
        raise
    except Exception as e:
        import logging
        logging.warning(f"Error checking user suspension in get_current_user: {e}")

    return {
        "id": user.id,
        "email": user.email,
    }


optional_security = HTTPBearer(auto_error=False)


def get_optional_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(optional_security),
) -> dict | None:
    if not credentials:
        return None
    token = credentials.credentials
    try:
        response = supabase.auth.get_user(token)
        if response and response.user:
            user = response.user
            return {"id": user.id, "email": user.email}
    except Exception:
        pass
    return None


def get_current_admin(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    """Verifies that the caller has a valid JWT token AND is an authorized admin in public.admins."""
    user = get_current_user(credentials)
    user_id = user.get("id")

    # 1. Check if user exists in public.admins table and is active
    try:
        admin_res = (
            supabase.table("admins")
            .select("id, role, is_active, name")
            .eq("user_id", user_id)
            .eq("is_active", True)
            .execute()
        )
        if isinstance(admin_res.data, list) and len(admin_res.data) > 0:
            admin_data = admin_res.data[0]
            if isinstance(admin_data, dict):
                return {
                    "id": user_id,
                    "email": user.get("email"),
                    "name": admin_data.get("name") or "ผู้ดูแลระบบ",
                    "role": admin_data.get("role") or "admin",
                }
    except Exception as e:
        import logging
        logging.warning(f"Error querying public.admins: {e}")

    # 2. Fallback check metadata role
    try:
        token = credentials.credentials
        auth_resp = supabase.auth.get_user(token)
        u = auth_resp.user if auth_resp else None
        if u:
            role = (u.app_metadata or {}).get("role") or (u.user_metadata or {}).get("role") or ""
            if role.lower() in ["admin", "super_admin", "moderator"]:
                return {
                    "id": user_id,
                    "email": user.get("email"),
                    "name": (u.user_metadata or {}).get("display_name") or "ผู้ดูแลระบบ",
                    "role": role.lower(),
                }
    except Exception:
        pass

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="สิทธิ์การเข้าถึงถูกปฏิเสธ: จำเป็นต้องมีสิทธิ์ผู้ดูแลระบบ (Admin privilege required)",
    )