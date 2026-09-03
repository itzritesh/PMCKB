import React from 'react';
import { AlertCircle, AlertTriangle, ArrowDown, ArrowUp } from 'lucide-react';

const PRIORITY_CONFIG = {
  low: {
    label: 'Low',
    bg: 'bg-slate-500/10',
    text: 'text-slate-300',
    border: 'border-slate-500/20',
    icon: ArrowDown,
  },
  medium: {
    label: 'Medium',
    bg: 'bg-indigo-500/10',
    text: 'text-indigo-400',
    border: 'border-indigo-500/20',
    icon: null,
  },
  high: {
    label: 'High',
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/20',
    icon: ArrowUp,
  },
  urgent: {
    label: 'Urgent',
    bg: 'bg-rose-500/15',
    text: 'text-rose-400',
    border: 'border-rose-500/30',
    icon: AlertCircle,
  },
};

export default function PriorityBadge({ priority = 'medium', className = '' }) {
  const config = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.medium;
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border ${config.bg} ${config.text} ${config.border} ${className}`}
    >
      {Icon && <Icon className="w-3 h-3" />}
      {config.label}
    </span>
  );
}
