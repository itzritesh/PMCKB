import React from 'react';
import { UserCheck, Layers, Share2, ArrowRight } from 'lucide-react';

export default function HowItWorksSection() {
  const steps = [
    {
      step: '01',
      title: 'Create Your Workspace',
      description: 'Set up your account and start organizing your work.',
      icon: UserCheck,
      details: 'Instant registration with zero friction. Get access to your personal workspace dashboard immediately.',
    },
    {
      step: '02',
      title: 'Manage Your Work',
      description: 'Create projects, tasks, meetings and calendar events.',
      icon: Layers,
      details: 'Break initiatives into manageable tasks, assign teammates, schedule syncs, and monitor real-time completion.',
    },
    {
      step: '03',
      title: 'Share Knowledge',
      description: "Document important information and keep your team's knowledge accessible.",
      icon: Share2,
      details: 'Publish architecture notes, record meeting minutes, and build a searchable company knowledge repository.',
    },
  ];

  return (
    <section id="how-it-works" className="py-20 bg-slate-50 scroll-mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200">
            Simple Workflow
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            How PMCKB Works
          </h2>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            Get up and running in minutes with a straightforward, organized operational flow.
          </p>
        </div>

        {/* 3 Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {steps.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="relative rounded-3xl border border-slate-200 bg-white p-8 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Step Number Badge */}
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-3xl sm:text-4xl font-black text-indigo-600/80 font-mono tracking-tighter">
                      {item.step}
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 mb-2">
                    {item.title}
                  </h3>

                  <p className="text-sm font-medium text-indigo-700 mb-4">
                    "{item.description}"
                  </p>

                  <p className="text-xs text-slate-500 leading-relaxed">
                    {item.details}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
