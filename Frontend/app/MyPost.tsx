import {
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
import { safeBack } from "@/utils/navigation";

import { Header } from "@/components/Header";
import PopupPost, { PopupPostData } from "@/components/popup-post";
import PostSkeleton from "@/components/PostSkeleton";
import LiquidMenu from "@/components/liquid-menu";
import DeletePopup from "@/components/DeletePopup";
import LogoutPopup from "@/components/LogoutPopup";
import { SafeAreaView } from "@/components/SafeAreaView";
import { StatusBar } from "expo-status-bar";
import { useAuth } from "@/context/AuthContext";
import {
  deletePost,
  bookmarkPost,
  unbookmarkPost,
  getSavedPosts,
  getSavedPostIds,
  mapPostToPopup,
} from "@/services/postService";
import { getUserPosts } from "@/services/profileService";
import { getCachedPostList } from "@/services/postCache";
import { subscribeUserBlocked } from "@/services/safetyService";

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

  const targetPostId = Array.isArray(postId) ? postId[0] : postId;
  const scrollRef = useRef<any>(null);
  const userHasScrolledRef = useRef(false);
  const lastScrolledYRef = useRef<number | null>(null);

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
  const targetIndex = targetPostId ? posts.findIndex((p) => String(p.id) === String(targetPostId)) : -1;
  const [isPositioned, setIsPositioned] = useState(() => targetIndex <= 0);

  // Reset scroll tracking when target postId changes
  useEffect(() => {
    userHasScrolledRef.current = false;
    lastScrolledYRef.current = null;
    if (targetIndex <= 0) {
      setIsPositioned(true);
      return;
    }
    setIsPositioned(false);
    const fallbackTimer = setTimeout(() => setIsPositioned(true), 600);
    return () => clearTimeout(fallbackTimer);
  }, [targetPostId, targetIndex]);

  useEffect(() => {
    return subscribeUserBlocked((blockedUserId) => {
      setPosts((prev) => prev.filter((p) => String(p.userId) !== String(blockedUserId)));
    });
  }, []);

  // ---- Sync posts (only if cache empty) & lightweight bookmark IDs ----
  useEffect(() => {
    let cancelled = false;

    if (user?.id) {
      getSavedPostIds()
        .then((ids) => {
          if (!cancelled) setBookmarkedIds(ids);
        })
        .catch(() => { });
    }

    if (posts.length > 0) {
      setLoading(false);
      return () => {
        cancelled = true;
      };
    }

    if (mode === "saved") {
      getSavedPosts()
        .then((saved) => {
          if (!cancelled && saved && saved.length > 0) {
            setPosts(saved as PopupPostData[]);
            setBookmarkedIds(saved.map((s) => s.id));
          }
          if (!cancelled) setLoading(false);
        })
        .catch(() => {
          if (!cancelled) setLoading(false);
        });
    } else if (ownerId) {
      getUserPosts(ownerId)
        .then((apiPosts) => {
          if (!cancelled && apiPosts && apiPosts.length > 0) {
            setPosts(apiPosts.map(mapPostToPopup));
          }
          if (!cancelled) setLoading(false);
        })
        .catch(() => {
          if (!cancelled) setLoading(false);
        });
    } else {
      setLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, [ownerId, mode, user?.id]);



  // Handle post measurement and scroll directly to target post (tracks layout shifts until user scrolls)
  const handlePostLayout = useCallback(
    (id: string, y: number) => {
      if (!targetPostId || String(id) !== String(targetPostId)) return;
      if (userHasScrolledRef.current) return;
      if (targetIndex > 0 && y <= 0) return;
      if (lastScrolledYRef.current !== null && Math.abs(lastScrolledYRef.current - y) < 2) return;

      lastScrolledYRef.current = y;
      requestAnimationFrame(() => {
        if (!userHasScrolledRef.current) {
          scrollRef.current?.scrollTo({ y, animated: false });
          setTimeout(() => {
            setIsPositioned(true);
          }, 40);
        }
      });
    },
    [targetPostId, targetIndex]
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

      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <StatusBar style="dark" />
        <Header
          title="KIN RAI DEE"
          leftIcon="back"
          onLeftPress={() => safeBack("/(tabs)/profile")}
          rightIcon="search"
          onSearchPress={() =>
            router.push(
              `/(tabs)/search?from=${encodeURIComponent(
                `/MyPost?postId=${postId}&ownerId=${ownerId || ""}&mode=${mode || ""}`
              )}`
            )
          }
        />

        {loading && posts.length === 0 ? (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            scrollEnabled={false}
          >
            <PostSkeleton count={2} />
          </ScrollView>
        ) : (
          <View style={styles.container}>
            <ScrollView
              ref={scrollRef}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
              onScrollBeginDrag={() => {
                userHasScrolledRef.current = true;
              }}
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
                    onClose={() => { }}
                    inline
                    isOwnPost={post.userId === user?.id || post.userId === 'me'}
                    isBookmarked={bookmarkedIds.includes(post.id)}
                    onBookmark={handleToggleBookmark}
                    onEdit={handleEditPost}
                    onRequestDelete={handleRequestDelete}
                    onUserPress={handleUserPress}
                  />
                </View>
              ))}
            </ScrollView>
            {!isPositioned && <View style={styles.skeletonOverlay} pointerEvents="none" />}
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
    maxWidth: 600,
    width: "100%",
    alignSelf: "center",
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