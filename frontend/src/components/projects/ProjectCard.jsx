import React from 'react';
import { Link } from 'react-router-dom';
import { FolderGit2, Clock, Edit3, Trash2, ArrowUpRight } from 'lucide-react';
import StatusPill from './StatusPill';

export default function ProjectCard({ project, onEdit, onDelete }) {
  const formattedDate = new Date(project.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="bg-white rounded-2xl p-5 flex flex-col justify-between border border-slate-200 shadow-xs hover:border-slate-300 hover:shadow-md transition-all group">
      <div>
        {/* Header: Icon & Status */}
        <div className="flex items-center justify-between mb-3.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 group-hover:scale-105 transition-transform">
            <FolderGit2 className="w-5 h-5" />
          </div>
          <StatusPill status={project.status} />
        </div>

        {/* Title */}
        <Link
          to={`/projects/${project.id}`}
          className="block text-base font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors mb-2 line-clamp-1"
        >
          {project.name}
        </Link>

        {/* Description */}
        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4 min-h-[32px]">
          {project.description || 'No description provided.'}
        </p>
      </div>

      {/* Footer: Date & Actions */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-1 text-slate-400">
          <Clock className="w-3.5 h-3.5" />
          <span>{formattedDate}</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(project)}
            title="Edit Project"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          {onDelete && (
            <button
              onClick={() => onDelete(project)}
              title="Delete Project (Leader only)"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          <Link
            to={`/projects/${project.id}`}
            title="View Details"
            className="p-1.5 rounded-lg text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 transition-colors"
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
