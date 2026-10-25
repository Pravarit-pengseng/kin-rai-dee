import os
from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.security import get_current_user
from app.db.supabase import supabase

from app.routers import auth, categories, foods, search, posts, profiles, restaurants, safety, pages, admin


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


# Mount static assets from Expo Web export if available
_BASE_DIR = os.path.dirname(__file__)
for _dist_path in [
    os.path.join(_BASE_DIR, "static"),
    os.path.abspath(os.path.join(_BASE_DIR, "..", "..", "frontend", "dist")),
]:
    _expo_path = os.path.join(_dist_path, "_expo")
    _assets_path = os.path.join(_dist_path, "assets")
    if os.path.exists(_expo_path):
        app.mount("/_expo", StaticFiles(directory=_expo_path), name="expo_static")
    if os.path.exists(_assets_path):
        app.mount("/assets", StaticFiles(directory=_assets_path), name="assets_static")
    if os.path.exists(_expo_path) or os.path.exists(_assets_path):
        break


# Register Routers
app.include_router(pages.router)
app.include_router(safety.router)
app.include_router(admin.router)
app.include_router(auth.router)
app.include_router(auth.router, prefix="/api")
app.include_router(categories.router)
app.include_router(foods.router)
app.include_router(search.router)
app.include_router(posts.router)
app.include_router(profiles.router)
app.include_router(restaurants.router)


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