import mongoose from 'mongoose';
import { randomUUID } from 'crypto';
import { AppError } from '../../middleware/errorHandler';
import {
  Practical,
  Lab,
  Experiment,
  LabSubmission,
  ExecutionJob,
  LabEvaluation,
  DigitalLabRecord,
  type IExperiment,
} from './lab.model';
import { Course } from '../courses/course.model';
import { Student } from '../students/student.model';
import { resolveStudentId, assertEnrolled } from '../learn/learn.service';
import { getExecutionAdapter } from './execution/ExecutionAdapter';
import type {
  PracticalPublic,
  LabPublic,
  ExperimentPublic,
  LabSubmissionPublic,
  ExecutionJobPublic,
  LabEvaluationPublic,
  LabTestCasePublic,
  LabLanguage,
} from '@university-lms/shared';

function tid(id: string) {
  return new mongoose.Types.ObjectId(id);
}

function idStr(v: unknown): string | null {
  if (!v) return null;
  return String(v);
}

function baseFilter(tenantId: string, extra: Record<string, unknown> = {}): Record<string, any> {
  return { tenantId: tid(tenantId), isDeleted: false, ...extra };
}

function parseDate(v: unknown): Date | null {
  if (!v) return null;
  if (v instanceof Date) return v;
  const d = new Date(String(v));
  return Number.isNaN(d.getTime()) ? null : d;
}

function isFacultyOrAdmin(roles: string[]): boolean {
  return roles.some((r) =>
    ['super_admin', 'tenant_admin', 'university_admin', 'faculty', 'department_head'].includes(r)
  );
}

/** Strip expectedOutput from hidden tests for student responses */
function mapTestCasesForAudience(
  testCases: IExperiment['testCases'] | undefined,
  isFaculty: boolean
): LabTestCasePublic[] {
  return (testCases || []).map((tc) => {
    const base: LabTestCasePublic = {
      id: tc.id,
      input: tc.visibility === 'hidden' && !isFaculty ? '' : tc.input,
      visibility: tc.visibility as 'public' | 'hidden',
      weight: tc.weight,
      name: tc.name,
    };
    if (isFaculty || tc.visibility === 'public') {
      base.expectedOutput = tc.expectedOutput;
      if (tc.visibility === 'public') base.input = tc.input;
    }
    return base;
  });
}

function mapPractical(d: any, extra: Partial<PracticalPublic> = {}): PracticalPublic {
  return {
    id: String(d._id),
    tenantId: String(d.tenantId),
    courseId: String(d.courseId),
    offeringId: idStr(d.offeringId),
    title: d.title,
    description: d.description ?? null,
    status: d.status,
    facultyOwnerIds: (d.facultyOwnerIds || []).map(String),
    availableFrom: d.availableFrom ?? null,
    availableTo: d.availableTo ?? null,
    maxScore: d.maxScore ?? 100,
    weightPercent: d.weightPercent ?? null,
    labCount: extra.labCount,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
    courseName: extra.courseName,
    courseCode: extra.courseCode,
  };
}

function mapLab(d: any, extra: Partial<LabPublic> = {}): LabPublic {
  return {
    id: String(d._id),
    tenantId: String(d.tenantId),
    practicalId: String(d.practicalId),
    courseId: String(d.courseId),
    title: d.title,
    order: d.order ?? 0,
    instructions: d.instructions ?? null,
    defaultLanguage: d.defaultLanguage || 'python',
    timeoutSec: d.timeoutSec ?? 10,
    memoryMb: d.memoryMb ?? 128,
    status: d.status,
    experimentCount: extra.experimentCount,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  };
}

function mapExperiment(d: any, isFaculty: boolean, extra: Partial<ExperimentPublic> = {}): ExperimentPublic {
  const starter =
    d.starterCode instanceof Map
      ? Object.fromEntries(d.starterCode)
      : d.starterCode || {};
  return {
    id: String(d._id),
    tenantId: String(d.tenantId),
    labId: String(d.labId),
    practicalId: idStr(d.practicalId) || undefined,
    courseId: idStr(d.courseId) || undefined,
    title: d.title,
    statement: d.statement,
    allowedLanguages: d.allowedLanguages || ['python'],
    starterCode: starter,
    timeLimitSec: d.timeLimitSec ?? 10,
    memoryLimitMb: d.memoryLimitMb ?? 128,
    maxScore: d.maxScore ?? 100,
    testCases: mapTestCasesForAudience(d.testCases, isFaculty),
    evaluationMode: d.evaluationMode || 'auto',
    attachments: (d.attachments || []).map((a: any) => ({
      fileKey: a.fileKey,
      fileName: a.fileName,
      mimeType: a.mimeType,
      size: a.size,
    })),
    status: d.status,
    order: d.order ?? 0,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
    ...extra,
  };
}

