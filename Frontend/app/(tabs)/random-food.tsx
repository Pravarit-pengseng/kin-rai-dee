import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Header } from '@/components/Header';
import { RandomButton } from '@/components/RandomButton';
import { MultiSelectDropdown } from '@/components/MultiSelectDropdown';
import { FOOD_CATEGORIES } from '@/constants/categories';
import { FOOD_LIST, FoodItem } from '@/constants/foodData';

export default function RandomFoodScreen() {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]); // Empty default
  const [hasRandomized, setHasRandomized] = useState(false);
  const [randomFood, setRandomFood] = useState<FoodItem | null>(null);

  const handleSearch = () => {
    console.log('Search pressed');
  };

  const handleRandomize = () => {
    // Get all valid food category IDs (excluding ingredients like meat and vegetables)
    const validCategoryIds = FOOD_CATEGORIES.map(c => c.id);

    // Filter pool based on selected categories (if empty, pick from all valid food categories)
    const pool = selectedCategories.length > 0
      ? FOOD_LIST.filter(item => selectedCategories.includes(item.categoryId))
      : FOOD_LIST.filter(item => validCategoryIds.includes(item.categoryId));

    if (pool.length > 0) {
      const randomIndex = Math.floor(Math.random() * pool.length);
      setRandomFood(pool[randomIndex]);
      setHasRandomized(true);
    }
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
          options={FOOD_CATEGORIES}
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
            <Image
              source={randomFood.image}
              style={styles.foodImage}
              resizeMode="contain"
            />
          )}
        </View>

        {!hasRandomized ? (
          <RandomButton onPress={handleRandomize} />
        ) : (
          <RandomButton
            onPress={handleRandomize}
            title="สุ่มใหม่อีกครั้ง"
            backgroundColor="#FADCD9"
            textColor="#A5352A"
            iconColor="#A5352A"
            iconName="redo"
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAF6F3', // Light pink/beige background
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 10,
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
    // Add shadow
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
  foodImage: {
    width: '100%',
    height: 260,
    borderRadius: 16,
  },
});
