import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTeam } from '../context/TeamContext';
import { teamService } from '../services/teamService';
import { projectService } from '../services/projectService';
import { taskService } from '../services/taskService';
import { userService } from '../services/userService';
import { calendarService } from '../services/calendarService';
import { meetingService } from '../services/meetingService';
import { knowledgeService } from '../services/knowledgeService';
import { announcementService } from '../services/announcementService';
import { authService } from '../services/authService';

import {
  FolderGit2,
  Calendar,
  Users,
  BookOpen,
  CheckCircle2,
  ArrowRight,
  FolderPlus,
  Clock,
  CheckSquare,
  AlertTriangle,
  Plus,
  Search,
  MessageSquare,
  Circle,
  Video,
  MapPin,
  CalendarDays,
  ExternalLink,
  Tag,
  Clock3,
  Bell,
  FileText,
  Megaphone,
  X,
  ChevronDown,
  UserPlus,
  Settings,
  Mail,
  Crown,
  UserCheck,
  Check,
  Sparkles,
  KeyRound,
  Shield,
  Layers,
} from 'lucide-react';

import StatusPill from '../components/projects/StatusPill';
import ProjectModal from '../components/projects/ProjectModal';
import TaskModal from '../components/tasks/TaskModal';
import TaskDetailsModal from '../components/tasks/TaskDetailsModal';
import PriorityBadge from '../components/tasks/PriorityBadge';
import TaskStatusPill from '../components/tasks/TaskStatusPill';
import MeetingModal from '../components/meetings/MeetingModal';
import InviteMemberModal from '../components/teams/InviteMemberModal';

