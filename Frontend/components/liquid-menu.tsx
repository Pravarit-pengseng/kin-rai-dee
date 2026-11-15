import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  Animated,
  LayoutChangeEvent,
  Keyboard,
} from "react-native";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import {
  House,
  Utensils,
  Refrigerator,
  UserRound,
} from "lucide-react-native";
import { Typography } from "@/constants/typography";

type MenuItem = {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
};

type LiquidMenuProps = {
  active?: string;
  onChange?: (id: string) => void;
};

const menuItems: MenuItem[] = [
  {
    id: "home",
    label: "หน้าหลัก",
    icon: House,
  },
  {
    id: "random",
    label: "สุ่มอาหาร",
    icon: Utensils,
  },
  {
    id: "ingredients",
    label: "สุ่มวัตถุดิบ",
    icon: Refrigerator,
  },
  {
    id: "profile",
    label: "โปรไฟล์",
    icon: UserRound,
  },
];

export default function LiquidMenu({
  active = "home",
  onChange,
}: LiquidMenuProps) {
  const insets = useSafeAreaInsets();
  const bottomOffset = Math.max(insets.bottom, 12);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const showSub = Keyboard.addListener(showEvent, () => setIsKeyboardOpen(true));
    const hideSub = Keyboard.addListener(hideEvent, () => setIsKeyboardOpen(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const activeIndex = Math.max(
    0,
    menuItems.findIndex((item) => item.id === active)
  );

  const [menuWidth, setMenuWidth] = useState(0);

  // Animated values running on Native Thread (60 FPS)
  const translateX = useRef(new Animated.Value(0)).current;
  const pillScale = useRef(new Animated.Value(1)).current;
  const isInitial = useRef(true);

  const horizontalPadding = 6;
  const availableWidth = menuWidth > 0 ? menuWidth - horizontalPadding * 2 : 0;
  const itemWidth = availableWidth > 0 ? availableWidth / menuItems.length : 0;

  useEffect(() => {
    if (itemWidth <= 0) return;

    const targetX = horizontalPadding + activeIndex * itemWidth;

    if (isInitial.current) {
      // First mount: place instantly without initial fly-in
      translateX.setValue(targetX);
      isInitial.current = false;
      return;
    }

    // 60 FPS Native-driver spring physics for liquid movement
    Animated.parallel([
      Animated.spring(translateX, {
        toValue: targetX,
        damping: 18,
        mass: 0.85,
        stiffness: 170,
        overshootClamping: false,
        restSpeedThreshold: 0.001,
        restDisplacementThreshold: 0.001,
        useNativeDriver: Platform.OS !== "web",
      }),
      // Liquid squash & stretch effect (Kyant Liquid Glass feel)
      Animated.sequence([
        Animated.timing(pillScale, {
          toValue: 0.94,
          duration: 90,
          useNativeDriver: Platform.OS !== "web",
        }),
        Animated.spring(pillScale, {
          toValue: 1,
          damping: 14,
          stiffness: 200,
          useNativeDriver: Platform.OS !== "web",
        }),
      ]),
    ]).start();
  }, [activeIndex, itemWidth]);

  const handlePress = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onChange?.(id);
  };

  const onMenuLayout = (e: LayoutChangeEvent) => {
    const width = e.nativeEvent.layout.width;
    if (width > 0 && width !== menuWidth) {
      setMenuWidth(width);
    }
  };

  if (isKeyboardOpen) {
    return null;
  }

  return (
    <View
      style={[
        styles.wrapper,
        {
          bottom: bottomOffset,
        },
      ]}
      pointerEvents="box-none"
    >
      <View style={styles.glassContainer}>
        {/* Layer 1: Real-time Backdrop Blur (Kyant0 Liquid Glass) */}
        {Platform.OS === "ios" && (
          <BlurView
            intensity={85}
            tint="light"
            style={StyleSheet.absoluteFill}
          />
        )}

        {/* Layer 2: Gloss & Diffused Frosted Sheen */}
        <View style={styles.specularOverlay} pointerEvents="none" />

        {/* Layer 3: Interactive Menu Items with 60 FPS Sliding Liquid Pill */}
        <View style={styles.menu} onLayout={onMenuLayout}>
          {itemWidth > 0 && (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.slidingPill,
                {
                  width: itemWidth,
                  transform: [
                    { translateX },
                    { scale: pillScale },
                  ],
                },
              ]}
            />
          )}

          {menuItems.map((item) => {
            const isActive = active === item.id;
            const Icon = item.icon;

            return (
              <Pressable
                key={item.id}
                onPress={() => handlePress(item.id)}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
                accessibilityLabel={item.label}
                style={({ pressed }) => [
                  styles.menuItem,
                  pressed && styles.buttonPressed,
                ]}
              >
                <Icon
                  size={21}
                  color={isActive ? "#96281B" : "#6E5B57"}
                  strokeWidth={isActive ? 2.4 : 1.9}
                />

                <Text
                  style={[
                    styles.label,
                    isActive ? styles.activeLabel : styles.inactiveLabel,
                  ]}
                  numberOfLines={1}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 16,
    right: 16,
    alignItems: "center",
    zIndex: 999,
  },

  // AndroidLiquidGlass (Kyant0): Soft, fluid floating pill capsule
  glassContainer: {
    width: "100%",
    maxWidth: 500,
    borderRadius: 36,
    overflow: "hidden",
    borderWidth: 0.6,
    borderColor: "rgba(255, 255, 255, 0.38)",
    borderTopColor: "rgba(255, 255, 255, 0.52)",
    borderBottomColor: "rgba(255, 255, 255, 0.15)",

    // Soft, natural diffuse ambient shadow
    shadowColor: "#4A2E2B",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 2,
  },

  // Silky frosted glass tint
  specularOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Platform.OS === "android" ? "rgba(255, 252, 250, 0.65)" : "rgba(255, 255, 255, 0.42)",
  },

  menu: {
    height: 66,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 6,
    paddingVertical: 5,
    position: "relative",
  },

  // 60 FPS Fluid Sliding Pill with soft translucent liquid glass
  slidingPill: {
    position: "absolute",
    top: 5,
    bottom: 5,
    left: 0,
    borderRadius: 28,
    backgroundColor: "rgba(255, 243, 238, 0.68)",
    borderWidth: 0.6,
    borderColor: "rgba(255, 255, 255, 0.42)",
    borderBottomColor: "rgba(220, 166, 78, 0.12)",

    // Subtle warm ambient glow
    shadowColor: "#8B2B20",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },

  menuItem: {
    height: 54,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 26,
    paddingHorizontal: 2,
    zIndex: 1,
  },

  label: {
    marginTop: 3,
    fontSize: 11,
    fontFamily: Typography.semiBold,
  },

  activeLabel: {
    color: "#96281B",
    fontFamily: Typography.bold,
    fontWeight: "700",
  },

  inactiveLabel: {
    color: "#7A6763",
    fontWeight: "500",
  },

  buttonPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.95 }],
  },
});