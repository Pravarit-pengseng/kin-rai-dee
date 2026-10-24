import React, { useState, useEffect } from 'react';
import { History, Search, RefreshCw, FileText } from 'lucide-react';
import { moderationService } from '../services/moderationService';
import { AuditLogItem } from '../types/moderation';

interface AuditLogsPageProps {
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const AuditLogsPage: React.FC<AuditLogsPageProps> = ({ onShowToast }) => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');

  const fetchLogs = () => {
    setLogs(moderationService.getAuditLogs());
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getActionBadge = (actionType: string) => {
    if (actionType.includes('REMOVE')) {
      return <span className="badge badge-priority-urgent">ลบเนื้อหา</span>;
    }
    if (actionType.includes('HIDE')) {
      return <span className="badge badge-pending">ซ่อนเนื้อหา</span>;
    }
    if (actionType.includes('RESTRICT')) {
      return <span className="badge badge-priority-urgent">ระงับบัญชี</span>;
    }
    if (actionType.includes('WARN')) {
      return <span className="badge badge-priority-high">ตักเตือนผู้ใช้</span>;
    }
    if (actionType.includes('KEEP')) {
      return <span className="badge badge-action_taken">คงเนื้อหาไว้</span>;
    }
    if (actionType.includes('ESCALATE')) {
      return <span className="badge badge-in_review">ส่งต่อผู้ดูแล</span>;
    }
    if (actionType.includes('ASSIGN')) {
      return <span className="badge badge-content-type">มอบหมายงาน</span>;
    }
    return <span className="badge">{actionType}</span>;
  };

  const filteredLogs = logs.filter(log => {
    const q = search.toLowerCase();
    const matchSearch = !search ||
      log.actorName.toLowerCase().includes(q) ||
      log.actionType.toLowerCase().includes(q) ||
      String(log.targetId).includes(q) ||
      (log.note && log.note.toLowerCase().includes(q));

    if (actionFilter === 'all') return matchSearch;
    return matchSearch && log.actionType.toLowerCase().includes(actionFilter.toLowerCase());
  });

  return (
    <div>
      {/* Filter and Search Bar */}
      <div className="filter-card">
        <div className="filter-row">
          <input 
            type="text"
            className="search-input-field"
            placeholder="ค้นหาผู้ดำเนินการ, รหัสเป้าหมาย, บันทึก..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="filter-input-group">
            <span style={{ color: '#667085', fontSize: '12px' }}>กิจกรรม:</span>
            <select 
              className="filter-select"
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
            >
              <option value="all">ทุกกิจกรรม</option>
              <option value="REMOVE">ลบเนื้อหา</option>
              <option value="HIDE">ซ่อนเนื้อหา</option>
              <option value="RESTRICT">ระงับบัญชี</option>
              <option value="KEEP">คงเนื้อหาไว้</option>
            </select>
          </div>

          <button 
            className="btn btn-outline btn-sm"
            onClick={() => {
              fetchLogs();
              onShowToast('อัปเดตประวัติการทำงานแล้ว', 'success');
            }}
          >
            <RefreshCw size={12} />
            <span>รีเฟรช</span>
          </button>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="table-card">
        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '150px' }}>วันและเวลา</th>
                <th style={{ width: '150px' }}>ผู้ดำเนินการ</th>
                <th style={{ width: '120px' }}>การกระทำ</th>
                <th style={{ width: '130px' }}>เป้าหมาย</th>
                <th style={{ width: '140px' }}>เหตุผล</th>
                <th>บันทึกรายละเอียด</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '48px 16px', color: '#667085' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <History size={28} color="#98a2b3" />
                      <span style={{ fontSize: '14px', fontWeight: 600, color: '#101828' }}>
                        ยังไม่มีประวัติการทำงานในระบบ
                      </span>
                      <span style={{ fontSize: '12px' }}>
                        เมื่อแอดมินดำเนินการตรวจสอบ ซ่อน ลบ หรือระงับบัญชี ประวัติจะถูกบันทึกที่นี่โดยอัตโนมัติ
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id}>
                    {/* Timestamp */}
                    <td style={{ fontSize: '12px', color: '#667085', whiteSpace: 'nowrap' }}>
                      {new Date(log.timestamp).toLocaleString('th-TH')}
                    </td>

                    {/* Actor */}
                    <td>
                      <span style={{ fontWeight: 600, color: '#101828' }}>
                        {log.actorName}
                      </span>
                    </td>

                    {/* Action Badge */}
                    <td>
                      {getActionBadge(log.actionType)}
                    </td>

                    {/* Target */}
                    <td>
                      <span className="badge badge-content-type">
                        {log.targetType === 'post' ? 'โพสต์' : log.targetType === 'comment' ? 'ความคิดเห็น' : log.targetType} #{log.targetId}
                      </span>
                    </td>

                    {/* Reason */}
                    <td style={{ fontSize: '12px', color: '#344054' }}>
                      {log.reasonCode || '-'}
                    </td>

                    {/* Note / Details */}
                    <td style={{ fontSize: '12px', color: '#475467' }}>
                      {log.note || '-'}
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
