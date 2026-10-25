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
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { AuthInput } from '@/components/auth/AuthInput';
import { AuthErrorBanner } from '@/components/auth/AuthErrorBanner';
import { supabase } from '@/lib/supabase';
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
  const { login } = useAuth();  // ใช้สำหรับ auto-login หลัง signup สำเร็จ
  const { height: windowHeight } = useWindowDimensions();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Responsive scale factors
  const isSmallScreen = windowHeight < 720;
  const isMediumScreen = windowHeight >= 720 && windowHeight < 840;
  const logoSize = isSmallScreen ? 70 : isMediumScreen ? 85 : 105;

  const [errors, setErrors] = useState<{
    displayName?: string | null;
    email?: string | null;
    password?: string | null;
    confirmPassword?: string | null;
  }>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [termsError, setTermsError] = useState(false);

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

    if (!acceptedTerms) {
      setTermsError(true);
      setGeneralError('กรุณากดยอมรับเงื่อนไขและนโยบายความเป็นส่วนตัวก่อนสมัครบัญชี');
      Alert.alert(
        'เงื่อนไขการใช้งาน',
        'กรุณากดยอมรับข้อกำหนดการใช้งานและรับทราบนโยบายความเป็นส่วนตัวก่อนสมัครบัญชี'
      );
      return;
    }

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

    setErrors({});
    setIsLoading(true);

    try {
      // สมัครบัญชีผ่าน Supabase Auth
      const { error: signUpError } = await supabase.auth.signUp({
        email: formattedEmail,
        password,
        options: {
          data: {
            display_name: displayName,
          },
        },
      });

      if (signUpError) {
        if (signUpError.message.toLowerCase().includes('already registered') ||
            signUpError.message.toLowerCase().includes('already been registered')) {
          setErrors((prev) => ({ ...prev, email: 'อีเมลนี้ถูกใช้สมัครบัญชีแล้ว' }));
        } else {
          setGeneralError('ระบบขัดข้องชั่วคราว กรุณาลองใหม่อีกครั้ง');
        }
        return;
      }

      // Auto-login หลัง signup สำเร็จ
      const { error: loginError } = await login(formattedEmail, password);
      if (loginError) {
        // signup สำเร็จแต่ login ไม่ได้ → ให้ไป login ใหม่เอง
        router.replace({ pathname: '/(auth)/login', params: { returnTo, from } });
        return;
      }

      if (returnTo) {
        router.replace(returnTo as any);
      } else {
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      setGeneralError('ระบบขัดข้องชั่วคราว กรุณาลองใหม่อีกครั้ง');
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
          overScrollMode="never"
          keyboardShouldPersistTaps="handled"
        >
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
                  มาร่วมเป็นครอบครัว KIN RAI DEE
                </Text>
                <Text style={[styles.subTitle, isSmallScreen && styles.subTitleSmall]}>
                  สร้างบัญชีเพื่อเริ่มค้นหาเมนูที่น่าสนใจ
                </Text>
              </View>

              {/* White Form Card */}
              <View style={[styles.formCard, isSmallScreen && styles.formCardSmall]}>
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
                autoCorrect={false}
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

              {/* Terms of Use & Privacy Policy Checkbox */}
              <Pressable
                style={styles.termsRow}
                onPress={() => {
                  setAcceptedTerms((prev) => {
                    const next = !prev;
                    if (next) setTermsError(false);
                    return next;
                  });
                }}
                hitSlop={8}
              >
                <View
                  style={[
                    styles.checkbox,
                    acceptedTerms && styles.checkboxChecked,
                    termsError && !acceptedTerms && styles.checkboxError,
                  ]}
                >
                  {acceptedTerms && <Feather name="check" size={14} color="#FFFFFF" />}
                </View>
                <Text style={styles.termsText}>
                  ฉันยอมรับ{' '}
                  <Text
                    style={styles.termsLink}
                    onPress={(e) => {
                      e.stopPropagation();
                      router.push('/terms-of-use' as any);
                    }}
                  >
                    ข้อกำหนดการใช้งาน
                  </Text>
                  {' '}และรับทราบ{' '}
                  <Text
                    style={styles.termsLink}
                    onPress={(e) => {
                      e.stopPropagation();
                      router.push('/privacy-policy' as any);
                    }}
                  >
                    นโยบายความเป็นส่วนตัว
                  </Text>
                </Text>
              </Pressable>

              {termsError && !acceptedTerms && (
                <View style={styles.termsErrorContainer}>
                  <Feather name="alert-circle" size={13} color="#C0392B" style={styles.termsErrorIcon} />
                  <Text style={styles.termsErrorText}>
                    กรุณากดยอมรับเงื่อนไขก่อนสมัครบัญชี
                  </Text>
                </View>
              )}

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
          </View>

          {/* Bottom Footer Navigation */}
          <View style={[styles.footer, isSmallScreen && styles.footerSmall]}>
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
  },
  screenContainer: {
    flex: 1,
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFF8ED',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 10 : 4,
    paddingBottom: Platform.OS === 'ios' ? 12 : 20,
    justifyContent: 'space-between',
    alignSelf: 'center',
  },
  centerSection: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 2,
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
    marginVertical: 6,
  },
  logoSectionSmall: {
    marginVertical: 2,
  },
  headingSection: {
    alignItems: 'center',
    marginBottom: 12,
  },
  headingSectionSmall: {
    marginBottom: 6,
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
    fontSize: 17,
    marginBottom: 3,
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
    fontSize: 12.5,
  },
  formCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
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
    padding: 14,
    borderRadius: 20,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 6,
    marginTop: 4,
    marginBottom: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.8,
    borderColor: '#B0A3A0',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: '#A7392A',
    borderColor: '#A7392A',
  },
  checkboxError: {
    borderColor: '#C0392B',
    borderWidth: 1.5,
    backgroundColor: '#FFF8F7',
  },
  termsErrorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -4,
    marginBottom: 8,
    paddingHorizontal: 6,
    alignSelf: 'flex-start',
  },
  termsErrorIcon: {
    marginRight: 4,
  },
  termsErrorText: {
    color: '#C0392B',
    fontSize: 12,
    fontFamily: Platform.select({
      ios: 'Inter',
      android: 'Inter_400Regular',
      default: 'Inter, sans-serif',
    }),
  },
  termsText: {
    flex: 1,
    fontSize: 12,
    color: '#57423E',
    lineHeight: 18,
    fontFamily: Platform.select({
      ios: 'Inter',
      android: 'Inter_400Regular',
      default: 'Inter, sans-serif',
    }),
  },
  termsLink: {
    color: '#A7392A',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  submitButton: {
    backgroundColor: '#A7392A',
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
    shadowColor: '#A7392A',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  submitButtonSmall: {
    height: 46,
    borderRadius: 23,
    marginTop: 4,
  },
  buttonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
  buttonDisabled: {
    opacity: 0.45,
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
    marginTop: 14,
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
      ios: 'Inter',
      android: 'Inter_700Bold',
      default: 'Inter, sans-serif',
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
      ios: 'Inter',
      android: 'Inter_400Regular',
      default: 'Inter, sans-serif',
    }),
  },
  ruleTextValid: {
    color: '#2E7D32',
    fontWeight: '600',
  },
});
