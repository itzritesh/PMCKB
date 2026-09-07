import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Server,
  Database,
  Cpu,
  RefreshCw,
  AlertCircle,
  Terminal,
  Calendar,
  Users,
  BookOpen,
  FolderGit2,
  ExternalLink,
  Copy,
  Check,
  ArrowLeft,
  Activity,
} from 'lucide-react';
import { healthService } from '../services/healthService';
import StatusBadge from '../components/common/StatusBadge';

export default function SystemStatusPage({ onStatusUpdate }) {
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
    { title: 'Run Database Migrations', cmd: 'cd backend && npm run db:init' },
    { title: 'Start Frontend Dev Server', cmd: 'cd frontend && npm run dev' },
    { title: 'Query Healthcheck Endpoint', cmd: 'curl http://localhost:5000/api/health' },
  ];

  const modules = [
    {
      title: 'Project Management',
      icon: FolderGit2,
      color: 'bg-blue-50 text-blue-600',
      description: 'Owner-scoped workspaces, deliverable tracking, status workflows, and team boards.',
      status: 'Active Module',
    },
    {
      title: 'Meetings & Minutes',
      icon: Users,
      color: 'bg-purple-50 text-purple-600',
      description: 'Structured agendas, action item assignment, meeting transcripts, and sync notes.',
      status: 'Active Module',
    },
    {
      title: 'Integrated Calendar',
      icon: Calendar,
      color: 'bg-amber-50 text-amber-600',
      description: 'Event scheduling, sprint timelines, deadline alerts, and bi-directional date sync.',
      status: 'Active Module',
    },
    {
      title: 'Knowledge Base',
      icon: BookOpen,
      color: 'bg-pink-50 text-pink-600',
      description: 'Markdown documentation, full-text search, architecture specifications, and team wikis.',
      status: 'Active Module',
    },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Homepage</span>
          </Link>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-mono text-slate-600">
            <Activity className="w-3.5 h-3.5 text-indigo-600" />
            <span>Developer / System Diagnostics</span>
          </div>
        </div>

        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 sm:p-12 shadow-xs">
          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
              Full-Stack System Diagnostics
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
              System Health & <br />
              <span className="text-indigo-600">
                Service Diagnostics
              </span>
            </h1>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              Real-time monitoring for PMCKB services: Express REST API, Neon PostgreSQL pool, JWT middleware verification, and network latency telemetry.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={checkServices}
                disabled={loading}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-medium text-sm transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span>{loading ? 'Testing System...' : 'Ping Backend & Database'}</span>
              </button>
              <a
                href={`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/health`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium border border-slate-200 transition-colors shadow-2xs"
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
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:shadow-md hover:border-slate-300 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <Server className="w-5 h-5" />
              </div>
              <StatusBadge
                status={backendHealth ? 'online' : error ? 'offline' : 'loading'}
                label={backendHealth ? 'ONLINE' : error ? 'OFFLINE' : 'CHECKING'}
              />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">Express Backend</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Node.js REST API with CORS, JWT middleware & modular routing.
            </p>

            <div className="space-y-2 text-xs border-t border-slate-100 pt-3">
              <div className="flex justify-between text-slate-600">
                <span>Base URL:</span>
                <span className="font-mono text-slate-800">http://localhost:5000</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Health Endpoint:</span>
                <span className="font-mono text-indigo-600">/api/health</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Latency:</span>
                <span className="font-mono text-slate-800">
                  {latency !== null ? `${latency} ms` : '—'}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Uptime:</span>
                <span className="font-mono text-slate-800">
                  {backendHealth?.data?.uptimeSeconds !== undefined
                    ? `${backendHealth.data.uptimeSeconds}s`
                    : '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: PostgreSQL Database */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:shadow-md hover:border-slate-300 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
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
            <h3 className="text-lg font-semibold text-slate-900">PostgreSQL Pool</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Connection pool (`pg`) with non-blocking error guards & retries.
            </p>

            <div className="space-y-2 text-xs border-t border-slate-100 pt-3">
              <div className="flex justify-between text-slate-600">
                <span>Target DB:</span>
                <span className="font-mono text-slate-800">
                  {backendHealth?.data?.database?.details?.config?.database || 'projects_db'}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Host:</span>
                <span className="font-mono text-slate-800 truncate max-w-[140px]">
                  {backendHealth?.data?.database?.details?.config?.host || 'localhost:5432'}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Pool Status:</span>
                <span className={backendHealth?.data?.database?.status === 'connected' ? 'text-emerald-700 font-mono font-semibold' : 'text-amber-700 font-mono'}>
                  {backendHealth?.data?.database?.status || 'Awaiting connection'}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Diagnostic:</span>
                <span className="font-mono text-slate-500">npm run db:test</span>
              </div>
            </div>
          </div>

          {/* Card 3: Frontend Client */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:shadow-md hover:border-slate-300 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                <Cpu className="w-5 h-5" />
              </div>
              <StatusBadge status="online" label="RUNNING" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">React + Vite Client</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Runs independently with Axios client, Tailwind CSS & Router.
            </p>

            <div className="space-y-2 text-xs border-t border-slate-100 pt-3">
              <div className="flex justify-between text-slate-600">
                <span>Vite Dev Port:</span>
                <span className="font-mono text-slate-800">5173</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Styling Engine:</span>
                <span className="font-mono text-indigo-600">Tailwind CSS v4</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Theme:</span>
                <span className="font-mono text-slate-800">Professional Light</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Mode:</span>
                <span className="font-mono text-emerald-700 font-semibold">Fully Independent</span>
              </div>
            </div>
          </div>
        </div>

        {/* Diagnostic Alert if Backend is Offline */}
        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 flex items-start gap-4">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1 text-sm">
              <h4 className="font-semibold text-rose-700">Backend Server Not Responding</h4>
              <p className="text-rose-600 text-xs leading-relaxed">
                The frontend is running independently, but the backend at <code className="bg-rose-100 px-1.5 py-0.5 rounded text-rose-800">http://localhost:5000</code> is currently unreachable.
                Start the backend in another terminal window with:
              </p>
              <div className="pt-2">
                <code className="px-3 py-1.5 rounded-lg bg-white border border-rose-200 font-mono text-xs text-rose-800">
                  cd backend && npm run dev
                </code>
              </div>
            </div>
          </div>
        )}

        {/* Architecture & Live Diagnostics Tabs */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                  activeTab === 'overview'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Module Overview
              </button>
              <button
                onClick={() => setActiveTab('commands')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                  activeTab === 'commands'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Setup Cheatsheet
              </button>
              <button
                onClick={() => setActiveTab('json')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                  activeTab === 'json'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
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
                    className="bg-white rounded-2xl p-5 flex flex-col justify-between border border-slate-200 shadow-xs hover:border-slate-300 hover:shadow-md transition-all"
                  >
                    <div>
                      <div className={`w-10 h-10 rounded-xl ${mod.color} flex items-center justify-center mb-3 shadow-2xs`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <h4 className="text-base font-semibold text-slate-900 mb-1">{mod.title}</h4>
                      <p className="text-xs text-slate-500 leading-relaxed mb-4">{mod.description}</p>
                    </div>
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-indigo-600 font-medium">{mod.status}</span>
                      <span className="text-slate-400">PMCKB</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Tab 2: Commands Cheatsheet */}
          {activeTab === 'commands' && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Terminal className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-semibold text-slate-900">Verification & Setup Commands</h3>
              </div>
              <p className="text-xs text-slate-500">
                You can run these commands from your root terminal to test each part of the system:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {commands.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between"
                  >
                    <div className="mb-2">
                      <span className="text-xs font-semibold text-slate-700">{item.title}</span>
                    </div>
                    <div className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-2xs">
                      <code className="text-xs font-mono text-slate-800 truncate mr-2">
                        {item.cmd}
                      </code>
                      <button
                        onClick={() => copyCommand(item.cmd, idx)}
                        className="p-1.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Copy command"
                      >
                        {copiedIndex === idx ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
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
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-slate-600">GET /api/health Response</span>
                <span className="text-xs text-slate-400">
                  {backendHealth ? 'Live Payload' : 'No response'}
                </span>
              </div>
              <pre className="p-4 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs text-slate-800 overflow-x-auto max-h-96">
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
