import React from 'react';
import {
  Layout,
  Eye,
  CalendarCheck,
  Search,
  Users2,
  Hourglass,
  CheckCircle2,
} from 'lucide-react';

export default function BenefitsSection() {
  const benefits = [
    {
      title: 'Centralized Workspace',
      description: 'Replace fragmented tabs and scattered tools with a single source of truth for everything.',
      icon: Layout,
    },
    {
      title: 'Better Task Visibility',
      description: 'Monitor status progression, bottlenecks, and completion percentages in real time.',
      icon: Eye,
    },
    {
      title: 'Organized Meetings',
      description: 'Keep agendas, attendees, and action minutes tightly linked to corresponding projects.',
      icon: CalendarCheck,
    },
    {
      title: 'Searchable Knowledge',
      description: 'Find guides, SOPs, and technical documentation instantly with full-text search.',
      icon: Search,
    },
    {
      title: 'Simple Team Collaboration',
      description: 'Assign tasks with clear accountability and discuss deliverables with built-in comments.',
      icon: Users2,
    },
    {
      title: 'Clear Deadlines',
      description: 'Never miss a deliverable with deadline alerts, priority flags, and calendar integrations.',
      icon: Hourglass,
    },
  ];

  return (
    <section id="benefits" className="py-20 bg-white border-t border-slate-200/80 scroll-mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200">
            Why Teams Choose PMCKB
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Built for Modern Work and Clear Results
          </h2>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            Eliminate operational friction and keep your entire team aligned without software overload.
          </p>
        </div>

        {/* 6 Grid Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-2xl border border-slate-200 bg-slate-50/40 hover:bg-white hover:border-slate-300 hover:shadow-md transition-all flex items-start space-x-4"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-slate-900">{item.title}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">{item.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
