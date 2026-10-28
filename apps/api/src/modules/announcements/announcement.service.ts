import mongoose from 'mongoose';
import { AppError } from '../../middleware/errorHandler';
import { Announcement, type IAnnouncement } from './announcement.model';
import { notifyUser } from '../notifications/notification.service';
import type {
  AnnouncementPublic,
  AnnouncementAudience,
  AnnouncementStatus,
  NotificationChannel,
  AnnouncementAudienceFilter,
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

function mapAnnouncement(d: IAnnouncement | any, extra: Partial<AnnouncementPublic> = {}): AnnouncementPublic {
  return {
    id: String(d._id),
    tenantId: String(d.tenantId),
    title: d.title,
    body: d.body,
    audienceType: d.audienceType,
    audienceFilter: d.audienceFilter
      ? {
          courseId: idStr(d.audienceFilter.courseId),
          programId: idStr(d.audienceFilter.programId),
          sectionId: idStr(d.audienceFilter.sectionId),
          roles: d.audienceFilter.roles ?? null,
        }
      : null,
    channels: d.channels || ['in_app'],
    status: d.status,
    publishedAt: d.publishedAt ?? null,
    expiresAt: d.expiresAt ?? null,
    createdBy: idStr(d.createdBy),
    createdByName: extra.createdByName ?? null,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  };
}

function isStaff(roles: string[]) {
  return roles.some((r) =>
    ['super_admin', 'tenant_admin', 'university_admin', 'faculty', 'registrar'].includes(r)
  );
}

/** Resolve user IDs that should receive an announcement */
async function resolveAudienceUserIds(
  tenantId: string,
  audienceType: AnnouncementAudience,
  filter: AnnouncementAudienceFilter | null | undefined
): Promise<string[]> {
  const User = mongoose.model('User');
  const CourseEnrollment = mongoose.models.CourseEnrollment;

  if (audienceType === 'tenant') {
    const users = await User.find({
      tenantId: tid(tenantId),
      isDeleted: { $ne: true },
      approvalStatus: { $in: ['approved', null, undefined] },
    })
      .select('_id')
      .lean();
    return users.map((u: any) => String(u._id));
  }

  if (audienceType === 'role' && filter?.roles?.length) {
    const users = await User.find({
      tenantId: tid(tenantId),
      isDeleted: { $ne: true },
      roles: { $in: filter.roles },
    })
      .select('_id')
      .lean();
    return users.map((u: any) => String(u._id));
  }

  if (audienceType === 'course' && filter?.courseId && CourseEnrollment) {
    const enrollments = await CourseEnrollment.find({
      tenantId: tid(tenantId),
      courseId: tid(filter.courseId),
      isDeleted: { $ne: true },
      status: { $in: ['enrolled', 'active', 'provisional'] },
    })
      .select('studentId userId')
      .lean();

    const userIds = new Set<string>();
    // CourseEnrollment may store studentId pointing to Student; resolve to userId
    const Student = mongoose.models.Student;
    for (const e of enrollments as any[]) {
      if (e.userId) userIds.add(String(e.userId));
      else if (e.studentId && Student) {
        const st = await Student.findById(e.studentId).select('userId').lean();
        if ((st as any)?.userId) userIds.add(String((st as any).userId));
      }
    }

    // Also notify faculty assigned to course if FacultyAssignment exists
    const FacultyAssignment = mongoose.models.FacultyAssignment;
    if (FacultyAssignment) {
      const assigns = await FacultyAssignment.find({
        tenantId: tid(tenantId),
        courseId: tid(filter.courseId),
        isDeleted: { $ne: true },
      })
        .select('facultyId')
        .lean();
      const Faculty = mongoose.models.Faculty;
      for (const a of assigns as any[]) {
        if (Faculty && a.facultyId) {
          const f = await Faculty.findById(a.facultyId).select('userId').lean();
          if ((f as any)?.userId) userIds.add(String((f as any).userId));
        }
      }
    }

    return Array.from(userIds);
  }

  if (audienceType === 'program' && filter?.programId) {
    const Student = mongoose.models.Student;
    if (!Student) return [];
    const students = await Student.find({
      tenantId: tid(tenantId),
      programId: tid(filter.programId),
      isDeleted: { $ne: true },
      status: 'active',
    })
      .select('userId')
      .lean();
    return students
      .map((s: any) => (s.userId ? String(s.userId) : null))
      .filter(Boolean) as string[];
  }

  if (audienceType === 'section' && filter?.sectionId) {
    const Student = mongoose.models.Student;
    if (!Student) return [];
    const students = await Student.find({
      tenantId: tid(tenantId),
      sectionId: tid(filter.sectionId),
      isDeleted: { $ne: true },
      status: 'active',
    })
      .select('userId')
      .lean();
    return students
      .map((s: any) => (s.userId ? String(s.userId) : null))
      .filter(Boolean) as string[];
  }

  return [];
}

/** Can the current user see this published announcement? */
async function canUserSeeAnnouncement(
  tenantId: string,
  user: { id: string; roles: string[] },
  ann: IAnnouncement | any
): Promise<boolean> {
  if (ann.status !== 'published') {
    // Staff who can manage can see drafts
    return isStaff(user.roles);
  }
  if (ann.expiresAt && new Date(ann.expiresAt) < new Date()) return false;

  if (ann.audienceType === 'tenant') return true;
  if (ann.audienceType === 'role') {
    const roles = ann.audienceFilter?.roles || [];
    return user.roles.some((r) => roles.includes(r));
  }

  // For course/program/section — check membership
  const audienceIds = await resolveAudienceUserIds(tenantId, ann.audienceType, {
    courseId: idStr(ann.audienceFilter?.courseId) || undefined,
    programId: idStr(ann.audienceFilter?.programId) || undefined,
    sectionId: idStr(ann.audienceFilter?.sectionId) || undefined,
    roles: ann.audienceFilter?.roles,
  });
  if (isStaff(user.roles) && !ann.audienceFilter?.courseId) return true;
  if (isStaff(user.roles)) return true; // staff can browse published
  return audienceIds.includes(user.id);
}

export async function listForUser(
  tenantId: string,
  user: { id: string; roles: string[] },
  opts: { page?: number; limit?: number; status?: AnnouncementStatus } = {}
): Promise<{ items: AnnouncementPublic[]; total: number }> {
  const page = Math.max(1, opts.page ?? 1);
  const limit = Math.min(50, Math.max(1, opts.limit ?? 20));

  const filter: Record<string, unknown> = baseFilter(tenantId);
  if (opts.status) {
    filter.status = opts.status;
  } else if (!isStaff(user.roles)) {
    filter.status = 'published';
    filter.$or = [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }];
  }

  const docs = await Announcement.find(filter)
    .sort({ publishedAt: -1, createdAt: -1 })
    .lean();

  const visible: AnnouncementPublic[] = [];
  for (const d of docs) {
    if (await canUserSeeAnnouncement(tenantId, user, d)) {
      visible.push(mapAnnouncement(d));
    }
  }

  const total = visible.length;
  const items = visible.slice((page - 1) * limit, page * limit);
  return { items, total };
}

