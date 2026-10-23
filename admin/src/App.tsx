import React, { useState, useEffect } from 'react';
import { AdminLayout } from './components/layout/AdminLayout';
import { NavTab } from './components/layout/Sidebar';
import { ModerationQueuePage } from './pages/ModerationQueuePage';
import { PostsPage } from './pages/PostsPage';
import { UsersPage } from './pages/UsersPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { LoginPage, AdminUser } from './pages/LoginPage';
import { moderationService } from './services/moderationService';
import { ToastContainer, ToastMessage } from './components/common/Toast';

export function App() {
  const [currentAdmin, setCurrentAdmin] = useState<AdminUser | null>(() => {
    try {
      const saved = localStorage.getItem('kinraidee_admin_auth') || sessionStorage.getItem('kinraidee_admin_auth');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [currentTab, setCurrentTab] = useState<NavTab>('moderation');
  const [isLive, setIsLive] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [pendingCount, setPendingCount] = useState(0);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const newToast: ToastMessage = {
      id: 'toast-' + Date.now() + Math.random(),
      type,
      message,
    };
    setToasts(prev => [...prev, newToast]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== newToast.id));
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

  const handleLogout = () => {
    if (confirm('คุณแน่ใจหรือไม่ว่าต้องการออกจากระบบ?')) {
      localStorage.removeItem('kinraidee_admin_auth');
      sessionStorage.removeItem('kinraidee_admin_auth');
      setCurrentAdmin(null);
      showToast('ออกจากระบบเรียบร้อยแล้ว', 'info');
    }
  };

  // If not logged in, render LoginPage
  if (!currentAdmin) {
    return (
      <>
        <LoginPage 
          onLoginSuccess={(admin) => {
            setCurrentAdmin(admin);
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
