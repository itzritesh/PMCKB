import React from 'react';
import { Users, Calendar, Video, Clock, Plus, Sparkles, CheckCircle2, MessageSquare } from 'lucide-react';

export default function MeetingsPage() {
  const sampleMeetings = [
    {
      id: 1,
      title: 'Weekly Sprint Standup & Deliverable Review',
      date: 'Tomorrow at 10:00 AM',
      duration: '45 mins',
      attendees: ['Commander Shepard', 'Liara TSoni', 'Garrus Vakarian'],
      agenda: 'Review sprint deliverables, task assignments, and unblock overdue items.',
      status: 'upcoming',
    },
    {
      id: 2,
      title: 'Architecture & Security Sync',
      date: 'Friday at 2:30 PM',
      duration: '30 mins',
      attendees: ['Commander Shepard', 'Tali Zorah'],
      agenda: 'Evaluate Neon PostgreSQL connection pooling, JWT token refresh, and RBAC.',
      status: 'scheduled',
    },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] py-10 px-4 sm:px-6 lg:px-8 bg-radial from-indigo-950/20 via-slate-950 to-slate-950">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Meetings & Discussions
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                Module Preview
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400">
              Schedule team syncs, record collaborative meeting minutes, and assign action items directly to tasks.
            </p>
          </div>

          <button
            onClick={() => alert('Meetings module will be fully integrated with calendar sync!')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-white text-xs sm:text-sm font-medium transition-all shadow-lg shadow-purple-600/30 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Meeting</span>
          </button>
        </div>

        {/* Feature Highlights Banner */}
        <div className="glass-card rounded-3xl p-6 sm:p-8 border border-purple-500/30 bg-gradient-to-r from-purple-950/30 via-slate-900/60 to-slate-900/80 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Interactive Meetings Integration</h3>
              <p className="text-xs text-slate-400">
                Connect discussions directly with your projects and deliverable deadlines.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-1">
              <div className="flex items-center gap-2 text-purple-400 text-xs font-bold">
                <Video className="w-4 h-4" />
                <span>Virtual Room Links</span>
              </div>
              <p className="text-xs text-slate-400">Integrated video call links and calendar invitations.</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-1">
              <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Task Action Items</span>
              </div>
              <p className="text-xs text-slate-400">Turn meeting action items directly into assigned tasks.</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-1">
              <div className="flex items-center gap-2 text-pink-400 text-xs font-bold">
                <MessageSquare className="w-4 h-4" />
                <span>Minutes Archive</span>
              </div>
              <p className="text-xs text-slate-400">Searchable meeting minutes stored in your Knowledge Base.</p>
            </div>
          </div>
        </div>

        {/* Sample Meetings Showcase */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
            Upcoming Scheduled Meetings
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sampleMeetings.map((m) => (
              <div
                key={m.id}
                className="glass-card rounded-2xl p-5 border border-slate-800 space-y-3 relative group"
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-base font-semibold text-white group-hover:text-purple-300 transition-colors">
                    {m.title}
                  </h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    {m.status}
                  </span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  {m.agenda}
                </p>

                <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                  <div className="flex items-center gap-1.5 text-purple-300 font-medium">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{m.date}</span>
                  </div>

                  <div className="flex items-center gap-1 text-slate-500">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{m.duration}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 pt-1">
                  <span className="text-[11px] text-slate-500">Attendees:</span>
                  <div className="flex items-center -space-x-1.5">
                    {m.attendees.map((name, i) => (
                      <div
                        key={i}
                        title={name}
                        className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 text-[10px] font-bold text-slate-300 flex items-center justify-center cursor-default"
                      >
                        {name[0]}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
