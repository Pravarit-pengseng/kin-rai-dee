import React, { useEffect, useState } from "react";
import {
  View,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
  RefreshControl,
} from "react-native";
import {
  router,
  useLocalSearchParams,
  useFocusEffect,
} from "expo-router";
import { useCallback, useRef } from "react";

import PostGrid, { Post } from "@/components/post-grid";

import PopupPost, { PopupPostData } from "@/components/popup-post";
import DeletePostPopup from "@/components/DeletePopup";
import LogoutPopup from "@/components/LogoutPopup";
import ProfileHeader from "@/components/profile-header";
import { Header } from "@/components/Header";
import { ThemedText } from "@/components/themed-text";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useAuth } from "@/context/AuthContext";
import { getMyProfile, getUserPosts } from "@/services/profileService";
import { getSavedPosts, deletePost, mapPostToPopup, bookmarkPost, unbookmarkPost } from "@/services/postService";
import { PostGridSkeleton } from "@/components/PostSkeleton";
import { setCachedPostList } from "@/services/postCache";



export default function ProfileScreen() {
  const { isLoggedIn, logout, user } = useAuth();
  const params = useLocalSearchParams<{
    name?: string;
    username?: string;
    bio?: string;
    avatarUrl?: string;
    post?: string;
    mode?: string;
    refresh?: string;
  }>();

  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (params.refresh) {
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      onRefresh();
    }
  }, [params.refresh]);

  // Profile data จาก API
  const [profileName, setProfileName] = useState<string | undefined>(undefined);
  const [profileUsername, setProfileUsername] = useState<string | undefined>(undefined);
  const [profileBio, setProfileBio] = useState<string | undefined>(undefined);
  const [profileAvatarUrl, setProfileAvatarUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!isLoggedIn) {
      router.replace({ pathname: '/(auth)/login', params: { returnTo: '/(tabs)/profile', from: '/' } });
      return;
    }
    // โหลด profile จริงจาก DB
    getMyProfile().then((profile) => {
      if (profile) {
        setProfileName(profile.display_name ?? undefined);
        // username จาก DB ไม่มี @ นำหน้า ให้เก็บตรงๆ
        setProfileUsername(profile.username ?? undefined);
        setProfileBio(profile.bio ?? undefined);
        setProfileAvatarUrl(profile.avatar_url ?? undefined);
      }
    });
  }, [isLoggedIn]);

  const [posts, setPosts] = useState<PopupPostData[]>([]);
  const [savedPosts, setSavedPosts] = useState<PopupPostData[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [loadingSaved, setLoadingSaved] = useState(true);
  const [selectedPost, setSelectedPost] =
    useState<PopupPostData | null>(null);
  const [popupVisible, setPopupVisible] = useState(false);
  const [deletePopupVisible, setDeletePopupVisible] =
    useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (user?.id) {
      try {
        const [profileData, apiPosts, saved] = await Promise.all([
          getMyProfile(),
          getUserPosts(user.id),
          getSavedPosts()
        ]);
        if (profileData) {
          setProfileName(profileData.display_name ?? undefined);
          setProfileUsername(profileData.username ?? undefined);
          setProfileBio(profileData.bio ?? undefined);
          setProfileAvatarUrl(profileData.avatar_url ?? undefined);
        }
        setPosts((apiPosts || []).map(mapPostToPopup));
        setSavedPosts(Array.isArray(saved) ? saved : []);
        setLoadingPosts(false);
        setLoadingSaved(false);
      } catch (e) {
        console.warn("Refresh profile error:", e);
        setLoadingPosts(false);
        setLoadingSaved(false);
      }
    }
    setRefreshing(false);
  }, [user?.id]);
  const [logoutPopupVisible, setLogoutPopupVisible] =
    useState(false);
  const [deletePostId, setDeletePostId] =
    useState<string | null>(null);
  const [bookmarkedIds, setBookmarkedIds] =
    useState<string[]>([]);
  const [activeTab, setActiveTab] =
    useState<"posts" | "saved">("posts");

  // โหลดโพสต์ของตัวเองและโพสต์ที่บันทึกไว้
  useFocusEffect(
    useCallback(() => {
      if (!isLoggedIn || !user?.id) return;

      // โหลดโพสต์ตัวเอง ผ่าน API
      getUserPosts(user.id).then((apiPosts) => {
        const safePosts = Array.isArray(apiPosts) ? apiPosts : [];
        setPosts(safePosts.map(mapPostToPopup));
        setLoadingPosts(false);
      }).catch(() => {
        setLoadingPosts(false);
      });

      // โหลดโพสต์ที่บันทึกไว้
      getSavedPosts().then((saved) => {
        const safeSaved = Array.isArray(saved) ? saved : [];
        setSavedPosts(safeSaved);
        if (safeSaved.length > 0) {
          setBookmarkedIds(safeSaved.map((s) => s.id));
        } else {
          setBookmarkedIds([]);
        }
        setLoadingSaved(false);
      }).catch(() => {
        setLoadingSaved(false);
      });
    }, [isLoggedIn, user?.id])
  );
  // รับโพสต์ใหม่จาก AddPost/EditPost ผ่าน navigation params
  useEffect(() => {
    if (!params.post) return;

    try {
      const post = JSON.parse(
        Array.isArray(params.post)
          ? params.post[0]
          : params.post,
      ) as PopupPostData;

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

  const handleLongPress = (post: PopupPostData) => {
    const updatedPost = {
      ...post,
      displayName: post.userId === user?.id ? (params.name || profileName || post.displayName) : post.displayName,
      username: post.userId === user?.id ? (params.username || profileUsername || post.username) : post.username,
    };
    setSelectedPost(updatedPost);
    setPopupVisible(true);
  };

  const handleToggleBookmark = async (postId: string) => {
    const isCurrentlyBookmarked = bookmarkedIds.includes(postId);
    setBookmarkedIds((prev) =>
      isCurrentlyBookmarked
        ? prev.filter((id) => id !== postId)
        : [...prev, postId],
    );
    
    if (user?.id) {
      if (isCurrentlyBookmarked) {
        await unbookmarkPost(postId);
      } else {
        await bookmarkPost(postId);
      }
    }
  };

  const handleRequestDelete = (postId: string) => {
    setDeletePostId(postId);
    setSelectedPost(null);
    setPopupVisible(false);
    setDeletePopupVisible(true);
  };

  const handleEditPost = (post: PopupPostData) => {
    setSelectedPost(null);
    setPopupVisible(false);

    router.push({
      pathname: "/EditPost",
      params: {
        postId: post.id,
        post: JSON.stringify(post),
      },
    });
  };

  const handleConfirmDelete = async () => {
    if (!deletePostId) return;

    const idToDelete = deletePostId;

    // Optimistic UI: ลบออกจาก list ก่อน
    setPosts((prev) =>
      prev.filter((post) => post.id !== idToDelete),
    );
    
    // ลบออกจาก savedPosts ด้วย
    setSavedPosts((prev) =>
      prev.filter((post) => post.id !== idToDelete),
    );

    setBookmarkedIds((prev) =>
      prev.filter((id) => id !== idToDelete),
    );

    setDeletePostId(null);
    setDeletePopupVisible(false);

    // เรียก API ลบโพสต์จริง
    await deletePost(idToDelete);

    // Reload posts จาก API เสมอ เพื่อ sync กับ DB
    if (user?.id) {
      getUserPosts(user.id).then((apiPosts) => {
        setPosts((apiPosts || []).map(mapPostToPopup));
      });
      // Update saved posts just in case we deleted our own post that was also saved
      getSavedPosts().then((saved) => {
        const safeSaved = Array.isArray(saved) ? saved : [];
        setSavedPosts(safeSaved);
      });
    }
  };

  const handleCancelDelete = () => {
    setDeletePostId(null);
    setDeletePopupVisible(false);
  };

  const handleEditProfile = () => {
    router.push({
      pathname: "/EditProfile",
      params: {
        name: params.name ?? profileName,
        username: params.username ?? profileUsername,
        bio: params.bio ?? profileBio,
        avatarUrl: params.avatarUrl ?? profileAvatarUrl,
      },
    });
  };

  const handleCreatePost = () => {
    if (!isLoggedIn) {
      router.push({ pathname: '/(auth)/login', params: { returnTo: '/(tabs)/profile' } });
      return;
    }
    router.push("/AddPost");
  };

  const handleOpenPost = (post: PopupPostData) => {
    const allPosts = activeTab === "saved" ? savedPosts : posts;
    setCachedPostList(allPosts);
    router.push({
      pathname: "/MyPost",
      params: {
        postId: post.id,
        ownerId: activeTab === "saved" ? undefined : (post.userId ?? user?.id),
        mode: activeTab === "saved" ? "saved" : "feed",
        post: JSON.stringify(post),
      },
    });
  };

  const savedPostsDisplay = activeTab === "saved" ? savedPosts : [];

  const displayPosts = activeTab === "posts" ? posts : savedPostsDisplay;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <Header
        title="KIN RAI DEE"
        leftIcon={isLoggedIn ? "logout" : "none"}
        onLeftPress={() => setLogoutPopupVisible(true)}
        rightIcon="search"
        onSearchPress={() => router.push('/(tabs)/search?from=/(tabs)/profile')}
      />
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={["#DCA64E"]}
            tintColor="#DCA64E"
          />
        }
      >
        <ProfileHeader
          name={profileName || params.name || undefined}
          username={profileUsername || params.username || undefined}
          bio={(profileBio || params.bio) || undefined}
          avatarUrl={params.avatarUrl ?? profileAvatarUrl}
          onEditProfile={handleEditProfile}
          onCreatePost={handleCreatePost}
        />

        <View style={styles.tabsContainer}>
          {(["posts", "saved"] as const).map((tab) => (
            <Pressable
              key={tab}
              style={({ pressed }) => [
                styles.tab,
                pressed && styles.buttonPressed,
              ]}
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

        {(activeTab === "posts" ? loadingPosts : loadingSaved) ? (
          <PostGridSkeleton count={6} />
        ) : displayPosts.length > 0 ? (
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
          selectedPost?.userId === user?.id
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

      <LogoutPopup
        visible={logoutPopupVisible}
        onCancel={() => setLogoutPopupVisible(false)}
        onConfirm={async () => {
          setLogoutPopupVisible(false);
          await logout();
          router.replace("/");
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
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

  buttonPressed: {
    opacity: 0.8,
    transform: [{ translateY: 2 }],
  },
});