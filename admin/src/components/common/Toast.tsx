import React from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          {t.type === 'success' && <CheckCircle2 size={16} color="#10b981" />}
          {t.type === 'error' && <AlertTriangle size={16} color="#ef4444" />}
          {t.type === 'info' && <Info size={16} color="#2563eb" />}
          <div style={{ flex: 1, fontSize: '13px' }}>{t.message}</div>
          <button 
            onClick={() => onDismiss(t.id)} 
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
};
