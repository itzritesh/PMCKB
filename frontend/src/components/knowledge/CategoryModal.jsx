import React, { useState, useEffect } from 'react';
import { X, Tag, Edit3, Loader2, AlertCircle, Trash2, Plus } from 'lucide-react';
import { knowledgeService } from '../../services/knowledgeService';

export default function CategoryModal({
  isOpen,
  onClose,
  categories = [],
  onCategoriesChanged,
}) {
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    setNewCatName('');
    setNewCatDesc('');
    setError(null);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    setError(null);
    if (!newCatName.trim()) return;

    setCreating(true);
    try {
      await knowledgeService.createCategory({
        name: newCatName.trim(),
        description: newCatDesc.trim(),
      });
      setNewCatName('');
      setNewCatDesc('');
      onCategoriesChanged();
    } catch (err) {
      setError(err.message || 'Failed to create category.');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteCategory = async (catId) => {
    setError(null);
    setDeletingId(catId);
    try {
      await knowledgeService.deleteCategory(catId);
      onCategoriesChanged();
    } catch (err) {
      setError(err.message || 'Failed to delete category.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white max-w-lg w-full rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-6">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-pink-50 border border-pink-100 flex items-center justify-center text-pink-600">
            <Tag className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Manage KB Categories</h3>
            <p className="text-xs text-slate-500">Group articles by technical topic, system, or department.</p>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-xs text-rose-700 font-medium">{error}</div>
          </div>
        )}

        {/* Create Category Form */}
        <form onSubmit={handleCreateCategory} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
          <span className="text-xs font-bold text-slate-800 block">Create New Category</span>
          <div>
            <input
              type="text"
              required
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder="Category Name (e.g. DevOps & Infrastructure)"
              className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-pink-500"
            />
          </div>
          <div>
            <input
              type="text"
              value={newCatDesc}
              onChange={(e) => setNewCatDesc(e.target.value)}
              placeholder="Brief description (optional)..."
              className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-pink-500"
            />
          </div>
          <button
            type="submit"
            disabled={creating || !newCatName.trim()}
            className="w-full py-2 px-4 rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
          >
            {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            <span>Add Category</span>
          </button>
        </form>

        {/* Existing Categories List */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
            Existing Categories ({categories.length})
          </span>

          {categories.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">No categories created yet.</p>
          ) : (
            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {categories.map((c) => (
                <div
                  key={c.id}
                  className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-slate-900 block truncate">{c.name}</span>
                    <span className="text-[11px] text-slate-400 block truncate">
                      {c.article_count} {c.article_count === 1 ? 'article' : 'articles'}
                      {c.description ? ` • ${c.description}` : ''}
                    </span>
                  </div>

                  <button
                    onClick={() => handleDeleteCategory(c.id)}
                    disabled={deletingId === c.id}
                    title="Delete Category"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {deletingId === c.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
