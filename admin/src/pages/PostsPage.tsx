import React, { useState, useEffect } from 'react';
import { 
  EyeOff, 
  Eye, 
  Trash2, 
  RefreshCw, 
  FileText, 
  MessageSquare, 
  X, 
  User, 
  ArrowRight,
  Layers,
  Copy,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { adminApi } from '../services/adminApi';

interface PostsPageProps {
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const PostsPage: React.FC<PostsPageProps> = ({ onShowToast }) => {
  // Sub-tabs: 'posts' | 'comments'
  const [activeSubTab, setActiveSubTab] = useState<'posts' | 'comments'>('posts');

  const [posts, setPosts] = useState<any[]>([]);
  const [allComments, setAllComments] = useState<any[]>([]);
  const [profileMap, setProfileMap] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'hidden'>('all');
  const [filterPostId, setFilterPostId] = useState<string>('');

  // Pagination for posts
  const [postPage, setPostPage] = useState(1);
  const [postPageSize, setPostPageSize] = useState(15);

  // Pagination for comments
  const [commentPage, setCommentPage] = useState(1);
  const [commentPageSize, setCommentPageSize] = useState(15);

  // Selected post for drawer view (showing post + its full comment thread)
  const [selectedPost, setSelectedPost] = useState<any | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [postsRes, commentsRes] = await Promise.all([
        adminApi.getPosts({ limit: 300 }),
        adminApi.getComments({ limit: 500 })
      ]);

      const loadedPosts = (postsRes.data || []).map((p: any) => ({
        ...p,
        _hidden: p.is_hidden ?? false,
      }));
      const loadedComments = (commentsRes.data || []).map((c: any) => ({
        ...c,
        _hidden: c.is_hidden ?? false,
      }));

      setPosts(loadedPosts);
      setAllComments(loadedComments);

      // Create author map from enriched profiles if available
      const pMap: Record<string, any> = {};
      loadedPosts.forEach((p: any) => {
        if (p.profiles && p.user_id) {
          pMap[p.user_id] = p.profiles;
        }
      });
      loadedComments.forEach((c: any) => {
        if (c.profiles && c.user_id) {
          pMap[c.user_id] = c.profiles;
        }
      });
      setProfileMap(pMap);
    } catch (e: any) {
      console.error('API fetch failed, falling back to Supabase client directly:', e);
      try {
        const [postsRes, commentsRes, profilesRes] = await Promise.all([
          supabase.from('posts').select('id, user_id, food_name, description, image_url, restaurant_url, restaurant_name, created_at, is_hidden').order('created_at', { ascending: false }).limit(200),
          supabase.from('comments').select('id, user_id, post_id, content, created_at, is_hidden').order('created_at', { ascending: false }).limit(500),
          supabase.from('profiles').select('id, username, display_name, avatar_url').limit(200)
        ]);
        setPosts((postsRes.data || []).map((p: any) => ({ ...p, _hidden: p.is_hidden ?? false })));
        setAllComments((commentsRes.data || []).map((c: any) => ({ ...c, _hidden: c.is_hidden ?? false })));
        const pMap: Record<string, any> = {};
        (profilesRes.data || []).forEach((p: any) => {
          pMap[p.id] = p;
        });
        setProfileMap(pMap);
      } catch (err: any) {
        onShowToast(`โหลดข้อมูลไม่สำเร็จ: ${err.message}`, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Reset pagination when search or filters change
  useEffect(() => {
    setPostPage(1);
    setCommentPage(1);
  }, [search, statusFilter, filterPostId, activeSubTab]);

  // Compute comment counts map
  const commentCountsMap: Record<number, number> = {};
  allComments.forEach(c => {
    if (!c._removed) {
      commentCountsMap[c.post_id] = (commentCountsMap[c.post_id] || 0) + 1;
    }
  });

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    onShowToast(`คัดลอก ${label} #${text} เรียบร้อยแล้ว`, 'info');
  };

  // Post Actions
  const handleToggleHidePost = async (postId: number, currentHidden: boolean) => {
    const nextHidden = !currentHidden;
    try {
      try {
        await adminApi.setPostVisibility(postId, nextHidden);
      } catch (apiErr) {
        console.warn('adminApi setPostVisibility failed, falling back to direct Supabase:', apiErr);
        const { error } = await supabase.from('posts').update({ is_hidden: nextHidden }).eq('id', postId);
        if (error) throw error;
      }
      setPosts(prev => prev.map(p => {
        if (p.id === postId) {
          return { ...p, is_hidden: nextHidden, _hidden: nextHidden };
        }
        return p;
      }));
      if (selectedPost && selectedPost.id === postId) {
        setSelectedPost((prev: any) => ({ ...prev, is_hidden: nextHidden, _hidden: nextHidden }));
      }
      onShowToast(`อัปเดตการแสดงผลโพสต์ #${postId} เรียบร้อยแล้ว`, 'success');
    } catch (err: any) {
      console.error(err);
      onShowToast(`เกิดข้อผิดพลาดในการอัปเดตโพสต์: ${err.message}`, 'error');
    }
  };

  const handleRemovePost = async (postId: number) => {
    if (confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบโพสต์ #${postId}? การลบนี้จะไม่สามารถกู้คืนได้`)) {
      try {
        // 1. Primary: Direct Supabase RPC
        const { error: rpcErr } = await supabase.rpc('admin_delete_post_completely', {
          target_post_id: postId,
        });

        if (rpcErr) {
          console.warn('RPC admin_delete_post_completely failed, falling back to adminApi:', rpcErr);
          await adminApi.deletePost(postId);
        }

        setPosts(prev => prev.filter(p => p.id !== postId));
        if (selectedPost && selectedPost.id === postId) {
          setSelectedPost(null);
        }
        onShowToast(`ลบโพสต์ #${postId} เรียบร้อยแล้ว`, 'success');
      } catch (err: any) {
        console.error(err);
        onShowToast(`เกิดข้อผิดพลาดในการลบโพสต์: ${err.message}`, 'error');
      }
    }
  };

  // Comment Actions
  const handleToggleHideComment = async (commentId: number, currentHidden: boolean) => {
    const nextHidden = !currentHidden;
    try {
      try {
        await adminApi.setCommentVisibility(commentId, nextHidden);
      } catch (apiErr) {
        console.warn('adminApi setCommentVisibility failed, falling back to direct Supabase:', apiErr);
        const { error } = await supabase.from('comments').update({ is_hidden: nextHidden }).eq('id', commentId);
        if (error) throw error;
      }
      setAllComments(prev => prev.map(c => {
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
    if (confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบความคิดเห็น #${commentId}? การลบนี้จะไม่สามารถกู้คืนได้`)) {
      try {
        try {
          await adminApi.deleteComment(commentId);
        } catch (apiErr) {
          console.warn('adminApi deleteComment failed, falling back to direct Supabase:', apiErr);
          const { error } = await supabase.from('comments').delete().eq('id', commentId);
          if (error) throw error;
        }
        setAllComments(prev => prev.filter(c => c.id !== commentId));
        onShowToast(`ลบความคิดเห็น #${commentId} เรียบร้อยแล้ว`, 'success');
      } catch (err: any) {
        console.error(err);
        onShowToast(`เกิดข้อผิดพลาดในการลบความคิดเห็น: ${err.message}`, 'error');
      }
    }
  };

  const getAuthorDisplay = (userId?: string) => {
    if (!userId) return { username: 'anon', name: 'ผู้ใช้ทั่วไป' };
    const profile = profileMap[userId];
    if (profile) {
      return {
        username: profile.username || 'user',
        name: profile.display_name || profile.username || 'ผู้ใช้',
      };
    }
    return {
      username: userId ? userId.substring(0, 8) : 'anon',
      name: 'ผู้ใช้ Kin-Rai-Dee',
    };
  };

  // Filtered Posts
  const filteredPosts = posts.filter(p => {
    const q = search.trim().toLowerCase().replace(/^#/, '');
    const matchSearch = !search || 
      (p.food_name && p.food_name.toLowerCase().includes(q)) ||
      (p.description && p.description.toLowerCase().includes(q)) ||
      String(p.id).includes(q);
    
    if (statusFilter === 'hidden') return matchSearch && p._hidden;
    if (statusFilter === 'published') return matchSearch && !p._hidden;
    return matchSearch;
  });

  // Filtered Comments with Parent Post Context & Scalable Filter
  const filteredComments = allComments
    .filter(c => !c._removed)
    .filter(c => {
      // Check Post ID filter if specified
      if (filterPostId) {
        const cleanTargetPostId = filterPostId.trim().replace(/^#/, '');
        if (String(c.post_id) !== cleanTargetPostId) {
          return false;
        }
      }

      const parentPost = posts.find(p => p.id === c.post_id);
      const author = getAuthorDisplay(c.user_id);
      const q = search.trim().toLowerCase().replace(/^#/, '');

      const matchSearch = !search || 
        String(c.id).includes(q) ||
        String(c.post_id).includes(q) ||
        (c.content && c.content.toLowerCase().includes(q)) ||
        (parentPost?.food_name && parentPost.food_name.toLowerCase().includes(q)) ||
        (author.username && author.username.toLowerCase().includes(q)) ||
        (author.name && author.name.toLowerCase().includes(q));

      if (statusFilter === 'hidden') return matchSearch && c._hidden;
      if (statusFilter === 'published') return matchSearch && !c._hidden;
      return matchSearch;
    });

  // Pagination calculation for comments
  const totalComments = filteredComments.length;
  const totalCommentPages = Math.max(1, Math.ceil(totalComments / commentPageSize));
  const safeCommentPage = Math.min(commentPage, totalCommentPages);
  const commentStartIndex = (safeCommentPage - 1) * commentPageSize;
  const paginatedComments = filteredComments.slice(commentStartIndex, commentStartIndex + commentPageSize);

  // Pagination calculation for posts
  const totalPosts = filteredPosts.length;
  const totalPostPages = Math.max(1, Math.ceil(totalPosts / postPageSize));
  const safePostPage = Math.min(postPage, totalPostPages);
  const postStartIndex = (safePostPage - 1) * postPageSize;
  const paginatedPosts = filteredPosts.slice(postStartIndex, postStartIndex + postPageSize);

  const postComments = selectedPost 
    ? allComments.filter(c => c.post_id === selectedPost.id && !c._removed)
    : [];

  return (
    <div>
      {/* Sub-tabs Header: Switch between Posts and Comments */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <div className="tab-group" style={{ borderBottom: 'none' }}>
          <button 
            className={`tab-btn ${activeSubTab === 'posts' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('posts')}
            style={{ fontSize: '13px', padding: '6px 14px' }}
          >
            <Layers size={14} />
            <span>โพสต์ทั้งหมด</span>
            <span style={{ fontSize: '11px', background: activeSubTab === 'posts' ? '#e0edff' : '#f2f4f7', color: activeSubTab === 'posts' ? '#2563eb' : '#667085', padding: '1px 6px', borderRadius: '10px' }}>
              {posts.length}
            </span>
          </button>

          <button 
            className={`tab-btn ${activeSubTab === 'comments' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('comments')}
            style={{ fontSize: '13px', padding: '6px 14px' }}
          >
            <MessageSquare size={14} />
            <span>ความคิดเห็นทั้งหมด</span>
            <span style={{ fontSize: '11px', background: activeSubTab === 'comments' ? '#e0edff' : '#f2f4f7', color: activeSubTab === 'comments' ? '#2563eb' : '#667085', padding: '1px 6px', borderRadius: '10px' }}>
              {allComments.filter(c => !c._removed).length}
            </span>
          </button>
        </div>

        <button className="btn btn-outline btn-sm" onClick={fetchData} disabled={loading}>
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          <span>รีเฟรชข้อมูล</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="filter-card">
        <div className="filter-row" style={{ flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ position: 'relative', flex: '1 1 240px' }}>
            <Search size={14} color="#98a2b3" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text"
              className="search-input-field"
              style={{ paddingLeft: '32px', width: '100%' }}
              placeholder={
                activeSubTab === 'posts'
                  ? "ค้นหาชื่ออาหาร, รหัสโพสต์ (เช่น 38), คำบรรยาย..."
                  : "ค้นหารหัสความคิดเห็น, ข้อความ, ผู้เขียน, ชื่ออาหาร หรือรหัสโพสต์..."
              }
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Quick filter by post ID in comments tab */}
          {activeSubTab === 'comments' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <input 
                type="text"
                className="search-input-field"
                style={{ width: '130px', fontSize: '12px' }}
                placeholder="รหัสโพสต์..."
                value={filterPostId}
                onChange={(e) => setFilterPostId(e.target.value)}
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
          )}

          <select 
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
          >
            <option value="all">สถานะทั้งหมด</option>
            <option value="published">เผยแพร่อยู่ / ปกติ</option>
            <option value="hidden">ถูกซ่อน</option>
          </select>
        </div>

        {/* Active Filter Chips */}
        {activeSubTab === 'comments' && filterPostId && (
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

      {/* VIEW 1: POSTS TABLE */}
      {activeSubTab === 'posts' && (
        <div className="table-card">
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: '80px' }}>รหัส</th>
                  <th style={{ width: '60px' }}>รูปภาพ</th>
                  <th>ชื่ออาหาร</th>
                  <th>คำบรรยาย</th>
                  <th style={{ width: '150px' }}>ความคิดเห็น</th>
                  <th style={{ width: '120px' }}>วันที่สร้าง</th>
                  <th style={{ width: '100px' }}>สถานะ</th>
                  <th style={{ width: '110px' }}>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: '#667085' }}>
                      กำลังโหลดข้อมูลโพสต์...
                    </td>
                  </tr>
                ) : paginatedPosts.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: '#667085' }}>
                      ไม่พบโพสต์ที่ตรงกับคำค้นหา
                    </td>
                  </tr>
                ) : (
                  paginatedPosts.map(p => {
                    const commentsCount = commentCountsMap[p.id] || 0;
                    return (
                      <tr 
                        key={p.id}
                        onClick={() => setSelectedPost(p)}
                        style={{ cursor: 'pointer' }}
                        title="คลิกเพื่อดูรายละเอียดโพสต์และกระทู้ความคิดเห็น"
                      >
                        <td style={{ fontFamily: 'monospace', fontWeight: 600, color: '#101828' }}>
                          #{p.id}
                        </td>
                        <td>
                          {p.image_url ? (
                            <img 
                              src={p.image_url} 
                              alt={p.food_name} 
                              style={{ width: '38px', height: '38px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #eaecf0' }} 
                            />
                          ) : (
                            <div style={{ width: '38px', height: '38px', background: '#f2f4f7', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <FileText size={15} color="#98a2b3" />
                            </div>
                          )}
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, color: '#101828' }}>{p.food_name}</div>
                        </td>
                        <td style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#475467', fontSize: '12px' }}>
                          {p.description || '-'}
                        </td>
                        <td onClick={(e) => {
                          e.stopPropagation();
                          setActiveSubTab('comments');
                          setFilterPostId(String(p.id));
                        }}>
                          <span 
                            className="badge badge-content-type"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                            title="คลิกเพื่อดูกรองเฉพาะความคิดเห็นของโพสต์นี้"
                          >
                            <MessageSquare size={12} color="#2563eb" />
                            <span>{commentsCount} รายการ</span>
                          </span>
                        </td>
                        <td style={{ fontSize: '12px', color: '#667085' }}>
                          {new Date(p.created_at).toLocaleDateString('th-TH')}
                        </td>
                        <td>
                          {p._hidden ? (
                            <span className="badge badge-pending">ถูกซ่อน</span>
                          ) : (
                            <span className="badge badge-action_taken">เผยแพร่อยู่</span>
                          )}
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <button 
                              className="btn btn-outline btn-sm"
                              onClick={() => handleToggleHidePost(p.id, !!p._hidden)}
                              title={p._hidden ? 'แสดงโพสต์กลับ' : 'ซ่อนโพสต์'}
                            >
                              {p._hidden ? <Eye size={12} color="#079455" /> : <EyeOff size={12} color="#b54708" />}
                            </button>
                            <button 
                              className="btn btn-outline btn-sm"
                              onClick={() => handleRemovePost(p.id)}
                              title="ลบโพสต์"
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

          {/* Posts Pagination Footer */}
          {totalPosts > 0 && (
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
                แสดง <strong>{postStartIndex + 1}</strong> ถึง <strong>{Math.min(postStartIndex + postPageSize, totalPosts)}</strong> จากทั้งหมด <strong>{totalPosts}</strong> โพสต์
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '12px', color: '#667085' }}>จำนวนต่อหน้า:</span>
                  <select 
                    className="filter-select"
                    style={{ padding: '4px 8px', fontSize: '12px', height: '28px' }}
                    value={postPageSize}
                    onChange={(e) => {
                      setPostPageSize(Number(e.target.value));
                      setPostPage(1);
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
                    onClick={() => setPostPage(p => Math.max(1, p - 1))}
                    disabled={safePostPage <= 1}
                  >
                    <ChevronLeft size={14} />
                    <span>ก่อนหน้า</span>
                  </button>

                  <span style={{ padding: '0 8px', fontWeight: 600, color: '#101828' }}>
                    {safePostPage} / {totalPostPages}
                  </span>

                  <button 
                    className="btn btn-outline btn-sm"
                    style={{ padding: '4px 8px', height: '28px' }}
                    onClick={() => setPostPage(p => Math.min(totalPostPages, p + 1))}
                    disabled={safePostPage >= totalPostPages}
                  >
                    <span>ถัดไป</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: COMMENTS WITH PARENT POST CONTEXT & SCALABLE PAGINATION */}
      {activeSubTab === 'comments' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {loading ? (
            <div className="table-card" style={{ textAlign: 'center', padding: '36px', color: '#667085' }}>
              กำลังโหลดข้อมูลความคิดเห็น...
            </div>
          ) : paginatedComments.length === 0 ? (
            <div className="table-card" style={{ textAlign: 'center', padding: '36px', color: '#667085' }}>
              {search || filterPostId || statusFilter !== 'all' 
                ? 'ไม่พบความคิดเห็นที่ตรงกับคำค้นหาหรือตัวกรอง' 
                : 'ยังไม่มีความคิดเห็นในระบบ'}
            </div>
          ) : (
            paginatedComments.map(c => {
              const parentPost = posts.find(p => p.id === c.post_id);
              const author = getAuthorDisplay(c.user_id);

              return (
                <div 
                  key={c.id} 
                  className="table-card" 
                  style={{ 
                    padding: '14px 16px', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '10px',
                    borderLeft: c._hidden ? '3px solid #d92d20' : '3px solid #2563eb'
                  }}
                >
                  {/* Top Bar: Comment Meta & Action Buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', flexWrap: 'wrap' }}>
                      {/* Exact Comment ID Badge with Copy button */}
                      <span 
                        className="badge badge-content-type"
                        style={{ 
                          fontFamily: 'monospace', 
                          fontWeight: 700, 
                          color: '#027a48', 
                          backgroundColor: '#ecfdf3', 
                          borderColor: '#a6f4c5',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <span>ความคิดเห็น #{c.id}</span>
                        <button 
                          onClick={() => handleCopy(String(c.id), 'รหัสความคิดเห็น')}
                          title="คัดลอกรหัสความคิดเห็น"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: '#027a48' }}
                        >
                          <Copy size={11} />
                        </button>
                      </span>

                      <span style={{ color: '#d0d5dd' }}>|</span>

                      {/* Parent Post Link Badge */}
                      <span 
                        className="badge badge-content-type"
                        style={{ 
                          backgroundColor: '#eff8ff', 
                          color: '#175cd3', 
                          borderColor: '#b2ddff',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                        onClick={() => {
                          setFilterPostId(String(c.post_id));
                          onShowToast(`กรองเฉพาะความคิดเห็นของโพสต์ #${c.post_id}`, 'info');
                        }}
                        title="คลิกเพื่อกรองเฉพาะความคิดเห็นในโพสต์นี้"
                      >
                        <span>โพสต์ #{c.post_id}</span>
                        <Filter size={10} />
                      </span>

                      <span style={{ color: '#d0d5dd' }}>|</span>

                      <span style={{ color: '#475467', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <User size={13} color="#667085" />
                        <strong>{author.name}</strong> (@{author.username})
                      </span>

                      <span style={{ color: '#d0d5dd' }}>|</span>

                      <span style={{ color: '#667085' }}>
                        {new Date(c.created_at).toLocaleString('th-TH')}
                      </span>

                      {c._hidden ? (
                        <span className="badge badge-pending">ถูกซ่อนอยู่</span>
                      ) : (
                        <span className="badge badge-action_taken">ปกติ</span>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button 
                        className="btn btn-outline btn-sm"
                        onClick={() => handleToggleHideComment(c.id, !!c._hidden)}
                        title={c._hidden ? 'แสดงความคิดเห็นกลับคืน' : 'ซ่อนความคิดเห็นนี้'}
                      >
                        {c._hidden ? <Eye size={12} color="#079455" /> : <EyeOff size={12} color="#b54708" />}
                        <span>{c._hidden ? 'แสดงกลับ' : 'ซ่อน'}</span>
                      </button>
                      <button 
                        className="btn btn-outline btn-sm"
                        style={{ color: '#d92d20' }}
                        onClick={() => handleRemoveComment(c.id)}
                        title="ลบความคิดเห็นถาวร"
                      >
                        <Trash2 size={12} />
                        <span>ลบ</span>
                      </button>
                    </div>
                  </div>

                  {/* Comment Body */}
                  <div style={{ 
                    fontSize: '13.5px', 
                    color: '#101828', 
                    lineHeight: 1.5,
                    backgroundColor: '#ffffff',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #eaecf0',
                    fontWeight: 500
                  }}>
                    {c.content}
                  </div>

                  {/* PARENT POST CONTEXT BOX */}
                  <div style={{ 
                    background: '#f9fafb', 
                    borderRadius: '6px', 
                    padding: '8px 12px', 
                    border: '1px solid #f2f4f7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                      {parentPost?.image_url ? (
                        <img 
                          src={parentPost.image_url} 
                          alt={parentPost.food_name} 
                          style={{ width: '36px', height: '36px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #eaecf0', flexShrink: 0 }}
                        />
                      ) : (
                        <div style={{ width: '36px', height: '36px', background: '#eaecf0', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <FileText size={16} color="#667085" />
                        </div>
                      )}

                      <div style={{ overflow: 'hidden' }}>
                        <div style={{ fontSize: '11px', color: '#667085', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span>บริบทโพสต์ต้นทาง:</span>
                          <span style={{ fontWeight: 600, color: '#101828' }}>โพสต์ #{c.post_id}</span>
                        </div>
                        <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#101828', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {parentPost ? parentPost.food_name : `โพสต์ ID ${c.post_id} (ไม่พบข้อมูลในตาราง)`}
                        </div>
                        {parentPost?.description && (
                          <div style={{ fontSize: '11px', color: '#475467', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {parentPost.description}
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                      <button 
                        className="btn btn-outline btn-sm"
                        style={{ fontSize: '11px', padding: '4px 8px' }}
                        onClick={() => {
                          setFilterPostId(String(c.post_id));
                          onShowToast(`กรองความคิดเห็นเฉพาะโพสต์ #${c.post_id}`, 'info');
                        }}
                        title="กรองแสดงเฉพาะความคิดเห็นในโพสต์นี้"
                      >
                        <Filter size={11} />
                        <span>กรองเฉพาะโพสต์นี้</span>
                      </button>

                      {parentPost && (
                        <button 
                          className="btn btn-outline btn-sm"
                          style={{ fontSize: '11px', padding: '4px 8px' }}
                          onClick={() => setSelectedPost(parentPost)}
                          title="เปิดดูโพสต์เต็มและกระทู้ความคิดเห็นทั้งหมด"
                        >
                          <span>ดูบริบทโพสต์เต็ม</span>
                          <ArrowRight size={11} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {/* Comments Pagination Controls */}
          {totalComments > 0 && (
            <div className="table-card" style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              padding: '12px 16px', 
              fontSize: '12.5px',
              color: '#475467',
              flexWrap: 'wrap',
              gap: '8px'
            }}>
              <div>
                แสดงความคิดเห็นที่ <strong>{commentStartIndex + 1}</strong> ถึง <strong>{Math.min(commentStartIndex + commentPageSize, totalComments)}</strong> จากทั้งหมด <strong>{totalComments}</strong> รายการ
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '12px', color: '#667085' }}>จำนวนต่อหน้า:</span>
                  <select 
                    className="filter-select"
                    style={{ padding: '4px 8px', fontSize: '12px', height: '28px' }}
                    value={commentPageSize}
                    onChange={(e) => {
                      setCommentPageSize(Number(e.target.value));
                      setCommentPage(1);
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
                    onClick={() => setCommentPage(p => Math.max(1, p - 1))}
                    disabled={safeCommentPage <= 1}
                    title="หน้าก่อนหน้า"
                  >
                    <ChevronLeft size={14} />
                    <span>ก่อนหน้า</span>
                  </button>

                  <span style={{ padding: '0 8px', fontWeight: 600, color: '#101828' }}>
                    {safeCommentPage} / {totalCommentPages}
                  </span>

                  <button 
                    className="btn btn-outline btn-sm"
                    style={{ padding: '4px 8px', height: '28px' }}
                    onClick={() => setCommentPage(p => Math.min(totalCommentPages, p + 1))}
                    disabled={safeCommentPage >= totalCommentPages}
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
      )}

      {/* Post & Comments Inspection Drawer */}
      {selectedPost && (
        <div className="drawer-overlay" onClick={() => setSelectedPost(null)}>
          <div className="drawer-container" onClick={(e) => e.stopPropagation()}>
            {/* Drawer Header */}
            <div className="drawer-header">
              <div className="drawer-title-group">
                <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#101828' }}>
                  รายละเอียดโพสต์ #{selectedPost.id}
                </h2>
                {selectedPost._hidden ? (
                  <span className="badge badge-pending">ถูกซ่อน</span>
                ) : (
                  <span className="badge badge-action_taken">เผยแพร่อยู่</span>
                )}
              </div>
              <button 
                onClick={() => setSelectedPost(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#667085' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="drawer-body">
              {/* Post Details Card */}
              <div className="drawer-card">
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#101828', marginBottom: '4px' }}>
                      {selectedPost.food_name}
                    </h3>
                    <div style={{ fontSize: '12px', color: '#667085', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>ผู้โพสต์: User ID {selectedPost.user_id ? selectedPost.user_id.substring(0, 8) : 'anon'}...</span>
                      <span>•</span>
                      <span>{new Date(selectedPost.created_at).toLocaleString('th-TH')}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button 
                      className="btn btn-outline btn-sm"
                      onClick={() => handleToggleHidePost(selectedPost.id, !!selectedPost._hidden)}
                    >
                      {selectedPost._hidden ? <Eye size={12} /> : <EyeOff size={12} />}
                      <span>{selectedPost._hidden ? 'แสดงโพสต์กลับ' : 'ซ่อนโพสต์'}</span>
                    </button>
                    <button 
                      className="btn btn-danger btn-sm"
                      onClick={() => handleRemovePost(selectedPost.id)}
                    >
                      <Trash2 size={12} />
                      <span>ลบโพสต์</span>
                    </button>
                  </div>
                </div>

                <div className="ugc-preview-box">
                  <p style={{ color: '#344054', fontSize: '13px', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                    {selectedPost.description || '(ไม่มีคำบรรยาย)'}
                  </p>

                  {selectedPost.image_url && (
                    <div style={{ marginTop: '10px' }}>
                      <img 
                        src={selectedPost.image_url} 
                        alt={selectedPost.food_name} 
                        className="ugc-image-preview" 
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Comments Under This Post */}
              <div className="drawer-card" style={{ marginBottom: 0 }}>
                <div className="drawer-section-title" style={{ justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MessageSquare size={15} color="#2563eb" />
                    <span>ความคิดเห็นใต้โพสต์นี้ ({postComments.length} รายการ)</span>
                  </div>
                  <span style={{ fontSize: '11px', color: '#667085', fontWeight: 400 }}>
                    เรียงตามเวลาที่แสดงความคิดเห็น
                  </span>
                </div>

                {postComments.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px 16px', color: '#667085', fontSize: '12.5px' }}>
                    ยังไม่มีความคิดเห็นใต้โพสต์นี้
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {postComments.map((c) => {
                      const author = getAuthorDisplay(c.user_id);
                      return (
                        <div 
                          key={c.id} 
                          style={{ 
                            padding: '12px', 
                            background: c._hidden ? '#fef3f2' : '#f9fafb', 
                            borderRadius: '6px', 
                            border: '1px solid #eaecf0',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '6px'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                              <span 
                                className="badge badge-content-type" 
                                style={{ 
                                  fontFamily: 'monospace', 
                                  fontWeight: 700, 
                                  color: '#027a48', 
                                  backgroundColor: '#ecfdf3', 
                                  padding: '1px 6px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '3px'
                                }}
                              >
                                <span>ความคิดเห็น #{c.id}</span>
                                <button 
                                  onClick={() => handleCopy(String(c.id), 'รหัสความคิดเห็น')}
                                  title="คัดลอกรหัสความคิดเห็น"
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: '#027a48' }}
                                >
                                  <Copy size={10} />
                                </button>
                              </span>

                              <span style={{ fontWeight: 600, color: '#101828' }}>
                                {author.name} (@{author.username})
                              </span>
                              <span style={{ color: '#667085' }}>•</span>
                              <span style={{ color: '#667085' }}>
                                {new Date(c.created_at).toLocaleString('th-TH')}
                              </span>
                              {c._hidden && (
                                <span className="badge badge-pending" style={{ fontSize: '10px' }}>
                                  ถูกซ่อนอยู่
                                </span>
                              )}
                            </div>

                            {/* Comment Actions */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <button 
                                className="btn btn-outline btn-sm"
                                style={{ padding: '2px 6px', fontSize: '11px' }}
                                onClick={() => handleToggleHideComment(c.id, !!c._hidden)}
                                title={c._hidden ? 'แสดงความคิดเห็นกลับ' : 'ซ่อนความคิดเห็นนี้'}
                              >
                                {c._hidden ? <Eye size={11} color="#079455" /> : <EyeOff size={11} color="#b54708" />}
                                <span>{c._hidden ? 'แสดงกลับ' : 'ซ่อน'}</span>
                              </button>
                              <button 
                                className="btn btn-outline btn-sm"
                                style={{ padding: '2px 6px', fontSize: '11px', color: '#d92d20' }}
                                onClick={() => handleRemoveComment(c.id)}
                                title="ลบความคิดเห็นนี้"
                              >
                                <Trash2 size={11} />
                                <span>ลบ</span>
                              </button>
                            </div>
                          </div>

                          <div style={{ fontSize: '13px', color: '#344054', lineHeight: 1.5, background: '#ffffff', padding: '8px 10px', borderRadius: '4px', border: '1px solid #eaecf0' }}>
                            {c.content}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};
