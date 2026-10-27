import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '@/constants/typography';
import { API_BASE_URL } from '@/services/api';

export type Restaurant = {
  id: string;
  name: string;
  image?: string;
  description?: string;
  openTime?: string;
  address?: string;
  distance?: string;
  rating?: number;
  mapUrl?: string;
};

type RestaurantCardProps = {
  restaurant: Restaurant;
  onPress?: () => void;
  onMapPress?: () => void;
};

const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';

function resolveCardImageUri(raw?: string): string {
  if (!raw || typeof raw !== 'string') return '';
  const trimmed = raw.trim();
  if (trimmed.includes('/api/restaurants/photo/')) {
    const parts = trimmed.split('/api/restaurants/photo/');
    const encoded = parts[1]?.split('?')[0];
    if (encoded && GOOGLE_API_KEY) {
      try {
        let base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
        while (base64.length % 4) base64 += '=';
        const photoName = atob(base64);
        if (photoName.startsWith('places/')) {
          return `https://places.googleapis.com/v1/${photoName}/media?maxHeightPx=400&maxWidthPx=400&key=${GOOGLE_API_KEY}`;
        }
      } catch {}
    }
    return trimmed.startsWith('/') ? `${API_BASE_URL}${trimmed}` : trimmed;
  }
  return trimmed.startsWith('/') ? `${API_BASE_URL}${trimmed}` : trimmed;
}

export function RestaurantCard({
  restaurant,
  onPress,
  onMapPress,
}: RestaurantCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const imageUri = resolveCardImageUri(restaurant.image);
  const hasImage = /^https?:\/\//i.test(imageUri);

  // Reset states when restaurant or image changes
  useEffect(() => {
    setImageFailed(false);
    setImageLoading(true);
  }, [restaurant.id, imageUri]);

  const handleOpenMap = () => {
    if (onMapPress) {
      onMapPress();
      return;
    }
    const query = encodeURIComponent(
      restaurant.name + (restaurant.address ? ` ${restaurant.address}` : '')
    );
    const url = restaurant.mapUrl ||
      `https://www.google.com/maps/search/?api=1&query=${query}`;
    Linking.openURL(url).catch((err) =>
      console.log('Error opening Google Maps:', err)
    );
  };

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={onPress}
    >
      <View style={styles.imageFrame}>
        {hasImage && !imageFailed ? (
          <>
            <Image
              key={`${restaurant.id}-${imageUri}`}
              source={{ uri: imageUri }}
              style={styles.image}
              contentFit="cover"
              transition={200}
              onLoadStart={() => setImageLoading(true)}
              onLoadEnd={() => setImageLoading(false)}
              onError={(event) => {
                console.warn(
                  '[RestaurantCard] โหลดรูปไม่สำเร็จ:',
                  restaurant.name,
                  event
                );
                setImageFailed(true);
                setImageLoading(false);
              }}
            />
            {imageLoading && (
              <View style={styles.loadingOverlay} pointerEvents="none">
                <ActivityIndicator size="small" color="#A3A3A3" />
              </View>
            )}
          </>
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <Text style={styles.placeholderText}>ไม่มีรูป</Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.name} numberOfLines={1}>
            {restaurant.name}
          </Text>
          {restaurant.distance ? (
            <View style={styles.distanceBadge}>
              <Text style={styles.distanceText}>{restaurant.distance}</Text>
            </View>
          ) : null}
        </View>

        {restaurant.description ? (
          <Text style={styles.description} numberOfLines={2}>
            {restaurant.description}
          </Text>
        ) : restaurant.address ? (
          <Text style={styles.description} numberOfLines={2}>
            {restaurant.address}
          </Text>
        ) : null}

        <View style={styles.footerRow}>
          <Text style={styles.openTime} numberOfLines={1}>
            {restaurant.openTime || 'ไม่ทราบเวลาเปิด-ปิด'}
          </Text>
          <TouchableOpacity
            style={styles.mapButton}
            activeOpacity={0.7}
            onPress={handleOpenMap}
          >
            <Ionicons
              name="location-sharp"
              size={13}
              color="#2563EB"
              style={styles.mapIcon}
            />
            <Text style={styles.mapButtonText}>ดูแผนที่</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  imageFrame: {
    width: 88,
    height: 88,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    overflow: 'hidden',
  },
  image: {
    width: 88,
    height: 88,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(243,244,246,0.5)',
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 10,
    color: '#9CA3AF',
    fontFamily: Typography.regular,
  },
  content: {
    flex: 1,
    minWidth: 0,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  name: {
    flex: 1,
    fontSize: 16,
    fontFamily: Typography.bold,
    color: '#1C1B1F',
    marginRight: 6,
  },
  distanceBadge: {
    backgroundColor: '#F5F5F4',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  distanceText: {
    fontSize: 13,
    fontFamily: Typography.bold,
    color: '#44403C',
  },
  description: {
    fontSize: 13,
    lineHeight: 16,
    fontFamily: Typography.regular,
    color: '#52525B',
    marginVertical: 3,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 1,
  },
  openTime: {
    flex: 1,
    fontSize: 13,
    fontFamily: Typography.semiBold,
    color: '#059669',
    marginRight: 6,
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: -5,
  },
  mapIcon: { marginRight: 3 },
  mapButtonText: {
    fontSize: 12,
    fontFamily: Typography.bold,
    color: '#1D4ED8',
  },
});
