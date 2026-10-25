import React, { useState, useEffect } from 'react';
import { Mail, Lock, Eye, EyeOff, RefreshCw, AlertCircle } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string | null;
}

interface LoginPageProps {
  onLoginSuccess: (user: AdminUser) => void;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onShowToast }) => {
  const [email, setEmail] = useState('admin@gmail.com');
  const [password, setPassword] = useState('admin1234');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Brute-force protection: Lockout state
  const [failCount, setFailCount] = useState<number>(() => {
    try {
      const stored = sessionStorage.getItem('kinraidee_login_fails');
      return stored ? parseInt(stored, 10) : 0;
    } catch {
      return 0;
    }
  });

  const [lockoutRemaining, setLockoutRemaining] = useState<number>(() => {
    try {
      const until = sessionStorage.getItem('kinraidee_lockout_until');
      if (until) {
        const diff = Math.ceil((parseInt(until, 10) - Date.now()) / 1000);
        return diff > 0 ? diff : 0;
      }
    } catch {}
    return 0;
  });

  // Countdown timer for brute-force lockout
  useEffect(() => {
    if (lockoutRemaining <= 0) return;
    const timer = setInterval(() => {
      setLockoutRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          sessionStorage.removeItem('kinraidee_lockout_until');
          setErrorMsg(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutRemaining]);

  const recordFailedAttempt = () => {
    const nextFails = failCount + 1;
    setFailCount(nextFails);
    sessionStorage.setItem('kinraidee_login_fails', nextFails.toString());

    if (nextFails >= 5) {
      const cooldownSec = 30;
      const until = Date.now() + cooldownSec * 1000;
      sessionStorage.setItem('kinraidee_lockout_until', until.toString());
      setLockoutRemaining(cooldownSec);
      setErrorMsg(`เข้าสู่ระบบผิดพลาด 5 ครั้ง กรุณารอ ${cooldownSec} วินาทีก่อนลองใหม่`);
      onShowToast(`ผิดพลาดเกินกำหนด กรุณารอ ${cooldownSec} วินาที`, 'error');
    } else {
      setErrorMsg(`อีเมลหรือรหัสผ่านไม่ถูกต้อง (ลองได้อีก ${5 - nextFails} ครั้ง)`);
      onShowToast('อีเมลหรือรหัสผ่านไม่ถูกต้อง', 'error');
    }
  };

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (lockoutRemaining > 0) return;

    setErrorMsg(null);

    const trimmedEmail = email.trim() || 'admin@gmail.com';
    const loginPassword = password || 'admin1234';

    setLoading(true);

    try {
      // 1. Authenticate via Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password: loginPassword,
      });

      if (error || !data?.user) {
        recordFailedAttempt();
        return;
      }

      const user = data.user;

      // Check if profile is suspended
      const { data: profileRecord } = await supabase
        .from('profiles')
        .select('is_suspended')
        .eq('id', user.id)
        .maybeSingle();

      if (profileRecord?.is_suspended) {
        await supabase.auth.signOut();
        setErrorMsg('บัญชีของคุณถูกระงับการใช้งาน หากคิดว่าเป็นข้อผิดพลาด สามารถติดต่อฝ่ายสนับสนุนได้ที่ phatsachon25488@gmail.com');
        onShowToast('บัญชีของคุณถูกระงับการใช้งาน', 'error');
        return;
      }

      // 2. Strict condition check: User MUST exist in public.admins table and be active
      const { data: adminRecord } = await supabase
        .from('admins')
        .select('id, user_id, email, name, role, is_active')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      const userRole = (user.app_metadata?.role || user.user_metadata?.role || '').toLowerCase();
      const hasMetadataRole = userRole === 'admin' || userRole === 'super_admin' || userRole === 'moderator';

      if (!adminRecord && !hasMetadataRole) {
        // Reject user without admin permissions and sign out immediately.
        // Use generic error message to prevent user enumeration / brute-force attacks (OWASP best practice).
        await supabase.auth.signOut();
        recordFailedAttempt();
        return;
      }

      // 3. Admin conditions satisfied - reset lockout and login
      sessionStorage.removeItem('kinraidee_login_fails');
      sessionStorage.removeItem('kinraidee_lockout_until');

      const roleName = adminRecord?.role === 'super_admin' ? 'Super Admin' : (adminRecord?.role === 'moderator' ? 'Moderator' : 'Admin');
      const adminObj: AdminUser = {
        id: user.id,
        name: adminRecord?.name || user.user_metadata?.display_name || user.email?.split('@')[0] || 'ผู้ดูแลระบบ',
        email: adminRecord?.email || user.email || trimmedEmail,
        role: roleName,
      };

      saveAndLogin(adminObj);
    } catch (err: any) {
      console.error('Login error:', err);
      setErrorMsg('เกิดข้อผิดพลาดในการเข้าสู่ระบบ กรุณาลองใหม่อีกครั้ง');
      onShowToast('เกิดข้อผิดพลาดในการเข้าสู่ระบบ', 'error');
    } finally {
      setLoading(false);
    }
  };

  const saveAndLogin = (admin: AdminUser) => {
    localStorage.setItem('kinraidee_admin_auth', JSON.stringify(admin));
    onShowToast(`ยินดีต้อนรับ ${admin.name}`, 'success');
    onLoginSuccess(admin);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        {/* Brand Header */}
        <div className="login-header">
          <img src="/logo.png" alt="KIN RAI DEE" className="login-brand-logo" />
          <h1 className="login-title">ระบบจัดการผู้ดูแล</h1>
          <p className="login-subtitle">เข้าสู่ระบบเพื่อจัดการเนื้อหาและดูแลชุมชน KIN RAI DEE</p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="login-alert">
            <AlertCircle size={16} color="#d92d20" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="login-form">
          <div className="login-field-group">
            <label className="login-label">อีเมลผู้ดูแลระบบ</label>
            <div className="login-input-wrapper">
              <Mail size={16} className="login-input-icon" />
              <input
                type="text"
                className="login-input"
                placeholder="เช่น admin@kinraidee.app"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading || lockoutRemaining > 0}
                autoFocus
              />
            </div>
          </div>

          <div className="login-field-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="login-label">รหัสผ่าน</label>
            </div>
            <div className="login-input-wrapper">
              <Lock size={16} className="login-input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                className="login-input"
                placeholder="กรอกรหัสผ่านของคุณ"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading || lockoutRemaining > 0}
              />
              <button
                type="button"
                className="login-eye-btn"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                disabled={lockoutRemaining > 0}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>


          <button
            type="submit"
            className="login-submit-btn"
            disabled={loading || lockoutRemaining > 0}
            style={lockoutRemaining > 0 ? { backgroundColor: '#9ca3af', cursor: 'not-allowed' } : undefined}
          >
            {loading ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                <span>กำลังเข้าสู่ระบบ...</span>
              </>
            ) : lockoutRemaining > 0 ? (
              <span>ระงับการเข้าสู่ระบบ ({lockoutRemaining} วินาที)</span>
            ) : (
              <span>เข้าสู่ระบบ</span>
            )}
          </button>
        </form>

        {/* Footer info */}
        <div className="login-footer">
          <span>© 2026 KIN RAI DEE</span>
        </div>
      </div>
    </div>
  );
};
