import React, { useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  View,
  Pressable,
  Image,
} from "react-native";
import {
  Stack,
  router,
  useLocalSearchParams,
} from "expo-router";
import { Camera } from "lucide-react-native";

import { Header } from "@/components/Header";
import ProfileForm from "@/components/ProfileForm";
import LiquidMenu from "@/components/LiquidMenu";
import { ThemedText } from "@/components/themed-text";

export default function EditProfile() {
  const params = useLocalSearchParams<{
    name?: string;
    username?: string;
    bio?: string;
  }>();

  const [profileData, setProfileData] = useState({
    name: params.name ?? "บุคคลที่ชอบกิน",
    username: params.username ?? "@mookmhee",
    bio:
      params.bio ??
      "กินเก่ง ทำอาหารกินเองบ่อย 🔍✨",
  });

  const handleSave = () => {
    router.replace({
      pathname: "/Profile",
      params: {
        name: profileData.name,
        username: profileData.username,
        bio: profileData.bio,
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
                source={require(
                  "../assets/images/ProfilePicture.png"
                )}
                style={styles.avatar}
                resizeMode="cover"
              />

              <Pressable
                style={styles.cameraButton}
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
            ]}
            onPress={handleSave}
          >
            <ThemedText
              style={styles.saveText}
            >
              บันทึก
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
    transform: [{ translateY: 2 }],
  },

  saveText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#721209",
  },
});