function mapSubmission(
  d: any,
  isFaculty: boolean,
  experiment?: { testCases?: IExperiment['testCases'] },
  extra: Partial<LabSubmissionPublic> = {}
): LabSubmissionPublic {
  const allCases = experiment?.testCases || [];
  const publicIds = new Set(allCases.filter((t) => t.visibility === 'public').map((t) => t.id));
  const hiddenIds = new Set(allCases.filter((t) => t.visibility === 'hidden').map((t) => t.id));

  const results = d.testResults || [];
  let publicPassed = 0;
  let publicTotal = publicIds.size;
  let hiddenPassed = 0;
  let hiddenTotal = hiddenIds.size;

  for (const r of results) {
    if (publicIds.has(r.testCaseId) && r.passed) publicPassed += 1;
    if (hiddenIds.has(r.testCaseId) && r.passed) hiddenPassed += 1;
  }

  // Students only see public test result details; counts for hidden
  const safeResults = isFaculty
    ? results
    : results
        .filter((r: any) => publicIds.has(r.testCaseId))
        .map((r: any) => ({
          testCaseId: r.testCaseId,
          passed: r.passed,
          actualOutput: r.actualOutput,
          durationMs: r.durationMs,
          score: r.score,
        }));

  return {
    id: String(d._id),
    tenantId: String(d.tenantId),
    experimentId: String(d.experimentId),
    labId: String(d.labId),
    studentId: String(d.studentId),
    courseId: String(d.courseId),
    kind: d.kind,
    language: d.language ?? null,
    code: isFaculty || extra.code !== undefined ? d.code ?? null : d.code ?? null,
    reportFileKey: d.reportFileKey ?? null,
    screenshotFileKey: d.screenshotFileKey ?? null,
    outputText: d.outputText ?? null,
    githubUrl: d.githubUrl ?? null,
    executionJobId: idStr(d.executionJobId),
    autoScore: d.autoScore ?? null,
    manualScore: d.manualScore ?? null,
    totalScore: d.totalScore ?? null,
    status: d.status,
    attemptNumber: d.attemptNumber,
    submittedAt: d.submittedAt ?? null,
    testResults: safeResults,
    publicPassed,
    publicTotal,
    hiddenPassed: isFaculty || d.status === 'scored' || d.status === 'evaluated' ? hiddenPassed : undefined,
    hiddenTotal: isFaculty || d.status === 'scored' || d.status === 'evaluated' ? hiddenTotal : undefined,
    evaluationStatus: d.evaluationStatus,
    feedback: d.feedback ?? null,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
    studentName: extra.studentName,
    studentCode: extra.studentCode,
    experimentTitle: extra.experimentTitle,
  };
}

function mapJob(d: any): ExecutionJobPublic {
  return {
    id: String(d._id),
    tenantId: String(d.tenantId),
    submissionId: String(d.submissionId),
    studentId: String(d.studentId),
    experimentId: String(d.experimentId),
    language: d.language,
    status: d.status,
    queuedAt: d.queuedAt,
    startedAt: d.startedAt ?? null,
    finishedAt: d.finishedAt ?? null,
    stdout: d.stdout ?? null,
    stderr: d.stderr ?? null,
    exitCode: d.exitCode ?? null,
    testResults: d.testResults || [],
    errorMessage: d.errorMessage ?? null,
    workerId: d.workerId ?? null,
    durationMs: d.durationMs ?? null,
  };
}

// ─── Practical CRUD ─────────────────────────────────────────────────────────

export async function listPracticals(
  tenantId: string,
  user: { id: string; roles: string[] },
  q: { page: number; limit: number; courseId?: string; status?: string; search?: string }
) {
  const filter: Record<string, unknown> = baseFilter(tenantId);
  if (q.courseId) filter.courseId = tid(q.courseId);
  if (q.status) filter.status = q.status;
  if (q.search) filter.title = { $regex: q.search, $options: 'i' };

  const isStaff = isFacultyOrAdmin(user.roles);
  if (!isStaff) {
    filter.status = 'published';
    // Students: only courses they're enrolled in (if courseId given, still check)
  }

  const skip = (q.page - 1) * q.limit;
  const [items, total] = await Promise.all([
    Practical.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(q.limit).lean(),
    Practical.countDocuments(filter),
  ]);

  const courseIds = [...new Set(items.map((i) => String(i.courseId)))];
  const courses = await Course.find({ _id: { $in: courseIds.map(tid) }, tenantId: tid(tenantId) })
    .select('name code')
    .lean();
  const courseMap = new Map(courses.map((c) => [String(c._id), c]));

  const labCounts = await Lab.aggregate([
    {
      $match: {
        tenantId: tid(tenantId),
        isDeleted: false,
        practicalId: { $in: items.map((i) => i._id) },
      },
    },
    { $group: { _id: '$practicalId', count: { $sum: 1 } } },
  ]);
  const labCountMap = new Map(labCounts.map((x) => [String(x._id), x.count as number]));

  // For students, filter to enrolled courses
  let resultItems = items;
  if (!isStaff) {
    const studentId = await resolveStudentId(tenantId, user.id).catch(() => null);
    if (studentId) {
      const enrolled: string[] = [];
      for (const cId of courseIds) {
        try {
          await assertEnrolled(tenantId, studentId, cId);
          enrolled.push(cId);
        } catch {
          /* not enrolled */
        }
      }
      resultItems = items.filter((i) => enrolled.includes(String(i.courseId)));
    } else {
      resultItems = [];
    }
  }

  return {
    items: resultItems.map((d) => {
      const c = courseMap.get(String(d.courseId));
      return mapPractical(d, {
        labCount: labCountMap.get(String(d._id)) || 0,
        courseName: c?.name,
        courseCode: (c as any)?.code,
      });
    }),
    page: q.page,
    limit: q.limit,
    total: isStaff ? total : resultItems.length,
    totalPages: Math.ceil((isStaff ? total : resultItems.length) / q.limit) || 1,
  };
}

