import React, { useState, useEffect } from "react";
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
} from "@/components/post-form";
import { useAuth } from "@/context/AuthContext";
import { createPost } from "@/services/postService";
import { FOOD_CATEGORIES } from "@/constants/categories";

export default function AddPost() {
    const { isLoggedIn } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!isLoggedIn) {
            router.replace({ pathname: '/(auth)/login', params: { returnTo: '/' } });
        }
    }, [isLoggedIn]);

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
                quality: 0.5,
                base64: true,
            });

        if (!result.canceled) {
            const base64Img = `data:image/jpeg;base64,${result.assets[0].base64}`;
            setPost((currentPost) => ({
                ...currentPost,
                image: base64Img,
            }));
        }
    };

    // Create a new post via API then return to profile
    const handlePost = async () => {
        if (!post.title.trim()) {
            Alert.alert(
                "กรุณากรอกข้อมูล",
                "กรอกชื่อเมนูก่อนโพสต์",
            );
            return;
        }

        setIsSubmitting(true);

        // Map category labels → numeric IDs
        const categoryIds = post.categories
            .map((label) => {
                const found = FOOD_CATEGORIES.find((c) => c.label === label);
                return found ? Number(found.id) : null;
            })
            .filter((id): id is number => id !== null);

        const result = await createPost({
            food_name: post.title.trim(),
            description: post.description?.trim() || undefined,
            restaurant_url: post.restaurant?.trim() || undefined,
            image_url: post.image || undefined,
            category_ids: categoryIds,
        });

        setIsSubmitting(false);

        if (!result) {
            Alert.alert(
                "โพสต์ไม่สำเร็จ",
                "กรุณาลองใหม่อีกครั้ง",
            );
            return;
        }

        // ส่ง post ใหม่จาก backend ไปให้ profile screen แสดง
        const createdPost = result?.data ?? result;
        const newPostForUI = {
            id: String(createdPost?.id ?? Date.now()),
            image: post.image ? { uri: post.image } : undefined,
            title: post.title.trim(),
            description: post.description?.trim() || "",
            tags: post.categories?.length > 0 ? post.categories : ["อาหารจานเดียว"],
            location: post.restaurant?.trim() || "",
            timeAgo: "เมื่อสักครู่นี้",
            userId: "me",
        };

        router.replace({
            pathname: "/(tabs)/profile",
            params: {
                post: JSON.stringify(newPostForUI),
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
                        style={({ pressed }) => [
                            styles.imageBox,
                            pressed && styles.postButtonPressed,
                        ]}
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
                        initialData={post}
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
                            isSubmitting && styles.postButtonDisabled,
                        ]}
                        onPress={handlePost}
                        disabled={isSubmitting}
                    >
                        <ThemedText style={styles.postText}>
                            {isSubmitting ? "กำลังโพสต์..." : "โพสต์"}
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
        opacity: 0.8,
        transform: [{ translateY: 2 }],
    },

    postButtonDisabled: {
        opacity: 0.5,
    },

    postText: {
        fontSize: 16,
        fontWeight: "700",
        color: "#721209",
    },
});