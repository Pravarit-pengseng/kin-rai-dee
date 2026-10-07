import {  View,  Text,  Image,  StyleSheet,  TouchableOpacity,  Linking,} from 'react-native';
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
      style={styles.card}
      activeOpacity={0.85}
      onPress={onPress}
    >
      {/* Restaurant Image */}
      {restaurant.image ? (
        <Image
          source={{
            uri: restaurant.image,
          }}
          style={styles.image}
          resizeMode="cover"
        />
      ) : (
        <View
          style={[
            styles.image,
            styles.imagePlaceholder,
          ]}
        >
          <Text style={styles.placeholderText}>
            ไม่มีรูป
          </Text>
        </View>
      )}

      {/* Restaurant Information */}
      <View style={styles.content}>
        {/* Row 1: Name + Distance */}
        <View style={styles.headerRow}>
          <Text
            style={styles.name}
            numberOfLines={1}
          >
            {restaurant.name}
          </Text>

          {restaurant.distance && (
            <View style={styles.distanceBadge}>
              <Text style={styles.distanceText}>
                {restaurant.distance}
              </Text>
            </View>
          )}
        </View>

        {/* Row 2: Description */}
        {restaurant.description ? (
          <Text
            style={styles.description}
            numberOfLines={2}
          >
            {restaurant.description}
          </Text>
        ) : restaurant.address ? (
          <Text
            style={styles.description}
            numberOfLines={2}
          >
            {restaurant.address}
          </Text>
        ) : null}

        {/* Row 3: Open Time + Map Button */}
        <View style={styles.footerRow}>
          <Text style={styles.openTime} numberOfLines={1}>
            {restaurant.openTime || 'เปิดตั้งแต่ 10.00 น. - 20.00 น.'}
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
            <Text style={styles.mapButtonText}>
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

  image: {
    width: 88,
    height: 88,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
  },

  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  placeholderText: {
    fontSize: 10,
    color: '#9CA3AF',
    fontFamily: 'NotoSansThai_400Regular',
  },

  content: {
    flex: 1,
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
    fontFamily: 'NotoSansThai_700Bold',
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
    fontFamily: 'NotoSansThai_700Bold',
    color: '#44403C',
  },

  description: {
    fontSize: 13,
    lineHeight: 16,
    fontFamily: 'NotoSansThai_400Regular',
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
    fontFamily: 'NotoSansThai_500Medium',
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

  mapIcon: {
    marginRight: 3,
  },

  mapButtonText: {
    fontSize: 12,
    fontFamily: 'NotoSansThai_700Bold',
    color: '#1D4ED8',
  },
});