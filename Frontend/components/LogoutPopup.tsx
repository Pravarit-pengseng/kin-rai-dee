import React from "react";
import {
  Modal,
  View,
  Pressable,
  StyleSheet,
} from "react-native";
import { ThemedText } from "@/components/themed-text";

export type LogoutPopupProps = {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function LogoutPopup({
  visible,
  onCancel,
  onConfirm,
}: LogoutPopupProps) {
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
            ออกจากระบบบัญชีของคุณใช่ไหม
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

            {/* Logout */}
            <Pressable
              style={({ pressed }) => [
                styles.logoutButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={onConfirm}
            >
              <ThemedText style={styles.logoutText}>
                ออกจากระบบ
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
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
  },

  popup: {
    width: 320,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 22,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },

  title: {
    textAlign: "center",
    fontSize: 18,
    fontFamily: "NotoSansThai_700Bold",
    fontWeight: "700",
    color: "#241917",
    marginBottom: 20,
    lineHeight: 26,
  },

  buttonContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 14,
    width: "100%",
  },

  // Cancel button
  cancelButton: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#6B728033",
    alignItems: "center",
    justifyContent: "center",

    // 3D Border Bevel
    borderWidth: 1,
    borderColor: "#24191733",
    borderBottomWidth: 3,
    borderBottomColor: "#24191733",
  },

  // Logout button
  logoutButton: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FF7A6633",
    alignItems: "center",
    justifyContent: "center",

    // 3D Border Bevel
    borderWidth: 1,
    borderColor: "#72120933",
    borderBottomWidth: 3,
    borderBottomColor: "#72120933",
  },

  cancelText: {
    fontSize: 16,
    fontFamily: "NotoSansThai_700Bold",
    fontWeight: "700",
    color: "#57423E",
    textAlign: "center",
  },

  logoutText: {
    fontSize: 15,
    fontFamily: "NotoSansThai_700Bold",
    fontWeight: "700",
    color: "#9B2C24",
    textAlign: "center",
  },

  // Press effect
  buttonPressed: {
    opacity: 0.8,
    transform: [{ translateY: 2 }],
  },
});
