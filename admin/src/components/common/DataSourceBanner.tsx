import React from 'react';
import { Database, RefreshCw, CheckCircle2, ShieldCheck } from 'lucide-react';
import { SUPABASE_CONNECTED_URL } from '../../services/supabaseClient';

interface DataSourceBannerProps {
  isLive: boolean;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export const DataSourceBanner: React.FC<DataSourceBannerProps> = ({ isLive, onRefresh, isRefreshing }) => {
  return (
    <div className="datasource-banner">
      <div className="datasource-info">
        <div className="datasource-pulse" />
        <div>
          <div className="datasource-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Database size={15} color="#2563eb" />
            <span>เชื่อมต่อกับระบบจริง: Supabase Project (Kin-Rai-Dee)</span>
            <span className="badge badge-live" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <CheckCircle2 size={12} />
              {isLive ? 'Online / ฐานข้อมูลหลัก' : 'Local Fallback State'}
            </span>
          </div>
          <div className="datasource-desc">
            ปลายทาง: <code>{SUPABASE_CONNECTED_URL}</code> — ดึงข้อมูลเนื้อหาจริงจากตาราง <code>posts</code>, <code>comments</code>, <code>profiles</code> และผูกเข้ากับคิวตรวจสอบแบบเรียลไทม์
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button 
          className="btn btn-outline btn-sm" 
          onClick={onRefresh}
          disabled={isRefreshing}
          title="โหลดข้อมูลใหม่จากเซิร์ฟเวอร์"
        >
          <RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
          <span>รีเฟรชข้อมูล</span>
        </button>
      </div>
    </div>
  );
};
