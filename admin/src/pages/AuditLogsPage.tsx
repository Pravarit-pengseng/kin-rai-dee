import React, { useState, useEffect } from 'react';
import { 
  History, 
  RefreshCw, 
  User, 
  FileText, 
  MessageSquare, 
  Flag,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter
} from 'lucide-react';
import { COMMUNITY_RULES } from '../services/moderationService';
import { adminApi } from '../services/adminApi';
import { supabase } from '../services/supabaseClient';
import { AuditLogItem } from '../types/moderation';

interface AuditLogsPageProps {
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const AuditLogsPage: React.FC<AuditLogsPageProps> = ({ onShowToast }) => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [targetTypeFilter, setTargetTypeFilter] = useState<string>('all');
  const [loading, setLoading] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      try {
        const res = await adminApi.getAuditLogs(200);
        setLogs(res.data || []);
        return true;
      } catch (apiErr) {
        console.warn('API getAuditLogs failed, falling back to direct Supabase:', apiErr);
        const { data, error } = await supabase
          .from('audit_logs')
          .select('id, created_at, actor_id, actor_name, event_type, target_type, target_id, metadata')
          .order('created_at', { ascending: false })
          .limit(200);
        if (error) throw error;

        // Enrich profiles for user targets
        const userIds = (data || [])
          .filter((l: any) => l.target_type === 'user' && l.target_id && String(l.target_id) !== '0')
          .map((l: any) => String(l.target_id));
        
        let profMap: Record<string, any> = {};
        if (userIds.length > 0) {
          try {
            const { data: profData } = await supabase
              .from('profiles')
              .select('id, username, display_name')
              .in('id', userIds);
            (profData || []).forEach((p: any) => {
              profMap[p.id] = p;
            });
          } catch (pe) {
            console.warn('Enrich profiles error:', pe);
          }
        }

        const mapped: AuditLogItem[] = (data || []).map((l: any) => {
          const tId = String(l.target_id || '');
          const tType = l.target_type || 'content';
          let tName: string | undefined = undefined;

          if (tType === 'user') {
            const u = profMap[tId];
            const dName = u?.display_name || l.metadata?.display_name || l.metadata?.user_name;
            const uName = u?.username || l.metadata?.username;
            if (uName && dName) {
              tName = `${dName} (@${uName})`;
            } else if (uName) {
              tName = `@${uName}`;
            } else if (dName) {
              tName = dName;
            }
          }

          return {
            id: String(l.id),
            timestamp: l.created_at,
            actorId: String(l.actor_id || 'admin'),
            actorName: l.actor_name || 'ผู้ดูแลระบบ',
            actionType: l.event_type || 'MODERATION',
            targetType: tType,
            targetId: tId,
            targetName: tName,
            reasonCode: l.metadata?.action || l.metadata?.reason || 'MODERATION',
            note: l.metadata?.note || '',
            metadata: l.metadata || {},
          };
        });

        setLogs(mapped);
        return true;
      }
    } catch (err: any) {
      console.warn('AuditLogs load failed:', err);
      onShowToast(`โหลดประวัติไม่สำเร็จ: ${err.message}`, 'error');
      setLogs([]);
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getReasonDisplay = (reasonCode?: string) => {
    if (!reasonCode) return '-';
    const rule = COMMUNITY_RULES.find(r => r.code === reasonCode);
    return rule ? rule.name : reasonCode;
  };

  const getActionBadge = (actionType: string) => {
    if (actionType.includes('REMOVE') || actionType.includes('DELETE')) {
      return <span className="badge badge-priority-urgent">ลบเนื้อหา</span>;
    }
    if (actionType.includes('HIDE')) {
      return <span className="badge badge-pending">ซ่อนเนื้อหา</span>;
    }
    if (actionType.includes('UNHIDE')) {
      return <span className="badge badge-action_taken">ยกเลิกการซ่อน</span>;
    }
    if (actionType.includes('RESTRICT') || actionType.includes('SUSPEND')) {
      return <span className="badge badge-priority-urgent">ระงับบัญชี</span>;
    }
    if (actionType.includes('ACTIVATE')) {
      return <span className="badge badge-action_taken">ปลดการระงับ</span>;
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

  const renderTarget = (log: AuditLogItem) => {
    const tType = String(log.targetType || '').toLowerCase();
    const tId = String(log.targetId || '');

    if (tType === 'user') {
      const isUuid = tId.length > 15;
      const shortUuid = isUuid ? `${tId.substring(0, 8)}...` : tId;
      const displayName = log.targetName || (isUuid ? `@${shortUuid}` : (tId === '0' ? 'ผู้ใช้งาน' : `#${tId}`));

      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span 
            className="badge badge-content-type" 
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '5px',
              backgroundColor: '#eff8ff',
              color: '#175cd3',
              borderColor: '#b2ddff',
              fontWeight: 600
            }}
            title={isUuid ? `User ID: ${tId}` : undefined}
          >
            <User size={12} />
            <span>ผู้ใช้: {displayName}</span>
          </span>
          {isUuid && (
            <span style={{ fontSize: '10.5px', color: '#98a2b3', fontFamily: 'monospace', paddingLeft: '4px' }}>
              UUID: {shortUuid}
            </span>
          )}
        </div>
      );
    }

    if (tType === 'comment') {
      const parentPostId = log.metadata?.post_id;
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span 
            className="badge badge-content-type" 
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '5px',
              backgroundColor: '#ecfdf3',
              color: '#027a48',
              borderColor: '#a6f4c5',
              fontWeight: 600
            }}
          >
            <MessageSquare size={12} />
            <span>ความคิดเห็น #{tId}</span>
          </span>
          {parentPostId && (
            <span style={{ fontSize: '10.5px', color: '#667085', paddingLeft: '4px' }}>
              (บนโพสต์ #{parentPostId})
            </span>
          )}
        </div>
      );
    }

    if (tType === 'post') {
      return (
        <span 
          className="badge badge-content-type" 
          style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '5px',
            backgroundColor: '#fdf2fa',
            color: '#c11574',
            borderColor: '#fce7f6',
            fontWeight: 600
          }}
        >
          <FileText size={12} />
          <span>โพสต์ #{tId}</span>
        </span>
      );
    }

    if (tType === 'report') {
      return (
        <span className="badge badge-pending" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
          <Flag size={12} />
          <span>รายงาน #{tId}</span>
        </span>
      );
    }

    return (
      <span className="badge badge-content-type">
        {log.targetType} #{tId}
      </span>
    );
  };

  // Filter logs
  const filteredLogs = logs.filter(log => {
    const q = search.toLowerCase();
    const reasonText = getReasonDisplay(log.reasonCode).toLowerCase();
    const matchSearch = !search ||
      log.actorName.toLowerCase().includes(q) ||
      log.actionType.toLowerCase().includes(q) ||
      String(log.targetId).toLowerCase().includes(q) ||
      (log.targetName && log.targetName.toLowerCase().includes(q)) ||
      (log.note && log.note.toLowerCase().includes(q)) ||
      (log.reasonCode && log.reasonCode.toLowerCase().includes(q)) ||
      reasonText.includes(q);

    const matchAction = actionFilter === 'all' || log.actionType.toLowerCase().includes(actionFilter.toLowerCase());
    const matchTarget = targetTypeFilter === 'all' || String(log.targetType).toLowerCase() === targetTypeFilter.toLowerCase();

    return matchSearch && matchAction && matchTarget;
  });

  // Pagination calculation
  const totalItems = filteredLogs.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const paginatedLogs = filteredLogs.slice(startIndex, startIndex + pageSize);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div>
      {/* Filter and Search Bar */}
      <div className="filter-card">
        <div className="filter-row" style={{ flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ position: 'relative', flex: '1 1 240px' }}>
            <Search size={14} color="#98a2b3" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text"
              className="search-input-field"
              style={{ paddingLeft: '32px', width: '100%' }}
              placeholder="ค้นหาชื่อผู้ดำเนินการ, รหัสเป้าหมาย, ชื่อผู้ใช้..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          <div className="filter-input-group">
            <span style={{ color: '#667085', fontSize: '12px' }}>ประเภทเป้าหมาย:</span>
            <select 
              className="filter-select"
              value={targetTypeFilter}
              onChange={(e) => {
                setTargetTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">ทั้งหมด</option>
              <option value="user">ผู้ใช้ (User)</option>
              <option value="post">โพสต์ (Post)</option>
              <option value="comment">ความคิดเห็น (Comment)</option>
              <option value="report">รายงาน (Report)</option>
            </select>
          </div>

          <div className="filter-input-group">
            <span style={{ color: '#667085', fontSize: '12px' }}>การกระทำ:</span>
            <select 
              className="filter-select"
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">ทุกกิจกรรม</option>
              <option value="REMOVE">ลบเนื้อหา</option>
              <option value="HIDE">ซ่อนเนื้อหา</option>
              <option value="UNHIDE">ยกเลิกซ่อน</option>
              <option value="SUSPEND">ระงับบัญชี</option>
              <option value="ACTIVATE">ปลดการระงับ</option>
              <option value="KEEP">คงเนื้อหาไว้</option>
            </select>
          </div>

          <button 
            className="btn btn-outline btn-sm"
            onClick={async () => {
              const ok = await fetchLogs();
              if (ok) onShowToast('อัปเดตประวัติการทำงานแล้ว', 'success');
            }}
            disabled={loading}
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
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
                <th style={{ width: '170px' }}>วันและเวลา</th>
                <th style={{ width: '160px' }}>ผู้ดำเนินการ</th>
                <th style={{ width: '130px' }}>การกระทำ</th>
                <th style={{ width: '220px' }}>เป้าหมาย</th>
                <th>เหตุผล / รายละเอียด</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '36px', color: '#667085' }}>
                    กำลังโหลดข้อมูลประวัติการทำงาน...
                  </td>
                </tr>
              ) : paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '48px 16px', color: '#667085' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <History size={28} color="#98a2b3" />
                      <span style={{ fontSize: '14px', fontWeight: 600, color: '#101828' }}>
                        {search || actionFilter !== 'all' || targetTypeFilter !== 'all' 
                          ? 'ไม่พบประวัติการทำงานที่ตรงกับเงื่อนไขการค้นหา' 
                          : 'ยังไม่มีประวัติการทำงานในระบบ'}
                      </span>
                      <span style={{ fontSize: '12px' }}>
                        เมื่อแอดมินดำเนินการตรวจสอบ ซ่อน ลบ หรือระงับบัญชี ประวัติจะถูกบันทึกที่นี่โดยอัตโนมัติ
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedLogs.map(log => (
                  <tr key={log.id}>
                    {/* Timestamp */}
                    <td style={{ fontSize: '12px', color: '#667085', whiteSpace: 'nowrap' }}>
                      {new Date(log.timestamp).toLocaleString('th-TH')}
                    </td>

                    {/* Actor */}
                    <td>
                      <span style={{ fontWeight: 600, color: '#101828', fontSize: '12.5px' }}>
                        {log.actorName}
                      </span>
                    </td>

                    {/* Action Badge */}
                    <td>
                      {getActionBadge(log.actionType)}
                    </td>

                    {/* Target */}
                    <td>
                      {renderTarget(log)}
                    </td>

                    {/* Reason */}
                    <td style={{ fontSize: '12.5px', color: '#344054' }}>
                      <div style={{ fontWeight: 500 }}>
                        {getReasonDisplay(log.reasonCode)}
                      </div>
                      {log.note && (
                        <div style={{ fontSize: '11px', color: '#667085', marginTop: '2px' }}>
                          {log.note}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalItems > 0 && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            padding: '12px 16px', 
            borderTop: '1px solid #eaecf0',
            fontSize: '12.5px',
            color: '#475467',
            flexWrap: 'wrap',
            gap: '8px'
          }}>
            <div>
              แสดง <strong>{startIndex + 1}</strong> ถึง <strong>{Math.min(startIndex + pageSize, totalItems)}</strong> จากทั้งหมด <strong>{totalItems}</strong> รายการ
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '12px', color: '#667085' }}>จำนวนต่อหน้า:</span>
                <select 
                  className="filter-select"
                  style={{ padding: '4px 8px', fontSize: '12px', height: '28px' }}
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                >
                  <option value={10}>10</option>
                  <option value={15}>15</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <button 
                  className="btn btn-outline btn-sm"
                  style={{ padding: '4px 8px', height: '28px' }}
                  onClick={() => handlePageChange(safeCurrentPage - 1)}
                  disabled={safeCurrentPage <= 1}
                  title="หน้าก่อนหน้า"
                >
                  <ChevronLeft size={14} />
                  <span>ก่อนหน้า</span>
                </button>

                <span style={{ padding: '0 8px', fontWeight: 600, color: '#101828' }}>
                  {safeCurrentPage} / {totalPages}
                </span>

                <button 
                  className="btn btn-outline btn-sm"
                  style={{ padding: '4px 8px', height: '28px' }}
                  onClick={() => handlePageChange(safeCurrentPage + 1)}
                  disabled={safeCurrentPage >= totalPages}
                  title="หน้าถัดไป"
                >
                  <span>ถัดไป</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
