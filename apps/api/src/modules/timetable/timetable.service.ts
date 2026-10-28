import mongoose from 'mongoose';
import { AppError } from '../../middleware/errorHandler';
import {
  Room,
  TimetableEntry,
  TimetableSubstitution,
  type ITimetableEntry,
} from './timetable.model';
import type {
  RoomPublic,
  TimetableEntryPublic,
  TimetableSubstitutionPublic,
  TimetableConflict,
  CalendarEventPublic,
  DayOfWeek,
  RoomType,
  TimeTableSlotStatus,
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

/** Convert HH:mm to minutes from midnight */
function toMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

function timesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  const as = toMinutes(aStart);
  const ae = toMinutes(aEnd);
  const bs = toMinutes(bStart);
  const be = toMinutes(bEnd);
  return as < be && bs < ae;
}

function mapRoom(d: any): RoomPublic {
  return {
    id: String(d._id),
    tenantId: String(d.tenantId),
    campusId: idStr(d.campusId),
    building: d.building ?? null,
    name: d.name,
    code: d.code,
    capacity: d.capacity,
    roomType: d.roomType,
    facilities: d.facilities ?? null,
    isActive: !!d.isActive,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  };
}

function mapEntry(d: any, extra: Partial<TimetableEntryPublic> = {}): TimetableEntryPublic {
  return {
    id: String(d._id),
    tenantId: String(d.tenantId),
    academicYearId: idStr(d.academicYearId),
    termId: idStr(d.termId),
    courseId: String(d.courseId),
    courseName: extra.courseName ?? null,
    courseCode: extra.courseCode ?? null,
    sectionId: idStr(d.sectionId),
    batchId: idStr(d.batchId),
    facultyId: String(d.facultyId),
    facultyName: extra.facultyName ?? null,
    roomId: idStr(d.roomId),
    roomName: extra.roomName ?? null,
    dayOfWeek: d.dayOfWeek as DayOfWeek,
    startTime: d.startTime,
    endTime: d.endTime,
    validFrom: d.validFrom ?? null,
    validTo: d.validTo ?? null,
    status: d.status,
    substitutionOfEntryId: idStr(d.substitutionOfEntryId),
    notes: d.notes ?? null,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  };
}

function mapSub(d: any): TimetableSubstitutionPublic {
  return {
    id: String(d._id),
    tenantId: String(d.tenantId),
    originalEntryId: String(d.originalEntryId),
    newFacultyId: idStr(d.newFacultyId),
    newRoomId: idStr(d.newRoomId),
    newStartTime: d.newStartTime ?? null,
    newEndTime: d.newEndTime ?? null,
    date: d.date,
    reason: d.reason ?? null,
    createdBy: idStr(d.createdBy),
    createdAt: d.createdAt,
  };
}

async function enrichEntry(tenantId: string, d: any): Promise<TimetableEntryPublic> {
  const extra: Partial<TimetableEntryPublic> = {};
  try {
    const Course = mongoose.models.Course;
    if (Course && d.courseId) {
      const c = await Course.findById(d.courseId).select('name code').lean();
      if (c) {
        extra.courseName = (c as any).name;
        extra.courseCode = (c as any).code;
      }
    }
    const Faculty = mongoose.models.Faculty;
    if (Faculty && d.facultyId) {
      const f = await Faculty.findById(d.facultyId).select('firstName lastName employeeId').lean();
      if (f) {
        extra.facultyName =
          [((f as any).firstName || ''), ((f as any).lastName || '')].join(' ').trim() ||
          (f as any).employeeId ||
          null;
      }
    }
    if (d.roomId) {
      const r = await Room.findOne(baseFilter(tenantId, { _id: d.roomId })).lean();
      if (r) extra.roomName = r.name;
    }
  } catch {
    /* ignore enrichment errors */
  }
  return mapEntry(d, extra);
}

// ─── Rooms ───────────────────────────────────────────────────────────────────

