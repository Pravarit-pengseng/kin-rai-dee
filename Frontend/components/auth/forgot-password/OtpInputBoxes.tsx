import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Platform,
} from 'react-native';

interface OtpInputBoxesProps {
  code: string;
  onChangeCode: (code: string) => void;
  disabled?: boolean;
}

export function OtpInputBoxes({
  code,
  onChangeCode,
  disabled = false,
}: OtpInputBoxesProps) {
  const inputRef = useRef<TextInput | null>(null);
  const digits = Array.from({ length: 6 }, (_, index) => code[index] || '');

  // Auto-focus keyboard on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  const handlePress = () => {
    inputRef.current?.focus();
  };

  return (
    <Pressable
      onPress={handlePress}
      style={styles.container}
      accessibilityRole="button"
      accessibilityLabel="กรอกรหัส OTP 6 หลัก"
    >
      {/* Real TextInput covering the area to reliably receive all touches & keystrokes */}
      <TextInput
        ref={inputRef}
        value={code}
        onChangeText={(text) => {
          const sanitized = text.replace(/[^0-9]/g, '').slice(0, 6);
          onChangeCode(sanitized);
        }}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        maxLength={6}
        editable={!disabled}
        style={styles.hiddenInput}
        caretHidden
      />

      {/* 6 Visual Box Slots */}
      {digits.map((digit, index) => {
        const isCurrentSlot =
          !disabled && (code.length === index || (index === 5 && code.length === 6));
        const isFilled = Boolean(digit);

        return (
          <View
            key={index}
            style={[
              styles.box,
              isFilled && styles.boxFilled,
              isCurrentSlot && styles.boxFocused,
            ]}
          >
            <Text style={styles.digitText}>{digit}</Text>
          </View>
        );
      })}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginVertical: 24,
    width: '100%',
    position: 'relative',
  },
  hiddenInput: {
    ...StyleSheet.absoluteFill,
    opacity: 0.01,
    color: 'transparent',
    fontSize: 1,
    zIndex: 2,
  },
  box: {
    width: 46,
    height: 64,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#1F2937',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  boxFilled: {
    borderColor: '#1F2937',
  },
  boxFocused: {
    borderColor: '#A63826',
    borderWidth: 2,
    backgroundColor: '#FFFFFF',
  },
  digitText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    fontFamily: Platform.select({
      ios: 'Noto Sans Thai',
      android: 'NotoSansThai_700Bold',
      default: 'NotoSansThai_700Bold, Inter_700Bold, sans-serif',
    }),
  },
});
