import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  User,
  KeyRound,
  LogOut,
  FolderGit2,
  Calendar,
  Users,
  BookOpen,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  FolderPlus,
  ArrowUpRight,
  Clock,
  CheckSquare,
  AlertTriangle,
  Plus,
  Filter,
  Search,
  MessageSquare,
  Circle,
  TrendingUp,
} from 'lucide-react';
import { authService } from '../services/authService';
import { projectService } from '../services/projectService';
import { taskService } from '../services/taskService';
import { userService } from '../services/userService';
import StatusPill from '../components/projects/StatusPill';
import ProjectModal from '../components/projects/ProjectModal';
import TaskModal from '../components/tasks/TaskModal';
import TaskDetailsModal from '../components/tasks/TaskDetailsModal';
import PriorityBadge from '../components/tasks/PriorityBadge';
import TaskStatusPill from '../components/tasks/TaskStatusPill';

export default function DashboardPage() {
  const { user, token, logout } = useAuth();

  // Data states
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
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
      const [projRes, tasksRes, usersRes] = await Promise.all([
        projectService.getProjects(),
        taskService.getAllTasks(),
        userService.getUsers().catch(() => ({ data: { users: [] } })),
      ]);
      setProjects(projRes.data.projects || []);
      setTasks(tasksRes.data.tasks || []);
      setUsers(usersRes.data.users || []);
    } catch (err) {
      console.warn('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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
    try {
      const res = await taskService.updateTask(task.id, {
        ...task,
        status: nextStatus,
      });
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...res.data.task, project_name: t.project_name } : t))
      );
    } catch (err) {
      alert(err.message || 'Failed to update task status.');
    }
  };

  // Metrics
  const totalProjects = projects.length;
  const totalTasks = tasks.length;
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
        : taskAssigneeFilter === 'unassigned'
        ? !t.assigned_to
        : String(t.assigned_to) === String(taskAssigneeFilter);

    return matchesSearch && matchesStatus && matchesPriority && matchesAssignee;
  });

  const modules = [
    {
      title: 'Projects Management',
      icon: FolderGit2,
      color: 'from-blue-600 to-indigo-600',
      description: 'Owner-scoped workspaces, deliverable tracking, and status boards.',
      badge: 'Active Module',
      link: '/projects',
    },
    {
      title: 'Tasks & Deliverables',
      icon: CheckSquare,
      color: 'from-emerald-600 to-teal-600',
      description: 'Priorities, deadlines, overdue alerts, and assignee dispatch.',
      badge: 'Active Module',
      link: '/tasks',
    },
    {
      title: 'Meetings & Standups',
      icon: Users,
      color: 'from-purple-600 to-pink-600',
      description: 'Collaborative meeting agendas, minutes, and task action items.',
      badge: 'Integrated Preview',
      link: '/meetings',
    },
    {
      title: 'Calendar & Deadlines',
      icon: Calendar,
      color: 'from-amber-600 to-orange-600',
      description: 'Unified calendar synchronizing deliverables and team schedules.',
      badge: 'Integrated Preview',
      link: '/calendar',
    },
    {
      title: 'Knowledge Base',
      icon: BookOpen,
      color: 'from-pink-600 to-rose-600',
      description: 'Centralized engineering documentation, architecture wikis, and SOPs.',
      badge: 'Integrated Preview',
      link: '/knowledge',
    },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] py-8 px-4 sm:px-6 lg:px-8 bg-radial from-indigo-950/20 via-slate-950 to-slate-950">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Welcome Header */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-slate-950/90 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>JWT Authentication & Neon PostgreSQL Active</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
                Welcome back, {user?.name || 'Workspace Member'}!
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
                Here is your project ecosystem summary. You have <strong>{totalTasks} total deliverables</strong> with <strong>{completionRate}% completion rate</strong>.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => setProjectModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs sm:text-sm font-medium transition-all shadow-md shadow-indigo-600/25 cursor-pointer"
              >
                <FolderPlus className="w-4 h-4" />
                <span>New Project</span>
              </button>

              <button
                onClick={() => setTaskModalOpen(true)}
                disabled={projects.length === 0}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs sm:text-sm font-medium transition-all shadow-md shadow-emerald-600/25 cursor-pointer disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                <span>New Task</span>
              </button>
            </div>
          </div>
        </div>

        {/* 5 Summary Metric Cards (Requirements: Total Projects, Total Tasks, In Progress, Completed, Overdue) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {/* Card 1: Total Projects */}
          <div className="glass-card rounded-2xl p-4 sm:p-5 border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-400">Total Projects</span>
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <FolderGit2 className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-extrabold text-white">{totalProjects}</span>
              <span className="text-[11px] text-indigo-400 font-medium">Workspaces</span>
            </div>
          </div>

          {/* Card 2: Total Tasks */}
          <div className="glass-card rounded-2xl p-4 sm:p-5 border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-400">Total Tasks</span>
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <CheckSquare className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-extrabold text-blue-400">{totalTasks}</span>
              <span className="text-[11px] text-slate-500 font-medium">Deliverables</span>
            </div>
          </div>

          {/* Card 3: In Progress */}
          <div className="glass-card rounded-2xl p-4 sm:p-5 border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-amber-400">In Progress</span>
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-extrabold text-amber-400">{inProgressTasks}</span>
              <span className="text-[11px] text-amber-400/80 font-medium">Active</span>
            </div>
          </div>

          {/* Card 4: Completed */}
          <div className="glass-card rounded-2xl p-4 sm:p-5 border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-emerald-400">Completed</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400">{completedTasks}</span>
              <span className="text-[11px] text-emerald-400/80 font-medium">{completionRate}% Done</span>
            </div>
          </div>

          {/* Card 5: Overdue */}
          <div className="glass-card rounded-2xl p-4 sm:p-5 border border-slate-800 col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-rose-400">Overdue</span>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${overdueCount > 0 ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-800 text-slate-500'}`}>
                <AlertTriangle className={`w-4 h-4 ${overdueCount > 0 ? 'animate-bounce' : ''}`} />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className={`text-2xl sm:text-3xl font-extrabold ${overdueCount > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                {overdueCount}
              </span>
              <span className={`text-[11px] font-semibold ${overdueCount > 0 ? 'text-rose-400' : 'text-slate-500'}`}>
                {overdueCount > 0 ? 'Attention Needed' : 'All on track'}
              </span>
            </div>
          </div>
        </div>

        {/* Dedicated Overdue Tasks Section (Requirements: Add overdue task section) */}
        {overdueCount > 0 && (
          <div className="glass-card rounded-3xl p-6 border border-rose-500/30 bg-gradient-to-r from-rose-950/20 via-slate-900/80 to-slate-900/60 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Overdue Deliverables Requiring Attention</span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-500/30 text-rose-300">
                      {overdueCount}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    These tasks have passed their target deadline. Resolve or update their progress.
                  </p>
                </div>
              </div>

              <Link
                to="/tasks"
                className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-rose-400 hover:text-rose-300"
              >
                <span>View all tasks</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
              {overdueTasksList.slice(0, 3).map((t) => (
                <div
                  key={t.id}
                  className="p-4 rounded-2xl bg-slate-900/90 border border-rose-500/30 space-y-2 hover:border-rose-400 transition-colors"
                >
                  <div className="flex items-center justify-between text-xs">
                    <PriorityBadge priority={t.priority} />
                    <span className="font-semibold text-rose-400 text-[11px]">
                      Due {new Date(t.due_date).toLocaleDateString()}
                    </span>
                  </div>

                  <h4
                    onClick={() => setDetailsTask(t)}
                    className="text-sm font-bold text-white hover:text-indigo-300 transition-colors cursor-pointer truncate"
                  >
                    {t.title}
                  </h4>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                    <span className="truncate max-w-[120px]">
                      {t.assignee_name ? `👤 ${t.assignee_name}` : '⚪ Unassigned'}
                    </span>
                    <button
                      onClick={() => handleQuickStatusChange(t, 'completed')}
                      className="px-2 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-[11px] font-medium transition-colors cursor-pointer"
                    >
                      Mark Done
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Project Cards Section (Requirements: Add project cards) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderGit2 className="w-5 h-5 text-indigo-400" />
              <h3 className="text-lg font-bold text-white">Your Projects</h3>
              <span className="text-xs text-slate-500">({totalProjects})</span>
            </div>
            <Link
              to="/projects"
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
            >
              <span>Manage Projects</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {projects.length === 0 ? (
            <div className="glass-card rounded-3xl p-8 text-center border border-slate-800 space-y-2">
              <FolderGit2 className="w-8 h-8 text-slate-600 mx-auto" />
              <h4 className="text-sm font-bold text-white">No Projects Yet</h4>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Create a project to start organizing sprints, assigning deliverables, and tracking team discussions.
              </p>
              <button
                onClick={() => setProjectModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-medium cursor-pointer"
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
                    className="glass-card glass-card-hover rounded-3xl p-5 border border-slate-800 flex flex-col justify-between group relative transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <StatusPill status={p.status} />
                        <span className="text-[10px] text-slate-500">
                          {projectTasks.length} {projectTasks.length === 1 ? 'task' : 'tasks'}
                        </span>
                      </div>

                      <h4 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-1 mb-1">
                        {p.name}
                      </h4>

                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4">
                        {p.description || 'No description provided.'}
                      </p>
                    </div>

                    <div className="space-y-2 pt-3 border-t border-slate-800/80">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>Deliverables</span>
                        <span className="font-semibold text-slate-200">{pPercent}% Done</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-500"
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

        {/* Recent Tasks Section & Filter Bar (Requirements: Add recent tasks section, Add task filters) */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-teal-400" />
              <h3 className="text-lg font-bold text-white">Recent Deliverables & Tasks</h3>
              <span className="text-xs text-slate-500">({filteredTasks.length})</span>
            </div>

            <Link
              to="/tasks"
              className="text-xs font-semibold text-teal-400 hover:text-teal-300 flex items-center gap-1 transition-colors"
            >
              <span>View Tasks Board</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Task Filters Bar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 bg-slate-900/60 rounded-2xl border border-slate-800">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                value={taskSearch}
                onChange={(e) => setTaskSearch(e.target.value)}
                placeholder="Search recent tasks..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Status Filter */}
              <select
                value={taskStatusFilter}
                onChange={(e) => setTaskStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
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
                className="px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
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
                  className="px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
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
            <div className="glass-card rounded-2xl p-8 text-center border border-slate-800 text-xs text-slate-400">
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
                    className="p-3.5 sm:p-4 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between gap-4 group"
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
                        className="text-slate-500 hover:text-emerald-400 transition-colors cursor-pointer shrink-0"
                      >
                        {task.status === 'completed' ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <Circle className="w-5 h-5" />
                        )}
                      </button>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <span
                            onClick={() => setDetailsTask(task)}
                            className={`text-sm font-semibold hover:text-indigo-300 transition-colors cursor-pointer truncate ${
                              task.status === 'completed' ? 'line-through text-slate-500' : 'text-white'
                            }`}
                          >
                            {task.title}
                          </span>
                          <TaskStatusPill status={task.status} />
                          <PriorityBadge priority={task.priority} />
                          {isOverdue && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                              Overdue
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-xs text-slate-500">
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
                              <span className={isOverdue ? 'text-rose-400 font-medium' : ''}>
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
                        className="p-2 rounded-xl text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition-colors cursor-pointer text-xs flex items-center gap-1"
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
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <h3 className="text-lg font-bold text-white">Integrated Platform Modules</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {modules.map((mod, idx) => {
              const Icon = mod.icon;
              return (
                <Link
                  key={idx}
                  to={mod.link}
                  className="glass-card glass-card-hover rounded-2xl p-4 flex flex-col justify-between border border-slate-800 group"
                >
                  <div>
                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${mod.color} flex items-center justify-center text-white mb-2.5 shadow-md group-hover:scale-105 transition-transform`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <h4 className="text-sm font-bold text-white mb-1 group-hover:text-indigo-300 transition-colors">
                      {mod.title}
                    </h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed mb-3 line-clamp-2">
                      {mod.description}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                    <span className="text-indigo-400 font-medium">{mod.badge}</span>
                    <ArrowRight className="w-3 h-3 text-slate-600 group-hover:text-white transition-colors" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Protected API Test Panel */}
        <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                <KeyRound className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Protected API Verification</h4>
                <p className="text-xs text-slate-400">Live JWT verification with PostgreSQL auth middleware</p>
              </div>
            </div>

            <button
              onClick={handleTestProtectedApi}
              disabled={testing}
              className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
            >
              {testing ? 'Verifying...' : 'Call GET /api/protected/test'}
            </button>
          </div>

          {testResult && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 font-mono">
              ✅ Authorization Verified: HTTP {testResult.status} ({testResult.latency} ms)
            </div>
          )}

          {testError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
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
