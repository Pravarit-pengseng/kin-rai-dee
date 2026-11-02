import React, { useState, useEffect } from 'react';
import { 
  X, 
  CheckCircle2, 
  EyeOff, 
  Trash2, 
  UserX, 
  User, 
  Flag, 
  FileText, 
  Shield, 
  ExternalLink
} from 'lucide-react';
import { ModerationReport, ModerationActionType, ReasonCode } from '../../types/moderation';
import { Badge } from '../common/Badge';
import { COMMUNITY_RULES, moderationService } from '../../services/moderationService';
import { adminApi } from '../../services/adminApi';
import { supabase } from '../../services/supabaseClient';
import { ConfirmActionModal } from './ConfirmActionModal';

interface ModerationDetailDrawerProps {
  report: ModerationReport | null;
  isOpen: boolean;
  onClose: () => void;
  onActionComplete: (msg: string) => void;
}

export const ModerationDetailDrawer: React.FC<ModerationDetailDrawerProps> = ({
  report,
  isOpen,
  onClose,
  onActionComplete
}) => {
  const [selectedReason, setSelectedReason] = useState<ReasonCode>(report?.reasonCode || 'OTHER');
  const [confirmModalAction, setConfirmModalAction] = useState<ModerationActionType | null>(null);

  useEffect(() => {
    if (report?.reasonCode) {
      setSelectedReason(report.reasonCode);
    }
  }, [report?.reasonCode]);

  if (!isOpen || !report) return null;

  const content = report.targetContent;

  const executeAction = (actionType: ModerationActionType) => {
    if (['remove', 'hide', 'restrict'].includes(actionType)) {
      setConfirmModalAction(actionType);
      return;
    }

    commitAction(actionType);
  };

  const commitAction = async (actionType: ModerationActionType) => {
    let apiSuccess = false;
    try {
      const match = String(report.id).match(/\d+/);
      if (match) {
        const rawId = parseInt(match[0], 10);
        await adminApi.applyReportDecision(rawId, {
          action_type: actionType,
          reason_code: selectedReason,
          internal_note: `ดำเนินการ ${actionType} โดยผู้ดูแลระบบ`,
          moderator_id: 'admin',
          moderator_name: 'ผู้ดูแลระบบ',
        });
        apiSuccess = true;
      }
    } catch (err) {
      console.warn('adminApi applyReportDecision error, applying fallback:', err);
    }

    if (!apiSuccess) {
      try {
        const tId = Number(report.targetId);
        if (actionType === 'hide') {
          if (report.targetType === 'post' && tId) {
            await supabase.from('posts').update({ is_hidden: true }).eq('id', tId);
          } else if (report.targetType === 'comment' && tId) {
            await supabase.from('comments').update({ is_hidden: true }).eq('id', tId);
          }
        } else if (actionType === 'remove') {
          if (report.targetType === 'post' && tId) {
            await supabase.from('post_categories').delete().eq('post_id', tId);
            await supabase.from('saved_posts').delete().eq('post_id', tId);
            await supabase.from('comments').delete().eq('post_id', tId);
            await supabase.from('posts').delete().eq('id', tId);
          } else if (report.targetType === 'comment' && tId) {
            await supabase.from('comments').delete().eq('id', tId);
          }
        } else if (actionType === 'restrict') {
          if (content.author?.id && content.author.id !== 'unknown') {
            const { error: rpcErr } = await supabase.rpc('admin_toggle_user_status', {
              target_user_id: content.author.id,
              should_suspend: true,
              reason: 'ระงับบัญชีจากการตัดสินรายงานโดยผู้ดูแลระบบ',
            });
            if (rpcErr) {
              await supabase.from('profiles').update({ is_suspended: true }).eq('id', content.author.id);
            }
          }
          if (report.targetType === 'post' && tId) {
            await supabase.from('posts').update({ is_hidden: true }).eq('id', tId);
          } else if (report.targetType === 'comment' && tId) {
            await supabase.from('comments').update({ is_hidden: true }).eq('id', tId);
          }
        }

        const rawReportId = parseInt(String(report.id).replace(/\D/g, ''), 10);
        if (rawReportId) {
          const newStatus = actionType === 'keep' ? 'dismissed' : 'action_taken';
          await supabase.from('reports').update({
            status: newStatus,
            resolved_at: new Date().toISOString(),
          }).eq('id', rawReportId);
        }

        await supabase.from('audit_logs').insert({
          actor_id: 'admin',
          actor_name: 'ผู้ดูแลระบบ',
          event_type: `MODERATION_${actionType.toUpperCase()}`,
          target_type: report.targetType,
          target_id: String(report.targetId),
          metadata: { report_id: report.id, action: actionType, note: `ดำเนินการ ${actionType} โดยผู้ดูแลระบบ` },
        });
      } catch (fallbackErr) {
        console.warn('Direct supabase fallback error:', fallbackErr);
      }
    }

    const res = moderationService.applyDecision({
      reportId: report.id,
      actionType,
      reasonCode: selectedReason,
      notifyUser: false,
      moderatorId: 'mod-current',
      moderatorName: 'แอดมิน'
    });

    setConfirmModalAction(null);
    onActionComplete(res.message);
    onClose();
  };

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer-container" onClick={(e) => e.stopPropagation()}>
        {/* Drawer Header */}
        <div className="drawer-header">
          <div className="drawer-title-group">
            <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#101828' }}>
              รายงาน {report.id}
            </h2>
            <Badge type="status" value={report.status} />
            <Badge type="content" value={report.targetType} />
          </div>
          <button 
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#667085' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="drawer-body">
          <div className="drawer-grid">
            
            {/* Left Column: UGC Content & Report Details */}
            <div>
              {/* Report Context Card */}
              <div className="drawer-card">
                <div className="drawer-section-title">
                  <Flag size={15} color="#d92d20" />
                  <span>ข้อมูลการรายงาน</span>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12.5px' }}>
                  <div>
                    <span style={{ color: '#475467' }}>หัวข้อที่ผู้ใช้เลือกรายงาน: </span>
                    <span style={{ fontWeight: 600, color: '#101828' }}>{report.reasonLabel}</span>
                  </div>
                  {COMMUNITY_RULES.find(r => r.code === report.reasonCode)?.description && (
                    <div style={{ background: '#f9fafb', padding: '8px 10px', borderRadius: '6px', border: '1px solid #eaecf0', color: '#475467', fontSize: '12px' }}>
                      คำอธิบายหมวดหมู่นี้: {COMMUNITY_RULES.find(r => r.code === report.reasonCode)?.description}
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '11.5px', color: '#667085' }}>
                    <span>ผู้รายงาน: <strong>@{report.reporterUsername}</strong></span>
                    <span>เวลา: {new Date(report.createdAt).toLocaleString('th-TH')}</span>
                  </div>
                </div>
              </div>

              {/* UGC Content Preview Card */}
              <div className="drawer-card">
                <div className="drawer-section-title">
                  <FileText size={15} color="#2563eb" />
                  <span>{report.targetType === 'user' ? 'ข้อมูลผู้ใช้ที่ถูกตรวจสอบ' : 'เนื้อหาที่ถูกตรวจสอบ'}</span>
                </div>

                <div style={{ fontSize: '12.5px' }}>
                  {/* Author Header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid #eaecf0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#f2f4f7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <User size={16} color="#475467" />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: '#101828' }}>{content.author.displayName}</div>
                        <div style={{ fontSize: '11px', color: '#667085' }}>@{content.author.username}</div>
                      </div>
                    </div>
                    <div>
                      <span className="badge badge-priority-low">
                        สถานะ: {content.author.status || 'ปกติ'}
                      </span>
                    </div>
                  </div>

                  {/* Content details */}
                  <div className="ugc-preview-box">
                    {content.title && (
                      <h4 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '4px', color: '#101828' }}>
                        {content.title}
                      </h4>
                    )}
                    <p style={{ color: '#344054', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                      {content.text || '(ไม่มีข้อความบรรยาย)'}
                    </p>

                    {/* Image Preview if available */}
                    {content.imageUrl && (
                      <div style={{ marginTop: '10px' }}>
                        <img 
                          src={content.imageUrl} 
                          alt="UGC Preview" 
                          className="ugc-image-preview" 
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}

                    {/* Restaurant Link if exists */}
                    {content.restaurantUrl && (
                      <div style={{ marginTop: '8px', fontSize: '11.5px' }}>
                        <a 
                          href={content.restaurantUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{ color: '#2563eb', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          <ExternalLink size={12} /> ดูลิงก์ร้านค้า / แผนที่
                        </a>
                      </div>
                    )}

                    {/* Comment parent context */}
                    {report.targetType === 'comment' && content.parentPostId && (
                      <div style={{ marginTop: '8px', padding: '6px 8px', background: '#ffffff', borderRadius: '4px', border: '1px solid #eaecf0', fontSize: '11.5px' }}>
                        <span style={{ color: '#667085' }}>ความคิดเห็นบน: </span>
                        <strong>โพสต์ #{content.parentPostId}</strong>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '11.5px', color: '#667085' }}>
                    <span>การแสดงผล: <strong>{content.visibility === 'published' ? 'เผยแพร่อยู่' : content.visibility}</strong></span>
                    <span>สร้างเมื่อ: {new Date(content.createdAt).toLocaleString('th-TH')}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Right Column: Decision Panel */}
            <div>
              <div className="drawer-card" style={{ position: 'sticky', top: '20px' }}>
                <div className="drawer-section-title">
                  <Shield size={15} color="#079455" />
                  <span>การตัดสินใจ</span>
                </div>

                {/* Reason Selection */}
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ fontSize: '11.5px', fontWeight: 500, color: '#344054', display: 'block', marginBottom: '3px' }}>
                    หมวดหมู่เหตุผลตามกฎ:
                  </label>
                  <select 
                    className="filter-select" 
                    style={{ width: '100%' }}
                    value={selectedReason}
                    onChange={(e) => setSelectedReason(e.target.value as ReasonCode)}
                  >
                    {COMMUNITY_RULES.map(r => (
                      <option key={r.code} value={r.code}>{r.name}</option>
                    ))}
                  </select>
                </div>

                {/* Moderation Actions Group */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#667085', textTransform: 'uppercase' }}>
                    คำสั่งดำเนินการ
                  </div>

                  {/* 1. Keep */}
                  <button 
                    className="btn btn-outline" 
                    style={{ justifyContent: 'flex-start', color: '#027a48' }}
                    onClick={() => executeAction('keep')}
                  >
                    <CheckCircle2 size={14} />
                    <span>คงเนื้อหาไว้ (ไม่พบการละเมิด)</span>
                  </button>

                  {/* 2. Hide */}
                  <button 
                    className="btn btn-outline" 
                    style={{ justifyContent: 'flex-start', color: '#b54708' }}
                    onClick={() => executeAction('hide')}
                  >
                    <EyeOff size={14} />
                    <span>ซ่อนเนื้อหาชั่วคราว</span>
                  </button>

                  {/* 3. Remove */}
                  <button 
                    className="btn btn-danger" 
                    style={{ justifyContent: 'flex-start' }}
                    onClick={() => executeAction('remove')}
                  >
                    <Trash2 size={14} />
                    <span>ลบเนื้อหา</span>
                  </button>

                  {/* 4. Restrict */}
                  <button 
                    className="btn btn-outline" 
                    style={{ justifyContent: 'flex-start', color: '#b42318' }}
                    onClick={() => executeAction('restrict')}
                  >
                    <UserX size={14} />
                    <span>ระงับบัญชีผู้ใช้ชั่วคราว</span>
                  </button>
                </div>

              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Confirmation Modal */}
      {confirmModalAction && (
        <ConfirmActionModal 
          isOpen={true}
          actionType={confirmModalAction}
          targetId={report.targetId}
          targetType={report.targetType === 'post' ? 'โพสต์' : report.targetType === 'comment' ? 'ความคิดเห็น' : report.targetType === 'user' ? 'ผู้ใช้' : 'เนื้อหา'}
          authorName={content.author.displayName}
          reasonCode={selectedReason}
          onConfirm={() => commitAction(confirmModalAction)}
          onCancel={() => setConfirmModalAction(null)}
        />
      )}
    </div>
  );
};
