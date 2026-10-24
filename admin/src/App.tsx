import React, { useState, useEffect } from 'react';
import { AdminLayout } from './components/layout/AdminLayout';
import { NavTab } from './components/layout/Sidebar';
import { ModerationQueuePage } from './pages/ModerationQueuePage';
import { OverviewPage } from './pages/OverviewPage';
import { PostsPage } from './pages/PostsPage';
import { UsersPage } from './pages/UsersPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { SettingsPage } from './pages/SettingsPage';
import { moderationService } from './services/moderationService';
import { ToastMessage } from './components/common/Toast';
import { ModerationReport } from './types/moderation';
import { ModerationDetailDrawer } from './components/moderation/ModerationDetailDrawer';

export function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('moderation');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLive, setIsLive] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [pendingCount, setPendingCount] = useState(0);

  const [inspectReport, setInspectReport] = useState<ModerationReport | null>(null);
  const [isInspectDrawerOpen, setIsInspectDrawerOpen] = useState(false);

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
    loadData();
  }, []);

  const handleOpenReportFromOverview = (report: ModerationReport) => {
    setInspectReport(report);
    setIsInspectDrawerOpen(true);
  };

  return (
    <AdminLayout
      currentTab={currentTab}
      onSelectTab={setCurrentTab}
      pendingReportsCount={pendingCount}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      isLive={isLive}
      onRefreshData={() => {
        loadData();
        showToast('รีเฟรชข้อมูลเรียบร้อยแล้ว', 'success');
      }}
      isRefreshing={isRefreshing}
      toasts={toasts}
      onDismissToast={(id) => setToasts(prev => prev.filter(t => t.id !== id))}
    >
      {/* 1. Overview */}
      {currentTab === 'overview' && (
        <OverviewPage 
          onNavigateToModeration={() => setCurrentTab('moderation')}
          onOpenReport={handleOpenReportFromOverview}
        />
      )}

      {/* 2. Moderation Queue */}
      {currentTab === 'moderation' && (
        <ModerationQueuePage 
          searchQuery={searchQuery}
          onShowToast={showToast}
        />
      )}

      {/* 3. Content Management (Posts & Inline Comments) */}
      {currentTab === 'posts' && (
        <PostsPage onShowToast={showToast} />
      )}

      {/* 5. Users Management */}
      {currentTab === 'users' && (
        <UsersPage onShowToast={showToast} />
      )}

      {/* 7. Audit Trail */}
      {currentTab === 'audit' && (
        <AuditLogsPage onShowToast={showToast} />
      )}

      {/* 8. Settings & Rules */}
      {currentTab === 'settings' && (
        <SettingsPage onShowToast={showToast} />
      )}

      {/* Inspection drawer */}
      <ModerationDetailDrawer 
        report={inspectReport}
        isOpen={isInspectDrawerOpen}
        onClose={() => setIsInspectDrawerOpen(false)}
        onActionComplete={(msg) => {
          showToast(msg, 'success');
          setPendingCount(moderationService.getStats().pending);
        }}
      />
    </AdminLayout>
  );
}

export default App;
