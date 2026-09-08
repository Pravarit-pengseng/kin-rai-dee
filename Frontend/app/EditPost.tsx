import React, { useEffect, useState } from "react";
import {
    SafeAreaView,
    View,
    Pressable,
    Image,
    StyleSheet,
    ScrollView,
    Alert,
    ActivityIndicator,
} from "react-native";
import { Stack, router, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Camera } from "lucide-react-native";

import { Header } from "@/components/Header";
import { ThemedText } from "@/components/themed-text";
import PostForm, {
    PostData,
} from "@/components/post-form";
import { updatePost } from "@/services/postService";
import { FOOD_CATEGORIES } from "@/constants/categories";

export default function EditPost() {
    const { postId, post: postParam } = useLocalSearchParams<{
        postId?: string;
        post?: string;
    }>();

    const [isSubmitting, setIsSubmitting] = useState(false);

    // Parse post จาก params
    const parsedPost = postParam ? (() => {
        try { return JSON.parse(postParam as string); } catch { return null; }
    })() : null;

    const [post, setPost] = useState<PostData>({
        image: null,
        title: parsedPost?.title ?? "",
        description: parsedPost?.description ?? "",
        restaurant: parsedPost?.location ?? "",
        categories: parsedPost?.tags?.length ? parsedPost.tags : (parsedPost?.tag ? [parsedPost.tag] : []),
    });

    const [imageUri, setImageUri] = useState<any>(
        parsedPost?.image ?? require("../assets/images/StirFriedHolyBasil.png")
    );

    const pickImage = async () => {
        const permission =
            await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permission.granted) {
            Alert.alert(
                "ไม่สามารถเข้าถึงรูปภาพ",
                "กรุณาอนุญาตให้แอปเข้าถึงรูปภาพ"
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
            const uri = result.assets[0].uri;
            const base64Img = `data:image/jpeg;base64,${result.assets[0].base64}`;

            setImageUri({ uri });

            setPost((currentPost) => ({
                ...currentPost,
                image: base64Img,
            }));
        }
    };

    const handleSave = async () => {
        if (!post.title.trim()) {
            Alert.alert(
                "กรุณากรอกข้อมูล",
                "กรุณากรอกชื่อเมนูก่อนบันทึก"
            );
            return;
        }

        if (!postId) {
            Alert.alert("เกิดข้อผิดพลาด", "ไม่พบ ID โพสต์");
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

        const result = await updatePost(postId, {
            food_name: post.title.trim(),
            description: post.description?.trim() || undefined,
            restaurant_url: post.restaurant?.trim() || undefined,
            image_url: post.image || undefined,
            category_ids: categoryIds.length > 0 ? categoryIds : undefined,
        });

        setIsSubmitting(false);

        if (!result) {
            Alert.alert("บันทึกไม่สำเร็จ", "กรุณาลองใหม่อีกครั้ง");
            return;
        }

        // ส่งข้อมูลอัปเดตกลับไปยัง profile screen
        const updatedPostForUI = {
            id: postId,
            image: post.image ? { uri: post.image } : parsedPost?.image,
            title: post.title.trim(),
            description: post.description?.trim() || "",
            tags: post.categories?.length > 0 ? post.categories : (parsedPost?.tags || ["อาหารจานเดียว"]),
            location: post.restaurant?.trim() || "",
            userId: parsedPost?.userId,
        };

        router.replace({
            pathname: "/(tabs)/profile",
            params: {
                post: JSON.stringify(updatedPostForUI),
                mode: "edit",
            },
        });
    };

    return (
        <>
            <Stack.Screen
                options={{
                    headerShown: false,
                }}
            />

            <SafeAreaView style={styles.container}>
                {/* Header */}
                <Header
                    title="แก้ไขโพสต์"
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
                        {imageUri ? (
                            <Image
                                source={imageUri}
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

                    {/* Save Button */}
                    <Pressable
                        style={({ pressed }) => [
                            styles.postButton,
                            pressed &&
                            styles.postButtonPressed,
                            isSubmitting && styles.postButtonDisabled,
                        ]}
                        onPress={handleSave}
                        disabled={isSubmitting}
                    >
                        <ThemedText style={styles.postText}>
                            {isSubmitting ? "กำลังบันทึก..." : "บันทึก"}
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