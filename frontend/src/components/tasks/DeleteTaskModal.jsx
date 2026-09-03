import React from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';

export default function DeleteTaskModal({
  isOpen,
  onClose,
  onConfirm,
  taskTitle = '',
  loading = false,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="glass-card max-w-md w-full rounded-3xl p-6 sm:p-8 border border-rose-500/20 shadow-2xl space-y-5">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>

        <div className="text-center space-y-2">
          <h3 className="text-lg font-bold text-white">Delete Task</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Are you sure you want to permanently delete <strong className="text-white">"{taskTitle}"</strong>? This action cannot be undone.
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white text-xs font-medium transition-all shadow-md shadow-rose-600/25 flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>Delete Task</span>
          </button>
        </div>
      </div>
    </div>
  );
}
