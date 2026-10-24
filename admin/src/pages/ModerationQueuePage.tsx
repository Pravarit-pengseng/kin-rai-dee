import React, { useState, useEffect } from 'react';
import { 
  RotateCcw, 
  CheckCircle, 
  Clock, 
  CheckCircle2, 
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Users
} from 'lucide-react';
import { 
  ModerationReport, 
  ContentType, 
  ReportStatus, 
  ReasonCode 
} from '../types/moderation';
import { Badge } from '../components/common/Badge';
import { ModerationDetailDrawer } from '../components/moderation/ModerationDetailDrawer';
import { 
  moderationService, 
  COMMUNITY_RULES 
} from '../services/moderationService';
import { supabase } from '../services/supabaseClient';

interface ModerationQueuePageProps {
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const ModerationQueuePage: React.FC<ModerationQueuePageProps> = ({
  onShowToast
}) => {
  // Search & Filters State
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<ReportStatus | 'all'>('pending');
  const [contentType, setContentType] = useState<ContentType | 'all'>('all');
  const [reasonFilter, setReasonFilter] = useState<ReasonCode | 'all'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Selected Report for Inspection
  const [selectedReport, setSelectedReport] = useState<ModerationReport | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Stats & Reports
  const [reports, setReports] = useState<ModerationReport[]>([]);
  const [stats, setStats] = useState(moderationService.getStats());
  const [userCount, setUserCount] = useState<number>(() => moderationService.getUserCount() || 5);

  useEffect(() => {
    const fetchUserCount = async () => {
      try {
        const { count, error } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });
        if (!error && typeof count === 'number') {
          setUserCount(count);
        }
      } catch (err) {
        console.warn('Failed to fetch user count from profiles:', err);
      }
    };
    fetchUserCount();
  }, []);

  const refreshData = () => {
    const list = moderationService.getReports({
      search,
      contentType,
      status: activeTab,
      reasonCode: reasonFilter,
      sortBy
    });
    setReports(list);
    setStats(moderationService.getStats());
  };

  useEffect(() => {
    refreshData();
    setCurrentPage(1);
  }, [search, activeTab, contentType, reasonFilter, sortBy]);

  const handleOpenReport = (report: ModerationReport) => {
    setSelectedReport(report);
    setIsDrawerOpen(true);
  };

  const handleActionCompleted = (msg: string) => {
    refreshData();
    onShowToast(msg, 'success');
  };

  const resetFilters = () => {
    setSearch('');
    setActiveTab('all');
    setContentType('all');
    setReasonFilter('all');
    setSortBy('newest');
  };

  // Pagination Slice
  const totalPages = Math.ceil(reports.length / pageSize) || 1;
  const paginatedReports = reports.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div>
      {/* Metrics / KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-header">
            <span>รอตรวจสอบ</span>
            <Clock size={15} color="#dc6803" />
          </div>
          <div className="kpi-value" style={{ color: '#b54708' }}>
            {stats.pending}
          </div>
          <div className="kpi-footer">รายงานที่ต้องจัดการ</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span>สมาชิกในระบบ</span>
            <Users size={15} color="#2563eb" />
          </div>
          <div className="kpi-value" style={{ color: '#101828' }}>
            {userCount} บัญชี
          </div>
          <div className="kpi-footer">บัญชีผู้ใช้ทั้งหมด</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span>ดำเนินการแล้ว</span>
            <CheckCircle size={15} color="#079455" />
          </div>
          <div className="kpi-value" style={{ color: '#027a48' }}>
            {stats.actionTaken}
          </div>
          <div className="kpi-footer">ซ่อน ลบ หรือระงับบัญชี</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span>ไม่พบการละเมิด</span>
            <CheckCircle2 size={15} color="#026aa2" />
          </div>
          <div className="kpi-value" style={{ color: '#026aa2' }}>
            {stats.dismissed}
          </div>
          <div className="kpi-footer">คงเนื้อหาตามปกติ</div>
        </div>
      </div>

      {/* Filter and Tab Section */}
      <div className="filter-card">
        {/* Status Tabs */}
        <div className="tab-group">
          <button 
            className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            <span>รอตรวจสอบ</span>
            {stats.pending > 0 && <span className="badge badge-pending">{stats.pending}</span>}
          </button>
          <button 
            className={`tab-btn ${activeTab === 'action_taken' ? 'active' : ''}`}
            onClick={() => setActiveTab('action_taken')}
          >
            <span>ดำเนินการแล้ว</span>
            {stats.actionTaken > 0 && <span className="badge badge-action_taken">{stats.actionTaken}</span>}
          </button>
          <button 
            className={`tab-btn ${activeTab === 'dismissed' ? 'active' : ''}`}
            onClick={() => setActiveTab('dismissed')}
          >
            <span>ไม่พบการละเมิด</span>
            {stats.dismissed > 0 && <span style={{ fontSize: '10px', background: '#f2f4f7', color: '#475467', padding: '1px 6px', borderRadius: '10px' }}>{stats.dismissed}</span>}
          </button>
          <button 
            className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            <span>ทั้งหมด ({stats.total})</span>
          </button>
        </div>

        {/* Multi-Filters Row */}
        <div className="filter-row" style={{ paddingTop: '6px' }}>
          <input 
            type="text"
            className="search-input-field"
            placeholder="ค้นหารหัสรายงาน, ผู้โพสต์, ข้อความ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {/* Content Type Filter */}
          <div className="filter-input-group">
            <span style={{ color: '#667085', fontSize: '12px' }}>ประเภท:</span>
            <select 
              className="filter-select"
              value={contentType}
              onChange={(e) => setContentType(e.target.value as any)}
            >
              <option value="all">ทุกประเภท</option>
              <option value="post">โพสต์</option>
              <option value="comment">ความคิดเห็น</option>
              <option value="user">ผู้ใช้</option>
            </select>
          </div>

          {/* Reason Filter */}
          <div className="filter-input-group">
            <span style={{ color: '#667085', fontSize: '12px' }}>เหตุผล:</span>
            <select 
              className="filter-select"
              value={reasonFilter}
              onChange={(e) => setReasonFilter(e.target.value as any)}
            >
              <option value="all">ทุกเหตุผล</option>
              {COMMUNITY_RULES.map(r => (
                <option key={r.code} value={r.code}>{r.name}</option>
              ))}
            </select>
          </div>

          {/* Sorting */}
          <div className="filter-input-group" style={{ marginLeft: 'auto' }}>
            <ArrowUpDown size={13} color="#667085" />
            <select 
              className="filter-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
            >
              <option value="newest">ล่าสุด</option>
              <option value="oldest">เก่าสุด</option>
            </select>

            <button 
              className="btn btn-outline btn-sm"
              onClick={resetFilters}
              title="ล้างตัวกรองทั้งหมด"
            >
              <RotateCcw size={11} />
              <span>ล้างตัวกรอง</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="table-card">
        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '135px' }}>รหัส</th>
                <th style={{ width: '80px' }}>ประเภท</th>
                <th>เนื้อหา</th>
                <th style={{ width: '130px' }}>ผู้โพสต์</th>
                <th style={{ width: '160px' }}>เหตุผลที่รายงาน</th>
                <th style={{ width: '110px' }}>สถานะ</th>
                <th style={{ width: '90px' }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {paginatedReports.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '48px 16px', color: '#667085' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <CheckCircle size={28} color="#079455" />
                      <span style={{ fontSize: '14px', fontWeight: 600, color: '#101828' }}>
                        ไม่มีรายการในหมวดหมู่นี้
                      </span>
                      <span style={{ fontSize: '12px' }}>
                        จัดการรายงานครบถ้วนแล้ว หรือไม่พบรายการตามตัวกรองที่เลือก
                      </span>
                      <button className="btn btn-outline btn-sm" onClick={resetFilters} style={{ marginTop: '6px' }}>
                        ล้างตัวกรอง
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedReports.map((report) => {
                  const content = report.targetContent;
                  return (
                    <tr 
                      key={report.id} 
                      onClick={() => handleOpenReport(report)}
                      style={{ cursor: 'pointer' }}
                    >
                      {/* ID */}
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#101828' }}>
                          {report.id}
                        </span>
                      </td>

                      {/* Content Type */}
                      <td>
                        <Badge type="content" value={report.targetType} />
                      </td>

                      {/* Content Preview */}
                      <td>
                        <div style={{ maxWidth: '250px', overflow: 'hidden' }}>
                          {content.title && (
                            <div style={{ fontWeight: 600, fontSize: '12px', color: '#101828', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                              {content.title}
                            </div>
                          )}
                          <div style={{ fontSize: '12px', color: '#475467', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                            {content.text || '(ไม่มีข้อความ)'}
                          </div>
                        </div>
                      </td>

                      {/* Author */}
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 600, fontSize: '12px', color: '#101828' }}>
                            {content.author.displayName}
                          </span>
                          <span style={{ fontSize: '11px', color: '#667085' }}>
                            @{content.author.username}
                          </span>
                        </div>
                      </td>

                      {/* Reason */}
                      <td>
                        <span style={{ fontSize: '12px', color: '#344054' }}>
                          {report.reasonLabel}
                        </span>
                      </td>

                      {/* Status */}
                      <td>
                        <Badge type="status" value={report.status} />
                      </td>

                      {/* Actions */}
                      <td onClick={(e) => e.stopPropagation()}>
                        <button 
                          className="btn btn-outline btn-sm"
                          onClick={() => handleOpenReport(report)}
                          title="ตรวจสอบและพิจารณาคำร้อง"
                          style={{ padding: '4px 7px' }}
                        >
                          <Eye size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Pagination */}
        <div className="table-pagination">
          <div>
            แสดง {reports.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} ถึง {Math.min(currentPage * pageSize, reports.length)} จากทั้งหมด {reports.length} รายการ
          </div>
          <div className="pagination-controls">
            <button 
              className="btn btn-outline btn-sm"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(p => p - 1)}
            >
              <ChevronLeft size={13} />
              <span>ก่อนหน้า</span>
            </button>
            <span style={{ padding: '0 6px', fontWeight: 600 }}>
              {currentPage} / {totalPages}
            </span>
            <button 
              className="btn btn-outline btn-sm"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(p => p + 1)}
            >
              <span>ถัดไป</span>
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Detail Drawer */}
      <ModerationDetailDrawer 
        report={selectedReport}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onActionComplete={handleActionCompleted}
      />
    </div>
  );
};
