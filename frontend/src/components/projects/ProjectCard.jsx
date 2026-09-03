import React from 'react';
import { Link } from 'react-router-dom';
import { FolderGit2, Calendar, Clock, Edit3, Trash2, ArrowUpRight } from 'lucide-react';
import StatusPill from './StatusPill';

export default function ProjectCard({ project, onEdit, onDelete }) {
  const formattedDate = new Date(project.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="glass-card glass-card-hover rounded-2xl p-5 flex flex-col justify-between border border-slate-800/80 group">
      <div>
        {/* Header: Icon & Status */}
        <div className="flex items-center justify-between mb-3.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform">
            <FolderGit2 className="w-5 h-5" />
          </div>
          <StatusPill status={project.status} />
        </div>

        {/* Title */}
        <Link
          to={`/projects/${project.id}`}
          className="block text-base font-semibold text-white group-hover:text-indigo-300 transition-colors mb-2 line-clamp-1"
        >
          {project.name}
        </Link>

        {/* Description */}
        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4 min-h-[32px]">
          {project.description || 'No description provided.'}
        </p>
      </div>

      {/* Footer: Date & Actions */}
      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          <span>{formattedDate}</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(project)}
            title="Edit Project"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(project)}
            title="Delete Project"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <Link
            to={`/projects/${project.id}`}
            title="View Details"
            className="p-1.5 rounded-lg text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 transition-colors"
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
