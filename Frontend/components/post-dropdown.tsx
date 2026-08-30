import React from "react";
import {
  View,
  Pressable,
  StyleSheet,
} from "react-native";
import {
  Pencil,
  Trash2,
} from "lucide-react-native";
import { ThemedText } from "@/components/themed-text";

export type PostDropdownProps = {
  onEdit: () => void;
  onDelete: () => void;
};

export default function PostDropdown({
  onEdit,
  onDelete,
}: PostDropdownProps) {
  return (
    <View style={styles.dropdownMenu}>
      {/* Edit Post */}
      <Pressable
        style={({ pressed }) => [
          styles.dropdownItem,
          pressed && styles.itemPressed,
        ]}
        onPress={onEdit}
      >
        <Pencil
          size={16}
          color="#4B3500"
          strokeWidth={2}
        />

        <ThemedText style={styles.dropdownText}>
          แก้ไขโพสต์
        </ThemedText>
      </Pressable>

      {/* Delete Post */}
      <Pressable
        style={({ pressed }) => [
          styles.dropdownItem,
          pressed && styles.itemPressed,
        ]}
        onPress={onDelete}
      >
        <Trash2
          size={16}
          color="#4B3500"
          strokeWidth={2}
        />

        <ThemedText style={styles.dropdownText}>
          ลบโพสต์
        </ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  dropdownMenu: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 150,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 4,
    zIndex: 100,

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 10,
  },

  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 9,
  },

  itemPressed: {
    opacity: 0.6,
  },

  dropdownText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4B3500",
  },
});