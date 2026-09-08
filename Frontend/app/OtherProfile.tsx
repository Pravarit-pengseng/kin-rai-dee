import React, { useEffect, useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { Header } from "@/components/Header";
import { ThemedText } from "@/components/themed-text";
import PostGrid, {
  Post,
} from "@/components/post-grid";
import LiquidMenu from "@/components/liquid-menu";
import PopupPost from "@/components/popup-post";
import { getUserProfile, getUserPosts, UserProfile } from "@/services/profileService";
import { bookmarkPost, unbookmarkPost, getSavedPosts, mapPostToPopup } from "@/services/postService";
import { useAuth } from "@/context/AuthContext";

const DEFAULT_AVATAR = require("../assets/images/ProfilePicture.png");
const DEFAULT_IMAGE = require("../assets/images/StirFriedHolyBasil.png");

export default function OtherProfileScreen() {
  const { user } = useAuth();
  const { userId } = useLocalSearchParams<{ userId?: string }>();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);

  const [selectedPost, setSelectedPost] =
    useState<any | null>(null);

  const [popupVisible, setPopupVisible] =
    useState(false);

  const [bookmarkedIds, setBookmarkedIds] =
    useState<string[]>([]);

  useEffect(() => {
    if (!userId) {
      setLoadingProfile(false);
      setLoadingPosts(false);
      return;
    }

    // โหลด profile
    getUserProfile(userId).then((data) => {
      setProfile(data);
      setLoadingProfile(false);
    });

    // โหลด posts
    getUserPosts(userId).then((apiPosts) => {
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
      
      setLoadingPosts(false);
    });
  }, [userId, user?.id]);

  const handleMenuChange = (id: string) => {
    if (id === "home") router.replace("/");
    else if (id === "random") router.replace("/(tabs)/random-food");
    else if (id === "ingredients") router.replace("/(tabs)/random-ingredient");
    else if (id === "profile") router.replace("/(tabs)/profile");
  };

  const handleToggleBookmark = async (
    postId: string
  ) => {
    const isCurrentlyBookmarked = bookmarkedIds.includes(postId);
    setBookmarkedIds((prev) =>
      isCurrentlyBookmarked
        ? prev.filter((id) => id !== postId)
        : [...prev, postId]
    );
    if (isCurrentlyBookmarked) {
      await unbookmarkPost(postId);
    } else {
      await bookmarkPost(postId);
    }
  };

  const handleOpenPost = (post: Post) => {
    if (!userId) return;
    router.push({
      pathname: "/OtherPost",
      params: {
        postId: post.id,
        ownerId: userId,
      },
    });
  };

  const isLoading = loadingProfile || loadingPosts;

  return (
    <>
      {/* Hide Expo Router system header */}
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        {/* Header */}
        <Header
          title="KIN RAI DEE"
          leftIcon="back"
          onLeftPress={() => router.back()}
          rightIcon="search"
          onSearchPress={() => router.push("/(tabs)/search")}
        />

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#DCA64E" />
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={
              styles.scrollContent
            }
          >
            {/* Profile Header */}
            <View style={styles.profileSection}>
              {/* Avatar */}
              <View style={styles.avatarOuter}>
                <View style={styles.avatarInner}>
                  <Image
                    source={
                      profile?.avatar_url
                        ? { uri: profile.avatar_url }
                        : DEFAULT_AVATAR
                    }
                    style={styles.avatar}
                    contentFit="contain"
                    transition={200}
                  />
                </View>
              </View>

              {/* Name */}
              <ThemedText style={styles.name}>
                {profile?.display_name || profile?.username || "ผู้ใช้งาน"}
              </ThemedText>

              {/* Username */}
              <ThemedText style={styles.username}>
                @{profile?.username || "user"}
              </ThemedText>

              {/* Bio */}
              {profile?.bio ? (
                <View style={styles.bio}>
                  <ThemedText
                    style={styles.bioText}
                    numberOfLines={1}
                  >
                    {profile.bio}
                  </ThemedText>
                </View>
              ) : null}
            </View>

            {/* Posts Title */}
            <View style={styles.postsHeader}>
              <ThemedText style={styles.postsTitle}>
                โพสต์ทั้งหมด
              </ThemedText>
            </View>

            {/* Post Grid */}
            {posts.length > 0 ? (
              <PostGrid
                posts={posts}
                onPressPost={handleOpenPost}
                onLongPressPost={(post) => {
                  setSelectedPost(post);
                  setPopupVisible(true);
                }}
              />
            ) : (
              <View style={styles.empty}>
                <ThemedText style={styles.emptyText}>
                  ยังไม่มีโพสต์
                </ThemedText>
              </View>
            )}
          </ScrollView>
        )}

        {/* Bottom Menu */}
        <LiquidMenu
          active="home"
          onChange={handleMenuChange}
        />

        {/* Popup Post */}
        <PopupPost
          visible={popupVisible}
          post={selectedPost}
          onClose={() => {
            setPopupVisible(false);
            setSelectedPost(null);
          }}
          isOwnPost={false}
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
        />
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF9F6",
  },

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  scrollContent: {
    paddingBottom: 100,
  },

  /* Profile Header */
  profileSection: {
    alignItems: "center",
    paddingTop: 20,
  },

  /* Avatar */
  avatarOuter: {
    width: 110,
    height: 110,
    marginBottom: 10,
    borderRadius: 55,
    borderWidth: 3,
    borderColor: "#F3D6D0",
    backgroundColor: "#FFF1B8",
    padding: 4,
  },

  avatarInner: {
    width: "100%",
    height: "100%",
    overflow: "hidden",
    borderRadius: 40,
    backgroundColor: "#FFF8E5",
    alignItems: "center",
    justifyContent: "center",
  },

  avatar: {
    width: "100%",
    height: "100%",
  },

  /* Name */
  name: {
    fontSize: 20,
    lineHeight: 30,
    fontFamily: "NotoSansThai_700Bold",
    fontWeight: "800",
    color: "#241917",
    marginBottom: 3,
  },

  /* Username */
  username: {
    marginTop: 5,
    marginBottom: 3,
    fontSize: 12,
    color: "#57423E",
  },

  /* Bio */
  bio: {
    minHeight: 40,
    width: 220,
    marginTop: 13,
    marginBottom: 8,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#A9968E",
    borderRadius: 13,
  },

  bioText: {
    fontSize: 14,
    textAlign: "center",
    color: "#241917",
  },

  /* Posts */
  postsHeader: {
    height: 48,
    marginTop: 16,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 12,
    borderBottomWidth: 1.5,
    borderBottomColor: "#A7392A",
  },

  postsTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#A7392A",
  },

  /* Empty */
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