from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from supabase import create_client

from app.core.config import SUPABASE_URL
from app.core.config import SUPABASE_PUBLISHABLE_KEY

router = APIRouter(prefix="/auth", tags=["Authentication"])

supabase_auth = create_client(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
)


class LoginRequest(BaseModel):
    email: str
    password: str


@router.post("/login")
def login(data: LoginRequest):
    try:
        response = supabase_auth.auth.sign_in_with_password({
            "email": data.email,
            "password": data.password,
        })
    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password",
        )

    if not response.session:
        raise HTTPException(
            status_code=401,
            detail="Login failed",
        )

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