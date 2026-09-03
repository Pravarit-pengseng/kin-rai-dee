import React, { useState } from "react";
import {
  Modal,
  View,
  Image,
  StyleSheet,
  Pressable,
  ImageSourcePropType,
} from "react-native";

import {
  X,
  Bookmark,
  AlignLeft,
} from "lucide-react-native";

import PostDropdown from "./post-dropdown";
import { ThemedText } from "@/components/themed-text";

export type PopupPostData = {
  id: string;
  image: ImageSourcePropType;
  title?: string;
  description?: string;
  tag?: string;
  location?: string;
  timeAgo?: string;
  userId?: string;
};

export type PopupPostProps = {
  visible: boolean;

  post: PopupPostData | null;

  onClose: () => void;

  isOwnPost?: boolean;

  isBookmarked?: boolean;

  onBookmark?: (postId: string) => void;

  // Send the complete post to the parent
  // when the user chooses Edit.
  onEdit?: (post: PopupPostData) => void;

  onRequestDelete?: (postId: string) => void;

  inline?: boolean;
  
  onUserPress?: (userId: string) => void;
};

export default function PopupPost({
  visible,
  post,
  onClose,
  isOwnPost = false,
  isBookmarked = false,
  onBookmark,
  onEdit,
  onRequestDelete,
  inline = false,
  onUserPress,
}: PopupPostProps) {
  const [showMenu, setShowMenu] = useState(false);

  if (!post) {
    return null;
  }

  const handleBookmarkPress = () => {
    setShowMenu(false);
    onBookmark?.(post.id);
  };

  const handleMenuPress = () => {
    setShowMenu((prev) => !prev);
  };

  // Send the selected post to the parent.
  const handleEditPress = () => {
    setShowMenu(false);
    onEdit?.(post);
  };

  const handleDeletePress = () => {
    setShowMenu(false);
    onRequestDelete?.(post.id);
  };

  const handleClose = () => {
    setShowMenu(false);
    onClose();
  };

  const handleContentPress = () => {
    setShowMenu(false);
  };
  
  const handleUserClick = () => {
    setShowMenu(false);
    if (post.userId) {
      onUserPress?.(post.userId);
    }
  };

  const title = post.title || "กะเพราไข่ดาว";

  const description =
    post.description ||
    "มื้อเที่ยงง่ายๆ แต่อร่อยมาก 🌶️🍳 ฟินสุดๆ ไปเลยจ้า ใครยังไม่รู้จะกินอะไร แนะนำเมนูที่อร่อยไม่เคยเปลี่ยน!";

  const tag = post.tag || "อาหารจานเดียว";

  const location =
    post.location ||
    "https://www.wongnai.com/listings/phat-ka-phrao";

  const timeAgo = post.timeAgo || "2 ชม. ที่แล้ว";

  const displayUserName = post.userId === "mookmhee" ? "มุกรอบอ้วรนิดนิด" : "มุกหมีชอบกิน";

  const card = (
    <View style={styles.card}>
      {/* Header */}
      <Pressable
        style={styles.header}
        onPress={handleContentPress}
      >
        <Pressable style={styles.userProfileLink} onPress={handleUserClick}>
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            <Image
              source={require("../assets/images/ProfilePicture.png")}
              style={styles.avatar}
              resizeMode="cover"
            />
          </View>

          {/* User information */}
          <View style={styles.userInfo}>
            <ThemedText style={styles.userName}>
              {displayUserName}
            </ThemedText>

            <ThemedText style={styles.timeAgo}>
              {timeAgo}
            </ThemedText>
          </View>
        </Pressable>

        {/* Header actions */}
        <View style={styles.headerActions}>
          {/* Edit / Delete menu */}
          {isOwnPost && (
            <Pressable
              style={({ pressed }) => [
                styles.iconButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={handleMenuPress}
            >
              <AlignLeft
                size={20}
                color="#57423E"
                strokeWidth={2}
              />
            </Pressable>
          )}

          {/* Close button */}
          {!inline && (
            <Pressable
              style={({ pressed }) => [
                styles.iconButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={handleClose}
            >
              <X
                size={20}
                color="#57423E"
                strokeWidth={2}
              />
            </Pressable>
          )}
        </View>
      </Pressable>

      {/* Dropdown */}
      {isOwnPost && showMenu && (
        <View style={styles.dropdownWrapper}>
          <PostDropdown
            onEdit={handleEditPress}
            onDelete={handleDeletePress}
          />
        </View>
      )}

      {/* Post image */}
      <Pressable onPress={handleContentPress}>
        <Image
          source={post.image}
          style={styles.postImage}
          resizeMode="cover"
        />
      </Pressable>

      {/* Content */}
      <Pressable
        style={styles.content}
        onPress={handleContentPress}
      >
        <ThemedText style={styles.title}>
          {title}
        </ThemedText>

        <ThemedText style={styles.description}>
          {description}
        </ThemedText>

        {location && (
          <ThemedText style={styles.location}>
            พิกัด:{" "}
            <ThemedText style={styles.link}>
              {location}
            </ThemedText>
          </ThemedText>
        )}

        <View style={styles.tagContainer}>
          <View style={styles.tagPill}>
            <ThemedText style={styles.tagText}>
              #{tag}
            </ThemedText>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.footer}>
          <Pressable
            onPress={handleBookmarkPress}
            style={({ pressed }) => [
              styles.bookmarkButton,
              pressed && styles.buttonPressed,
            ]}
            hitSlop={8}
          >
            <Bookmark
              size={22}
              color="#57423E"
              fill={
                isBookmarked
                  ? "#57423E"
                  : "none"
              }
              strokeWidth={2}
            />
          </Pressable>
        </View>
      </Pressable>
    </View>
  );

  // Inline mode
  if (inline) {
    return card;
  }

  // Modal mode
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.backdrop}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={handleClose}
        />

        {card}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },

  card: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "visible",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.08,
    shadowRadius: 9,
    elevation: 3,
    marginBottom: 16,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },

  userProfileLink: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },

  avatarContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: "#FFF1B8",
    overflow: "hidden",
    backgroundColor: "#FFF8E5",
    marginTop: 5,
  },

  avatar: {
    width: "100%",
    height: "100%",
  },

  userInfo: {
    flex: 1,
    marginLeft: 10,
  },

  userName: {
    fontSize: 14,
    fontFamily: "NotoSansThai_700Bold",
    fontWeight: "700",
    color: "#4B3500",
    lineHeight: 20,
  },

  timeAgo: {
    fontSize: 11,
    color: "#57423E",
    lineHeight: 16,
  },

  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  iconButton: {
    padding: 4,
  },

  dropdownWrapper: {
    position: "absolute",
    top: 50,
    right: 10,
    zIndex: 100,
    elevation: 100,
  },

  postImage: {
    width: "92%",
    height: 300,
    alignSelf: "center",
    borderRadius: 16,
    backgroundColor: "#F2F2F2",
  },

  content: {
    padding: 16,
    paddingTop: 12,
  },

  title: {
    fontSize: 20,
    lineHeight: 28,
    fontFamily: "NotoSansThai_700Bold",
    fontWeight: "900",
    color: "#4B3500",
    marginBottom: 6,
    marginTop: 5,
  },

  description: {
    fontSize: 15,
    color: "#57423E",
    lineHeight: 24,
    marginBottom: 8,
  },

  location: {
    fontSize: 14,
    color: "#57423E",
    marginBottom: 10,
  },

  link: {
    textDecorationLine: "underline",
    color: "#6F6865",
    fontSize: 14,
  },

  tagContainer: {
    flexDirection: "row",
    marginBottom: 10,
  },

  tagPill: {
    backgroundColor: "#A4EFCB",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },

  tagText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#236F52",
  },

  divider: {
    height: 1,
    borderWidth: 0.5,
    borderColor: "#E8DCD7",
    borderStyle: "dashed",
    marginTop: 4,
    marginBottom: 8,
  },

  footer: {
    alignItems: "flex-end",
  },

  bookmarkButton: {
    padding: 4,
  },

  buttonPressed: {
    opacity: 0.8,
    transform: [{ translateY: 2 }],
  },
});