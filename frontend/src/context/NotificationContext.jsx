import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { notificationService } from '../services/notificationService';
import {
  isPushSupported,
  getOrRegisterServiceWorker,
  subscribeUserToPush,
  unsubscribeUserFromPush,
  getPushStatus,
} from '../services/pushService';
import { API_URL } from '../services/api';

// Play gentle audio chime when background alert arrives
function playAlertChime() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12); // A5
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
  } catch (e) {
    // Audio autoplay policy may prevent until user gesture
  }
}

// Display native OS desktop notification popup on the user's screen
function showNativeDesktopNotification(newNotif, targetUrl, onView) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  const isAnnouncement = newNotif.type === 'team_announcement' || newNotif.reference_type === 'announcement';
  const title = newNotif.title || (isAnnouncement ? 'New Team Announcement' : 'PMCKB Reminder');
  const body = newNotif.message || (isAnnouncement ? 'A new announcement has been posted.' : 'You have an upcoming scheduled item.');
  const tag = `pmckb-notif-${newNotif.id}`;

  // 1. Try Service Worker showNotification first (native OS integration)
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        return registration.showNotification(title, {
          body,
          icon: '/icons/pmckb-icon.png',
          badge: '/icons/pmckb-badge.png',
          tag,
          renotify: true,
          requireInteraction: true,
          silent: false,
          data: {
            id: newNotif.id,
            reference_type: newNotif.reference_type,
            reference_id: newNotif.reference_id,
            url: targetUrl,
          },
        });
      })
      .catch(() => {
        fallbackWindowNotification(title, body, tag, newNotif, targetUrl, onView);
      });
  } else {
    fallbackWindowNotification(title, body, tag, newNotif, targetUrl, onView);
  }
}

