import React, { useState, useEffect } from 'react';
import {
  X,
  History,
  Clock,
  User,
  Calendar,
  Tag,
  RotateCcw,
  Loader2,
  AlertCircle,
  CheckCircle2,
  FileText,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { knowledgeService } from '../../services/knowledgeService';
import { useTeam } from '../../context/TeamContext';

export default function VersionHistoryModal({
  isOpen,
  onClose,
  articleId,
  currentArticle,
  onVersionRestored,
}) {
  const { isLeader } = useTeam();

  const [versions, setVersions] = useState([]);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Restore confirmation state
  const [isConfirmingRestore, setIsConfirmingRestore] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [restoreSuccessMsg, setRestoreSuccessMsg] = useState(null);

  const fetchVersions = async () => {
    if (!articleId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await knowledgeService.getArticleVersions(articleId);
      const list = res?.data?.versions || res?.versions || [];
      setVersions(list);
      if (list.length > 0) {
        setSelectedVersion(list[0]); // Select newest by default
      }
    } catch (err) {
      console.error('Failed to fetch versions:', err);
      setError(err.response?.data?.error || err.message || 'Failed to load version history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && articleId) {
      fetchVersions();
      setIsConfirmingRestore(false);
      setRestoreSuccessMsg(null);
    }
  }, [isOpen, articleId]);

  if (!isOpen) return null;

  const handleSelectVersion = async (v) => {
    setSelectedVersion(v);
    setIsConfirmingRestore(false);
    setRestoreSuccessMsg(null);
  };

  const handleConfirmRestore = async () => {
    if (!selectedVersion) return;
    setRestoreLoading(true);
    setError(null);
    try {
      const res = await knowledgeService.restoreArticleVersion(articleId, selectedVersion.version_number);
      const data = res?.data || res;
      setRestoreSuccessMsg(`Successfully restored to Version ${selectedVersion.version_number}. Version ${data?.version_number || 'new'} created.`);
      setIsConfirmingRestore(false);
      // Refresh version list
      await fetchVersions();
      // Notify parent page to reload article
      if (typeof onVersionRestored === 'function') {
        onVersionRestored(data?.article);
      }
    } catch (err) {
      console.error('Failed to restore version:', err);
      setError(err.response?.data?.error || err.message || 'Failed to restore version.');
    } finally {
      setRestoreLoading(false);
    }
  };

  const isCurrentVersion =
    selectedVersion && versions.length > 0 && selectedVersion.version_number === versions[0].version_number;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white max-w-5xl w-full rounded-3xl border border-slate-200 shadow-2xl relative flex flex-col h-[90vh] max-h-[850px] overflow-hidden">
        {/* Modal Top Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between shrink-0 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-2xs">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  Version History
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {versions.length} {versions.length === 1 ? 'Revision' : 'Revisions'}
                </span>
              </div>
              <p className="text-xs text-slate-500 line-clamp-1">
                {currentArticle?.title || 'Article snapshots and revision log'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Alert / Success Messages */}
        {error && (
          <div className="px-6 py-2.5 bg-rose-50 border-b border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {restoreSuccessMsg && (
          <div className="px-6 py-2.5 bg-emerald-50 border-b border-emerald-200 text-emerald-700 text-xs font-medium flex items-center gap-2 animate-in slide-in-from-top-1">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{restoreSuccessMsg}</span>
          </div>
        )}

        {/* Main Split Layout: Version List (Left) & Version Snapshot Details (Right) */}
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center space-y-3 py-16">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            <p className="text-xs text-slate-500 font-medium">Loading revision history...</p>
          </div>
        ) : versions.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-2">
            <History className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">No version history records found</p>
            <p className="text-xs text-slate-500 max-w-sm">
              Version history is created automatically whenever this article is authored or updated.
            </p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Left Sidebar: Timeline List */}
            <div className="w-full md:w-80 lg:w-96 border-b md:border-b-0 md:border-r border-slate-200 bg-slate-50/50 overflow-y-auto shrink-0 p-3 space-y-2">
              <div className="px-2 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>Timeline</span>
                <span>Newest to Oldest</span>
              </div>

              {versions.map((ver, idx) => {
                const isSelected = selectedVersion?.id === ver.id;
                const isLatest = idx === 0;
                const createdDate = new Date(ver.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                });
                const createdTime = new Date(ver.created_at).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div
                    key={ver.id}
                    onClick={() => handleSelectVersion(ver)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative group ${
                      isSelected
                        ? 'bg-white border-indigo-300 shadow-sm ring-2 ring-indigo-500/10'
                        : 'bg-white/70 hover:bg-white border-slate-200/80 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold ${
                            isLatest
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          v{ver.version_number}
                        </span>
                        {isLatest && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                            Current
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {createdDate}
                      </span>
                    </div>

                    <div className="text-xs font-semibold text-slate-800 line-clamp-1 mb-1">
                      {ver.change_summary || (ver.version_number === 1 ? 'Initial article' : 'Revision update')}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100/80">
                      <div className="flex items-center gap-1.5 truncate">
                        <User className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{ver.author_name || 'Author'}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0">{createdTime}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right Pane: Selected Version Snapshot Preview */}
            <div className="flex-1 flex flex-col bg-white overflow-y-auto p-6 sm:p-8">
              {selectedVersion ? (
                <div className="space-y-6 max-w-3xl">
                  {/* Top Bar of Selected Version */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          Version {selectedVersion.version_number}
                        </span>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${
                            selectedVersion.status === 'published'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {selectedVersion.status === 'published' ? 'Published' : 'Draft'}
                        </span>
                        {selectedVersion.category_name && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700">
                            <Tag className="w-3 h-3 text-slate-400" />
                            {selectedVersion.category_name}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 pt-1">
                        Recorded on{' '}
                        {new Date(selectedVersion.created_at).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        by <strong className="text-slate-800">{selectedVersion.author_name}</strong>
                      </p>
                    </div>

                    {/* Restore Action Button */}
                    {isLeader && (
                      <div className="shrink-0">
                        {isCurrentVersion ? (
                          <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 text-slate-500 text-xs font-semibold border border-slate-200 cursor-default">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Currently Active</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => setIsConfirmingRestore(true)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-all shadow-xs cursor-pointer active:scale-98"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Restore This Version</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Change Summary Card */}
                  {selectedVersion.change_summary && (
                    <div className="p-3.5 rounded-2xl bg-indigo-50/50 border border-indigo-100 flex items-start gap-2.5">
                      <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">
                          Change Summary
                        </span>
                        <p className="text-xs text-slate-700 mt-0.5 font-medium">
                          "{selectedVersion.change_summary}"
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Document Title Snapshot */}
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Document Title
                    </span>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight leading-snug">
                      {selectedVersion.title}
                    </h2>
                  </div>

                  {/* Document Body Snapshot */}
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                      Document Content
                    </span>
                    <div className="p-5 sm:p-6 rounded-2xl bg-slate-50/70 border border-slate-200/90 text-slate-800 text-sm sm:text-base leading-relaxed whitespace-pre-wrap font-normal">
                      {selectedVersion.content}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">
                  Select a version from the left timeline to preview its snapshot.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal Bottom Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between shrink-0 text-xs text-slate-500">
          <span>
            {isLeader
              ? 'Leaders can preview any revision and restore it as a new version.'
              : 'Members can inspect historical revisions and changes.'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-medium transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>

      {/* Restore Confirmation Dialog Modal */}
      {isConfirmingRestore && selectedVersion && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 border border-slate-200 shadow-2xl text-center space-y-4 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center mx-auto">
              <RotateCcw className="w-6 h-6" />
            </div>

            <div>
              <h4 className="text-lg font-bold text-slate-900">
                Restore Version {selectedVersion.version_number}?
              </h4>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Current article content will be replaced with this snapshot, and a new version will be created in history.
              </p>
              <div className="mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-left text-xs space-y-1">
                <div className="font-semibold text-slate-800 truncate">"{selectedVersion.title}"</div>
                <div className="text-slate-500 text-[11px]">
                  Snapshot from {new Date(selectedVersion.created_at).toLocaleDateString()} by {selectedVersion.author_name}
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsConfirmingRestore(false)}
                disabled={restoreLoading}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRestore}
                disabled={restoreLoading}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {restoreLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Restore Version</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
