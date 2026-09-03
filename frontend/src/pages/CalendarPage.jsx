import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, AlertTriangle, CheckSquare, FolderGit2, ChevronLeft, ChevronRight } from 'lucide-react';
import { taskService } from '../services/taskService';
import PriorityBadge from '../components/tasks/PriorityBadge';
import TaskStatusPill from '../components/tasks/TaskStatusPill';

export default function CalendarPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    taskService
      .getAllTasks()
      .then((res) => setTasks(res.data.tasks || []))
      .catch((err) => console.warn('Failed to fetch tasks for calendar:', err))
      .finally(() => setLoading(false));
  }, []);

  const tasksWithDeadlines = tasks.filter((t) => t.due_date);

  const formatDateTime = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] py-10 px-4 sm:px-6 lg:px-8 bg-radial from-indigo-950/20 via-slate-950 to-slate-950">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Calendar & Deadlines
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                {tasksWithDeadlines.length} Scheduled
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400">
              Synchronized view of project milestones, task delivery deadlines, and team commitments.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-900/80 p-1 rounded-2xl border border-slate-800">
            <button className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-medium">
              Agenda View
            </button>
            <button className="px-3 py-1.5 rounded-xl text-slate-400 hover:text-white text-xs font-medium transition-colors">
              Month
            </button>
          </div>
        </div>

        {/* Deliverable Milestones Agenda */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
            Scheduled Task Deadlines
          </h3>

          {loading ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              Loading calendar deadlines...
            </div>
          ) : tasksWithDeadlines.length === 0 ? (
            <div className="glass-card rounded-3xl p-10 text-center border border-slate-800 space-y-2">
              <CalendarIcon className="w-10 h-10 text-slate-600 mx-auto" />
              <h4 className="text-base font-semibold text-white">No Deadlines Set Yet</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Assign due dates to your tasks to see them plotted automatically in the unified team calendar.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tasksWithDeadlines.map((t) => {
                const isOverdue =
                  new Date(t.due_date).getTime() < Date.now() &&
                  t.status !== 'completed';

                return (
                  <div
                    key={t.id}
                    className={`glass-card rounded-2xl p-5 border transition-all ${
                      isOverdue
                        ? 'border-rose-500/40 bg-rose-950/10'
                        : 'border-slate-800 hover:border-indigo-500/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <TaskStatusPill status={t.status} />
                        <PriorityBadge priority={t.priority} />
                        {isOverdue && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/30">
                            Overdue
                          </span>
                        )}
                      </div>
                    </div>

                    <h4 className="text-sm font-bold text-white mb-1">
                      {t.title}
                    </h4>

                    {t.project_name && (
                      <div className="flex items-center gap-1 text-xs text-indigo-400 mb-3">
                        <FolderGit2 className="w-3.5 h-3.5" />
                        <span>{t.project_name}</span>
                      </div>
                    )}

                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                      <div className="flex items-center gap-1.5 font-medium">
                        <Clock className={`w-3.5 h-3.5 ${isOverdue ? 'text-rose-400' : 'text-amber-400'}`} />
                        <span className={isOverdue ? 'text-rose-400 font-semibold' : 'text-slate-200'}>
                          {formatDateTime(t.due_date)}
                        </span>
                      </div>

                      <span className="text-[11px] text-slate-500">
                        {t.assignee_name ? `Assignee: ${t.assignee_name}` : 'Unassigned'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
