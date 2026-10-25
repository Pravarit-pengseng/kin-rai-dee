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
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { AuthInput } from '@/components/auth/AuthInput';
import { AuthErrorBanner } from '@/components/auth/AuthErrorBanner';
import { useAuth } from '@/context/AuthContext';
import {
  validateEmail,
  formatEmail,
  AUTH_ERROR_MESSAGES,
} from '@/utils/authValidation';

export default function LoginScreen() {
  const router = useRouter();
  const { returnTo, from } = useLocalSearchParams<{ returnTo?: string; from?: string }>();
  const { login } = useAuth();
  const { height: windowHeight } = useWindowDimensions();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Responsive scale factors
  const isSmallScreen = windowHeight < 720;
  const isMediumScreen = windowHeight >= 720 && windowHeight < 840;
  const logoSize = isSmallScreen ? 100 : isMediumScreen ? 125 : 150;

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
      const { error } = await login(formattedEmail, password);
      if (error) {
        // Map Supabase error messages to user-facing messages
        if (error.includes('ระงับ') || error.toLowerCase().includes('suspend')) {
          setGeneralError(error);
        } else if (error.toLowerCase().includes('invalid') || error.toLowerCase().includes('credentials')) {
          setGeneralError(AUTH_ERROR_MESSAGES.INVALID_CREDENTIALS);
        } else if (error.toLowerCase().includes('too many')) {
          setGeneralError(AUTH_ERROR_MESSAGES.TOO_MANY_ATTEMPTS);
        } else {
          setGeneralError(AUTH_ERROR_MESSAGES.SYSTEM_ERROR);
        }
        return;
      }
      if (returnTo) {
        router.replace(returnTo as any);
      } else {
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      setGeneralError(AUTH_ERROR_MESSAGES.SYSTEM_ERROR);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    const isProtectedRoute = (path?: string) =>
      !path || path.includes('profile') || path.includes('AddPost');

    let destination = from;
    if (!destination || isProtectedRoute(destination)) {
      destination = !isProtectedRoute(returnTo) ? returnTo : '/(tabs)';
    }

    router.replace((destination || '/(tabs)') as any);
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
          overScrollMode="never"
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.screenContainer}>
            {/* Top Navigation Bar */}
            <View style={styles.header}>
              <Pressable
                onPress={handleClose}
                style={({ pressed }) => [styles.iconButton, pressed && styles.buttonPressed]}
                hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
              >
                <Feather name="x" size={24} color="#57423E" />
              </Pressable>

              <Text style={styles.headerTitle}>KIN RAI DEE</Text>

              <View style={styles.headerRightSpacer} />
            </View>

            {/* Center Content Section */}
            <View style={styles.centerSection}>
              {/* Mascot / Logo */}
              <View style={[styles.logoSection, isSmallScreen && styles.logoSectionSmall]}>
                <Image
                  source={require('@/assets/images/kin-rai-dee-logo.png')}
                  style={{ width: logoSize, height: logoSize }}
                  resizeMode="contain"
                />
              </View>

              {/* Heading & Subtitle */}
              <View style={[styles.headingSection, isSmallScreen && styles.headingSectionSmall]}>
                <Text style={[styles.mainTitle, isSmallScreen && styles.mainTitleSmall]}>
                  ยินดีต้อนรับเข้าสู่ KIN RAI DEE
                </Text>
                <Text style={[styles.subTitle, isSmallScreen && styles.subTitleSmall]}>
                  รีบเข้าสู่ระบบ แล้วไปหาของอร่อยกินกันเถอะ!
                </Text>
              </View>

              {/* White Form Card */}
              <View style={[styles.formCard, isSmallScreen && styles.formCardSmall]}>
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
            </View>

            {/* Bottom Footer Navigation */}
            <View style={[styles.footer, isSmallScreen && styles.footerSmall]}>
              <Text style={styles.footerText}>ยังไม่มีบัญชีผู้ใช้งาน? </Text>
              <Pressable
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                onPress={() => router.replace({ pathname: '/(auth)/register', params: { returnTo, from } })}
                style={({ pressed }) => [pressed && styles.buttonPressed]}
              >
                <Text style={styles.footerLink}>สมัครบัญชี</Text>
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
  },
  screenContainer: {
    flex: 1,
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFF8ED',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? 12 : 6,
    paddingBottom: Platform.OS === 'ios' ? 12 : 20,
    justifyContent: 'space-between',
    alignSelf: 'center',
  },
  centerSection: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 4,
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
      ios: 'Inter',
      android: 'Inter_700Bold',
      default: 'Inter_700Bold, sans-serif',
    }),
  },
  headerRightSpacer: {
    width: 40,
  },
  logoSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  logoSectionSmall: {
    marginVertical: 4,
  },
  headingSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  headingSectionSmall: {
    marginBottom: 10,
  },
  mainTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#57423E',
    textAlign: 'center',
    marginBottom: 6,
    fontFamily: Platform.select({
      ios: 'Inter',
      android: 'Inter_700Bold',
      default: 'Inter, sans-serif',
    }),
  },
  mainTitleSmall: {
    fontSize: 18,
    marginBottom: 4,
  },
  subTitle: {
    fontSize: 14,
    color: '#57423E',
    textAlign: 'center',
    fontFamily: Platform.select({
      ios: 'Inter',
      android: 'Inter_400Regular',
      default: 'Inter, sans-serif',
    }),
  },
  subTitleSmall: {
    fontSize: 13,
  },
  formCard: {
    width: '100%',
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
  formCardSmall: {
    padding: 16,
    borderRadius: 20,
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
      ios: 'Inter',
      android: 'Inter_700Bold',
      default: 'Inter, sans-serif',
    }),
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  footerSmall: {
    marginTop: 8,
    marginBottom: 4,
  },
  footerText: {
    fontSize: 14,
    color: '#57423E',
    fontFamily: Platform.select({
      ios: 'Inter',
      android: 'Inter_400Regular',
      default: 'Inter, sans-serif',
    }),
  },
  footerLink: {
    fontWeight: '800',
    color: '#A7392A',
    textDecorationLine: 'underline',
    fontFamily: Platform.select({
      ios: 'Inter',
      android: 'Inter_700Bold',
      default: 'Inter, sans-serif',
    }),
  },
});
