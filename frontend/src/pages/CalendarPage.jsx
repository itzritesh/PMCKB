import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Plus,
  Filter,
  RefreshCw,
  AlertCircle,
  Edit3,
  Trash2,
  Users,
  CheckSquare,
  ArrowUpRight,
} from 'lucide-react';
import { calendarService } from '../services/calendarService';
import { taskService } from '../services/taskService';
import { meetingService } from '../services/meetingService';
import EventModal from '../components/calendar/EventModal';
import DeleteEventModal from '../components/calendar/DeleteEventModal';
import PriorityBadge from '../components/tasks/PriorityBadge';
import TaskStatusPill from '../components/tasks/TaskStatusPill';

export default function CalendarPage() {
  const [events, setEvents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Tab filter: 'all', 'events', 'meetings', 'tasks'
  const [activeType, setActiveType] = useState('all');

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingEvent, setDeletingEvent] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [eventsRes, tasksRes, meetingsRes] = await Promise.all([
        calendarService.getEvents(),
        taskService.getAllTasks().catch(() => ({ data: { tasks: [] } })),
        meetingService.getMeetings().catch(() => ({ data: { meetings: [] } })),
      ]);

      const evList = eventsRes?.data?.events || eventsRes?.events || eventsRes?.data || [];
      const tList = tasksRes?.data?.tasks || tasksRes?.tasks || tasksRes?.data || [];
      const mList = meetingsRes?.data?.meetings || meetingsRes?.meetings || meetingsRes?.data || [];

      setEvents(Array.isArray(evList) ? evList.filter(Boolean) : []);
      setTasks((Array.isArray(tList) ? tList.filter(Boolean) : []).filter((t) => t.due_date));
      setMeetings(Array.isArray(mList) ? mList.filter(Boolean) : []);
    } catch (err) {
      setError(err.message || 'Failed to load calendar data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateEvent = () => {
    setEditingEvent(null);
    setModalOpen(true);
  };

  const handleEditEvent = (event) => {
    setEditingEvent(event);
    setModalOpen(true);
  };

  const handleSaveEvent = async (formData) => {
    setSubmitting(true);
    try {
      if (editingEvent) {
        const res = await calendarService.updateEvent(editingEvent.id, formData);
        const updated = res?.data?.event || res?.event || res?.data;
        if (updated && updated.id) {
          setEvents((prev) =>
            prev.map((e) => (e && e.id === editingEvent.id ? updated : e)).filter(Boolean)
          );
        } else {
          fetchData();
        }
      } else {
        const res = await calendarService.createEvent(formData);
        const created = res?.data?.event || res?.event || res?.data;
        if (created && created.id) {
          setEvents((prev) => [...prev.filter(Boolean), created]);
        } else {
          fetchData();
        }
      }
      setModalOpen(false);
    } catch (err) {
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEventClick = (event) => {
    setDeletingEvent(event);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingEvent) return;
    setIsDeleting(true);
    try {
      await calendarService.deleteEvent(deletingEvent.id);
      setEvents((prev) => prev.filter((e) => e.id !== deletingEvent.id));
      setDeleteModalOpen(false);
    } catch (err) {
      alert(err.message || 'Failed to delete event.');
    } finally {
      setIsDeleting(false);
      setDeletingEvent(null);
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

  // Combine unified agenda items
  const combinedItems = [
    ...events.map((e) => ({
      id: `event-${e.id}`,
      rawId: e.id,
      title: e.title,
      description: e.description,
      datetime: e.start_datetime,
      endDatetime: e.end_datetime,
      location: e.location,
      type: 'event',
      original: e,
    })),
    ...meetings.map((m) => ({
      id: `meeting-${m.id}`,
      rawId: m.id,
      title: m.title,
      description: m.description,
      datetime: m.start_datetime,
      endDatetime: m.end_datetime,
      location: m.location,
      status: m.status,
      attendeeCount: m.attendee_count,
      type: 'meeting',
      original: m,
    })),
    ...tasks.map((t) => ({
      id: `task-${t.id}`,
      rawId: t.id,
      title: t.title,
      description: t.description,
      datetime: t.due_date,
      priority: t.priority,
      status: t.status,
      projectName: t.project_name,
      assigneeName: t.assignee_name,
      type: 'task',
      original: t,
    })),
  ].sort((a, b) => new Date(a.datetime) - new Date(b.datetime));

  const filteredItems = combinedItems.filter((item) => {
    if (activeType === 'all') return true;
    if (activeType === 'events') return item.type === 'event';
    if (activeType === 'meetings') return item.type === 'meeting';
    if (activeType === 'tasks') return item.type === 'task';
    return true;
  });

  return (
    <div className="min-h-[calc(100vh-4rem)] py-10 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Calendar & Schedule
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                {combinedItems.length} Scheduled
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500">
              Unified workspace timeline synchronizing calendar events, team meetings, and task deliverables.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchData}
              disabled={loading}
              title="Refresh calendar"
              className="p-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleCreateEvent}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs sm:text-sm font-medium transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Event</span>
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 bg-white p-1 rounded-2xl border border-slate-200 shadow-2xs overflow-x-auto">
            <button
              onClick={() => setActiveType('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                activeType === 'all'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              All Scheduled ({combinedItems.length})
            </button>
            <button
              onClick={() => setActiveType('events')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                activeType === 'events'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Events ({events.length})
            </button>
            <button
              onClick={() => setActiveType('meetings')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                activeType === 'meetings'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Meetings ({meetings.length})
            </button>
            <button
              onClick={() => setActiveType('tasks')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                activeType === 'tasks'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Task Deadlines ({tasks.length})
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-xs text-rose-700 font-medium">{error}</div>
          </div>
        )}

        {/* Loading Skeleton */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="bg-white rounded-2xl p-5 border border-slate-200 animate-pulse space-y-3 shadow-xs"
              >
                <div className="h-5 w-1/3 bg-slate-100 rounded-full" />
                <div className="h-5 w-3/4 bg-slate-100 rounded" />
                <div className="h-3 w-1/2 bg-slate-100 rounded" />
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredItems.length === 0 && (
          <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center max-w-md mx-auto space-y-3 shadow-xs">
            <div className="w-14 h-14 rounded-3xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto">
              <CalendarIcon className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No Scheduled Items Found</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Create an event, schedule a team meeting, or assign target due dates to tasks to populate your timeline.
            </p>
            <div className="pt-2">
              <button
                onClick={handleCreateEvent}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium transition-colors cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Create Calendar Event</span>
              </button>
            </div>
          </div>
        )}

        {/* Unified Chronological Agenda Cards */}
        {!loading && filteredItems.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredItems.map((item) => {
              const isOverdue =
                new Date(item.datetime).getTime() < Date.now() &&
                item.status !== 'completed';

              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-2xl p-5 border transition-all shadow-xs hover:border-slate-300 hover:shadow-md flex flex-col justify-between group ${
                    isOverdue && item.type === 'task' ? 'border-rose-200 bg-rose-50/20' : 'border-slate-200'
                  }`}
                >
                  <div>
                    {/* Badge & Action Header */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        {item.type === 'event' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
                            Calendar Event
                          </span>
                        )}
                        {item.type === 'meeting' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200">
                            Meeting • {item.status}
                          </span>
                        )}
                        {item.type === 'task' && (
                          <>
                            <TaskStatusPill status={item.status} />
                            <PriorityBadge priority={item.priority} />
                          </>
                        )}
                      </div>

                      {/* Item controls */}
                      {item.type === 'event' && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleEditEvent(item.original)}
                            title="Edit Event"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteEventClick(item.original)}
                            title="Delete Event"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      {item.type === 'meeting' && (
                        <a
                          href={`/meetings/${item.rawId}`}
                          className="p-1.5 rounded-lg text-purple-600 hover:bg-purple-50 transition-colors"
                          title="Open Meeting Details"
                        >
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>

                    {/* Title & Description */}
                    <h3 className="text-base font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors mb-1">
                      {item.title}
                    </h3>

                    {item.description && (
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-3">
                        {item.description}
                      </p>
                    )}
                  </div>

                  {/* Metadata Footer */}
                  <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                      <Clock className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{formatDateTime(item.datetime)}</span>
                      {item.endDatetime && (
                        <span className="text-slate-400">
                          - {new Date(item.endDatetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>

                    {item.location && (
                      <div className="flex items-center gap-1.5 text-slate-500 truncate">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{item.location}</span>
                      </div>
                    )}

                    {item.projectName && (
                      <div className="text-[11px] text-indigo-600 font-medium">
                        Project: {item.projectName}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Event Modals */}
      <EventModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSaveEvent}
        event={editingEvent}
        loading={submitting}
      />

      <DeleteEventModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        eventTitle={deletingEvent?.title || ''}
        loading={isDeleting}
      />
    </div>
  );
}
