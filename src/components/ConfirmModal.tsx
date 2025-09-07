// src/components/ConfirmModal.tsx
import React from 'react';

export default function ConfirmModal({ open, title, body, confirmLabel = 'Confirm', cancelLabel = 'Cancel', onConfirm, onCancel } : {
  open: boolean;
  title: string;
  body: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white dark:bg-[#0b1220] rounded-2xl shadow-2xl p-6 w-full max-w-md z-10 animate-fadeIn">
        <h3 className="text-lg font-semibold mb-2 text-slate-900 dark:text-slate-100">{title}</h3>
        <div className="text-sm text-slate-600 dark:text-slate-300 mb-4">{body}</div>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 rounded-md border bg-transparent text-sm">{cancelLabel}</button>
          <button onClick={onConfirm} className="px-4 py-2 rounded-md bg-gradient-to-r from-red-500 to-red-600 text-white text-sm">{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
