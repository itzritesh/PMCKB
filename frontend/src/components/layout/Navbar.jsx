import React from 'react';
import { Layers, Activity, Database, Sparkles } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';

export default function Navbar({ backendStatus = 'checking' }) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-white">PMCKB</span>
              <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Phase 1 Foundation
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Projects • Meetings • Calendar • Knowledge Base
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="hidden md:inline text-slate-500">API Gateway:</span>
            <StatusBadge
              status={
                backendStatus === 'healthy'
                  ? 'online'
                  : backendStatus === 'offline'
                  ? 'offline'
                  : 'loading'
              }
              label={
                backendStatus === 'healthy'
                  ? 'API Online'
                  : backendStatus === 'offline'
                  ? 'API Offline'
                  : 'Connecting...'
              }
            />
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Node + React + Vite + Tailwind</span>
          </div>
        </div>
      </div>
    </header>
  );
}
