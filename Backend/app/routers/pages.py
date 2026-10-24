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
