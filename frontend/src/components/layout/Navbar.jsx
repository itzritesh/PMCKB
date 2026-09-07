import React, { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
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
  X,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Navbar({ onToggleSidebar }) {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Brand & Sidebar Toggle */}
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
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-xs text-white group-hover:bg-indigo-700 transition-colors">
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

        {/* Center / Navigation Links for Unauthenticated / Public Visitors */}
        {!isAuthenticated && (
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2 text-xs font-semibold text-slate-600">
            <Link
              to="/"
              className={`px-3 py-1.5 rounded-lg hover:text-indigo-600 hover:bg-slate-50 transition-colors ${
                location.pathname === '/' ? 'text-indigo-600 font-bold' : ''
              }`}
            >
              Home
            </Link>
            <a
              href="/#features"
              className="px-3 py-1.5 rounded-lg hover:text-indigo-600 hover:bg-slate-50 transition-colors"
            >
              Features
            </a>
            <a
              href="/#how-it-works"
              className="px-3 py-1.5 rounded-lg hover:text-indigo-600 hover:bg-slate-50 transition-colors"
            >
              How It Works
            </a>
            <a
              href="/#benefits"
              className="px-3 py-1.5 rounded-lg hover:text-indigo-600 hover:bg-slate-50 transition-colors"
            >
              Benefits
            </a>
          </nav>
        )}

        {/* Right Actions */}
        <div className="flex items-center space-x-2 sm:space-x-3">
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
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold transition-colors shadow-2xs hover:border-slate-400"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors shadow-xs"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Get Started</span>
              </Link>

              {/* Mobile Menu Toggle for Guests */}
              <button
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors"
                title="Toggle Menu"
              >
                {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu Drawer for Guests */}
      {!isAuthenticated && mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-3 shadow-lg">
          <div className="flex flex-col space-y-1 text-sm font-medium text-slate-700">
            <Link
              to="/"
              onClick={closeMobileMenu}
              className="px-3 py-2 rounded-lg hover:bg-slate-50 hover:text-indigo-600 transition-colors"
            >
              Home
            </Link>
            <a
              href="/#features"
              onClick={closeMobileMenu}
              className="px-3 py-2 rounded-lg hover:bg-slate-50 hover:text-indigo-600 transition-colors"
            >
              Features
            </a>
            <a
              href="/#how-it-works"
              onClick={closeMobileMenu}
              className="px-3 py-2 rounded-lg hover:bg-slate-50 hover:text-indigo-600 transition-colors"
            >
              How It Works
            </a>
            <a
              href="/#benefits"
              onClick={closeMobileMenu}
              className="px-3 py-2 rounded-lg hover:bg-slate-50 hover:text-indigo-600 transition-colors"
            >
              Benefits
            </a>
          </div>

          <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
            <Link
              to="/register"
              onClick={closeMobileMenu}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
            >
              <UserPlus className="w-4 h-4" />
              <span>Get Started / Register</span>
            </Link>
            <Link
              to="/login"
              onClick={closeMobileMenu}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
