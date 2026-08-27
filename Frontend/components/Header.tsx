import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StatusBar, StatusBarStyle } from 'expo-status-bar';

export type HeaderLeftIcon = 'back' | 'close' | 'logout' | 'none';
export type HeaderRightIcon = 'search' | 'none';

interface HeaderProps {
  backgroundColor?: string;
  textColor?: string;
  iconColor?: string;
  title?: string;
  leftIcon?: HeaderLeftIcon;
  onLeftPress?: () => void;
  rightIcon?: HeaderRightIcon;
  onRightPress?: () => void;
  onSearchPress?: () => void; // Alias for onRightPress
  statusBarStyle?: StatusBarStyle;
  showBorder?: boolean;
}

export function Header({
  backgroundColor = 'transparent',
  textColor = '#A7392A', // Default red color from mockup
  iconColor = '#57423E', // Default dark brown icon color
  title = 'KIN RAI DEE',
  leftIcon = 'none',
  onLeftPress,
  rightIcon = 'search',
  onRightPress,
  onSearchPress,
  statusBarStyle = 'dark',
  showBorder = true,
}: HeaderProps) {
  const isThai = /[\u0E00-\u0E7F]/.test(title);
  const fontFamily = isThai ? 'NotoSansThai_700Bold' : 'PlusJakartaSans_700Bold';

  const renderLeftIcon = () => {
    if (leftIcon === 'none') return null;

    let iconName: keyof typeof Feather.glyphMap = 'arrow-left';
    if (leftIcon === 'close') iconName = 'x';
    if (leftIcon === 'logout') iconName = 'log-out';

    return (
      <Pressable onPress={onLeftPress} style={styles.iconButton} hitSlop={8}>
        <Feather name={iconName} size={24} color={iconColor} />
      </Pressable>
    );
  };

  const renderRightIcon = () => {
    if (rightIcon === 'none') return null;

    let iconName: keyof typeof Feather.glyphMap = 'search';
    if (rightIcon === 'search') iconName = 'search';

    const handleRightPress = onRightPress || onSearchPress;

    return (
      <Pressable onPress={handleRightPress} style={styles.iconButton} hitSlop={8}>
        <Feather name={iconName} size={24} color={iconColor} />
      </Pressable>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor }, showBorder && styles.borderBottom]}>
      <StatusBar style={statusBarStyle} />
      {/* Left Side Icon (back / close / logout) */}
      <View style={styles.leftSide}>{renderLeftIcon()}</View>

      {/* Center Title */}
      <Text style={[styles.title, { color: textColor, fontFamily }]} numberOfLines={1}>
        {title}
      </Text>

      {/* Right Side Icon (search / none) */}
      <View style={styles.rightSide}>{renderRightIcon()}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: '#EFE7E2', // Subtle light brown/beige divider line from mockup
  },
  leftSide: {
    flex: 1,
    alignItems: 'flex-start',
  },
  rightSide: {
    flex: 1,
    alignItems: 'flex-end',
  },
  title: {
    flex: 3,
    textAlign: 'center',
    fontSize: 20,
    letterSpacing: 0.5,
  },
  iconButton: {
    padding: 4,
  },
});
