/**
 * PMCKB Service Worker (sw.js)
 * Handles background Web Push notifications and notification click actions.
 *
 * NOTE:
 * - Runs in a ServiceWorkerGlobalScope without access to window or localStorage.
 * - Does NOT store or access JWT tokens.
 * - Delegates authenticated mark-as-read operations to the client window upon navigation/focus.
 */

// Install & Activate Service Worker immediately
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Listen for incoming Web Push events from backend (Reminders, Announcements)
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'PMCKB Notification', message: event.data.text() };
    }
  }

  const notificationId = data.id || Date.now();
  const isAnnouncement = data.type === 'team_announcement' || data.reference_type === 'announcement';
  const title = data.title || (isAnnouncement ? 'New Team Announcement' : 'PMCKB Reminder');
  const body = data.message || (isAnnouncement ? 'A new announcement has been posted.' : 'You have an upcoming scheduled item.');

  // Determine target navigation URL
  let targetUrl = '/dashboard';
  if (data.url) {
    targetUrl = data.url;
  } else if (isAnnouncement) {
    targetUrl = data.reference_id
      ? `/announcements?id=${data.reference_id}&notifId=${notificationId}`
      : `/announcements?notifId=${notificationId}`;
  } else if (data.reference_type === 'meeting' && data.reference_id) {
    targetUrl = `/meetings/${data.reference_id}?notifId=${notificationId}`;
  } else if (data.reference_type === 'calendar_event' && data.reference_id) {
    targetUrl = `/calendar?event=${data.reference_id}&notifId=${notificationId}`;
  } else {
    targetUrl = `/dashboard?notifId=${notificationId}`;
  }

  const options = {
    body,
    icon: '/icons/pmckb-icon.png',
    badge: '/icons/pmckb-badge.png',
    // Canonical deduplication ID: prevents duplicate notifications for the same ID at the OS level
    tag: `pmckb-notif-${notificationId}`,
    renotify: true,
    requireInteraction: true,
    silent: false,
    data: {
      id: notificationId,
      type: data.type || (isAnnouncement ? 'team_announcement' : 'reminder'),
      reference_type: data.reference_type || null,
      reference_id: data.reference_id || null,
      url: targetUrl,
      timestamp: Date.now(),
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Handle user clicking on a system notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const notifData = event.notification.data || {};
  const targetUrl = notifData.url || '/dashboard';

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Look for an existing open PMCKB tab
        for (const client of clientList) {
          if ('focus' in client) {
            client.focus();
            if ('navigate' in client) {
              client.navigate(targetUrl);
            }
            // Send message to the focused tab so it can immediately sync state
            client.postMessage({
              type: 'PMCKB_NOTIFICATION_CLICK',
              notificationId: notifData.id,
              url: targetUrl,
            });
            return;
          }
        }

        // If no tab is open, open a new window
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      })
  );
});
