import os
import math
import httpx
from typing import Optional, List, Tuple
from fastapi import APIRouter, Query
from pydantic import BaseModel

from app.core.config import GOOGLE_MAPS_API_KEY

router = APIRouter(prefix="/api/restaurants", tags=["Restaurants"])


class RestaurantResponse(BaseModel):
    id: str
    name: str
    image: Optional[str] = None
    description: Optional[str] = None
    openTime: Optional[str] = None
    address: Optional[str] = None
    distance: Optional[str] = None
    rating: Optional[float] = None
    mapUrl: Optional[str] = None


def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> str:
    """Calculate distance in meters or kilometers between two coordinates."""
    R = 6371.0  # Earth's radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlon / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    dist_km = R * c
    if dist_km < 1.0:
        return f"{max(50, int(dist_km * 1000))} ม."
    return f"{dist_km:.1f} กม."


DEFAULT_IMAGES = [
    "https://images.unsplash.com/photo-1555396273-367ea4eb4db5",
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4",
    "https://images.unsplash.com/photo-1513104890138-7c749659a591",
    "https://images.unsplash.com/photo-1552566626-52f8b828add9",
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836",
]



async def search_google_places(
    query: str,
    user_lat: float,
    user_lng: float,
    radius: float = 5000.0,
) -> List[RestaurantResponse]:
    """Call Google Places API (New) searchText."""
    if not GOOGLE_MAPS_API_KEY:
        return []

    url = "https://places.googleapis.com/v1/places:searchText"
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
        "X-Goog-FieldMask": (
            "places.id,places.displayName,places.formattedAddress,"
            "places.rating,places.currentOpeningHours,places.photos,"
            "places.location,places.googleMapsUri,places.userRatingCount"
        ),
    }
    payload = {
        "textQuery": query,
        "languageCode": "th",
        "maxResultCount": 10,
        "locationBias": {
            "circle": {
                "center": {"latitude": user_lat, "longitude": user_lng},
                "radius": radius,
            }
        },
    }

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.post(url, json=payload, headers=headers)
            if resp.status_code != 200:
                print(f"Google Places API Error {resp.status_code}: {resp.text}")
                return []

            data = resp.json()
            places = data.get("places", [])
            results: List[Tuple[float, RestaurantResponse]] = []

            for p in places:
                p_id = p.get("id", "")
                p_name = p.get("displayName", {}).get("text", "")
                p_addr = p.get("formattedAddress", "")
                p_rating = p.get("rating")
                p_count = p.get("userRatingCount", 0)

                # Distance
                p_loc = p.get("location", {})
                p_lat = p_loc.get("latitude")
                p_lng = p_loc.get("longitude")
                distance_str = None
                if p_lat is not None and p_lng is not None:
                    distance_str = calculate_distance(user_lat, user_lng, p_lat, p_lng)

                # Photo URL
                photo_url = None
                photos = p.get("photos", [])
                if photos and len(photos) > 0:
                    photo_name = photos[0].get("name")
                    if photo_name:
                        # H-4: Proxy through backend so the API key is never
                        # exposed in client-visible URLs
                        import base64
                        encoded = base64.urlsafe_b64encode(photo_name.encode()).decode().rstrip("=")
                        photo_url = f"/api/restaurants/photo/{encoded}"
                if not photo_url:
                    photo_url = DEFAULT_IMAGES[len(results) % len(DEFAULT_IMAGES)]

                # Open status
                open_time = "เปิดอยู่"
                current_hours = p.get("currentOpeningHours", {})
                if "openNow" in current_hours:
                    open_time = "เปิดอยู่" if current_hours["openNow"] else "ปิดอยู่"

                # Description summary
                desc_parts = []
                if p_rating:
                    desc_parts.append(f"⭐ {p_rating} ({p_count} รีวิว)")
                if p_addr:
                    desc_parts.append(p_addr)
                desc = " • ".join(desc_parts) if desc_parts else "ร้านอาหารใกล้ฉัน"

                map_url = p.get("googleMapsUri") or (
                    f"https://www.google.com/maps/search/?api=1&query={p_name}"
                )

                # Distance in meters for sorting
                dist_m = 999999.0
                if p_lat is not None and p_lng is not None:
                    dlat = math.radians(p_lat - user_lat)
                    dlon = math.radians(p_lng - user_lng)
                    a = math.sin(dlat / 2)**2 + math.cos(math.radians(user_lat)) * math.cos(math.radians(p_lat)) * math.sin(dlon / 2)**2
                    dist_m = 6371000.0 * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

                results.append(
                    (
                        dist_m,
                        RestaurantResponse(
                            id=p_id,
                            name=p_name,
                            image=photo_url,
                            description=desc,
                            openTime=open_time,
                            address=p_addr,
                            distance=distance_str,
                            rating=p_rating,
                            mapUrl=map_url,
                        )
                    )
                )

            # เรียงจากใกล้สุดไปไกลสุด
            results.sort(key=lambda x: x[0])
            return [r for _, r in results]
    except Exception as e:
        print("Failed to query Google Places API:", e)
        return []


