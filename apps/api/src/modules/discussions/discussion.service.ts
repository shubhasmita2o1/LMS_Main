import mongoose from 'mongoose';
import { AppError } from '../../middleware/errorHandler';
import {
  DiscussionThread,
  DiscussionReply,
  DiscussionReport,
  type IDiscussionThread,
  type IDiscussionReply,
} from './discussion.model';
import { notifyUser } from '../notifications/notification.service';
import type {
  DiscussionThreadPublic,
  DiscussionReplyPublic,
  DiscussionReportPublic,
  DiscussionThreadStatus,
} from '@university-lms/shared';

function tid(tenantId: string) {
  return new mongoose.Types.ObjectId(tenantId);
}

function idStr(v: unknown): string | null {
  if (!v) return null;
  return String(v);
}

function baseFilter(tenantId: string, extra: Record<string, unknown> = {}) {
  return { tenantId: tid(tenantId), isDeleted: false, ...extra };
}

function isModerator(roles: string[]) {
  return roles.some((r) =>
    ['super_admin', 'tenant_admin', 'university_admin', 'faculty'].includes(r)
  );
}

async function assertCourseAccess(
  tenantId: string,
  user: { id: string; roles: string[] },
  courseId: string
): Promise<void> {
  if (isModerator(user.roles)) return;

  // Students must be enrolled
  try {
    const { assertCanAccessCourse } = await import('../learn/learn.service');
    await assertCanAccessCourse(tenantId, user, courseId);
  } catch {
    throw new AppError(403, 'Not enrolled in this course', 'FORBIDDEN');
  }
}

async function resolveUserName(userId: string): Promise<string | null> {
  try {
    const User = mongoose.model('User');
    const u = await User.findById(userId).select('firstName lastName email').lean();
    if (!u) return null;
    const name = [((u as any).firstName || ''), ((u as any).lastName || '')]
      .join(' ')
      .trim();
    return name || (u as any).email || null;
  } catch {
    return null;
  }
}

function mapThread(d: IDiscussionThread | any, extra: Partial<DiscussionThreadPublic> = {}): DiscussionThreadPublic {
  return {
    id: String(d._id),
    tenantId: String(d.tenantId),
    courseId: String(d.courseId),
    title: d.title,
    body: d.body,
    createdBy: idStr(d.createdBy) || '',
    createdByName: extra.createdByName ?? null,
    status: d.status,
    isAnnouncementPin: !!d.isAnnouncementPin,
    lastActivityAt: d.lastActivityAt,
    replyCount: d.replyCount ?? 0,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  };
}

function mapReply(d: IDiscussionReply | any, extra: Partial<DiscussionReplyPublic> = {}): DiscussionReplyPublic {
  return {
    id: String(d._id),
    tenantId: String(d.tenantId),
    threadId: String(d.threadId),
    courseId: String(d.courseId),
    body: d.body,
    createdBy: idStr(d.createdBy) || '',
    createdByName: extra.createdByName ?? null,
    parentReplyId: idStr(d.parentReplyId),
    status: d.status,
    isAnswer: !!d.isAnswer,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  };
}

function mapReport(d: any, extra: Partial<DiscussionReportPublic> = {}): DiscussionReportPublic {
  return {
    id: String(d._id),
    tenantId: String(d.tenantId),
    threadId: idStr(d.threadId),
    replyId: idStr(d.replyId),
    reportedBy: String(d.reportedBy),
    reportedByName: extra.reportedByName ?? null,
    reason: d.reason,
    status: d.status,
    resolvedBy: idStr(d.resolvedBy),
    resolvedAt: d.resolvedAt ?? null,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  };
}

