import React from 'react';

export default function StatusBadge({ status, label, className = '' }) {
  const statusStyles = {
    online: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    healthy: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    connected: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    offline: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    disconnected: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    loading: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  };

  const dotStyles = {
    online: 'bg-emerald-400',
    healthy: 'bg-emerald-400 animate-pulse',
    connected: 'bg-emerald-400',
    offline: 'bg-rose-400',
    disconnected: 'bg-amber-400',
    loading: 'bg-indigo-400 animate-ping',
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
