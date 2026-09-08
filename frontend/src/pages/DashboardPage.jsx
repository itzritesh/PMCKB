import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTeam } from '../context/TeamContext';
import { teamService } from '../services/teamService';
import {
  ShieldCheck,
  KeyRound,
  FolderGit2,
  Calendar,
  Users,
  BookOpen,
  CheckCircle2,
  ArrowRight,
  Sparkles,
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
} from 'lucide-react';
import { authService } from '../services/authService';
import { projectService } from '../services/projectService';
import { taskService } from '../services/taskService';
import { userService } from '../services/userService';
import { calendarService } from '../services/calendarService';
import { meetingService } from '../services/meetingService';
import { knowledgeService } from '../services/knowledgeService';
import StatusPill from '../components/projects/StatusPill';
import ProjectModal from '../components/projects/ProjectModal';
import TaskModal from '../components/tasks/TaskModal';
import TaskDetailsModal from '../components/tasks/TaskDetailsModal';
import PriorityBadge from '../components/tasks/PriorityBadge';
import TaskStatusPill from '../components/tasks/TaskStatusPill';

export default function DashboardPage() {
  const { user } = useAuth();
  const { currentTeam, isLeader } = useTeam();
  const navigate = useNavigate();

  // Data states
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Protected test state
  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting] = useState(false);
  const [testError, setTestError] = useState(null);

  // Modals state
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [submittingProject, setSubmittingProject] = useState(false);

  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [submittingTask, setSubmittingTask] = useState(false);

  const [detailsTask, setDetailsTask] = useState(null);

  // Task Filter state for dashboard
  const [taskSearch, setTaskSearch] = useState('');
  const [taskStatusFilter, setTaskStatusFilter] = useState('all');
  const [taskPriorityFilter, setTaskPriorityFilter] = useState('all');
  const [taskAssigneeFilter, setTaskAssigneeFilter] = useState('all');

  const fetchData = async () => {
    try {
      const [projRes, tasksRes, eventsRes, meetingsRes, articlesRes] = await Promise.all([
        projectService.getProjects(),
        taskService.getAllTasks(),
        calendarService.getEvents().catch(() => ({ data: { events: [] } })),
        meetingService.getMeetings().catch(() => ({ data: { meetings: [] } })),
        knowledgeService.getArticles({ status: 'published' }).catch(() => ({ data: { articles: [] } })),
      ]);
      setProjects(projRes.data?.projects || []);
      setTasks(tasksRes.data?.tasks || []);
      setEvents(eventsRes.data?.events || []);
      setMeetings(meetingsRes.data?.meetings || []);
      setArticles(articlesRes.data?.articles || []);

      // Load team members if team is selected
      if (currentTeam?.id) {
        try {
          const memRes = await teamService.getTeamMembers(currentTeam.id);
          const members = memRes.data?.members || [];
          setUsers(
            members.map((m) => ({
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

  const handleTestProtectedApi = async () => {
    setTesting(true);
    setTestError(null);
    try {
      const res = await authService.testProtected();
      setTestResult(res);
    } catch (err) {
      setTestError(err.message || 'Failed to call protected endpoint');
      setTestResult(null);
    } finally {
      setTesting(false);
    }
  };

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

  // Leader Metrics
  const totalProjects = projects.length;
  const totalTasks = tasks.length;
  const assignedTeamTasks = tasks.filter((t) => t.assigned_to).length;
  const unassignedTeamTasks = totalTasks - assignedTeamTasks;
  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress').length;
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
  const myTasksCount = myTasks.length;
  const myCompletedCount = myTasks.filter((t) => t.status === 'completed').length;
  const myInProgressCount = myTasks.filter((t) => t.status === 'in_progress').length;
  const myDeadlines = myTasks.filter((t) => t.due_date && t.status !== 'completed');
  const myDeadlinesCount = myDeadlines.length;
  const myOverdueCount = myTasks.filter(
    (t) =>
      t.due_date &&
      new Date(t.due_date).getTime() < Date.now() &&
      t.status !== 'completed'
  ).length;
  const myCompletionRate = myTasksCount > 0 ? Math.round((myCompletedCount / myTasksCount) * 100) : 0;

  // New Feature Metrics
  const upcomingMeetings = meetings.filter(
    (m) => new Date(m.start_datetime).getTime() >= Date.now() && m.status === 'scheduled'
  );
  const upcomingEvents = events.filter(
    (e) => new Date(e.start_datetime).getTime() >= Date.now()
  );
  const pendingInvitationsCount = meetings.filter(
    (m) => m.my_response_status === 'pending'
  ).length;
  const publishedArticlesCount = articles.length;

  // Combined upcoming schedule items (sorted chronologically)
  const combinedSchedule = [
    ...upcomingMeetings.map((m) => ({
      id: `meeting-${m.id}`,
      originalId: m.id,
      title: m.title,
      type: 'meeting',
      start: new Date(m.start_datetime),
      end: new Date(m.end_datetime),
      location: m.location,
      badge: 'Meeting',
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
      link: `/meetings/${m.id}`,
      meta: m.organizer_name ? `Hosted by ${m.organizer_name}` : null,
    })),
    ...upcomingEvents.map((e) => ({
      id: `event-${e.id}`,
      originalId: e.id,
      title: e.title,
      type: 'event',
      start: new Date(e.start_datetime),
      end: new Date(e.end_datetime),
      location: e.location,
      badge: 'Event',
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
      link: '/calendar',
      meta: e.location || 'Calendar Event',
    })),
  ].sort((a, b) => a.start - b.start);

  // Filtered Tasks
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

  const modules = [
    {
      title: 'Projects Management',
      icon: FolderGit2,
      color: 'bg-blue-50 text-blue-600',
      description: 'Owner-scoped workspaces, deliverable tracking, and status boards.',
      badge: 'Active Module',
      link: '/projects',
    },
    {
      title: 'Tasks & Deliverables',
      icon: CheckSquare,
      color: 'bg-emerald-50 text-emerald-600',
      description: 'Priorities, deadlines, overdue alerts, and assignee dispatch.',
      badge: 'Active Module',
      link: '/tasks',
    },
    {
      title: 'Meetings & Standups',
      icon: Users,
      color: 'bg-purple-50 text-purple-600',
      description: 'Collaborative meeting agendas, minutes, and task action items.',
      badge: 'Active Module',
      link: '/meetings',
    },
    {
      title: 'Calendar & Deadlines',
      icon: Calendar,
      color: 'bg-amber-50 text-amber-600',
      description: 'Unified calendar synchronizing deliverables and team schedules.',
      badge: 'Active Module',
      link: '/calendar',
    },
    {
      title: 'Knowledge Base',
      icon: BookOpen,
      color: 'bg-pink-50 text-pink-600',
      description: 'Centralized engineering documentation, architecture wikis, and SOPs.',
      badge: 'Active Module',
      link: '/knowledge',
    },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] py-8 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Welcome Header */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                <span>
                  {isLeader ? 'Leader View' : 'Member View'} • {currentTeam?.name || 'Active Workspace'}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
                Welcome back, {user?.name || 'Workspace Member'}!
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
                {isLeader ? (
                  <>
                    Team overview for <strong>{currentTeam?.name || 'your workspace'}</strong>: You have{' '}
                    <strong>{totalProjects} team projects</strong>, <strong>{totalTasks} total tasks</strong>,{' '}
                    <strong>{assignedTeamTasks} assigned deliverables</strong>, and overall team progress is at{' '}
                    <strong>{completionRate}%</strong>.
                  </>
                ) : (
                  <>
                    Personal workspace summary for <strong>{currentTeam?.name || 'your workspace'}</strong>: You have{' '}
                    <strong>{myTasksCount} deliverables assigned to you</strong>,{' '}
                    <strong>{myDeadlinesCount} active deadlines</strong>, and access to{' '}
                    <strong>{totalProjects} relevant projects</strong>.
                  </>
                )}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {isLeader ? (
                <>
                  <button
                    onClick={() => setProjectModalOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs sm:text-sm font-medium transition-all shadow-xs cursor-pointer"
                  >
                    <FolderPlus className="w-4 h-4" />
                    <span>New Project</span>
                  </button>

                  <button
                    onClick={() => setTaskModalOpen(true)}
                    disabled={projects.length === 0}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs sm:text-sm font-medium transition-all shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />
                    <span>New Task</span>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/projects"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs sm:text-sm font-medium transition-all shadow-xs"
                  >
                    <FolderGit2 className="w-4 h-4 text-indigo-600" />
                    <span>Relevant Projects</span>
                  </Link>

                  <Link
                    to="/tasks"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-medium transition-all shadow-xs"
                  >
                    <CheckSquare className="w-4 h-4" />
                    <span>My Tasks ({myTasksCount})</span>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 5 Core Delivery Metric Cards (Dynamic Leader vs Member) */}
        {isLeader ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {/* Card 1: Team Projects */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500">Team Projects</span>
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <FolderGit2 className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{totalProjects}</span>
                <span className="text-[11px] text-indigo-600 font-medium">Workspace</span>
              </div>
            </div>

            {/* Card 2: Team Tasks */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500">Team Tasks</span>
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <CheckSquare className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl sm:text-3xl font-extrabold text-blue-600">{totalTasks}</span>
                <span className="text-[11px] text-slate-400 font-medium">Deliverables</span>
              </div>
            </div>

            {/* Card 3: Assigned Tasks */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-purple-700">Assigned Tasks</span>
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl sm:text-3xl font-extrabold text-purple-600">{assignedTeamTasks}</span>
                <span className="text-[11px] text-slate-400 font-medium">{unassignedTeamTasks} Unassigned</span>
              </div>
            </div>

            {/* Card 4: Team Progress */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-emerald-700">Team Progress</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600">{completionRate}%</span>
                <span className="text-[11px] text-emerald-700 font-medium">{completedTasks}/{totalTasks} Done</span>
              </div>
            </div>

            {/* Card 5: Overdue Alerts */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs col-span-2 sm:col-span-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-rose-700">Overdue Tasks</span>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${overdueCount > 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-400'}`}>
                  <AlertTriangle className={`w-4 h-4 ${overdueCount > 0 ? 'animate-bounce' : ''}`} />
                </div>
              </div>
              <div className="flex items-baseline justify-between">
                <span className={`text-2xl sm:text-3xl font-extrabold ${overdueCount > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                  {overdueCount}
                </span>
                <span className={`text-[11px] font-semibold ${overdueCount > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                  {overdueCount > 0 ? 'Attention Needed' : 'On Track'}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {/* Card 1: Relevant Projects */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500">Relevant Projects</span>
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <FolderGit2 className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{totalProjects}</span>
                <span className="text-[11px] text-indigo-600 font-medium">Accessible</span>
              </div>
            </div>

            {/* Card 2: My Tasks */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500">My Tasks</span>
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <CheckSquare className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl sm:text-3xl font-extrabold text-blue-600">{myTasksCount}</span>
                <span className="text-[11px] text-slate-400 font-medium">{myInProgressCount} Active</span>
              </div>
            </div>

            {/* Card 3: My Deadlines */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-amber-700">My Deadlines</span>
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl sm:text-3xl font-extrabold text-amber-600">{myDeadlinesCount}</span>
                <span className="text-[11px] text-amber-700 font-medium">Pending Due</span>
              </div>
            </div>

            {/* Card 4: My Progress */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-emerald-700">My Completed</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600">{myCompletedCount}</span>
                <span className="text-[11px] text-emerald-700 font-medium">{myCompletionRate}% Done</span>
              </div>
            </div>

            {/* Card 5: My Overdue Alert */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs col-span-2 sm:col-span-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-rose-700">My Overdue</span>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${myOverdueCount > 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-400'}`}>
                  <AlertTriangle className={`w-4 h-4 ${myOverdueCount > 0 ? 'animate-bounce' : ''}`} />
                </div>
              </div>
              <div className="flex items-baseline justify-between">
                <span className={`text-2xl sm:text-3xl font-extrabold ${myOverdueCount > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                  {myOverdueCount}
                </span>
                <span className={`text-[11px] font-semibold ${myOverdueCount > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                  {myOverdueCount > 0 ? 'Action Needed' : 'On Track'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 4 Collaborative KPI Cards: Meetings, Events, KB, Invitations */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-slate-500 font-semibold block">Upcoming Meetings</span>
              <span className="text-xl font-bold text-slate-900">{upcomingMeetings.length}</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-slate-500 font-semibold block">Scheduled Events</span>
              <span className="text-xl font-bold text-slate-900">{upcomingEvents.length}</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-slate-500 font-semibold block">Published Articles</span>
              <span className="text-xl font-bold text-slate-900">{publishedArticlesCount}</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              pendingInvitationsCount > 0 ? 'bg-indigo-50 text-indigo-600 animate-pulse' : 'bg-slate-100 text-slate-400'
            }`}>
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-slate-500 font-semibold block">Pending Invitations</span>
              <span className={`text-xl font-bold ${pendingInvitationsCount > 0 ? 'text-indigo-600' : 'text-slate-900'}`}>
                {pendingInvitationsCount}
              </span>
            </div>
          </div>
        </div>

        {/* Dedicated Overdue Tasks Section */}
        {overdueCount > 0 && (
          <div className="bg-rose-50/40 rounded-3xl p-6 border border-rose-200 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <span>Overdue Deliverables Requiring Attention</span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700 border border-rose-200">
                      {overdueCount}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-600">
                    These tasks have passed their target deadline. Resolve or update their progress.
                  </p>
                </div>
              </div>

              <Link
                to="/tasks"
                className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-rose-700 hover:text-rose-800"
              >
                <span>View all tasks</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
              {overdueTasksList.slice(0, 3).map((t) => (
                <div
                  key={t.id}
                  className="p-4 rounded-2xl bg-white border border-rose-200 space-y-2 hover:border-rose-300 shadow-xs transition-colors"
                >
                  <div className="flex items-center justify-between text-xs">
                    <PriorityBadge priority={t.priority} />
                    <span className="font-semibold text-rose-600 text-[11px]">
                      Due {new Date(t.due_date).toLocaleDateString()}
                    </span>
                  </div>

                  <h4
                    onClick={() => setDetailsTask(t)}
                    className="text-sm font-bold text-slate-900 hover:text-indigo-600 transition-colors cursor-pointer truncate"
                  >
                    {t.title}
                  </h4>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span className="truncate max-w-[120px]">
                      {t.assignee_name ? `👤 ${t.assignee_name}` : '⚪ Unassigned'}
                    </span>
                    <button
                      onClick={() => handleQuickStatusChange(t, 'completed')}
                      className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[11px] font-medium transition-colors cursor-pointer"
                    >
                      Mark Done
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2-Column Section: Upcoming Schedule (Meetings & Events) & Recent Knowledge Base */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Schedule Widget */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Upcoming Schedule</h3>
                    <p className="text-[11px] text-slate-500">Scheduled meetings and calendar events</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    to="/calendar"
                    className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
                  >
                    <span>Calendar</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>

              {combinedSchedule.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No upcoming meetings or events scheduled.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {combinedSchedule.slice(0, 4).map((item) => (
                    <Link
                      key={item.id}
                      to={item.link}
                      className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-indigo-300 hover:bg-white transition-all flex items-center justify-between gap-3 group"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${item.badgeColor}`}>
                            {item.badge}
                          </span>
                          <span className="text-xs font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                            {item.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500">
                          <Clock3 className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>
                            {item.start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at{' '}
                            {item.start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                          </span>
                          {item.meta && (
                            <>
                              <span>•</span>
                              <span className="truncate">{item.meta}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>{upcomingMeetings.length} meetings, {upcomingEvents.length} events</span>
              <Link to="/meetings" className="text-indigo-600 hover:text-indigo-700 font-medium">
                Manage Meetings
              </Link>
            </div>
          </div>

          {/* Recent Knowledge Articles Widget */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Knowledge & Documentation</h3>
                    <p className="text-[11px] text-slate-500">Latest published engineering guides and SOPs</p>
                  </div>
                </div>

                <Link
                  to="/knowledge"
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
                >
                  <span>Explore All</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              {articles.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No published documentation articles yet.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {articles.slice(0, 4).map((art) => (
                    <Link
                      key={art.id}
                      to={`/knowledge/${art.id}`}
                      className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-indigo-300 hover:bg-white transition-all flex items-center justify-between gap-3 group"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                            {art.category_name || 'General'}
                          </span>
                          <span className="text-xs font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                            {art.title}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-1">
                          {art.content}
                        </p>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>{publishedArticlesCount} published guides</span>
              <Link to="/knowledge" className="text-indigo-600 hover:text-indigo-700 font-medium">
                Open Knowledge Base
              </Link>
            </div>
          </div>
        </div>

        {/* Project Cards Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderGit2 className="w-5 h-5 text-indigo-600" />
              <h3 className="text-lg font-bold text-slate-900">Your Projects</h3>
              <span className="text-xs text-slate-400">({totalProjects})</span>
            </div>
            <Link
              to="/projects"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition-colors"
            >
              <span>Manage Projects</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {projects.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center border border-slate-200 space-y-2 shadow-xs">
              <FolderGit2 className="w-8 h-8 text-slate-400 mx-auto" />
              <h4 className="text-sm font-bold text-slate-900">No Projects Yet</h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Create a project to start organizing sprints, assigning deliverables, and tracking team discussions.
              </p>
              <button
                onClick={() => setProjectModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-medium cursor-pointer shadow-xs"
              >
                <FolderPlus className="w-4 h-4" />
                <span>Create First Project</span>
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
                    className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs hover:border-slate-300 hover:shadow-md flex flex-col justify-between group relative transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <StatusPill status={p.status} />
                        <span className="text-[10px] text-slate-400">
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
                        <span>Deliverables</span>
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

        {/* Recent Tasks Section & Filter Bar */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-indigo-600" />
              <h3 className="text-lg font-bold text-slate-900">Recent Deliverables & Tasks</h3>
              <span className="text-xs text-slate-400">({filteredTasks.length})</span>
            </div>

            <Link
              to="/tasks"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition-colors"
            >
              <span>View Tasks Board</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Task Filters Bar */}
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
              {/* Status Filter */}
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

              {/* Priority Filter */}
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

              {/* Assignee Filter */}
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

          {/* Recent Tasks List */}
          {filteredTasks.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 text-xs text-slate-500 shadow-xs">
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
                      {isLeader || String(task.assigned_to) === String(user?.id) ? (
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
                      ) : (
                        <div className="text-slate-300 shrink-0" title="Only the assignee or team leader can update status">
                          {task.status === 'completed' ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 opacity-60" />
                          ) : (
                            <Circle className="w-5 h-5" />
                          )}
                        </div>
                      )}

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

        {/* Platform Modules Grid */}
        <div className="space-y-4 pt-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <h3 className="text-lg font-bold text-slate-900">Integrated Platform Modules</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {modules.map((mod, idx) => {
              const Icon = mod.icon;
              return (
                <Link
                  key={idx}
                  to={mod.link}
                  className="bg-white rounded-2xl p-4 flex flex-col justify-between border border-slate-200 shadow-xs hover:border-slate-300 hover:shadow-md transition-all group"
                >
                  <div>
                    <div className={`w-9 h-9 rounded-xl ${mod.color} flex items-center justify-center mb-2.5 shadow-2xs group-hover:scale-105 transition-transform`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors">
                      {mod.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed mb-3 line-clamp-2">
                      {mod.description}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="text-indigo-600 font-medium">{mod.badge}</span>
                    <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-slate-700 transition-colors" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Protected API Test Panel */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <KeyRound className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Protected API Verification</h4>
                <p className="text-xs text-slate-500">Live JWT verification with PostgreSQL auth middleware</p>
              </div>
            </div>

            <button
              onClick={handleTestProtectedApi}
              disabled={testing}
              className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
            >
              {testing ? 'Verifying...' : 'Call GET /api/protected/test'}
            </button>
          </div>

          {testResult && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-mono">
              ✅ Authorization Verified: HTTP {testResult.status} ({testResult.latency} ms)
            </div>
          )}

          {testError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
              ❌ {testError}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <ProjectModal
        isOpen={projectModalOpen}
        onClose={() => setProjectModalOpen(false)}
        onSubmit={handleCreateProject}
        loading={submittingProject}
      />

      <TaskModal
        isOpen={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        onSubmit={handleCreateTask}
        projects={projects}
        users={users}
        loading={submittingTask}
      />

      <TaskDetailsModal
        isOpen={!!detailsTask}
        onClose={() => setDetailsTask(null)}
        task={detailsTask}
      />
    </div>
  );
}
