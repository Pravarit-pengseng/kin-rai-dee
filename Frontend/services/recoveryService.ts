import { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { AUTH_ERROR_MESSAGES } from '@/utils/authValidation';

export interface RecoveryResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Service to handle Password Recovery with Email OTP via Supabase Auth
 */
export const recoveryService = {
  /**
   * Request password reset OTP email
   * Never leaks whether the email is registered or not (security best practice)
   */
  async requestPasswordResetOtp(email: string): Promise<RecoveryResult> {
    try {
      const formattedEmail = email.trim().toLowerCase();
      const { error } = await supabase.auth.resetPasswordForEmail(formattedEmail);

      if (error) {
        const msg = error.message.toLowerCase();
        if (msg.includes('rate limit') || msg.includes('too many') || error.status === 429) {
          return { success: false, error: AUTH_ERROR_MESSAGES.RATE_LIMIT_EXCEEDED };
        }
        if (msg.includes('network') || msg.includes('fetch')) {
          return { success: false, error: AUTH_ERROR_MESSAGES.NO_INTERNET };
        }
        // If Supabase returns other errors, don't expose account existence
        return { success: false, error: AUTH_ERROR_MESSAGES.SYSTEM_ERROR };
      }

      return { success: true };
    } catch {
      return { success: false, error: AUTH_ERROR_MESSAGES.SYSTEM_ERROR };
    }
  },

  /**
   * Verify the 6-digit recovery OTP code with Supabase
   */
  async verifyRecoveryOtp(
    email: string,
    token: string
  ): Promise<RecoveryResult<{ session: Session | null }>> {
    try {
      const formattedEmail = email.trim().toLowerCase();
      const trimmedToken = token.trim();

      const { data, error } = await supabase.auth.verifyOtp({
        email: formattedEmail,
        token: trimmedToken,
        type: 'recovery',
      });

      if (error) {
        const msg = error.message.toLowerCase();
        if (msg.includes('rate limit') || msg.includes('too many') || error.status === 429) {
          return { success: false, error: AUTH_ERROR_MESSAGES.RATE_LIMIT_EXCEEDED };
        }
        if (msg.includes('network') || msg.includes('fetch')) {
          return { success: false, error: AUTH_ERROR_MESSAGES.NO_INTERNET };
        }
        // Always report that OTP is incorrect without forcing the user to request a new OTP
        return { success: false, error: AUTH_ERROR_MESSAGES.OTP_INVALID };
      }

      if (!data.session) {
        return { success: false, error: AUTH_ERROR_MESSAGES.SESSION_EXPIRED };
      }

      return { success: true, data: { session: data.session } };
    } catch {
      return { success: false, error: AUTH_ERROR_MESSAGES.SYSTEM_ERROR };
    }
  },

  /**
   * Update the user password in Supabase Auth
   */
  async updateNewPassword(password: string): Promise<RecoveryResult> {
    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        const msg = error.message.toLowerCase();
        if (msg.includes('different') || msg.includes('same as') || msg.includes('old password')) {
          return { success: false, error: AUTH_ERROR_MESSAGES.PASSWORD_SAME_AS_OLD };
        }
        if (msg.includes('at least') && msg.includes('character')) {
          return { success: false, error: AUTH_ERROR_MESSAGES.PASSWORD_RESET_MIN_LENGTH };
        }
        if (msg.includes('session') || msg.includes('auth') || error.status === 401) {
          return { success: false, error: AUTH_ERROR_MESSAGES.SESSION_EXPIRED };
        }
        if (msg.includes('network') || msg.includes('fetch')) {
          return { success: false, error: AUTH_ERROR_MESSAGES.NO_INTERNET };
        }
        return { success: false, error: AUTH_ERROR_MESSAGES.SYSTEM_ERROR };
      }

      return { success: true };
    } catch {
      return { success: false, error: AUTH_ERROR_MESSAGES.SYSTEM_ERROR };
    }
  },

  /**
   * Clear the recovery session by signing out from Supabase Auth
   */
  async clearRecoverySession(): Promise<void> {
    try {
      await supabase.auth.signOut();
    } catch {
      // Ignore sign out errors during cleanup
    }
  },

  /**
   * Check if current session exists and is valid
   */
  async checkCurrentSession(): Promise<boolean> {
    try {
      const { data } = await supabase.auth.getSession();
      return Boolean(data.session);
    } catch {
      return false;
    }
  },
};
