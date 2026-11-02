import { fetchApi, API_BASE_URL } from './api';
import type { Restaurant } from '@/components/restuarant-card';

// Development-only fallback. For production, call the Google Places APIs from
// your own backend, not from a public client-side environment variable.
const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';

function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.max(50, Math.round(meters))} ม.`;
  return `${(meters / 1000).toFixed(1)} กม.`;
}

type RestaurantWithDist = Restaurant & {
  _distMeters: number;
  _photoName?: string;
};

type BackendRestaurant = Restaurant & {
  imageUrl?: string;
  image_url?: string;
  photoUrl?: string;
  photo_url?: string;
};

function decodePhotoName(encoded: string): string | null {
  try {
    let base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) base64 += '=';
    const decoded = atob(base64);
    if (decoded && decoded.startsWith('places/')) {
      return decoded;
    }
  } catch {}
  return null;
}

function resolveRestaurantImageUrl(rawImage?: string): string | undefined {
  if (!rawImage || typeof rawImage !== 'string') return undefined;
  const trimmed = rawImage.trim();

  // If already an absolute image URL (Google CDN or Unsplash or Direct Places Media)
  if (/^https?:\/\//i.test(trimmed) && !trimmed.includes('/api/restaurants/photo/')) {
    return trimmed;
  }

  // If it's a backend photo proxy URL (relative or absolute)
  if (trimmed.includes('/api/restaurants/photo/')) {
    const parts = trimmed.split('/api/restaurants/photo/');
    const encoded = parts[1]?.split('?')[0];
    if (encoded && GOOGLE_API_KEY) {
      const photoName = decodePhotoName(encoded);
      if (photoName) {
        // Direct Places Media URL (Google returns HTTP 302 redirect directly to JPEG image)
        return `https://places.googleapis.com/v1/${photoName}/media?maxHeightPx=400&maxWidthPx=400&key=${GOOGLE_API_KEY}`;
      }
    }
    return trimmed.startsWith('http') ? trimmed : `${API_BASE_URL}${trimmed}`;
  }

  return undefined;
}

function normalizeRestaurant(r: BackendRestaurant): Restaurant {
  const rawImage = r.image || r.imageUrl || r.image_url || r.photoUrl || r.photo_url;
  const image = resolveRestaurantImageUrl(rawImage);
  return { ...r, image };
}

function normalizeQuery(keyword?: string): string {
  const trimmed = (keyword || '').trim();
  if (!trimmed) return 'ร้านอาหาร';
  if (/^[a-zA-Z0-9\s\-]+$/.test(trimmed)) return trimmed;
  if (!trimmed.startsWith('ร้าน') && !trimmed.startsWith('คาเฟ่')) return `ร้าน${trimmed}`;
  return trimmed;
}

// Google Places Photo API (New) can return a temporary, actual image URL in
// photoUri when skipHttpRedirect=true. Unlike /media, it can be given directly
// to React Native's <Image /> without depending on the image redirect chain.
async function resolveGooglePhotoUri(photoName: string): Promise<string | undefined> {
  if (!GOOGLE_API_KEY || !photoName) return undefined;
  const endpoint = `https://places.googleapis.com/v1/${photoName}/media`;
  const url = `${endpoint}?maxHeightPx=400&maxWidthPx=400&skipHttpRedirect=true`;
  try {
    const res = await fetch(url, {
      headers: { 'X-Goog-Api-Key': GOOGLE_API_KEY },
    });
    if (!res.ok) {
      console.warn('[RestaurantService] Google photo HTTP:', res.status);
      return undefined;
    }
    const response: { photoUri?: string } = await res.json();
    const photoUri = response.photoUri?.trim();
    return photoUri && /^https?:\/\//i.test(photoUri) ? photoUri : undefined;
  } catch (error) {
    console.warn('[RestaurantService] Google photo request failed:', error);
    return undefined;
  }
}

