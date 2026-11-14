import React from "react";
import {
  View,
  Pressable,
  StyleSheet,
  ImageSourcePropType,
} from "react-native";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";

export type Post = {
  id: string;
  image: ImageSourcePropType | any;
  userId?: string;
  title?: string;
  description?: string;
  tag?: string;
  location?: string;
  timeAgo?: string;
};

type PostGridProps = {
  posts: Post[];
  onPressPost?: (post: Post) => void;
  onLongPressPost?: (post: Post) => void;
  delayLongPress?: number;
};

export default function PostGrid({
  posts,
  onPressPost,
  onLongPressPost,
  delayLongPress = 250,
}: PostGridProps) {
  return (
    <View style={styles.container}>
      {posts.map((post) => (
        <Pressable
          key={post.id}
          onPress={() => onPressPost?.(post)}
          delayLongPress={delayLongPress}
          onLongPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
            onLongPressPost?.(post);
          }}
          style={styles.post}
        >
          <Image
            source={post.image}
            style={styles.image}
            contentFit="cover"
            transition={150}
          />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: "100%",
    maxWidth: 600,
    alignSelf: "center",
  },

  post: {
    width: "33.333%",
    aspectRatio: 1,
    borderWidth: 0.5,
    borderColor: "#FFF9F6",
    backgroundColor: "#EADBD6",
  },

  image: {
    width: "100%",
    height: "100%",
  },
});