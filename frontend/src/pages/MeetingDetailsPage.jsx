import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  UserPlus,
  UserX,
  FileText,
  Edit3,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Save,
  Check,
  X,
  HelpCircle,
} from 'lucide-react';
import { meetingService } from '../services/meetingService';
import { teamService } from '../services/teamService';
import { useAuth } from '../context/AuthContext';
import { useTeam } from '../context/TeamContext';
import MeetingModal from '../components/meetings/MeetingModal';
import DeleteMeetingModal from '../components/meetings/DeleteMeetingModal';

export default function MeetingDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentTeam, isLeader } = useTeam();

  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Users for attendee picker
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [addingAttendee, setAddingAttendee] = useState(false);
  const [attendeeError, setAttendeeError] = useState(null);

  // Minutes state
  const [isEditingMinutes, setIsEditingMinutes] = useState(false);
  const [minutesForm, setMinutesForm] = useState({
    summary: '',
    discussion: '',
    decisions: '',
    action_items: '',
  });
  const [savingMinutes, setSavingMinutes] = useState(false);
  const [minutesError, setMinutesError] = useState(null);

  // Modals
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [submittingMeeting, setSubmittingMeeting] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingMeeting, setDeletingMeeting] = useState(false);

  const fetchMeeting = async () => {
    setLoading(true);
    setError(null);
    try {
      const resMeeting = await meetingService.getMeeting(id);
      const m = resMeeting?.data?.meeting || resMeeting?.meeting || resMeeting?.data;
      if (m) {
        setMeeting(m);
        if (m.minutes) {
          setMinutesForm({
            summary: m.minutes.summary || '',
            discussion: m.minutes.discussion || '',
            decisions: m.minutes.decisions || '',
            action_items: m.minutes.action_items || '',
          });
        }
      }

      const teamIdToFetch = currentTeam?.id || m?.team_id;
      if (teamIdToFetch) {
        const resMembers = await teamService.getTeamMembers(teamIdToFetch).catch(() => ({ data: { members: [] } }));
        const mList = resMembers?.data?.members || resMembers?.members || [];
        setAllUsers(Array.isArray(mList) ? mList.map((tm) => ({ id: tm.user_id, name: tm.user_name, email: tm.user_email })) : []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load meeting.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeeting();
  }, [id, currentTeam?.id]);

  const handleUpdateMeeting = async (formData) => {
    setSubmittingMeeting(true);
    try {
      const res = await meetingService.updateMeeting(id, formData);
      const updated = res?.data?.meeting || res?.meeting || res?.data;
      if (updated) {
        setMeeting((prev) => ({ ...prev, ...updated }));
      } else {
        fetchMeeting();
      }
      setEditModalOpen(false);
    } catch (err) {
      throw err;
    } finally {
      setSubmittingMeeting(false);
    }
  };

  const handleDeleteMeeting = async () => {
    setDeletingMeeting(true);
    try {
      await meetingService.deleteMeeting(id);
      navigate('/meetings', { replace: true });
    } catch (err) {
      alert(err.message || 'Failed to delete meeting.');
      setDeletingMeeting(false);
    }
  };

  // Attendees
  const handleAddAttendee = async (e) => {
    e.preventDefault();
    if (!selectedUserId) return;
    setAddingAttendee(true);
    setAttendeeError(null);
    try {
      await meetingService.addAttendee(id, { userId: parseInt(selectedUserId, 10) });
      setSelectedUserId('');
      fetchMeeting();
    } catch (err) {
      setAttendeeError(err.message || 'Failed to add attendee.');
    } finally {
      setAddingAttendee(false);
    }
  };

  const handleUpdateRsvp = async (responseStatus) => {
    if (!user) return;
    try {
      await meetingService.updateAttendeeResponse(id, user.id, { responseStatus });
      fetchMeeting();
    } catch (err) {
      alert(err.message || 'Failed to update RSVP response.');
    }
  };

  const handleRemoveAttendee = async (attendeeUserId) => {
    try {
      await meetingService.removeAttendee(id, attendeeUserId);
      fetchMeeting();
    } catch (err) {
      alert(err.message || 'Failed to remove attendee.');
    }
  };

  // Minutes
  const handleSaveMinutes = async (e) => {
    e.preventDefault();
    setSavingMinutes(true);
    setMinutesError(null);
    try {
      if (meeting.minutes) {
        await meetingService.updateMinutes(id, minutesForm);
      } else {
        await meetingService.createMinutes(id, minutesForm);
      }
      setIsEditingMinutes(false);
      fetchMeeting();
    } catch (err) {
      setMinutesError(err.message || 'Failed to save meeting minutes.');
    } finally {
      setSavingMinutes(false);
    }
  };

  const handleDeleteMinutes = async () => {
    if (!window.confirm('Are you sure you want to delete these meeting minutes?')) return;
    try {
      await meetingService.deleteMinutes(id);
      setMinutesForm({ summary: '', discussion: '', decisions: '', action_items: '' });
      setIsEditingMinutes(false);
      fetchMeeting();
    } catch (err) {
      alert(err.message || 'Failed to delete meeting minutes.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Loading meeting details...</p>
        </div>
      </div>
    );
  }

  if (error || !meeting) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 bg-slate-50">
        <div className="bg-white max-w-md w-full p-8 rounded-3xl text-center space-y-4 border border-slate-200 shadow-md">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Meeting Unavailable</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            {error || 'This meeting could not be found or you do not have permission to view it.'}
          </p>
          <div className="pt-2">
            <Link
              to="/meetings"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium transition-colors shadow-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Meetings</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isOrganizer = user?.id === meeting.organizer_id;
  const currentAttendeeRecord = meeting.attendees?.find((a) => a.user_id === user?.id);

  // Available users not yet invited
  const existingAttendeeUserIds = new Set((meeting.attendees || []).map((a) => a.user_id));
  const availableUsers = allUsers.filter((u) => !existingAttendeeUserIds.has(u.id));

  return (
    <div className="min-h-[calc(100vh-4rem)] py-10 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Navigation Breadcrumb */}
        <Link
          to="/meetings"
          className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Meetings</span>
        </Link>

        {/* Meeting Header Banner */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize border ${
                  meeting.status === 'completed'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : meeting.status === 'cancelled'
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : 'bg-purple-50 text-purple-700 border-purple-200'
                }`}>
                  {meeting.status}
                </span>

                {currentAttendeeRecord && (
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                    currentAttendeeRecord.response_status === 'accepted'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : currentAttendeeRecord.response_status === 'declined'
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    Your RSVP: {currentAttendeeRecord.response_status}
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {meeting.title}
              </h1>

              <p className="text-xs text-slate-500">
                Organized by <strong className="text-slate-800">{meeting.organizer_name}</strong> ({meeting.organizer_email})
              </p>
            </div>

            {isLeader && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-medium transition-colors cursor-pointer shadow-2xs"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => setDeleteModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-medium transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>

          {/* Description & Agenda */}
          {meeting.description && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700 block">
                Agenda & Description
              </span>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                {meeting.description}
              </p>
            </div>
          )}

          {/* Timing & Location Chips */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
              <Calendar className="w-4 h-4 text-purple-600 shrink-0" />
              <div>
                <span className="text-[10px] uppercase text-slate-400 block font-semibold">Start Time</span>
                <span className="font-medium text-slate-800">
                  {new Date(meeting.start_datetime).toLocaleString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
              <Clock className="w-4 h-4 text-purple-600 shrink-0" />
              <div>
                <span className="text-[10px] uppercase text-slate-400 block font-semibold">End Time</span>
                <span className="font-medium text-slate-800">
                  {new Date(meeting.end_datetime).toLocaleString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
              <MapPin className="w-4 h-4 text-purple-600 shrink-0" />
              <div className="truncate">
                <span className="text-[10px] uppercase text-slate-400 block font-semibold">Location / Link</span>
                <span className="font-medium text-slate-800 truncate block">
                  {meeting.location || 'No location set'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick RSVP Bar for Current User */}
          {currentAttendeeRecord && (
            <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-slate-900 block">Respond to this Invitation</span>
                <span className="text-[11px] text-slate-500">Let the organizer know if you plan to attend.</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleUpdateRsvp('accepted')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                    currentAttendeeRecord.response_status === 'accepted'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Accept</span>
                </button>
                <button
                  onClick={() => handleUpdateRsvp('declined')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                    currentAttendeeRecord.response_status === 'declined'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-rose-50 hover:text-rose-700 border border-slate-200'
                  }`}
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Decline</span>
                </button>
                <button
                  onClick={() => handleUpdateRsvp('pending')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                    currentAttendeeRecord.response_status === 'pending'
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-amber-50 hover:text-amber-700 border border-slate-200'
                  }`}
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Tentative</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* SECTION: ATTENDEES MANAGEMENT */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" />
              <h2 className="text-lg font-bold text-slate-900">Meeting Attendees</h2>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                {meeting.attendees?.length || 0}
              </span>
            </div>

            {/* Add Attendee Dropdown Form */}
            {isLeader && availableUsers.length > 0 && (
              <form onSubmit={handleAddAttendee} className="flex items-center gap-2">
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-purple-500"
                >
                  <option value="">Select teammate to invite...</option>
                  {availableUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      👤 {u.name} ({u.email})
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  disabled={!selectedUserId || addingAttendee}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {addingAttendee ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                  <span>Invite</span>
                </button>
              </form>
            )}
          </div>

          {attendeeError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
              {attendeeError}
            </div>
          )}

          {/* Attendees Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {meeting.attendees?.map((att) => {
              const isMe = att.user_id === user?.id;

              return (
                <div
                  key={att.id}
                  className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2 shadow-2xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-purple-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                      {att.name ? att.name[0].toUpperCase() : 'U'}
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-slate-900 truncate block">
                        {att.name} {isMe && <span className="text-purple-600">(You)</span>}
                      </span>
                      <span className="text-[10px] text-slate-400 truncate block">{att.email}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize border ${
                      att.response_status === 'accepted'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : att.response_status === 'declined'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {att.response_status}
                    </span>

                    {(isLeader || isMe) && (
                      <button
                        onClick={() => handleRemoveAttendee(att.user_id)}
                        title={isMe ? 'Leave meeting' : 'Remove attendee'}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      >
                        <UserX className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION: MEETING MINUTES */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-600" />
              <h2 className="text-lg font-bold text-slate-900">Meeting Minutes & Notes</h2>
            </div>

            {!isEditingMinutes && meeting.minutes && isLeader && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEditingMinutes(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-medium transition-colors cursor-pointer shadow-2xs"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Minutes</span>
                </button>
                <button
                  onClick={handleDeleteMinutes}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  title="Delete Minutes"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {minutesError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
              {minutesError}
            </div>
          )}

          {/* Minutes View Mode */}
          {!isEditingMinutes && meeting.minutes && (
            <div className="space-y-6">
              <div className="text-xs text-slate-400">
                Recorded by <strong>{meeting.minutes.author_name}</strong> on{' '}
                {new Date(meeting.minutes.updated_at || meeting.minutes.created_at).toLocaleString()}
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-purple-700">
                    Executive Summary
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                    {meeting.minutes.summary || 'No summary recorded.'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Discussion & Points Raised
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                    {meeting.minutes.discussion || 'No discussion points logged.'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-700">
                    Key Decisions
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                    {meeting.minutes.decisions || 'No decisions logged.'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                    Action Items & Deliverables
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                    {meeting.minutes.action_items || 'No action items logged.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Empty Minutes State */}
          {!isEditingMinutes && !meeting.minutes && (
            <div className="text-center py-8 space-y-3">
              <FileText className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">No Minutes Recorded Yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {isLeader
                  ? 'Record the meeting summary, discussions, decisions, and action items for team review.'
                  : 'Meeting minutes have not been recorded by the team leader yet.'}
              </p>
              {isLeader && (
                <button
                  onClick={() => setIsEditingMinutes(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium cursor-pointer shadow-xs"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Record Minutes</span>
                </button>
              )}
            </div>
          )}

          {/* Minutes Edit / Create Form */}
          {isEditingMinutes && (
            <form onSubmit={handleSaveMinutes} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Executive Summary
                </label>
                <textarea
                  rows={2}
                  value={minutesForm.summary}
                  onChange={(e) => setMinutesForm({ ...minutesForm, summary: e.target.value })}
                  placeholder="High-level overview and outcome of the meeting..."
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Discussion Topics
                </label>
                <textarea
                  rows={3}
                  value={minutesForm.discussion}
                  onChange={(e) => setMinutesForm({ ...minutesForm, discussion: e.target.value })}
                  placeholder="Key topics, questions raised, and technical alternatives evaluated..."
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Decisions
                </label>
                <textarea
                  rows={2}
                  value={minutesForm.decisions}
                  onChange={(e) => setMinutesForm({ ...minutesForm, decisions: e.target.value })}
                  placeholder="Consensus reached and approved changes..."
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Action Items
                </label>
                <textarea
                  rows={2}
                  value={minutesForm.action_items}
                  onChange={(e) => setMinutesForm({ ...minutesForm, action_items: e.target.value })}
                  placeholder="Individual assignments, deadlines, and deliverables..."
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditingMinutes(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingMinutes}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {savingMinutes ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Save Minutes</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Meeting Edit / Delete Modals */}
      <MeetingModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSubmit={handleUpdateMeeting}
        meeting={meeting}
        loading={submittingMeeting}
      />

      <DeleteMeetingModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteMeeting}
        meetingTitle={meeting?.title || ''}
        loading={deletingMeeting}
      />
    </div>
  );
}
