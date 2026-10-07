import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { AuthInput } from '@/components/auth/AuthInput';
import { AuthErrorBanner } from '@/components/auth/AuthErrorBanner';
import { useAuth } from '@/context/AuthContext';
import {
  validateDisplayName,
  validateEmail,
  validatePassword,
  validateConfirmPassword,
  formatEmail,
} from '@/utils/authValidation';

export default function RegisterScreen() {
  const router = useRouter();
  const { returnTo, from } = useLocalSearchParams<{ returnTo?: string; from?: string }>();
  const { login } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [errors, setErrors] = useState<{
    displayName?: string | null;
    email?: string | null;
    password?: string | null;
    confirmPassword?: string | null;
  }>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  // Password condition checks for dynamic hints
  const isLenValid = password.length >= 8 && password.length <= 20;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[#?!@\-_]/.test(password);
  const hasOnlyAllowed = password.length > 0 && /^[a-zA-Z0-9#?!@\-_]+$/.test(password);

  const handleDisplayNameChange = (text: string) => {
    setDisplayName(text);
    if (errors.displayName) {
      setErrors((prev) => ({ ...prev, displayName: null }));
    }
  };

  const handleDisplayNameBlur = () => {
    if (displayName.trim()) {
      const err = validateDisplayName(displayName);
      setErrors((prev) => ({ ...prev, displayName: err }));
    }
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (errors.email) {
      setErrors((prev) => ({ ...prev, email: null }));
    }
  };

  const handleEmailBlur = () => {
    if (email.trim()) {
      const err = validateEmail(formatEmail(email));
      setErrors((prev) => ({ ...prev, email: err }));
    }
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    if (errors.password) {
      setErrors((prev) => ({ ...prev, password: null }));
    }
    // Also revalidate confirm password if it has value
    if (confirmPassword && errors.confirmPassword) {
      setErrors((prev) => ({ ...prev, confirmPassword: null }));
    }
  };

  const handlePasswordFocus = () => {
    setIsPasswordFocused(true);
    // Clear red error when user is actively focusing to enter/adjust password
    if (errors.password) {
      setErrors((prev) => ({ ...prev, password: null }));
    }
  };

  const handlePasswordBlur = () => {
    setIsPasswordFocused(false);
    // When leaving the password field, if password was entered but invalid, show red warning
    if (password) {
      const err = validatePassword(password);
      setErrors((prev) => ({ ...prev, password: err }));
    }
  };

  const handleConfirmPasswordChange = (text: string) => {
    setConfirmPassword(text);
    if (errors.confirmPassword) {
      setErrors((prev) => ({ ...prev, confirmPassword: null }));
    }
  };

  const handleConfirmPasswordBlur = () => {
    if (confirmPassword) {
      const err = validateConfirmPassword(password, confirmPassword);
      setErrors((prev) => ({ ...prev, confirmPassword: err }));
    }
  };

  const handleRegister = async () => {
    setGeneralError(null);

    const formattedEmail = formatEmail(email);
    const displayNameError = validateDisplayName(displayName);
    const emailError = validateEmail(formattedEmail);
    const passwordError = validatePassword(password);
    const confirmPasswordError = validateConfirmPassword(password, confirmPassword);

    if (displayNameError || emailError || passwordError || confirmPasswordError) {
      setErrors({
        displayName: displayNameError,
        email: emailError,
        password: passwordError,
        confirmPassword: confirmPasswordError,
      });
      return;
    }

    // Clear any previous errors
    setErrors({});
    setIsLoading(true);

    try {
      await login({ displayName, email: formattedEmail });
      if (returnTo) {
        router.replace(returnTo as any);
      } else {
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      // Error handling mapped from backend responses
      if (err?.code === 'DUPLICATE_DISPLAY_NAME') {
        setErrors((prev) => ({ ...prev, displayName: 'ชื่อที่แสดงนี้มีผู้ใช้แล้ว กรุณาใช้ชื่ออื่น' }));
      } else if (err?.code === 'DUPLICATE_EMAIL') {
        setErrors((prev) => ({ ...prev, email: 'อีเมลนี้ถูกใช้สมัครบัญชีแล้ว' }));
      } else if (err?.code === 'USERNAME_GENERATION_FAILED') {
        setGeneralError('ไม่สามารถสมัครบัญชีได้ กรุณาลองใหม่อีกครั้ง');
      } else if (err?.code === 'NETWORK_ERROR' || !navigator.onLine) {
        setGeneralError('ไม่สามารถเชื่อมต่อได้ กรุณาตรวจสอบอินเทอร์เน็ต');
      } else {
        setGeneralError('ระบบขัดข้องชั่วคราว กรุณาลองใหม่อีกครั้ง');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    router.replace({ pathname: '/(auth)/login', params: { returnTo, from } });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Target Screen Frame: 390 x 844 */}
          <View style={styles.screenContainer}>
            {/* Top Navigation Bar */}
            <View style={styles.header}>
              <Pressable
                onPress={handleBack}
                style={({ pressed }) => [styles.iconButton, pressed && styles.buttonPressed]}
                hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
              >
                <Feather name="arrow-left" size={24} color="#57423E" />
              </Pressable>

              <Text style={styles.headerTitle}>KIN RAI DEE</Text>

              <View style={styles.headerRightSpacer} />
            </View>

            {/* Mascot / Logo */}
            <View style={styles.logoSection}>
              <Image
                source={require('@/assets/images/kin-rai-dee-logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>

            {/* Heading & Subtitle */}
            <View style={styles.headingSection}>
              <Text style={styles.mainTitle}>มาร่วมเป็นครอบครัว KIN RAI DEE</Text>
              <Text style={styles.subTitle}>
                สร้างบัญชีเพื่อเริ่มค้นหาเมนูที่น่าสนใจ
              </Text>
            </View>

            {/* White Form Card (borderRadius: 24) */}
            <View style={styles.formCard}>
              <AuthErrorBanner message={generalError} />

              <AuthInput
                iconName="user"
                placeholder="ชื่อที่แสดง"
                value={displayName}
                onChangeText={handleDisplayNameChange}
                onBlur={handleDisplayNameBlur}
                errorMessage={errors.displayName}
                maxLength={35}
              />

              <AuthInput
                iconName="mail"
                placeholder="อีเมล"
                value={email}
                onChangeText={handleEmailChange}
                onBlur={handleEmailBlur}
                keyboardType="email-address"
                errorMessage={errors.email}
                autoCapitalize="none"
              />

              <AuthInput
                iconName="lock"
                placeholder="รหัสผ่าน"
                value={password}
                onChangeText={handlePasswordChange}
                onFocus={handlePasswordFocus}
                onBlur={handlePasswordBlur}
                isPassword
                errorMessage={errors.password}
                maxLength={25}
              />

              {/* Password Requirement Guidelines (Visible only when password field is focused) */}
              {isPasswordFocused && (
                <View style={styles.passwordRulesContainer}>
                  <Text style={styles.passwordRulesTitle}>เงื่อนไขการตั้งรหัสผ่าน:</Text>

                  <View style={styles.ruleItem}>
                    <Feather
                      name={isLenValid ? "check-circle" : "circle"}
                      size={14}
                      color={isLenValid ? "#2E7D32" : "#8C7A75"}
                    />
                    <Text style={[styles.ruleText, isLenValid && styles.ruleTextValid]}>
                      ความยาว 8–20 ตัวอักษร
                    </Text>
                  </View>

                  <View style={styles.ruleItem}>
                    <Feather
                      name={hasLetter ? "check-circle" : "circle"}
                      size={14}
                      color={hasLetter ? "#2E7D32" : "#8C7A75"}
                    />
                    <Text style={[styles.ruleText, hasLetter && styles.ruleTextValid]}>
                      มีอักษรภาษาอังกฤษอย่างน้อย 1 ตัว (a-z, A-Z)
                    </Text>
                  </View>

                  <View style={styles.ruleItem}>
                    <Feather
                      name={hasNumber ? "check-circle" : "circle"}
                      size={14}
                      color={hasNumber ? "#2E7D32" : "#8C7A75"}
                    />
                    <Text style={[styles.ruleText, hasNumber && styles.ruleTextValid]}>
                      มีตัวเลขอย่างน้อย 1 ตัว (0-9)
                    </Text>
                  </View>

                  <View style={styles.ruleItem}>
                    <Feather
                      name={hasSpecial ? "check-circle" : "circle"}
                      size={14}
                      color={hasSpecial ? "#2E7D32" : "#8C7A75"}
                    />
                    <Text style={[styles.ruleText, hasSpecial && styles.ruleTextValid]}>
                      มีอักขระพิเศษอย่างน้อย 1 ตัว (# ? ! @ - _)
                    </Text>
                  </View>

                  <View style={styles.ruleItem}>
                    <Feather
                      name={hasOnlyAllowed ? "check-circle" : "circle"}
                      size={14}
                      color={hasOnlyAllowed ? "#2E7D32" : "#8C7A75"}
                    />
                    <Text style={[styles.ruleText, hasOnlyAllowed && styles.ruleTextValid]}>
                      ไม่มีช่องว่าง และใช้อักขระที่กำหนดเท่านั้น
                    </Text>
                  </View>
                </View>
              )}

              <AuthInput
                iconName="check-circle"
                placeholder="ยืนยันรหัสผ่าน"
                value={confirmPassword}
                onChangeText={handleConfirmPasswordChange}
                onBlur={handleConfirmPasswordBlur}
                isPassword
                errorMessage={errors.confirmPassword}
                maxLength={25}
              />

              <Pressable
                onPress={handleRegister}
                disabled={isLoading}
                style={({ pressed }) => [
                  styles.submitButton,
                  pressed && styles.buttonPressed,
                  isLoading && styles.buttonDisabled,
                ]}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.submitButtonText}>สมัครบัญชี →</Text>
                )}
              </Pressable>
            </View>

            {/* Bottom Footer Navigation */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>มีบัญชีอยู่แล้ว? </Text>
              <Pressable
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                onPress={() => router.replace({ pathname: '/(auth)/login', params: { returnTo, from } })}
                style={({ pressed }) => [pressed && styles.buttonPressed]}
              >
                <Text style={styles.footerLink}>เข้าสู่ระบบ</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF8ED',
  },
  keyboardView: {
    flex: 1,
    backgroundColor: '#FFF8ED',
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  screenContainer: {
    width: '100%',
    maxWidth: 390,
    minHeight: 844,
    backgroundColor: '#FFF8ED',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? 24 : 12,
    paddingBottom: 24,
    justifyContent: 'space-between',
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 44,
    zIndex: 10,
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#A7392A',
    letterSpacing: 0.5,
    fontFamily: Platform.select({
      ios: 'Plus Jakarta Sans',
      android: 'PlusJakartaSans_700Bold',
      default: 'PlusJakartaSans_700Bold, Inter_700Bold, sans-serif',
    }),
  },
  headerRightSpacer: {
    width: 40,
  },
  logoSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  logo: {
    width: 163,
    height: 163,
  },
  headingSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  mainTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#57423E',
    textAlign: 'center',
    marginBottom: 6,
    fontFamily: Platform.select({
      ios: 'Noto Sans Thai',
      android: 'NotoSansThai_700Bold',
      default: 'NotoSansThai_700Bold, Inter_700Bold, sans-serif',
    }),
  },
  subTitle: {
    fontSize: 14,
    color: '#57423E',
    textAlign: 'center',
    fontFamily: Platform.select({
      ios: 'Noto Sans Thai',
      android: 'NotoSansThai_400Regular',
      default: 'NotoSansThai_400Regular, Inter_400Regular, sans-serif',
    }),
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#57423E',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.09,
    shadowRadius: 20,
    elevation: 5,
  },
  submitButton: {
    backgroundColor: '#A7392A',
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#A7392A',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: Platform.select({
      ios: 'Noto Sans Thai',
      android: 'NotoSansThai_700Bold',
      default: 'NotoSansThai_700Bold, Inter_700Bold, sans-serif',
    }),
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 12,
  },
  footerText: {
    fontSize: 14,
    color: '#57423E',
    fontFamily: Platform.select({
      ios: 'Noto Sans Thai',
      android: 'NotoSansThai_400Regular',
      default: 'NotoSansThai_400Regular, Inter_400Regular, sans-serif',
    }),
  },
  footerLink: {
    fontWeight: '800',
    color: '#A7392A',
    textDecorationLine: 'underline',
    fontFamily: Platform.select({
      ios: 'Noto Sans Thai',
      android: 'NotoSansThai_700Bold',
      default: 'NotoSansThai_700Bold, Inter_700Bold, sans-serif',
    }),
  },
  passwordRulesContainer: {
    backgroundColor: '#FAF5EE',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 2,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#EFE7DE',
  },
  passwordRulesTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#57423E',
    marginBottom: 8,
    fontFamily: Platform.select({
      ios: 'Noto Sans Thai',
      android: 'NotoSansThai_700Bold',
      default: 'NotoSansThai_700Bold, Inter_700Bold, sans-serif',
    }),
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 5,
  },
  ruleText: {
    fontSize: 12,
    color: '#7D6A66',
    fontFamily: Platform.select({
      ios: 'Noto Sans Thai',
      android: 'NotoSansThai_400Regular',
      default: 'NotoSansThai_400Regular, Inter_400Regular, sans-serif',
    }),
  },
  ruleTextValid: {
    color: '#2E7D32',
    fontWeight: '600',
  },
});
