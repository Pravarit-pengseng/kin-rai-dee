import React, { useState, useEffect, useCallback, useRef } from "react";
import { View, ScrollView, StyleSheet, Pressable, ActivityIndicator, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
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
import { fetchFeedPosts, bookmarkPost, unbookmarkPost, deletePost, getSavedPosts } from "@/services/postService";



export default function HomeScreen() {
  const { isLoggedIn, user } = useAuth();
  const [posts, setPosts] = useState<PopupPostData[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [deletePostId, setDeletePostId] = useState<string | null>(null);

  const scrollRef = useRef<ScrollView>(null);
  const params = useLocalSearchParams<{ refresh?: string }>();

  useEffect(() => {
    if (params.refresh) {
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      loadFeed();
    }
  }, [params.refresh]);

  const loadFeed = useCallback(async () => {
    setLoading(true);
    const fetched = await fetchFeedPosts();
    if (fetched && fetched.length > 0) {
      setPosts(fetched);
    }

    if (isLoggedIn) {
      const saved = await getSavedPosts();
      if (saved && saved.length > 0) {
        setBookmarkedIds(saved.map((s) => s.id));
      } else {
        setBookmarkedIds([]);
      }
    } else {
      setBookmarkedIds([]);
    }
    setLoading(false);
  }, [isLoggedIn]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadFeed();
    setRefreshing(false);
  }, [loadFeed]);

  useFocusEffect(
    useCallback(() => {
      loadFeed();
    }, [loadFeed])
  );

  const handleToggleBookmark = async (postId: string) => {
    const isCurrentlyBookmarked = bookmarkedIds.includes(postId);
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
  };

  const handleEditPost = (post: any) => {
    router.push({
      pathname: "/EditPost",
      params: { postId: post.id, post: JSON.stringify(post) },
    });
  };

  const handleRequestDelete = (postId: string) => {
    setDeletePostId(postId);
  };

  const handleCreatePost = () => {
    if (!isLoggedIn) {
      router.push({ pathname: '/(auth)/login', params: { returnTo: '/AddPost', from: '/' } });
      return;
    }
    router.push("/AddPost");
  };

  const handleUserPress = (postUserId: string) => {
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
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <Header
        title="KIN RAI DEE"
        leftIcon="none"
        rightIcon="search"
        onSearchPress={() => router.push('/(tabs)/search?from=/')}
      />

      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#DCA64E"]}
            tintColor="#DCA64E"
          />
        }
      >
        {/* Title Section */}
        <View style={styles.titleContainer}>
          <ThemedText style={styles.pageTitle}>วันนี้กินอะไรกันดี?</ThemedText>
          <MaterialCommunityIcons name="silverware-fork-knife" size={26} color="#DCA64E" />
        </View>

        {!refreshing && loading && (
          <PostSkeleton count={3} />
        )}

        {/* Posts */}
        {posts.map((post) => (
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
              onUserPress={handleUserPress}
            />
          </View>
        ))}
      </ScrollView>

      {/* Floating Action Button */}
      <Pressable
        style={({ pressed }) => [styles.fab, pressed && styles.buttonPressed]}
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
  pageTitle: {
    fontSize: 22,
    lineHeight: 34,
    fontFamily: "NotoSansThai_700Bold",
    fontWeight: "800",
    color: "#46302B",
  },
  postWrapper: { marginBottom: 16 },
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
    fontFamily: "NotoSansThai_700Bold",
    fontWeight: "800",
    color: "#721209",
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ translateY: 2 }],
  },
});
