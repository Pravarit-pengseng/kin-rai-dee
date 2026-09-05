import React, { useState } from 'react';
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

interface AuthInputProps extends TextInputProps {
  iconName: keyof typeof Feather.glyphMap;
  isPassword?: boolean;
  errorMessage?: string | null;
}

export function AuthInput({
  iconName,
  isPassword = false,
  errorMessage,
  value,
  onChangeText,
  placeholder,
  ...props
}: AuthInputProps) {
  const [showPassword, setShowPassword] = useState(!isPassword);
  const [isFocused, setIsFocused] = useState(false);
  const hasError = Boolean(errorMessage);

  return (
    <View style={styles.wrapper}>
      <View
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
            color={hasError ? '#C0392B' : '#57423E'}
          />
        </View>

        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="rgba(87, 66, 62, 0.6)"
          secureTextEntry={isPassword && !showPassword}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          autoCapitalize="none"
          {...props}
        />

        {isPassword && (
          <Pressable
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeButton}
            hitSlop={8}
          >
            <Feather
              name={showPassword ? 'eye' : 'eye-off'}
              size={18}
              color="rgba(87, 66, 62, 0.6)"
            />
          </Pressable>
        )}
      </View>

      {hasError && (
        <View style={styles.errorContainer}>
          <Feather name="alert-circle" size={13} color="#C0392B" style={styles.errorIcon} />
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 12,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderWidth: 1.5,
    borderColor: '#E8DFD8',
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
  },
  containerFocused: {
    borderColor: '#A7392A',
  },
  containerError: {
    borderColor: '#C0392B',
    backgroundColor: '#FFF8F7',
  },
  iconContainer: {
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: '100%',
    color: '#57423E',
    fontSize: 15,
    fontFamily: Platform.select({
      ios: 'Noto Sans Thai',
      android: 'NotoSansThai_400Regular',
      default: 'NotoSansThai_400Regular, Inter_400Regular, sans-serif',
    }),
    paddingVertical: 0,
  },
  eyeButton: {
    padding: 4,
    marginLeft: 8,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    paddingHorizontal: 6,
  },
  errorIcon: {
    marginRight: 4,
  },
  errorText: {
    color: '#C0392B',
    fontSize: 12,
    fontFamily: Platform.select({
      ios: 'Noto Sans Thai',
      android: 'NotoSansThai_400Regular',
      default: 'NotoSansThai_400Regular, Inter_400Regular, sans-serif',
    }),
  },
});
