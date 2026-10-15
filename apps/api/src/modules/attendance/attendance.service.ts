import mongoose from 'mongoose';
import crypto from 'crypto';
import { AppError } from '../../middleware/errorHandler';
import { AttendanceSession, AttendanceRecord } from './attendance.model';
import { Course, CourseEnrollment } from '../courses/course.model';
import { Student } from '../students/student.model';
import { getAcademicConfig } from '../academic/academic.service';
import { assertCanAccessCourse, resolveStudentId } from '../learn/learn.service';
import type {
  AttendanceSessionPublic,
  AttendanceRecordPublic,
  AttendanceSummaryPublic,
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

function isAdminOrFaculty(roles: string[]) {
  return roles.some((r) =>
    ['super_admin', 'tenant_admin', 'university_admin', 'faculty'].includes(r)
  );
}

async function assertCanManage(
  tenantId: string,
  user: { id: string; roles: string[] },
  courseId: string
) {
  if (user.roles.some((r) => ['super_admin', 'tenant_admin', 'university_admin'].includes(r))) {
    return;
  }
  await assertCanAccessCourse(tenantId, user, courseId);
}

function mapSession(d: any, extra: Partial<AttendanceSessionPublic> = {}): AttendanceSessionPublic {
  return {
    id: String(d._id),
    tenantId: String(d.tenantId),
    courseId: String(d.courseId),
    offeringId: idStr(d.offeringId),
    sectionId: idStr(d.sectionId),
    date: d.date,
    startTime: d.startTime ?? null,
    endTime: d.endTime ?? null,
    sessionType: d.sessionType,
    topic: d.topic ?? null,
    title: d.title ?? null,
    markedBy: idStr(d.markedBy),
    method: d.method,
    status: d.status,
    qrToken: d.qrToken ?? null,
    presentCount: extra.presentCount,
    absentCount: extra.absentCount,
    totalMarked: extra.totalMarked,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
    courseName: extra.courseName,
  };
}

function mapRecord(d: any, extra: Partial<AttendanceRecordPublic> = {}): AttendanceRecordPublic {
  return {
    id: String(d._id),
    tenantId: String(d.tenantId),
    sessionId: String(d.sessionId),
    studentId: String(d.studentId),
    courseId: String(d.courseId),
    status: d.status,
    markedAt: d.markedAt ?? null,
    markedBy: idStr(d.markedBy),
    note: d.note ?? null,
    studentName: extra.studentName,
    studentCode: extra.studentCode,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  };
}

export async function listSessions(
  tenantId: string,
  q: {
    page: number;
    limit: number;
    courseId?: string;
    offeringId?: string;
    sectionId?: string;
    from?: string;
    to?: string;
    status?: string;
  },
  user: { id: string; roles: string[] }
) {
  const filter: Record<string, unknown> = baseFilter(tenantId);
  if (q.courseId) filter.courseId = tid(q.courseId);
  if (q.offeringId) filter.offeringId = tid(q.offeringId);
  if (q.sectionId) filter.sectionId = tid(q.sectionId);
  if (q.status) filter.status = q.status;
  if (q.from || q.to) {
    filter.date = {};
    if (q.from) (filter.date as any).$gte = new Date(q.from);
    if (q.to) (filter.date as any).$lte = new Date(q.to);
  }

  const skip = (q.page - 1) * q.limit;
  const [items, total] = await Promise.all([
    AttendanceSession.find(filter).sort({ date: -1 }).skip(skip).limit(q.limit).lean(),
    AttendanceSession.countDocuments(filter),
  ]);

  // counts per session
  const sessionIds = items.map((s) => s._id);
  const records = await AttendanceRecord.aggregate([
    {
      $match: {
        tenantId: tid(tenantId),
        sessionId: { $in: sessionIds },
        isDeleted: { $ne: true },
      },
    },
    {
      $group: {
        _id: { sessionId: '$sessionId', status: '$status' },
        count: { $sum: 1 },
      },
    },
  ]);

  const countMap = new Map<string, { present: number; absent: number; total: number }>();
  for (const r of records) {
    const sid = String(r._id.sessionId);
    if (!countMap.has(sid)) countMap.set(sid, { present: 0, absent: 0, total: 0 });
    const c = countMap.get(sid)!;
    c.total += r.count;
    if (r._id.status === 'present' || r._id.status === 'late') c.present += r.count;
    if (r._id.status === 'absent') c.absent += r.count;
  }

  const courseIds = [...new Set(items.map((s) => String(s.courseId)))];
  const courses = await Course.find({
    _id: { $in: courseIds.map(tid) },
    tenantId: tid(tenantId),
  })
    .select('name')
    .lean();
  const courseMap = new Map(courses.map((c) => [String(c._id), c.name]));

  return {
    items: items.map((s) => {
      const c = countMap.get(String(s._id));
      return mapSession(s, {
        presentCount: c?.present ?? 0,
        absentCount: c?.absent ?? 0,
        totalMarked: c?.total ?? 0,
        courseName: courseMap.get(String(s.courseId)),
      });
    }),
    page: q.page,
    limit: q.limit,
    total,
    totalPages: Math.ceil(total / q.limit) || 1,
  };
}

export async function createSession(
  tenantId: string,
  body: {
    courseId: string;
    offeringId?: string | null;
    sectionId?: string | null;
    date: string;
    startTime?: string | null;
    endTime?: string | null;
    sessionType?: string;
    topic?: string | null;
    title?: string | null;
    method?: string;
  },
  user: { id: string; roles: string[] }
) {
  await assertCanManage(tenantId, user, body.courseId);

  const course = await Course.findOne(baseFilter(tenantId, { _id: tid(body.courseId) }));
  if (!course) throw new AppError(404, 'Course not found', 'NOT_FOUND');

  const date = new Date(body.date);
  if (Number.isNaN(date.getTime())) {
    throw new AppError(400, 'Invalid date', 'INVALID_DATE');
  }

  const qrToken =
    body.method === 'qr' ? crypto.randomBytes(16).toString('hex') : null;

  const doc = await AttendanceSession.create({
    tenantId: tid(tenantId),
    courseId: tid(body.courseId),
    offeringId: body.offeringId ? tid(body.offeringId) : null,
    sectionId: body.sectionId ? tid(body.sectionId) : null,
    date,
    startTime: body.startTime ?? null,
    endTime: body.endTime ?? null,
    sessionType: body.sessionType || 'lecture',
    topic: body.topic ?? null,
    title: body.title ?? null,
    markedBy: tid(user.id),
    method: body.method || 'manual',
    status: 'open',
    qrToken,
    createdBy: tid(user.id),
    updatedBy: tid(user.id),
  });

  return mapSession(doc.toObject(), { courseName: course.name });
}

export async function getSession(
  tenantId: string,
  id: string,
  user: { id: string; roles: string[] }
) {
  const session = await AttendanceSession.findOne(baseFilter(tenantId, { _id: tid(id) })).lean();
  if (!session) throw new AppError(404, 'Session not found', 'NOT_FOUND');

  const isStudentOnly =
    user.roles.includes('student') && !isAdminOrFaculty(user.roles);
  if (!isStudentOnly) {
    await assertCanManage(tenantId, user, String(session.courseId));
  }

  const records = await AttendanceRecord.find({
    tenantId: tid(tenantId),
    sessionId: session._id,
    isDeleted: { $ne: true },
  }).lean();

  const studentIds = records.map((r) => r.studentId);
  const students = await Student.find({
    _id: { $in: studentIds },
    tenantId: tid(tenantId),
  })
    .select('firstName lastName rollNumber registrationNumber')
    .lean();
  const studentMap = new Map(
    students.map((s) => [
      String(s._id),
      {
        name: `${s.firstName || ''} ${s.lastName || ''}`.trim(),
        code: (s as any).rollNumber || (s as any).registrationNumber,
      },
    ])
  );

  return {
    session: mapSession(session),
    records: records.map((r) => {
      const s = studentMap.get(String(r.studentId));
      return mapRecord(r, { studentName: s?.name, studentCode: s?.code });
    }),
  };
}

export async function updateSession(
  tenantId: string,
  id: string,
  body: {
    date?: string;
    startTime?: string | null;
    endTime?: string | null;
    sessionType?: string;
    topic?: string | null;
    title?: string | null;
  },
  user: { id: string; roles: string[] }
) {
  const session = await AttendanceSession.findOne(baseFilter(tenantId, { _id: tid(id) }));
  if (!session) throw new AppError(404, 'Session not found', 'NOT_FOUND');
  await assertCanManage(tenantId, user, String(session.courseId));
  if (session.status === 'closed') {
    throw new AppError(400, 'Cannot update closed session', 'SESSION_CLOSED');
  }

  if (body.date) {
    const d = new Date(body.date);
    if (Number.isNaN(d.getTime())) throw new AppError(400, 'Invalid date', 'INVALID_DATE');
    session.date = d;
  }
  if (body.startTime !== undefined) session.startTime = body.startTime;
  if (body.endTime !== undefined) session.endTime = body.endTime;
  if (body.sessionType) session.sessionType = body.sessionType as any;
  if (body.topic !== undefined) session.topic = body.topic;
  if (body.title !== undefined) session.title = body.title;
  session.updatedBy = tid(user.id);
  await session.save();
  return mapSession(session.toObject());
}

export async function closeSession(
  tenantId: string,
  id: string,
  user: { id: string; roles: string[] }
) {
  const session = await AttendanceSession.findOne(baseFilter(tenantId, { _id: tid(id) }));
  if (!session) throw new AppError(404, 'Session not found', 'NOT_FOUND');
  await assertCanManage(tenantId, user, String(session.courseId));
  session.status = 'closed';
  session.updatedBy = tid(user.id);
  await session.save();
  return mapSession(session.toObject());
}

export async function bulkMarkRecords(
  tenantId: string,
  sessionId: string,
  body: {
    records: Array<{ studentId: string; status: string; note?: string | null }>;
  },
  user: { id: string; roles: string[] }
) {
  const session = await AttendanceSession.findOne(
    baseFilter(tenantId, { _id: tid(sessionId) })
  );
  if (!session) throw new AppError(404, 'Session not found', 'NOT_FOUND');
  await assertCanManage(tenantId, user, String(session.courseId));

  const results: AttendanceRecordPublic[] = [];
  for (const item of body.records) {
    const doc = await AttendanceRecord.findOneAndUpdate(
      {
        tenantId: tid(tenantId),
        sessionId: session._id,
        studentId: tid(item.studentId),
      },
      {
        $set: {
          courseId: session.courseId,
          status: item.status,
          note: item.note ?? null,
          markedAt: new Date(),
          markedBy: tid(user.id),
          updatedBy: tid(user.id),
          isDeleted: false,
        },
        $setOnInsert: {
          createdBy: tid(user.id),
        },
      },
      { upsert: true, new: true }
    );
    results.push(mapRecord(doc.toObject()));
  }
  return { records: results };
}

export async function markSingle(
  tenantId: string,
  sessionId: string,
  body: { studentId: string; status: string; note?: string | null },
  user: { id: string; roles: string[] }
) {
  const result = await bulkMarkRecords(tenantId, sessionId, { records: [body] }, user);
  return result.records[0];
}

export async function getSummary(
  tenantId: string,
  q: { courseId: string; offeringId?: string },
  user: { id: string; roles: string[] }
): Promise<AttendanceSummaryPublic[]> {
  await assertCanManage(tenantId, user, q.courseId);

  const config = await getAcademicConfig(tenantId);
  const minimumPercent = config.attendanceRules?.minimumPercent ?? 75;

  const sessionFilter: Record<string, unknown> = baseFilter(tenantId, {
    courseId: tid(q.courseId),
    status: 'closed',
  });
  if (q.offeringId) sessionFilter.offeringId = tid(q.offeringId);

  const sessions = await AttendanceSession.find(sessionFilter).select('_id').lean();
  const sessionIds = sessions.map((s) => s._id);
  const totalSessions = sessionIds.length;

  const enrollFilter: Record<string, unknown> = {
    tenantId: tid(tenantId),
    courseId: tid(q.courseId),
    status: { $in: ['enrolled', 'completed'] },
  };
  if (q.offeringId) enrollFilter.offeringId = tid(q.offeringId);

  const enrollments = await CourseEnrollment.find(enrollFilter).select('studentId').lean();
  const studentIds = enrollments.map((e) => e.studentId);

  const students = await Student.find({
    _id: { $in: studentIds },
    tenantId: tid(tenantId),
    isDeleted: { $ne: true },
  })
    .select('firstName lastName rollNumber registrationNumber')
    .lean();

  const records =
    totalSessions > 0
      ? await AttendanceRecord.find({
          tenantId: tid(tenantId),
          sessionId: { $in: sessionIds },
          studentId: { $in: studentIds },
          isDeleted: { $ne: true },
        })
          .select('studentId status')
          .lean()
      : [];

  const counts = new Map<
    string,
    { present: number; absent: number; late: number; excused: number; holiday: number }
  >();
  for (const s of students) {
    counts.set(String(s._id), {
      present: 0,
      absent: 0,
      late: 0,
      excused: 0,
      holiday: 0,
    });
  }
  for (const r of records) {
    const c = counts.get(String(r.studentId));
    if (!c) continue;
    if (r.status === 'present') c.present += 1;
    else if (r.status === 'absent') c.absent += 1;
    else if (r.status === 'late') c.late += 1;
    else if (r.status === 'excused') c.excused += 1;
    else if (r.status === 'holiday') c.holiday += 1;
  }

  return students.map((s) => {
    const sid = String(s._id);
    const c = counts.get(sid)!;
    const attended = c.present + c.late;
    const percent = totalSessions > 0 ? Math.round((attended / totalSessions) * 10000) / 100 : 0;
    return {
      studentId: sid,
      courseId: q.courseId,
      presentCount: c.present,
      absentCount: c.absent,
      lateCount: c.late,
      excusedCount: c.excused,
      holidayCount: c.holiday,
      totalSessions,
      percent,
      isShortage: totalSessions > 0 && percent < minimumPercent,
      minimumPercent,
      studentName: `${s.firstName || ''} ${s.lastName || ''}`.trim(),
      studentCode: (s as any).rollNumber || (s as any).registrationNumber,
    };
  });
}

export async function myAttendance(
  tenantId: string,
  q: { courseId?: string },
  user: { id: string; roles: string[] }
) {
  const studentId = await resolveStudentId(tenantId, user);

  if (!q.courseId) {
    // list summaries for all enrolled courses
    const enrollments = await CourseEnrollment.find({
      tenantId: tid(tenantId),
      studentId: tid(studentId),
      status: { $in: ['enrolled', 'completed'] },
    })
      .select('courseId')
      .lean();

    const summaries: AttendanceSummaryPublic[] = [];
    for (const e of enrollments) {
      const courseId = String(e.courseId);
      const one = await getSummaryForStudent(tenantId, courseId, studentId);
      summaries.push(one);
    }
    return { summaries, sessions: [] as AttendanceSessionPublic[], records: [] as AttendanceRecordPublic[] };
  }

  const summary = await getSummaryForStudent(tenantId, q.courseId, studentId);

  const sessions = await AttendanceSession.find(
    baseFilter(tenantId, { courseId: tid(q.courseId) })
  )
    .sort({ date: -1 })
    .limit(50)
    .lean();

  const sessionIds = sessions.map((s) => s._id);
  const records = await AttendanceRecord.find({
    tenantId: tid(tenantId),
    sessionId: { $in: sessionIds },
    studentId: tid(studentId),
    isDeleted: { $ne: true },
  }).lean();

  return {
    summary,
    sessions: sessions.map((s) => mapSession(s)),
    records: records.map((r) => mapRecord(r)),
  };
}

async function getSummaryForStudent(
  tenantId: string,
  courseId: string,
  studentId: string
): Promise<AttendanceSummaryPublic> {
  const config = await getAcademicConfig(tenantId);
  const minimumPercent = config.attendanceRules?.minimumPercent ?? 75;

  const sessions = await AttendanceSession.find(
    baseFilter(tenantId, { courseId: tid(courseId), status: 'closed' })
  )
    .select('_id')
    .lean();
  const totalSessions = sessions.length;
  const sessionIds = sessions.map((s) => s._id);

  const records =
    totalSessions > 0
      ? await AttendanceRecord.find({
          tenantId: tid(tenantId),
          sessionId: { $in: sessionIds },
          studentId: tid(studentId),
          isDeleted: { $ne: true },
        })
          .select('status')
          .lean()
      : [];

  let present = 0,
    absent = 0,
    late = 0,
    excused = 0,
    holiday = 0;
  for (const r of records) {
    if (r.status === 'present') present += 1;
    else if (r.status === 'absent') absent += 1;
    else if (r.status === 'late') late += 1;
    else if (r.status === 'excused') excused += 1;
    else if (r.status === 'holiday') holiday += 1;
  }

  const percent =
    totalSessions > 0 ? Math.round(((present + late) / totalSessions) * 10000) / 100 : 0;

  return {
    studentId,
    courseId,
    presentCount: present,
    absentCount: absent,
    lateCount: late,
    excusedCount: excused,
    holidayCount: holiday,
    totalSessions,
    percent,
    isShortage: totalSessions > 0 && percent < minimumPercent,
    minimumPercent,
  };
}

export async function shortageReport(
  tenantId: string,
  q: { courseId: string; offeringId?: string },
  user: { id: string; roles: string[] }
) {
  const all = await getSummary(tenantId, q, user);
  return all.filter((s) => s.isShortage);
}
