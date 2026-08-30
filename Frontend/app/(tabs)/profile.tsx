import React, { useEffect, useState } from "react";
import {
  View,
  ScrollView,
  Pressable,
  StyleSheet,
} from "react-native";
import {
  router,
  useLocalSearchParams,
} from "expo-router";

import PostGrid, { Post } from "@/components/PostGrid";
import LiquidMenu from "@/components/LiquidMenu";
import PopupPost from "@/components/PopupPost";
import DeletePostPopup from "@/components/DeletePopup";
import ProfileHeader from "@/components/ProfileHeader";
import { ThemedText } from "@/components/themed-text";

const CURRENT_USER_ID = "me";

const allPosts: Post[] = Array.from(
  { length: 9 },
  (_, index) => ({
    id: String(index + 1),
    image: require("../../assets/images/StirFriedHolyBasil.png"),
    userId: CURRENT_USER_ID,
  }),
);

export default function ProfileScreen() {
  const params = useLocalSearchParams<{
    name?: string;
    username?: string;
    bio?: string;
    post?: string;
    mode?: string;
  }>();

  const [posts, setPosts] = useState<Post[]>(allPosts);
  const [selectedPost, setSelectedPost] =
    useState<Post | null>(null);
  const [popupVisible, setPopupVisible] = useState(false);
  const [deletePopupVisible, setDeletePopupVisible] =
    useState(false);
  const [deletePostId, setDeletePostId] =
    useState<string | null>(null);
  const [bookmarkedIds, setBookmarkedIds] =
    useState<string[]>([]);
  const [activeTab, setActiveTab] =
    useState<"posts" | "saved">("posts");

  useEffect(() => {
    if (!params.post) return;

    try {
      const post = JSON.parse(
        Array.isArray(params.post)
          ? params.post[0]
          : params.post,
      ) as Post;

      if (!post.id || !post.image) return;

      const mode = Array.isArray(params.mode)
        ? params.mode[0]
        : params.mode;

      setPosts((prev) => {
        if (mode === "edit") {
          return prev.some((item) => item.id === post.id)
            ? prev.map((item) =>
                item.id === post.id ? post : item,
              )
            : prev;
        }

        return prev.some((item) => item.id === post.id)
          ? prev
          : [post, ...prev];
      });
    } catch {
      // Ignore invalid post parameter
    }
  }, [params.post, params.mode]);

  const handleLongPress = (post: Post) => {
    setSelectedPost(post);
    setPopupVisible(true);
  };

  const handleToggleBookmark = (postId: string) => {
    setBookmarkedIds((prev) =>
      prev.includes(postId)
        ? prev.filter((id) => id !== postId)
        : [...prev, postId],
    );
  };

  const handleRequestDelete = (postId: string) => {
    setDeletePostId(postId);
    setSelectedPost(null);
    setPopupVisible(false);
    setDeletePopupVisible(true);
  };

  const handleEditPost = (post: Post) => {
    setSelectedPost(null);
    setPopupVisible(false);

    router.push({
      pathname: "/EditPost",
      params: {
        post: JSON.stringify(post),
      },
    });
  };

  const handleConfirmDelete = () => {
    if (!deletePostId) return;

    setPosts((prev) =>
      prev.filter((post) => post.id !== deletePostId),
    );

    setBookmarkedIds((prev) =>
      prev.filter((id) => id !== deletePostId),
    );

    setDeletePostId(null);
    setDeletePopupVisible(false);
  };

  const handleCancelDelete = () => {
    setDeletePostId(null);
    setDeletePopupVisible(false);
  };

  const handleEditProfile = () => {
    router.push({
      pathname: "/EditProfile",
      params: {
        name: params.name,
        username: params.username,
        bio: params.bio,
      },
    });
  };

  const handleCreatePost = () => {
    router.push("/AddPost");
  };

  const handleOpenPost = (post: Post) => {
    router.push({
      pathname: "/MyPost",
      params: {
        postId: post.id,
        ownerId: post.userId ?? CURRENT_USER_ID,
        post: JSON.stringify(post),
      },
    });
  };

  const savedPosts = posts.filter((post) =>
    bookmarkedIds.includes(post.id),
  );

  const displayPosts =
    activeTab === "posts" ? posts : savedPosts;

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <ProfileHeader
          name={params.name}
          username={params.username}
          bio={params.bio}
          onEditProfile={handleEditProfile}
          onCreatePost={handleCreatePost}
        />

        <View style={styles.tabsContainer}>
          {(["posts", "saved"] as const).map((tab) => (
            <Pressable
              key={tab}
              style={styles.tab}
              onPress={() => setActiveTab(tab)}
            >
              <ThemedText
                style={[
                  styles.tabText,
                  activeTab === tab &&
                    styles.activeTabText,
                ]}
              >
                {tab === "posts"
                  ? "โพสต์ของฉัน"
                  : "บันทึกไว้"}
              </ThemedText>
            </Pressable>
          ))}

          <View
            style={[
              styles.tabIndicator,
              activeTab === "posts"
                ? styles.tabIndicatorLeft
                : styles.tabIndicatorRight,
            ]}
          />
        </View>

        {displayPosts.length > 0 ? (
          <PostGrid
            posts={displayPosts}
            onPressPost={handleOpenPost}
            onLongPressPost={handleLongPress}
          />
        ) : (
          <View style={styles.empty}>
            <ThemedText style={styles.emptyText}>
              {activeTab === "posts"
                ? "ยังไม่มีโพสต์"
                : "ยังไม่มีโพสต์ที่บันทึกไว้"}
            </ThemedText>
          </View>
        )}
      </ScrollView>

      <PopupPost
        visible={popupVisible}
        post={selectedPost}
        onClose={() => {
          setPopupVisible(false);
          setSelectedPost(null);
        }}
        isOwnPost={
          selectedPost?.userId === CURRENT_USER_ID
        }
        isBookmarked={
          selectedPost
            ? bookmarkedIds.includes(selectedPost.id)
            : false
        }
        onBookmark={handleToggleBookmark}
        onEdit={handleEditPost}
        onRequestDelete={handleRequestDelete}
      />

      <DeletePostPopup
        visible={deletePopupVisible}
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
      />

      <LiquidMenu
        active="profile"
        onChange={() => {}}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF9F6",
  },

  scrollContent: {
    paddingBottom: 105,
  },

  tabsContainer: {
    height: 48,
    marginTop: 5,
    flexDirection: "row",
    position: "relative",
    borderBottomWidth: 1,
    borderBottomColor: "#EADBD6",
  },

  tab: {
    width: "50%",
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },

  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#756B67",
  },

  activeTabText: {
    color: "#A7392A",
    fontWeight: "700",
  },

  tabIndicator: {
    position: "absolute",
    bottom: -1,
    width: "50%",
    height: 2,
    backgroundColor: "#A7392A",
  },

  tabIndicatorLeft: {
    left: 0,
  },

  tabIndicatorRight: {
    left: "50%",
  },

  empty: {
    paddingVertical: 80,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyText: {
    fontSize: 13,
    color: "#9B8E89",
  },
});