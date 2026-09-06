from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.security import get_current_user
from app.db.supabase import supabase

from app.routers import auth, categories, foods, search, posts, profiles


app = FastAPI(
    title="Kin-Rai-Dee Backend API",
    version="1.0.0",
)


# Enable CORS for frontend app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Register Routers
app.include_router(auth.router)
app.include_router(categories.router)
app.include_router(foods.router)
app.include_router(search.router)
app.include_router(posts.router)
app.include_router(profiles.router)


@app.get("/")
def read_root():
    return {
        "message": "Kin-Rai-Dee API is running and connected to Supabase DB",
        "status": "ok",
    }


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