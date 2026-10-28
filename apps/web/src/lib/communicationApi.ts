import { api } from './api';
import type {
  NotificationPublic,
  NotificationPreferencePublic,
  AnnouncementPublic,
  DiscussionThreadPublic,
  DiscussionReplyPublic,
  DiscussionReportPublic,
  NotificationPreferenceMap,
  AnnouncementAudience,
  NotificationChannel,
} from '@university-lms/shared';

type ApiOk<T> = { success: boolean; data: T };

export async function listNotifications(params?: {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
}) {
  const { data } = await api.get<
    ApiOk<{ items: NotificationPublic[]; total: number; page: number; limit: number }>
  >('/notifications', { params });
  return data.data;
}

export async function getUnreadCount() {
  const { data } = await api.get<ApiOk<{ count: number }>>('/notifications/unread-count');
  return data.data.count;
}

export async function markNotificationRead(id: string) {
  const { data } = await api.post<ApiOk<NotificationPublic>>(`/notifications/${id}/read`);
  return data.data;
}

export async function markAllNotificationsRead() {
  const { data } = await api.post<ApiOk<{ modified: number }>>('/notifications/read-all');
  return data.data;
}

export async function getNotificationPreferences() {
  const { data } = await api.get<ApiOk<NotificationPreferencePublic>>('/notifications/preferences');
  return data.data;
}

export async function updateNotificationPreferences(preferences: NotificationPreferenceMap) {
  const { data } = await api.patch<ApiOk<NotificationPreferencePublic>>(
    '/notifications/preferences',
    { preferences }
  );
  return data.data;
}

export async function listAnnouncements(params?: {
  page?: number;
  limit?: number;
  status?: string;
}) {
  const { data } = await api.get<ApiOk<{ items: AnnouncementPublic[]; total: number }>>(
    '/announcements',
    { params }
  );
  return data.data;
}

export async function getAnnouncement(id: string) {
  const { data } = await api.get<ApiOk<AnnouncementPublic>>(`/announcements/${id}`);
  return data.data;
}

export async function createAnnouncement(body: {
  title: string;
  body: string;
  audienceType: AnnouncementAudience;
  audienceFilter?: {
    courseId?: string | null;
    programId?: string | null;
    sectionId?: string | null;
    roles?: string[] | null;
  } | null;
  channels?: NotificationChannel[];
  status?: 'draft' | 'published';
  expiresAt?: string | null;
}) {
  const { data } = await api.post<ApiOk<AnnouncementPublic>>('/announcements', body);
  return data.data;
}

export async function publishAnnouncement(id: string) {
  const { data } = await api.post<ApiOk<AnnouncementPublic>>(`/announcements/${id}/publish`);
  return data.data;
}

export async function archiveAnnouncement(id: string) {
  const { data } = await api.post<ApiOk<AnnouncementPublic>>(`/announcements/${id}/archive`);
  return data.data;
}

export async function listDiscussionThreads(
  courseId: string,
  params?: { page?: number; limit?: number }
) {
  const { data } = await api.get<ApiOk<{ items: DiscussionThreadPublic[]; total: number }>>(
    `/courses/${courseId}/discussions/threads`,
    { params }
  );
  return data.data;
}

export async function getDiscussionThread(courseId: string, threadId: string) {
  const { data } = await api.get<
    ApiOk<{ thread: DiscussionThreadPublic; replies: DiscussionReplyPublic[] }>
  >(`/courses/${courseId}/discussions/threads/${threadId}`);
  return data.data;
}

export async function createDiscussionThread(
  courseId: string,
  body: { title: string; body: string; isAnnouncementPin?: boolean }
) {
  const { data } = await api.post<ApiOk<DiscussionThreadPublic>>(
    `/courses/${courseId}/discussions/threads`,
    body
  );
  return data.data;
}

export async function createDiscussionReply(
  courseId: string,
  threadId: string,
  body: { body: string; parentReplyId?: string | null }
) {
  const { data } = await api.post<ApiOk<DiscussionReplyPublic>>(
    `/courses/${courseId}/discussions/threads/${threadId}/replies`,
    body
  );
  return data.data;
}

export async function lockDiscussionThread(
  courseId: string,
  threadId: string,
  lock = true
) {
  const { data } = await api.post<ApiOk<DiscussionThreadPublic>>(
    `/courses/${courseId}/discussions/threads/${threadId}/lock`,
    { lock }
  );
  return data.data;
}

export async function pinDiscussionThread(courseId: string, threadId: string, pin = true) {
  const { data } = await api.post<ApiOk<DiscussionThreadPublic>>(
    `/courses/${courseId}/discussions/threads/${threadId}/pin`,
    { pin }
  );
  return data.data;
}

export async function hideDiscussionReply(replyId: string, hide = true) {
  const { data } = await api.post<ApiOk<DiscussionReplyPublic>>(
    `/discussions/replies/${replyId}/hide`,
    { hide }
  );
  return data.data;
}

export async function markDiscussionAnswer(replyId: string, isAnswer = true) {
  const { data } = await api.post<ApiOk<DiscussionReplyPublic>>(
    `/discussions/replies/${replyId}/mark-answer`,
    { isAnswer }
  );
  return data.data;
}

export async function reportDiscussion(body: {
  threadId?: string | null;
  replyId?: string | null;
  reason: string;
}) {
  const { data } = await api.post<ApiOk<DiscussionReportPublic>>('/discussions/reports', body);
  return data.data;
}
