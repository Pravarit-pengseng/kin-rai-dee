import React from "react";
import {
  View,
  Image,
  Pressable,
  useWindowDimensions,
  StyleSheet,
  ImageSourcePropType,
} from "react-native";

export type Post = {
  id: string;
  image: ImageSourcePropType;
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
};

export default function PostGrid({
  posts,
  onPressPost,
  onLongPressPost,
}: PostGridProps) {
  const { width } = useWindowDimensions();
  const imageSize = width / 3;

  return (
    <View style={styles.container}>
      {posts.map((post) => (
        <Pressable
          key={post.id}
          onPress={() => onPressPost?.(post)}
          onLongPress={() =>
            onLongPressPost?.(post)
          }
          style={[
            styles.post,
            {
              width: imageSize,
              height: imageSize,
            },
          ]}
        >
          <Image
            source={post.image}
            style={styles.image}
            resizeMode="cover"
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
  },

  post: {
    borderWidth: 0.5,
    borderColor: "#FFF9F6",
  },

  image: {
    width: "100%",
    height: "100%",
  },
});