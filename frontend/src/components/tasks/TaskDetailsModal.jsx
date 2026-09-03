import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  MessageSquare,
  Send,
  Loader2,
  AlertCircle,
  Calendar,
  User,
  Clock,
  Edit2,
  Trash2,
  Check,
  CornerDownLeft,
  FolderGit2,
  AlertTriangle,
} from 'lucide-react';
import { commentService } from '../../services/commentService';
import { useAuth } from '../../context/AuthContext';
import PriorityBadge from './PriorityBadge';
import TaskStatusPill from './TaskStatusPill';

export default function TaskDetailsModal({
  isOpen,
  onClose,
  task,
  onEditTask,
}) {
  const { user: currentUser } = useAuth();
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentsError, setCommentsError] = useState(null);

  // New comment state
  const [newComment, setNewComment] = useState('');
  const [postingComment, setPostingComment] = useState(false);
  const [postError, setPostError] = useState(null);

  // Editing comment state: { id: number, text: string } | null
  const [editingComment, setEditingComment] = useState(null);
  const [updatingComment, setUpdatingComment] = useState(false);

  // Deleting comment state
  const [deletingCommentId, setDeletingCommentId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const commentsEndRef = useRef(null);

  const fetchComments = async () => {
    if (!task) return;
    setLoadingComments(true);
    setCommentsError(null);
    try {
      const res = await commentService.getComments(task.id);
      setComments(res.data.comments || []);
    } catch (err) {
      setCommentsError(err.message || 'Failed to load comments.');
    } finally {
      setLoadingComments(false);
    }
  };

  useEffect(() => {
    if (isOpen && task) {
      fetchComments();
      setNewComment('');
      setPostError(null);
      setEditingComment(null);
      setDeletingCommentId(null);
    }
  }, [isOpen, task?.id]);

  if (!isOpen || !task) return null;

  const handlePostComment = async (e) => {
    if (e) e.preventDefault();
    if (!newComment.trim() || postingComment) return;

    setPostingComment(true);
    setPostError(null);
    try {
      const res = await commentService.createComment(task.id, newComment.trim());
      setComments((prev) => [...prev, res.data.comment]);
      setNewComment('');
      // Scroll to bottom
      setTimeout(() => {
        commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err) {
      setPostError(err.message || 'Failed to post comment.');
    } finally {
      setPostingComment(false);
    }
  };

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handlePostComment();
    }
  };

  const handleSaveEditComment = async (commentId) => {
    if (!editingComment?.text.trim()) return;
    setUpdatingComment(true);
    try {
      const res = await commentService.updateComment(commentId, editingComment.text.trim());
      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? res.data.comment : c))
      );
      setEditingComment(null);
    } catch (err) {
      alert(err.message || 'Failed to update comment.');
    } finally {
      setUpdatingComment(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    setIsDeleting(true);
    try {
      await commentService.deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      setDeletingCommentId(null);
    } catch (err) {
      alert(err.message || 'Failed to delete comment.');
    } finally {
      setIsDeleting(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const formatTimestamp = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isOverdue =
    task.due_date &&
    new Date(task.due_date).getTime() < Date.now() &&
    task.status !== 'completed';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-card max-w-2xl w-full rounded-3xl border border-slate-800 shadow-2xl relative flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-800/80 bg-slate-900/40 shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5 flex-1 pr-6">
              <div className="flex flex-wrap items-center gap-2">
                <TaskStatusPill status={task.status} />
                <PriorityBadge priority={task.priority} />
                {task.project_name && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    <FolderGit2 className="w-3 h-3" />
                    {task.project_name}
                  </span>
                )}
                {isOverdue && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse">
                    <AlertTriangle className="w-3 h-3" />
                    Overdue
                  </span>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                {task.title}
              </h2>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Description */}
          {task.description && (
            <p className="mt-3 text-xs sm:text-sm text-slate-300 leading-relaxed bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800/60">
              {task.description}
            </p>
          )}

          {/* Metadata Row */}
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs text-slate-400">
            <div className="flex items-center gap-2 bg-slate-900/40 px-3 py-2 rounded-xl border border-slate-800/40">
              <User className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <div className="truncate">
                <span className="text-[10px] uppercase tracking-wider text-slate-500 block">Assignee</span>
                <span className="font-medium text-slate-200 truncate">
                  {task.assignee_name || 'Unassigned'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-slate-900/40 px-3 py-2 rounded-xl border border-slate-800/40">
              <Calendar className={`w-3.5 h-3.5 ${isOverdue ? 'text-rose-400' : 'text-slate-400'} shrink-0`} />
              <div className="truncate">
                <span className="text-[10px] uppercase tracking-wider text-slate-500 block">Deadline</span>
                <span className={`font-medium truncate ${isOverdue ? 'text-rose-400' : 'text-slate-200'}`}>
                  {task.due_date ? formatTimestamp(task.due_date) : 'No deadline'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-slate-900/40 px-3 py-2 rounded-xl border border-slate-800/40 col-span-2 sm:col-span-1">
              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <div className="truncate">
                <span className="text-[10px] uppercase tracking-wider text-slate-500 block">Created</span>
                <span className="font-medium text-slate-200 truncate">
                  {formatTimestamp(task.created_at)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Discussion Section Header */}
        <div className="px-6 py-2.5 bg-slate-900/70 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Discussion & Activity ({comments.length})
            </h3>
          </div>
          <span className="text-[11px] text-slate-500">
            Visible to all project members
          </span>
        </div>

        {/* Comments Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Loading */}
          {loadingComments && (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
              <span className="text-xs">Loading discussion thread...</span>
            </div>
          )}

          {/* Error */}
          {commentsError && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="text-xs text-rose-300 font-medium">{commentsError}</div>
            </div>
          )}

          {/* Empty State */}
          {!loadingComments && !commentsError && comments.length === 0 && (
            <div className="py-12 text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
                <MessageSquare className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-white">No comments yet</p>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Be the first to share an update, discuss blockers, or document progress on this deliverable.
              </p>
            </div>
          )}

          {/* Comments List */}
          {!loadingComments && comments.length > 0 && (
            <div className="space-y-4">
              {comments.map((c) => {
                const isAuthor = currentUser?.id === c.user_id;
                const isBeingEdited = editingComment?.id === c.id;
                const isBeingDeleted = deletingCommentId === c.id;
                const isEdited = c.updated_at && c.updated_at !== c.created_at;

                return (
                  <div
                    key={c.id}
                    className={`rounded-2xl p-4 border transition-all ${
                      isAuthor
                        ? 'bg-indigo-950/20 border-indigo-500/30'
                        : 'bg-slate-900/60 border-slate-800'
                    }`}
                  >
                    {/* Comment Top bar */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-xs font-bold text-white flex items-center justify-center shrink-0 shadow-sm">
                          {getInitials(c.user_name)}
                        </div>
                        <div>
                          <span className="text-xs font-bold text-white mr-2">
                            {c.user_name}
                          </span>
                          {isAuthor && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                              You
                            </span>
                          )}
                          <span className="text-[11px] text-slate-500 ml-2">
                            {formatTimestamp(c.created_at)}
                            {isEdited && <span className="ml-1 text-slate-500 italic">(edited)</span>}
                          </span>
                        </div>
                      </div>

                      {/* Author Controls */}
                      {isAuthor && !isBeingEdited && !isBeingDeleted && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() =>
                              setEditingComment({ id: c.id, text: c.comment })
                            }
                            title="Edit Comment"
                            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingCommentId(c.id)}
                            title="Delete Comment"
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Delete Confirmation Box */}
                    {isBeingDeleted && (
                      <div className="mt-2 p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 flex items-center justify-between gap-3 animate-in fade-in">
                        <span className="text-xs text-rose-200">
                          Delete this comment?
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setDeletingCommentId(null)}
                            disabled={isDeleting}
                            className="px-2 py-1 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800 cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleDeleteComment(c.id)}
                            disabled={isDeleting}
                            className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium flex items-center gap-1 cursor-pointer"
                          >
                            {isDeleting && <Loader2 className="w-3 h-3 animate-spin" />}
                            Delete
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Edit Form or Text View */}
                    {isBeingEdited ? (
                      <div className="mt-2 space-y-2">
                        <textarea
                          rows={2}
                          value={editingComment.text}
                          onChange={(e) =>
                            setEditingComment({
                              ...editingComment,
                              text: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 bg-slate-900 border border-indigo-500/50 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                        />
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setEditingComment(null)}
                            disabled={updatingComment}
                            className="px-2.5 py-1 rounded-lg text-xs font-medium text-slate-400 hover:text-white cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveEditComment(c.id)}
                            disabled={updatingComment || !editingComment.text.trim()}
                            className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center gap-1 cursor-pointer disabled:opacity-50"
                          >
                            {updatingComment && <Loader2 className="w-3 h-3 animate-spin" />}
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      !isBeingDeleted && (
                        <p className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-wrap pl-9">
                          {c.comment}
                        </p>
                      )
                    )}
                  </div>
                );
              })}
              <div ref={commentsEndRef} />
            </div>
          )}
        </div>

        {/* Comment Composer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/70 shrink-0">
          {postError && (
            <div className="mb-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-2.5 flex items-start gap-2 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{postError}</span>
            </div>
          )}

          <form onSubmit={handlePostComment} className="space-y-2">
            <div className="relative">
              <textarea
                rows={2}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Write a comment or status update... (Press Ctrl+Enter to send)"
                className="w-full px-4 py-3 bg-slate-900/90 border border-slate-800 rounded-2xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors resize-none pr-24"
              />

              <div className="absolute right-2.5 bottom-3.5 flex items-center gap-1.5">
                <button
                  type="submit"
                  disabled={postingComment || !newComment.trim()}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/20 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {postingComment ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>Post</span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
              <span>Shortcut: <strong>Ctrl + Enter</strong></span>
              <span>{newComment.length} / 5000</span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
