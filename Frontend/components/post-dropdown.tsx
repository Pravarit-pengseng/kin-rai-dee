import React from "react";
import {
  View,
  Pressable,
  StyleSheet,
} from "react-native";
import {
  Pencil,
  Trash2,
  Flag,
  UserX,
} from "lucide-react-native";
import { ThemedText } from "@/components/themed-text";

export type PostDropdownProps = {
  isOwnPost?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onReport?: () => void;
  onBlock?: () => void;
};

export default function PostDropdown({
  isOwnPost = true,
  onEdit,
  onDelete,
  onReport,
  onBlock,
}: PostDropdownProps) {
  if (isOwnPost) {
    return (
      <View style={styles.dropdownMenu}>
        {/* Edit Post */}
        {onEdit && (
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
        )}

        {/* Delete Post */}
        {onDelete && (
          <Pressable
            style={({ pressed }) => [
              styles.dropdownItem,
              pressed && styles.itemPressed,
            ]}
            onPress={onDelete}
          >
            <Trash2
              size={16}
              color="#A7392A"
              strokeWidth={2}
            />

            <ThemedText style={[styles.dropdownText, { color: '#A7392A' }]}>
              ลบโพสต์
            </ThemedText>
          </Pressable>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.dropdownMenu, { width: 160 }]}>
      {/* Report Post */}
      {onReport && (
        <Pressable
          style={({ pressed }) => [
            styles.dropdownItem,
            pressed && styles.itemPressed,
          ]}
          onPress={onReport}
        >
          <Flag
            size={16}
            color="#A7392A"
            strokeWidth={2}
          />

          <ThemedText style={[styles.dropdownText, { color: '#A7392A' }]}>
            รายงานโพสต์
          </ThemedText>
        </Pressable>
      )}

      {/* Block User */}
      {onBlock && (
        <Pressable
          style={({ pressed }) => [
            styles.dropdownItem,
            pressed && styles.itemPressed,
          ]}
          onPress={onBlock}
        >
          <UserX
            size={16}
            color="#57423E"
            strokeWidth={2}
          />

          <ThemedText style={styles.dropdownText}>
            บล็อกผู้ใช้
          </ThemedText>
        </Pressable>
      )}
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
    borderWidth: 1,
    borderColor: '#F0E2D8',
  },

  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 9,
  },

  itemPressed: {
    backgroundColor: "#FFF8ED",
  },

  dropdownText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4B3500",
  },
});