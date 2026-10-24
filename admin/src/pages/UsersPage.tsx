import React, { useState, useEffect } from 'react';
import { User, UserX, UserCheck, RefreshCw } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

interface UsersPageProps {
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const UsersPage: React.FC<UsersPageProps> = ({ onShowToast }) => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .limit(50);

      if (error) throw error;
      setUsers(data || []);
    } catch (e: any) {
      console.error(e);
      onShowToast(`โหลดข้อมูลไม่สำเร็จ: ${e.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleSuspend = (userId: string, currentSuspended: boolean) => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        return { ...u, _suspended: !currentSuspended };
      }
      return u;
    }));
    onShowToast(`${currentSuspended ? 'ปลดการระงับ' : 'ระงับบัญชี'}ผู้ใช้เรียบร้อยแล้ว`, 'success');
  };

  const filteredUsers = users.filter(u => {
    const q = search.toLowerCase();
    return !search || 
      (u.username && u.username.toLowerCase().includes(q)) ||
      (u.display_name && u.display_name.toLowerCase().includes(q)) ||
      String(u.id).toLowerCase().includes(q);
  });

  return (
    <div>
      <div className="filter-card">
        <div className="filter-row">
          <input 
            type="text"
            className="search-input-field"
            placeholder="ค้นหาชื่อผู้ใช้, ชื่อแสดงผล..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <button className="btn btn-outline btn-sm" onClick={fetchUsers} disabled={loading}>
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
                <th style={{ width: '110px' }}>รหัสผู้ใช้</th>
                <th>ชื่อแสดงผล</th>
                <th>ชื่อผู้ใช้</th>
                <th>คำแนะนำตัว</th>
                <th style={{ width: '120px' }}>วันที่สมัคร</th>
                <th style={{ width: '100px' }}>สถานะ</th>
                <th style={{ width: '110px', textAlign: 'right' }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: '#667085' }}>
                    กำลังโหลดข้อมูลสมาชิก...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: '#667085' }}>
                    ไม่พบข้อมูลสมาชิก
                  </td>
                </tr>
              ) : (
                filteredUsers.map(u => (
                  <tr key={u.id}>
                    <td style={{ fontFamily: 'monospace', fontSize: '11.5px', color: '#667085' }}>
                      {u.id.substring(0, 8)}...
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#f2f4f7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <User size={14} color="#475467" />
                        </div>
                        <div style={{ fontWeight: 600, color: '#101828' }}>
                          {u.display_name || u.username}
                        </div>
                      </div>
                    </td>
                    <td style={{ color: '#2563eb', fontWeight: 500 }}>
                      @{u.username}
                    </td>
                    <td style={{ color: '#667085', fontSize: '12px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {u.bio || '-'}
                    </td>
                    <td style={{ fontSize: '12px', color: '#667085' }}>
                      {new Date(u.created_at).toLocaleDateString('th-TH')}
                    </td>
                    <td>
                      {u._suspended ? (
                        <span className="badge badge-priority-urgent">ระงับ</span>
                      ) : (
                        <span className="badge badge-action_taken">ปกติ</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                        <button 
                          className="btn btn-outline btn-sm"
                          onClick={() => handleToggleSuspend(u.id, !!u._suspended)}
                          title={u._suspended ? 'ปลดการระงับ' : 'ระงับบัญชี'}
                        >
                          {u._suspended ? <UserCheck size={12} color="#079455" /> : <UserX size={12} color="#d92d20" />}
                          <span>{u._suspended ? 'ปลดระงับ' : 'ระงับบัญชี'}</span>
                        </button>
                      </div>
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