export async function listRooms(
  tenantId: string,
  opts: { page?: number; limit?: number; isActive?: boolean } = {}
) {
  const page = Math.max(1, opts.page ?? 1);
  const limit = Math.min(100, Math.max(1, opts.limit ?? 50));
  const filter: Record<string, unknown> = baseFilter(tenantId);
  if (opts.isActive !== undefined) filter.isActive = opts.isActive;
  const [items, total] = await Promise.all([
    Room.find(filter)
      .sort({ code: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Room.countDocuments(filter),
  ]);
  return { items: items.map(mapRoom), total };
}

export async function createRoom(
  tenantId: string,
  input: {
    name: string;
    code: string;
    capacity?: number;
    roomType?: RoomType;
    campusId?: string | null;
    building?: string | null;
    facilities?: string[] | null;
    isActive?: boolean;
  },
  userId?: string
): Promise<RoomPublic> {
  const doc = await Room.create({
    tenantId: tid(tenantId),
    name: input.name.trim(),
    code: input.code.trim().toUpperCase(),
    capacity: input.capacity ?? 30,
    roomType: input.roomType ?? 'classroom',
    campusId: input.campusId ? tid(input.campusId) : null,
    building: input.building ?? null,
    facilities: input.facilities ?? null,
    isActive: input.isActive !== false,
    createdBy: userId ? tid(userId) : null,
  });
  return mapRoom(doc);
}

export async function updateRoom(
  tenantId: string,
  id: string,
  input: Partial<{
    name: string;
    capacity: number;
    roomType: RoomType;
    building: string | null;
    facilities: string[] | null;
    isActive: boolean;
    campusId: string | null;
  }>
): Promise<RoomPublic> {
  const doc = await Room.findOne(baseFilter(tenantId, { _id: tid(id) }));
  if (!doc) throw new AppError(404, 'Room not found', 'NOT_FOUND');
  if (input.name !== undefined) doc.name = input.name.trim();
  if (input.capacity !== undefined) doc.capacity = input.capacity;
  if (input.roomType !== undefined) doc.roomType = input.roomType;
  if (input.building !== undefined) doc.building = input.building;
  if (input.facilities !== undefined) doc.facilities = input.facilities;
  if (input.isActive !== undefined) doc.isActive = input.isActive;
  if (input.campusId !== undefined) doc.campusId = input.campusId ? tid(input.campusId) : null;
  await doc.save();
  return mapRoom(doc);
}

export async function deleteRoom(tenantId: string, id: string): Promise<void> {
  const doc = await Room.findOne(baseFilter(tenantId, { _id: tid(id) }));
  if (!doc) throw new AppError(404, 'Room not found', 'NOT_FOUND');
  doc.isDeleted = true;
  doc.deletedAt = new Date();
  await doc.save();
}

// ─── Conflict engine ─────────────────────────────────────────────────────────

export interface EntryDraft {
  courseId: string;
  facultyId: string;
  roomId?: string | null;
  sectionId?: string | null;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  excludeEntryId?: string | null;
}

export async function checkConflicts(
  tenantId: string,
  draft: EntryDraft
): Promise<TimetableConflict[]> {
  if (toMinutes(draft.startTime) >= toMinutes(draft.endTime)) {
    throw new AppError(400, 'endTime must be after startTime', 'VALIDATION_ERROR');
  }

  const conflicts: TimetableConflict[] = [];
  const filter: Record<string, unknown> = baseFilter(tenantId, {
    dayOfWeek: draft.dayOfWeek,
    status: { $in: ['scheduled', 'substituted'] },
  });
  if (draft.excludeEntryId) {
    filter._id = { $ne: tid(draft.excludeEntryId) };
  }

  const candidates = await TimetableEntry.find(filter).lean();

  for (const e of candidates) {
    if (!timesOverlap(draft.startTime, draft.endTime, e.startTime, e.endTime)) continue;

    if (String(e.facultyId) === draft.facultyId) {
      conflicts.push({
        type: 'faculty',
        message: `Faculty already scheduled ${e.startTime}–${e.endTime}`,
        entryId: String(e._id),
        facultyId: draft.facultyId,
      });
    }
    if (draft.roomId && e.roomId && String(e.roomId) === draft.roomId) {
      conflicts.push({
        type: 'room',
        message: `Room already booked ${e.startTime}–${e.endTime}`,
        entryId: String(e._id),
        roomId: draft.roomId,
      });
    }
    if (draft.sectionId && e.sectionId && String(e.sectionId) === draft.sectionId) {
      conflicts.push({
        type: 'section',
        message: `Section already has a class ${e.startTime}–${e.endTime}`,
        entryId: String(e._id),
        sectionId: draft.sectionId,
      });
    }
  }

  return conflicts;
}

// ─── Entries ─────────────────────────────────────────────────────────────────

export async function listEntries(
  tenantId: string,
  opts: {
    facultyId?: string;
    sectionId?: string;
    roomId?: string;
    courseId?: string;
    dayOfWeek?: number;
    status?: string;
    page?: number;
    limit?: number;
  } = {}
) {
  const page = Math.max(1, opts.page ?? 1);
  const limit = Math.min(200, Math.max(1, opts.limit ?? 50));
  const filter: Record<string, unknown> = baseFilter(tenantId);
  if (opts.facultyId) filter.facultyId = tid(opts.facultyId);
  if (opts.sectionId) filter.sectionId = tid(opts.sectionId);
  if (opts.roomId) filter.roomId = tid(opts.roomId);
  if (opts.courseId) filter.courseId = tid(opts.courseId);
  if (opts.dayOfWeek !== undefined) filter.dayOfWeek = opts.dayOfWeek;
  if (opts.status) filter.status = opts.status;

  const [docs, total] = await Promise.all([
    TimetableEntry.find(filter)
      .sort({ dayOfWeek: 1, startTime: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    TimetableEntry.countDocuments(filter),
  ]);

  const items: TimetableEntryPublic[] = [];
  for (const d of docs) items.push(await enrichEntry(tenantId, d));
  return { items, total };
}

export async function createEntry(
  tenantId: string,
  input: {
    courseId: string;
    facultyId: string;
    roomId?: string | null;
    sectionId?: string | null;
    batchId?: string | null;
    academicYearId?: string | null;
    termId?: string | null;
    dayOfWeek: DayOfWeek;
    startTime: string;
    endTime: string;
    validFrom?: string | null;
    validTo?: string | null;
    notes?: string | null;
    force?: boolean;
  },
  userId?: string
): Promise<{ entry: TimetableEntryPublic; conflicts: TimetableConflict[] }> {
  const conflicts = await checkConflicts(tenantId, {
    courseId: input.courseId,
    facultyId: input.facultyId,
    roomId: input.roomId,
    sectionId: input.sectionId,
    dayOfWeek: input.dayOfWeek,
    startTime: input.startTime,
    endTime: input.endTime,
  });

  if (conflicts.length && !input.force) {
    throw new AppError(409, 'Schedule conflicts detected', 'CONFLICT', { conflicts });
  }

  const doc = await TimetableEntry.create({
    tenantId: tid(tenantId),
    courseId: tid(input.courseId),
    facultyId: tid(input.facultyId),
    roomId: input.roomId ? tid(input.roomId) : null,
    sectionId: input.sectionId ? tid(input.sectionId) : null,
    batchId: input.batchId ? tid(input.batchId) : null,
    academicYearId: input.academicYearId ? tid(input.academicYearId) : null,
    termId: input.termId ? tid(input.termId) : null,
    dayOfWeek: input.dayOfWeek,
    startTime: input.startTime,
    endTime: input.endTime,
    validFrom: input.validFrom ? new Date(input.validFrom) : null,
    validTo: input.validTo ? new Date(input.validTo) : null,
    notes: input.notes ?? null,
    status: 'scheduled',
    createdBy: userId ? tid(userId) : null,
  });

  return { entry: await enrichEntry(tenantId, doc), conflicts };
}

export async function updateEntry(
  tenantId: string,
  id: string,
  input: Partial<{
    courseId: string;
    facultyId: string;
    roomId: string | null;
    sectionId: string | null;
    dayOfWeek: DayOfWeek;
    startTime: string;
    endTime: string;
    notes: string | null;
    force: boolean;
  }>,
  userId?: string
): Promise<{ entry: TimetableEntryPublic; conflicts: TimetableConflict[] }> {
  const doc = await TimetableEntry.findOne(baseFilter(tenantId, { _id: tid(id) }));
  if (!doc) throw new AppError(404, 'Entry not found', 'NOT_FOUND');
  if (doc.status === 'cancelled') {
    throw new AppError(400, 'Cannot edit cancelled entry', 'INVALID_STATE');
  }

  const facultyId = input.facultyId ?? String(doc.facultyId);
  const roomId = input.roomId !== undefined ? input.roomId : idStr(doc.roomId);
  const sectionId = input.sectionId !== undefined ? input.sectionId : idStr(doc.sectionId);
  const dayOfWeek = (input.dayOfWeek ?? doc.dayOfWeek) as DayOfWeek;
  const startTime = input.startTime ?? doc.startTime;
  const endTime = input.endTime ?? doc.endTime;
  const courseId = input.courseId ?? String(doc.courseId);

  const conflicts = await checkConflicts(tenantId, {
    courseId,
    facultyId,
    roomId,
    sectionId,
    dayOfWeek,
    startTime,
    endTime,
    excludeEntryId: id,
  });
  if (conflicts.length && !input.force) {
    throw new AppError(409, 'Schedule conflicts detected', 'CONFLICT', { conflicts });
  }

  if (input.courseId) doc.courseId = tid(input.courseId);
  if (input.facultyId) doc.facultyId = tid(input.facultyId);
  if (input.roomId !== undefined) doc.roomId = input.roomId ? tid(input.roomId) : null;
  if (input.sectionId !== undefined) doc.sectionId = input.sectionId ? tid(input.sectionId) : null;
  if (input.dayOfWeek !== undefined) doc.dayOfWeek = input.dayOfWeek;
  if (input.startTime) doc.startTime = input.startTime;
  if (input.endTime) doc.endTime = input.endTime;
  if (input.notes !== undefined) doc.notes = input.notes;
  doc.updatedBy = userId ? tid(userId) : null;
  await doc.save();

  return { entry: await enrichEntry(tenantId, doc), conflicts };
}

export async function softDeleteEntry(tenantId: string, id: string): Promise<void> {
  const doc = await TimetableEntry.findOne(baseFilter(tenantId, { _id: tid(id) }));
  if (!doc) throw new AppError(404, 'Entry not found', 'NOT_FOUND');
  doc.isDeleted = true;
  doc.deletedAt = new Date();
  await doc.save();
}

export async function cancelEntry(
  tenantId: string,
  id: string,
  userId?: string
): Promise<TimetableEntryPublic> {
  const doc = await TimetableEntry.findOne(baseFilter(tenantId, { _id: tid(id) }));
  if (!doc) throw new AppError(404, 'Entry not found', 'NOT_FOUND');
  doc.status = 'cancelled' as TimeTableSlotStatus;
  doc.updatedBy = userId ? tid(userId) : null;
  await doc.save();
  return enrichEntry(tenantId, doc);
}

export async function substituteEntry(
  tenantId: string,
  id: string,
  input: {
    date: string;
    newFacultyId?: string | null;
    newRoomId?: string | null;
    newStartTime?: string | null;
    newEndTime?: string | null;
    reason?: string | null;
  },
  userId?: string
): Promise<{ substitution: TimetableSubstitutionPublic; entry: TimetableEntryPublic }> {
  const doc = await TimetableEntry.findOne(baseFilter(tenantId, { _id: tid(id) }));
  if (!doc) throw new AppError(404, 'Entry not found', 'NOT_FOUND');
  if (doc.status === 'cancelled') {
    throw new AppError(400, 'Cannot substitute cancelled entry', 'INVALID_STATE');
  }

  const sub = await TimetableSubstitution.create({
    tenantId: tid(tenantId),
    originalEntryId: doc._id,
    newFacultyId: input.newFacultyId ? tid(input.newFacultyId) : null,
    newRoomId: input.newRoomId ? tid(input.newRoomId) : null,
    newStartTime: input.newStartTime ?? null,
    newEndTime: input.newEndTime ?? null,
    date: new Date(input.date),
    reason: input.reason ?? null,
    createdBy: userId ? tid(userId) : null,
  });

  doc.status = 'substituted' as TimeTableSlotStatus;
  if (input.newFacultyId) doc.facultyId = tid(input.newFacultyId);
  if (input.newRoomId) doc.roomId = tid(input.newRoomId);
  if (input.newStartTime) doc.startTime = input.newStartTime;
  if (input.newEndTime) doc.endTime = input.newEndTime;
  doc.updatedBy = userId ? tid(userId) : null;
  await doc.save();

  return {
    substitution: mapSub(sub),
    entry: await enrichEntry(tenantId, doc),
  };
}

// ─── Calendar / me ───────────────────────────────────────────────────────────

export async function calendarMe(
  tenantId: string,
  user: { id: string; roles: string[] },
  opts: { dayOfWeek?: number } = {}
): Promise<CalendarEventPublic[]> {
  const isStaff = user.roles.some((r) =>
    ['super_admin', 'tenant_admin', 'university_admin', 'faculty'].includes(r)
  );
  const isStudent = user.roles.includes('student') && !isStaff;

  let entries: ITimetableEntry[] | any[] = [];

  if (isStudent) {
    const Student = mongoose.models.Student;
    const CourseEnrollment = mongoose.models.CourseEnrollment;
    if (!Student) return [];
    const st = await Student.findOne({
      tenantId: tid(tenantId),
      userId: tid(user.id),
      isDeleted: { $ne: true },
    })
      .select('_id sectionId')
      .lean();
    if (!st) return [];

    const courseIds: string[] = [];
    if (CourseEnrollment) {
      const enrolls = await CourseEnrollment.find({
        tenantId: tid(tenantId),
        studentId: (st as any)._id,
        isDeleted: { $ne: true },
        status: { $in: ['enrolled', 'active', 'provisional'] },
      })
        .select('courseId')
        .lean();
      for (const e of enrolls) courseIds.push(String((e as any).courseId));
    }

    const filter: Record<string, unknown> = baseFilter(tenantId, {
      status: { $ne: 'cancelled' },
    });
    if (opts.dayOfWeek !== undefined) filter.dayOfWeek = opts.dayOfWeek;

    const or: Record<string, unknown>[] = [];
    if ((st as any).sectionId) or.push({ sectionId: (st as any).sectionId });
    if (courseIds.length) or.push({ courseId: { $in: courseIds.map((c) => tid(c)) } });
    if (!or.length) return [];
    filter.$or = or;

    entries = await TimetableEntry.find(filter).sort({ dayOfWeek: 1, startTime: 1 }).lean();
  } else if (user.roles.includes('faculty') || isStaff) {
    const Faculty = mongoose.models.Faculty;
    let facultyId: string | null = null;
    if (Faculty) {
      const f = await Faculty.findOne({
        tenantId: tid(tenantId),
        userId: tid(user.id),
        isDeleted: { $ne: true },
      })
        .select('_id')
        .lean();
      if (f) facultyId = String((f as any)._id);
    }

    const filter: Record<string, unknown> = baseFilter(tenantId, {
      status: { $ne: 'cancelled' },
    });
    if (opts.dayOfWeek !== undefined) filter.dayOfWeek = opts.dayOfWeek;

    // Faculty: own teaching; admins without faculty profile see all if manage
    if (facultyId && !user.roles.some((r) => ['tenant_admin', 'university_admin', 'super_admin'].includes(r))) {
      filter.facultyId = tid(facultyId);
    }

    entries = await TimetableEntry.find(filter)
      .sort({ dayOfWeek: 1, startTime: 1 })
      .limit(200)
      .lean();
  }

  const events: CalendarEventPublic[] = [];
  for (const e of entries) {
    const enriched = await enrichEntry(tenantId, e);
    events.push({
      id: enriched.id,
      type: 'class',
      title: enriched.courseCode
        ? `${enriched.courseCode} — ${enriched.courseName || 'Class'}`
        : enriched.courseName || 'Class',
      dayOfWeek: enriched.dayOfWeek,
      startTime: enriched.startTime,
      endTime: enriched.endTime,
      courseId: enriched.courseId,
      roomName: enriched.roomName,
      facultyName: enriched.facultyName,
      status: enriched.status,
    });
  }
  return events;
}
