import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { ThemedText } from '@/components/themed-text';

export type SearchTabType = 'posts' | 'restaurants';

interface SearchTabFilterProps {
  activeTab: SearchTabType;
  onTabChange: (tab: SearchTabType) => void;
}

export function SearchTabFilter({
  activeTab,
  onTabChange,
}: SearchTabFilterProps) {
  return (
    <View style={styles.tabContainer}>
      <Pressable
        style={[
          styles.tabButton,
          activeTab === 'posts'
            ? styles.tabButtonActive
            : styles.tabButtonInactive,
        ]}
        onPress={() => onTabChange('posts')}
      >
        <ThemedText
          style={[
            styles.tabText,
            activeTab === 'posts'
              ? styles.tabTextActive
              : styles.tabTextInactive,
          ]}
        >
          โพสต์
        </ThemedText>
      </Pressable>

      <Pressable
        style={[
          styles.tabButton,
          activeTab === 'restaurants'
            ? styles.tabButtonActive
            : styles.tabButtonInactive,
        ]}
        onPress={() => onTabChange('restaurants')}
      >
        <ThemedText
          style={[
            styles.tabText,
            activeTab === 'restaurants'
              ? styles.tabTextActive
              : styles.tabTextInactive,
          ]}
        >
          ร้านอาหารใกล้ฉัน
        </ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 16,
  },
  tabButton: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButtonActive: {
    backgroundColor: '#A4EFCB',
  },
  tabButtonInactive: {
    backgroundColor: '#6B728020',
  },
  tabText: {
    fontSize: 13.5,
  },
  tabTextActive: {
    fontFamily: 'NotoSansThai_700Bold',
    color: '#236F52',
  },
  tabTextInactive: {
    fontFamily: 'NotoSansThai_700Bold',
    color: '#6B7280',
  },
});
