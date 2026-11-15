import React, { useEffect, useState, useRef } from "react";
import {
    View,
    Pressable,
    Image,
    StyleSheet,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
} from "react-native";
import { SafeAreaView } from "@/components/SafeAreaView";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { safeBack } from "@/utils/navigation";
import * as ImagePicker from "expo-image-picker";
import { Camera } from "lucide-react-native";

import { Header } from "@/components/Header";
import { ThemedText } from "@/components/themed-text";
import PostForm, {
    PostData,
} from "@/components/post-form";
import { updatePost } from "@/services/postService";
import { useAuth } from "@/context/AuthContext";
import { uploadCompressedImage, deleteStorageImage } from "@/services/storageService";
import { FOOD_CATEGORIES } from "@/constants/categories";
import { Typography } from "@/constants/typography";
import AlertPopup, { useAlertPopup } from "@/components/AlertPopup";
import { useKeyboardScroll } from "@/hooks/useKeyboardScroll";

export default function EditPost() {
    const { postId, post: postParam } = useLocalSearchParams<{
        postId?: string;
        post?: string;
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
        defaultBottomPadding: 40,
    });

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
        parsedPost?.image ?? require("@/assets/images/StirFriedHolyBasil.png")
    );

    const permissionGrantedRef = useRef(false);

    useEffect(() => {
        // Pre-check and warm up image picker permissions in the background for instant opening
        ImagePicker.getMediaLibraryPermissionsAsync()
            .then((res) => {
                if (res.granted) {
                    permissionGrantedRef.current = true;
                }
            })
            .catch(() => {});
    }, []);

    const pickImage = async () => {
        // Only request if not already granted to eliminate permission latency
        if (!permissionGrantedRef.current) {
            const permission =
                await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (!permission.granted) {
                showAlert("ไม่สามารถเข้าถึงรูปภาพ", "กรุณาอนุญาตให้แอปเข้าถึงรูปภาพ");
                return;
            }
            permissionGrantedRef.current = true;
        }

        const result =
            await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ["images"],
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.85,
                base64: false,
            });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            const asset = result.assets[0];
            const uri = asset.uri;

            setImageUri({ uri });

            setPost((currentPost) => ({
                ...currentPost,
                image: uri,
            }));
        }
    };

    const handleSave = async () => {
        if (!imageUri && !post.image) {
            showAlert("กรุณาใส่รูปภาพ", "กรุณาเลือกรูปภาพอาหารก่อนบันทึก");
            return;
        }

        if (!post.title.trim()) {
            showAlert("กรุณากรอกข้อมูล", "กรุณากรอกชื่อเมนูก่อนบันทึก");
            return;
        }

        if (!post.description.trim()) {
            showAlert("กรุณากรอกข้อมูล", "กรุณากรอกเล่าความอร่อยก่อนบันทึก");
            return;
        }

        if (!post.categories || post.categories.length === 0) {
            showAlert("กรุณาเลือกประเภทอาหาร", "กรุณาเลือกประเภทอาหารอย่างน้อย 1 ประเภท");
            return;
        }

        if (!postId) {
            showAlert("เกิดข้อผิดพลาด", "ไม่พบ ID โพสต์");
            return;
        }

        setIsSubmitting(true);

        let uploadedImageUrl: string | undefined = post.image || undefined;
        if (post.image && user?.id && !post.image.startsWith('http://') && !post.image.startsWith('https://')) {
            try {
                uploadedImageUrl = await uploadCompressedImage('posts', post.image, user.id);
            } catch (uploadErr) {
                console.warn('Upload edited post image failed:', uploadErr);
                setIsSubmitting(false);
                showAlert("อัปโหลดรูปไม่สำเร็จ", "กรุณาลองใหม่อีกครั้ง");
                return;
            }
        }

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
            image_url: uploadedImageUrl,
            category_ids: categoryIds.length > 0 ? categoryIds : undefined,
        });

        setIsSubmitting(false);

        if (!result || result.success === false) {
            showAlert("บันทึกไม่สำเร็จ", result?.error || "กรุณาลองใหม่อีกครั้ง");
            return;
        }

        if (uploadedImageUrl && parsedPost?.image?.uri && uploadedImageUrl !== parsedPost.image.uri) {
            deleteStorageImage('posts', parsedPost.image.uri);
        }

        const updatedPostForUI = {
            id: postId,
            image: uploadedImageUrl ? { uri: uploadedImageUrl } : parsedPost?.image,
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

            <AlertPopup {...alertProps} onRequestClose={hideAlert} />

            <SafeAreaView style={styles.container}>
                <Header
                    title="แก้ไขโพสต์"
                    leftIcon="close"
                    onLeftPress={() => safeBack("/(tabs)")}
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

                    <PostForm
                        initialData={post}
                        onFocusField={(_field, fieldRef) => {
                            scrollToFocusedInput(fieldRef);
                        }}
                        onChange={(data) => {
                            setPost((currentPost) => ({
                                ...data,
                                image: currentPost.image,
                            }));
                        }}
                    />

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
                </KeyboardAvoidingView>
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
        fontFamily: Typography.regular,
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