export async function listThreads(
  tenantId: string,
  user: { id: string; roles: string[] },
  courseId: string,
  opts: { page?: number; limit?: number } = {}
): Promise<{ items: DiscussionThreadPublic[]; total: number }> {
  await assertCourseAccess(tenantId, user, courseId);
  const page = Math.max(1, opts.page ?? 1);
  const limit = Math.min(50, Math.max(1, opts.limit ?? 20));

  const filter = baseFilter(tenantId, { courseId: tid(courseId) });
  if (!isModerator(user.roles)) {
    filter.status = { $ne: 'hidden' };
  }

  const [docs, total] = await Promise.all([
    DiscussionThread.find(filter)
      .sort({ isAnnouncementPin: -1, lastActivityAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    DiscussionThread.countDocuments(filter),
  ]);

  const items: DiscussionThreadPublic[] = [];
  for (const d of docs) {
    const name = d.createdBy ? await resolveUserName(String(d.createdBy)) : null;
    items.push(mapThread(d, { createdByName: name }));
  }
  return { items, total };
}

export async function getThread(
  tenantId: string,
  user: { id: string; roles: string[] },
  courseId: string,
  threadId: string
): Promise<{ thread: DiscussionThreadPublic; replies: DiscussionReplyPublic[] }> {
  await assertCourseAccess(tenantId, user, courseId);
  const thread = await DiscussionThread.findOne(
    baseFilter(tenantId, { _id: tid(threadId), courseId: tid(courseId) })
  );
  if (!thread) throw new AppError(404, 'Thread not found', 'NOT_FOUND');
  if (thread.status === 'hidden' && !isModerator(user.roles)) {
    throw new AppError(404, 'Thread not found', 'NOT_FOUND');
  }

  const replyFilter: Record<string, unknown> = baseFilter(tenantId, {
    threadId: tid(threadId),
  });
  if (!isModerator(user.roles)) {
    replyFilter.status = 'visible';
  }

  const replies = await DiscussionReply.find(replyFilter).sort({ createdAt: 1 }).lean();
  const threadName = thread.createdBy
    ? await resolveUserName(String(thread.createdBy))
    : null;
  const mappedReplies: DiscussionReplyPublic[] = [];
  for (const r of replies) {
    const name = r.createdBy ? await resolveUserName(String(r.createdBy)) : null;
    mappedReplies.push(mapReply(r, { createdByName: name }));
  }

  return {
    thread: mapThread(thread, { createdByName: threadName }),
    replies: mappedReplies,
  };
}

export async function createThread(
  tenantId: string,
  user: { id: string; roles: string[] },
  courseId: string,
  input: { title: string; body: string; isAnnouncementPin?: boolean }
): Promise<DiscussionThreadPublic> {
  await assertCourseAccess(tenantId, user, courseId);

  const pin = !!input.isAnnouncementPin && isModerator(user.roles);
  const doc = await DiscussionThread.create({
    tenantId: tid(tenantId),
    courseId: tid(courseId),
    title: input.title.trim().slice(0, 300),
    body: input.body.slice(0, 20000),
    status: 'open',
    isAnnouncementPin: pin,
    lastActivityAt: new Date(),
    replyCount: 0,
    createdBy: tid(user.id),
  });

  const name = await resolveUserName(user.id);
  return mapThread(doc, { createdByName: name });
}

export async function createReply(
  tenantId: string,
  user: { id: string; roles: string[] },
  courseId: string,
  threadId: string,
  input: { body: string; parentReplyId?: string | null }
): Promise<DiscussionReplyPublic> {
  await assertCourseAccess(tenantId, user, courseId);

  const thread = await DiscussionThread.findOne(
    baseFilter(tenantId, { _id: tid(threadId), courseId: tid(courseId) })
  );
  if (!thread) throw new AppError(404, 'Thread not found', 'NOT_FOUND');
  if (thread.status === 'locked' && !isModerator(user.roles)) {
    throw new AppError(400, 'Thread is locked', 'THREAD_LOCKED');
  }
  if (thread.status === 'hidden' && !isModerator(user.roles)) {
    throw new AppError(404, 'Thread not found', 'NOT_FOUND');
  }

  if (input.parentReplyId) {
    const parent = await DiscussionReply.findOne(
      baseFilter(tenantId, { _id: tid(input.parentReplyId), threadId: tid(threadId) })
    );
    if (!parent) throw new AppError(400, 'Parent reply not found', 'INVALID_PARENT');
  }

  const reply = await DiscussionReply.create({
    tenantId: tid(tenantId),
    threadId: tid(threadId),
    courseId: tid(courseId),
    body: input.body.slice(0, 10000),
    parentReplyId: input.parentReplyId ? tid(input.parentReplyId) : null,
    status: 'visible',
    isAnswer: false,
    createdBy: tid(user.id),
  });

  thread.replyCount = (thread.replyCount || 0) + 1;
  thread.lastActivityAt = new Date();
  await thread.save();

  // Notify thread participants (author + prior reply authors), excluding self
  const participantIds = new Set<string>();
  if (thread.createdBy) participantIds.add(String(thread.createdBy));
  const prior = await DiscussionReply.find(
    baseFilter(tenantId, { threadId: tid(threadId) })
  )
    .select('createdBy')
    .lean();
  for (const p of prior) {
    if (p.createdBy) participantIds.add(String(p.createdBy));
  }
  participantIds.delete(user.id);

  const authorName = (await resolveUserName(user.id)) || 'Someone';
  const snippet = input.body.slice(0, 120);

  for (const uid of participantIds) {
    try {
      await notifyUser({
        tenantId,
        userId: uid,
        type: 'discussion_reply',
        title: `Reply on: ${thread.title}`,
        body: `${authorName}: ${snippet}`,
        data: {
          entityType: 'discussion_thread',
          entityId: String(thread._id),
          courseId,
          link: `/courses/${courseId}/discussions/${thread._id}`,
        },
        priority: 'normal',
        channels: ['in_app'],
        dedupeKey: `discussion_reply:${reply._id}:${uid}`,
        createdBy: user.id,
      });
    } catch {
      /* continue */
    }
  }

  const name = await resolveUserName(user.id);
  return mapReply(reply, { createdByName: name });
}

export async function lockThread(
  tenantId: string,
  user: { id: string; roles: string[] },
  courseId: string,
  threadId: string,
  lock: boolean
): Promise<DiscussionThreadPublic> {
  if (!isModerator(user.roles)) {
    throw new AppError(403, 'Moderation permission required', 'FORBIDDEN');
  }
  await assertCourseAccess(tenantId, user, courseId);

  const thread = await DiscussionThread.findOne(
    baseFilter(tenantId, { _id: tid(threadId), courseId: tid(courseId) })
  );
  if (!thread) throw new AppError(404, 'Thread not found', 'NOT_FOUND');

  thread.status = (lock ? 'locked' : 'open') as DiscussionThreadStatus;
  if (thread.status === 'hidden') {
    /* leave hidden as-is if was hidden */
  }
  thread.updatedBy = tid(user.id);
  await thread.save();
  return mapThread(thread);
}

export async function hideReply(
  tenantId: string,
  user: { id: string; roles: string[] },
  replyId: string,
  hide: boolean
): Promise<DiscussionReplyPublic> {
  if (!isModerator(user.roles)) {
    throw new AppError(403, 'Moderation permission required', 'FORBIDDEN');
  }

  const reply = await DiscussionReply.findOne(baseFilter(tenantId, { _id: tid(replyId) }));
  if (!reply) throw new AppError(404, 'Reply not found', 'NOT_FOUND');
  await assertCourseAccess(tenantId, user, String(reply.courseId));

  reply.status = hide ? 'hidden' : 'visible';
  reply.updatedBy = tid(user.id);
  await reply.save();
  return mapReply(reply);
}

export async function markAnswer(
  tenantId: string,
  user: { id: string; roles: string[] },
  replyId: string,
  isAnswer: boolean
): Promise<DiscussionReplyPublic> {
  if (!isModerator(user.roles)) {
    throw new AppError(403, 'Faculty permission required', 'FORBIDDEN');
  }

  const reply = await DiscussionReply.findOne(baseFilter(tenantId, { _id: tid(replyId) }));
  if (!reply) throw new AppError(404, 'Reply not found', 'NOT_FOUND');
  await assertCourseAccess(tenantId, user, String(reply.courseId));

  reply.isAnswer = isAnswer;
  reply.updatedBy = tid(user.id);
  await reply.save();
  return mapReply(reply);
}

export async function pinThread(
  tenantId: string,
  user: { id: string; roles: string[] },
  courseId: string,
  threadId: string,
  pin: boolean
): Promise<DiscussionThreadPublic> {
  if (!isModerator(user.roles)) {
    throw new AppError(403, 'Moderation permission required', 'FORBIDDEN');
  }
  const thread = await DiscussionThread.findOne(
    baseFilter(tenantId, { _id: tid(threadId), courseId: tid(courseId) })
  );
  if (!thread) throw new AppError(404, 'Thread not found', 'NOT_FOUND');
  thread.isAnnouncementPin = pin;
  thread.updatedBy = tid(user.id);
  await thread.save();
  return mapThread(thread);
}

export async function createReport(
  tenantId: string,
  user: { id: string; roles: string[] },
  input: { threadId?: string | null; replyId?: string | null; reason: string }
): Promise<DiscussionReportPublic> {
  if (!input.threadId && !input.replyId) {
    throw new AppError(400, 'threadId or replyId required', 'VALIDATION_ERROR');
  }

  let courseId: string | null = null;
  if (input.threadId) {
    const t = await DiscussionThread.findOne(
      baseFilter(tenantId, { _id: tid(input.threadId) })
    );
    if (!t) throw new AppError(404, 'Thread not found', 'NOT_FOUND');
    courseId = String(t.courseId);
  }
  if (input.replyId) {
    const r = await DiscussionReply.findOne(
      baseFilter(tenantId, { _id: tid(input.replyId) })
    );
    if (!r) throw new AppError(404, 'Reply not found', 'NOT_FOUND');
    courseId = String(r.courseId);
  }
  if (courseId) await assertCourseAccess(tenantId, user, courseId);

  const doc = await DiscussionReport.create({
    tenantId: tid(tenantId),
    threadId: input.threadId ? tid(input.threadId) : null,
    replyId: input.replyId ? tid(input.replyId) : null,
    reportedBy: tid(user.id),
    reason: input.reason.trim().slice(0, 1000),
    status: 'open',
    createdBy: tid(user.id),
  });

  return mapReport(doc);
}

export async function listReports(
  tenantId: string,
  user: { id: string; roles: string[] },
  opts: { page?: number; limit?: number; status?: string } = {}
): Promise<{ items: DiscussionReportPublic[]; total: number }> {
  if (!isModerator(user.roles)) {
    throw new AppError(403, 'Moderation permission required', 'FORBIDDEN');
  }
  const page = Math.max(1, opts.page ?? 1);
  const limit = Math.min(50, Math.max(1, opts.limit ?? 20));
  const filter: Record<string, unknown> = baseFilter(tenantId);
  if (opts.status) filter.status = opts.status;

  const [docs, total] = await Promise.all([
    DiscussionReport.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    DiscussionReport.countDocuments(filter),
  ]);

  const items: DiscussionReportPublic[] = [];
  for (const d of docs) {
    const name = await resolveUserName(String(d.reportedBy));
    items.push(mapReport(d, { reportedByName: name }));
  }
  return { items, total };
}

export async function resolveReport(
  tenantId: string,
  user: { id: string; roles: string[] },
  reportId: string,
  status: 'resolved' | 'dismissed'
): Promise<DiscussionReportPublic> {
  if (!isModerator(user.roles)) {
    throw new AppError(403, 'Moderation permission required', 'FORBIDDEN');
  }
  const doc = await DiscussionReport.findOne(baseFilter(tenantId, { _id: tid(reportId) }));
  if (!doc) throw new AppError(404, 'Report not found', 'NOT_FOUND');
  doc.status = status;
  doc.resolvedBy = tid(user.id);
  doc.resolvedAt = new Date();
  await doc.save();
  return mapReport(doc);
}
