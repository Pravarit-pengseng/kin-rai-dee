import React from "react";
import {
  Modal,
  View,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from "react-native";
import { ThemedText } from "@/components/themed-text";

export type DeleteAccountPopupProps = {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  isDeleting?: boolean;
};

export default function DeleteAccountPopup({
  visible,
  onCancel,
  onConfirm,
  isDeleting = false,
}: DeleteAccountPopupProps) {
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
            ยืนยันการลบบัญชีผู้ใช้
          </ThemedText>

          {/* Description */}
          <ThemedText style={styles.description}>
            การลบบัญชีจะมีผลถาวร! ข้อมูลโพสต์ รูปภาพอาหาร{"\n"}
            ความคิดเห็นรายการโปรดและข้อมูลส่วนตัวทั้งหมดของ{"\n"}
            ท่านจะถูกลบอย่างถาวรและไม่สามารถกู้คืนได้อีก{"\n\n"}
            ท่านแน่ใจหรือไม่ว่าต้องการดำเนินการต่อ?
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
              disabled={isDeleting}
            >
              <ThemedText style={styles.cancelText}>
                ยกเลิก
              </ThemedText>
            </Pressable>

            {/* Confirm Delete */}
            <Pressable
              style={({ pressed }) => [
                styles.deleteButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={onConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <ActivityIndicator size="small" color="#8B2519" />
              ) : (
                <ThemedText style={styles.deleteText}>
                  ลบบัญชีถาวร
                </ThemedText>
              )}
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
    borderRadius: 24,
    paddingHorizontal: 22,
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
    fontFamily: Platform.select({
      ios: "Inter",
      android: "Inter_700Bold",
      default: "Inter, NotoSansThai_700Bold, sans-serif",
    }),
    fontWeight: "700",
    color: "#241917",
    marginBottom: 12,
  },

  description: {
    textAlign: "center",
    fontSize: 12.5,
    fontFamily: Platform.select({
      ios: "Inter",
      android: "Inter_400Regular",
      default: "Inter, NotoSansThai_400Regular, sans-serif",
    }),
    color: "#4A3E39",
    lineHeight: 18,
    marginBottom: 20,
  },

  buttonContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    width: "100%",
  },

  cancelButton: {
    flex: 1,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderBottomWidth: 3,
    borderBottomColor: "#CBD5E1",
  },

  deleteButton: {
    flex: 1,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#FCE3DB",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#F8B4A6",
    borderBottomWidth: 3,
    borderBottomColor: "#EAA092",
  },

  cancelText: {
    fontSize: 15,
    fontFamily: Platform.select({
      ios: "Inter",
      android: "Inter_700Bold",
      default: "Inter, NotoSansThai_700Bold, sans-serif",
    }),
    fontWeight: "700",
    color: "#241917",
    textAlign: "center",
  },

  deleteText: {
    fontSize: 14.5,
    fontFamily: Platform.select({
      ios: "Inter",
      android: "Inter_700Bold",
      default: "Inter, NotoSansThai_700Bold, sans-serif",
    }),
    fontWeight: "700",
    color: "#8B2519",
    textAlign: "center",
  },

  buttonPressed: {
    opacity: 0.8,
    transform: [{ translateY: 2 }],
  },
});
