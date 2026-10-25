import { View, Text, Image, StyleSheet, TouchableOpacity, Linking, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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

export function RestaurantCard({
  restaurant,
  onPress,
  onMapPress,
}: RestaurantCardProps) {
  const { width } = useWindowDimensions();
  const isNarrow = width < 360;

  const handleOpenMap = () => {
    if (onMapPress) {
      onMapPress();
      return;
    }
    const query = encodeURIComponent(
      restaurant.name + (restaurant.address ? ' ' + restaurant.address : '')
    );
    const url =
      restaurant.mapUrl ||
      `https://www.google.com/maps/search/?api=1&query=${query}`;
    Linking.openURL(url).catch((err) =>
      console.log('Error opening Google Maps:', err)
    );
  };

  return (
    <TouchableOpacity
      style={[styles.card, isNarrow && styles.cardNarrow]}
      activeOpacity={0.85}
      onPress={onPress}
    >
      {/* Restaurant Image */}
      {restaurant.image ? (
        <Image
          source={{
            uri: restaurant.image,
          }}
          style={[styles.image, isNarrow && styles.imageNarrow]}
          resizeMode="cover"
        />
      ) : (
        <View
          style={[
            styles.image,
            styles.imagePlaceholder,
            isNarrow && styles.imageNarrow,
          ]}
        >
          <Text style={styles.placeholderText}>
            ไม่มีรูป
          </Text>
        </View>
      )}

      {/* Restaurant Information */}
      <View style={[styles.content, isNarrow && styles.contentNarrow]}>
        {/* Row 1: Name + Distance */}
        <View style={styles.headerRow}>
          <Text
            style={[styles.name, isNarrow && styles.nameNarrow]}
            numberOfLines={1}
          >
            {restaurant.name}
          </Text>

          {restaurant.distance && (
            <View style={styles.distanceBadge}>
              <Text style={[styles.distanceText, isNarrow && { fontSize: 11.5 }]}>
                {restaurant.distance}
              </Text>
            </View>
          )}
        </View>

        {/* Row 2: Description */}
        {restaurant.description ? (
          <Text
            style={[styles.description, isNarrow && { fontSize: 12, lineHeight: 15 }]}
            numberOfLines={2}
          >
            {restaurant.description}
          </Text>
        ) : restaurant.address ? (
          <Text
            style={[styles.description, isNarrow && { fontSize: 12, lineHeight: 15 }]}
            numberOfLines={2}
          >
            {restaurant.address}
          </Text>
        ) : null}

        {/* Row 3: Open Time + Map Button */}
        <View style={styles.footerRow}>
          <Text style={[styles.openTime, isNarrow && { fontSize: 11.5 }]} numberOfLines={1}>
            {restaurant.openTime || 'เปิดตั้งแต่ 10.00 น. - 20.00 น.'}
          </Text>

          <TouchableOpacity
            style={[styles.mapButton, isNarrow && styles.mapButtonNarrow]}
            activeOpacity={0.7}
            onPress={handleOpenMap}
          >
            <Ionicons
              name="location-sharp"
              size={isNarrow ? 11 : 13}
              color="#2563EB"
              style={styles.mapIcon}
            />
            <Text style={[styles.mapButtonText, isNarrow && { fontSize: 11 }]}>
              ดูแผนที่
            </Text>
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
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cardNarrow: {
    borderRadius: 16,
    padding: 9,
    marginBottom: 10,
  },
  image: {
    width: 88,
    height: 88,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
  },
  imageNarrow: {
    width: 72,
    height: 72,
    borderRadius: 11,
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  placeholderText: {
    fontSize: 10,
    color: '#9CA3AF',
    fontFamily: 'Inter_400Regular',
  },

  content: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  contentNarrow: {
    marginLeft: 9,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  name: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: '#1C1B1F',
    marginRight: 6,
  },
  nameNarrow: {
    fontSize: 14,
  },
  distanceBadge: {
    backgroundColor: '#F5F5F4',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },

  distanceText: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
    color: '#44403C',
  },

  description: {
    fontSize: 13,
    lineHeight: 16,
    fontFamily: 'Inter_400Regular',
    color: '#52525B',
    marginVertical: 3,
  },

  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    rowGap: 4,
    marginTop: 2,
  },

  openTime: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
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
  },
  mapButtonNarrow: {
    paddingHorizontal: 6,
    paddingVertical: 2.5,
  },
  mapIcon: {
    marginRight: 3,
  },

  mapButtonText: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    color: '#1D4ED8',
  },
});