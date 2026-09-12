import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Calendar,
  Users,
  Video,
  X,
  ArrowRight,
  Clock,
} from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';

export default function NotificationToastContainer() {
  const { toasts, dismissToast, markAsRead } = useNotification();
  const navigate = useNavigate();

  if (!toasts || toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="fixed top-4 right-4 z-50 flex flex-col gap-3 pointer-events-none w-full max-w-[calc(100vw-2rem)] sm:max-w-[380px]"
    >
      {toasts.map((toast) => {
        const notif = toast.notification;
        const isMeeting = notif.reference_type === 'meeting';
        const isCalendar = notif.reference_type === 'calendar_event';

        const handleView = (e) => {
          e.stopPropagation();
          dismissToast(toast.id);
          if (notif.id) {
            markAsRead(notif.id);
          }

          if (isMeeting && notif.reference_id) {
            navigate(`/meetings/${notif.reference_id}`);
          } else if (isCalendar) {
            navigate('/calendar');
          } else {
            navigate('/dashboard');
          }
        };

        const handleClose = (e) => {
          e.stopPropagation();
          dismissToast(toast.id);
        };

        return (
          <div
            key={toast.id}
            role="alert"
            className="pointer-events-auto w-full bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/90 p-4 transition-all duration-300 animate-in slide-in-from-top-3 fade-in duration-200 hover:shadow-2xl hover:border-slate-300"
          >
            {/* Header: Type icon, title, close button */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                    isMeeting
                      ? 'bg-purple-50 text-purple-600 border-purple-200'
                      : isCalendar
                      ? 'bg-indigo-50 text-indigo-600 border-indigo-200'
                      : 'bg-amber-50 text-amber-600 border-amber-200'
                  }`}
                >
                  {isMeeting ? (
                    <Users className="w-4 h-4" />
                  ) : isCalendar ? (
                    <Calendar className="w-4 h-4" />
                  ) : (
                    <Bell className="w-4 h-4" />
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900 truncate">
                      {notif.title || 'Reminder Alert'}
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 shrink-0" />
                  </div>
                  <span className="text-[10px] text-slate-400 block font-medium">
                    Just now
                  </span>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={handleClose}
                aria-label="Close notification"
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Message Body */}
            <div className="mt-2.5 pl-10.5">
              <p className="text-xs text-slate-700 leading-relaxed font-normal">
                {notif.message}
              </p>
            </div>

            {/* Action Footer */}
            <div className="mt-3 pl-10.5 flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-[10px] text-slate-400 font-medium">
                {isMeeting ? 'Meeting' : isCalendar ? 'Calendar Event' : 'Scheduled Alert'}
              </span>

              <div className="flex items-center gap-2">
                {(isMeeting || isCalendar) && (
                  <button
                    onClick={handleView}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold border border-indigo-200 shadow-2xs transition-colors cursor-pointer"
                  >
                    <span>View</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
                <button
                  onClick={handleClose}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
