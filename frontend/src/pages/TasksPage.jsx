import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Plus,
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  AlertTriangle,
  FolderGit2,
  Calendar,
  User,
} from 'lucide-react';
import { taskService } from '../services/taskService';
import { projectService } from '../services/projectService';
import { userService } from '../services/userService';
import TaskCard from '../components/tasks/TaskCard';
import TaskModal from '../components/tasks/TaskModal';
import DeleteTaskModal from '../components/tasks/DeleteTaskModal';

const STATUS_TABS = [
  { key: 'all', label: 'All Tasks' },
  { key: 'todo', label: 'To Do' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'completed', label: 'Completed' },
  { key: 'overdue', label: 'Overdue' },
];

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingTask, setDeletingTask] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [tasksRes, projectsRes, usersRes] = await Promise.all([
        taskService.getAllTasks(),
        projectService.getProjects(),
        userService.getUsers(),
      ]);
      setTasks(tasksRes.data.tasks || []);
      setProjects(projectsRes.data.projects || []);
      setUsers(usersRes.data.users || []);
    } catch (err) {
      setError(err.message || 'Failed to load tasks.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingTask(null);
    setModalOpen(true);
  };

  const handleOpenEditModal = (task) => {
    setEditingTask(task);
    setModalOpen(true);
  };

  const handleSaveTask = async (formData) => {
    setSubmitting(true);
    try {
      if (editingTask) {
        const res = await taskService.updateTask(editingTask.id, formData);
        setTasks((prev) =>
          prev.map((t) => (t.id === editingTask.id ? { ...res.data.task, project_name: t.project_name } : t))
        );
      } else {
        const res = await taskService.createTask(formData);
        // Find project name from projects list
        const proj = projects.find((p) => p.id === parseInt(formData.project_id, 10));
        const newTask = {
          ...res.data.task,
          project_name: proj?.name || '',
        };
        setTasks((prev) => [newTask, ...prev]);
      }
      setModalOpen(false);
    } catch (err) {
      throw err;
    } finally {
      setSubmitting(false);
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

  const handleAssignTask = async (task, newUserId) => {
    try {
      const res = await taskService.assignTask(task.id, newUserId);
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...res.data.task, project_name: t.project_name } : t))
      );
    } catch (err) {
      alert(err.message || 'Failed to update task assignment.');
    }
  };

  const handleOpenDeleteModal = (task) => {
    setDeletingTask(task);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingTask) return;
    setDeleting(true);
    try {
      await taskService.deleteTask(deletingTask.id);
      setTasks((prev) => prev.filter((t) => t.id !== deletingTask.id));
      setDeleteModalOpen(false);
    } catch (err) {
      alert(err.message || 'Failed to delete task.');
    } finally {
      setDeleting(false);
      setDeletingTask(null);
    }
  };

  // Metrics
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
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.description &&
        task.description.toLowerCase().includes(searchQuery.toLowerCase()));

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

    const matchesProject =
      projectFilter === 'all' || String(task.project_id) === String(projectFilter);

    const matchesAssignee =
      assigneeFilter === 'all'
        ? true
        : assigneeFilter === 'unassigned'
        ? !task.assigned_to
        : String(task.assigned_to) === String(assigneeFilter);

    return matchesSearch && matchesStatus && matchesPriority && matchesProject && matchesAssignee;
  });

  return (
    <div className="min-h-[calc(100vh-4rem)] py-10 px-4 sm:px-6 lg:px-8 bg-radial from-indigo-950/20 via-slate-950 to-slate-950">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Tasks Management
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                {totalTasks} {totalTasks === 1 ? 'Task' : 'Tasks'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400">
              Centralized deliverables tracking, team assignments, priorities, and deadlines across all projects.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchData}
              disabled={loading}
              title="Refresh task list"
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleOpenCreateModal}
              disabled={projects.length === 0}
              title={projects.length === 0 ? 'Create a project first' : 'Add new task'}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs sm:text-sm font-medium transition-all shadow-lg shadow-indigo-600/30 cursor-pointer disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>New Task</span>
            </button>
          </div>
        </div>

        {/* Overdue Alert Banner (if any) */}
        {overdueTasks > 0 && (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-950/20 p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 animate-bounce" />
              <div className="text-xs sm:text-sm">
                <span className="font-bold text-rose-300">
                  {overdueTasks} {overdueTasks === 1 ? 'task has' : 'tasks have'} passed their deadline!
                </span>
                <span className="text-rose-200/70 hidden sm:inline ml-1">
                  Filter by overdue to prioritize resolution.
                </span>
              </div>
            </div>
            <button
              onClick={() => setStatusFilter('overdue')}
              className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium transition-colors cursor-pointer shrink-0"
            >
              View Overdue
            </button>
          </div>
        )}

        {/* Task Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="glass-card rounded-2xl p-4 border border-slate-800 text-center">
            <span className="text-xs text-slate-400 block mb-1">Total Tasks</span>
            <span className="text-xl sm:text-2xl font-bold text-white">{totalTasks}</span>
          </div>
          <div className="glass-card rounded-2xl p-4 border border-slate-800 text-center">
            <span className="text-xs text-slate-400 block mb-1">To Do</span>
            <span className="text-xl sm:text-2xl font-bold text-slate-300">{todoTasks}</span>
          </div>
          <div className="glass-card rounded-2xl p-4 border border-slate-800 text-center">
            <span className="text-xs text-amber-400 block mb-1">In Progress</span>
            <span className="text-xl sm:text-2xl font-bold text-amber-400">{inProgressTasks}</span>
          </div>
          <div className="glass-card rounded-2xl p-4 border border-slate-800 text-center">
            <span className="text-xs text-emerald-400 block mb-1">Completed</span>
            <span className="text-xl sm:text-2xl font-bold text-emerald-400">{completedTasks}</span>
          </div>
          <div className="glass-card rounded-2xl p-4 border border-slate-800 text-center col-span-2 sm:col-span-1">
            <span className="text-xs text-rose-400 block mb-1">Overdue</span>
            <span className={`text-xl sm:text-2xl font-bold ${overdueTasks > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
              {overdueTasks}
            </span>
          </div>
        </div>

        {/* Controls: Search, Project Filter, Assignee Filter, Priority Filter, Status Filter */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks across all projects..."
              className="w-full pl-10 pr-4 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Project Filter Dropdown */}
            {projects.length > 0 && (
              <select
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
              >
                <option value="all">All Projects</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            )}

            {/* Assignee Filter Dropdown */}
            {users.length > 0 && (
              <select
                value={assigneeFilter}
                onChange={(e) => setAssigneeFilter(e.target.value)}
                className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
              >
                <option value="all">All Assignees</option>
                <option value="unassigned">Unassigned Only</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    👤 {u.name}
                  </option>
                ))}
              </select>
            )}

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

            {/* Status Filter Tabs */}
            <div className="flex items-center gap-1 bg-slate-900/60 p-1 rounded-2xl border border-slate-800/80 overflow-x-auto">
              {STATUS_TABS.map((tab) => (
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
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="text-xs text-rose-300 font-medium">{error}</div>
          </div>
        )}

        {/* Loading Skeletons */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((n) => (
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

        {/* Empty State: 0 Tasks overall */}
        {!loading && !error && tasks.length === 0 && (
          <div className="glass-card rounded-3xl p-12 border border-slate-800/80 text-center max-w-md mx-auto space-y-3">
            <div className="w-14 h-14 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
              <CheckSquare className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-white">No Tasks Created Yet</h3>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              {projects.length === 0
                ? 'Create a project first before creating tasks.'
                : 'Create tasks with team assignments, priorities, and deadlines to organize your workflow.'}
            </p>
            <div className="pt-2">
              {projects.length === 0 ? (
                <a
                  href="/projects"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors"
                >
                  <FolderGit2 className="w-4 h-4" />
                  <span>Go to Projects</span>
                </a>
              ) : (
                <button
                  onClick={handleOpenCreateModal}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Your First Task</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Filtered Empty State */}
        {!loading && !error && tasks.length > 0 && filteredTasks.length === 0 && (
          <div className="glass-card rounded-2xl p-8 border border-slate-800 text-center space-y-2">
            <Filter className="w-6 h-6 text-slate-600 mx-auto" />
            <h4 className="text-sm font-semibold text-white">No tasks match your filters</h4>
            <p className="text-xs text-slate-400">
              Try adjusting your search query, status tab, or priority/assignee filter.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setPriorityFilter('all');
                setProjectFilter('all');
                setAssigneeFilter('all');
              }}
              className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Task Cards Grid */}
        {!loading && !error && filteredTasks.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                users={users}
                onEdit={handleOpenEditModal}
                onDelete={handleOpenDeleteModal}
                onStatusChange={handleQuickStatusChange}
                onAssign={handleAssignTask}
                showProject={true}
              />
            ))}
          </div>
        )}
      </div>

      {/* Task Modal */}
      <TaskModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSaveTask}
        task={editingTask}
        projects={projects}
        users={users}
        loading={submitting}
      />

      {/* Delete Confirmation Modal */}
      <DeleteTaskModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        taskTitle={deletingTask?.title || ''}
        loading={deleting}
      />
    </div>
  );
}
