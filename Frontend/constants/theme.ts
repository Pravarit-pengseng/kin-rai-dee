/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};

export const AppFonts = {
  regular: Platform.select({
    ios: 'Noto Sans Thai',
    android: 'NotoSansThai_400Regular',
    default: 'NotoSansThai_400Regular, Inter_400Regular, sans-serif',
  }) as string,
  medium: Platform.select({
    ios: 'Noto Sans Thai',
    android: 'NotoSansThai_600SemiBold',
    default: 'NotoSansThai_600SemiBold, Inter_500Medium, sans-serif',
  }) as string,
  semiBold: Platform.select({
    ios: 'Noto Sans Thai',
    android: 'NotoSansThai_600SemiBold',
    default: 'NotoSansThai_600SemiBold, Inter_600SemiBold, sans-serif',
  }) as string,
  bold: Platform.select({
    ios: 'Noto Sans Thai',
    android: 'NotoSansThai_700Bold',
    default: 'NotoSansThai_700Bold, Inter_700Bold, sans-serif',
  }) as string,
};

