import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  User,
  Mail,
  KeyRound,
  LogOut,
  FolderGit2,
  Calendar,
  Users,
  BookOpen,
  CheckCircle2,
  Lock,
  ArrowRight,
  Terminal,
  Activity,
  Sparkles,
} from 'lucide-react';
import { authService } from '../services/authService';

export default function DashboardPage() {
  const { user, token, logout } = useAuth();
  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting] = useState(false);
  const [testError, setTestError] = useState(null);

  const handleTestProtectedApi = async () => {
    setTesting(true);
    setTestError(null);
    try {
      const res = await authService.testProtected();
      setTestResult(res);
    } catch (err) {
      setTestError(err.message || 'Failed to call protected endpoint');
      setTestResult(null);
    } finally {
      setTesting(false);
    }
  };

  const modules = [
    {
      title: 'Project Management',
      icon: FolderGit2,
      color: 'from-blue-600 to-indigo-600',
      description: 'Boards, sprints, and task management linked to your user account.',
      badge: 'Unlocked in Phase 3',
    },
    {
      title: 'Meetings & Minutes',
      icon: Users,
      color: 'from-purple-600 to-pink-600',
      description: 'Collaborative meeting agendas and assigned action items.',
      badge: 'Unlocked in Phase 4',
    },
    {
      title: 'Calendar & Scheduling',
      icon: Calendar,
      color: 'from-emerald-600 to-teal-600',
      description: 'Team scheduling and unified calendar sync.',
      badge: 'Unlocked in Phase 5',
    },
    {
      title: 'Knowledge Base',
      icon: BookOpen,
      color: 'from-amber-600 to-orange-600',
      description: 'Centralized team documentation, search, and wikis.',
      badge: 'Unlocked in Phase 6',
    },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] py-10 px-4 sm:px-6 lg:px-8 bg-radial from-indigo-950/20 via-slate-950 to-slate-950">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Welcome Header */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-slate-950/90 p-8 sm:p-10 shadow-2xl backdrop-blur-xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>JWT Authentication Verified</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Welcome, {user?.name || 'Authorized User'}!
              </h1>
              <p className="text-sm text-slate-400">
                You are securely signed in. Your JWT token authorizes all subsequent API requests.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={logout}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-rose-500/20 hover:text-rose-300 hover:border-rose-500/30 text-slate-300 text-sm font-medium border border-slate-700/60 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>

        {/* Two-Column Grid: User Profile Card & Protected Endpoint Tester */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Card 1: User Profile Details */}
          <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">Active Session Details</h3>
                  <p className="text-xs text-slate-400">Decoded from JWT token and PostgreSQL</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Active
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/70 border border-slate-800/80">
                <span className="text-slate-400">User ID (PostgreSQL):</span>
                <span className="font-mono text-slate-200 font-semibold">{user?.id || '—'}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/70 border border-slate-800/80">
                <span className="text-slate-400">Display Name:</span>
                <span className="text-slate-200 font-semibold">{user?.name || '—'}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/70 border border-slate-800/80">
                <span className="text-slate-400">Registered Email:</span>
                <span className="font-mono text-indigo-300 font-semibold">{user?.email || '—'}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/70 border border-slate-800/80">
                <span className="text-slate-400">Account Created:</span>
                <span className="text-slate-300">
                  {user?.created_at ? new Date(user.created_at).toLocaleString() : 'Just now'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800/80 space-y-1">
                <span className="text-slate-400 block">Bearer Token Preview:</span>
                <p className="font-mono text-[11px] text-slate-500 truncate select-all">
                  {token ? `${token.slice(0, 48)}...` : 'No token stored'}
                </p>
              </div>
            </div>
          </div>

          {/* Card 2: Interactive Protected API Tester */}
          <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">Protected API Verification</h3>
                  <p className="text-xs text-slate-400">Test Bearer token rejection & acceptance</p>
                </div>
              </div>
              <button
                onClick={handleTestProtectedApi}
                disabled={testing}
                className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-medium transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                {testing ? 'Verifying...' : 'Call GET /api/protected/test'}
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              This triggers a request to <code className="bg-slate-900 px-1.5 py-0.5 rounded text-indigo-300">/api/protected/test</code> passing your JWT in the <code className="bg-slate-900 px-1.5 py-0.5 rounded text-indigo-300">Authorization: Bearer &lt;token&gt;</code> header.
            </p>

            {testResult && (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
                <div className="flex items-center justify-between text-xs text-emerald-400 font-medium">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    Authorization Succeeded (HTTP {testResult.status})
                  </span>
                  <span className="font-mono">{testResult.latency} ms</span>
                </div>
                <pre className="p-3 rounded-lg bg-slate-950 border border-slate-900 text-[11px] font-mono text-emerald-300 overflow-x-auto">
                  {JSON.stringify(testResult.data, null, 2)}
                </pre>
              </div>
            )}

            {testError && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
                <p className="font-semibold mb-1">Authorization Failed</p>
                <p>{testError}</p>
              </div>
            )}

            {!testResult && !testError && (
              <div className="p-6 rounded-xl bg-slate-900/40 border border-slate-800/60 text-center text-xs text-slate-500">
                Click "Call GET /api/protected/test" above to test live JWT verification.
              </div>
            )}
          </div>
        </div>

        {/* Modules Access Section (Previewing Phase 3+) */}
        <div className="space-y-4 pt-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <h3 className="text-lg font-bold text-white">Authenticated Workspaces</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {modules.map((mod, idx) => {
              const Icon = mod.icon;
              return (
                <div
                  key={idx}
                  className="glass-card glass-card-hover rounded-2xl p-5 flex flex-col justify-between border border-slate-800"
                >
                  <div>
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${mod.color} flex items-center justify-center text-white mb-3 shadow-md`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <h4 className="text-base font-semibold text-white mb-1">{mod.title}</h4>
                    <p className="text-xs text-slate-400 leading-relaxed mb-4">{mod.description}</p>
                  </div>
                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-slate-400">{mod.badge}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
