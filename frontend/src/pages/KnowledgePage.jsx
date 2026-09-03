import React from 'react';
import { BookOpen, Search, FileText, Sparkles, Folder, ArrowRight, ShieldCheck, Database, Layers } from 'lucide-react';

export default function KnowledgePage() {
  const articles = [
    {
      id: 1,
      title: 'Neon PostgreSQL Setup & Connection Pooling',
      category: 'Database Architecture',
      readTime: '4 min read',
      excerpt: 'Guide to configuring serverless Neon Postgres, SSL connection strings, and connection pool initialization.',
    },
    {
      id: 2,
      title: 'JWT Authentication & Bearer Token Verification',
      category: 'Security & Auth',
      readTime: '6 min read',
      excerpt: 'Detailed overview of bcryptjs password hashing, JWT signature issuance, and Express middleware authorization.',
    },
    {
      id: 3,
      title: 'Task Lifecycle, Priorities & Deadline Alerts',
      category: 'Project Management',
      readTime: '3 min read',
      excerpt: 'Standard operating procedures for managing sprint tasks, tracking urgent deliverables, and resolving overdue items.',
    },
    {
      id: 4,
      title: 'Collaborative Discussion Threads & Task Comments',
      category: 'Collaboration',
      readTime: '5 min read',
      excerpt: 'Best practices for team activity threads, inline author comment editing, and deliverable documentation.',
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
                Knowledge Base
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Documentation & Wiki
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400">
              Centralized engineering docs, architecture specifications, API standards, and onboarding wikis.
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-xl">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search articles, architecture guides, and API specs..."
            className="w-full pl-11 pr-4 py-3 bg-slate-900/90 border border-slate-800 rounded-2xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
          />
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-2">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-white">Database & Schemas</h4>
            <p className="text-xs text-slate-400">PostgreSQL tables, migrations, and indexing strategies.</p>
          </div>

          <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-white">Security & API Auth</h4>
            <p className="text-xs text-slate-400">JWT verification, CORS policies, and role isolation.</p>
          </div>

          <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-2">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-white">Frontend Architecture</h4>
            <p className="text-xs text-slate-400">React 18, Tailwind CSS design system, and state caching.</p>
          </div>
        </div>

        {/* Featured Articles */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
            Featured Engineering Docs
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {articles.map((art) => (
              <div
                key={art.id}
                className="glass-card rounded-2xl p-5 border border-slate-800 hover:border-emerald-500/40 transition-all space-y-2 group cursor-pointer"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="text-emerald-400 font-medium">{art.category}</span>
                  <span className="text-slate-500">{art.readTime}</span>
                </div>

                <h4 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors">
                  {art.title}
                </h4>

                <p className="text-xs text-slate-400 leading-relaxed">
                  {art.excerpt}
                </p>

                <div className="pt-2 flex items-center gap-1 text-xs font-semibold text-emerald-400">
                  <span>Read Guide</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
