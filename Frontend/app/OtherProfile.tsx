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
import { PostGridSkeleton } from "@/components/PostSkeleton";
import { setCachedPostList } from "@/services/postCache";
import { useAuth } from "@/context/AuthContext";
import { blockUser, unblockUser, checkBlockStatus } from "@/services/safetyService";
import ReportModal from "@/components/ReportModal";
import { Typography } from "@/constants/typography";
import { ShieldAlert, UserX, Flag, UserCheck } from "lucide-react-native";
import { Pressable, Alert } from "react-native";

const DEFAULT_AVATAR = require("../assets/images/ProfilePicture.png");
const DEFAULT_IMAGE = require("../assets/images/StirFriedHolyBasil.png");

export default function OtherProfileScreen() {
  const { user } = useAuth();
  const { userId } = useLocalSearchParams<{ userId?: string }>();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [avatarError, setAvatarError] = useState(false);
  const [posts, setPosts] = useState<any[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);

  useEffect(() => {
    setAvatarError(false);
  }, [profile?.avatar_url]);

  const [selectedPost, setSelectedPost] =
    useState<any | null>(null);

  const [popupVisible, setPopupVisible] =
    useState(false);

  const [bookmarkedIds, setBookmarkedIds] =
    useState<string[]>([]);

  const [isBlockedByMe, setIsBlockedByMe] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);

  useEffect(() => {
    if (!userId) {
      setLoadingProfile(false);
      setLoadingPosts(false);
      return;
    }

    // ตรวจสอบสถานะการบล็อก
    if (user?.id) {
      checkBlockStatus(userId).then(status => {
        setIsBlocked(status.isBlocked);
        setIsBlockedByMe(status.blockedByMe);
      });
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

  const handleToggleBlock = () => {
    if (!user?.id || !userId) {
      router.push({ pathname: '/(auth)/login' });
      return;
    }

    const targetName = profile?.display_name || profile?.username || 'ผู้ใช้นี้';

    if (isBlockedByMe) {
      Alert.alert(
        'ปลดบล็อกผู้ใช้',
        `ท่านต้องการปลดบล็อก "${targetName}" หรือไม่?`,
        [
          { text: 'ยกเลิก', style: 'cancel' },
          {
            text: 'ปลดบล็อก',
            onPress: async () => {
              const res = await unblockUser(userId);
              if (res.success) {
                setIsBlockedByMe(false);
                setIsBlocked(false);
                Alert.alert('สำเร็จ', `ปลดบล็อก ${targetName} เรียบร้อยแล้ว`);
              }
            },
          },
        ]
      );
    } else {
      Alert.alert(
        'บล็อกผู้ใช้',
        `ท่านต้องการบล็อก "${targetName}" หรือไม่?\n\nเมื่อบล็อกแล้ว:\n• โพสต์ของผู้ใช้นี้จะถูกซ่อน\n• ความคิดเห็นของผู้ใช้นี้จะถูกซ่อน\n• ป้องกันการโต้ตอบระหว่างกัน`,
        [
          { text: 'ยกเลิก', style: 'cancel' },
          {
            text: 'บล็อก',
            style: 'destructive',
            onPress: async () => {
              const res = await blockUser(
                userId,
                profile?.display_name || profile?.username,
                profile?.avatar_url,
                profile?.username
              );
              if (res.success) {
                setIsBlockedByMe(true);
                setIsBlocked(true);
                Alert.alert('สำเร็จ', `บล็อก ${targetName} เรียบร้อยแล้ว`);
              }
            },
          },
        ]
      );
    }
  };

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
    setCachedPostList(posts);
    router.push({
      pathname: "/OtherPost",
      params: {
        postId: post.id,
        ownerId: userId,
        post: JSON.stringify(post),
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
          onSearchPress={() => router.push(`/(tabs)/search?from=${encodeURIComponent(`/OtherProfile?userId=${userId}`)}`)}
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
                    source={
                      profile?.avatar_url && !avatarError
                        ? { uri: profile.avatar_url }
                        : DEFAULT_AVATAR
                    }
                    style={styles.avatar}
                    contentFit="cover"
                    transition={200}
                    onError={() => setAvatarError(true)}
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

              {/* Action Buttons: Report & Block */}
              <View style={styles.actionRow}>
                <Pressable
                  style={({ pressed }) => [
                    styles.actionBtn,
                    isBlockedByMe ? styles.unblockActionBtn : styles.blockActionBtn,
                    pressed && styles.btnPressed,
                  ]}
                  onPress={handleToggleBlock}
                >
                  {isBlockedByMe ? (
                    <>
                      <UserCheck size={16} color="#57423E" />
                      <ThemedText style={styles.actionBtnText}>ปลดบล็อก</ThemedText>
                    </>
                  ) : (
                    <>
                      <UserX size={16} color="#A7392A" />
                      <ThemedText style={[styles.actionBtnText, { color: '#A7392A' }]}>บล็อกผู้ใช้</ThemedText>
                    </>
                  )}
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    styles.actionBtn,
                    styles.reportActionBtn,
                    pressed && styles.btnPressed,
                  ]}
                  onPress={() => setReportModalVisible(true)}
                >
                  <Flag size={16} color="#79747E" />
                  <ThemedText style={[styles.actionBtnText, { color: '#79747E' }]}>รายงาน</ThemedText>
                </Pressable>
              </View>
            </View>

            {/* Blocked state or Posts */}
            {isBlockedByMe ? (
              <View style={styles.blockedNoticeCard}>
                <UserX size={36} color="#A7392A" />
                <ThemedText style={styles.blockedNoticeTitle}>คุณได้บล็อกผู้ใช้นี้</ThemedText>
                <ThemedText style={styles.blockedNoticeSub}>
                  โพสต์และความคิดเห็นของผู้ใช้นี้ถูกซ่อนจากมุมมองของคุณ
                </ThemedText>
                <Pressable style={styles.unblockConfirmBtn} onPress={handleToggleBlock}>
                  <ThemedText style={styles.unblockConfirmBtnText}>ปลดบล็อกผู้ใช้</ThemedText>
                </Pressable>
              </View>
            ) : (
              <>
                {/* Posts Title */}
                <View style={styles.postsHeader}>
                  <ThemedText style={styles.postsTitle}>
                    โพสต์ทั้งหมด
                  </ThemedText>
                </View>

                {/* Post Grid */}
                {loadingPosts && posts.length === 0 ? (
                  <PostGridSkeleton count={6} />
                ) : posts.length > 0 ? (
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
              </>
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

        {/* Report Modal */}
        <ReportModal
          visible={reportModalVisible}
          targetType="user"
          targetId={userId || ''}
          targetTitle={profile?.display_name || profile?.username || 'ผู้ใช้นี้'}
          onClose={() => setReportModalVisible(false)}
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
    fontFamily: Typography.bold,
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

  /* Action buttons */
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    marginBottom: 6,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  blockActionBtn: {
    borderColor: '#F3D6D0',
    backgroundColor: '#FFF0EB',
  },
  unblockActionBtn: {
    borderColor: '#D4C8C5',
    backgroundColor: '#FFFFFF',
  },
  reportActionBtn: {
    borderColor: '#E6DACF',
    backgroundColor: '#FFFFFF',
  },
  btnPressed: {
    opacity: 0.7,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#57423E',
  },

  /* Blocked notice */
  blockedNoticeCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    paddingHorizontal: 30,
    marginHorizontal: 20,
    marginTop: 24,
    backgroundColor: '#FFF8F6',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F8D7CD',
  },
  blockedNoticeTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#A7392A',
    marginTop: 12,
    marginBottom: 6,
  },
  blockedNoticeSub: {
    fontSize: 13,
    color: '#79747E',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
  },
  unblockConfirmBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#A7392A',
  },
  unblockConfirmBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});