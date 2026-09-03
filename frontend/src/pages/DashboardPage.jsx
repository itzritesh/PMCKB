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
} from 'lucide-react';
import { authService } from '../services/authService';
import { projectService } from '../services/projectService';
import { taskService } from '../services/taskService';
import StatusPill from '../components/projects/StatusPill';
import ProjectModal from '../components/projects/ProjectModal';
import PriorityBadge from '../components/tasks/PriorityBadge';
import TaskStatusPill from '../components/tasks/TaskStatusPill';

export default function DashboardPage() {
  const { user, token, logout } = useAuth();
  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting] = useState(false);
  const [testError, setTestError] = useState(null);

  // Projects state
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Tasks state
  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(true);

  const fetchData = async () => {
    try {
      const [projRes, tasksRes] = await Promise.all([
        projectService.getProjects(),
        taskService.getAllTasks(),
      ]);
      setProjects(projRes.data.projects || []);
      setTasks(tasksRes.data.tasks || []);
    } catch (err) {
      console.warn('Failed to load dashboard data:', err);
    } finally {
      setLoadingProjects(false);
      setLoadingTasks(false);
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
    setSubmitting(true);
    try {
      const res = await projectService.createProject(formData);
      setProjects((prev) => [res.data.project, ...prev]);
      setModalOpen(false);
    } catch (err) {
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  // Metrics
  const totalProjects = projects.length;
  const inProgressProjects = projects.filter((p) => p.status === 'in_progress').length;
  const completedProjects = projects.filter((p) => p.status === 'completed').length;

  const totalTasks = tasks.length;
  const pendingTasks = tasks.filter((t) => t.status !== 'completed').length;
  const overdueTasks = tasks.filter(
    (t) =>
      t.due_date &&
      new Date(t.due_date).getTime() < Date.now() &&
      t.status !== 'completed'
  ).length;

  const modules = [
    {
      title: 'Project Management',
      icon: FolderGit2,
      color: 'from-blue-600 to-indigo-600',
      description: 'Boards, sprints, and task management linked to your user account.',
      badge: 'Active (Phase 3)',
      link: '/projects',
    },
    {
      title: 'Tasks Management',
      icon: CheckSquare,
      color: 'from-emerald-600 to-teal-600',
      description: 'Priorities, deadlines, overdue tracking, and deliverables.',
      badge: 'Active (Phase 4)',
      link: '/tasks',
    },
    {
      title: 'Meetings & Minutes',
      icon: Users,
      color: 'from-purple-600 to-pink-600',
      description: 'Collaborative meeting agendas and assigned action items.',
      badge: 'Unlocked in Phase 5',
      link: '#',
    },
    {
      title: 'Calendar & Scheduling',
      icon: Calendar,
      color: 'from-amber-600 to-orange-600',
      description: 'Team scheduling and unified calendar sync.',
      badge: 'Unlocked in Phase 6',
      link: '#',
    },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] py-10 px-4 sm:px-6 lg:px-8 bg-radial from-indigo-950/20 via-slate-950 to-slate-950">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Welcome Header */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-slate-950/90 p-8 sm:p-10 shadow-2xl backdrop-blur-xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>JWT Authentication Verified</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Welcome, {user?.name || 'Authorized User'}!
              </h1>
              <p className="text-sm text-slate-400">
                You are securely signed in. Your projects and tasks are stored in PostgreSQL with complete owner isolation.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-medium transition-all shadow-md shadow-indigo-600/25 cursor-pointer"
              >
                <FolderPlus className="w-4 h-4" />
                <span>New Project</span>
              </button>
              <button
                onClick={logout}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-rose-500/20 hover:text-rose-300 hover:border-rose-500/30 text-slate-300 text-xs sm:text-sm font-medium border border-slate-700/60 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>

        {/* Unified Metrics Row (Projects & Tasks) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card rounded-2xl p-5 border border-slate-800">
            <span className="text-xs text-slate-400 block mb-1">Total Projects</span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-bold text-white">{totalProjects}</span>
              <FolderGit2 className="w-5 h-5 text-indigo-400" />
            </div>
          </div>
          <div className="glass-card rounded-2xl p-5 border border-slate-800">
            <span className="text-xs text-slate-400 block mb-1">Total Tasks</span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-bold text-teal-400">{totalTasks}</span>
              <CheckSquare className="w-5 h-5 text-teal-400" />
            </div>
          </div>
          <div className="glass-card rounded-2xl p-5 border border-slate-800">
            <span className="text-xs text-slate-400 block mb-1">Pending Deliverables</span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-bold text-amber-400">{pendingTasks}</span>
              <Clock className="w-5 h-5 text-amber-400" />
            </div>
          </div>
          <div className="glass-card rounded-2xl p-5 border border-slate-800">
            <span className="text-xs text-slate-400 block mb-1">Overdue Tasks</span>
            <div className="flex items-baseline justify-between">
              <span className={`text-2xl sm:text-3xl font-bold ${overdueTasks > 0 ? 'text-rose-400 animate-pulse' : 'text-slate-400'}`}>
                {overdueTasks}
              </span>
              <AlertTriangle className={`w-5 h-5 ${overdueTasks > 0 ? 'text-rose-400' : 'text-slate-600'}`} />
            </div>
          </div>
        </div>

        {/* Two-Column Widget: Recent Projects & Upcoming Tasks */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Projects Widget */}
          <div className="glass-card rounded-3xl p-6 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <FolderGit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">Recent Projects</h3>
                  <p className="text-xs text-slate-400">Active project workspaces</p>
                </div>
              </div>
              <Link
                to="/projects"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                <span>View all</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {projects.length === 0 ? (
              <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800/60 text-center space-y-3">
                <p className="text-xs text-slate-400">You don't have any projects yet.</p>
                <button
                  onClick={() => setModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors cursor-pointer"
                >
                  <FolderPlus className="w-4 h-4" />
                  <span>Create First Project</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3 pt-2">
                {projects.slice(0, 3).map((project) => (
                  <Link
                    key={project.id}
                    to={`/projects/${project.id}`}
                    className="p-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/40 transition-all flex items-center justify-between group"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white group-hover:text-indigo-300 transition-colors">
                          {project.name}
                        </span>
                        <StatusPill status={project.status} />
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-1">
                        {project.description || 'No description provided.'}
                      </p>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors shrink-0 ml-2" />
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Pending Tasks Widget */}
          <div className="glass-card rounded-3xl p-6 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                  <CheckSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">Pending Tasks</h3>
                  <p className="text-xs text-slate-400">Deliverables awaiting completion</p>
                </div>
              </div>
              <Link
                to="/tasks"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-400 hover:text-teal-300 transition-colors"
              >
                <span>View all ({totalTasks})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {tasks.length === 0 ? (
              <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800/60 text-center space-y-3">
                <p className="text-xs text-slate-400">No tasks created yet.</p>
                <Link
                  to="/tasks"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-medium transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Go to Tasks</span>
                </Link>
              </div>
            ) : (
              <div className="space-y-3 pt-2">
                {tasks
                  .filter((t) => t.status !== 'completed')
                  .slice(0, 3)
                  .map((task) => {
                    const isOverdue =
                      task.due_date &&
                      new Date(task.due_date).getTime() < Date.now();
                    return (
                      <Link
                        key={task.id}
                        to={`/projects/${task.project_id}`}
                        className="p-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-teal-500/40 transition-all flex items-center justify-between group"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-white group-hover:text-teal-300 transition-colors">
                              {task.title}
                            </span>
                            <PriorityBadge priority={task.priority} />
                            {isOverdue && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                                Overdue
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500">
                            <span>Project: {task.project_name || `#${task.project_id}`}</span>
                            {task.due_date && (
                              <>
                                <span>•</span>
                                <span className={isOverdue ? 'text-rose-400 font-medium' : 'text-slate-400'}>
                                  Due {new Date(task.due_date).toLocaleDateString()}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-teal-400 transition-colors shrink-0 ml-2" />
                      </Link>
                    );
                  })}
              </div>
            )}
          </div>
        </div>

        {/* Two-Column Grid: Session Details & Protected API Tester */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Card 1: User Profile Details */}
          <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">Active Session Details</h3>
                  <p className="text-xs text-slate-400">Decoded from JWT token and PostgreSQL</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Active
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/70 border border-slate-800/80">
                <span className="text-slate-400">User ID (PostgreSQL):</span>
                <span className="font-mono text-slate-200 font-semibold">{user?.id || '—'}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/70 border border-slate-800/80">
                <span className="text-slate-400">Display Name:</span>
                <span className="text-slate-200 font-semibold">{user?.name || '—'}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/70 border border-slate-800/80">
                <span className="text-slate-400">Registered Email:</span>
                <span className="font-mono text-indigo-300 font-semibold">{user?.email || '—'}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/70 border border-slate-800/80">
                <span className="text-slate-400">Account Created:</span>
                <span className="text-slate-300">
                  {user?.created_at ? new Date(user.created_at).toLocaleString() : 'Just now'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800/80 space-y-1">
                <span className="text-slate-400 block">Bearer Token Preview:</span>
                <p className="font-mono text-[11px] text-slate-500 truncate select-all">
                  {token ? `${token.slice(0, 48)}...` : 'No token stored'}
                </p>
              </div>
            </div>
          </div>

          {/* Card 2: Interactive Protected API Tester */}
          <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">Protected API Verification</h3>
                  <p className="text-xs text-slate-400">Test Bearer token rejection & acceptance</p>
                </div>
              </div>
              <button
                onClick={handleTestProtectedApi}
                disabled={testing}
                className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-medium transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                {testing ? 'Verifying...' : 'Call GET /api/protected/test'}
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              This triggers a request to <code className="bg-slate-900 px-1.5 py-0.5 rounded text-indigo-300">/api/protected/test</code> passing your JWT in the <code className="bg-slate-900 px-1.5 py-0.5 rounded text-indigo-300">Authorization: Bearer &lt;token&gt;</code> header.
            </p>

            {testResult && (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
                <div className="flex items-center justify-between text-xs text-emerald-400 font-medium">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    Authorization Succeeded (HTTP {testResult.status})
                  </span>
                  <span className="font-mono">{testResult.latency} ms</span>
                </div>
                <pre className="p-3 rounded-lg bg-slate-950 border border-slate-900 text-[11px] font-mono text-emerald-300 overflow-x-auto">
                  {JSON.stringify(testResult.data, null, 2)}
                </pre>
              </div>
            )}

            {testError && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
                <p className="font-semibold mb-1">Authorization Failed</p>
                <p>{testError}</p>
              </div>
            )}

            {!testResult && !testError && (
              <div className="p-6 rounded-xl bg-slate-900/40 border border-slate-800/60 text-center text-xs text-slate-500">
                Click "Call GET /api/protected/test" above to test live JWT verification.
              </div>
            )}
          </div>
        </div>

        {/* Platform Modules Section */}
        <div className="space-y-4 pt-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <h3 className="text-lg font-bold text-white">Platform Modules</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {modules.map((mod, idx) => {
              const Icon = mod.icon;
              return (
                <Link
                  key={idx}
                  to={mod.link}
                  className="glass-card glass-card-hover rounded-2xl p-5 flex flex-col justify-between border border-slate-800 group"
                >
                  <div>
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${mod.color} flex items-center justify-center text-white mb-3 shadow-md group-hover:scale-105 transition-transform`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <h4 className="text-base font-semibold text-white mb-1 group-hover:text-indigo-300 transition-colors">
                      {mod.title}
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed mb-4">{mod.description}</p>
                  </div>
                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-indigo-400 font-medium">{mod.badge}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-white transition-colors" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Project Modal */}
      <ProjectModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleCreateProject}
        loading={submitting}
      />
    </div>
  );
}
