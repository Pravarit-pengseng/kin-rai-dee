import React, { useState, useCallback } from 'react';
import { View, StyleSheet, TextInput, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router, useFocusEffect } from 'expo-router';
import { Feather } from '@expo/vector-icons';

import { Header } from '@/components/Header';
import PostGrid from '@/components/post-grid';
import PopupPost, { PopupPostData } from '@/components/popup-post';
import { RestaurantCard, Restaurant } from '@/components/restuarant-card';
import { SearchTabFilter, SearchTabType } from '@/components/search-tab-filter';
import { SearchHistory } from '@/components/search-history';

const CURRENT_USER_ID = "me";
const OTHER_USER_ID = "mookmhee";

// Mock posts for search results
const MOCK_POSTS: PopupPostData[] = [
  {
    id: "1",
    image: require("@/assets/images/StirFriedHolyBasil.png"),
    userId: CURRENT_USER_ID,
    title: "กะเพราไข่ดาว",
    description: "มื้อเที่ยงง่ายๆ แต่อร่อยมาก 🌶️🍳 ฟินสุดๆ ไปเลยจ้า ใครยังไม่รู้จะกินอะไร แนะนำเมนูที่อร่อยไม่เคยเปลี่ยน!",
    location: "https://www.wongnai.com/listings/phat-ka-phrao",
    tag: "อาหารจานเดียว",
    timeAgo: "2 ชม. ที่แล้ว",
  },
  {
    id: "2",
    image: require("@/assets/images/StirFriedHolyBasil.png"),
    userId: OTHER_USER_ID,
    title: "กะเพราหมูสับ",
    description: "กะเพราหมูสับไข่ดาว อร่อยเหมือนเดิม",
    tag: "อาหารจานเดียว",
    timeAgo: "4 ชม. ที่แล้ว",
  },
  {
    id: "3",
    image: require("@/assets/images/StirFriedHolyBasil.png"),
    userId: OTHER_USER_ID,
    title: "ข้าวผัดกุ้ง",
    description: "ข้าวผัดกุ้งร้อนๆ มาแล้วครับทุกคน อร่อยมาก!",
    tag: "อาหารจานเดียว",
    timeAgo: "5 ชม. ที่แล้ว",
  },
  {
    id: "4",
    image: require("@/assets/images/StirFriedHolyBasil.png"),
    userId: CURRENT_USER_ID,
    title: "ผัดพริกแกงหมูกรอบ",
    description: "หมูกรอบชิ้นใหญ่เต็มคำ รสชาติจัดจ้าน",
    tag: "อาหารไทย",
    timeAgo: "1 วันที่แล้ว",
  },
];

// Fill up to 15 items for the grid
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

export default function SearchScreen() {
  const [inputValue, setInputValue] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [recentSearches, setRecentSearches] = useState([
    'หมูกรอบเจ้าดัง',
    'คาเฟ่แมว นิมมาน',
    'ข้าวซอยเนื้อ',
  ]);
  const [searchTab, setSearchTab] = useState<SearchTabType>('posts');

  // Feed view mode & Popup post modal state
  const [showFeed, setShowFeed] = useState(false);
  const [popupPost, setPopupPost] = useState<PopupPostData | null>(null);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);

  // Reset state when screen is focused
  useFocusEffect(
    useCallback(() => {
      setInputValue('');
      setIsSearching(false);
      setShowFeed(false);
      setPopupPost(null);
      setSearchTab('posts');
    }, [])
  );

  const handleSearch = (text: string) => {
    const trimmed = text.trim();
    if (trimmed !== '') {
      setInputValue(trimmed);
      setIsSearching(true);
      setShowFeed(false);
      setRecentSearches((prev) => [
        trimmed,
        ...prev.filter((item) => item !== trimmed),
      ].slice(0, 10));
    } else {
      setIsSearching(false);
      setShowFeed(false);
    }
  };

  const handleClearHistory = (index: number) => {
    setRecentSearches((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClearAllHistory = () => {
    setRecentSearches([]);
  };

  const handleToggleBookmark = (postId: string) => {
    setBookmarkedIds((prev) =>
      prev.includes(postId)
        ? prev.filter((id) => id !== postId)
        : [...prev, postId]
    );
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
            setSearchTab('posts');
          } else {
            router.back();
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
              {MOCK_POSTS.map((post) => (
                <View key={post.id} style={styles.postWrapper}>
                  <PopupPost
                    visible={true}
                    post={post}
                    onClose={() => {}}
                    inline
                    isOwnPost={post.userId === CURRENT_USER_ID}
                    isBookmarked={bookmarkedIds.includes(post.id)}
                    onBookmark={handleToggleBookmark}
                    onUserPress={(userId) => {
                      if (userId === CURRENT_USER_ID) {
                        router.push('/(tabs)/profile');
                      } else {
                        router.push('/OtherProfile');
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
                posts={MOCK_POSTS}
                onPressPost={() => setShowFeed(true)}
                onLongPressPost={(post) => setPopupPost(post)}
              />
            </View>
          )
        ) : (
          /* Restaurant List View Mode */
          <View style={styles.restaurantListContainer}>
            {SEARCH_RESTAURANTS.map((restaurant) => (
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
        isOwnPost={popupPost?.userId === CURRENT_USER_ID}
        isBookmarked={popupPost ? bookmarkedIds.includes(popupPost.id) : false}
        onBookmark={handleToggleBookmark}
        onUserPress={(userId) => {
          setPopupPost(null);
          if (userId === CURRENT_USER_ID) {
            router.push('/(tabs)/profile');
          } else {
            router.push('/OtherProfile');
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