import React from 'react';
import { FolderGit2, Calendar, FileText, BookOpen, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function FeaturesSection() {
  const features = [
    {
      id: 'projects-tasks',
      title: 'Project & Task Management',
      description:
        'Create projects, break work into tasks, assign team members, set priorities and manage deadlines.',
      icon: FolderGit2,
      badge: 'Execution',
      color: 'bg-blue-50 text-blue-600 border-blue-200',
      pillColor: 'text-blue-700 bg-blue-50',
      highlights: ['Priority tags & deadlines', 'Assignee dispatch', 'Interactive task comments'],
    },
    {
      id: 'meetings-calendar',
      title: 'Meetings & Calendar',
      description:
        "Schedule meetings, manage attendees, track events and keep your team's schedule organized.",
      icon: Calendar,
      badge: 'Scheduling',
      color: 'bg-purple-50 text-purple-600 border-purple-200',
      pillColor: 'text-purple-700 bg-purple-50',
      highlights: ['Visual month/day views', 'Attendee RSVP tracking', 'Automated conflict detection'],
    },
    {
      id: 'meeting-minutes',
      title: 'Meeting Minutes',
      description:
        'Capture discussions, decisions and action items so important meeting outcomes never get lost.',
      icon: FileText,
      badge: 'Decisions',
      color: 'bg-amber-50 text-amber-600 border-amber-200',
      pillColor: 'text-amber-700 bg-amber-50',
      highlights: ['Key discussion points', 'Logged decision records', 'Follow-up action assignments'],
    },
    {
      id: 'knowledge-base',
      title: 'Knowledge Base',
      description:
        'Create, categorize and search important documentation and knowledge in one central place.',
      icon: BookOpen,
      badge: 'Documentation',
      color: 'bg-emerald-50 text-emerald-600 border-emerald-200',
      pillColor: 'text-emerald-700 bg-emerald-50',
      highlights: ['Categorized articles', 'Instant full-text search', 'Markdown formatting'],
    },
  ];

  return (
    <section id="features" className="py-20 bg-white border-y border-slate-200/80 scroll-mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200">
            Platform Capabilities
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Everything Your Team Needs to Stay Organized
          </h2>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            Eliminate fragmented tools. PMCKB consolidates your daily workflow into four interconnected modules built for team productivity.
          </p>
        </div>

        {/* 4 Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className="group relative rounded-3xl border border-slate-200 bg-slate-50/40 p-8 hover:bg-white hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-xs transition-transform duration-300 group-hover:scale-105 ${item.color}`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <span
                      className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border border-slate-200 ${item.pillColor}`}
                    >
                      {item.badge}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-indigo-600 transition-colors">
                    {item.title}
                  </h3>

                  <p className="text-sm text-slate-600 leading-relaxed mb-6">
                    {item.description}
                  </p>
                </div>

                <div className="border-t border-slate-200/70 pt-5 space-y-2">
                  {item.highlights.map((h, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-slate-600">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
