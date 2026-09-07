import React from 'react';
import { Link } from 'react-router-dom';
import { Layers, Activity } from 'lucide-react';

export default function LandingFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white py-12 text-slate-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 pb-8 border-b border-slate-100">
          {/* Brand */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-2">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs group-hover:bg-indigo-700 transition-colors">
                <Layers className="w-5 h-5" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tight text-slate-900">PMCKB</span>
                <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Workspace
                </span>
              </div>
            </Link>
            <p className="text-xs text-slate-500 max-w-sm">
              Projects • Meetings • Calendar • Knowledge Base
            </p>
          </div>

          {/* Navigation Links */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-semibold text-slate-600">
            <a href="#" className="hover:text-indigo-600 transition-colors">
              Home
            </a>
            <a href="#features" className="hover:text-indigo-600 transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-indigo-600 transition-colors">
              How It Works
            </a>
            <a href="#benefits" className="hover:text-indigo-600 transition-colors">
              Benefits
            </a>
            <Link to="/login" className="hover:text-indigo-600 transition-colors">
              Sign In
            </Link>
            <Link to="/register" className="hover:text-indigo-600 transition-colors">
              Register
            </Link>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© 2026 PMCKB. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link
              to="/system-status"
              className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-600 transition-colors"
              title="System Health & Diagnostic Console"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>System Status</span>
            </Link>
            <span className="text-slate-300">•</span>
            <span>Light Theme SaaS</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
