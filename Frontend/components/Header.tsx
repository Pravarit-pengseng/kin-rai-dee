import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  type StyleProp,
  type TextStyle,
} from 'react-native';;
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar, StatusBarStyle } from 'expo-status-bar';
import { useAuth } from '@/context/AuthContext';
import { Typography } from '@/constants/typography';

export type HeaderLeftIcon = 'back' | 'close' | 'logout' | 'none';
export type HeaderRightIcon = 'search' | 'settings' | 'none';

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
  titleStyle?: StyleProp<TextStyle>;
}

export function Header({
  backgroundColor = 'transparent',
  textColor = '#A7392A',
  iconColor = '#57423E',
  title = 'KIN RAI DEE',
  leftIcon = 'none',
  onLeftPress,
  rightIcon = 'search',
  onRightPress,
  onSearchPress,
  statusBarStyle = 'dark',
  showBorder = true,
  titleStyle,
}: HeaderProps) {
  const { isLoggedIn } = useAuth();
  const fontFamily = Typography.bold;

  const renderLeftIcon = () => {
    if (leftIcon === 'none') return null;
    if (leftIcon === 'logout' && !isLoggedIn) return null;

    let iconName: keyof typeof Feather.glyphMap = 'arrow-left';
    if (leftIcon === 'close') iconName = 'x';
    if (leftIcon === 'logout') iconName = 'log-out';

    return (
      <Pressable
        onPress={onLeftPress}
        style={({ pressed }) => [styles.iconButton, pressed && styles.buttonPressed]}
        hitSlop={8}
      >
        <Feather name={iconName} size={24} color={iconColor} />
      </Pressable>
    );
  };

  const renderRightIcon = () => {
    if (rightIcon === 'none') return null;

    const handleRightPress = onRightPress || onSearchPress;

    if (rightIcon === 'search') {
      return (
        <Pressable
          onPress={handleRightPress}
          style={({ pressed }) => [styles.iconButton, pressed && styles.buttonPressed]}
          hitSlop={8}
        >
          <MaterialCommunityIcons name="magnify" size={24} color={iconColor} />
        </Pressable>
      );
    }

    let iconName: keyof typeof Feather.glyphMap = 'settings';

    return (
      <Pressable
        onPress={handleRightPress}
        style={({ pressed }) => [styles.iconButton, pressed && styles.buttonPressed]}
        hitSlop={8}
      >
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
      <Text
        style={[
          styles.title,
          {
            color: textColor,
            fontFamily: Typography.bold,
          },
          titleStyle,
        ]}
        numberOfLines={1}
      >
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
  buttonPressed: {
    opacity: 0.8,
    transform: [{ translateY: 2 }],
  },
});
