import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { decode } from 'base64-arraybuffer';
import { supabase } from '@/lib/supabase';

const SUPABASE_URL = (process.env.EXPO_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '');

export type StorageBucket = 'posts' | 'avatars';

/**
 * แปลงค่า image_url / avatar_url ให้พร้อมแสดงผล:
 * - รองรับ data:image... (Base64 เก่าช่วงเปลี่ยนผ่าน) และ local file/content URI
 * - รองรับ full URL และ normalize host ให้ตรงกับ SUPABASE_URL ปัจจุบัน
 * - รองรับ relative storage path (เช่น "{userId}/{file}.jpg")
 */
export function resolveStorageImageUrl(
  bucket: StorageBucket,
  value?: string | null,
): string | undefined {
  if (!value) return undefined;

  if (
    value.startsWith('data:') ||
    value.startsWith('file://') ||
    value.startsWith('content://')
  ) {
    return value;
  }

  const marker = `/storage/v1/object/public/${bucket}/`;
  if (value.includes(marker)) {
    const idx = value.indexOf(marker);
    const path = value.substring(idx);
    return SUPABASE_URL ? `${SUPABASE_URL}${path}` : value;
  }

  if (value.startsWith('http://') || value.startsWith('https://')) {
    return value;
  }

  const cleanPath = value.replace(/^\/+/, '');
  if (SUPABASE_URL) {
    return `${SUPABASE_URL}${marker}${cleanPath}`;
  }
  const { data } = supabase.storage.from(bucket).getPublicUrl(cleanPath);
  return data.publicUrl;
}

/**
 * ดึง relative object path ใน bucket จาก URL หรือ path (คืน null ถ้าเป็น Base64 หรือ URL ภายนอก)
 */
export function extractStoragePath(
  bucket: StorageBucket,
  value?: string | null,
): string | null {
  if (!value || value.startsWith('data:') || value.startsWith('file:') || value.startsWith('content:')) {
    return null;
  }

  const marker = `/storage/v1/object/public/${bucket}/`;
  if (value.includes(marker)) {
    const afterMarker = value.split(marker)[1];
    return afterMarker ? afterMarker.split('?')[0] : null;
  }

  if (!value.startsWith('http://') && !value.startsWith('https://')) {
    return value.replace(/^\/+/, '');
  }

  return null;
}

/**
 * ย่อและบีบอัดรูปด้วย expo-image-manipulator แล้วอัปโหลดขึ้น Supabase Storage
 * คืนค่า public URL ที่พร้อมเก็บลงฐานข้อมูล
 */
export async function uploadCompressedImage(
  bucket: StorageBucket,
  localUri: string,
  userId: string,
): Promise<string> {
  const maxWidth = bucket === 'avatars' ? 400 : 1080;

  const manipulated = await manipulateAsync(
    localUri,
    [{ resize: { width: maxWidth } }],
    {
      compress: 0.7,
      format: SaveFormat.JPEG,
      base64: true,
    },
  );

  if (!manipulated.base64) {
    throw new Error('ไม่สามารถประมวลผลรูปภาพได้');
  }

  const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const path = `${userId}/${uniqueSuffix}.jpg`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, decode(manipulated.base64), {
      contentType: 'image/jpeg',
      cacheControl: '31536000',
      upsert: false,
    });

  if (error) {
    throw error;
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * ลบไฟล์รูปเก่าออกจาก Supabase Storage แบบ best-effort (ไม่ throw ถ้าลบไม่สำเร็จ)
 */
export async function deleteStorageImage(
  bucket: StorageBucket,
  value?: string | null,
): Promise<void> {
  const path = extractStoragePath(bucket, value);
  if (!path) return;

  try {
    const { error } = await supabase.storage.from(bucket).remove([path]);
    if (error) {
      console.warn(`[Storage] Failed to remove ${bucket}/${path}:`, error.message);
    }
  } catch (e) {
    console.warn(`[Storage] Exception removing ${bucket}/${path}:`, e);
  }
}
