import React, { useState } from "react";
import {
  View,
  Image,
  ScrollView,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { router, Stack } from "expo-router";
import { Header } from "@/components/Header";
import { ThemedText } from "@/components/themed-text";
import PostGrid, {
  Post,
} from "@/components/post-grid";
import LiquidMenu from "@/components/liquid-menu";
import PopupPost from "@/components/popup-post";

const OTHER_USER_ID = "mookmhee";

const allPosts: Post[] = [
  {
    id: "1",
    image: require("../assets/images/StirFriedHolyBasil.png"),
    userId: OTHER_USER_ID,
  },
  {
    id: "2",
    image: require("../assets/images/StirFriedHolyBasil.png"),
    userId: OTHER_USER_ID,
  },
  {
    id: "3",
    image: require("../assets/images/StirFriedHolyBasil.png"),
    userId: OTHER_USER_ID,
  },
  {
    id: "4",
    image: require("../assets/images/StirFriedHolyBasil.png"),
    userId: OTHER_USER_ID,
  },
  {
    id: "5",
    image: require("../assets/images/StirFriedHolyBasil.png"),
    userId: OTHER_USER_ID,
  },
  {
    id: "6",
    image: require("../assets/images/StirFriedHolyBasil.png"),
    userId: OTHER_USER_ID,
  },
  {
    id: "7",
    image: require("../assets/images/StirFriedHolyBasil.png"),
    userId: OTHER_USER_ID,
  },
  {
    id: "8",
    image: require("../assets/images/StirFriedHolyBasil.png"),
    userId: OTHER_USER_ID,
  },
  {
    id: "9",
    image: require("../assets/images/StirFriedHolyBasil.png"),
    userId: OTHER_USER_ID,
  },
];

export default function OtherProfileScreen() {
  const [selectedPost, setSelectedPost] =
    useState<Post | null>(null);

  const [popupVisible, setPopupVisible] =
    useState(false);

  const [bookmarkedIds, setBookmarkedIds] =
    useState<string[]>([]);

  const handleMenuChange = (id: string) => {
    if (id === "home") router.replace("/");
    else if (id === "random") router.replace("/(tabs)/random-food");
    else if (id === "ingredients") router.replace("/(tabs)/random-ingredient");
    else if (id === "profile") router.replace("/(tabs)/profile");
  };

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

  const handleOpenPost = (post: Post) => {
    router.push({
      pathname: "/OtherPost",
      params: {
        postId: post.id,
        ownerId: OTHER_USER_ID,
      },
    });
  };

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
                  source={require(
                    "../assets/images/ProfilePicture.png"
                  )}
                  style={styles.avatar}
                  resizeMode="contain"
                />
              </View>
            </View>

            {/* Name */}
            <ThemedText style={styles.name}>
              มุกรอบอ้วรนิดนิด
            </ThemedText>

            {/* Username */}
            <ThemedText style={styles.username}>
              @mooKrob
            </ThemedText>

            {/* Bio */}
            <View style={styles.bio}>
              <ThemedText
                style={styles.bioText}
                numberOfLines={1}
              >
                อ้วนนะ รับไหวมั้ย
              </ThemedText>
            </View>
          </View>

          {/* Posts Title */}
          <View style={styles.postsHeader}>
            <ThemedText style={styles.postsTitle}>
              โพสต์ทั้งหมด
            </ThemedText>
          </View>

          {/* Post Grid */}
          <PostGrid
            posts={allPosts}
            onPressPost={handleOpenPost}
            onLongPressPost={(post) => {
              setSelectedPost(post);
              setPopupVisible(true);
            }}
          />

          {/* Empty */}
          {allPosts.length === 0 && (
            <View style={styles.empty}>
              <ThemedText style={styles.emptyText}>
                ยังไม่มีโพสต์
              </ThemedText>
            </View>
          )}
        </ScrollView>

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