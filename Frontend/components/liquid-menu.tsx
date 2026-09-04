import React from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
} from "react-native";
import { BlurView } from "expo-blur";
import {
  House,
  Utensils,
  Refrigerator,
  UserRound,
} from "lucide-react-native";

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
  const handlePress = (id: string) => {
    onChange?.(id);
  };

  return (
    <View style={styles.wrapper}>
      {/* Layer 1: Background Blur */}
      <BlurView
        intensity={80}
        tint="light"
        style={[StyleSheet.absoluteFill, styles.blur]}
      />

      {/* Layer 2: Menu Items */}
      <View style={styles.menu}>
        {menuItems.map((item) => {
          const isActive = active === item.id;
          const Icon = item.icon;

          return (
            <Pressable
              key={item.id}
              onPress={() => handlePress(item.id)}
              style={({ pressed }) => [
                styles.menuItem,
                isActive && styles.activeItem,
                pressed && styles.buttonPressed,
              ]}
            >
              <Icon
                size={22}
                color="#57423E"
                strokeWidth={isActive ? 2.5 : 2}
              />

              <Text
                style={[
                  styles.label,
                  isActive && styles.activeLabel,
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 12,
    overflow: "hidden",
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.25)",

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 8,
  },

  blur: {
    borderRadius: 28,
    overflow: "hidden",
  },

  menu: {
    height: 68,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 4,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
  },

  menuItem: {
    height: 58,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
  },

  activeItem: {
    borderRadius: 30,
    backgroundColor: "rgba(255, 233, 229, 0.45)",

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 2,
  },

  label: {
    marginTop: 3,
    fontSize: 11,
    color: "#57423E",
    fontWeight: "500",
    fontFamily: "NotoSansThai_600SemiBold",
  },

  activeLabel: {
    fontFamily: "NotoSansThai_700Bold",
  },

  buttonPressed: {
    opacity: 0.8,
    transform: [{ translateY: 2 }],
  },
});