async function resolveRestaurantPhoto(rawImage?: string): Promise<string | undefined> {
  if (!rawImage || typeof rawImage !== 'string') return undefined;
  const trimmed = rawImage.trim();

  // If already a direct image URL (Google CDN or Unsplash)
  if (
    /^https?:\/\/lh\d+\.googleusercontent\.com/i.test(trimmed) ||
    /^https?:\/\/images\.unsplash\.com/i.test(trimmed)
  ) {
    return trimmed;
  }

  // If it's a backend photo proxy URL (relative or absolute)
  if (trimmed.includes('/api/restaurants/photo/')) {
    const fullUrl = trimmed.startsWith('http') ? trimmed : `${API_BASE_URL}${trimmed}`;
    try {
      const res = await fetch(fullUrl);
      const contentType = res.headers.get('content-type') || '';
      // If backend returned JSON with photoUri (e.g. Render backend)
      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (data.photoUri && typeof data.photoUri === 'string') {
          return data.photoUri;
        }
      }
      if (contentType.startsWith('image/')) {
        return fullUrl;
      }
    } catch (e) {
      console.warn('[RestaurantService] Failed to resolve backend photo:', e);
    }

    // Fallback: extract photo_name and query Google directly
    if (GOOGLE_API_KEY) {
      try {
        const parts = trimmed.split('/api/restaurants/photo/');
        const encoded = parts[1]?.split('?')[0];
        if (encoded) {
          let base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
          while (base64.length % 4) base64 += '=';
          const photoName = atob(base64);
          if (photoName.startsWith('places/')) {
            const googlePhoto = await resolveGooglePhotoUri(photoName);
            if (googlePhoto) return googlePhoto;
          }
        }
      } catch (e) {
        console.warn('[RestaurantService] Failed to decode photo name:', e);
      }
    }
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return undefined;
}

export async function searchGooglePlacesDirect(
  query: string,
  userLat?: number,
  userLng?: number,
  radius: number = 8000,
): Promise<Restaurant[]> {
  if (!GOOGLE_API_KEY) {
    console.warn('[RestaurantService] No development Google Places API key configured.');
    return [];
  }

  const safeLat = typeof userLat === 'number' && Number.isFinite(userLat) && userLat !== 0
    ? userLat : 14.0734;
  const safeLng = typeof userLng === 'number' && Number.isFinite(userLng) && userLng !== 0
    ? userLng : 100.6033;
  const url = 'https://places.googleapis.com/v1/places:searchText';

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_API_KEY,
        'X-Goog-FieldMask':
          'places.id,places.displayName,places.formattedAddress,places.rating,places.currentOpeningHours,places.photos,places.location,places.googleMapsUri,places.userRatingCount',
      },
      body: JSON.stringify({
        textQuery: normalizeQuery(query),
        languageCode: 'th',
        maxResultCount: 15,
        locationBias: {
          circle: {
            center: { latitude: safeLat, longitude: safeLng },
            radius,
          },
        },
      }),
    });

    if (!res.ok) {
      console.warn('[RestaurantService] Google Places search HTTP:', res.status);
      return [];
    }

    const data = await res.json();
    const places: any[] = Array.isArray(data.places) ? data.places : [];
    const results: RestaurantWithDist[] = places.map((p, i) => {
      const name = p.displayName?.text || '';
      const address = p.formattedAddress || '';
      const pLat = p.location?.latitude;
      const pLng = p.location?.longitude;
      const distM = typeof pLat === 'number' && typeof pLng === 'number'
        ? haversineMeters(safeLat, safeLng, pLat, pLng)
        : 999999;
      const rating = typeof p.rating === 'number' ? p.rating : undefined;
      const reviewCount = p.userRatingCount || 0;
      const desc = [
        rating ? `⭐ ${rating} (${reviewCount} รีวิว)` : '',
        address,
      ].filter(Boolean).join(' • ') || 'ร้านอาหาร';
      const openNow = p.currentOpeningHours?.openNow;
      const openTime = typeof openNow === 'boolean'
        ? (openNow ? 'เปิดอยู่' : 'ปิดอยู่')
        : 'ไม่ทราบเวลาเปิด-ปิด';
      return {
        id: p.id || `place_${i}`,
        name,
        description: desc,
        openTime,
        address,
        distance: formatDistance(distM),
        rating,
        mapUrl: p.googleMapsUri ||
          `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}`,
        _distMeters: distM,
        _photoName: p.photos?.[0]?.name,
      };
    });

    results.sort((a, b) => a._distMeters - b._distMeters);

    // The RandomFoodScreen displays five restaurant cards. Resolve only their
    // images to avoid requesting paid photo endpoints unnecessarily for all 15.
    const resolved = await Promise.all(results.map(async (r, index) => {
      const image = index < 5 && r._photoName
        ? await resolveGooglePhotoUri(r._photoName)
        : undefined;
      const { _distMeters, _photoName, ...restaurant } = r;
      return { ...restaurant, image } as Restaurant;
    }));
    console.log('[RestaurantService] Direct Google results:', resolved.length,
      'with images:', resolved.filter(r => Boolean(r.image)).length);
    return resolved;
  } catch (error) {
    console.warn('[RestaurantService] Google Places search failed:', error);
    return [];
  }
}

