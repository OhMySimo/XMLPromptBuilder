// src/components/Toast.tsx
import React from 'react';
import type { ToastItem } from '../lib/types';

export default function Toast({ items }: { items: ToastItem[] }) {
  return (
    <div className="toast-root" role="status" aria-live="polite">
      {items.map(toast => (
        <div key={toast.id} className={`toast visible ${toast.type === 'success' ? 'success' : toast.type === 'error' ? 'error' : 'info'}`} role="alert">
          {toast.text}
        </div>
      ))}
    </div>
  );
}
