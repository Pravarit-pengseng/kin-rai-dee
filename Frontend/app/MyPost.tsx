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

export default function MyPost() {
  const {
    postId,
    ownerId,
    post: postParam,
  } = useLocalSearchParams<{
    postId?: string;
    ownerId?: string;
    post?: string;
  }>();

  const scrollRef =
    useRef<ScrollView>(null);

  const [bookmarkedIds, setBookmarkedIds] =
    useState<string[]>([]);

  const [ready, setReady] =
    useState(false);

  const [posts, setPosts] =
    useState<Post[]>(allPosts);

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
    ownerId ?? CURRENT_USER_ID;

  /*
   * Get all posts belonging
   * to the selected owner.
   */
  const ownerPosts = posts.filter(
    (post) =>
      post.userId === currentOwnerId
  );

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
        (id) => id !== deletePostId
      )
    );

    setDeletePostId(null);
  };

  const handleMenuChange = (id: string) => {
    if (id === "home") router.replace("/");
    else if (id === "random") router.replace("/(tabs)/random-food");
    else if (id === "ingredients") router.replace("/(tabs)/random-ingredient");
    else if (id === "profile") router.replace("/(tabs)/profile");
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
                  post.userId ===
                  CURRENT_USER_ID
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
          onConfirm={() => {
            setLogoutPopupVisible(false);
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