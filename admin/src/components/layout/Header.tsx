import React from 'react';
import { ChevronRight } from 'lucide-react';
import { NavTab } from './Sidebar';

interface HeaderProps {
  currentTab: NavTab;
  pendingCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
}) => {
  const titles: Record<NavTab, { title: string; breadcrumb: string }> = {
    moderation: { title: 'รายงาน', breadcrumb: 'รายงาน' },
    posts: { title: 'จัดการเนื้อหา', breadcrumb: 'เนื้อหา' },
    users: { title: 'จัดการสมาชิก', breadcrumb: 'สมาชิก' },
    audit: { title: 'ประวัติการทำงาน', breadcrumb: 'ประวัติการทำงาน' },
  };

  const currentMeta = titles[currentTab] || { title: 'รายงาน', breadcrumb: 'รายงาน' };

  return (
    <header className="top-header">
      {/* Title & Breadcrumb */}
      <div className="header-left">
        <div>
          <div className="header-page-title">{currentMeta.title}</div>
          <div className="header-breadcrumb">
            <span>ผู้ดูแลระบบ</span>
            <ChevronRight size={12} />
            <span>{currentMeta.breadcrumb}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
