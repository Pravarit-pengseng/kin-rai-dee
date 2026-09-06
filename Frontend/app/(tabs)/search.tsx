import React, { useState, useCallback } from 'react';
import { View, StyleSheet, TextInput, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router, useFocusEffect } from 'expo-router';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { Header } from '@/components/Header';
import PostGrid from '@/components/post-grid';
import PopupPost, { PopupPostData } from '@/components/popup-post';
import { ThemedText } from '@/components/themed-text';
import { searchPosts, fetchSearchHistory, addSearchHistory, deleteSearchHistoryItem, clearAllSearchHistory } from '@/services/searchService';
import { useAuth } from '@/context/AuthContext';

const CURRENT_USER_ID = "me";
const OTHER_USER_ID = "mookmhee";

const MOCK_POSTS: PopupPostData[] = [
  {
    id: "1",
    image: require("../../assets/images/StirFriedHolyBasil.png"),
    userId: CURRENT_USER_ID,
    title: "กะเพราไข่ดาว",
    description: "มื้อเที่ยงง่ายๆ แต่อร่อยมาก 🌶️🍳 ฟินสุดๆ ไปเลยจ้า ใครยังไม่รู้จะกินอะไร แนะนำเมนูที่อร่อยไม่เคยเปลี่ยน!",
    location: "https://www.wongnai.com/listings/phat-ka-phrao",
    tag: "อาหารจานเดียว",
    timeAgo: "2 ชม. ที่แล้ว",
  },
  {
    id: "2",
    image: require("../../assets/images/StirFriedHolyBasil.png"),
    userId: OTHER_USER_ID,
    title: "กะเพราหมูสับ",
    description: "กะเพราหมูสับไข่ดาว อร่อยเหมือนเดิม",
    tag: "อาหารจานเดียว",
    timeAgo: "4 ชม. ที่แล้ว",
  },
  {
    id: "3",
    image: require("../../assets/images/StirFriedHolyBasil.png"),
    userId: OTHER_USER_ID,
    title: "ข้าวผัดกุ้ง",
    description: "ข้าวผัดกุ้งร้อนๆ มาแล้วครับทุกคน อร่อยมาก!",
    tag: "อาหารจานเดียว",
    timeAgo: "5 ชม. ที่แล้ว",
  },
  {
    id: "4",
    image: require("../../assets/images/StirFriedHolyBasil.png"),
    userId: CURRENT_USER_ID,
    title: "ผัดพริกแกงหมูกรอบ",
    description: "หมูกรอบชิ้นใหญ่เต็มคำ รสชาติจัดจ้าน",
    tag: "อาหารไทย",
    timeAgo: "1 วันที่แล้ว",
  }
];

for (let i = 5; i <= 15; i++) {
  MOCK_POSTS.push({
    ...MOCK_POSTS[(i % 4)],
    id: String(i),
  });
}