export async function createPractical(
  tenantId: string,
  user: { id: string },
  data: Record<string, unknown>
) {
  const course = await Course.findOne(baseFilter(tenantId, { _id: tid(String(data.courseId)) }));
  if (!course) throw new AppError(404, 'Course not found', 'NOT_FOUND');

  const doc = await Practical.create({
    tenantId: tid(tenantId),
    courseId: tid(String(data.courseId)),
    offeringId: data.offeringId ? tid(String(data.offeringId)) : null,
    title: data.title,
    description: data.description ?? null,
    facultyOwnerIds: Array.isArray(data.facultyOwnerIds)
      ? data.facultyOwnerIds.map((id: string) => tid(id))
      : [tid(user.id)],
    availableFrom: parseDate(data.availableFrom),
    availableTo: parseDate(data.availableTo),
    maxScore: data.maxScore ?? 100,
    weightPercent: data.weightPercent ?? null,
    status: data.status || 'draft',
    createdBy: tid(user.id),
    updatedBy: tid(user.id),
  });

  return mapPractical(doc.toObject());
}

export async function getPractical(
  tenantId: string,
  id: string,
  user: { id: string; roles: string[] }
) {
  const doc = await Practical.findOne(baseFilter(tenantId, { _id: tid(id) }));
  if (!doc) throw new AppError(404, 'Practical not found', 'NOT_FOUND');
  if (!isFacultyOrAdmin(user.roles) && doc.status !== 'published') {
    throw new AppError(404, 'Practical not found', 'NOT_FOUND');
  }
  const labs = await Lab.countDocuments(baseFilter(tenantId, { practicalId: doc._id }));
  return mapPractical(doc.toObject(), { labCount: labs });
}

export async function updatePractical(
  tenantId: string,
  id: string,
  user: { id: string },
  data: Record<string, unknown>
) {
  const doc = await Practical.findOne(baseFilter(tenantId, { _id: tid(id) }));
  if (!doc) throw new AppError(404, 'Practical not found', 'NOT_FOUND');

  if (data.title !== undefined) doc.title = String(data.title);
  if (data.description !== undefined) doc.description = data.description as string | null;
  if (data.status !== undefined) doc.status = data.status as typeof doc.status;
  if (data.maxScore !== undefined) doc.maxScore = Number(data.maxScore);
  if (data.weightPercent !== undefined) doc.weightPercent = data.weightPercent as number | null;
  if (data.availableFrom !== undefined) doc.availableFrom = parseDate(data.availableFrom);
  if (data.availableTo !== undefined) doc.availableTo = parseDate(data.availableTo);
  if (data.offeringId !== undefined)
    doc.offeringId = data.offeringId ? tid(String(data.offeringId)) : null;
  if (Array.isArray(data.facultyOwnerIds))
    doc.facultyOwnerIds = data.facultyOwnerIds.map((x: string) => tid(x));
  doc.updatedBy = tid(user.id);
  await doc.save();
  return mapPractical(doc.toObject());
}

export async function deletePractical(tenantId: string, id: string, user: { id: string }) {
  const doc = await Practical.findOne(baseFilter(tenantId, { _id: tid(id) }));
  if (!doc) throw new AppError(404, 'Practical not found', 'NOT_FOUND');
  doc.isDeleted = true;
  doc.deletedAt = new Date();
  doc.updatedBy = tid(user.id);
  await doc.save();
  return { success: true };
}

export async function publishPractical(tenantId: string, id: string, user: { id: string }) {
  const doc = await Practical.findOne(baseFilter(tenantId, { _id: tid(id) }));
  if (!doc) throw new AppError(404, 'Practical not found', 'NOT_FOUND');
  doc.status = 'published';
  doc.updatedBy = tid(user.id);
  await doc.save();
  return mapPractical(doc.toObject());
}

// ─── Lab CRUD ───────────────────────────────────────────────────────────────

export async function listLabs(tenantId: string, practicalId: string, user: { id: string; roles: string[] }) {
  const practical = await Practical.findOne(baseFilter(tenantId, { _id: tid(practicalId) }));
  if (!practical) throw new AppError(404, 'Practical not found', 'NOT_FOUND');
  if (!isFacultyOrAdmin(user.roles) && practical.status !== 'published') {
    throw new AppError(404, 'Practical not found', 'NOT_FOUND');
  }

  const filter = baseFilter(tenantId, { practicalId: tid(practicalId) });
  if (!isFacultyOrAdmin(user.roles)) filter.status = 'published';

  const items = await Lab.find(filter).sort({ order: 1, createdAt: 1 }).lean();
  const expCounts = await Experiment.aggregate([
    {
      $match: {
        tenantId: tid(tenantId),
        isDeleted: false,
        labId: { $in: items.map((i) => i._id) },
      },
    },
    { $group: { _id: '$labId', count: { $sum: 1 } } },
  ]);
  const countMap = new Map(expCounts.map((x) => [String(x._id), x.count as number]));

  return items.map((d) => mapLab(d, { experimentCount: countMap.get(String(d._id)) || 0 }));
}

