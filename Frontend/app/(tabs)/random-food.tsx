import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Image,
  ActivityIndicator,
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
import { FOOD_LIST, FoodItem } from '@/constants/foodData';
import { fetchNearbyRestaurants } from '@/services/restaurantService';

export default function RandomFoodScreen() {
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
      const userLat = lat || location?.coords.latitude || 14.0734;
      const userLng = lng || location?.coords.longitude || 100.6033;
      const data = await fetchNearbyRestaurants(userLat, userLng, keyword);
      setRestaurants(data || []);
    } catch (e) {
      console.warn('loadRestaurants error:', e);
    } finally {
      setRestaurantLoading(false);
    }
  };

  const getCurrentLocation = async () => {
    try {
      setLocationLoading(true);

      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        console.log('Location permission was denied');
        setLocationLoading(false);
        loadRestaurants(14.0734, 100.6033);
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setLocation(currentLocation);
      loadRestaurants(currentLocation.coords.latitude, currentLocation.coords.longitude);
    } catch (error) {
      console.log('Location error:', error);
      loadRestaurants(14.0734, 100.6033);
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

    setHasRandomized(true);
    setIsRandomizing(true);

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
    console.log('Selected restaurant:', restaurant.name);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      <Header onSearchPress={handleSearch} />

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <Text style={styles.mainTitle}>วันนี้กินอะไรดี?</Text>
        <Text style={styles.subTitle}>คิดไม่ออกใช่ไหม? ให้เราช่วยเลือก!</Text>

        {/* Food Category */}
        <MultiSelectDropdown
          options={categories}
          selectedIds={selectedCategories}
          onSelectionChange={setSelectedCategories}
          placeholder="เลือกประเภทอาหาร"
        />

        {/* Random Food Result */}
        <View style={styles.resultCard}>
          {!hasRandomized || !randomFood ? (
            <Image
              source={require('@/assets/images/kinraidee-logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.foodContainer}>
              <Image
                source={randomFood.image}
                style={styles.foodImage}
                resizeMode="contain"
              />
            </View>
          )}
        </View>

        {/* Random Button */}
        <View style={styles.randomButtonContainer}>
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

        {/* Nearby Restaurants */}
        <View style={styles.restaurantSection}>
          {/* Section Title */}
          <View style={styles.restaurantTitleRow}>
            <Text style={styles.restaurantTitle}>ร้านอาหารใกล้ฉัน</Text>
            <Text style={styles.restaurantSubtitle}></Text>
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
          {!locationLoading && !restaurantLoading &&
            restaurants.slice(0, 3).map((restaurant) => (
              <RestaurantCard
                key={restaurant.id}
                restaurant={restaurant}
                onPress={() => handleRestaurantPress(restaurant)}
              />
            ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF8F6',
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
  },
  mainTitle: {
    fontSize: 24,
    fontFamily: 'NotoSansThai_700Bold',
    color: '#241917',
    textAlign: 'center',
    marginBottom: 8,
  },
  subTitle: {
    fontSize: 14,
    fontFamily: 'NotoSansThai_400Regular',
    color: '#57423E',
    textAlign: 'center',
    marginBottom: 24,
  },
  resultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 14,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
  },
  logoImage: {
    width: 250,
    height: 250,
  },
  foodContainer: {
    alignItems: 'center',
    width: '100%',
  },
  foodImage: {
    width: '100%',
    height: 240,
    borderRadius: 16,
  },
  foodTitle: {
    fontSize: 20,
    fontFamily: 'NotoSansThai_700Bold',
    color: '#46302B',
    marginTop: 12,
    textAlign: 'center',
  },
  randomButtonContainer: {
    width: '100%',
    marginBottom: 16,
  },
  restaurantSection: {
    marginTop: 16,
    marginBottom: 20,
  },
  restaurantTitleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  restaurantTitle: {
    fontSize: 17,
    fontFamily: 'NotoSansThai_700Bold',
    color: '#241917',
  },
  restaurantSubtitle: {
    fontSize: 11,
    fontFamily: 'NotoSansThai_400Regular',
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
    fontSize: 11,
    fontFamily: 'NotoSansThai_400Regular',
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
    fontFamily: 'NotoSansThai_400Regular',
    color: '#8A7772',
  },
});