import React, { useState, useEffect, useRef } from 'react';
import { AdminLayout } from './components/layout/AdminLayout';
import { NavTab } from './components/layout/Sidebar';
import { ModerationQueuePage } from './pages/ModerationQueuePage';
import { PostsPage } from './pages/PostsPage';
import { UsersPage } from './pages/UsersPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { LoginPage, AdminUser } from './pages/LoginPage';
import { moderationService } from './services/moderationService';
import { ToastContainer, ToastMessage } from './components/common/Toast';
import { supabase } from './services/supabaseClient';

export function App() {
  const [currentAdmin, setCurrentAdmin] = useState<AdminUser | null>(null);
  const [isVerifyingAuth, setIsVerifyingAuth] = useState(true);

  const [currentTab, setCurrentTab] = useState<NavTab>('moderation');
  const [isLive, setIsLive] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [pendingCount, setPendingCount] = useState(0);

  // 1. Verify real Supabase session on startup
  useEffect(() => {
    let isMounted = true;

    const verifySession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error || !session?.user) {
          localStorage.removeItem('kinraidee_admin_auth');
          sessionStorage.removeItem('kinraidee_admin_auth');
          if (isMounted) setCurrentAdmin(null);
          return;
        }

        // Verify against public.admins table
        const { data: adminRecord } = await supabase
          .from('admins')
          .select('id, user_id, email, name, role, is_active')
          .eq('user_id', session.user.id)
          .eq('is_active', true)
          .maybeSingle();

        const role = (session.user.app_metadata?.role || session.user.user_metadata?.role || '').toLowerCase();
        const hasRole = role === 'admin' || role === 'super_admin' || role === 'moderator';

        if (!adminRecord && !hasRole) {
          console.warn('Current user is not in public.admins or active. Signing out.');
          await supabase.auth.signOut();
          localStorage.removeItem('kinraidee_admin_auth');
          sessionStorage.removeItem('kinraidee_admin_auth');
          if (isMounted) setCurrentAdmin(null);
          return;
        }

        const roleName = adminRecord?.role === 'super_admin' ? 'Super Admin' : (adminRecord?.role === 'moderator' ? 'Moderator' : 'Admin');
        const adminObj: AdminUser = {
          id: session.user.id,
          name: adminRecord?.name || session.user.user_metadata?.display_name || session.user.email?.split('@')[0] || 'ผู้ดูแลระบบ',
          email: adminRecord?.email || session.user.email || '',
          role: roleName,
        };

        if (isMounted) setCurrentAdmin(adminObj);
      } catch (err) {
        console.error('Session verify failed:', err);
        if (isMounted) setCurrentAdmin(null);
      } finally {
        if (isMounted) setIsVerifyingAuth(false);
      }
    };

    verifySession();

    // Listen to Supabase auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        if (isMounted) setCurrentAdmin(null);
        localStorage.removeItem('kinraidee_admin_auth');
        sessionStorage.removeItem('kinraidee_admin_auth');
      }
    });

    const onUnauthorized = () => {
      if (isMounted) setCurrentAdmin(null);
    };
    window.addEventListener('admin:unauthorized', onUnauthorized);

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      window.removeEventListener('admin:unauthorized', onUnauthorized);
    };
  }, []);

  const toastTimerRef = useRef<any>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToasts((prev) => {
      // If the exact same message is already showing, prevent duplication
      if (prev.length > 0 && prev[0].message === message) {
        return prev;
      }
      // Keep only one active notification at a time
      return [{
        id: 'toast-' + Date.now(),
        type,
        message,
      }];
    });

    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = setTimeout(() => {
      setToasts([]);
    }, 3500);
  };

  const loadData = async () => {
    if (!currentAdmin) return;
    setIsRefreshing(true);
    try {
      const res = await moderationService.initialize();
      setIsLive(res.isLive);
      setPendingCount(moderationService.getStats().pending);
    } catch (e) {
      console.error(e);
      showToast('ไม่สามารถเชื่อมต่อฐานข้อมูลได้', 'error');
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (currentAdmin) {
      loadData();
    }
  }, [currentAdmin]);

  const handleLogout = async () => {
    if (confirm('คุณแน่ใจหรือไม่ว่าต้องการออกจากระบบ?')) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.error('Sign out error:', err);
      }
      localStorage.removeItem('kinraidee_admin_auth');
      sessionStorage.removeItem('kinraidee_admin_auth');
      sessionStorage.setItem('kinraidee_admin_logged_out', 'true');
      setCurrentAdmin(null);
      showToast('ออกจากระบบเรียบร้อยแล้ว', 'info');
    }
  };

  // If verifying active session on load
  if (isVerifyingAuth) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb' }}>
        <div style={{ textAlign: 'center', color: '#6b7280' }}>
          <div className="animate-spin" style={{ width: 32, height: 32, border: '3px solid #e5e7eb', borderTopColor: '#f97316', borderRadius: '50%', margin: '0 auto 12px' }} />
          <p style={{ fontSize: 14 }}>กำลังตรวจสอบสิทธิ์การเข้าใช้งาน...</p>
        </div>
      </div>
    );
  }

  // If not logged in, render LoginPage
  if (!currentAdmin) {
    return (
      <>
        <LoginPage 
          onLoginSuccess={(admin) => {
            sessionStorage.removeItem('kinraidee_admin_logged_out');
            setCurrentAdmin(admin);
            showToast(`ยินดีต้อนรับ ${admin.name}`, 'success');
          }} 
          onShowToast={showToast} 
        />
        <ToastContainer toasts={toasts} onDismiss={(id) => setToasts(prev => prev.filter(t => t.id !== id))} />
      </>
    );
  }

  return (
    <AdminLayout
      currentTab={currentTab}
      onSelectTab={setCurrentTab}
      pendingReportsCount={pendingCount}
      isLive={isLive}
      onRefreshData={() => {
        loadData();
        showToast('รีเฟรชข้อมูลเรียบร้อยแล้ว', 'success');
      }}
      isRefreshing={isRefreshing}
      toasts={toasts}
      onDismissToast={(id) => setToasts(prev => prev.filter(t => t.id !== id))}
      currentAdmin={currentAdmin}
      onLogout={handleLogout}
    >
      {/* 1. Moderation Queue (Reports) */}
      {currentTab === 'moderation' && (
        <ModerationQueuePage 
          onShowToast={(msg, type) => {
            showToast(msg, type);
            setPendingCount(moderationService.getStats().pending);
          }}
        />
      )}

      {/* 2. Content Management (Posts & Inline Comments) */}
      {currentTab === 'posts' && (
        <PostsPage onShowToast={showToast} />
      )}

      {/* 3. Users Management */}
      {currentTab === 'users' && (
        <UsersPage onShowToast={showToast} />
      )}

      {/* 4. Audit Trail */}
      {currentTab === 'audit' && (
        <AuditLogsPage onShowToast={showToast} />
      )}
    </AdminLayout>
  );
}

export default App;