export async function createLab(
  tenantId: string,
  user: { id: string },
  data: Record<string, unknown>
) {
  const practical = await Practical.findOne(
    baseFilter(tenantId, { _id: tid(String(data.practicalId)) })
  );
  if (!practical) throw new AppError(404, 'Practical not found', 'NOT_FOUND');

  const doc = await Lab.create({
    tenantId: tid(tenantId),
    practicalId: practical._id,
    courseId: practical.courseId,
    title: data.title,
    order: data.order ?? 0,
    instructions: data.instructions ?? null,
    defaultLanguage: data.defaultLanguage || 'python',
    timeoutSec: data.timeoutSec ?? 10,
    memoryMb: data.memoryMb ?? 128,
    status: data.status || 'draft',
    createdBy: tid(user.id),
    updatedBy: tid(user.id),
  });
  return mapLab(doc.toObject());
}

export async function updateLab(
  tenantId: string,
  id: string,
  user: { id: string },
  data: Record<string, unknown>
) {
  const doc = await Lab.findOne(baseFilter(tenantId, { _id: tid(id) }));
  if (!doc) throw new AppError(404, 'Lab not found', 'NOT_FOUND');
  if (data.title !== undefined) doc.title = String(data.title);
  if (data.order !== undefined) doc.order = Number(data.order);
  if (data.instructions !== undefined) doc.instructions = data.instructions as string | null;
  if (data.defaultLanguage !== undefined)
    doc.defaultLanguage = data.defaultLanguage as LabLanguage;
  if (data.timeoutSec !== undefined) doc.timeoutSec = Number(data.timeoutSec);
  if (data.memoryMb !== undefined) doc.memoryMb = Number(data.memoryMb);
  if (data.status !== undefined) doc.status = data.status as typeof doc.status;
  doc.updatedBy = tid(user.id);
  await doc.save();
  return mapLab(doc.toObject());
}

export async function deleteLab(tenantId: string, id: string, user: { id: string }) {
  const doc = await Lab.findOne(baseFilter(tenantId, { _id: tid(id) }));
  if (!doc) throw new AppError(404, 'Lab not found', 'NOT_FOUND');
  doc.isDeleted = true;
  doc.deletedAt = new Date();
  doc.updatedBy = tid(user.id);
  await doc.save();
  return { success: true };
}

// ─── Experiment CRUD ────────────────────────────────────────────────────────

export async function listExperiments(
  tenantId: string,
  labId: string,
  user: { id: string; roles: string[] }
) {
  const lab = await Lab.findOne(baseFilter(tenantId, { _id: tid(labId) }));
  if (!lab) throw new AppError(404, 'Lab not found', 'NOT_FOUND');
  const isStaff = isFacultyOrAdmin(user.roles);
  if (!isStaff && lab.status !== 'published') {
    throw new AppError(404, 'Lab not found', 'NOT_FOUND');
  }

  const filter = baseFilter(tenantId, { labId: tid(labId) });
  if (!isStaff) filter.status = 'published';

  const items = await Experiment.find(filter).sort({ order: 1, createdAt: 1 }).lean();
  return items.map((d) => mapExperiment(d, isStaff));
}

export async function createExperiment(
  tenantId: string,
  user: { id: string },
  data: Record<string, unknown>
) {
  const lab = await Lab.findOne(baseFilter(tenantId, { _id: tid(String(data.labId)) }));
  if (!lab) throw new AppError(404, 'Lab not found', 'NOT_FOUND');

  const testCases = Array.isArray(data.testCases)
    ? data.testCases.map((tc: any, i: number) => ({
        id: tc.id || randomUUID().slice(0, 8),
        input: tc.input ?? '',
        expectedOutput: tc.expectedOutput ?? '',
        visibility: tc.visibility || 'public',
        weight: tc.weight ?? 1,
        name: tc.name,
      }))
    : [];

  const doc = await Experiment.create({
    tenantId: tid(tenantId),
    labId: lab._id,
    practicalId: lab.practicalId,
    courseId: lab.courseId,
    title: data.title,
    statement: data.statement,
    allowedLanguages: data.allowedLanguages || ['python'],
    starterCode: data.starterCode || {},
    timeLimitSec: data.timeLimitSec ?? lab.timeoutSec ?? 10,
    memoryLimitMb: data.memoryLimitMb ?? lab.memoryMb ?? 128,
    maxScore: data.maxScore ?? 100,
    testCases,
    evaluationMode: data.evaluationMode || 'auto',
    attachments: data.attachments || [],
    status: data.status || 'draft',
    order: data.order ?? 0,
    maxAttempts: data.maxAttempts ?? 10,
    createdBy: tid(user.id),
    updatedBy: tid(user.id),
  });
  return mapExperiment(doc.toObject(), true);
}

export async function getExperiment(
  tenantId: string,
  id: string,
  user: { id: string; roles: string[] }
) {
  const doc = await Experiment.findOne(baseFilter(tenantId, { _id: tid(id) }));
  if (!doc) throw new AppError(404, 'Experiment not found', 'NOT_FOUND');
  const isStaff = isFacultyOrAdmin(user.roles);
  if (!isStaff && doc.status !== 'published') {
    throw new AppError(404, 'Experiment not found', 'NOT_FOUND');
  }
  if (!isStaff) {
    const studentId = await resolveStudentId(tenantId, user.id);
    await assertEnrolled(tenantId, studentId, String(doc.courseId));
  }
  return mapExperiment(doc.toObject(), isStaff);
}

