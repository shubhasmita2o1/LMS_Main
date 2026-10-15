import mongoose from 'mongoose';
import { AppError } from '../../middleware/errorHandler';
import { Quiz, QuizAttempt } from './quiz.model';
import { Question } from '../question-bank/question-bank.model';
import { bumpUsageCount } from '../question-bank/question-bank.service';
import { Course } from '../courses/course.model';
import { Student } from '../students/student.model';
import {
  resolveStudentId,
  assertEnrolled,
  assertCanAccessCourse,
} from '../learn/learn.service';
import type { QuizPublic, QuizAttemptPublic, QuestionSafePublic } from '@university-lms/shared';
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

function parseDate(v: unknown): Date | null {
  if (!v) return null;
  if (v instanceof Date) return v;
  const d = new Date(String(v));
  return Number.isNaN(d.getTime()) ? null : d;
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function isAdminOrFaculty(roles: string[]) {
  return roles.some((r) =>
    ['super_admin', 'tenant_admin', 'university_admin', 'faculty'].includes(r)
  );
}

async function assertCanManageQuiz(
  tenantId: string,
  user: { id: string; roles: string[] },
  courseId: string
) {
  if (user.roles.some((r) => ['super_admin', 'tenant_admin', 'university_admin'].includes(r))) {
    return;
  }
  await assertCanAccessCourse(tenantId, user, courseId);
}

function mapQuiz(d: any, extra: Partial<QuizPublic> = {}): QuizPublic {
  return {
    id: String(d._id),
    tenantId: String(d.tenantId),
    courseId: String(d.courseId),
    offeringId: idStr(d.offeringId),
    title: d.title,
    description: d.description ?? null,
    instructions: d.instructions ?? null,
    questions: (d.questions || []).map((q: any) => ({
      questionId: String(q.questionId),
      marks: q.marks ?? null,
      order: q.order ?? 0,
    })),
    totalMarks: d.totalMarks ?? 0,
    durationMinutes: d.durationMinutes ?? null,
    maxAttempts: d.maxAttempts ?? 1,
    shuffleQuestions: !!d.shuffleQuestions,
    shuffleOptions: !!d.shuffleOptions,
    showResults: d.showResults ?? 'after_submit',
    availableFrom: d.availableFrom ?? null,
    dueAt: d.dueAt ?? null,
    status: d.status,
    passPercent: d.passPercent ?? null,
    negativeMarking: d.negativeMarking ?? null,
    autoSubmitOnTimeout: d.autoSubmitOnTimeout !== false,
    createdBy: idStr(d.createdBy),
    attemptsCount: extra.attemptsCount,
    myAttemptsCount: extra.myAttemptsCount,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  };
}

function mapAttempt(d: any, extra: Partial<QuizAttemptPublic> = {}): QuizAttemptPublic {
  return {
    id: String(d._id),
    tenantId: String(d.tenantId),
    quizId: String(d.quizId),
    studentId: String(d.studentId),
    courseId: String(d.courseId),
    attemptNumber: d.attemptNumber,
    status: d.status,
    startedAt: d.startedAt,
    submittedAt: d.submittedAt ?? null,
    expiresAt: d.expiresAt ?? null,
    answers: (d.answers || []).map((a: any) => ({
      questionId: String(a.questionId),
      response: a.response ?? null,
      isCorrect: a.isCorrect ?? null,
      marksAwarded: a.marksAwarded ?? null,
    })),
    totalMarksAwarded: d.totalMarksAwarded ?? null,
    percent: d.percent ?? null,
    questionOrder: (d.questionOrder || []).map((id: any) => String(id)),
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
    studentName: extra.studentName,
  };
}

async function recomputeTotalMarks(tenantId: string, quiz: any) {
  if (!quiz.questions?.length) {
    quiz.totalMarks = 0;
    return 0;
  }
  const ids = quiz.questions.map((q: any) => q.questionId);
  const qs = await Question.find(
    baseFilter(tenantId, { _id: { $in: ids } })
  )
    .select('_id marks')
    .lean();
  const markMap = new Map(qs.map((q) => [String(q._id), q.marks]));
  let total = 0;
  for (const q of quiz.questions) {
    const override = q.marks;
    total += override != null ? override : markMap.get(String(q.questionId)) ?? 0;
  }
  quiz.totalMarks = total;
  return total;
}

// ─── Auto-grade (server-side only) ──────────────────────────────────────────

function normalizeText(s: string) {
  return String(s).trim().toLowerCase().replace(/\s+/g, ' ');
}

function gradeObjective(
  question: any,
  response: unknown,
  marks: number,
  negativeMarking?: number | null
): { isCorrect: boolean | null; marksAwarded: number } {
  const type = question.type as string;
  if (!OBJECTIVE_QUESTION_TYPES.includes(type as any)) {
    return { isCorrect: null, marksAwarded: 0 };
  }

  let correct = false;

  if (type === 'mcq' || type === 'true_false') {
    const correctKeys = (question.options || [])
      .filter((o: any) => o.isCorrect)
      .map((o: any) => o.key);
    const ans = typeof response === 'string' ? response : Array.isArray(response) ? response[0] : null;
    correct = !!ans && correctKeys.includes(String(ans));
    // true_false may use correctAnswer
    if (!correctKeys.length && question.correctAnswer != null) {
      correct = normalizeText(String(ans)) === normalizeText(String(question.correctAnswer));
    }
  } else if (type === 'multi_select') {
    const correctKeys = new Set<string>(
      (question.options || []).filter((o: any) => o.isCorrect).map((o: any) => String(o.key))
    );
    const ans = Array.isArray(response) ? response.map(String) : response ? [String(response)] : [];
    const ansSet = new Set<string>(ans);
    correct =
      correctKeys.size === ansSet.size && [...correctKeys].every((k) => ansSet.has(k));
  } else if (type === 'fill_blank' || type === 'numerical') {
    const expected = question.correctAnswer != null ? normalizeText(String(question.correctAnswer)) : '';
    const ans = response != null ? normalizeText(String(response)) : '';
    if (type === 'numerical') {
      const n1 = parseFloat(expected);
      const n2 = parseFloat(ans);
      correct = !Number.isNaN(n1) && !Number.isNaN(n2) && Math.abs(n1 - n2) < 1e-6;
    } else {
      correct = expected.length > 0 && expected === ans;
    }
  } else if (type === 'matching') {
    const pairs = question.matchingPairs || [];
    const ansPairs: Array<{ left: string; right: string }> = Array.isArray(response)
      ? (response as any[])
      : [];
    if (pairs.length && ansPairs.length === pairs.length) {
      const map = new Map(
        ansPairs.map((p) => [normalizeText(p.left), normalizeText(p.right)])
      );
      correct = pairs.every(
        (p: any) => map.get(normalizeText(p.left)) === normalizeText(p.right)
      );
    }
  }

  if (correct) return { isCorrect: true, marksAwarded: marks };
  if (negativeMarking && negativeMarking > 0) {
    return { isCorrect: false, marksAwarded: -Math.abs(negativeMarking) };
  }
  return { isCorrect: false, marksAwarded: 0 };
}

// ─── CRUD ───────────────────────────────────────────────────────────────────

export async function listQuizzes(
  tenantId: string,
  q: { page: number; limit: number; courseId?: string; status?: string; search?: string },
  user?: { id: string; roles: string[] }
) {
  const filter: Record<string, unknown> = baseFilter(tenantId);
  if (q.courseId) filter.courseId = tid(q.courseId);
  if (q.status) filter.status = q.status;
  if (q.search) filter.title = { $regex: q.search, $options: 'i' };

  const isStudentOnly =
    user && user.roles.includes('student') && !isAdminOrFaculty(user.roles);
  if (isStudentOnly) {
    filter.status = { $in: ['published', 'closed'] };
  }

  const skip = (q.page - 1) * q.limit;
  const [items, total] = await Promise.all([
    Quiz.find(filter).sort({ dueAt: 1, createdAt: -1 }).skip(skip).limit(q.limit).lean(),
    Quiz.countDocuments(filter),
  ]);

  let studentId: string | null = null;
  if (isStudentOnly && user) {
    try {
      studentId = await resolveStudentId(tenantId, user.id);
    } catch {
      studentId = null;
    }
  }

  const mapped: QuizPublic[] = [];
  for (const d of items) {
    const attemptsCount = await QuizAttempt.countDocuments(
      baseFilter(tenantId, { quizId: d._id })
    );
    let myAttemptsCount = 0;
    if (studentId) {
      myAttemptsCount = await QuizAttempt.countDocuments(
        baseFilter(tenantId, { quizId: d._id, studentId: tid(studentId) })
      );
    }
    mapped.push(mapQuiz(d, { attemptsCount, myAttemptsCount }));
  }

  return {
    items: mapped,
    page: q.page,
    limit: q.limit,
    total,
    totalPages: Math.ceil(total / q.limit) || 1,
  };
}

export async function getQuiz(
  tenantId: string,
  id: string,
  user?: { id: string; roles: string[] }
) {
  const doc = (await Quiz.findOne(baseFilter(tenantId, { _id: tid(id) })).lean()) as any;
  if (!doc) throw new AppError(404, 'Quiz not found', 'NOT_FOUND');

  if (user?.roles.includes('student') && !isAdminOrFaculty(user.roles)) {
    if (doc.status === 'draft') throw new AppError(404, 'Quiz not found', 'NOT_FOUND');
    const studentId = await resolveStudentId(tenantId, user.id);
    await assertEnrolled(tenantId, studentId, String(doc.courseId));
  }

  const attemptsCount = await QuizAttempt.countDocuments(
    baseFilter(tenantId, { quizId: doc._id })
  );
  return mapQuiz(doc, { attemptsCount });
}

export async function createQuiz(
  tenantId: string,
  body: Record<string, any>,
  user: { id: string; roles: string[] }
) {
  const course = await Course.findOne(baseFilter(tenantId, { _id: tid(body.courseId) }));
  if (!course) throw new AppError(404, 'Course not found', 'NOT_FOUND');
  await assertCanManageQuiz(tenantId, user, body.courseId);

  const questions = (body.questions || []).map((q: any, i: number) => ({
    questionId: tid(q.questionId),
    marks: q.marks ?? null,
    order: q.order ?? i,
  }));

  const doc = await Quiz.create({
    tenantId: tid(tenantId),
    courseId: tid(body.courseId),
    offeringId: body.offeringId ? tid(body.offeringId) : null,
    title: body.title,
    description: body.description ?? null,
    instructions: body.instructions ?? null,
    questions,
    durationMinutes: body.durationMinutes ?? null,
    maxAttempts: body.maxAttempts ?? 1,
    shuffleQuestions: body.shuffleQuestions ?? false,
    shuffleOptions: body.shuffleOptions ?? false,
    showResults: body.showResults ?? 'after_submit',
    availableFrom: parseDate(body.availableFrom),
    dueAt: parseDate(body.dueAt),
    status: body.status ?? 'draft',
    passPercent: body.passPercent ?? null,
    negativeMarking: body.negativeMarking ?? null,
    autoSubmitOnTimeout: body.autoSubmitOnTimeout !== false,
    createdBy: tid(user.id),
  });

  await recomputeTotalMarks(tenantId, doc);
  await doc.save();

  if (questions.length) {
    await bumpUsageCount(
      tenantId,
      questions.map((q: any) => String(q.questionId))
    );
  }

  return mapQuiz(doc.toObject());
}

export async function updateQuiz(
  tenantId: string,
  id: string,
  body: Record<string, any>,
  user: { id: string; roles: string[] }
) {
  const doc = await Quiz.findOne(baseFilter(tenantId, { _id: tid(id) }));
  if (!doc) throw new AppError(404, 'Quiz not found', 'NOT_FOUND');
  await assertCanManageQuiz(tenantId, user, String(doc.courseId));

  const fields = [
    'title',
    'description',
    'instructions',
    'durationMinutes',
    'maxAttempts',
    'shuffleQuestions',
    'shuffleOptions',
    'showResults',
    'status',
    'passPercent',
    'negativeMarking',
    'autoSubmitOnTimeout',
  ] as const;
  for (const f of fields) {
    if (body[f] !== undefined) (doc as any)[f] = body[f];
  }
  if (body.availableFrom !== undefined) doc.availableFrom = parseDate(body.availableFrom);
  if (body.dueAt !== undefined) doc.dueAt = parseDate(body.dueAt);
  if (body.offeringId !== undefined)
    doc.offeringId = body.offeringId ? tid(body.offeringId) : null;
  if (body.questions) {
    doc.questions = body.questions.map((q: any, i: number) => ({
      questionId: tid(q.questionId),
      marks: q.marks ?? null,
      order: q.order ?? i,
    }));
    await recomputeTotalMarks(tenantId, doc);
  }
  doc.updatedBy = tid(user.id);
  await doc.save();
  return mapQuiz(doc.toObject());
}

export async function softDeleteQuiz(
  tenantId: string,
  id: string,
  user: { id: string; roles: string[] }
) {
  const doc = await Quiz.findOne(baseFilter(tenantId, { _id: tid(id) }));
  if (!doc) throw new AppError(404, 'Quiz not found', 'NOT_FOUND');
  await assertCanManageQuiz(tenantId, user, String(doc.courseId));
  doc.isDeleted = true;
  doc.deletedAt = new Date();
  doc.updatedBy = tid(user.id);
  await doc.save();
  return { id };
}

export async function publishQuiz(
  tenantId: string,
  id: string,
  user: { id: string; roles: string[] }
) {
  const doc = await Quiz.findOne(baseFilter(tenantId, { _id: tid(id) }));
  if (!doc) throw new AppError(404, 'Quiz not found', 'NOT_FOUND');
  await assertCanManageQuiz(tenantId, user, String(doc.courseId));
  if (!doc.questions?.length) {
    throw new AppError(400, 'Add questions before publishing', 'NO_QUESTIONS');
  }
  await recomputeTotalMarks(tenantId, doc);
  doc.status = 'published';
  doc.updatedBy = tid(user.id);
  await doc.save();
  return mapQuiz(doc.toObject());
}

export async function attachQuestions(
  tenantId: string,
  id: string,
  questions: Array<{ questionId: string; marks?: number | null; order?: number }>,
  user: { id: string; roles: string[] }
) {
  const doc = await Quiz.findOne(baseFilter(tenantId, { _id: tid(id) }));
  if (!doc) throw new AppError(404, 'Quiz not found', 'NOT_FOUND');
  await assertCanManageQuiz(tenantId, user, String(doc.courseId));

  const qIds = questions.map((q) => tid(q.questionId));
  const found = await Question.countDocuments(baseFilter(tenantId, { _id: { $in: qIds } }));
  if (found !== questions.length) {
    throw new AppError(400, 'One or more questions not found in bank', 'INVALID_QUESTIONS');
  }

  doc.questions = questions.map((q, i) => ({
    questionId: tid(q.questionId),
    marks: q.marks ?? null,
    order: q.order ?? i,
  }));
  await recomputeTotalMarks(tenantId, doc);
  doc.updatedBy = tid(user.id);
  await doc.save();
  await bumpUsageCount(
    tenantId,
    questions.map((q) => q.questionId)
  );
  return mapQuiz(doc.toObject());
}

// ─── Attempts ───────────────────────────────────────────────────────────────

export async function startAttempt(
  tenantId: string,
  quizId: string,
  user: { id: string; roles: string[] },
  meta?: { ip?: string; userAgent?: string }
) {
  const quiz = await Quiz.findOne(baseFilter(tenantId, { _id: tid(quizId) }));
  if (!quiz) throw new AppError(404, 'Quiz not found', 'NOT_FOUND');
  if (quiz.status !== 'published') {
    throw new AppError(400, 'Quiz is not open', 'NOT_OPEN');
  }

  const studentId = await resolveStudentId(tenantId, user.id);
  await assertEnrolled(tenantId, studentId, String(quiz.courseId));

  const now = new Date();
  if (quiz.availableFrom && now < quiz.availableFrom) {
    throw new AppError(400, 'Quiz is not yet available', 'NOT_AVAILABLE');
  }
  if (quiz.dueAt && now > quiz.dueAt) {
    throw new AppError(400, 'Quiz deadline has passed', 'DEADLINE_PASSED');
  }

  // In-progress attempt?
  const inProgress = await QuizAttempt.findOne(
    baseFilter(tenantId, {
      quizId: quiz._id,
      studentId: tid(studentId),
      status: 'in_progress',
    })
  );
  if (inProgress) {
    // Auto-submit if expired
    if (inProgress.expiresAt && now > inProgress.expiresAt && quiz.autoSubmitOnTimeout) {
      return submitAttemptInternal(tenantId, inProgress, quiz, true);
    }
    return {
      attempt: mapAttempt(inProgress.toObject()),
      questions: await loadSafeQuestions(tenantId, quiz, inProgress),
    };
  }

  const attemptCount = await QuizAttempt.countDocuments(
    baseFilter(tenantId, {
      quizId: quiz._id,
      studentId: tid(studentId),
      status: { $ne: 'in_progress' },
    })
  );
  if (attemptCount >= quiz.maxAttempts) {
    throw new AppError(400, 'Maximum attempts reached', 'MAX_ATTEMPTS');
  }

  let questionOrder = (quiz.questions || []).map((q: any) => q.questionId);
  if (quiz.shuffleQuestions) {
    questionOrder = shuffleArray(questionOrder);
  }

  const optionOrder: Record<string, string[]> = {};
  if (quiz.shuffleOptions) {
    const qs = await Question.find(
      baseFilter(tenantId, { _id: { $in: questionOrder } })
    )
      .select('_id options')
      .lean();
    for (const q of qs) {
      if (q.options?.length) {
        optionOrder[String(q._id)] = shuffleArray(q.options.map((o: any) => o.key));
      }
    }
  }

  const expiresAt =
    quiz.durationMinutes != null
      ? new Date(now.getTime() + quiz.durationMinutes * 60 * 1000)
      : null;

  const attempt = await QuizAttempt.create({
    tenantId: tid(tenantId),
    quizId: quiz._id,
    studentId: tid(studentId),
    courseId: quiz.courseId,
    attemptNumber: attemptCount + 1,
    status: 'in_progress',
    startedAt: now,
    expiresAt,
    answers: [],
    questionOrder,
    optionOrder,
    ip: meta?.ip ?? null,
    userAgent: meta?.userAgent ?? null,
    createdBy: tid(user.id),
  });

  return {
    attempt: mapAttempt(attempt.toObject()),
    questions: await loadSafeQuestions(tenantId, quiz, attempt),
  };
}

async function loadSafeQuestions(
  tenantId: string,
  quiz: any,
  attempt: any
): Promise<QuestionSafePublic[]> {
  const order = (attempt.questionOrder || []).map(String);
  const qs = await Question.find(
    baseFilter(tenantId, { _id: { $in: order.map(tid) } })
  ).lean();
  const map = new Map(qs.map((q) => [String(q._id), q]));
  const marksMap = new Map(
    (quiz.questions || []).map((q: any) => [String(q.questionId), q.marks])
  );

  return order
    .map((id: string, idx: number) => {
      const q = map.get(id);
      if (!q) return null;
      let options = (q.options || []).map((o: any) => ({ key: o.key, text: o.text }));
      const optOrder = attempt.optionOrder?.[id];
      if (optOrder?.length) {
        const om = new Map(options.map((o: any) => [o.key, o]));
        options = optOrder.map((k: string) => om.get(k)).filter(Boolean) as any;
      }
      const pairs = (q.matchingPairs || []).map((p: any) => ({
        left: p.left,
        // hide correct right on student view during attempt — only lefts + shuffled rights
      }));
      return {
        id: String(q._id),
        type: q.type,
        stem: q.stem,
        richText: q.richText ?? null,
        options,
        matchingPairs:
          q.type === 'matching'
            ? (q.matchingPairs || []).map((p: any) => ({ left: p.left }))
            : undefined,
        marks: marksMap.get(id) != null ? marksMap.get(id)! : q.marks,
        order: idx,
      } as QuestionSafePublic;
    })
    .filter(Boolean) as QuestionSafePublic[];
}

export async function getAttempt(
  tenantId: string,
  attemptId: string,
  user: { id: string; roles: string[] }
) {
  const attempt = await QuizAttempt.findOne(baseFilter(tenantId, { _id: tid(attemptId) }));
  if (!attempt) throw new AppError(404, 'Attempt not found', 'NOT_FOUND');

  const quiz = await Quiz.findOne(baseFilter(tenantId, { _id: attempt.quizId }));
  if (!quiz) throw new AppError(404, 'Quiz not found', 'NOT_FOUND');

  const isStaff = isAdminOrFaculty(user.roles);
  if (!isStaff) {
    const studentId = await resolveStudentId(tenantId, user.id);
    if (String(attempt.studentId) !== studentId) {
      throw new AppError(403, 'Not your attempt', 'FORBIDDEN');
    }
  }

  // Auto-submit expired
  if (
    attempt.status === 'in_progress' &&
    attempt.expiresAt &&
    new Date() > attempt.expiresAt &&
    quiz.autoSubmitOnTimeout
  ) {
    const result = await submitAttemptInternal(tenantId, attempt, quiz, true);
    return result;
  }

  const showAnswers =
    isStaff ||
    (attempt.status !== 'in_progress' &&
      (quiz.showResults === 'after_submit' ||
        (quiz.showResults === 'after_close' && quiz.status === 'closed')));

  const questions = attempt.status === 'in_progress' || !showAnswers
    ? await loadSafeQuestions(tenantId, quiz, attempt)
    : undefined;

  return {
    attempt: mapAttempt(attempt.toObject()),
    quiz: mapQuiz(quiz.toObject()),
    questions,
    showResults: showAnswers,
  };
}

export async function saveAnswers(
  tenantId: string,
  attemptId: string,
  answers: Array<{ questionId: string; response?: unknown }>,
  user: { id: string; roles: string[] }
) {
  const attempt = await QuizAttempt.findOne(baseFilter(tenantId, { _id: tid(attemptId) }));
  if (!attempt) throw new AppError(404, 'Attempt not found', 'NOT_FOUND');
  if (attempt.status !== 'in_progress') {
    throw new AppError(400, 'Attempt is already submitted', 'ALREADY_SUBMITTED');
  }

  const studentId = await resolveStudentId(tenantId, user.id);
  if (String(attempt.studentId) !== studentId) {
    throw new AppError(403, 'Not your attempt', 'FORBIDDEN');
  }

  const quiz = await Quiz.findOne(baseFilter(tenantId, { _id: attempt.quizId }));
  if (!quiz) throw new AppError(404, 'Quiz not found', 'NOT_FOUND');

  if (attempt.expiresAt && new Date() > attempt.expiresAt && quiz.autoSubmitOnTimeout) {
    return submitAttemptInternal(tenantId, attempt, quiz, true);
  }

  const answerMap = new Map<string, any>(
    attempt.answers.map((a: any) => [String(a.questionId), a])
  );
  for (const a of answers) {
    const existing = answerMap.get(a.questionId);
    if (existing) {
      existing.response = a.response ?? null;
    } else {
      attempt.answers.push({
        questionId: tid(a.questionId),
        response: a.response ?? null,
        isCorrect: null,
        marksAwarded: null,
      });
    }
  }
  attempt.updatedBy = tid(user.id);
  await attempt.save();
  return mapAttempt(attempt.toObject());
}

export async function submitAttempt(
  tenantId: string,
  attemptId: string,
  user: { id: string; roles: string[] }
) {
  const attempt = await QuizAttempt.findOne(baseFilter(tenantId, { _id: tid(attemptId) }));
  if (!attempt) throw new AppError(404, 'Attempt not found', 'NOT_FOUND');

  const studentId = await resolveStudentId(tenantId, user.id);
  if (String(attempt.studentId) !== studentId) {
    throw new AppError(403, 'Not your attempt', 'FORBIDDEN');
  }

  const quiz = await Quiz.findOne(baseFilter(tenantId, { _id: attempt.quizId }));
  if (!quiz) throw new AppError(404, 'Quiz not found', 'NOT_FOUND');

  return submitAttemptInternal(tenantId, attempt, quiz, false);
}

async function submitAttemptInternal(
  tenantId: string,
  attempt: any,
  quiz: any,
  auto: boolean
) {
  if (attempt.status !== 'in_progress') {
    return {
      attempt: mapAttempt(attempt.toObject ? attempt.toObject() : attempt),
      quiz: mapQuiz(quiz.toObject ? quiz.toObject() : quiz),
    };
  }

  const qIds = (quiz.questions || []).map((q: any) => q.questionId);
  const bankQuestions = await Question.find(
    baseFilter(tenantId, { _id: { $in: qIds } })
  ).lean();
  const qMap = new Map(bankQuestions.map((q) => [String(q._id), q]));
  const marksOverride = new Map(
    (quiz.questions || []).map((q: any) => [String(q.questionId), q.marks])
  );

  let total = 0;
  let hasSubjective = false;
  const gradedAnswers = [];

  for (const a of attempt.answers || []) {
    const qid = String(a.questionId);
    const question = qMap.get(qid);
    if (!question) continue;
    const marks =
      marksOverride.get(qid) != null ? marksOverride.get(qid)! : question.marks;

    if (OBJECTIVE_QUESTION_TYPES.includes(question.type as any)) {
      const result = gradeObjective(
        question,
        a.response,
        marks,
        quiz.negativeMarking
      );
      gradedAnswers.push({
        questionId: a.questionId,
        response: a.response,
        isCorrect: result.isCorrect,
        marksAwarded: result.marksAwarded,
      });
      total += result.marksAwarded;
    } else {
      hasSubjective = true;
      gradedAnswers.push({
        questionId: a.questionId,
        response: a.response,
        isCorrect: null,
        marksAwarded: null,
      });
    }
  }

  // Include unanswered objective as 0
  for (const qref of quiz.questions || []) {
    const qid = String(qref.questionId);
    if (gradedAnswers.some((g) => String(g.questionId) === qid)) continue;
    const question = qMap.get(qid);
    if (!question) continue;
    if (OBJECTIVE_QUESTION_TYPES.includes(question.type as any)) {
      gradedAnswers.push({
        questionId: qref.questionId,
        response: null,
        isCorrect: false,
        marksAwarded: 0,
      });
    } else {
      hasSubjective = true;
      gradedAnswers.push({
        questionId: qref.questionId,
        response: null,
        isCorrect: null,
        marksAwarded: null,
      });
    }
  }

  attempt.answers = gradedAnswers;
  attempt.totalMarksAwarded = Math.max(0, total);
  attempt.percent =
    quiz.totalMarks > 0
      ? Math.round((attempt.totalMarksAwarded / quiz.totalMarks) * 10000) / 100
      : 0;
  attempt.submittedAt = new Date();
  attempt.status = auto ? 'auto_submitted' : hasSubjective ? 'submitted' : 'graded';
  await attempt.save();

  return {
    attempt: mapAttempt(attempt.toObject ? attempt.toObject() : attempt),
    quiz: mapQuiz(quiz.toObject ? quiz.toObject() : quiz),
  };
}

export async function listAttempts(
  tenantId: string,
  quizId: string,
  user: { id: string; roles: string[] }
) {
  const quiz = await Quiz.findOne(baseFilter(tenantId, { _id: tid(quizId) }));
  if (!quiz) throw new AppError(404, 'Quiz not found', 'NOT_FOUND');
  await assertCanManageQuiz(tenantId, user, String(quiz.courseId));

  const items = await QuizAttempt.find(baseFilter(tenantId, { quizId: tid(quizId) }))
    .sort({ submittedAt: -1, startedAt: -1 })
    .lean();

  const studentIds = [...new Set(items.map((i) => String(i.studentId)))];
  const students = await Student.find({
    _id: { $in: studentIds.map(tid) },
    tenantId: tid(tenantId),
  })
    .select('firstName lastName')
    .lean();
  const nameMap = new Map(
    students.map((s) => [
      String(s._id),
      [s.firstName, s.lastName].filter(Boolean).join(' ') || 'Student',
    ])
  );

  return items.map((d) => mapAttempt(d, { studentName: nameMap.get(String(d.studentId)) }));
}

export async function myAttempts(
  tenantId: string,
  quizId: string,
  user: { id: string; roles: string[] }
) {
  const quiz = await Quiz.findOne(baseFilter(tenantId, { _id: tid(quizId) }));
  if (!quiz) throw new AppError(404, 'Quiz not found', 'NOT_FOUND');
  const studentId = await resolveStudentId(tenantId, user.id);
  await assertEnrolled(tenantId, studentId, String(quiz.courseId));

  const items = await QuizAttempt.find(
    baseFilter(tenantId, { quizId: tid(quizId), studentId: tid(studentId) })
  )
    .sort({ attemptNumber: -1 })
    .lean();
  return items.map((d) => mapAttempt(d));
}

export async function gradeAttempt(
  tenantId: string,
  attemptId: string,
  body: {
    answers: Array<{ questionId: string; marksAwarded: number; isCorrect?: boolean | null }>;
  },
  user: { id: string; roles: string[] }
) {
  const attempt = await QuizAttempt.findOne(baseFilter(tenantId, { _id: tid(attemptId) }));
  if (!attempt) throw new AppError(404, 'Attempt not found', 'NOT_FOUND');

  const quiz = await Quiz.findOne(baseFilter(tenantId, { _id: attempt.quizId }));
  if (!quiz) throw new AppError(404, 'Quiz not found', 'NOT_FOUND');
  await assertCanManageQuiz(tenantId, user, String(quiz.courseId));

  const marksOverride = new Map(
    (quiz.questions || []).map((q: any) => [String(q.questionId), q.marks])
  );
  const answerMap = new Map<string, any>(
    attempt.answers.map((a: any) => [String(a.questionId), a])
  );

  for (const g of body.answers) {
    const existing = answerMap.get(g.questionId);
    if (existing) {
      existing.marksAwarded = g.marksAwarded;
      if (g.isCorrect !== undefined) existing.isCorrect = g.isCorrect;
    } else {
      attempt.answers.push({
        questionId: tid(g.questionId),
        response: null,
        marksAwarded: g.marksAwarded,
        isCorrect: g.isCorrect ?? null,
      });
    }
  }

  let total = 0;
  for (const a of attempt.answers) {
    if (a.marksAwarded != null) total += a.marksAwarded;
  }
  attempt.totalMarksAwarded = Math.max(0, total);
  attempt.percent =
    quiz.totalMarks > 0
      ? Math.round((attempt.totalMarksAwarded / quiz.totalMarks) * 10000) / 100
      : 0;
  attempt.status = 'graded';
  attempt.updatedBy = tid(user.id);
  await attempt.save();
  return mapAttempt(attempt.toObject());
}
