import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as Location from 'expo-location';

import { Header } from '@/components/Header';
import PostGrid from '@/components/post-grid';
import PopupPost, { PopupPostData } from '@/components/popup-post';
import { RestaurantCard, Restaurant } from '@/components/restuarant-card';
import { SearchTabFilter, SearchTabType } from '@/components/search-tab-filter';
import { SearchHistory } from '@/components/search-history';
import { useAuth } from '@/context/AuthContext';
import {
  searchPosts,
  fetchSearchHistory,
  addSearchHistory,
  deleteSearchHistoryItem,
  clearAllSearchHistory,
} from '@/services/searchService';
import {
  bookmarkPost,
  unbookmarkPost,
  getSavedPosts,
} from '@/services/postService';
import { searchRestaurants } from '@/services/restaurantService';

export default function SearchScreen() {
  const { user, isLoggedIn } = useAuth();
  const [inputValue, setInputValue] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [searchTab, setSearchTab] = useState<SearchTabType>('posts');

  // Real Results (no mock data)
  const [searchResults, setSearchResults] = useState<PopupPostData[]>([]);
  const [restaurantResults, setRestaurantResults] = useState<Restaurant[]>([]);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  // Feed view mode & Popup post modal state
  const [showFeed, setShowFeed] = useState(false);
  const [popupPost, setPopupPost] = useState<PopupPostData | null>(null);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);

  const { from } = useLocalSearchParams<{ from?: string }>();

  // Fetch user location for nearby restaurants
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          setUserLocation({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          });
        }
      } catch (e) {
        // location optional
      }
    })();
  }, []);

  // Load history & bookmarks
  const loadUserData = useCallback(async () => {
    if (isLoggedIn) {
      const historyItems = await fetchSearchHistory();
      if (historyItems && historyItems.length > 0) {
        setRecentSearches(historyItems.map((item) => item.query));
      } else {
        setRecentSearches([]);
      }

      const saved = await getSavedPosts();
      if (saved && saved.length > 0) {
        setBookmarkedIds(saved.map((s) => s.id));
      } else {
        setBookmarkedIds([]);
      }
    } else {
      setRecentSearches([]);
      setBookmarkedIds([]);
    }
  }, [isLoggedIn]);

  // Reset state when screen is focused
  useFocusEffect(
    useCallback(() => {
      setInputValue('');
      setIsSearching(false);
      setShowFeed(false);
      setPopupPost(null);
      setSearchResults([]);
      setRestaurantResults([]);
      setSearchTab('posts');
      loadUserData();
    }, [loadUserData])
  );

  const handleSearch = async (text: string) => {
    const trimmed = text.trim();
    if (trimmed !== '') {
      setInputValue(trimmed);
      setIsSearching(true);
      setShowFeed(false);
      setRecentSearches((prev) => [
        trimmed,
        ...prev.filter((item) => item !== trimmed),
      ].slice(0, 10));

      // Save history to backend if logged in
      if (isLoggedIn) {
        addSearchHistory(trimmed).catch(() => {});
      }

      // Query posts & restaurants from real backend APIs
      const lat = userLocation?.latitude || 14.0734;
      const lng = userLocation?.longitude || 100.6033;

      try {
        const [apiPosts, apiRestaurants] = await Promise.all([
          searchPosts(trimmed),
          searchRestaurants(trimmed, lat, lng),
        ]);

        setSearchResults(apiPosts || []);
        setRestaurantResults(apiRestaurants || []);
      } catch (e) {
        console.warn('Search error:', e);
        setSearchResults([]);
        setRestaurantResults([]);
      }
    } else {
      setIsSearching(false);
      setShowFeed(false);
      setSearchResults([]);
      setRestaurantResults([]);
    }
  };

  const handleClearHistory = async (index: number) => {
    if (isLoggedIn) {
      const historyItems = await fetchSearchHistory();
      if (historyItems && historyItems[index]) {
        await deleteSearchHistoryItem(historyItems[index].id);
      }
    }
    setRecentSearches((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClearAllHistory = async () => {
    if (isLoggedIn) {
      await clearAllSearchHistory();
    }
    setRecentSearches([]);
  };

  const handleToggleBookmark = async (postId: string) => {
    const isCurrentlyBookmarked = bookmarkedIds.includes(postId);
    setBookmarkedIds((prev) =>
      isCurrentlyBookmarked ? prev.filter((id) => id !== postId) : [...prev, postId]
    );

    if (isLoggedIn) {
      if (isCurrentlyBookmarked) {
        await unbookmarkPost(postId);
      } else {
        await bookmarkPost(postId);
      }
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <Header
        title="ค้นหาสิ่งที่สนใจ"
        leftIcon="back"
        onLeftPress={() => {
          if (showFeed) {
            setShowFeed(false);
          } else if (isSearching) {
            setIsSearching(false);
            setInputValue('');
            setSearchResults([]);
            setRestaurantResults([]);
            setSearchTab('posts');
          } else {
            if (from) {
              router.push(decodeURIComponent(from) as any);
            } else {
              router.back();
            }
          }
        }}
        rightIcon="none"
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Feather
            name="search"
            size={20}
            color="#6B4F48"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="ค้นหาเมนูหรือเพื่อน..."
            placeholderTextColor="#A0938F"
            value={inputValue}
            onChangeText={setInputValue}
            onSubmitEditing={() => handleSearch(inputValue)}
            returnKeyType="search"
          />
        </View>

        {/* Tab Filter (shown when searching) */}
        {isSearching && (
          <SearchTabFilter
            activeTab={searchTab}
            onTabChange={setSearchTab}
          />
        )}

        {!isSearching ? (
          /* Initial View (Trending & History) */
          <SearchHistory
            recentSearches={recentSearches}
            onSelectSearch={handleSearch}
            onClearHistoryItem={handleClearHistory}
            onClearAllHistory={handleClearAllHistory}
          />
        ) : searchTab === 'posts' ? (
          showFeed ? (
            /* Feed View Mode */
            <View style={styles.feedContainer}>
              {searchResults.map((post) => (
                <View key={post.id} style={styles.postWrapper}>
                  <PopupPost
                    visible={true}
                    post={post}
                    onClose={() => {}}
                    inline
                    isOwnPost={!!user && post.userId === user.id}
                    isBookmarked={bookmarkedIds.includes(post.id)}
                    onBookmark={handleToggleBookmark}
                    onUserPress={(userId) => {
                      if (user && userId === user.id) {
                        router.push('/(tabs)/profile');
                      } else {
                        router.push({
                          pathname: '/OtherProfile',
                          params: { userId },
                        });
                      }
                    }}
                  />
                </View>
              ))}
            </View>
          ) : (
            /* Grid View Mode */
            <View style={styles.gridContainer}>
              <PostGrid
                posts={searchResults}
                onPressPost={() => setShowFeed(true)}
                onLongPressPost={(post) => setPopupPost(post)}
              />
            </View>
          )
        ) : (
          /* Restaurant List View Mode */
          <View style={styles.restaurantListContainer}>
            {restaurantResults.map((restaurant) => (
              <RestaurantCard
                key={restaurant.id}
                restaurant={restaurant}
                onPress={() => {
                  console.log('Selected restaurant:', restaurant.name);
                }}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Popup Post Modal (triggered by long press in grid) */}
      <PopupPost
        visible={popupPost !== null}
        post={popupPost}
        onClose={() => setPopupPost(null)}
        isOwnPost={!!user && popupPost?.userId === user.id}
        isBookmarked={popupPost ? bookmarkedIds.includes(popupPost.id) : false}
        onBookmark={handleToggleBookmark}
        onUserPress={(userId) => {
          setPopupPost(null);
          if (user && userId === user.id) {
            router.push('/(tabs)/profile');
          } else {
            router.push({
              pathname: '/OtherProfile',
              params: { userId },
            });
          }
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF8ED',
  },
  scrollContent: {
    paddingBottom: 50,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 20,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#6B4F48',
    paddingHorizontal: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'NotoSansThai_400Regular',
    fontSize: 15,
    color: '#4B3500',
    height: '100%',
  },
  gridContainer: {
    flex: 1,
  },
  feedContainer: {
    paddingHorizontal: 16,
  },
  postWrapper: {
    marginBottom: 16,
  },
  restaurantListContainer: {
    paddingHorizontal: 16,
  },
});