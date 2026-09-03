import React, { useState, useEffect } from 'react';
import { X, FolderPlus, Edit3, Loader2, AlertCircle } from 'lucide-react';

export default function ProjectModal({ isOpen, onClose, onSubmit, project = null, loading = false }) {
  const isEditing = !!project;
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('planning');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (project) {
      setName(project.name || '');
      setDescription(project.description || '');
      setStatus(project.status || 'planning');
    } else {
      setName('');
      setDescription('');
      setStatus('planning');
    }
    setError(null);
  }, [project, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Project name is required.');
      return;
    }

    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim(),
        status,
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save project.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="glass-card max-w-lg w-full rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Title */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            {isEditing ? <Edit3 className="w-5 h-5" /> : <FolderPlus className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">
              {isEditing ? 'Edit Project' : 'Create New Project'}
            </h3>
            <p className="text-xs text-slate-400">
              {isEditing ? 'Update project details and execution status.' : 'Organize your work, meetings, and notes.'}
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="text-xs text-rose-300 font-medium">{error}</div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Project Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Website Redesign v2"
              className="w-full px-3.5 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Description <span className="text-slate-500">(optional)</span>
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the project goals, scope, and deliverables..."
              className="w-full px-3.5 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
            >
              <option value="planning" className="bg-slate-900 text-white">Planning</option>
              <option value="in_progress" className="bg-slate-900 text-white">In Progress</option>
              <option value="completed" className="bg-slate-900 text-white">Completed</option>
              <option value="on_hold" className="bg-slate-900 text-white">On Hold</option>
            </select>
          </div>

          <div className="pt-3 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-medium transition-all shadow-md shadow-indigo-600/25 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isEditing ? 'Save Changes' : 'Create Project'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
