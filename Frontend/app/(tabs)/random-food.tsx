import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Image,
  ActivityIndicator,
  Linking,
  useWindowDimensions,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';
import { router } from 'expo-router';

import { Header } from '@/components/Header';
import { RandomButton } from '@/components/RandomButton';
import { MultiSelectDropdown } from '@/components/MultiSelectDropdown';
import {
  RestaurantCard,
  Restaurant,
} from '@/components/restuarant-card';

import { FOOD_CATEGORIES, FoodCategory } from '@/constants/categories';
import { Typography } from '@/constants/typography';
import { FOOD_LIST, FoodItem } from '@/constants/foodData';
import { fetchNearbyRestaurants } from '@/services/restaurantService';

export default function RandomFoodScreen() {
  // React Native ใช้หน่วย dp (ไม่ใช่ physical pixels) และจะอัปเดตเมื่อหมุนจอ
  const { width, height } = useWindowDimensions();
  const isNarrowScreen = width <= 360;
  const isCompactHeight = height <= 800;
  const isVeryShortScreen = height < 700;

  // จำกัดความกว้างเนื้อหาบนจอใหญ่ และลดระยะห่างสำหรับมือถือจอเล็ก
  const horizontalPadding = width < 340 ? 12 : width <= 390 ? 16 : 20;
  const cardPadding = isNarrowScreen ? 16 : 24;
  const availableArtworkWidth = Math.max(
    1,
    Math.min(width, 560) - horizontalPadding * 2 - cardPadding * 2
  );
  const logoSize = Math.min(
    availableArtworkWidth,
    isVeryShortScreen ? 190 : isCompactHeight ? 220 : 250
  );
  const foodImageHeight = Math.min(
    availableArtworkWidth * 0.85,
    isVeryShortScreen ? 180 : isCompactHeight ? 210 : 240
  );
  const [categories] = useState<FoodCategory[]>(FOOD_CATEGORIES);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [hasRandomized, setHasRandomized] = useState(false);
  const [isRandomizing, setIsRandomizing] = useState(false);
  const [randomFood, setRandomFood] = useState<FoodItem | null>(null);

  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [restaurantLoading, setRestaurantLoading] = useState(false);

  const loadRestaurants = async (lat?: number, lng?: number, keyword?: string) => {
    try {
      setRestaurantLoading(true);
      const userLat = lat ?? location?.coords.latitude ?? 14.0734;
      const userLng = lng ?? location?.coords.longitude ?? 100.6033;
      const data = await fetchNearbyRestaurants(userLat, userLng, keyword);
      setRestaurants(data || []);
    } catch (e) {
      console.log('loadRestaurants error:', e);
    } finally {
      setRestaurantLoading(false);
    }
  };

  const getCurrentLocation = async () => {
    try {
      setLocationLoading(true);

      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        console.log('Location permission not granted, using default coordinates');
        return;
      }

      let currentLocation = await Location.getLastKnownPositionAsync({});
      if (!currentLocation) {
        currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
      }

      if (currentLocation) {
        setLocation(currentLocation);
      }
    } catch (error) {
      console.log('Location error:', error);
    } finally {
      setLocationLoading(false);
    }
  };

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const handleSearch = () => {
    router.push('/(tabs)/search?from=/(tabs)/random-food');
  };

  const handleRandomize = () => {
    if (isRandomizing) return;

    const pool =
      selectedCategories.length > 0
        ? FOOD_LIST.filter((item) =>
            selectedCategories.includes(String(item.categoryId))
          )
        : FOOD_LIST;

    if (pool.length === 0) return;

    setIsRandomizing(true);
    if (hasRandomized) {
      setRestaurants([]);
      setRestaurantLoading(true);
    }

    let count = 0;
    const maxCount = 15;

    const intervalId = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * pool.length);
      const chosen = pool[randomIndex];

      setRandomFood(chosen);

      count++;

      if (count >= maxCount) {
        clearInterval(intervalId);
        setIsRandomizing(false);
        setHasRandomized(true);
        // Load nearby restaurants selling this randomized food
        loadRestaurants(
          location?.coords.latitude,
          location?.coords.longitude,
          chosen.name
        );
      }
    }, 100);
  };

  const handleRestaurantPress = (restaurant: Restaurant) => {
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
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      <Header onSearchPress={handleSearch} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.container,
          {
            paddingHorizontal: horizontalPadding,
            paddingTop: isVeryShortScreen ? 4 : 8,
            paddingBottom: isCompactHeight ? 28 : 40,
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Title */}
        <Text style={[styles.mainTitle, isNarrowScreen && styles.mainTitleCompact]}>วันนี้กินอะไรดี?</Text>
        <Text
          style={[
            styles.subTitle,
            isNarrowScreen && styles.subTitleCompact,
            isCompactHeight && styles.subTitleShort,
          ]}
        >คิดไม่ออกใช่ไหม? ให้เราช่วยเลือก!</Text>

        {/* Food Category */}
        <MultiSelectDropdown
          options={categories}
          selectedIds={selectedCategories}
          onSelectionChange={setSelectedCategories}
          placeholder="เลือกประเภทอาหาร"
        />

        {/* Random Food Result */}
        <View
          style={[
            styles.resultCard,
            {
              padding: cardPadding,
              marginVertical: isCompactHeight ? 10 : 14,
              borderRadius: isNarrowScreen ? 20 : 24,
            },
          ]}
        >
          {(!hasRandomized && !isRandomizing) || !randomFood ? (
            <Image
              source={require('@/assets/images/kinraidee-logo.png')}
              style={{ width: logoSize, height: logoSize }}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.foodContainer}>
              <Image
                source={randomFood.image}
                style={[styles.foodImage, { height: foodImageHeight }]}
                resizeMode="contain"
              />
            </View>
          )}
                  {/* Random Button */}
        <View
          style={[
            styles.randomButtonContainer,
            isCompactHeight && styles.randomButtonContainerCompact,
          ]}
        >
          {!hasRandomized ? (
            <RandomButton
              onPress={handleRandomize}
              title="สุ่มอาหาร"
              iconName="dice"
              paddingVertical={12}
              disabled={isRandomizing}
            />
          ) : (
            <RandomButton
              onPress={handleRandomize}
              variant="rerandom"
              paddingVertical={12}
              disabled={isRandomizing}
            />
          )}
        </View>

        </View>


        {/* Nearby Restaurants */}
        {hasRandomized && (
          <View style={styles.restaurantSection}>
            {/* Section Title */}
            <View style={styles.restaurantTitleRow}>
              <Text style={styles.restaurantTitle}>ร้านอาหารใกล้ฉัน</Text>
            </View>

            {/* Loading Location or Restaurants */}
            {(locationLoading || restaurantLoading) && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#DCA64E" />
                <Text style={styles.loadingText}>
                  {locationLoading ? 'กำลังค้นหาตำแหน่ง...' : 'กำลังค้นหาร้านอาหารใกล้เคียง...'}
                </Text>
              </View>
            )}

            {/* Location Permission Denied */}
            {!locationLoading && !location && (
              <View style={styles.locationWarning}>
                <Text style={styles.locationWarningText}>
                  ไม่สามารถเข้าถึงตำแหน่งของคุณได้ (แสดงข้อมูลร้านอาหารแนะนำ)
                </Text>
              </View>
            )}

            {/* Restaurant List */}
            {!locationLoading && !restaurantLoading && restaurants.length > 0 &&
              restaurants.slice(0, 5).map((restaurant) => (
                <RestaurantCard
                  key={restaurant.id}
                  restaurant={restaurant}
                  onPress={() => handleRestaurantPress(restaurant)}
                />
              ))}

            {/* Empty State */}
            {!locationLoading && !restaurantLoading && restaurants.length === 0 && (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  ไม่พบข้อมูลร้านอาหารในบริเวณนี้
                </Text>
              </View>
            )}

          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF8F6',
  },
  scrollView: {
    flex: 1,
  },
  container: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    flexGrow: 1,
  },
  mainTitle: {
    fontSize: 24,
    fontFamily: Typography.bold,
    color: '#241917',
    textAlign: 'center',
    marginBottom: 8,
  },
  mainTitleCompact: {
    fontSize: 22,
  },
  subTitle: {
    fontSize: 14,
    fontFamily: Typography.regular,
    color: '#57423E',
    textAlign: 'center',
    marginBottom: 24,
  },
  subTitleCompact: {
    fontSize: 13,
  },
  subTitleShort: {
    marginBottom: 16,
  },
  resultCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
  },
  foodContainer: {
    alignItems: 'center',
    width: '100%',
  },
  foodImage: {
    width: '100%',
    borderRadius: 16,
  },
  foodTitle: {
    fontSize: 20,
    fontFamily: Typography.bold,
    color: '#46302B',
    marginTop: 12,
    textAlign: 'center',
  },
  randomButtonContainer: {
    width: '60%',
  },
  randomButtonContainerCompact: {
    // marginBottom: 12,
  },
  restaurantSection: {
    marginTop: 16,
    marginBottom: 20,
  },
  restaurantTitleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  restaurantTitle: {
    flexShrink: 1,
    fontSize: 17,
    fontFamily: Typography.bold,
    color: '#241917',
  },
  restaurantSubtitle: {
    fontSize: 11,
    fontFamily: Typography.regular,
    color: '#8A7772',
    marginLeft: 5,
  },
  loadingContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  loadingText: {
    marginTop: 8,
    paddingHorizontal: 12,
    textAlign: 'center',
    fontSize: 11,
    fontFamily: Typography.regular,
    color: '#75625E',
  },
  locationWarning: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  locationWarningText: {
    fontSize: 11,
    textAlign: 'center',
    fontFamily: Typography.regular,
    color: '#8A7772',
  },
  emptyContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 13,
    fontFamily: Typography.regular,
    color: '#8A7772',
  },
});
