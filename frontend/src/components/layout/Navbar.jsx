import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import {
  Layers,
  User,
  LogOut,
  LayoutDashboard,
  LogIn,
  UserPlus,
  FolderGit2,
  CheckSquare,
  Users,
  Calendar as CalendarIcon,
  BookOpen,
  Menu,
} from 'lucide-react';
import StatusBadge from '../common/StatusBadge';
import { useAuth } from '../../context/AuthContext';

export default function Navbar({ backendStatus = 'checking', onToggleSidebar }) {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Hamburger & Brand */}
        <div className="flex items-center space-x-3">
          {isAuthenticated && (
            <button
              onClick={onToggleSidebar}
              title="Toggle Navigation Menu"
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-sm text-white group-hover:bg-indigo-700 transition-colors">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold tracking-tight text-slate-900">PMCKB</span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Workspace
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Projects • Meetings • Calendar • Knowledge Base
              </p>
            </div>
          </Link>
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="hidden lg:flex items-center gap-2 text-xs text-slate-500 mr-2">
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
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200 font-semibold'
                      : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200 hover:text-slate-900'
                  }`
                }
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Dashboard</span>
              </NavLink>

              <NavLink
                to="/projects"
                className={({ isActive }) =>
                  `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200 font-semibold'
                      : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200 hover:text-slate-900'
                  }`
                }
              >
                <FolderGit2 className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Projects</span>
              </NavLink>

              <NavLink
                to="/tasks"
                className={({ isActive }) =>
                  `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200 font-semibold'
                      : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200 hover:text-slate-900'
                  }`
                }
              >
                <CheckSquare className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Tasks</span>
              </NavLink>

              <NavLink
                to="/meetings"
                className={({ isActive }) =>
                  `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200 font-semibold'
                      : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200 hover:text-slate-900'
                  }`
                }
              >
                <Users className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">Meetings</span>
              </NavLink>

              <NavLink
                to="/calendar"
                className={({ isActive }) =>
                  `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200 font-semibold'
                      : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200 hover:text-slate-900'
                  }`
                }
              >
                <CalendarIcon className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">Calendar</span>
              </NavLink>

              <NavLink
                to="/knowledge"
                className={({ isActive }) =>
                  `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200 font-semibold'
                      : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200 hover:text-slate-900'
                  }`
                }
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">Knowledge</span>
              </NavLink>

              <div className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                <User className="w-3.5 h-3.5 text-indigo-600" />
                <span className="max-w-[110px] truncate font-medium">{user?.name}</span>
              </div>

              <button
                onClick={logout}
                title="Sign Out"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-slate-600 border border-slate-200 text-xs font-medium transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-medium transition-colors"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium transition-colors shadow-xs"
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
