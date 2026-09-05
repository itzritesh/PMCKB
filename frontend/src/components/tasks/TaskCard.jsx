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
      className={`rounded-2xl p-5 border transition-all relative flex flex-col justify-between shadow-xs hover:shadow-md ${
        isOverdue
          ? 'border-rose-200 bg-rose-50/40'
          : task.status === 'completed'
          ? 'border-emerald-200 bg-emerald-50/20'
          : 'border-slate-200 bg-white hover:border-slate-300'
      }`}
    >
      <div>
        {/* Top bar: Status, Priority, Overdue Tag */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <TaskStatusPill status={task.status} />
            <PriorityBadge priority={task.priority} />
            {isOverdue && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
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
              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-colors cursor-pointer"
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
              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-colors cursor-pointer text-xs flex items-center gap-1"
            >
              {task.status === 'completed' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <Circle className="w-4 h-4 text-slate-400 hover:text-indigo-600" />
              )}
            </button>
            <button
              onClick={() => onEdit(task)}
              title="Edit Task"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDelete(task)}
              title="Delete Task"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Project Tag (if rendered in global list) */}
        {showProject && task.project_name && (
          <div className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 mb-1.5">
            <FolderGit2 className="w-3 h-3" />
            <span>{task.project_name}</span>
          </div>
        )}

        {/* Title */}
        <h4
          onClick={() => onOpenDetails?.(task)}
          className={`text-sm sm:text-base font-semibold transition-colors mb-1.5 cursor-pointer hover:text-indigo-600 ${
            task.status === 'completed'
              ? 'line-through text-slate-400'
              : 'text-slate-900'
          }`}
        >
          {task.title}
        </h4>

        {/* Description */}
        {task.description && (
          <p
            onClick={() => onOpenDetails?.(task)}
            className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4 cursor-pointer hover:text-slate-700"
          >
            {task.description}
          </p>
        )}
      </div>

      {/* Footer: Due date & Assignee with Quick Reassign Dropdown */}
      <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 relative">
        {/* Due Date */}
        <div className="flex items-center gap-1.5">
          <Calendar className={`w-3.5 h-3.5 ${isOverdue ? 'text-rose-500' : 'text-slate-400'}`} />
          {formattedDueDate ? (
            <span className={isOverdue ? 'text-rose-600 font-semibold' : 'text-slate-600'}>
              {formattedDueDate}
            </span>
          ) : (
            <span className="text-slate-400">No deadline</span>
          )}
        </div>

        {/* Assignee Indicator & Quick Reassign Trigger */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowAssignDropdown(!showAssignDropdown)}
            title="Click to reassign or unassign"
            className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer text-slate-700"
          >
            {task.assignee_name ? (
              <>
                <div className="w-5 h-5 rounded-full bg-indigo-600 text-[10px] font-bold text-white flex items-center justify-center shrink-0">
                  {getInitials(task.assignee_name)}
                </div>
                <span className="max-w-[100px] truncate text-[11px] font-medium text-slate-800">
                  {task.assignee_name}
                </span>
              </>
            ) : (
              <>
                <UserX className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[11px] text-slate-500">Unassigned</span>
              </>
            )}
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {/* Quick Assign Dropdown Popover */}
          {showAssignDropdown && (
            <div className="absolute right-0 bottom-full mb-2 w-56 rounded-2xl bg-white border border-slate-200 shadow-xl p-2 z-30 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-2 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1">
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
                    ? 'bg-indigo-50 text-indigo-700 font-medium'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
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
                          ? 'bg-indigo-50 text-indigo-700 font-medium'
                          : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <div className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-600 flex items-center justify-center shrink-0">
                        {getInitials(u.name)}
                      </div>
                      <div className="truncate">
                        <span className="block truncate font-medium text-slate-900">{u.name}</span>
                        <span className="block truncate text-[10px] text-slate-400">{u.email}</span>
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
