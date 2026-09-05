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
      activeColor: 'text-indigo-700 bg-indigo-50 border-indigo-200 font-semibold',
      badge: 'Core',
    },
    {
      to: '/projects',
      label: 'Projects',
      icon: FolderGit2,
      activeColor: 'text-indigo-700 bg-indigo-50 border-indigo-200 font-semibold',
      badge: 'Active',
    },
    {
      to: '/tasks',
      label: 'Tasks',
      icon: CheckSquare,
      activeColor: 'text-indigo-700 bg-indigo-50 border-indigo-200 font-semibold',
      badge: 'Active',
    },
    {
      to: '/meetings',
      label: 'Meetings',
      icon: Users,
      activeColor: 'text-indigo-700 bg-indigo-50 border-indigo-200 font-semibold',
      badge: 'Active',
    },
    {
      to: '/calendar',
      label: 'Calendar',
      icon: Calendar,
      activeColor: 'text-indigo-700 bg-indigo-50 border-indigo-200 font-semibold',
      badge: 'Active',
    },
    {
      to: '/knowledge',
      label: 'Knowledge Base',
      icon: BookOpen,
      activeColor: 'text-indigo-700 bg-indigo-50 border-indigo-200 font-semibold',
      badge: 'Active',
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
    <div className="flex flex-col h-full justify-between p-4 sm:p-6 bg-white border-r border-slate-200 shadow-xs">
      <div className="space-y-6">
        {/* Header Branding */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-sm">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base font-bold text-slate-900 tracking-tight">PMCKB</span>
              <span className="block text-[10px] uppercase tracking-wider text-indigo-600 font-semibold">
                Workspace OS
              </span>
            </div>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Section */}
        <div className="space-y-1">
          <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
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
                      ? `${item.activeColor} shadow-xs`
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </div>

                <span
                  className={`px-1.5 py-0.5 rounded-md text-[10px] font-semibold border ${
                    item.badge === 'Active'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : item.badge === 'Core'
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
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
      <div className="pt-4 border-t border-slate-200 space-y-3">
        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5 truncate">
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-xs font-bold text-white flex items-center justify-center shrink-0 shadow-xs">
              {getInitials(user?.name)}
            </div>
            <div className="truncate">
              <span className="block text-xs font-semibold text-slate-900 truncate">
                {user?.name || 'Workspace Member'}
              </span>
              <span className="block text-[10px] text-slate-500 truncate">
                {user?.email || ''}
              </span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            title="Sign Out"
            className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
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
          className="lg:hidden fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-72 h-full bg-white shadow-xl animate-in slide-in-from-left duration-200"
          >
            {content}
          </div>
        </div>
      )}
    </>
  );
}
