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
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useAuth } from "@/context/AuthContext";
import { getUserPosts } from "@/services/profileService";
import {
  bookmarkPost,
  unbookmarkPost,
  getSavedPosts,
  mapPostToPopup,
  deletePost,
  getPostDetail,
} from "@/services/postService";
import { getCachedPostList } from "@/services/postCache";

export default function OtherPostScreen() {
  const { isLoggedIn, user } = useAuth();
  const {
    postId,
    ownerId,
    post: postParam,
  } = useLocalSearchParams<{
    postId?: string;
    ownerId?: string;
    post?: string;
  }>();

  const scrollRef = useRef<ScrollView>(null);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [deletePostId, setDeletePostId] = useState<string | null>(null);
  const [deletePopupVisible, setDeletePopupVisible] = useState(false);

  // Initialize posts from memory cache or param
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

  const [loading, setLoading] = useState(() => posts.length === 0);

  const targetIndex = posts.findIndex((post) => post.id === postId);
  const [ready, setReady] = useState(() => targetIndex <= 0);
  const hasScrolledRef = useRef(targetIndex <= 0);

  // Reset on postId change
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

  // Load from API if needed or sync bookmarks
  useEffect(() => {
    if (ownerId) {
      if (posts.length === 0) setLoading(true);
      getUserPosts(ownerId)
        .then((apiPosts) => {
          if (apiPosts && apiPosts.length > 0) {
            setPosts(apiPosts.map(mapPostToPopup));
          }
          if (user?.id) {
            getSavedPosts()
              .then((saved) => {
                if (saved && saved.length > 0) {
                  setBookmarkedIds(saved.map((s) => s.id));
                }
              })
              .catch(() => {});
          }
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
        });
    } else if (postId && posts.length === 0) {
      setLoading(true);
      getPostDetail(postId)
        .then((detail) => {
          if (detail) {
            setPosts([detail]);
          }
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
        });

      if (user?.id) {
        getSavedPosts()
          .then((saved) => {
            if (saved && saved.length > 0) {
              setBookmarkedIds(saved.map((s) => s.id));
            }
          })
          .catch(() => {});
      }
    } else {
      if (user?.id) {
        getSavedPosts()
          .then((saved) => {
            if (saved && saved.length > 0) {
              setBookmarkedIds(saved.map((s) => s.id));
            }
          })
          .catch(() => {});
      }
      setLoading(false);
    }
  }, [ownerId, postId, user?.id]);

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

  // Bookmark toggle
  const handleToggleBookmark = async (id: string) => {
    const isCurrentlyBookmarked = bookmarkedIds.includes(id);
    setBookmarkedIds((prev) =>
      isCurrentlyBookmarked ? prev.filter((b) => b !== id) : [...prev, id]
    );
    if (isCurrentlyBookmarked) await unbookmarkPost(id);
    else await bookmarkPost(id);
  };

  // Edit post
  const handleEditPost = (post: PopupPostData) => {
    router.push({
      pathname: "/EditPost",
      params: { postId: post.id, post: JSON.stringify(post) },
    });
  };

  // Delete post
  const handleRequestDelete = (id: string) => {
    setDeletePostId(id);
    setDeletePopupVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletePostId) return;
    const id = deletePostId;
    setPosts((prev) => prev.filter((p) => p.id !== id));
    setBookmarkedIds((prev) => prev.filter((b) => b !== id));
    setDeletePostId(null);
    setDeletePopupVisible(false);
    await deletePost(id);
  };

  const handleCancelDelete = () => {
    setDeletePostId(null);
    setDeletePopupVisible(false);
  };

  // User press -> View profile
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

  // Bottom menu navigation
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

  return (
    <>
      <Stack.Screen options={{ headerShown: false, animation: "none" }} />
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <Header
          title="KIN RAI DEE"
          leftIcon="back"
          onLeftPress={() => router.back()}
          rightIcon="search"
          onSearchPress={() =>
            router.push(
              `/(tabs)/search?from=${encodeURIComponent(
                `/OtherPost?postId=${postId}&ownerId=${ownerId || ""}`
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
          <View style={styles.mainWrapper}>
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

        <LiquidMenu active="home" onChange={handleMenuChange} />

        <DeletePopup
          visible={deletePopupVisible}
          onCancel={handleCancelDelete}
          onConfirm={handleConfirmDelete}
        />
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF8F6",
  },
  mainWrapper: {
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