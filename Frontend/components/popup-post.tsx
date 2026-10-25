import React, { useState, useEffect, useRef } from "react";
import {
  Modal,
  View,
  StyleSheet,
  Pressable,
  ImageSourcePropType,
  Linking,
  Alert,
  TextInput,
  ScrollView,
  Platform,
  Keyboard,
  Animated,
  TouchableOpacity,
  LayoutAnimation,
} from "react-native";
import { Image } from "expo-image";

import {
  X,
  Bookmark,
  AlignRight,
  MessageCircle,
  Flag,
} from "lucide-react-native";
import { useRouter, usePathname } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { getPostComments, addPostComment } from "@/services/postService";
import { getMyProfile } from "@/services/profileService";
import { blockUser } from "@/services/safetyService";
import ReportModal from "@/components/ReportModal";

import PostDropdown from "./post-dropdown";
import { ThemedText } from "@/components/themed-text";
import { AppFonts } from "@/constants/theme";

function formatBreakableText(text?: string): string {
  if (!text) return "";
  const graphemeRegex = /[\u0E00-\u0E7F][\u0E31\u0E34-\u0E3A\u0E47-\u0E4E]*|[^\u0E00-\u0E7F]/g;
  const clusters = text.match(graphemeRegex);
  if (!clusters) return text;
  return clusters.join("\u200B");
}

export type CommentItem = {
  id: string;
  username: string;
  text: string;
  avatarBg?: string;
  avatarIcon?: string;
  avatarUrl?: string;
  isCurrentUser?: boolean;
};

