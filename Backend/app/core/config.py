import os
from pathlib import Path
from dotenv import load_dotenv

_backend_dir = Path(__file__).resolve().parent.parent.parent
_env_path = _backend_dir / ".env"
if _env_path.exists():
    load_dotenv(dotenv_path=_env_path)
load_dotenv()

SUPABASE_URL: str = os.getenv("SUPABASE_URL") or ""
SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or ""
SUPABASE_PUBLISHABLE_KEY: str = os.getenv("SUPABASE_PUBLISHABLE_KEY") or ""
GOOGLE_MAPS_API_KEY: str = os.getenv(
    "GOOGLE_MAPS_API_KEY",
    "[GCP_API_KEY]",
)

if not SUPABASE_URL:
    raise ValueError("SUPABASE_URL is not set")

if not SUPABASE_SERVICE_ROLE_KEY:
    raise ValueError("SUPABASE_SERVICE_ROLE_KEY is not set")

if not SUPABASE_PUBLISHABLE_KEY:
    raise ValueError("SUPABASE_PUBLISHABLE_KEY is not set")