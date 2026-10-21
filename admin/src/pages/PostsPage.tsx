import React, { useState, useEffect } from 'react';
import { 
  EyeOff, 
  Eye, 
  Trash2, 
  ExternalLink, 
  RefreshCw, 
  FileText, 
  MessageSquare, 
  X, 
  User, 
  ArrowRight,
  Layers
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { moderationService } from '../services/moderationService';

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

  // Selected post for drawer view (showing post + its full comment thread)
  const [selectedPost, setSelectedPost] = useState<any | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [postsRes, commentsRes, profilesRes] = await Promise.all([
        supabase.from('posts').select('*').order('created_at', { ascending: false }).limit(50),
        supabase.from('comments').select('*').order('created_at', { ascending: false }),
        supabase.from('profiles').select('*').limit(50)
      ]);

      if (postsRes.error) throw postsRes.error;
      setPosts(postsRes.data || []);
      setAllComments(commentsRes.data || []);

      const pMap: Record<string, any> = {};
      (profilesRes.data || []).forEach((p: any) => {
        pMap[p.id] = p;
      });
      setProfileMap(pMap);
    } catch (e: any) {
      console.error(e);
      onShowToast(`โหลดข้อมูลไม่สำเร็จ: ${e.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Compute comment counts map
  const commentCountsMap: Record<number, number> = {};
  allComments.forEach(c => {
    if (!c._removed) {
      commentCountsMap[c.post_id] = (commentCountsMap[c.post_id] || 0) + 1;
    }
  });

  // Post Actions
  const handleToggleHidePost = (postId: number, currentHidden: boolean) => {
    const targetPost = posts.find(p => p.id === postId);
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return { ...p, _hidden: !currentHidden };
      }
      return p;
    }));
    if (selectedPost && selectedPost.id === postId) {
      setSelectedPost((prev: any) => ({ ...prev, _hidden: !currentHidden }));
    }

    moderationService.addAuditLog({
      actorId: 'mod-1',
      actorName: 'แอดมินสุภพ (Super Admin)',
      actionType: currentHidden ? 'POST_RESTORE' : 'POST_HIDE',
      targetType: 'post',
      targetId: postId,
      note: currentHidden ? `แสดงโพสต์ #${postId} กลับคืนสู่ระบบ` : `ซ่อนโพสต์ #${postId} จากการแสดงผล`,
      metadata: {
        foodName: targetPost?.food_name
      }
    });

    onShowToast(`อัปเดตการแสดงผลโพสต์ #${postId} เรียบร้อยแล้ว`, 'success');
  };

  const handleRemovePost = (postId: number) => {
    const targetPost = posts.find(p => p.id === postId);
    if (confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบโพสต์ #${postId}?`)) {
      setPosts(prev => prev.filter(p => p.id !== postId));
      if (selectedPost && selectedPost.id === postId) {
        setSelectedPost(null);
      }

      moderationService.addAuditLog({
        actorId: 'mod-1',
        actorName: 'แอดมินสุภพ (Super Admin)',
        actionType: 'POST_REMOVE',
        targetType: 'post',
        targetId: postId,
        note: `ลบโพสต์ #${postId} (${targetPost?.food_name || 'อาหาร'}) ถาวร`,
        metadata: {
          foodName: targetPost?.food_name
        }
      });

      onShowToast(`ลบโพสต์ #${postId} เรียบร้อยแล้ว`, 'success');
    }
  };

  // Comment Actions
  const handleToggleHideComment = (commentId: number, currentHidden: boolean) => {
    const targetComment = allComments.find(c => c.id === commentId);
    setAllComments(prev => prev.map(c => {
      if (c.id === commentId) {
        return { ...c, _hidden: !currentHidden };
      }
      return c;
    }));

    moderationService.addAuditLog({
      actorId: 'mod-1',
      actorName: 'แอดมินสุภพ (Super Admin)',
      actionType: currentHidden ? 'COMMENT_RESTORE' : 'COMMENT_HIDE',
      targetType: 'comment',
      targetId: commentId,
      note: currentHidden ? `แสดงความคิดเห็น #${commentId} กลับคืนสู่ระบบ` : `ซ่อนความคิดเห็น #${commentId}`,
      metadata: {
        parentPostId: targetComment?.post_id,
        contentSnippet: targetComment?.content?.substring(0, 40)
      }
    });

    onShowToast(`อัปเดตสถานะความคิดเห็น #${commentId} แล้ว`, 'success');
  };

  const handleRemoveComment = (commentId: number) => {
    const targetComment = allComments.find(c => c.id === commentId);
    if (confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบความคิดเห็น #${commentId}?`)) {
      setAllComments(prev => prev.map(c => {
        if (c.id === commentId) {
          return { ...c, _removed: true };
        }
        return c;
      }));

      moderationService.addAuditLog({
        actorId: 'mod-1',
        actorName: 'แอดมินสุภพ (Super Admin)',
        actionType: 'COMMENT_REMOVE',
        targetType: 'comment',
        targetId: commentId,
        note: `ลบความคิดเห็น #${commentId} ถาวร`,
        metadata: {
          parentPostId: targetComment?.post_id,
          contentSnippet: targetComment?.content?.substring(0, 40)
        }
      });

      onShowToast(`ลบความคิดเห็น #${commentId} แล้ว`, 'success');
    }
  };

  const getAuthorDisplay = (userId: string) => {
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
    const q = search.toLowerCase();
    const matchSearch = !search || 
      (p.food_name && p.food_name.toLowerCase().includes(q)) ||
      (p.description && p.description.toLowerCase().includes(q)) ||
      String(p.id).includes(q);
    
    if (statusFilter === 'hidden') return matchSearch && p._hidden;
    if (statusFilter === 'published') return matchSearch && !p._hidden;
    return matchSearch;
  });

  // Filtered Comments with Parent Post Context
  const filteredComments = allComments
    .filter(c => !c._removed)
    .filter(c => {
      const parentPost = posts.find(p => p.id === c.post_id);
      const q = search.toLowerCase();
      const matchSearch = !search || 
        (c.content && c.content.toLowerCase().includes(q)) ||
        (parentPost?.food_name && parentPost.food_name.toLowerCase().includes(q)) ||
        String(c.id).includes(q) ||
        String(c.post_id).includes(q);

      if (statusFilter === 'hidden') return matchSearch && c._hidden;
      if (statusFilter === 'published') return matchSearch && !c._hidden;
      return matchSearch;
    });

  const postComments = selectedPost 
    ? allComments.filter(c => c.post_id === selectedPost.id && !c._removed)
    : [];

  return (
    <div>
      {/* Sub-tabs Header: Switch between Posts and Comments */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
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
        <div className="filter-row">
          <input 
            type="text"
            className="search-input-field"
            placeholder={
              activeSubTab === 'posts'
                ? "ค้นหาชื่ออาหาร, รหัสโพสต์, คำบรรยาย..."
                : "ค้นหาข้อความความคิดเห็น, ชื่ออาหารโพสต์ต้นทาง, รหัส..."
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

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
                  <th style={{ width: '130px' }}>ความคิดเห็น</th>
                  <th style={{ width: '120px' }}>วันที่สร้าง</th>
                  <th style={{ width: '100px' }}>สถานะ</th>
                  <th style={{ width: '110px', textAlign: 'right' }}>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: '#667085' }}>
                      กำลังโหลดข้อมูลโพสต์...
                    </td>
                  </tr>
                ) : filteredPosts.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: '#667085' }}>
                      ไม่พบโพสต์ที่ตรงกับคำค้นหา
                    </td>
                  </tr>
                ) : (
                  filteredPosts.map(p => {
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
                          {p.restaurant_url && (
                            <a 
                              href={p.restaurant_url} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              onClick={(e) => e.stopPropagation()}
                              style={{ fontSize: '11px', color: '#2563eb', display: 'inline-flex', alignItems: 'center', gap: '2px', marginTop: '2px' }}
                            >
                              <ExternalLink size={11} /> ดูแผนที่ร้าน
                            </a>
                          )}
                        </td>
                        <td style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#475467', fontSize: '12px' }}>
                          {p.description || '-'}
                        </td>
                        <td>
                          <span 
                            className="badge badge-content-type"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
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
                        <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
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
        </div>
      )}

      {/* VIEW 2: COMMENTS WITH PARENT POST CONTEXT */}
      {activeSubTab === 'comments' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {loading ? (
            <div className="table-card" style={{ textAlign: 'center', padding: '36px', color: '#667085' }}>
              กำลังโหลดข้อมูลความคิดเห็น...
            </div>
          ) : filteredComments.length === 0 ? (
            <div className="table-card" style={{ textAlign: 'center', padding: '36px', color: '#667085' }}>
              ไม่พบความคิดเห็นที่ตรงกับคำค้นหา
            </div>
          ) : (
            filteredComments.map(c => {
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
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#101828' }}>
                        ความคิดเห็น #{c.id}
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

                  {/* PARENT POST CONTEXT BOX (แอดมินรู้บริบทโพสต์ต้นทางทันที) */}
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

                    {parentPost && (
                      <button 
                        className="btn btn-outline btn-sm"
                        style={{ flexShrink: 0, fontSize: '11.5px', padding: '4px 8px' }}
                        onClick={() => setSelectedPost(parentPost)}
                        title="เปิดดูโพสต์เต็มและกระทู้ความคิดเห็นทั้งหมด"
                      >
                        <span>ดูบริบทโพสต์เต็ม</span>
                        <ArrowRight size={11} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
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

                  {selectedPost.restaurant_url && (
                    <div style={{ marginTop: '8px', fontSize: '12px' }}>
                      <a 
                        href={selectedPost.restaurant_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ color: '#2563eb', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <ExternalLink size={12} /> ลิงก์ร้านค้า / พิกัด Google Maps
                      </a>
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
                    {postComments.map((c, index) => {
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
                              <span style={{ fontWeight: 600, color: '#101828' }}>
                                #{index + 1} {author.name} (@{author.username})
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
