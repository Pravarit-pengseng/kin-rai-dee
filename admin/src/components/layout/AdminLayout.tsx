import React, { useState } from 'react';
import { Sidebar, NavTab } from './Sidebar';
import { Header } from './Header';
import { ToastContainer, ToastMessage } from '../common/Toast';

interface AdminLayoutProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  pendingReportsCount: number;
  isLive: boolean;
  onRefreshData: () => void;
  isRefreshing: boolean;
  toasts: ToastMessage[];
  onDismissToast: (id: string) => void;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentTab,
  onSelectTab,
  pendingReportsCount,
  toasts,
  onDismissToast,
  children
}) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <Sidebar 
        currentTab={currentTab}
        onSelectTab={onSelectTab}
        pendingReportsCount={pendingReportsCount}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
      />

      {/* Main Area */}
      <div className="main-wrapper">
        <Header 
          currentTab={currentTab}
          pendingCount={pendingReportsCount}
        />

        <main className="page-content">
          {children}
        </main>
      </div>

      {/* Toast Notification Layer */}
      <ToastContainer toasts={toasts} onDismiss={onDismissToast} />
    </div>
  );
};
