import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, useWindowDimensions } from "react-native";

function PostSkeletonCard() {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, [shimmer]);

  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.85] });
  const S = (style: object) => <Animated.View style={[style, { opacity }]} />;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.userRow}>
          {S(styles.avatar)}
          <View style={styles.userInfo}>
            {S(styles.nameLine)}
            {S(styles.timeLine)}
          </View>
        </View>
      </View>
      {S(styles.image)}
      <View style={styles.content}>
        {S(styles.titleLine)}
        {S(styles.descLine1)}
        {S(styles.descLine2)}
        <View style={styles.tagRow}>{S(styles.tagPill)}</View>
        <View style={styles.divider} />
        <View style={styles.footer}>{S(styles.bookmarkIcon)}</View>
      </View>
    </View>
  );
}

export default function PostSkeleton({ count = 2 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <PostSkeletonCard key={i} />
      ))}
    </>
  );
}

export function PostGridSkeleton({ count = 9 }: { count?: number }) {
  const { width } = useWindowDimensions();
  const imageSize = width / 3;
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, [shimmer]);

  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.85] });

  return (
    <View style={gridStyles.container}>
      {Array.from({ length: count }).map((_, i) => (
        <Animated.View
          key={i}
          style={[
            gridStyles.item,
            { width: imageSize, height: imageSize, opacity },
          ]}
        />
      ))}
    </View>
  );
}

const BASE = "#E8DCD7";

const gridStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  item: {
    borderWidth: 0.5,
    borderColor: "#FFF9F6",
    backgroundColor: "#EADBD6",
  },
});

const styles = StyleSheet.create({
  card: { width: "100%", backgroundColor: "#FFFFFF", borderRadius: 16, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.08, shadowRadius: 9, elevation: 3, marginBottom: 16 },
  header: { padding: 16 },
  userRow: { flexDirection: "row", alignItems: "center" },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: BASE, marginTop: 5 },
  userInfo: { flex: 1, marginLeft: 10, gap: 6 },
  nameLine: { height: 13, width: "45%", borderRadius: 6, backgroundColor: BASE },
  timeLine: { height: 10, width: "28%", borderRadius: 6, backgroundColor: BASE },
  image: { width: "92%", height: 300, alignSelf: "center", borderRadius: 16, backgroundColor: BASE },
  content: { padding: 16, paddingTop: 12 },
  titleLine: { height: 20, width: "60%", borderRadius: 6, backgroundColor: BASE, marginBottom: 10, marginTop: 5 },
  descLine1: { height: 13, width: "100%", borderRadius: 6, backgroundColor: BASE, marginBottom: 7 },
  descLine2: { height: 13, width: "75%", borderRadius: 6, backgroundColor: BASE, marginBottom: 12 },
  tagRow: { flexDirection: "row", marginBottom: 10 },
  tagPill: { height: 28, width: 80, borderRadius: 20, backgroundColor: BASE },
  divider: { height: 1, backgroundColor: "#E8DCD7", marginTop: 4, marginBottom: 8 },
  footer: { alignItems: "flex-end" },
  bookmarkIcon: { width: 22, height: 22, borderRadius: 4, backgroundColor: BASE },
});
