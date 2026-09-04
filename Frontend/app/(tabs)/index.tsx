import React, { useState } from "react";
import { View, ScrollView, StyleSheet, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { SquarePen } from "lucide-react-native";

import { Header } from "@/components/Header";
import PopupPost from "@/components/popup-post";
import DeletePopup from "@/components/DeletePopup";
import { ThemedText } from "@/components/themed-text";

// Mock data
const CURRENT_USER_ID = "me";
const OTHER_USER_ID = "mookmhee";

const initialPosts = [
  {
    id: "1",
    image: require("../../assets/images/StirFriedHolyBasil.png"),
    userId: CURRENT_USER_ID,
    title: "กะเพราไข่ดาว",
    description: "มื้อเที่ยงง่ายๆ แต่อร่อยมาก 🌶️🍳 ฟินสุดๆ ไปเลยจ้า ใครยังไม่รู้จะกินอะไร แนะนำเมนูที่อร่อยไม่เคยเปลี่ยน!",
    location: "https://www.wongnai.com/listings/phat-ka-phrao",
    tag: "อาหารจานเดียว",
    timeAgo: "2 ชม. ที่แล้ว",
  },
  {
    id: "2",
    image: require("../../assets/images/StirFriedHolyBasil.png"),
    userId: OTHER_USER_ID,
    title: "กะเพราหมูสับ",
    description: "กะเพราหมูสับไข่ดาว อร่อยเหมือนเดิม",
    tag: "อาหารจานเดียว",
    timeAgo: "4 ชม. ที่แล้ว",
  },
  {
    id: "3",
    image: require("../../assets/images/StirFriedHolyBasil.png"),
    userId: OTHER_USER_ID,
    title: "ข้าวผัดกุ้ง",
    description: "ข้าวผัดกุ้งร้อนๆ มาแล้วครับทุกคน อร่อยมาก!",
    tag: "อาหารจานเดียว",
    timeAgo: "5 ชม. ที่แล้ว",
  },
  {
    id: "4",
    image: require("../../assets/images/StirFriedHolyBasil.png"),
    userId: CURRENT_USER_ID,
    title: "ผัดพริกแกงหมูกรอบ",
    description: "หมูกรอบชิ้นใหญ่เต็มคำ รสชาติจัดจ้าน",
    tag: "อาหารไทย",
    timeAgo: "1 วันที่แล้ว",
  }
];

export default function HomeScreen() {
  const [posts, setPosts] = useState(initialPosts);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [deletePostId, setDeletePostId] = useState<string | null>(null);

  const handleToggleBookmark = (postId: string) => {
    setBookmarkedIds((prev) =>
      prev.includes(postId) ? prev.filter((id) => id !== postId) : [...prev, postId]
    );
  };

  const handleEditPost = (post: any) => {
    router.push({
      pathname: "/EditPost",
      params: { postId: post.id, post: JSON.stringify(post) },
    });
  };

  const handleRequestDelete = (postId: string) => {
    setDeletePostId(postId);
  };

  const handleCreatePost = () => {
    router.push("/AddPost");
  };

  const handleUserPress = (userId: string) => {
    if (userId === CURRENT_USER_ID) {
      router.push("/(tabs)/profile");
    } else {
      router.push("/OtherProfile");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <Header
        title="KIN RAI DEE"
        leftIcon="none"
        rightIcon="search"
        onSearchPress={() => router.push('/(tabs)/search')}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Title Section */}
        <View style={styles.titleContainer}>
          <ThemedText style={styles.pageTitle}>วันนี้กินอะไรกันดี?</ThemedText>
          <MaterialCommunityIcons name="silverware-fork-knife" size={26} color="#DCA64E" />
        </View>

        {/* Posts */}
        {posts.map((post) => (
          <View key={post.id} style={styles.postWrapper}>
            <PopupPost
              visible={true}
              post={post}
              onClose={() => { }}
              inline
              isOwnPost={post.userId === CURRENT_USER_ID}
              isBookmarked={bookmarkedIds.includes(post.id)}
              onBookmark={handleToggleBookmark}
              onEdit={handleEditPost}
              onRequestDelete={handleRequestDelete}
              onUserPress={handleUserPress}
            />
          </View>
        ))}
      </ScrollView>

      {/* Floating Action Button */}
      <Pressable
        style={({ pressed }) => [styles.fab, pressed && styles.buttonPressed]}
        onPress={handleCreatePost}
      >
        <SquarePen size={18} color="#721209" strokeWidth={2.5} />
        <ThemedText style={styles.fabText}>โพสต์ใหม่</ThemedText>
      </Pressable>

      <DeletePopup
        visible={deletePostId !== null}
        onCancel={() => setDeletePostId(null)}
        onConfirm={() => {
          if (deletePostId) {
            setPosts((prev) => prev.filter((p) => p.id !== deletePostId));
            setDeletePostId(null);
          }
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFF8F6" },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 110 },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  pageTitle: {
    fontSize: 22,
    lineHeight: 34,
    fontFamily: "NotoSansThai_700Bold",
    fontWeight: "800",
    color: "#46302B",
  },
  postWrapper: { marginBottom: 16 },
  fab: {
    position: "absolute",
    bottom: 90,
    right: 16,
    height: 48,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 24,
    backgroundColor: "#FCE5DD",
    borderWidth: 1,
    borderColor: "#EAD2CB",
    borderBottomWidth: 4,
    borderBottomColor: "#EAD2CB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  fabText: {
    fontSize: 16,
    fontFamily: "NotoSansThai_700Bold",
    fontWeight: "800",
    color: "#721209",
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ translateY: 2 }],
  },
});
