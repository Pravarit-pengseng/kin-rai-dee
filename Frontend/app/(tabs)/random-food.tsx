import React, { useEffect, useState } from 'react';
import { StyleSheet, View,  Text,  ScrollView,  Image,  ActivityIndicator, } from 'react-native';
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

import { FOOD_CATEGORIES } from '@/constants/categories';
import {
  FOOD_LIST,
  FoodItem,
} from '@/constants/foodData';

const RESTAURANTS: Restaurant[] = [
  {
    id: '1',
    name: 'กะเพราตาแป๊ะ',
    image:
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5',
    description:
      'กะเพราพริกแห้งโบราณรสเข้มข้น\nไม่ใส่ถั่วฝักยาว ไข่เป็ดกรอบลาวา',
    openTime: 'เปิดตั้งแต่ 10.00 น. - 20.00 น.',
    address: 'คลองหลวง ปทุมธานี',
    distance: '800 ม.',
    rating: 4.8,
  },
  {
    id: '2',
    name: 'ครัวบ้านเรา',
    image:
      'https://images.unsplash.com/photo-1552566626-52f8b828add9',
    description:
      'อาหารตามสั่งรสเด็ด วัตถุดิบสดใหม่\nเมนูแนะนำ ข้าวผัดปู กะเพราทะเล',
    openTime: 'เปิดตั้งแต่ 09.00 น. - 21.00 น.',
    address: 'คลองหลวง ปทุมธานี',
    distance: '1.2 กม.',
    rating: 4.5,
  },
  {
    id: '3',
    name: 'กะเพราแซ่บสะท้าน',
    image:
      'https://images.unsplash.com/photo-1513104890138-7c749659a591',
    description:
      'รสชาติจัดจ้าน เผ็ดร้อนถึงใจ\nพร้อมไข่ดาวเยิ้มๆ และน้ำซุปร้อนๆ',
    openTime: 'เปิดตั้งแต่ 11.00 น. - 22.00 น.',
    address: 'รังสิต ปทุมธานี',
    distance: '1.5 กม.',
    rating: 4.6,
  },
];

export default function RandomFoodScreen() {
  const [selectedCategories, setSelectedCategories] =
    useState<string[]>([]);

  const [hasRandomized, setHasRandomized] =
    useState(false);

  const [randomFood, setRandomFood] =
    useState<FoodItem | null>(null);

  const [location, setLocation] =
    useState<Location.LocationObject | null>(null);

  const [locationLoading, setLocationLoading] =
    useState(true);

  const getCurrentLocation = async () => {
    try {
      setLocationLoading(true);

      const { status } =
        await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        console.log('Location permission was denied');

        setLocationLoading(false);
        return;
      }

      const currentLocation =
        await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

      setLocation(currentLocation);

      console.log(
        'Latitude:',
        currentLocation.coords.latitude
      );

      console.log(
        'Longitude:',
        currentLocation.coords.longitude
      );
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
    router.push('/(tabs)/search');
  };

  const handleRandomize = () => {
    const validCategoryIds =
      FOOD_CATEGORIES.map(
        (category) => category.id
      );

    const pool =
      selectedCategories.length > 0
        ? FOOD_LIST.filter((item) =>
            selectedCategories.includes(
              item.categoryId
            )
          )
        : FOOD_LIST.filter((item) =>
            validCategoryIds.includes(
              item.categoryId
            )
          );

    if (pool.length > 0) {
      const randomIndex =
        Math.floor(
          Math.random() * pool.length
        );

      setRandomFood(pool[randomIndex]);

      setHasRandomized(true);
    }
  };

  const handleRestaurantPress = (
    restaurant: Restaurant
  ) => {
    console.log(
      'Selected restaurant:',
      restaurant.name
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      <Header
        onSearchPress={handleSearch}
      />

      <ScrollView
        contentContainerStyle={
          styles.container
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <Text style={styles.mainTitle}>
          วันนี้กินอะไรดี?
        </Text>

        <Text style={styles.subTitle}>
          คิดไม่ออกใช่ไหม? ให้เราช่วยเลือก!
        </Text>

        {/* Food Category */}
        <MultiSelectDropdown
          options={FOOD_CATEGORIES}
          selectedIds={selectedCategories}
          onSelectionChange={
            setSelectedCategories
          }
          placeholder="เลือกประเภทอาหาร"
        />

        {/* Random Food Result */}
        <View style={styles.resultCard}>
          <View style={styles.imageContainer}>
            {!hasRandomized || !randomFood ? (
              <Image
                source={require('@/assets/images/kinraidee-logo.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            ) : (
              <Image
                source={randomFood.image}
                style={styles.foodImage}
                resizeMode="contain"
              />
            )}
          </View>

          {/* Random Button */}
          <View style={styles.randomButtonContainer}>
            {!hasRandomized ? (
              <RandomButton
                onPress={handleRandomize}
                title="สุ่มอาหาร"
                iconName="dice"
              />
            ) : (
              <RandomButton
                onPress={handleRandomize}
                variant="rerandom"
              />
            )}
          </View>
        </View>

        {/* Nearby Restaurants */}
        <View
          style={styles.restaurantSection}
        >
          {/* Section Title */}
          <View
            style={styles.restaurantTitleRow}
          >
            <Text
              style={
                styles.restaurantTitle
              }
            >
              ร้านอาหารใกล้ฉัน
            </Text>

            <Text
              style={
                styles.restaurantSubtitle
              }
            >
            </Text>
          </View>

          {/* Loading Location */}
          {locationLoading && (
            <View
              style={
                styles.loadingContainer
              }
            >
              <ActivityIndicator
                size="small"
              />

              <Text
                style={styles.loadingText}
              >
                กำลังค้นหาตำแหน่ง...
              </Text>
            </View>
          )}

          {/* Location Permission Denied */}
          {!locationLoading &&
            !location && (
              <View
                style={
                  styles.locationWarning
                }
              >
                <Text
                  style={
                    styles.locationWarningText
                  }
                >
                  ไม่สามารถเข้าถึงตำแหน่งของคุณได้
                </Text>
              </View>
            )}

          {/* Restaurant List */}
          {!locationLoading &&
            RESTAURANTS.slice(0, 3).map(
              (restaurant) => (
                <RestaurantCard
                  key={restaurant.id}
                  restaurant={restaurant}
                  onPress={() =>
                    handleRestaurantPress(
                      restaurant
                    )
                  }
                />
              )
            )}
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
    fontFamily:
      'NotoSansThai_700Bold',
    color: '#241917',
    textAlign: 'center',
    marginBottom: 8,
  },

  subTitle: {
    fontSize: 14,
    fontFamily:
      'NotoSansThai_400Regular',
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

  imageContainer: {
    width: '100%',
    height: 280,
    alignItems: 'center',
    justifyContent: 'center',
  },

  logoImage: {
    width: 250,
    height: 250,
  },

  foodImage: {
    width: '100%',
    height: 280,
    borderRadius: 16,
  },

  randomButtonContainer: {
    width: '80%',
    marginTop: -20,
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
    fontFamily:
      'NotoSansThai_700Bold',
    color: '#241917',
  },

  restaurantSubtitle: {
    fontSize: 11,
    fontFamily:
      'NotoSansThai_400Regular',
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
    fontFamily:
      'NotoSansThai_400Regular',
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
    fontFamily:
      'NotoSansThai_400Regular',
    color: '#8A7772',
  },
});