export async function updateExperiment(
  tenantId: string,
  id: string,
  user: { id: string },
  data: Record<string, unknown>
) {
  const doc = await Experiment.findOne(baseFilter(tenantId, { _id: tid(id) }));
  if (!doc) throw new AppError(404, 'Experiment not found', 'NOT_FOUND');

  if (data.title !== undefined) doc.title = String(data.title);
  if (data.statement !== undefined) doc.statement = String(data.statement);
  if (data.allowedLanguages !== undefined)
    doc.allowedLanguages = data.allowedLanguages as LabLanguage[];
  if (data.starterCode !== undefined) doc.starterCode = data.starterCode as Record<string, string>;
  if (data.timeLimitSec !== undefined) doc.timeLimitSec = Number(data.timeLimitSec);
  if (data.memoryLimitMb !== undefined) doc.memoryLimitMb = Number(data.memoryLimitMb);
  if (data.maxScore !== undefined) doc.maxScore = Number(data.maxScore);
  if (data.evaluationMode !== undefined)
    doc.evaluationMode = data.evaluationMode as typeof doc.evaluationMode;
  if (data.status !== undefined) doc.status = data.status as typeof doc.status;
  if (data.order !== undefined) doc.order = Number(data.order);
  if (data.maxAttempts !== undefined) doc.maxAttempts = Number(data.maxAttempts);
  if (data.attachments !== undefined) doc.attachments = data.attachments as typeof doc.attachments;
  if (Array.isArray(data.testCases)) {
    doc.testCases = data.testCases.map((tc: any) => ({
      id: tc.id || randomUUID().slice(0, 8),
      input: tc.input ?? '',
      expectedOutput: tc.expectedOutput ?? '',
      visibility: tc.visibility || 'public',
      weight: tc.weight ?? 1,
      name: tc.name,
    }));
  }
  doc.updatedBy = tid(user.id);
  await doc.save();
  return mapExperiment(doc.toObject(), true);
}

export async function replaceTestCases(
  tenantId: string,
  experimentId: string,
  user: { id: string },
  testCases: any[]
) {
  const doc = await Experiment.findOne(baseFilter(tenantId, { _id: tid(experimentId) }));
  if (!doc) throw new AppError(404, 'Experiment not found', 'NOT_FOUND');
  doc.testCases = testCases.map((tc) => ({
    id: tc.id || randomUUID().slice(0, 8),
    input: tc.input ?? '',
    expectedOutput: tc.expectedOutput ?? '',
    visibility: tc.visibility || 'public',
    weight: tc.weight ?? 1,
    name: tc.name,
  }));
  doc.updatedBy = tid(user.id);
  await doc.save();
  return mapExperiment(doc.toObject(), true);
}

export async function deleteExperiment(tenantId: string, id: string, user: { id: string }) {
  const doc = await Experiment.findOne(baseFilter(tenantId, { _id: tid(id) }));
  if (!doc) throw new AppError(404, 'Experiment not found', 'NOT_FOUND');
  doc.isDeleted = true;
  doc.deletedAt = new Date();
  doc.updatedBy = tid(user.id);
  await doc.save();
  return { success: true };
}

// ─── Submissions + execution ────────────────────────────────────────────────

