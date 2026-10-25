import React from 'react';
import { ReportStatus, PriorityLevel, ContentType } from '../../types/moderation';

interface BadgeProps {
  type: 'status' | 'priority' | 'content';
  value: string;
}

export const Badge: React.FC<BadgeProps> = ({ type, value }) => {
  if (type === 'status') {
    const statusMap: Record<ReportStatus, { label: string; className: string }> = {
      pending: { label: 'รอตรวจสอบ', className: 'badge-pending' },
      in_review: { label: 'กำลังตรวจสอบ', className: 'badge-in_review' },
      action_taken: { label: 'ดำเนินการแล้ว', className: 'badge-action_taken' },
      dismissed: { label: 'ไม่พบการละเมิด', className: 'badge-dismissed' },
      appealed: { label: 'ยื่นอุทธรณ์', className: 'badge-priority-medium' },
      closed: { label: 'ปิดเคส', className: 'badge-dismissed' },
    };
    const s = statusMap[value as ReportStatus] || { label: value, className: 'badge-dismissed' };
    return <span className={`badge ${s.className}`}>{s.label}</span>;
  }

  if (type === 'priority') {
    const priorityMap: Record<PriorityLevel, { label: string; className: string }> = {
      urgent: { label: 'ด่วนที่สุด', className: 'badge-priority-urgent' },
      high: { label: 'สูง', className: 'badge-priority-high' },
      medium: { label: 'ปานกลาง', className: 'badge-priority-medium' },
      low: { label: 'ต่ำ', className: 'badge-priority-low' },
    };
    const p = priorityMap[value as PriorityLevel] || { label: value, className: 'badge-priority-low' };
    return <span className={`badge ${p.className}`}>● {p.label}</span>;
  }

  if (type === 'content') {
    const contentMap: Record<ContentType, string> = {
      post: 'โพสต์',
      comment: 'ความคิดเห็น',
      image: 'โพสต์',
      user: 'ผู้ใช้',
    };
    return (
      <span className="badge badge-content-type">
        {contentMap[value as ContentType] || value}
      </span>
    );
  }

  return <span className="badge">{value}</span>;
};
