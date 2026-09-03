import React from 'react';
import { Text, StyleSheet, Pressable, View } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

export interface RandomButtonProps {
  onPress: () => void;
  title?: string;
  variant?: 'primary' | 'rerandom';
  backgroundColor?: string;
  textColor?: string;
  iconColor?: string;
  iconName?: string;
  borderColor?: string;
  borderBottomColor?: string;
  borderWidth?: number;
  borderBottomWidth?: number;
}

export function RandomButton({
  onPress,
  variant = 'primary',
  title,
  backgroundColor,
  textColor,
  iconColor,
  iconName,
  borderColor,
  borderBottomColor,
  borderWidth,
  borderBottomWidth,
}: RandomButtonProps) {
  const isRerandom = variant === 'rerandom';

  const finalTitle = title ?? (isRerandom ? 'สุ่มใหม่อีกครั้ง' : 'สุ่มอาหาร');
  const finalBgColor = backgroundColor ?? (isRerandom ? '#FADCD9' : '#A5352A');
  const finalTextColor = textColor ?? (isRerandom ? '#A5352A' : '#FFFFFF');
  const finalIconColor = iconColor ?? (isRerandom ? '#A5352A' : '#FFFFFF');
  const finalIconName = iconName ?? (isRerandom ? 'redo' : 'dice');

  const finalBorderWidth = borderWidth ?? (isRerandom ? 1 : undefined);
  const finalBorderColor = borderColor ?? (isRerandom ? '#72120933' : undefined);
  const finalBorderBottomWidth = borderBottomWidth ?? (isRerandom ? 3.5 : undefined);
  const finalBorderBottomColor = borderBottomColor ?? (isRerandom ? '#72120933' : undefined);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: finalBgColor },
        finalBorderWidth !== undefined && { borderWidth: finalBorderWidth },
        finalBorderColor !== undefined && { borderColor: finalBorderColor },
        finalBorderBottomWidth !== undefined && { borderBottomWidth: finalBorderBottomWidth },
        finalBorderBottomColor !== undefined && { borderBottomColor: finalBorderBottomColor },
        pressed && styles.buttonPressed,
      ]}
    >
      <View style={styles.content}>
        <FontAwesome5 name={finalIconName} size={20} color={finalIconColor} style={styles.icon} />
        <Text style={[styles.text, { color: finalTextColor }]}>{finalTitle}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 30, // Pill shape
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ translateY: 2 }],
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: 10,
  },
  text: {
    fontSize: 18,
    fontFamily: 'NotoSansThai_700Bold',
  },
});
