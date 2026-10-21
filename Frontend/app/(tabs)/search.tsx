import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Pressable,
  Text,
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
import DeletePopup from '@/components/DeletePopup';
import { useAuth } from '@/context/AuthContext';
import { FOOD_CATEGORIES } from '@/constants/categories';
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
  deletePost,
} from '@/services/postService';
import { searchRestaurants } from '@/services/restaurantService';

const CURRENT_USER_ID = "me";
const OTHER_USER_ID = "mookmhee";

// Mock posts for search results fallback
const MOCK_POSTS: PopupPostData[] = [
  {
    id: "1",
    image: require("@/assets/images/StirFriedHolyBasil.png"),
    userId: CURRENT_USER_ID,
    title: "กะเพราไข่ดาว",
    description: "มื้อเที่ยงง่ายๆ แต่อร่อยมาก 🌶️🍳 ฟินสุดๆ ไปเลยจ้า ใครยังไม่รู้จะกินอะไร แนะนำเมนูที่อร่อยไม่เคยเปลี่ยน!",
    location: "https://www.wongnai.com/listings/phat-ka-phrao",
    tags: ["อาหารจานเดียว"],
    timeAgo: "2 ชม. ที่แล้ว",
  },
  {
    id: "2",
    image: require("@/assets/images/StirFriedHolyBasil.png"),
    userId: OTHER_USER_ID,
    title: "กะเพราหมูสับ",
    description: "กะเพราหมูสับไข่ดาว อร่อยเหมือนเดิม",
    tags: ["อาหารจานเดียว"],
    timeAgo: "4 ชม. ที่แล้ว",
  },
  {
    id: "3",
    image: require("@/assets/images/StirFriedHolyBasil.png"),
    userId: OTHER_USER_ID,
    title: "ข้าวผัดกุ้ง",
    description: "ข้าวผัดกุ้งร้อนๆ มาแล้วครับทุกคน อร่อยมาก!",
    tags: ["อาหารจานเดียว"],
    timeAgo: "5 ชม. ที่แล้ว",
  },
  {
    id: "4",
    image: require("@/assets/images/StirFriedHolyBasil.png"),
    userId: CURRENT_USER_ID,
    title: "ผัดพริกแกงหมูกรอบ",
    description: "หมูกรอบชิ้นใหญ่เต็มคำ รสชาติจัดจ้าน",
    tags: ["อาหารไทย"],
    timeAgo: "1 วันที่แล้ว",
  },
];

for (let i = 5; i <= 15; i++) {
  MOCK_POSTS.push({
    ...MOCK_POSTS[i % 4],
    id: String(i),
  });
}

// Mock restaurants for search results
const SEARCH_RESTAURANTS: Restaurant[] = [
  {
    id: '1',
    name: 'กะเพราตาแป๊ะ',
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5',
    description: 'กะเพราพริกแห้งโบราณรสเข้มข้น\nไม่ใส่ถั่วฝักยาว ไข่เป็ดกรอบลาวา',
    openTime: 'เปิดตั้งแต่ 10.00 น. - 20.00 น.',
    address: 'คลองหลวง ปทุมธานี',
    distance: '800 ม.',
    rating: 4.8,
  },
  {
    id: '2',
    name: 'ครัวป้าณี กะเพรากะทะเหล็ก',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4',
    description: 'สูตรโบราณผัดแห้งหอมกลิ่นคั่วกระทะเหล็ก\nใช้หมูสับอนามัยคัดเป็นอย่างดี',
    openTime: 'เปิดตั้งแต่ 12.00 น. - 19.00 น.',
    address: 'รังสิต ปทุมธานี',
    distance: '1.3 กม.',
    rating: 4.6,
  },
  {
    id: '3',
    name: 'กะเพราแซ่บสะท้าน',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591',
    description: 'รสชาติจัดจ้าน เผ็ดร้อนถึงใจ\nพร้อมไข่ดาวเยิ้มๆ และน้ำซุปร้อนๆ',
    openTime: 'เปิดตั้งแต่ 11.00 น. - 22.00 น.',
    address: 'รังสิต ปทุมธานี',
    distance: '1.5 กม.',
    rating: 4.7,
  },
  {
    id: '4',
    name: 'ครัวบ้านเรา',
    image: 'https://images.unsplash.com/photo-1552566626-52f8b828add9',
    description: 'อาหารตามสั่งรสเด็ด วัตถุดิบสดใหม่\nเมนูแนะนำ ข้าวผัดปู กะเพราทะเล',
    openTime: 'เปิดตั้งแต่ 09.00 น. - 21.00 น.',
    address: 'คลองหลวง ปทุมธานี',
    distance: '2.1 กม.',
    rating: 4.5,
  },
];

