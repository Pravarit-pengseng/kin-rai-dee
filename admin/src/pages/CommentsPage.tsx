import React, { useState, useEffect } from 'react';
import { EyeOff, Eye, Trash2, RefreshCw } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

interface CommentsPageProps {
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const CommentsPage: React.FC<CommentsPageProps> = ({ onShowToast }) => {
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchComments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setComments(data || []);
    } catch (e: any) {
      console.error(e);
      onShowToast(`โหลดข้อมูลไม่สำเร็จ: ${e.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, []);

  const handleToggleHide = (commentId: number, currentHidden: boolean) => {
    setComments(prev => prev.map(c => {
      if (c.id === commentId) {
        return { ...c, _hidden: !currentHidden };
      }
      return c;
    }));
    onShowToast(`อัปเดตสถานะความคิดเห็น #${commentId} เรียบร้อยแล้ว`, 'success');
  };

  const handleRemoveComment = (commentId: number) => {
    if (confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบความคิดเห็น #${commentId}?`)) {
      setComments(prev => prev.filter(c => c.id !== commentId));
      onShowToast(`ลบความคิดเห็น #${commentId} เรียบร้อยแล้ว`, 'success');
    }
  };

  const filteredComments = comments.filter(c => {
    const q = search.toLowerCase();
    return !search || (c.content && c.content.toLowerCase().includes(q)) || String(c.id).includes(q);
  });

  return (
    <div>
      <div className="filter-card">
        <div className="filter-row">
          <input 
            type="text"
            className="search-input-field"
            placeholder="ค้นหาข้อความความคิดเห็น, รหัส..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <button className="btn btn-outline btn-sm" onClick={fetchComments} disabled={loading}>
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
                <th style={{ width: '80px' }}>รหัส</th>
                <th>ข้อความ</th>
                <th style={{ width: '120px' }}>โพสต์</th>
                <th style={{ width: '130px' }}>ผู้เขียน</th>
                <th style={{ width: '120px' }}>วันที่สร้าง</th>
                <th style={{ width: '100px' }}>สถานะ</th>
                <th style={{ width: '100px', textAlign: 'right' }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: '#667085' }}>
                    กำลังโหลดข้อมูลความคิดเห็น...
                  </td>
                </tr>
              ) : filteredComments.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: '#667085' }}>
                    ไม่พบข้อมูลความคิดเห็น
                  </td>
                </tr>
              ) : (
                filteredComments.map(c => (
                  <tr key={c.id}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 600, color: '#101828' }}>
                      #{c.id}
                    </td>
                    <td>
                      <div style={{ color: '#101828', fontWeight: 500, fontSize: '12.5px' }}>
                        {c.content}
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-content-type">
                        โพสต์ #{c.post_id}
                      </span>
                    </td>
                    <td style={{ fontSize: '11.5px', color: '#667085', fontFamily: 'monospace' }}>
                      {c.user_id ? `${c.user_id.substring(0, 8)}...` : '-'}
                    </td>
                    <td style={{ fontSize: '12px', color: '#667085' }}>
                      {new Date(c.created_at).toLocaleDateString('th-TH')}
                    </td>
                    <td>
                      {c._hidden ? (
                        <span className="badge badge-pending">ถูกซ่อน</span>
                      ) : (
                        <span className="badge badge-action_taken">เผยแพร่อยู่</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                        <button 
                          className="btn btn-outline btn-sm"
                          onClick={() => handleToggleHide(c.id, !!c._hidden)}
                          title={c._hidden ? 'แสดงกลับ' : 'ซ่อน'}
                        >
                          {c._hidden ? <Eye size={12} color="#079455" /> : <EyeOff size={12} color="#b54708" />}
                        </button>
                        <button 
                          className="btn btn-outline btn-sm"
                          onClick={() => handleRemoveComment(c.id)}
                          title="ลบความคิดเห็น"
                        >
                          <Trash2 size={12} color="#d92d20" />
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
