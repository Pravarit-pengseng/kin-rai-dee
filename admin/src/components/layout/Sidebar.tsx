import React from 'react';
import {
  Flag,
  FileText,
  Users,
  History,
  ChevronLeft,
  ChevronRight,
  LogOut
} from 'lucide-react';

import { AdminUser } from '../../pages/LoginPage';

export type NavTab =
  | 'moderation'
  | 'posts'
  | 'users'
  | 'audit';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  pendingReportsCount: number;
  collapsed: boolean;
  onToggleCollapse: () => void;
  currentAdmin?: AdminUser | null;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  pendingReportsCount,
  collapsed,
  onToggleCollapse,
  currentAdmin,
  onLogout
}) => {
  const navItems: { id: NavTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    {
      id: 'moderation',
      label: 'รายงาน',
      icon: <Flag size={17} />,
      badge: pendingReportsCount > 0 ? pendingReportsCount : undefined
    },
    { id: 'posts', label: 'จัดการเนื้อหา', icon: <FileText size={17} /> },
    { id: 'users', label: 'สมาชิก', icon: <Users size={17} /> },
    { id: 'audit', label: 'ประวัติการทำงาน', icon: <History size={17} /> },
  ];

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Brand Header */}
      <div className="sidebar-header">
        {!collapsed && (
          <div className="brand-wrapper">
            <div className="brand-info">
              <span className="brand-title">KIN RAI DEE</span>
              <span className="brand-subtitle">ระบบจัดการผู้ดูแล</span>
            </div>
          </div>
        )}
        <button
          className="sidebar-toggle-btn"
          onClick={onToggleCollapse}
          title={collapsed ? 'ขยายแถบเมนู' : 'ย่อแถบเมนู'}
        >
          {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
        </button>
      </div>

      {/* Navigation List */}
      <nav className="sidebar-nav">
        {navItems.map(item => {
          const isActive = currentTab === item.id;
          return (
            <div
              key={item.id}
              className={`nav-link ${isActive ? 'active' : ''}`}
              onClick={() => onSelectTab(item.id)}
              title={collapsed ? item.label : undefined}
            >
              <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                {item.icon}
              </span>
              {!collapsed && (
                <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.label}
                </span>
              )}
              {item.badge !== undefined && !collapsed && (
                <span className="nav-badge">{item.badge}</span>
              )}
            </div>
          );
        })}
      </nav>

      {/* Admin Profile Footer */}
      <div className="sidebar-footer">
        <div className="admin-profile">
          <div className="admin-avatar">
            {((currentAdmin?.name || 'A').charAt(0)).toUpperCase()}
          </div>
          {!collapsed && (
            <div className="admin-details">
              <span className="admin-name">{currentAdmin?.name || 'ผู้ดูแลระบบ'}</span>
              <span className="admin-role">{currentAdmin?.role || 'Super Admin'}</span>
            </div>
          )}
        </div>
        {!collapsed && (
          <button
            className="sidebar-toggle-btn"
            title="ออกจากระบบ"
            onClick={onLogout}
          >
            <LogOut size={15} />
          </button>
        )}
      </div>
    </aside>
  );
};
