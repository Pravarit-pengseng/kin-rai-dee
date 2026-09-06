import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Header } from '@/components/Header';
import { RandomButton } from '@/components/RandomButton';
import { MultiSelectDropdown } from '@/components/MultiSelectDropdown';
import { FOOD_CATEGORIES, FoodCategory } from '@/constants/categories';
import { FoodItem } from '@/constants/foodData';
import { fetchFoodCategories } from '@/services/categoryService';
import { getRandomFood } from '@/services/foodService';

export default function RandomFoodScreen() {
  const [categories, setCategories] = useState<FoodCategory[]>(FOOD_CATEGORIES);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [hasRandomized, setHasRandomized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [randomFood, setRandomFood] = useState<FoodItem | null>(null);

  useEffect(() => {
    async function loadCategories() {
      const catList = await fetchFoodCategories();
      if (catList && catList.length > 0) {
        setCategories(catList);
      }
    }
    loadCategories();
  }, []);

  const handleSearch = () => {
    router.push('/(tabs)/search');
  };

  const handleRandomize = async () => {
    setLoading(true);
    const result = await getRandomFood(selectedCategories);
    setRandomFood(result);
    setHasRandomized(true);
    setLoading(false);
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
          {loading ? (
            <ActivityIndicator size="large" color="#DCA64E" />
          ) : !hasRandomized || !randomFood ? (
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
              <Text style={styles.foodTitle}>{randomFood.name}</Text>
            </View>
          )}
        </View>

        {!hasRandomized ? (
          <RandomButton onPress={handleRandomize} />
        ) : (
          <RandomButton onPress={handleRandomize} variant="rerandom" />
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
