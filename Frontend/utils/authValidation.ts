/**
 * Authentication Validation Utilities for Kin Rai Dee
 * Follows strict validation rules and error messages from specifications.
 */

export const AUTH_ERROR_MESSAGES = {
  // Display Name
  DISPLAY_NAME_REQUIRED: 'กรุณากรอกชื่อที่แสดง',
  DISPLAY_NAME_MAX_LENGTH: 'ชื่อที่แสดงต้องไม่เกิน 30 ตัวอักษร',
  DISPLAY_NAME_DUPLICATE: 'ชื่อที่แสดงนี้มีผู้ใช้แล้ว กรุณาใช้ชื่ออื่น',

  // Email
  EMAIL_REQUIRED: 'กรุณากรอกอีเมล',
  EMAIL_INVALID: 'รูปแบบอีเมลไม่ถูกต้อง',
  EMAIL_DUPLICATE: 'อีเมลนี้ถูกใช้สมัครบัญชีแล้ว',

  // Password
  PASSWORD_REQUIRED: 'กรุณากรอกรหัสผ่าน',
  PASSWORD_MIN_LENGTH: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร',
  PASSWORD_MAX_LENGTH: 'รหัสผ่านต้องไม่เกิน 20 ตัวอักษร',
  PASSWORD_NEED_LETTER: 'ต้องมีอักษรภาษาอังกฤษอย่างน้อย 1 ตัว',
  PASSWORD_NEED_NUMBER: 'ต้องมีตัวเลขอย่างน้อย 1 ตัว',
  PASSWORD_NEED_SPECIAL: 'ต้องมีอักขระพิเศษอย่างน้อย 1 ตัว (# ? ! @ - _)',
  PASSWORD_INVALID_CHARS: 'ใช้ได้เฉพาะอักษรภาษาอังกฤษ ตัวเลข และ #?!@-_',
  PASSWORD_MULTI_FAIL: 'รหัสผ่านยังไม่ครบตามเงื่อนไข',

  // Confirm Password
  CONFIRM_PASSWORD_REQUIRED: 'กรุณายืนยันรหัสผ่าน',
  PASSWORD_MISMATCH: 'รหัสผ่านไม่ตรงกัน',

  // General / API Errors
  CANNOT_GENERATE_USERNAME: 'ไม่สามารถสมัครบัญชีได้ กรุณาลองใหม่อีกครั้ง',
  NO_INTERNET: 'ไม่สามารถเชื่อมต่อได้ กรุณาตรวจสอบอินเทอร์เน็ต',
  SYSTEM_ERROR: 'ระบบขัดข้องชั่วคราว กรุณาลองใหม่อีกครั้ง',
  INVALID_CREDENTIALS: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง',
  TOO_MANY_ATTEMPTS: 'ลองเข้าสู่ระบบหลายครั้งเกินไป กรุณารอสักครู่',
} as const;

/**
 * Validates display name:
 * - 1-30 chars
 * - Cannot be all whitespace
 * - Supports Thai, English, Numbers, Special characters (PostgreSQL UTF-8)
 */
export function validateDisplayName(name: string): string | null {
  if (!name || name.trim().length === 0) {
    return AUTH_ERROR_MESSAGES.DISPLAY_NAME_REQUIRED;
  }

  if (name.length > 30) {
    return AUTH_ERROR_MESSAGES.DISPLAY_NAME_MAX_LENGTH;
  }

  return null;
}

/**
 * Formats email by trimming and converting to lowercase
 */
export function formatEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Validates email format
 */
export function validateEmail(email: string): string | null {
  const trimmed = email.trim();
  if (!trimmed) {
    return AUTH_ERROR_MESSAGES.EMAIL_REQUIRED;
  }

  // Standard email RFC 5322 regex
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(trimmed)) {
    return AUTH_ERROR_MESSAGES.EMAIL_INVALID;
  }

  return null;
}

/**
 * Validates password based on:
 * - Length 8-20 chars
 * - At least 1 English letter (a-z, A-Z)
 * - At least 1 number (0-9)
 * - At least 1 special char from # ? ! @ - _
 * - Allowed chars ONLY: English letters, numbers, and #?!@-_ (no spaces or other chars)
 * - Case-sensitive
 * - Returns specific error if only 1 rule failed, or 'PASSWORD_MULTI_FAIL' if multiple failed
 */
export function validatePassword(password: string): string | null {
  if (!password) {
    return AUTH_ERROR_MESSAGES.PASSWORD_REQUIRED;
  }

  // Check for disallowed characters (including whitespace)
  // Allowed characters: a-z, A-Z, 0-9, #, ?, !, @, -, _
  const allowedCharsRegex = /^[a-zA-Z0-9#?!@\-_]+$/;
  if (!allowedCharsRegex.test(password)) {
    return AUTH_ERROR_MESSAGES.PASSWORD_INVALID_CHARS;
  }

  const failures: string[] = [];

  if (password.length < 8) {
    failures.push(AUTH_ERROR_MESSAGES.PASSWORD_MIN_LENGTH);
  } else if (password.length > 20) {
    failures.push(AUTH_ERROR_MESSAGES.PASSWORD_MAX_LENGTH);
  }

  const hasLetter = /[a-zA-Z]/.test(password);
  if (!hasLetter) {
    failures.push(AUTH_ERROR_MESSAGES.PASSWORD_NEED_LETTER);
  }

  const hasNumber = /[0-9]/.test(password);
  if (!hasNumber) {
    failures.push(AUTH_ERROR_MESSAGES.PASSWORD_NEED_NUMBER);
  }

  const hasSpecial = /[#?!@\-_]/.test(password);
  if (!hasSpecial) {
    failures.push(AUTH_ERROR_MESSAGES.PASSWORD_NEED_SPECIAL);
  }

  if (failures.length > 1) {
    return AUTH_ERROR_MESSAGES.PASSWORD_MULTI_FAIL;
  }

  if (failures.length === 1) {
    return failures[0];
  }

  return null;
}

/**
 * Validates password confirmation
 */
export function validateConfirmPassword(password: string, confirmPassword: string): string | null {
  if (!confirmPassword) {
    return AUTH_ERROR_MESSAGES.CONFIRM_PASSWORD_REQUIRED;
  }

  if (confirmPassword !== password) {
    return AUTH_ERROR_MESSAGES.PASSWORD_MISMATCH;
  }

  return null;
}