// Compare exact IDs or exact restaurant names only, avoiding wrong photos.
function fillMatchingImages(backend: Restaurant[], googleResults: Restaurant[]): Restaurant[] {
  const byId = new Map(googleResults.map((r) => [r.id, r]));
  const byName = new Map(
    googleResults.map((r) => [r.name.trim().toLocaleLowerCase(), r])
  );
  return backend.map((r) => {
    if (r.image) return r;
    const match = byId.get(r.id) || byName.get(r.name.trim().toLocaleLowerCase());
    return match?.image ? { ...r, image: match.image } : r;
  });
}

async function getBackendRestaurants(path: string): Promise<Restaurant[]> {
  try {
    const data = await fetchApi<BackendRestaurant[]>(path);
    return Array.isArray(data) ? data.map(normalizeRestaurant) : [];
  } catch (error) {
    console.warn('[RestaurantService] Backend request failed:', error);
    return [];
  }
}

async function useBackendThenGoogle(
  path: string,
  keyword: string,
  lat: number,
  lng: number,
  radius: number,
): Promise<Restaurant[]> {
  const backend = await getBackendRestaurants(path);
  if (backend.length > 0) {
    const withoutImage = backend.filter((r) => !r.image).length;
    console.log(
      '[RestaurantService] Backend:',
      backend.length,
      'restaurants; missing images:',
      withoutImage
    );

    // If some restaurants still lack photos, try filling them using direct Google search
    if (withoutImage > 0 && GOOGLE_API_KEY) {
      try {
        const googleResults = await searchGooglePlacesDirect(keyword, lat, lng, radius);
        return fillMatchingImages(backend, googleResults);
      } catch {
        return backend;
      }
    }
    return backend;
  }

  return searchGooglePlacesDirect(keyword, lat, lng, radius);
}

export async function fetchNearbyRestaurants(
  lat: number = 14.0734,
  lng: number = 100.6033,
  keyword?: string,
): Promise<Restaurant[]> {
  const kwParam = keyword ? `&keyword=${encodeURIComponent(keyword)}` : '';
  return useBackendThenGoogle(
    `/api/restaurants/nearby?lat=${lat}&lng=${lng}${kwParam}`,
    keyword || 'ร้านอาหาร',
    lat,
    lng,
    6000,
  );
}

export async function searchRestaurants(
  query: string,
  lat: number = 14.0734,
  lng: number = 100.6033,
): Promise<Restaurant[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];
  return useBackendThenGoogle(
    `/api/restaurants/search?query=${encodeURIComponent(trimmed)}&lat=${lat}&lng=${lng}`,
    trimmed,
    lat,
    lng,
    8000,
  );
}
