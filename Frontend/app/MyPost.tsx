import React, {
  useEffect,
  useRef,
  useState,
} from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  ImageSourcePropType,
} from "react-native";
import {
  Stack,
  router,
  useLocalSearchParams,
} from "expo-router";

import { Header } from "@/components/Header";
import PopupPost from "@/components/popup-post";
import LiquidMenu from "@/components/liquid-menu";
import DeletePopup from "@/components/DeletePopup";
import LogoutPopup from "@/components/LogoutPopup";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useAuth } from "@/context/AuthContext";
import { deletePost, bookmarkPost, unbookmarkPost, resolveCategoryNames, getSavedPosts, mapPostToPopup } from "@/services/postService";
import { getUserPosts } from "@/services/profileService";

type Post = {
  id: string;
  image: ImageSourcePropType;
  title?: string;
  description?: string;
  tags?: string[];
  location?: string;
  timeAgo?: string;
  userId?: string;
};



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

  const scrollRef =
    useRef<ScrollView>(null);

  const [bookmarkedIds, setBookmarkedIds] =
    useState<string[]>([]);

  const [ready, setReady] =
    useState(false);

  const [posts, setPosts] =
    useState<Post[]>([]);

  // โหลดโพสต์จาก API
  useEffect(() => {
    if (mode === "saved") {
      getSavedPosts().then((saved) => {
        if (saved && saved.length > 0) {
          setPosts(saved as Post[]);
          setBookmarkedIds(saved.map((s) => s.id));
        }
      });
    } else if (ownerId) {
      getUserPosts(ownerId).then((apiPosts) => {
        if (apiPosts && apiPosts.length > 0) {
          setPosts(apiPosts.map(mapPostToPopup));
        }
        if (user?.id) {
          getSavedPosts().then((saved) => {
            if (saved && saved.length > 0) {
              setBookmarkedIds(saved.map((s) => s.id));
            }
          });
        }
      });
    }
  }, [ownerId, mode, user?.id]);

  // Store the post that the user wants to delete
  const [deletePostId, setDeletePostId] =
    useState<string | null>(null);

  const [logoutPopupVisible, setLogoutPopupVisible] =
    useState(false);

  /*
   * Add newly created post.
   */
  useEffect(() => {
    if (!postParam) {
      return;
    }

    try {
      const newPost =
        JSON.parse(postParam) as Post;

      if (!newPost.id || !newPost.image) {
        return;
      }

      setPosts((prev) => {
        const alreadyExists = prev.some(
          (post) => post.id === newPost.id
        );

        if (alreadyExists) {
          return prev;
        }

        return [newPost, ...prev];
      });
    } catch {
      // Ignore invalid post parameter
    }
  }, [postParam]);

  /*
   * Get the owner.
   */
  const currentOwnerId =
    ownerId ?? user?.id ?? '';

  /*
   * Get all posts to display.
   * If in saved mode, show all posts loaded (which are saved posts).
   * Otherwise, filter by selected owner.
   */
  const ownerPosts = mode === "saved" 
    ? posts 
    : posts.filter((post) => post.userId === currentOwnerId);

  /*
   * Find selected post.
   */
  const selectedIndex =
    ownerPosts.findIndex(
      (post) =>
        post.id === postId
    );

  /*
   * Start from selected post.
   */
  const startIndex =
    selectedIndex >= 0
      ? selectedIndex
      : 0;

  /*
   * Scroll to selected post.
   */
  useEffect(() => {
    if (!ready) {
      return;
    }

    if (startIndex === 0) {
      return;
    }

    const cardHeight = 520;

    const timer = setTimeout(() => {
      scrollRef.current?.scrollTo({
        y: startIndex * cardHeight,
        animated: false,
      });
    }, 100);

    return () => {
      clearTimeout(timer);
    };
  }, [ready, startIndex]);

  /*
   * Toggle bookmark — เรียก API จริง
   */
  const handleToggleBookmark = async (
    postId: string
  ) => {
    const isCurrentlyBookmarked = bookmarkedIds.includes(postId);
    // Optimistic update
    setBookmarkedIds((prev) =>
      isCurrentlyBookmarked
        ? prev.filter((id) => id !== postId)
        : [...prev, postId]
    );
    // API call
    if (isCurrentlyBookmarked) {
      await unbookmarkPost(postId);
    } else {
      await bookmarkPost(postId);
    }
  };

  /*
   * Open EditPost.
   *
   * Send the complete post so EditPost
   * can display the existing information.
   */
  const handleEditPost = (
    post: Post
  ) => {
    router.push({
      pathname: "/EditPost",
      params: {
        postId: post.id,
        post: JSON.stringify(post),
      },
    });
  };

  /*
   * Open delete popup.
   */
  const handleRequestDelete = (
    postId: string
  ) => {
    setDeletePostId(postId);
  };

  /*
   * Cancel delete.
   */
  const handleCancelDelete = () => {
    setDeletePostId(null);
  };

  /*
   * Confirm delete — ลบผ่าน API
   */
  const handleConfirmDelete = async () => {
    if (!deletePostId) return;

    // Optimistic UI: ลบออกจาก list ก่อน
    setPosts((prev) =>
      prev.filter((post) => post.id !== deletePostId)
    );
    setBookmarkedIds((prev) =>
      prev.filter((id) => id !== deletePostId)
    );
    setDeletePostId(null);

    // เรียก API
    await deletePost(deletePostId);
  };

  const handleMenuChange = (id: string) => {
    if (id === "home") router.replace("/");
    else if (id === "random") router.replace("/(tabs)/random-food");
    else if (id === "ingredients") router.replace("/(tabs)/random-ingredient");
    else if (id === "profile") {
      if (!isLoggedIn) {
        router.push({ pathname: '/(auth)/login', params: { returnTo: '/(tabs)/profile' } });
      } else {
        router.replace("/(tabs)/profile");
      }
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
          animation: 'none',
        }}
      />

      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        <Header
          title="KIN RAI DEE"
          leftIcon="back"
          onLeftPress={() => router.back()}
          rightIcon="search"
          onSearchPress={() => router.push("/(tabs)/search")}
        />

        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={
            styles.scrollContent
          }
          onContentSizeChange={() =>
            setReady(true)
          }
        >
          {ownerPosts.map((post) => (
            <View
              key={post.id}
              style={styles.postWrapper}
            >
              <PopupPost
                visible={true}
                post={post}
                onClose={() => { }}
                inline
                isOwnPost={
                  post.userId === user?.id ||
                  post.userId === ownerId
                }
                isBookmarked={bookmarkedIds.includes(
                  post.id
                )}
                onBookmark={
                  handleToggleBookmark
                }

                // Edit Post
                onEdit={handleEditPost}

                // Delete Post
                onRequestDelete={
                  handleRequestDelete
                }
              />
            </View>
          ))}
        </ScrollView>

        {/* Delete Popup */}
        <DeletePopup
          visible={
            deletePostId !== null
          }
          onCancel={handleCancelDelete}
          onConfirm={
            handleConfirmDelete
          }
        />

        {/* Logout Popup */}
        <LogoutPopup
          visible={logoutPopupVisible}
          onCancel={() => setLogoutPopupVisible(false)}
          onConfirm={async () => {
            setLogoutPopupVisible(false);
            await logout();
            router.replace("/");
          }}
        />

        <LiquidMenu
          active="profile"
          onChange={handleMenuChange}
        />
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFF8F6",
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
});