export async function getById(
  tenantId: string,
  user: { id: string; roles: string[] },
  id: string
): Promise<AnnouncementPublic> {
  const doc = await Announcement.findOne(baseFilter(tenantId, { _id: tid(id) }));
  if (!doc) throw new AppError(404, 'Announcement not found', 'NOT_FOUND');
  if (!(await canUserSeeAnnouncement(tenantId, user, doc))) {
    throw new AppError(403, 'Not allowed to view this announcement', 'FORBIDDEN');
  }
  return mapAnnouncement(doc);
}

export async function create(
  tenantId: string,
  user: { id: string; roles: string[] },
  input: {
    title: string;
    body: string;
    audienceType: AnnouncementAudience;
    audienceFilter?: AnnouncementAudienceFilter | null;
    channels?: NotificationChannel[];
    status?: AnnouncementStatus;
    expiresAt?: Date | string | null;
  }
): Promise<AnnouncementPublic> {
  if (!isStaff(user.roles)) {
    throw new AppError(403, 'Only faculty/admin can create announcements', 'FORBIDDEN');
  }

  const channels = input.channels?.length ? input.channels : (['in_app'] as NotificationChannel[]);
  if (!channels.includes('in_app')) channels.unshift('in_app');

  const status = input.status === 'published' ? 'published' : 'draft';
  const doc = await Announcement.create({
    tenantId: tid(tenantId),
    title: input.title.trim().slice(0, 300),
    body: input.body.slice(0, 20000),
    audienceType: input.audienceType,
    audienceFilter: input.audienceFilter
      ? {
          courseId: input.audienceFilter.courseId
            ? tid(input.audienceFilter.courseId)
            : null,
          programId: input.audienceFilter.programId
            ? tid(input.audienceFilter.programId)
            : null,
          sectionId: input.audienceFilter.sectionId
            ? tid(input.audienceFilter.sectionId)
            : null,
          roles: input.audienceFilter.roles ?? null,
        }
      : null,
    channels,
    status,
    publishedAt: status === 'published' ? new Date() : null,
    expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
    createdBy: tid(user.id),
  });

  if (status === 'published') {
    await fanOutNotifications(tenantId, doc, user.id);
  }

  return mapAnnouncement(doc);
}

