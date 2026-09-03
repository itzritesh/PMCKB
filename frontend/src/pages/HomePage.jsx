import React, { useState, useEffect } from 'react';
import {
  Server,
  Database,
  Cpu,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Terminal,
  Layers,
  Calendar,
  Users,
  BookOpen,
  FolderGit2,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';
import { healthService } from '../services/healthService';
import StatusBadge from '../components/common/StatusBadge';

export default function HomePage({ onStatusUpdate }) {
  const [loading, setLoading] = useState(false);
  const [backendHealth, setBackendHealth] = useState(null);
  const [rootInfo, setRootInfo] = useState(null);
  const [latency, setLatency] = useState(null);
  const [error, setError] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  const checkServices = async () => {
    setLoading(true);
    setError(null);
    try {
      const [rootRes, healthRes] = await Promise.all([
        healthService.getRoot(),
        healthService.getHealth(),
      ]);

      setRootInfo(rootRes.data);
      setBackendHealth(healthRes.data);
      setLatency(healthRes.latency);
      if (onStatusUpdate) onStatusUpdate('healthy');
    } catch (err) {
      console.warn('Backend ping failed:', err);
      setError(err.message || 'Unable to connect to backend server');
      setBackendHealth(null);
      setRootInfo(null);
      setLatency(null);
      if (onStatusUpdate) onStatusUpdate('offline');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkServices();
  }, []);

  const copyCommand = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const commands = [
    { title: 'Start Backend Dev Server', cmd: 'cd backend && npm run dev' },
    { title: 'Test Database Connectivity', cmd: 'cd backend && npm run db:test' },
    { title: 'Start Frontend Dev Server', cmd: 'cd frontend && npm run dev' },
    { title: 'Query Healthcheck Endpoint', cmd: 'curl http://localhost:5000/api/health' },
  ];

  const modules = [
    {
      title: 'Project Management',
      icon: FolderGit2,
      color: 'from-blue-500 to-indigo-600',
      description: 'Hierarchical task trees, sprint boards, milestone tracking, and team assignees.',
      status: 'Ready for Phase 2',
    },
    {
      title: 'Meetings & Minutes',
      icon: Users,
      color: 'from-purple-500 to-pink-600',
      description: 'Structured agendas, action item assignment, meeting transcripts, and sync notes.',
      status: 'Ready for Phase 2',
    },
    {
      title: 'Integrated Calendar',
      icon: Calendar,
      color: 'from-emerald-500 to-teal-600',
      description: 'Event scheduling, sprint timelines, deadline alerts, and bi-directional date sync.',
      status: 'Ready for Phase 2',
    },
    {
      title: 'Knowledge Base',
      icon: BookOpen,
      color: 'from-amber-500 to-orange-600',
      description: 'Markdown documentation, full-text search, version history, and team wikis.',
      status: 'Ready for Phase 2',
    },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-radial from-indigo-950/20 via-slate-950 to-slate-950 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-800/80 bg-gradient-to-b from-slate-900/90 to-slate-950/90 p-8 sm:p-12 shadow-2xl backdrop-blur-xl">
          <div className="absolute -right-20 -top-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
              Phase 1 Milestone Complete
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Projects, Meetings, Calendar, <br />
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Knowledge Base Platform
              </span>
            </h1>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              Phase 1 establishes the production architecture: decoupled Express API with PostgreSQL connection pooling, JWT security scaffolding, and an independent React 18 + Vite frontend styled with Tailwind CSS v4.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={checkServices}
                disabled={loading}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-medium text-sm transition-all shadow-lg shadow-indigo-600/30 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span>{loading ? 'Testing System...' : 'Ping Backend & Database'}</span>
              </button>
              <a
                href="http://localhost:5000/api/health"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium border border-slate-700/60 transition-colors"
              >
                <span>Direct API Health JSON</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </a>
            </div>
          </div>
        </div>

        {/* Live Status Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Backend Service */}
          <div className="glass-card glass-card-hover rounded-2xl p-6 relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Server className="w-5 h-5" />
              </div>
              <StatusBadge
                status={backendHealth ? 'online' : error ? 'offline' : 'loading'}
                label={backendHealth ? 'ONLINE' : error ? 'OFFLINE' : 'CHECKING'}
              />
            </div>
            <h3 className="text-lg font-semibold text-white">Express Backend</h3>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              Node.js REST API with CORS, JWT middleware & modular routing.
            </p>

            <div className="space-y-2 text-xs border-t border-slate-800 pt-3">
              <div className="flex justify-between text-slate-400">
                <span>Base URL:</span>
                <span className="font-mono text-slate-300">http://localhost:5000</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Health Endpoint:</span>
                <span className="font-mono text-indigo-400">/api/health</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Latency:</span>
                <span className="font-mono text-slate-200">
                  {latency !== null ? `${latency} ms` : '—'}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Uptime:</span>
                <span className="font-mono text-slate-200">
                  {backendHealth?.data?.uptimeSeconds !== undefined
                    ? `${backendHealth.data.uptimeSeconds}s`
                    : '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: PostgreSQL Database */}
          <div className="glass-card glass-card-hover rounded-2xl p-6 relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Database className="w-5 h-5" />
              </div>
              <StatusBadge
                status={
                  backendHealth?.data?.database?.status === 'connected'
                    ? 'connected'
                    : 'disconnected'
                }
                label={
                  backendHealth?.data?.database?.status === 'connected'
                    ? 'CONNECTED'
                    : 'DEGRADED / READY'
                }
              />
            </div>
            <h3 className="text-lg font-semibold text-white">PostgreSQL Pool</h3>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              Connection pool (`pg`) with non-blocking error guards & retries.
            </p>

            <div className="space-y-2 text-xs border-t border-slate-800 pt-3">
              <div className="flex justify-between text-slate-400">
                <span>Target DB:</span>
                <span className="font-mono text-slate-300">
                  {backendHealth?.data?.database?.details?.config?.database || 'projects_db'}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Host:</span>
                <span className="font-mono text-slate-300">
                  {backendHealth?.data?.database?.details?.config?.host || 'localhost:5432'}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Pool Status:</span>
                <span className={backendHealth?.data?.database?.status === 'connected' ? 'text-emerald-400 font-mono' : 'text-amber-400 font-mono'}>
                  {backendHealth?.data?.database?.status || 'Awaiting connection'}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Diagnostic:</span>
                <span className="font-mono text-slate-400">npm run db:test</span>
              </div>
            </div>
          </div>

          {/* Card 3: Frontend Client */}
          <div className="glass-card glass-card-hover rounded-2xl p-6 relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <Cpu className="w-5 h-5" />
              </div>
              <StatusBadge status="online" label="RUNNING" />
            </div>
            <h3 className="text-lg font-semibold text-white">React + Vite Client</h3>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              Runs independently with Axios client, Tailwind CSS & Router.
            </p>

            <div className="space-y-2 text-xs border-t border-slate-800 pt-3">
              <div className="flex justify-between text-slate-400">
                <span>Vite Dev Port:</span>
                <span className="font-mono text-slate-300">5173</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Styling Engine:</span>
                <span className="font-mono text-cyan-400">Tailwind CSS v4</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Routing:</span>
                <span className="font-mono text-slate-300">React Router DOM</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Mode:</span>
                <span className="font-mono text-emerald-400">Fully Independent</span>
              </div>
            </div>
          </div>
        </div>

        {/* Diagnostic Alert if Backend is Offline */}
        {error && (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-5 flex items-start gap-4">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1 text-sm">
              <h4 className="font-semibold text-rose-300">Backend Server Not Responding</h4>
              <p className="text-rose-200/80 text-xs leading-relaxed">
                The frontend is running independently, but the backend at <code className="bg-rose-950/60 px-1.5 py-0.5 rounded text-rose-200">http://localhost:5000</code> is currently unreachable.
                Start the backend in another terminal window with:
              </p>
              <div className="pt-2">
                <code className="px-3 py-1.5 rounded-lg bg-rose-950 border border-rose-800/60 font-mono text-xs text-rose-100">
                  cd backend && npm run dev
                </code>
              </div>
            </div>
          </div>
        )}

        {/* Architecture & Live Diagnostics Tabs */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                  activeTab === 'overview'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                Module Scaffolding (Phase 2+)
              </button>
              <button
                onClick={() => setActiveTab('commands')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                  activeTab === 'commands'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                Manual Testing Cheatsheet
              </button>
              <button
                onClick={() => setActiveTab('json')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                  activeTab === 'json'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                Raw API Payload
              </button>
            </div>
          </div>

          {/* Tab 1: Module Scaffolding */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {modules.map((mod, idx) => {
                const Icon = mod.icon;
                return (
                  <div
                    key={idx}
                    className="glass-card glass-card-hover rounded-2xl p-5 flex flex-col justify-between border border-slate-800/80"
                  >
                    <div>
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${mod.color} flex items-center justify-center text-white mb-3 shadow-md`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <h4 className="text-base font-semibold text-white mb-1">{mod.title}</h4>
                      <p className="text-xs text-slate-400 leading-relaxed mb-4">{mod.description}</p>
                    </div>
                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                      <span className="text-indigo-400 font-medium">{mod.status}</span>
                      <span className="text-slate-600">Phase 2</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Tab 2: Manual Testing Cheatsheet */}
          {activeTab === 'commands' && (
            <div className="glass-card rounded-2xl p-6 border border-slate-800/80 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Terminal className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-semibold text-white">Manual Verification Commands</h3>
              </div>
              <p className="text-xs text-slate-400">
                You can run these commands from your root terminal to test each part of the system:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {commands.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between"
                  >
                    <div className="mb-2">
                      <span className="text-xs font-medium text-indigo-300">{item.title}</span>
                    </div>
                    <div className="flex items-center justify-between bg-slate-950 px-3 py-2 rounded-lg border border-slate-800/70">
                      <code className="text-xs font-mono text-slate-200 truncate mr-2">
                        {item.cmd}
                      </code>
                      <button
                        onClick={() => copyCommand(item.cmd, idx)}
                        className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Copy command"
                      >
                        {copiedIndex === idx ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 3: Raw API Payload */}
          {activeTab === 'json' && (
            <div className="glass-card rounded-2xl p-6 border border-slate-800/80 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-slate-400">GET /api/health Response</span>
                <span className="text-xs text-slate-500">
                  {backendHealth ? 'Live Payload' : 'No response'}
                </span>
              </div>
              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-indigo-300 overflow-x-auto max-h-96">
                {backendHealth
                  ? JSON.stringify(backendHealth, null, 2)
                  : error
                  ? JSON.stringify({ error, note: 'Start backend using npm run dev in backend/' }, null, 2)
                  : '// Click "Ping Backend & Database" to fetch response'}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
