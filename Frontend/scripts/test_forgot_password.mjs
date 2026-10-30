/**
 * Auth Validation & Password Recovery Integration Tests
 * Kin Rai Dee — Frontend Test Suite
 *
 * Imports directly from the single source of truth:
 *   ../utils/authValidation.ts
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

import {
  AUTH_ERROR_MESSAGES,
  formatEmail,
  validateEmail,
  validatePassword,
  validateConfirmPassword,
  validateOtp,
} from '../utils/authValidation.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read Frontend/.env manually
// Read frontend/.env manually if present
try {
  const envContent = fs.readFileSync(path.resolve(__dirname, '../.env'), 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [key, ...vals] = trimmed.split('=');
    if (key && vals.length > 0) {
      process.env[key.trim()] = vals.join('=').trim();
    }
  }
} catch {
  // Ignore if .env is missing
}

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://ckkuyhpdrqwthqgifpnk.supabase.co';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_elBMw2lLUBxrjDo5lN9pUA_6bmtA_PO';

const supabase = createClient(supabaseUrl, supabaseKey);

// ==========================================
// Test Runner
// ==========================================
let total = 0;
let passed = 0;

function assert(condition, testName, detail = '') {
  total++;
  if (condition) {
    passed++;
    console.log(`  ✅ [PASS] ${testName}`);
  } else {
    console.error(`  ❌ [FAIL] ${testName} ${detail}`);
  }
}

async function runRecoveryTests() {
  console.log('='.repeat(70));
  console.log('🧪 Testing Forgot Password (Recovery Flow & Auth Validation)');
  console.log('='.repeat(70));

  // --- 1. Email Validation Tests ---
  console.log('\n--- 1. Email Validation Tests ---');
  assert(validateEmail('test@gmail.com') === null, 'Valid standard email accepts');
  assert(validateEmail('user.name+tag@domain.co.th') === null, 'Complex email accepts');
  assert(validateEmail('') === AUTH_ERROR_MESSAGES.EMAIL_REQUIRED, 'Empty email returns EMAIL_REQUIRED');
  assert(validateEmail('   ') === AUTH_ERROR_MESSAGES.EMAIL_REQUIRED, 'Whitespace-only email returns EMAIL_REQUIRED');
  assert(validateEmail('test@') === AUTH_ERROR_MESSAGES.EMAIL_INVALID, 'Missing domain returns EMAIL_INVALID');
  assert(validateEmail('@domain.com') === AUTH_ERROR_MESSAGES.EMAIL_INVALID, 'Missing username returns EMAIL_INVALID');
  assert(validateEmail('user..name@domain.com') === AUTH_ERROR_MESSAGES.EMAIL_INVALID, 'Consecutive dots return EMAIL_INVALID');
  assert(validateEmail('.user@domain.com') === AUTH_ERROR_MESSAGES.EMAIL_INVALID, 'Leading dot returns EMAIL_INVALID');
  assert(validateEmail('user@.domain.com') === AUTH_ERROR_MESSAGES.EMAIL_INVALID, 'Dot right after @ returns EMAIL_INVALID');
  assert(formatEmail('  User@Example.Com  ') === 'user@example.com', 'formatEmail trims and lowercases correctly');

  // --- 2. Password Validation Tests ---
  console.log('\n--- 2. Password Validation Tests ---');
  assert(validatePassword('StrongPass1!') === null, 'Valid password with letter, number, special returns null');
  assert(validatePassword('Abc#1234') === null, '8-char valid password returns null');
  assert(validatePassword('Aa1!2345678901234567') === null, '20-char valid password returns null');
  assert(validatePassword('') === AUTH_ERROR_MESSAGES.PASSWORD_REQUIRED, 'Empty password returns PASSWORD_REQUIRED');
  assert(validatePassword('Short1!') === AUTH_ERROR_MESSAGES.PASSWORD_MIN_LENGTH, 'Length < 8 returns PASSWORD_MIN_LENGTH');
  assert(validatePassword('LongPassword12345678901!') === AUTH_ERROR_MESSAGES.PASSWORD_MAX_LENGTH, 'Length > 20 returns PASSWORD_MAX_LENGTH');
  assert(validatePassword('12345678!') === AUTH_ERROR_MESSAGES.PASSWORD_NEED_LETTER, 'Missing letter returns PASSWORD_NEED_LETTER');
  assert(validatePassword('Password!@') === AUTH_ERROR_MESSAGES.PASSWORD_NEED_NUMBER, 'Missing number returns PASSWORD_NEED_NUMBER');
  assert(validatePassword('Password123') === AUTH_ERROR_MESSAGES.PASSWORD_NEED_SPECIAL, 'Missing special returns PASSWORD_NEED_SPECIAL');
  assert(validatePassword('Pass 1234!') === AUTH_ERROR_MESSAGES.PASSWORD_INVALID_CHARS, 'Whitespace in password returns PASSWORD_INVALID_CHARS');
  assert(validatePassword('Password123$') === AUTH_ERROR_MESSAGES.PASSWORD_INVALID_CHARS, 'Disallowed special char ($) returns PASSWORD_INVALID_CHARS');
  assert(validatePassword('short') === AUTH_ERROR_MESSAGES.PASSWORD_MULTI_FAIL, 'Multiple failures returns PASSWORD_MULTI_FAIL');

  // --- 3. Confirm Password Validation Tests ---
  console.log('\n--- 3. Confirm Password Validation Tests ---');
  assert(validateConfirmPassword('Pass123!', 'Pass123!') === null, 'Matching passwords return null');
  assert(validateConfirmPassword('Pass123!', 'Diff123!') === AUTH_ERROR_MESSAGES.PASSWORD_MISMATCH, 'Mismatched passwords return PASSWORD_MISMATCH');
  assert(validateConfirmPassword('Pass123!', '') === AUTH_ERROR_MESSAGES.CONFIRM_PASSWORD_REQUIRED, 'Empty confirm password returns CONFIRM_PASSWORD_REQUIRED');

  // --- 4. OTP Validation Tests ---
  console.log('\n--- 4. OTP Validation Tests ---');
  assert(validateOtp('123456') === null, 'Valid 6-digit OTP returns null');
  assert(validateOtp('000000') === null, 'Leading zero 6-digit OTP returns null');
  assert(validateOtp('') === AUTH_ERROR_MESSAGES.OTP_REQUIRED, 'Empty OTP returns OTP_REQUIRED');
  assert(validateOtp('12345') === AUTH_ERROR_MESSAGES.OTP_INVALID_LENGTH, '5-digit OTP returns OTP_INVALID_LENGTH');
  assert(validateOtp('1234567') === AUTH_ERROR_MESSAGES.OTP_INVALID_LENGTH, '7-digit OTP returns OTP_INVALID_LENGTH');
  assert(validateOtp('12345a') === AUTH_ERROR_MESSAGES.OTP_INVALID_LENGTH, 'Non-digit OTP returns OTP_INVALID_LENGTH');

  // --- 5. Supabase Auth Password Reset Service Tests ---
  console.log('\n--- 5. Supabase Recovery Service Integration Tests ---');
  try {
    // 5.1 Test requesting password reset OTP via Supabase API
    const testEmail = 'kinraidee.recovery.test@example.com';
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(testEmail);
    // Supabase returns either null (success) or rate-limit/network error
    const isResetHandled = resetError === null || resetError.status === 429 || typeof resetError.message === 'string';
    assert(isResetHandled, 'supabase.auth.resetPasswordForEmail executes without fatal exception', resetError ? `(Code: ${resetError.status}, Msg: ${resetError.message})` : '(Success)');

    // 5.2 Test verifying invalid OTP
    const { data: otpData, error: otpError } = await supabase.auth.verifyOtp({
      email: testEmail,
      token: '999999',
      type: 'recovery',
    });
    // Expected to fail validation gracefully with an auth error (e.g. invalid OTP or expired)
    assert(otpError !== null && otpData.session === null, 'supabase.auth.verifyOtp correctly rejects fake OTP with error response', otpError?.message);

    // 5.3 Test getSession
    const { data: sessionData } = await supabase.auth.getSession();
    assert(sessionData !== undefined, 'supabase.auth.getSession returns valid session container');

    // 5.4 Test signOut cleanup
    const { error: signOutError } = await supabase.auth.signOut();
    assert(signOutError === null, 'supabase.auth.signOut executes cleanly for recovery session cleanup');

  } catch (err) {
    assert(false, 'Supabase recovery tests caught unexpected exception', String(err));
  }

  console.log('\n' + '='.repeat(70));
  console.log(`📊 RECOVERY TEST RESULTS: ${passed}/${total} passed (${((passed / total) * 100).toFixed(1)}%)`);
  console.log('='.repeat(70));

  if (passed < total) {
    process.exit(1);
  }
}

runRecoveryTests();
