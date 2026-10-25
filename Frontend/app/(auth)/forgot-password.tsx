import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { ForgotPasswordHeader } from '@/components/auth/forgot-password/ForgotPasswordHeader';
import { PillInput } from '@/components/auth/forgot-password/PillInput';
import { BrickButton } from '@/components/auth/forgot-password/BrickButton';
import { OtpInputBoxes } from '@/components/auth/forgot-password/OtpInputBoxes';
import { SuccessModal } from '@/components/auth/forgot-password/SuccessModal';
import { AuthErrorBanner } from '@/components/auth/AuthErrorBanner';
import { recoveryService } from '@/services/recoveryService';
import { useAuth } from '@/context/AuthContext';
import {
  validateEmail,
  formatEmail,
  validatePassword,
  validateConfirmPassword,
  AUTH_ERROR_MESSAGES,
} from '@/utils/authValidation';

type RecoveryStep = 'email' | 'otp' | 'new-password';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { returnTo, from } = useLocalSearchParams<{ returnTo?: string; from?: string }>();

  // State management
  const [currentStep, setCurrentStep] = useState<RecoveryStep>('email');
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [inputErrors, setInputErrors] = useState<{
    email?: string | null;
    otp?: string | null;
    newPassword?: string | null;
    confirmPassword?: string | null;
  }>({});

  const [resendCooldown, setResendCooldown] = useState(0);
  const [recoveryVerified, setRecoveryVerified] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Pre-fill email if user is already logged in (e.g. from /settings)
  useEffect(() => {
    if (user?.email && !email) {
      setEmail(user.email);
    }
  }, [user?.email]);

  // Real-time password requirement checklist (unified with register screen)
  const isLenValid = newPassword.length >= 8 && newPassword.length <= 20;
  const hasLetter = /[a-zA-Z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[#?!@\-_]/.test(newPassword);
  const hasOnlyAllowed = newPassword.length > 0 && /^[a-zA-Z0-9#?!@\-_]+$/.test(newPassword);
  const isPasswordValid =
    isLenValid && hasLetter && hasNumber && hasSpecial && hasOnlyAllowed;

  // Handle countdown timer for Resend OTP
  useEffect(() => {
    if (resendCooldown > 0) {
      timerRef.current = setTimeout(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [resendCooldown]);

  // Handle hardware back button on Android
  useEffect(() => {
    const onBackPress = () => {
      handleBack();
      return true;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [currentStep, from]);

  const handleBack = () => {
    setGeneralError(null);
    setInputErrors({});

    if (currentStep === 'new-password') {
      setCurrentStep('otp');
    } else if (currentStep === 'otp') {
      setCurrentStep('email');
    } else {
      if (from === '/settings') {
        router.back();
      } else {
        router.replace({ pathname: '/(auth)/login', params: { returnTo, from } });
      }
    }
  };

  // --- Step 1: Send OTP to Email ---
  const handleRequestOtp = async () => {
    setGeneralError(null);
    setInputErrors({});

    const formattedEmail = formatEmail(email);
    const emailError = validateEmail(formattedEmail);
    if (emailError) {
      setInputErrors({ email: emailError });
      return;
    }

    setIsLoading(true);
    try {
      const res = await recoveryService.requestPasswordResetOtp(formattedEmail);
      if (!res.success) {
        setGeneralError(res.error || AUTH_ERROR_MESSAGES.SYSTEM_ERROR);
        return;
      }

      // Transition to OTP screen & start 60s cooldown
      setCurrentStep('otp');
      setResendCooldown(60);
    } catch {
      setGeneralError(AUTH_ERROR_MESSAGES.SYSTEM_ERROR);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Resend OTP handler ---
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isLoading) return;

    setGeneralError(null);
    setIsLoading(true);
    try {
      const formattedEmail = formatEmail(email);
      const res = await recoveryService.requestPasswordResetOtp(formattedEmail);
      if (res.success) {
        setResendCooldown(60);
        setOtpCode('');
      } else {
        setGeneralError(res.error || AUTH_ERROR_MESSAGES.SYSTEM_ERROR);
      }
    } catch {
      setGeneralError(AUTH_ERROR_MESSAGES.SYSTEM_ERROR);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Step 2: Verify 6-digit OTP ---
  const handleVerifyOtp = async () => {
    setGeneralError(null);
    setInputErrors({});

    if (otpCode.length < 6) {
      setGeneralError(AUTH_ERROR_MESSAGES.OTP_INVALID_LENGTH);
      return;
    }

    setIsLoading(true);
    try {
      const formattedEmail = formatEmail(email);
      const res = await recoveryService.verifyRecoveryOtp(formattedEmail, otpCode);

      if (!res.success || !res.data?.session) {
        setGeneralError(res.error || AUTH_ERROR_MESSAGES.OTP_INVALID);
        return;
      }

      setRecoveryVerified(true);
      setCurrentStep('new-password');
    } catch {
      setGeneralError(AUTH_ERROR_MESSAGES.SYSTEM_ERROR);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Step 3: Set New Password ---
  const handleResetPassword = async () => {
    setGeneralError(null);
    setInputErrors({});

    if (!recoveryVerified) {
      setGeneralError(AUTH_ERROR_MESSAGES.SESSION_EXPIRED);
      setCurrentStep('email');
      return;
    }

    const passError = validatePassword(newPassword);
    const confirmError = validateConfirmPassword(newPassword, confirmPassword);

    if (passError || confirmError) {
      setInputErrors({
        newPassword: passError,
        confirmPassword: confirmError,
      });
      return;
    }

    setIsLoading(true);
    try {
      const res = await recoveryService.updateNewPassword(newPassword);
      if (!res.success) {
        setGeneralError(res.error || AUTH_ERROR_MESSAGES.SYSTEM_ERROR);
        return;
      }

      // If called from /settings, keep user session active. Otherwise, clear session.
      if (from !== '/settings') {
        await recoveryService.clearRecoverySession();
      }
      setShowSuccessModal(true);
    } catch {
      setGeneralError(AUTH_ERROR_MESSAGES.SYSTEM_ERROR);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinish = () => {
    setShowSuccessModal(false);
    if (from === '/settings') {
      router.replace('/settings' as any);
    } else {
      router.replace({ pathname: '/(auth)/login', params: { returnTo, from } });
    }
  };

  const pageTitle = from === '/settings' ? 'เปลี่ยนรหัสผ่าน' : 'ลืมรหัสผ่าน';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {/* Top Header */}
      <ForgotPasswordHeader onBack={handleBack} title={pageTitle} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>
            {/* General Error Banner */}
            {Boolean(generalError) && (
              <View style={styles.errorBannerWrapper}>
                <AuthErrorBanner message={generalError} />
              </View>
            )}

            {/* SCREEN 2: ENTER EMAIL */}
            {currentStep === 'email' && (
              <View style={styles.contentSection}>
                <Text style={styles.description}>
                  กรุณาใส่อีเมลของคุณ เพื่อยืนยันรหัส OTP
                </Text>

                <PillInput
                  iconName="user"
                  placeholder="อีเมล"
                  value={email}
                  onChangeText={(val) => {
                    setEmail(val);
                    if (inputErrors.email) setInputErrors((prev) => ({ ...prev, email: null }));
                  }}
                  onBlur={() => {
                    if (email.trim()) {
                      const err = validateEmail(formatEmail(email));
                      if (err) setInputErrors((prev) => ({ ...prev, email: err }));
                    }
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  errorMessage={inputErrors.email}
                  autoFocus
                />

                <BrickButton
                  title="ต่อไป"
                  onPress={handleRequestOtp}
                  loading={isLoading}
                  style={styles.actionButton}
                />
              </View>
            )}

            {/* SCREEN 3: VERIFY OTP */}
            {currentStep === 'otp' && (
              <View style={styles.contentSection}>
                <Text style={styles.description}>
                  {'เราได้ส่งรหัส OTP ไปยังอีเมลของคุณแล้ว\nกรุณากรอกรหัสเพื่อยืนยันตัวตน'}
                </Text>

                <OtpInputBoxes
                  code={otpCode}
                  onChangeCode={(code) => {
                    setOtpCode(code);
                    if (generalError) setGeneralError(null);
                  }}
                  disabled={isLoading}
                />

                <BrickButton
                  title="ต่อไป"
                  onPress={handleVerifyOtp}
                  disabled={otpCode.length < 6}
                  loading={isLoading}
                  style={styles.actionButton}
                />

                {/* Resend OTP Button with countdown */}
                <View style={styles.resendContainer}>
                  {resendCooldown > 0 ? (
                    <Text style={styles.cooldownText}>
                      ส่งรหัสอีกครั้ง ({resendCooldown} วินาที)
                    </Text>
                  ) : (
                    <Pressable
                      onPress={handleResendOtp}
                      disabled={isLoading}
                      hitSlop={{ top: 8, bottom: 8, left: 12, right: 12 }}
                    >
                      <Text style={styles.resendLink}>ส่งรหัสอีกครั้ง</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            )}

            {/* SCREEN 4: RESET PASSWORD */}
            {currentStep === 'new-password' && (
              <View style={styles.contentSection}>
                <Text style={styles.description}>กรุณาตั้งรหัสผ่านใหม่</Text>

                <PillInput
                  iconName="lock"
                  isPassword
                  placeholder="รหัสผ่านใหม่"
                  value={newPassword}
                  onChangeText={(val) => {
                    setNewPassword(val);
                    if (inputErrors.newPassword) {
                      setInputErrors((prev) => ({ ...prev, newPassword: null }));
                    }
                  }}
                  onFocus={() => setIsPasswordFocused(true)}
                  onBlur={() => {
                    setIsPasswordFocused(false);
                    if (newPassword) {
                      const err = validatePassword(newPassword);
                      setInputErrors((prev) => ({ ...prev, newPassword: err }));
                    }
                  }}
                  errorMessage={inputErrors.newPassword}
                />

                {/* Password Requirement Guidelines (Unified with Register Screen) */}
                {(isPasswordFocused || newPassword.length > 0) && (
                  <View style={styles.passwordRulesContainer}>
                    <Text style={styles.passwordRulesTitle}>เงื่อนไขการตั้งรหัสผ่าน:</Text>

                    <View style={styles.ruleItem}>
                      <Feather
                        name={isLenValid ? 'check-circle' : 'circle'}
                        size={14}
                        color={isLenValid ? '#2E7D32' : '#8C7A75'}
                      />
                      <Text style={[styles.ruleText, isLenValid && styles.ruleTextValid]}>
                        ความยาว 8–20 ตัวอักษร
                      </Text>
                    </View>

                    <View style={styles.ruleItem}>
                      <Feather
                        name={hasLetter ? 'check-circle' : 'circle'}
                        size={14}
                        color={hasLetter ? '#2E7D32' : '#8C7A75'}
                      />
                      <Text style={[styles.ruleText, hasLetter && styles.ruleTextValid]}>
                        มีอักษรภาษาอังกฤษอย่างน้อย 1 ตัว (a-z, A-Z)
                      </Text>
                    </View>

                    <View style={styles.ruleItem}>
                      <Feather
                        name={hasNumber ? 'check-circle' : 'circle'}
                        size={14}
                        color={hasNumber ? '#2E7D32' : '#8C7A75'}
                      />
                      <Text style={[styles.ruleText, hasNumber && styles.ruleTextValid]}>
                        มีตัวเลขอย่างน้อย 1 ตัว (0-9)
                      </Text>
                    </View>

                    <View style={styles.ruleItem}>
                      <Feather
                        name={hasSpecial ? 'check-circle' : 'circle'}
                        size={14}
                        color={hasSpecial ? '#2E7D32' : '#8C7A75'}
                      />
                      <Text style={[styles.ruleText, hasSpecial && styles.ruleTextValid]}>
                        มีอักขระพิเศษอย่างน้อย 1 ตัว (# ? ! @ - _)
                      </Text>
                    </View>

                    <View style={styles.ruleItem}>
                      <Feather
                        name={hasOnlyAllowed ? 'check-circle' : 'circle'}
                        size={14}
                        color={hasOnlyAllowed ? '#2E7D32' : '#8C7A75'}
                      />
                      <Text style={[styles.ruleText, hasOnlyAllowed && styles.ruleTextValid]}>
                        ไม่มีช่องว่าง และใช้อักขระที่กำหนดเท่านั้น
                      </Text>
                    </View>
                  </View>
                )}

                <PillInput
                  iconName="check-circle"
                  isPassword
                  placeholder="ยืนยันรหัสผ่าน"
                  value={confirmPassword}
                  onChangeText={(val) => {
                    setConfirmPassword(val);
                    if (inputErrors.confirmPassword) {
                      setInputErrors((prev) => ({ ...prev, confirmPassword: null }));
                    }
                  }}
                  onBlur={() => {
                    if (confirmPassword) {
                      const err = validateConfirmPassword(newPassword, confirmPassword);
                      setInputErrors((prev) => ({ ...prev, confirmPassword: err }));
                    }
                  }}
                  errorMessage={inputErrors.confirmPassword}
                />

                <BrickButton
                  title="ยืนยันรหัสผ่าน"
                  onPress={handleResetPassword}
                  disabled={!isPasswordValid || newPassword !== confirmPassword}
                  loading={isLoading}
                  style={styles.actionButton}
                />
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* SCREEN 5: SUCCESS POPUP MODAL */}
      <SuccessModal
        visible={showSuccessModal}
        onConfirm={handleFinish}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 36,
    paddingBottom: 40,
  },
  container: {
    width: '100%',
    maxWidth: 390,
  },
  errorBannerWrapper: {
    marginBottom: 20,
    width: '100%',
  },
  contentSection: {
    width: '100%',
    alignItems: 'center',
  },
  description: {
    fontSize: 15,
    color: '#1F2937',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
    fontFamily: Platform.select({
      ios: 'Noto Sans Thai',
      android: 'NotoSansThai_400Regular',
      default: 'NotoSansThai_400Regular, Inter_400Regular, sans-serif',
    }),
  },
  actionButton: {
    marginTop: 8,
  },
  resendContainer: {
    marginTop: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cooldownText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontFamily: Platform.select({
      ios: 'Noto Sans Thai',
      android: 'NotoSansThai_400Regular',
      default: 'NotoSansThai_400Regular, Inter_400Regular, sans-serif',
    }),
  },
  resendLink: {
    fontSize: 14,
    color: '#A63826',
    fontWeight: '600',
    fontFamily: Platform.select({
      ios: 'Noto Sans Thai',
      android: 'NotoSansThai_600SemiBold',
      default: 'NotoSansThai_600SemiBold, Inter_600SemiBold, sans-serif',
    }),
  },
  passwordRulesContainer: {
    backgroundColor: '#FAF5EE',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    width: '100%',
  },
  passwordRulesTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#57423E',
    marginBottom: 8,
    fontFamily: Platform.select({
      ios: 'Noto Sans Thai',
      android: 'NotoSansThai_600SemiBold',
      default: 'NotoSansThai_600SemiBold, Inter_600SemiBold, sans-serif',
    }),
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  ruleText: {
    fontSize: 12,
    color: '#8C7A75',
    marginLeft: 8,
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
