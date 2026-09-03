import React from 'react';
import { Circle, Clock, CheckCircle2 } from 'lucide-react';

const STATUS_CONFIG = {
  todo: {
    label: 'To Do',
    bg: 'bg-slate-800',
    text: 'text-slate-300',
    border: 'border-slate-700',
    icon: Circle,
  },
  in_progress: {
    label: 'In Progress',
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/20',
    icon: Clock,
  },
  completed: {
    label: 'Completed',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/20',
    icon: CheckCircle2,
  },
};

export default function TaskStatusPill({ status = 'todo', className = '' }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.todo;
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.bg} ${config.text} ${config.border} ${className}`}
    >
      <Icon className="w-3 h-3 shrink-0" />
      {config.label}
    </span>
  );
}
