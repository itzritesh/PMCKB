import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Search,
  Plus,
  Tag,
  FolderPlus,
  ArrowRight,
  Edit2,
  Trash2,
  Eye,
  Loader2,
  Calendar,
  User,
  Filter,
  X,
  FileText
} from 'lucide-react';
import { knowledgeService } from '../services/knowledgeService';
import { useAuth } from '../context/AuthContext';
import { useTeam } from '../context/TeamContext';
import ArticleModal from '../components/knowledge/ArticleModal';
import CategoryModal from '../components/knowledge/CategoryModal';
import DeleteArticleModal from '../components/knowledge/DeleteArticleModal';

export default function KnowledgePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentTeam, isLeader } = useTeam();

  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals
  const [isArticleModalOpen, setIsArticleModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [deletingArticle, setDeletingArticle] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Fetch data
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [catRes, artRes] = await Promise.all([
        knowledgeService.getCategories(),
        knowledgeService.getArticles({
          search: searchTerm || undefined,
          category_id: selectedCategory !== 'all' ? selectedCategory : undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
        }),
      ]);
      const cList = catRes?.data?.categories || catRes?.categories || catRes?.data || [];
      const aList = artRes?.data?.articles || artRes?.articles || artRes?.data || [];
      setCategories(Array.isArray(cList) ? cList.filter(Boolean) : []);
      setArticles(Array.isArray(aList) ? aList.filter(Boolean) : []);
    } catch (err) {
      console.error('Failed to load knowledge base data:', err);
      setError(err.message || 'Failed to load knowledge base articles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedCategory, statusFilter, currentTeam?.id]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchData();
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setStatusFilter('all');
  };

  // Article Modal handlers
  const handleOpenCreateArticle = () => {
    setEditingArticle(null);
    setIsArticleModalOpen(true);
  };

  const handleOpenEditArticle = (art, e) => {
    e.stopPropagation();
    setEditingArticle(art);
    setIsArticleModalOpen(true);
  };

  const handleArticleSaved = () => {
    setIsArticleModalOpen(false);
    setEditingArticle(null);
    fetchData();
  };

  const handleArticleSubmit = async (formData) => {
    if (editingArticle) {
      await knowledgeService.updateArticle(editingArticle.id, formData);
    } else {
      await knowledgeService.createArticle(formData);
    }
    setIsArticleModalOpen(false);
    setEditingArticle(null);
    fetchData();
  };

  // Delete Article handlers
  const handleOpenDeleteArticle = (art, e) => {
    e.stopPropagation();
    setDeletingArticle(art);
  };

  const handleConfirmDelete = async () => {
    if (!deletingArticle) return;
    setDeleteLoading(true);
    try {
      await knowledgeService.deleteArticle(deletingArticle.id);
      setDeletingArticle(null);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete article');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] py-10 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Knowledge Base & Documentation
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                Active System
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500">
              Centralized repository for technical specifications, product architecture guides, and internal SOPs.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {isLeader && (
              <button
                onClick={() => setIsCategoryModalOpen(true)}
                title="Manage Categories (Leader only)"
                className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-medium transition-all shadow-2xs cursor-pointer"
              >
                <FolderPlus className="w-4 h-4 text-slate-500" />
                <span>Categories</span>
              </button>
            )}
            <button
              onClick={handleOpenCreateArticle}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs sm:text-sm font-medium transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Article</span>
            </button>
          </div>
        </div>

        {/* Controls Bar: Search & Category Chips */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <form onSubmit={handleSearchSubmit} className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search documentation, wikis, content..."
                className="w-full pl-10 pr-20 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1.5 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
              >
                Search
              </button>
            </form>

            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Filter articles by status"
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:border-indigo-500"
              >
                <option value="all">All Statuses</option>
                <option value="published">Published</option>
                <option value="draft">Drafts Only</option>
              </select>

              {(searchTerm || selectedCategory !== 'all' || statusFilter !== 'all') && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium transition-colors cursor-pointer"
                  title="Clear all filters"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                selectedCategory === 'all'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              All Categories
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedCategory(c.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  selectedCategory === c.id
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span>{c.name}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  selectedCategory === c.id ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-200 text-slate-600'
                }`}>
                  {c.article_count || 0}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Error notification */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm">
            {error}
          </div>
        )}

        {/* Content Area */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            <p className="text-xs text-slate-500 font-medium">Loading knowledge base articles...</p>
          </div>
        ) : articles.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <BookOpen className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-800">No articles found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {searchTerm || selectedCategory !== 'all' || statusFilter !== 'all'
                  ? 'No articles match your current filter criteria. Try resetting your search filters.'
                  : 'Start building your organizational documentation and knowledge base.'}
              </p>
            </div>
            <div className="flex items-center justify-center gap-3">
              {(searchTerm || selectedCategory !== 'all' || statusFilter !== 'all') ? (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-xl transition-colors cursor-pointer"
                >
                  Clear Filters
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleOpenCreateArticle}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-xl transition-colors cursor-pointer"
                >
                  Create First Article
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Articles & Documentation ({articles.length})
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {articles.map((item) => {
                const isAuthor = user && user.id === item.author_id;
                const formattedDate = item.created_at
                  ? new Date(item.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : '';

                return (
                  <div
                    key={item.id}
                    onClick={() => navigate(`/knowledge/${item.id}`)}
                    className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:border-indigo-300 hover:shadow-md transition-all flex flex-col justify-between group cursor-pointer"
                  >
                    <div>
                      {/* Top Badges & Actions */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                            <Tag className="w-2.5 h-2.5" />
                            {item.category_name || 'Uncategorized'}
                          </span>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                              item.status === 'published'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                          >
                            {item.status === 'published' ? 'Published' : 'Draft'}
                          </span>
                        </div>

                        {isAuthor && (
                          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={(e) => handleOpenEditArticle(item, e)}
                              className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer"
                              title="Edit Article"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleOpenDeleteArticle(item, e)}
                              className="p-1 rounded-lg hover:bg-rose-50 text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
                              title="Delete Article"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Title */}
                      <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2 mb-2">
                        {item.title}
                      </h4>

                      {/* Snippet */}
                      <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed mb-4">
                        {item.content}
                      </p>
                    </div>

                    {/* Footer */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                      <div className="flex items-center gap-1 truncate max-w-[60%]">
                        <User className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{item.author_name || 'Anonymous'}</span>
                      </div>
                      <div className="flex items-center gap-1 text-indigo-600 font-medium group-hover:translate-x-0.5 transition-transform">
                        <span>Read</span>
                        <ArrowRight className="w-3 h-3" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Article Creation / Edit Modal */}
      <ArticleModal
        isOpen={isArticleModalOpen}
        onClose={() => {
          setIsArticleModalOpen(false);
          setEditingArticle(null);
        }}
        onSubmit={handleArticleSubmit}
        onSaved={handleArticleSaved}
        article={editingArticle}
        categories={categories}
      />

      {/* Category Manager Modal */}
      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        categories={categories}
        onCategoriesChanged={fetchData}
        onChanged={fetchData}
        isLeader={isLeader}
      />

      {/* Delete Article Confirmation Modal */}
      <DeleteArticleModal
        isOpen={!!deletingArticle}
        onClose={() => setDeletingArticle(null)}
        onConfirm={handleConfirmDelete}
        articleTitle={deletingArticle?.title || ''}
        loading={deleteLoading}
      />
    </div>
  );
}
