import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderGit2,
  CheckSquare,
  Users,
  Calendar,
  BookOpen,
  LogOut,
  X,
  Layers,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar({ isOpen = false, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    {
      to: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      activeColor: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
      badge: 'Core',
    },
    {
      to: '/projects',
      label: 'Projects',
      icon: FolderGit2,
      activeColor: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
      badge: 'Active',
    },
    {
      to: '/tasks',
      label: 'Tasks',
      icon: CheckSquare,
      activeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      badge: 'Active',
    },
    {
      to: '/meetings',
      label: 'Meetings',
      icon: Users,
      activeColor: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
      badge: 'Preview',
    },
    {
      to: '/calendar',
      label: 'Calendar',
      icon: Calendar,
      activeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
      badge: 'Preview',
    },
    {
      to: '/knowledge',
      label: 'Knowledge Base',
      icon: BookOpen,
      activeColor: 'text-pink-400 bg-pink-500/10 border-pink-500/30',
      badge: 'Preview',
    },
  ];

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const content = (
    <div className="flex flex-col h-full justify-between p-4 sm:p-6 bg-slate-950/95 border-r border-slate-800/80 backdrop-blur-xl">
      <div className="space-y-6">
        {/* Header Branding */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-base font-bold text-white tracking-tight">PMCKB</span>
              <span className="block text-[10px] uppercase tracking-wider text-indigo-400 font-semibold">
                Workspace OS
              </span>
            </div>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Section */}
        <div className="space-y-1">
          <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Navigation Modules
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-medium transition-all border ${
                    isActive
                      ? `${item.activeColor} shadow-md`
                      : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/80 hover:border-slate-800'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </div>

                <span
                  className={`px-1.5 py-0.5 rounded-md text-[10px] font-semibold ${
                    item.badge === 'Active'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : item.badge === 'Core'
                      ? 'bg-indigo-500/20 text-indigo-300'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {item.badge}
                </span>
              </NavLink>
            );
          })}
        </div>
      </div>

      {/* User Session Footer */}
      <div className="pt-4 border-t border-slate-800/80 space-y-3">
        <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5 truncate">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-xs font-bold text-white flex items-center justify-center shrink-0 shadow-sm">
              {getInitials(user?.name)}
            </div>
            <div className="truncate">
              <span className="block text-xs font-semibold text-white truncate">
                {user?.name || 'Authorized User'}
              </span>
              <span className="block text-[10px] text-slate-400 truncate">
                {user?.email || ''}
              </span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            title="Sign Out"
            className="p-1.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="lg:hidden fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-72 h-full bg-slate-950 shadow-2xl animate-in slide-in-from-left duration-200"
          >
            {content}
          </div>
        </div>
      )}
    </>
  );
}
