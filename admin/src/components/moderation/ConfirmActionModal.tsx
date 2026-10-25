import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { ModerationActionType, ReasonCode } from '../../types/moderation';
import { COMMUNITY_RULES } from '../../services/moderationService';

interface ConfirmActionModalProps {
  isOpen: boolean;
  actionType: ModerationActionType;
  targetId: string | number;
  targetType: string;
  authorName: string;
  reasonCode: ReasonCode;
  internalNote?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmActionModal: React.FC<ConfirmActionModalProps> = ({
  isOpen,
  actionType,
  targetId,
  targetType,
  authorName,
  reasonCode,
  internalNote,
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  const rule = COMMUNITY_RULES.find(r => r.code === reasonCode);

  const getActionDetails = () => {
    switch (actionType) {
      case 'remove':
        return {
          title: 'ยืนยันการลบเนื้อหา',
          description: `เนื้อหา ${targetType} #${targetId} จะถูกนำออกจากระบบ ไม่ให้ผู้ใช้งานทั่วไปมองเห็น`,
          reversibility: 'การกระทำนี้สามารถกู้คืนได้ในภายหลัง',
          btnClass: 'btn-danger',
          btnText: 'ยืนยันลบเนื้อหา'
        };
      case 'hide':
        return {
          title: 'ยืนยันการซ่อนเนื้อหาชั่วคราว',
          description: `เนื้อหา ${targetType} #${targetId} จะถูกซ่อนระหว่างรอการตรวจสอบ`,
          reversibility: 'สามารถเปิดให้แสดงผลกลับคืนสู่ปกติได้ตลอดเวลา',
          btnClass: 'btn-primary',
          btnText: 'ยืนยันซ่อนเนื้อหา'
        };
      case 'restrict':
        return {
          title: 'ยืนยันการระงับบัญชีผู้ใช้ชั่วคราว',
          description: `บัญชี "${authorName}" จะถูกระงับสิทธิ์ในการสร้างโพสต์ใหม่และคอมเมนต์ชั่วคราว`,
          reversibility: 'สามารถปลดการระงับได้ในหน้าจัดการสมาชิก',
          btnClass: 'btn-danger',
          btnText: 'ยืนยันระงับบัญชี'
        };
      default:
        return {
          title: 'ยืนยันการดำเนินการ',
          description: `ต้องการดำเนินการกับ ${targetType} #${targetId} ใช่หรือไม่?`,
          reversibility: 'การดำเนินการจะถูกบันทึกประวัติไว้',
          btnClass: 'btn-primary',
          btnText: 'ยืนยัน'
        };
    }
  };

  const details = getActionDetails();

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#b42318', fontWeight: 600 }}>
            <AlertTriangle size={16} color="#d92d20" />
            <span>{details.title}</span>
          </div>
          <button onClick={onCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#667085' }}>
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '12.5px' }}>
          <p style={{ color: '#344054' }}>
            {details.description}
          </p>

          <div style={{ background: '#f9fafb', padding: '10px 12px', borderRadius: '6px', border: '1px solid #eaecf0', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div><strong>เป้าหมาย:</strong> {targetType} #{targetId} (เจ้าของ: {authorName})</div>
            <div><strong>เหตุผล:</strong> {rule ? rule.name : reasonCode}</div>
            {internalNote && <div><strong>บันทึก:</strong> {internalNote}</div>}
          </div>

          <div style={{ fontSize: '11.5px', color: '#667085' }}>
            {details.reversibility}
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn btn-outline btn-sm" onClick={onCancel}>
            ยกเลิก
          </button>
          <button className={`btn ${details.btnClass} btn-sm`} onClick={onConfirm}>
            {details.btnText}
          </button>
        </div>
      </div>
    </div>
  );
};
