import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  User,
  Tag,
  Edit2,
  Trash2,
  BookOpen,
  Loader2,
  AlertCircle,
  Share2,
  Check
} from 'lucide-react';
import { knowledgeService } from '../services/knowledgeService';
import { useAuth } from '../context/AuthContext';
import { useTeam } from '../context/TeamContext';
import ArticleModal from '../components/knowledge/ArticleModal';
import DeleteArticleModal from '../components/knowledge/DeleteArticleModal';

export default function ArticleDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isLeader } = useTeam();

  const [article, setArticle] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchArticleAndCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const [artRes, catRes] = await Promise.all([
        knowledgeService.getArticle(id),
        knowledgeService.getCategories(),
      ]);
      const art = artRes?.data?.article || artRes?.article || artRes?.data;
      const cList = catRes?.data?.categories || catRes?.categories || catRes?.data || [];
      setArticle(art || null);
      setCategories(Array.isArray(cList) ? cList.filter(Boolean) : []);
    } catch (err) {
      console.error('Failed to load article:', err);
      setError(err.message || 'Failed to load article details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchArticleAndCategories();
    }
  }, [id]);

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConfirmDelete = async () => {
    setDeleteLoading(true);
    try {
      await knowledgeService.deleteArticle(id);
      setIsDeleteModalOpen(false);
      navigate('/knowledge');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete article');
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] py-20 flex flex-col items-center justify-center bg-slate-50 space-y-3">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-xs text-slate-500 font-medium">Loading documentation article...</p>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-[calc(100vh-4rem)] py-16 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="max-w-2xl mx-auto bg-white rounded-3xl p-8 border border-slate-200 shadow-sm text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Article Unavailable</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {error || 'The requested article could not be found or you do not have permission to view it.'}
          </p>
          <div className="pt-2">
            <button
              onClick={() => navigate('/knowledge')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Knowledge Base</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isAuthor = user && user.id === article.author_id;
  const formattedCreated = article.created_at
    ? new Date(article.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '';
  const formattedUpdated = article.updated_at
    ? new Date(article.updated_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '';

  return (
    <div className="min-h-[calc(100vh-4rem)] py-10 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top Navigation Bar */}
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={() => navigate('/knowledge')}
            className="inline-flex items-center gap-2 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Knowledge Base</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 text-xs font-medium transition-colors cursor-pointer"
              title="Copy link to clipboard"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Share'}</span>
            </button>

            {isLeader && (
              <>
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-indigo-600 hover:bg-slate-50 text-xs font-medium transition-colors cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 text-xs font-medium transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Article Document Card */}
        <article className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xs space-y-6">
          {/* Metadata Header */}
          <div className="space-y-3 pb-6 border-b border-slate-100">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                <Tag className="w-3 h-3" />
                {article.category_name || 'Uncategorized'}
              </span>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                  article.status === 'published'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}
              >
                {article.status === 'published' ? 'Published' : 'Draft'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
              {article.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>Written by <strong className="text-slate-700">{article.author_name || 'Author'}</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Created {formattedCreated}</span>
              </div>
              {formattedUpdated && formattedUpdated !== formattedCreated && (
                <div className="flex items-center gap-1.5 text-slate-400">
                  <span>(Updated {formattedUpdated})</span>
                </div>
              )}
            </div>
          </div>

          {/* Article Content Body */}
          <div className="text-slate-800 text-sm sm:text-base leading-relaxed whitespace-pre-wrap font-normal space-y-4">
            {article.content}
          </div>
        </article>
      </div>

      {/* Edit Article Modal */}
      <ArticleModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSaved={() => {
          setIsEditModalOpen(false);
          fetchArticleAndCategories();
        }}
        article={article}
        categories={categories}
      />

      {/* Delete Article Modal */}
      <DeleteArticleModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        articleTitle={article?.title || ''}
        loading={deleteLoading}
      />
    </div>
  );
}
