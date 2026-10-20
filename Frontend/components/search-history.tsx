import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';

interface SearchHistoryProps {
  recentSearches: string[];
  onSelectSearch: (text: string) => void;
  onClearHistoryItem: (index: number) => void;
  onClearAllHistory: () => void;
}

export function SearchHistory({
  recentSearches,
  onSelectSearch,
  onClearHistoryItem,
  onClearAllHistory,
}: SearchHistoryProps) {
  return (
    <>
      {/* Trending Section */}
      <View style={styles.trendSection}>
        <View style={styles.trendHeader}>
          <ThemedText style={styles.trendTitle}>🔥 เมนูฮิตติดกระแส</ThemedText>
        </View>
        <View style={styles.trendTags}>
          <Pressable
            onPress={() => onSelectSearch('อาหารจานเดียว')}
            style={[styles.pill, styles.pillGreen]}
          >
            <ThemedText style={styles.pillTextGreen}>#อาหารจานเดียว</ThemedText>
          </Pressable>
          <Pressable
            onPress={() => onSelectSearch('ของหวาน')}
            style={[styles.pill, styles.pillBrown]}
          >
            <ThemedText style={styles.pillTextBrown}>#ของหวาน</ThemedText>
          </Pressable>
        </View>
      </View>

      {/* History Section */}
      <View style={styles.historySection}>
        <View style={styles.historyHeader}>
          <ThemedText style={styles.historyTitle}>ล่าสุด</ThemedText>
          <Pressable onPress={onClearAllHistory}>
            <ThemedText style={styles.clearAllText}>ลบทิ้งทั้งหมด</ThemedText>
          </Pressable>
        </View>

        {recentSearches.map((item, index) => (
          <View key={`${item}-${index}`} style={styles.historyItem}>
            <Pressable
              style={styles.historyItemContent}
              onPress={() => onSelectSearch(item)}
            >
              <MaterialCommunityIcons
                name="history"
                size={20}
                color="#C4B5A5"
                style={styles.historyIcon}
              />
              <ThemedText style={styles.historyText}>{item}</ThemedText>
            </Pressable>
            <Pressable
              onPress={() => onClearHistoryItem(index)}
              hitSlop={8}
            >
              <Feather name="x" size={18} color="#C4B5A5" />
            </Pressable>
          </View>
        ))}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  trendSection: {
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  trendHeader: {
    marginBottom: 12,
  },
  trendTitle: {
    fontSize: 18,
    fontFamily: 'NotoSansThai_700Bold',
    fontWeight: '800',
    color: '#4B3500',
  },
  trendTags: {
    flexDirection: 'row',
    gap: 12,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  pillGreen: {
    backgroundColor: '#A4EFCB',
  },
  pillTextGreen: {
    fontSize: 14,
    fontFamily: 'NotoSansThai_700Bold',
    color: '#236F52',
  },
  pillBrown: {
    backgroundColor: '#D1A354',
  },
  pillTextBrown: {
    fontSize: 14,
    fontFamily: 'NotoSansThai_700Bold',
    color: '#4B3500',
  },
  historySection: {
    paddingHorizontal: 16,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  historyTitle: {
    fontSize: 18,
    fontFamily: 'NotoSansThai_700Bold',
    fontWeight: '800',
    color: '#4B3500',
  },
  clearAllText: {
    fontSize: 13,
    fontFamily: 'NotoSansThai_700Bold',
    color: '#B63A26',
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: '#E8DCD7',
    borderStyle: 'dashed',
  },
  historyItemContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyIcon: {
    marginRight: 12,
  },
  historyText: {
    fontSize: 15,
    fontFamily: 'NotoSansThai_400Regular',
    color: '#57423E',
  },
});
