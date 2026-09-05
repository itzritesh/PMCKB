import React from 'react';

export default function StatusBadge({ status, label, className = '' }) {
  const statusStyles = {
    online: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    healthy: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    connected: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    offline: 'bg-rose-50 text-rose-700 border-rose-200',
    disconnected: 'bg-amber-50 text-amber-700 border-amber-200',
    loading: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  };

  const dotStyles = {
    online: 'bg-emerald-500',
    healthy: 'bg-emerald-500 animate-pulse',
    connected: 'bg-emerald-500',
    offline: 'bg-rose-500',
    disconnected: 'bg-amber-500',
    loading: 'bg-indigo-500 animate-ping',
  };

  const currentStyle = statusStyles[status] || statusStyles.offline;
  const currentDot = dotStyles[status] || dotStyles.offline;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${currentStyle} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${currentDot}`} />
      {label || status}
    </span>
  );
}
