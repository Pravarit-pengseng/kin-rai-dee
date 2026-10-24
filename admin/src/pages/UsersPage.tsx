import React, { useState, useEffect } from 'react';
import { User, UserX, UserCheck, RefreshCw } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { adminApi } from '../services/adminApi';

interface UsersPageProps {
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const UsersPage: React.FC<UsersPageProps> = ({ onShowToast }) => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');

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
          .select('*')
          .limit(50);

        if (error) throw error;
        setUsers((data || []).map((u: any) => ({ ...u, _suspended: u.is_suspended ?? false })));
      } catch (err: any) {
        onShowToast(`โหลดข้อมูลไม่สำเร็จ: ${err.message}`, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleSuspend = async (userId: string, currentSuspended: boolean) => {
    const nextSuspended = !currentSuspended;
    try {
      await adminApi.setUserStatus(userId, nextSuspended ? 'suspended' : 'active');
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

  const activeCount = users.filter(u => !u._suspended).length;
  const suspendedCount = users.filter(u => !!u._suspended).length;

  const filteredUsers = users.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = !search || 
      (u.username && u.username.toLowerCase().includes(q)) ||
      (u.display_name && u.display_name.toLowerCase().includes(q)) ||
      String(u.id).toLowerCase().includes(q);

    if (!matchSearch) return false;
    if (statusFilter === 'active') return !u._suspended;
    if (statusFilter === 'suspended') return !!u._suspended;
    return true;
  });

  return (
    <div>
      <div className="filter-card">
        {/* Status Tabs */}
        <div className="tab-group" style={{ marginBottom: '8px' }}>
          <button 
            className={`tab-btn ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            <span>ทั้งหมด</span>
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
            <span>ระงับ</span>
            {suspendedCount > 0 && (
              <span style={{ fontSize: '11px', background: '#fee4e2', color: '#d92d20', padding: '1px 7px', borderRadius: '10px' }}>
                {suspendedCount}
              </span>
            )}
          </button>
        </div>

        <div className="filter-row">
          <input 
            type="text"
            className="search-input-field"
            placeholder="ค้นหาชื่อผู้ใช้, ชื่อแสดงผล..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

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

          <button className="btn btn-outline btn-sm" onClick={fetchUsers} disabled={loading} style={{ marginLeft: 'auto' }}>
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            <span>รีเฟรช</span>
          </button>
        </div>
      </div>

      <div className="table-card">
        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '26%' }}>ชื่อแสดงผล</th>
                <th style={{ width: '24%' }}>ชื่อผู้ใช้</th>
                <th style={{ width: '22%' }}>วันที่สมัคร</th>
                <th style={{ width: '16%' }}>สถานะ</th>
                <th style={{ width: '12%' }}>จัดการ</th>
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
                      {(search || statusFilter !== 'all') && (
                        <button 
                          className="btn btn-outline btn-sm" 
                          onClick={() => { setSearch(''); setStatusFilter('all'); }}
                          style={{ marginTop: '4px' }}
                        >
                          ล้างตัวกรอง
                        </button>
                      )}
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
                        <span style={{ fontWeight: 600, color: '#101828', fontSize: '13px' }}>
                          {u.display_name || u.username}
                        </span>
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
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <button 
                          className="btn btn-outline btn-sm"
                          onClick={() => handleToggleSuspend(u.id, !!u._suspended)}
                          title={u._suspended ? 'ปลดการระงับ' : 'ระงับบัญชี'}
                          style={{
                            width: '32px',
                            height: '32px',
                            padding: 0,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderColor: u._suspended ? '#bbf7d0' : '#fecdca',
                            color: u._suspended ? '#027a48' : '#b42318'
                          }}
                        >
                          {u._suspended ? <UserCheck size={14} color="#079455" /> : <UserX size={14} color="#d92d20" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="table-pagination">
          <div>
            แสดงทั้งหมด {filteredUsers.length} รายการ (จากสมาชิกทั้งหมด {users.length} คน)
          </div>
        </div>
      </div>
    </div>
  );
};
