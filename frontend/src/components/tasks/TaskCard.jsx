import React, { useState, useRef, useEffect } from 'react';
import {
  Calendar,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Circle,
  Edit3,
  Trash2,
  User,
  Users,
  UserPlus,
  UserX,
  FolderGit2,
  ChevronDown,
  MessageSquare,
  Check,
} from 'lucide-react';
import PriorityBadge from './PriorityBadge';
import TaskStatusPill from './TaskStatusPill';
import { getUserDisplayName, getUserInitials } from '../common/TeamMemberSelect';

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
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowAssignDropdown(false);
      }
    };
    if (showAssignDropdown) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [showAssignDropdown]);

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

  // Resolve assignees list
  const assignees = React.useMemo(() => {
    if (Array.isArray(task.assignees) && task.assignees.length > 0) {
      return task.assignees.map((a) => ({
        id: a.id ?? a.user_id,
        name: getUserDisplayName(a),
        email: a.email || '',
      }));
    }
    if (task.assigned_to) {
      return [
        {
          id: task.assigned_to,
          name: task.assignee_name || `Member #${task.assigned_to}`,
          email: task.assignee_email || '',
        },
      ];
    }
    return [];
  }, [task.assignees, task.assigned_to, task.assignee_name, task.assignee_email]);

  const hasAssignees = assignees.length > 0;

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
                onStatusChange?.(task, nextStatus);
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
            {onEdit && (
              <button
                onClick={() => onEdit(task)}
                title="Edit Task"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(task)}
                title="Delete Task"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
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

      {/* Footer: Due date & Assignees Area */}
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

        {/* Assignees Area with Multiple Avatars / Names */}
        <div ref={dropdownRef} className="relative">
          <button
            type="button"
            onClick={() => setShowAssignDropdown(!showAssignDropdown)}
            title={
              hasAssignees
                ? `Assigned to: ${assignees.map((a) => a.name).join(', ')}`
                : 'Unassigned task'
            }
            className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer text-slate-700 max-w-[200px]"
          >
            {hasAssignees ? (
              <div className="flex items-center gap-1.5 min-w-0">
                {/* Overlapping or Stacked Avatars */}
                <div className="flex -space-x-1.5 overflow-hidden shrink-0">
                  {assignees.slice(0, 3).map((a, idx) => (
                    <div
                      key={a.id || idx}
                      title={a.name}
                      className="w-5 h-5 rounded-full bg-indigo-600 text-[9px] font-bold text-white flex items-center justify-center border-2 border-white shrink-0 shadow-2xs"
                    >
                      {getUserInitials(a.name)}
                    </div>
                  ))}
                  {assignees.length > 3 && (
                    <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[8px] font-bold flex items-center justify-center border-2 border-white shrink-0">
                      +{assignees.length - 3}
                    </div>
                  )}
                </div>

                {/* Primary label: full name if 1, count if multiple */}
                {assignees.length === 1 ? (
                  <span className="truncate text-[11px] font-semibold text-slate-800">
                    {assignees[0].name}
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold text-slate-800">
                    {assignees.length} assignees
                  </span>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <UserX className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[11px] text-slate-500">Unassigned</span>
              </div>
            )}
            <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
          </button>

          {/* Quick Assignees Popover */}
          {showAssignDropdown && (
            <div className="absolute right-0 bottom-full mb-2 w-64 rounded-2xl bg-white border border-slate-200 shadow-xl p-2.5 z-30 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1.5">
                <span>Assigned Members</span>
                <span>{assignees.length} total</span>
              </div>

              {/* Current Assignees List */}
              {hasAssignees ? (
                <div className="max-h-36 overflow-y-auto space-y-1 mb-2">
                  {assignees.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                    >
                      <div className="w-6 h-6 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                        {getUserInitials(a.name)}
                      </div>
                      <div className="min-w-0 flex-1 truncate">
                        <span className="block font-semibold text-slate-900 truncate">
                          {a.name}
                        </span>
                        {a.email && (
                          <span className="block text-[10px] text-slate-400 truncate">
                            {a.email}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-2 text-center text-xs text-slate-400 italic">
                  No members assigned yet
                </div>
              )}

              {/* If onEdit is provided, quick shortcut to open edit modal */}
              {onEdit && (
                <button
                  type="button"
                  onClick={() => {
                    setShowAssignDropdown(false);
                    onEdit(task);
                  }}
                  className="w-full mt-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Manage Assignees</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
