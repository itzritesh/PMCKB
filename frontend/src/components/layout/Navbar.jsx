import React, { useState, useEffect } from 'react';
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
  Briefcase,
  ChevronDown,
  Check,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTeam } from '../../context/TeamContext';

export default function Navbar({ onToggleSidebar }) {
  const { user, isAuthenticated, logout } = useAuth();
  const { teams, currentTeam, setCurrentTeam } = useTeam();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [teamDropdownOpen, setTeamDropdownOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setTeamDropdownOpen(false);
  }, [location.pathname, location.hash]);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  // Check if Home link is active
  const isHomeActive = location.pathname === '/' && (!location.hash || location.hash === '#');

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/90 bg-white/95 backdrop-blur-md shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 md:h-[72px]">
        {isAuthenticated ? (
          /* ================= Authenticated App Navigation ================= */
          <div className="flex items-center justify-between h-full w-full">
            {/* Left: Brand & Sidebar Drawer Toggle */}
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={onToggleSidebar}
                title="Toggle Navigation Menu"
                aria-label="Toggle navigation menu"
                className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
              >
                <Menu className="w-5 h-5" />
              </button>

              <Link to="/" className="flex items-center gap-3 group shrink-0">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-xs text-white group-hover:bg-indigo-700 transition-colors shrink-0">
                  <Layers className="w-5 h-5" />
                </div>
                <div className="flex flex-col justify-center min-w-0">
                  <div className="flex items-center gap-2 leading-none">
                    <span className="text-base font-bold tracking-tight text-slate-900">PMCKB</span>
                    <span className="hidden sm:inline-flex items-center px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 leading-none">
                      Workspace
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 hidden sm:block tracking-tight leading-tight mt-1">
                    Projects • Meetings • Calendar • Knowledge Base
                  </p>
                </div>
              </Link>

              {/* Workspace Selector */}
              {teams.length > 0 && currentTeam && (
                <div className="relative ml-1 sm:ml-2">
                  <button
                    onClick={() => setTeamDropdownOpen((prev) => !prev)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-700 transition-colors cursor-pointer"
                    title="Switch Workspace"
                  >
                    <Briefcase className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span className="max-w-[100px] sm:max-w-[140px] truncate font-semibold">
                      {currentTeam.name}
                    </span>
                    <span
                      className={`text-[9px] uppercase px-1.5 py-0.5 rounded-md font-bold border ${
                        currentTeam.user_role === 'leader'
                          ? 'bg-indigo-100 text-indigo-700 border-indigo-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      {currentTeam.user_role}
                    </span>
                    <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
                  </button>

                  {teamDropdownOpen && (
                    <div className="absolute left-0 mt-1.5 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                      <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Workspaces ({teams.length})
                      </div>
                      <div className="max-h-56 overflow-y-auto divide-y divide-slate-100">
                        {teams.map((t) => (
                          <button
                            key={t.id}
                            onClick={() => {
                              setCurrentTeam(t);
                              setTeamDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-indigo-50/50 transition-colors text-xs ${
                              t.id === currentTeam.id
                                ? 'bg-indigo-50/70 font-semibold text-indigo-900'
                                : 'text-slate-700'
                            }`}
                          >
                            <div className="truncate pr-2">
                              <div className="truncate font-medium">{t.name}</div>
                              <div className="text-[10px] text-slate-400 capitalize">
                                {t.user_role} • {t.member_count}{' '}
                                {t.member_count === 1 ? 'member' : 'members'}
                              </div>
                            </div>
                            {t.id === currentTeam.id && (
                              <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                            )}
                          </button>
                        ))}
                      </div>
                      <div className="border-t border-slate-100 mt-1 pt-1 px-2">
                        <Link
                          to="/teams"
                          onClick={() => setTeamDropdownOpen(false)}
                          className="flex items-center justify-center gap-1.5 w-full py-1.5 text-xs text-indigo-600 hover:text-indigo-700 font-semibold rounded-lg hover:bg-indigo-50 transition-colors"
                        >
                          Manage Teams
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right: Authenticated Modules & User Profile */}
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
                to="/teams"
                className={({ isActive }) =>
                  `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200 font-semibold'
                      : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200 hover:text-slate-900'
                  }`
                }
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Teams</span>
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
          </div>
        ) : (
          /* ================= Public Landing 3-Column Navigation ================= */
          <div className="grid grid-cols-2 lg:grid-cols-[1fr_auto_1fr] items-center h-full w-full">
            {/* 1. Left Brand Section */}
            <div className="flex items-center justify-start min-w-0">
              <Link to="/" className="flex items-center gap-3 group shrink-0">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-xs text-white group-hover:bg-indigo-700 transition-colors shrink-0">
                  <Layers className="w-5 h-5" />
                </div>
                <div className="flex flex-col justify-center min-w-0">
                  <div className="flex items-center gap-2 leading-none">
                    <span className="text-base font-bold tracking-tight text-slate-900">
                      PMCKB
                    </span>
                    <span className="hidden sm:inline-flex items-center px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 leading-none">
                      Workspace
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 hidden sm:block tracking-tight leading-tight mt-1">
                    Projects • Meetings • Calendar • Knowledge Base
                  </p>
                </div>
              </Link>
            </div>

            {/* 2. Center Navigation Links (Truly Centered relative to Navbar Container) */}
            <nav className="hidden lg:flex items-center justify-center gap-7 xl:gap-8 text-sm">
              <Link
                to="/"
                className={`transition-colors py-1 ${
                  isHomeActive
                    ? 'text-indigo-600 font-semibold'
                    : 'text-slate-600 hover:text-indigo-600 font-medium'
                }`}
              >
                Home
              </Link>
              <a
                href="/#features"
                className={`transition-colors py-1 ${
                  location.hash === '#features'
                    ? 'text-indigo-600 font-semibold'
                    : 'text-slate-600 hover:text-indigo-600 font-medium'
                }`}
              >
                Features
              </a>
              <a
                href="/#how-it-works"
                className={`transition-colors py-1 ${
                  location.hash === '#how-it-works'
                    ? 'text-indigo-600 font-semibold'
                    : 'text-slate-600 hover:text-indigo-600 font-medium'
                }`}
              >
                How It Works
              </a>
              <a
                href="/#benefits"
                className={`transition-colors py-1 ${
                  location.hash === '#benefits'
                    ? 'text-indigo-600 font-semibold'
                    : 'text-slate-600 hover:text-indigo-600 font-medium'
                }`}
              >
                Benefits
              </a>
            </nav>

            {/* 3. Right Action Section */}
            <div className="flex items-center justify-end gap-2.5 sm:gap-3">
              {/* Desktop / Tablet Buttons */}
              <div className="hidden sm:flex items-center gap-2.5">
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-sm font-semibold transition-all shadow-2xs hover:border-slate-400 cursor-pointer"
                >
                  <LogIn className="w-4 h-4 text-slate-500" />
                  <span>Sign In</span>
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-1.5 h-10 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-all shadow-xs cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Get Started</span>
                </Link>
              </div>

              {/* Small Mobile Phone Direct Sign In Link */}
              <Link
                to="/login"
                className="sm:hidden inline-flex items-center justify-center h-9 px-3 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold transition-colors"
              >
                Sign In
              </Link>

              {/* Mobile / Tablet Menu Trigger */}
              <button
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                aria-label="Toggle navigation menu"
                className="lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Menu Drawer for Unauthenticated Visitors */}
      {!isAuthenticated && mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 sm:px-6 pt-3 pb-6 space-y-4 shadow-xl animate-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col space-y-1">
            <Link
              to="/"
              onClick={closeMobileMenu}
              className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isHomeActive
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'text-slate-700 hover:bg-slate-50 hover:text-indigo-600'
              }`}
            >
              Home
            </Link>
            <a
              href="/#features"
              onClick={closeMobileMenu}
              className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                location.hash === '#features'
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'text-slate-700 hover:bg-slate-50 hover:text-indigo-600'
              }`}
            >
              Features
            </a>
            <a
              href="/#how-it-works"
              onClick={closeMobileMenu}
              className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                location.hash === '#how-it-works'
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'text-slate-700 hover:bg-slate-50 hover:text-indigo-600'
              }`}
            >
              How It Works
            </a>
            <a
              href="/#benefits"
              onClick={closeMobileMenu}
              className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                location.hash === '#benefits'
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'text-slate-700 hover:bg-slate-50 hover:text-indigo-600'
              }`}
            >
              Benefits
            </a>
          </div>

          <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row gap-2.5">
            <Link
              to="/register"
              onClick={closeMobileMenu}
              className="w-full inline-flex items-center justify-center gap-2 h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors shadow-xs cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Get Started</span>
            </Link>
            <Link
              to="/login"
              onClick={closeMobileMenu}
              className="w-full inline-flex items-center justify-center gap-2 h-11 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-sm font-semibold transition-colors shadow-2xs cursor-pointer"
            >
              <LogIn className="w-4 h-4 text-slate-500" />
              <span>Sign In</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
