import os
import math
import httpx
from typing import Optional, List
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


def get_mock_restaurants(
    keyword: Optional[str],
    user_lat: float,
    user_lng: float,
) -> List[RestaurantResponse]:
    """Fallback mock generator matching the search keyword."""
    kw = (keyword or "อาหาร").strip()

    sample_templates = [
        {
            "name": f"{kw}ตาแป๊ะ",
            "desc": f"สูตรโบราณรสเด็ด หอมกลิ่นกระทะเหล็ก\nคัดสรรวัตถุดิบคุณภาพดี",
            "offset_lat": 0.005,
            "offset_lng": 0.004,
            "rating": 4.8,
            "time": "เปิดตั้งแต่ 10.00 น. - 20.00 น.",
            "addr": "คลองหลวง ปทุมธานี",
        },
        {
            "name": f"ครัวป้าณี {kw}",
            "desc": f"รสชาติต้นตำรับ เมนูแนะนำ {kw} อร่อยกลมกล่อม",
            "offset_lat": -0.008,
            "offset_lng": 0.006,
            "rating": 4.6,
            "time": "เปิดตั้งแต่ 11.00 น. - 19.30 น.",
            "addr": "รังสิต ปทุมธานี",
        },
        {
            "name": f"{kw}แซ่บสะท้าน",
            "desc": f"รสชาติจัดจ้าน เผ็ดร้อนถึงใจ\nพร้อมเสิร์ฟร้อนๆ ทุกจาน",
            "offset_lat": 0.012,
            "offset_lng": -0.007,
            "rating": 4.7,
            "time": "เปิดตั้งแต่ 11.00 น. - 22.00 น.",
            "addr": "รังสิต ปทุมธานี",
        },
        {
            "name": f"ครัวบ้านเรา {kw}รสเด็ด",
            "desc": f"อาหารจานด่วน วัตถุดิบสดใหม่ ให้เยอะจุใจ",
            "offset_lat": -0.015,
            "offset_lng": -0.011,
            "rating": 4.5,
            "time": "เปิดตั้งแต่ 09.00 น. - 21.00 น.",
            "addr": "คลองหลวง ปทุมธานี",
        },
    ]

    results = []
    for i, t in enumerate(sample_templates):
        r_lat = user_lat + t["offset_lat"]
        r_lng = user_lng + t["offset_lng"]
        dist = calculate_distance(user_lat, user_lng, r_lat, r_lng)
        map_url = f"https://www.google.com/maps/search/?api=1&query={t['name']}+{t['addr']}"
        results.append(
            RestaurantResponse(
                id=f"mock_{i+1}",
                name=t["name"],
                image=DEFAULT_IMAGES[i % len(DEFAULT_IMAGES)],
                description=t["desc"],
                openTime=t["time"],
                address=t["addr"],
                distance=dist,
                rating=t["rating"],
                mapUrl=map_url,
            )
        )
    return results


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
            results: List[RestaurantResponse] = []

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
                        photo_url = (
                            f"https://places.googleapis.com/v1/{photo_name}/media"
                            f"?maxHeightPx=400&maxWidthPx=400&key={GOOGLE_MAPS_API_KEY}"
                        )
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
    """Nearby restaurants for random-food screen."""
    search_query = f"ร้าน{keyword}" if keyword else "ร้านอาหาร"
    places = await search_google_places(search_query, lat, lng, radius)

    if not places:
        # Fallback to Smart Mock
        places = get_mock_restaurants(keyword, lat, lng)

    return places


@router.get("/search", response_model=List[RestaurantResponse])
async def search_restaurants(
    query: str = Query(..., description="Search keyword"),
    lat: Optional[float] = Query(14.0734, description="User latitude"),
    lng: Optional[float] = Query(100.6033, description="User longitude"),
    radius: float = Query(8000.0, description="Radius in meters"),
):
    """Search restaurants by keyword for search screen."""
    q = query.strip()
    if not q:
        return []

    search_query = f"ร้าน{q}" if not q.startswith("ร้าน") else q
    user_lat = lat if lat is not None else 14.0734
    user_lng = lng if lng is not None else 100.6033

    places = await search_google_places(search_query, user_lat, user_lng, radius)

    if not places:
        # Fallback to Smart Mock matching query
        places = get_mock_restaurants(q, user_lat, user_lng)

    return places
