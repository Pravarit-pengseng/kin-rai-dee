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
  validateEmail,
  formatEmail,
  AUTH_ERROR_MESSAGES,
} from '@/utils/authValidation';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [errors, setErrors] = useState<{
    email?: string | null;
    password?: string | null;
  }>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
  };

  const handleLogin = async () => {
    setGeneralError(null);

    const formattedEmail = formatEmail(email);
    const emailError = validateEmail(formattedEmail);
    const passwordError = !password ? AUTH_ERROR_MESSAGES.PASSWORD_REQUIRED : null;

    if (emailError || passwordError) {
      setErrors({
        email: emailError,
        password: passwordError,
      });
      return;
    }

    setErrors({});
    setIsLoading(true);

    try {
      // Future API Call: login({ email: formattedEmail, password })
      // Navigate to home on success
      router.replace('/(tabs)');
    } catch (err: any) {
      if (err?.code === 'INVALID_CREDENTIALS') {
        setGeneralError(AUTH_ERROR_MESSAGES.INVALID_CREDENTIALS);
      } else if (err?.code === 'TOO_MANY_ATTEMPTS') {
        setGeneralError(AUTH_ERROR_MESSAGES.TOO_MANY_ATTEMPTS);
      } else if (err?.code === 'NETWORK_ERROR' || !navigator.onLine) {
        setGeneralError(AUTH_ERROR_MESSAGES.NO_INTERNET);
      } else {
        setGeneralError(AUTH_ERROR_MESSAGES.SYSTEM_ERROR);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
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
                onPress={handleClose}
                style={styles.iconButton}
                hitSlop={12}
              >
                <Feather name="x" size={24} color="#57423E" />
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
              <Text style={styles.mainTitle}>ยินดีต้อนรับเข้าสู่ KIN RAI DEE</Text>
              <Text style={styles.subTitle}>
                รีบเข้าสู่ระบบ แล้วไปหาของอร่อยกินกันเถอะ!
              </Text>
            </View>

            {/* White Form Card (borderRadius: 24) */}
            <View style={styles.formCard}>
              <AuthErrorBanner message={generalError} />

              <AuthInput
                iconName="user"
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
              />

              <Pressable
                onPress={handleLogin}
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
                  <Text style={styles.submitButtonText}>เข้าสู่ระบบ →</Text>
                )}
              </Pressable>
            </View>

            {/* Bottom Footer Navigation */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                ยังไม่มีบัญชีผู้ใช้งาน?{' '}
                <Text
                  style={styles.footerLink}
                  onPress={() => router.push('/(auth)/register')}
                >
                  สมัครบัญชี
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
    marginBottom: 20,
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
    marginTop: 24,
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
