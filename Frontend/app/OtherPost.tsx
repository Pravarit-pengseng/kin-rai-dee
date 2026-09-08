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
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import {
  router,
  Stack,
  useLocalSearchParams,
} from "expo-router";
import { Header } from "@/components/Header";
import PopupPost from "@/components/popup-post";
import LiquidMenu from "@/components/liquid-menu";
import { bookmarkPost, unbookmarkPost, resolveCategoryNames, getSavedPosts, mapPostToPopup } from "@/services/postService";
import { getUserPosts } from "@/services/profileService";
import { useAuth } from "@/context/AuthContext";

const DEFAULT_IMAGE = require("../assets/images/StirFriedHolyBasil.png");

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

export default function PostScreen() {
  const { user } = useAuth();
  const {
    postId,
    ownerId,
  } = useLocalSearchParams<{
    postId?: string;
    ownerId?: string;
  }>();

  const scrollRef =
    useRef<ScrollView>(null);

  const [bookmarkedIds, setBookmarkedIds] =
    useState<string[]>([]);

  const [ready, setReady] =
    useState(false);

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  // โหลดโพสต์ของ owner จาก API
  useEffect(() => {
    if (!ownerId) {
      setLoading(false);
      return;
    }
    setLoading(true);
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
      setLoading(false);
    });
  }, [ownerId, user?.id]);

  /*
   * Get all posts belonging to
   * the selected owner.
   */
  const ownerPosts = ownerId
    ? posts.filter((post) => post.userId === ownerId)
    : posts;

  /*
   * Find the selected post.
   */
  const selectedIndex =
    ownerPosts.findIndex(
      (post) =>
        post.id === postId
    );

  /*
   * Start from the selected post.
   */
  const startIndex =
    selectedIndex >= 0
      ? selectedIndex
      : 0;

  /*
   * Scroll to the selected post
   * after the content is rendered.
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
   * Bottom menu navigation.
   */
  const handleMenuChange = (
    id: string
  ) => {
    if (id === "home") router.replace("/");
    else if (id === "random") router.replace("/(tabs)/random-food");
    else if (id === "ingredients") router.replace("/(tabs)/random-ingredient");
    else if (id === "profile") router.replace("/(tabs)/profile");
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
        <Header
          title="KIN RAI DEE"
          leftIcon="back"
          onLeftPress={() => router.back()}
          rightIcon="search"
          onSearchPress={() => router.push("/(tabs)/search")}
        />

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#DCA64E" />
          </View>
        ) : (
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
                  isOwnPost={post.userId === user?.id}
                  isBookmarked={bookmarkedIds.includes(
                    post.id
                  )}
                  onBookmark={
                    handleToggleBookmark
                  }
                />
              </View>
            ))}
          </ScrollView>
        )}

        <LiquidMenu
          active="home"
          onChange={handleMenuChange}
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

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
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