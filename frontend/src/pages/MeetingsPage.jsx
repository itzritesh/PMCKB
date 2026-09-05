import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Calendar,
  Clock,
  MapPin,
  Plus,
  RefreshCw,
  AlertCircle,
  Edit3,
  Trash2,
  ArrowUpRight,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { meetingService } from '../services/meetingService';
import { useAuth } from '../context/AuthContext';
import MeetingModal from '../components/meetings/MeetingModal';
import DeleteMeetingModal from '../components/meetings/DeleteMeetingModal';

const STATUS_FILTERS = [
  { key: 'all', label: 'All Meetings' },
  { key: 'scheduled', label: 'Scheduled' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

export default function MeetingsPage() {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingMeeting, setDeletingMeeting] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchMeetings = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await meetingService.getMeetings({ status: statusFilter });
      const list = res?.data?.meetings || res?.meetings || res?.data || [];
      setMeetings(Array.isArray(list) ? list.filter(Boolean) : []);
    } catch (err) {
      setError(err.message || 'Failed to load meetings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, [statusFilter]);

  const handleCreateMeeting = () => {
    setEditingMeeting(null);
    setModalOpen(true);
  };

  const handleEditMeeting = (meeting) => {
    setEditingMeeting(meeting);
    setModalOpen(true);
  };

  const handleSaveMeeting = async (formData) => {
    setSubmitting(true);
    try {
      if (editingMeeting) {
        const res = await meetingService.updateMeeting(editingMeeting.id, formData);
        const updated = res?.data?.meeting || res?.meeting || res?.data;
        if (updated && updated.id) {
          setMeetings((prev) =>
            prev.map((m) => (m && m.id === editingMeeting.id ? updated : m)).filter(Boolean)
          );
        } else {
          fetchMeetings();
        }
      } else {
        const res = await meetingService.createMeeting(formData);
        const created = res?.data?.meeting || res?.meeting || res?.data;
        if (created && created.id) {
          setMeetings((prev) => [created, ...prev.filter(Boolean)]);
        } else {
          fetchMeetings();
        }
      }
      setModalOpen(false);
    } catch (err) {
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMeetingClick = (meeting) => {
    setDeletingMeeting(meeting);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingMeeting) return;
    setIsDeleting(true);
    try {
      await meetingService.deleteMeeting(deletingMeeting.id);
      setMeetings((prev) => prev.filter((m) => m.id !== deletingMeeting.id));
      setDeleteModalOpen(false);
    } catch (err) {
      alert(err.message || 'Failed to delete meeting.');
    } finally {
      setIsDeleting(false);
      setDeletingMeeting(null);
    }
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" />
            Completed
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3 h-3" />
            Cancelled
          </span>
        );
      case 'scheduled':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
            <Clock className="w-3 h-3" />
            Scheduled
          </span>
        );
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] py-10 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Team Meetings
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                {meetings.length} Total
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500">
              Schedule team discussions, manage attendee invites, and record collaborative meeting minutes.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchMeetings}
              disabled={loading}
              title="Refresh meetings"
              className="p-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleCreateMeeting}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white text-xs sm:text-sm font-medium transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule Meeting</span>
            </button>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-white p-1 rounded-2xl border border-slate-200 shadow-2xs overflow-x-auto">
          {STATUS_FILTERS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                statusFilter === tab.key
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Error Alert */}
        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-xs text-rose-700 font-medium">{error}</div>
          </div>
        )}

        {/* Loading Skeletons */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="bg-white rounded-2xl p-5 border border-slate-200 animate-pulse space-y-3 shadow-xs"
              >
                <div className="h-5 w-1/4 bg-slate-100 rounded-full" />
                <div className="h-6 w-3/4 bg-slate-100 rounded" />
                <div className="h-4 w-1/2 bg-slate-100 rounded" />
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && meetings.length === 0 && (
          <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center max-w-md mx-auto space-y-3 shadow-xs">
            <div className="w-14 h-14 rounded-3xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center mx-auto">
              <Users className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No Meetings Found</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Schedule a meeting with team members to collaborate and document minutes.
            </p>
            <div className="pt-2">
              <button
                onClick={handleCreateMeeting}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium transition-colors cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Schedule First Meeting</span>
              </button>
            </div>
          </div>
        )}

        {/* Meeting Cards */}
        {!loading && meetings.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {meetings.filter(Boolean).map((m) => {
              const isOrganizer = user?.id === m?.organizer_id;

              return (
                <div
                  key={m.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div>
                    {/* Header: Status & Actions */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(m.status)}
                        {m.is_pending_for_user && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                            RSVP Pending
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        {isOrganizer && (
                          <>
                            <button
                              onClick={() => handleEditMeeting(m)}
                              title="Edit Meeting"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteMeetingClick(m)}
                              title="Delete Meeting"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                        <Link
                          to={`/meetings/${m.id}`}
                          title="Open Meeting Details"
                          className="p-1.5 rounded-lg text-purple-600 hover:bg-purple-50 transition-colors"
                        >
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>

                    {/* Title */}
                    <Link
                      to={`/meetings/${m.id}`}
                      className="block text-base font-semibold text-slate-900 group-hover:text-purple-600 transition-colors mb-1.5 line-clamp-1"
                    >
                      {m.title}
                    </Link>

                    {/* Description */}
                    {m.description && (
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4">
                        {m.description}
                      </p>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-500">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-purple-700 font-medium">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{formatDateTime(m.start_datetime)}</span>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        Organizer: <strong>{m.organizer_name}</strong>
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-400">
                      {m.location ? (
                        <div className="flex items-center gap-1 truncate max-w-[200px]">
                          <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                          <span className="truncate">{m.location}</span>
                        </div>
                      ) : (
                        <span>No location set</span>
                      )}

                      <div className="flex items-center gap-1 text-slate-500">
                        <Users className="w-3.5 h-3.5 text-purple-500" />
                        <span>{m.attendee_count} {m.attendee_count === 1 ? 'Attendee' : 'Attendees'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      <MeetingModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSaveMeeting}
        meeting={editingMeeting}
        loading={submitting}
      />

      <DeleteMeetingModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        meetingTitle={deletingMeeting?.title || ''}
        loading={isDeleting}
      />
    </div>
  );
}
