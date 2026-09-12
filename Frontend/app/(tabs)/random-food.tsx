import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Header } from '@/components/Header';
import { RandomButton } from '@/components/RandomButton';
import { MultiSelectDropdown } from '@/components/MultiSelectDropdown';
import { FOOD_CATEGORIES, FoodCategory } from '@/constants/categories';
import { FOOD_LIST, FoodItem } from '@/constants/foodData';

export default function RandomFoodScreen() {
  const [categories, setCategories] = useState<FoodCategory[]>(FOOD_CATEGORIES);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [hasRandomized, setHasRandomized] = useState(false);
  const [isRandomizing, setIsRandomizing] = useState(false);
  const [randomFood, setRandomFood] = useState<FoodItem | null>(null);

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

      setRandomFood(pool[randomIndex]);

      count++;

      if (count >= maxCount) {
        clearInterval(intervalId);
        setIsRandomizing(false);
      }
    }, 100);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <Header onSearchPress={handleSearch} />

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.mainTitle}>วันนี้กินอะไรดี?</Text>
        <Text style={styles.subTitle}>คิดไม่ออกใช่ไหม? ให้เราช่วยเลือก!</Text>

        <MultiSelectDropdown
          options={categories}
          selectedIds={selectedCategories}
          onSelectionChange={setSelectedCategories}
          placeholder="เลือกประเภทอาหาร"
        />

        {/* Display Area for Logo or Result */}
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

        {!hasRandomized ? (
          <RandomButton onPress={handleRandomize} disabled={isRandomizing} />
        ) : (
          <RandomButton onPress={handleRandomize} variant="rerandom" disabled={isRandomizing} />
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
  container: {
    paddingHorizontal: 20,
    paddingTop: 18,
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
    minHeight: 320,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
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
});
