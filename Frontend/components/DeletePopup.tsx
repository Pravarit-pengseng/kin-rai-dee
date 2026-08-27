import React from "react";
import {
  Modal,
  View,
  Pressable,
  StyleSheet,
} from "react-native";
import { ThemedText } from "@/components/themed-text";

export type DeletePostPopupProps = {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function DeletePostPopup({
  visible,
  onCancel,
  onConfirm,
}: DeletePostPopupProps) {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.popup}>
          {/* Title */}
          <ThemedText style={styles.title}>
            ต้องการลบโพสต์หรือไม่
          </ThemedText>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            {/* Cancel */}
            <Pressable
              style={({ pressed }) => [
                styles.cancelButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={onCancel}
            >
              <ThemedText style={styles.cancelText}>
                ยกเลิก
              </ThemedText>
            </Pressable>

            {/* Delete */}
            <Pressable
              style={({ pressed }) => [
                styles.deleteButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={onConfirm}
            >
              <ThemedText style={styles.deleteText}>
                ลบโพสต์
              </ThemedText>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.35)",
    justifyContent: "center",
    alignItems: "center",
  },

  popup: {
    width: 350,
    height: 180,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 8,
  },

  title: {
    textAlign: "center",
    fontSize: 20,
    fontWeight: "700",
    color: "#241917",
    marginBottom: 10,
    marginTop: 27,
  },

  buttonContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 35,
    marginTop: 15,
  },

  // Cancel button
  cancelButton: {
    width: 120,
    height: 45,
    borderRadius: 30,
    backgroundColor: "#6B728033",
    alignItems: "center",
    justifyContent: "center",

    // 3D Border Bevel
    borderWidth: 1,
    borderColor: "#24191733",
    borderBottomWidth: 3.5,
    borderBottomColor: "#24191733",
  },

  // Delete button
  deleteButton: {
    width: 120,
    height: 45,
    borderRadius: 30,
    backgroundColor: "#FF7A6633",

    alignItems: "center",
    justifyContent: "center",

    // 3D Border Bevel
    borderWidth: 1,
    borderColor: "#72120933",
    borderBottomWidth: 3.5,
    borderBottomColor: "#72120933",
  },

  cancelText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#57423E",
  },

  deleteText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#9B2C24",
  },

  // Press effect
  buttonPressed: {
    opacity: 0.8,
    transform: [{ translateY: 2 }],
  },
});