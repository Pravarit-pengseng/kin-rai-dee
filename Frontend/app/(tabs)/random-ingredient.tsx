import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Image,
  Pressable,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Header } from '@/components/Header';
import { RandomButton } from '@/components/RandomButton';
import {
  INGREDIENT_LIST,
  IngredientItem,
} from '@/constants/ingredientData';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function RandomIngredientScreen() {
  const [isVegSelected, setIsVegSelected] = useState(false);
  const [isMeatSelected, setIsMeatSelected] = useState(false);
  const [hasRandomized, setHasRandomized] = useState(false);
  const [isRandomizing, setIsRandomizing] = useState(false);

  const [randomVeg, setRandomVeg] = useState<IngredientItem | null>(null);
  const [randomMeat, setRandomMeat] = useState<IngredientItem | null>(null);

  const handleSearch = () => {
    router.push('/(tabs)/search');
  };

  const handleRandomize = () => {
    if (!isVegSelected && !isMeatSelected) {
      Alert.alert(
        'แจ้งเตือน',
        'กรุณาเลือกหมวดวัตถุดิบอย่างน้อย 1 อย่างก่อนกดสุ่ม'
      );
      return;
    }

    if (isRandomizing) return;

    // DB:
    // ingredient category 1 = เนื้อสัตว์
    // ingredient category 2 = ผัก
    const vegPool = INGREDIENT_LIST.filter(
      (item) => item.categoryId === '2'
    );

    const meatPool = INGREDIENT_LIST.filter(
      (item) => item.categoryId === '1'
    );

    // ป้องกันกรณีเลือกหมวดที่ไม่มีข้อมูล
    if (
      (isVegSelected && vegPool.length === 0) ||
      (isMeatSelected && meatPool.length === 0)
    ) {
      Alert.alert(
        'แจ้งเตือน',
        'ไม่พบข้อมูลวัตถุดิบในหมวดที่เลือก'
      );
      return;
    }

    setHasRandomized(true);
    setIsRandomizing(true);

    // ล้างผลลัพธ์ของหมวดที่ไม่ได้เลือก
    if (!isVegSelected) {
      setRandomVeg(null);
    }

    if (!isMeatSelected) {
      setRandomMeat(null);
    }

    let count = 0;
    const maxCount = 15;

    // Frontend เป็นคนสุ่มเอง
    const intervalId = setInterval(() => {
      if (isVegSelected && vegPool.length > 0) {
        const randomIndex = Math.floor(
          Math.random() * vegPool.length
        );

        setRandomVeg(vegPool[randomIndex]);
      }

      if (isMeatSelected && meatPool.length > 0) {
        const randomIndex = Math.floor(
          Math.random() * meatPool.length
        );

        setRandomMeat(meatPool[randomIndex]);
      }

      count++;

      if (count >= maxCount) {
        clearInterval(intervalId);
        setIsRandomizing(false);
      }
    }, 100);
  };

  const renderCard = (ingredient: IngredientItem) => (
    <View style={[styles.resultCard, styles.halfCard]}>
      <Image
        source={ingredient.image}
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
        <Text style={styles.mainTitle}>
          อยากทำอาหารแต่คิดวัตถุดิบไม่ออก?
        </Text>

        <Text style={styles.subTitle}>
          แตะเลือกหมวดวัตถุดิบที่ต้องการก่อนกดสุ่ม
        </Text>

        {/* Category Toggles */}
        <View style={styles.toggleContainer}>
          {/* ผัก */}
          <Pressable
            style={({ pressed }) => [
              styles.toggleBox,
              isVegSelected
                ? styles.vegSelected
                : styles.unselected,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => {
              setIsVegSelected(!isVegSelected);
              setHasRandomized(false);
              setRandomVeg(null);
            }}
          >
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons
                name="flower"
                size={32}
                color={
                  isVegSelected
                    ? '#2A6B4E'
                    : '#687076'
                }
              />
            </View>

            <Text
              style={[
                styles.toggleText,
                isVegSelected
                  ? styles.vegText
                  : styles.unselectedText,
              ]}
            >
              ผัก
            </Text>
          </Pressable>

          {/* เนื้อสัตว์ */}
          <Pressable
            style={({ pressed }) => [
              styles.toggleBox,
              isMeatSelected
                ? styles.meatSelected
                : styles.unselected,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => {
              setIsMeatSelected(!isMeatSelected);
              setHasRandomized(false);
              setRandomMeat(null);
            }}
          >
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons
                name="pot-steam"
                size={32}
                color={
                  isMeatSelected
                    ? '#A5352A'
                    : '#687076'
                }
              />
            </View>

            <Text
              style={[
                styles.toggleText,
                isMeatSelected
                  ? styles.meatText
                  : styles.unselectedText,
              ]}
            >
              เนื้อสัตว์
            </Text>
          </Pressable>
        </View>

        {/* Display Area */}
        <View style={styles.resultsArea}>
          {!hasRandomized ||
            (!isVegSelected && !isMeatSelected) ? (
            <View style={styles.resultCardFull}>
              <Image
                source={require('@/assets/images/kinraidee-logo.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
          ) : (
            <View
              style={
                isVegSelected && isMeatSelected
                  ? styles.rowResults
                  : styles.singleResult
              }
            >
              {isVegSelected &&
                randomVeg &&
                renderCard(randomVeg)}

              {isMeatSelected &&
                randomMeat &&
                renderCard(randomMeat)}
            </View>
          )}
        </View>

        {/* Randomize Button */}
        {!hasRandomized ||
          (!isVegSelected && !isMeatSelected) ? (
          <RandomButton
            onPress={handleRandomize}
            title="สุ่มวัตถุดิบ"
            iconName="dice"
            disabled={isRandomizing}
          />
        ) : (
          <RandomButton
            onPress={handleRandomize}
            variant="rerandom"
            disabled={isRandomizing}
          />
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
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  unselected: {
    backgroundColor: '#E5E5E5',
    borderColor: '#D0D5DD',
  },

  vegSelected: {
    backgroundColor: '#A5E3C5',
    borderColor: '#81ac99ff',
  },

  meatSelected: {
    backgroundColor: '#F6D0CE',
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
    shadowOffset: {
      width: 0,
      height: 4,
    },
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
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
    width: '100%',
  },

  halfCard: {
    width: 165,
    height: 245,
    borderRadius: 16,
    padding: 0,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  foodImageHalf: {
    width: '100%',
    height: '100%',
  },



  buttonPressed: {
    opacity: 0.8,
    transform: [
      {
        translateY: 2,
      },
    ],
  },
});