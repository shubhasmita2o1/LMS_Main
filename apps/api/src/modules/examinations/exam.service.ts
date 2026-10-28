import mongoose from 'mongoose';
import { AppError } from '../../middleware/errorHandler';
import {
  Exam,
  ExamCenter,
  ExamAllocation,
  ExamInvigilator,
  ExamAttempt,
  ExamSuspicionEvent,
  type IExam,
  type IExamAttempt,
  type IExamQuestionSnapshot,
} from './exam.model';
import { Question } from '../question-bank/question-bank.model';
import { CourseEnrollment } from '../courses/course.model';
import { Student } from '../students/student.model';
import { User } from '../users/user.model';
import { resolveStudentId } from '../learn/learn.service';
import type {
  ExamPublic,
  ExamCenterPublic,
  ExamAllocationPublic,
  ExamInvigilatorPublic,
  ExamAttemptPublic,
  ExamPaperPublic,
  ExamResultPublic,
  ExamSuspicionEventPublic,
  ExamAnswerItem,
} from '@university-lms/shared';
import { OBJECTIVE_QUESTION_TYPES } from '@university-lms/shared';

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

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function parseDate(v: unknown): Date {
  const d = v instanceof Date ? v : new Date(String(v));
  if (Number.isNaN(d.getTime())) throw new AppError(400, 'Invalid date', 'INVALID_DATE');
  return d;
}

function defaultSettings(partial?: Partial<IExam['settings']>): IExam['settings'] {
  return {
    maxAttempts: partial?.maxAttempts ?? 1,
    shuffleQuestions: partial?.shuffleQuestions ?? true,
    shuffleOptions: partial?.shuffleOptions ?? true,
    negativeMarkingEnabled: partial?.negativeMarkingEnabled ?? false,
    negativeMarkPerQuestion: partial?.negativeMarkPerQuestion ?? null,
    allowNavigation: partial?.allowNavigation ?? true,
    allowFlagging: partial?.allowFlagging ?? true,
    autosaveIntervalSec: partial?.autosaveIntervalSec ?? 30,
    autoSubmitOnTimeout: partial?.autoSubmitOnTimeout !== false,
    showResultAfter: partial?.showResultAfter ?? 'close',
  };
}

function mapCenter(d: any): ExamCenterPublic {
  return {
    id: String(d._id),
    tenantId: String(d.tenantId),
    name: d.name,
    code: d.code,
    building: d.building ?? null,
    room: d.room ?? null,
    capacity: d.capacity ?? 30,
    address: d.address ?? null,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  };
}

function mapExam(d: any, extra: Partial<ExamPublic> = {}, includeKeys = false): ExamPublic {
  const questions = Array.isArray(d.questions) ? d.questions : [];
  return {
    id: String(d._id),
    tenantId: String(d.tenantId),
    courseId: idStr(d.courseId),
    programId: idStr(d.programId),
    departmentId: idStr(d.departmentId),
    title: d.title,
    code: d.code,
    description: d.description ?? null,
    mode: d.mode,
    status: d.status,
    startAt: d.startAt,
    endAt: d.endAt,
    durationMinutes: d.durationMinutes,
    settings: defaultSettings(d.settings),
    questionCount: questions.length,
    totalMarks: d.totalMarks ?? 0,
    centerIds: (d.centerIds || []).map((c: any) => String(c)),
    publishedAt: d.publishedAt ?? null,
    createdBy: idStr(d.createdBy),
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
    questions: includeKeys
      ? questions.map((q: any) => ({
          questionBankId: idStr(q.questionBankId),
          questionId: q.questionId,
          type: q.type,
          stem: q.stem,
          richText: q.richText ?? null,
          options: (q.options || []).map((o: any) => ({
            key: o.key,
            text: o.text,
            isCorrect: !!o.isCorrect,
          })),
          correctAnswer: q.correctAnswer ?? null,
          matchingPairs: q.matchingPairs,
          marks: q.marks,
          order: q.order,
          difficulty: q.difficulty,
          explanation: q.explanation ?? null,
        }))
      : undefined,
    ...extra,
  };
}

function mapAllocation(d: any, extra: Partial<ExamAllocationPublic> = {}): ExamAllocationPublic {
  return {
    id: String(d._id),
    tenantId: String(d.tenantId),
    examId: String(d.examId),
    studentId: String(d.studentId),
    centerId: idStr(d.centerId),
    seatNumber: d.seatNumber ?? null,
    invigilatorId: idStr(d.invigilatorId),
    status: d.status,
    studentName: extra.studentName,
    studentCode: extra.studentCode,
    centerName: extra.centerName,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  };
}

function mapAttempt(d: any): ExamAttemptPublic {
  return {
    id: String(d._id),
    tenantId: String(d.tenantId),
    examId: String(d.examId),
    studentId: String(d.studentId),
    allocationId: idStr(d.allocationId),
    status: d.status,
    attemptNumber: d.attemptNumber,
    startedAt: d.startedAt,
    submittedAt: d.submittedAt ?? null,
    endsAt: d.endsAt,
    answers: (d.answers || []).map((a: any) => ({
      questionId: a.questionId,
      response: a.response ?? null,
      flagged: !!a.flagged,
      answeredAt: a.answeredAt ?? null,
    })),
    marksObtained: d.marksObtained ?? null,
    autoScore: d.autoScore ?? null,
    manualScore: d.manualScore ?? null,
    totalMarks: undefined,
    suspicionScore: d.suspicionScore ?? 0,
    lastAutosaveAt: d.lastAutosaveAt ?? null,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  };
}

