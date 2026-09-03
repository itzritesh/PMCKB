import React, { useState, useEffect } from 'react';
import {
  FolderGit2,
  FolderPlus,
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { projectService } from '../services/projectService';
import ProjectCard from '../components/projects/ProjectCard';
import ProjectModal from '../components/projects/ProjectModal';
import DeleteConfirmModal from '../components/projects/DeleteConfirmModal';

const STATUS_FILTERS = [
  { key: 'all', label: 'All Projects' },
  { key: 'planning', label: 'Planning' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'completed', label: 'Completed' },
  { key: 'on_hold', label: 'On Hold' },
];

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingProject, setDeletingProject] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await projectService.getProjects();
      setProjects(res.data.projects || []);
    } catch (err) {
      setError(err.message || 'Failed to load projects.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingProject(null);
    setModalOpen(true);
  };

  const handleOpenEditModal = (project) => {
    setEditingProject(project);
    setModalOpen(true);
  };

  const handleSaveProject = async (formData) => {
    setSubmitting(true);
    try {
      if (editingProject) {
        const res = await projectService.updateProject(editingProject.id, formData);
        setProjects((prev) =>
          prev.map((p) => (p.id === editingProject.id ? res.data.project : p))
        );
      } else {
        const res = await projectService.createProject(formData);
        setProjects((prev) => [res.data.project, ...prev]);
      }
      setModalOpen(false);
    } catch (err) {
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenDeleteModal = (project) => {
    setDeletingProject(project);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingProject) return;
    setDeleting(true);
    try {
      await projectService.deleteProject(deletingProject.id);
      setProjects((prev) => prev.filter((p) => p.id !== deletingProject.id));
      setDeleteModalOpen(false);
    } catch (err) {
      alert(err.message || 'Failed to delete project.');
    } finally {
      setDeleting(false);
      setDeletingProject(null);
    }
  };

  // Filtered projects by search and status
  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (project.description &&
        project.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus =
      selectedStatus === 'all' || project.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-[calc(100vh-4rem)] py-10 px-4 sm:px-6 lg:px-8 bg-radial from-indigo-950/20 via-slate-950 to-slate-950">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Project Management
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                {projects.length} {projects.length === 1 ? 'Project' : 'Projects'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400">
              Create and manage projects with scoped isolation, status workflows, and team visibility.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchProjects}
              disabled={loading}
              title="Refresh project list"
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs sm:text-sm font-medium transition-all shadow-lg shadow-indigo-600/30 cursor-pointer"
            >
              <FolderPlus className="w-4 h-4" />
              <span>New Project</span>
            </button>
          </div>
        </div>

        {/* Controls Bar: Search & Status Filters */}
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects by name or description..."
              className="w-full pl-10 pr-4 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
            />
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
            {STATUS_FILTERS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setSelectedStatus(tab.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  selectedStatus === tab.key
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-5 flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-rose-300">Unable to Load Projects</h4>
                <p className="text-xs text-rose-200/80 mt-1">{error}</p>
              </div>
            </div>
            <button
              onClick={fetchProjects}
              className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading Skeleton */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="glass-card rounded-2xl p-6 border border-slate-800 animate-pulse space-y-4"
              >
                <div className="flex justify-between items-center">
                  <div className="w-10 h-10 rounded-xl bg-slate-800" />
                  <div className="w-16 h-5 rounded-full bg-slate-800" />
                </div>
                <div className="h-5 w-3/4 bg-slate-800 rounded" />
                <div className="h-3 w-full bg-slate-800/60 rounded" />
                <div className="h-3 w-2/3 bg-slate-800/60 rounded" />
                <div className="pt-3 border-t border-slate-800 flex justify-between">
                  <div className="h-3 w-20 bg-slate-800 rounded" />
                  <div className="h-3 w-12 bg-slate-800 rounded" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty States */}
        {!loading && !error && projects.length === 0 && (
          <div className="glass-card rounded-3xl p-12 border border-slate-800/80 text-center max-w-lg mx-auto space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/10">
              <FolderGit2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white">No Projects Yet</h3>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
              Get started by creating your first project. All project data is isolated to your user account and saved in PostgreSQL.
            </p>
            <div className="pt-2">
              <button
                onClick={handleOpenCreateModal}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-medium transition-all shadow-lg shadow-indigo-600/25 cursor-pointer"
              >
                <FolderPlus className="w-4 h-4" />
                <span>Create Your First Project</span>
              </button>
            </div>
          </div>
        )}

        {/* Filtered Empty State */}
        {!loading && !error && projects.length > 0 && filteredProjects.length === 0 && (
          <div className="glass-card rounded-2xl p-10 border border-slate-800 text-center space-y-3">
            <Filter className="w-8 h-8 text-slate-600 mx-auto" />
            <h3 className="text-sm font-semibold text-white">No Projects Match Your Filter</h3>
            <p className="text-xs text-slate-400">
              Try adjusting your search query or switching the status filter tab.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedStatus('all');
              }}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Project Cards Grid */}
        {!loading && !error && filteredProjects.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onEdit={handleOpenEditModal}
                onDelete={handleOpenDeleteModal}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit Project Modal */}
      <ProjectModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSaveProject}
        project={editingProject}
        loading={submitting}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        projectName={deletingProject?.name || ''}
        loading={deleting}
      />
    </div>
  );
}
