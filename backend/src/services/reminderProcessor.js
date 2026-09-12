const { ReminderModel, NotificationModel, MeetingModel, CalendarEventModel } = require('../models');
const { emitToUser } = require('../config/socket');

let processorInterval = null;

/**
 * Format friendly human-readable time remaining string
 */
function formatTimeRemaining(targetDatetime) {
  if (!targetDatetime) return 'soon';
  const now = Date.now();
  const target = new Date(targetDatetime).getTime();
  const diffMs = target - now;
  const diffMinutes = Math.round(diffMs / (1000 * 60));

  if (diffMinutes <= 0) {
    return 'starting now';
  } else if (diffMinutes < 60) {
    return `starts in ${diffMinutes} minute${diffMinutes === 1 ? '' : 's'}`;
  } else if (diffMinutes < 1440) {
    const hours = Math.round(diffMinutes / 60);
    return `starts in ${hours} hour${hours === 1 ? '' : 's'}`;
  } else {
    const days = Math.round(diffMinutes / 1440);
    return `starts in ${days} day${days === 1 ? '' : 's'}`;
  }
}

/**
 * Core processor step:
 * Atomically claims pending reminders where remind_at <= NOW() and issues notifications.
 */
async function checkAndTriggerReminders() {
  try {
    const claimedReminders = await ReminderModel.claimDueReminders();
    if (!claimedReminders || claimedReminders.length === 0) {
      return { processedCount: 0 };
    }

    console.log(`⏰ [ReminderProcessor] Claimed ${claimedReminders.length} due reminder(s) for processing.`);

    for (const reminder of claimedReminders) {
      try {
        let resourceTitle = 'Upcoming Event';
        let resourceDatetime = null;

        if (reminder.reference_type === 'meeting') {
          const meeting = await MeetingModel.findById(reminder.reference_id);
          if (meeting) {
            resourceTitle = meeting.title;
            resourceDatetime = meeting.start_datetime;
          }
        } else if (reminder.reference_type === 'calendar_event') {
          const event = await CalendarEventModel.findById(reminder.reference_id);
          if (event) {
            resourceTitle = event.title;
            resourceDatetime = event.start_datetime;
          }
        }

        const notifTitle =
          reminder.reference_type === 'meeting' ? 'Meeting Reminder' : 'Calendar Reminder';
        const timePhrase = formatTimeRemaining(resourceDatetime);
        const notifMessage = `"${resourceTitle}" ${timePhrase}.`;

        const createdNotif = await NotificationModel.create({
          userId: reminder.user_id,
          teamId: reminder.team_id,
          type: 'reminder',
          title: notifTitle,
          message: notifMessage,
          referenceType: reminder.reference_type,
          referenceId: reminder.reference_id,
        });

        // Emit real-time notification to the user via Socket.IO
        emitToUser(reminder.user_id, 'notification:new', createdNotif);

        console.log(
          `🔔 [ReminderProcessor] Notification created & emitted for user ${reminder.user_id}: "${notifTitle} - ${notifMessage}"`
        );
      } catch (innerErr) {
        console.error(
          `❌ [ReminderProcessor] Failed to generate notification for reminder ${reminder.id}:`,
          innerErr.message
        );
      }
    }

    return { processedCount: claimedReminders.length };
  } catch (err) {
    console.error('❌ [ReminderProcessor] Error in reminder processor check cycle:', err.message);
    return { error: err.message };
  }
}

/**
 * Start periodic reminder processor (runs every intervalMs, default 30s)
 */
function startReminderProcessor(intervalMs = 30000) {
  if (processorInterval) {
    clearInterval(processorInterval);
  }

  console.log(`⏰ [ReminderProcessor] Started periodic checks every ${intervalMs / 1000}s`);

  // Run immediate first check after 2 seconds
  setTimeout(() => {
    checkAndTriggerReminders().catch((err) => {
      console.error('Initial reminder check error:', err.message);
    });
  }, 2000);

  processorInterval = setInterval(() => {
    checkAndTriggerReminders().catch((err) => {
      console.error('Periodic reminder check error:', err.message);
    });
  }, intervalMs);
}

/**
 * Stop periodic reminder processor
 */
function stopReminderProcessor() {
  if (processorInterval) {
    clearInterval(processorInterval);
    processorInterval = null;
    console.log('🛑 [ReminderProcessor] Stopped reminder processor interval.');
  }
}

module.exports = {
  checkAndTriggerReminders,
  startReminderProcessor,
  stopReminderProcessor,
  formatTimeRemaining,
};
