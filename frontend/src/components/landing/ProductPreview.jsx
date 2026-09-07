import React from 'react';
import {
  FolderGit2,
  CheckSquare,
  Calendar as CalendarIcon,
  BookOpen,
  Clock,
  ChevronRight,
  MoreVertical,
  CheckCircle2,
  CircleDot,
  Users,
  Sparkles,
} from 'lucide-react';

export default function ProductPreview() {
  return (
    <div className="relative mx-auto w-full max-w-5xl rounded-3xl border border-slate-200 bg-white p-3 sm:p-5 shadow-xl shadow-slate-200/50">
      {/* Browser / Application Top Chrome Bar */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4 px-2">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-rose-400/80" />
          <div className="w-3 h-3 rounded-full bg-amber-400/80" />
          <div className="w-3 h-3 rounded-full bg-emerald-400/80" />
          <span className="ml-2 text-[11px] font-mono font-medium text-slate-400 hidden sm:inline-block">
            pmckb-workspace.app/dashboard
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live Sync
          </span>
          <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold">
            JD
          </div>
        </div>
      </div>

      {/* 4 Core KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-3.5 hover:bg-white hover:shadow-xs transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Projects</span>
            <div className="w-7 h-7 rounded-lg bg-blue-100/70 text-blue-600 flex items-center justify-center">
              <FolderGit2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">12</div>
          <div className="text-[11px] text-blue-600 font-medium mt-0.5">Active</div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-3.5 hover:bg-white hover:shadow-xs transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Tasks</span>
            <div className="w-7 h-7 rounded-lg bg-amber-100/70 text-amber-600 flex items-center justify-center">
              <CheckSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">34</div>
          <div className="text-[11px] text-amber-600 font-medium mt-0.5">Open</div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-3.5 hover:bg-white hover:shadow-xs transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Meetings</span>
            <div className="w-7 h-7 rounded-lg bg-purple-100/70 text-purple-600 flex items-center justify-center">
              <CalendarIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">8</div>
          <div className="text-[11px] text-purple-600 font-medium mt-0.5">Upcoming</div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-3.5 hover:bg-white hover:shadow-xs transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Knowledge Base</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-100/70 text-emerald-600 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">124</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-0.5">Articles</div>
        </div>
      </div>

      {/* Main Workspace Preview Content (3 Panels: Upcoming Meeting, Upcoming Tasks, Recent Projects) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Panel 1: Upcoming Meeting */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <CalendarIcon className="w-4 h-4 text-indigo-600" />
                <span>Upcoming Meeting</span>
              </div>
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-indigo-50 text-indigo-700 rounded-md border border-indigo-100">
                Today
              </span>
            </div>

            <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200/70 space-y-2.5">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">Weekly Project Review</h4>
                  <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Today · 10:00 AM - 11:00 AM</span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-600 line-clamp-2">
                Review deliverables, sprint milestones, and unblock frontend architecture priorities.
              </p>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-xs">
                <div className="flex items-center -space-x-1.5">
                  <div className="w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[10px] font-semibold border-2 border-white">
                    AL
                  </div>
                  <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] font-semibold border-2 border-white">
                    RK
                  </div>
                  <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-semibold border-2 border-white">
                    SM
                  </div>
                  <span className="pl-3 text-[11px] text-slate-500 font-medium">3 attending</span>
                </div>
                <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  Minutes Ready
                </span>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2 text-right">
            <span className="text-xs font-semibold text-indigo-600 inline-flex items-center gap-1 hover:text-indigo-700 cursor-default">
              View agenda & notes <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        {/* Panel 2: Upcoming Tasks */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <CheckSquare className="w-4 h-4 text-indigo-600" />
                <span>Upcoming Tasks</span>
              </div>
              <span className="text-[11px] text-slate-500">2 priority</span>
            </div>

            <div className="space-y-2.5">
              <div className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <CircleDot className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <h5 className="text-xs font-semibold text-slate-900">Homepage Design</h5>
                      <span className="text-[10px] text-slate-500">Website Redesign</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-rose-50 text-rose-700 border border-rose-100 shrink-0">
                    Urgent
                  </span>
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-500">
                  <span>Due tomorrow</span>
                  <span className="font-medium text-slate-700">Assigned: Alex R.</span>
                </div>
              </div>

              <div className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <CircleDot className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                    <div>
                      <h5 className="text-xs font-semibold text-slate-900">API Integration</h5>
                      <span className="text-[10px] text-slate-500">Mobile Application</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-indigo-50 text-indigo-700 border border-indigo-100 shrink-0">
                    High
                  </span>
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-500">
                  <span>In Progress</span>
                  <span className="font-medium text-slate-700">Assigned: Sarah M.</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2 text-right">
            <span className="text-xs font-semibold text-indigo-600 inline-flex items-center gap-1 hover:text-indigo-700 cursor-default">
              Open board <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        {/* Panel 3: Recent Projects */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <FolderGit2 className="w-4 h-4 text-indigo-600" />
                <span>Recent Projects</span>
              </div>
              <span className="text-[11px] text-slate-500">Active</span>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-900">Website Redesign</span>
                  <span className="text-[11px] font-bold text-indigo-600">85%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-600 rounded-full" style={{ width: '85%' }} />
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-500">
                  <span>14/16 tasks completed</span>
                  <span className="text-emerald-600 font-semibold">On Track</span>
                </div>
              </div>

              <div className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-900">Mobile Application</span>
                  <span className="text-[11px] font-bold text-blue-600">40%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full" style={{ width: '40%' }} />
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-500">
                  <span>6/15 tasks completed</span>
                  <span className="text-amber-600 font-semibold">In Progress</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2 text-right">
            <span className="text-xs font-semibold text-indigo-600 inline-flex items-center gap-1 hover:text-indigo-700 cursor-default">
              View all projects <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
