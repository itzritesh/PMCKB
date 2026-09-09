import React, { useState, useEffect, useRef } from 'react';
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

// Primary 4 modules shown on medium screens (1024px - 1279px)
const primaryNavLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/teams', label: 'Teams', icon: Briefcase },
  { to: '/projects', label: 'Projects', icon: FolderGit2 },
  { to: '/tasks', label: 'Tasks', icon: CheckSquare },
];

// Secondary 3 modules grouped into "More" dropdown on 1024px-1279px, and fully visible on >= 1280px
const secondaryNavLinks = [
  { to: '/meetings', label: 'Meetings', icon: Users },
  { to: '/calendar', label: 'Calendar', icon: CalendarIcon },
  { to: '/knowledge', label: 'Knowledge', icon: BookOpen },
];

const allNavLinks = [...primaryNavLinks, ...secondaryNavLinks];

export default function Navbar({ onToggleSidebar }) {
  const { user, isAuthenticated, logout } = useAuth();
  const { teams, currentTeam, setCurrentTeam } = useTeam();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [teamDropdownOpen, setTeamDropdownOpen] = useState(false);
  const [moreDropdownOpen, setMoreDropdownOpen] = useState(false);

  const teamDropdownRef = useRef(null);
  const moreDropdownRef = useRef(null);

  // Close dropdowns on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setTeamDropdownOpen(false);
    setMoreDropdownOpen(false);
  }, [location.pathname, location.hash]);

  // Handle outside clicks and keyboard Escape key
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (teamDropdownRef.current && !teamDropdownRef.current.contains(e.target)) {
        setTeamDropdownOpen(false);
      }
      if (moreDropdownRef.current && !moreDropdownRef.current.contains(e.target)) {
        setMoreDropdownOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setTeamDropdownOpen(false);
        setMoreDropdownOpen(false);
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  // Check if active route is in secondary links
  const isSecondaryActive = secondaryNavLinks.some((link) =>
    location.pathname.startsWith(link.to)
  );

  // Check if Home link is active on landing page
  const isHomeActive = location.pathname === '/' && (!location.hash || location.hash === '#');

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/90 bg-white/95 backdrop-blur-md shadow-2xs">
      {/* Centered Navbar Container with consistent 1600px max-width */}
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-5 lg:px-6 xl:px-8 h-16 lg:h-[72px] flex items-center">
        {isAuthenticated ? (
          /* ================================================================= */
          /* THREE-SECTION AUTHENTICATED APPLICATION NAVBAR                    */
          /* Layout: grid-cols-[auto_1fr_auto] strictly balanced               */
          /* ================================================================= */
          <div className="grid grid-cols-[auto_1fr_auto] items-center h-full w-full gap-2 xl:gap-3">
            
            {/* ------------------------------------------------------------- */}
            {/* 1. LEFT: Brand & Sidebar Drawer Trigger                       */}
            {/* ------------------------------------------------------------- */}
            <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 pr-1 lg:pr-2">
              {/* Hamburger Button */}
              <button
                onClick={onToggleSidebar}
                title="Toggle Navigation Menu"
                aria-label="Toggle navigation menu"
                className="inline-flex items-center justify-center w-10 h-10 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer shrink-0"
              >
                <Menu className="w-5 h-5" />
              </button>

              {/* Brand Logo & Typography */}
              <Link to="/" className="flex items-center gap-2 sm:gap-2.5 group shrink-0">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs group-hover:bg-indigo-700 transition-colors shrink-0">
                  <Layers className="w-5 h-5" />
                </div>
                <div className="flex flex-col justify-center min-w-0">
                  <div className="flex items-center gap-1.5 sm:gap-2 leading-none">
                    <span className="text-lg font-bold tracking-tight text-slate-900 leading-none">
                      PMCKB
                    </span>
                    <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold tracking-wider uppercase rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 leading-none shrink-0">
                      Workspace
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 hidden 2xl:block tracking-tight leading-tight mt-1 whitespace-nowrap">
                    Projects • Meetings • Calendar • Knowledge Base
                  </p>
                </div>
              </Link>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* 2. CENTER: Workspace Selector + Navigation Links              */}
            {/* ------------------------------------------------------------- */}
            <div className="hidden md:flex items-center justify-center gap-1.5 xl:gap-2 min-w-0 flex-1">
              {/* Compact Workspace Selector */}
              {teams.length > 0 && currentTeam && (
                <div className="relative shrink-0" ref={teamDropdownRef}>
                  <button
                    onClick={() => setTeamDropdownOpen((prev) => !prev)}
                    className="flex items-center justify-between w-[150px] lg:w-[160px] xl:w-[175px] 2xl:w-[210px] h-10 px-2 sm:px-2.5 xl:px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-xs text-slate-700 transition-all cursor-pointer shadow-2xs group shrink-0"
                    title={`Current Workspace: ${currentTeam.name}`}
                    aria-expanded={teamDropdownOpen}
                    aria-haspopup="true"
                  >
                    <div className="flex items-center gap-1.5 min-w-0 flex-1 mr-1">
                      <Briefcase className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span className="font-semibold text-slate-900 truncate text-left text-xs">
                        {currentTeam.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <span
                        className={`text-[9px] uppercase px-1.5 py-0.5 rounded-md font-bold tracking-wider border leading-none shrink-0 ${
                          currentTeam.user_role === 'leader'
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        {currentTeam.user_role}
                      </span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-transform duration-150 shrink-0 ${
                          teamDropdownOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </div>
                  </button>

                  {/* Workspace Dropdown Menu */}
                  {teamDropdownOpen && (
                    <div className="absolute left-0 top-full mt-1.5 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                      <div className="px-3.5 py-1.5 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        <span>Workspaces ({teams.length})</span>
                        <span className="text-[10px] lowercase font-normal text-slate-400">switch</span>
                      </div>
                      <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 py-1">
                        {teams.map((t) => (
                          <button
                            key={t.id}
                            onClick={() => {
                              setCurrentTeam(t);
                              setTeamDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3.5 py-2.5 flex items-center justify-between hover:bg-indigo-50/50 transition-colors text-xs cursor-pointer ${
                              t.id === currentTeam.id
                                ? 'bg-indigo-50/70 font-semibold text-indigo-900'
                                : 'text-slate-700'
                            }`}
                          >
                            <div className="truncate pr-2 min-w-0">
                              <div className="truncate font-semibold text-slate-800">{t.name}</div>
                              <div className="text-[10px] text-slate-400 capitalize mt-0.5">
                                {t.user_role} • {t.member_count}{' '}
                                {t.member_count === 1 ? 'member' : 'members'}
                              </div>
                            </div>
                            {t.id === currentTeam.id && (
                              <Check className="w-4 h-4 text-indigo-600 shrink-0 ml-2" />
                            )}
                          </button>
                        ))}
                      </div>
                      <div className="border-t border-slate-100 mt-1 pt-1.5 px-2">
                        <Link
                          to="/teams"
                          onClick={() => setTeamDropdownOpen(false)}
                          className="flex items-center justify-center gap-1.5 w-full py-2 text-xs text-indigo-600 hover:text-indigo-700 font-semibold rounded-xl hover:bg-indigo-50 transition-colors"
                        >
                          <Briefcase className="w-3.5 h-3.5" />
                          <span>Manage All Workspaces</span>
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Desktop Navigation Links Container (Visible on lg+) */}
              <nav className="hidden lg:flex items-center gap-1 xl:gap-1">
                {/* Primary Links: Dashboard, Teams, Projects, Tasks */}
                {primaryNavLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <NavLink
                      key={link.to}
                      to={link.to}
                      className={({ isActive }) =>
                        `inline-flex items-center justify-center gap-1.5 h-10 px-1.5 sm:px-2 2xl:px-2.5 rounded-xl border text-xs font-medium transition-colors whitespace-nowrap cursor-pointer shrink-0 ${
                          isActive
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200 font-semibold shadow-2xs'
                            : 'bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border-slate-200/80 hover:border-slate-300'
                        }`
                      }
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span>{link.label}</span>
                    </NavLink>
                  );
                })}

                {/* Secondary Links: Meetings, Calendar, Knowledge */}
                {/* On xl+ screens (>= 1280px), render them directly in the navbar */}
                {secondaryNavLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <NavLink
                      key={link.to}
                      to={link.to}
                      className={({ isActive }) =>
                        `hidden xl:inline-flex items-center justify-center gap-1.5 h-10 px-1.5 sm:px-2 2xl:px-2.5 rounded-xl border text-xs font-medium transition-colors whitespace-nowrap cursor-pointer shrink-0 ${
                          isActive
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200 font-semibold shadow-2xs'
                            : 'bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border-slate-200/80 hover:border-slate-300'
                        }`
                      }
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span>{link.label}</span>
                    </NavLink>
                  );
                })}

                {/* On 1024px-1279px screens (lg only), group Meetings, Calendar, Knowledge into "More" dropdown */}
                <div className="relative xl:hidden shrink-0" ref={moreDropdownRef}>
                  <button
                    onClick={() => setMoreDropdownOpen((prev) => !prev)}
                    className={`inline-flex items-center justify-center gap-1 h-10 px-2 rounded-xl border text-xs font-medium transition-colors whitespace-nowrap cursor-pointer shrink-0 ${
                      isSecondaryActive
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-200 font-semibold shadow-2xs'
                        : 'bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border-slate-200/80 hover:border-slate-300'
                    }`}
                    aria-expanded={moreDropdownOpen}
                    aria-haspopup="true"
                    title="More navigation modules"
                  >
                    <span>More</span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform duration-150 ${
                        moreDropdownOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {moreDropdownOpen && (
                    <div className="absolute left-0 top-full mt-1.5 w-44 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                      {secondaryNavLinks.map((link) => {
                        const Icon = link.icon;
                        return (
                          <NavLink
                            key={link.to}
                            to={link.to}
                            onClick={() => setMoreDropdownOpen(false)}
                            className={({ isActive }) =>
                              `flex items-center gap-2.5 px-3 py-2 text-xs font-medium transition-colors ${
                                isActive
                                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                                  : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                              }`
                            }
                          >
                            <Icon className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                            <span>{link.label}</span>
                          </NavLink>
                        );
                      })}
                    </div>
                  )}
                </div>
              </nav>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* 3. RIGHT: User Profile Button, Logout & Mobile Trigger        */}
            {/* ------------------------------------------------------------- */}
            <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 justify-end pl-1 lg:pl-2">
              {/* Compact User Profile Button */}
              <div
                className="inline-flex items-center gap-1.5 sm:gap-2 h-10 px-2 sm:px-2.5 xl:px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 shrink-0"
                title={user?.email ? `${user.name} (${user.email})` : user?.name}
              >
                <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 font-bold text-[10px]">
                  {user?.name ? user.name[0].toUpperCase() : <User className="w-3 h-3 text-indigo-600" />}
                </div>
                <span className="max-w-[65px] sm:max-w-[80px] xl:max-w-[100px] truncate font-semibold text-slate-800">
                  {user?.name || 'User'}
                </span>
              </div>

              {/* Logout Button */}
              <button
                onClick={logout}
                title="Sign Out"
                aria-label="Logout"
                className="inline-flex items-center justify-center gap-1.5 h-10 px-2.5 sm:px-3 rounded-xl bg-white hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-slate-600 border border-slate-200 text-xs font-semibold transition-colors cursor-pointer shrink-0 shadow-2xs"
              >
                <LogOut className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">Logout</span>
              </button>

              {/* Mobile Menu Button (< lg screens) */}
              <button
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                aria-label="Toggle navigation menu"
                aria-expanded={mobileMenuOpen}
                className="lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer shrink-0"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        ) : (
          /* ================================================================= */
          /* PUBLIC LANDING THREE-COLUMN NAVBAR                                */
          /* ================================================================= */
          <div className="grid grid-cols-2 lg:grid-cols-[auto_1fr_auto] items-center h-full w-full gap-4">
            {/* 1. Left Brand Section */}
            <div className="flex items-center justify-start min-w-0">
              <Link to="/" className="flex items-center gap-3 group shrink-0">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-xs text-white group-hover:bg-indigo-700 transition-colors shrink-0">
                  <Layers className="w-5 h-5" />
                </div>
                <div className="flex flex-col justify-center min-w-0">
                  <div className="flex items-center gap-2 leading-none">
                    <span className="text-lg font-bold tracking-tight text-slate-900 leading-none">
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

            {/* 2. Center Navigation Links (Centered) */}
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
                aria-expanded={mobileMenuOpen}
                className="lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* =================================================================== */}
      {/* MOBILE SLIDE-DOWN DRAWER (AUTHENTICATED USERS)                      */}
      {/* =================================================================== */}
      {isAuthenticated && mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white/98 backdrop-blur-md px-4 sm:px-6 py-4 space-y-4 shadow-xl animate-in slide-in-from-top-2 duration-200">
          {/* Workspace Switcher in Mobile Drawer */}
          {teams.length > 0 && currentTeam && (
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Active Workspace
                </span>
                <span
                  className={`text-[9px] uppercase px-1.5 py-0.5 rounded-md font-bold tracking-wider border leading-none ${
                    currentTeam.user_role === 'leader'
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}
                >
                  {currentTeam.user_role}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-indigo-600 shrink-0" />
                <span className="text-sm font-semibold text-slate-900 truncate">
                  {currentTeam.name}
                </span>
              </div>
              {teams.length > 1 && (
                <div className="pt-2 border-t border-slate-200/80 flex flex-wrap gap-1.5">
                  {teams.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setCurrentTeam(t);
                        closeMobileMenu();
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                        t.id === currentTeam.id
                          ? 'bg-indigo-600 text-white font-semibold'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Full Navigation List: Dashboard, Teams, Projects, Tasks, Meetings, Calendar, Knowledge */}
          <div className="flex flex-col space-y-1">
            <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Workspace Navigation
            </div>
            {allNavLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.to;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={closeMobileMenu}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200/80'
                      : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0 text-indigo-600" />
                  <span>{link.label}</span>
                </NavLink>
              );
            })}
          </div>

          {/* User Session & Logout in Mobile Drawer */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5 truncate">
              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs shrink-0">
                {user?.name ? user.name[0].toUpperCase() : 'U'}
              </div>
              <div className="truncate">
                <span className="block text-xs font-semibold text-slate-900 truncate">
                  {user?.name || 'User'}
                </span>
                <span className="block text-[10px] text-slate-500 truncate">
                  {user?.email || ''}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                closeMobileMenu();
                logout();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 text-xs font-semibold transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MOBILE SLIDE-DOWN DRAWER (UNAUTHENTICATED VISITORS)                 */}
      {/* =================================================================== */}
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