export async function submitExperiment(
  tenantId: string,
  experimentId: string,
  user: { id: string; roles: string[] },
  data: Record<string, unknown>
) {
  const experiment = await Experiment.findOne(baseFilter(tenantId, { _id: tid(experimentId) }));
  if (!experiment) throw new AppError(404, 'Experiment not found', 'NOT_FOUND');
  if (experiment.status !== 'published') {
    throw new AppError(400, 'Experiment is not open for submissions', 'EXPERIMENT_CLOSED');
  }

  const studentId = await resolveStudentId(tenantId, user.id);
  await assertEnrolled(tenantId, studentId, String(experiment.courseId));

  const attemptCount = await LabSubmission.countDocuments(
    baseFilter(tenantId, {
      experimentId: experiment._id,
      studentId: tid(studentId),
    })
  );
  if (attemptCount >= (experiment.maxAttempts || 10)) {
    throw new AppError(400, 'Maximum attempts reached', 'MAX_ATTEMPTS');
  }

  const kind = (data.kind as string) || 'code';
  const language = (data.language as LabLanguage) || experiment.allowedLanguages[0] || 'python';
  if (kind === 'code' && data.code) {
    if (!experiment.allowedLanguages.includes(language)) {
      throw new AppError(400, `Language ${language} not allowed`, 'LANGUAGE_NOT_ALLOWED');
    }
  }

  const asDraft = !!data.asDraft;
  const submission = await LabSubmission.create({
    tenantId: tid(tenantId),
    experimentId: experiment._id,
    labId: experiment.labId,
    practicalId: experiment.practicalId,
    studentId: tid(studentId),
    courseId: experiment.courseId,
    kind,
    language: kind === 'code' ? language : null,
    code: data.code ?? null,
    reportFileKey: data.reportFileKey ?? null,
    screenshotFileKey: data.screenshotFileKey ?? null,
    outputText: data.outputText ?? null,
    githubUrl: data.githubUrl || null,
    status: asDraft ? 'draft' : 'submitted',
    attemptNumber: attemptCount + 1,
    submittedAt: asDraft ? null : new Date(),
    evaluationStatus: 'pending',
    createdBy: tid(user.id),
    updatedBy: tid(user.id),
  });

  if (asDraft || kind !== 'code' || !data.code) {
    // Manual / non-code: no execution job
    if (!asDraft && experiment.evaluationMode === 'manual') {
      submission.evaluationStatus = 'manual';
      await submission.save();
    }
    return mapSubmission(submission.toObject(), false, experiment);
  }

  // Enqueue isolated execution — NEVER run code in this process
  const job = await ExecutionJob.create({
    tenantId: tid(tenantId),
    submissionId: submission._id,
    studentId: tid(studentId),
    experimentId: experiment._id,
    language,
    code: String(data.code),
    status: 'queued',
    queuedAt: new Date(),
    timeLimitSec: experiment.timeLimitSec,
    memoryLimitMb: experiment.memoryLimitMb,
  });

  submission.executionJobId = job._id;
  submission.status = 'running';
  await submission.save();

  const adapter = getExecutionAdapter();
  try {
    await adapter.enqueue({
      jobId: String(job._id),
      tenantId,
      submissionId: String(submission._id),
      language,
      code: String(data.code),
      timeLimitSec: experiment.timeLimitSec,
      memoryLimitMb: experiment.memoryLimitMb,
      testCases: (experiment.testCases || []).map((tc) => ({
        id: tc.id,
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        weight: tc.weight,
      })),
    });
  } catch (err: any) {
    job.status = 'failed';
    job.errorMessage = err?.message || 'Failed to enqueue execution';
    job.finishedAt = new Date();
    await job.save();
    submission.status = 'submitted';
    submission.evaluationStatus = experiment.evaluationMode === 'auto' ? 'pending' : 'manual';
    await submission.save();
  }

  // Kick off background poll for mock adapter results (dev convenience)
  void settleJobWhenReady(tenantId, String(job._id), String(submission._id), experiment);

  return mapSubmission(submission.toObject(), false, experiment);
}

/** Poll mock/worker results and write scores back (dev + thin integration). */
async function settleJobWhenReady(
  tenantId: string,
  jobId: string,
  submissionId: string,
  experiment: IExperiment
) {
  const adapter = getExecutionAdapter();
  const maxTries = 30;
  for (let i = 0; i < maxTries; i++) {
    await new Promise((r) => setTimeout(r, 500));
    try {
      const result = await adapter.getStatus(jobId);
      if (
        result.status === 'queued' ||
        result.status === 'running'
      ) {
        continue;
      }

      const job = await ExecutionJob.findOne({
        _id: tid(jobId),
        tenantId: tid(tenantId),
      });
      const submission = await LabSubmission.findOne({
        _id: tid(submissionId),
        tenantId: tid(tenantId),
      });
      if (!job || !submission) return;

      job.status = result.status;
      job.stdout = result.stdout ?? null;
      job.stderr = result.stderr ?? null;
      job.exitCode = result.exitCode ?? null;
      job.testResults = (result.testResults || []) as typeof job.testResults;
      job.errorMessage = result.errorMessage ?? null;
      job.durationMs = result.durationMs ?? null;
      job.finishedAt = new Date();
      if (!job.startedAt) job.startedAt = new Date(Date.now() - (result.durationMs || 0));
      await job.save();

      const totalWeight = (experiment.testCases || []).reduce((s, t) => s + (t.weight || 0), 0) || 1;
      const earned = (result.testResults || []).reduce((s, t) => s + (t.score || (t.passed ? 1 : 0)), 0);
      const autoScore =
        experiment.maxScore > 0
          ? Math.round((earned / totalWeight) * experiment.maxScore * 100) / 100
          : 0;

      submission.testResults = (result.testResults || []) as typeof submission.testResults;
      submission.autoScore = autoScore;
      if (experiment.evaluationMode === 'auto') {
        submission.totalScore = autoScore;
        submission.evaluationStatus = 'auto_scored';
        submission.status = 'scored';
      } else if (experiment.evaluationMode === 'hybrid') {
        submission.evaluationStatus = 'auto_scored';
        submission.status = 'scored';
        submission.totalScore = autoScore;
      } else {
        submission.evaluationStatus = 'manual';
        submission.status = 'submitted';
      }
      await submission.save();

      await LabEvaluation.findOneAndUpdate(
        { tenantId: tid(tenantId), submissionId: submission._id },
        {
          $set: {
            autoScore,
            totalScore: experiment.evaluationMode === 'auto' ? autoScore : undefined,
            status: experiment.evaluationMode === 'auto' ? 'auto_scored' : 'pending',
          },
          $setOnInsert: {
            tenantId: tid(tenantId),
            submissionId: submission._id,
          },
        },
        { upsert: true }
      );

      await upsertDigitalRecord(tenantId, submission, experiment);
      return;
    } catch {
      /* retry */
    }
  }
}

