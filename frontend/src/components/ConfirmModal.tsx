'use client';

import React from 'react';
import { AlertCircle, X, CheckCircle2 } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

export const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'warning'
}: ConfirmModalProps) => {
  if (!isOpen) return null;

  const themes = {
    danger: {
      bg: 'bg-rose-50',
      icon: 'text-rose-600',
      button: 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20',
      borderColor: 'border-rose-100'
    },
    warning: {
      bg: 'bg-amber-50',
      icon: 'text-amber-600',
      button: 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20',
      borderColor: 'border-amber-100'
    },
    info: {
      bg: 'bg-indigo-50',
      icon: 'text-indigo-600',
      button: 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20',
      borderColor: 'border-indigo-100'
    }
  };

  const theme = themes[type];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl border-4 border-white animate-scaleIn">
        <div className={`p-8 ${theme.bg} border-b ${theme.borderColor} flex flex-col items-center text-center`}>
          <div className={`w-20 h-20 rounded-3xl ${theme.bg} border-4 border-white flex items-center justify-center mb-6 shadow-xl`}>
             <AlertCircle size={40} className={theme.icon} />
          </div>
          <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">{title}</h3>
          <p className="mt-4 text-slate-600 font-bold leading-relaxed">{message}</p>
        </div>

        <div className="p-8 flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`flex-1 py-4 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 shadow-xl ${theme.button}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
