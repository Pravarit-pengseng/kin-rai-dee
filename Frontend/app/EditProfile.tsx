import React, { useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  View,
  Pressable,
  Image,
  Alert,
} from "react-native";
import {
  Stack,
  router,
  useLocalSearchParams,
} from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Camera } from "lucide-react-native";
import { Header } from "@/components/Header";
import ProfileForm from "@/components/profile-form";
import LiquidMenu from "@/components/liquid-menu";
import { ThemedText } from "@/components/themed-text";
import { updateMyProfile } from "@/services/profileService";
import { API_BASE_URL } from "@/services/api";
import { supabase } from "@/lib/supabase";

export default function EditProfile() {
  const params = useLocalSearchParams<{
    name?: string;
    username?: string;
    bio?: string;
  }>();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [profileData, setProfileData] = useState({
    name: params.name ?? "",
    username: params.username ?? "",
    bio: params.bio ?? "",
  });

  const [profileImage, setProfileImage] = useState<any>(
    require("../assets/images/ProfilePicture.png")
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
        quality: 1,
      });

    if (!result.canceled) {
      setProfileImage({
        uri: result.assets[0].uri,
      });
    }
  };

  const handleSave = async () => {
    setIsSubmitting(true);

    try {
      // อัปโหลดรูปภาพ avatar ถ้ามีการเลือกรูปใหม่ (uri ไม่ใช่ local asset)
      let avatarUrl: string | undefined = undefined;
      if (profileImage?.uri && profileImage.uri.startsWith('file')) {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        const formData = new FormData();
        const filename = profileImage.uri.split('/').pop() || 'avatar.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        formData.append('file', { uri: profileImage.uri, name: filename, type } as any);

        const res = await fetch(`${API_BASE_URL}/api/profiles/me/avatar`, {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData,
        });

        if (res.ok) {
          const json = await res.json();
          avatarUrl = json.avatar_url;
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
        Alert.alert("บันทึกไม่สำเร็จ", "กรุณาลองใหม่อีกครั้ง");
        setIsSubmitting(false);
        return;
      }

      // navigate กลับ profile พร้อม params อัปเดต
      router.replace({
        pathname: "/(tabs)/profile",
        params: {
          name: result.display_name || profileData.name || '',
          username: result.username || profileData.username || '',
          bio: result.bio || '',  // ส่ง string ว่างแทน null
        },
      });
    } catch (e) {
      console.warn("EditProfile handleSave error:", e);
      Alert.alert("เกิดข้อผิดพลาด", "กรุณาลองใหม่อีกครั้ง");
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

      <SafeAreaView style={styles.container}>
        {/* Custom Header */}
        <Header
          title="แก้ไขโปรไฟล์"
          leftIcon="back"
          onLeftPress={() => router.back()}
          rightIcon="none"
        />

        <View style={styles.content}>
          {/* Profile Picture */}
          <View style={styles.avatarContainer}>
            <View style={styles.avatarWrapper}>
              <Image
                source={profileImage}
                style={styles.avatar}
                resizeMode="cover"
              />

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
        </View>

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

  content: {
    flex: 1,
    paddingHorizontal: 14,
    paddingTop: 16,
  },

  avatarContainer: {
    alignItems: "center",
    marginBottom: 50,
  },

  avatarWrapper: {
    position: "relative",
    width: 110,
    height: 110,
  },

  avatar: {
    width: 110,
    height: 110,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },

  cameraButton: {
    position: "absolute",
    right: 2,
    bottom: 8,
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