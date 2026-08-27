import React from "react";
import {
  View,
  Image,
  Pressable,
  StyleSheet,
} from "react-native";
import {
  Pencil,
  SquarePen,
} from "lucide-react-native";
import { Header } from "@/components/Header";
import { ThemedText } from "@/components/themed-text";
import { router } from "expo-router";

export type ProfileHeaderProps = {
  name?: string;
  username?: string;
  bio?: string;
  onEditProfile: () => void;
  onCreatePost: () => void;
};

export default function ProfileHeader({
  name = "มุกหมีชอบกิน",
  username = "@mookmhee",
  bio = "กินเก่ง ทำอาหารนิดหน่อย 🍳✨",
  onEditProfile,
  onCreatePost,
}: ProfileHeaderProps) {
  return (
    <>
      {/* Header */}
      <Header
        title="KIN RAI DEE"
        leftIcon="logout"
        onLeftPress={() => alert("ยืนยันออกจากระบบ")}
        rightIcon="search"
        // onRightPress={() => router.push("/(tabs)/search")}
      />

      {/* Profile */}
      <View style={styles.profileSection}>
        {/* Avatar */}
        <View style={styles.avatarOuter}>
          <View style={styles.avatarInner}>
            <Image
              source={require("../assets/images/ProfilePicture.png")}
              style={styles.avatar}
              resizeMode="contain"
            />
          </View>
        </View>

        {/* Name */}
        <ThemedText style={styles.name}>
          {name}
        </ThemedText>

        {/* Username */}
        <ThemedText style={styles.username}>
          {username}
        </ThemedText>

        {/* Bio */}
        <View style={styles.bio}>
          <ThemedText
            style={styles.bioText}
            numberOfLines={1}
          >
            {bio}
          </ThemedText>
        </View>

        {/* Profile Buttons */}
        <View style={styles.actionRow}>
          {/* Edit Profile */}
          <Pressable
            style={styles.actionButton}
            onPress={onEditProfile}
          >
            <Pencil
              size={16}
              color="#721209"
              strokeWidth={2.5}
            />

            <ThemedText style={styles.actionButtonText}>
              แก้ไขโปรไฟล์
            </ThemedText>
          </Pressable>

          {/* New Post */}
          <Pressable
            style={styles.actionButton}
            onPress={onCreatePost}
          >
            <SquarePen
              size={16}
              color="#721209"
              strokeWidth={2.5}
            />

            <ThemedText style={styles.actionButtonText}>
              โพสต์ใหม่
            </ThemedText>
          </Pressable>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  profileSection: {
    alignItems: "center",
    paddingTop: 20,
  },

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

  name: {
    fontSize: 20,
    fontWeight: "900",
    color: "#241917",
    marginBottom: 3,
    marginTop: 5,
  },

  username: {
    marginBottom: 3,
    fontSize: 12,
    color: "#57423E",
  },

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

  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    marginTop: 13,
    marginBottom: 8,
  },

  actionButton: {
    minWidth: 105,
    height: 36,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 18,
    backgroundColor: "#FF7A6633",
    borderWidth: 1,
    borderColor: "#72120933",

    // 3D button effect
    borderBottomWidth: 3.5,
    borderBottomColor: "#72120933",
  },

  actionButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#721209",
  },
});