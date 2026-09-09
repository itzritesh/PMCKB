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
  Megaphone,
  Settings,
  Crown,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTeam } from '../../context/TeamContext';

export default function Sidebar({ isOpen = false, onClose }) {
  const { user, logout } = useAuth();
  const { currentTeam, isLeader } = useTeam();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Phase 8 Sidebar: Common Items (Accessible to all authenticated members)
  const commonNavItems = [
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
    {
      to: '/announcements',
      label: 'Announcements',
      icon: Megaphone,
      activeColor: 'text-indigo-700 bg-indigo-50 border-indigo-200 font-semibold',
      badge: 'Feed',
    },
  ];

  // Phase 8 Sidebar: Leader-Only Items (Visible only when user is team leader)
  const leaderNavItems = [
    {
      to: currentTeam?.id ? `/teams/${currentTeam.id}` : '/teams',
      label: 'Team Members',
      icon: UserCheck,
      activeColor: 'text-purple-700 bg-purple-50 border-purple-200 font-semibold',
      badge: 'Leader',
    },
    {
      to: currentTeam?.id ? `/teams/${currentTeam.id}?tab=settings` : '/teams',
      label: 'Team Settings',
      icon: Settings,
      activeColor: 'text-purple-700 bg-purple-50 border-purple-200 font-semibold',
      badge: 'Admin',
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

  const renderNavList = (items) => (
    <div className="space-y-1">
      {items.map((item) => {
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
                  : item.badge === 'Leader' || item.badge === 'Admin'
                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              {item.badge}
            </span>
          </NavLink>
        );
      })}
    </div>
  );

  const content = (
    <div className="flex flex-col h-full justify-between p-4 sm:p-6 bg-white border-r border-slate-200 shadow-xl overflow-y-auto">
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
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Current Active Workspace Indicator */}
        {currentTeam && (
          <div className="px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200/80">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
              Active Workspace
            </span>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-900 truncate">
                {currentTeam.name}
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                  isLeader
                    ? 'bg-purple-50 text-purple-700 border-purple-200'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}
              >
                {isLeader ? <Crown className="w-2.5 h-2.5 text-purple-600" /> : <UserCheck className="w-2.5 h-2.5 text-emerald-600" />}
                <span>{isLeader ? 'Leader' : 'Member'}</span>
              </span>
            </div>
          </div>
        )}

        {/* Common Navigation Section */}
        <div className="space-y-1.5">
          <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Workspace Modules
          </div>
          {renderNavList(commonNavItems)}
        </div>

        {/* Leader-Only Management Section */}
        {isLeader && (
          <div className="space-y-1.5 pt-3 border-t border-slate-100">
            <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-purple-600 flex items-center gap-1">
              <Crown className="w-3 h-3 text-purple-600" />
              <span>Leader Management</span>
            </div>
            {renderNavList(leaderNavItems)}
          </div>
        )}
      </div>

      {/* User Session Footer */}
      <div className="pt-4 mt-6 border-t border-slate-200 space-y-3">
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
      {/* Sliding Drawer Overlay for all screen sizes */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-72 sm:w-80 h-full bg-white shadow-2xl animate-in slide-in-from-left duration-200"
          >
            {content}
          </div>
        </div>
      )}
    </>
  );
}
