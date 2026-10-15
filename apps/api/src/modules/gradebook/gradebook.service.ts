import mongoose from 'mongoose';
import { AppError } from '../../middleware/errorHandler';
import { Gradebook, GradeEntry, GradebookTotal, Result } from './gradebook.model';
import { Assignment, AssignmentSubmission } from '../assignments/assignment.model';
import { Quiz, QuizAttempt } from '../quizzes/quiz.model';
import { Course, CourseEnrollment } from '../courses/course.model';
import { Student } from '../students/student.model';
import { AttendanceSession, AttendanceRecord } from '../attendance/attendance.model';
import { getAcademicConfig } from '../academic/academic.service';
import { assertCanAccessCourse } from '../learn/learn.service';
import type {
  GradebookPublic,
  GradeEntryPublic,
  GradebookTotalPublic,
  StudentGradeRow,
  ResultPublic,
  TranscriptItem,
  GradeBand,
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

function mapComponent(c: any) {
  return {
    key: c.key,
    name: c.name,
    type: c.type,
    weightPercent: c.weightPercent,
    maxMarks: c.maxMarks,
    source: c.source,
    sourceIds: (c.sourceIds || []).map((x: any) => String(x)),
    dropLowest: c.dropLowest ?? 0,
  };
}

function mapGradebook(d: any, extra: Partial<GradebookPublic> = {}): GradebookPublic {
  return {
    id: String(d._id),
    tenantId: String(d.tenantId),
    courseId: String(d.courseId),
    offeringId: idStr(d.offeringId),
    academicYearId: idStr(d.academicYearId),
    semesterId: idStr(d.semesterId),
    title: d.title,
    status: d.status,
    components: (d.components || []).map(mapComponent),
    lockedAt: d.lockedAt ?? null,
    lockedBy: idStr(d.lockedBy),
    publishedAt: d.publishedAt ?? null,
    publishedBy: idStr(d.publishedBy),
    createdBy: idStr(d.createdBy),
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
    courseName: extra.courseName,
    courseCode: extra.courseCode,
  };
}

function mapEntry(d: any): GradeEntryPublic {
  return {
    id: String(d._id),
    tenantId: String(d.tenantId),
    gradebookId: String(d.gradebookId),
    studentId: String(d.studentId),
    componentKey: d.componentKey,
    rawMarks: d.rawMarks,
    maxMarks: d.maxMarks,
    percent: d.percent,
    overriddenMarks: d.overriddenMarks ?? null,
    overrideReason: d.overrideReason ?? null,
    overriddenBy: idStr(d.overriddenBy),
    sourceRef: d.sourceRef
      ? { type: d.sourceRef.type, id: String(d.sourceRef.id) }
      : null,
    isExcluded: !!d.isExcluded,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  };
}

function mapTotal(d: any, extra: Partial<GradebookTotalPublic> = {}): GradebookTotalPublic {
  return {
    id: String(d._id),
    tenantId: String(d.tenantId),
    gradebookId: String(d.gradebookId),
    studentId: String(d.studentId),
    weightedPercent: d.weightedPercent,
    letterGrade: d.letterGrade ?? null,
    gradePoint: d.gradePoint ?? null,
    rank: d.rank ?? null,
    isPass: d.isPass ?? null,
    recomputedAt: d.recomputedAt ?? null,
    studentName: extra.studentName,
    studentCode: extra.studentCode,
  };
}

function mapResult(d: any, extra: Partial<ResultPublic> = {}): ResultPublic {
  return {
    id: String(d._id),
    tenantId: String(d.tenantId),
    gradebookId: String(d.gradebookId),
    studentId: String(d.studentId),
    status: d.status,
    publishedAt: d.publishedAt ?? null,
    publishedBy: idStr(d.publishedBy),
    weightedPercent: d.weightedPercent,
    letterGrade: d.letterGrade ?? null,
    gradePoint: d.gradePoint ?? null,
    isPass: d.isPass ?? null,
    components: d.components || [],
    remarks: d.remarks ?? null,
    courseId: idStr(d.courseId) ?? undefined,
    courseName: extra.courseName,
    courseCode: extra.courseCode,
    title: extra.title,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  };
}

function letterFromPercent(percent: number, bands: GradeBand[]): {
  letter: string;
  gradePoint: number;
} {
  const sorted = [...bands].sort((a, b) => b.minPercent - a.minPercent);
  for (const b of sorted) {
    if (percent >= b.minPercent && percent <= b.maxPercent + 0.001) {
      return { letter: b.letter, gradePoint: b.gradePoint };
    }
  }
  // fallback lowest
  const lowest = sorted[sorted.length - 1];
  if (lowest) return { letter: lowest.letter, gradePoint: lowest.gradePoint };
  return { letter: 'F', gradePoint: 0 };
}

function effectiveMarks(entry: {
  rawMarks: number;
  overriddenMarks?: number | null;
  isExcluded?: boolean;
}): number | null {
  if (entry.isExcluded) return null;
  if (entry.overriddenMarks != null && !Number.isNaN(entry.overriddenMarks)) {
    return entry.overriddenMarks;
  }
  return entry.rawMarks;
}

// ─── List / CRUD ─────────────────────────────────────────────────────────────

export async function listGradebooks(
  tenantId: string,
  q: {
    page: number;
    limit: number;
    courseId?: string;
    offeringId?: string;
    status?: string;
    search?: string;
  },
  user: { id: string; roles: string[] }
) {
  const filter: Record<string, unknown> = baseFilter(tenantId);
  if (q.courseId) filter.courseId = tid(q.courseId);
  if (q.offeringId) filter.offeringId = tid(q.offeringId);
  if (q.status) filter.status = q.status;
  if (q.search) filter.title = { $regex: q.search, $options: 'i' };

  const isStudentOnly =
    user.roles.includes('student') && !isAdminOrFaculty(user.roles);
  if (isStudentOnly) {
    // students only see published gradebooks for their enrollments — handled in my-grades
    filter.status = 'published';
  }

  const skip = (q.page - 1) * q.limit;
  const [items, total] = await Promise.all([
    Gradebook.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(q.limit).lean(),
    Gradebook.countDocuments(filter),
  ]);

  const courseIds = [...new Set(items.map((g) => String(g.courseId)))];
  const courses = await Course.find({
    _id: { $in: courseIds.map(tid) },
    tenantId: tid(tenantId),
  })
    .select('name code')
    .lean();
  const courseMap = new Map(courses.map((c) => [String(c._id), c]));

  return {
    items: items.map((g) => {
      const c = courseMap.get(String(g.courseId));
      return mapGradebook(g, {
        courseName: c?.name,
        courseCode: (c as any)?.code,
      });
    }),
    page: q.page,
    limit: q.limit,
    total,
    totalPages: Math.ceil(total / q.limit) || 1,
  };
}

export async function createGradebook(
  tenantId: string,
  body: {
    courseId: string;
    offeringId?: string | null;
    academicYearId?: string | null;
    semesterId?: string | null;
    title: string;
    components: any[];
  },
  user: { id: string; roles: string[] }
) {
  await assertCanManage(tenantId, user, body.courseId);

  const course = await Course.findOne(baseFilter(tenantId, { _id: tid(body.courseId) }));
  if (!course) throw new AppError(404, 'Course not found', 'NOT_FOUND');

  const doc = await Gradebook.create({
    tenantId: tid(tenantId),
    courseId: tid(body.courseId),
    offeringId: body.offeringId ? tid(body.offeringId) : null,
    academicYearId: body.academicYearId ? tid(body.academicYearId) : null,
    semesterId: body.semesterId ? tid(body.semesterId) : null,
    title: body.title,
    status: 'open',
    components: body.components.map((c) => ({
      ...c,
      sourceIds: (c.sourceIds || []).map((id: string) => tid(id)),
    })),
    createdBy: tid(user.id),
    updatedBy: tid(user.id),
  });

  return mapGradebook(doc.toObject(), {
    courseName: course.name,
    courseCode: (course as any).code,
  });
}

export async function getGradebook(
  tenantId: string,
  id: string,
  user: { id: string; roles: string[] }
) {
  const doc = await Gradebook.findOne(baseFilter(tenantId, { _id: tid(id) })).lean();
  if (!doc) throw new AppError(404, 'Gradebook not found', 'NOT_FOUND');

  const isStudentOnly =
    user.roles.includes('student') && !isAdminOrFaculty(user.roles);
  if (isStudentOnly && doc.status !== 'published') {
    throw new AppError(403, 'Results not published', 'FORBIDDEN');
  }

  const course = await Course.findOne({
    _id: doc.courseId,
    tenantId: tid(tenantId),
  })
    .select('name code')
    .lean();

  return mapGradebook(doc, {
    courseName: course?.name,
    courseCode: (course as any)?.code,
  });
}

export async function updateGradebook(
  tenantId: string,
  id: string,
  body: {
    title?: string;
    offeringId?: string | null;
    academicYearId?: string | null;
    semesterId?: string | null;
    components?: any[];
  },
  user: { id: string; roles: string[] }
) {
  const doc = await Gradebook.findOne(baseFilter(tenantId, { _id: tid(id) }));
  if (!doc) throw new AppError(404, 'Gradebook not found', 'NOT_FOUND');
  if (doc.status !== 'open') {
    throw new AppError(400, 'Only open gradebooks can be updated', 'GRADEBOOK_LOCKED');
  }

  await assertCanManage(tenantId, user, String(doc.courseId));

  if (body.title != null) doc.title = body.title;
  if (body.offeringId !== undefined) {
    doc.offeringId = body.offeringId ? tid(body.offeringId) : null;
  }
  if (body.academicYearId !== undefined) {
    doc.academicYearId = body.academicYearId ? tid(body.academicYearId) : null;
  }
  if (body.semesterId !== undefined) {
    doc.semesterId = body.semesterId ? tid(body.semesterId) : null;
  }
  if (body.components) {
    doc.components = body.components.map((c) => ({
      ...c,
      sourceIds: (c.sourceIds || []).map((sid: string) => tid(sid)),
    })) as any;
  }
  doc.updatedBy = tid(user.id);
  await doc.save();

  return mapGradebook(doc.toObject());
}

export async function lockGradebook(
  tenantId: string,
  id: string,
  user: { id: string; roles: string[] }
) {
  const doc = await Gradebook.findOne(baseFilter(tenantId, { _id: tid(id) }));
  if (!doc) throw new AppError(404, 'Gradebook not found', 'NOT_FOUND');
  await assertCanManage(tenantId, user, String(doc.courseId));
  if (doc.status === 'published') {
    throw new AppError(400, 'Published gradebook cannot be locked', 'INVALID_STATE');
  }
  doc.status = 'locked';
  doc.lockedAt = new Date();
  doc.lockedBy = tid(user.id);
  doc.updatedBy = tid(user.id);
  await doc.save();
  return mapGradebook(doc.toObject());
}

export async function unlockGradebook(
  tenantId: string,
  id: string,
  user: { id: string; roles: string[] }
) {
  if (
    !user.roles.some((r) =>
      ['super_admin', 'tenant_admin', 'university_admin'].includes(r)
    )
  ) {
    throw new AppError(403, 'Only admins can unlock gradebooks', 'FORBIDDEN');
  }
  const doc = await Gradebook.findOne(baseFilter(tenantId, { _id: tid(id) }));
  if (!doc) throw new AppError(404, 'Gradebook not found', 'NOT_FOUND');
  if (doc.status === 'published') {
    throw new AppError(400, 'Published gradebook cannot be unlocked', 'INVALID_STATE');
  }
  doc.status = 'open';
  doc.lockedAt = null;
  doc.lockedBy = null;
  doc.updatedBy = tid(user.id);
  await doc.save();
  return mapGradebook(doc.toObject());
}

// ─── Recompute from Phase 9 marks + attendance ───────────────────────────────

async function pullAssignmentMarks(
  tenantId: string,
  studentIds: string[],
  sourceIds: string[],
  dropLowest: number
): Promise<Map<string, { marks: number; maxMarks: number }>> {
  const result = new Map<string, { marks: number; maxMarks: number }>();
  if (!sourceIds.length || !studentIds.length) return result;

  const assignments = await Assignment.find(
    baseFilter(tenantId, {
      _id: { $in: sourceIds.map(tid) },
    })
  )
    .select('_id maxMarks')
    .lean();
  const assignMap = new Map(assignments.map((a) => [String(a._id), a.maxMarks as number]));

  const submissions = await AssignmentSubmission.find({
    tenantId: tid(tenantId),
    assignmentId: { $in: sourceIds.map(tid) },
    studentId: { $in: studentIds.map(tid) },
    status: { $in: ['graded', 'returned'] },
    marksAwarded: { $ne: null },
    isDeleted: { $ne: true },
  })
    .select('studentId assignmentId marksAwarded')
    .lean();

  // group by student → list of percents (or marks normalized)
  const byStudent = new Map<string, number[]>();
  const maxByStudent = new Map<string, number>();

  for (const sub of submissions) {
    const sid = String(sub.studentId);
    const maxM = assignMap.get(String(sub.assignmentId)) ?? 100;
    const marks = Number(sub.marksAwarded) || 0;
    const pct = maxM > 0 ? (marks / maxM) * 100 : 0;
    if (!byStudent.has(sid)) byStudent.set(sid, []);
    byStudent.get(sid)!.push(pct);
  }

  for (const [sid, pcts] of byStudent) {
    let values = [...pcts].sort((a, b) => a - b);
    const drop = Math.min(dropLowest || 0, Math.max(0, values.length - 1));
    if (drop > 0) values = values.slice(drop);
    const avg = values.length ? values.reduce((s, v) => s + v, 0) / values.length : 0;
    result.set(sid, { marks: avg, maxMarks: 100 });
  }

  return result;
}

async function pullQuizMarks(
  tenantId: string,
  studentIds: string[],
  sourceIds: string[],
  dropLowest: number
): Promise<Map<string, { marks: number; maxMarks: number }>> {
  const result = new Map<string, { marks: number; maxMarks: number }>();
  if (!sourceIds.length || !studentIds.length) return result;

  const quizzes = await Quiz.find(
    baseFilter(tenantId, { _id: { $in: sourceIds.map(tid) } })
  )
    .select('_id totalMarks')
    .lean();
  const quizMap = new Map(quizzes.map((q) => [String(q._id), (q as any).totalMarks as number]));

  const attempts = await QuizAttempt.find({
    tenantId: tid(tenantId),
    quizId: { $in: sourceIds.map(tid) },
    studentId: { $in: studentIds.map(tid) },
    status: { $in: ['submitted', 'auto_submitted', 'graded'] },
    isDeleted: { $ne: true },
  })
    .select('studentId quizId totalMarksAwarded percent')
    .lean();

  // best attempt per quiz per student
  const best = new Map<string, number>(); // key: studentId:quizId → percent
  for (const att of attempts) {
    const key = `${String(att.studentId)}:${String(att.quizId)}`;
    let pct = att.percent;
    if (pct == null) {
      const maxM = quizMap.get(String(att.quizId)) ?? 100;
      const awarded = Number((att as any).totalMarksAwarded) || 0;
      pct = maxM > 0 ? (awarded / maxM) * 100 : 0;
    }
    const prev = best.get(key);
    if (prev == null || pct > prev) best.set(key, pct);
  }

  const byStudent = new Map<string, number[]>();
  for (const [key, pct] of best) {
    const sid = key.split(':')[0];
    if (!byStudent.has(sid)) byStudent.set(sid, []);
    byStudent.get(sid)!.push(pct);
  }

  for (const [sid, pcts] of byStudent) {
    let values = [...pcts].sort((a, b) => a - b);
    const drop = Math.min(dropLowest || 0, Math.max(0, values.length - 1));
    if (drop > 0) values = values.slice(drop);
    const avg = values.length ? values.reduce((s, v) => s + v, 0) / values.length : 0;
    result.set(sid, { marks: avg, maxMarks: 100 });
  }

  return result;
}

async function pullAttendanceMarks(
  tenantId: string,
  courseId: string,
  studentIds: string[],
  maxMarks: number
): Promise<Map<string, { marks: number; maxMarks: number }>> {
  const result = new Map<string, { marks: number; maxMarks: number }>();
  if (!studentIds.length) return result;

  const sessions = await AttendanceSession.find(
    baseFilter(tenantId, { courseId: tid(courseId), status: 'closed' })
  )
    .select('_id')
    .lean();
  const sessionIds = sessions.map((s) => s._id);
  const totalSessions = sessionIds.length;

  if (totalSessions === 0) {
    for (const sid of studentIds) {
      result.set(sid, { marks: 0, maxMarks });
    }
    return result;
  }

  const records = await AttendanceRecord.find({
    tenantId: tid(tenantId),
    sessionId: { $in: sessionIds },
    studentId: { $in: studentIds.map(tid) },
    isDeleted: { $ne: true },
  })
    .select('studentId status')
    .lean();

  const counts = new Map<string, { present: number; total: number }>();
  for (const sid of studentIds) {
    counts.set(sid, { present: 0, total: totalSessions });
  }
  for (const r of records) {
    const sid = String(r.studentId);
    const c = counts.get(sid);
    if (!c) continue;
    if (r.status === 'present' || r.status === 'late') {
      c.present += 1;
    }
  }

  for (const [sid, c] of counts) {
    const pct = c.total > 0 ? (c.present / c.total) * 100 : 0;
    const marks = (pct / 100) * maxMarks;
    result.set(sid, { marks, maxMarks });
  }

  return result;
}

export async function recomputeGradebook(
  tenantId: string,
  id: string,
  user: { id: string; roles: string[] }
) {
  const gb = await Gradebook.findOne(baseFilter(tenantId, { _id: tid(id) }));
  if (!gb) throw new AppError(404, 'Gradebook not found', 'NOT_FOUND');
  if (gb.status === 'locked' || gb.status === 'published') {
    // allow recompute only when open — locked means no auto-sync
    if (gb.status === 'published') {
      throw new AppError(400, 'Cannot recompute published gradebook', 'GRADEBOOK_LOCKED');
    }
    // locked: still allow admin recompute? Spec: lock = no further auto-sync edits
    // We'll allow recompute only when open
    throw new AppError(400, 'Unlock gradebook before recomputing', 'GRADEBOOK_LOCKED');
  }

  await assertCanManage(tenantId, user, String(gb.courseId));

  // enrolled students
  const enrollFilter: Record<string, unknown> = {
    tenantId: tid(tenantId),
    courseId: gb.courseId,
    status: { $in: ['enrolled', 'completed'] },
  };
  if (gb.offeringId) enrollFilter.offeringId = gb.offeringId;

  const enrollments = await CourseEnrollment.find(enrollFilter).select('studentId').lean();
  const studentIds = enrollments.map((e) => String(e.studentId));

  if (!studentIds.length) {
    return { updatedEntries: 0, updatedTotals: 0, students: 0 };
  }

  const config = await getAcademicConfig(tenantId);
  const bands: GradeBand[] = config.gradingScheme?.bands || [];

  // For each component, pull marks
  let updatedEntries = 0;

  for (const comp of gb.components) {
    const sourceIds = (comp.sourceIds || []).map((x) => String(x));
    let marksMap = new Map<string, { marks: number; maxMarks: number }>();

    if (comp.source === 'assignment') {
      marksMap = await pullAssignmentMarks(
        tenantId,
        studentIds,
        sourceIds,
        comp.dropLowest || 0
      );
    } else if (comp.source === 'quiz') {
      marksMap = await pullQuizMarks(tenantId, studentIds, sourceIds, comp.dropLowest || 0);
    } else if (comp.source === 'attendance') {
      marksMap = await pullAttendanceMarks(
        tenantId,
        String(gb.courseId),
        studentIds,
        comp.maxMarks
      );
    } else {
      // manual — do not overwrite existing entries
      continue;
    }

    for (const sid of studentIds) {
      const pulled = marksMap.get(sid) || { marks: 0, maxMarks: comp.maxMarks };
      // if source is assignment/quiz we stored percent-as-marks with max 100; scale to component maxMarks
      let rawMarks: number;
      let maxMarks = comp.maxMarks;
      if (comp.source === 'assignment' || comp.source === 'quiz') {
        // pulled.marks is already a percent 0-100
        rawMarks = (pulled.marks / 100) * comp.maxMarks;
      } else {
        rawMarks = pulled.marks;
        maxMarks = pulled.maxMarks || comp.maxMarks;
      }
      const percent = maxMarks > 0 ? Math.min(100, (rawMarks / maxMarks) * 100) : 0;

      const existing = await GradeEntry.findOne({
        tenantId: tid(tenantId),
        gradebookId: gb._id,
        studentId: tid(sid),
        componentKey: comp.key,
      });

      if (existing) {
        // preserve overrides
        existing.rawMarks = rawMarks;
        existing.maxMarks = maxMarks;
        existing.percent =
          existing.overriddenMarks != null
            ? maxMarks > 0
              ? Math.min(100, (existing.overriddenMarks / maxMarks) * 100)
              : 0
            : percent;
        existing.updatedBy = tid(user.id);
        await existing.save();
      } else {
        await GradeEntry.create({
          tenantId: tid(tenantId),
          gradebookId: gb._id,
          studentId: tid(sid),
          componentKey: comp.key,
          rawMarks,
          maxMarks,
          percent,
          createdBy: tid(user.id),
          updatedBy: tid(user.id),
        });
      }
      updatedEntries += 1;
    }
  }

  // recompute totals
  const allEntries = await GradeEntry.find({
    tenantId: tid(tenantId),
    gradebookId: gb._id,
    studentId: { $in: studentIds.map(tid) },
    isDeleted: { $ne: true },
  }).lean();

  const entriesByStudent = new Map<string, typeof allEntries>();
  for (const e of allEntries) {
    const sid = String(e.studentId);
    if (!entriesByStudent.has(sid)) entriesByStudent.set(sid, []);
    entriesByStudent.get(sid)!.push(e);
  }

  const weightSum = gb.components.reduce((s, c) => s + c.weightPercent, 0) || 100;
  let updatedTotals = 0;
  const totalPercents: Array<{ studentId: string; weightedPercent: number }> = [];

  for (const sid of studentIds) {
    const entries = entriesByStudent.get(sid) || [];
    const entryMap = new Map(entries.map((e) => [e.componentKey, e]));

    let weighted = 0;
    for (const comp of gb.components) {
      const e = entryMap.get(comp.key);
      if (!e || e.isExcluded) continue;
      const marks = effectiveMarks(e);
      if (marks == null) continue;
      const pct = e.maxMarks > 0 ? (marks / e.maxMarks) * 100 : 0;
      weighted += (pct * comp.weightPercent) / weightSum;
    }

    weighted = Math.round(weighted * 100) / 100;
    const { letter, gradePoint } = letterFromPercent(weighted, bands);
    const isPass = weighted >= (bands.find((b) => b.letter === 'C')?.minPercent ?? 40);

    await GradebookTotal.findOneAndUpdate(
      {
        tenantId: tid(tenantId),
        gradebookId: gb._id,
        studentId: tid(sid),
      },
      {
        $set: {
          weightedPercent: weighted,
          letterGrade: letter,
          gradePoint,
          isPass,
          recomputedAt: new Date(),
          isDeleted: false,
        },
      },
      { upsert: true, new: true }
    );
    updatedTotals += 1;
    totalPercents.push({ studentId: sid, weightedPercent: weighted });
  }

  // ranks
  totalPercents.sort((a, b) => b.weightedPercent - a.weightedPercent);
  let rank = 0;
  let prevPct: number | null = null;
  for (let i = 0; i < totalPercents.length; i++) {
    const t = totalPercents[i];
    if (prevPct === null || t.weightedPercent !== prevPct) {
      rank = i + 1;
      prevPct = t.weightedPercent;
    }
    await GradebookTotal.updateOne(
      {
        tenantId: tid(tenantId),
        gradebookId: gb._id,
        studentId: tid(t.studentId),
      },
      { $set: { rank } }
    );
  }

  return {
    updatedEntries,
    updatedTotals,
    students: studentIds.length,
  };
}

// ─── Roster ──────────────────────────────────────────────────────────────────

export async function getRoster(
  tenantId: string,
  id: string,
  user: { id: string; roles: string[] }
): Promise<{ gradebook: GradebookPublic; rows: StudentGradeRow[] }> {
  const gb = await Gradebook.findOne(baseFilter(tenantId, { _id: tid(id) })).lean();
  if (!gb) throw new AppError(404, 'Gradebook not found', 'NOT_FOUND');

  await assertCanManage(tenantId, user, String(gb.courseId));

  const enrollFilter: Record<string, unknown> = {
    tenantId: tid(tenantId),
    courseId: gb.courseId,
    status: { $in: ['enrolled', 'completed'] },
  };
  if (gb.offeringId) enrollFilter.offeringId = gb.offeringId;

  const enrollments = await CourseEnrollment.find(enrollFilter).select('studentId').lean();
  const studentIds = enrollments.map((e) => e.studentId);

  const students = await Student.find({
    _id: { $in: studentIds },
    tenantId: tid(tenantId),
    isDeleted: { $ne: true },
  })
    .select('firstName lastName rollNumber registrationNumber userId')
    .lean();

  const entries = await GradeEntry.find({
    tenantId: tid(tenantId),
    gradebookId: gb._id,
    isDeleted: { $ne: true },
  }).lean();

  const totals = await GradebookTotal.find({
    tenantId: tid(tenantId),
    gradebookId: gb._id,
    isDeleted: { $ne: true },
  }).lean();

  const totalMap = new Map(totals.map((t) => [String(t.studentId), t]));
  const entriesByStudent = new Map<string, Map<string, any>>();
  for (const e of entries) {
    const sid = String(e.studentId);
    if (!entriesByStudent.has(sid)) entriesByStudent.set(sid, new Map());
    entriesByStudent.get(sid)!.set(e.componentKey, e);
  }

  const rows: StudentGradeRow[] = students.map((s) => {
    const sid = String(s._id);
    const emap = entriesByStudent.get(sid) || new Map();
    const entriesObj: Record<string, GradeEntryPublic | undefined> = {};
    for (const comp of gb.components) {
      const e = emap.get(comp.key);
      entriesObj[comp.key] = e ? mapEntry(e) : undefined;
    }
    const t = totalMap.get(sid);
    return {
      studentId: sid,
      studentName: `${s.firstName || ''} ${s.lastName || ''}`.trim(),
      studentCode: (s as any).rollNumber || (s as any).registrationNumber,
      entries: entriesObj,
      total: t
        ? mapTotal(t, {
            studentName: `${s.firstName || ''} ${s.lastName || ''}`.trim(),
            studentCode: (s as any).rollNumber || (s as any).registrationNumber,
          })
        : null,
    };
  });

  rows.sort((a, b) => (a.studentName || '').localeCompare(b.studentName || ''));

  return {
    gradebook: mapGradebook(gb),
    rows,
  };
}

// ─── Upsert entries (manual / override) ──────────────────────────────────────

export async function upsertEntries(
  tenantId: string,
  id: string,
  body: {
    entries: Array<{
      studentId: string;
      componentKey: string;
      rawMarks?: number;
      overriddenMarks?: number | null;
      overrideReason?: string | null;
      isExcluded?: boolean;
    }>;
  },
  user: { id: string; roles: string[] }
) {
  const gb = await Gradebook.findOne(baseFilter(tenantId, { _id: tid(id) }));
  if (!gb) throw new AppError(404, 'Gradebook not found', 'NOT_FOUND');
  if (gb.status === 'published') {
    throw new AppError(400, 'Cannot edit published gradebook', 'GRADEBOOK_LOCKED');
  }
  await assertCanManage(tenantId, user, String(gb.courseId));

  const compMap = new Map(gb.components.map((c) => [c.key, c]));
  const results: GradeEntryPublic[] = [];

  for (const item of body.entries) {
    const comp = compMap.get(item.componentKey);
    if (!comp) {
      throw new AppError(400, `Unknown component key: ${item.componentKey}`, 'INVALID_COMPONENT');
    }

    let existing = await GradeEntry.findOne({
      tenantId: tid(tenantId),
      gradebookId: gb._id,
      studentId: tid(item.studentId),
      componentKey: item.componentKey,
    });

    if (!existing) {
      const raw = item.rawMarks ?? 0;
      const maxM = comp.maxMarks;
      existing = await GradeEntry.create({
        tenantId: tid(tenantId),
        gradebookId: gb._id,
        studentId: tid(item.studentId),
        componentKey: item.componentKey,
        rawMarks: raw,
        maxMarks: maxM,
        percent: maxM > 0 ? Math.min(100, (raw / maxM) * 100) : 0,
        createdBy: tid(user.id),
        updatedBy: tid(user.id),
      });
    }

    if (item.rawMarks != null) {
      existing.rawMarks = item.rawMarks;
    }
    if (item.overriddenMarks !== undefined) {
      existing.overriddenMarks = item.overriddenMarks;
      existing.overrideReason = item.overrideReason ?? existing.overrideReason;
      existing.overriddenBy = item.overriddenMarks != null ? tid(user.id) : null;
    }
    if (item.isExcluded !== undefined) {
      existing.isExcluded = item.isExcluded;
    }

    const marks =
      existing.overriddenMarks != null ? existing.overriddenMarks : existing.rawMarks;
    existing.percent =
      existing.maxMarks > 0 ? Math.min(100, (marks / existing.maxMarks) * 100) : 0;
    existing.updatedBy = tid(user.id);
    await existing.save();
    results.push(mapEntry(existing.toObject()));
  }

  // light total refresh for affected students
  const affected = [...new Set(body.entries.map((e) => e.studentId))];
  const config = await getAcademicConfig(tenantId);
  const bands: GradeBand[] = config.gradingScheme?.bands || [];
  const weightSum = gb.components.reduce((s, c) => s + c.weightPercent, 0) || 100;

  for (const sid of affected) {
    const entries = await GradeEntry.find({
      tenantId: tid(tenantId),
      gradebookId: gb._id,
      studentId: tid(sid),
      isDeleted: { $ne: true },
    }).lean();
    const entryMap = new Map(entries.map((e) => [e.componentKey, e]));
    let weighted = 0;
    for (const comp of gb.components) {
      const e = entryMap.get(comp.key);
      if (!e || e.isExcluded) continue;
      const marks = effectiveMarks(e);
      if (marks == null) continue;
      const pct = e.maxMarks > 0 ? (marks / e.maxMarks) * 100 : 0;
      weighted += (pct * comp.weightPercent) / weightSum;
    }
    weighted = Math.round(weighted * 100) / 100;
    const { letter, gradePoint } = letterFromPercent(weighted, bands);
    const isPass = weighted >= (bands.find((b) => b.letter === 'C')?.minPercent ?? 40);

    await GradebookTotal.findOneAndUpdate(
      {
        tenantId: tid(tenantId),
        gradebookId: gb._id,
        studentId: tid(sid),
      },
      {
        $set: {
          weightedPercent: weighted,
          letterGrade: letter,
          gradePoint,
          isPass,
          recomputedAt: new Date(),
          isDeleted: false,
        },
      },
      { upsert: true }
    );
  }

  return { entries: results };
}

// ─── Publish results ─────────────────────────────────────────────────────────

export async function publishResults(
  tenantId: string,
  id: string,
  body: { studentIds?: string[]; remarks?: string | null },
  user: { id: string; roles: string[] }
) {
  const gb = await Gradebook.findOne(baseFilter(tenantId, { _id: tid(id) }));
  if (!gb) throw new AppError(404, 'Gradebook not found', 'NOT_FOUND');
  await assertCanManage(tenantId, user, String(gb.courseId));

  const totals = await GradebookTotal.find({
    tenantId: tid(tenantId),
    gradebookId: gb._id,
    isDeleted: { $ne: true },
    ...(body.studentIds?.length
      ? { studentId: { $in: body.studentIds.map(tid) } }
      : {}),
  }).lean();

  if (!totals.length) {
    throw new AppError(400, 'No totals to publish — recompute first', 'NO_TOTALS');
  }

  const entries = await GradeEntry.find({
    tenantId: tid(tenantId),
    gradebookId: gb._id,
    isDeleted: { $ne: true },
  }).lean();
  const entriesByStudent = new Map<string, typeof entries>();
  for (const e of entries) {
    const sid = String(e.studentId);
    if (!entriesByStudent.has(sid)) entriesByStudent.set(sid, []);
    entriesByStudent.get(sid)!.push(e);
  }

  const weightSum = gb.components.reduce((s, c) => s + c.weightPercent, 0) || 100;
  let published = 0;

  for (const t of totals) {
    const sid = String(t.studentId);
    const studEntries = entriesByStudent.get(sid) || [];
    const entryMap = new Map(studEntries.map((e) => [e.componentKey, e]));

    const components = gb.components.map((comp) => {
      const e = entryMap.get(comp.key);
      const marks = e ? effectiveMarks(e) ?? 0 : 0;
      const maxM = e?.maxMarks ?? comp.maxMarks;
      const pct = maxM > 0 ? (marks / maxM) * 100 : 0;
      const contribution = (pct * comp.weightPercent) / weightSum;
      return {
        key: comp.key,
        name: comp.name,
        weightPercent: comp.weightPercent,
        rawMarks: marks,
        maxMarks: maxM,
        percent: Math.round(pct * 100) / 100,
        contribution: Math.round(contribution * 100) / 100,
      };
    });

    await Result.findOneAndUpdate(
      {
        tenantId: tid(tenantId),
        gradebookId: gb._id,
        studentId: t.studentId,
      },
      {
        $set: {
          courseId: gb.courseId,
          status: 'published',
          publishedAt: new Date(),
          publishedBy: tid(user.id),
          weightedPercent: t.weightedPercent,
          letterGrade: t.letterGrade,
          gradePoint: t.gradePoint,
          isPass: t.isPass,
          components,
          remarks: body.remarks ?? null,
          updatedBy: tid(user.id),
          isDeleted: false,
        },
        $setOnInsert: {
          createdBy: tid(user.id),
        },
      },
      { upsert: true }
    );
    published += 1;
  }

  gb.status = 'published';
  gb.publishedAt = new Date();
  gb.publishedBy = tid(user.id);
  gb.updatedBy = tid(user.id);
  await gb.save();

  return { published, gradebook: mapGradebook(gb.toObject()) };
}

// ─── Student my-grades ───────────────────────────────────────────────────────

export async function myGrades(
  tenantId: string,
  gradebookId: string,
  user: { id: string; roles: string[] }
) {
  const { resolveStudentId } = await import('../learn/learn.service');
  const studentId = await resolveStudentId(tenantId, user);

  const gb = await Gradebook.findOne(
    baseFilter(tenantId, { _id: tid(gradebookId), status: 'published' })
  ).lean();
  if (!gb) throw new AppError(404, 'Published gradebook not found', 'NOT_FOUND');

  const result = await Result.findOne({
    tenantId: tid(tenantId),
    gradebookId: gb._id,
    studentId: tid(studentId),
    status: 'published',
    isDeleted: { $ne: true },
  }).lean();

  if (!result) {
    throw new AppError(404, 'No published result for you in this gradebook', 'NOT_FOUND');
  }

  const course = await Course.findOne({ _id: gb.courseId, tenantId: tid(tenantId) })
    .select('name code')
    .lean();

  return mapResult(result, {
    courseName: course?.name,
    courseCode: (course as any)?.code,
    title: gb.title,
  });
}

export async function myTranscript(
  tenantId: string,
  user: { id: string; roles: string[] }
): Promise<TranscriptItem[]> {
  const { resolveStudentId } = await import('../learn/learn.service');
  const studentId = await resolveStudentId(tenantId, user);

  const results = await Result.find({
    tenantId: tid(tenantId),
    studentId: tid(studentId),
    status: 'published',
    isDeleted: { $ne: true },
  })
    .sort({ publishedAt: -1 })
    .lean();

  const gbIds = results.map((r) => r.gradebookId);
  const gradebooks = await Gradebook.find({
    _id: { $in: gbIds },
    tenantId: tid(tenantId),
  })
    .select('title courseId')
    .lean();
  const gbMap = new Map(gradebooks.map((g) => [String(g._id), g]));

  const courseIds = [...new Set(results.map((r) => String(r.courseId)))];
  const courses = await Course.find({
    _id: { $in: courseIds.map(tid) },
    tenantId: tid(tenantId),
  })
    .select('name code')
    .lean();
  const courseMap = new Map(courses.map((c) => [String(c._id), c]));

  return results.map((r) => {
    const gb = gbMap.get(String(r.gradebookId));
    const course = courseMap.get(String(r.courseId));
    return {
      resultId: String(r._id),
      gradebookId: String(r.gradebookId),
      courseId: String(r.courseId),
      courseName: course?.name,
      courseCode: (course as any)?.code,
      title: gb?.title || 'Course result',
      weightedPercent: r.weightedPercent,
      letterGrade: r.letterGrade ?? null,
      gradePoint: r.gradePoint ?? null,
      isPass: r.isPass ?? null,
      publishedAt: r.publishedAt ?? null,
    };
  });
}
