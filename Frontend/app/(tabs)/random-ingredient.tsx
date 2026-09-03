import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, Image, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Header } from '@/components/Header';
import { RandomButton } from '@/components/RandomButton';
import { FOOD_LIST, FoodItem } from '@/constants/foodData';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function RandomIngredientScreen() {
  const [isVegSelected, setIsVegSelected] = useState(false);
  const [isMeatSelected, setIsMeatSelected] = useState(false);
  const [hasRandomized, setHasRandomized] = useState(false);

  const [randomVeg, setRandomVeg] = useState<FoodItem | null>(null);
  const [randomMeat, setRandomMeat] = useState<FoodItem | null>(null);

  const handleSearch = () => {
    console.log('Search pressed');
  };

  const handleRandomize = () => {
    if (!isVegSelected && !isMeatSelected) {
      Alert.alert('แจ้งเตือน', 'กรุณาเลือกหมวดวัตถุดิบอย่างน้อย 1 อย่างก่อนกดสุ่ม');
      return;
    }

    if (isVegSelected) {
      const vegPool = FOOD_LIST.filter(item => item.categoryId === '7'); // 7 = ผัก
      if (vegPool.length > 0) {
        setRandomVeg(vegPool[Math.floor(Math.random() * vegPool.length)]);
      }
    } else {
      setRandomVeg(null);
    }

    if (isMeatSelected) {
      const meatPool = FOOD_LIST.filter(item => item.categoryId === '5'); // 5 = เนื้อสัตว์
      if (meatPool.length > 0) {
        setRandomMeat(meatPool[Math.floor(Math.random() * meatPool.length)]);
      }
    } else {
      setRandomMeat(null);
    }

    setHasRandomized(true);
  };

  const renderCard = (food: FoodItem) => (
    <View style={[styles.resultCard, styles.halfCard]}>
      <Image
        source={food.image}
        style={styles.foodImageHalf}
        resizeMode="cover"
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <Header onSearchPress={handleSearch} />

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.mainTitle}>อยากทำอาหารแต่คิดวัตถุดิบไม่ออก?</Text>
        <Text style={styles.subTitle}>แตะเลือกหมวดวัตถุดิบที่ต้องการก่อนกดสุ่ม</Text>

        {/* Category Toggles */}
        <View style={styles.toggleContainer}>
          <Pressable
            style={[styles.toggleBox, isVegSelected ? styles.vegSelected : styles.unselected]}
            onPress={() => {
              setIsVegSelected(!isVegSelected);
              setHasRandomized(false);
            }}
          >
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons
                name="flower"
                size={32}
                color={isVegSelected ? '#2A6B4E' : '#687076'}
              />
            </View>
            <Text style={[styles.toggleText, isVegSelected ? styles.vegText : styles.unselectedText]}>
              ผัก
            </Text>
          </Pressable>

          <Pressable
            style={[styles.toggleBox, isMeatSelected ? styles.meatSelected : styles.unselected]}
            onPress={() => {
              setIsMeatSelected(!isMeatSelected);
              setHasRandomized(false);
            }}
          >
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons
                name="pot-steam"
                size={32}
                color={isMeatSelected ? '#A5352A' : '#687076'}
              />
            </View>
            <Text style={[styles.toggleText, isMeatSelected ? styles.meatText : styles.unselectedText]}>
              เนื้อสัตว์
            </Text>
          </Pressable>
        </View>

        {/* Display Area for Logo or Result */}
        <View style={styles.resultsArea}>
          {!hasRandomized || (!isVegSelected && !isMeatSelected) ? (
            <View style={styles.resultCardFull}>
              <Image
                source={require('@/assets/images/kinraidee-logo.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
          ) : (
            <View style={isVegSelected && isMeatSelected ? styles.rowResults : styles.singleResult}>
              {isVegSelected && randomVeg && renderCard(randomVeg)}
              {isMeatSelected && randomMeat && renderCard(randomMeat)}
            </View>
          )}
        </View>

        {/* Randomize Button */}
        {!hasRandomized || (!isVegSelected && !isMeatSelected) ? (
          <RandomButton onPress={handleRandomize} title="สุ่มวัตถุดิบ" iconName="dice" />
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
    paddingTop: 18,
    paddingBottom: 40,
  },
  mainTitle: {
    fontSize: 22,
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
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 16,
  },
  toggleBox: {
    flex: 1,
    height: 135,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    // shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  unselected: {
    backgroundColor: '#E5E5E5', // Gray
    borderColor: '#D0D5DD',
  },
  vegSelected: {
    backgroundColor: '#A5E3C5', // Light green
    borderColor: '#81ac99ff',
  },
  meatSelected: {
    backgroundColor: '#F6D0CE', // Light pink/red
    borderColor: '#c18079ff',
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  toggleText: {
    fontSize: 18,
    fontFamily: 'NotoSansThai_700Bold',
  },
  unselectedText: {
    color: '#687076',
  },
  vegText: {
    color: '#2A6B4E',
  },
  meatText: {
    color: '#A5352A',
  },
  resultsArea: {
    marginVertical: 10,
  },
  resultCardFull: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    height: 245,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
  },
  logoImage: {
    width: 160,
    height: 160,
  },
  rowResults: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  singleResult: {
    alignItems: 'center',
  },
  resultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
    width: '100%',
  },
  halfCard: {
    width: 165,
    height: 245,
    borderRadius: 16,
    padding: 0, // override base padding
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  foodImageFull: {
    width: '100%',
    height: 260,
    borderRadius: 16,
  },
  foodImageHalf: {
    width: '100%',
    height: '100%',
  },
  foodName: {
    fontSize: 20,
    fontFamily: 'NotoSansThai_700Bold',
    color: '#5A4A42', // Dark brown
    textAlign: 'center',
  },
});