@router.get("/nearby", response_model=List[RestaurantResponse])
async def get_nearby_restaurants(
    lat: float = Query(14.0734, description="User latitude"),
    lng: float = Query(100.6033, description="User longitude"),
    radius: float = Query(5000.0, description="Radius in meters"),
    keyword: Optional[str] = Query(None, description="Food or restaurant keyword"),
):
    """Nearby real restaurants from Google Places API for random-food screen."""
    search_query = f"ร้าน{keyword}" if keyword else "ร้านอาหาร"
    places = await search_google_places(search_query, lat, lng, radius)
    return places


@router.get("/search", response_model=List[RestaurantResponse])
async def search_restaurants(
    query: str = Query(..., description="Search keyword"),
    lat: Optional[float] = Query(14.0734, description="User latitude"),
    lng: Optional[float] = Query(100.6033, description="User longitude"),
    radius: float = Query(8000.0, description="Radius in meters"),
):
    """Search real restaurants from Google Places API by keyword."""
    q = query.strip()
    if not q:
        return []

    search_query = f"ร้าน{q}" if not q.startswith("ร้าน") else q
    user_lat = lat if lat is not None else 14.0734
    user_lng = lng if lng is not None else 100.6033

    places = await search_google_places(search_query, user_lat, user_lng, radius)
    return places


# ── Photo Proxy (H-4) ─────────────────────────────────────────────────────────
import base64
import binascii
from fastapi.responses import Response as FastAPIResponse


@router.get("/photo/{encoded_name}")
async def proxy_place_photo(encoded_name: str):
    """
    Server-side proxy for Google Places photo.
    Hides GOOGLE_MAPS_API_KEY from client-visible URLs.
    encoded_name is base64url-encoded Places photo resource name (no padding).
    """
    if not GOOGLE_MAPS_API_KEY:
        return FastAPIResponse(status_code=404, content=b"")

    # Restore base64url padding
    padding = 4 - len(encoded_name) % 4
    padded = encoded_name + "=" * (padding % 4)
    try:
        photo_name = base64.urlsafe_b64decode(padded).decode()
    except (binascii.Error, UnicodeDecodeError):
        return FastAPIResponse(status_code=400, content=b"Invalid photo reference")

    # Basic allowlist: photo_name must match the expected Places API format
    import re as _re
    if not _re.match(r'^places/[A-Za-z0-9_\-]+/photos/[A-Za-z0-9_\-]+$', photo_name):
        return FastAPIResponse(status_code=400, content=b"Invalid photo reference")

    url = (
        f"https://places.googleapis.com/v1/{photo_name}/media"
        f"?maxHeightPx=400&maxWidthPx=400&key={GOOGLE_MAPS_API_KEY}&skipHttpRedirect=true"
    )
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(url)
            content_type = resp.headers.get("content-type", "image/jpeg")
            return FastAPIResponse(
                content=resp.content,
                media_type=content_type,
                headers={"Cache-Control": "public, max-age=86400"},
            )
    except Exception:
        return FastAPIResponse(status_code=502, content=b"Photo unavailable")
