import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Pressable,
  Image,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from "react-native";
import AlertPopup, { useAlertPopup } from "@/components/AlertPopup";
import { SafeAreaView } from "@/components/SafeAreaView";
import {
  Stack,
  router,
  useLocalSearchParams,
} from "expo-router";
import { safeBack } from "@/utils/navigation";
import * as ImagePicker from "expo-image-picker";
import { uploadAsync, FileSystemUploadType } from "expo-file-system/legacy";
import { Camera } from "lucide-react-native";
import { Header } from "@/components/Header";
import ProfileForm from "@/components/profile-form";
import LiquidMenu from "@/components/liquid-menu";
import { ThemedText } from "@/components/themed-text";
import { getCachedMyProfile, updateMyProfile } from "@/services/profileService";
import { uploadCompressedImage, deleteStorageImage } from "@/services/storageService";
import { useAuth } from "@/context/AuthContext";
import { API_BASE_URL } from "@/services/api";
import { supabase } from "@/lib/supabase";
import { useKeyboardScroll } from "@/hooks/useKeyboardScroll";

export default function EditProfile() {
  const params = useLocalSearchParams<{
    name?: string;
    username?: string;
    bio?: string;
    avatarUrl?: string;
  }>();

  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { alertProps, show: showAlert, hide: hideAlert } = useAlertPopup();
  const {
    scrollRef,
    contentBottomPadding,
    handleScroll,
    handleLayout,
    handleContentSizeChange,
    scrollToFocusedInput,
  } = useKeyboardScroll({
    defaultBottomPadding: 110,
  });

  const [profileData, setProfileData] = useState({
    name: params.name ?? "",
    username: params.username ?? "",
    bio: params.bio ?? "",
  });

  const initialAvatarUrl = getCachedMyProfile()?.avatar_url || params.avatarUrl;
  const [profileImage, setProfileImage] = useState<any>(
    initialAvatarUrl ? { uri: initialAvatarUrl } : require("@/assets/images/ProfilePicture.png")
  );

  const handlePickImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      return;
    }

    const result =
      await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
        base64: false,
      });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setProfileImage({
        uri: asset.uri,
        isLocal: true,
      });
    }
  };

  const handleSave = async () => {
    setIsSubmitting(true);

    try {
      // ย่อรูปและอัปโหลดขึ้น Supabase Storage (avatars bucket) ถ้ามีการเลือกรูปใหม่
      let avatarUrl: string | undefined = undefined;
      if (profileImage?.isLocal && profileImage?.uri) {
        const userId = user?.id || (await supabase.auth.getUser()).data.user?.id;
        if (userId) {
          avatarUrl = await uploadCompressedImage('avatars', profileImage.uri, userId);
        }
      }

      // อัปเดต profile ผ่าน API
      const result = await updateMyProfile({
        display_name: profileData.name.trim() || undefined,
        username: profileData.username.replace('@', '').trim() || undefined,
        bio: profileData.bio.trim() || null,  // null เพื่อล้างค่า bio ใน DB
        ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
      });

      if (!result) {
        showAlert("บันทึกไม่สำเร็จ", "กรุณาลองใหม่อีกครั้ง");
        setIsSubmitting(false);
        return;
      }

      if (avatarUrl && initialAvatarUrl && avatarUrl !== initialAvatarUrl) {
        deleteStorageImage('avatars', initialAvatarUrl);
      }

      // cache ถูกอัปเดตใน updateMyProfile แล้ว กลับหน้าโปรไฟล์ทันทีโดยไม่ต้องส่งรูปผ่าน URL params
      safeBack("/(tabs)/profile");
    } catch (e) {
      console.warn("EditProfile handleSave error:", e);
      showAlert("เกิดข้อผิดพลาด", "กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Hide Expo Router system header */}
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      <AlertPopup {...alertProps} onRequestClose={hideAlert} />

      <SafeAreaView style={styles.container}>
        {/* Custom Header */}
        <Header
          title="แก้ไขโปรไฟล์"
          leftIcon="back"
          onLeftPress={() => safeBack("/(tabs)/profile")}
          rightIcon="none"
        />

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            ref={scrollRef}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.content, { paddingBottom: contentBottomPadding }]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="none"
            onScroll={handleScroll}
            onLayout={handleLayout}
            onContentSizeChange={handleContentSizeChange}
            scrollEventThrottle={16}
          >
              {/* Profile Picture */}
              <View style={styles.avatarContainer}>
                <View style={styles.avatarOuter}>
                  <View style={styles.avatarInner}>
                    <Image
                      source={profileImage}
                      style={styles.avatar}
                      resizeMode="cover"
                    />
                  </View>

                  {/* Upload Image Button */}
                  <Pressable
                    style={({ pressed }) => [
                      styles.cameraButton,
                      pressed &&
                      styles.cameraButtonPressed,
                    ]}
                    onPress={handlePickImage}
                  >
                    <Camera
                      size={17}
                      color="#721209"
                      strokeWidth={3}
                    />
                  </Pressable>
                </View>
              </View>

              {/* Profile Form */}
              <ProfileForm
                initialName={profileData.name}
                initialUsername={
                  profileData.username
                }
                initialBio={profileData.bio}
                onFocusField={(_field, fieldRef) => {
                  scrollToFocusedInput(fieldRef);
                }}
                onChange={setProfileData}
              />

              {/* Save Button */}
              <Pressable
                style={({ pressed }) => [
                  styles.saveButton,
                  pressed &&
                  styles.saveButtonPressed,
                  isSubmitting && styles.saveButtonDisabled,
                ]}
                onPress={handleSave}
                disabled={isSubmitting}
              >
                <ThemedText
                  style={styles.saveText}
                >
                  {isSubmitting ? "กำลังบันทึก..." : "บันทึก"}
                </ThemedText>
              </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Bottom Menu */}
        <LiquidMenu />
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF9F7",
  },

  innerContainer: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 14,
    paddingTop: 16,
    paddingBottom: 110,
    maxWidth: 600,
    width: "100%",
    alignSelf: "center",
  },

  avatarContainer: {
    alignItems: "center",
    marginBottom: 50,
  },

  avatarOuter: {
    width: 110,
    height: 110,
    marginBottom: 10,
    borderRadius: 100,
    borderWidth: 3,
    borderColor: "#F3D6D0",
    backgroundColor: "#FFF1B8",

  },

  avatarInner: {
    width: "100%",
    height: "100%",
    overflow: "hidden",
    borderRadius: 100,
    backgroundColor: "#FFF8E5",
    alignItems: "center",
    justifyContent: "center",
  },

  avatar: {
    width: "100%",
    height: "100%",
  },

  cameraButton: {
    position: "absolute",
    right: -2,
    bottom: 2,
    width: 35,
    height: 35,
    borderRadius: 35,
    backgroundColor: "#FF7A6633",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },

  cameraButtonPressed: {
    opacity: 0.8,
    transform: [{ translateY: 2 }],
  },

  saveButton: {
    alignSelf: "flex-end",
    width: 125,
    height: 45,
    borderRadius: 25,
    backgroundColor: "#FF7A6633",
    borderWidth: 1,
    borderColor: "#72120933",
    borderBottomWidth: 3.5,
    borderBottomColor: "#72120933",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
  },

  saveButtonPressed: {
    opacity: 0.8,
    transform: [{ translateY: 2 }],
  },

  saveButtonDisabled: {
    opacity: 0.5,
  },

  saveText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#721209",
  },
});