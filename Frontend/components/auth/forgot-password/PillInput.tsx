import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
  Pressable,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

interface PillInputProps extends TextInputProps {
  iconName: keyof typeof Feather.glyphMap;
  isPassword?: boolean;
  errorMessage?: string | null;
}

export function PillInput({
  iconName,
  isPassword = false,
  errorMessage,
  value,
  onChangeText,
  placeholder,
  ...props
}: PillInputProps) {
  const [showPassword, setShowPassword] = useState(!isPassword);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput | null>(null);
  const hasError = Boolean(errorMessage);

  const handleContainerPress = () => {
    inputRef.current?.focus();
  };

  return (
    <View style={styles.wrapper}>
      <Pressable
        onPress={handleContainerPress}
        style={[
          styles.container,
          isFocused && styles.containerFocused,
          hasError && styles.containerError,
        ]}
      >
        <View style={styles.iconContainer}>
          <Feather
            name={iconName}
            size={20}
            color={hasError ? '#DC2626' : '#1F2937'}
          />
        </View>

        <TextInput
          ref={inputRef}
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          secureTextEntry={isPassword && !showPassword}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          autoCapitalize="none"
          {...props}
        />

        {isPassword && (
          <Pressable
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeButton}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
          >
            <Feather
              name={showPassword ? 'eye' : 'eye-off'}
              size={18}
              color="#6B7280"
            />
          </Pressable>
        )}
      </Pressable>

      {hasError && (
        <View style={styles.errorContainer}>
          <Feather name="alert-circle" size={13} color="#DC2626" style={styles.errorIcon} />
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
    width: '100%',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 54,
    borderWidth: 1.2,
    borderColor: '#1F2937',
    borderRadius: 9999,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
  },
  containerFocused: {
    borderColor: '#A63826',
    shadowColor: '#A63826',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  containerError: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
  iconContainer: {
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: '100%',
    color: '#111827',
    fontSize: 15,
    fontFamily: Platform.select({
      ios: 'Noto Sans Thai',
      android: 'NotoSansThai_400Regular',
      default: 'NotoSansThai_400Regular, Inter_400Regular, sans-serif',
    }),
    paddingVertical: 0,
  },
  eyeButton: {
    padding: 6,
    marginLeft: 6,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    paddingHorizontal: 12,
  },
  errorIcon: {
    marginRight: 4,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 12,
    fontFamily: Platform.select({
      ios: 'Noto Sans Thai',
      android: 'NotoSansThai_400Regular',
      default: 'NotoSansThai_400Regular, Inter_400Regular, sans-serif',
    }),
  },
});
