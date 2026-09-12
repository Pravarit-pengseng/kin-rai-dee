import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import {
  View,
  ScrollView,
  StyleSheet,
} from "react-native";
import {
  Stack,
  router,
  useLocalSearchParams,
} from "expo-router";

import { Header } from "@/components/Header";
import PopupPost, { PopupPostData } from "@/components/popup-post";
import PostSkeleton from "@/components/PostSkeleton";
import LiquidMenu from "@/components/liquid-menu";
import DeletePopup from "@/components/DeletePopup";
import LogoutPopup from "@/components/LogoutPopup";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useAuth } from "@/context/AuthContext";
import {
  deletePost,
  bookmarkPost,
  unbookmarkPost,
  getSavedPosts,
  mapPostToPopup,
} from "@/services/postService";
import { getUserPosts } from "@/services/profileService";
import { getCachedPostList } from "@/services/postCache";

export default function MyPost() {
  const { isLoggedIn, logout, user } = useAuth();
  const {
    postId,
    ownerId,
    mode,
    post: postParam,
  } = useLocalSearchParams<{
    postId?: string;
    ownerId?: string;
    mode?: string;
    post?: string;
  }>();

  const scrollRef = useRef<ScrollView>(null);

  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [deletePostId, setDeletePostId] = useState<string | null>(null);
  const [logoutPopupVisible, setLogoutPopupVisible] = useState(false);

  // ---- Get initial posts from memory cache or param ----
  const [posts, setPosts] = useState<PopupPostData[]>(() => {
    const cached = getCachedPostList();
    if (cached && cached.length > 0) return cached;
    if (postParam) {
      try {
        const single = JSON.parse(postParam as string);
        if (single?.id) return [single];
      } catch { /* ignore */ }
    }
    return [];
  });

  // If posts are empty initially, we need to load from API
  const [loading, setLoading] = useState(() => posts.length === 0);

  // Check if target post is the first one or further down
  const targetIndex = posts.findIndex((p) => p.id === postId);
  // If targetIndex is 0 (or not found yet), no jump needed; otherwise wait until scrolled
  const [ready, setReady] = useState(() => targetIndex <= 0);
  const hasScrolledRef = useRef(targetIndex <= 0);

  // Reset scroll tracker on postId change
  useEffect(() => {
    const idx = posts.findIndex((p) => p.id === postId);
    if (idx > 0) {
      hasScrolledRef.current = false;
      setReady(false);
    } else {
      hasScrolledRef.current = true;
      setReady(true);
    }
  }, [postId]);

  // Fallback timer so screen never stays stuck on skeleton
  useEffect(() => {
    const timer = setTimeout(() => {
      setReady(true);
    }, 400);
    return () => clearTimeout(timer);
  }, [postId]);

  // ---- Sync posts & bookmarks from API in background ----
  useEffect(() => {
    if (mode === "saved") {
      if (posts.length === 0) setLoading(true);
      getSavedPosts().then((saved) => {
        if (saved && saved.length > 0) {
          setPosts(saved as PopupPostData[]);
          setBookmarkedIds(saved.map((s) => s.id));
        }
        setLoading(false);
      }).catch(() => {
        setLoading(false);
      });
    } else if (ownerId) {
      if (posts.length === 0) setLoading(true);
      getUserPosts(ownerId).then((apiPosts) => {
        if (apiPosts && apiPosts.length > 0) {
          setPosts(apiPosts.map(mapPostToPopup));
        }
        if (user?.id) {
          getSavedPosts().then((saved) => {
            if (saved && saved.length > 0) {
              setBookmarkedIds(saved.map((s) => s.id));
            }
          }).catch(() => {});
        }
        setLoading(false);
      }).catch(() => {
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [ownerId, mode, user?.id]);

  // Ensure all saved mode posts are marked as bookmarked initially
  useEffect(() => {
    if (mode === "saved" && posts.length > 0) {
      setBookmarkedIds((prev) => {
        const ids = posts.map((p) => p.id);
        const set = new Set([...prev, ...ids]);
        return Array.from(set);
      });
    }
  }, [mode, posts.length]);

  // Handle post measurement and scroll directly to target post
  const handlePostLayout = useCallback(
    (id: string, y: number) => {
      if (id === postId && !hasScrolledRef.current) {
        hasScrolledRef.current = true;
        scrollRef.current?.scrollTo({ y, animated: false });
        requestAnimationFrame(() => {
          setReady(true);
        });
      }
    },
    [postId]
  );

  // ---- Bookmark toggle ----
  const handleToggleBookmark = async (id: string) => {
    const isBookmarked = bookmarkedIds.includes(id);
    setBookmarkedIds((prev) =>
      isBookmarked ? prev.filter((b) => b !== id) : [...prev, id]
    );
    if (isBookmarked) await unbookmarkPost(id);
    else await bookmarkPost(id);
  };

  // ---- Edit post ----
  const handleEditPost = (post: PopupPostData) => {
    router.push({
      pathname: "/EditPost",
      params: { postId: post.id, post: JSON.stringify(post) },
    });
  };

  // ---- Delete post ----
  const handleRequestDelete = (id: string) => setDeletePostId(id);
  const handleCancelDelete = () => setDeletePostId(null);
  const handleConfirmDelete = async () => {
    if (!deletePostId) return;
    const id = deletePostId;
    setPosts((prev) => prev.filter((p) => p.id !== id));
    setBookmarkedIds((prev) => prev.filter((b) => b !== id));
    setDeletePostId(null);
    await deletePost(id);
  };

  // ---- Menu ----
  const handleMenuChange = (id: string) => {
    if (id === "home") router.replace("/");
    else if (id === "random") router.replace("/(tabs)/random-food");
    else if (id === "ingredients") router.replace("/(tabs)/random-ingredient");
    else if (id === "profile") {
      if (!isLoggedIn) {
        router.push({ pathname: "/(auth)/login", params: { returnTo: "/(tabs)/profile" } });
      } else {
        router.replace("/(tabs)/profile");
      }
    }
  };

  const handleUserPress = (postUserId: string) => {
    if (user && postUserId === user.id) {
      router.push("/(tabs)/profile");
    } else {
      router.push({
        pathname: "/OtherProfile",
        params: { userId: postUserId },
      });
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false, animation: "none" }} />

      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        <Header
          title="KIN RAI DEE"
          leftIcon="back"
          onLeftPress={() => router.back()}
          rightIcon="search"
          onSearchPress={() =>
            router.push(
              `/(tabs)/search?from=${encodeURIComponent(
                `/MyPost?postId=${postId}&ownerId=${ownerId || ""}&mode=${mode || ""}`
              )}`
            )
          }
        />

        {loading ? (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            scrollEnabled={false}
          >
            <PostSkeleton count={2} />
          </ScrollView>
        ) : (
          <View style={styles.container}>
            {/* Show skeleton while scrolling to target post (prevents post 0 flash) */}
            {!ready && (
              <View style={styles.skeletonOverlay}>
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.scrollContent}
                  scrollEnabled={false}
                >
                  <PostSkeleton count={1} />
                </ScrollView>
              </View>
            )}

            <ScrollView
              ref={scrollRef}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
              style={!ready ? styles.hidden : styles.visible}
            >
              {posts.map((post) => (
                <View
                  key={post.id}
                  style={styles.postWrapper}
                  onLayout={(e) => handlePostLayout(post.id, e.nativeEvent.layout.y)}
                >
                  <PopupPost
                    visible={true}
                    post={post}
                    onClose={() => {}}
                    inline
                    isOwnPost={post.userId === user?.id}
                    isBookmarked={bookmarkedIds.includes(post.id)}
                    onBookmark={handleToggleBookmark}
                    onEdit={handleEditPost}
                    onRequestDelete={handleRequestDelete}
                    onUserPress={handleUserPress}
                  />
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        <DeletePopup
          visible={deletePostId !== null}
          onCancel={handleCancelDelete}
          onConfirm={handleConfirmDelete}
        />

        <LogoutPopup
          visible={logoutPopupVisible}
          onCancel={() => setLogoutPopupVisible(false)}
          onConfirm={async () => {
            setLogoutPopupVisible(false);
            await logout();
            router.replace("/");
          }}
        />

        <LiquidMenu active="profile" onChange={handleMenuChange} />
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFF8F6",
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 110,
  },
  postWrapper: {
    width: "100%",
    marginBottom: 16,
  },
  skeletonOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    backgroundColor: "#FFF8F6",
  },
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
  },
});