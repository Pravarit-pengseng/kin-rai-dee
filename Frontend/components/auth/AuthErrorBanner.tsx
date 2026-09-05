import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';

interface AuthErrorBannerProps {
  message: string | null;
}

export function AuthErrorBanner({ message }: AuthErrorBannerProps) {
  if (!message) return null;

  return (
    <View style={styles.banner}>
      <Feather name="alert-triangle" size={18} color="#C0392B" style={styles.icon} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDEDEC',
    borderWidth: 1,
    borderColor: '#F5B7B1',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  icon: {
    marginRight: 8,
  },
  text: {
    flex: 1,
    color: '#922B21',
    fontSize: 13,
    lineHeight: 18,
    fontFamily: Platform.select({
      ios: 'Noto Sans Thai',
      android: 'NotoSansThai_400Regular',
      default: 'NotoSansThai_400Regular, Inter_400Regular, sans-serif',
    }),
  },
});
