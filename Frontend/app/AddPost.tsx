import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Pressable,
  Image,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import { Stack, router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Camera } from "lucide-react-native";

import { Header } from "@/components/Header";
import { ThemedText } from "@/components/themed-text";
import PostForm, {
  PostData,
} from "@/components/PostForm";

export default function AddPost() {
  const [post, setPost] = useState<PostData>({
    image: null,
    title: "",
    description: "",
    restaurant: "",
    categories: ["อาหารจานเดียว"],
  });

  // Pick an image from the device gallery
  const pickImage = async () => {
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        "ไม่สามารถเข้าถึงรูปภาพ",
        "กรุณาอนุญาตให้แอปเข้าถึงรูปภาพ",
      );
      return;
    }

    const result =
      await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.9,
      });

    if (!result.canceled) {
      setPost((currentPost) => ({
        ...currentPost,
        image: result.assets[0].uri,
      }));
    }
  };

  // Create a new post and return to profile
  const handlePost = () => {
    if (!post.image || !post.title.trim()) {
      Alert.alert(
        "กรุณากรอกข้อมูล",
        "เลือกรูปและกรอกชื่อเมนูก่อนโพสต์",
      );
      return;
    }

    const newPost = {
      id: Date.now().toString(),

      // Convert image URI to React Native ImageSource format
      image: {
        uri: post.image,
      },

      title: post.title.trim(),
      description: post.description?.trim() || "",
      tag: post.categories?.[0] || "อาหารจานเดียว",
      location: post.restaurant?.trim() || "",
      timeAgo: "เมื่อสักครู่นี้",
      userId: "me",
    };

    router.replace({
      pathname: "/profile",
      params: {
        post: JSON.stringify(newPost),
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
        {/* Header */}
        <Header
          title="เพิ่มโพสต์ใหม่"
          leftIcon="close"
          onLeftPress={() => router.back()}
          rightIcon="none"
        />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {/* Image Picker */}
          <Pressable
            onPress={pickImage}
            style={styles.imageBox}
          >
            {post.image ? (
              <Image
                source={{ uri: post.image }}
                style={styles.image}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.emptyImage}>
                <Camera
                  size={50}
                  color="#DEC0BB"
                  strokeWidth={2}
                />

                <ThemedText
                  style={styles.imageText}
                >
                  แตะเพื่อเลือกรูปภาพ
                </ThemedText>
              </View>
            )}
          </Pressable>

          {/* Post Form */}
          <PostForm
            onChange={(data) => {
              setPost((currentPost) => ({
                ...data,
                image: currentPost.image,
              }));
            }}
          />

          {/* Post Button */}
          <Pressable
            style={({ pressed }) => [
              styles.postButton,
              pressed && styles.postButtonPressed,
            ]}
            onPress={handlePost}
          >
            <ThemedText style={styles.postText}>
              โพสต์
            </ThemedText>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF8ED",
  },

  content: {
    padding: 16,
    paddingBottom: 40,
  },

  imageBox: {
    height: 260,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "#A78A82",
    borderRadius: 9,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginBottom: 15,
    marginLeft: 5,
    marginRight: 5,
    marginTop: 10,
  },

  emptyImage: {
    alignItems: "center",
    justifyContent: "center",
  },

  image: {
    width: "100%",
    height: "100%",
  },

  imageText: {
    marginTop: 5,
    fontSize: 15,
    color: "#9D8179",
    fontFamily: "NotoSansThai_400Regular",
  },

  postButton: {
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

  postButtonPressed: {
    transform: [{ translateY: 2 }],
  },

  postText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#721209",
  },
});