export default function DashboardPage() {
  const { user } = useAuth();
  const { teams, currentTeam, setCurrentTeam, isLeader, refreshTeams } = useTeam();
  const navigate = useNavigate();

  // Data states
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [articles, setArticles] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [submittingProject, setSubmittingProject] = useState(false);

  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [submittingTask, setSubmittingTask] = useState(false);

  const [meetingModalOpen, setMeetingModalOpen] = useState(false);
  const [submittingMeeting, setSubmittingMeeting] = useState(false);

  const [inviteModalOpen, setInviteModalOpen] = useState(false);

  const [detailsTask, setDetailsTask] = useState(null);

  // Announcement modal state
  const [announcementModalOpen, setAnnouncementModalOpen] = useState(false);
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementMessage, setAnnouncementMessage] = useState('');
  const [submittingAnnouncement, setSubmittingAnnouncement] = useState(false);
  const [announcementError, setAnnouncementError] = useState('');

  // Team Selector dropdown state
  const [teamDropdownOpen, setTeamDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Task Filter state for leader overview
  const [taskSearch, setTaskSearch] = useState('');
  const [taskStatusFilter, setTaskStatusFilter] = useState('all');
  const [taskPriorityFilter, setTaskPriorityFilter] = useState('all');
  const [taskAssigneeFilter, setTaskAssigneeFilter] = useState('all');

  // Close team selector dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setTeamDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [projRes, tasksRes, eventsRes, meetingsRes, articlesRes, announcementsRes] = await Promise.all([
        projectService.getProjects(),
        taskService.getAllTasks(),
        calendarService.getEvents().catch(() => ({ data: { events: [] } })),
        meetingService.getMeetings().catch(() => ({ data: { meetings: [] } })),
        knowledgeService.getArticles({ status: 'published' }).catch(() => ({ data: { articles: [] } })),
        announcementService.getAnnouncements().catch(() => ({ data: { announcements: [] } })),
      ]);

      setProjects(projRes.data?.projects || []);
      setTasks(tasksRes.data?.tasks || []);
      setEvents(eventsRes.data?.events || []);
      setMeetings(meetingsRes.data?.meetings || []);
      setArticles(articlesRes.data?.articles || []);
      setAnnouncements(announcementsRes.data?.announcements || []);

      // Load team members
      if (currentTeam?.id) {
        try {
          const memRes = await teamService.getTeamMembers(currentTeam.id);
          const teamMembers = memRes.data?.members || [];
          setMembers(teamMembers);
          setUsers(
            teamMembers.map((m) => ({
              id: m.user_id,
              name: m.name,
              email: m.email,
              role: m.role,
            }))
          );
        } catch {
          const usersRes = await userService.getUsers().catch(() => ({ data: { users: [] } }));
          setUsers(usersRes.data?.users || []);
        }
      } else {
        const usersRes = await userService.getUsers().catch(() => ({ data: { users: [] } }));
        setUsers(usersRes.data?.users || []);
      }
    } catch (err) {
      console.warn('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentTeam?.id]);

  // Actions
  const handleCreateProject = async (formData) => {
    setSubmittingProject(true);
    try {
      const res = await projectService.createProject(formData);
      setProjects((prev) => [res.data.project, ...prev]);
      setProjectModalOpen(false);
    } catch (err) {
      throw err;
    } finally {
      setSubmittingProject(false);
    }
  };

  const handleCreateTask = async (formData) => {
    setSubmittingTask(true);
    try {
      const res = await taskService.createTask(formData);
      const proj = projects.find((p) => p.id === parseInt(formData.project_id, 10));
      const newTask = {
        ...res.data.task,
        project_name: proj?.name || '',
      };
      setTasks((prev) => [newTask, ...prev]);
      setTaskModalOpen(false);
    } catch (err) {
      throw err;
    } finally {
      setSubmittingTask(false);
    }
  };

  const handleCreateMeeting = async (formData) => {
    setSubmittingMeeting(true);
    try {
      const res = await meetingService.createMeeting(formData);
      const created = res.data?.meeting || res.meeting;
      if (created) {
        setMeetings((prev) => [created, ...prev]);
      }
      setMeetingModalOpen(false);
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to create meeting.');
    } finally {
      setSubmittingMeeting(false);
    }
  };

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    if (!announcementTitle.trim() || !announcementMessage.trim()) {
      setAnnouncementError('Title and message are required.');
      return;
    }
    setSubmittingAnnouncement(true);
    setAnnouncementError('');
    try {
      const res = await announcementService.createAnnouncement({
        title: announcementTitle.trim(),
        message: announcementMessage.trim(),
      });
      const created = res.data?.announcement;
      if (created) {
        setAnnouncements((prev) => [created, ...prev]);
      }
      setAnnouncementTitle('');
      setAnnouncementMessage('');
      setAnnouncementModalOpen(false);
    } catch (err) {
      setAnnouncementError(err.response?.data?.message || err.message || 'Failed to publish announcement.');
    } finally {
      setSubmittingAnnouncement(false);
    }
  };

  const handleQuickStatusChange = async (task, nextStatus) => {
    if (!isLeader && String(task.assigned_to) !== String(user?.id)) {
      alert('Access denied. Members can only update the status of tasks assigned to them.');
      return;
    }
    try {
      const res = await taskService.updateTask(task.id, {
        status: nextStatus,
      });
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...res.data.task, project_name: t.project_name } : t))
      );
    } catch (err) {
      alert(err.message || 'Failed to update task status.');
    }
  };

  // Metrics Calculations
  // Leader Metrics
  const totalProjects = projects.length;
  const totalTasks = tasks.length;
  const totalMembers = members.length;
  const assignedTeamTasks = tasks.filter((t) => t.assigned_to).length;
  const unassignedTeamTasks = totalTasks - assignedTeamTasks;
  const completedTasks = tasks.filter((t) => t.status === 'completed').length;
  const overdueTasksList = tasks.filter(
    (t) =>
      t.due_date &&
      new Date(t.due_date).getTime() < Date.now() &&
      t.status !== 'completed'
  );
  const overdueCount = overdueTasksList.length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Member Metrics
  const myTasks = tasks.filter((t) => String(t.assigned_to) === String(user?.id));
  const myPendingTasks = myTasks.filter((t) => t.status !== 'completed');
  const myCompletedTasks = myTasks.filter((t) => t.status === 'completed');
  const myDeadlinesList = myTasks
    .filter((t) => t.due_date && t.status !== 'completed')
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date));

  // Common Calendar / Meeting Metrics
  const upcomingMeetings = meetings.filter(
    (m) => new Date(m.start_datetime).getTime() >= Date.now() && m.status === 'scheduled'
  );
  const upcomingEvents = events.filter(
    (e) => new Date(e.start_datetime).getTime() >= Date.now()
  );
  const publishedArticlesCount = articles.length;

  // Filtered Tasks for Leader Overview
  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(taskSearch.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(taskSearch.toLowerCase()));

    const isOverdue =
      t.due_date &&
      new Date(t.due_date).getTime() < Date.now() &&
      t.status !== 'completed';

    const matchesStatus =
      taskStatusFilter === 'all'
        ? true
        : taskStatusFilter === 'overdue'
        ? isOverdue
        : t.status === taskStatusFilter;

    const matchesPriority =
      taskPriorityFilter === 'all' || t.priority === taskPriorityFilter;

    const matchesAssignee =
      taskAssigneeFilter === 'all'
        ? true
        : taskAssigneeFilter === 'mine'
        ? String(t.assigned_to) === String(user?.id)
        : taskAssigneeFilter === 'unassigned'
        ? !t.assigned_to
        : String(t.assigned_to) === String(taskAssigneeFilter);

    return matchesSearch && matchesStatus && matchesPriority && matchesAssignee;
  });

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] py-6 sm:py-8 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        {/* ========================================================================= */}
        {/* HEADER SECTION (Role-Specific with Team Selector)                        */}
        {/* ========================================================================= */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-3">
              {/* Team Name, Role Badge, and Multi-Team Selector */}
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="text-sm font-bold text-slate-900 tracking-tight">
                  {currentTeam?.name || 'Active Workspace'}
                </span>

                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                    isLeader
                      ? 'bg-purple-50 text-purple-700 border-purple-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}
                >
                  {isLeader ? (
                    <Crown className="w-3.5 h-3.5 text-purple-600" />
                  ) : (
                    <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                  )}
                  <span>Role: {isLeader ? 'Leader' : 'Member'}</span>
                </span>

                {/* Team Selector: If user belongs to multiple teams */}
                {teams && teams.length > 1 && (
                  <div className="relative" ref={dropdownRef}>
                    <button
                      type="button"
                      onClick={() => setTeamDropdownOpen((prev) => !prev)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
                      title="Switch active team"
                    >
                      <span>Current Team</span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-slate-500 transition-transform ${
                          teamDropdownOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {teamDropdownOpen && (
                      <div className="absolute left-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in duration-150">
                        <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Switch Team
                        </div>
                        <div className="space-y-1 mt-1 max-h-56 overflow-y-auto">
                          {teams.map((t) => (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => {
                                setCurrentTeam(t);
                                setTeamDropdownOpen(false);
                              }}
                              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-left transition-all cursor-pointer ${
                                t.id === currentTeam?.id
                                  ? 'bg-indigo-50 text-indigo-900 font-bold border border-indigo-200'
                                  : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                              }`}
                            >
                              <div className="truncate pr-2">
                                <span className="block truncate">{t.name}</span>
                                <span className="text-[10px] text-slate-400 font-normal capitalize">
                                  {t.user_role}
                                </span>
                              </div>
                              {t.id === currentTeam?.id && (
                                <Check className="w-4 h-4 text-indigo-600 shrink-0" />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Welcome [Name] */}
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
                Welcome, {user?.name || 'Workspace Member'}
              </h1>

              <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
                {isLeader ? (
                  <>
                    Full leadership view for <strong>{currentTeam?.name || 'your workspace'}</strong>. Manage team projects, tasks, meetings, member invitations, and broadcasts.
                  </>
                ) : (
                  <>
                    Personal workspace dashboard for <strong>{currentTeam?.name || 'your workspace'}</strong>. Track your assigned tasks, active deadlines, upcoming meetings, and announcements.
                  </>
                )}
              </p>
            </div>

            {/* Leader Actions: All 6 Buttons (ONLY shown to Leader) */}
            {isLeader && (
              <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0">
                {/* [Create Project] */}
                <button
                  onClick={() => setProjectModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs sm:text-sm font-semibold transition-all shadow-xs cursor-pointer"
                >
                  <FolderPlus className="w-4 h-4" />
                  <span>Create Project</span>
                </button>

                {/* [Create Task] */}
                <button
                  onClick={() => setTaskModalOpen(true)}
                  disabled={projects.length === 0}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs sm:text-sm font-semibold transition-all shadow-xs cursor-pointer disabled:opacity-50"
                  title={projects.length === 0 ? 'Create a project first' : 'Create Task'}
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Task</span>
                </button>

                {/* [Create Meeting] */}
                <button
                  onClick={() => setMeetingModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white text-xs sm:text-sm font-semibold transition-all shadow-xs cursor-pointer"
                >
                  <Video className="w-4 h-4" />
                  <span>Create Meeting</span>
                </button>

                {/* [Invite Member] */}
                <button
                  onClick={() => setInviteModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-semibold transition-all shadow-xs cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Invite Member</span>
                </button>

                {/* [Manage Team] */}
                <button
                  onClick={() => navigate(`/teams/${currentTeam?.id || ''}`)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs sm:text-sm font-semibold transition-all shadow-xs cursor-pointer"
                >
                  <Settings className="w-4 h-4 text-slate-500" />
                  <span>Manage Team</span>
                </button>

                {/* [Create Announcement] */}
                <button
                  onClick={() => setAnnouncementModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white text-xs sm:text-sm font-semibold transition-all shadow-xs cursor-pointer"
                >
                  <Megaphone className="w-4 h-4" />
                  <span>Create Announcement</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* ROLE-SPECIFIC STATISTICS                                                  */}
        {/* ========================================================================= */}
        {isLeader ? (
          /* LEADER STATISTICS: 6 Cards (Projects, Tasks, Team Members, Meetings, Calendar Events, KB Articles) */
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {/* Stat 1: Projects */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500">Projects</span>
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <FolderGit2 className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-extrabold text-slate-900">{totalProjects}</span>
                <span className="text-[11px] text-indigo-600 font-medium">Team</span>
              </div>
            </div>

            {/* Stat 2: Tasks */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500">Tasks</span>
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <CheckSquare className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-extrabold text-blue-600">{totalTasks}</span>
                <span className="text-[11px] text-slate-400 font-medium">Total</span>
              </div>
            </div>

            {/* Stat 3: Team Members */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-purple-700">Team Members</span>
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-extrabold text-purple-600">{totalMembers}</span>
                <span className="text-[11px] text-purple-600 font-medium">Active</span>
              </div>
            </div>

            {/* Stat 4: Meetings */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-amber-700">Meetings</span>
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Video className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-extrabold text-amber-600">{upcomingMeetings.length}</span>
                <span className="text-[11px] text-slate-400 font-medium">Scheduled</span>
              </div>
            </div>

            {/* Stat 5: Calendar Events */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-emerald-700">Calendar Events</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CalendarDays className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-extrabold text-emerald-600">{upcomingEvents.length}</span>
                <span className="text-[11px] text-emerald-600 font-medium">Upcoming</span>
              </div>
            </div>

            {/* Stat 6: KB Articles */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-pink-700">KB Articles</span>
                <div className="w-8 h-8 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center">
                  <BookOpen className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-extrabold text-pink-600">{publishedArticlesCount}</span>
                <span className="text-[11px] text-slate-400 font-medium">Published</span>
              </div>
            </div>
          </div>
        ) : (
          /* MEMBER STATISTICS: 4 Cards (My Tasks, Pending Tasks, Upcoming Meetings, Upcoming Events) */
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {/* Stat 1: My Tasks */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500">My Tasks</span>
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <CheckSquare className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl sm:text-3xl font-extrabold text-blue-600">{myTasks.length}</span>
                <span className="text-[11px] text-slate-400 font-medium">Assigned</span>
              </div>
            </div>

            {/* Stat 2: Pending Tasks */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-amber-700">Pending Tasks</span>
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl sm:text-3xl font-extrabold text-amber-600">{myPendingTasks.length}</span>
                <span className="text-[11px] text-amber-700 font-medium">Incomplete</span>
              </div>
            </div>

            {/* Stat 3: Upcoming Meetings */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-purple-700">Upcoming Meetings</span>
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Video className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl sm:text-3xl font-extrabold text-purple-600">{upcomingMeetings.length}</span>
                <span className="text-[11px] text-purple-600 font-medium">Scheduled</span>
              </div>
            </div>

            {/* Stat 4: Upcoming Events */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-emerald-700">Upcoming Events</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CalendarDays className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600">{upcomingEvents.length}</span>
                <span className="text-[11px] text-emerald-600 font-medium">Calendar</span>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* LEADER DASHBOARD SECTIONS (7 SECTIONS)                                    */}
        {/* ========================================================================= */}
        {isLeader ? (
          <div className="space-y-8">
            {/* Section 1: Recent Projects */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <FolderGit2 className="w-4 h-4" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">Recent Projects</h3>
                  <span className="text-xs font-semibold text-slate-400">({projects.length})</span>
                </div>
                <Link
                  to="/projects"
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition-colors"
                >
                  <span>View all projects</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {projects.length === 0 ? (
                <div className="bg-white rounded-3xl p-8 text-center border border-slate-200 space-y-2 shadow-xs">
                  <FolderGit2 className="w-8 h-8 text-slate-400 mx-auto" />
                  <h4 className="text-sm font-bold text-slate-900">No Projects Yet</h4>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    Create a project to start organizing team deliverables and tracking sprints.
                  </p>
                  <button
                    onClick={() => setProjectModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-medium cursor-pointer shadow-xs"
                  >
                    <FolderPlus className="w-4 h-4" />
                    <span>Create Project</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {projects.slice(0, 3).map((p) => {
                    const projectTasks = tasks.filter((t) => t.project_id === p.id);
                    const pDone = projectTasks.filter((t) => t.status === 'completed').length;
                    const pPercent = projectTasks.length > 0 ? Math.round((pDone / projectTasks.length) * 100) : 0;

                    return (
                      <Link
                        key={p.id}
                        to={`/projects/${p.id}`}
                        className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs hover:border-indigo-300 hover:shadow-md flex flex-col justify-between group transition-all"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <StatusPill status={p.status} />
                            <span className="text-[10px] text-slate-400 font-medium">
                              {projectTasks.length} {projectTasks.length === 1 ? 'task' : 'tasks'}
                            </span>
                          </div>

                          <h4 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1 mb-1">
                            {p.name}
                          </h4>

                          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4">
                            {p.description || 'No description provided.'}
                          </p>
                        </div>

                        <div className="space-y-2 pt-3 border-t border-slate-100">
                          <div className="flex items-center justify-between text-xs text-slate-500">
                            <span>Deliverables Progress</span>
                            <span className="font-semibold text-slate-700">{pPercent}% Done</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                              style={{ width: `${pPercent}%` }}
                            />
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Section 2: Task Overview */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <CheckSquare className="w-4 h-4" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">Task Overview</h3>
                  <span className="text-xs font-semibold text-slate-400">({tasks.length} total)</span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 font-medium">
                    Team Completion: <strong className="text-slate-800">{completionRate}%</strong>
                  </span>
                  <Link
                    to="/tasks"
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition-colors"
                  >
                    <span>View all tasks</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Overdue callout if any */}
              {overdueCount > 0 && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-between text-xs text-rose-700">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>
                      <strong>{overdueCount} {overdueCount === 1 ? 'task is' : 'tasks are'} overdue</strong> past target deadline.
                    </span>
                  </div>
                  <button
                    onClick={() => setTaskStatusFilter('overdue')}
                    className="px-2.5 py-1 rounded-lg bg-white text-rose-700 font-semibold border border-rose-200 hover:bg-rose-100 transition-colors cursor-pointer"
                  >
                    Filter Overdue
                  </button>
                </div>
              )}

              {/* Task Filter Toolbar */}
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 bg-white rounded-2xl border border-slate-200 shadow-xs">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                  <input
                    type="text"
                    value={taskSearch}
                    onChange={(e) => setTaskSearch(e.target.value)}
                    placeholder="Search recent tasks..."
                    className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={taskStatusFilter}
                    onChange={(e) => setTaskStatusFilter(e.target.value)}
                    className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="all">All Statuses</option>
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="overdue">Overdue Only</option>
                  </select>

                  <select
                    value={taskPriorityFilter}
                    onChange={(e) => setTaskPriorityFilter(e.target.value)}
                    className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="all">All Priorities</option>
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>

                  {users.length > 0 && (
                    <select
                      value={taskAssigneeFilter}
                      onChange={(e) => setTaskAssigneeFilter(e.target.value)}
                      className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="all">All Assignees</option>
                      <option value="unassigned">Unassigned</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          👤 {u.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Tasks List */}
              {filteredTasks.length === 0 ? (
                <div className="bg-white rounded-2xl p-6 text-center border border-slate-200 text-xs text-slate-500 shadow-xs">
                  No tasks found matching your filters.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {filteredTasks.slice(0, 5).map((task) => {
                    const isOverdue =
                      task.due_date &&
                      new Date(task.due_date).getTime() < Date.now() &&
                      task.status !== 'completed';

                    return (
                      <div
                        key={task.id}
                        className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 shadow-xs transition-all flex items-center justify-between gap-4 group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <button
                            onClick={() => {
                              const next =
                                task.status === 'todo'
                                  ? 'in_progress'
                                  : task.status === 'in_progress'
                                  ? 'completed'
                                  : 'todo';
                              handleQuickStatusChange(task, next);
                            }}
                            title="Advance status"
                            className="text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer shrink-0"
                          >
                            {task.status === 'completed' ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                            ) : (
                              <Circle className="w-5 h-5" />
                            )}
                          </button>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-0.5">
                              <span
                                onClick={() => setDetailsTask(task)}
                                className={`text-sm font-semibold hover:text-indigo-600 transition-colors cursor-pointer truncate ${
                                  task.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-900'
                                }`}
                              >
                                {task.title}
                              </span>
                              <TaskStatusPill status={task.status} />
                              <PriorityBadge priority={task.priority} />
                              {isOverdue && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                  Overdue
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 text-xs text-slate-400">
                              {task.project_name && <span>{task.project_name}</span>}
                              {task.assignee_name && (
                                <>
                                  <span>•</span>
                                  <span>👤 {task.assignee_name}</span>
                                </>
                              )}
                              {task.due_date && (
                                <>
                                  <span>•</span>
                                  <span className={isOverdue ? 'text-rose-600 font-medium' : ''}>
                                    Due {new Date(task.due_date).toLocaleDateString()}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => setDetailsTask(task)}
                            title="View Discussion & Details"
                            className="p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-slate-50 transition-colors cursor-pointer text-xs flex items-center gap-1 border border-slate-200"
                          >
                            <MessageSquare className="w-4 h-4" />
                            <span className="hidden sm:inline">Discussion</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Section 3 & 4: Upcoming Meetings & Upcoming Calendar Events (2-Column) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Section 3: Upcoming Meetings */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                        <Video className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">Upcoming Meetings</h3>
                        <p className="text-[11px] text-slate-500">Scheduled team discussions and standups</p>
                      </div>
                    </div>

                    <Link
                      to="/meetings"
                      className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
                    >
                      <span>Manage</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>

                  {upcomingMeetings.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400">
                      No upcoming meetings scheduled.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {upcomingMeetings.slice(0, 3).map((m) => (
                        <Link
                          key={m.id}
                          to={`/meetings/${m.id}`}
                          className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-purple-300 hover:bg-white transition-all flex items-center justify-between gap-3 group"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                                Meeting
                              </span>
                              <span className="text-xs font-semibold text-slate-900 group-hover:text-purple-600 transition-colors truncate">
                                {m.title}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500">
                              <Clock3 className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>
                                {new Date(m.start_datetime).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                })}{' '}
                                at{' '}
                                {new Date(m.start_datetime).toLocaleTimeString('en-US', {
                                  hour: 'numeric',
                                  minute: '2-digit',
                                })}
                              </span>
                              {m.location && (
                                <>
                                  <span>•</span>
                                  <span className="truncate">{m.location}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-600 transition-all shrink-0" />
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>{upcomingMeetings.length} upcoming meetings</span>
                  <button
                    onClick={() => setMeetingModalOpen(true)}
                    className="text-xs font-semibold text-purple-600 hover:text-purple-700 cursor-pointer"
                  >
                    + Schedule Meeting
                  </button>
                </div>
              </div>

              {/* Section 4: Upcoming Calendar Events */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                        <CalendarDays className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">Upcoming Calendar Events</h3>
                        <p className="text-[11px] text-slate-500">Milestones, deadlines, and team activities</p>
                      </div>
                    </div>

                    <Link
                      to="/calendar"
                      className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
                    >
                      <span>Calendar</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>

                  {upcomingEvents.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400">
                      No upcoming calendar events scheduled.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {upcomingEvents.slice(0, 3).map((e) => (
                        <Link
                          key={e.id}
                          to="/calendar"
                          className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-amber-300 hover:bg-white transition-all flex items-center justify-between gap-3 group"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                Event
                              </span>
                              <span className="text-xs font-semibold text-slate-900 group-hover:text-amber-600 transition-colors truncate">
                                {e.title}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500">
                              <Clock3 className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>
                                {new Date(e.start_datetime).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                })}{' '}
                                at{' '}
                                {new Date(e.start_datetime).toLocaleTimeString('en-US', {
                                  hour: 'numeric',
                                  minute: '2-digit',
                                })}
                              </span>
                              {e.location && (
                                <>
                                  <span>•</span>
                                  <span className="truncate">{e.location}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-600 transition-all shrink-0" />
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>{upcomingEvents.length} scheduled events</span>
                  <Link to="/calendar" className="text-xs font-semibold text-amber-600 hover:text-amber-700">
                    Open Calendar View
                  </Link>
                </div>
              </div>
            </div>

            {/* Section 5: Team Members */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Team Members</h3>
                    <p className="text-xs text-slate-500">Collaborators enrolled in {currentTeam?.name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setInviteModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Invite</span>
                  </button>
                  <button
                    onClick={() => navigate(`/teams/${currentTeam?.id || ''}`)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer"
                  >
                    <span>Manage</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {members.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  No members found in this team.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {members.map((m) => (
                    <div
                      key={m.user_id}
                      className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3 hover:bg-white hover:border-slate-300 transition-all"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shrink-0 shadow-2xs">
                          {getInitials(m.name)}
                        </div>
                        <div className="min-w-0 truncate">
                          <span className="block text-xs font-bold text-slate-900 truncate">
                            {m.name}
                          </span>
                          <span className="block text-[11px] text-slate-500 truncate">
                            {m.email}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`shrink-0 px-2 py-0.5 rounded-md text-[10px] font-bold border capitalize ${
                          m.role === 'leader'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        {m.role}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Section 6: Announcements */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Megaphone className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Announcements</h3>
                    <p className="text-xs text-slate-500">Official leadership broadcasts for {currentTeam?.name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setAnnouncementModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Post</span>
                  </button>
                  <Link
                    to="/announcements"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                  >
                    <span>View all</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {announcements.length === 0 ? (
                <div className="py-8 text-center bg-slate-50/60 rounded-2xl border border-dashed border-slate-200">
                  <Megaphone className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-medium text-slate-600">No announcements posted yet</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Share important updates, releases, or guidelines with your workspace.
                  </p>
                  <button
                    onClick={() => setAnnouncementModalOpen(true)}
                    className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Announcement</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {announcements.slice(0, 3).map((item) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-2xl bg-gradient-to-br from-amber-50/30 via-white to-slate-50 border border-amber-100 hover:border-amber-200 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm font-bold text-slate-900 line-clamp-1">
                            {item.title}
                          </h4>
                          <span className="shrink-0 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-100 text-amber-800">
                            Broadcast
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                          {item.message}
                        </p>
                      </div>
                      <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                        <span className="font-medium truncate max-w-[130px]">
                          👤 {item.created_by_name || 'Leader'}
                        </span>
                        <span>
                          {new Date(item.created_at).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Section 7: Knowledge Base */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Knowledge Base</h3>
                    <p className="text-xs text-slate-500">Centralized engineering documentation, architecture wikis, and SOPs</p>
                  </div>
                </div>

                <Link
                  to="/knowledge"
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition-colors"
                >
                  <span>Open KB</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {articles.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No published knowledge articles yet in this workspace.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {articles.slice(0, 3).map((art) => (
                    <Link
                      key={art.id}
                      to={`/knowledge/${art.id}`}
                      className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-pink-300 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between group"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-pink-50 text-pink-700 border border-pink-200">
                            {art.category_name || 'General'}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(art.updated_at || art.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 group-hover:text-pink-600 transition-colors line-clamp-1">
                          {art.title}
                        </h4>
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                          {art.content}
                        </p>
                      </div>
                      <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span className="truncate">👤 {art.author_name || 'Team Member'}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-pink-600 transition-all" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* MEMBER DASHBOARD SECTIONS (6 SECTIONS)                                    */
          /* ========================================================================= */
          <div className="space-y-8">
            {/* Section 1: My Tasks */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <CheckSquare className="w-4 h-4" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">My Tasks</h3>
                  <span className="text-xs font-semibold text-slate-400">({myTasks.length})</span>
                </div>
                <Link
                  to="/tasks"
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition-colors"
                >
                  <span>Open Tasks Board</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {myTasks.length === 0 ? (
                <div className="bg-white rounded-3xl p-8 text-center border border-slate-200 space-y-2 shadow-xs">
                  <CheckCircle2 className="w-8 h-8 text-slate-400 mx-auto" />
                  <h4 className="text-sm font-bold text-slate-900">All Caught Up!</h4>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    You currently have no tasks assigned to you in this team workspace.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {myTasks.slice(0, 5).map((task) => {
                    const isOverdue =
                      task.due_date &&
                      new Date(task.due_date).getTime() < Date.now() &&
                      task.status !== 'completed';

                    return (
                      <div
                        key={task.id}
                        className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 shadow-xs transition-all flex items-center justify-between gap-4 group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <button
                            onClick={() => {
                              const next =
                                task.status === 'todo'
                                  ? 'in_progress'
                                  : task.status === 'in_progress'
                                  ? 'completed'
                                  : 'todo';
                              handleQuickStatusChange(task, next);
                            }}
                            title="Advance my status"
                            className="text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer shrink-0"
                          >
                            {task.status === 'completed' ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                            ) : (
                              <Circle className="w-5 h-5" />
                            )}
                          </button>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-0.5">
                              <span
                                onClick={() => setDetailsTask(task)}
                                className={`text-sm font-semibold hover:text-indigo-600 transition-colors cursor-pointer truncate ${
                                  task.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-900'
                                }`}
                              >
                                {task.title}
                              </span>
                              <TaskStatusPill status={task.status} />
                              <PriorityBadge priority={task.priority} />
                              {isOverdue && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                  Overdue
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 text-xs text-slate-400">
                              {task.project_name && <span>{task.project_name}</span>}
                              {task.due_date && (
                                <>
                                  <span>•</span>
                                  <span className={isOverdue ? 'text-rose-600 font-medium' : ''}>
                                    Due {new Date(task.due_date).toLocaleDateString()}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => setDetailsTask(task)}
                          title="View Discussion"
                          className="p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-slate-50 transition-colors cursor-pointer text-xs flex items-center gap-1 border border-slate-200 shrink-0"
                        >
                          <MessageSquare className="w-4 h-4" />
                          <span className="hidden sm:inline">Discussion</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Section 2: My Deadlines */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Clock className="w-4 h-4" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">My Deadlines</h3>
                  <span className="text-xs font-semibold text-slate-400">({myDeadlinesList.length} pending)</span>
                </div>
              </div>

              {myDeadlinesList.length === 0 ? (
                <div className="bg-white rounded-2xl p-6 text-center border border-slate-200 text-xs text-slate-500 shadow-xs">
                  No upcoming deadlines on your assigned tasks.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {myDeadlinesList.slice(0, 3).map((task) => {
                    const isOverdue = new Date(task.due_date).getTime() < Date.now();

                    return (
                      <div
                        key={task.id}
                        className={`p-4 rounded-2xl bg-white border shadow-xs space-y-2.5 transition-colors ${
                          isOverdue ? 'border-rose-200 bg-rose-50/20' : 'border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs">
                          <PriorityBadge priority={task.priority} />
                          <span
                            className={`font-semibold text-xs ${
                              isOverdue ? 'text-rose-600 font-bold' : 'text-slate-600'
                            }`}
                          >
                            {isOverdue ? 'Overdue: ' : 'Due: '}
                            {new Date(task.due_date).toLocaleDateString()}
                          </span>
                        </div>

                        <h4
                          onClick={() => setDetailsTask(task)}
                          className="text-sm font-bold text-slate-900 hover:text-indigo-600 transition-colors cursor-pointer truncate"
                        >
                          {task.title}
                        </h4>

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                          <span className="truncate">{task.project_name || 'Workspace Task'}</span>
                          <button
                            onClick={() => handleQuickStatusChange(task, 'completed')}
                            className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[11px] font-semibold transition-colors cursor-pointer"
                          >
                            Mark Done
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Section 3 & 4: Upcoming Meetings & Calendar (2-Column) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Section 3: Upcoming Meetings */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                        <Video className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">Upcoming Meetings</h3>
                        <p className="text-[11px] text-slate-500">Scheduled team sessions you can join</p>
                      </div>
                    </div>

                    <Link
                      to="/meetings"
                      className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
                    >
                      <span>View all</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>

                  {upcomingMeetings.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400">
                      No upcoming meetings scheduled.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {upcomingMeetings.slice(0, 3).map((m) => (
                        <Link
                          key={m.id}
                          to={`/meetings/${m.id}`}
                          className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-purple-300 hover:bg-white transition-all flex items-center justify-between gap-3 group"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                                Meeting
                              </span>
                              <span className="text-xs font-semibold text-slate-900 group-hover:text-purple-600 transition-colors truncate">
                                {m.title}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500">
                              <Clock3 className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>
                                {new Date(m.start_datetime).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                })}{' '}
                                at{' '}
                                {new Date(m.start_datetime).toLocaleTimeString('en-US', {
                                  hour: 'numeric',
                                  minute: '2-digit',
                                })}
                              </span>
                              {m.location && (
                                <>
                                  <span>•</span>
                                  <span className="truncate">{m.location}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-600 transition-all shrink-0" />
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>{upcomingMeetings.length} meetings scheduled</span>
                  <Link to="/meetings" className="text-indigo-600 hover:text-indigo-700 font-medium">
                    Meeting Details
                  </Link>
                </div>
              </div>

              {/* Section 4: Calendar */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                        <CalendarDays className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">Calendar</h3>
                        <p className="text-[11px] text-slate-500">Team timeline and events</p>
                      </div>
                    </div>

                    <Link
                      to="/calendar"
                      className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
                    >
                      <span>Open Calendar</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>

                  {upcomingEvents.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400">
                      No events currently scheduled.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {upcomingEvents.slice(0, 3).map((e) => (
                        <Link
                          key={e.id}
                          to="/calendar"
                          className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-amber-300 hover:bg-white transition-all flex items-center justify-between gap-3 group"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                Event
                              </span>
                              <span className="text-xs font-semibold text-slate-900 group-hover:text-amber-600 transition-colors truncate">
                                {e.title}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500">
                              <Clock3 className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>
                                {new Date(e.start_datetime).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                })}{' '}
                                at{' '}
                                {new Date(e.start_datetime).toLocaleTimeString('en-US', {
                                  hour: 'numeric',
                                  minute: '2-digit',
                                })}
                              </span>
                              {e.location && (
                                <>
                                  <span>•</span>
                                  <span className="truncate">{e.location}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-600 transition-all shrink-0" />
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>{upcomingEvents.length} events scheduled</span>
                  <Link to="/calendar" className="text-xs font-semibold text-amber-600 hover:text-amber-700">
                    Full Calendar
                  </Link>
                </div>
              </div>
            </div>

            {/* Section 5: Team Announcements */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Megaphone className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Team Announcements</h3>
                    <p className="text-xs text-slate-500">Official updates from team leadership</p>
                  </div>
                </div>

                <Link
                  to="/announcements"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                >
                  <span>View all</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {announcements.length === 0 ? (
                <div className="py-8 text-center bg-slate-50/60 rounded-2xl border border-dashed border-slate-200">
                  <Megaphone className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-medium text-slate-600">No announcements posted yet</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Check back later for leadership updates and important notices.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {announcements.slice(0, 3).map((item) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-2xl bg-gradient-to-br from-amber-50/30 via-white to-slate-50 border border-amber-100 shadow-2xs flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm font-bold text-slate-900 line-clamp-1">
                            {item.title}
                          </h4>
                          <span className="shrink-0 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-100 text-amber-800">
                            Broadcast
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                          {item.message}
                        </p>
                      </div>
                      <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                        <span className="font-medium truncate max-w-[130px]">
                          👤 {item.created_by_name || 'Leader'}
                        </span>
                        <span>
                          {new Date(item.created_at).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Section 6: Knowledge Base */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Knowledge Base</h3>
                    <p className="text-xs text-slate-500">Published engineering articles and resources</p>
                  </div>
                </div>

                <Link
                  to="/knowledge"
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition-colors"
                >
                  <span>Browse articles</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {articles.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No published knowledge articles yet in this workspace.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {articles.slice(0, 3).map((art) => (
                    <Link
                      key={art.id}
                      to={`/knowledge/${art.id}`}
                      className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-pink-300 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between group"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-pink-50 text-pink-700 border border-pink-200">
                            {art.category_name || 'General'}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(art.updated_at || art.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 group-hover:text-pink-600 transition-colors line-clamp-1">
                          {art.title}
                        </h4>
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                          {art.content}
                        </p>
                      </div>
                      <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span className="truncate">👤 {art.author_name || 'Team Member'}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-pink-600 transition-all" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODALS & OVERLAYS                                                         */}
      {/* ========================================================================= */}
      {/* Create Project Modal (Leader) */}
      <ProjectModal
        isOpen={projectModalOpen}
        onClose={() => setProjectModalOpen(false)}
        onSubmit={handleCreateProject}
        loading={submittingProject}
      />

      {/* Create Task Modal (Leader) */}
      <TaskModal
        isOpen={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        onSubmit={handleCreateTask}
        projects={projects}
        users={users}
        loading={submittingTask}
      />

      {/* Create Meeting Modal (Leader) */}
      <MeetingModal
        isOpen={meetingModalOpen}
        onClose={() => setMeetingModalOpen(false)}
        onSubmit={handleCreateMeeting}
        loading={submittingMeeting}
      />

      {/* Invite Member Modal (Leader) */}
      <InviteMemberModal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        teamId={currentTeam?.id}
        teamName={currentTeam?.name}
        onSuccess={() => {
          fetchData();
        }}
      />

      {/* Task Details Modal (Both Leader & Member) */}
      <TaskDetailsModal
        isOpen={!!detailsTask}
        onClose={() => setDetailsTask(null)}
        task={detailsTask}
      />

      {/* Quick Create Announcement Modal (Leader) */}
      {announcementModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white max-w-lg w-full rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xl relative">
            <button
              onClick={() => {
                setAnnouncementModalOpen(false);
                setAnnouncementError('');
              }}
              className="absolute top-6 right-6 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                <Megaphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Post Team Announcement</h3>
                <p className="text-xs text-slate-500">
                  Broadcast a message to all members of {currentTeam?.name || 'this team'}
                </p>
              </div>
            </div>

            {announcementError && (
              <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-2.5 text-xs text-rose-700">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{announcementError}</span>
              </div>
            )}

            <form onSubmit={handleCreateAnnouncement} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Announcement Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={announcementTitle}
                  onChange={(e) => setAnnouncementTitle(e.target.value)}
                  placeholder="e.g., Sprint 4 Kickoff or Architecture Freeze"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none text-sm text-slate-900 transition-all placeholder:text-slate-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Message Content <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={announcementMessage}
                  onChange={(e) => setAnnouncementMessage(e.target.value)}
                  rows={4}
                  placeholder="Write the full announcement details, deadlines, links or instructions..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none text-sm text-slate-900 transition-all placeholder:text-slate-400 resize-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setAnnouncementModalOpen(false);
                    setAnnouncementError('');
                  }}
                  className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAnnouncement}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs sm:text-sm font-semibold transition-all shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <Megaphone className="w-4 h-4" />
                  <span>{submittingAnnouncement ? 'Publishing...' : 'Publish Announcement'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
