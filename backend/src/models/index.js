const UserModel = require('./user.model');
const ProjectModel = require('./project.model');
const TaskModel = require('./task.model');
const TaskAssigneeModel = require('./taskAssignee.model');
const CommentModel = require('./comment.model');
const CalendarEventModel = require('./calendarEvent.model');
const MeetingModel = require('./meeting.model');
const MeetingAttendeeModel = require('./meetingAttendee.model');
const MeetingMinutesModel = require('./meetingMinutes.model');
const KbCategoryModel = require('./kbCategory.model');
const KbArticleModel = require('./kbArticle.model');
const TeamModel = require('./team.model');
const TeamMemberModel = require('./teamMember.model');
const TeamInvitationModel = require('./teamInvitation.model');
const AnnouncementModel = require('./announcement.model');
const ReminderModel = require('./reminder.model');
const NotificationModel = require('./notification.model');
const KbArticleVersionModel = require('./kbArticleVersion.model');
const PushSubscriptionModel = require('./pushSubscription.model');

module.exports = {
  UserModel,
  ProjectModel,
  TaskModel,
  TaskAssigneeModel,
  CommentModel,
  CalendarEventModel,
  MeetingModel,
  MeetingAttendeeModel,
  MeetingMinutesModel,
  KbCategoryModel,
  KbArticleModel,
  KbArticleVersionModel,
  TeamModel,
  TeamMemberModel,
  TeamInvitationModel,
  AnnouncementModel,
  ReminderModel,
  NotificationModel,
  PushSubscriptionModel,
};
