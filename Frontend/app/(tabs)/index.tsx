import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { View, FlatList, StyleSheet, Pressable, ActivityIndicator, RefreshControl, Platform } from "react-native";
import { SafeAreaView } from "@/components/SafeAreaView";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { SquarePen } from "lucide-react-native";

import { Header } from "@/components/Header";
import PopupPost, { PopupPostData } from "@/components/popup-post";
import PostSkeleton from "@/components/PostSkeleton";
import DeletePopup from "@/components/DeletePopup";
import { ThemedText } from "@/components/themed-text";
import { useAuth } from "@/context/AuthContext";
import {
  fetchFeedPosts,
  bookmarkPost,
  unbookmarkPost,
  deletePost,
  getSavedPostIds,
  getCachedFeedPosts,
  FEED_PAGE_SIZE,
} from "@/services/postService";
import { subscribeUserBlocked } from "@/services/safetyService";
import { Typography } from "@/constants/typography";

export default function HomeScreen() {
  const { isLoggedIn, user } = useAuth();
  const insets = useSafeAreaInsets();
  const menuBottomOffset = Math.max(insets.bottom, 12);
  const [posts, setPosts] = useState<PopupPostData[]>(() => getCachedFeedPosts());
  const [loading, setLoading] = useState(() => getCachedFeedPosts().length === 0);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [deletePostId, setDeletePostId] = useState<string | null>(null);

  const scrollRef = useRef<FlatList<PopupPostData>>(null);
  const params = useLocalSearchParams<{ refresh?: string }>();
  const postsRef = useRef<PopupPostData[]>([]);
  const loadingMoreRef = useRef(false);
  const hasMoreRef = useRef(true);

  useEffect(() => {
    postsRef.current = posts;
  }, [posts]);

  useEffect(() => {
    loadingMoreRef.current = loadingMore;
  }, [loadingMore]);

  useEffect(() => {
    hasMoreRef.current = hasMore;
  }, [hasMore]);

  useEffect(() => {
    return subscribeUserBlocked((blockedUserId) => {
      setPosts((prev) => prev.filter((p) => String(p.userId) !== String(blockedUserId)));
    });
  }, []);

  useEffect(() => {
    if (params.refresh) {
      scrollRef.current?.scrollToOffset({ offset: 0, animated: true });
      loadFeed(true);
    }
  }, [params.refresh]);

  const loadFeed = useCallback(async (forceRefresh = false) => {
    if (postsRef.current.length === 0) {
      setLoading(true);
    }

    try {
      // 1. Fetch initial batch (fast direct join, 6 posts)
      const fetched = await fetchFeedPosts(FEED_PAGE_SIZE, 0, forceRefresh);
      if (fetched && fetched.length > 0) {
        setPosts(fetched);
        setHasMore(fetched.length >= FEED_PAGE_SIZE);
      } else {
        setHasMore(false);
      }
    } catch (e) {
      console.warn("Failed to load feed:", e);
    } finally {
      // Stop skeleton immediately once posts are ready!
      setLoading(false);
    }

    // 2. Sync bookmarks in background with lightweight ID query (~100 bytes)
    if (isLoggedIn) {
      getSavedPostIds().then((ids) => {
        setBookmarkedIds(ids);
      }).catch(() => { });
    } else {
      setBookmarkedIds([]);
    }
  }, [isLoggedIn]);

  const handleLoadMore = useCallback(async () => {
    if (loadingMoreRef.current || !hasMoreRef.current || loading || refreshing) {
      return;
    }

    const currentOffset = postsRef.current.length;
    if (currentOffset === 0) return;

    setLoadingMore(true);
    try {
      const nextBatch = await fetchFeedPosts(FEED_PAGE_SIZE, currentOffset);
      if (nextBatch && nextBatch.length > 0) {
        setPosts((prev) => {
          const existingIds = new Set(prev.map((p) => p.id));
          const uniqueNew = nextBatch.filter((p) => !existingIds.has(p.id));
          return [...prev, ...uniqueNew];
        });
        if (nextBatch.length < FEED_PAGE_SIZE) {
          setHasMore(false);
        }
      } else {
        setHasMore(false);
      }
    } catch (e) {
      console.warn("Failed to load more posts:", e);
    } finally {
      setLoadingMore(false);
    }
  }, [loading, refreshing]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setHasMore(true);
    await loadFeed(true);
    setRefreshing(false);
  }, [loadFeed]);

  useFocusEffect(
    useCallback(() => {
      loadFeed();
    }, [loadFeed])
  );

  const bookmarkedSet = useMemo(() => new Set(bookmarkedIds), [bookmarkedIds]);

  const handleToggleBookmark = useCallback(async (postId: string) => {
    const isCurrentlyBookmarked = bookmarkedSet.has(postId);
    // Optimistic update
    setBookmarkedIds((prev) =>
      isCurrentlyBookmarked ? prev.filter((id) => id !== postId) : [...prev, postId]
    );
    // API call (เฉพาะเมื่อ login แล้ว)
    if (isLoggedIn) {
      if (isCurrentlyBookmarked) {
        await unbookmarkPost(postId);
      } else {
        await bookmarkPost(postId);
      }
    }
  }, [bookmarkedSet, isLoggedIn]);

  const handleEditPost = useCallback((post: any) => {
    router.push({
      pathname: "/EditPost",
      params: { postId: post.id, post: JSON.stringify(post) },
    });
  }, []);

  const handleRequestDelete = useCallback((postId: string) => {
    setDeletePostId(postId);
  }, []);

  const handleCreatePost = () => {
    if (!isLoggedIn) {
      router.push({ pathname: '/(auth)/login', params: { returnTo: '/AddPost', from: '/' } });
      return;
    }
    router.push("/AddPost");
  };

  const handleUserPress = useCallback((postUserId: string) => {
    if (user && postUserId === user.id) {
      router.push("/(tabs)/profile");
    } else if (!isLoggedIn && !postUserId) {
      router.push({ pathname: '/(auth)/login', params: { returnTo: '/(tabs)/profile', from: '/' } });
    } else {
      router.push({
        pathname: "/OtherProfile",
        params: { userId: postUserId },
      });
    }
  }, [user, isLoggedIn]);

  const handleBlockUserInFeed = useCallback((blockedUserId: string) => {
    setPosts((prev) => prev.filter((p) => p.userId !== blockedUserId));
  }, []);

  const renderPostItem = useCallback(({ item: post }: { item: PopupPostData }) => (
    <View style={styles.postWrapper}>
      <PopupPost
        visible={true}
        post={post}
        onClose={() => { }}
        inline
        isOwnPost={!!user && post.userId === user.id}
        isBookmarked={bookmarkedSet.has(post.id)}
        onBookmark={handleToggleBookmark}
        onEdit={handleEditPost}
        onRequestDelete={handleRequestDelete}
        onUserPress={handleUserPress}
        onBlockUser={handleBlockUserInFeed}
      />
    </View>
  ), [user, bookmarkedSet, handleToggleBookmark, handleEditPost, handleRequestDelete, handleUserPress, handleBlockUserInFeed]);

  const keyExtractor = useCallback((item: PopupPostData) => item.id, []);

  const listHeader = useMemo(() => (
    <>
      {/* Title Section */}
      <View style={styles.titleContainer}>
        <ThemedText style={styles.pageTitle}>วันนี้กินอะไรกันดี?</ThemedText>
        <MaterialCommunityIcons name="silverware-fork-knife" size={26} color="#DCA64E" />
      </View>

      {!refreshing && loading && posts.length === 0 && (
        <PostSkeleton count={2} />
      )}
    </>
  ), [refreshing, loading, posts.length]);

  const listFooter = useMemo(() => (
    loadingMore ? (
      <View style={styles.loadMoreContainer}>
        <ActivityIndicator size="small" color="#DCA64E" />
      </View>
    ) : undefined
  ), [loadingMore]);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar style="dark" />
      <Header
        title="KIN RAI DEE"
        leftIcon="none"
        rightIcon="search"
        onSearchPress={() =>
          router.push('/(tabs)/search?from=/')
        }
        titleStyle={styles.headerTitle}
      />

      <FlatList
        ref={scrollRef}
        data={posts}
        keyExtractor={keyExtractor}
        renderItem={renderPostItem}
        ListHeaderComponent={listHeader}
        ListFooterComponent={listFooter}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 98 + menuBottomOffset }]}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.4}
        initialNumToRender={4}
        maxToRenderPerBatch={3}
        windowSize={5}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#DCA64E"]}
            tintColor="#DCA64E"
          />
        }
      />

      {/* Floating Action Button */}
      <Pressable
        style={({ pressed }) => [
          styles.fab,
          { bottom: 78 + menuBottomOffset },
          pressed && styles.buttonPressed,
        ]}
        onPress={handleCreatePost}
      >
        <SquarePen size={18} color="#721209" strokeWidth={2.5} />
        <ThemedText style={styles.fabText}>โพสต์ใหม่</ThemedText>
      </Pressable>

      <DeletePopup
        visible={deletePostId !== null}
        onCancel={() => setDeletePostId(null)}
        onConfirm={async () => {
          if (deletePostId) {
            const idToDelete = deletePostId;
            setPosts((prev) => prev.filter((p) => p.id !== idToDelete));
            setDeletePostId(null);
            await deletePost(idToDelete);
          }
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFF8F6" },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 110 },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  headerTitle: {
    fontSize: 20,
    color: '#A7392A',
    letterSpacing: 0.5,
    fontFamily: 'NotoSansThai_700Bold',
  },
  pageTitle: {
    fontSize: 22,
    lineHeight: 34,
    fontFamily: 'NotoSansThai_700Bold',
    fontWeight: "bold",
    color: "#46302B",
  },
  postWrapper: { marginBottom: 16 },
  loadMoreContainer: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  fab: {
    position: "absolute",
    bottom: 90,
    right: 16,
    height: 48,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 24,
    backgroundColor: "#FCE5DD",
    borderWidth: 1,
    borderColor: "#EAD2CB",
    borderBottomWidth: 4,
    borderBottomColor: "#EAD2CB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  fabText: {
    fontSize: 16,
    fontFamily: Typography.bold,
    fontWeight: "800",
    color: "#721209",
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ translateY: 2 }],
  },
});
