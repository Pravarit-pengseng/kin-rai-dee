from fastapi import Depends, FastAPI

from app.core.security import get_current_user
from app.db.supabase import supabase
from app.routes.profile import router as profile_router
from app.routes.auth import router as auth_router
from app.routes.posts import router as posts_router

app = FastAPI()

app.include_router(auth_router)
app.include_router(profile_router)
app.include_router(posts_router)

@app.get("/")
def read_root():
    return {"Hello": "World"}


@app.get("/test/supabase")
def test_supabase():
    response = (
        supabase
        .table("profiles")
        .select("*")
        .limit(1)
        .execute()
    )

    return {
        "success": True,
        "data": response.data,
    }


@app.get("/me")
def get_me(user: dict = Depends(get_current_user)):
    return {
        "success": True,
        "user": user,
    }