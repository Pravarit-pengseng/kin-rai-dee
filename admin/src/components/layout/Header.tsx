import React from 'react';
import { Search, ChevronRight } from 'lucide-react';
import { NavTab } from './Sidebar';

interface HeaderProps {
  currentTab: NavTab;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  pendingCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  searchQuery,
  onSearchChange,
}) => {
  const titles: Record<NavTab, { title: string; breadcrumb: string }> = {
    overview: { title: 'ภาพรวม', breadcrumb: 'ภาพรวม' },
    moderation: { title: 'รายงาน', breadcrumb: 'รายงาน' },
    posts: { title: 'จัดการเนื้อหา', breadcrumb: 'เนื้อหา' },
    users: { title: 'จัดการสมาชิก', breadcrumb: 'สมาชิก' },
    audit: { title: 'ประวัติการทำงาน', breadcrumb: 'ประวัติการทำงาน' },
    settings: { title: 'ตั้งค่าระบบและกฎชุมชน', breadcrumb: 'ตั้งค่า' },
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

      {/* Search Bar */}
      <div className="header-right">
        <div className="header-search">
          <Search size={13} className="header-search-icon" />
          <input 
            type="text" 
            placeholder="ค้นหา ID, ผู้ใช้, ข้อความ..." 
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>
    </header>
  );
};