function scoreObjective(
  q: IExamQuestionSnapshot,
  response: string | string[] | null | undefined,
  negativeEnabled: boolean,
  negativePer: number | null | undefined
): { isCorrect: boolean | null; marksAwarded: number } {
  if (!OBJECTIVE_QUESTION_TYPES.includes(q.type as any)) {
    return { isCorrect: null, marksAwarded: 0 };
  }
  const resp = response;
  if (resp == null || resp === '' || (Array.isArray(resp) && resp.length === 0)) {
    return { isCorrect: false, marksAwarded: 0 };
  }

  if (q.type === 'mcq' || q.type === 'true_false') {
    const correct =
      q.correctAnswer ||
      (q.options || []).find((o) => o.isCorrect)?.key ||
      '';
    const given = Array.isArray(resp) ? resp[0] : String(resp);
    if (String(given).trim().toLowerCase() === String(correct).trim().toLowerCase()) {
      return { isCorrect: true, marksAwarded: q.marks };
    }
    if (negativeEnabled) {
      const neg = negativePer != null ? Math.abs(negativePer) : 0;
      return { isCorrect: false, marksAwarded: -neg };
    }
    return { isCorrect: false, marksAwarded: 0 };
  }

  if (q.type === 'multi_select') {
    const correctKeys = new Set(
      (q.options || []).filter((o) => o.isCorrect).map((o) => String(o.key).toLowerCase())
    );
    const given = new Set(
      (Array.isArray(resp) ? resp : String(resp).split(','))
        .map((s) => String(s).trim().toLowerCase())
        .filter(Boolean)
    );
    const same =
      correctKeys.size === given.size && [...correctKeys].every((k) => given.has(k));
    if (same) return { isCorrect: true, marksAwarded: q.marks };
    if (negativeEnabled) {
      const neg = negativePer != null ? Math.abs(negativePer) : 0;
      return { isCorrect: false, marksAwarded: -neg };
    }
    return { isCorrect: false, marksAwarded: 0 };
  }

  if (q.type === 'fill_blank' || q.type === 'numerical') {
    const correct = String(q.correctAnswer || '').trim().toLowerCase();
    const given = String(Array.isArray(resp) ? resp[0] : resp)
      .trim()
      .toLowerCase();
    if (correct && given === correct) return { isCorrect: true, marksAwarded: q.marks };
    if (negativeEnabled) {
      const neg = negativePer != null ? Math.abs(negativePer) : 0;
      return { isCorrect: false, marksAwarded: -neg };
    }
    return { isCorrect: false, marksAwarded: 0 };
  }

  return { isCorrect: null, marksAwarded: 0 };
}

async function getExamOrThrow(tenantId: string, examId: string): Promise<IExam> {
  const doc = await Exam.findOne(baseFilter(tenantId, { _id: tid(examId) }));
  if (!doc) throw new AppError(404, 'Exam not found', 'NOT_FOUND');
  return doc;
}

function deriveLiveStatus(exam: IExam, now = new Date()): ExamPublic['status'] {
  if (['closed', 'graded', 'cancelled', 'draft'].includes(exam.status)) return exam.status;
  if (now < exam.startAt) return 'scheduled';
  if (now >= exam.startAt && now <= exam.endAt) return 'live';
  return exam.status === 'live' || exam.status === 'scheduled' ? 'closed' : exam.status;
}

// ─── Centers ─────────────────────────────────────────────────────────────────

export async function listCenters(tenantId: string) {
  const rows = await ExamCenter.find(baseFilter(tenantId)).sort({ name: 1 }).lean();
  return rows.map(mapCenter);
}

export async function createCenter(tenantId: string, body: any, userId?: string) {
  const doc = await ExamCenter.create({
    tenantId: tid(tenantId),
    name: body.name,
    code: String(body.code).toUpperCase(),
    building: body.building ?? null,
    room: body.room ?? null,
    capacity: body.capacity ?? 30,
    address: body.address ?? null,
    createdBy: userId ? tid(userId) : null,
  });
  return mapCenter(doc);
}

export async function updateCenter(tenantId: string, id: string, body: any, userId?: string) {
  const doc = await ExamCenter.findOne(baseFilter(tenantId, { _id: tid(id) }));
  if (!doc) throw new AppError(404, 'Exam center not found', 'NOT_FOUND');
  if (body.name != null) doc.name = body.name;
  if (body.code != null) doc.code = String(body.code).toUpperCase();
  if (body.building !== undefined) doc.building = body.building;
  if (body.room !== undefined) doc.room = body.room;
  if (body.capacity != null) doc.capacity = body.capacity;
  if (body.address !== undefined) doc.address = body.address;
  if (userId) doc.updatedBy = tid(userId);
  await doc.save();
  return mapCenter(doc);
}

