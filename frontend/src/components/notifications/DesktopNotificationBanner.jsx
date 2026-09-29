import React, { useState } from 'react';
import { Bell, Check, X, Sparkles, MonitorSmartphone } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';

export default function DesktopNotificationBanner() {
  const { isAuthenticated } = useAuth();
  const {
    pushSupported,
    pushPermission,
    pushSubscribed,
    enableDesktopNotifications,
    triggerTestBackgroundNotification,
  } = useNotification();

  const [dismissed, setDismissed] = useState(() => {
    return sessionStorage.getItem('pmckb_notif_banner_dismissed') === 'true';
  });
  const [testing, setTesting] = useState(false);
  const [countdown, setCountdown] = useState(0);

  if (!isAuthenticated || !pushSupported || dismissed) {
    return null;
  }

  // Only show the prompt banner if permission is not yet granted
  if (pushPermission === 'granted') {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('pmckb_notif_banner_dismissed', 'true');
  };

  const handleEnable = async () => {
    const res = await enableDesktopNotifications();
    if (res.success) {
      // Permission granted! Offer a 4-second test popup
      setTesting(true);
      setCountdown(4);
      let count = 4;
      const interval = setInterval(() => {
        count--;
        setCountdown(count);
        if (count <= 0) {
          clearInterval(interval);
          setTesting(false);
        }
      }, 1000);
      triggerTestBackgroundNotification(4);
    }
  };

  return (
    <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-blue-50 border-b border-indigo-100/90 py-2.5 px-4 sm:px-6">
      <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Bell className="w-4 h-4 animate-bounce" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 font-bold text-slate-900">
              <span>Enable Background Screen Popups</span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-100 text-indigo-700">
                Action Required
              </span>
            </div>
            <p className="text-slate-600 text-[11px] truncate sm:whitespace-normal">
              {pushPermission === 'denied'
                ? 'Desktop notifications are blocked in your browser settings. Please allow notifications from the lock icon next to the URL.'
                : 'Get screen popup alerts on your computer when a meeting or reminder arrives, even when this tab is in the background or minimized.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
          {pushPermission !== 'denied' && (
            <button
              onClick={handleEnable}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Allow Screen Popups</span>
            </button>
          )}

          <button
            onClick={handleDismiss}
            aria-label="Dismiss banner"
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white/60 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