const isFoodCategory = (query: string): boolean => {
  return FOOD_CATEGORIES.some(
    (c) => c.label.toLowerCase() === query.trim().toLowerCase()
  );
};

export default function SearchScreen() {
  const { user, isLoggedIn } = useAuth();
  const [inputValue, setInputValue] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<PopupPostData[]>([]);
  const [restaurantResults, setRestaurantResults] = useState<Restaurant[]>([]);
  const [restaurantLoading, setRestaurantLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([
    'หมูกรอบเจ้าดัง',
    'คาเฟ่แมว นิมมาน',
    'ข้าวซอยเนื้อ',
  ]);
  const [searchTab, setSearchTab] = useState<SearchTabType>('posts');

  // Feed view mode & Popup post modal state
  const [showFeed, setShowFeed] = useState(false);
  const [popupPost, setPopupPost] = useState<PopupPostData | null>(null);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [deletePostId, setDeletePostId] = useState<string | null>(null);

  const { from } = useLocalSearchParams<{ from?: string }>();
  const lastFromRef = useRef<string | undefined>(undefined);

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
      } catch (e) {
        console.log('Location detection in search error:', e);
      }
      setUserLocation({ latitude: 14.0734, longitude: 100.6033 });
    })();
  }, []);

  const loadHistory = useCallback(async () => {
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
      setRecentSearches([
        'หมูกรอบเจ้าดัง',
        'คาเฟ่แมว นิมมาน',
        'ข้าวซอยเนื้อ',
      ]);
      setBookmarkedIds([]);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (from !== undefined && from !== lastFromRef.current) {
      lastFromRef.current = from;
      setInputValue('');
      setIsSearching(false);
      setShowFeed(false);
      setPopupPost(null);
      setSearchResults([]);
      setSearchTab('posts');
    }
  }, [from]);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [loadHistory])
  );

  const performSearch = async (text: string, saveHistory = true) => {
    const queryStr = text.trim();
    if (queryStr === '') {
      setIsSearching(false);
      setSearchResults([]);
      setRestaurantResults([]);
      return;
    }

    setInputValue(queryStr);
    setIsSearching(true);
    setLoading(true);
    setRestaurantLoading(true);

    const isCategory = isFoodCategory(queryStr);
    if (saveHistory && !isCategory) {
      if (isLoggedIn) {
        await addSearchHistory(queryStr);
        loadHistory();
      } else {
        setRecentSearches((prev) => [
          queryStr,
          ...prev.filter((item) => item !== queryStr),
        ].slice(0, 10));
      }
    }

    const lat = userLocation?.latitude || 14.0734;
    const lng = userLocation?.longitude || 100.6033;

    // Search both posts and restaurants concurrently
    const [results, restResults] = await Promise.all([
      searchPosts(queryStr),
      searchRestaurants(queryStr, lat, lng),
    ]);

    if (results && results.length > 0) {
      setSearchResults(results);
    } else {
      // Fallback filter on local MOCK_POSTS
      const fallback = MOCK_POSTS.filter(
        (p) =>
          p.title?.toLowerCase().includes(queryStr.toLowerCase()) ||
          p.description?.toLowerCase().includes(queryStr.toLowerCase()) ||
          (p.tags && p.tags.some((t) => t.toLowerCase().includes(queryStr.toLowerCase())))
      );
      setSearchResults(fallback);
    }
    setLoading(false);

    setRestaurantResults(restResults || []);
    setRestaurantLoading(false);
  };

  const handleSearchSubmit = () => {
    performSearch(inputValue, true);
  };

  const handleClearHistory = async (index: number) => {
    if (isLoggedIn) {
      const historyItems = await fetchSearchHistory();
      if (historyItems && historyItems[index]) {
        await deleteSearchHistoryItem(historyItems[index].id);
        loadHistory();
        return;
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

  const handleRequestDelete = (postId: string) => {
    setDeletePostId(postId);
  };

  const handleConfirmDelete = async () => {
    if (deletePostId) {
      const idToDelete = deletePostId;
      setSearchResults((prev) => prev.filter((p) => p.id !== idToDelete));
      setDeletePostId(null);
      setPopupPost(null);
      await deletePost(idToDelete);
    }
  };

  const handleCancelDelete = () => {
    setDeletePostId(null);
  };

  const handleEditPost = (post: any) => {
    router.push({
      pathname: "/EditPost",
      params: { postId: post.id, post: JSON.stringify(post) },
    });
  };

  const filteredRestaurants = inputValue.trim()
    ? SEARCH_RESTAURANTS.filter(
      (r) =>
        r.name.toLowerCase().includes(inputValue.toLowerCase()) ||
        (r.description && r.description.toLowerCase().includes(inputValue.toLowerCase())) ||
        (r.address && r.address.toLowerCase().includes(inputValue.toLowerCase()))
    )
    : SEARCH_RESTAURANTS;

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
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
          />
          {inputValue.length > 0 && (
            <Pressable
              onPress={() => {
                setInputValue('');
                setIsSearching(false);
                setSearchResults([]);
                setRestaurantResults([]);
              }}
              hitSlop={8}
            >
              <Feather name="x" size={18} color="#A0938F" style={{ marginRight: 4 }} />
            </Pressable>
          )}
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
            onSelectSearch={(text) => performSearch(text, false)}
            onClearHistoryItem={handleClearHistory}
            onClearAllHistory={handleClearAllHistory}
          />
        ) : searchTab === 'posts' ? (
          loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#DCA64E" />
            </View>
          ) : searchResults.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>ไม่พบผลลัพธ์สำหรับ "{inputValue}"</Text>
            </View>
          ) : showFeed ? (
            /* Feed View Mode */
            <View style={styles.feedContainer}>
              {searchResults.map((post) => (
                <View key={post.id} style={styles.postWrapper}>
                  <PopupPost
                    visible={true}
                    post={post}
                    onClose={() => { }}
                    inline
                    isOwnPost={!!user && post.userId === user.id}
                    isBookmarked={bookmarkedIds.includes(post.id)}
                    onBookmark={handleToggleBookmark}
                    onEdit={handleEditPost}
                    onRequestDelete={handleRequestDelete}
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
            {restaurantLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#DCA64E" />
                <Text style={styles.emptyText}>กำลังค้นหาร้านอาหาร...</Text>
              </View>
            ) : restaurantResults.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>ไม่พบร้านอาหารสำหรับ "{inputValue}"</Text>
              </View>
            ) : (
              restaurantResults.map((restaurant) => (
                <RestaurantCard
                  key={restaurant.id}
                  restaurant={restaurant}
                  onPress={() => {
                    console.log('Selected restaurant:', restaurant.name);
                  }}
                />
              ))
            )}
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
        onEdit={handleEditPost}
        onRequestDelete={handleRequestDelete}
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

      <DeletePopup
        visible={deletePostId !== null}
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
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
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
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
  emptyContainer: {
    paddingVertical: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'NotoSansThai_400Regular',
    color: '#8A7B75',
  },
  restaurantListContainer: {
    paddingHorizontal: 16,
  },
});