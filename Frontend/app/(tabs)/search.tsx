import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Linking,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Keyboard,
} from 'react-native';

import { SafeAreaView } from '@/components/SafeAreaView';
import { StatusBar } from 'expo-status-bar';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { safeBack } from '@/utils/navigation';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';

import { Header } from '@/components/Header';
import PostGrid from '@/components/post-grid';
import { PostGridSkeleton } from '@/components/PostSkeleton';
import PopupPost, { PopupPostData } from '@/components/popup-post';
import { RestaurantCard, Restaurant } from '@/components/restuarant-card';
import { SearchTabFilter, SearchTabType } from '@/components/search-tab-filter';
import { SearchHistory } from '@/components/search-history';
import { useAuth } from '@/context/AuthContext';
import { Typography } from '@/constants/typography';
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
  subscribePostDeleted,
  subscribePostUpdated,
  subscribeBookmarkChanged,
} from '@/services/postService';
import { searchRestaurants } from '@/services/restaurantService';
import { subscribeUserBlocked } from '@/services/safetyService';

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
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const hasScrolledToSelectedRef = useRef(false);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [loadingRestaurants, setLoadingRestaurants] = useState(false);
  const [popupPost, setPopupPost] = useState<PopupPostData | null>(null);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const searchBarRef = useRef<any>(null);
  const scrollRef = useRef<any>(null);

  const { from, query, tag, _ts } = useLocalSearchParams<{ from?: string; query?: string; tag?: string; _ts?: string }>();
  const lastHandledParamRef = useRef<string>('');

  useEffect(() => {
    const unsubUserBlocked = subscribeUserBlocked((blockedUserId) => {
      setSearchResults((prev) => prev.filter((p) => String(p.userId) !== String(blockedUserId)));
      setPopupPost((prev) =>
        prev && String(prev.userId) === String(blockedUserId) ? null : prev
      );
    });
    const unsubDelete = subscribePostDeleted((deletedId) => {
      const idStr = String(deletedId);
      setSearchResults((prev) => prev.filter((p) => String(p.id) !== idStr));
      setBookmarkedIds((prev) => prev.filter((id) => String(id) !== idStr));
      setPopupPost((prev) => (prev && String(prev.id) === idStr ? null : prev));
    });
    const unsubUpdate = subscribePostUpdated((updated) => {
      const idStr = String(updated.id);
      setSearchResults((prev) =>
        prev.map((p) => (String(p.id) === idStr ? { ...p, ...updated } : p))
      );
      setPopupPost((prev) => (prev && String(prev.id) === idStr ? { ...prev, ...updated } : prev));
    });
    const unsubBookmark = subscribeBookmarkChanged((pid, isBookmarked) => {
      const idStr = String(pid);
      setBookmarkedIds((prev) => {
        const exists = prev.includes(idStr);
        if (isBookmarked && !exists) return [...prev, idStr];
        if (!isBookmarked && exists) return prev.filter((id) => id !== idStr);
        return prev;
      });
    });
    return () => {
      unsubUserBlocked();
      unsubDelete();
      unsubUpdate();
      unsubBookmark();
    };
  }, []);

  useEffect(() => {
    const targetQuery = (query || tag)?.trim();
    if (targetQuery) {
      const paramKey = `${targetQuery}::${_ts || ''}`;
      if (lastHandledParamRef.current !== paramKey) {
        lastHandledParamRef.current = paramKey;
        handleSearch(targetQuery);
      }
    }
  }, [query, tag, _ts]);

  // Fetch user location for nearby restaurants
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          let loc = await Location.getLastKnownPositionAsync({});
          if (!loc) {
            loc = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
            });
          }
          if (loc) {
            setUserLocation({
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
            });
            return;
          }
        }
      } catch {
        // location optional
      }
      setUserLocation({ latitude: 14.0734, longitude: 100.6033 });
    })();
  }, []);

  // Load history & bookmarks in parallel
  const loadUserData = useCallback(async () => {
    if (isLoggedIn) {
      const [historyItems, saved] = await Promise.all([
        fetchSearchHistory().catch(() => []),
        getSavedPosts().catch(() => []),
      ]);
      setRecentSearches(
        historyItems && historyItems.length > 0 ? historyItems.map((item) => item.query) : []
      );
      setBookmarkedIds(saved && saved.length > 0 ? saved.map((s) => s.id) : []);
    } else {
      setRecentSearches([]);
      setBookmarkedIds([]);
    }
  }, [isLoggedIn]);

  // Reset state when screen is focused (unless opened directly with a query/tag param)
  useFocusEffect(
    useCallback(() => {
      const targetQuery = (query || tag)?.trim();
      if (targetQuery) {
        loadUserData();
        const paramKey = `${targetQuery}::${_ts || ''}`;
        if (lastHandledParamRef.current !== paramKey) {
          lastHandledParamRef.current = paramKey;
          handleSearch(targetQuery);
        }
        return;
      }

      lastHandledParamRef.current = '';
      setInputValue('');
      setIsSearching(false);
      setShowFeed(false);
      setSelectedPostId(null);
      hasScrolledToSelectedRef.current = false;
      setLoadingPosts(false);
      setLoadingRestaurants(false);
      setPopupPost(null);
      setSearchResults([]);
      setRestaurantResults([]);
      setSearchTab('posts');
      loadUserData();
    }, [loadUserData, query, tag, _ts])
  );

  const handleSearch = async (text: string) => {
    const trimmed = text.trim();
    if (trimmed !== '') {
      Keyboard.dismiss();
      setInputValue(trimmed);
      setIsSearching(true);
      setShowFeed(false);
      setSelectedPostId(null);
      hasScrolledToSelectedRef.current = false;
      setLoadingPosts(true);
      setLoadingRestaurants(true);
      setSearchResults([]);
      setRestaurantResults([]);
      setRecentSearches((prev) => [
        trimmed,
        ...prev.filter((item) => item !== trimmed),
      ].slice(0, 10));

      // Save history to backend if logged in
      if (isLoggedIn) {
        addSearchHistory(trimmed).catch(() => { });
      }

      // Query posts & restaurants independently so each renders as soon as it resolves
      const lat = userLocation?.latitude || 14.0734;
      const lng = userLocation?.longitude || 100.6033;

      searchPosts(trimmed)
        .then((apiPosts) => {
          setSearchResults(apiPosts || []);
        })
        .catch((e) => {
          console.warn('Search posts error:', e);
          setSearchResults([]);
        })
        .finally(() => {
          setLoadingPosts(false);
        });

      searchRestaurants(trimmed, lat, lng)
        .then((apiRestaurants) => {
          setRestaurantResults(apiRestaurants || []);
        })
        .catch((e) => {
          console.warn('Search restaurants error:', e);
          setRestaurantResults([]);
        })
        .finally(() => {
          setLoadingRestaurants(false);
        });
    } else {
      setIsSearching(false);
      setShowFeed(false);
      setSelectedPostId(null);
      setLoadingPosts(false);
      setLoadingRestaurants(false);
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
              safeBack('/(tabs)');
            }
          }
        }}
        rightIcon="none"
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 110 }]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="none"
        >
          {/* Search Bar */}
          <View ref={searchBarRef} style={styles.searchContainer}>
            <MaterialCommunityIcons
              name="magnify"
              size={22}
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
                  <View
                    key={post.id}
                    style={styles.postWrapper}
                    onLayout={(e) => {
                      if (
                        selectedPostId &&
                        post.id === selectedPostId &&
                        !hasScrolledToSelectedRef.current
                      ) {
                        hasScrolledToSelectedRef.current = true;
                        scrollRef.current?.scrollTo({
                          y: e.nativeEvent.layout.y,
                          animated: false,
                        });
                      }
                    }}
                  >
                    <PopupPost
                      visible={true}
                      post={post}
                      onClose={() => { }}
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
            ) : loadingPosts ? (
              <View style={styles.gridContainer}>
                <View style={styles.loadingRow}>
                  <ActivityIndicator size="small" color="#A7392A" />
                  <Text style={styles.loadingText}>กำลังค้นหาโพสต์...</Text>
                </View>
                <PostGridSkeleton count={6} />
              </View>
            ) : searchResults.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>ไม่พบโพสต์ที่ตรงกับคำค้นหา</Text>
              </View>
            ) : (
              /* Grid View Mode */
              <View style={styles.gridContainer}>
                <PostGrid
                  posts={searchResults}
                  onPressPost={(post) => {
                    hasScrolledToSelectedRef.current = false;
                    setSelectedPostId(post.id);
                    setShowFeed(true);
                  }}
                  onLongPressPost={(post) => setPopupPost(post)}
                />
              </View>
            )
          ) : loadingRestaurants ? (
            <View style={styles.emptyState}>
              <ActivityIndicator size="small" color="#A7392A" />
              <Text style={[styles.loadingText, { marginTop: 10 }]}>กำลังค้นหาร้านอาหารใกล้เคียง...</Text>
            </View>
          ) : restaurantResults.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>ไม่พบร้านอาหารที่ตรงกับคำค้นหา</Text>
            </View>
          ) : (
            /* Restaurant List View Mode */
            <View style={styles.restaurantListContainer}>
              {restaurantResults.map((restaurant) => (
                <RestaurantCard
                  key={restaurant.id}
                  restaurant={restaurant}
                  onPress={() => {
                    const query = encodeURIComponent(
                      restaurant.name + (restaurant.address ? ' ' + restaurant.address : '')
                    );
                    const url =
                      restaurant.mapUrl ||
                      `https://www.google.com/maps/search/?api=1&query=${query}`;
                    Linking.openURL(url).catch((err) =>
                      console.log('Error opening Google Maps:', err)
                    );
                  }}
                />
              ))}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

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
    fontFamily: Typography.regular,
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
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  loadingText: {
    fontFamily: Typography.regular,
    fontSize: 14,
    color: '#6B4F48',
  },
  emptyState: {
    paddingVertical: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontFamily: Typography.regular,
    fontSize: 14,
    color: '#8C7B75',
  },
});