function fallbackWindowNotification(title, body, tag, newNotif, targetUrl, onView) {
  try {
    const desktopNotif = new Notification(title, {
      body,
      icon: '/icons/pmckb-icon.png',
      badge: '/icons/pmckb-badge.png',
      tag,
      requireInteraction: true,
      silent: false,
    });

    desktopNotif.onclick = () => {
      window.focus();
      desktopNotif.close();
      if (onView) onView(newNotif);
      window.location.href = targetUrl;
    };
  } catch (err) {
    console.warn('Native notification fallback failed:', err.message);
  }
}

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { token, isAuthenticated, user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeToasts, setActiveToasts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Push subscription state
  const [pushSupported, setPushSupported] = useState(false);
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [pushPermission, setPushPermission] = useState('default');

  const socketRef = useRef(null);
  const channelRef = useRef(null);

  // Initialize Web Push support status & auto-register Service Worker
  useEffect(() => {
    const supported = isPushSupported();
    setPushSupported(supported);
    if (supported) {
      setPushPermission(Notification.permission);
      // Auto-register service worker so it's ready for background alerts
      getOrRegisterServiceWorker();

      getPushStatus().then((status) => {
        setPushSubscribed(status.isSubscribed);

        // If permission is already granted but backend doesn't have active subscription, sync now
        if (Notification.permission === 'granted' && !status.isSubscribed && isAuthenticated) {
          subscribeUserToPush().then((res) => {
            if (res.success) setPushSubscribed(true);
          });
        }
      });
    }
  }, [isAuthenticated]);

  // Fetch notifications from server
  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      const res = await notificationService.getNotifications();
      const data = res?.data || res;
      const list = Array.isArray(data?.notifications) ? data.notifications : [];
      setNotifications(list);
      setUnreadCount(typeof data?.unreadCount === 'number' ? data.unreadCount : 0);

      // Seed persistent toasts with active, unread, non-dismissed reminders and announcements
      setActiveToasts((prev) => {
        const existingIds = new Set(prev.map((t) => t.notification.id));
        const activeUnreadItems = list.filter(
          (n) =>
            !n.is_dismissed &&
            !n.is_read &&
            !existingIds.has(n.id) &&
            (n.type === 'reminder' || n.type === 'team_announcement')
        );

        const newToasts = activeUnreadItems.map((n) => ({
          id: `toast-${n.id}`,
          notification: n,
          timestamp: new Date(n.created_at).getTime(),
        }));

        return [...newToasts, ...prev];
      });
    } catch (err) {
      console.warn('Failed to fetch initial notifications:', err.message);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Dismiss an active persistent toast (Lifecycle: Dismiss/X => is_dismissed = true, is_read unchanged)
  const dismissToast = useCallback(
    async (toastId, notificationId) => {
      // 1. Remove from active toast stack
      setActiveToasts((prev) =>
        prev.filter((t) => t.id !== toastId && t.notification?.id !== notificationId)
      );

      // 2. Mark as dismissed in state
      if (notificationId) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, is_dismissed: true } : n))
        );

        // 3. Notify backend
        try {
          await notificationService.dismissNotification(notificationId);
        } catch (err) {
          console.warn('Failed to persist notification dismissal:', err.message);
        }

        // 4. Broadcast across tabs
        if (channelRef.current) {
          channelRef.current.postMessage({
            type: 'NOTIFICATION_DISMISSED',
            notificationId,
          });
        }
      }
    },
    []
  );

  // Mark single notification as read (Lifecycle: Mark Read => is_read = true, is_dismissed unchanged)
  const markAsRead = useCallback(async (id) => {
    try {
      await notificationService.markAsRead(id, { dismiss: false });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      // Broadcast across tabs
      if (channelRef.current) {
        channelRef.current.postMessage({
          type: 'NOTIFICATION_READ',
          notificationId: id,
        });
      }
    } catch (err) {
      console.error('Failed to mark notification read:', err);
    }
  }, []);

  // View notification action (Lifecycle: View => is_read = true AND is_dismissed = true)
  const viewNotification = useCallback(
    async (notif) => {
      if (!notif) return;
      const notifId = notif.id;

      // 1. Remove from active persistent toasts
      setActiveToasts((prev) => prev.filter((t) => t.notification?.id !== notifId));

      // 2. Update local state
      setNotifications((prev) =>
        prev.map((n) => (n.id === notifId ? { ...n, is_read: true, is_dismissed: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      // 3. Notify backend
      try {
        await notificationService.markAsRead(notifId, { dismiss: true });
      } catch (err) {
        console.warn('Failed to mark notification viewed on backend:', err.message);
      }

      // 4. Broadcast across tabs
      if (channelRef.current) {
        channelRef.current.postMessage({
          type: 'NOTIFICATION_VIEWED',
          notificationId: notifId,
        });
      }
    },
    []
  );

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);

      if (channelRef.current) {
        channelRef.current.postMessage({
          type: 'NOTIFICATIONS_ALL_READ',
        });
      }
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  }, []);

  // Delete notification permanently
  const deleteNotification = useCallback(async (id) => {
    try {
      await notificationService.deleteNotification(id);
      setActiveToasts((prev) => prev.filter((t) => t.notification?.id !== id));
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      setUnreadCount((prev) => Math.max(0, prev - 1));

      if (channelRef.current) {
        channelRef.current.postMessage({
          type: 'NOTIFICATION_DELETED',
          notificationId: id,
        });
      }
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  }, []);

  // Handle incoming real-time notification (from Socket.IO or BroadcastChannel)
  const handleIncomingNotification = useCallback((newNotif) => {
    if (!newNotif || !newNotif.id) return;

    // 1. Update notification list (deduplicated by notification.id)
    setNotifications((prev) => {
      if (prev.some((n) => n.id === newNotif.id)) {
        return prev;
      }
      return [newNotif, ...prev];
    });

    // 2. Increment unread count
    setUnreadCount((prev) => prev + 1);

    // 3. Add to persistent in-app toasts (DEDUPLICATED BY canonical notification.id)
    // NO setTimeout auto-dismiss timer! Toast stays visible until user action.
    setActiveToasts((prev) => {
      if (prev.some((t) => t.notification?.id === newNotif.id)) {
        return prev;
      }
      const newToast = {
        id: `toast-${newNotif.id}`,
        notification: newNotif,
        timestamp: Date.now(),
      };
      return [newToast, ...prev];
    });

    // 4. TRIGGER NATIVE OS DESKTOP NOTIFICATION POPUP ON WINDOWS
    if (
      typeof window !== 'undefined' &&
      'Notification' in window &&
      Notification.permission === 'granted'
    ) {
      playAlertChime();

      let targetUrl = '/dashboard';
      if (newNotif.reference_type === 'announcement' || newNotif.type === 'team_announcement') {
        targetUrl = newNotif.reference_id
          ? `/announcements?id=${newNotif.reference_id}&notifId=${newNotif.id}`
          : `/announcements?notifId=${newNotif.id}`;
      } else if (newNotif.reference_type === 'meeting' && newNotif.reference_id) {
        targetUrl = `/meetings/${newNotif.reference_id}?notifId=${newNotif.id}`;
      } else if (newNotif.reference_type === 'calendar_event' && newNotif.reference_id) {
        targetUrl = `/calendar?event=${newNotif.reference_id}&notifId=${newNotif.id}`;
      } else if (newNotif.id) {
        targetUrl = `/dashboard?notifId=${newNotif.id}`;
      }

      showNativeDesktopNotification(newNotif, targetUrl, viewNotification);
    }
  }, [viewNotification]);

  // Cross-Tab Synchronization via BroadcastChannel
  useEffect(() => {
    if (typeof window === 'undefined' || !('BroadcastChannel' in window)) {
      return;
    }

    const channel = new BroadcastChannel('pmckb_notifications_sync');
    channelRef.current = channel;

    channel.onmessage = (event) => {
      const { type, notificationId, notification } = event.data || {};
      if (type === 'NEW_NOTIFICATION' && notification) {
        handleIncomingNotification(notification);
      } else if (type === 'NOTIFICATION_DISMISSED' && notificationId) {
        setActiveToasts((prev) => prev.filter((t) => t.notification?.id !== notificationId));
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, is_dismissed: true } : n))
        );
      } else if (type === 'NOTIFICATION_VIEWED' && notificationId) {
        setActiveToasts((prev) => prev.filter((t) => t.notification?.id !== notificationId));
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId ? { ...n, is_read: true, is_dismissed: true } : n
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } else if (type === 'NOTIFICATION_READ' && notificationId) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } else if (type === 'NOTIFICATIONS_ALL_READ') {
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
        setUnreadCount(0);
      } else if (type === 'NOTIFICATION_DELETED' && notificationId) {
        setActiveToasts((prev) => prev.filter((t) => t.notification?.id !== notificationId));
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    };

    return () => {
      channel.close();
      channelRef.current = null;
    };
  }, [handleIncomingNotification]);

  // Handle Service Worker postMessage clicks and URL deep-links (?notifId=...)
  useEffect(() => {
    // 1. Listen for messages from Service Worker
    const handleServiceWorkerMessage = (event) => {
      if (event.data?.type === 'PMCKB_NOTIFICATION_CLICK' && event.data?.notificationId) {
        const notifId = event.data.notificationId;
        markAsRead(notifId);
        setActiveToasts((prev) => prev.filter((t) => t.notification?.id !== notifId));
      }
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
    }

    // 2. Check current URL query parameter for ?notifId=...
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const notifIdParam = urlParams.get('notifId');
      if (notifIdParam) {
        const parsedId = parseInt(notifIdParam, 10);
        if (!isNaN(parsedId)) {
          markAsRead(parsedId);
          setActiveToasts((prev) => prev.filter((t) => t.notification?.id !== parsedId));

          // Clean up query param from URL without triggering a reload
          urlParams.delete('notifId');
          const newSearch = urlParams.toString();
          const cleanUrl =
            window.location.pathname + (newSearch ? `?${newSearch}` : '') + window.location.hash;
          window.history.replaceState(null, '', cleanUrl);
        }
      }
    }

    return () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
      }
    };
  }, [markAsRead]);

  // Initialize Socket.IO connection
  useEffect(() => {
    if (!isAuthenticated || !token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setNotifications([]);
      setUnreadCount(0);
      setActiveToasts([]);
      return;
    }

    // Fetch initial list
    fetchNotifications();

    const socketUrl = API_URL;

    const socket = io(socketUrl, {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    socket.on('connect', () => {
      console.log('🔌 [Socket.IO] Connected to notification stream');
    });

    socket.on('notification:new', (newNotif) => {
      console.log('🔔 [Socket.IO] Received notification:new', newNotif);
      handleIncomingNotification(newNotif);

      // Broadcast to other open tabs
      if (channelRef.current) {
        channelRef.current.postMessage({
          type: 'NEW_NOTIFICATION',
          notification: newNotif,
        });
      }
    });

    socket.on('connect_error', (err) => {
      console.warn('🔌 [Socket.IO] Connection warning:', err.message);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, token, handleIncomingNotification, fetchNotifications]);

  // User Action: Enable Desktop Notifications (Requests permission, registers SW, subscribes push)
  const enableDesktopNotifications = useCallback(async () => {
    const res = await subscribeUserToPush();
    if (res.success) {
      setPushSubscribed(true);
      setPushPermission('granted');
    } else {
      setPushPermission(Notification.permission || 'denied');
    }
    return res;
  }, []);

  // User Action: Disable Desktop Notifications
  const disableDesktopNotifications = useCallback(async () => {
    const res = await unsubscribeUserFromPush();
    if (res.success) {
      setPushSubscribed(false);
    }
    return res;
  }, []);

  // Trigger a test background popup with a configurable delay (e.g., 4s)
  // giving the user time to switch tabs or minimize the window
  const triggerTestBackgroundNotification = useCallback(
    async (delaySeconds = 4) => {
      // 1. Ensure permission is requested if not yet granted
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission !== 'granted') {
          const res = await enableDesktopNotifications();
          if (!res.success) return res;
        }
      }

      // 2. Schedule test notification via backend or local handler after delay
      return new Promise((resolve) => {
        setTimeout(async () => {
          try {
            await notificationService.sendTestNotification({
              title: 'PMCKB Background Reminder Test',
              message: 'Popup verified! You will receive alerts when PMCKB is in the background.',
              reference_type: 'calendar_event',
            });
            resolve({ success: true, delaySeconds });
          } catch (e) {
            handleIncomingNotification({
              id: Date.now(),
              title: 'PMCKB Background Reminder Test',
              message: 'Popup verified! You will receive alerts when PMCKB is in the background.',
              reference_type: 'calendar_event',
              created_at: new Date().toISOString(),
            });
            resolve({ success: true, delaySeconds });
          }
        }, delaySeconds * 1000);
      });
    },
    [enableDesktopNotifications, handleIncomingNotification]
  );

  const value = {
    notifications,
    unreadCount,
    activeToasts,
    loading,
    pushSupported,
    pushSubscribed,
    pushPermission,
    dismissToast,
    viewNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    fetchNotifications,
    enableDesktopNotifications,
    disableDesktopNotifications,
    triggerTestBackgroundNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}

export default NotificationContext;
