import React from 'react';
import { Link } from 'react-router-dom';
import { Layers, Sparkles, User, LogOut, LayoutDashboard, LogIn, UserPlus } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';
import { useAuth } from '../../context/AuthContext';

export default function Navbar({ backendStatus = 'checking' }) {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo and Brand */}
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-white">PMCKB</span>
              <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Phase 2 Auth
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Projects • Meetings • Calendar • Knowledge Base
            </p>
          </div>
        </Link>

        {/* Navigation Actions */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div className="hidden md:flex items-center gap-2 text-xs text-slate-400">
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

          {isAuthenticated ? (
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 text-xs font-medium transition-colors"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Dashboard</span>
              </Link>

              <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
                <User className="w-3.5 h-3.5 text-indigo-400" />
                <span className="max-w-[120px] truncate">{user?.name}</span>
              </div>

              <button
                onClick={logout}
                title="Sign Out"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-rose-500/20 hover:text-rose-300 hover:border-rose-500/30 text-slate-400 border border-slate-800 text-xs font-medium transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 text-xs font-medium transition-colors"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-all shadow-md shadow-indigo-600/25"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Register</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
