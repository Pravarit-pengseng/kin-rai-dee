import { fetchApi } from './api';
import { Restaurant } from '@/components/restuarant-card';

const GOOGLE_API_KEY =
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
  'AIzaSyAHhPsNgw8JMovViaErDL9DaJIT9IcQ5t0';

function haversineMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371000; // meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.max(50, Math.round(meters))} ม.`;
  }
  return `${(meters / 1000).toFixed(1)} กม.`;
}

interface RestaurantWithDist extends Restaurant {
  _distMeters: number;
}

const DEFAULT_IMAGES = [
  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5',
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4',
  'https://images.unsplash.com/photo-1513104890138-7c749659a591',
  'https://images.unsplash.com/photo-1552566626-52f8b828add9',
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836',
];

export async function searchGooglePlacesDirect(
  query: string,
  userLat: number,
  userLng: number,
  radius: number = 8000,
): Promise<Restaurant[]> {
  if (!GOOGLE_API_KEY) return [];

  const url = 'https://places.googleapis.com/v1/places:searchText';
  const headers = {
    'Content-Type': 'application/json',
    'X-Goog-Api-Key': GOOGLE_API_KEY,
    'X-Goog-FieldMask':
      'places.id,places.displayName,places.formattedAddress,places.rating,places.currentOpeningHours,places.photos,places.location,places.googleMapsUri,places.userRatingCount',
  };

  const payload = {
    textQuery: query,
    languageCode: 'th',
    maxResultCount: 15,
    locationBias: {
      circle: {
        center: { latitude: userLat, longitude: userLng },
        radius: radius,
      },
    },
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      console.warn('Google Places direct error status:', res.status);
      return [];
    }

    const data = await res.json();
    const places = data.places || [];
    const results: RestaurantWithDist[] = [];

    for (let i = 0; i < places.length; i++) {
      const p = places[i];
      const pId = p.id || `place_${i}`;
      const pName = p.displayName?.text || '';
      const pAddr = p.formattedAddress || '';
      const pRating = p.rating;
      const pCount = p.userRatingCount || 0;

      const pLat = p.location?.latitude;
      const pLng = p.location?.longitude;
      const distM =
        pLat != null && pLng != null
          ? haversineMeters(userLat, userLng, pLat, pLng)
          : 999999;

      let photoUrl = '';
      if (p.photos && p.photos.length > 0) {
        const photoName = p.photos[0].name;
        if (photoName) {
          photoUrl = `https://places.googleapis.com/v1/${photoName}/media?maxHeightPx=400&maxWidthPx=400&key=${GOOGLE_API_KEY}`;
        }
      }
      if (!photoUrl) {
        photoUrl = DEFAULT_IMAGES[i % DEFAULT_IMAGES.length];
      }

      let openTime = 'เปิดอยู่';
      if (
        p.currentOpeningHours &&
        typeof p.currentOpeningHours.openNow === 'boolean'
      ) {
        openTime = p.currentOpeningHours.openNow ? 'เปิดอยู่' : 'ปิดอยู่';
      }

      const descParts: string[] = [];
      if (pRating) descParts.push(`⭐ ${pRating} (${pCount} รีวิว)`);
      if (pAddr) descParts.push(pAddr);
      const desc = descParts.join(' • ') || 'ร้านอาหาร';

      const mapUrl =
        p.googleMapsUri ||
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pName)}`;

      results.push({
        id: pId,
        name: pName,
        image: photoUrl,
        description: desc,
        openTime,
        address: pAddr,
        distance: formatDistance(distM),
        rating: pRating,
        mapUrl,
        _distMeters: distM,
      });
    }

    // เรียงระยะทางจากใกล้สุดไปไกลสุด
    results.sort((a, b) => a._distMeters - b._distMeters);
    return results.map(({ _distMeters, ...r }) => r);
  } catch (err) {
    console.warn('Google Places direct fetch error:', err);
    return [];
  }
}

export async function fetchNearbyRestaurants(
  lat: number = 14.0734,
  lng: number = 100.6033,
  keyword?: string,
): Promise<Restaurant[]> {
  const kwParam = keyword ? `&keyword=${encodeURIComponent(keyword)}` : '';
  const data = await fetchApi<Restaurant[]>(
    `/api/restaurants/nearby?lat=${lat}&lng=${lng}${kwParam}`,
  );

  if (data && data.length > 0) {
    return data;
  }

  // Fallback: ยิงตรง Google Places API (แก้ปัญหา iOS ต่อ Backend local network ไม่ได้)
  const directQuery = keyword ? `ร้าน${keyword}` : 'ร้านอาหาร';
  const directResults = await searchGooglePlacesDirect(
    directQuery,
    lat,
    lng,
    5000,
  );
  if (directResults.length > 0) {
    return directResults;
  }

  return [];
}

export async function searchRestaurants(
  query: string,
  lat: number = 14.0734,
  lng: number = 100.6033,
): Promise<Restaurant[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const data = await fetchApi<Restaurant[]>(
    `/api/restaurants/search?query=${encodeURIComponent(trimmed)}&lat=${lat}&lng=${lng}`,
  );

  if (data && data.length > 0) {
    return data;
  }

  // Fallback: ยิงตรง Google Places API (แก้ปัญหา iOS ต่อ Backend local network ไม่ได้)
  const directQuery = trimmed.startsWith('ร้าน')
    ? trimmed
    : `ร้าน${trimmed}`;
  const directResults = await searchGooglePlacesDirect(
    directQuery,
    lat,
    lng,
    8000,
  );
  if (directResults.length > 0) {
    return directResults;
  }

  return [];
}
