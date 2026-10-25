import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Modal, Platform } from 'react-native';

interface SuccessModalProps {
  visible: boolean;
  onConfirm: () => void;
}

export function SuccessModal({ visible, onConfirm }: SuccessModalProps) {
  // Automatically navigate to Login page after 1 second (1000ms)
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        onConfirm();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [visible, onConfirm]);

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onConfirm}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>เปลี่ยนรหัสผ่านใหม่เสร็จสิ้น</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 330,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 36,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 0,
    fontFamily: Platform.select({
      ios: 'Inter',
      android: 'Inter_700Bold',
      default: 'Inter, sans-serif',
    }),
  },
});
