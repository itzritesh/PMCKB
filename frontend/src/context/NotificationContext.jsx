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
import { API_URL } from '../services/api';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { token, isAuthenticated, user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toasts, setToasts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [desktopPermission, setDesktopPermission] = useState(() =>
    typeof window !== 'undefined' && 'Notification' in window
      ? Notification.permission
      : 'default'
  );

  const socketRef = useRef(null);

  // Fetch notifications from server
  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      const res = await notificationService.getNotifications();
      const data = res?.data || res;
      setNotifications(Array.isArray(data?.notifications) ? data.notifications : []);
      setUnreadCount(typeof data?.unreadCount === 'number' ? data.unreadCount : 0);
    } catch (err) {
      console.warn('Failed to fetch initial notifications:', err.message);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Dismiss a specific toast
  const dismissToast = useCallback((toastId) => {
    setToasts((prev) => prev.filter((t) => t.id !== toastId));
  }, []);

  // Add a toast and auto-dismiss after 6.5 seconds
  const addToast = useCallback(
    (notification) => {
      const toastId = notification.id || `toast-${Date.now()}-${Math.random()}`;

      setToasts((prev) => {
        // Prevent duplicate toast if already showing
        if (prev.some((t) => t.notification?.id === notification.id)) {
          return prev;
        }
        return [...prev, { id: toastId, notification, timestamp: Date.now() }];
      });

      // Auto-dismiss after 6.5s
      setTimeout(() => {
        dismissToast(toastId);
      }, 6500);
    },
    [dismissToast]
  );

  // Handle incoming real-time notification
  const handleIncomingNotification = useCallback(
    (newNotif) => {
      if (!newNotif) return;

      // Duplicate prevention: check if already in list
      setNotifications((prev) => {
        if (prev.some((n) => n.id === newNotif.id)) {
          return prev;
        }
        return [newNotif, ...prev];
      });

      // Increment unread count
      setUnreadCount((prev) => prev + 1);

      // Trigger immediate top-right in-app toast
      addToast(newNotif);

      // Optional desktop browser notification if granted
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          try {
            new Notification(newNotif.title || 'PMCKB Reminder', {
              body: newNotif.message || 'You have an upcoming scheduled item.',
              icon: '/vite.svg',
            });
          } catch (e) {
            // Browser might block if in background
          }
        }
      }
    },
    [addToast]
  );

  // Initialize Socket.IO connection
  useEffect(() => {
    if (!isAuthenticated || !token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setNotifications([]);
      setUnreadCount(0);
      setToasts([]);
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

  // Mark single notification as read
  const markAsRead = useCallback(async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification read:', err);
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  }, []);

  // Request browser desktop permission upon explicit user action
  const requestDesktopPermission = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }
    try {
      const perm = await Notification.requestPermission();
      setDesktopPermission(perm);
      return perm;
    } catch (err) {
      console.warn('Could not request notification permission:', err);
      return 'denied';
    }
  }, []);

  const value = {
    notifications,
    unreadCount,
    toasts,
    loading,
    desktopPermission,
    dismissToast,
    addToast,
    markAsRead,
    markAllAsRead,
    fetchNotifications,
    requestDesktopPermission,
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
