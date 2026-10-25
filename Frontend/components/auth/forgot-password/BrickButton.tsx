// import React from 'react';
import {
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Platform,
  ViewStyle,
  StyleProp,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

import { Typography } from '@/constants/typography';

interface BrickButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  showArrow?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function BrickButton({
  title,
  onPress,
  disabled = false,
  loading = false,
  showArrow = true,
  style,
}: BrickButtonProps) {
  const isInactive = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isInactive}
      style={({ pressed }) => [
        styles.button,
        isInactive ? styles.buttonDisabled : styles.buttonActive,
        pressed && !isInactive && styles.buttonPressed,
        style,
      ]}
      accessibilityRole="button"
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" size="small" />
      ) : (
        <View style={styles.contentRow}>
          <Text style={styles.buttonText}>{title}</Text>
          {showArrow && (
            <Feather
              name="arrow-right"
              size={18}
              color="#FFFFFF"
              style={styles.arrowIcon}
            />
          )}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 54,
    borderRadius: 9999,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  buttonActive: {
    backgroundColor: '#A63826',
    shadowColor: '#A63826',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: '#BD7268',
    opacity: 0.85,
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.985 }],
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    fontFamily: Typography.bold,
  },
  arrowIcon: {
    marginLeft: 8,
  },
});
