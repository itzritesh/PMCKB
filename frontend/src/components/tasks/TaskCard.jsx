import React, { useState } from 'react';
import {
  Calendar,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Circle,
  Edit3,
  Trash2,
  User,
  UserPlus,
  UserX,
  FolderGit2,
  ChevronDown,
  MessageSquare,
} from 'lucide-react';
import PriorityBadge from './PriorityBadge';
import TaskStatusPill from './TaskStatusPill';

export default function TaskCard({
  task,
  users = [],
  onEdit,
  onDelete,
  onStatusChange,
  onAssign,
  onOpenDetails,
  showProject = false,
}) {
  const [showAssignDropdown, setShowAssignDropdown] = useState(false);

  const isOverdue =
    task.due_date &&
    new Date(task.due_date).getTime() < Date.now() &&
    task.status !== 'completed';

  const formattedDueDate = task.due_date
    ? new Date(task.due_date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  // Generate initials from assignee name
  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div
      className={`glass-card glass-card-hover rounded-2xl p-5 border transition-all relative flex flex-col justify-between ${
        isOverdue
          ? 'border-rose-500/40 bg-rose-950/10 shadow-lg shadow-rose-950/20'
          : task.status === 'completed'
          ? 'border-emerald-500/20 bg-emerald-950/5'
          : 'border-slate-800/80'
      }`}
    >
      <div>
        {/* Top bar: Status, Priority, Overdue Tag */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <TaskStatusPill status={task.status} />
            <PriorityBadge priority={task.priority} />
            {isOverdue && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse">
                <AlertTriangle className="w-3 h-3" />
                Overdue
              </span>
            )}
          </div>

          {/* Quick actions */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => onOpenDetails?.(task)}
              title="Open Discussion & Comments"
              className="p-1 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                const nextStatus =
                  task.status === 'todo'
                    ? 'in_progress'
                    : task.status === 'in_progress'
                    ? 'completed'
                    : 'todo';
                onStatusChange(task, nextStatus);
              }}
              title={`Advance status from ${task.status}`}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer text-xs flex items-center gap-1"
            >
              {task.status === 'completed' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <Circle className="w-4 h-4 text-slate-500 hover:text-indigo-400" />
              )}
            </button>
            <button
              onClick={() => onEdit(task)}
              title="Edit Task"
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDelete(task)}
              title="Delete Task"
              className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Project Tag (if rendered in global list) */}
        {showProject && task.project_name && (
          <div className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-400 mb-1.5">
            <FolderGit2 className="w-3 h-3" />
            <span>{task.project_name}</span>
          </div>
        )}

        {/* Title */}
        <h4
          onClick={() => onOpenDetails?.(task)}
          className={`text-sm sm:text-base font-semibold transition-colors mb-1.5 cursor-pointer hover:text-indigo-300 ${
            task.status === 'completed'
              ? 'line-through text-slate-400'
              : 'text-white'
          }`}
        >
          {task.title}
        </h4>

        {/* Description */}
        {task.description && (
          <p
            onClick={() => onOpenDetails?.(task)}
            className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4 cursor-pointer hover:text-slate-300"
          >
            {task.description}
          </p>
        )}
      </div>

      {/* Footer: Due date & Assignee with Quick Reassign Dropdown */}
      <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 relative">
        {/* Due Date */}
        <div className="flex items-center gap-1.5">
          <Calendar className={`w-3.5 h-3.5 ${isOverdue ? 'text-rose-400' : 'text-slate-500'}`} />
          {formattedDueDate ? (
            <span className={isOverdue ? 'text-rose-400 font-semibold' : 'text-slate-300'}>
              {formattedDueDate}
            </span>
          ) : (
            <span className="text-slate-600">No deadline</span>
          )}
        </div>

        {/* Assignee Indicator & Quick Reassign Trigger */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowAssignDropdown(!showAssignDropdown)}
            title="Click to reassign or unassign"
            className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer text-slate-300"
          >
            {task.assignee_name ? (
              <>
                <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-[10px] font-bold text-white flex items-center justify-center shrink-0">
                  {getInitials(task.assignee_name)}
                </div>
                <span className="max-w-[100px] truncate text-[11px] font-medium text-slate-200">
                  {task.assignee_name}
                </span>
              </>
            ) : (
              <>
                <UserX className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-[11px] text-slate-500">Unassigned</span>
              </>
            )}
            <ChevronDown className="w-3 h-3 text-slate-500" />
          </button>

          {/* Quick Assign Dropdown Popover */}
          {showAssignDropdown && (
            <div className="absolute right-0 bottom-full mb-2 w-56 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-2 z-30 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-2 py-1 text-[10px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-800 mb-1">
                Assign Task
              </div>

              {/* Option to unassign */}
              <button
                type="button"
                onClick={() => {
                  onAssign(task, null);
                  setShowAssignDropdown(false);
                }}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-xl text-left text-xs transition-colors cursor-pointer ${
                  !task.assigned_to
                    ? 'bg-indigo-600/20 text-indigo-300'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <UserX className="w-3.5 h-3.5" />
                <span>Unassigned</span>
              </button>

              {/* Users list */}
              <div className="max-h-40 overflow-y-auto space-y-0.5 mt-1">
                {users.map((u) => {
                  const isSelected = task.assigned_to === u.id;
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => {
                        onAssign(task, u.id);
                        setShowAssignDropdown(false);
                      }}
                      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-xl text-left text-xs transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600/20 text-indigo-300'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <div className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 text-[10px] font-bold text-slate-300 flex items-center justify-center shrink-0">
                        {getInitials(u.name)}
                      </div>
                      <div className="truncate">
                        <span className="block truncate font-medium">{u.name}</span>
                        <span className="block truncate text-[10px] text-slate-500">{u.email}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
