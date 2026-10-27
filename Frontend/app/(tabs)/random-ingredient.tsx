import React, { useEffect, useRef, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { INGREDIENT_LIST, IngredientItem } from '@/constants/ingredientData';
import { Typography } from '@/constants/typography';
import { RandomButton } from '@/components/RandomButton';
import AlertPopup, { useAlertPopup } from '@/components/AlertPopup';

const MAX_CONTENT_WIDTH = 430;
const LOGO_CARD_WIDTH = 348;
const LOGO_CARD_HEIGHT = 230;
const LOGO_IMAGE_SIZE = 170;

const INGREDIENT_CARD_ASPECT_RATIO = 330 / 460;
const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export default function RandomIngredientScreen() {
  const { width, height } = useWindowDimensions();
  const isNarrow = width <= 360;
  const isShort = height < 720;

  const sidePadding = isNarrow ? 16 : 20;
  const cardGap = isNarrow ? 12 : 16;
  const contentWidth = Math.min(width - sidePadding * 2, MAX_CONTENT_WIDTH);
  const cardWidth = Math.floor((contentWidth - cardGap) / 2);
  const toggleHeight = Math.round(clamp(cardWidth * 0.85, 122, 145));
  const iconCircleSize = Math.round(clamp(cardWidth * 0.4, 54, 64));
  const iconSize = Math.round(iconCircleSize * 0.5);
  const ingredientCardHeight = Math.round(cardWidth / INGREDIENT_CARD_ASPECT_RATIO);

  const [isVegSelected, setIsVegSelected] = useState(false);
  const [isMeatSelected, setIsMeatSelected] = useState(false);
  const [hasRandomized, setHasRandomized] = useState(false);
  const [isRandomizing, setIsRandomizing] = useState(false);
  const [randomVeg, setRandomVeg] = useState<IngredientItem | null>(null);
  const [randomMeat, setRandomMeat] = useState<IngredientItem | null>(null);

  const { alertProps, show: showAlert, hide: hideAlert } = useAlertPopup();

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current !== null) clearInterval(intervalRef.current);
    };
  }, []);

  const handleSearch = () => {
    router.push('/(tabs)/search?from=/(tabs)/random-ingredient');
  };

  const resetRandomResult = () => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRandomizing(false);
    setHasRandomized(false);
    setRandomVeg(null);
    setRandomMeat(null);
  };

  const handleRandomize = () => {
    if (isRandomizing) return;

    if (!isVegSelected && !isMeatSelected) {
      showAlert('แจ้งเตือน', 'กรุณาเลือกหมวดวัตถุดิบอย่างน้อย 1 อย่างก่อนกดสุ่ม');
      return;
    }

    const vegPool = INGREDIENT_LIST.filter(item => String(item.categoryId) === '2');
    const meatPool = INGREDIENT_LIST.filter(item => String(item.categoryId) === '1');

    if ((isVegSelected && vegPool.length === 0) ||
        (isMeatSelected && meatPool.length === 0)) {
      showAlert('แจ้งเตือน', 'ไม่พบข้อมูลวัตถุดิบในหมวดที่เลือก');
      return;
    }

    setIsRandomizing(true);
    setHasRandomized(true);
    setRandomVeg(null);
    setRandomMeat(null);

    let count = 0;
    intervalRef.current = setInterval(() => {
      if (isVegSelected) {
        setRandomVeg(vegPool[Math.floor(Math.random() * vegPool.length)]);
      }
      if (isMeatSelected) {
        setRandomMeat(meatPool[Math.floor(Math.random() * meatPool.length)]);
      }

      count += 1;
      if (count >= 15) {
        if (intervalRef.current !== null) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        setIsRandomizing(false);
      }
    }, 100);
  };

  const renderIngredientCard = (ingredient: IngredientItem) => (
    <Image
      key={`${ingredient.categoryId}-${ingredient.name}`}
      source={ingredient.image}
      style={[
        styles.ingredientCardImage,
        { width: cardWidth, height: ingredientCardHeight },
      ]}
      resizeMode="contain"
      accessibilityLabel={ingredient.name}
    />
  );

  const showResults = hasRandomized && (isVegSelected || isMeatSelected);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />

      <AlertPopup {...alertProps} onRequestClose={hideAlert} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>KIN RAI DEE</Text>
        <Pressable
          onPress={handleSearch}
          accessibilityRole="button"
          accessibilityLabel="ค้นหา"
          hitSlop={10}
          style={({ pressed }) => [styles.searchButton, pressed && { opacity: 0.6 }]}
        >
          <MaterialCommunityIcons name="magnify" size={24} color="#4D3C38" />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: sidePadding, paddingTop: isShort ? 12 : 18 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.pageContent, { maxWidth: MAX_CONTENT_WIDTH }]}>
          <Text style={[styles.mainTitle, { fontSize: isNarrow ? 19 : 20 }]}>
            อยากทำอาหารแต่คิดวัตถุดิบไม่ออก?
          </Text>
          <Text style={[styles.subTitle, { fontSize: isNarrow ? 12 : 13 }]}>
            แตะเลือกหมวดวัตถุดิบที่ต้องการก่อนกดสุ่ม
          </Text>

          <View style={[styles.toggleContainer, { gap: cardGap, marginBottom: isShort ? 14 : 18 }]}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: isVegSelected }}
              onPress={() => {
                setIsVegSelected(prev => !prev);
                resetRandomResult();
              }}
              style={({ pressed }) => [
                styles.toggleBox,
                { width: cardWidth, height: toggleHeight },
                isVegSelected ? styles.vegSelected : styles.unselected,
                pressed && styles.buttonPressed,
              ]}
            >
              <View style={[
                styles.iconCircle,
                { width: iconCircleSize, height: iconCircleSize, borderRadius: iconCircleSize / 2 },
              ]}>
                <MaterialCommunityIcons
                  name="flower"
                  size={iconSize}
                  color={isVegSelected ? '#2A6B4E' : '#687076'}
                />
              </View>
              <Text style={[
                styles.toggleText,
                { fontSize: isNarrow ? 16 : 18 },
                isVegSelected ? styles.vegText : styles.unselectedText,
              ]}>
                ผัก
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: isMeatSelected }}
              onPress={() => {
                setIsMeatSelected(prev => !prev);
                resetRandomResult();
              }}
              style={({ pressed }) => [
                styles.toggleBox,
                { width: cardWidth, height: toggleHeight },
                isMeatSelected ? styles.meatSelected : styles.unselected,
                pressed && styles.buttonPressed,
              ]}
            >
              <View style={[
                styles.iconCircle,
                { width: iconCircleSize, height: iconCircleSize, borderRadius: iconCircleSize / 2 },
              ]}>
                <MaterialCommunityIcons
                  name="pot-steam"
                  size={iconSize}
                  color={isMeatSelected ? '#A5352A' : '#687076'}
                />
              </View>
              <Text style={[
                styles.toggleText,
                { fontSize: isNarrow ? 16 : 18 },
                isMeatSelected ? styles.meatText : styles.unselectedText,
              ]}>
                เนื้อสัตว์
              </Text>
            </Pressable>
          </View>

          <View style={[styles.resultsArea, { minHeight: showResults ? undefined : LOGO_CARD_HEIGHT }]}>
            {!showResults ? (
              <View style={styles.placeholderCard}>
                <Image
                  source={require('@/assets/images/kinraidee-logo.png')}
                  style={styles.placeholderLogo}
                  resizeMode="contain"
                />
              </View>
            ) : (
              <View style={[styles.resultRow, { gap: cardGap }]}>
                {isVegSelected && randomVeg && renderIngredientCard(randomVeg)}
                {isMeatSelected && randomMeat && renderIngredientCard(randomMeat)}
              </View>
            )}
          </View>

          <View style={[styles.randomButtonWrapper, { marginTop: isShort ? 16 : 20 }]}>
            {!hasRandomized ? (
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
          </View>
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
  header: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E9E0DD',
  },
  headerTitle: {
    fontFamily: Typography.bold,
    fontSize: 20,
    color: '#A5352A',
    letterSpacing: 0.5,
  },
  searchButton: {
    position: 'absolute',
    right: 20,
    width: 36,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingBottom: 32,
  },
  pageContent: {
    width: '100%',
  },
  mainTitle: {
    fontFamily: Typography.bold,
    color: '#241917',
    textAlign: 'center',
    marginBottom: 6,
    lineHeight: 27,
  },
  subTitle: {
    fontFamily: Typography.regular,
    color: '#57423E',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 19,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  toggleBox: {
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unselected: {
    backgroundColor: '#E5E5E5',
    borderColor: '#D0D5DD',
  },
  vegSelected: {
    backgroundColor: '#A5E3C5',
    borderColor: '#81AC99',
  },
  meatSelected: {
    backgroundColor: '#F6D0CE',
    borderColor: '#C18079',
  },
  iconCircle: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  toggleText: {
    fontFamily: Typography.bold,
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
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    width: '100%',
  },
  ingredientCardImage: {
    flexShrink: 0,
  },
  placeholderCard: {
    width: LOGO_CARD_WIDTH,
    maxWidth: '100%',
    height: LOGO_CARD_HEIGHT,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderLogo: {
    width: LOGO_IMAGE_SIZE,
    height: LOGO_IMAGE_SIZE,
  },
  randomButtonWrapper: {
    width: '100%',
    alignSelf: 'center',
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ translateY: 2 }],
  },
});
