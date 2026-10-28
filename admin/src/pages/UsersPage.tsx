import React, { useState, useEffect } from 'react';
import { 
  User, 
  UserX, 
  UserCheck, 
  Trash2, 
  RefreshCw, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Mail, 
  FileText,
  X,
  AlertTriangle,
  Search
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { adminApi } from '../services/adminApi';

interface UsersPageProps {
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const UsersPage: React.FC<UsersPageProps> = ({ onShowToast }) => {
  // Main Sub-Tab: 'users' (สมาชิกทั้งหมด) | 'deletion_requests' (คำขอลบบัญชี)
  const [activeTab, setActiveTab] = useState<'users' | 'deletion_requests'>('users');

  // Users State
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');

  // Deletion Requests State
  const [deletionRequests, setDeletionRequests] = useState<any[]>([]);
  const [delLoading, setDelLoading] = useState(false);
  const [delStatusFilter, setDelStatusFilter] = useState<'all' | 'pending' | 'completed' | 'rejected'>('all');

  // Modals
  const [selectedRequestForAction, setSelectedRequestForAction] = useState<any | null>(null);
  const [modalActionType, setModalActionType] = useState<'approve' | 'reject' | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [selectedUserToDelete, setSelectedUserToDelete] = useState<any | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getUsers();
      const loaded = (res.data || []).map((u: any) => ({
        ...u,
        _suspended: u.is_suspended ?? false,
      }));
      setUsers(loaded);
    } catch (e: any) {
      console.error('adminApi fetch users failed, falling back to Supabase:', e);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, username, display_name, avatar_url, is_suspended, created_at')
          .limit(200);

        if (error) throw error;
        setUsers((data || []).map((u: any) => ({ ...u, _suspended: u.is_suspended ?? false })));
      } catch (err: any) {
        onShowToast(`โหลดข้อมูลสมาชิกไม่สำเร็จ: ${err.message}`, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchDeletionRequests = async () => {
    setDelLoading(true);
    try {
      const res = await adminApi.getDeletionRequests();
      setDeletionRequests(res.data || []);
    } catch (e: any) {
      console.error('adminApi fetch deletion requests failed, falling back to Supabase:', e);
      try {
        const { data, error } = await supabase
          .from('account_deletion_requests')
          .select('id, user_id, email, reason, status, created_at, resolved_at, admin_notes')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setDeletionRequests(data || []);
      } catch (err: any) {
        onShowToast(`โหลดคำขอลบบัญชีไม่สำเร็จ: ${err.message}`, 'error');
      }
    } finally {
      setDelLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchDeletionRequests();
  }, []);

  const handleToggleSuspend = async (userId: string, currentSuspended: boolean) => {
    const nextSuspended = !currentSuspended;
    try {
      // 1. Try direct Supabase RPC
      const { error: rpcErr } = await supabase.rpc('admin_toggle_user_status', {
        target_user_id: userId,
        should_suspend: nextSuspended,
        reason: 'เปลี่ยนสถานะโดยผู้ดูแลระบบ',
      });

      if (rpcErr) {
        console.warn('RPC admin_toggle_user_status failed, falling back to adminApi:', rpcErr);
        await adminApi.setUserStatus(userId, nextSuspended ? 'suspended' : 'active');
      }

      setUsers(prev => prev.map(u => {
        if (u.id === userId) {
          return { ...u, is_suspended: nextSuspended, _suspended: nextSuspended };
        }
        return u;
      }));
      onShowToast(`${currentSuspended ? 'ปลดการระงับ' : 'ระงับบัญชี'}ผู้ใช้เรียบร้อยแล้ว`, 'success');
    } catch (err: any) {
      console.error(err);
      onShowToast(`เกิดข้อผิดพลาดในการเปลี่ยนสถานะ: ${err.message}`, 'error');
    }
  };

  // Direct User Deletion via Supabase RPC (Complete & Permanent Cascade)
  const handleConfirmDirectDeleteUser = async () => {
    if (!selectedUserToDelete) return;
    setIsProcessing(true);
    try {
      // 1. Primary: Direct Supabase RPC (Runs as SECURITY DEFINER superuser, atomic deletion of auth, storage & db rows)
      const { data: rpcData, error: rpcErr } = await supabase.rpc('admin_delete_user_completely', {
        target_user_id: selectedUserToDelete.id,
        reason: 'ลบบัญชีโดยผู้ดูแลระบบ',
      });

      if (rpcErr) {
        console.warn('Supabase RPC admin_delete_user_completely notice, trying adminApi fallback:', rpcErr);
        // 2. Secondary: FastAPI backend with service_role key
        await adminApi.deleteUser(selectedUserToDelete.id);
      }

      setUsers(prev => prev.filter(u => u.id !== selectedUserToDelete.id));
      onShowToast(`ลบบัญชี @${selectedUserToDelete.username} และข้อมูลทั้งหมดเรียบร้อยแล้ว`, 'success');
      setSelectedUserToDelete(null);
    } catch (err: any) {
      console.error('Delete user failed:', err);
      onShowToast(`เกิดข้อผิดพลาดในการลบผู้ใช้: ${err.message || 'ไม่สามารถลบได้ กรุณาตรวจสอบสิทธิ์'}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Approve Deletion Request via Supabase RPC
  const handleConfirmApproveRequest = async () => {
    if (!selectedRequestForAction) return;
    setIsProcessing(true);
    try {
      // 1. Primary: Direct Supabase RPC
      const { data: rpcData, error: rpcErr } = await supabase.rpc('admin_approve_deletion_request', {
        request_id: selectedRequestForAction.id,
        admin_notes: adminNote || 'อนุมัติและลบบัญชีเรียบร้อยแล้วโดยผู้ดูแลระบบ',
      });

      if (rpcErr) {
        console.warn('Supabase RPC admin_approve_deletion_request notice, trying adminApi fallback:', rpcErr);
        await adminApi.approveDeletionRequest(selectedRequestForAction.id, adminNote);
      }

      onShowToast(`อนุมัติและลบบัญชีสำหรับ ${selectedRequestForAction.email} เรียบร้อยแล้ว`, 'success');
      setSelectedRequestForAction(null);
      setAdminNote('');
      fetchDeletionRequests();
      fetchUsers();
    } catch (err: any) {
      console.error('Approve deletion request failed:', err);
      onShowToast(`เกิดข้อผิดพลาดในการลบบัญชี: ${err.message || 'ไม่สามารถดำเนินการได้'}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Reject Deletion Request
  const handleConfirmRejectRequest = async () => {
    if (!selectedRequestForAction) return;
    setIsProcessing(true);
    try {
      try {
        await adminApi.rejectDeletionRequest(selectedRequestForAction.id, adminNote);
      } catch (apiErr) {
        console.warn('API reject failed, falling back to direct Supabase:', apiErr);
        await supabase.from('account_deletion_requests').update({
          status: 'rejected',
          resolved_at: new Date().toISOString(),
          admin_notes: adminNote || 'ปฏิเสธคำขอ',
        }).eq('id', selectedRequestForAction.id);
      }
      onShowToast(`ปฏิเสธคำขอลบบัญชีของ ${selectedRequestForAction.email} เรียบร้อยแล้ว`, 'info');
      setSelectedRequestForAction(null);
      setAdminNote('');
      fetchDeletionRequests();
    } catch (err: any) {
      console.error(err);
      onShowToast(`เกิดข้อผิดพลาด: ${err.message}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const activeCount = users.filter(u => !u._suspended).length;
  const suspendedCount = users.filter(u => !!u._suspended).length;
  const pendingDelCount = deletionRequests.filter(r => r.status === 'pending').length;

  const filteredUsers = users.filter(u => {
    const q = search.trim().toLowerCase().replace(/^@/, '');
    const matchSearch = !search || 
      (u.username && u.username.toLowerCase().includes(q)) ||
      (u.display_name && u.display_name.toLowerCase().includes(q)) ||
      String(u.id).toLowerCase().includes(q);

    if (!matchSearch) return false;
    if (statusFilter === 'active') return !u._suspended;
    if (statusFilter === 'suspended') return !!u._suspended;
    return true;
  });

  const filteredDeletionRequests = deletionRequests.filter(r => {
    const q = search.trim().toLowerCase();
    const matchSearch = !search ||
      r.email.toLowerCase().includes(q) ||
      (r.reason && r.reason.toLowerCase().includes(q)) ||
      (r.user?.username && r.user.username.toLowerCase().includes(q)) ||
      (r.user?.display_name && r.user.display_name.toLowerCase().includes(q)) ||
      String(r.id).includes(q);

    if (!matchSearch) return false;
    if (delStatusFilter !== 'all') return r.status === delStatusFilter;
    return true;
  });

  return (
    <div>
      {/* Top Main Navigation Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <div className="tab-group" style={{ borderBottom: 'none' }}>
          <button 
            className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
            style={{ fontSize: '13px', padding: '6px 14px' }}
          >
            <User size={14} />
            <span>สมาชิกทั้งหมด</span>
            <span style={{ fontSize: '11px', background: activeTab === 'users' ? '#e0edff' : '#f2f4f7', color: activeTab === 'users' ? '#2563eb' : '#667085', padding: '1px 7px', borderRadius: '10px' }}>
              {users.length}
            </span>
          </button>

          <button 
            className={`tab-btn ${activeTab === 'deletion_requests' ? 'active' : ''}`}
            onClick={() => setActiveTab('deletion_requests')}
            style={{ fontSize: '13px', padding: '6px 14px' }}
          >
            <ShieldAlert size={14} color={pendingDelCount > 0 ? '#d92d20' : undefined} />
            <span>คำขอลบบัญชี</span>
            {pendingDelCount > 0 ? (
              <span style={{ fontSize: '11px', background: '#fee4e2', color: '#d92d20', fontWeight: 700, padding: '1px 7px', borderRadius: '10px' }}>
                {pendingDelCount} รอตรวจสอบ
              </span>
            ) : (
              <span style={{ fontSize: '11px', background: '#f2f4f7', color: '#667085', padding: '1px 7px', borderRadius: '10px' }}>
                {deletionRequests.length}
              </span>
            )}
          </button>
        </div>

        <button 
          className="btn btn-outline btn-sm" 
          onClick={() => {
            fetchUsers();
            fetchDeletionRequests();
            onShowToast('รีเฟรชข้อมูลเรียบร้อยแล้ว', 'success');
          }} 
          disabled={loading || delLoading}
        >
          <RefreshCw size={12} className={loading || delLoading ? 'animate-spin' : ''} />
          <span>รีเฟรชข้อมูล</span>
        </button>
      </div>

      {/* VIEW 1: REGULAR USERS TABLE */}
      {activeTab === 'users' && (
        <>
          <div className="filter-card">
            {/* Status Filter Tabs */}
            <div className="tab-group" style={{ marginBottom: '8px' }}>
              <button 
                className={`tab-btn ${statusFilter === 'all' ? 'active' : ''}`}
                onClick={() => setStatusFilter('all')}
              >
                <span>สถานะทั้งหมด</span>
                <span style={{ fontSize: '11px', background: statusFilter === 'all' ? '#e0edff' : '#f2f4f7', color: statusFilter === 'all' ? '#2563eb' : '#667085', padding: '1px 7px', borderRadius: '10px' }}>
                  {users.length}
                </span>
              </button>
              <button 
                className={`tab-btn ${statusFilter === 'active' ? 'active' : ''}`}
                onClick={() => setStatusFilter('active')}
              >
                <span>ปกติ</span>
                <span style={{ fontSize: '11px', background: statusFilter === 'active' ? '#ecfdf3' : '#f2f4f7', color: statusFilter === 'active' ? '#027a48' : '#667085', padding: '1px 7px', borderRadius: '10px' }}>
                  {activeCount}
                </span>
              </button>
              <button 
                className={`tab-btn ${statusFilter === 'suspended' ? 'active' : ''}`}
                onClick={() => setStatusFilter('suspended')}
              >
                <span>ระงับการใช้งาน</span>
                {suspendedCount > 0 && (
                  <span style={{ fontSize: '11px', background: '#fee4e2', color: '#d92d20', padding: '1px 7px', borderRadius: '10px' }}>
                    {suspendedCount}
                  </span>
                )}
              </button>
            </div>

            <div className="filter-row" style={{ flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ position: 'relative', flex: '1 1 240px' }}>
                <Search size={14} color="#98a2b3" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="text"
                  className="search-input-field"
                  style={{ paddingLeft: '32px', width: '100%' }}
                  placeholder="ค้นหาชื่อผู้ใช้, ชื่อแสดงผล, รหัส UUID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="filter-input-group">
                <span style={{ color: '#667085', fontSize: '12px' }}>สถานะ:</span>
                <select 
                  className="filter-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                >
                  <option value="all">สถานะทั้งหมด</option>
                  <option value="active">ปกติ</option>
                  <option value="suspended">ระงับ</option>
                </select>
              </div>
            </div>
          </div>

          <div className="table-card">
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th style={{ width: '25%' }}>ชื่อแสดงผล</th>
                    <th style={{ width: '22%' }}>ชื่อผู้ใช้</th>
                    <th style={{ width: '20%' }}>วันที่สมัคร</th>
                    <th style={{ width: '15%' }}>สถานะ</th>
                    <th style={{ width: '18%' }}>จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '48px 16px', color: '#667085' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                          <RefreshCw size={24} className="animate-spin" color="#2563eb" />
                          <span style={{ fontSize: '13px' }}>กำลังโหลดข้อมูลสมาชิก...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '48px 16px', color: '#667085' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                          <User size={28} color="#98a2b3" />
                          <span style={{ fontSize: '13px', fontWeight: 500, color: '#344054' }}>
                            ไม่พบข้อมูลสมาชิกตามเงื่อนไขที่เลือก
                          </span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map(u => (
                      <tr key={u.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {u.avatar_url ? (
                              <img 
                                src={u.avatar_url} 
                                alt="" 
                                style={{ width: '34px', height: '34px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '1px solid #eaecf0' }}
                                onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                              />
                            ) : (
                              <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#eef2f6', color: '#344054', fontWeight: 600, fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid #eaecf0' }}>
                                {((u.display_name || u.username || 'U').charAt(0)).toUpperCase()}
                              </div>
                            )}
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontWeight: 600, color: '#101828', fontSize: '13px' }}>
                                {u.display_name || u.username}
                              </span>
                              <span style={{ fontSize: '10.5px', color: '#98a2b3', fontFamily: 'monospace' }}>
                                ID: {u.id.substring(0, 8)}...
                              </span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span style={{ 
                            fontFamily: 'monospace', 
                            fontSize: '12px', 
                            color: '#175cd3', 
                            background: '#eff8ff', 
                            border: '1px solid #d1e9ff',
                            padding: '2px 8px', 
                            borderRadius: '6px',
                            fontWeight: 500
                          }}>
                            @{u.username}
                          </span>
                        </td>
                        <td style={{ fontSize: '12px', color: '#667085' }}>
                          {new Date(u.created_at).toLocaleDateString('th-TH')}
                        </td>
                        <td>
                          {u._suspended ? (
                            <span className="badge badge-priority-urgent">
                              ● ระงับ
                            </span>
                          ) : (
                            <span className="badge badge-action_taken">
                              ● ปกติ
                            </span>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {/* Suspend / Unsuspend Button */}
                            <button 
                              className="btn btn-outline btn-sm"
                              onClick={() => handleToggleSuspend(u.id, !!u._suspended)}
                              title={u._suspended ? 'ปลดการระงับบัญชี' : 'ระงับบัญชีผู้ใช้'}
                              style={{
                                height: '28px',
                                padding: '2px 8px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '11.5px',
                                borderColor: u._suspended ? '#bbf7d0' : '#fecdca',
                                color: u._suspended ? '#027a48' : '#b42318'
                              }}
                            >
                              {u._suspended ? <UserCheck size={13} color="#079455" /> : <UserX size={13} color="#d92d20" />}
                              <span>{u._suspended ? 'ปลดระงับ' : 'ระงับ'}</span>
                            </button>

                            {/* Direct Delete Account Button */}
                            <button 
                              className="btn btn-outline btn-sm"
                              onClick={() => setSelectedUserToDelete(u)}
                              title="ลบบัญชีผู้ใช้ถาวร"
                              style={{
                                height: '28px',
                                padding: '2px 8px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '11.5px',
                                borderColor: '#fecdca',
                                color: '#d92d20'
                              }}
                            >
                              <Trash2 size={13} />
                              <span>ลบ</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="table-pagination">
              <div>
                แสดงทั้งหมด {filteredUsers.length} รายการ (จากสมาชิกทั้งหมด {users.length} คน)
              </div>
            </div>
          </div>
        </>
      )}

      {/* VIEW 2: ACCOUNT DELETION REQUESTS TABLE */}
      {activeTab === 'deletion_requests' && (
        <>
          <div className="filter-card">
            <div className="filter-row" style={{ flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ position: 'relative', flex: '1 1 240px' }}>
                <Search size={14} color="#98a2b3" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="text"
                  className="search-input-field"
                  style={{ paddingLeft: '32px', width: '100%' }}
                  placeholder="ค้นหาอีเมล, เหตุผล, ชื่อผู้ใช้..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="filter-input-group">
                <span style={{ color: '#667085', fontSize: '12px' }}>สถานะคำขอ:</span>
                <select 
                  className="filter-select"
                  value={delStatusFilter}
                  onChange={(e) => setDelStatusFilter(e.target.value as any)}
                >
                  <option value="all">สถานะทั้งหมด</option>
                  <option value="pending">รอการตรวจสอบ (Pending)</option>
                  <option value="completed">ลบบัญชีแล้ว (Completed)</option>
                  <option value="rejected">ปฏิเสธคำขอ (Rejected)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="table-card">
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th style={{ width: '80px' }}>รหัส</th>
                    <th style={{ width: '220px' }}>อีเมลที่ขอลบ</th>
                    <th style={{ width: '180px' }}>บัญชีในระบบ</th>
                    <th>เหตุผลในการขอลบ</th>
                    <th style={{ width: '140px' }}>วันที่ส่งคำขอ</th>
                    <th style={{ width: '130px' }}>สถานะ</th>
                    <th style={{ width: '170px' }}>จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {delLoading ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '48px 16px', color: '#667085' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                          <RefreshCw size={24} className="animate-spin" color="#2563eb" />
                          <span style={{ fontSize: '13px' }}>กำลังโหลดคำขอลบบัญชี...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredDeletionRequests.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '48px 16px', color: '#667085' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                          <ShieldAlert size={28} color="#98a2b3" />
                          <span style={{ fontSize: '13px', fontWeight: 500, color: '#344054' }}>
                            {search || delStatusFilter !== 'all' ? 'ไม่พบคำขอลบบัญชีที่ตรงกับเงื่อนไข' : 'ไม่มีคำขอลบบัญชีในระบบ'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredDeletionRequests.map(r => {
                      const user = r.user;
                      const isPending = r.status === 'pending';
                      const isCompleted = r.status === 'completed';
                      const isRejected = r.status === 'rejected';

                      return (
                        <tr key={r.id}>
                          <td style={{ fontFamily: 'monospace', fontWeight: 600, color: '#101828' }}>
                            #{r.id}
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Mail size={13} color="#667085" />
                              <strong style={{ color: '#101828', fontSize: '13px' }}>{r.email}</strong>
                            </div>
                          </td>
                          <td>
                            {user ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <User size={13} color="#2563eb" />
                                <span style={{ fontWeight: 600, color: '#101828', fontSize: '12.5px' }}>
                                  {user.display_name || user.username}
                                </span>
                                <span style={{ fontSize: '11px', color: '#667085' }}>
                                  (@{user.username})
                                </span>
                              </div>
                            ) : (
                              <span style={{ fontSize: '11.5px', color: '#98a2b3' }}>
                                {r.user_id ? `ID: ${r.user_id.substring(0, 8)}...` : 'ไม่พบบัญชีที่ผูกไว้'}
                              </span>
                            )}
                          </td>
                          <td>
                            <div style={{ fontSize: '12.5px', color: '#344054', lineHeight: 1.4 }}>
                              {r.reason ? r.reason : <span style={{ color: '#98a2b3' }}>ไม่ได้ระบุเหตุผล</span>}
                            </div>
                            {r.admin_notes && (
                              <div style={{ fontSize: '11px', color: '#667085', marginTop: '2px' }}>
                                บันทึกแอดมิน: {r.admin_notes}
                              </div>
                            )}
                          </td>
                          <td style={{ fontSize: '12px', color: '#667085', whiteSpace: 'nowrap' }}>
                            {new Date(r.created_at).toLocaleString('th-TH')}
                          </td>
                          <td>
                            {isPending && (
                              <span className="badge badge-priority-high" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <Clock size={11} />
                                <span>รอตรวจสอบ</span>
                              </span>
                            )}
                            {isCompleted && (
                              <span className="badge badge-action_taken" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <CheckCircle2 size={11} />
                                <span>ลบบัญชีแล้ว</span>
                              </span>
                            )}
                            {isRejected && (
                              <span className="badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#f2f4f7', color: '#667085' }}>
                                <XCircle size={11} />
                                <span>ปฏิเสธคำขอ</span>
                              </span>
                            )}
                          </td>
                          <td style={{ whiteSpace: 'nowrap' }}>
                            {isPending ? (
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', flexWrap: 'nowrap' }}>
                                <button 
                                  className="btn btn-outline btn-sm"
                                  onClick={() => {
                                    setSelectedRequestForAction(r);
                                    setModalActionType('approve');
                                    setAdminNote('อนุมัติตามคำขอลบบัญชีของผู้ใช้');
                                  }}
                                  style={{
                                    height: '28px',
                                    padding: '2px 8px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '4px',
                                    whiteSpace: 'nowrap',
                                    flexShrink: 0,
                                    fontSize: '11.5px',
                                    borderColor: '#fecdca',
                                    color: '#d92d20',
                                    backgroundColor: '#fffbfa'
                                  }}
                                  title="ตรวจสอบและอนุมัติการลบบัญชี"
                                >
                                  <Trash2 size={12} />
                                  <span>ลบบัญชี</span>
                                </button>

                                <button 
                                  className="btn btn-outline btn-sm"
                                  onClick={() => {
                                    setSelectedRequestForAction(r);
                                    setModalActionType('reject');
                                    setAdminNote('ข้อมูลไม่ตรงหรือไม่สามารถยืนยันตัวตนได้');
                                  }}
                                  style={{
                                    height: '28px',
                                    padding: '2px 8px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '4px',
                                    whiteSpace: 'nowrap',
                                    flexShrink: 0,
                                    fontSize: '11.5px',
                                    color: '#667085'
                                  }}
                                  title="ปฏิเสธคำขอ"
                                >
                                  <X size={12} />
                                  <span>ปฏิเสธ</span>
                                </button>
                              </div>
                            ) : (
                              <span style={{ fontSize: '11.5px', color: '#98a2b3' }}>
                                {r.resolved_at ? new Date(r.resolved_at).toLocaleDateString('th-TH') : '-'}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="table-pagination">
              <div>
                แสดงทั้งหมด {filteredDeletionRequests.length} รายการ (จากคำขอทั้งหมด {deletionRequests.length} รายการ)
              </div>
            </div>
          </div>
        </>
      )}

      {/* MODAL 1: Confirm Request Action (Approve / Reject) */}
      {selectedRequestForAction && modalActionType && (
        <div className="drawer-overlay" onClick={() => setSelectedRequestForAction(null)}>
          <div 
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '480px',
              width: '90%',
              margin: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {modalActionType === 'approve' ? (
                  <AlertTriangle size={20} color="#d92d20" />
                ) : (
                  <XCircle size={20} color="#667085" />
                )}
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#101828', margin: 0 }}>
                  {modalActionType === 'approve' ? 'ยืนยันการลบบัญชีและข้อมูลทั้งหมด' : 'ปฏิเสธคำขอลบบัญชี'}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedRequestForAction(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#667085' }}
              >
                <X size={18} />
              </button>
            </div>

            {modalActionType === 'approve' ? (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ 
                  backgroundColor: '#fef3f2', 
                  border: '1px solid #fecdca', 
                  borderRadius: '8px', 
                  padding: '12px', 
                  fontSize: '12.5px', 
                  color: '#b42318', 
                  lineHeight: 1.5,
                  marginBottom: '14px' 
                }}>
                  <strong>คำเตือน:</strong> การอนุมัติจะทำการลบบัญชีผู้ใช้ โพสต์ รูปภาพ ความคิดเห็น และข้อมูลโปรไฟล์ทั้งหมดของผู้ใช้นี้ออกจากระบบอย่างถาวร (Hard Delete) และไม่สามารถกู้คืนได้
                </div>

                <div style={{ fontSize: '13px', color: '#344054', marginBottom: '8px' }}>
                  <strong>อีเมล:</strong> {selectedRequestForAction.email}
                </div>
                {selectedRequestForAction.user && (
                  <div style={{ fontSize: '13px', color: '#344054', marginBottom: '8px' }}>
                    <strong>ชื่อผู้ใช้ในระบบ:</strong> @{selectedRequestForAction.user.username} ({selectedRequestForAction.user.display_name})
                  </div>
                )}
                {selectedRequestForAction.reason && (
                  <div style={{ fontSize: '13px', color: '#344054', marginBottom: '14px' }}>
                    <strong>เหตุผลของผู้ใช้:</strong> {selectedRequestForAction.reason}
                  </div>
                )}
              </div>
            ) : (
              <p style={{ fontSize: '13px', color: '#475467', lineHeight: 1.5, marginBottom: '16px' }}>
                คุณต้องการปฏิเสธคำขอลบบัญชีของ <strong>{selectedRequestForAction.email}</strong> ใช่หรือไม่?
              </p>
            )}

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#344054', display: 'block', marginBottom: '6px' }}>
                บันทึกเพิ่มเติมของแอดมิน (Admin Notes):
              </label>
              <input 
                type="text" 
                className="search-input-field"
                style={{ width: '100%', fontSize: '12.5px' }}
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="ระบุหมายเหตุการดำเนินการ..."
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button 
                className="btn btn-outline btn-sm"
                onClick={() => setSelectedRequestForAction(null)}
                disabled={isProcessing}
              >
                ยกเลิก
              </button>
              {modalActionType === 'approve' ? (
                <button 
                  className="btn btn-danger btn-sm"
                  onClick={handleConfirmApproveRequest}
                  disabled={isProcessing}
                  style={{ backgroundColor: '#d92d20', color: '#ffffff' }}
                >
                  {isProcessing ? 'กำลังลบข้อมูล...' : 'ยืนยันลบบัญชีถาวร'}
                </button>
              ) : (
                <button 
                  className="btn btn-outline btn-sm"
                  onClick={handleConfirmRejectRequest}
                  disabled={isProcessing}
                >
                  {isProcessing ? 'กำลังดำเนินการ...' : 'ยืนยันปฏิเสธคำขอ'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Confirm Direct Delete User from Users List */}
      {selectedUserToDelete && (
        <div className="drawer-overlay" onClick={() => setSelectedUserToDelete(null)}>
          <div 
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '460px',
              width: '90%',
              margin: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <AlertTriangle size={20} color="#d92d20" />
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#101828', margin: 0 }}>
                ลบบัญชีผู้ใช้ถาวร
              </h3>
            </div>

            <p style={{ fontSize: '13px', color: '#475467', lineHeight: 1.5, marginBottom: '14px' }}>
              คุณแน่ใจหรือไม่ว่าต้องการลบบัญชี <strong>@{selectedUserToDelete.username}</strong> ({selectedUserToDelete.display_name})?
            </p>

            <div style={{ 
              backgroundColor: '#fef3f2', 
              border: '1px solid #fecdca', 
              borderRadius: '8px', 
              padding: '12px', 
              fontSize: '12px', 
              color: '#b42318', 
              lineHeight: 1.5,
              marginBottom: '18px' 
            }}>
              ข้อมูลทั้งหมดของผู้ใช้นี้ ได้แก่ โพสต์ รูปภาพ ความคิดเห็น และข้อมูลโปรไฟล์จะถูกลบออกจากระบบอย่างถาวรทันทีและไม่สามารถกู้คืนได้
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button 
                className="btn btn-outline btn-sm"
                onClick={() => setSelectedUserToDelete(null)}
                disabled={isProcessing}
              >
                ยกเลิก
              </button>
              <button 
                className="btn btn-danger btn-sm"
                onClick={handleConfirmDirectDeleteUser}
                disabled={isProcessing}
                style={{ backgroundColor: '#d92d20', color: '#ffffff' }}
              >
                {isProcessing ? 'กำลังลบ...' : 'ยืนยันลบบัญชีถาวร'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
