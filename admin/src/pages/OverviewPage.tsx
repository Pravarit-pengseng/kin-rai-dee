import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Clock, 
  CheckCircle, 
  Users, 
  ArrowRight
} from 'lucide-react';
import { moderationService } from '../services/moderationService';
import { ModerationReport } from '../types/moderation';
import { Badge } from '../components/common/Badge';

interface OverviewPageProps {
  onNavigateToModeration: () => void;
  onOpenReport: (report: ModerationReport) => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  onNavigateToModeration,
  onOpenReport
}) => {
  const [reports, setReports] = useState<ModerationReport[]>([]);
  const stats = moderationService.getStats();

  useEffect(() => {
    setReports(moderationService.getReports().slice(0, 6));
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Summary KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-header">
            <span>รอตรวจสอบ</span>
            <Clock size={15} color="#dc6803" />
          </div>
          <div className="kpi-value" style={{ color: '#b54708' }}>{stats.pending}</div>
          <div className="kpi-footer">ต้องการตรวจสอบโดยด่วน</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span>เร่งด่วน</span>
            <ShieldAlert size={15} color="#d92d20" />
          </div>
          <div className="kpi-value" style={{ color: '#b42318' }}>{stats.highPriority}</div>
          <div className="kpi-footer">รายงานซ้ำหรือสำคัญสูง</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span>ดำเนินการแล้ววันนี้</span>
            <CheckCircle size={15} color="#079455" />
          </div>
          <div className="kpi-value" style={{ color: '#027a48' }}>{stats.actionTaken}</div>
          <div className="kpi-footer">จัดการเคสเรียบร้อยแล้ว</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span>สมาชิกในระบบ</span>
            <Users size={15} color="#2563eb" />
          </div>
          <div className="kpi-value" style={{ color: '#101828' }}>5 บัญชี</div>
          <div className="kpi-footer">บัญชีผู้ใช้ทั้งหมด</div>
        </div>
      </div>

      {/* Recent Reports Section (Full Width) */}
      <div className="table-card">
        <div style={{ padding: '14px 16px', borderBottom: '1px solid #eaecf0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 600, color: '#101828', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldAlert size={15} color="#d92d20" />
            <span>รายงานล่าสุดที่รอตรวจสอบ</span>
          </h3>
          <button className="btn btn-outline btn-sm" onClick={onNavigateToModeration}>
            <span>ดูรายงานทั้งหมด</span>
            <ArrowRight size={12} />
          </button>
        </div>

        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '100px' }}>รหัส</th>
                <th style={{ width: '90px' }}>ประเภท</th>
                <th>เนื้อหา</th>
                <th>ผู้โพสต์</th>
                <th>หัวข้อที่รายงาน</th>
                <th style={{ width: '100px' }}>ความสำคัญ</th>
                <th style={{ width: '110px' }}>สถานะ</th>
                <th style={{ width: '90px', textAlign: 'right' }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {reports.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: '#667085' }}>
                    ไม่มีรายงานที่รอดำเนินการในขณะนี้
                  </td>
                </tr>
              ) : (
                reports.map(r => (
                  <tr key={r.id}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 600, color: '#101828' }}>{r.id}</td>
                    <td><Badge type="content" value={r.targetType} /></td>
                    <td style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.targetContent.title || r.targetContent.text}
                    </td>
                    <td>
                      <span style={{ fontWeight: 500 }}>{r.targetContent.author.displayName}</span>
                    </td>
                    <td style={{ fontSize: '12px' }}>{r.reasonLabel}</td>
                    <td><Badge type="priority" value={r.priority} /></td>
                    <td><Badge type="status" value={r.status} /></td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn btn-outline btn-sm" onClick={() => onOpenReport(r)}>
                        ตรวจสอบ
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