export async function update(
  tenantId: string,
  user: { id: string; roles: string[] },
  id: string,
  input: Partial<{
    title: string;
    body: string;
    audienceType: AnnouncementAudience;
    audienceFilter: AnnouncementAudienceFilter | null;
    channels: NotificationChannel[];
    expiresAt: Date | string | null;
  }>
): Promise<AnnouncementPublic> {
  if (!isStaff(user.roles)) {
    throw new AppError(403, 'Not allowed', 'FORBIDDEN');
  }
  const doc = await Announcement.findOne(baseFilter(tenantId, { _id: tid(id) }));
  if (!doc) throw new AppError(404, 'Announcement not found', 'NOT_FOUND');
  if (doc.status === 'archived') {
    throw new AppError(400, 'Cannot edit archived announcement', 'INVALID_STATE');
  }

  if (input.title !== undefined) doc.title = input.title.trim().slice(0, 300);
  if (input.body !== undefined) doc.body = input.body.slice(0, 20000);
  if (input.audienceType !== undefined) doc.audienceType = input.audienceType;
  if (input.audienceFilter !== undefined) {
    doc.audienceFilter = input.audienceFilter
      ? {
          courseId: input.audienceFilter.courseId
            ? tid(input.audienceFilter.courseId)
            : null,
          programId: input.audienceFilter.programId
            ? tid(input.audienceFilter.programId)
            : null,
          sectionId: input.audienceFilter.sectionId
            ? tid(input.audienceFilter.sectionId)
            : null,
          roles: input.audienceFilter.roles ?? null,
        }
      : null;
  }
  if (input.channels !== undefined) {
    const ch = [...input.channels];
    if (!ch.includes('in_app')) ch.unshift('in_app');
    doc.channels = ch;
  }
  if (input.expiresAt !== undefined) {
    doc.expiresAt = input.expiresAt ? new Date(input.expiresAt) : null;
  }
  doc.updatedBy = tid(user.id);
  await doc.save();
  return mapAnnouncement(doc);
}

export async function publish(
  tenantId: string,
  user: { id: string; roles: string[] },
  id: string
): Promise<AnnouncementPublic> {
  if (!isStaff(user.roles)) {
    throw new AppError(403, 'Not allowed', 'FORBIDDEN');
  }
  const doc = await Announcement.findOne(baseFilter(tenantId, { _id: tid(id) }));
  if (!doc) throw new AppError(404, 'Announcement not found', 'NOT_FOUND');
  if (doc.status === 'published') return mapAnnouncement(doc);
  if (doc.status === 'archived') {
    throw new AppError(400, 'Cannot publish archived announcement', 'INVALID_STATE');
  }

  doc.status = 'published';
  doc.publishedAt = new Date();
  doc.updatedBy = tid(user.id);
  await doc.save();

  await fanOutNotifications(tenantId, doc, user.id);
  return mapAnnouncement(doc);
}

export async function archive(
  tenantId: string,
  user: { id: string; roles: string[] },
  id: string
): Promise<AnnouncementPublic> {
  if (!isStaff(user.roles)) {
    throw new AppError(403, 'Not allowed', 'FORBIDDEN');
  }
  const doc = await Announcement.findOne(baseFilter(tenantId, { _id: tid(id) }));
  if (!doc) throw new AppError(404, 'Announcement not found', 'NOT_FOUND');
  doc.status = 'archived';
  doc.updatedBy = tid(user.id);
  await doc.save();
  return mapAnnouncement(doc);
}

async function fanOutNotifications(
  tenantId: string,
  doc: IAnnouncement,
  createdBy: string
): Promise<void> {
  const userIds = await resolveAudienceUserIds(tenantId, doc.audienceType, {
    courseId: idStr(doc.audienceFilter?.courseId) || undefined,
    programId: idStr(doc.audienceFilter?.programId) || undefined,
    sectionId: idStr(doc.audienceFilter?.sectionId) || undefined,
    roles: doc.audienceFilter?.roles,
  });

  const channels = (doc.channels || ['in_app']) as NotificationChannel[];
  // Cap fan-out for MVP safety
  const capped = userIds.slice(0, 500);

  for (const uid of capped) {
    if (uid === createdBy) continue; // skip author
    try {
      await notifyUser({
        tenantId,
        userId: uid,
        type: 'announcement',
        title: doc.title,
        body: doc.body.slice(0, 500),
        data: {
          entityType: 'announcement',
          entityId: String(doc._id),
          courseId: idStr(doc.audienceFilter?.courseId) || undefined,
          link: `/communication`,
        },
        priority: 'normal',
        channels,
        dedupeKey: `announcement:${doc._id}:${uid}`,
        createdBy,
      });
    } catch {
      /* continue fan-out */
    }
  }
}
