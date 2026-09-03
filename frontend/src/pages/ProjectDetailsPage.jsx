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
} from 'lucide-react';
import { projectService } from '../services/projectService';
import StatusPill from '../components/projects/StatusPill';
import ProjectModal from '../components/projects/ProjectModal';
import DeleteConfirmModal from '../components/projects/DeleteConfirmModal';

export default function ProjectDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchProject = async () => {
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

  useEffect(() => {
    fetchProject();
  }, [id]);

  const handleUpdate = async (formData) => {
    setSubmitting(true);
    try {
      const res = await projectService.updateProject(id, formData);
      setProject(res.data.project);
      setEditModalOpen(false);
    } catch (err) {
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await projectService.deleteProject(id);
      navigate('/projects', { replace: true });
    } catch (err) {
      alert(err.message || 'Failed to delete project.');
      setDeleting(false);
    }
  };

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
      <div className="max-w-5xl mx-auto space-y-8">
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

        {/* Modules Linked to this Project (Future Phases 4, 5, 6) */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-white">Project Workspaces</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass-card rounded-2xl p-5 border border-slate-800 opacity-80">
              <div className="flex items-center gap-2 mb-2 text-purple-400">
                <Users className="w-4 h-4" />
                <h4 className="text-sm font-semibold text-white">Project Meetings</h4>
              </div>
              <p className="text-xs text-slate-400">
                Agendas and minutes connected to this project will be available in Phase 4.
              </p>
            </div>
            <div className="glass-card rounded-2xl p-5 border border-slate-800 opacity-80">
              <div className="flex items-center gap-2 mb-2 text-emerald-400">
                <Calendar className="w-4 h-4" />
                <h4 className="text-sm font-semibold text-white">Milestone Calendar</h4>
              </div>
              <p className="text-xs text-slate-400">
                Project deadlines and sprint scheduling will sync in Phase 5.
              </p>
            </div>
            <div className="glass-card rounded-2xl p-5 border border-slate-800 opacity-80">
              <div className="flex items-center gap-2 mb-2 text-amber-400">
                <BookOpen className="w-4 h-4" />
                <h4 className="text-sm font-semibold text-white">Knowledge Docs</h4>
              </div>
              <p className="text-xs text-slate-400">
                Project design documents, specs, and wikis will link in Phase 6.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <ProjectModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSubmit={handleUpdate}
        project={project}
        loading={submitting}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        projectName={project.name}
        loading={deleting}
      />
    </div>
  );
}
