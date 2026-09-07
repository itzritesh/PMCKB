import React, { useState, useEffect } from 'react';
import { X, Tag, Edit3, Loader2, AlertCircle, Trash2, Plus, CheckCircle2 } from 'lucide-react';
import { knowledgeService } from '../../services/knowledgeService';

export default function CategoryModal({
  isOpen,
  onClose,
  categories = [],
  onCategoriesChanged,
  onChanged,
}) {
  const [localCategories, setLocalCategories] = useState(categories);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [creating, setCreating] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Synchronize with passed categories or load directly
  const loadCategories = async () => {
    try {
      setLoadingList(true);
      const res = await knowledgeService.getCategories();
      const list = res?.data?.categories || res?.categories || res?.data || [];
      if (Array.isArray(list)) {
        setLocalCategories(list);
      }
    } catch (err) {
      console.warn('Failed to refresh categories:', err);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setNewCatName('');
      setNewCatDesc('');
      setError(null);
      setSuccessMsg(null);
      if (categories && categories.length > 0) {
        setLocalCategories(categories);
      }
      loadCategories();
    }
  }, [isOpen]);

  useEffect(() => {
    if (categories && categories.length > 0) {
      setLocalCategories(categories);
    }
  }, [categories]);

  if (!isOpen) return null;

  const notifyParent = () => {
    if (typeof onCategoriesChanged === 'function') onCategoriesChanged();
    if (typeof onChanged === 'function') onChanged();
  };

  // Client-side duplicate check (case-insensitive)
  const trimmedName = newCatName.trim();
  const isDuplicate = Boolean(
    trimmedName &&
      localCategories.some(
        (c) => c.name && c.name.trim().toLowerCase() === trimmedName.toLowerCase()
      )
  );

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!trimmedName) {
      setError('Please enter a category name.');
      return;
    }

    if (isDuplicate) {
      setError(`A category named "${trimmedName}" already exists. Please choose a different name.`);
      return;
    }

    if (creating) return;

    setCreating(true);
    try {
      const res = await knowledgeService.createCategory({
        name: trimmedName,
        description: newCatDesc.trim() || undefined,
      });

      const newCategory = res?.data?.category || res?.category || res?.data;
      setNewCatName('');
      setNewCatDesc('');
      setError(null);
      setSuccessMsg(`Category "${trimmedName}" created successfully.`);
      setTimeout(() => setSuccessMsg(null), 3000);

      // Refresh list
      await loadCategories();
      notifyParent();
    } catch (err) {
      console.warn('Category creation error:', err);
      if (err.status === 409) {
        setError(`A category named "${trimmedName}" already exists. Please choose a unique name.`);
      } else {
        setError(err.message || 'Failed to create category.');
      }
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteCategory = async (catId) => {
    setError(null);
    setSuccessMsg(null);
    setDeletingId(catId);
    try {
      await knowledgeService.deleteCategory(catId);
      await loadCategories();
      notifyParent();
    } catch (err) {
      console.warn('Category deletion error:', err);
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

        {successMsg && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-700 font-medium">{successMsg}</div>
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
              onChange={(e) => {
                setNewCatName(e.target.value);
                if (error) setError(null);
                if (successMsg) setSuccessMsg(null);
              }}
              placeholder="Category Name (e.g. DevOps & Infrastructure)"
              className={`w-full px-3.5 py-2 bg-white border rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition-colors ${
                isDuplicate
                  ? 'border-amber-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-400'
                  : 'border-slate-200 focus:border-pink-500 focus:ring-1 focus:ring-pink-400'
              }`}
            />
            {isDuplicate && (
              <p className="text-[11px] text-amber-600 font-medium mt-1">
                A category named "{trimmedName}" already exists.
              </p>
            )}
          </div>
          <div>
            <input
              type="text"
              value={newCatDesc}
              onChange={(e) => {
                setNewCatDesc(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Brief description (optional)..."
              className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-pink-500"
            />
          </div>
          <button
            type="submit"
            disabled={creating || !trimmedName || isDuplicate}
            className="w-full py-2.5 px-4 rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            <span>Add Category</span>
          </button>
        </form>

        {/* Existing Categories List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Existing Categories ({localCategories.length})
            </span>
            {loadingList && <Loader2 className="w-3 h-3 text-slate-400 animate-spin" />}
          </div>

          {localCategories.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">No categories created yet.</p>
          ) : (
            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {localCategories.map((c) => (
                <div
                  key={c.id}
                  className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-3 hover:border-slate-300 transition-colors"
                >
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-slate-900 block truncate">{c.name}</span>
                    <span className="text-[11px] text-slate-400 block truncate">
                      {c.article_count || 0} {(c.article_count === 1) ? 'article' : 'articles'}
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
