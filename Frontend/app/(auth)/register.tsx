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
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { AuthInput } from '@/components/auth/AuthInput';
import { AuthErrorBanner } from '@/components/auth/AuthErrorBanner';
import {
  validateDisplayName,
  validateEmail,
  validatePassword,
  validateConfirmPassword,
  formatEmail,
} from '@/utils/authValidation';

export default function RegisterScreen() {
  const router = useRouter();
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

  const handleDisplayNameChange = (text: string) => {
    setDisplayName(text);
    if (errors.displayName) {
      setErrors((prev) => ({ ...prev, displayName: null }));
    }
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (errors.email) {
      setErrors((prev) => ({ ...prev, email: null }));
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

  const handleConfirmPasswordChange = (text: string) => {
    setConfirmPassword(text);
    if (errors.confirmPassword) {
      setErrors((prev) => ({ ...prev, confirmPassword: null }));
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
      // Future API Call: register({ displayName, email: formattedEmail, password })
      // Navigate to home on success
      router.replace('/(tabs)');
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
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(auth)/login');
    }
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
        >
          {/* Target Screen Frame: 390 x 844 */}
          <View style={styles.screenContainer}>
            {/* Top Navigation Bar */}
            <View style={styles.header}>
              <Pressable
                onPress={handleBack}
                style={styles.iconButton}
                hitSlop={12}
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
                errorMessage={errors.displayName}
                maxLength={35}
              />

              <AuthInput
                iconName="mail"
                placeholder="อีเมล"
                value={email}
                onChangeText={handleEmailChange}
                keyboardType="email-address"
                errorMessage={errors.email}
                autoCapitalize="none"
              />

              <AuthInput
                iconName="lock"
                placeholder="รหัสผ่าน"
                value={password}
                onChangeText={handlePasswordChange}
                isPassword
                errorMessage={errors.password}
                maxLength={25}
              />

              <AuthInput
                iconName="check-circle"
                placeholder="ยืนยันรหัสผ่าน"
                value={confirmPassword}
                onChangeText={handleConfirmPasswordChange}
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
              <Text style={styles.footerText}>
                มีบัญชีอยู่แล้ว?{' '}
                <Text
                  style={styles.footerLink}
                  onPress={() => router.push('/(auth)/login')}
                >
                  เข้าสู่ระบบ
                </Text>
              </Text>
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
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
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
    alignItems: 'center',
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
});
