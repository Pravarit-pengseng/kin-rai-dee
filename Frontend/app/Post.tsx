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
import { Stack, useLocalSearchParams } from "expo-router";
import { Header } from "@/components/Header";
import PopupPost from "@/components/PopupPost";
import LiquidMenu from "@/components/LiquidMenu";

type Post = {
  id: string;
  image: ImageSourcePropType;
  title?: string;
  description?: string;
  tag?: string;
  location?: string;
  timeAgo?: string;
  userId?: string;
};

const CURRENT_USER_ID = "me";
const OTHER_USER_ID = "mookmhee";

const allPosts: Post[] = [
  // My Posts
  {
    id: "1",
    image: require("../assets/images/StirFriedHolyBasil.png"),
    userId: CURRENT_USER_ID,
  },
  {
    id: "2",
    image: require("../assets/images/StirFriedHolyBasil.png"),
    userId: CURRENT_USER_ID,
  },
  {
    id: "3",
    image: require("../assets/images/StirFriedHolyBasil.png"),
    userId: CURRENT_USER_ID,
  },
  {
    id: "4",
    image: require("../assets/images/StirFriedHolyBasil.png"),
    userId: CURRENT_USER_ID,
  },
  {
    id: "5",
    image: require("../assets/images/StirFriedHolyBasil.png"),
    userId: CURRENT_USER_ID,
  },
  {
    id: "6",
    image: require("../assets/images/StirFriedHolyBasil.png"),
    userId: CURRENT_USER_ID,
  },
  {
    id: "7",
    image: require("../assets/images/StirFriedHolyBasil.png"),
    userId: CURRENT_USER_ID,
  },
  {
    id: "8",
    image: require("../assets/images/StirFriedHolyBasil.png"),
    userId: CURRENT_USER_ID,
  },
  {
    id: "9",
    image: require("../assets/images/StirFriedHolyBasil.png"),
    userId: CURRENT_USER_ID,
  },

  // Other User Posts
  {
    id: "10",
    image: require("../assets/images/StirFriedHolyBasil.png"),
    userId: OTHER_USER_ID,
  },
  {
    id: "11",
    image: require("../assets/images/StirFriedHolyBasil.png"),
    userId: OTHER_USER_ID,
  },
  {
    id: "12",
    image: require("../assets/images/StirFriedHolyBasil.png"),
    userId: OTHER_USER_ID,
  },
  {
    id: "13",
    image: require("../assets/images/StirFriedHolyBasil.png"),
    userId: OTHER_USER_ID,
  },
  {
    id: "14",
    image: require("../assets/images/StirFriedHolyBasil.png"),
    userId: OTHER_USER_ID,
  },
  {
    id: "15",
    image: require("../assets/images/StirFriedHolyBasil.png"),
    userId: OTHER_USER_ID,
  },
  {
    id: "16",
    image: require("../assets/images/StirFriedHolyBasil.png"),
    userId: OTHER_USER_ID,
  },
  {
    id: "17",
    image: require("../assets/images/StirFriedHolyBasil.png"),
    userId: OTHER_USER_ID,
  },
  {
    id: "18",
    image: require("../assets/images/StirFriedHolyBasil.png"),
    userId: OTHER_USER_ID,
  },
];

export default function PostScreen() {
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

  /*
   * Get the owner of the selected post.
   */
  const currentOwnerId =
    ownerId ?? CURRENT_USER_ID;

  /*
   * Get all posts belonging to
   * the selected owner.
   */
  const ownerPosts = allPosts.filter(
    (post) =>
      post.userId === currentOwnerId
  );

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
   * Toggle bookmark.
   */
  const handleToggleBookmark = (
    postId: string
  ) => {
    setBookmarkedIds((prev) =>
      prev.includes(postId)
        ? prev.filter(
            (id) =>
              id !== postId
          )
        : [...prev, postId]
    );
  };

  /*
   * Bottom menu navigation.
   */
  const handleMenuChange = (
    id: string
  ) => {
    // LiquidMenu handles navigation
  };

  return (
    <>
      {/* Hide Expo Router system header */}
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      <View style={styles.container}>
        <Header
                title="KIN RAI DEE"
                leftIcon="logout"
                onLeftPress={() => alert("ยืนยันออกจากระบบ")}
                rightIcon="search"
                // onRightPress={() => router.push("/(tabs)/search")}
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
                onClose={() => {}}
                inline
                isOwnPost={
                  post.userId ===
                  CURRENT_USER_ID
                }
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

        <LiquidMenu
          active="profile"
          onChange={handleMenuChange}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
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