export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

export async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T | null> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });
    if (!response.ok) {
      console.warn(`API Error ${response.status} for ${endpoint}`);
      return null;
    }
    return (await response.json()) as T;
  } catch (error) {
    console.warn(`Fetch error for ${endpoint}:`, error);
    return null;
  }
}
