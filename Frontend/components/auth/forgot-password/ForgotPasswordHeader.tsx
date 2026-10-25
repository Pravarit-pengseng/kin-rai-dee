// import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';

interface ForgotPasswordHeaderProps {
  onBack: () => void;
  title?: string;
}

export function ForgotPasswordHeader({
  onBack,
  title = 'ลืมรหัสผ่าน',
}: ForgotPasswordHeaderProps) {
  return (
    <View style={styles.header}>
      <Pressable
        onPress={onBack}
        style={({ pressed }) => [styles.backButton, pressed && styles.buttonPressed]}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        accessibilityRole="button"
        accessibilityLabel="ย้อนกลับ"
      >
        <Feather name="arrow-left" size={24} color="#111827" />
      </Pressable>

      <Text style={styles.title}>{title}</Text>

      {/* Spacer to balance the back button on left */}
      <View style={styles.spacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonPressed: {
    opacity: 0.6,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    fontFamily: Platform.select({
      ios: 'Inter',
      android: 'Inter_700Bold',
      default: 'Inter, sans-serif',
    }),
  },
  spacer: {
    width: 40,
  },
});