async function upsertDigitalRecord(
  tenantId: string,
  submission: any,
  experiment: IExperiment
) {
  const filter = {
    tenantId: tid(tenantId),
    studentId: submission.studentId,
    practicalId: experiment.practicalId,
  };
  let record = await DigitalLabRecord.findOne(filter);
  if (!record) {
    record = await DigitalLabRecord.create({
      ...filter,
      labId: experiment.labId,
      entries: [],
      cumulativeScore: 0,
      maxPossibleScore: 0,
    });
  }
  const entries = record.entries || [];
  const idx = entries.findIndex((e) => String(e.experimentId) === String(experiment._id));
  const score = submission.totalScore ?? submission.autoScore ?? null;
  if (idx >= 0) {
    entries[idx].attempts = (entries[idx].attempts || 0) + 1;
    entries[idx].lastSubmittedAt = new Date();
    if (score != null && (entries[idx].bestScore == null || score > (entries[idx].bestScore || 0))) {
      entries[idx].bestScore = score;
    }
  } else {
    entries.push({
      experimentId: experiment._id,
      experimentTitle: experiment.title,
      bestScore: score,
      attempts: 1,
      lastSubmittedAt: new Date(),
    });
  }
  record.entries = entries;
  record.cumulativeScore = entries.reduce((s, e) => s + (e.bestScore || 0), 0);
  record.maxPossibleScore = entries.length * (experiment.maxScore || 0);
  await record.save();
}

export async function getMySubmissions(
  tenantId: string,
  experimentId: string,
  user: { id: string; roles: string[] }
) {
  const experiment = await Experiment.findOne(baseFilter(tenantId, { _id: tid(experimentId) }));
  if (!experiment) throw new AppError(404, 'Experiment not found', 'NOT_FOUND');
  const studentId = await resolveStudentId(tenantId, user.id);
  await assertEnrolled(tenantId, studentId, String(experiment.courseId));

  const items = await LabSubmission.find(
    baseFilter(tenantId, {
      experimentId: tid(experimentId),
      studentId: tid(studentId),
    })
  )
    .sort({ attemptNumber: -1 })
    .lean();

  return items.map((d) => mapSubmission(d, false, experiment));
}

export async function getSubmission(
  tenantId: string,
  id: string,
  user: { id: string; roles: string[] }
) {
  const doc = await LabSubmission.findOne(baseFilter(tenantId, { _id: tid(id) }));
  if (!doc) throw new AppError(404, 'Submission not found', 'NOT_FOUND');
  const isStaff = isFacultyOrAdmin(user.roles);
  if (!isStaff) {
    const studentId = await resolveStudentId(tenantId, user.id);
    if (String(doc.studentId) !== studentId) {
      throw new AppError(403, 'Forbidden', 'FORBIDDEN');
    }
  }
  const experiment = await Experiment.findOne(
    baseFilter(tenantId, { _id: doc.experimentId })
  ).lean();
  return mapSubmission(doc.toObject(), isStaff, experiment || undefined);
}

