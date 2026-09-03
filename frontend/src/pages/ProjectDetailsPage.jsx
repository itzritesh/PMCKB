import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  FolderGit2,
  Calendar,
  Clock,
  Edit3,
  Trash2,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Users,
  BookOpen,
  CheckCircle2,
  CheckSquare,
  Plus,
  Search,
  Filter,
  AlertTriangle,
} from 'lucide-react';
import { projectService } from '../services/projectService';
import { taskService } from '../services/taskService';
import { userService } from '../services/userService';
import StatusPill from '../components/projects/StatusPill';
import ProjectModal from '../components/projects/ProjectModal';
import DeleteConfirmModal from '../components/projects/DeleteConfirmModal';
import TaskCard from '../components/tasks/TaskCard';
import TaskModal from '../components/tasks/TaskModal';
import DeleteTaskModal from '../components/tasks/DeleteTaskModal';

const TASK_STATUS_TABS = [
  { key: 'all', label: 'All Tasks' },
  { key: 'todo', label: 'To Do' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'completed', label: 'Completed' },
  { key: 'overdue', label: 'Overdue' },
];

export default function ProjectDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Project states
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Project Modals
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [submittingProject, setSubmittingProject] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingProject, setDeletingProject] = useState(false);

  // Tasks states
  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [tasksError, setTasksError] = useState(null);
  const [taskSearch, setTaskSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [users, setUsers] = useState([]);

  // Task Modals
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [submittingTask, setSubmittingTask] = useState(false);
  const [deleteTaskModalOpen, setDeleteTaskModalOpen] = useState(false);
  const [deletingTask, setDeletingTask] = useState(null);
  const [isDeletingTask, setIsDeletingTask] = useState(false);

  const fetchProjectData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await projectService.getProject(id);
      setProject(res.data.project);
    } catch (err) {
      setError(err.message || 'Project not found or access denied.');
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectTasks = async () => {
    setLoadingTasks(true);
    setTasksError(null);
    try {
      const res = await taskService.getTasksByProject(id);
      setTasks(res.data.tasks || []);
    } catch (err) {
      setTasksError(err.message || 'Failed to load project tasks.');
    } finally {
      setLoadingTasks(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await userService.getUsers();
      setUsers(res.data.users || []);
    } catch (err) {
      console.warn('Failed to load registered users:', err);
    }
  };

  useEffect(() => {
    fetchProjectData();
    fetchProjectTasks();
    fetchUsers();
  }, [id]);

  // Project handlers
  const handleUpdateProject = async (formData) => {
    setSubmittingProject(true);
    try {
      const res = await projectService.updateProject(id, formData);
      setProject(res.data.project);
      setEditModalOpen(false);
    } catch (err) {
      throw err;
    } finally {
      setSubmittingProject(false);
    }
  };

  const handleDeleteProject = async () => {
    setDeletingProject(true);
    try {
      await projectService.deleteProject(id);
      navigate('/projects', { replace: true });
    } catch (err) {
      alert(err.message || 'Failed to delete project.');
      setDeletingProject(false);
    }
  };

  // Task handlers
  const handleOpenCreateTask = () => {
    setEditingTask(null);
    setTaskModalOpen(true);
  };

  const handleOpenEditTask = (task) => {
    setEditingTask(task);
    setTaskModalOpen(true);
  };

  const handleSaveTask = async (formData) => {
    setSubmittingTask(true);
    try {
      if (editingTask) {
        const res = await taskService.updateTask(editingTask.id, formData);
        setTasks((prev) =>
          prev.map((t) => (t.id === editingTask.id ? res.data.task : t))
        );
      } else {
        const res = await taskService.createTask({
          ...formData,
          project_id: id,
        });
        setTasks((prev) => [res.data.task, ...prev]);
      }
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
        prev.map((t) => (t.id === task.id ? res.data.task : t))
      );
    } catch (err) {
      alert(err.message || 'Failed to update task status.');
    }
  };

  const handleAssignTask = async (task, newUserId) => {
    try {
      const res = await taskService.assignTask(task.id, newUserId);
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? res.data.task : t))
      );
    } catch (err) {
      alert(err.message || 'Failed to update task assignment.');
    }
  };

  const handleOpenDeleteTask = (task) => {
    setDeletingTask(task);
    setDeleteTaskModalOpen(true);
  };

  const handleConfirmDeleteTask = async () => {
    if (!deletingTask) return;
    setIsDeletingTask(true);
    try {
      await taskService.deleteTask(deletingTask.id);
      setTasks((prev) => prev.filter((t) => t.id !== deletingTask.id));
      setDeleteTaskModalOpen(false);
    } catch (err) {
      alert(err.message || 'Failed to delete task.');
    } finally {
      setIsDeletingTask(false);
      setDeletingTask(null);
    }
  };

  // Task metrics
  const totalTasks = tasks.length;
  const todoTasks = tasks.filter((t) => t.status === 'todo').length;
  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress').length;
  const completedTasks = tasks.filter((t) => t.status === 'completed').length;
  const overdueTasks = tasks.filter(
    (t) =>
      t.due_date &&
      new Date(t.due_date).getTime() < Date.now() &&
      t.status !== 'completed'
  ).length;

  // Filtered tasks
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(taskSearch.toLowerCase()) ||
      (task.description &&
        task.description.toLowerCase().includes(taskSearch.toLowerCase()));

    const isOverdue =
      task.due_date &&
      new Date(task.due_date).getTime() < Date.now() &&
      task.status !== 'completed';

    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'overdue'
        ? isOverdue
        : task.status === statusFilter;

    const matchesPriority =
      priorityFilter === 'all' || task.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-xs text-slate-400 font-medium">Loading project details...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
        <div className="glass-card max-w-md w-full p-8 rounded-3xl text-center space-y-4 border border-slate-800">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white">Project Unavailable</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            {error || 'This project could not be found or you do not have permission to view it.'}
          </p>
          <div className="pt-2">
            <Link
              to="/projects"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Projects</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] py-10 px-4 sm:px-6 lg:px-8 bg-radial from-indigo-950/20 via-slate-950 to-slate-950">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Navigation Breadcrumb */}
        <Link
          to="/projects"
          className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Projects</span>
        </Link>

        {/* Project Header Banner */}
        <div className="glass-card rounded-3xl p-6 sm:p-10 border border-slate-800 shadow-2xl relative overflow-hidden space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 shrink-0">
                <FolderGit2 className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    {project.name}
                  </h1>
                  <StatusPill status={project.status} />
                </div>
                <p className="text-xs text-slate-400">
                  Project ID: <span className="font-mono text-slate-300">#{project.id}</span> • Managed by You
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 sm:self-start">
              <button
                onClick={() => setEditModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 text-xs font-medium transition-colors cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
              <button
                onClick={() => setDeleteModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-medium transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </div>
          </div>

          {/* Description */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
              Description & Scope
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
              {project.description || 'No detailed description provided for this project.'}
            </p>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-xs">
            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/60">
              <span className="text-slate-500 block mb-1">Created At</span>
              <span className="font-medium text-slate-200">
                {new Date(project.created_at).toLocaleString()}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/60">
              <span className="text-slate-500 block mb-1">Last Updated</span>
              <span className="font-medium text-slate-200">
                {new Date(project.updated_at || project.created_at).toLocaleString()}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/60">
              <span className="text-slate-500 block mb-1">Security & Access</span>
              <span className="font-medium text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Owner Isolated
              </span>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* TASKS MANAGEMENT SECTION                                       */}
        {/* ============================================================== */}
        <div className="space-y-6 pt-4">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Project Tasks & Deliverables
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  {totalTasks}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Track deliverables, priorities, deadlines, and execution progress.
              </p>
            </div>

            <button
              onClick={handleOpenCreateTask}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs sm:text-sm font-medium transition-all shadow-md shadow-indigo-600/25 cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Add Task</span>
            </button>
          </div>

          {/* Task Metrics Chips */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
              <span className="text-[11px] text-slate-400 block mb-0.5">Total</span>
              <span className="text-lg font-bold text-white">{totalTasks}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
              <span className="text-[11px] text-slate-400 block mb-0.5">To Do</span>
              <span className="text-lg font-bold text-slate-300">{todoTasks}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
              <span className="text-[11px] text-amber-400 block mb-0.5">In Progress</span>
              <span className="text-lg font-bold text-amber-400">{inProgressTasks}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
              <span className="text-[11px] text-emerald-400 block mb-0.5">Completed</span>
              <span className="text-lg font-bold text-emerald-400">{completedTasks}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-center col-span-2 sm:col-span-1">
              <span className="text-[11px] text-rose-400 block mb-0.5">Overdue</span>
              <span className={`text-lg font-bold ${overdueTasks > 0 ? 'text-rose-400 animate-pulse' : 'text-slate-400'}`}>
                {overdueTasks}
              </span>
            </div>
          </div>

          {/* Task Controls: Search, Status Filter & Priority Filter */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={taskSearch}
                onChange={(e) => setTaskSearch(e.target.value)}
                placeholder="Search tasks by title or description..."
                className="w-full pl-10 pr-4 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              />
            </div>

            <div className="flex items-center gap-3 overflow-x-auto pb-2 md:pb-0">
              {/* Status Filter Tabs */}
              <div className="flex items-center gap-1 bg-slate-900/60 p-1 rounded-2xl border border-slate-800/80">
                {TASK_STATUS_TABS.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setStatusFilter(tab.key)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                      statusFilter === tab.key
                        ? tab.key === 'overdue'
                          ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                          : 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Priority Filter */}
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
              >
                <option value="all">All Priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          {/* Loading Skeletons */}
          {loadingTasks && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2].map((n) => (
                <div
                  key={n}
                  className="glass-card rounded-2xl p-5 border border-slate-800 animate-pulse space-y-3"
                >
                  <div className="flex justify-between">
                    <div className="h-5 w-20 bg-slate-800 rounded-full" />
                    <div className="h-5 w-16 bg-slate-800 rounded-full" />
                  </div>
                  <div className="h-5 w-3/4 bg-slate-800 rounded" />
                  <div className="h-3 w-full bg-slate-800/60 rounded" />
                  <div className="pt-3 border-t border-slate-800 flex justify-between">
                    <div className="h-3 w-24 bg-slate-800 rounded" />
                    <div className="h-3 w-16 bg-slate-800 rounded" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State: No Tasks in Project */}
          {!loadingTasks && tasks.length === 0 && (
            <div className="glass-card rounded-3xl p-10 border border-slate-800/80 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
                <CheckSquare className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">No Tasks In This Project</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Break this project down into actionable tasks with priorities and target deadlines.
              </p>
              <div className="pt-2">
                <button
                  onClick={handleOpenCreateTask}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create First Task</span>
                </button>
              </div>
            </div>
          )}

          {/* Filtered Empty State */}
          {!loadingTasks && tasks.length > 0 && filteredTasks.length === 0 && (
            <div className="glass-card rounded-2xl p-8 border border-slate-800 text-center space-y-2">
              <Filter className="w-6 h-6 text-slate-600 mx-auto" />
              <h4 className="text-sm font-semibold text-white">No tasks match your filters</h4>
              <p className="text-xs text-slate-400">
                Try resetting your search query or status/priority filter.
              </p>
              <button
                onClick={() => {
                  setTaskSearch('');
                  setStatusFilter('all');
                  setPriorityFilter('all');
                }}
                className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          )}

          {/* Task Cards Grid */}
          {!loadingTasks && filteredTasks.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  users={users}
                  onEdit={handleOpenEditTask}
                  onDelete={handleOpenDeleteTask}
                  onStatusChange={handleQuickStatusChange}
                  onAssign={handleAssignTask}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Project Modals */}
      <ProjectModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSubmit={handleUpdateProject}
        project={project}
        loading={submittingProject}
      />

      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteProject}
        projectName={project.name}
        loading={deletingProject}
      />

      {/* Task Modals */}
      <TaskModal
        isOpen={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        onSubmit={handleSaveTask}
        task={editingTask}
        users={users}
        defaultProjectId={id}
        loading={submittingTask}
      />

      <DeleteTaskModal
        isOpen={deleteTaskModalOpen}
        onClose={() => setDeleteTaskModalOpen(false)}
        onConfirm={handleConfirmDeleteTask}
        taskTitle={deletingTask?.title || ''}
        loading={isDeletingTask}
      />
    </div>
  );
}