export type PopupPostData = {
  id: string;
  image: ImageSourcePropType | any;
  title?: string;
  description?: string;
  tags?: string[];
  location?: string;
  timeAgo?: string;
  userId?: string;
  avatarUrl?: string;
  displayName?: string;
  username?: string;
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

  onBlockUser?: (userId: string) => void;
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
  onBlockUser,
}: PopupPostProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoggedIn, user } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [prevAvatarUrl, setPrevAvatarUrl] = useState(post?.avatarUrl);
  if (post?.avatarUrl !== prevAvatarUrl) {
    setPrevAvatarUrl(post?.avatarUrl);
    setAvatarError(false);
  }

  const handleBookmarkPress = () => {
    setShowMenu(false);
    if (!isLoggedIn) {
      onClose();
      router.push({
        pathname: '/(auth)/login',
        params: { returnTo: pathname || '/', from: pathname || '/' },
      });
      return;
    }
    if (post) {
      onBookmark?.(post.id);
    }
  };

  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportTarget, setReportTarget] = useState<{
    type: 'post' | 'comment';
    id: string;
    title?: string;
  }>({ type: 'post', id: '' });

  const handleMenuPress = () => {
    setShowMenu((prev) => !prev);
  };

  // Send the selected post to the parent.
  const handleEditPress = () => {
    setShowMenu(false);
    if (post) onEdit?.(post);
  };

  const handleDeletePress = () => {
    setShowMenu(false);
    if (post) onRequestDelete?.(post.id);
  };

  const handleReportPostPress = () => {
    setShowMenu(false);
    if (!isLoggedIn) {
      onClose();
      router.push({
        pathname: '/(auth)/login',
        params: { returnTo: pathname || '/', from: pathname || '/' },
      });
      return;
    }
    if (!post) return;
    setReportTarget({
      type: 'post',
      id: String(post.id),
      title: post.title || 'โพสต์นี้',
    });
    setReportModalVisible(true);
  };

  const [blockSuccessVisible, setBlockSuccessVisible] = useState(false);

  const handleDismissBlockSuccess = () => {
    setBlockSuccessVisible(false);
    setShowMenu(false);
    if (post?.userId) {
      onBlockUser?.(post.userId);
    }
    if (!inline) {
      onClose();
    }
  };

  const handleBlockUserPress = async () => {
    if (!isLoggedIn) {
      setShowMenu(false);
      onClose();
      router.push({
        pathname: '/(auth)/login',
        params: { returnTo: pathname || '/', from: pathname || '/' },
      });
      return;
    }
    if (!post?.userId) return;

    try {
      const res = await blockUser(
        post.userId,
        post.displayName || post.username,
        post.avatarUrl,
        post.username
      );
      if (res.success) {
        setBlockSuccessVisible(true);
        setTimeout(() => {
          handleDismissBlockSuccess();
        }, 1500);
      } else {
        setShowMenu(false);
        Alert.alert('เกิดข้อผิดพลาด', res.message || 'ไม่สามารถบล็อกผู้ใช้ได้');
      }
    } catch {
      setShowMenu(false);
      Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถบล็อกผู้ใช้ได้');
    }
  };

  const handleReportComment = (item: CommentItem) => {
    if (!isLoggedIn) {
      onClose();
      router.push({
        pathname: '/(auth)/login',
        params: { returnTo: pathname || '/', from: pathname || '/' },
      });
      return;
    }
    setReportTarget({
      type: 'comment',
      id: String(item.id),
      title: item.text ? (item.text.length > 35 ? item.text.substring(0, 35) + '...' : item.text) : 'ความคิดเห็น',
    });
    setReportModalVisible(true);
  };

  const handleClose = () => {
    setShowMenu(false);
    onClose();
  };

  const [profileAvatar, setProfileAvatar] = useState<string | undefined>();
  const currentUserAvatar = user?.avatarUrl || profileAvatar;

  useEffect(() => {
    if (!user?.avatarUrl && isLoggedIn) {
      getMyProfile().then((p) => {
        if (p?.avatar_url) setProfileAvatar(p.avatar_url);
      });
    }
  }, [user?.avatarUrl, isLoggedIn]);

  const title = post?.title || "กะเพราไข่ดาว";
  const description =
    post?.description ||
    "มื้อเที่ยงง่ายๆ แต่อร่อยมาก 🌶️🍳 ฟินสุดๆ ไปเลยจ้า";
  const breakableDescription = formatBreakableText(description);
  const tags = post?.tags && post.tags.length > 0 ? post.tags.map(t => t.replace(/^#+/, "")) : ["อาหารทั่วไป"];
  const location = post?.location || "";
  const timeAgo = post?.timeAgo || "เมื่อเร็วๆ นี้";
  const displayUserName = post?.displayName || post?.username || 'ผู้ใช้งาน';

  const [isExpanded, setIsExpanded] = useState(false);
  const [isTruncated, setIsTruncated] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [commentText, setCommentText] = useState("");
  const commentsScrollRef = useRef<ScrollView>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [slideAnim] = useState(() => new Animated.Value(600));

  // Listen to keyboard height to lift input above keyboard
  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, (e) => {
      if (Platform.OS === "ios") {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      }
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      if (Platform.OS === "ios") {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      }
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Animate sheet sliding up when comments open
  useEffect(() => {
    if (showComments) {
      slideAnim.setValue(600);
      Animated.spring(slideAnim, {
        toValue: 0,
        damping: 24,
        mass: 0.8,
        stiffness: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [showComments, slideAnim]);

  const [prevPostId, setPrevPostId] = useState(post?.id);
  const [prevDescription, setPrevDescription] = useState(description);
  if (post?.id !== prevPostId || description !== prevDescription) {
    setPrevPostId(post?.id);
    setPrevDescription(description);
    setIsExpanded(false);
    setIsTruncated(false);
  }

  const handleTextLayout = (e: any) => {
    const lines = e.nativeEvent?.lines;
    if (Array.isArray(lines)) {
      setIsTruncated(lines.length > 2);
    }
  };

  const handleOpenComments = () => {
    setShowMenu(false);
    setShowComments(true);
  };

  const handleCloseComments = () => {
    Keyboard.dismiss();
    Animated.timing(slideAnim, {
      toValue: 600,
      duration: 180,
      useNativeDriver: true,
    }).start(() => {
      setShowComments(false);
    });
  };

  // Load real comments from backend when comments modal opens
  useEffect(() => {
    if (showComments && post?.id) {
      getPostComments(post.id).then((apiComments) => {
        const visibleComments = (apiComments || []).filter((c: any) => !c.is_hidden);
        setComments(
          visibleComments.map((c) => ({
            id: String(c.id),
            username: c.username || c.profiles?.display_name || c.profiles?.username || 'ผู้ใช้งาน',
            text: c.content || c.text || '',
            avatarUrl: c.profiles?.avatar_url,
            isCurrentUser: Boolean(user?.id && String(c.user_id) === String(user.id)),
          }))
        );
      });
    }
  }, [showComments, post?.id, user?.id]);

  const isPostingRef = useRef(false);

  const handleAddComment = async () => {
    const trimmed = commentText.trim();
    if (!trimmed || !post) return;
    if (isPostingRef.current) return;

    if (!isLoggedIn) {
      handleCloseComments();
      onClose();
      router.push({
        pathname: '/(auth)/login',
        params: { returnTo: pathname || '/', from: pathname || '/' },
      });
      return;
    }

    isPostingRef.current = true;
    try {
      const created = await addPostComment(post.id, trimmed);
      const newComment: CommentItem = {
        id: created?.id ? String(created.id) : Date.now().toString(),
        username: created?.username || created?.profiles?.display_name || user?.displayName || user?.username || displayUserName,
        text: created?.content || trimmed,
        avatarUrl: created?.profiles?.avatar_url || currentUserAvatar,
        isCurrentUser: true,
      };

      setComments((prev) => [...prev, newComment]);
      setCommentText("");
      Keyboard.dismiss();

      setTimeout(() => {
        commentsScrollRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (e) {
      console.warn("Failed to add comment:", e);
    } finally {
      setTimeout(() => {
        isPostingRef.current = false;
      }, 300);
    }
  };

  const handleContentPress = () => {
    setShowMenu(false);
  };

  const handleUserClick = () => {
    setShowMenu(false);
    if (post?.userId) {
      onUserPress?.(post.userId);
    }
  };

  const handleOpenLocation = async () => {
    setShowMenu(false);
    if (!location) return;

    let targetUrl = location.trim();
    if (!targetUrl) return;

    if (/^www\./i.test(targetUrl)) {
      targetUrl = `https://${targetUrl}`;
    } else if (!/^https?:\/\//i.test(targetUrl) && !/^(maps|geo):/i.test(targetUrl)) {
      targetUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(targetUrl)}`;
    }

    try {
      const canOpen = await Linking.canOpenURL(targetUrl);
      if (canOpen) {
        await Linking.openURL(targetUrl);
      } else {
        const searchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.trim())}`;
        await Linking.openURL(searchUrl);
      }
    } catch (error) {
      console.error("Error opening location link:", error);
      Alert.alert("ไม่สามารถเปิดลิงก์ได้", "โปรดตรวจสอบ URL หรือลองใหม่อีกครั้ง");
    }
  };

  if (!post) {
    return null;
  }

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
            {post.avatarUrl && !avatarError ? (
              <Image
                source={{ uri: post.avatarUrl }}
                style={styles.avatar}
                contentFit="cover"
                transition={200}
                onError={() => setAvatarError(true)}
              />
            ) : (
              <Image
                source={require("../assets/images/ProfilePicture.png")}
                style={styles.avatar}
                contentFit="cover"
                transition={200}
              />
            )}
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
          {/* Menu button */}
          <Pressable
            style={({ pressed }) => [
              styles.iconButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={handleMenuPress}
            hitSlop={8}
          >
            <AlignRight
              size={20}
              color="#57423E"
              strokeWidth={2}
            />
          </Pressable>

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
      {showMenu && (
        <View style={styles.dropdownWrapper}>
          <PostDropdown
            isOwnPost={isOwnPost}
            onEdit={handleEditPress}
            onDelete={handleDeletePress}
            onReport={handleReportPostPress}
            onBlock={handleBlockUserPress}
          />
        </View>
      )}

      {/* Post image */}
      <Pressable onPress={handleContentPress}>
        <Image
          source={post.image}
          style={styles.postImage}
          contentFit="cover"
          transition={200}
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

        <View style={styles.descriptionContainer}>
          {/* วัดจำนวนบรรทัดจริง */}
          <ThemedText
            style={[styles.description, styles.hiddenMeasureText]}
            onTextLayout={handleTextLayout}
            pointerEvents="none"
          >
            {breakableDescription}
          </ThemedText>

          <Pressable
            onPress={() => isTruncated && !isExpanded && setIsExpanded(true)}
            disabled={!isTruncated || isExpanded}
          >
            <ThemedText
              style={styles.description}
              numberOfLines={isExpanded ? undefined : 2}
              ellipsizeMode="tail"
            >
              {breakableDescription}
            </ThemedText>
          </Pressable>

          {isTruncated && !isExpanded && (
            <Pressable
              onPress={() => setIsExpanded(true)}
              style={({ pressed }) => [
                styles.readMoreButton,
                pressed && styles.buttonPressed,
              ]}
              hitSlop={8}
            >
              <ThemedText style={styles.readMoreText}>
                ดูเพิ่มเติม
              </ThemedText>
            </Pressable>
          )}
        </View>

        {location !== "" && (
          <Pressable
            style={({ pressed }) => [
              styles.locationContainer,
              pressed && styles.locationPressed,
            ]}
            onPress={(e) => {
              e.stopPropagation();
              handleOpenLocation();
            }}
            hitSlop={6}
          >
            <ThemedText style={styles.location} numberOfLines={2} ellipsizeMode="tail">
              พิกัด:{" "}
              <ThemedText style={styles.link}>
                {location}
              </ThemedText>
            </ThemedText>
          </Pressable>
        )}

        <View style={styles.tagContainer}>
          {tags.map((t, index) => (
            <View key={index} style={styles.tagPill}>
              <ThemedText style={styles.tagText}>
                #{t}
              </ThemedText>
            </View>
          ))}
        </View>

        <View style={styles.divider} />

        <View style={styles.footer}>
          <Pressable
            onPress={handleOpenComments}
            style={({ pressed }) => [
              styles.commentButton,
              pressed && styles.buttonPressed,
            ]}
            hitSlop={8}
          >
            <MessageCircle
              size={22}
              color="#57423E"
              strokeWidth={1.8}
            />
          </Pressable>

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

  const commentSheetContent = (
    <Animated.View
      style={[
        styles.commentSheet,
        {
          transform: [{ translateY: slideAnim }],
        },
      ]}
      onStartShouldSetResponder={() => true}
    >
      {/* Drag handle */}
      <View style={styles.dragHandle} />

      {/* Title */}
      <ThemedText style={styles.sheetTitle}>ความคิดเห็น</ThemedText>

      {/* Divider */}
      <View style={styles.sheetDivider} />

      {/* Comments list */}
      <ScrollView
        ref={commentsScrollRef}
        style={styles.commentsList}
        contentContainerStyle={styles.commentsListContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {comments.length === 0 ? (
          <View style={styles.emptyCommentsContainer}>
            <ThemedText style={styles.emptyCommentsText}>
              ยังไม่มีความคิดเห็น เป็นคนแรกที่แสดงความคิดเห็น!
            </ThemedText>
          </View>
        ) : (
          comments.map((item, index) => (
            <View key={`comment-${item.id}-${index}`} style={styles.commentRow}>
              <View style={styles.commentUserAvatarContainer}>
                <Image
                  source={
                    item.avatarUrl
                      ? { uri: item.avatarUrl }
                      : require("../assets/images/ProfilePicture.png")
                  }
                  style={styles.commentAvatarImage}
                  contentFit="cover"
                  transition={200}
                />
              </View>

              <View style={styles.commentTextContainer}>
                <ThemedText style={styles.commentUsername}>
                  {item.username}
                </ThemedText>
                <ThemedText style={styles.commentText}>
                  {item.text}
                </ThemedText>
              </View>

              {!item.isCurrentUser && (
                <Pressable
                  onPress={() => handleReportComment(item)}
                  style={({ pressed }) => [
                    styles.commentReportBtn,
                    pressed && styles.buttonPressed,
                  ]}
                  hitSlop={8}
                >
                  <Flag size={14} color="#9E9693" />
                </Pressable>
              )}
            </View>
          ))
        )}
      </ScrollView>

      {/* Bottom comment input row */}
      <View
        style={[
          styles.commentInputContainer,
          {
            paddingBottom:
              keyboardHeight > 0
                ? keyboardHeight + (Platform.OS === "ios" ? 10 : 6)
                : Platform.OS === "ios"
                ? 34
                : 14,
          },
        ]}
      >
        <View style={styles.inputAvatarContainer}>
          <Image
            source={
              currentUserAvatar
                ? { uri: currentUserAvatar }
                : require("../assets/images/ProfilePicture.png")
            }
            style={styles.inputAvatarImage}
            contentFit="cover"
            transition={200}
          />
        </View>

        <View style={styles.inputPill}>
          <TextInput
            value={commentText}
            onChangeText={setCommentText}
            placeholder="แสดงความคิดเห็น..."
            placeholderTextColor="#9E9693"
            style={styles.commentTextInput}
            returnKeyType="send"
            onSubmitEditing={handleAddComment}
          />

          <TouchableOpacity
            onPress={handleAddComment}
            onPressIn={handleAddComment}
            disabled={!commentText.trim()}
            activeOpacity={0.7}
            style={[
              styles.postCommentButton,
              !commentText.trim() && { opacity: 0.4 },
            ]}
            hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
          >
            <ThemedText style={styles.postCommentText}>
              โพสต์
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );

  // Inline mode
  if (inline) {
    return (
      <>
        {card}

        <Modal
          transparent
          visible={showComments}
          animationType="fade"
          statusBarTranslucent
          presentationStyle="overFullScreen"
          onRequestClose={handleCloseComments}
        >
          <View style={StyleSheet.absoluteFill}>
            <ScrollView
              style={styles.commentModalOverlay}
              contentContainerStyle={styles.commentModalOverlayContent}
              keyboardShouldPersistTaps="always"
              bounces={false}
            >
              <Pressable
                style={StyleSheet.absoluteFill}
                onPress={handleCloseComments}
              />
              {commentSheetContent}
            </ScrollView>

            {/* When comment modal is open, render ReportModal directly inside it */}
            {reportModalVisible && (
              <ReportModal
                visible={reportModalVisible}
                targetType={reportTarget.type}
                targetId={reportTarget.id}
                targetTitle={reportTarget.title}
                onClose={() => setReportModalVisible(false)}
                useNativeModal={false}
              />
            )}
          </View>
        </Modal>

        {/* When comments are NOT open (e.g. reporting post in inline mode) */}
        {!showComments && (
          <ReportModal
            visible={reportModalVisible}
            targetType={reportTarget.type}
            targetId={reportTarget.id}
            targetTitle={reportTarget.title}
            onClose={() => setReportModalVisible(false)}
          />
        )}

        {/* Block Success Modal (matches Image 2) */}
        <Modal
          transparent
          visible={blockSuccessVisible}
          animationType="fade"
          statusBarTranslucent
          presentationStyle="overFullScreen"
          onRequestClose={handleDismissBlockSuccess}
        >
          <Pressable
            style={styles.blockSuccessOverlay}
            onPress={handleDismissBlockSuccess}
          >
            <View style={styles.blockSuccessPopup}>
              <ThemedText style={styles.blockSuccessText}>
                บล็อกผู้ใช้สำเร็จ
              </ThemedText>
            </View>
          </Pressable>
        </Modal>
      </>
    );
  }

  // Modal mode
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      presentationStyle="overFullScreen"
      onRequestClose={handleClose}
    >
      <View style={styles.modalRoot}>
        <View style={styles.backdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={handleClose}
          />
          {card}
        </View>

        {showComments && (
          <ScrollView
            style={styles.commentModalOverlayAbsolute}
            contentContainerStyle={styles.commentModalOverlayContent}
            keyboardShouldPersistTaps="always"
            bounces={false}
          >
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={handleCloseComments}
            />
            {commentSheetContent}
          </ScrollView>
        )}

        {/* Report Modal inside the Post Modal */}
        {reportModalVisible && (
          <ReportModal
            visible={reportModalVisible}
            targetType={reportTarget.type}
            targetId={reportTarget.id}
            targetTitle={reportTarget.title}
            onClose={() => setReportModalVisible(false)}
            useNativeModal={false}
          />
        )}

        {/* Block Success Modal inside Post Modal */}
        {blockSuccessVisible && (
          <View style={StyleSheet.absoluteFill}>
            <Pressable
              style={styles.blockSuccessOverlay}
              onPress={handleDismissBlockSuccess}
            >
              <View style={styles.blockSuccessPopup}>
                <ThemedText style={styles.blockSuccessText}>
                  บล็อกผู้ใช้สำเร็จ
                </ThemedText>
              </View>
            </Pressable>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  commentReportBtn: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  modalRoot: {
    flex: 1,
  },

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
    fontFamily: AppFonts.bold,
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
    fontFamily: AppFonts.bold,
    fontWeight: "900",
    color: "#4B3500",
    marginBottom: 6,
    marginTop: 5,
  },

  descriptionContainer: {
    marginBottom: 8,
  },

  description: {
    fontSize: 15,
    color: "#57423E",
    lineHeight: 24,
  },

  hiddenMeasureText: {
    position: "absolute",
    opacity: 0,
    left: 0,
    right: 0,
    top: 0,
    zIndex: -1,
  },

  readMoreButton: {
    marginTop: 4,
    alignSelf: "flex-start",
  },

  readMoreText: {
    fontSize: 14,
    fontFamily: AppFonts.semiBold,
    fontWeight: "600",
    color: "#8B5A2B",
  },

  locationContainer: {
    marginBottom: 10,
    alignSelf: "flex-start",
  },

  locationPressed: {
    opacity: 0.6,
  },

  location: {
    fontSize: 14,
    color: "#57423E",
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  commentButton: {
    padding: 4,
  },

  bookmarkButton: {
    padding: 4,
  },

  buttonPressed: {
    opacity: 0.8,
    transform: [{ translateY: 2 }],
  },

  commentModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
  },

  commentModalOverlayContent: {
    flex: 1,
    justifyContent: "flex-end",
  },

  commentModalOverlayAbsolute: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    zIndex: 1000,
    elevation: 1000,
  },

  commentSheet: {
    width: "100%",
    height: 520,
    maxHeight: "75%",
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingTop: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 25,
  },

  dragHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D9D9D9",
    alignSelf: "center",
    marginBottom: 12,
  },

  sheetTitle: {
    fontSize: 16,
    fontFamily: AppFonts.bold,
    fontWeight: "700",
    color: "#241917",
    textAlign: "center",
    marginBottom: 12,
  },

  sheetDivider: {
    height: 1,
    backgroundColor: "#F0ECE9",
    width: "100%",
  },

  commentsList: {
    flex: 1,
  },

  commentsListContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },

  commentRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },

  emptyCommentsContainer: {
    paddingVertical: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyCommentsText: {
    fontSize: 14,
    fontFamily: AppFonts.regular,
    color: "#8C7B75",
    textAlign: "center",
  },

  commentAvatarBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    marginTop: 2,
  },

  commentAvatarEmoji: {
    fontSize: 19,
  },

  commentUserAvatarContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: "#FFF1B8",
    backgroundColor: "#FFF8E5",
    overflow: "hidden",
    marginRight: 12,
    marginTop: 2,
  },

  commentAvatarImage: {
    width: "100%",
    height: "100%",
  },

  commentTextContainer: {
    flex: 1,
    justifyContent: "center",
  },

  commentUsername: {
    fontSize: 14,
    fontFamily: AppFonts.bold,
    fontWeight: "700",
    color: "#241917",
    marginBottom: 2,
  },

  commentText: {
    fontSize: 13.5,
    fontFamily: AppFonts.regular,
    color: "#4B3500",
    lineHeight: 20,
  },

  commentInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F0ECE9",
    backgroundColor: "#FFFFFF",
  },

  inputAvatarContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: "#FFF1B8",
    backgroundColor: "#FFF8E5",
    overflow: "hidden",
    marginRight: 10,
  },

  inputAvatarImage: {
    width: "100%",
    height: "100%",
  },

  inputPill: {
    flex: 1,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#F5F2F0",
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 16,
    paddingRight: 12,
  },

  commentTextInput: {
    flex: 1,
    fontSize: 13.5,
    fontFamily: AppFonts.regular,
    color: "#241917",
    paddingVertical: 0,
  },

  postCommentButton: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },

  postCommentText: {
    fontSize: 14,
    fontFamily: AppFonts.bold,
    fontWeight: "700",
    color: "#8A3E2D",
  },

  blockSuccessOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
  },

  blockSuccessPopup: {
    width: 290,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    paddingVertical: 36,
    paddingHorizontal: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },

  blockSuccessText: {
    textAlign: "center",
    fontSize: 18,
    fontFamily: AppFonts.bold,
    fontWeight: "700",
    color: "#1C1B1F",
  },
});