export async function listSubmissionsForExperiment(
  tenantId: string,
  experimentId: string,
  q: { page: number; limit: number; studentId?: string; status?: string }
) {
  const experiment = await Experiment.findOne(baseFilter(tenantId, { _id: tid(experimentId) }));
  if (!experiment) throw new AppError(404, 'Experiment not found', 'NOT_FOUND');

  const filter: Record<string, unknown> = baseFilter(tenantId, {
    experimentId: tid(experimentId),
  });
  if (q.studentId) filter.studentId = tid(q.studentId);
  if (q.status) filter.status = q.status;

  const skip = (q.page - 1) * q.limit;
  const [items, total] = await Promise.all([
    LabSubmission.find(filter)
      .sort({ submittedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(q.limit)
      .lean(),
    LabSubmission.countDocuments(filter),
  ]);

  const studentIds = [...new Set(items.map((i) => String(i.studentId)))];
  const students = await Student.find({
    _id: { $in: studentIds.map(tid) },
    tenantId: tid(tenantId),
  })
    .select('firstName lastName rollNumber')
    .lean();
  const nameMap = new Map(
    students.map((s) => [
      String(s._id),
      {
        name: [s.firstName, s.lastName].filter(Boolean).join(' ') || 'Student',
        code: (s as any).rollNumber,
      },
    ])
  );

  return {
    items: items.map((d) => {
      const s = nameMap.get(String(d.studentId));
      return mapSubmission(d, true, experiment, {
        studentName: s?.name,
        studentCode: s?.code,
        experimentTitle: experiment.title,
      });
    }),
    page: q.page,
    limit: q.limit,
    total,
    totalPages: Math.ceil(total / q.limit) || 1,
  };
}

export async function getExecutionJob(
  tenantId: string,
  jobId: string,
  user: { id: string; roles: string[] }
) {
  const job = await ExecutionJob.findOne({ _id: tid(jobId), tenantId: tid(tenantId) });
  if (!job) throw new AppError(404, 'Execution job not found', 'NOT_FOUND');
  const isStaff = isFacultyOrAdmin(user.roles);
  if (!isStaff) {
    const studentId = await resolveStudentId(tenantId, user.id);
    if (String(job.studentId) !== studentId) {
      throw new AppError(403, 'Forbidden', 'FORBIDDEN');
    }
  }

  // Try refreshing from adapter if still pending
  if (job.status === 'queued' || job.status === 'running') {
    try {
      const adapter = getExecutionAdapter();
      const result = await adapter.getStatus(String(job._id));
      if (result.status !== 'queued' && result.status !== 'running') {
        // Let settle path handle scoring; still return current
      }
    } catch {
      /* ignore */
    }
  }

  const mapped = mapJob(job.toObject());
  // Students: strip detailed hidden outputs already stored as full results —
  // only return public-facing fields if needed. Job endpoint is primarily for status.
  if (!isStaff) {
    // Keep stdout/stderr limited; hide full hidden test expected data (not stored on job input)
    return mapped;
  }
  return mapped;
}

export async function requeueSubmission(
  tenantId: string,
  submissionId: string,
  user: { id: string }
) {
  const submission = await LabSubmission.findOne(
    baseFilter(tenantId, { _id: tid(submissionId) })
  );
  if (!submission) throw new AppError(404, 'Submission not found', 'NOT_FOUND');
  if (!submission.code) throw new AppError(400, 'No code to requeue', 'NO_CODE');

  const experiment = await Experiment.findOne(
    baseFilter(tenantId, { _id: submission.experimentId })
  );
  if (!experiment) throw new AppError(404, 'Experiment not found', 'NOT_FOUND');

  const job = await ExecutionJob.create({
    tenantId: tid(tenantId),
    submissionId: submission._id,
    studentId: submission.studentId,
    experimentId: experiment._id,
    language: submission.language || 'python',
    code: submission.code,
    status: 'queued',
    queuedAt: new Date(),
    timeLimitSec: experiment.timeLimitSec,
    memoryLimitMb: experiment.memoryLimitMb,
  });

  submission.executionJobId = job._id;
  submission.status = 'running';
  submission.updatedBy = tid(user.id);
  await submission.save();

  const adapter = getExecutionAdapter();
  await adapter.enqueue({
    jobId: String(job._id),
    tenantId,
    submissionId: String(submission._id),
    language: (submission.language || 'python') as LabLanguage,
    code: submission.code,
    timeLimitSec: experiment.timeLimitSec,
    memoryLimitMb: experiment.memoryLimitMb,
    testCases: (experiment.testCases || []).map((tc) => ({
      id: tc.id,
      input: tc.input,
      expectedOutput: tc.expectedOutput,
      weight: tc.weight,
    })),
  });

  void settleJobWhenReady(tenantId, String(job._id), String(submission._id), experiment);
  return mapSubmission(submission.toObject(), true, experiment);
}

export async function evaluateSubmission(
  tenantId: string,
  submissionId: string,
  user: { id: string },
  data: Record<string, unknown>
) {
  const submission = await LabSubmission.findOne(
    baseFilter(tenantId, { _id: tid(submissionId) })
  );
  if (!submission) throw new AppError(404, 'Submission not found', 'NOT_FOUND');

  if (data.manualScore !== undefined && data.manualScore !== null) {
    submission.manualScore = Number(data.manualScore);
  }
  if (data.feedback !== undefined) submission.feedback = data.feedback as string | null;
  if (data.totalScore !== undefined && data.totalScore !== null) {
    submission.totalScore = Number(data.totalScore);
  } else if (submission.manualScore != null) {
    const auto = submission.autoScore ?? 0;
    // hybrid: prefer explicit total, else average-ish — use max of auto/manual if not set
    submission.totalScore =
      data.totalScore != null
        ? Number(data.totalScore)
        : submission.manualScore;
  }

  submission.evaluationStatus = 'completed';
  submission.status = 'evaluated';
  submission.updatedBy = tid(user.id);
  await submission.save();

  const evaluation = await LabEvaluation.findOneAndUpdate(
    { tenantId: tid(tenantId), submissionId: submission._id },
    {
      $set: {
        autoScore: submission.autoScore,
        manualScore: submission.manualScore,
        totalScore: submission.totalScore,
        vivaScore: data.vivaScore != null ? Number(data.vivaScore) : undefined,
        feedback: data.feedback ?? submission.feedback,
        rubricNotes: data.rubricNotes ?? undefined,
        status: 'completed',
        evaluatedBy: tid(user.id),
        evaluatedAt: new Date(),
        updatedBy: tid(user.id),
      },
      $setOnInsert: {
        tenantId: tid(tenantId),
        submissionId: submission._id,
        createdBy: tid(user.id),
      },
    },
    { upsert: true, new: true }
  );

  const experiment = await Experiment.findOne(
    baseFilter(tenantId, { _id: submission.experimentId })
  );
  if (experiment) await upsertDigitalRecord(tenantId, submission, experiment);

  return {
    submission: mapSubmission(submission.toObject(), true, experiment || undefined),
    evaluation: {
      id: String(evaluation!._id),
      tenantId,
      submissionId: String(submission._id),
      autoScore: evaluation!.autoScore ?? null,
      manualScore: evaluation!.manualScore ?? null,
      totalScore: evaluation!.totalScore ?? null,
      vivaScore: evaluation!.vivaScore ?? null,
      rubricNotes: evaluation!.rubricNotes ?? null,
      feedback: evaluation!.feedback ?? null,
      status: evaluation!.status,
      evaluatedBy: idStr(evaluation!.evaluatedBy),
      evaluatedAt: evaluation!.evaluatedAt ?? null,
      createdAt: evaluation!.createdAt,
      updatedAt: evaluation!.updatedAt,
    } as LabEvaluationPublic,
  };
}
