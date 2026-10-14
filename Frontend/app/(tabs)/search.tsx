import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, StyleSheet, TextInput, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { Header } from '@/components/Header';
import PostGrid from '@/components/post-grid';
import PopupPost, { PopupPostData } from '@/components/popup-post';
import PostSkeleton from '@/components/PostSkeleton';
import { ThemedText } from '@/components/themed-text';
import DeletePopup from '@/components/DeletePopup';
import { searchPosts, fetchSearchHistory, addSearchHistory, deleteSearchHistoryItem, clearAllSearchHistory } from '@/services/searchService';
import { getSavedPosts, bookmarkPost, unbookmarkPost, deletePost } from '@/services/postService';
import { setCachedPostList } from '@/services/postCache';
import { useAuth } from '@/context/AuthContext';
import { FOOD_CATEGORIES, INGREDIENT_CATEGORIES } from '@/constants/categories';

const isFoodCategory = (query: string): boolean => {
  const clean = query.trim().replace(/^#/, '').toLowerCase();
  return (
    FOOD_CATEGORIES.some((c) => c.label.toLowerCase() === clean) ||
    INGREDIENT_CATEGORIES.some((c) => c.label.toLowerCase() === clean)
  );
};



export default function SearchScreen() {
  const { user } = useAuth();
  const [inputValue, setInputValue] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<{ id?: string | number; query: string }[]>([]);
  const [searchResults, setSearchResults] = useState<PopupPostData[]>([]);
  const [popupPost, setPopupPost] = useState<PopupPostData | null>(null);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [deletePostId, setDeletePostId] = useState<string | null>(null);
  const [deletePopupVisible, setDeletePopupVisible] = useState(false);

  const { from } = useLocalSearchParams<{ from?: string }>();

  const lastFromRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (from !== undefined && from !== lastFromRef.current) {
      lastFromRef.current = from;
      setInputValue('');
      setIsSearching(false);
      setSearchResults([]);
    }
  }, [from]);

  const loadHistory = useCallback(async () => {
    const history = await fetchSearchHistory();
    if (history && history.length > 0) {
      const seen = new Set<string>();
      const uniqueHistory: { id?: string | number; query: string }[] = [];

      for (const item of history) {
        if (!item?.query) continue;
        const queryText = item.query.trim();
        const clean = queryText.replace(/^#/, '').toLowerCase();

        // 1. Skip if it's from foodcat / ingredientcat
        if (isFoodCategory(clean)) continue;

        // 2. Skip duplicates (show only once)
        if (seen.has(clean)) continue;
        seen.add(clean);

        uniqueHistory.push({ id: item.id, query: queryText });
      }

      setRecentSearches(uniqueHistory);
    } else {
      setRecentSearches([]);
    }
    
    if (user?.id) {
      const saved = await getSavedPosts();
      if (saved && saved.length > 0) {
        setBookmarkedIds(saved.map((s) => s.id));
      } else {
        setBookmarkedIds([]);
      }
    } else {
      setBookmarkedIds([]);
    }
  }, [user?.id]);

  // Keep search state when returning from a post; only refresh history and bookmarks
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
      return;
    }

    setIsSearching(true);
    setLoading(true);

    const isCategory = isFoodCategory(queryStr);
    if (saveHistory && !isCategory) {
      await addSearchHistory(queryStr);
      loadHistory();
    }

    const results = await searchPosts(queryStr);
    setSearchResults(results || []);

    setLoading(false);
  };

  const handleSearchSubmit = () => {
    performSearch(inputValue, true);
  };

  const handleClearHistory = async (index: number) => {
    const item = recentSearches[index];
    if (item.id) {
      await deleteSearchHistoryItem(item.id);
    }
    setRecentSearches(prev => prev.filter((_, i) => i !== index));
  };

  const handleClearAllHistory = async () => {
    await clearAllSearchHistory();
    setRecentSearches([]);
  };

  const handleTrendPress = (text: string) => {
    setInputValue(text);
    performSearch(text, false);
  };

  const handleHistoryPress = (text: string) => {
    setInputValue(text);
    performSearch(text, false);
  };

  const handlePostPress = (post: PopupPostData) => {
    setCachedPostList(searchResults);
    router.push({
      pathname: "/OtherPost",
      params: {
        postId: post.id,
        post: JSON.stringify(post),
      },
    });
  };

  const handlePostLongPress = (post: PopupPostData) => {
    setPopupPost(post);
  };

  const handleToggleBookmark = async (postId: string) => {
    const isCurrentlyBookmarked = bookmarkedIds.includes(postId);
    setBookmarkedIds((prev) =>
      isCurrentlyBookmarked ? prev.filter((id) => id !== postId) : [...prev, postId]
    );
    
    if (user?.id) {
      if (isCurrentlyBookmarked) {
        await unbookmarkPost(postId);
      } else {
        await bookmarkPost(postId);
      }
    }
  };

  const handleRequestDelete = (postId: string) => {
    setDeletePostId(postId);
    setPopupPost(null);
    setDeletePopupVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletePostId) return;
    const idToDelete = deletePostId;
    
    setSearchResults((prev) => prev.filter((p) => p.id !== idToDelete));
    setBookmarkedIds((prev) => prev.filter((id) => id !== idToDelete));
    setDeletePostId(null);
    setDeletePopupVisible(false);
    
    await deletePost(idToDelete);
  };

  const handleCancelDelete = () => {
    setDeletePostId(null);
    setDeletePopupVisible(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <Header
        title="ค้นหาสิ่งที่สนใจ"
        leftIcon="back"
        onLeftPress={() => {
          if (isSearching) {
            setIsSearching(false);
            setInputValue('');
            setSearchResults([]);
          } else {
            if (from) {
              router.push(decodeURIComponent(from) as any);
            } else {
              router.push('/');
            }
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
          {inputValue.length > 0 && (
            <Pressable
              onPress={() => {
                setInputValue('');
                setIsSearching(false);
                setSearchResults([]);
              }}
              hitSlop={8}
            >
              <Feather name="x" size={18} color="#A0938F" style={{ marginRight: 4 }} />
            </Pressable>
          )}
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
          <PostSkeleton count={2} />
        ) : (
          /* Grid View Mode */
          <View style={styles.gridContainer}>
            {searchResults.length > 0 ? (
              <PostGrid
                posts={searchResults}
                onPressPost={handlePostPress}
                onLongPressPost={handlePostLongPress}
              />
            ) : (
              <View style={styles.emptyContainer}>
                <ThemedText style={styles.emptyText}>ไม่พบผลการค้นหา</ThemedText>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Popup Post Modal */}
      <PopupPost
        visible={popupPost !== null}
        post={popupPost}
        onClose={() => setPopupPost(null)}
        isOwnPost={!!user && popupPost?.userId === user.id}
        isBookmarked={popupPost ? bookmarkedIds.includes(popupPost.id) : false}
        onBookmark={handleToggleBookmark}
        onRequestDelete={handleRequestDelete}
        onUserPress={(postUserId) => {
          setPopupPost(null);
          if (user && postUserId === user.id) {
            router.push("/(tabs)/profile");
          } else {
            router.push({
              pathname: "/OtherProfile",
              params: { userId: postUserId },
            });
          }
        }}
      />

      <DeletePopup
        visible={deletePopupVisible}
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
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
});
