"""
Security validators: URL allowlisting, input sanitization.
Used by posts.py, profiles.py, restaurants.py.
"""
import re
from typing import Optional
from urllib.parse import urlparse


# ── Allowed URL schemes & blocked private IP ranges ─────────────────────────

_ALLOWED_URL_SCHEMES = {"https", "http"}
_BLOCKED_HOSTS = {
    "localhost",
    "127.0.0.1",
    "0.0.0.0",
    "::1",
}
# AWS/GCP/Azure metadata & private ranges (prefix match on hostname)
_BLOCKED_HOST_PREFIXES = (
    "169.254.",   # Link-local (AWS metadata: 169.254.169.254)
    "192.168.",   # Private RFC1918
    "10.",        # Private RFC1918
    "172.16.",    # Private RFC1918 start
    "172.17.",
    "172.18.",
    "172.19.",
    "172.20.",
    "172.21.",
    "172.22.",
    "172.23.",
    "172.24.",
    "172.25.",
    "172.26.",
    "172.27.",
    "172.28.",
    "172.29.",
    "172.30.",
    "172.31.",
    "fd",         # IPv6 ULA prefix
    "fc",
)


def validate_public_url(url: Optional[str], field_name: str = "URL") -> Optional[str]:
    """
    Validates that a URL:
    - Uses http/https scheme only (blocks file://, ftp://, data:, etc.)
    - Does not point to private/internal IP ranges (SSRF protection)
    Returns the validated URL or raises ValueError.
    """
    if url is None:
        return None
    url = url.strip()
    if not url:
        return None

    try:
        parsed = urlparse(url)
    except Exception:
        raise ValueError(f"{field_name} is not a valid URL")

    if parsed.scheme not in _ALLOWED_URL_SCHEMES:
        raise ValueError(f"{field_name} must use http or https scheme")

    host = (parsed.hostname or "").lower().strip("[]")  # strip IPv6 brackets

    if not host:
        raise ValueError(f"{field_name} must have a valid host")

    if host in _BLOCKED_HOSTS:
        raise ValueError(f"{field_name} points to a disallowed host")

    for prefix in _BLOCKED_HOST_PREFIXES:
        if host.startswith(prefix):
            raise ValueError(f"{field_name} points to a private/internal address")

    return url


def sanitize_search_query(q: str) -> str:
    """
    Allowlist-based search sanitization.
    Keeps: unicode word chars, Thai script (\\u0E00-\\u0E7F), spaces, hyphens, apostrophes.
    Strips everything else to prevent PostgREST filter injection.
    """
    safe = re.sub(r"[^\w\s\u0E00-\u0E7F'\-]", "", q)
    return safe.strip()[:200]  # hard cap at 200 chars
