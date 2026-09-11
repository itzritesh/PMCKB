import React, { useState, useEffect } from 'react';
import {
  Bell,
  Clock,
  Calendar,
  X,
  Check,
  Trash2,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { reminderService } from '../../services/reminderService';

// Preset options matching the user requirements
const PRESET_OPTIONS = [
  { id: '5m', label: '5 minutes before', minutes: 5 },
  { id: '15m', label: '15 minutes before', minutes: 15 },
  { id: '30m', label: '30 minutes before', minutes: 30 },
  { id: '1h', label: '1 hour before', minutes: 60 },
  { id: '1d', label: '1 day before', minutes: 1440 },
  { id: 'custom', label: 'Custom reminder time', minutes: null },
];

export default function ReminderModal({
  isOpen,
  onClose,
  referenceType, // 'meeting' | 'calendar_event'
  referenceId,
  title,
  startDatetime,
  onReminderChanged,
}) {
  const [selectedPreset, setSelectedPreset] = useState('15m');
  const [customDateTime, setCustomDateTime] = useState('');
  const [reminders, setReminders] = useState([]);
  const [loadingReminders, setLoadingReminders] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const eventStart = startDatetime ? new Date(startDatetime) : null;

  // Fetch current user's reminders for this resource
  const fetchReminders = async () => {
    if (!referenceType || !referenceId) return;
    setLoadingReminders(true);
    try {
      const res = await reminderService.getReminders({
        reference_type: referenceType,
        reference_id: referenceId,
      });
      const list = res?.data?.reminders || res?.reminders || [];
      setReminders(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Failed to load reminders:', err);
    } finally {
      setLoadingReminders(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSuccessMsg(null);
      setSelectedPreset('15m');
      // Default custom datetime to 1 hour before event start if valid
      if (eventStart && !isNaN(eventStart.getTime())) {
        const oneHourBefore = new Date(eventStart.getTime() - 60 * 60 * 1000);
        if (oneHourBefore > new Date()) {
          const tzOffset = oneHourBefore.getTimezoneOffset() * 60000;
          const localISO = new Date(oneHourBefore.getTime() - tzOffset)
            .toISOString()
            .slice(0, 16);
          setCustomDateTime(localISO);
        } else {
          setCustomDateTime('');
        }
      }
      fetchReminders();
    }
  }, [isOpen, referenceType, referenceId]);

  if (!isOpen) return null;

  // Calculate target remind_at based on current selection
  const getCalculatedRemindAt = () => {
    if (!eventStart) return null;
    if (selectedPreset === 'custom') {
      if (!customDateTime) return null;
      const customDate = new Date(customDateTime);
      return isNaN(customDate.getTime()) ? null : customDate;
    }
    const preset = PRESET_OPTIONS.find((p) => p.id === selectedPreset);
    if (!preset || preset.minutes === null) return null;
    return new Date(eventStart.getTime() - preset.minutes * 60 * 1000);
  };

  const calculatedDate = getCalculatedRemindAt();
  const isCalculatedPast = calculatedDate ? calculatedDate <= new Date() : false;
  const isCalculatedAfterEvent =
    calculatedDate && eventStart ? calculatedDate >= eventStart : false;

  const handleSaveReminder = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!calculatedDate) {
      setError('Please select or specify a valid reminder time.');
      return;
    }

    if (isCalculatedPast) {
      setError('Reminder time must be in the future.');
      return;
    }

    if (isCalculatedAfterEvent) {
      setError('Reminder time must occur before the event starts.');
      return;
    }

    setSubmitting(true);
    try {
      await reminderService.createReminder({
        reference_type: referenceType,
        reference_id: referenceId,
        remind_at: calculatedDate.toISOString(),
      });
      setSuccessMsg('Reminder scheduled successfully!');
      fetchReminders();
      if (onReminderChanged) onReminderChanged();
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || 'Failed to schedule reminder.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDismiss = async (reminderId) => {
    setActionLoadingId(reminderId);
    setError(null);
    try {
      await reminderService.dismissReminder(reminderId);
      fetchReminders();
      if (onReminderChanged) onReminderChanged();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to dismiss reminder.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (reminderId) => {
    setActionLoadingId(reminderId);
    setError(null);
    try {
      await reminderService.deleteReminder(reminderId);
      fetchReminders();
      if (onReminderChanged) onReminderChanged();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete reminder.');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shadow-2xs">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Set Reminder</h2>
              <p className="text-xs text-slate-500 truncate max-w-xs sm:max-w-sm">
                {title || (referenceType === 'meeting' ? 'Meeting' : 'Calendar Event')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Event Timing Banner */}
          {eventStart && (
            <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-100/80 text-xs text-indigo-900 font-medium">
              <Calendar className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>Event Start: {eventStart.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
            </div>
          )}

          {/* Feedback Alerts */}
          {error && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form to Schedule a New Reminder */}
          <form onSubmit={handleSaveReminder} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
                Remind Me
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {PRESET_OPTIONS.map((opt) => {
                  const isSelected = selectedPreset === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSelectedPreset(opt.id)}
                      className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Datetime Input */}
            {selectedPreset === 'custom' && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <label className="block text-xs font-semibold text-slate-700">
                  Custom Reminder Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={customDateTime}
                  onChange={(e) => setCustomDateTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
            )}

            {/* Preview of Remind At */}
            {calculatedDate && !isNaN(calculatedDate.getTime()) && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                  isCalculatedPast || isCalculatedAfterEvent
                    ? 'bg-rose-50/50 border-rose-200 text-rose-700'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    Will remind at:{' '}
                    <strong>
                      {calculatedDate.toLocaleString([], {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </strong>
                  </span>
                </div>
                {isCalculatedPast && (
                  <span className="text-[10px] font-bold text-rose-600 uppercase">In the past</span>
                )}
                {isCalculatedAfterEvent && (
                  <span className="text-[10px] font-bold text-rose-600 uppercase">After start</span>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || isCalculatedPast || isCalculatedAfterEvent}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Scheduling Reminder...</span>
                </>
              ) : (
                <>
                  <Bell className="w-4 h-4" />
                  <span>Save Reminder</span>
                </>
              )}
            </button>
          </form>

          {/* Existing Reminders Section */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Active Reminders for this {referenceType === 'meeting' ? 'Meeting' : 'Event'}
            </h3>

            {loadingReminders ? (
              <div className="py-4 text-center">
                <Loader2 className="w-5 h-5 text-indigo-600 animate-spin mx-auto" />
              </div>
            ) : reminders.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-1">
                No reminders configured yet.
              </p>
            ) : (
              <div className="space-y-2">
                {reminders.map((r) => {
                  const remindDate = new Date(r.remind_at);
                  const isActionLoading = actionLoadingId === r.id;

                  return (
                    <div
                      key={r.id}
                      className="flex items-center justify-between p-3 rounded-2xl bg-white border border-slate-200 text-xs transition-all hover:border-slate-300"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            r.status === 'pending'
                              ? 'bg-amber-500'
                              : r.status === 'triggered'
                              ? 'bg-indigo-600'
                              : r.status === 'dismissed'
                              ? 'bg-slate-400'
                              : 'bg-rose-500'
                          }`}
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 truncate">
                            {remindDate.toLocaleString([], {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })}
                          </p>
                          <span
                            className={`inline-block text-[10px] font-bold uppercase tracking-wider mt-0.5 ${
                              r.status === 'pending'
                                ? 'text-amber-600'
                                : r.status === 'triggered'
                                ? 'text-indigo-600'
                                : r.status === 'dismissed'
                                ? 'text-slate-500'
                                : 'text-rose-500'
                            }`}
                          >
                            {r.status === 'pending'
                              ? 'Active / Pending'
                              : r.status === 'triggered'
                              ? 'Triggered ✓'
                              : r.status}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {r.status === 'pending' && (
                          <button
                            onClick={() => handleDismiss(r.id)}
                            disabled={isActionLoading}
                            title="Dismiss Reminder"
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium transition-colors cursor-pointer"
                          >
                            Dismiss
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(r.id)}
                          disabled={isActionLoading}
                          title="Delete Reminder"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
