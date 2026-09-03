import React from 'react';
import { Text, StyleSheet, Pressable, View } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

interface RandomButtonProps {
  onPress: () => void;
  title?: string;
  backgroundColor?: string;
  textColor?: string;
  iconColor?: string;
  iconName?: string; // Add iconName prop
}

export function RandomButton({
  onPress,
  title = 'สุ่มอาหาร',
  backgroundColor = '#A5352A',
  textColor = '#FFFFFF',
  iconColor = '#FFFFFF',
  iconName = 'dice', // Default to dice
}: RandomButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor },
        pressed && styles.buttonPressed,
      ]}
    >
      <View style={styles.content}>
        <FontAwesome5 name={iconName} size={20} color={iconColor} style={styles.icon} />
        <Text style={[styles.text, { color: textColor }]}>{title}</Text>
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
