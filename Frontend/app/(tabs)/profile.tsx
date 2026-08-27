import React, { useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import {
  View,
  ScrollView,
  Pressable,
  StyleSheet,
} from "react-native";
import PostGrid, {
  Post,
} from "@/components/PostGrid";
import LiquidMenu from "@/components/LiquidMenu";
import PopupPost from "@/components/PopupPost";
import DeletePostPopup from "@/components/DeletePopup";
import ProfileHeader from "@/components/ProfileHeader";
import { ThemedText } from "@/components/themed-text";

const CURRENT_USER_ID = "me";

const allPosts: Post[] = [
  {
    id: "1",
    image: require("../../assets/images/StirFriedHolyBasil.png"),
    userId: CURRENT_USER_ID,
  },
  {
    id: "2",
    image: require("../../assets/images/StirFriedHolyBasil.png"),
    userId: CURRENT_USER_ID,
  },
  {
    id: "3",
    image: require("../../assets/images/StirFriedHolyBasil.png"),
    userId: CURRENT_USER_ID,
  },
  {
    id: "4",
    image: require("../../assets/images/StirFriedHolyBasil.png"),
    userId: CURRENT_USER_ID,
  },
  {
    id: "5",
    image: require("../../assets/images/StirFriedHolyBasil.png"),
    userId: CURRENT_USER_ID,
  },
  {
    id: "6",
    image: require("../../assets/images/StirFriedHolyBasil.png"),
    userId: CURRENT_USER_ID,
  },
  {
    id: "7",
    image: require("../../assets/images/StirFriedHolyBasil.png"),
    userId: CURRENT_USER_ID,
  },
  {
    id: "8",
    image: require("../../assets/images/StirFriedHolyBasil.png"),
    userId: CURRENT_USER_ID,
  },
  {
    id: "9",
    image: require("../../assets/images/StirFriedHolyBasil.png"),
    userId: CURRENT_USER_ID,
  },
];

export default function ProfileScreen() {
  /*
   * Get updated profile data from EditProfile.
   */
  const params = useLocalSearchParams<{
    name?: string;
    username?: string;
    bio?: string;
  }>();

  const [posts, setPosts] =
    useState<Post[]>(allPosts);

  const [selectedPost, setSelectedPost] =
    useState<Post | null>(null);

  const [popupVisible, setPopupVisible] =
    useState(false);

  const [deletePopupVisible, setDeletePopupVisible] =
    useState(false);

  const [deletePostId, setDeletePostId] =
    useState<string | null>(null);

  const [bookmarkedIds, setBookmarkedIds] =
    useState<string[]>([]);

  const [activeTab, setActiveTab] =
    useState<"posts" | "saved">("posts");

  const handleMenuChange = (id: string) => {
    // Bottom menu navigation is handled by LiquidMenu
  };

  /*
   * Toggle bookmark.
   */
  const handleToggleBookmark = (
    postId: string
  ) => {
    setBookmarkedIds((prev) =>
      prev.includes(postId)
        ? prev.filter(
            (id) => id !== postId
          )
        : [...prev, postId]
    );
  };

  /*
   * Open delete confirmation.
   */
  const handleRequestDelete = (
    postId: string
  ) => {
    setDeletePostId(postId);
    setPopupVisible(false);
    setSelectedPost(null);
    setDeletePopupVisible(true);
  };

  /*
   * Cancel delete.
   */
  const handleCancelDelete = () => {
    setDeletePopupVisible(false);
    setDeletePostId(null);
  };

  /*
   * Confirm delete.
   */
  const handleConfirmDelete = () => {
    if (!deletePostId) {
      return;
    }

    setPosts((prev) =>
      prev.filter(
        (post) =>
          post.id !== deletePostId
      )
    );

    setBookmarkedIds((prev) =>
      prev.filter(
        (id) =>
          id !== deletePostId
      )
    );

    setDeletePopupVisible(false);
    setDeletePostId(null);
  };

  /*
   * Open EditProfile.
   *
   * Pass the current profile data so
   * EditProfile can display the latest values.
   */
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

  /*
   * Create a new post.
   */
  const handleCreatePost = () => {
    const newPost: Post = {
      id: Date.now().toString(),
      image: require(
        "../../assets/images/StirFriedHolyBasil.png"
      ),
      userId: CURRENT_USER_ID,
    };

    setPosts((prev) => [
      newPost,
      ...prev,
    ]);

    setActiveTab("posts");
  };

  /*
   * Open Post screen.
   */
  const handleOpenPost = (
    post: Post
  ) => {
    router.push({
      pathname: "/MyPost",
      params: {
        postId: post.id,
        ownerId:
          post.userId ??
          CURRENT_USER_ID,
      },
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          styles.scrollContent
        }
      >
        {/* Profile Header */}
        <ProfileHeader
          name={params.name}
          username={params.username}
          bio={params.bio}
          onEditProfile={
            handleEditProfile
          }
          onCreatePost={
            handleCreatePost
          }
        />

        {/* Tabs */}
        <View
          style={styles.tabsContainer}
        >
          <Pressable
            style={styles.tab}
            onPress={() =>
              setActiveTab("posts")
            }
          >
            <ThemedText
              style={[
                styles.tabText,
                activeTab === "posts" &&
                  styles.activeTabText,
              ]}
            >
              โพสต์ของฉัน
            </ThemedText>
          </Pressable>

          <Pressable
            style={styles.tab}
            onPress={() =>
              setActiveTab("saved")
            }
          >
            <ThemedText
              style={[
                styles.tabText,
                activeTab === "saved" &&
                  styles.activeTabText,
              ]}
            >
              บันทึกไว้
            </ThemedText>
          </Pressable>

          <View
            style={[
              styles.tabIndicator,
              activeTab === "posts"
                ? styles.tabIndicatorLeft
                : styles.tabIndicatorRight,
            ]}
          />
        </View>

        {/* My Posts */}
        {activeTab === "posts" ? (
          <>
            {posts.length > 0 ? (
              <PostGrid
                posts={posts}
                onPressPost={
                  handleOpenPost
                }
                onLongPressPost={(post) => {
                  setSelectedPost(post);
                  setPopupVisible(true);
                }}
              />
            ) : (
              <View
                style={styles.empty}
              >
                <ThemedText
                  style={
                    styles.emptyText
                  }
                >
                  ยังไม่มีโพสต์
                </ThemedText>
              </View>
            )}
          </>
        ) : (
          /* Saved Posts */
          <View
            style={styles.savedContainer}
          >
            {bookmarkedIds.length > 0 ? (
              <PostGrid
                posts={posts.filter(
                  (post) =>
                    bookmarkedIds.includes(
                      post.id
                    )
                )}
                onPressPost={
                  handleOpenPost
                }
                onLongPressPost={(post) => {
                  setSelectedPost(post);
                  setPopupVisible(true);
                }}
              />
            ) : (
              <View
                style={styles.empty}
              >
                <ThemedText
                  style={
                    styles.emptyText
                  }
                >
                  ยังไม่มีโพสต์ที่บันทึกไว้
                </ThemedText>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Post Popup */}
      <PopupPost
        visible={popupVisible}
        post={selectedPost}
        onClose={() => {
          setPopupVisible(false);
          setSelectedPost(null);
        }}
        isOwnPost={
          selectedPost?.userId ===
          CURRENT_USER_ID
        }
        isBookmarked={
          selectedPost
            ? bookmarkedIds.includes(
                selectedPost.id
              )
            : false
        }
        onBookmark={
          handleToggleBookmark
        }
        onRequestDelete={
          handleRequestDelete
        }
      />

      {/* Delete Popup */}
      <DeletePostPopup
        visible={
          deletePopupVisible
        }
        onCancel={
          handleCancelDelete
        }
        onConfirm={
          handleConfirmDelete
        }
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

  savedContainer: {
    flex: 1,
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