export async function deleteCenter(tenantId: string, id: string, userId?: string) {
  const doc = await ExamCenter.findOne(baseFilter(tenantId, { _id: tid(id) }));
  if (!doc) throw new AppError(404, 'Exam center not found', 'NOT_FOUND');
  doc.isDeleted = true;
  doc.deletedAt = new Date();
  if (userId) doc.updatedBy = tid(userId);
  await doc.save();
  return { ok: true };
}

// ─── Exam CRUD ───────────────────────────────────────────────────────────────

export async function listExams(
  tenantId: string,
  query: {
    status?: string;
    courseId?: string;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
    q?: string;
  },
  opts?: { studentId?: string }
) {
  const filter: Record<string, unknown> = baseFilter(tenantId);
  if (query.status) filter.status = query.status;
  if (query.courseId) filter.courseId = tid(query.courseId);
  if (query.from || query.to) {
    filter.startAt = {};
    if (query.from) (filter.startAt as any).$gte = parseDate(query.from);
    if (query.to) (filter.startAt as any).$lte = parseDate(query.to);
  }
  if (query.q) {
    filter.$or = [
      { title: { $regex: query.q, $options: 'i' } },
      { code: { $regex: query.q, $options: 'i' } },
    ];
  }

  if (opts?.studentId) {
    const allocs = await ExamAllocation.find(
      baseFilter(tenantId, { studentId: tid(opts.studentId) })
    )
      .select('examId')
      .lean();
    const examIds = allocs.map((a) => a.examId);
    filter._id = { $in: examIds };
    filter.status = { $in: ['scheduled', 'live', 'closed', 'graded'] };
  }

  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const [rows, total] = await Promise.all([
    Exam.find(filter)
      .sort({ startAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Exam.countDocuments(filter),
  ]);

  return {
    items: rows.map((r) => mapExam(r)),
    total,
    page,
    limit,
  };
}

export async function getExam(
  tenantId: string,
  id: string,
  opts?: { includeKeys?: boolean; role?: string; studentId?: string }
) {
  const doc = await Exam.findOne(baseFilter(tenantId, { _id: tid(id) })).lean();
  if (!doc) throw new AppError(404, 'Exam not found', 'NOT_FOUND');

  let myAllocation: ExamAllocationPublic | null = null;
  let myAttemptsCount = 0;
  if (opts?.studentId) {
    const alloc = await ExamAllocation.findOne(
      baseFilter(tenantId, { examId: tid(id), studentId: tid(opts.studentId) })
    ).lean();
    if (alloc) myAllocation = mapAllocation(alloc);
    myAttemptsCount = await ExamAttempt.countDocuments({
      tenantId: tid(tenantId),
      examId: tid(id),
      studentId: tid(opts.studentId),
      isDeleted: false,
    });
  }

  const attemptsCount = await ExamAttempt.countDocuments({
    tenantId: tid(tenantId),
    examId: tid(id),
    isDeleted: false,
  });

  const includeKeys =
    !!opts?.includeKeys &&
    opts.role !== 'student' &&
    ['tenant_admin', 'university_admin', 'faculty', 'super_admin'].includes(opts?.role || '');

  return mapExam(
    doc,
    {
      myAllocation,
      myAttemptsCount,
      attemptsCount,
      status: deriveLiveStatus(doc as any),
    },
    includeKeys
  );
}

export async function createExam(tenantId: string, body: any, userId?: string) {
  const startAt = parseDate(body.startAt);
  const endAt = parseDate(body.endAt);
  if (endAt <= startAt) throw new AppError(400, 'endAt must be after startAt', 'INVALID_SCHEDULE');

  const doc = await Exam.create({
    tenantId: tid(tenantId),
    title: body.title,
    code: String(body.code).toUpperCase(),
    description: body.description ?? null,
    mode: body.mode ?? 'online',
    courseId: body.courseId ? tid(body.courseId) : null,
    programId: body.programId ? tid(body.programId) : null,
    departmentId: body.departmentId ? tid(body.departmentId) : null,
    startAt,
    endAt,
    durationMinutes: body.durationMinutes,
    settings: defaultSettings(body.settings),
    centerIds: (body.centerIds || []).map((c: string) => tid(c)),
    status: 'draft',
    questions: [],
    totalMarks: 0,
    createdBy: userId ? tid(userId) : null,
  });
  return mapExam(doc);
}

export async function updateExam(tenantId: string, id: string, body: any, userId?: string) {
  const doc = await getExamOrThrow(tenantId, id);
  if (['closed', 'graded', 'cancelled'].includes(doc.status)) {
    throw new AppError(400, 'Cannot edit a closed/graded/cancelled exam', 'LOCKED');
  }
  if (doc.status !== 'draft' && body.questions) {
    throw new AppError(400, 'Questions locked after publish', 'LOCKED');
  }

  if (body.title != null) doc.title = body.title;
  if (body.code != null) doc.code = String(body.code).toUpperCase();
  if (body.description !== undefined) doc.description = body.description;
  if (body.mode != null) doc.mode = body.mode;
  if (body.courseId !== undefined) doc.courseId = body.courseId ? tid(body.courseId) : null;
  if (body.programId !== undefined) doc.programId = body.programId ? tid(body.programId) : null;
  if (body.departmentId !== undefined)
    doc.departmentId = body.departmentId ? tid(body.departmentId) : null;
  if (body.startAt) doc.startAt = parseDate(body.startAt);
  if (body.endAt) doc.endAt = parseDate(body.endAt);
  if (body.durationMinutes != null) doc.durationMinutes = body.durationMinutes;
  if (body.settings) doc.settings = defaultSettings({ ...doc.settings, ...body.settings });
  if (body.centerIds) doc.centerIds = body.centerIds.map((c: string) => tid(c));
  if (doc.endAt <= doc.startAt) throw new AppError(400, 'endAt must be after startAt', 'INVALID_SCHEDULE');
  if (userId) doc.updatedBy = tid(userId);
  await doc.save();
  return mapExam(doc);
}

export async function attachQuestions(tenantId: string, examId: string, body: any, userId?: string) {
  const doc = await getExamOrThrow(tenantId, examId);
  if (doc.status !== 'draft') {
    throw new AppError(400, 'Questions can only be attached while draft', 'LOCKED');
  }

  const ids = body.questions.map((q: any) => tid(q.questionBankId));
  const bankQs = await Question.find({
    tenantId: tid(tenantId),
    _id: { $in: ids },
    isDeleted: false,
  }).lean();

  if (bankQs.length !== ids.length) {
    throw new AppError(400, 'One or more questions not found in bank', 'INVALID_QUESTIONS');
  }

  const byId = new Map(bankQs.map((q) => [String(q._id), q]));
  const snapshots: IExamQuestionSnapshot[] = body.questions.map((ref: any, idx: number) => {
    const q = byId.get(ref.questionBankId)!;
    return {
      questionBankId: q._id as any,
      questionId: String(q._id),
      type: q.type,
      stem: q.stem,
      richText: (q as any).richText ?? null,
      options: (q.options || []).map((o: any) => ({
        key: o.key,
        text: o.text,
        isCorrect: !!o.isCorrect,
      })),
      correctAnswer: (q as any).correctAnswer ?? null,
      matchingPairs: (q as any).matchingPairs,
      marks: ref.marks != null ? ref.marks : q.marks,
      order: ref.order != null ? ref.order : idx,
      difficulty: q.difficulty,
      explanation: (q as any).explanation ?? null,
    };
  });

  doc.questions = snapshots;
  doc.totalMarks = snapshots.reduce((s, q) => s + (q.marks || 0), 0);
  if (userId) doc.updatedBy = tid(userId);
  await doc.save();
  return mapExam(doc, {}, true);
}

export async function publishExam(tenantId: string, examId: string, userId?: string) {
  const doc = await getExamOrThrow(tenantId, examId);
  if (!doc.questions?.length) {
    throw new AppError(400, 'Add questions before publishing', 'NO_QUESTIONS');
  }
  if (doc.status !== 'draft' && doc.status !== 'scheduled') {
    throw new AppError(400, 'Only draft/scheduled exams can be published', 'INVALID_STATUS');
  }
  const now = new Date();
  doc.publishedAt = now;
  doc.status = now >= doc.startAt && now <= doc.endAt ? 'live' : 'scheduled';
  // Freeze total marks from snapshots
  doc.totalMarks = doc.questions.reduce((s, q) => s + (q.marks || 0), 0);
  if (userId) doc.updatedBy = tid(userId);
  await doc.save();
  return mapExam(doc);
}

export async function closeExam(tenantId: string, examId: string, userId?: string) {
  const doc = await getExamOrThrow(tenantId, examId);
  if (['closed', 'graded', 'cancelled'].includes(doc.status)) {
    return mapExam(doc);
  }
  // Auto-submit in-progress attempts
  const inProgress = await ExamAttempt.find({
    tenantId: tid(tenantId),
    examId: tid(examId),
    status: 'in_progress',
    isDeleted: false,
  });
  for (const att of inProgress) {
    await finalizeAttempt(tenantId, doc, att, true);
  }
  doc.status = 'closed';
  if (userId) doc.updatedBy = tid(userId);
  await doc.save();
  return mapExam(doc);
}

// ─── Allocations ─────────────────────────────────────────────────────────────

export async function allocateStudents(tenantId: string, examId: string, body: any, userId?: string) {
  const exam = await getExamOrThrow(tenantId, examId);
  let studentIds: string[] = body.studentIds || [];

  if (body.courseId) {
    const enrollFilter: any = {
      tenantId: tid(tenantId),
      courseId: tid(body.courseId),
      isDeleted: false,
      status: { $in: ['enrolled', 'completed'] },
    };
    if (body.sectionId) enrollFilter.sectionId = tid(body.sectionId);
    const enrolls = await CourseEnrollment.find(enrollFilter).select('studentId').lean();
    studentIds = [...new Set([...studentIds, ...enrolls.map((e) => String(e.studentId))])];
  }

  if (!studentIds.length) {
    throw new AppError(400, 'No students to allocate', 'EMPTY');
  }

  if (body.clearExisting) {
    await ExamAllocation.updateMany(
      baseFilter(tenantId, { examId: tid(examId) }),
      { $set: { isDeleted: true, deletedAt: new Date() } }
    );
  }

  const centerId = body.centerId ? tid(body.centerId) : null;
  const ops = studentIds.map((sid) => ({
    updateOne: {
      filter: {
        tenantId: tid(tenantId),
        examId: tid(examId),
        studentId: tid(sid),
        isDeleted: false,
      },
      update: {
        $setOnInsert: {
          tenantId: tid(tenantId),
          examId: tid(examId),
          studentId: tid(sid),
          status: 'allocated',
          createdBy: userId ? tid(userId) : null,
        },
        $set: {
          centerId,
          isDeleted: false,
          deletedAt: null,
        },
      },
      upsert: true,
    },
  }));

  await ExamAllocation.bulkWrite(ops);
  return listAllocations(tenantId, examId);
}

export async function listAllocations(tenantId: string, examId: string) {
  await getExamOrThrow(tenantId, examId);
  const rows = await ExamAllocation.find(baseFilter(tenantId, { examId: tid(examId) }))
    .sort({ createdAt: 1 })
    .lean();

  const studentIds = rows.map((r) => r.studentId);
  const students = await Student.find({
    tenantId: tid(tenantId),
    _id: { $in: studentIds },
    isDeleted: false,
  })
    .select('firstName lastName studentCode fullName')
    .lean();
  const sMap = new Map(
    students.map((s: any) => [
      String(s._id),
      {
        name: s.fullName || [s.firstName, s.lastName].filter(Boolean).join(' ') || 'Student',
        code: s.studentCode || null,
      },
    ])
  );

  return rows.map((r) =>
    mapAllocation(r, {
      studentName: sMap.get(String(r.studentId))?.name,
      studentCode: sMap.get(String(r.studentId))?.code,
    })
  );
}

export async function addInvigilator(tenantId: string, examId: string, body: any, userId?: string) {
  await getExamOrThrow(tenantId, examId);
  const doc = await ExamInvigilator.findOneAndUpdate(
    {
      tenantId: tid(tenantId),
      examId: tid(examId),
      userId: tid(body.userId),
      isDeleted: false,
    },
    {
      $setOnInsert: {
        tenantId: tid(tenantId),
        examId: tid(examId),
        userId: tid(body.userId),
        createdBy: userId ? tid(userId) : null,
      },
      $set: {
        centerId: body.centerId ? tid(body.centerId) : null,
        roleNote: body.roleNote ?? null,
        isDeleted: false,
        deletedAt: null,
      },
    },
    { upsert: true, new: true }
  );
  return mapInvigilator(doc);
}

function mapInvigilator(d: any, extra: Partial<ExamInvigilatorPublic> = {}): ExamInvigilatorPublic {
  return {
    id: String(d._id),
    tenantId: String(d.tenantId),
    examId: String(d.examId),
    userId: String(d.userId),
    centerId: idStr(d.centerId),
    roleNote: d.roleNote ?? null,
    userName: extra.userName,
    userEmail: extra.userEmail,
  };
}

export async function listInvigilators(tenantId: string, examId: string) {
  const rows = await ExamInvigilator.find(baseFilter(tenantId, { examId: tid(examId) })).lean();
  const userIds = rows.map((r) => r.userId);
  const users = await User.find({ _id: { $in: userIds } })
    .select('name email firstName lastName')
    .lean();
  const uMap = new Map(
    users.map((u: any) => [
      String(u._id),
      {
        name: u.name || [u.firstName, u.lastName].filter(Boolean).join(' ') || null,
        email: u.email || null,
      },
    ])
  );
  return rows.map((r) =>
    mapInvigilator(r, {
      userName: uMap.get(String(r.userId))?.name,
      userEmail: uMap.get(String(r.userId))?.email,
    })
  );
}

// ─── Student attempt flow ────────────────────────────────────────────────────

export async function listMyExams(tenantId: string, userId: string) {
  const studentId = await resolveStudentId(tenantId, userId);
  return listExams(tenantId, { limit: 50 }, { studentId });
}

async function ensureAllocation(tenantId: string, examId: string, studentId: string) {
  const alloc = await ExamAllocation.findOne(
    baseFilter(tenantId, { examId: tid(examId), studentId: tid(studentId) })
  );
  if (!alloc) {
    throw new AppError(403, 'You are not allocated to this exam', 'NOT_ALLOCATED');
  }
  if (alloc.status === 'malpractice') {
    throw new AppError(403, 'Exam access revoked due to malpractice', 'MALPRACTICE');
  }
  return alloc;
}

export async function startAttempt(
  tenantId: string,
  examId: string,
  userId: string,
  meta?: { ip?: string; userAgent?: string }
) {
  const studentId = await resolveStudentId(tenantId, userId);
  const exam = await getExamOrThrow(tenantId, examId);
  const alloc = await ensureAllocation(tenantId, examId, studentId);

  const now = new Date();
  const status = deriveLiveStatus(exam, now);
  if (status !== 'live' && !(status === 'scheduled' && now >= exam.startAt)) {
    if (now < exam.startAt) throw new AppError(400, 'Exam has not started yet', 'NOT_STARTED');
    if (now > exam.endAt) throw new AppError(400, 'Exam window has ended', 'ENDED');
    throw new AppError(400, 'Exam is not open for attempts', 'NOT_OPEN');
  }
  if (exam.mode === 'offline') {
    throw new AppError(400, 'Offline exams cannot be attempted online', 'OFFLINE_ONLY');
  }

  const existing = await ExamAttempt.find({
    tenantId: tid(tenantId),
    examId: tid(examId),
    studentId: tid(studentId),
    isDeleted: false,
  }).sort({ attemptNumber: -1 });

  const inProgress = existing.find((a) => a.status === 'in_progress');
  if (inProgress) {
    if (inProgress.endsAt && now > inProgress.endsAt && exam.settings.autoSubmitOnTimeout) {
      await finalizeAttempt(tenantId, exam, inProgress, true);
    } else {
      return buildPaper(exam, inProgress);
    }
  }

  const completedCount = existing.filter((a) =>
    ['submitted', 'auto_submitted'].includes(a.status)
  ).length;
  if (completedCount >= (exam.settings.maxAttempts || 1)) {
    throw new AppError(400, 'Maximum attempts reached', 'MAX_ATTEMPTS');
  }

  const durationMs = exam.durationMinutes * 60 * 1000;
  const endsAt = new Date(Math.min(now.getTime() + durationMs, exam.endAt.getTime()));

  let questionOrder = exam.questions.map((q) => q.questionId);
  if (exam.settings.shuffleQuestions) questionOrder = shuffleArray(questionOrder);

  const optionOrder: Record<string, string[]> = {};
  if (exam.settings.shuffleOptions) {
    for (const q of exam.questions) {
      if (q.options?.length) {
        optionOrder[q.questionId] = shuffleArray(q.options.map((o) => o.key));
      }
    }
  }

  const attempt = await ExamAttempt.create({
    tenantId: tid(tenantId),
    examId: tid(examId),
    studentId: tid(studentId),
    allocationId: alloc._id,
    status: 'in_progress',
    attemptNumber: completedCount + 1,
    startedAt: now,
    endsAt,
    answers: [],
    questionOrder,
    optionOrder,
    ip: meta?.ip ?? null,
    userAgent: meta?.userAgent ?? null,
    suspicionScore: 0,
  });

  if (alloc.status === 'allocated') {
    alloc.status = 'present';
    await alloc.save();
  }

  return buildPaper(exam, attempt);
}

function buildPaper(exam: IExam, attempt: IExamAttempt): ExamPaperPublic {
  const qMap = new Map(exam.questions.map((q) => [q.questionId, q]));
  const order =
    attempt.questionOrder?.length > 0
      ? attempt.questionOrder
      : exam.questions.map((q) => q.questionId);

  const questions = order
    .map((qid, idx) => {
      const q = qMap.get(qid);
      if (!q) return null;
      let options = (q.options || []).map((o) => ({ key: o.key, text: o.text }));
      const optOrder = attempt.optionOrder?.[qid];
      if (optOrder?.length) {
        const oMap = new Map(options.map((o) => [o.key, o]));
        options = optOrder.map((k) => oMap.get(k)).filter(Boolean) as typeof options;
      }
      // Never leak correct answers
      return {
        questionId: q.questionId,
        type: q.type,
        stem: q.stem,
        richText: q.richText ?? null,
        options,
        matchingPairs: q.matchingPairs
          ? q.matchingPairs.map((p) => ({ left: p.left }))
          : undefined,
        marks: q.marks,
        order: idx,
      };
    })
    .filter(Boolean) as ExamPaperPublic['questions'];

  return {
    examId: String(exam._id),
    title: exam.title,
    code: exam.code,
    durationMinutes: exam.durationMinutes,
    settings: {
      allowNavigation: exam.settings.allowNavigation,
      allowFlagging: exam.settings.allowFlagging,
      autosaveIntervalSec: exam.settings.autosaveIntervalSec,
      autoSubmitOnTimeout: exam.settings.autoSubmitOnTimeout,
      shuffleQuestions: exam.settings.shuffleQuestions,
      shuffleOptions: exam.settings.shuffleOptions,
    },
    endsAt: attempt.endsAt,
    questions,
    attemptId: String(attempt._id),
    attemptNumber: attempt.attemptNumber,
    status: attempt.status,
  };
}

export async function getPaper(tenantId: string, examId: string, userId: string) {
  const studentId = await resolveStudentId(tenantId, userId);
  await ensureAllocation(tenantId, examId, studentId);
  const exam = await getExamOrThrow(tenantId, examId);
  const attempt = await ExamAttempt.findOne({
    tenantId: tid(tenantId),
    examId: tid(examId),
    studentId: tid(studentId),
    status: 'in_progress',
    isDeleted: false,
  }).sort({ attemptNumber: -1 });

  if (!attempt) {
    throw new AppError(400, 'No active attempt; start the exam first', 'NO_ATTEMPT');
  }

  const now = new Date();
  if (attempt.endsAt && now > attempt.endsAt && exam.settings.autoSubmitOnTimeout) {
    await finalizeAttempt(tenantId, exam, attempt, true);
    throw new AppError(400, 'Attempt auto-submitted due to timeout', 'AUTO_SUBMITTED');
  }

  return buildPaper(exam, attempt);
}

export async function saveAnswers(
  tenantId: string,
  examId: string,
  attemptId: string,
  userId: string,
  body: { answers: ExamAnswerItem[] }
) {
  const studentId = await resolveStudentId(tenantId, userId);
  const exam = await getExamOrThrow(tenantId, examId);
  const attempt = await ExamAttempt.findOne({
    _id: tid(attemptId),
    tenantId: tid(tenantId),
    examId: tid(examId),
    studentId: tid(studentId),
    isDeleted: false,
  });
  if (!attempt) throw new AppError(404, 'Attempt not found', 'NOT_FOUND');

  const now = new Date();
  if (attempt.status !== 'in_progress') {
    throw new AppError(400, 'Attempt is not in progress', 'NOT_IN_PROGRESS');
  }
  if (now > attempt.endsAt) {
    if (exam.settings.autoSubmitOnTimeout) {
      await finalizeAttempt(tenantId, exam, attempt, true);
      throw new AppError(400, 'Attempt auto-submitted due to timeout', 'AUTO_SUBMITTED');
    }
    throw new AppError(400, 'Time is up', 'TIME_UP');
  }

  const validIds = new Set(exam.questions.map((q) => q.questionId));
  const map = new Map(attempt.answers.map((a) => [a.questionId, a]));
  for (const a of body.answers || []) {
    if (!validIds.has(a.questionId)) continue;
    const prev = map.get(a.questionId) || { questionId: a.questionId };
    map.set(a.questionId, {
      questionId: a.questionId,
      response: a.response !== undefined ? a.response : prev.response ?? null,
      flagged: a.flagged !== undefined ? a.flagged : prev.flagged ?? false,
      answeredAt: a.response !== undefined ? now : prev.answeredAt ?? null,
    });
  }
  attempt.answers = Array.from(map.values());
  attempt.lastAutosaveAt = now;
  await attempt.save();
  return mapAttempt(attempt);
}

export async function flagQuestion(
  tenantId: string,
  examId: string,
  attemptId: string,
  userId: string,
  body: { questionId: string; flagged: boolean }
) {
  return saveAnswers(tenantId, examId, attemptId, userId, {
    answers: [{ questionId: body.questionId, flagged: body.flagged }],
  });
}

export async function submitAttempt(
  tenantId: string,
  examId: string,
  attemptId: string,
  userId: string
) {
  const studentId = await resolveStudentId(tenantId, userId);
  const exam = await getExamOrThrow(tenantId, examId);
  const attempt = await ExamAttempt.findOne({
    _id: tid(attemptId),
    tenantId: tid(tenantId),
    examId: tid(examId),
    studentId: tid(studentId),
    isDeleted: false,
  });
  if (!attempt) throw new AppError(404, 'Attempt not found', 'NOT_FOUND');

  if (['submitted', 'auto_submitted'].includes(attempt.status)) {
    return mapAttempt(attempt); // idempotent
  }
  if (attempt.status !== 'in_progress') {
    throw new AppError(400, 'Attempt cannot be submitted', 'INVALID_STATUS');
  }

  const auto = new Date() > attempt.endsAt;
  return finalizeAttempt(tenantId, exam, attempt, auto);
}

async function finalizeAttempt(
  tenantId: string,
  exam: IExam,
  attempt: IExamAttempt,
  auto: boolean
) {
  if (['submitted', 'auto_submitted'].includes(attempt.status)) {
    return mapAttempt(attempt);
  }

  let autoScore = 0;
  const settings = exam.settings;
  for (const q of exam.questions) {
    const ans = attempt.answers.find((a) => a.questionId === q.questionId);
    const { marksAwarded } = scoreObjective(
      q,
      ans?.response as any,
      settings.negativeMarkingEnabled,
      settings.negativeMarkPerQuestion
    );
    autoScore += marksAwarded;
  }

  attempt.autoScore = autoScore;
  attempt.marksObtained = autoScore + (attempt.manualScore || 0);
  attempt.submittedAt = new Date();
  attempt.status = auto ? 'auto_submitted' : 'submitted';
  await attempt.save();
  return mapAttempt(attempt);
}

export async function logSuspicionEvent(
  tenantId: string,
  examId: string,
  attemptId: string,
  userId: string,
  body: any
) {
  const studentId = await resolveStudentId(tenantId, userId);
  const attempt = await ExamAttempt.findOne({
    _id: tid(attemptId),
    tenantId: tid(tenantId),
    examId: tid(examId),
    studentId: tid(studentId),
    isDeleted: false,
  });
  if (!attempt) throw new AppError(404, 'Attempt not found', 'NOT_FOUND');

  const event = await ExamSuspicionEvent.create({
    tenantId: tid(tenantId),
    examId: tid(examId),
    attemptId: attempt._id,
    studentId: tid(studentId),
    type: body.type,
    detail: body.detail ?? null,
    clientTimestamp: body.clientTimestamp ? parseDate(body.clientTimestamp) : null,
    serverTimestamp: new Date(),
    metadata: body.metadata ?? null,
  });

  // Simple aggregate: each event +1 (MVP)
  attempt.suspicionScore = (attempt.suspicionScore || 0) + 1;
  await attempt.save();

  return {
    id: String(event._id),
    tenantId,
    examId,
    attemptId,
    studentId,
    type: event.type,
    detail: event.detail,
    clientTimestamp: event.clientTimestamp,
    serverTimestamp: event.serverTimestamp,
    metadata: event.metadata,
  } as ExamSuspicionEventPublic;
}

export async function getAttemptResult(
  tenantId: string,
  examId: string,
  attemptId: string,
  userId: string,
  role?: string
) {
  const exam = await getExamOrThrow(tenantId, examId);
  let attempt: IExamAttempt | null;

  if (role === 'student') {
    const studentId = await resolveStudentId(tenantId, userId);
    attempt = await ExamAttempt.findOne({
      _id: tid(attemptId),
      tenantId: tid(tenantId),
      examId: tid(examId),
      studentId: tid(studentId),
      isDeleted: false,
    });
  } else {
    attempt = await ExamAttempt.findOne({
      _id: tid(attemptId),
      tenantId: tid(tenantId),
      examId: tid(examId),
      isDeleted: false,
    });
  }
  if (!attempt) throw new AppError(404, 'Attempt not found', 'NOT_FOUND');

  if (!['submitted', 'auto_submitted'].includes(attempt.status)) {
    throw new AppError(400, 'Attempt not submitted yet', 'NOT_SUBMITTED');
  }

  const policy = exam.settings.showResultAfter;
  const isStaff = role && role !== 'student';
  if (!isStaff) {
    if (policy === 'never') throw new AppError(403, 'Results are not available', 'HIDDEN');
    if (policy === 'manual') throw new AppError(403, 'Results pending release', 'PENDING');
    if (policy === 'close' && !['closed', 'graded'].includes(exam.status)) {
      throw new AppError(403, 'Results available after exam is closed', 'PENDING');
    }
    // 'submit' allowed
  }

  const showBreakdown = isStaff || policy === 'submit' || policy === 'close';
  let breakdown: ExamResultPublic['breakdown'];
  if (showBreakdown) {
    breakdown = exam.questions.map((q) => {
      const ans = attempt!.answers.find((a) => a.questionId === q.questionId);
      const scored = scoreObjective(
        q,
        ans?.response as any,
        exam.settings.negativeMarkingEnabled,
        exam.settings.negativeMarkPerQuestion
      );
      return {
        questionId: q.questionId,
        marks: q.marks,
        marksAwarded: scored.marksAwarded,
        isCorrect: scored.isCorrect,
      };
    });
  }

  return {
    attemptId: String(attempt._id),
    examId: String(exam._id),
    status: attempt.status,
    marksObtained: attempt.marksObtained ?? 0,
    totalMarks: exam.totalMarks,
    autoScore: attempt.autoScore,
    manualScore: attempt.manualScore,
    submittedAt: attempt.submittedAt,
    showBreakdown: !!showBreakdown,
    breakdown,
  } as ExamResultPublic;
}

export async function listAttempts(tenantId: string, examId: string) {
  await getExamOrThrow(tenantId, examId);
  const rows = await ExamAttempt.find({
    tenantId: tid(tenantId),
    examId: tid(examId),
    isDeleted: false,
  })
    .sort({ startedAt: -1 })
    .lean();
  return rows.map(mapAttempt);
}

export async function manualScore(
  tenantId: string,
  examId: string,
  attemptId: string,
  body: { questionScores: Array<{ questionId: string; marksAwarded: number }> },
  userId?: string
) {
  const exam = await getExamOrThrow(tenantId, examId);
  const attempt = await ExamAttempt.findOne({
    _id: tid(attemptId),
    tenantId: tid(tenantId),
    examId: tid(examId),
    isDeleted: false,
  });
  if (!attempt) throw new AppError(404, 'Attempt not found', 'NOT_FOUND');

  let manual = 0;
  const subjectiveIds = new Set(
    exam.questions
      .filter((q) => !OBJECTIVE_QUESTION_TYPES.includes(q.type as any))
      .map((q) => q.questionId)
  );
  for (const s of body.questionScores) {
    if (!subjectiveIds.has(s.questionId)) continue;
    manual += s.marksAwarded;
  }
  attempt.manualScore = manual;
  attempt.marksObtained = (attempt.autoScore || 0) + manual;
  if (userId) attempt.updatedBy = tid(userId);
  await attempt.save();
  return mapAttempt(attempt);
}

/** On-access / periodic: auto-submit timed-out attempts for an exam */
export async function sweepTimedOutAttempts(tenantId: string, examId?: string) {
  const filter: any = {
    tenantId: tid(tenantId),
    status: 'in_progress',
    endsAt: { $lt: new Date() },
    isDeleted: false,
  };
  if (examId) filter.examId = tid(examId);
  const attempts = await ExamAttempt.find(filter).limit(100);
  let count = 0;
  for (const att of attempts) {
    const exam = await Exam.findOne(baseFilter(tenantId, { _id: att.examId }));
    if (!exam || !exam.settings.autoSubmitOnTimeout) continue;
    await finalizeAttempt(tenantId, exam, att, true);
    count++;
  }
  return { autoSubmitted: count };
}