export default function SearchScreen() {
  const { user } = useAuth();
  const userId = user?.id || CURRENT_USER_ID;

  const [inputValue, setInputValue] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<{ id?: string | number; query: string }[]>([
    { query: 'หมูกรอบเจ้าดัง' },
    { query: 'คาเฟ่แมว นิมมาน' },
    { query: 'ข้าวซอยเนื้อ' }
  ]);
  const [searchResults, setSearchResults] = useState<PopupPostData[]>(MOCK_POSTS);

  const [showFeed, setShowFeed] = useState(false);
  const [popupPost, setPopupPost] = useState<PopupPostData | null>(null);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);

  const loadHistory = async () => {
    const history = await fetchSearchHistory(userId);
    if (history && history.length > 0) {
      setRecentSearches(history.map(item => ({ id: item.id, query: item.query })));
    }
  };

  useFocusEffect(
    useCallback(() => {
      setInputValue('');
      setIsSearching(false);
      setShowFeed(false);
      setPopupPost(null);
      loadHistory();
    }, [userId])
  );

  const performSearch = async (text: string) => {
    const queryStr = text.trim();
    if (queryStr === '') {
      setIsSearching(false);
      setShowFeed(false);
      setSearchResults(MOCK_POSTS);
      return;
    }

    setIsSearching(true);
    setShowFeed(false);
    setLoading(true);

    await addSearchHistory(userId, queryStr);
    loadHistory();

    const results = await searchPosts(queryStr);
    if (results && results.length > 0) {
      setSearchResults(results);
    } else {
      setSearchResults(MOCK_POSTS.filter(p =>
        p.title?.includes(queryStr) ||
        p.description?.includes(queryStr) ||
        p.tag?.includes(queryStr)
      ));
    }

    setLoading(false);
  };

  const handleSearchSubmit = () => {
    performSearch(inputValue);
  };

  const handleClearHistory = async (index: number) => {
    const item = recentSearches[index];
    if (item.id) {
      await deleteSearchHistoryItem(item.id);
    }
    setRecentSearches(prev => prev.filter((_, i) => i !== index));
  };

  const handleClearAllHistory = async () => {
    await clearAllSearchHistory(userId);
    setRecentSearches([]);
  };

  const handleTrendPress = (text: string) => {
    setInputValue(text);
    performSearch(text);
  };

  const handleHistoryPress = (text: string) => {
    setInputValue(text);
    performSearch(text);
  };

  const handlePostPress = (post: PopupPostData) => {
    setShowFeed(true);
  };

  const handlePostLongPress = (post: PopupPostData) => {
    setPopupPost(post);
  };

  const handleToggleBookmark = (postId: string) => {
    setBookmarkedIds((prev) =>
      prev.includes(postId) ? prev.filter((id) => id !== postId) : [...prev, postId]
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
          } else {
            router.back();
          }
        }}
        rightIcon="none"
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Feather name="search" size={20} color="#6B4F48" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="ค้นหาเมนูหรือเพื่อน..."
            placeholderTextColor="#A0938F"
            value={inputValue}
            onChangeText={setInputValue}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
          />
        </View>

        {!isSearching ? (
          /* Initial View (History & Trending) */
          <>
            <View style={styles.trendSection}>
              <View style={styles.trendHeader}>
                <ThemedText style={styles.trendTitle}>🔥 เมนูฮิตติดกระแส</ThemedText>
              </View>
              <View style={styles.trendTags}>
                <Pressable onPress={() => handleTrendPress('อาหารจานเดียว')} style={[styles.pill, styles.pillGreen]}>
                  <ThemedText style={styles.pillTextGreen}>#อาหารจานเดียว</ThemedText>
                </Pressable>
                <Pressable onPress={() => handleTrendPress('ของหวาน')} style={[styles.pill, styles.pillBrown]}>
                  <ThemedText style={styles.pillTextBrown}>#ของหวาน</ThemedText>
                </Pressable>
              </View>
            </View>

            <View style={styles.historySection}>
              <View style={styles.historyHeader}>
                <ThemedText style={styles.historyTitle}>ล่าสุด</ThemedText>
                <Pressable onPress={handleClearAllHistory}>
                  <ThemedText style={styles.clearAllText}>ลบทิ้งทั้งหมด</ThemedText>
                </Pressable>
              </View>

              {recentSearches.map((item, index) => (
                <View key={`${item.query}-${index}`} style={styles.historyItem}>
                  <Pressable style={styles.historyItemContent} onPress={() => handleHistoryPress(item.query)}>
                    <MaterialCommunityIcons name="history" size={20} color="#C4B5A5" style={styles.historyIcon} />
                    <ThemedText style={styles.historyText}>{item.query}</ThemedText>
                  </Pressable>
                  <Pressable onPress={() => handleClearHistory(index)} hitSlop={8}>
                    <Feather name="x" size={18} color="#C4B5A5" />
                  </Pressable>
                </View>
              ))}
            </View>
          </>
        ) : loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#DCA64E" />
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
                  isOwnPost={post.userId === CURRENT_USER_ID}
                  isBookmarked={bookmarkedIds.includes(post.id)}
                  onBookmark={handleToggleBookmark}
                  onUserPress={(userId) => {
                    if (userId === CURRENT_USER_ID) {
                      router.push("/(tabs)/profile");
                    } else {
                      router.push("/OtherProfile");
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
              onPressPost={handlePostPress}
              onLongPressPost={handlePostLongPress}
            />
          </View>
        )}
      </ScrollView>

      {/* Popup Post Modal */}
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
            router.push("/(tabs)/profile");
          } else {
            router.push("/OtherProfile");
          }
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFF8F6" },
  scrollContent: { paddingBottom: 110 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 24,
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
});
