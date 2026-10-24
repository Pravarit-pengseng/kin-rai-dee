import React, { useState } from 'react';
import { Shield } from 'lucide-react';
import { COMMUNITY_RULES } from '../services/moderationService';

interface SettingsPageProps {
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onShowToast }) => {
  const [rules, setRules] = useState(COMMUNITY_RULES);

  const handleToggleRule = (id: number) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r));
    onShowToast('อัปเดตสถานะกฎเรียบร้อยแล้ว', 'success');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className="drawer-card" style={{ marginBottom: 0 }}>
        <div className="drawer-section-title">
          <Shield size={15} color="#2563eb" />
          <span>นโยบายและกฎชุมชน</span>
        </div>
        <p style={{ fontSize: '12px', color: '#667085', marginBottom: '14px' }}>
          หมวดหมู่เหตุผลมาตรฐานที่ใช้ในการตรวจสอบและรายงานเนื้อหา
        </p>

        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>ลำดับ</th>
                <th style={{ width: '130px' }}>รหัส</th>
                <th style={{ width: '200px' }}>ชื่อแสดงผล</th>
                <th>คำอธิบาย</th>
                <th style={{ width: '100px' }}>สถานะ</th>
                <th style={{ width: '90px', textAlign: 'right' }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {rules.map(rule => (
                <tr key={rule.id}>
                  <td>{rule.id}</td>
                  <td>
                    <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#101828' }}>
                      {rule.code}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600, color: '#101828' }}>
                    {rule.name}
                  </td>
                  <td style={{ color: '#475467', fontSize: '12px' }}>
                    {rule.description}
                  </td>
                  <td>
                    {rule.isActive ? (
                      <span className="badge badge-action_taken">เปิดใช้งาน</span>
                    ) : (
                      <span className="badge badge-dismissed">ปิดใช้งาน</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button 
                      className="btn btn-outline btn-sm"
                      onClick={() => handleToggleRule(rule.id)}
                    >
                      {rule.isActive ? 'ปิด' : 'เปิด'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
