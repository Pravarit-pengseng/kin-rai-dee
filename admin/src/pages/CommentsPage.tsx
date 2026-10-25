import React, { useState, useEffect } from 'react';
import { 
  EyeOff, 
  Eye, 
  Trash2, 
  RefreshCw, 
  Copy, 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  Filter, 
  X,
  User,
  MessageSquare
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { adminApi } from '../services/adminApi';

interface CommentsPageProps {
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const CommentsPage: React.FC<CommentsPageProps> = ({ onShowToast }) => {
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'hidden'>('all');
  const [filterPostId, setFilterPostId] = useState<string>('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getComments({ limit: 500 });
      const loaded = (res.data || []).map((c: any) => ({
        ...c,
        _hidden: c.is_hidden ?? false,
      }));
      setComments(loaded);
    } catch (e: any) {
      console.error('adminApi fetch comments error, falling back to Supabase:', e);
      try {
        const { data, error } = await supabase
          .from('comments')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(300);

        if (error) throw error;
        setComments((data || []).map((c: any) => ({ ...c, _hidden: c.is_hidden ?? false })));
      } catch (err: any) {
        onShowToast(`โหลดข้อมูลไม่สำเร็จ: ${err.message}`, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, []);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    onShowToast(`คัดลอก ${label} #${text} เรียบร้อยแล้ว`, 'info');
  };

  const handleToggleHide = async (commentId: number, currentHidden: boolean) => {
    const nextHidden = !currentHidden;
    try {
      try {
        await adminApi.setCommentVisibility(commentId, nextHidden);
      } catch (apiErr) {
        console.warn('adminApi setCommentVisibility failed, falling back to direct Supabase:', apiErr);
        const { error } = await supabase.from('comments').update({ is_hidden: nextHidden }).eq('id', commentId);
        if (error) throw error;
      }
      setComments(prev => prev.map(c => {
        if (c.id === commentId) {
          return { ...c, is_hidden: nextHidden, _hidden: nextHidden };
        }
        return c;
      }));
      onShowToast(`อัปเดตสถานะความคิดเห็น #${commentId} เรียบร้อยแล้ว`, 'success');
    } catch (err: any) {
      console.error(err);
      onShowToast(`เกิดข้อผิดพลาดในการอัปเดตความคิดเห็น: ${err.message}`, 'error');
    }
  };

  const handleRemoveComment = async (commentId: number) => {
    if (confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบความคิดเห็น #${commentId}?`)) {
      try {
        try {
          await adminApi.deleteComment(commentId);
        } catch (apiErr) {
          console.warn('adminApi deleteComment failed, falling back to direct Supabase:', apiErr);
          const { error } = await supabase.from('comments').delete().eq('id', commentId);
          if (error) throw error;
        }
        setComments(prev => prev.filter(c => c.id !== commentId));
        onShowToast(`ลบความคิดเห็น #${commentId} เรียบร้อยแล้ว`, 'success');
      } catch (err: any) {
        console.error(err);
        onShowToast(`เกิดข้อผิดพลาดในการลบความคิดเห็น: ${err.message}`, 'error');
      }
    }
  };

  const filteredComments = comments.filter(c => {
    if (filterPostId) {
      const cleanPostId = filterPostId.trim().replace(/^#/, '');
      if (String(c.post_id) !== cleanPostId) return false;
    }

    const q = search.trim().toLowerCase().replace(/^#/, '');
    const matchSearch = !search ||
      String(c.id).includes(q) ||
      String(c.post_id).includes(q) ||
      (c.content && c.content.toLowerCase().includes(q)) ||
      (c.post?.food_name && c.post.food_name.toLowerCase().includes(q)) ||
      (c.profiles?.username && c.profiles.username.toLowerCase().includes(q)) ||
      (c.profiles?.display_name && c.profiles.display_name.toLowerCase().includes(q));

    if (statusFilter === 'hidden') return matchSearch && c._hidden;
    if (statusFilter === 'published') return matchSearch && !c._hidden;
    return matchSearch;
  });

  // Pagination calculation
  const totalItems = filteredComments.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const paginatedComments = filteredComments.slice(startIndex, startIndex + pageSize);

  return (
    <div>
      <div className="filter-card">
        <div className="filter-row" style={{ flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ position: 'relative', flex: '1 1 240px' }}>
            <Search size={14} color="#98a2b3" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text"
              className="search-input-field"
              style={{ paddingLeft: '32px', width: '100%' }}
              placeholder="ค้นหาข้อความ, รหัสความคิดเห็น, ผู้เขียน, รหัสโพสต์..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <input 
              type="text"
              className="search-input-field"
              style={{ width: '130px', fontSize: '12px' }}
              placeholder="กรองรหัสโพสต์..."
              value={filterPostId}
              onChange={(e) => {
                setFilterPostId(e.target.value);
                setCurrentPage(1);
              }}
            />
            {filterPostId && (
              <button 
                className="btn btn-outline btn-sm"
                style={{ padding: '4px 8px', fontSize: '11.5px', color: '#d92d20' }}
                onClick={() => setFilterPostId('')}
                title="ล้างตัวกรองรหัสโพสต์"
              >
                <X size={12} />
                <span>ล้าง</span>
              </button>
            )}
          </div>

          <select 
            className="filter-select"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as any);
              setCurrentPage(1);
            }}
          >
            <option value="all">สถานะทั้งหมด</option>
            <option value="published">เผยแพร่อยู่ / ปกติ</option>
            <option value="hidden">ถูกซ่อน</option>
          </select>

          <button className="btn btn-outline btn-sm" onClick={fetchComments} disabled={loading}>
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            <span>รีเฟรช</span>
          </button>
        </div>

        {filterPostId && (
          <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: '#667085' }}>ตัวกรองที่ใช้งาน:</span>
            <span 
              className="badge badge-content-type" 
              style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', backgroundColor: '#eff8ff', color: '#175cd3' }}
            >
              <span>กำลังแสดงเฉพาะความคิดเห็นของ โพสต์ #{filterPostId}</span>
              <button 
                onClick={() => setFilterPostId('')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: '#175cd3' }}
              >
                <X size={12} />
              </button>
            </span>
          </div>
        )}
      </div>

      <div className="table-card">
        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '130px' }}>รหัสความคิดเห็น</th>
                <th>ข้อความ</th>
                <th style={{ width: '140px' }}>โพสต์ต้นทาง</th>
                <th style={{ width: '160px' }}>ผู้เขียน</th>
                <th style={{ width: '120px' }}>วันที่สร้าง</th>
                <th style={{ width: '100px' }}>สถานะ</th>
                <th style={{ width: '100px' }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: '#667085' }}>
                    กำลังโหลดข้อมูลความคิดเห็น...
                  </td>
                </tr>
              ) : paginatedComments.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: '#667085' }}>
                    ไม่พบข้อมูลความคิดเห็นที่ตรงกับเงื่อนไข
                  </td>
                </tr>
              ) : (
                paginatedComments.map(c => {
                  const authorName = c.profiles?.display_name || c.profiles?.username || (c.user_id ? `${c.user_id.substring(0, 8)}...` : 'ผู้ใช้งาน');
                  const postTitle = c.post?.food_name || `โพสต์ #${c.post_id}`;

                  return (
                    <tr key={c.id}>
                      <td>
                        <span 
                          className="badge badge-content-type"
                          style={{ 
                            fontFamily: 'monospace', 
                            fontWeight: 700, 
                            color: '#027a48', 
                            backgroundColor: '#ecfdf3',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <span>#{c.id}</span>
                          <button 
                            onClick={() => handleCopy(String(c.id), 'รหัสความคิดเห็น')}
                            title="คัดลอกรหัสความคิดเห็น"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: '#027a48' }}
                          >
                            <Copy size={11} />
                          </button>
                        </span>
                      </td>
                      <td>
                        <div style={{ color: '#101828', fontWeight: 500, fontSize: '13px', lineHeight: 1.4 }}>
                          {c.content}
                        </div>
                      </td>
                      <td>
                        <span 
                          className="badge badge-content-type"
                          style={{ cursor: 'pointer', backgroundColor: '#eff8ff', color: '#175cd3' }}
                          onClick={() => setFilterPostId(String(c.post_id))}
                          title={`คลิกเพื่อกรองความคิดเห็นในโพสต์ #${c.post_id}`}
                        >
                          <span style={{ fontWeight: 600 }}>#{c.post_id}</span> {postTitle !== `โพสต์ #${c.post_id}` ? `(${postTitle})` : ''}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#344054' }}>
                          <User size={13} color="#667085" />
                          <span style={{ fontWeight: 500 }}>{authorName}</span>
                        </div>
                        {c.profiles?.username && (
                          <div style={{ fontSize: '10.5px', color: '#98a2b3', paddingLeft: '17px' }}>
                            @{c.profiles.username}
                          </div>
                        )}
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
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
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
                  );
                })
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
              แสดงความคิดเห็นที่ <strong>{startIndex + 1}</strong> ถึง <strong>{Math.min(startIndex + pageSize, totalItems)}</strong> จากทั้งหมด <strong>{totalItems}</strong> รายการ
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
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
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
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
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
