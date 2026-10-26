import os
import logging
from fastapi import Depends, FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

_logger = logging.getLogger(__name__)

from app.core.security import get_current_user
from app.db.supabase import supabase

from app.routers import auth, categories, foods, search, posts, profiles, restaurants, safety, pages, admin


# ── Rate Limiter ──────────────────────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address, default_limits=["200/minute"])

# ── FastAPI App ───────────────────────────────────────────────────────────────
_IS_PROD = os.getenv("ENVIRONMENT", "production").lower() == "production"

app = FastAPI(
    title="Kin-Rai-Dee Backend API",
    version="1.0.0",
    # Disable interactive docs in production to reduce attack surface
    docs_url=None if _IS_PROD else "/docs",
    redoc_url=None if _IS_PROD else "/redoc",
    openapi_url=None if _IS_PROD else "/openapi.json",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)  # type: ignore


# ── Global 500 Handler — hides internal errors from clients (H-2 fix) ─────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Catch-all for unhandled exceptions: log internally, return generic message."""
    _logger.error(
        "Unhandled exception on %s %s: %s",
        request.method,
        request.url.path,
        exc,
        exc_info=True,
    )
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
    )


# ── CORS — explicit origins only (C-2 fix) ───────────────────────────────────
_ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "ALLOWED_ORIGINS",
        "https://kinraidee.app,https://www.kinraidee.app,http://localhost:8081,http://localhost:5173",
    ).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Requested-With"],
)


# ── Security Headers Middleware ───────────────────────────────────────────────
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response: Response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    if _IS_PROD:
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response


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
        "message": "Kin-Rai-Dee API is running",
        "status": "ok",
    }


# NOTE: /test/supabase removed — exposed unauthenticated DB access (C-3 fix)


@app.get("/me")
def get_me(user: dict = Depends(get_current_user)):
    return {
        "success": True,
        "user": user,
    }